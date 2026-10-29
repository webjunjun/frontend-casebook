<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { cases } from '../config/cases'
</script>

<template>
  <nav class="case-sidebar" aria-label="案例列表">
    <h2 class="sidebar-title">案例</h2>
    <ul class="case-list">
      <li v-for="c in cases" :key="c.id">
        <RouterLink class="case-item" :to="{ name: 'case', params: { caseId: c.id } }">
          <img
            class="case-thumb"
            :src="c.thumbnail"
            :alt="`${c.title} 缩略图`"
            width="640"
            height="400"
            loading="lazy"
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
</style>
