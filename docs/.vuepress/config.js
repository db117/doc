const navConf = require('../../config/navConf.js');
const sidebarConf = require('../../config/sidebarConf.js');

module.exports = {
    title: '个人主页',
    description: '文档',
    themeConfig: {
        nav: navConf,
        sidebar:sidebarConf,
        lastUpdated: '上次更新',
    }
}