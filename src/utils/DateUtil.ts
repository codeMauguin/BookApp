import { Optional, isNull } from './types';

function getCurrentMonth() {
	const currentDate = new Date();
	return [currentDate.getFullYear(), currentDate.getMonth()];
}

function getFirstDay(year?: number, month?: number) {
	let date: Date;
	const [y, m] = getCurrentMonth();
	date = new Date(
		isNull(year) ? y : (year as number),
		isNull(month) ? m : (month as number),
		1
	);
	return date;
}

function getLastDay(year?: number, month?: number) {
	const [y, m] = getCurrentMonth();

	return new Date(
		isNull(year) ? y : (year as number),
		(isNull(month) ? m : (month as number)) + 1,
		0
	);
}

function getFirstDayOfMonth(date: Date): Date {
	const year = date.getFullYear();
	const month = date.getMonth();
	return new Date(year, month, 1);
}

function cloneDate(date: Date) {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		date.getHours(),
		date.getMinutes(),
		date.getSeconds()
	);
}

function weekdayString(day: number) {
	return [
		'星期天',
		'星期一',
		'星期二',
		'星期三',
		'星期四',
		'星期五',
		'星期六'
	][day];
}

function getDayDifference(date1: Date, date2: Date): number {
	// 将日期转换为 UTC 时间，以避免时区差异导致的问题
	const utcDate1 = Date.UTC(
		date1.getFullYear(),
		date1.getMonth(),
		date1.getDate()
	);
	const utcDate2 = Date.UTC(
		date2.getFullYear(),
		date2.getMonth(),
		date2.getDate()
	);

	// 计算两个日期之间的毫秒差异
	const timeDifference = Math.abs(utcDate2 - utcDate1);

	// 将毫秒差异转换为天数差异
	const dayDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

	return dayDifference;
}

function formatDate(date: Date, formatStr: string): string {
	const year = date.getFullYear().toString();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');

	const replacements: { [key: string]: string } = {
		YYY: year,
		MM: month,
		DD: day,
		HH: hours,
		mm: minutes,
		SS: seconds
	};

	const regex = new RegExp(Object.keys(replacements).join('|'), 'gi');

	return formatStr.replace(regex, matched =>
		Optional.of(replacements[matched]).orElse({
			get: () => replacements[matched.toUpperCase()]
		})
	);
}

function toUTCTime(utcDate: string) {
	const isoTimeString = utcDate.replace(' ', 'T') + 'Z';
	return new Date(isoTimeString);
}

function toSQLString(date: Date) {
	return date.toISOString().slice(0, 19).replace('T', ' ');
}

export {
	cloneDate,
	getCurrentMonth,
	getFirstDay,
	getLastDay,
	weekdayString,
	getFirstDayOfMonth,
	getDayDifference,
	formatDate,
	toSQLString,
	toUTCTime
};
