<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cases, getCaseUrl, type CaseDefinition } from '../config/cases'
import IframeHost from './IframeHost.vue'

const props = defineProps<{ caseDef: CaseDefinition }>()

const openUrl = computed(() => getCaseUrl(props.caseDef))

const viewerEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)

let prefetchLink: HTMLLinkElement | null = null
let prevCaseId: string | undefined

function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {
      // 浏览器拒绝时静默忽略（如 iframe 全屏权限冲突）
    })
    return
  }
  viewerEl.value?.requestFullscreen?.().catch(() => {
    // 非用户手势上下文下会被拒绝，静默忽略
  })
}

function onFullscreenChange(): void {
  isFullscreen.value = document.fullscreenElement === viewerEl.value
}

/** 预取下一个案例的 HTML 文档（仅 link 提示，不预创建 iframe） */
function prefetchNextCase(): void {
  if (prefetchLink) {
    prefetchLink.remove()
    prefetchLink = null
  }
  const idx = cases.findIndex((c) => c.id === props.caseDef.id)
  const next = cases[idx + 1]
  if (!next) return
  prefetchLink = document.createElement('link')
  prefetchLink.rel = 'prefetch'
  prefetchLink.as = 'document'
  prefetchLink.href = getCaseUrl(next)
  document.head.appendChild(prefetchLink)
}

watch(
  () => props.caseDef.id,
  () => prefetchNextCase(),
  { immediate: true },
)

// 切换案例时把焦点移到标题，供屏幕阅读器获知上下文变化；首次挂载不抢焦点
watch(
  () => props.caseDef.id,
  (id) => {
    if (prevCaseId !== undefined && prevCaseId !== id) {
      void nextTick(() => {
        titleEl.value?.focus({ preventScroll: true })
      })
    }
    prevCaseId = id
  },
)

onMounted(() => document.addEventListener('fullscreenchange', onFullscreenChange))
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (prefetchLink) {
    prefetchLink.remove()
    prefetchLink = null
  }
})
</script>

<template>
  <section ref="viewerEl" class="case-viewer" :aria-label="`${caseDef.title} 运行区`">
    <header class="viewer-head">
      <div class="viewer-info">
        <h2 ref="titleEl" class="viewer-title" tabindex="-1">{{ caseDef.title }}</h2>
        <p class="viewer-summary">{{ caseDef.summary }}</p>
      </div>
      <div class="viewer-actions">
        <button type="button" class="action-btn" @click="toggleFullscreen">
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </button>
        <a class="action-btn open-new" :href="openUrl" target="_blank" rel="noopener noreferrer">
          在新窗口打开
        </a>
      </div>
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
  outline: none;
}

.viewer-summary {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-dim);
}

.viewer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.action-btn {
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-elevated);
  color: inherit;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
}

.action-btn:hover {
  background: var(--bg-hover);
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

.case-viewer:fullscreen {
  padding: 16px;
  background: var(--bg);
  overflow: auto;
}
</style>
