<script setup lang="ts">
defineProps<{ message: string; caseUrl: string }>()

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="error-fallback" role="alert">
    <h3 class="error-title">案例加载失败</h3>
    <p class="error-message">{{ message }}</p>
    <div class="error-actions">
      <button type="button" class="btn" @click="emit('retry')">重试</button>
      <a class="btn btn-ghost" :href="caseUrl" target="_blank" rel="noopener noreferrer">
        在新窗口打开
      </a>
    </div>
  </div>
</template>

<style scoped>
.error-fallback {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  background: var(--bg);
  text-align: center;
}

.error-title {
  margin: 0;
  font-size: 18px;
  color: var(--danger);
}

.error-message {
  margin: 0;
  max-width: 480px;
  font-size: 14px;
  color: var(--text-dim);
}

.error-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn {
  padding: 8px 18px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.btn-ghost {
  background: transparent;
  color: var(--accent);
  text-decoration: none;
}
</style>
