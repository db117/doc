import fs from 'fs'
import path_ from 'path'
var fm = require('front-matter')

const { resolve } = path_

export const scanDir = pathName => {
	const path = resolve(__dirname, `../../${pathName}`)
	return getMsg(path)
}

export const getMsg = path => {
	let res = fs.readdirSync(path).filter((item: string) => filterFile(item))
	if (res) {
		let arr = res.map(item => {
			if (String(item).endsWith('.md')) {
				// 文件完整路径
				var fullPath = path_.join(path, item);

				//  console.info(fullPath);
				//  console.log(title(fullPath))

				return {
					text: title(fullPath),
					link: resolve(path, item),
				}
			} else {
				return {
					text: item.split('.')[0],
					items: getMsg(resolve(path, item)),// 递归处理文件夹
					collapsible: true,
				}
			}
		})
		arr = arr.map(item => {
			if (item.link) {
				item.link = translateDir(item.link)
			}
			return item
		})
		return arr
	} else {
		console.warn('无文章')
	}
}

/**
 * 目录
 * @param {string} path
 * @returns
 */
function translateDir(path: string) {
	return path.replace(/\\/g, '/').split('docs')[1].split('.')[0]
}
/**
 * 过滤无效文件
 * @param item 文件名称
 * @returns 
 */
function filterFile(item: string) {
	return item.indexOf('.') === -1 || item.endsWith('.md');
}
/**
 * 获取文件标题
 * @param fullPath 完整文件路径
 * @returns 
 */
function title(fullPath) {
	// 读取文件内容
	var data = fs.readFileSync(fullPath, 'utf8');
	// 解析 front-matter
	var content = fm(data)
	// 获取文件头
	var title = content.attributes.title;

	if (title) {
		return title;
	}
	// 没找到就返回原始文件名称
	return path_.basename(fullPath);
}