import {
	Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper,
	HStack, Heading, Icon, Text, VStack, View
}                                                       from "@gluestack-ui/themed";
import { Button }                                       from "@rneui/themed";
import React, { useImperativeHandle, useRef, useState } from "react";
import { LayoutChangeEvent }                            from "react-native";
import { BaseRef, BillPeople }                          from "types/entity";
import { formatDate }                                   from "utils/DateUtil";
import getFontByFamily                                  from "utils/FontManager";
import { isString }                                     from "utils/types";
import ShareInsert, { ShareInsertRef }                  from "./ShareInsert";
import Swipple                                          from "react-native-gesture-handler/Swipeable";
import Animated, { LightSpeedOutLeft }                  from "react-native-reanimated";

import {
	GestureHandlerRootView,
	TouchableOpacity
} from 'react-native-gesture-handler';

function ShareItem({
	                   item,
	                   change,
	                   deleteItem
                   }: {
	item: Omit<BillPeople, "id" | "payload" | "bill">;
	change: () => void;
	deleteItem: (item: Omit<BillPeople, "id" | "payload" | "bill">) => void;
}) {
	const [width, setWidth] = React.useState<any>("auto");
	
	function onLayout(event: LayoutChangeEvent) {
		event.persist(); //保留事件
		setWidth((width: any) =>
			         isString(width)
				         ? event.nativeEvent.layout.width
				         : Math.max(width, event.nativeEvent.layout.width)
		);
	}
	
	const deleteButtonWidth = 75; // 设置删除按钮的宽度
	const swimmableRef = useRef(null);
	
	const onButtonClick = () => {
		if (swimmableRef.current) {
			swimmableRef.current!.close();
		}
	};
	
	function renderActions(progress: any) {
		const translateX = progress.interpolate({
			                                        inputRange : [0, 1], // 过渡范围
			                                        outputRange: [deleteButtonWidth, 0], // 输出值
			                                        extrapolate: "clamp"
		                                        });
		return (
			<View
				style={{
					width        : deleteButtonWidth << 1,
					flexDirection: "row"
				}}>
				<TouchableOpacity
					onPress={() => {
						change();
						onButtonClick();
					}}
					style={{
						width    : deleteButtonWidth,
						transform: [{translateX}]
					}}>
					<Animated.View
						style={{
							width          : deleteButtonWidth,
							height         : "100%",
							backgroundColor: "blue",
							alignItems     : "center",
							justifyContent : "center"
						}}>
						<Icon
							as={getFontByFamily("FontAwesome")}
							color="$white"
							name="edit"
						/>
					</Animated.View>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => deleteItem(item)}
					style={{transform: [{translateX}]}}>
					<Animated.View
						style={{
							width          : deleteButtonWidth,
							height         : "100%",
							backgroundColor: "red",
							alignItems     : "center",
							justifyContent : "center"
						}}>
						<Icon
							as={getFontByFamily("FontAwesome")}
							color="$white"
							name="trash"
						/>
					</Animated.View>
				</TouchableOpacity>
			</View>
		);
	}
	
	return (
		<GestureHandlerRootView>
			<Swipple renderRightActions={renderActions} ref={swimmableRef}>
				<View
					bg="$blue100"
					borderRadius={"$sm"}
					overflow="hidden"
					p={10}>
					<HStack alignItems="center" justifyContent="space-between">
						<Text>{item.title}</Text>
						<Text color={item.status ? "$success600" : "$error600"}>
							{item.status ? "已到账" : "未到账"}
						</Text>
					</HStack>
					<HStack alignItems="center" gap={10}>
						<Text
							onLayout={onLayout}
							w={width}
							fontSize={"$sm"}
							color="$coolGray400">
							对方名称
						</Text>
						<Text
							fontSize={"$sm"}
							fontWeight="$light"
							color="$black">
							{item.name}
						</Text>
					</HStack>
					<HStack alignItems="center" gap={10}>
						<Text
							onLayout={onLayout}
							w={width}
							fontSize={"$sm"}
							color="$coolGray400">
							收款账户
						</Text>
						<Text
							fontSize={"$sm"}
							fontWeight="$light"
							color="$black">
							{item.account.name}
						</Text>
					</HStack>
					<HStack alignItems="center" gap={10}>
						<Text
							onLayout={onLayout}
							color="$coolGray400"
							w={width}
							fontSize={"$sm"}>
							{!item.status ? "预" : ""}收款金额
						</Text>
						<Text
							fontSize={"$sm"}
							fontWeight="$light"
							color={item.status ? "$success600" : "$error600"}>
							{item.money.toLocaleString("zh-CN", {
								style   : "currency",
								currency: "CNY"
							})}
						</Text>
					</HStack>
					<HStack alignItems="center" gap={10}>
						<Text
							onLayout={onLayout}
							w={width}
							fontSize={"$sm"}
							color="$coolGray400">
							{!item.status ? "预到账" : "收款"}时间
						</Text>
						<Text
							fontSize={"$sm"}
							fontWeight="$light"
							color="$black">
							{formatDate(item.time, "yyy-MM-dd HH:mm")}
						</Text>
					</HStack>
				</View>
			</Swipple>
		</GestureHandlerRootView>
	);
}

interface ShareRef extends BaseRef {
	people(): Omit<BillPeople, "id" | "payload" | "bill">[];
}

export type { ShareRef };
export default React.forwardRef<ShareRef, {}>(({}, ref) => {
	useImperativeHandle(ref, () => ({
		open : () => setIsOpen(true),
		close: () => setIsOpen(false),
		people() {
			return list;
		}
	}));
	const [isOpen, setIsOpen] = React.useState<boolean>(false);
	const shareInsertRef = React.useRef<ShareInsertRef>(null);
	const [list, setList] = React.useState<
		Omit<BillPeople, "id" | "payload" | "bill">[]
	>([]);
	const commit = (item: Omit<BillPeople, "id" | "payload" | "bill">) => {
		if (mode === "add") {
			setList(list => list.concat(item));
		} else {
			setList(list => {
				list[list.findIndex(predicate => predicate === modifyData)] =
					item;
				return [...list];
			});
		}
	};
	const [mode, setMode] = useState<"add" | "edit">("add");
	const [modifyData, setModify] = useState<
		Omit<BillPeople, "id" | "payload" | "bill"> | undefined
	>(undefined);
	const modify = (item: Omit<BillPeople, "id" | "payload" | "bill">) => {
		setMode("edit");
		setModify(item);
		shareInsertRef.current?.open();
	};
	return (
		<>
			<Actionsheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
				<ActionsheetBackdrop/>
				<ActionsheetContent>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator/>
					</ActionsheetDragIndicatorWrapper>
					<HStack
						alignItems="center"
						w={"$full"}
						justifyContent="space-between">
						<Heading>平摊人员</Heading>
						<View>
							<Button
								size="sm"
								onPress={() => {
									setMode("add");
									shareInsertRef.current?.open();
								}}
								type="clear">
								<Icon
									as={getFontByFamily("MaterialIcons")}
									name="add-box"
								/>
							</Button>
						</View>
					</HStack>
					<VStack w={"$full"} gap={10}>
						{list.map((item, index) => (
							<Animated.View
								key={index}
								exiting={LightSpeedOutLeft}>
								<ShareItem
									change={() => modify(item)}
									deleteItem={item =>
										setList(list =>
											        list.filter(item => item !== item)
										)
									}
									item={item}
								/>
							</Animated.View>
						))}
					</VStack>
				</ActionsheetContent>
			</Actionsheet>
			<ShareInsert
				mode={mode}
				callback={commit}
				billPeople={modifyData}
				ref={shareInsertRef}
			/>
		</>
	);
});
