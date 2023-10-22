import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
	Heading,
	HStack,
	Icon,
	FlatList,
	Text,
	Box
} from '@gluestack-ui/themed';
import { Button } from '@rneui/themed';
import React, {
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState
} from 'react';
import getFontByFamily from 'utils/FontManager';
import AccountInsert, { AccountInsertRef } from './AccountInsert';
import { useApp } from 'model/AppContext';
import { Account, BaseRef } from 'types/entity';
import IconView from 'components/Icon/IconView';
import { isEmpty, notNull } from 'utils/types';
interface AccountSelectionRef extends BaseRef {}
type AccountSelectionProps = {
	callback?: (time: Account) => void;
};

export type { AccountSelectionRef, AccountSelectionProps };

export default React.forwardRef<AccountSelectionRef, AccountSelectionProps>(
	(props, ref) => {
		const [column, setColumn] = React.useState<number>(2);

		const app = useApp();

		const [accounts, setAccount] = useState<Account[]>([]);
		useEffect(() => {
			//加载账户
			app.db
				.executeAsync(
					`SELECT
  Account.id AS accountId,
  Account.name AS accountName,
  Account.money AS accountMoney,
  Account.card AS accountCard,
  Account.level AS accountLevel,
  Icon.id AS iconId,
  Icon.name AS iconName,
  Icon.type AS iconType,
  Icon.family AS iconFamily,
  Icon.color AS iconColor,
  Icon.size AS iconSize,
  Account.isDefault AS accountIsDefault,
  Account.remark AS accountRemark
FROM Account
LEFT JOIN Icon ON Account.iconId = Icon.id   WHERE accountId in (${app.accountIds
						.map(() => '?')
						.join(',')})`,
					app.accountIds
				)
				.then(response => {
					if (notNull(response.rows && !isEmpty(response.rows))) {
						const accounts: Account[] = [];
						for (let i = 0; i < response!.rows!.length!; ++i) {
							const account = response!.rows!.item!(i);
							//@ts-ignore
							accounts.push({
								id: account.accountId,
								name: account.accountName,
								money: account.accountMoney,
								card: account.accountCard,
								level: account.accountLevel,
								icon: {
									id: account.iconId,
									name: account.iconName,
									type: account.iconType,
									family: account.iconFamily,
									color: account.iconColor,
									size: account.iconSize
								},
								isDefault: account.accountIsDefault,
								remark: account.accountRemark
							});
						}

						setAccount(accounts);
					}
				});
		}, []);
		useImperativeHandle(ref, () => ({
			open: () => setShowActionsheet(true),
			close: () => setShowActionsheet(false)
		}));
		const [showActionsheet, setShowActionsheet] =
			React.useState<boolean>(false);
		const insertRef = useRef<AccountInsertRef>(null);

		const commit = useCallback((account: Account) => {
			props.callback?.(account);
			setShowActionsheet(false);
		}, []);

		return (
			<>
				<Actionsheet
					isOpen={showActionsheet}
					snapPoints={[35]}
					closeOnOverlayClick
					onClose={() => setShowActionsheet(false)}>
					<ActionsheetBackdrop />
					<ActionsheetContent>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator />
						</ActionsheetDragIndicatorWrapper>
						<HStack
							justifyContent="space-between"
							p={10}
							w={'$full'}>
							<Heading>选择账户</Heading>
							<HStack>
								<Button
									size="sm"
									type="clear"
									onPress={() =>
										setColumn(p => (p === 2 ? 1 : 2))
									}>
									{column === 2 ? (
										<Icon
											as={getFontByFamily('Ionicons')}
											name="grid"
										/>
									) : (
										<Icon
											as={getFontByFamily('FontAwesome')}
											name="th-list"
										/>
									)}
								</Button>
								<Button size="sm" type="clear">
									<Icon
										as={getFontByFamily('FontAwesome')}
										name="sort"
									/>
								</Button>
								<Button
									size="sm"
									onPress={insertRef.current?.open}
									type="clear">
									<Icon
										as={getFontByFamily('MaterialIcons')}
										name="add-box"
									/>
								</Button>
							</HStack>
						</HStack>
						<Box h="25%" w="$full">
							<FlatList
								data={accounts}
								key={column}
								w={'$full'}
								numColumns={column}
								columnGap={20}
								keyExtractor={(account: Account, index) =>
									account.id.toString()
								}
								renderItem={({ item }: { item: Account }) => (
									<Button
										onPress={() => commit(item)}
										type="clear">
										<HStack
											flex={column === 1 ? 1 : 0}
											alignItems="center"
											justifyContent="space-between">
											<HStack
												alignItems="center"
												gap={10}>
												<IconView
													{...item.icon}></IconView>
												<Text>{item.name}</Text>
											</HStack>
											<Text>
												{item.money.toLocaleString(
													'zh-CN',
													{
														currency: 'CNY',
														style: 'currency'
													}
												)}
											</Text>
										</HStack>
									</Button>
								)}
							/>
						</Box>
					</ActionsheetContent>
				</Actionsheet>
				<AccountInsert
					ref={insertRef}
					callback={acc => setAccount(a => [...a, acc])}
				/>
			</>
		);
	}
);
