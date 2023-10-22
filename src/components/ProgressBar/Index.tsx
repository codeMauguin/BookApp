import { View } from '@gluestack-ui/themed';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useRef } from 'react';
import {
	GestureResponderEvent,
	LayoutChangeEvent,
	PanResponder,
	PanResponderGestureState,
	StyleProp,
	StyleSheet,
	ViewStyle
} from 'react-native';
import Animated from 'react-native-reanimated';
import { notNull } from 'utils/types';
import { Tooltip, Text, lightColors } from '@rneui/themed';
import { Dimensions, ScrollView } from 'react-native';

export type ProgressBarProps = {
	style?: StyleProp<ViewStyle>;
	indicatorStyle?: StyleProp<ViewStyle>;
	min?: number;
	max?: number;
	value?: number;
	onChange?: (value: number) => void;
};

export default function (props: ProgressBarProps) {
	const [progress, setProgress] = React.useState<number>(0);
	const x = useRef<number>(0);
	const _min = useRef<number>(0);
	const _max = useRef<number>(100);
	const [height, setHeight] = React.useState<number>(0);
	const _width = useRef<number>(0);

	function set(value: number) {
		setProgress(p =>
			value >= 0 && value <= 100 ? value : value < 0 ? 0 : 100
		);
	}
	const layout = ({
		nativeEvent: {
			layout: { width: __width, x: _x, height }
		}
	}: LayoutChangeEvent) => {
		width.current = __width;
		x.current = _x;
		_width.current = height / 2;
		setHeight(height);
		const { min, max, value = 0 } = props ?? {};
		if (notNull(min)) {
			_min.current = min;
		}
		if (notNull(max)) {
			_max.current = max;
		} else {
			_max.current = _min.current + 100;
		}
		if (_max.current <= _min.current)
			new Error('进度条最大值不能超过最小值');
		if (notNull(value)) {
			set((value / (_max.current - _min.current)) * 100);
		}
	};

	const width = useRef<number>(0);

	const pan = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderMove: (
				e: GestureResponderEvent,
				gestureState: PanResponderGestureState
			) => {
				const newProgress =
					((gestureState.moveX - x.current - _width.current * 2) /
						width.current) *
					100;
				setProgress(
					newProgress >= 0 && newProgress <= 100
						? newProgress
						: newProgress < 0
						? 0
						: 100
				);
				const value = parseFloat(
					(
						((_max.current - _min.current) * newProgress) / 100 +
						_min.current
					).toFixed(2)
				);

				props?.onChange?.(
					Math.min(_max.current, Math.max(_min.current, value))
				);
			}
		})
	);

	return (
		<Animated.View
			onLayout={layout}
			style={[props.style, styles.container]}
		>
			<View
				style={[
					styles.progressBar,
					{
						width: `${
							progress + (_width.current / width.current) * 100
						}%`
					}
				]}
			></View>

			<Animated.View
				{...pan.current.panHandlers}
				style={[
					styles.progressBarIndicator,
					{
						transform: [
							{
								translateX: Math.max(
									Math.min(
										(width.current * progress) / 100,
										width.current - height
									),
									0
								)
							}
						]
					},
					{
						width: height,
						height: height
					},
					props.indicatorStyle
				]}
			/>
		</Animated.View>
	);
}
const styles = StyleSheet.create({
	container: {
		height: 20,
		width: 'auto',
		backgroundColor: '#E0E0E0',
		borderRadius: 50,
		overflow: 'hidden'
	},
	progressBar: {
		height: '100%',
		backgroundColor: '#2196F3'
	},
	progressBarIndicator: {
		left: 0,
		position: 'absolute',
		backgroundColor: 'red',
		aspectRatio: 1,
		borderRadius: 50
	}
});
