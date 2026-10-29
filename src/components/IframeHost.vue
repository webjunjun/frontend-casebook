<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useIframeCase } from '../composables/useIframeCase'
import { useTheme } from '../composables/useTheme'
import { getCaseUrl, type CaseDefinition } from '../config/cases'
import ErrorFallback from './ErrorFallback.vue'
import LoadingSkeleton from './LoadingSkeleton.vue'

const props = defineProps<{ caseDef: CaseDefinition }>()

const containerEl = ref<HTMLElement | null>(null)
const { status, errorMessage, mount, postToCase } = useIframeCase()
const { theme } = useTheme()

const fallbackUrl = computed(() => getCaseUrl(props.caseDef))

function mountCase(): void {
  if (containerEl.value) mount(props.caseDef, containerEl.value)
}

function syncTheme(): void {
  postToCase({ type: 'host:theme', theme: theme.value })
}

onMounted(mountCase)
watch(() => props.caseDef.id, mountCase)
watch(theme, syncTheme)
// 案例可能在主题变化之后才就绪，ready 时补发当前主题
watch(status, (s) => {
  if (s === 'ready') syncTheme()
})
</script>

<template>
  <div class="iframe-host">
    <div ref="containerEl" class="iframe-container"></div>
    <LoadingSkeleton v-if="status === 'loading' || status === 'idle'" />
    <ErrorFallback
      v-else-if="status === 'error'"
      :message="errorMessage"
      :case-url="fallbackUrl"
      @retry="mountCase"
    />
  </div>
</template>

<style scoped>
.iframe-host {
  position: relative;
  flex: 1;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
}

.iframe-container {
  position: absolute;
  inset: 0;
}

.iframe-container :deep(iframe) {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
