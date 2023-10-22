import { FontKey } from "utils/FontManager";

type AccountType = {
	id: string;
	name: string;
	money: number;
	card?: string;
	icon: IconType | string;
	index: number;
	isDefault: boolean;
	remark: string;
};

type TagType = {
	id: string;
	name: string;
};
type orderRecord = {
	readonly id: string;
	date: Date;
	accountId: string;
	billId: string;
	isInit: boolean;
	peopleId?: string | null;
	balanceBeforeOrderPayment: number;
	balanceAfterOrderPayment: number;
};

type IconType = {
	id: string;
	name: string;
	type: "icon" | "image";
	color?: string;
	family?: FontKey;
};
type Category = {
	id: string;
	name: string;
	type: "支出" | "收入";
	pid: string;
	level: number;
	icon: IconType | string;
};
type BookMode = {
	id: string;
	createTime: Date;
	name: string;
	tags: string[];
	categorys: string[] | Category[];
	accounts: string[] | AccountType[];
};

type Bill = {
	aid?: string;
	id: string;
	type: "支出" | "收入";
	account: string | AccountType;
	price: number;
	remark: string;
	create: Date;
	modification?: Date;
	promotion?: number;
	people: BillPeople[];
	category: string | Category;
	tags: TagType[] | string[];
	payload: orderRecord
};

type BillPeople = {
	id: string;
	name: string; //对方名称
	account: string | AccountType; //收账账户
	remake?: string;
	money: number;
	time: Date; //收款时间
	status: boolean;
};

interface EDate {
	value: number;
	children: EDate[] | Bill[]; //Number是账单
}

interface Day extends EDate {
	value: number;
	children: Bill[];
}

interface Setting {
	id: string;
	ledgerId: string;
}

export type {
	AccountType,
	Bill,
	BillPeople,
	BookMode,
	Category,
	Day,
	EDate,
	IconType,
	TagType,
	Setting,
	orderRecord
};
