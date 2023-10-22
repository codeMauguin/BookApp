import exports from 'fetch';
import { isNull } from 'utils/types';

class HeaderEven {
	private static instance: HeaderEven | null = null;

	private headerOption: Map<string, any> = new Map();

	private constructor() {
		// 防止通过new操作符创建多个实例
	}

	public static getInstance(): HeaderEven {
		if (!HeaderEven.instance) {
			HeaderEven.instance = new HeaderEven();
		}
		return HeaderEven.instance;
	}
	public get(title: string | undefined): any | null {
		console.log(
			'%c Line:21 🍩',
			'color:#33a5ff',
			isNull(title) ? {} : this.headerOption.get(title) ?? {}
		);
		return isNull(title) ? {} : this.headerOption.get(title) ?? {};
	}
	public register(title: string, option: any) {
		this.headerOption.set(title, option);
	}
}

export default HeaderEven;
