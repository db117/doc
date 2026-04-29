import * as fs from 'fs'
import * as path_ from 'path'
import fm from 'front-matter'

const { relative, resolve } = path_
const docsRoot = resolve(__dirname, '../..')

export const scanDir = (pathName: string) => {
	const path = resolve(docsRoot, pathName)
	return getMsg(path)
}

export const getMsg = (path: string) => {
	const entries = fs.readdirSync(path, { withFileTypes: true })
		.filter(item => filterFile(item))
		.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

	if (entries.length) {
		let arr = entries.map(item => {
			if (item.isFile() && item.name.endsWith('.md')) {
				// 文件完整路径
				const fullPath = path_.join(path, item.name);

				return {
					text: title(fullPath),
					link: resolve(path, item.name),
				}
			} else {
				const file = resolve(path, item.name, "index.md");

				if (fs.existsSync(file)) {

					return {
						text: item.name.split('.')[0],
						items: getMsg(resolve(path, item.name)),// 递归处理文件夹
						link: resolve(path, item.name, "index"),
						collapsible: true,
					}
				} else {
					return {
						text: item.name.split('.')[0],
						items: getMsg(resolve(path, item.name)),// 递归处理文件夹
						collapsible: true,
					}
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
		return []
	}
}

/**
 * 目录
 * @param {string} path
 * @returns
 */
function translateDir(path: string) {
	const filePath = relative(docsRoot, path).replace(/\\/g, '/')
	return `/${filePath.replace(/\.md$/, '')}`
}
/**
 * 过滤无效文件
 * @param item 文件名称
 * @returns 
 */
function filterFile(item: fs.Dirent) {
	return item.isDirectory() || (item.isFile() && item.name.endsWith('.md') && item.name != "index.md");
}
/**
 * 获取文件标题
 * @param fullPath 完整文件路径
 * @returns 
 */
function title(fullPath: string) {
	// 读取文件内容
	const data = fs.readFileSync(fullPath, 'utf8');
	// 解析 front-matter
	const content = fm<{ title?: string }>(data)
	// 获取文件头
	const title = content.attributes.title;

	if (title) {
		return title;
	}
	// 没找到就返回原始文件名称
	return path_.basename(fullPath);
}
