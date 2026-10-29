<script setup lang="ts">
import { RouterView } from 'vue-router'
import ThemeToggle from './components/ThemeToggle.vue'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand">
        <h1 class="brand-title">Web 渲染案例作品集</h1>
        <p class="brand-sub">2D 高性能绘图 · 3D 场景渲染</p>
      </div>
      <ThemeToggle />
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-elevated);
}

.brand-title {
  margin: 0;
  font-size: 18px;
}

.brand-sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-dim);
}

.app-main {
  flex: 1;
  min-height: 0;
}
</style>
