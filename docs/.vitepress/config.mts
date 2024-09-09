import themeConfig from './config/themeConfig';
import head from './config/head'
import {withMermaid} from "vitepress-plugin-mermaid";


// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "大兵个人主页",
  description: "文档",
  head: head,
  ignoreDeadLinks: true,
  // lastUpdated: true,
  themeConfig: themeConfig,
  mermaid: {
    //mermaidConfig !theme here works for ligth mode since dark theme is forced in dark mode
  }
});
