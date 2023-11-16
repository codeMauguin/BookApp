import React, { useEffect, useState } from 'react';
import {
	DeleteImplementationClass,
	DigitalImplementationClass,
	EnterImplementationClass,
	KeyboardCode,
	KeyboardInputType,
	KeyboardList,
	OperationImplementationClass
} from '../utils/type';
import { Button } from '@rneui/themed';
import Feather from 'react-native-vector-icons/Feather';
import { Box, ButtonIcon, Center, Text } from '@gluestack-ui/themed';
import { isNull, isObject } from 'utils/types';

const KEYBOARD_CODE: (
	| KeyboardCode
	| { key: KeyboardCode; icon: React.ReactNode }
)[][] = [
	[
		1,
		2,
		3,
		{
			key: 'del',
			icon: <Feather name="delete" size={20} />
		}
	],
	[4, 5, 6, '+'],
	[7, 8, 9, '-'],
	['n', 0, '.', 'ok']
];

async function onPress(process: KeyboardInputType[], code: KeyboardCode) {
	for (const pro of process) {
		if (!pro.validate(code)) continue;
		await pro.input(code);
		return;
	}
}

function KeyItem({
	code,
	icon,
	process
}: {
	code: KeyboardCode;
	icon?: React.ReactNode | null;
	process: KeyboardInputType[];
}) {
	return (
		<Center flex={1}>
			<Button
				type="clear"
				onPress={() => onPress(process, code)}
				containerStyle={{ width: '100%' }}>
				{isNull(icon) ? (
					<Text>{code}</Text>
				) : (
					<ButtonIcon w="$full">
						<Center>{icon}</Center>
					</ButtonIcon>
				)}
			</Button>
		</Center>
	);
}

export default function ({
	updateScreenPrice,
	allowNegative,
	callback
}: {
	updateScreenPrice: React.Dispatch<React.SetStateAction<string>>;
	allowNegative?: boolean;
	callback?: (val: number) => void;
}) {
	const [codes, setCode] = useState(KEYBOARD_CODE);
	const [process, setProcess] = useState<KeyboardInputType[]>([]);

	const [value, setValue] = useState<KeyboardList[]>([]);
	useEffect(() => {
		const digital = new DigitalImplementationClass(setValue);
		const operation = new OperationImplementationClass(setValue);
		const delete_ = new DeleteImplementationClass(setValue);
		const enter = new EnterImplementationClass(setValue, callback!);
		setProcess([digital, operation, delete_, enter]);
	}, [callback]);

	useEffect(() => {
		updateScreenPrice(value.join(''));
	}, [value]);
	return (
		<Box
			flexDirection="column"
			w={'$full'}
			gap={10}
			justifyContent="space-around">
			{codes.map((list, index) => (
				<Box key={index} flexDirection="row">
					{list.map(it => {
						const code = isObject(it) ? it.key : it;
						const icon = isObject(it) ? it.icon : null;
						return (
							<KeyItem
								key={code}
								code={code}
								icon={icon}
								process={process}
							/>
						);
					})}
				</Box>
			))}
		</Box>
	);
}
