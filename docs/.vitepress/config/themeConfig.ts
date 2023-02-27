import slidebar from './sliderbar'
import nav from './nav'

const themeConfig = {
    repo: 'db117/doc',
    // 你的 Git 项目地址，添加后会在导航栏的最后追加
    outlineTitle: '当前页',
    // 启用编辑
    editLinks: true,
    // 编辑按钮的 Text
    editLinkText: '编辑文档！',
    // 编辑文档的所在目录
    docsDir: 'docs',
    // 上面导航
    nav: nav,
    // 左边菜单（根据上面的导航调整）
    sidebar: slidebar,
    // 最后一次更新文字
    lastUpdatedText: '上次更新',
    // 启用页面滚动效果
    smoothScroll: true,
    // 上一页下一页文字
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    // 每一个文档右边输出的标题级别
    outline: [2, 6],
    socialLinks: [
        { icon: 'github', link: 'https://github.com/db117' }
      ]
    
}


export default themeConfig