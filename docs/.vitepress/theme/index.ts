// https://vitepress.dev/guide/custom-theme
import {h, nextTick, watch} from 'vue'
import {useData} from 'vitepress'
import type {Theme} from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import {createMermaidRenderer} from 'vitepress-mermaid-renderer'
// @ts-ignore
import './style.css'

const lightMermaidTheme = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  fontSize: '15px',
  background: '#ffffff',
  primaryColor: '#f7f7f8',
  primaryTextColor: '#202123',
  primaryBorderColor: '#d9d9e3',
  secondaryColor: '#f1f5f9',
  secondaryTextColor: '#202123',
  secondaryBorderColor: '#cbd5e1',
  tertiaryColor: '#fafafa',
  tertiaryTextColor: '#202123',
  tertiaryBorderColor: '#e5e7eb',
  lineColor: '#8e8ea0',
  textColor: '#202123',
  clusterBkg: '#fafafa',
  clusterBorder: '#d9d9e3',
  edgeLabelBackground: '#ffffff',
}

const darkMermaidTheme = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  fontSize: '15px',
  background: '#1e1e1e',
  primaryColor: '#2a2a2e',
  primaryTextColor: '#ececf1',
  primaryBorderColor: '#4a4a52',
  secondaryColor: '#252a30',
  secondaryTextColor: '#ececf1',
  secondaryBorderColor: '#475569',
  tertiaryColor: '#242424',
  tertiaryTextColor: '#ececf1',
  tertiaryBorderColor: '#3f3f46',
  lineColor: '#8e8e9f',
  textColor: '#ececf1',
  clusterBkg: '#232323',
  clusterBorder: '#44444c',
  edgeLabelBackground: '#1e1e1e',
}

export default {
  extends: DefaultTheme,
  Layout: () => {
    const {isDark} = useData()

    /** 按当前主题配置 Mermaid 渲染器及工具栏。 */
    const initMermaid = () => {
      const mermaidRenderer = createMermaidRenderer({
        theme: 'base',
        flowchart: {
          curve: 'basis',
          nodeSpacing: 45,
          rankSpacing: 60,
          padding: 15,
          htmlLabels: true,
          useMaxWidth: true,
        },
        themeVariables: isDark.value ? darkMermaidTheme : lightMermaidTheme,
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
