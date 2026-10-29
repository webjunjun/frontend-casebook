<template>
  <div class="loading-skeleton" role="status" aria-live="polite">
    <div class="skeleton-pulse"></div>
    <p>正在加载案例…</p>
  </div>
</template>

<style scoped>
.loading-skeleton {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--bg);
  color: var(--text-dim);
  font-size: 14px;
}

.skeleton-pulse {
  width: 56px;
  height: 56px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-pulse {
    animation: none;
    border-top-color: var(--border);
  }
}
</style>
