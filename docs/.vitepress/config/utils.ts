import fs from 'fs'
import path from 'path'
const { resolve } = path

export const scanDir = pathName => {
	const path = resolve(__dirname, `../../${pathName}`)
	console.info(path)
	return getMsg(path)
}

export const getMsg = path => {
	let res = fs.readdirSync(path).filter((item: string) => filterFile(item))
	if (res) {
		let arr = res.map(item => {
			if (String(item).endsWith('.md')) {
				return {
					text: item.split('.')[0],
					link: resolve(path, item),
				}
			} else {
				return {
					text: item.split('.')[0],
					items: getMsg(resolve(path, item)),
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
	return item.indexOf('.')===-1||item.endsWith('.md');
}