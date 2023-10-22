import 'utils/FontManager';
import {
	config,
	GluestackUIProvider,
	KeyboardAvoidingView,
	Text
} from '@gluestack-ui/themed';

import * as React from 'react';

import {
	NavigationContainer,
	getFocusedRouteNameFromRoute
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import assert from 'assert';
import TarBar from './src/tarbar/index';

import type { TarBar as TarBarType } from './src/tarbar/type';
import Home from 'Views/Home/Index';
import Create from 'Views/Create/Index';
import { createApp, createData, db } from 'sql/sql';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { isEmpty, notNull } from 'utils/types';
import { AppContext, AppContextUpdate } from 'model/AppContext';
import { Tag } from 'types/entity';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
const Stack = createNativeStackNavigator();
//在这编写路由参数
const router: Array<TarBarType> = [
	{ component: Home, title: '首页' },
	{
		component: undefined,
		title: '记一笔',
		options: {
			navigate: 'MakeNote'
		}
	},
	{
		component: React.lazy(() => import('Views/Setting/Index')),
		title: '设置'
	}
];

const screens: {
	title: string;
	component: React.ComponentType<any>;
	options: any;
}[] = [
	{
		component: Create,
		title: 'MakeNote',
		options: { headerTitle: () => <Text></Text> }
	},
	{
		component: React.lazy(() => import('Views/Screens/Category/Index')),
		title: 'Category',
		options: {}
	},
	{
		component: React.lazy(() => import('Views/__test__/Index')),
		title: 'test',
		options: {}
	},
	{
		component: React.lazy(() => import('Views/Screens/Tag/Index')),
		title: 'Tag',
		options: {
			headerTitle: ''
		}
	}
];

function ButtonTap() {
	return TarBar(router);
}

//在这加载所有数据  书源
function App(): React.JSX.Element {
	//执行数据加载
	const [isInit, finishInit] = React.useState<boolean>(false);
	const [current, setCurrent] = React.useState<string>('');
	const [categoryIds, setCategoryIds] = React.useState<string[]>([]);
	const [accountIds, setAccountId] = React.useState<number[]>([]);
	const [tags, setTags] = React.useState<number[]>([]);
	React.useEffect(() => {
		(async () => {
			await createApp();
			await createData();
			const { rows } = await db.executeAsync(
				'SELECT current FROM Config  ',
				['setting']
			);
			const id = rows?.item(0).current;
			setCurrent(id);
			//查询账本的分类
			const { rows: category } = await db.executeAsync(
				'SELECT categoryId FROM LedgerRelationCategory WHERE ledgerId = ?',
				[id]
			);
			if (notNull(category) && !isEmpty(category)) {
				setCategoryIds(
					Array.from({ length: category.length }).map(
						(_, item) => category.item(item).categoryId
					)
				);
			}
			const { rows: accounts } = await db.executeAsync(
				'SELECT accountId FROM LedgerRelationAccount WHERE ledgerId = ?',
				[id]
			);
			if (notNull(accounts) && !isEmpty(accounts)) {
				setAccountId(
					Array.from({ length: accounts.length }).map(
						(_, item) => accounts.item(item).accountId
					)
				);
			}
			const { rows: tags } = await db.executeAsync(
				'SELECT tagId FROM LedgerRelationTag WHERE ledgerId = ?',
				[id]
			);
			if (notNull(tags) && !isEmpty(tags)) {
				setTags(
					Array.from({ length: tags.length }).map(
						(_, item) => tags.item(item).tagId
					)
				);
			}
			finishInit(true);
		})();
	}, []);
	return (
		<SafeAreaProvider>
			<SafeAreaView style={{ flex: 1 }}>
				<AppContextUpdate.Provider
					value={{
						current: setCurrent,
						categoryIds: setCategoryIds,
						accountIds: setAccountId,
						tags: setTags
					}}>
					<AppContext.Provider
						value={{
							current,
							isFinish: isInit,
							categoryIds,
							accountIds,
							db,
							tags
						}}>
						<GluestackUIProvider config={config.theme}>
							<NavigationContainer>
								<>
									<Stack.Navigator initialRouteName="主页">
										<Stack.Screen
											name="主页"
											key="home"
											component={ButtonTap}
											options={({ route }) => {
												const title =
													getFocusedRouteNameFromRoute(
														route
													);

												return {
													headerTitle:
														getFocusedRouteNameFromRoute(
															route
														)
												};
											}}
										/>
										{screens.map(item => {
											return (
												<Stack.Screen
													navigationKey={item.title}
													key={item.title}
													name={item.title}
													component={item.component}
													options={item.options}
												/>
											);
										})}
									</Stack.Navigator>
								</>
							</NavigationContainer>
						</GluestackUIProvider>
					</AppContext.Provider>
				</AppContextUpdate.Provider>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

export default App;
