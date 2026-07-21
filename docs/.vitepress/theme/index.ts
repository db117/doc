// https://vitepress.dev/guide/custom-theme
import {h, nextTick, watch} from 'vue'
import {useData} from 'vitepress'
import type {Theme} from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import {createMermaidRenderer} from 'vitepress-mermaid-renderer'
import './style.css'


export default {
  extends: DefaultTheme,
  Layout: () => {
    const {isDark} = useData()
    const initMermaid = () => {
      createMermaidRenderer({
        theme: isDark.value ? 'dark' : 'default',
      })
    }

    nextTick(initMermaid)
    watch(isDark, initMermaid)

    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app, router, siteData }) {
    // ...

  }
} satisfies Theme
