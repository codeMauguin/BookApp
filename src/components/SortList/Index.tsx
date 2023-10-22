import React, { useRef, useState } from 'react';
import { LayoutChangeEvent, Vibration } from 'react-native';
import {
	GestureHandlerRootView,
	PanGestureHandler
} from 'react-native-gesture-handler';
import Animated, {
	SharedValue,
	cancelAnimation,
	runOnJS,
	scrollTo,
	useAnimatedReaction,
	useAnimatedRef,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming
} from 'react-native-reanimated';
import { useAnimatedGestureHandler } from 'react-native-reanimated';
import { GestureHandlerEvent } from 'react-native-reanimated/lib/typescript/reanimated2/hook';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function listToObject<T extends object, R extends keyof T>(
	dadas: T[],
	keyExecutor: (item: T) => string | number
) {
	return dadas.reduce(
		(object, item, index) => {
			Reflect.set(object, keyExecutor(item) as any, index);
			return object;
		},
		{} as Record<T[R] extends string ? T[R] : never, number>
	);
}
/**
 * @example function Item<T extends object>(props: SortListItemProps<T>) {
	const animateStyle = useAnimatedStyle(
		() => ({
			transform: [{ scale: withTiming(props.isMoving ? 1.07 : 1) }]
		}),
		[props.isMoving]
	);
	return (
		<Animated.View
			style={[
				{
					height: 100,
					borderWidth: 1,
					width: '80%',
					alignSelf: 'center'
				},
				animateStyle
			]}
		>
			<Text>{JSON.stringify(props.item)}</Text>
			<SortList.Drag trigger={props.trigger}>
				<Pressable>
					<Text>拖拽我</Text>
				</Pressable>
			</SortList.Drag>
		</Animated.View>
	);
}

 * 
 */

function clamp(value: number, low_bound: number, upper_bound: number) {
	'worklet';
	return Math.min(Math.max(value, low_bound), upper_bound);
}

function objectMove(
	obj: { [key: string]: number },
	oldIndex: number,
	newIndex: number
): any {
	'worklet';
	const newObjects = { ...obj };
	for (const id in obj) {
		if (obj[id] === oldIndex) {
			newObjects[id] = newIndex;
		}
		if (obj[id] === newIndex) {
			newObjects[id] = oldIndex;
		}
	}
	return newObjects;
}
function MoveItem<T extends object, R extends keyof T>({
	positions,
	id,
	scrollY,
	item,
	renderItem: RenderItem,
	length,
	callback,
	height,
	SCROLL_THRESHOLD,
	space,
	containerHeight,
	isScroll
}: {
	id: string | number;
	positions: SharedValue<Record<string | number, number>>;
	scrollY: SharedValue<number>;
	item: T;
	renderItem: React.ComponentType<SortListItemProps<T>>;
	length: number;
	callback?: (indexes: { [key: string | number]: number }) => void;
	height: number;
	SCROLL_THRESHOLD: number;
	space: number;
	containerHeight: SharedValue<number>;
	isScroll: React.MutableRefObject<boolean>;
}) {
	const [status, setMove] = useState<boolean>(false);
	const initValue = positions.value[id] * (height + space);
	const top = useSharedValue(initValue);
	useAnimatedReaction(
		() => positions.value[id],
		(prev, next) => {
			if (prev !== next) {
				if (!status) {
					top.value = withSpring((height + space) * prev, {
						mass: 0.5
					});
				}
			}
		},
		[status]
	);

	const gestureHandler = useAnimatedGestureHandler({
		onStart() {
			isScroll.current = true;
			runOnJS(setMove)(true);
		},
		onActive({ translationY }, ctx) {
			const positionY = initValue + translationY;
			const contentHeight = (height + space) * length;
			const scrollMaxHeight = contentHeight - containerHeight.value;
			if (scrollMaxHeight > 0) {
				if (positionY <= scrollY.value + SCROLL_THRESHOLD) {
					scrollY.value = withTiming(0, {
						duration: 3000
					});
				} else if (
					positionY >=
					scrollY.value + containerHeight.value - SCROLL_THRESHOLD
				) {
					scrollY.value = withTiming(scrollMaxHeight, {
						duration: 3000
					});
				} else {
					cancelAnimation(scrollY);
				}
			}
			top.value = withTiming(initValue + translationY, {
				duration: 16.66
			});
			const newPosition = clamp(
				Math.floor(positionY / (height + space)),
				0,
				length - 1
			);

			if (newPosition !== positions.value[id]) {
				positions.value = objectMove(
					positions.value,
					positions.value[id],
					newPosition
				);
				runOnJS(Vibration.vibrate)();
			}
		},
		onFinish() {
			top.value = withTiming(positions.value[id] * (height + space));
			cancelAnimation(scrollY);
			runOnJS(setMove)(false);
			isScroll.current = false;
			if (callback) {
				runOnJS(callback)(positions.value);
			}
		}
	});

	const animateStyle = useAnimatedStyle(() => ({
		position: 'absolute',
		left: 0,
		right: 0,
		top: top.value,
		zIndex: status ? 999 : 0
	}));
	return (
		<Animated.View style={animateStyle}>
			<Animated.View>
				<RenderItem
					item={item}
					trigger={gestureHandler}
					isMoving={status}
				/>
			</Animated.View>
		</Animated.View>
	);
}

type SortListProps<T extends object> = {
	itemHeight: number;
	data: T[];
	keyExecutor: (item: T) => string | number;
	space?: number;
	callback?: (indexes: Record<string | number, number>) => void;
	scrollThrottleHeight?: number;
	renderItem: React.ComponentType<SortListItemProps<T>>;
};

type SortListItemProps<T extends object> = {
	item: T;
	isMoving: boolean;
	trigger: (e: GestureHandlerEvent<any>) => void;
};
export type { SortListItemProps, SortListProps };
export default function SortList<T extends object>(props: SortListProps<T>) {
	const positions = useSharedValue(
		listToObject(
			props.data,
			props.keyExecutor || ((item: T) => ('id' in item ? item.id : item))
		)
	);
	const scrollViewRef = useAnimatedRef<any>();
	const scrollY = useSharedValue(0);
	useAnimatedReaction(
		() => scrollY.value,
		scrolling => scrollTo(scrollViewRef, 0, scrolling, false)
	);
	const isScroll = useRef<boolean>(false);

	const handleScroll = useAnimatedScrollHandler(
		(event: { contentOffset: { y: number } }) => {
			if (isScroll) return;
			scrollY.value = event.contentOffset.y;
		}
	);
	const containerHeight = useSharedValue(0);

	const height = props.itemHeight ?? 100;
	const totalHeight = (height + (props.space ?? 0)) * props.data.length;
	const space = props.space ?? 0;

	return (
		<GestureHandlerRootView>
			<Animated.ScrollView
				onLayout={(event: LayoutChangeEvent) => {
					containerHeight.value = event.nativeEvent.layout.height;
				}}
				ref={scrollViewRef}
				style={{
					position: 'relative',
					backgroundColor: 'white'
				}}
				onScroll={handleScroll}
				scrollEventThrottle={16.66}
				contentContainerStyle={{
					height: totalHeight
				}}>
				{props.data.map(item => (
					<MoveItem
						key={props.keyExecutor(item) as string | number}
						id={props.keyExecutor(item) as never}
						positions={positions as any}
						scrollY={scrollY}
						item={item}
						length={props.data.length}
						callback={props.callback}
						renderItem={props.renderItem as any}
						height={height}
						SCROLL_THRESHOLD={
							props.scrollThrottleHeight ?? height + space
						}
						space={space}
						containerHeight={containerHeight}
						isScroll={isScroll}
					/>
				))}
			</Animated.ScrollView>
		</GestureHandlerRootView>
	);
}
function Drag({
	trigger,
	children
}: {
	trigger: (e: GestureHandlerEvent<any>) => void;
	children: React.ReactNode;
}) {
	return (
		<PanGestureHandler onGestureEvent={trigger}>
			<Animated.View>{children}</Animated.View>
		</PanGestureHandler>
	);
}
SortList.Drag = Drag;
