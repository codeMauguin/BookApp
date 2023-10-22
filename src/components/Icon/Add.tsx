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
	Select,
	ChevronDownIcon,
	Icon,
	SelectContent,
	SelectDragIndicator,
	SelectDragIndicatorWrapper,
	SelectIcon,
	SelectInput,
	SelectItem,
	SelectPortal,
	SelectTrigger,
	ScrollView,
	Center,
	Modal,
	ModalContent,
	ModalBackdrop,
	ModalFooter,
	ModalBody,
	ModalHeader,
	CloseIcon,
	ModalCloseButton,
	useToast,
	Toast,
	ToastDescription,
	ToastTitle,
	Slider,
	SliderThumb,
	SliderFilledTrack,
	SliderTrack,
	Tooltip,
	TooltipContent
} from '@gluestack-ui/themed';
import ColorPicker from 'react-native-wheel-color-picker';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { Icon as IconType } from 'types/entity';
import getFontByFamily, { FontKey, fonts } from 'utils/FontManager';
import { isNull, notNull } from 'utils/types';
import { Button, Image, Input, InputProps } from '@rneui/themed';
import Process from 'components/ProgressBar/Index';
import { showToast } from 'components/toast/Index';
import ImagePicker from 'react-native-image-crop-picker';
import { NativeModules } from 'react-native';
import { useApp } from 'model/AppContext';
type IconRef = {
	open: () => void;
	close: () => void;
};

type IconProps = {
	callback?: (icon: IconType) => void;
};
export type { IconRef, IconProps };

export default React.forwardRef<IconRef, IconProps>(function (props, ref) {
	const [open, setOpen] = React.useState<boolean>(false);

	const [icon, updateIcon] = React.useState<IconType>(
		Object.create({ size: 20 })
	);
	const [loading, setLoading] = useState<boolean>(false);

	const [pickerIcon, setPicker] = React.useState<boolean>(false);
	const [errorMessage, setError] = React.useState<Partial<{ name: string }>>(
		Object.create(null)
	);
	const inputNameRef = React.useRef<InputProps>(null);
	function onInput(value: string) {
		if (!/^\s*$/.test(value)) {
			setError({});
		}
	}
	useEffect(() => {
		updateIcon(Object.create({ size: 20 }));
	}, []);
	async function pickImage() {
		setLoading(true);
		//@ts-ignore
		const { mime, data } = await ImagePicker.openPicker({
			width: 300,
			height: 300,
			cropping: true,
			includeBase64: true
		});
		const { ImageColorPicker } = NativeModules;
		const color = await ImageColorPicker.analyzeImage(data);
		updateIcon(icon => ({
			...icon,
			name: `data:${mime};base64,${data}`,
			color
		}));
		setLoading(false);
	}

	const close = () => {
		setOpen(false);
	};
	useImperativeHandle(ref, () => ({
		open: () => setOpen(true),
		close: close
	}));
	const toast = useToast();
	const app = useApp();
	async function commit() {
		//校验
		if (isNull(icon.type)) {
			showToast(toast, {
				title: '请选择图标类型',
				action: 'error',
				variant: 'accent'
			});
			return;
		}
		if (icon.type === 'icon') {
			if (isNull(icon.name)) {
				showToast(toast, {
					title: '请输入图标名称',
					action: 'error',
					variant: 'accent'
				});
				setError({ name: '请输入图标名称' });
				inputNameRef.current?.shake?.();
				return;
			}
			if (isNull(icon.family)) {
				showToast(toast, {
					title: '请选择图标家族',
					action: 'error',
					variant: 'accent'
				});
				return;
			}
		} else {
			if (isNull(icon.name)) {
				showToast(toast, {
					title: '请选择图片',
					action: 'error',
					variant: 'accent'
				});
				return;
			}
		}
		const sql = `INSERT INTO Icon (name, type, color, size, family) VALUES (?, ?, ?, ?, ?);
SELECT last_insert_rowid() AS id;`;
		app.db.transaction(async tx => {
			try {
				const response = await tx.executeAsync(sql, [
					icon.name,
					icon.type,
					icon.color,
					icon.size ?? 20,
					icon.family
				]);
				if (response.rowsAffected === 0) {
					showToast(toast, {
						title: '添加失败',
						action: 'error',
						variant: 'accent'
					});
				} else {
					showToast(toast, {
						title: '添加成功',
						action: 'success',
						variant: 'accent'
					});
					icon.id = response!.insertId as number;
					props.callback?.(icon);
					updateIcon(Object.create({ size: 20 }));
					close();
				}
			} catch (error) {
				tx.rollback();
			} finally {
				tx.commit();
			}
		});
	}

	return (
		<>
			<Actionsheet isOpen={open} onClose={close}>
				<KeyboardAvoidingView
					behavior="padding"
					keyboardVerticalOffset={410}>
					<ActionsheetBackdrop />
					<ActionsheetContent>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator />
						</ActionsheetDragIndicatorWrapper>
						<Heading>添加图标</Heading>
						<ScrollView flex={1} w={'$full'}>
							<VStack w={'$full'} px={10}>
								<HStack justifyContent="space-between">
									<Text>图标类型</Text>
									<Select
										defaultValue={
											icon.type === 'image'
												? '图片'
												: icon.type
										}
										onValueChange={(value: string) => {
											updateIcon((icon: IconType) => {
												return {
													...icon,
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
												<Icon as={ChevronDownIcon} />
											</SelectIcon>
										</SelectTrigger>
										<SelectPortal snapPoints={[14.5]}>
											<SelectContent>
												<SelectDragIndicatorWrapper>
													<SelectDragIndicator />
												</SelectDragIndicatorWrapper>
												<SelectItem
													label="icon"
													value="icon"
												/>
												<SelectItem
													label="图片"
													value="image"
												/>
											</SelectContent>
										</SelectPortal>
									</Select>
								</HStack>
								{icon.type === 'icon' && (
									<>
										<HStack
											gap={20}
											justifyContent="space-between"
											alignItems="center">
											<Text>图标名称</Text>
											<Input
												ref={inputNameRef as any}
												errorMessage={errorMessage.name}
												renderErrorMessage={true}
												containerStyle={{
													flex: 1
												}}
												onChangeText={text => {
													updateIcon(
														(icon: IconType) => ({
															...icon,
															name: text
														})
													);
													onInput(text);
												}}
												value={icon.name}
												placeholder="请输入图标名称"
												textAlign="right"
											/>
										</HStack>
										<HStack
											justifyContent="space-between"
											alignItems="center"
											gap={20}>
											<Text>图标家族</Text>
											<Select
												flex={1}
												defaultValue={icon.family}
												onValueChange={value => {
													updateIcon(
														(icon: IconType) => {
															return {
																...icon,
																family: value as FontKey
															};
														}
													);
												}}>
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
												<SelectPortal>
													<SelectContent pb={200}>
														<SelectDragIndicatorWrapper>
															<SelectDragIndicator />
														</SelectDragIndicatorWrapper>
														<ScrollView
															h="$full"
															w="$full">
															{Object.keys(
																fonts
															).map(font => (
																<SelectItem
																	label={font}
																	value={font}
																	key={font}
																/>
															))}
														</ScrollView>
													</SelectContent>
												</SelectPortal>
											</Select>
										</HStack>
									</>
								)}
								{icon.type === 'image' && (
									<HStack
										gap={20}
										py={10}
										alignItems="center"
										justifyContent="space-between">
										<Text>选取图片</Text>
										<Button
											onPress={pickImage}
											title={'选择图片'}
											type="clear"
										/>
									</HStack>
								)}
								<HStack
									gap={20}
									py={10}
									alignItems="center"
									justifyContent="space-between">
									<Text>图标颜色</Text>
									<Button
										onPress={() => setPicker(true)}
										type="clear"
										buttonStyle={{
											backgroundColor: icon.color,
											height: 40,
											flex: 1,
											width: isNull(icon.color)
												? 'auto'
												: 40,
											borderRadius: 50
										}}
										title={
											isNull(icon.color) ? '选择颜色' : ''
										}></Button>
								</HStack>
								<HStack
									alignItems="center"
									justifyContent="space-between"
									gap={20}>
									<Text>图标大小</Text>
									<Tooltip
										placement={'top'}
										trigger={trigger => (
											<Slider
												minValue={20}
												maxValue={40}
												step={0.1}
												defaultValue={icon.size ?? 20}
												size="md"
												flex={1}
												onChange={size =>
													updateIcon(
														(icon: IconType) => ({
															...icon,
															size: size
														})
													)
												}
												orientation="horizontal">
												<SliderTrack>
													<SliderFilledTrack bg="$amber600" />
												</SliderTrack>
												<SliderThumb
													bg="$amber600"
													{...trigger}
												/>
											</Slider>
										)}>
										<TooltipContent>
											<Text color="$blue400">
												{icon.size ?? 20}
											</Text>
										</TooltipContent>
									</Tooltip>
								</HStack>
							</VStack>

							<Heading>预览</Heading>
							<Center mb={20}>
								{icon.type === 'icon' &&
									notNull(icon.family) &&
									notNull(icon.name) && (
										<Icon
											as={getFontByFamily(icon.family)}
											name={icon.name}
											color={icon.color}
											size={icon.size}
										/>
									)}
								{icon.type === 'image' &&
									notNull(icon.name) && (
										<>
											<Image
												style={{
													width: icon.size ?? 20,
													height: icon.size ?? 20
												}}
												source={{ uri: icon.name }}
												transition={true}
											/>
										</>
									)}
							</Center>
							<Button
								onPress={commit}
								loading={loading}
								style={{ width: '100%' }}
								buttonStyle={{ borderRadius: 10 }}>
								添加
								<Icon
									as={getFontByFamily('MaterialIcons')}
									name="add"
									color="$white"
								/>
							</Button>
						</ScrollView>
					</ActionsheetContent>
				</KeyboardAvoidingView>
			</Actionsheet>
			<Modal isOpen={pickerIcon} onClose={() => setPicker(false)}>
				<ModalBackdrop />
				<ModalContent>
					<ModalHeader>
						<Heading size="lg">选取颜色</Heading>
						<ModalCloseButton>
							<Icon as={CloseIcon} />
						</ModalCloseButton>
					</ModalHeader>
					<ModalBody>
						<ColorPicker
							color={icon.color}
							onColorChange={color =>
								updateIcon(icon => ({ ...icon, color }))
							}
						/>
					</ModalBody>
				</ModalContent>
				<ModalFooter></ModalFooter>
			</Modal>
		</>
	);
});
