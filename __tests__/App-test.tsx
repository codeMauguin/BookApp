/**
 * @format
 */

// Note: test renderer must be required after react-native.
import { calculateExpression } from 'utils/types';

describe('Decimal Addition', () => {
	it('should correctly add two decimal numbers', () => {
		const input = '0.5 + 0.2';
		const expectedOutput = 0.7;
		expect(calculateExpression(input)).toBe(expectedOutput);
	});

	it('should correctly add an integer decimal and a floating point number', () => {
		const input = '1.75 + 2.25';
		const expectedOutput = 4.0;
		expect(calculateExpression(input)).toBe(expectedOutput);
	});

	it('should correctly add two floating point numbers', () => {
		const input = '3.14 + 1.41';
		const expectedOutput = 4.55;
		expect(calculateExpression(input)).toBe(expectedOutput);
	});

	it('should correctly handle addition with negative numbers', () => {
		const input = '-1.5 + 2.5';
		const expectedOutput = 1.0;
		expect(calculateExpression(input)).toBe(expectedOutput);
	});
	it('should correctly add two decimal numbers without losing precision', () => {
		const input = '0.10 + 0.20';
		const expectedOutput = 0.3;
		expect(calculateExpression(input)).toBe(expectedOutput);
	});

	it('should correctly handle addition with larger decimal numbers', () => {
		const input = '1234.56 + 9876.54';
		const expectedOutput = 11111.1;
		expect(calculateExpression(input)).toBe(expectedOutput);
	});

	it('should correctly handle addition with excessive decimal precision', () => {
		const input = '0.01 + 0.02';
		const expectedOutput = 0.03;
		expect(calculateExpression(input)).toBe(expectedOutput);
	});
});
