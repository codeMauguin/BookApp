import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
	Heading,
	Box,
	Input,
	InputField
} from '@gluestack-ui/themed';
import Keyboard from 'Views/Create/sub/Keyboard';
import { KeyboardCode } from 'Views/Create/utils/type';
import React, { useImperativeHandle } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BaseRef } from 'types/entity';
import { isEmpty } from 'utils/types';
type KeyboardInputProps = {
	title: string;
	allowNegative?: boolean;
	callback?: (val: number) => void;
};
interface KeyboardInputRef extends BaseRef {}

export type { KeyboardInputRef, KeyboardInputProps };

export default React.forwardRef<KeyboardInputRef, KeyboardInputProps>(
	(props, ref) => {
		const [showActionsheet, setShowActionsheet] =
			React.useState<boolean>(false);
		const [screen_price, setScreenPrice] = React.useState<string>('');
		useImperativeHandle(ref, () => ({
			open: () => setShowActionsheet(true),
			close: () => setShowActionsheet(false)
		}));
		function submit(val: number) {
			props.callback?.(val);
			setShowActionsheet(false);
		}
		return (
			<>
				<Actionsheet
					isOpen={showActionsheet}
					snapPoints={[35]}
					closeOnOverlayClick
					onClose={() => setShowActionsheet(false)}>
					<ActionsheetBackdrop />
					<ActionsheetContent h={'35%'}>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator />
						</ActionsheetDragIndicatorWrapper>
						<Heading>{props.title}</Heading>
						<Input
							borderWidth={0}
							bg="$secondary100"
							isDisabled
							rounded={'$lg'}>
							<InputField
								color="$black"
								value={
									isEmpty(screen_price)
										? '0.00'
										: screen_price
								}
							/>
						</Input>
						<Box
							w="$full"
							flex={1}
							pb={10}
							justifyContent="flex-end">
							<Keyboard
								callback={submit}
								updateScreenPrice={setScreenPrice}
								allowNegative={props.allowNegative}
							/>
						</Box>
					</ActionsheetContent>
				</Actionsheet>
			</>
		);
	}
);
