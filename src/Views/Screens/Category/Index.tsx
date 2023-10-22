import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, Button } from '@rneui/themed';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { isEmpty, notNull } from 'utils/types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import CategoryAdd, { CategoryAddRef } from 'Views/Screens/Category/sub/add';
import { Category } from 'types/entity';
import { TabView, SceneMap } from 'react-native-tab-view';
import { HStack, Icon, VStack } from '@gluestack-ui/themed';
import IconView from 'components/Icon/IconView';
import { useApp } from 'model/AppContext';
import { MenuView } from '@react-native-menu/menu';
import getFontByFamily from 'utils/FontManager';
import CategorySort, { CategorySortRef } from 'Views/Screens/Category/sub/sort';
type types = ['支出', '收入'];

export async function getList(
	type: types extends Array<infer R> ? R : never,
	db: QuickSQLiteConnection,
	id: string[],
	set: React.Dispatch<Category[]>
) {
	const query = `SELECT *, Category.id as category_id,Icon.id as  icon_id,Icon.name as icon_name,Icon.type as icon_type,Category.name as category_name,Category.type as category_type,Category.indexed as  category_indexed FROM Category LEFT JOIN Icon ON Category.iconId = Icon.id  WHERE Category.type = '${type}' AND Category.id in (${id
		.map(() => '?')
		.join(',')}) ORDER BY Category.indexed;`;
	const { rows } = await db.executeAsync(query, id);
	const categories: Category[] = [];
	if (notNull(rows) && !isEmpty(rows)) {
		for (let i = 0; i < rows.length; ++i) {
			const category = rows?.item(i);
			categories.push({
				id: category.category_id,
				name: category.category_name,
				icon: {
					id: category.icon_id,
					name: category.icon_name,
					size: category.size,
					color: category.color,
					type: category.icon_type,
					family: category.family
				},
				level: category.level,
				type: category.category_type,
				pid: category.pid,
				indexed: category.category_indexed
			});
		}
	}

	set(categories);
}
function CategoryItem({
	item,
	editHook,
	sortHook
}: {
	item: Category;
	editHook: (category: Category) => void;
	sortHook: () => void;
}) {
	return (
		<HStack
			bg="$white"
			rounded={'$xl'}
			p={10}
			softShadow="1"
			alignItems="center"
			position="relative"
			w={'90%'}
			justifyContent="space-between">
			<IconView {...item.icon} />
			<Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
			<MenuView
				onPressAction={event => {
					switch (event.nativeEvent.event) {
						case '1':
							editHook(item);
							break;
						case '2':
							sortHook();
							break;
					}
				}}
				actions={[
					{
						id: '1',
						title: '编辑',
						image: 'square.and.pencil',
						imageColor: '#2089dc'
					},
					{
						id: '2',
						title: '排序',
						image: 'arrow.up.arrow.down.circle',
						imageColor: '#2089dc'
					}
				]}>
				<Button type="clear">
					<Icon as={getFontByFamily('Entypo')} name="menu" />
				</Button>
			</MenuView>
		</HStack>
	);
}

export default function () {
	const [index, changeIndex] = React.useState<number>(0);
	const categoryAddRef = useRef<CategoryAddRef>(null);
	const categorySortRef = useRef<CategorySortRef>(null);
	const navigation = useNavigation<NativeStackNavigationProp<any, ''>>();

	const [expense_classification, setExpense] = React.useState<Category[]>([]);
	const [revenue_classification, setRevenue] = React.useState<Category[]>([]);

	const [mode, setMode] = useState<'add' | 'edit'>('add');
	const [sort_type, setSortType] = useState<'支出' | '收入'>('支出');
	const [editCategory, setEdit] = useState<Category>();
	const app = useApp();
	const [routes] = React.useState([
		{ key: '支出', title: '支出' },
		{ key: '收入', title: '收入' }
	]);
	const useEdit = useCallback((category: Category) => {
		setMode('edit');
		setEdit(category);
		categoryAddRef.current?.open();
	}, []);
	const useExpenditureSort = useCallback(() => {
		setSortType('支出');
		categorySortRef.current?.open();
	}, []);
	const useRevenueSort = useCallback(() => {
		setSortType('收入');
		categorySortRef.current?.open();
	}, []);
	const renderScene = SceneMap({
		支出: React.useMemo(
			() => () =>
				isEmpty(expense_classification) ? (
					<Text>当前无数据</Text>
				) : (
					<VStack gap={10} alignItems="center" py={10}>
						{expense_classification.map(category => (
							<CategoryItem
								editHook={useEdit}
								key={category.id}
								item={category}
								sortHook={useExpenditureSort}
							/>
						))}
					</VStack>
				),
			[expense_classification]
		),
		收入: React.useMemo(
			() => () =>
				isEmpty(revenue_classification) ? (
					<Text>当前无数据</Text>
				) : (
					<VStack gap={10} alignItems="center" py={10}>
						{revenue_classification.map(category => (
							<CategoryItem
								editHook={useEdit}
								item={category}
								key={category.id}
								sortHook={useRevenueSort}
							/>
						))}
					</VStack>
				),
			[revenue_classification]
		)
	});

	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<Button
					type="clear"
					onPress={() => {
						setMode('add');
						setEdit(undefined);
						categoryAddRef.current?.open();
					}}>
					<MaterialIcons
						size={20}
						color={'#439ce0'}
						name="my-library-add"
					/>
				</Button>
			)
		});
		getList('支出', app.db, app.categoryIds, setExpense);
		getList('收入', app.db, app.categoryIds, setRevenue);
	}, []);
	return (
		<>
			<TabView
				navigationState={{ index, routes }}
				renderScene={renderScene}
				onIndexChange={changeIndex}
			/>
			<CategorySort
				ref={categorySortRef}
				callback={list => {
					if (sort_type === '支出') {
						setExpense(list);
					} else {
						setRevenue(list);
					}
				}}
				list={
					sort_type === '支出'
						? expense_classification
						: revenue_classification
				}
			/>
			<CategoryAdd
				mode={mode}
				ref={categoryAddRef}
				category={editCategory}
				callback={(category, mode) => {
					if (mode === 'edit') {
						if (category.type === '支出') {
							setExpense(expense_classification => {
								const index = expense_classification.findIndex(
									it => it.id === category.id
								);
								if (index < 0) {
									//切换了类型
									setRevenue(revenue_classification =>
										revenue_classification.filter(
											it => it.id !== category.id
										)
									);
									return [
										...expense_classification,
										category
									];
								} else {
									expense_classification[index] = category;
									return [...expense_classification];
								}
							});
						} else {
							setRevenue(revenue_classification => {
								const index = revenue_classification.findIndex(
									it => it.id === category.id
								);
								if (index < 0) {
									//切换了类型
									setExpense(expense_classification =>
										expense_classification.filter(
											it => it.id !== category.id
										)
									);
									return [
										...revenue_classification,
										category
									];
								} else {
									revenue_classification[index] = category;
									return [...revenue_classification];
								}
							});
						}
						return;
					}

					if (category.type === '支出') {
						setExpense(expense_classification => [
							...expense_classification,
							category
						]);
					} else {
						setRevenue(revenue_classification => [
							...revenue_classification,
							category
						]);
					}
				}}
			/>
		</>
	);
}
