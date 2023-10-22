import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	Box,
	Button,
	ButtonIcon,
	ButtonText,
	Divider,
	HStack,
	Heading,
	Icon,
	Text,
	Toast,
	useToast
} from '@gluestack-ui/themed';
import IconView from 'components/Icon/IconView';
import SortList from 'components/SortList/Index';
import type { SortListItemProps } from 'components/SortList/Index';
import { showToast } from 'components/toast/Index';
import { useApp } from 'model/AppContext';
import React, { useCallback, useImperativeHandle } from 'react';
import { ActivityIndicator } from 'react-native';
import {
	QuickSQLiteConnection,
	SQLBatchTuple
} from 'react-native-quick-sqlite';
import Animated, {
	useAnimatedStyle,
	withTiming
} from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Category } from 'types/entity';
import getFontByFamily from 'utils/FontManager';
import { isEmpty } from 'utils/types';
type CategorySortRef = {
	open: () => void;
	close: () => void;
};
type CategorySortProps = {
	list: Category[];
	callback?: (list: Category[]) => void;
};
export type { CategorySortRef };

async function saveIndexed(
	list: Category[],
	index: Record<number, number>,
	db: QuickSQLiteConnection,
	toast: any
) {
	const sql: SQLBatchTuple[] = list
		.filter(item => index[item.id] !== item.indexed)
		.map(it => [
			'UPDATE Category SET indexed = ? WHERE id = ?;',
			[index[it.id], it.id]
		]);

	if (isEmpty(sql)) return;
	const { rowsAffected } = await db.executeBatchAsync(sql);
	if (rowsAffected !== sql.length) {
		showToast(toast, {
			title: `更新排序失败，失败数量${sql.length - (rowsAffected ?? 0)}`,
			variant: 'accent',
			action: 'error'
		});
	}
}

function Item({ item, trigger, isMoving }: SortListItemProps<Category>) {
	const styles = useAnimatedStyle(() => ({
		shadowOpacity: withTiming(isMoving ? 0.2 : 0),
		shadowRadius: 4,
		shadowOffset: {
			width: 0,
			height: 4
		},
		transform: [
			{
				scaleY: withTiming(isMoving ? 1.07 : 1)
			}
		],
		shadowColor: '#000',
		backgroundColor: '#fff'
	}));
	return (
		<Animated.View style={[{ height: 50, paddingHorizontal: 10 }, styles]}>
			<HStack
				h={50}
				rounded={'$xl'}
				alignItems="center"
				position="relative"
				justifyContent="space-between">
				<IconView {...item.icon} />
				<Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
				<SortList.Drag trigger={trigger}>
					<Icon
						as={getFontByFamily('MaterialCommunityIcons')}
						name="drag-horizontal-variant"
					/>
				</SortList.Drag>
			</HStack>
		</Animated.View>
	);
}

export default React.forwardRef<CategorySortRef, CategorySortProps>(function (
	{ list, callback },
	ref
) {
	const [showActionsheet, setShowActionsheet] =
		React.useState<boolean>(false);
	useImperativeHandle(ref, () => ({
		open: () => setShowActionsheet(true),
		close: () => setShowActionsheet(false)
	}));

	const [positions, setPositions] = React.useState<Record<number, number>>(
		{}
	);

	const app = useApp();
	const toast = useToast();
	const positionHook = useCallback((pos: Record<number, number>) => {
		setPositions(pos);
	}, []);
	return (
		<Actionsheet
			isOpen={showActionsheet}
			closeOnOverlayClick
			snapPoints={[90]}
			h={'90%'}
			onClose={() => setShowActionsheet(false)}>
			<ActionsheetBackdrop />
			<ActionsheetContent>
				<ActionsheetDragIndicatorWrapper>
					<ActionsheetDragIndicator></ActionsheetDragIndicator>
				</ActionsheetDragIndicatorWrapper>
				<Heading>分类排序</Heading>
				<Divider />
				<Box w="95%" alignSelf="center" pt={10}>
					<SortList
						data={list}
						itemHeight={50}
						space={20}
						renderItem={Item}
						callback={positionHook}
						keyExecutor={item => item.id}
					/>
				</Box>
				<Button
					alignSelf="center"
					w={'95%'}
					position="absolute"
					bottom={20}
					onPress={() => {
						//执行加载动画
						const id = toast.show({
							duration: null,
							render: ({ id }) => {
								return (
									<Toast
										nativeID={id}
										action="info"
										variant="solid"
										gap={10}
										p={10}>
										<ActivityIndicator
											size="small"
											color="#0000ff"
										/>
										<Text>正在加载</Text>
									</Toast>
								);
							}
						});
						saveIndexed(list, positions, app.db, toast).finally(
							() => {
								const data: Category[] = [];
								for (const key of list) {
									data[positions[key.id]] = key;
								}
								callback?.(data);
								setShowActionsheet(false);
								toast.close(id);
							}
						);
					}}
					gap={10}>
					<ButtonText>保存</ButtonText>
					<ButtonIcon>
						<Icon
							as={getFontByFamily('Feather')}
							name="save"
							color="white"
						/>
					</ButtonIcon>
				</Button>
			</ActionsheetContent>
		</Actionsheet>
	);
});
