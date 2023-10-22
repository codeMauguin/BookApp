const cheerio = require('cheerio');
/**
 * 解析html 中的元素解析为对象
 */
type Rule = {
	bookList: string;
	bookName: string;
	bookImage: string;
	bookSrc: string;
};

function parser(rules: Rule, html: string): Record<string, any> {
	const { bookList, bookName, bookImage, bookSrc } = rules;
	const root = getDom(html, bookList);
	return {
		root,
		title: root.find(bookName).text(),
		image: root.find(bookImage).attr('src'),
		src: root.find(bookSrc).attr('href')
	};
}

/**
 * 解析html
 * @param html html原本的文本或者被解析的dom
 * @param path jsonup
 * @returns 被解析后的dom
 */
function getDom(html: string | any, path: string) {
	return cheerio.load(html)(path);
}
//将html字符串解析成AST

export { parser };
