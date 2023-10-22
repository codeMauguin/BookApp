import {
	Actionsheet,
	ActionsheetBackdrop,
	ActionsheetContent,
	ActionsheetDragIndicatorWrapper,
	ActionsheetDragIndicator,
	Heading,
	HStack,
	Text
} from '@gluestack-ui/themed';
import React, { useCallback, useImperativeHandle } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '@rneui/themed';
import { BaseRef } from 'types/entity';
interface DateSelectionRef extends BaseRef {}
type DateSelectionProps = {
	time: Date;
	callback?: (time: Date) => void;
};

export type { DateSelectionRef, DateSelectionProps };

export default React.forwardRef<DateSelectionRef, DateSelectionProps>(
	(props, ref) => {
		useImperativeHandle(ref, () => ({
			open: () => setShowActionsheet(true),
			close: () => setShowActionsheet(false)
		}));
		const [showActionsheet, setShowActionsheet] =
			React.useState<boolean>(false);

		const commit = useCallback((time: Date) => {
			props.callback?.(time);
			setShowActionsheet(false);
		}, []);

		return (
			<>
				<Actionsheet
					isOpen={showActionsheet}
					snapPoints={[60]}
					closeOnOverlayClick
					onClose={() => setShowActionsheet(false)}>
					<ActionsheetBackdrop />
					<ActionsheetContent>
						<ActionsheetDragIndicatorWrapper>
							<ActionsheetDragIndicator />
						</ActionsheetDragIndicatorWrapper>
						<HStack
							justifyContent="space-between"
							w={'$full'}
							alignItems="center">
							<Heading alignSelf="center">选择时间</Heading>
							<Button
								onPress={() => setShowActionsheet(false)}
								title={'关闭'}
								type="clear"
							/>
						</HStack>
						<DateTimePicker
							testID="dateTimePicker"
							display="inline"
							locale="zh"
							onChange={(_, date: Date | undefined) => {
								props.callback?.(date);
							}}
							style={{
								width: '100%',
								height: '100%'
							}}
							value={props.time}
							mode="datetime"
						/>
					</ActionsheetContent>
				</Actionsheet>
			</>
		);
	}
);
