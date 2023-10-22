import { NativeModules } from 'react-native';

/**
 * 函数“isNull”检查给定目标是否为空或未定义。
 * @param {any} target - `target` 参数的类型为 `any`，这意味着它可以是任何数据类型。
 * @returns {target is null | undefined}
 */
function isNull(target: any): target is null | undefined {
	return target === void 0 || target === null;
}

function Type<T>(target: any): T {
	return target as T;
}

interface Supplier<T> {
	get(): T;
}

class Optional<T> {
	target: null | undefined | T;

	private constructor(target: null | undefined | T) {
		this.target = target;
	}

	static of<T>(target: null | undefined | T): Optional<T> {
		return new Optional(target);
	}

	get() {
		return this.target;
	}

	or(supplier: Supplier<T>): Optional<T> {
		return isNull(this.target) ? Optional.of(supplier.get()) : this;
	}

	orElse(supplier: Supplier<T>): T {
		return isNull(this.target) ? supplier.get() : this.target;
	}

	getItem(key: keyof T, defaultValue: any): any {
		return isNull(this.target) || isNull(this.target[key])
			? defaultValue
			: this.target[key];
	}

	ifPresent(consumer: (t: T) => void): void {
		if (notNull(this.target)) {
			consumer(this.target);
		}
	}
}

/**
 * 该函数检查值是否不为空或未定义。
 * @param {any} target - `target` 参数的类型为 `any`，这意味着它可以接受任何值。
 * @returns {target is NonNullable<typeof target>}
 */
function notNull<T>(target: T): target is NonNullable<T> {
	return !isNull(target);
}

/**
 * 该函数检查给定的字符串或数组是否为空。
 * @param {string | ArrayLike<any>} target - “target”参数可以是字符串或类似数组的对象。
 * @returns 一个布尔值。
 */

function isEmpty(target: string | ArrayLike<any>): target is { length: 0 } {
	return Array.isArray(target) ||
		(typeof target === 'object' && notNull(target) && 'length' in target)
		? target.length === 0
		: /^\s*$/.test(target as string);
}

/**
 * “debounce”函数是一个实用程序，可延迟函数的执行，直到自上次调用以来经过一定时间，并可选择在第一次调用时立即执行。
 * @param fn - “fn”参数是一个将在去抖动延迟后执行的函数。它可以接受任意数量的参数。
 * @param {number} [delay=3000] - “delay”参数是函数在执行去抖函数之前应等待的时间（以毫秒为单位）。如果在此延迟期间没有进行新的函数调用，则将执行去抖函数。
 * @param {boolean} [immediate=false] -
 * “immediate”参数是一个布尔值，用于确定函数是立即执行还是延迟后执行。如果“immediate”设置为“true”，函数将立即执行，然后等待延迟再执行。如果“立即”设置为“
 * @param callback - “callback”参数是一个函数，在执行去抖函数后，将使用对象参数“{ value: any
 * }”调用该函数。您可以提供自己的回调函数来执行任何其他操作或处理去抖函数的结果。
 * @returns “debounce”函数返回所提供函数的去抖版本。
 */
function debounce(
	fn: (...args: any[]) => void,
	delay: number = 3000,
	immediate: boolean = false,
	callback: (arg: { value: any }) => void = () => {}
) {
	const config: { timer: null | number | NodeJS.Timeout; value: any } = {
		timer: null,
		value: null
	};

	function runner(that: any, args: any[]): void {
		const res = fn.apply(that, args);
		callback({ value: res });
	}

	function clear() {
		if (config.timer !== null) clearTimeout(config.timer);
	}

	function result(this: any, ...args: any[]) {
		if (config.timer !== null) clearTimeout(config.timer);
		const that = this;
		config.timer = setTimeout(() => {
			runner(that, args);
		}, delay);
		if (!immediate || config.value) return;
		runner(that, args);
		config.value = true;
	}

	result.close = clear;
	return result;
}

/**
 * “throttle() 返回一个函数，该函数仅每 `delay` 毫秒执行一次。”
 *
 * `throttle()` 函数有两个参数：
 * 在执行期间有多次调用则会继续尾调用一次，保证节流的函数在delay只运行1-2次 在滚动条滚动中保证停止后调用
 *
 * 1. `fn`：节流的函数。
 * 2. `delay`：两次执行之间等待的毫秒数
 *
 * //如果多次点击我保证最后一次点击会继续更新一次，防止之前一次中确实有一次实际更新没有被加载
 * @param {Function} fn - 要节流的函数。
 * @param {number} [delay=1000] - 执行函数之前等待的时间（以毫秒为单位）。
 * @param max 超过这么多次后会继续执行
 */
function throttle<R = any | null>(
	fn: (...args: any[]) => any,
	delay: number = 1000,
	max: number = 10
): (...args: unknown[]) => R {
	let timer: unknown | null = null;
	let count = 0;
	max = Math.max(max, 1); //防止max被设置负数导致死循环

	function clear(this: any, ...args: any[]): void {
		if (count > max) {
			Promise.resolve()
				.then(() => {
					count = 0;
					return fn.apply(this, args);
				})
				.then(() => {
					clear.apply(this, args);
				});
		} else {
			timer = null;
			count = 0;
		}
	}

	return function (this: any, ...args: any[]): R {
		if (timer != null || count > 0) {
			++count; //记录当前阻塞中有多少次请求进来
			return <R>(<unknown>null);
		}

		timer = setTimeout(() => {
			clear.apply(this, args);
		}, delay);
		return fn.apply(this, args); //进来优先执行
	};
}

/**
 * 如果定时器不为null，则返回null，否则延时后将定时器设置为null，并返回函数的结果。
 * @param {(...args: any[]) => never} fn - 节流的功能。
 * @param {number} [delay=1000] - 调用函数之前等待的时间。
 * @returns 将在延迟后调用传入函数的函数。
 */
function antiShake(
	fn: (...args: any[]) => any,
	delay: number = 1000
): (...args: unknown[]) => void {
	let timer: string | number | null | NodeJS.Timeout = null;
	return function (this: any, ...args: any[]): void {
		if (notNull(timer)) {
			clearTimeout(timer as number);
		}
		timer = setTimeout(() => {
			fn.apply(this, args);
			timer = null;
		}, delay);
	};
}

/**
 * 该函数检查给定目标是否是对象。
 * @param {any} target - `target` 参数是您要检查它是否是对象的值。
 * @returns 一个布尔值。
 */
function isObject(target: any): target is object {
	return (
		notNull(target) &&
		(typeof target === 'object' || target instanceof Object)
	);
}

/**
 * 函数“isFunction”检查给定目标是否是函数。
 * @param {any} target - `target` 参数是我们要检查它是否是函数的值。
 * @returns 函数 isFunction 返回一个布尔值。
 */
function isFunction(target: any): target is Function {
	return (
		notNull(target) &&
		(typeof target === 'function' || target instanceof Function)
	);
}
/**
 * Checks if the target is a boolean.
 *
 * @param {any} target - The value to check.
 * @return {boolean} Returns true if the target is a boolean, otherwise false.
 */
function isBoolean(target: any): target is boolean {
	return typeof target === 'boolean';
}

/**
 * 它需要一个目标数组和一个源数组，并将所有值从源数组复制到目标数组
 * @param target - 目标数组
 * @param source - 源数组
 * @param conversion - 将源值转换为目标值的函数。
 */
function merge<T, U = T | unknown>(
	target: Array<T>,
	source: Array<U>,
	conversion: (e: U) => T
): Array<T>;
function merge<T extends object, U extends object>(target: T, source: U): T;
function merge<T, U>(target: T, source: U, conversion: (e: U) => T): T;

function merge<T, U>(target: T, source: U, deep: boolean): T;

/**
 * "Merge the source object into the target object, converting the source object's properties to the target
 * object's
 * properties if a conversion function is provided."
 *
 * The function is generic, so it can be used with any type of object. The first generic type parameter, T, is the
 * type of the target object. The second generic type parameter, U, is the type of the source object. The function
 * returns the target object
 * @param {T} target - The object to merge into.
 * @param {U} source - The source object to merge into the target object.
 * @param [conversion] - A function that converts the source object to the target object.
 * @readonly 两个待合并的对象应该保持类型一致
 * @returns The target object.
 */
function merge<T, U>(
	target: T,
	source: U,
	conversion?: ((e: U) => T) | boolean
): T {
	const isObject_1 = isObject(target);
	const isObject_2 = isObject(source);
	if (isObject_1 && isObject_2) {
		const isb: boolean = isFunction(conversion);
		const isDeep: boolean =
			!isb && isBoolean(conversion) && (conversion as boolean);
		if (Array.isArray(target) && Array.isArray(source)) {
			target.length = 0;
			for (let i = 0; i < source.length; ++i) {
				if (isb) {
					target.push(
						(conversion as (...args: any[]) => T)(source[i]) ??
							<T>(<unknown>source[i])
					);
				} else {
					target.push(<T>(<unknown>source[i]));
				}
			}
			return target;
		}
		const keys: (string | symbol)[] = Reflect.ownKeys(
			<object>(<unknown>source)
		);
		for (const key of keys) {
			const value: U = <U>Reflect.get(<object>(<unknown>source), key);
			if (isb) {
				Reflect.set(
					<object>(<unknown>target),
					key,
					(conversion as (...args: any[]) => T)(value) ??
						value ??
						Reflect.get(<object>(<unknown>target), key)
				);
			} else if (isDeep) {
				Reflect.set(
					<object>(<unknown>target),
					key,
					merge(
						Reflect.get(<object>(<unknown>target), key),
						value,
						isDeep
					)
				);
			} else {
				Reflect.set(
					<object>(<unknown>target),
					key,
					value ?? Reflect.get(<object>(<unknown>target), key)
				);
			}
		}
		return target;
	} else {
		if (!isObject_1 && !isObject_2) {
			return isFunction(conversion)
				? (conversion as (...args: any[]) => T)(source)
				: ((<unknown>source) as T);
		} else {
			//对象转换有歧义
			return isFunction(conversion)
				? (conversion as (...args: any[]) => T)(source)
				: target;
		}
	}
}

function copyWith<T, R>(target: T, ...source: R[]): T;
function copyWith<T, R>(target: T, source: R): T;
/**
 * 它将源对象的所有属性复制到目标对象，并返回目标对象
 * @param {T} target - 要将属性复制到的目标对象。
 * @param {R} source - 要从中复制的源对象。
 * @returns 带有两个参数（目标和源）并返回目标的函数。
 */
function copyWith<T, R>(target: T, source: R | R[]): T {
	if (!isObject(target) || !isObject(source)) return target;
	if (Array.isArray(source)) {
		return source.reduce(
			(previousValue: T, currentValue: R) =>
				copyWith(previousValue, currentValue),
			target
		);
	}
	const keys: (string | symbol)[] = Reflect.ownKeys(
		(<unknown>source) as object
	);

	for (const propertyKey of keys) {
		Reflect.set(
			<object>target,
			propertyKey,
			Reflect.get(<object>source, propertyKey)
		);
	}
	return target;
}

function deleteKeys(target: object, keys: string[]): object {
	if (isNull(target)) return target;
	const keyMap: Record<string, boolean> = {};
	for (const key of keys) {
		keyMap[key.toLowerCase()] = true;
	}
	for (const key of Object.keys(target)) {
		if (keyMap[key.toLowerCase()]) {
			Reflect.deleteProperty(target, key);
		}
	}

	return target;
}
/**
 * Generates URL parameters from an object.
 *
 * @param {Record<string, string>} obj - The object to convert to URL parameters.
 * @return {string} - The URL parameters generated from the object.
 */
function objectToUrlParams(obj: Record<string, string>): string {
	if (!isObject(obj)) return obj;
	return Object.keys(obj)
		.map(
			key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`
		)
		.join('&');
}

function isString(target: any): target is string {
	return typeof target === 'string';
}

function toArray(target: any): Array<any> {
	return Array.from(Array.isArray(target) ? target : [target]);
}

interface Valid {
	(target: any, setMessage: (msg: string) => void): boolean;
}

interface DateValid {
	key: string;
	valid: Valid | Valid[];
	message: string;
}
function valid(
	target: Record<string, any>,
	valid: DateValid[],
	error: (msg: string) => void
): boolean {
	const keys = Object.keys(target);
	for (const key of keys) {
		const findLast = valid.findIndex(
			(item: DateValid) =>
				item.key.toLowerCase().localeCompare(key.toLowerCase()) === 0
		);
		if (findLast === -1) continue;
		let errorInfo = valid[findLast].message;
		const curValidFun = valid[findLast].valid;
		const validFunc = Array.isArray(curValidFun)
			? Array.from(curValidFun)
			: Array.from([curValidFun]);
		const validResult = validFunc.some((validFun: Valid) =>
			validFun(target[key], msg => (errorInfo = msg))
		);
		if (validResult) {
			error(errorInfo);
			return false;
		}
	}
	return true;
}
function yearIndex(year: number): number {
	return year - 1970;
}

function formatTime(num: number | string): string {
	return num.toString().padStart(2, '0');
}

/**
 *
 * @param arr 目标数组
 * @param target 目标值
 * @param compareTo 比较函数
 * @param update 更新函数,自定义如何插入到函数中
 * @returns 插入位置
 */
function binaryInsert<T>(
	arr: T[],
	target: T | any,
	compareTo: (prev: T, next: T | any) => number,
	update: (arr: T[], index: number, target: T | any, has: boolean) => void
): number {
	let left: number = 0;
	let right: number = arr.length - 1;
	let mid: number;

	while (left <= right) {
		mid = (left + right) >> 1;
		const c = compareTo(arr[mid], target);
		if (c === 0) {
			// 目标值已存在于数组中，直接返回插入位置
			update(arr, mid, target, true);
			return mid;
		} else if (c < 0) {
			left = mid + 1;
		} else {
			right = mid - 1;
		}
	}
	update(arr, left, target, false);
	// 插入目标值到合适的位置
	return left;
}

function evalFunction(this: any, target: any, ...args: any[]) {
	return typeof target === 'function' ? target.apply(this, args) : target;
}

/**
 * 函数“runAsync”使用“MultiThreadManager”模块在多线程环境中执行回调函数。
 * @param callback - “callback”参数是将异步执行的函数。它不接受任何参数，也不返回任何值。
 */
function runAsync(callback: () => void) {
	NativeModules.MultiThreadManager.performMultiThreadTask(callback);
}

/**
 * `Options` 函数提供了一种处理 TypeScript 中可选值的方法，允许用户指定默认值或后备函数。
 * @param {any | null | undefined} target - `target` 参数是您要执行操作的值。它可以是任何类型，包括“any”、“null”或“undefined”。
 * @returns `Options` 函数返回一个具有四个方法的对象：`or`、`orElse`、`get` 和 `value`。
 */
function Options<T>(target: any | null | undefined) {
	let val = target;
	return {
		or(value: T | (() => T)) {
			val = isNull(val) ? evalFunction(value) : val;
			return this;
		},
		orElse(value: T | (() => T)): T {
			return isNull(val) ? evalFunction(value) : val;
		},
		get(): T {
			return val;
		},
		get value(): T {
			return val;
		}
	};
}

/**
 * 函数defaultSafeAdd 将两个数字作为输入并返回它们的和。
 * @param {number} a - number - 要添加的第一个数字
 * @param {number} b - 数字
 * @returns 返回两个输入数字“a”和“b”的总和。
 */
function defaultSafeAdd(a: number, b: number) {
	return a + b;
}

/**
 * 该函数从第一个数字中减去第二个数字并返回结果。
 * @param {number} a - 要减去的第一个数字。
 * @param {number} b - 参数“b”是减数，它是从被减数（参数“a”）中减去的数字。
 * @returns 从“a”减去“b”的结果。
 */
function defaultSafeSubtrahend(a: number, b: number) {
	return a - b;
}

/**
 * safeOperation 函数对两个数字执行数学运算，同时保证结果的精度。
 * @param {number} num1 - 表示运算的第一个操作数的数字。
 * @param {number} num2 - num2 是一个将在运算中用作操作数的数字。
 * @param operator - “operator”参数是一个函数，它接受两个数字（“num1”和“num2”）作为输入并返回一个数字作为输出。它可以是任何数学运算，例如加法、减法、乘法或除法。
 * @returns 所提供的运算符函数执行的操作的结果。
 */
function safeOperation(
	num1: number,
	num2: number,
	operator: (num1: number, num2: number) => number
): number {
	return (
		operator(
			parseInt((num1 * 100).toFixed(0)),
			parseInt((num2 * 100).toFixed(0))
		) / 100
	);
}

safeOperation.subtrahend = defaultSafeSubtrahend;
safeOperation.add = defaultSafeAdd;

function to_money(money: number, next: number): number {
	return (
		(parseInt((money * 100).toFixed(0)) +
			parseInt((next * 100).toFixed(0))) /
		100
	);
}

/**
 * “calculate”函数将数学表达式作为字符串进行计算并返回结果。
 * @param {string} expression - 表达式参数是表示数学表达式的字符串。它可以包含数字、加法 (+) 和减法 (-) 运算符以及空格。
 * @returns 一个数字，它是计算给定表达式的结果。
 */
function calculateExpression(expression: string): number {
	// 提取数字
	const numbers: number[] = expression
		.match(/[-+]?\d+(\.\d+)?/g)!
		.map(Number);

	return safeOperation(numbers[0], numbers[1], (a, b) => a + b);
}
/**
 * Generates a unique identifier using the UUID v4 format.
 *
 * @return {string} The generated unique identifier.
 */

/**
 * Generates a unique identifier using the UUID v4 format.
 *
 * @return {string} The generated unique identifier.
 */
function generateId(): string {
	const uuidFormat: string = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
	const uuid: string = uuidFormat.replace(/[xy]/g, (char: string) => {
		const randomDigit: number = (Math.random() * 16) | 0;
		const digit: number =
			char === 'x' ? randomDigit : (randomDigit & 0x3) | 0x8;
		return digit.toString(16);
	});

	return uuid;
}

function isType<R>(target: any, source: R): target is R {
	return target === source;
}

//判断对象是否是数组
function isArray(target: any): target is Array<any> {
	return (
		Array.isArray(target) ||
		(typeof target === 'object' && Reflect.has(target, 'length'))
	);
}

/**
 * Executes the given function and records the time it takes to run.
 *
 * @param {() => void} func - The function to be executed and timed.
 * @param {string} [message] - An optional message to be displayed.
 * @return {void} - This function does not return a value.
 */
function timeRecordingFunction(func: () => void, message?: string): void {
	if (__DEV__) {
		const start = Date.now();
		func();
		const time = Date.now() - start;
		if (typeof message === 'string') {
			message = message.replace('$0', String(time));
		}
		console.log(
			`%c 当前函数运行时间${time}ms 🍏`,
			'color:#ea7e5c',
			message
		);
	} else {
		func();
	}
}

/**
 * Logs a message on the development environment.
 *
 * @param {string} message - The message to be logged.
 */
function logOnDev(message: string) {
	if (__DEV__) console.log(`%c  🍏`, 'color:#ea7e5c', message);
}

export {
	Options,
	antiShake,
	binaryInsert,
	calculateExpression,
	copyWith,
	debounce,
	defaultSafeAdd,
	defaultSafeSubtrahend,
	deleteKeys,
	evalFunction,
	formatTime,
	generateId,
	Type,
	isArray,
	isBoolean,
	isEmpty,
	isFunction,
	isNull,
	isObject,
	isString,
	merge,
	notNull,
	objectToUrlParams,
	runAsync,
	safeOperation,
	throttle,
	toArray,
	to_money,
	valid,
	yearIndex,
	isType,
	Optional,
	timeRecordingFunction,
	logOnDev
};
