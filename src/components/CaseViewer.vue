<script setup lang="ts">
import { computed } from 'vue'
import { getCaseUrl, type CaseDefinition } from '../config/cases'
import IframeHost from './IframeHost.vue'

const props = defineProps<{ caseDef: CaseDefinition }>()

const openUrl = computed(() => getCaseUrl(props.caseDef))
</script>

<template>
  <section class="case-viewer" :aria-label="`${caseDef.title} 运行区`">
    <header class="viewer-head">
      <div class="viewer-info">
        <h2 class="viewer-title">{{ caseDef.title }}</h2>
        <p class="viewer-summary">{{ caseDef.summary }}</p>
      </div>
      <a class="open-new" :href="openUrl" target="_blank" rel="noopener noreferrer">在新窗口打开</a>
    </header>
    <ul class="tech-tags">
      <li v-for="t in caseDef.tech" :key="t">{{ t }}</li>
    </ul>
    <IframeHost :case-def="caseDef" />
  </section>
</template>

<style scoped>
.case-viewer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}

.viewer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.viewer-title {
  margin: 0;
  font-size: 20px;
}

.viewer-summary {
  margin: 6px 0 0;
  max-width: 640px;
  font-size: 13px;
  color: var(--text-dim);
}

.open-new {
  font-size: 13px;
  white-space: nowrap;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tech-tags li {
  padding: 3px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-elevated);
  font-size: 12px;
  color: var(--text-dim);
}
</style>
