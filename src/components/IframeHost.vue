<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useIframeCase } from '../composables/useIframeCase'
import { useShellPerf } from '../composables/useShellPerf'
import { useTheme } from '../composables/useTheme'
import { getCaseUrl, type CaseDefinition } from '../config/cases'
import ErrorFallback from './ErrorFallback.vue'
import LoadingSkeleton from './LoadingSkeleton.vue'

const props = defineProps<{ caseDef: CaseDefinition }>()

const stageEl = ref<HTMLElement | null>(null)
const containerEl = ref<HTMLElement | null>(null)

const { status, errorMessage, loadTimeMs, reportedHeight, reportedMetrics, mount, postToCase } =
  useIframeCase()
const { theme } = useTheme()
const { fcpMs } = useShellPerf()

const caseHeight = ref<number | null>(null)
const switchDurationMs = ref<number | null>(null)
let switchStartedAt = performance.now()

const fallbackUrl = computed(() => getCaseUrl(props.caseDef))
const isHeightAdaptive = computed(() => caseHeight.value !== null)
const hostStyle = computed(() =>
  caseHeight.value === null ? undefined : { '--case-height': `${caseHeight.value}px` },
)

function mountCase(): void {
  if (containerEl.value) mount(props.caseDef, containerEl.value)
}

function syncTheme(): void {
  postToCase({ type: 'host:theme', theme: theme.value })
}

/**
 * 高度自适应：取案例上报高度与视口可用高度的较小值（下限 240px），
 * 避免案例内部与壳同时出现纵向滚动。
 */
function applyReportedHeight(): void {
  const reported = reportedHeight.value
  if (reported === null || !stageEl.value) return
  const available = window.innerHeight - stageEl.value.getBoundingClientRect().top - 48
  caseHeight.value = Math.min(reported, Math.max(available, 240))
}

function onWindowResize(): void {
  if (reportedHeight.value !== null) applyReportedHeight()
}

watch(reportedHeight, () => {
  if (reportedHeight.value === null) {
    caseHeight.value = null
    return
  }
  void nextTick(applyReportedHeight)
})

// 切换耗时：caseDef.id 变化 → ready/error 打点
watch(
  () => props.caseDef.id,
  () => {
    switchStartedAt = performance.now()
    switchDurationMs.value = null
  },
)
watch(status, (s) => {
  if (s === 'ready' || s === 'error') {
    switchDurationMs.value = Math.round(performance.now() - switchStartedAt)
  }
})

onMounted(() => {
  mountCase()
  window.addEventListener('resize', onWindowResize)
})
onBeforeUnmount(() => window.removeEventListener('resize', onWindowResize))
watch(theme, syncTheme)
// 案例可能在主题变化之后才就绪，ready 时补发当前主题
watch(status, (s) => {
  if (s === 'ready') syncTheme()
})
</script>

<template>
  <div
    class="iframe-host"
    :class="{ 'is-height-adaptive': isHeightAdaptive }"
    :style="hostStyle"
  >
    <div ref="stageEl" class="host-stage">
      <div ref="containerEl" class="iframe-container"></div>
      <LoadingSkeleton v-if="status === 'loading' || status === 'idle'" />
      <ErrorFallback
        v-else-if="status === 'error'"
        :message="errorMessage"
        :case-url="fallbackUrl"
        @retry="mountCase"
      />
    </div>
    <footer class="host-status">
      <span
        >iframe 加载
        <strong>{{ loadTimeMs === null ? '—' : `${loadTimeMs} ms` }}</strong>
      </span>
      <span
        >切换耗时
        <strong>{{ switchDurationMs === null ? '—' : `${switchDurationMs} ms` }}</strong>
      </span>
      <span
        >壳首屏
        <strong>{{ fcpMs === null ? '待测' : `${fcpMs} ms` }}</strong>
      </span>
      <span v-if="reportedMetrics?.fps !== undefined">
        案例 FPS <strong>{{ reportedMetrics.fps }}</strong>
      </span>
      <span v-if="reportedMetrics?.drawCalls !== undefined">
        draw calls <strong>{{ reportedMetrics.drawCalls }}</strong>
      </span>
    </footer>
  </div>
</template>

<style scoped>
.iframe-host {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
}

/* 高度自适应：阶段尺寸由 --case-height 决定，壳随内容收缩、页面级滚动 */
.iframe-host.is-height-adaptive {
  flex: 0 0 auto;
  min-height: 0;
}

.iframe-host.is-height-adaptive .host-stage {
  flex: 0 0 auto;
  height: var(--case-height);
}

.host-stage {
  position: relative;
  flex: 1;
  min-height: 0;
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

.host-status {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  padding: 6px 12px;
  border-top: 1px solid var(--border);
  background: var(--bg-elevated);
  font-size: 12px;
  color: var(--text-dim);
}

.host-status strong {
  color: var(--text);
  font-weight: 500;
}
</style>
