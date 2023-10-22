import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
	Heading,
	VStack,
	HStack,
	Text,
	SelectItem,
	SelectContent,
	SelectPortal,
	SelectDragIndicator,
	SelectDragIndicatorWrapper,
	SelectTrigger,
	SelectInput,
	SelectIcon,
	Icon,
	ChevronDownIcon,
	Box,
	ScrollView,
	useToast
} from '@gluestack-ui/themed';
import IconComponents, { IconRef } from 'components/Icon/Index';
import { Select } from '@gluestack-ui/themed';
import { Button, Input, InputProps } from '@rneui/themed';
import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { Category, Icon as IconType } from 'types/entity';
import IconView from 'components/Icon/IconView';
import { isEmpty, isNull } from 'utils/types';
import getFontByFamily from 'utils/FontManager';
import { showToast } from 'components/toast/Index';
import { useApp } from 'model/AppContext';
type CategoryAddRef = {
	open: () => void;
	close: () => void;
};
type CateGoryAddProps = {
	mode?: 'add' | 'edit';
	category?: Category;
	callback?: (category: Category, mode: 'add' | 'edit') => void;
};

export type { CateGoryAddProps, CategoryAddRef };

export default React.forwardRef<CategoryAddRef, CateGoryAddProps>(
	(props, ref) => {
		const [category, updateCategory] = React.useState<Category>(
			Object.create(null)
		);
		const [showActionsheet, setShowActionsheet] =
			React.useState<boolean>(false);
		const iconRef = useRef<IconRef>(null);

		const inputRef = React.useRef<InputProps>(null);

		useEffect(() => {
			updateCategory(
				props.mode !== 'edit' ? Object.create(null) : props.category!
			);
		}, [props.mode, showActionsheet]);
		const [errorMessage, setError] = React.useState<string>('');
		const toast = useToast();
		const app = useApp();

		async function submit() {
			if (isNull(category.type) || isEmpty(category.type)) {
				return showToast(toast, {
					title: '请选择分类类型',
					variant: 'accent',
					action: 'error'
				});
			}
			if (isNull(category.icon)) {
				return showToast(toast, {
					title: '请选择分类图标',
					variant: 'accent',
					action: 'error'
				});
			}
			if (isNull(category.name) || isEmpty(category.name)) {
				inputRef.current?.shake?.();
				return showToast(toast, {
					title: '请输入分类名称',
					variant: 'accent',
					action: 'error'
				});
			}
			if (props.mode !== 'edit') {
				const sql =
					'INSERT INTO Category(name,type,iconId,level,indexed) VALUES(?,?,?,?,?);SELECT LAST_INSERT_ID();';
				const sqlToLedger = `INSERT INTO LedgerRelationCategory(categoryId,ledgerId) VALUES(?,?);`;
				app.db.transaction(async tx => {
					try {
						const { insertId, rowsAffected } =
							await app.db.executeAsync(sql, [
								category.name,
								category.type,
								category.icon.id,
								0,
								Number.MAX_VALUE
							]);
						const { rowsAffected: affect } =
							await app.db.executeAsync(sqlToLedger, [
								insertId,
								app.current
							]);
						if (rowsAffected === 0 || affect === 0) {
							showToast(toast, {
								title: '添加失败',
								variant: 'accent',
								action: 'error'
							});
							tx.rollback();
						} else {
							category.id = insertId as number;
							props.callback?.(category, 'add');

							setShowActionsheet(false);
							showToast(toast, {
								title: '添加成功',
								variant: 'accent',
								action: 'success'
							});
						}
					} catch (error) {
						tx.rollback();
					} finally {
						tx.commit();
					}
				});
			} else {
				const sql =
					'update Category set name=?,type=?,iconId=? where id=?';
				app.db.transaction(async tx => {
					try {
						const { rowsAffected } = await app.db.executeAsync(
							sql,
							[
								category.name,
								category.type,
								category.icon.id,
								category.id
							]
						);
						if (rowsAffected === 0) {
							showToast(toast, {
								title: '修改失败',
								variant: 'accent',
								action: 'error'
							});
							tx.rollback();
						} else {
							props.callback?.(category, 'edit');
							updateCategory(Object.create(null));
							setShowActionsheet(false);
							showToast(toast, {
								title: '修改成功',
								variant: 'accent',
								action: 'success'
							});
						}
					} catch (error) {
						tx.rollback();
					} finally {
						tx.commit();
					}
				});
			}
			updateCategory(Object.create(null));
		}
		useImperativeHandle(ref, () => ({
			open: () => setShowActionsheet(true),
			close: () => setShowActionsheet(false)
		}));
		return (
			<>
				<Actionsheet
					isOpen={showActionsheet}
					snapPoints={[55]}
					closeOnOverlayClick
					onClose={() => setShowActionsheet(false)}>
					<ActionsheetBackdrop />
					<KeyboardAvoidingView
						enabled
						style={{
							width: '100%'
						}}
						keyboardVerticalOffset={380}
						behavior="padding">
						<ActionsheetContent>
							<ActionsheetDragIndicatorWrapper>
								<ActionsheetDragIndicator />
							</ActionsheetDragIndicatorWrapper>
							<ScrollView w={'$full'} stickyHeaderIndices={[0]}>
								<Heading bg="$white">
									{props.mode === 'edit' ? '编辑' : '添加'}
									分类
								</Heading>
								<VStack w={'$full'}>
									<HStack
										w={'$full'}
										p={10}
										justifyContent="space-between"
										alignItems="center"
										gap={20}>
										<Text>类型</Text>
										<Select
											defaultValue={props.category?.type}
											onValueChange={(value: string) => {
												updateCategory(category => {
													return {
														...category,
														type: value
													};
												});
											}}
											w="$1/3">
											<SelectTrigger
												variant="underlined"
												size="sm">
												<SelectInput
													textAlign="center"
													placeholder="选择类型"
												/>
												<SelectIcon mr="$3">
													<Icon
														as={ChevronDownIcon}
													/>
												</SelectIcon>
											</SelectTrigger>
											<SelectPortal snapPoints={[14.5]}>
												<SelectContent>
													<SelectDragIndicatorWrapper>
														<SelectDragIndicator />
													</SelectDragIndicatorWrapper>
													<SelectItem
														label="支出"
														value="支出"
													/>
													<SelectItem
														label="收入"
														value="收入"
													/>
												</SelectContent>
											</SelectPortal>
										</Select>
									</HStack>
								</VStack>
								<VStack w={'$full'}>
									<HStack
										w={'$full'}
										p={10}
										justifyContent="space-between"
										alignItems="center"
										gap={20}>
										<Text>图标 </Text>
										<Button
											onPress={() =>
												iconRef.current?.open()
											}
											title={'请选择图标'}
											icon={
												category.icon && (
													<Box ml={10}>
														<IconView
															{...category.icon}
														/>
													</Box>
												)
											}
											iconRight={true}
											type="outline"></Button>
									</HStack>
								</VStack>
								<VStack w={'$full'}>
									<HStack
										p={10}
										justifyContent="space-between"
										alignItems="center"
										gap={20}>
										<Text>分类名称</Text>

										<Input
											returnKeyType="done"
											errorMessage={errorMessage}
											ref={inputRef as any}
											value={props.category?.name}
											onTextInput={() => {
												setError('');
											}}
											onBlur={() => {
												if (
													isNull(category.name) ||
													isEmpty(category.name)
												) {
													inputRef.current?.shake?.();
													setError(
														'分类名称不能为空'
													);
												}
											}}
											onChangeText={(text: string) => {
												updateCategory(category => {
													return {
														...category,
														name: text
													};
												});
											}}
											containerStyle={{
												flex: 1
											}}
											style={{
												textAlign: 'right',
												width: '100%'
											}}
											placeholder="请输入分类名称"
										/>
									</HStack>
								</VStack>
								<Button
									title={
										props.mode === 'edit' ? '修改' : '添加'
									}
									onPress={submit}
									iconRight={true}
									icon={
										<Icon
											as={getFontByFamily(
												'MaterialIcons'
											)}
											color="$white"
											name="add"
										/>
									}
								/>
							</ScrollView>
						</ActionsheetContent>
					</KeyboardAvoidingView>
				</Actionsheet>
				<IconComponents
					ref={iconRef}
					callback={icon => {
						updateCategory(category => {
							return {
								...category,
								icon: icon
							};
						});
					}}
				/>
			</>
		);
	}
);
