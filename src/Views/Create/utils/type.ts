import { isEmpty, isNull, notNull, safeOperation } from 'utils/types';
import React, { SetStateAction } from 'react';

type KeyboardCode = number | string;

enum KeyboardResult {
	success = 0,
	replace = 1,
	fail = 2,
	delete = 3,
	calculate = 4,
	finish = 5
}

interface KeyboardInputType {
	validate: (value: KeyboardCode) => boolean;
	input: (value: KeyboardCode) => void;
}
class OperationImplementationClass implements KeyboardInputType {
	public input(value: KeyboardCode): void {
		this.#value((val: KeyboardList[]) => {
			if (isNull(val) || isEmpty(val)) {
				const arr = new KeyboardList();
				arr.push(value);
				return [arr];
			}
			const last = val.at(-1);
			if (!isNull(last) && isEmpty(last)) {
				last.symbol = value === '+' ? 0x2 : 0x3;
				return [...val];
			}
			if (last?.length === 1 && /[+-]/.test(last!.at(0)!.toString())) {
				last.symbol = value === '+' ? 0x2 : 0x3;
				return [...val];
			}
			const next = new KeyboardList();
			next.symbol = value === '+' ? 0x2 : 0x3;
			val.push(next);
			return [...val];
		});
	}
	validate(value: KeyboardCode): boolean {
		return /[+-]/.test(value.toString());
	}
	readonly #value: React.Dispatch<SetStateAction<KeyboardList[]>>;

	constructor(setValue: React.Dispatch<SetStateAction<KeyboardList[]>>) {
		this.#value = setValue;
	}
}

class DeleteImplementationClass implements KeyboardInputType {
	public input(value: KeyboardCode): void {
		this.#value((val: KeyboardList[]) => {
			if (isNull(val) || isEmpty(val)) {
				return val;
			}
			const last = val.at(-1);
			if (!isNull(last) && isEmpty(last)) {
				if (last.symbol !== 0x1) {
					last.symbol = 0x1;
					return [...val];
				}
				return val.slice(0, -1);
			}
			last?.splice(-1, 1);

			return [...val];
		});
	}
	readonly #value: React.Dispatch<SetStateAction<KeyboardList[]>>;

	constructor(setValue: React.Dispatch<SetStateAction<KeyboardList[]>>) {
		this.#value = setValue;
	}
	public validate(value: KeyboardCode): boolean {
		return /del/.test(value.toString());
	}
}

function toValue(value: KeyboardList): number {
	return (value.symbol === 0x3 ? -1 : 1) * +parseFloat(value.join(''));
}
class EnterImplementationClass implements KeyboardInputType {
	readonly #value: React.Dispatch<SetStateAction<KeyboardList[]>>;

	readonly callback: (value: number) => void;
	constructor(
		value: React.Dispatch<SetStateAction<KeyboardList[]>>,
		callback: (value: number) => void
	) {
		this.#value = value;
		this.callback = callback;
	}
	input = (value: KeyboardCode): void => {
		this.#value((val: KeyboardList[]) => {
			const price = val.reduce(
				(a, b) => safeOperation(a, toValue(b), safeOperation.add),
				0
			);
			this.callback(price);
			return val;
		});
	};
	validate = (value: KeyboardCode): boolean => {
		return /ok/.test(value.toString());
	};
}

class CalculateImplementationClass implements KeyboardInputType {
	input = async (value: KeyboardCode): Promise<KeyboardResult> => {
		//计算价格
		return KeyboardResult.finish;
	};
	public validate(value: KeyboardCode): boolean {
		return /=/.test(value.toString());
	}
}

class KeyboardList extends Array<KeyboardCode> {
	constructor(arrayLength?: number) {
		if (notNull(arrayLength)) {
			super(arrayLength);
		} else {
			super();
		}
	}

	isDecimal: boolean = false;
	//positiveNumber  0x1 0x2
	//negative 0x3
	symbol: number = 0x1;
	toString(): string {
		if (this.symbol === 0x1) {
			return this.join('');
		} else {
			return `${this.symbol === 0x2 ? '+' : '-'}${this.join('')}`;
		}
	}
}

class DigitalImplementationClass implements KeyboardInputType {
	readonly #value: React.Dispatch<SetStateAction<KeyboardList[]>>;

	constructor(setValue: React.Dispatch<SetStateAction<KeyboardList[]>>) {
		this.#value = setValue;
	}

	public input(value: KeyboardCode): void {
		// 01
		// 0.111
		this.#value((val: KeyboardList[]) => {
			if (isNull(val) || isEmpty(val)) {
				const arr = new KeyboardList();
				arr.push(value);
				return [arr];
			}
			const el = val.at(-1);
			if (el?.isDecimal && el.at(-3) === '.') {
				return val;
			}
			if (!el?.isDecimal && el?.length === 1 && el.at(0) == 0) {
				return val;
			}
			el?.push(value);
			return [...val];
		});
	}
	public validate(value: KeyboardCode): boolean {
		return /[0-9]/.test(value.toString());
	}
}

export type { KeyboardCode, KeyboardInputType };
export {
	DigitalImplementationClass,
	KeyboardResult,
	OperationImplementationClass,
	DeleteImplementationClass,
	CalculateImplementationClass,
	KeyboardList,
	EnterImplementationClass
};
