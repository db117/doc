import {defineConfig} from 'vitepress'
import themeConfig from './config/themeConfig';
import head from './config/head'
import mm from 'markdown-it-diagram'


// module.exports = {
//     title: '大兵个人主页',
//     description: '文档',
//     head: head,
//     ignoreDeadLinks: true,
//     lastUpdated: true,
//     themeConfig: themeConfig
// };

// console.log(JSON.stringify(module.exports));


// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "大兵个人主页",
  description: "文档",
  head: head,
  ignoreDeadLinks: true,
  // lastUpdated: true,
  themeConfig: themeConfig,
  markdown: {
    config: (md) => {
      // 使用更多的 Markdown-it 插件！
      md.use(mm)
    }
  }
})
