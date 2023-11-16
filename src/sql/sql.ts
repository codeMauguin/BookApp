const path = __DEV__ ? '__DEV__.db' : '__RELEASE__.db';
import { SQLBatchTuple, open } from 'react-native-quick-sqlite';
import { Bill } from 'types/entity';
import { isEmpty, notNull, safeOperation } from 'utils/types';
/**
 * # 数据库结构

## OrderOperationRecord 表

| 列名                       | 数据类型       |
| -------------------------- | -------------- |
| id                        | INTEGER        |
| accountId                 | INTEGER        |
| date                      | TEXT           |
| balanceBeforeOrderPayment | REAL           |
| balanceAfterOrderPayment  | REAL           |
| isInit                    | INTEGER        |
| billId                    | TEXT           |
| billPeopleId              | TEXT           |

## Icon 表

| 列名    | 数据类型 |
| ------- | -------- |
| id      | INTEGER  |
| name    | TEXT     |
| type    | TEXT     |
| family  | TEXT     |
| color   | TEXT     |
| size    | INTEGER  |

## Category 表

| 列名       | 数据类型 |
| ---------- | -------- |
| id         | INTEGER  |
| iconId     | INTEGER  |
| name       | TEXT     |
| type       | TEXT     |
| level      | INTEGER  |
| pid        | TEXT     |
| indexed    | INTEGER  |

## BillPeople 表

| 列名       | 数据类型 |
| ---------- | -------- |
| id         | TEXT     |
| name       | TEXT     |
| accountId   | INTEGER  |
| title      | TEXT     |
| remark     | TEXT     |
| money      | REAL     |
| time       | TEXT     |
| status     | INTEGER  |
| orderId    | INTEGER  |

## Tag 表

| 列名    | 数据类型 |
| ------- | -------- |
| id      | INTEGER  |
| name    | TEXT     |

## Account 表

| 列名       | 数据类型 |
| ---------- | -------- |
| id         | INTEGER  |
| name       | TEXT     |
| money      | REAL     |
| card       | TEXT     |
| level      | INTEGER  |
| iconId     | INTEGER  |
| isDefault  | INTEGER  |
| remark     | TEXT     |
| orderId    | INTEGER  |

## Bill 表

| 列名       | 数据类型 |
| ---------- | -------- |
| id         | TEXT     |
| type       | TEXT     |
| categoryId  | INTEGER  |
| accountId   | INTEGER  |
| price      | REAL     |
| remark     | TEXT     |
| time       | TEXT     |
| modification | TEXT   |
| promotion   | REAL    |
| aid        | TEXT     |
| orderId    | INTEGER  |

## TagBillRelation 表

| 列名       | 数据类型 |
| ---------- | -------- |
| id         | INTEGER  |
| tagId      | INTEGER  |
| billId     | TEXT     |

## BillPeopleRelation 表

| 列名       | 数据类型 |
| ---------- | -------- |
| id         | INTEGER  |
| billPeopleId | TEXT   |
| billId     | TEXT     |

## Config 表

| 列名       | 数据类型 |
| ---------- | -------- |
| id         | INTEGER  |
| current    | INTEGER  |

## Ledger 表

| 列名       | 数据类型 |
| ---------- | -------- |
| id         | INTEGER  |
| name       | TEXT     |
| iconSize   | INTEGER  |

## LedgerRelationAccount 表

| 列名       | 数据类型 |
| ---------- | -------- |
| id         | INTEGER  |
| accountId  | INTEGER  |
| ledgerId   | INTEGER  |

## LedgerRelationCategory 表

| 列名       | 数据类型 |
| ---------- | -------- |
| id         | INTEGER  |
| categoryId | INTEGER  |
| ledgerId   | INTEGER  |

## LedgerRelationTag 表

| 列名       | 数据类型 |
| ---------- | -------- |
| id         | INTEGER  |
| tagId      | INTEGER  |
| ledgerId   | INTEGER  |

 */

// 打开数据库连接
const db = open({
	name: path,
	location: 'default'
});
export { db };
/**
 * Builds a SQL query with parameters based on a given template and data object.
 * @param sql - The SQL template string.
 * @param data - The data object containing the parameter values.
 * @param defaultValue - The default value to use if a parameter value is not found in the data object.
 * @returns An object with the updated SQL query and an array of parameter values.
 */
function buildSql(sql: string): { sql: string; params: string[] } {
	const params: any[] = [];
	const regex = /#{(\w+)}/g;
	const newSql = sql.replace(regex, function (_, key) {
		params.push(key);
		return '?';
	});
	return {
		sql: newSql,
		params
	};
}

/**
 * Creates data in the database.
 *
 * @return {Promise<void>} Returns a promise that resolves when the data is created.
 */
async function createData(): Promise<void> {
	const { rows } = await db.executeAsync('SELECT id FROM Config');
	if (notNull(rows) && !isEmpty(rows)) {
		return;
	}
	const inits: SQLBatchTuple[] = [
		['INSERT INTO Config (id, current) VALUES (?, ?)', [1, 1]],
		[
			'INSERT INTO Ledger(id,name,iconSize) VALUES (?, ?,?)',
			[1, '日常数据库', 22]
		]
	];
	await db.executeBatchAsync(inits);
	console.log('%c Line:47 🍔', 'color:#4fff4B', '数据加载完成');
	//加载完成
}

async function createApp() {
	const table: SQLBatchTuple[] = [
		[
			`CREATE TABLE IF NOT EXISTS OrderOperationRecord (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            accountId INTEGER,
            date TEXT,
            balanceBeforeOrderPayment REAL,
            balanceAfterOrderPayment REAL,
            isInit INTEGER,
            billId TEXT,
            billPeopleId TEXT
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS Icon (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT,
            family TEXT,
            color TEXT
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS Category (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            iconId INTEGER,
            name TEXT,
            type TEXT,
            level INTEGER,
            pid TEXT,
			indexed INTEGER
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS BillPeople (
            id TEXT PRIMARY KEY,
            name TEXT,
            accountId INTEGER,
			title TEXT,
            remark TEXT,
            money REAL,
            time TEXT,
            status INTEGER,
            orderId INTEGER
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS Tag (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS Account (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            money REAL,
            card TEXT,
            level INTEGER,
            iconId INTEGER,
            isDefault INTEGER,
            remark TEXT,
            orderId INTEGER
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS Bill (
            id TEXT PRIMARY KEY,
            type TEXT,
            categoryId INTEGER,
            accountId INTEGER,
            price REAL,
            remark TEXT,
            time TEXT,
            modification TEXT,
            promotion REAL,
            aid TEXT,
            orderId INTEGER
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS TagBillRelation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tagId INTEGER,
            billId TEXT
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS BillPeopleRelation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            billPeopleId TEXT,
            billId TEXT
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS Config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            current INTEGER
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS Ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
			iconSize INTEGER
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS LedgerRelationAccount (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            accountId INTEGER,
            ledgerId INTEGER
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS LedgerRelationCategory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoryId INTEGER,
            ledgerId INTEGER
        )`
		],
		[
			`CREATE TABLE IF NOT EXISTS LedgerRelationTag (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			tagId INTEGER,
			ledgerId INTEGER
			)`
		]
	];
	return db.executeBatchAsync(table);
}

function mapTo(bill: Bill, keys: string[]) {
	return keys.map(key => {
		switch (key) {
			case 'categoryId':
				return bill.category.id;
			case 'accountId':
				return bill.account.id;
			case 'orderId':
				return bill.payload.id;
			default:
				return Reflect.get(bill, key);
		}
	});
}
function calculateBillMoney(bill: Bill) {
	return bill.type === '支出'
		? safeOperation(
				bill.price,
				bill.promotion ?? 0,
				safeOperation.arguments
		  )
		: bill.price;
}
export { createApp };

const OperationMode = {
	支出: safeOperation.subtrahend,
	收入: safeOperation.add,
	平摊: safeOperation.add
};

/**
 * Calculates the total money and order time for each account based on the given bills.
 *
 * @param {Bill[]} bills - An array of bill objects representing the bills.
 * @return {{ moneyMap: Map<string, number>; orderMap: Map<string, Date> }} - An object containing two maps:
 *     - `moneyMap`: A map that stores the total money for each account.
 *     - `orderMap`: A map that stores the latest order time for each account.
 */
function calculateOrders(bills: Bill[]): {
	moneyMap: Map<number, number>;
	orderMap: Map<number, Date>;
} {
	const moneyMap: Map<number, number> = new Map();
	const orderMap: Map<number, Date> = new Map();

	for (const bill of bills) {
		const accountId = bill.account.id;
		const money = moneyMap.get(accountId) || 0;
		const billMoney = calculateBillMoney(bill);
		const operationMode = OperationMode[bill.type];
		moneyMap.set(accountId, safeOperation(money, billMoney, operationMode));

		const order = orderMap.get(accountId) || bill.time;
		orderMap.set(
			accountId,
			order.getTime() <= bill.time.getTime() ? order : bill.time
		);

		for (const person of bill.people) {
			if (!person.status) continue;
			const accountId = person.account.id;
			const money = moneyMap.get(accountId) || 0;
			const personMoney = person.money;
			moneyMap.set(
				accountId,
				safeOperation(money, personMoney, OperationMode['平摊'])
			);

			const order = orderMap.get(accountId) || person.time;
			orderMap.set(
				accountId,
				order.getTime() <= person.time.getTime() ? order : person.time
			);
		}
	}

	return { moneyMap, orderMap };
}

async function insertBill(bills: Bill[]) {
	const { sql: billSQL, params: billParams } = buildSql(
		'INSERT INTO Bill ( type, categoryId, accountId, price, remark, time, modification, promotion, aid, orderId ) VALUES ( #{type}, #{categoryId}, #{accountId}, #{price}, #{remark}, #{time}, #{modification}, #{promotion}, #{aid},#{orderId} )'
	);
	const { sql: tagSQL, params: tagsParams } = buildSql(
		'INSERT INTO TagBillRelation ( tagId, billId ) VALUES ( #{tagId}, #{billId} )'
	);
	const { sql: BillRelationPeopleSQL, params: BillRelationPeopleParams } =
		buildSql(
			'INSERT INTO BillPeopleRelation ( billPeopleId, billId ) VALUES ( #{billPeopleId}, #{billId} )'
		);
	const { sql: OrderSQL, params: OrderParams } = buildSql(
		'INSERT INTO OrderOperationRecord (id,balanceBeforeOrderPayment,balanceAfterOrderPayment,isInit,billId,billPeopleId) VALUES (#{id},#{balanceBeforeOrderPayment},#{balanceAfterOrderPayment},#{isInit},#{billId},#{billPeopleId})'
	);
	const orderList: SQLBatchTuple[] = bills
		.map(({ id, people, price, type, promotion, payload }) => {
			return [
				[
					OrderSQL,
					[
						payload.id,
						0,
						type === '支出'
							? safeOperation(
									promotion ?? 0,
									price,
									safeOperation.subtrahend
							  )
							: price,
						false,
						id,
						null
					]
				]
			].concat(
				people
					.filter(({ status }) => status)
					.map(({ id, money, payload }) => [
						OrderSQL,
						[payload.id, 0, money, false, null, id]
					])
			);
		})
		.flat(2) as SQLBatchTuple[];

	const billsToInsert: SQLBatchTuple[] = bills.map(
		(bill): [string, any[]] => {
			return [billSQL, mapTo(bill, billParams)];
		}
	) as SQLBatchTuple[];

	const tagsToInsert: SQLBatchTuple[] = bills
		.map(({ id, tags }) => tags.map(tag => [tagSQL, [tag.id, id]]))
		.flat(1) as SQLBatchTuple[];

	const BillRelationPeopleToInsert: SQLBatchTuple[] = bills
		.map(({ id, people }) =>
			people.map(person => [BillRelationPeopleSQL, [person.id, id]])
		)
		.flat(1) as SQLBatchTuple[];
	db.executeBatchAsync(
		[
			BillRelationPeopleToInsert,
			billsToInsert,
			tagsToInsert,
			orderList
		].flat(1)
	);
	const { moneyMap, orderMap } = calculateOrders(bills);
	const orderQueue: SQLBatchTuple[] = [];
	for (const [id, date] of orderMap) {
		const { rows } = await db.executeAsync(
			`SELECT balanceAfterOrderPayment  FROM OrderOperationRecord 
    WHERE accountId = ? AND date < ? 
    ORDER BY date DESC LIMIT 1`,
			[id, date]
		);
		if (notNull(rows) && !isEmpty(rows)) {
			let prev = rows.item(0);
			const { rows: next } = await db.executeAsync(
				'SELECT id,balanceBeforeOrderPayment,balanceAfterOrderPayment FROM OrderOperationRecord WHERE accountId = ? AND date >= ? ORDER BY date',
				[id, date]
			);

			if (notNull(next) && !isEmpty(next)) {
				for (let i = 0; i < rows.length; ++i) {
					const current = next.item(i);
					const balanceBeforeOrderPayment =
						prev.balanceAfterOrderPayment;
					//    9    a   b     a+x->9      b+x   x->9-a +b
					const balanceAfterOrderPayment =
						prev.balanceAfterOrderPayment -
						current.balanceBeforeOrderPayment +
						current.balanceAfterOrderPayment;
					current.balanceBeforeOrderPayment =
						balanceBeforeOrderPayment;
					current.balanceAfterOrderPayment = balanceAfterOrderPayment;
					prev = current;
					orderQueue.push([
						'UPDATE OrderOperationRecord SET balanceBeforeOrderPayment = ?, balanceAfterOrderPayment = ? WHERE id = ?',
						[
							balanceBeforeOrderPayment,
							balanceAfterOrderPayment,
							current.id
						]
					]);
				}
			}
		}
	}

	for (const [id, money] of moneyMap) {
		const { rows } = await db.executeAsync(
			'SELECT money FROM Account WHERE id = ?',
			[id]
		);
		if (notNull(rows) && !isEmpty(rows)) {
			const account = rows.item(0);
			orderQueue.push([
				'UPDATE Account SET money = ? WHERE id = ?',
				[safeOperation(account.money, money, safeOperation.add), id]
			]);
		}
	}
	const { rowsAffected } = await db.executeBatchAsync(orderQueue);

	console.log(
		'%c Line:334 🥝',
		'color:#2eafb0',
		`应该更新:${orderQueue.length},实际影响:${rowsAffected}`
	);
}

export { createData };
