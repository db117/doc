import * as fs from 'fs'
import * as path_ from 'path'
import fm from 'front-matter'

const { relative, resolve } = path_
const docsRoot = resolve(__dirname, '../..')
const defaultOrder = Number.MAX_SAFE_INTEGER

type PageMeta = {
	title: string
	order: number
}

type SidebarItem = {
	text: string
	link?: string
	items?: SidebarItem[]
	collapsible?: boolean
	order?: number
}

export const scanDir = (pathName: string) => {
	const path = resolve(docsRoot, pathName)
	return getMsg(path)
}

export const getMsg = (path: string) => {
	const entries = fs.readdirSync(path, { withFileTypes: true })
		.filter(item => filterFile(item))

	if (entries.length) {
		return entries.map(item => {
			if (item.isFile() && item.name.endsWith('.md')) {
				const fullPath = path_.join(path, item.name)
				const meta = pageMeta(fullPath)

				return {
					text: meta.title,
					link: resolve(path, item.name),
					order: meta.order,
				}
			} else {
				const file = resolve(path, item.name, "index.md")

				if (fs.existsSync(file)) {
					const meta = pageMeta(file)

					return {
						text: meta.title,
						items: getMsg(resolve(path, item.name)),
						link: resolve(path, item.name, "index"),
						collapsible: true,
						order: meta.order,
					}
				} else {
					return {
						text: item.name.split('.')[0],
						items: getMsg(resolve(path, item.name)),
						collapsible: true,
						order: defaultOrder,
					}
				}

			}
		}).sort(compareSidebarItem).map(item => {
			if (item.link) {
				item.link = translateDir(item.link)
			}
			delete item.order
			return item
		})
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
 * 获取页面元信息
 * @param fullPath 完整文件路径
 * @returns 
 */
function pageMeta(fullPath: string): PageMeta {
	const data = fs.readFileSync(fullPath, 'utf8');
	const content = fm<{ title?: string, order?: number }>(data)

	return {
		title: content.attributes.title || path_.basename(fullPath),
		order: Number.isFinite(content.attributes.order) ? content.attributes.order! : defaultOrder,
	}
}

function compareSidebarItem(a: SidebarItem, b: SidebarItem) {
	const aOrder = a.order ?? defaultOrder
	const bOrder = b.order ?? defaultOrder
	if (aOrder !== bOrder) {
		return aOrder - bOrder
	}
	return a.text.localeCompare(b.text, 'zh-CN')
}
