<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { cases, getAssetUrl } from '../config/cases'

/** 1×1 透明 GIF：懒加载占位，避免未加载图片的 alt 边框 */
const PLACEHOLDER_SRC = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

const route = useRoute()
const listEl = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function currentCaseId(): string | undefined {
  const raw = route.params.caseId
  return Array.isArray(raw) ? raw[0] : raw
}

function loadImage(img: HTMLImageElement): void {
  const src = img.dataset.src
  if (!src) return
  img.src = src
  img.removeAttribute('data-src')
}

onMounted(() => {
  const root = listEl.value
  if (!root) return
  const images = root.querySelectorAll<HTMLImageElement>('img[data-src]')
  if (typeof IntersectionObserver === 'undefined') {
    images.forEach(loadImage)
    return
  }
  observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          loadImage(entry.target as HTMLImageElement)
          obs.unobserve(entry.target)
        }
      }
    },
    { rootMargin: '200px' },
  )
  images.forEach((img) => observer?.observe(img))
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <nav class="case-sidebar" aria-label="案例列表">
    <h2 class="sidebar-title">案例</h2>
    <ul ref="listEl" class="case-list">
      <li v-for="c in cases" :key="c.id">
        <RouterLink
          class="case-item"
          :to="{ name: 'case', params: { caseId: c.id } }"
          :aria-current="currentCaseId() === c.id ? 'page' : undefined"
        >
          <img
            class="case-thumb"
            :data-src="getAssetUrl(c.thumbnail)"
            :src="PLACEHOLDER_SRC"
            :alt="`${c.title} 缩略图`"
            width="640"
            height="400"
          />
          <div class="case-meta">
            <h3 class="case-title">{{ c.title }}</h3>
            <p class="case-summary">{{ c.summary }}</p>
          </div>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.case-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-elevated);
  overflow: hidden;
}

.sidebar-title {
  margin: 0 0 10px;
  padding: 0 6px;
  font-size: 14px;
  color: var(--text-dim);
}

.case-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.case-item {
  display: block;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.case-item:hover {
  background: var(--bg-hover);
}

.case-item.router-link-active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.case-thumb {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 6px;
  background: var(--bg-hover);
}

.case-title {
  margin: 8px 2px 0;
  font-size: 15px;
}

.case-summary {
  margin: 4px 2px 0;
  font-size: 12px;
  color: var(--text-dim);
}

/* 移动端：折叠为顶部横向滚动条，隐藏标题与摘要 */
@media (max-width: 860px) {
  .case-sidebar {
    padding: 8px;
  }

  .sidebar-title,
  .case-summary {
    display: none;
  }

  .case-list {
    flex-direction: row;
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .case-list li {
    flex: 0 0 160px;
  }

  .case-title {
    font-size: 13px;
  }
}
</style>
