import themeConfig  from './config/themeConfig';
import head from './config/head'


module.exports = {
    title: '大兵个人主页',
    description: '文档',
    head: head,
    ignoreDeadLinks: true,
    lastUpdated: true,
    themeConfig: themeConfig
};

console.log(JSON.stringify(module.exports));