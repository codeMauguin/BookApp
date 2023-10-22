import { FontKey } from 'utils/FontManager';

interface OrderOperationRecord {
	id: number;
	accountId: number;
	date: Date;
	balanceBeforeOrderPayment: number;
	balanceAfterOrderPayment: number;
	isInit: boolean;
	bill?: Bill;
	account?: Account;
	billPeople?: BillPeople;
}

interface Icon {
	id: number;
	name: string;
	type: string;
	family?: FontKey;
	color?: string;
	size: number;
}

interface Category {
	id: number;
	icon: Icon;
	name: string;
	type: string;
	level: number;
	pid?: string;
	indexed: number;
}

interface BillPeople {
	id: string;
	title: string;
	name: string;
	account: Account;
	remark?: string;
	money: number;
	time: Date;
	status: boolean;
	payload: OrderOperationRecord;

	bill: Bill;
}

interface Tag {
	id: number;
	name: string;
}

interface Account {
	id: number;
	name: string;
	money: number;
	card?: string;
	level: number;
	icon: Icon;
	isDefault: boolean;
	remark?: string;
	payload: OrderOperationRecord;
}

interface Bill {
	id: string;
	type: '支出' | '收入';
	category: Category;
	account: Account;
	tags: Tag[];
	price: number;
	remark?: string;
	time: Date;
	modification?: Date;
	promotion?: number;
	people: BillPeople[];
	aid: number;
	payload: OrderOperationRecord;
}
interface BaseRef {
	open: () => void;
	close: () => void;
}

export type {
	Bill,
	Account,
	Icon,
	Category,
	Tag,
	OrderOperationRecord,
	BillPeople,
	BaseRef
};
