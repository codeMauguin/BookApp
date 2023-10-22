import {
	Box, HStack, Icon, Text, VStack, Input, InputField, KeyboardAvoidingView, Badge as TagView, BadgeText, Divider,
	useToast
}                                                  from "@gluestack-ui/themed";
import { useNavigation }                           from "@react-navigation/native";
import { NativeStackNavigationProp }               from "@react-navigation/native-stack";
import { Badge, Button, Tab, TabView }             from "@rneui/themed";
import IconView                                    from "components/Icon/IconView";
import { useApp }                                  from "model/AppContext";
import React, { Suspense, useCallback, useEffect } from "react";
import { Account, Category }                       from "types/entity";
import { getList as getCategoryList }              from "Views/Screens/Category/Index";
import Keyboard                                    from "./sub/Keyboard";
import { formatTime, isEmpty, isNull }             from "utils/types";
import getFontByFamily                             from "utils/FontManager";
import { ScrollView }                              from "react-native";
import { AccountSelectionRef }                     from "Views/Create/sub/AccountSelection";
import { DateSelectionRef }                        from "./sub/DateSelection";
import KeyboardInput, { KeyboardInputRef }         from "components/KeyboardInput/Index";
import { ShareRef }                                from "./sub/Share";
import { showToast }                               from "components/toast/Index";
import { insertBill }                              from "./db";

function CategoryItem({
	                      item,
	                      active,
	                      hook
                      }: {
	item: Category;
	active: boolean;
	hook: (category: Category) => void;
}) {
	return (
		<Button type="clear" onPress={() => hook(item)}>
			<VStack alignItems="center" gap={4}>
				<IconView {...item.icon} />
				<Text>{item.name}</Text>
				{active && <Badge status="success"/>}
			</VStack>
		</Button>
	);
}

export function format_billing_time(time: Date) {
	const cur = new Date();
	const yesterday = new Date(
		cur.getFullYear(),
		cur.getMonth(),
		cur.getDate() - 1
	);
	
	const year = time.getFullYear();
	const month = time.getMonth() + 1;
	const day = time.getDate();
	const hour = time.getHours();
	const minute = time.getMinutes();
	if (
		yesterday.getFullYear() === year &&
		yesterday.getMonth() === month - 1 &&
		yesterday.getDate() === day
	) {
		return `昨天 ${formatTime(hour)}:${formatTime(minute)}`;
	}
	if (cur.getFullYear() === year) {
		if (cur.getMonth() + 1 === month && cur.getDate() === day) {
			return `今天 ${formatTime(hour)}:${formatTime(minute)}`;
		}
		
		return `${formatTime(month)}-${formatTime(day)} ${formatTime(
			hour
		)}:${formatTime(minute)}`;
	} else {
		return `${formatTime(year)}-${formatTime(month)}-${formatTime(
			day
		)} ${formatTime(hour)}:${formatTime(minute)}`;
	}
}

export default function () {
	const [index, setIndex] = React.useState(0);
	const navigation = useNavigation<NativeStackNavigationProp<any, "">>();
	const [expense_classification, setExpense] = React.useState<Category[]>([]);
	const [revenue_classification, setRevenue] = React.useState<Category[]>([]);
	const app = useApp();
	const [screen_price, setScreenPrice] = React.useState<string>("");
	const [category, setCategory] = React.useState<Category>();
	const [remark, setRemark] = React.useState<string>("");
	const [account, setAccount] = React.useState<Account>();
	const accountSelectionRef = React.useRef<AccountSelectionRef>(null);
	const timeSelectionRef = React.useRef<DateSelectionRef>(null);
	const [couponAmount, setCouponAmount] = React.useState<number>(0);
	const [time, setTime] = React.useState<Date>(new Date());
	const keyboardInputRef = React.useRef<KeyboardInputRef>(null);
	const shareRef = React.useRef<ShareRef>(null);
	const AccountSelection = React.lazy(() => import("./sub/AccountSelection"));
	const DateSelection = React.lazy(() => import("./sub/DateSelection"));
	const Share = React.lazy(() => import("./sub/Share"));
	const categoryHook = useCallback((id: Category) => setCategory(id), []);
	/**
	 * 加载数据
	 */
	useEffect(() => {
		getCategoryList("支出", app.db, app.categoryIds, setExpense);
		getCategoryList("收入", app.db, app.categoryIds, setRevenue);
	}, []);
	
	useEffect(() => {
		if (isNull(category)) {
			if (index === 0 && !isEmpty(expense_classification)) {
				setCategory(expense_classification[0]);
			} else if (!isEmpty(revenue_classification)) {
				setCategory(revenue_classification[0]);
			}
		}
	}, [index, expense_classification, revenue_classification]);
	useEffect(() => {
		navigation.setOptions({
			                      headerTitle: () => (
				                      <Tab
					                      style={{width: "70%"}}
					                      value={index}
					                      onChange={setIndex}
					                      dense>
					                      <Tab.Item>支出</Tab.Item>
					                      <Tab.Item>收入</Tab.Item>
				                      </Tab>
			                      )
		                      });
	}, [index]);
	
	const toast = useToast();
	
	const onSubmit = useCallback(
		(price: number) => {
			//整合账单数据
			if (isNull(account)) {
				return showToast(toast, {
					title  : "请选择账户",
					variant: "accent",
					action : "error"
				});
			}
			if (isNull(category)) {
				return showToast(toast, {
					title  : "请选择分类",
					variant: "accent",
					action : "error"
				});
			}
			if (price === 0) {
				return showToast(toast, {
					title  : "请输入金额",
					variant: "accent",
					action : "error"
				});
			}
			
			console.log(
				"%c Line:169 🥛",
				"color:#465975",
				"数据校验成功：开始插入账单"
			);
			
			insertBill(
				{
					account,
					category,
					remark,
					price,
					promotion: couponAmount,
					type     : index === 0 ? "支出" : "收入",
					
					time,
					id: "",
					//@ts-ignore
					payload: null,
					//@ts-ignore
					people: shareRef.current?.people()
				},
				app
			);
			showToast(toast, {
				title  : "创建成功",
				variant: "accent",
				action : "success"
			});
			navigation.goBack();
		},
		[category, account, remark, index]
	);
	
	return (
		<>
			<Box flex={1}>
				<TabView
					value={index}
					onChange={setIndex}
					animationType="spring">
					<TabView.Item>
						<Box
							flexDirection="row"
							flexWrap="wrap"
							p={20}
							alignItems="center"
							gap={10}
							justifyContent="flex-start">
							{expense_classification.map(item => (
								<CategoryItem
									item={item}
									active={category?.id === item.id}
									key={item.id}
									hook={categoryHook}
								/>
							))}
						</Box>
					</TabView.Item>
					<TabView.Item
						style={{
							backgroundColor: "blue",
							width          : "100%"
						}}>
						<Text>Favorite</Text>
					</TabView.Item>
				</TabView>
			</Box>
			<Box w={"$full"} rounded={"$xl"} bg="$white">
				<KeyboardAvoidingView
					behavior="position"
					bg="$white"
					rounded={"$xl"}
					keyboardVerticalOffset={490}>
					<HStack
						p={10}
						style={{
							borderTopLeftRadius : 10,
							borderTopRightRadius: 10
						}}
						bg="$white"
						justifyContent="space-between">
						{isNull(category) ? (
							<Text>选择分类</Text>
						) : (
							<HStack alignItems="center">
								<IconView {...category.icon} size={16}/>
								<Text> {category.name}</Text>
							</HStack>
						)}
						<Text
							alignSelf="flex-end"
							fontSize={20}
							color="$rose400">
							{isEmpty(screen_price) ? "0" : screen_price}
						</Text>
					</HStack>
					<HStack p={10} bg="$white">
						<Button type="clear">
							<Icon
								as={getFontByFamily("Ionicons")}
								name="pricetags-outline"
							/>
						</Button>
						
						<Input flex={1} borderWidth={0} h={20}>
							<InputField
								value={remark}
								onChangeText={setRemark}
								placeholder="请输入备注..."
								flex={1}
							/>
						</Input>
					</HStack>
				</KeyboardAvoidingView>
				<Box>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}>
						<HStack alignItems="center" px={10} gap={10}>
							<TagView rounded={"$lg"}>
								<Button
									onPress={timeSelectionRef.current?.open}
									type="clear"
									size="sm">
									<BadgeText>
										{format_billing_time(time)}
									</BadgeText>
								</Button>
							</TagView>
							<TagView rounded={"$lg"}>
								<Button
									onPress={accountSelectionRef.current?.open}
									type="clear"
									size="sm">
									<BadgeText>
										{isNull(account)
											? "选择账户"
											: account.name}
									</BadgeText>
								</Button>
							</TagView>
							<TagView rounded={"$lg"}>
								<Button
									onPress={accountSelectionRef.current?.open}
									type="clear"
									size="sm">
									<BadgeText>标签</BadgeText>
								</Button>
							</TagView>
							<TagView rounded={"$lg"}>
								<Button
									onPress={keyboardInputRef.current?.open}
									type="clear"
									size="sm">
									<HStack alignItems="center">
										<BadgeText>优惠</BadgeText>
										{couponAmount > 0 && (
											<>
												<Divider
													orientation="vertical"
													mx="$2.5"
													bg="$indigo500"
													h={15}
													sx={{
														_dark: {
															bg: "$indigo400"
														}
													}}
												/>
												<Text
													fontSize={"$sm"}
													color="#FFA500">
													{couponAmount.toLocaleString(
														"zh-CN",
														{
															style   : "currency",
															currency: "CNY"
														}
													)}
												</Text>
											</>
										)}
									</HStack>
								</Button>
							</TagView>
							<TagView rounded={"$lg"}>
								<Button
									onPress={shareRef.current?.open}
									type="clear"
									size="sm">
									<BadgeText>分摊</BadgeText>
								</Button>
							</TagView>
						</HStack>
					</ScrollView>
				</Box>
				<Keyboard
					updateScreenPrice={setScreenPrice}
					callback={onSubmit}
				/>
			</Box>
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
					callback={setCouponAmount}
					allowNegative={false}
					ref={keyboardInputRef}
					title="优惠券"
				/>
				<Share ref={shareRef}/>
			</Suspense>
		</>
	);
}
