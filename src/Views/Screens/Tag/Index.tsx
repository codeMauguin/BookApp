import { Heading, Text, VStack, useToast } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack/lib/typescript/src/types';
import { Button, Card } from '@rneui/themed';
import { useApp, useAppUpdate } from 'model/AppContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, LayoutChangeEvent } from 'react-native';
import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import Animated, {
	FadeIn,
	runOnJS,
	useAnimatedScrollHandler
} from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MenuView } from '@react-native-menu/menu';
import TagInset, { TagInsertRef } from 'Views/Screens/Tag/sub/insert';
import { Page } from 'types/Page';
import { Tag } from 'types/entity';
import { isEmpty, notNull } from 'utils/types';
import { showToast } from 'components/toast/Index';

/**
 * Deletes a tag from the database.
 *
 * @param {QuickSQLiteConnection} db - The database connection.
 * @param {Tag} tag - The tag to be deleted.
 * @param {React.Dispatch<React.SetStateAction<Tag[]>>} set - The state setter for the tag list.
 * @return {Promise<void>} A promise that resolves when the tag is successfully deleted.
 */
function deleteTag(
	db: QuickSQLiteConnection,
	tag: Tag,
	set: React.Dispatch<React.SetStateAction<Tag[]>>
): Promise<void> {
	return new Promise((resolve, reject) => {
		db.transaction(async tx => {
			try {
				const sql = `DELETE FROM Tag WHERE id = ?;`;
				const sqlRelation = `DELETE FROM LedgerRelationTag WHERE tagId = ?;`;
				const { rowsAffected } = await tx.executeAsync(sql, [tag.id]);
				if (1 !== rowsAffected) {
					tx.rollback();
					reject();
					return;
				}
				const { rowsAffected: result } = await tx.executeAsync(
					sqlRelation,
					[tag.id]
				);
				if (1 !== result) {
					tx.rollback();
					reject();
					return;
				}
				set((prev: Tag[]) => prev.filter(it => it.id !== tag.id));
				resolve();
			} catch (error) {
				tx.rollback();
				reject();
			} finally {
				tx.commit();
			}
		});
	});
}

/**
 * Retrieves a list of tags from the database based on the provided IDs and pagination parameters.
 *
 * @param {QuickSQLiteConnection} db - The database connection object.
 * @param {string[]} ids - An array of tag IDs to retrieve.
 * @param {Page} page - The pagination object containing information about the page size and number.
 * @param {React.Dispatch<Tag[]>} set - The state setter function to update the retrieved tags.
 * @param {React.Dispatch<Page>} updatePage - The state setter function to update the pagination object.
 */
async function getList(
	db: QuickSQLiteConnection,
	ids: number[],
	page: Page,
	set: React.Dispatch<React.SetStateAction<Tag[]>>,
	updatePage: React.Dispatch<React.SetStateAction<Page>>
) {
	if (page.done) return;
	const query = `SELECT * FROM Tag WHERE id IN (${ids
		.map(() => '?')
		.join(',')}) ORDER BY name LIMIT ${page.size} OFFSET ${page.offset};`;
	const { rows } = await db.executeAsync(query, ids);
	if (notNull(rows) && !isEmpty(rows)) {
		const tags: Tag[] = new Array(rows.length);
		for (let i = 0; i < rows.length; ++i) {
			tags[i] = {
				id: rows.item(i).id,
				name: rows.item(i).name
			};
		}
		set((prev: Tag[]) => prev.concat(tags));
		updatePage({
			size: page.size,
			offset: page.offset + rows.length
		});
	} else {
		updatePage({
			size: page.size,
			offset: page.offset,
			done: true
		});
	}
}
function TagItem({
	item,
	editHook,
	delHook
}: {
	item: Tag;
	editHook: (tag: Tag) => void;
	delHook: (tag: Tag) => void;
}) {
	return (
		<MenuView
			style={{
				width: '100%',
				alignSelf: 'center',
				alignItems: 'center'
			}}
			onPressAction={event => {
				switch (event.nativeEvent.event) {
					case '1':
						editHook(item);
						break;
					case '2':
						delHook(item);
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
					titleColor: '#ff190c',
					title: '删除',
					subtitle: '删除后无法复原',
					displayInline: true,

					image: 'trash',
					imageColor: '#ff190c'
				}
			]}>
			<Card
				containerStyle={{
					width: '100%',
					borderRadius: 6,
					alignItems: 'center'
				}}>
				<Text fontWeight="bold">#{item.name}</Text>
			</Card>
		</MenuView>
	);
}

export default function () {
	const navigation = useNavigation<NativeStackNavigationProp<any, ''>>();
	const app = useApp();

	const [tags, setTags] = useState<Tag[]>([]);
	const [page, setPage] = useState<Page>({
		size: 10,
		offset: 0
	});
	const [mode, setMode] = useState<'add' | 'edit'>('add');
	const ref = useRef<TagInsertRef>(null);
	const updateApp = useAppUpdate();
	const [editTag, setEditTag] = useState<Tag>();
	const editHook = useCallback((tag: Tag) => {
		setEditTag(tag);
		setMode('edit');
		ref.current?.open();
	}, []);
	useEffect(() => {
		navigation.setOptions({
			headerTitle: () => '',
			headerRight: () => (
				<Button
					type="clear"
					onPress={() => {
						setMode('add');
						ref.current?.open();
					}}>
					<MaterialIcons
						size={20}
						color={'#439ce0'}
						name="my-library-add"
					/>
				</Button>
			)
		});
		getList(app.db, app.tags, page, setTags, setPage);
	}, []);
	const [headerOffset, setHeaderOffset] = useState<number>(0);

	function headerLayout(event: LayoutChangeEvent) {
		const { height, y } = event.nativeEvent.layout;
		setHeaderOffset(height + y);
	}

	function skipHeader() {
		navigation.setOptions({
			headerTitle: () => (
				<Animated.View entering={FadeIn}>
					<Heading size="xl">标签管理</Heading>
				</Animated.View>
			)
		});
	}
	function hideHeader() {
		navigation.setOptions({
			headerTitle: () => ''
		});
	}
	const toast = useToast();
	const delHook = useCallback((tag: Tag) => {
		Alert.alert('提示', `确定删除「${tag.name}」标签吗？`, [
			{
				text: '取消',
				style: 'cancel'
			},
			{
				text: '删除',
				style: 'destructive',
				onPress: async () => {
					try {
						await deleteTag(app.db, tag, setTags);
						updateApp.tags(prev => prev.filter(t => t !== tag.id));
						showToast(toast, {
							title: '删除成功',
							variant: 'accent',
							action: 'success'
						});
						setPage(prev => ({
							size: 10,
							offset: prev.offset - 1
						}));
					} catch (error) {
						showToast(toast, {
							title: error ? JSON.stringify(error) : '删除失败',
							variant: 'accent',
							action: 'error'
						});
					}
				}
			}
		]);
	}, []);

	const hook = useCallback((tag: Tag, mode: 'add' | 'edit') => {
		switch (mode) {
			case 'add':
				setTags(tags => tags.concat(tag));
				setPage(prev => ({ size: 10, offset: prev.offset + 1 }));
				break;
			case 'edit':
				setTags(tags => tags.map(t => (t.id === tag.id ? tag : t)));
		}
	}, []);
	const LOAD_MORE_DISTANCE = 100; // 距离底部多少距离开始加载
	const handleScroll = useAnimatedScrollHandler(even => {
		const offset = even.contentOffset.y;
		const { layoutMeasurement, contentOffset, contentSize } = even;
		if (offset > headerOffset + 10) {
			runOnJS(skipHeader)();
		} else {
			runOnJS(hideHeader)();
		}
		const isEndReached =
			layoutMeasurement.height + contentOffset.y >=
			contentSize.height - LOAD_MORE_DISTANCE;
		if (isEndReached) {
			runOnJS(getList)(app.db, app.tags, page, setTags, setPage);
		}
	});
	return (
		<Animated.ScrollView
			onScroll={handleScroll}
			scrollEventThrottle={16}
			style={{ padding: 10 }}>
			<Heading onLayout={headerLayout} size="2xl">
				标签管理
			</Heading>
			<VStack alignItems="center" w={'$full'}>
				{tags.map(tag => (
					<TagItem
						key={tag.id}
						editHook={editHook}
						delHook={delHook}
						item={tag}
					/>
				))}
			</VStack>
			<TagInset tag={editTag} callback={hook} mode={mode} ref={ref} />
		</Animated.ScrollView>
	);
}
