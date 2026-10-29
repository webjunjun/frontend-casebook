<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useIframeCase } from '../composables/useIframeCase'
import { getCaseUrl, type CaseDefinition } from '../config/cases'
import ErrorFallback from './ErrorFallback.vue'
import LoadingSkeleton from './LoadingSkeleton.vue'

const props = defineProps<{ caseDef: CaseDefinition }>()

const containerEl = ref<HTMLElement | null>(null)
const { status, errorMessage, mount } = useIframeCase()

const fallbackUrl = computed(() => getCaseUrl(props.caseDef))

function mountCase(): void {
  if (containerEl.value) mount(props.caseDef, containerEl.value)
}

onMounted(mountCase)
watch(() => props.caseDef.id, mountCase)
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
