import { onScopeDispose, ref, shallowRef } from 'vue'
import { getCaseUrl, type CaseDefinition } from '../config/cases'

export type IframeStatus = 'idle' | 'loading' | 'ready' | 'error'

const SANDBOX_FLAGS = 'allow-scripts allow-same-origin allow-popups allow-forms'

/**
 * 管理案例 iframe 生命周期：任意时刻 DOM 中至多一个案例 iframe。
 * 阶段 1：仅创建/销毁与 load/error 状态；postMessage、超时、origin 校验在阶段 2 接入。
 */
export function useIframeCase() {
  const status = ref<IframeStatus>('idle')
  const errorMessage = ref('')
  const loadTimeMs = ref<number | null>(null)
  const iframeEl = shallowRef<HTMLIFrameElement | null>(null)
  let startedAt = 0

  function destroyIframe(): void {
    const el = iframeEl.value
    if (!el) return
    iframeEl.value = null
    el.onload = null
    el.onerror = null
    // 先 about:blank 断开页面，再移除节点
    el.src = 'about:blank'
    el.remove()
  }

  function mount(caseDef: CaseDefinition, container: HTMLElement): void {
    destroyIframe()
    errorMessage.value = ''
    loadTimeMs.value = null
    status.value = 'loading'
    startedAt = performance.now()

    const el = document.createElement('iframe')
    el.dataset.caseId = caseDef.id
    el.title = `${caseDef.title} 运行区`
    el.allowFullscreen = true
    el.setAttribute('allow', 'fullscreen')
    el.setAttribute('sandbox', SANDBOX_FLAGS)
    el.src = getCaseUrl(caseDef)
    el.onload = () => {
      loadTimeMs.value = Math.round(performance.now() - startedAt)
      status.value = 'ready'
    }
    el.onerror = () => {
      errorMessage.value =
        '案例页面加载失败：请确认案例服务已启动、地址正确，且未禁止被 iframe 嵌入。'
      status.value = 'error'
    }
    iframeEl.value = el
    container.appendChild(el)
  }

  onScopeDispose(() => destroyIframe())

  return { status, errorMessage, loadTimeMs, iframeEl, mount, destroyIframe }
}
