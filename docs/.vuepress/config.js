const navConf = require('../../config/navConf.js');
const sidebarConf = require('../../config/sidebarConf.js');
const headConf = require('../../config/headConf.js');

module.exports = {
    title: '大兵个人主页',
    description: '文档',
    head: headConf,
    themeConfig: {
        repo: 'db117/doc',
        // 你的 Git 项目地址，添加后会在导航栏的最后追加
        // 启用编辑
        editLinks: true,
        // 编辑按钮的 Text
        editLinkText: '编辑文档！',
        // 编辑文档的所在目录
        docsDir: 'docs',
        nav: navConf,
        sidebar: sidebarConf,
        lastUpdated: '上次更新',
    }
};