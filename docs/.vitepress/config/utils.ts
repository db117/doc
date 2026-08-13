import * as fs from 'fs'
import * as path_ from 'path'
import fm from 'front-matter'

const { relative, resolve } = path_
const docsRoot = resolve(import.meta.dirname, '../..')
const defaultOrder = Number.MAX_SAFE_INTEGER

/** Markdown 页面用于侧边栏排序的元数据。 */
type PageMeta = {
	/** 页面显示标题。 */
	title: string
	/** 页面在同级侧边栏中的排序值。 */
	order: number
}

/** VitePress 侧边栏中的页面或目录节点。 */
type SidebarItem = {
	/** 侧边栏显示文本。 */
	text: string
	/** 页面链接；纯目录节点可省略。 */
	link?: string
	/** 当前目录的子页面和子目录。 */
	items?: SidebarItem[]
	/** 是否允许折叠当前目录。 */
	collapsible?: boolean
	/** 构建阶段使用的同级排序值。 */
	order?: number
}

/** 扫描指定文档目录并生成侧边栏节点。 */
export const scanDir = (pathName: string) => {
	const path = resolve(docsRoot, pathName)
	return getMsg(path)
}

/** 递归读取文档目录并返回已排序的侧边栏结构。 */
export const getMsg = (path: string): SidebarItem[] => {
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
		}).sort(compareSidebarItem).map(({order: _order, ...item}) => {
			if (item.link) {
				item.link = translateDir(item.link)
			}
			return item
		})
	} else {
		return []
	}
}

/** 将文档绝对路径转换为站点路由。 */
function translateDir(path: string) {
	const filePath = relative(docsRoot, path).replace(/\\/g, '/')
	return `/${filePath.replace(/\.md$/, '')}`
}
/** 判断目录项是否应进入自动侧边栏。 */
function filterFile(item: fs.Dirent) {
	return item.isDirectory() || (item.isFile() && item.name.endsWith('.md') && item.name != "index.md");
}
/** 从 Markdown frontmatter 读取页面标题和排序值。 */
function pageMeta(fullPath: string): PageMeta {
	const data = fs.readFileSync(fullPath, 'utf8');
	const content = fm<{ title?: string, order?: number }>(data)

	return {
		title: content.attributes.title || path_.basename(fullPath),
		order: Number.isFinite(content.attributes.order) ? content.attributes.order! : defaultOrder,
	}
}

/** 按显式顺序和中文标题稳定排序侧边栏节点。 */
function compareSidebarItem(a: SidebarItem, b: SidebarItem) {
	const aOrder = a.order ?? defaultOrder
	const bOrder = b.order ?? defaultOrder
	if (aOrder !== bOrder) {
		return aOrder - bOrder
	}
	return a.text.localeCompare(b.text, 'zh-CN')
}
