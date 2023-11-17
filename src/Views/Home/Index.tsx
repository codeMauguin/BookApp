import React, { useEffect } from 'react';
import {
	Box,
	HStack,
	ScrollView,
	VStack,
	View,
	Text
} from '@gluestack-ui/themed';
import { Page } from 'types/Page';
import { db } from 'sql/sql';
import { formatTime, isEmpty, isNull } from 'utils/types';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useApp } from 'model/AppContext';
import { Bill } from 'types/entity';
import { toUTCTime } from 'utils/DateUtil';

async function getBill(page: Page, date: Date, aid: string) {
	const curDate = `${date.getFullYear()}-${date.getMonth()}`;
	const query = `
  SELECT
    Bill.id AS billId,
    Bill.type AS billType,
    Bill.price AS billPrice,
    Bill.remark AS billRemark,
    Bill.time AS billTime,
    Bill.modification AS billModification,
    Bill.promotion AS billPromotion,
    Category.id AS categoryId,
    Category.name AS categoryName,
	Category.type AS categoryType,
	Category.level AS categoryLevel,
	Category.indexed AS categoryIndexed,
    Icon.id AS iconId,
    Icon.name AS iconName,
    Icon.color AS iconColor,
	Icon.type as iconType,
    Account.id AS accountId,
    Account.name AS accountName,
    Account.money AS accountMoney,
    Account.card AS accountCard,
    Account.level AS accountLevel,
    Account.isDefault AS accountIsDefault,
    Account.remark AS accountRemark
FROM Bill
LEFT JOIN Category ON Bill.categoryId = Category.id
LEFT JOIN Icon ON Category.iconId = Icon.id
LEFT JOIN Account ON Bill.accountId = Account.id
WHERE  strftime('%Y-%m', time) = ? OR Bill.aid = ?
ORDER BY Bill.time DESC
LIMIT ? OFFSET ?;
`;

	const { rows } = await db.executeAsync(query, [
		curDate,
		aid,
		page.size,
		page.offset
	]);

	if (isNull(rows) || isEmpty(rows)) return [];
	const billList: Bill[] = [];
	const map = new WeakMap();
	for (let i = 0; i < rows.length; ++i) {
		const bill = rows.item(i);
		const billData: Bill = {
			id: bill.billId,
			type: bill.billType,
			price: bill.billPrice,
			remark: bill.billRemark,
			time: toUTCTime(bill.billTime),
			modification: bill.billModification,
			promotion: bill.billPromotion,
			tags: [],
			category: {
				id: bill.categoryId,
				name: bill.categoryName,
				icon: {
					id: bill.iconId,
					name: bill.iconName,
					color: bill.iconColor,
					type: bill.iconType
				},
				type: bill.categoryType,
				level: bill.categoryLevel,
				indexed: bill.categoryIndexed
			},
			account: {
				id: bill.accountId,
				name: bill.accountName,
				money: bill.accountMoney,
				card: bill.accountCard,
				level: bill.accountLevel,
				isDefault: bill.accountIsDefault,
				remark: bill.accountRemark,
				icon: null!,
				payload: null!
			},
			people: [],
			aid,
			payload: null!
		};
		const key = Symbol.for(
			`${billData.time.getFullYear()}-${billData.time.getMonth()}`
		);
		if (!map.has(key)) {
			map.set(key, [billData]);
		}
	}
}

async function statistics(year: number, month: number) {
	const query =
		"SELECT SUM(CASE WHEN type = '支出' THEN price ELSE 0 END) AS total_expense, SUM(CASE WHEN type = '收入' THEN price ELSE 0 END) AS total_income FROM Bill WHERE strftime('%Y-%m', time) = ?";
	const { rows } = await db.executeAsync(query, [
		`${year}-${formatTime(month)}`
	]);
	if (isNull(rows) || isEmpty(rows)) return [0, 0];
	return [rows.item(0).total_expense, rows.item(0).total_income];
}

export default function () {
	const [balance, setBalance] = React.useState<number>(0);
	const [expenditure, setExpenditure] = React.useState<number>(0);
	const [income, setIncome] = React.useState<number>(0);
	const [date, setDate] = React.useState<Date>(new Date());
	const [page, updatePage] = React.useState<Page>({
		offset: 0,
		size: 15
	});
	const app = useApp();
	useEffect(() => {
		getBill(page, date, app.current);
		statistics(date.getFullYear(), date.getMonth() + 1).then(
			([expenditure, income]) => {
				setExpenditure(expenditure);
				setIncome(income);
			}
		);
		//获取统计数据
	}, []);
	const navigation = useNavigation<BottomTabNavigationProp<any, ''>>();
	return (
		<ScrollView stickyHeaderIndices={[0]}>
			{/* 统计 */}
			<Animated.View
				entering={FadeInUp.delay(100).damping(10).springify()}>
				<Box
					softShadow="4"
					bg="#439ce0"
					p={12}
					rounded="$lg"
					w="95%"
					alignSelf="center"
					mt={10}>
					{/* 本月结余 */}
					<HStack justifyContent="space-between">
						<VStack>
							<Text color="$white">本月结余</Text>
							<Text color="$white">
								{balance.toLocaleString('zh-CN', {
									style: 'currency',
									currency: 'CNY'
								})}
							</Text>
						</VStack>
						{/* 时间切换器 */}
						<Text color="$white">09/01-09/20</Text>
					</HStack>
					<HStack justifyContent="space-around">
						<VStack alignItems="center">
							<Text style={{ color: 'white', fontSize: 12 }}>
								本月支出
							</Text>
							<Text color="$white">
								{expenditure.toLocaleString('zh-CN', {
									style: 'currency',
									currency: 'CNY'
								})}
							</Text>
						</VStack>
						<VStack alignItems="center">
							<Text style={{ color: 'white', fontSize: 12 }}>
								本月收入
							</Text>
							<Text color="$white">
								{income.toLocaleString('zh-CN', {
									style: 'currency',
									currency: 'CNY'
								})}
							</Text>
						</VStack>
					</HStack>
				</Box>
			</Animated.View>
		</ScrollView>
	);
}
