import slidebar from './config/sliderbar'
import nav from './config/nav'
import head from './config/head'


module.exports = {
    title: '大兵个人主页',
    description: '文档',
    head: head,
    ignoreDeadLinks: true,
    lastUpdated: true,
    themeConfig: {
        repo: 'db117/doc',
        // 你的 Git 项目地址，添加后会在导航栏的最后追加
        // 启用编辑
        editLinks: true,
        // 编辑按钮的 Text
        editLinkText: '编辑文档！',
        // 编辑文档的所在目录
        docsDir: 'docs',
        nav: nav,
        sidebar: slidebar,
        lastUpdatedText: '上次更新',
        // 启用页面滚动效果
        smoothScroll: true,
        socialLinks: [
            { icon: 'github', link: 'https://github.com/db117' },
            {
              icon: {
                svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Dribbble</title><path d="M12...6.38z"/></svg>'
              },
              link: '...'
            }
          ]
        
    }
};