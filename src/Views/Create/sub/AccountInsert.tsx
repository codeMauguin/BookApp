import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
	Heading,
	Divider,
	Text,
	HStack,
	VStack,
	Box,
	Center,
	useToast,
	Textarea,
	TextareaInput
} from '@gluestack-ui/themed';
import { Button, Card, Input, Switch } from '@rneui/themed';
import React, { useImperativeHandle } from 'react';
import { Account, Icon as IconType, OrderOperationRecord } from 'types/entity';
import KeyboardInput, {
	KeyboardInputRef
} from 'components/KeyboardInput/Index';
import { Platform, InputAccessoryView, TextInput } from 'react-native';
import { isEmpty, isNull } from 'utils/types';
import { showToast } from 'components/toast/Index';
import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import {
	AppContextProps,
	AppContextUpdateProps,
	useApp,
	useAppUpdate
} from 'model/AppContext';
import IconComponent, { IconRef } from 'components/Icon/Index';
import IconView from 'components/Icon/IconView';
import { strictEqual } from 'utils/assert';
type AccountInsertRef = {
	open: () => void;
	close: () => void;
};
type AccountInsertProps = {
	callback?: (account: Account) => void;
};

export type { AccountInsertRef, AccountInsertProps };

function saveAccount(
	account: Partial<Account>,
	toast: any,
	app: AppContextProps,
	update: AppContextUpdateProps,
	callback?: (account: Account) => void
) {
	if (isNull(account.name) || isEmpty(account.name)) {
		showToast(toast, {
			title: '请输入账户名称',
			action: 'error',
			variant: 'solid'
		});
		return;
	}
	if (isNull(account.icon)) {
		showToast(toast, {
			title: '请选择账户图标',
			action: 'error',
			variant: 'solid'
		});
		return;
	}

	const updateDefaultSql = 'UPDATE Account SET isDefault = false';
	const sql = `INSERT INTO Account (name, money, isDefault,iconId,remark,orderId,level) VALUES(?,?,?,?,?,?,?);SELECT LAST_INSERT_ID();`;
	const order_sql =
		'INSERT INTO OrderOperationRecord (balanceBeforeOrderPayment,balanceAfterOrderPayment,isInit,date) VALUES(?,?,?,?);SELECT LAST_INSERT_ID();';
	app.db.transaction(async tx => {
		try {
			await tx.executeAsync(updateDefaultSql);

			const { insertId: order_id, rowsAffected: order_rows } =
				await tx.executeAsync(order_sql, [
					0,
					account.money,
					true,
					new Date(1970, 0, 1)
						.toISOString()
						.slice(0, 19)
						.replace('T', ' ') // 格式化当前时间为 SQLite 支持的格式
				]);
			strictEqual(order_rows, 1, '账单记录插入失败');
			const { insertId, rowsAffected } = await tx.executeAsync(sql, [
				account.name,
				account.money,
				account.isDefault,
				account!.icon!.id!,
				account.remark,
				order_id,
				Number.MAX_VALUE
			]);
			await tx.executeAsync(
				'UPDATE OrderOperationRecord SET accountId = ? WHERE id = ?',
				[insertId, order_id]
			);
			await tx.executeAsync(
				'INSERT INTO LedgerRelationAccount (accountId,ledgerId) VALUES(?,?)',
				[insertId, app.current]
			);
			if (1 !== rowsAffected || 1 !== order_rows) {
				tx.rollback();
				showToast(toast, {
					title: '保存失败',
					action: 'error',
					variant: 'solid'
				});
				return;
			}
			update.accountIds(ids => [insertId!, ...ids]);
			account.id = insertId;
			account.level = Number.MAX_VALUE;
			account.payload = {
				id: order_id!,
				balanceBeforeOrderPayment: 0,
				balanceAfterOrderPayment: account.money!,
				accountId: insertId!,
				isInit: true,
				bill: void 0,
				billPeople: void 0,
				date: new Date(1970, 0, 1)
			};

			callback?.(account as Account);
			tx.commit();
		} catch (error) {
			showToast(toast, {
				title: '保存失败',
				action: 'error',
				variant: 'solid'
			});

			tx.rollback();
		}
	});
}

export default React.forwardRef<AccountInsertRef, AccountInsertProps>(
	({ callback }, ref) => {
		const [name, setName] = React.useState<string>('');
		const [remark, setRemark] = React.useState<string>('');
		const [money, setMoney] = React.useState<number>(0);
		const [icon, setIcon] = React.useState<IconType>();
		const iconRef = React.useRef<IconRef>(null);
		const [isDefault, setIsDefault] = React.useState<boolean>(false);
		const keyboardInputRef = React.useRef<KeyboardInputRef>(null);
		const toast = useToast();
		const app = useApp();
		const updateApp = useAppUpdate();

		function close() {
			setMoney(0);
			setIcon(void 0);
			setIsDefault(false);
			setName('');
			setRemark('');
			setShowActionsheet(false);
		}

		function submit() {
			saveAccount(
				{
					money,
					isDefault,
					name,
					icon: icon,
					remark
				},
				toast,
				app,
				updateApp,
				acc => {
					close();
					callback?.(acc);
				}
			);
		}
		useImperativeHandle(ref, () => ({
			open: () => setShowActionsheet(true),
			close: () => setShowActionsheet(false)
		}));
		const [showActionsheet, setShowActionsheet] =
			React.useState<boolean>(false);
		return (
			<>
				<Actionsheet
					isOpen={showActionsheet}
					snapPoints={[90]}
					closeOnOverlayClick
					onClose={close}>
					<ActionsheetBackdrop />
					<ActionsheetContent>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator />
						</ActionsheetDragIndicatorWrapper>
						<HStack
							justifyContent="space-between"
							w={'$full'}
							alignItems="center">
							<Button onPress={close} type="clear">
								关闭
							</Button>
							<Heading>添加账户</Heading>
							<Button onPress={submit} type="clear">
								保存
							</Button>
						</HStack>
						<VStack gap={10}>
							<Box>
								<HStack
									alignItems="center"
									alignSelf="flex-start"
									px={10}
									gap={5}>
									<Divider
										orientation="vertical"
										rounded={'$lg'}
										h={'70%'}
										w={5}
										bgColor="$primary400"
									/>
									<Text>账户信息</Text>
								</HStack>
								<Card
									containerStyle={{
										margin: 5,
										width: '95%',
										padding: 0,
										borderRadius: 5
									}}>
									<HStack
										px={10}
										alignItems="center"
										justifyContent="space-between">
										<Text color="$black">账户名称</Text>
										<InputAccessoryView nativeID="input-name">
											<Center
												w={'$full'}
												h={40}
												bg="$coolGray400">
												<Text color="$white">
													账户名称
												</Text>
											</Center>
										</InputAccessoryView>
										<IconComponent
											ref={iconRef}
											callback={setIcon}
										/>
										<Button
											type="clear"
											onPress={iconRef.current?.open}>
											{isNull(icon) ? (
												<Text
													color="$blue700"
													fontSize={'$sm'}>
													选择图标
												</Text>
											) : (
												<IconView {...icon} />
											)}
										</Button>
										<Input
											value={name}
											onChangeText={setName}
											placeholder="输入账户名称"
											keyboardType={
												Platform.OS === 'ios'
													? 'name-phone-pad'
													: 'default'
											}
											inputAccessoryViewID="input-name"
											enterKeyHint="done"
											containerStyle={{
												flex: 1,
												height: 42,
												padding: 0,
												margin: 0
											}}
											enablesReturnKeyAutomatically
											returnKeyLabel="done"
											inputStyle={{
												color: 'black',
												fontSize: 12,
												margin: 0,
												padding: 0,
												textAlign: 'right'
											}}
											style={{
												padding: 0,
												margin: 0
											}}
										/>
									</HStack>
									<Button
										onPress={keyboardInputRef.current?.open}
										type="clear">
										<HStack
											w={'$full'}
											alignItems="center"
											justifyContent="space-between">
											<Text color="$black">账户余额</Text>
											<Text color="$primary200">
												{money.toFixed(2)}
											</Text>
										</HStack>
									</Button>
								</Card>
							</Box>
							<Box>
								<HStack
									alignItems="center"
									alignSelf="flex-start"
									px={10}
									gap={5}>
									<Divider
										orientation="vertical"
										rounded={'$lg'}
										h={'70%'}
										w={5}
										bgColor="$primary400"
									/>
									<Text>账户设置</Text>
								</HStack>
								<Card
									containerStyle={{
										margin: 5,
										width: '95%',
										paddingVertical: 10,
										borderRadius: 5
									}}>
									<HStack
										alignItems="center"
										justifyContent="space-between">
										<Text color="$black">默认使用</Text>
										<Switch
											value={isDefault}
											onValueChange={setIsDefault}
											trackColor={{
												false: '#767577',
												true: '#81b0ff'
											}}
											thumbColor={
												isDefault
													? '#f5dd4b'
													: '#f4f3f4'
											}
										/>
									</HStack>
								</Card>
							</Box>
							<Box>
								<HStack
									alignItems="center"
									alignSelf="flex-start"
									px={10}
									gap={5}>
									<Divider
										orientation="vertical"
										rounded={'$lg'}
										h={'70%'}
										w={5}
										bgColor="$primary400"
									/>
									<Text>其他信息</Text>
								</HStack>
								<Card
									containerStyle={{
										margin: 5,
										width: '95%',
										paddingHorizontal: 0,

										borderRadius: 5
									}}>
									<HStack
										px={10}
										alignItems="center"
										justifyContent="space-between">
										<Text color="$black">备注</Text>
										<InputAccessoryView nativeID="input-remark">
											<Center
												w={'$full'}
												h={40}
												bg="$coolGray400">
												<Text color="$white">备注</Text>
											</Center>
										</InputAccessoryView>
										<IconComponent
											ref={iconRef}
											callback={setIcon}
										/>
										<Input
											value={remark}
											onChangeText={setRemark}
											placeholder="输入备注"
											keyboardType={
												Platform.OS === 'ios'
													? 'name-phone-pad'
													: 'default'
											}
											inputAccessoryViewID="input-remark"
											enterKeyHint="done"
											containerStyle={{
												flex: 1,
												height: 42,
												padding: 0,
												margin: 0
											}}
											enablesReturnKeyAutomatically
											returnKeyLabel="done"
											inputStyle={{
												color: 'black',
												fontSize: 12,
												margin: 0,
												padding: 0,
												textAlign: 'right'
											}}
											style={{
												padding: 0,
												margin: 0
											}}
										/>
									</HStack>
								</Card>
							</Box>
						</VStack>
					</ActionsheetContent>
				</Actionsheet>

				<KeyboardInput
					callback={setMoney}
					ref={keyboardInputRef}
					title="账户余额"
				/>
			</>
		);
	}
);
