import { Button } from '@rneui/themed';
import React, { Component, useCallback, useRef, useState } from 'react';
import {
	LayoutChangeEvent,
	Text,
	View,
	useWindowDimensions
} from 'react-native';
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
import {
	SafeAreaProvider,
	SafeAreaView,
	useSafeAreaInsets
} from 'react-native-safe-area-context';
import { notNull } from 'utils/types';
type ListItem = {
	id: string;
};

interface ListToObjectProps {
	list: ListItem[];
}

function listToObject<T extends object, R extends keyof T>(
	datas: T[],
	keyExector: (item: T) => T[R]
) {
	return datas.reduce((object, item, index) => {
		Reflect.set(object, keyExector(item) as any, index);
		return object;
	}, {} as Record<T[R] extends string ? T[R] : never, number>);
}

function Item<T extends object>(props: SortListItemProps<T>) {
	return (
		<View style={{ height: 100, borderWidth: 1 }}>
			<Text>{JSON.stringify(props.item)}</Text>
		</View>
	);
}

function clamp(value: number, lowbound: number, upperbound: number) {
	'worklet';
	return Math.min(Math.max(value, lowbound), upperbound);
}

const data = Array.from({ length: 20 }).map((_, index) => ({
	id: index
}));
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
	id: T[R];
	positions: SharedValue<
		Record<T[keyof T] extends string ? T[keyof T] : never, number>
	>;
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
	const top = useSharedValue(positions.value[id] * (height + space));
	useAnimatedReaction(
		() => positions.value[id],
		(prev, next) => {
			if (prev !== next) {
				if (!status) {
					top.value = withSpring((height + space) * prev);
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
		onActive({ absoluteY }) {
			const positionY = absoluteY + scrollY.value;
			if (positionY <= scrollY.value + SCROLL_THRESHOLD) {
				scrollY.value = withTiming(0, {
					duration: 3000
				});
			} else if (
				positionY >=
				scrollY.value + containerHeight.value - SCROLL_THRESHOLD
			) {
				const contentHeight = (height + space) * length;
				const scrollMaxHeight = contentHeight - containerHeight.value;
				scrollY.value = withTiming(scrollMaxHeight, { duration: 3000 });
			} else {
				cancelAnimation(scrollY);
			}
			top.value = withTiming(positionY - height, { duration: 16.66 });
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
			}
		},
		onFinish() {
			top.value = withTiming(positions.value[id] * (height + space));
			runOnJS(setMove)(false);
			isScroll.current = false;
			if (callback) {
				runOnJS(callback)(positions.value);
			}
		}
	});

	const animateStyle = useAnimatedStyle(
		() => ({
			position: 'absolute',
			left: 0,
			right: 0,
			top: top.value,
			zIndex: status ? 1 : 0,
			shadowColor: '#000',
			backgroundColor: 'white',
			shadowOffset: {
				width: 0,
				height: 0
			},
			shadowOpacity: withSpring(status ? 0.3 : 0),
			shadowRadius: 10
		}),
		[status]
	);
	return (
		<Animated.View style={animateStyle}>
			<PanGestureHandler onGestureEvent={gestureHandler}>
				<Animated.View>
					<RenderItem item={item} isMoving={status} />
				</Animated.View>
			</PanGestureHandler>
		</Animated.View>
	);
}

type SortListProps<T extends object> = {
	itemHeight: number;
	data: T[];
	keyExecutor: <R extends keyof T>(item: T) => T[R];
	space?: number;
	callback?: (indexes: { [key: string | number]: number }) => void;
	scrollThrottleHeight?: number;
	renderItem: React.ComponentType<SortListItemProps<T>>;
};

type SortListItemProps<T extends object> = {
	item: T;
	isMoving: boolean;
};

function App<T extends object>(props: SortListProps<T>) {
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
	return (
		<SafeAreaProvider>
			<SafeAreaView style={{ flex: 1 }}>
				<GestureHandlerRootView>
					<Animated.ScrollView
						onLayout={(event: LayoutChangeEvent) => {
							containerHeight.value =
								event.nativeEvent.layout.height;
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
						}}
					>
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
									props.scrollThrottleHeight ??
									height + (props.space ?? 0)
								}
								space={props.space ?? 0}
								containerHeight={containerHeight}
								isScroll={isScroll}
							/>
						))}
					</Animated.ScrollView>
				</GestureHandlerRootView>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

export default function () {
	const [dates, setData] = useState<any[]>(data);

	const i = (val: ArrayLike<unknown> | { [s: string]: unknown }) => {
		setData(prev => {
			console.log('%c Line:298 🍏 prev', 'color:#fca650', prev);
			const list: any[] = [];
			for (const [key, index] of Object.entries(val)) {
				console.log('%c Line:300 🍆 key', 'color:#7f2b82', key);
				list[index] = prev.find(it => it.id == key)!;
			}
			return list;
		});
	};
	const callback = useCallback(
		(val: ArrayLike<unknown> | { [s: string]: unknown }) => {
			setData(prev => {
				console.log('%c Line:298 🍏 prev', 'color:#fca650', prev);
				const list: any[] = [];
				const cache = prev.reduce((a, b) => {
					a[b.id] = b;
					return a;
				}, {});
				for (const [key, index] of Object.entries(val)) {
					list[index] = cache[key];
				}
				return list;
			});
		},
		[]
	);
	return (
		<App
			data={dates}
			renderItem={Item}
			itemHeight={100}
			space={10}
			callback={callback}
			keyExecutor={it => it.id}
		/>
	);
}
