<script setup lang="ts">
import {markdownItDiagramDom} from 'markdown-it-diagram/dom'
import {onMounted} from 'vue'
import mermaid from 'mermaid'


onMounted(async () => {
  // if you want to use mermaid, you need to install mermaid.js
  // npm install mermaid
  // import mermaid from 'mermaid'
  mermaid.initialize({startOnLoad: false})
  await mermaid.run()
  // initialize markdown-it-diagram/dom script
  await markdownItDiagramDom()
})
</script>