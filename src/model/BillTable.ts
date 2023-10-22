import type { CollectionChangeCallback } from "realm";
import { ObjectSchema }                  from "realm";
import Realm                             from "realm";
import { isArray }                       from "utils/types";

const books = "database_books";
const configs = "database_config";
const bills = "database_bill";
const Category = "database_Category";
const tags = "database_tags";
const accounts = "database_accounts";
const icons = "database_icons";
const BillPeople = "database_BillPeople";
const OrderOperationRecordTable = "database_OrderOperationRecordTable";
const OrderSchema: ObjectSchema = {
	name      : OrderOperationRecordTable,
	primaryKey: "id",
	properties: {
		id                       : {
			type   : "string",
			indexed: true
		},
		accountId                : "string",
		date                     : {
			type   : "date",
			indexed: true
		},
		balanceBeforeOrderPayment: "double",
		balanceAfterOrderPayment : "double",
		isInit                   : {
			type   : "bool",
			default: false
		},
		bill                     : {
			type      : "linkingObjects",
			objectType: bills,
			property  : "payload"
		},
		account                  : {
			type      : "linkingObjects",
			objectType: accounts,
			property  : "payload"
		},
		billPeople               : {
			type      : "linkingObjects",
			objectType: BillPeople,
			property  : "payload"
		}
	}
};


const iconSchema: ObjectSchema = {
	name      : icons,
	primaryKey: "id",
	properties: {
		id    : {
			type   : "string",
			indexed: true
		},
		name  : {type: "string"},
		type  : {type: "string"},
		family: {
			type    : "string",
			optional: true
		},
		color : {
			type    : "string",
			optional: true
		}
	}
};


const categorySchema: ObjectSchema = {
	name      : Category,
	primaryKey: "id",
	properties: {
		id   : {
			type   : "string",
			indexed: true
		},
		icon : icons,
		name : {type: "string"},
		type : {type: "string"},
		level: {type: "int"},
		pid  : {
			type    : "string",
			optional: true
		}
	}
};
const BillPeopleSchema: ObjectSchema = {
	name      : BillPeople,
	properties: {
		id     : {
			type    : "string",
			optional: false,
			indexed : true
		},
		name   : "string", //对方名称
		account: accounts, //收账账户
		remake : "string?",
		money  : "double",
		time   : "date", //收款时间
		status : {
			type   : "bool",
			default: true
		},
		owner  : {
			type      : "linkingObjects",
			objectType: bills,
			property  : "people"
		},
		payload: OrderOperationRecordTable
	},
	embedded  : true
};

const tagSchema: ObjectSchema = {
	name      : tags,
	primaryKey: "id",
	properties: {
		id  : {
			type   : "string",
			indexed: true
		},
		name: {type: "string"}
	}
};

const accountSchema: ObjectSchema = {
	name      : accounts,
	primaryKey: "id",
	properties: {
		id       : {
			type   : "string",
			indexed: true
		},
		name     : {type: "string"},
		money    : {type: "double"},
		card     : {
			type    : "string",
			optional: true
		},
		index    : {type: "int"},
		icon     : icons,
		isDefault: {
			type   : "bool",
			default: false
		},
		remark   : {
			type    : "string",
			optional: true
		},
		payload  : OrderOperationRecordTable
	}
};

const Bill: ObjectSchema = {
	name      : bills,
	primaryKey: "id",
	properties: {
		id          : {
			type    : "string",
			optional: false,
			indexed : true
		},
		type        : {
			type    : "string",
			optional: false
		},
		category    : Category,
		account     : accounts,
		tags        : `${tags}[]`,
		price       : {
			type    : "double",
			optional: false
		},
		remark      : {
			type    : "string",
			optional: true
		},
		create      : {
			type    : "date",
			optional: false
		},
		modification: {
			type    : "date",
			optional: true
		},
		promotion   : {
			type    : "double",
			optional: true
		},
		people      : "database_BillPeople[]",
		aid         : {type: "string"},
		payload     : OrderOperationRecordTable
	}
	
};

const config: ObjectSchema = {
	name      : configs,
	primaryKey: "id",
	properties: {
		id      : "string",
		ledgerId: "string?"
	}
};
const table: ObjectSchema = {
	name      : books,
	primaryKey: "id",
	properties: {
		id        : "string",
		createTime: "date",
		name      : "string",
		categorys : {
			type      : "list",
			objectType: "string"
		},
		tags      : {
			type      : "list",
			objectType: "string"
		},
		accounts  : {
			type      : "list",
			objectType: "string"
		}
	}
};
const path = __DEV__ ? "__DEV__" : "__RELEASE__";
const instance = new Realm({
	                           schema       : [
		                           table,
		                           config,
		                           iconSchema,
		                           tagSchema,
		                           Bill,
		                           accountSchema,
		                           categorySchema,
		                           BillPeopleSchema,
		                           OrderSchema
	                           ],
	                           path,
	                           schemaVersion: 1.0
                           });

function all<T>(TABLEWARE: string): T[] {
	const objects = instance.objects<T>(TABLEWARE);
	return Array.from(objects.toJSON()) as T[];
}

function queryByCondition<T>(
	TABLEWARE: string,
	condition: string,
	query: any[]
): T[] {
	try {
		return Array.from(
			instance
				.objects<T>(TABLEWARE)
				.filtered(condition, ...query)
				.snapshot()
				.toJSON()
		) as T[];
	} catch (error) {
		return [];
	}
}


function removeListener(
	tableName: string,
	listener: CollectionChangeCallback<any>
): void;
function removeListener(
	tableName: string[],
	listener: CollectionChangeCallback<any>
): void;

function removeListener(
	tableName: string | string[],
	listener: CollectionChangeCallback<any>
): void {
	if (isArray(tableName)) {
		tableName.forEach(name => removeListener(name, listener));
		return;
	}
	try {
		instance.objects(tableName).removeListener(listener);
	} catch (error) {
	}
}

function updateByTransaction<T>(
	table: string,
	updateView: (data: T) => T,
	query: string,
	args: any[]
) {
	const old = instance.objects(table).filtered(query, args)[0];
	
	const updateVal: any = updateView(old as T);
	instance.create(table, updateVal, Realm.UpdateMode.Modified);
}

function update<T>(
	table: string,
	updateView: (data: T) => T,
	query: string,
	args: any[]
) {
	instance.write(() => {
		const old = instance.objects(table).filtered(query, args)[0];
		const updateVal: any = updateView(old as T);
		instance.create(table, updateVal, Realm.UpdateMode.Modified);
	});
}

function insertByTransaction<T extends object>(object: T, tableName: string) {
	instance.create(tableName, object);
}

function insert(object: any, tableName: string): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		try {
			instance.write(() => {
				instance.create(tableName, object);
				resolve();
			});
		} catch (error) {
			reject(error);
		}
	});
}


export {
	Category,
	accounts,
	bills,
	books,
	config,
	icons,
	tags,
	configs,
	OrderOperationRecordTable
};
export {
	BillPeople as BillTable
};

export {
	all,
	insert,
	instance,
	insertByTransaction,
	queryByCondition,
	removeListener,
	update,
	updateByTransaction
};
export {
	table,
	iconSchema,
	tagSchema,
	Bill,
	accountSchema,
	categorySchema,
	BillPeopleSchema,
	OrderSchema
};
