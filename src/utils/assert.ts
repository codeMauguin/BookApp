import { isEmpty, notNull } from './types';

/**
 * Checks if the actual value is strictly equal to the expected value.
 *
 * @param {unknown} actual - The actual value to be checked.
 * @param {T} expected - The expected value.
 * @param {string | Error} [message] - An optional message to be thrown if the values are not equal.
 * @return {void}
 */
function strictEqual<T>(
	actual: unknown | null | undefined,
	expected: T,
	message?: string | Error
): asserts actual is T {
	const result = actual === expected;
	if (!result) {
		throw message;
	}
}
function strictLength(
	actual: ArrayLike<any> | null | undefined,
	length: number,
	message?: string | Error
): asserts actual is ArrayLike<any> & { length: number } {
	const result = notNull(actual) && actual.length === length;
	if (!result) {
		throw message;
	}
}
function strictNotEmpty(
	actual: ArrayLike<any> | string | null | undefined,
	message?: string | Error
): asserts actual is ArrayLike<any> & { length: number } {
	const result = notNull(actual) && !isEmpty(actual);
	if (!result) {
		throw message;
	}
}

function strictNotNull<T>(
	actual: T | null | undefined,
	message?: string | Error
): asserts actual is NonNullable<T> {
	const result = notNull(actual);
	if (!result) {
		throw message;
	}
}
export { strictNotNull, strictEqual, strictLength, strictNotEmpty };
