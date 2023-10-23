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
import { isEmpty, isNull } from 'utils/types';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
async function getBill(page: Page, date: Date, aid: string) {
	const startDate =
		date.getFullYear() +
		'-' +
		date.getMonth().toString().padStart(2, '0') +
		'-01';
	const endDate: string =
		date.getFullYear() +
		'-' +
		date.getMonth().toString().padStart(2, '0') +
		'-' +
		new Date(date.getFullYear(), date.getMonth(), 0).getDate();
	const query = `
  SELECT *
  FROM Bill
  LEFT JOIN Category ON Bill.categoryId = Category.id
  LEFT JOIN Account ON Bill.accountId = Account.id
  LEFT JOIN TagBillRelation ON Bill.id = TagBillRelation.billId
  LEFT JOIN Tag ON TagBillRelation.tagId = Tag.id
  WHERE Bill.time >= ${startDate} AND Bill.time <=${endDate}
  AND Bill.aid = ${aid}
  ORDER BY Bill.time DESC
  LIMIT ${page.size} OFFSET ${page.offset}
`;
	const { rows } = await db.executeAsync(query);
	if (isNull(rows) || isEmpty(rows)) return [];

	console.log('%c Line:35 🍩', 'color:#ed9ec7', rows);
}

async function statistics(year: number, month: number) {
	console.log(
		'%c Line:48 🍉',
		'color:#f5ce50',
		(
			await db.executeAsync(
				`SELECT * FROM Bill WHERE strftime('%Y', time) = ? AND strftime('%m', time) = ?`,
				[year.toString(), month.toString().padStart(2, '0')]
			)
		).rows
	);
	const query =
		"SELECT SUM(CASE WHEN type = '支出' THEN price ELSE 0 END) AS total_expense, SUM(CASE WHEN type = '收入' THEN price ELSE 0 END) AS total_income FROM Bill WHERE strftime('%Y', time) = ? AND strftime('%m', time) = ?";
	const { rows } = await db.executeAsync(query, [
		year.toString(),
		month.toString().padStart(2, '0')
	]);
	console.log('%c Line:50 🍔 rows', 'color:#ed9ec7', rows);
	if (isNull(rows) || isEmpty(rows)) return [];
	return rows;
}

export default function () {
	const [balance, setBalance] = React.useState<number>(0);
	const [expenditure, setExpenditure] = React.useState<number>(0);
	const [income, setIncome] = React.useState<number>(0);
	const [page, updatePage] = React.useState<Page>({
		offset: 0,
		size: 15
	});
	const navigation = useNavigation<BottomTabNavigationProp<any, ''>>();
	useEffect(() => {
		statistics(2023, 10).then(res => {});
	}, []);
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
