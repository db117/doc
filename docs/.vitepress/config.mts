import themeConfig from './config/themeConfig';
import head from './config/head'


// https://vitepress.dev/reference/site-config
export default {
  lang: "zh-CN",
  title: "大兵个人主页",
  description: "大兵的技术导航，收录常用工具、AI、Java、数据库、运维、学习资源与开发文档。",
  head: head,
    ignoreDeadLinks: true,
  // lastUpdated: true,
  themeConfig: themeConfig,
};
