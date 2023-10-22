import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
	Heading,
	Input,
	FormControlLabel,
	FormControlLabelText,
	FormControl,
	Icon,
	ButtonText,
	ButtonIcon,
	HStack,
	useToast
} from '@gluestack-ui/themed';
import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { BaseRef, Tag } from 'types/entity';
import { Button, Input as InputField, InputProps } from '@rneui/themed';
import getFontByFamily from 'utils/FontManager';
import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { isEmpty, isNull } from 'utils/types';
import { useApp, useAppUpdate } from 'model/AppContext';
import { showToast } from 'components/toast/Index';
interface TagInsertRef extends BaseRef {}
type TagInsertProps = {
	mode?: 'add' | 'edit';
	tag?: Tag;
	callback?: (tag: Tag, mode: 'add' | 'edit') => void;
};

export type { TagInsertProps, TagInsertRef };

/**
 * Inserts a new entry into the database with the provided tag and current value.
 *
 * @param {QuickSQLiteConnection} db - The database connection.
 * @param {string} tag - The tag to be inserted.
 * @param {string} current - The current value.
 * @return {Promise<number>} A promise that resolves when the entry is successfully inserted.
 */
async function insert(
	db: QuickSQLiteConnection,
	tag: string,
	current: string
): Promise<number | string> {
	return new Promise((resolve, reject) => {
		db.transaction(async tx => {
			try {
				const select = `SELECT count(*) as count FROM Tag WHERE name = ?;`;
				const { rows: count } = await tx.executeAsync(select, [tag]);
				if (0 !== count?.item(0).count) {
					tx.rollback();
					reject('标签已经存在');
					return;
				}
				const sql = `INSERT OR IGNORE INTO Tag (name) VALUES (?);SELECT LAST_INSERT_ID();`;
				const { insertId, rowsAffected } = await tx.executeAsync(sql, [
					tag
				]);
				if (1 !== rowsAffected) {
					tx.rollback();
					reject('插入失败');
					return;
				}
				const sqlRelation = `INSERT INTO LedgerRelationTag (tagId, ledgerId) VALUES (?, ?);`;
				const { rowsAffected: result } = await tx.executeAsync(
					sqlRelation,
					[insertId, current]
				);
				if (1 !== result) {
					tx.rollback();
					reject();
					return;
				}
				tx.commit();
				resolve(insertId as number);
			} catch (error) {
				tx.rollback();
				reject();
			}
		});
	});
}

/**
 * Updates a record in the database with the specified tag and ID.
 *
 * @param {QuickSQLiteConnection} db - The database connection.
 * @param {string} tag - The new tag value.
 * @param {number} id - The ID of the record to update.
 * @return {Promise<void>} A Promise that resolves when the record is updated successfully, or rejects
 * if there is an error.
 */
async function update(
	db: QuickSQLiteConnection,
	tag: string,
	id: number
): Promise<void> {
	return new Promise((resolve, reject) => {
		db.transaction(async tx => {
			try {
				const select = `SELECT count(*) as count FROM Tag WHERE name = ?;`;
				const { rows: count } = await tx.executeAsync(select, [tag]);
				if (0 !== count?.item(0).count) {
					tx.rollback();
					reject('标签已经存在');
					return;
				}
				const sql = `UPDATE Tag SET name = ? WHERE id = ?;`;
				const { rowsAffected } = await tx.executeAsync(sql, [tag, id]);
				if (1 !== rowsAffected) {
					tx.rollback();
					reject();
					return;
				}
				tx.commit();
				resolve();
			} catch (error) {
				tx.rollback();
				reject();
			}
		});
	});
}
export default React.forwardRef<TagInsertRef, TagInsertProps>((props, ref) => {
	const [showActionsheet, setShowActionsheet] =
		React.useState<boolean>(false);

	const inputRef = useRef<InputProps>(null);
	const [tag, updateTag] = React.useState<string>('');
	useEffect(() => {
		updateTag(props.mode !== 'edit' ? '' : props.tag!.name!);
	}, [props.mode, showActionsheet]);
	const [errorMessage, setError] = React.useState<string>('');
	useImperativeHandle(ref, () => ({
		open: () => setShowActionsheet(true),
		close: () => setShowActionsheet(false)
	}));

	const app = useApp();
	const updateApp = useAppUpdate();
	const toast = useToast();
	async function submit() {
		if (isNull(tag) || isEmpty(tag)) {
			inputRef.current?.shake?.();
			setError('标签名称不能为空');
			return;
		}
		if (props.mode === 'add') {
			try {
				const id = await insert(app.db, tag, app.current);
				showToast(toast, {
					title: '添加成功',
					variant: 'accent',
					action: 'success'
				});
				props?.callback?.(
					{
						id: parseInt(id.toString()),
						name: tag
					},
					'add'
				);
				updateApp.tags(prev => prev.concat(parseInt(id.toString())));
				setShowActionsheet(false);
			} catch (error) {
				showToast(toast, {
					title: error ? String(error) : '添加失败',
					variant: 'accent',
					action: 'error'
				});
			}
		} else {
			if (tag === props.tag?.name) {
				setShowActionsheet(false);
				return;
			}
			try {
				await update(app.db, tag, props.tag!.id);
				showToast(toast, {
					title: '编辑成功',
					variant: 'accent',
					action: 'success'
				});
				props?.callback?.(
					{
						id: props.tag!.id,
						name: tag
					},
					'edit'
				);
				setShowActionsheet(false);
			} catch (error) {
				showToast(toast, {
					title: error ? String(error) : '编辑失败',
					variant: 'accent',
					action: 'error'
				});
			}
		}
	}

	return (
		<>
			<Actionsheet
				isOpen={showActionsheet}
				snapPoints={[55]}
				closeOnOverlayClick
				onClose={() => setShowActionsheet(false)}>
				<ActionsheetBackdrop />
				<ActionsheetContent>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<Heading>
						{props.mode !== 'edit' ? '添加' : '编辑'}标签
					</Heading>
					<FormControl size="md" w={'$full'} isRequired={true}>
						<FormControlLabel mb="$1" alignSelf="flex-start">
							<FormControlLabelText color="#86939e" size="sm">
								请输入标签名称
							</FormControlLabelText>
						</FormControlLabel>
						<InputField
							errorMessage={errorMessage}
							onChangeText={text => {
								setError('');
								updateTag(text);
							}}
							returnKeyType="done"
							value={tag}
							ref={inputRef as any}
							onSubmitEditing={submit}
							placeholder="请输入标签名称"
						/>
					</FormControl>
					<Button
						onPress={submit}
						containerStyle={{
							width: '90%',
							marginTop: 20,
							borderRadius: 6
						}}>
						<HStack alignItems="center" gap={2}>
							<ButtonText>保存</ButtonText>
							<Icon
								as={getFontByFamily('AntDesign')}
								name="save"
								color="$white"
							/>
						</HStack>
					</Button>
				</ActionsheetContent>
			</Actionsheet>
		</>
	);
});
