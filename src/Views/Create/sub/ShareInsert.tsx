import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	HStack,
	Heading,
	Text,
	VStack,
	Input,
	InputField,
	Switch,
	TextareaInput,
	Textarea,
	useToast,
	View
} from '@gluestack-ui/themed';
import { Button } from '@rneui/themed';
import React, { Suspense, useEffect, useImperativeHandle } from 'react';
import {
	Platform,
	StyleSheet,
	TextInput,
	TouchableOpacity
} from 'react-native';
import { Account, BaseRef, BillPeople } from 'types/entity';
import { AccountSelectionRef } from './AccountSelection';
import { isEmpty, isNull } from 'utils/types';
import { DateSelectionRef } from './DateSelection';
import { format_billing_time } from '../Index';
import { KeyboardInputRef } from 'components/KeyboardInput/Index';
import { showToast } from 'components/toast/Index';

interface ShareInsertRef extends BaseRef {}
const styles = StyleSheet.create({
	container: {
		marginTop: 10,
		justifyContent: 'center',
		alignItems: 'center'
	},
	button: {
		backgroundColor: 'blue', // 背景颜色
		paddingHorizontal: 50, // 内边距
		padding: 10, // 内边距
		borderRadius: 5 // 圆角
	},
	buttonText: {
		color: 'white', // 文字颜色
		fontSize: 16, // 字体大小
		fontWeight: 'bold' // 字体粗细
	}
});
type ShareInsertProps = {
	callback?: (
		billPeople: Omit<BillPeople, 'id' | 'payload' | 'bill'>,
		mode: 'add' | 'edit'
	) => void;
	mode: 'add' | 'edit';
	billPeople?: Omit<BillPeople, 'id' | 'payload' | 'bill'>;
};
export type { ShareInsertRef, ShareInsertProps };
export default React.forwardRef<ShareInsertRef, ShareInsertProps>(
	({ callback, mode, billPeople }, ref) => {
		useImperativeHandle(ref, () => ({
			open: () => setIsOpen(true),
			close: () => setIsOpen(false)
		}));
		useEffect(() => {
			if (mode === 'edit') {
				setTitle(billPeople!.title!);
				setName(billPeople!.name!);
				setAccount(billPeople!.account);
				setMoney(billPeople!.money!);
				setTime(billPeople!.time);
				setStatus(billPeople!.status);
				setRemark(billPeople!.remark!);
			}
		}, [mode, billPeople]);
		const AccountSelection = React.lazy(() => import('./AccountSelection'));
		const DateSelection = React.lazy(() => import('./DateSelection'));
		const accountSelectionRef = React.useRef<AccountSelectionRef>(null);
		const KeyboardInput = React.lazy(
			() => import('components/KeyboardInput/Index')
		);
		const keyboardInputRef = React.useRef<KeyboardInputRef>(null);
		const timeSelectionRef = React.useRef<DateSelectionRef>(null);
		const [isOpen, setIsOpen] = React.useState<boolean>(false);
		const [title, setTitle] = React.useState<string>('');
		const [name, setName] = React.useState<string>('');
		const [account, setAccount] = React.useState<Account>();
		const [money, setMoney] = React.useState<number>(0);
		const [time, setTime] = React.useState<Date>(new Date());
		const [status, setStatus] = React.useState<boolean>(false);
		const [remark, setRemark] = React.useState<string>('');
		const toast = useToast();
		function commit() {
			//验证
			if (isEmpty(title)) {
				showToast(toast, {
					title: '请输入账单标题',
					variant: 'accent',
					action: 'error'
				});
				return;
			}
			if (isEmpty(name)) {
				showToast(toast, {
					title: '请输入分摊名称',
					variant: 'accent',
					action: 'error'
				});
				return;
			}
			if (isNull(account)) {
				showToast(toast, {
					title: '请选择收款账户',
					variant: 'accent',
					action: 'error'
				});
				return;
			}
			if (money <= 0) {
				showToast(toast, {
					title: '请输入收款金额',
					variant: 'accent',
					action: 'error'
				});
				return;
			}
			callback?.(
				{
					title,
					name,
					account: account!,
					money,
					time,
					status,
					remark
				},
				mode
			);
			setAccount(void 0);
			setTime(new Date());
			setName('');
			setTitle('');
			setMoney(0);
			setStatus(false);
			setRemark('');
			setIsOpen(false);
		}
		return (
			<>
				<Actionsheet
					isOpen={isOpen}
					snapPoints={[90]}
					onClose={() => setIsOpen(false)}>
					<ActionsheetBackdrop />
					<ActionsheetContent>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator />
						</ActionsheetDragIndicatorWrapper>
						<HStack
							alignItems="center"
							w={'$full'}
							justifyContent="space-between">
							<Heading>平摊人员</Heading>
						</HStack>
						<VStack
							w={'$full'}
							px={10}
							gap={10}
							alignItems="center">
							<HStack alignItems="center" gap={10}>
								<Text>平摊标题</Text>
								<Input flex={1} variant="underlined">
									<InputField
										value={title}
										onChangeText={setTitle}
										flex={1}
										textAlign="right"
										placeholder="输入平摊标题"
										keyboardType={
											Platform.OS === 'ios'
												? 'name-phone-pad'
												: 'default'
										}
										enterKeyHint="done"
										enablesReturnKeyAutomatically
										returnKeyLabel="done"
									/>
								</Input>
							</HStack>
							<HStack alignItems="center" gap={10}>
								<Text>对方名称</Text>
								<Input flex={1} variant="underlined">
									<InputField
										value={name}
										onChangeText={setName}
										flex={1}
										textAlign="right"
										placeholder="输入对方名称"
										keyboardType={
											Platform.OS === 'ios'
												? 'name-phone-pad'
												: 'default'
										}
										enterKeyHint="done"
										enablesReturnKeyAutomatically
										returnKeyLabel="done"
									/>
								</Input>
							</HStack>
							<HStack
								w={'$full'}
								alignItems="center"
								justifyContent="space-between">
								<Text>收款金额</Text>
								<Button
									onPress={keyboardInputRef.current?.open}
									type="clear">
									<Text>
										{money.toLocaleString('zh-CN', {
											style: 'currency',
											currency: 'CNY'
										})}
									</Text>
								</Button>
							</HStack>
							<HStack
								w={'$full'}
								alignItems="center"
								justifyContent="space-between">
								<Text>收款账户</Text>
								<Button
									onPress={accountSelectionRef.current?.open}
									type="clear">
									<Text>
										{isNull(account)
											? '选择账户'
											: account?.name}
									</Text>
								</Button>
							</HStack>
							<HStack
								w={'$full'}
								alignItems="center"
								justifyContent="space-between">
								<Text>收款时间</Text>
								<Button
									onPress={timeSelectionRef.current?.open}
									type="clear">
									<Text color="$black">
										{format_billing_time(time)}
									</Text>
								</Button>
							</HStack>
							<HStack
								alignItems="center"
								w={'$full'}
								justifyContent="space-between">
								<Text>收款状态</Text>
								<Switch
									trackColor={{ true: '$success400' }}
									value={status}
									onValueChange={setStatus}
								/>
							</HStack>
							<HStack alignItems="center" w={'$full'} gap={10}>
								<Text>备注</Text>
								<Textarea flex={1} variant="default" size="sm">
									<TextInput
										value={remark}
										style={{
											padding: 5
										}}
										onChangeText={setRemark}
										textAlign="right"
										placeholder="输入备注"
										keyboardType={
											Platform.OS === 'ios'
												? 'name-phone-pad'
												: 'default'
										}
										enterKeyHint="done"
										enablesReturnKeyAutomatically
										returnKeyLabel="done"
									/>
								</Textarea>
							</HStack>
						</VStack>
						<View style={styles.container}>
							<TouchableOpacity
								onPress={commit}
								style={styles.button}>
								<Text style={styles.buttonText}>
									{mode === 'add' ? '添加' : '修改'}
								</Text>
							</TouchableOpacity>
						</View>
					</ActionsheetContent>
				</Actionsheet>
				<Suspense>
					<DateSelection
						callback={setTime}
						time={time}
						ref={timeSelectionRef}
					/>
					<AccountSelection
						callback={setAccount}
						ref={accountSelectionRef}
					/>
					<KeyboardInput
						callback={setMoney}
						allowNegative={false}
						ref={keyboardInputRef}
						title="收款金额"
					/>
				</Suspense>
			</>
		);
	}
);
