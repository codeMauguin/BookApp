import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicator,
	ActionsheetDragIndicatorWrapper,
	AddIcon,
	Box,
	Center,
	HStack,
	Heading,
	Icon
} from '@gluestack-ui/themed';
import { Card } from '@rneui/base';
import { Button, Text } from '@rneui/themed';
import { useApp } from 'model/AppContext';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { isEmpty, isNull } from 'utils/types';
import { Icon as IconType } from 'types/entity';
import IconInsert from './Add';
import IconView from './IconView';
import { Pressable } from 'react-native';
type IconRef = {
	open: () => void;
	close: () => void;
};

type IconProps = {
	callback?: (icon: IconType) => void;
};
export type { IconRef, IconProps };

async function getList(
	db: QuickSQLiteConnection,
	set: React.Dispatch<IconType[]>
) {
	const { rows } = await db.executeAsync('SELECT * FROM Icon');
	if (isNull(rows)) return;
	const icons: IconType[] = [];
	for (let i = 0; i < rows.length; ++i) {
		icons.push(rows?.item(i));
	}

	set(icons);
}

export default React.forwardRef<IconRef, IconProps>(function (props, ref) {
	//查询当前的图标
	const [open, setOpen] = React.useState<boolean>(false);
	const close = () => {
		setOpen(false);
	};

	const insertRef = useRef<IconRef>(null);

	const app = useApp();
	const [icons, setIcons] = useState<IconType[]>([]);

	useEffect(() => {
		getList(app.db, setIcons);
	}, []);
	useImperativeHandle(ref, () => ({
		open: () => setOpen(true),
		close: close
	}));
	return (
		<>
			<Actionsheet isOpen={open} onClose={close}>
				<ActionsheetBackdrop />
				<ActionsheetContent>
					<ActionsheetDragIndicatorWrapper>
						<ActionsheetDragIndicator />
					</ActionsheetDragIndicatorWrapper>
					<Card
						containerStyle={{
							width: '100%'
						}}
					>
						<Card.FeaturedTitle>
							<HStack
								justifyContent="space-between"
								w={'$full'}
								alignItems="center"
							>
								<Heading>选择图标</Heading>
								<Button
									type="clear"
									onPress={() => insertRef.current?.open()}
								>
									<Icon as={AddIcon} color="$primary400" />
								</Button>
							</HStack>
						</Card.FeaturedTitle>
						<Card.Divider />
						{isEmpty(icons) ? (
							<>
								<Center>
									<Text>亲，请先添加图标</Text>
								</Center>
							</>
						) : (
							<Box
								gap={20}
								flexWrap="wrap"
								flexDirection="row"
								alignItems="center"
							>
								{icons.map((icon, index) => {
									return (
										<Pressable
											key={icon.id}
											onPress={() => {
												props.callback?.(icon);
												close();
											}}
										>
											<IconView {...icon} />
										</Pressable>
									);
								})}
							</Box>
						)}
					</Card>
				</ActionsheetContent>
			</Actionsheet>
			<IconInsert
				ref={insertRef}
				callback={icon => {
					setIcons(icons => [...icons, icon]);
				}}
			/>
		</>
	);
});
