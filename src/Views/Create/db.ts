/**
 * 插入账单信息
 */

import { AppContextProps } from 'model/AppContext';
import { Transaction } from 'react-native-quick-sqlite';
import { Bill, BillPeople } from 'types/entity';
import { toSQLString } from 'utils/DateUtil';
import { strictNotNull, strictLength, strictEqual } from 'utils/assert';
import { notNull, safeOperation } from 'utils/types';

function calculate_bill_amount(bill: Bill): number {
	return bill.type === '支出'
		? safeOperation(
				bill.price,
				bill.promotion ?? 0,
				safeOperation.subtrahend
		  )
		: bill.price;
}

async function eliminate_the_impact_of_bill_insertion(
	tx: Transaction,
	accountId: number,
	money: number,
	time: Date
) {
	const sql = `UPDATE OrderOperationRecord SET balanceAfterOrderPayment = balanceAfterOrderPayment + ?,balanceBeforeOrderPayment = balanceBeforeOrderPayment + ? WHERE accountId = ? AND date > ?`;
	return tx.executeAsync(sql, [
		money,
		money,
		accountId,
		time
	]); /* 无法判断是否更新完成因为在这个时间之后可能没有记录 */
}

async function insertPeople(
	people: BillPeople,
	app: AppContextProps,
	status?: boolean,
	tx?: Transaction
) {
	return new Promise(async (resolve, reject) => {
		try {
			// 定义通用的参数值
			const commonValues = [
				people.account.id,
				people.name,
				people.title,
				people.remark,
				people.money,
				people.time,
				people.status,
				null // orderId 初始化为 null
			];

			// 根据事务状态选择要执行的操作
			if (status) {
				await app.db.transaction(async tx => {
					// 插入 BillPeople 记录
					const sql = `INSERT INTO BillPeople (accountId, name, title, remark, money, time, status, orderId) VALUES (?, ?, ?, ?, ?, ?, ?, ?);SELECT LAST_INSERT_ID()`;
					const { rowsAffected, insertId } = await executeAndInsert(
						tx,
						sql,
						commonValues
					);

					// 插入 OrderOperationRecord 记录
					const orderId = insertId;
					await insertOrderOperationRecord(tx, people, orderId);

					resolve(orderId);
				});
			} else {
				// 确保事务对象 tx 存在
				strictNotNull(tx, '没有事务');

				// 插入 BillPeople 记录
				const sql = `INSERT INTO BillPeople (accountId, name, title, remark, money, time, status, orderId) VALUES (?, ?, ?, ?, ?, ?, ?, ?);SELECT LAST_INSERT_ID()`;
				const { rowsAffected, insertId } = await executeAndInsert(
					tx,
					sql,
					commonValues
				);

				// 插入 OrderOperationRecord 记录
				const orderId = insertId;
				await insertOrderOperationRecord(tx, people, orderId);

				resolve(orderId);
			}
		} catch (error) {
			reject(error);
		}
	});
}

// 辅助函数：执行 SQL 语句并插入记录
async function executeAndInsert(tx: Transaction, sql: string, values: any[]) {
	const { rowsAffected, insertId } = await tx.executeAsync(sql, values);
	strictEqual(rowsAffected, 1, '操作失败');
	strictNotNull(insertId, '操作失败');
	return {
		rowsAffected,
		insertId
	};
}

// 辅助函数：插入 OrderOperationRecord 记录
async function insertOrderOperationRecord(
	tx: Transaction,
	people: BillPeople,
	orderId: number
) {
	if (people.status) {
		const { rows } = await tx.executeAsync(
			'SELECT balanceAfterOrderPayment FROM OrderOperationRecord WHERE accountId = ? AND date < ? ORDER BY id DESC LIMIT 1',
			[people.account.id, people.time]
		);
		strictLength(rows, 1, '账单记录失败');
		const { balanceAfterOrderPayment } = rows.item(0);

		const { rowsAffected, insertId } = await tx.executeAsync(
			'INSERT INTO OrderOperationRecord (accountId, date, balanceBeforeOrderPayment, balanceAfterOrderPayment, isInit) VALUES (?, ?, ?, ?, 0);SELECT LAST_INSERT_ID()',
			[
				people.account.id,
				people.time,
				balanceAfterOrderPayment,
				safeOperation(
					balanceAfterOrderPayment,
					people.money,
					safeOperation.add
				)
			]
		);
		strictEqual(rowsAffected, 1, '订单生成失败');
		strictNotNull(insertId, '订单生成失败');

		const { rowsAffected: orderLinkRowsAffected } = await tx.executeAsync(
			'UPDATE OrderOperationRecord SET billPeopleId = ? WHERE id = ?',
			[insertId, orderId]
		);
		strictEqual(orderLinkRowsAffected, 1, '订单关联失败');
	}
}

function insertBill(bill: Bill, app: AppContextProps) {
	//根据账单类型进行账户的扣费还是收入
	app.db.transaction(async tx => {
		let error = false;

		try {
			switch (bill.type) {
				case '支出':
					{
						const sql =
							'UPDATE Account SET money = money - ? WHERE id = ?';
						const { rowsAffected } = await tx.executeAsync(sql, [
							calculate_bill_amount(bill),
							bill.account.id
						]);
						strictEqual(rowsAffected, 1, '账户余额扣减修改失败');
					}
					break;
				case '收入':
					{
						const sql =
							'UPDATE Account SET money = money + ? WHERE id = ?';
						const { rowsAffected } = await tx.executeAsync(sql, [
							bill.price,
							bill.account.id
						]);
						strictEqual(rowsAffected, 1, '账户余额增加失败');
					}
					break;
				default:
					new Error('账单类型错误');
			}

			console.log('%c Line:189 🥑', 'color:#93c0a4', '账户操作成功');
			const orderSQL = `INSERT INTO OrderOperationRecord (accountId, date, balanceBeforeOrderPayment, balanceAfterOrderPayment, isInit)
VALUES (?, ?, ?, ?, 0);SELECT LAST_INSERT_ID()`;
			const { rows } = await tx.executeAsync(
				`SELECT balanceAfterOrderPayment FROM OrderOperationRecord WHERE accountId = ? ORDER BY id DESC LIMIT 1`,
				[bill.account.id, bill.time]
			);

			strictLength(rows, 1, '账单记录失败');
			const { balanceAfterOrderPayment } = rows.item(0)!;
			const { insertId: billOrderId } = await tx.executeAsync(orderSQL, [
				bill.account.id,
				bill.time,
				balanceAfterOrderPayment,
				safeOperation(
					balanceAfterOrderPayment,
					calculate_bill_amount(bill),
					bill.type === '支出'
						? safeOperation.subtrahend
						: safeOperation.add
				)
			]);
			strictNotNull(billOrderId, '订单生成失败');

			const sql = `INSERT INTO Bill (type, categoryId, accountId, price, remark, time, aid,orderId) VALUES (?, ?, ?, ?, ?, ?, ?, ?);SELECT LAST_INSERT_ID();`;

			const { rowsAffected, insertId: billId } = await tx.executeAsync(
				sql,
				[
					bill.type,
					bill.category.id,
					bill.account.id,
					bill.price,
					bill.remark,
					toSQLString(bill.time),
					app.current,
					billOrderId
				]
			);
			strictEqual(rowsAffected, 1, '账单插入失败');
			strictNotNull(billId, '账单插入失败');

			console.log('%c Line:232 🍺', 'color:#2eafb0', '账单数据生成成功');
			const { rowsAffected: orderInsertRowsAffected } =
				await tx.executeAsync(
					'UPDATE OrderOperationRecord SET billId = ? WHERE id = ?',
					[billId, billOrderId]
				);
			strictEqual(rowsAffected, 1, '订单更新失败');
			//账单的数据已经插入完毕
			//更新插入后对数据库的影响
			await eliminate_the_impact_of_bill_insertion(
				tx,
				bill.account.id,
				Math.abs(calculate_bill_amount(bill)) *
					(bill.type === '支出' ? -1 : 1),
				bill.time
			);

			console.log('%c Line:236 🌰', 'color:#33a5ff', '订单后续修补完毕');
			//对账户的平摊记录
			if (bill.type === '支出') {
				for (const item of bill.people) {
					try {
						const id = await insertPeople(item, app, true, tx);
						const sql =
							'INSERT INTO BillPeopleRelation (billId, peopleId) VALUES (?, ?);';
						const { rowsAffected } = await tx.executeAsync(sql, [
							billId,
							id
						]);
						strictEqual(rowsAffected, 1, '账单人员关系插入失败');
					} catch (error) {}
				}
			}

			console.log('%c Line:254 🍪', 'color:#33a5ff', '账单分摊关联完毕');
			if (notNull(bill.tags) && !isEmpty(bill.tags)) {
				for (const item of bill.tags) {
					try {
						const sql =
							'INSERT INTO TagBillRelation (tagId, billId) VALUES (?, ?);';
						const { rowsAffected } = await tx.executeAsync(sql, [
							item.id,
							billId
						]);
						strictEqual(rowsAffected, 1, '标签账单关系插入失败');
					} catch (error) {}
				}
			}

			console.log('%c Line:264 🍯', 'color:#fca650', '账单标签关联结束');
			//对账户的标签记录
		} catch (error) {
			console.log('%c Line:267 🍭 error', 'color:#ed9ec7', error);
			tx.rollback();
			error = true;
		} finally {
			if (!error) tx.commit();
		}
	});
}

function modifyBill() {}

export { insertBill, modifyBill };
