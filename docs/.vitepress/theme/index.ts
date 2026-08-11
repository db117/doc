// https://vitepress.dev/guide/custom-theme
import {h, nextTick, watch} from 'vue'
import {useData} from 'vitepress'
import type {Theme} from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import {createMermaidRenderer} from 'vitepress-mermaid-renderer'
// @ts-ignore
import './style.css'


export default {
  extends: DefaultTheme,
  Layout: () => {
    const {isDark} = useData()

    /** 按当前主题配置 Mermaid 渲染器及工具栏。 */
    const initMermaid = () => {
      const mermaidRenderer = createMermaidRenderer({
        theme: isDark.value ? 'dark' : 'forest',
      });

      mermaidRenderer.setToolbar({
        showLanguageLabel: false,
        downloadFormat: 'png',
        fullscreenMode: 'dialog',
        desktop: {
          copyCode: 'enabled',
          toggleFullscreen: 'enabled',
          resetView: 'enabled',
          zoomOut: 'enabled',
          zoomIn: 'enabled',
          zoomLevel: 'enabled',
          download: 'enabled',
        },
        fullscreen: {
         copyCode: 'enabled',
          toggleFullscreen: 'enabled',
          resetView: 'enabled',
          zoomOut: 'enabled',
          zoomIn: 'enabled',
          zoomLevel: 'enabled',
          download: 'enabled',
        }
      });
    };


    nextTick(initMermaid)
    watch(isDark, initMermaid)

    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  /** 预留 VitePress 应用增强入口。 */
  enhanceApp({ app, router, siteData }) {
    // ...

  }
} satisfies Theme
