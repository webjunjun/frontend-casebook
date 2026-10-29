import { onScopeDispose, ref, shallowRef } from 'vue'
import { getCaseUrl, type CaseDefinition } from '../config/cases'
import {
  isCaseMessage,
  PROTOCOL_VERSION,
  type CaseMetrics,
  type HostMessage,
} from '../types/case-protocol'

export type IframeStatus = 'idle' | 'loading' | 'ready' | 'error'

const SANDBOX_FLAGS = 'allow-scripts allow-same-origin allow-popups allow-forms'
/** 等待案例就绪的超时时间 */
export const READY_TIMEOUT_MS = 8000
/** 销毁宽限期：about:blank 后留给案例执行 pagehide 清理的时间 */
const DESTROY_GRACE_MS = 300

/**
 * 允许向壳发送消息的 origin 白名单：
 * - 生产：严格同源（location.origin）
 * - 开发：壳自身 + 案例 url 的 origin + VITE_CASE_DEV_ORIGINS 附加白名单
 */
export function getAllowedOrigins(caseDef: CaseDefinition): string[] {
  const origins = [window.location.origin]
  if (!import.meta.env.PROD) {
    try {
      origins.push(new URL(caseDef.url).origin)
    } catch {
      // 案例 url 非法时忽略，仅保留壳自身 origin
    }
    const extra = import.meta.env.VITE_CASE_DEV_ORIGINS
    if (extra) {
      for (const item of extra.split(',')) {
        const origin = item.trim()
        if (origin) origins.push(origin)
      }
    }
  }
  return origins
}

/**
 * 管理案例 iframe 生命周期，保证任意时刻 DOM 中至多一个真实案例 iframe：
 * - 消息三重校验：event.source === iframe.contentWindow、origin 白名单、caseId 一致
 * - 8 秒超时：未收到就绪信号（load 事件或 case:ready）即进入错误态
 * - 销毁：src='about:blank' → 300ms 宽限期（让案例执行 pagehide 清理）→ remove；
 *   宽限期内若挂载新案例则立即移除旧 iframe
 */
export function useIframeCase() {
  const status = ref<IframeStatus>('idle')
  const errorMessage = ref('')
  const loadTimeMs = ref<number | null>(null)
  const reportedHeight = ref<number | null>(null)
  const reportedMetrics = ref<CaseMetrics | null>(null)
  const iframeEl = shallowRef<HTMLIFrameElement | null>(null)

  let currentCase: CaseDefinition | null = null
  let startedAt = 0
  let timeoutTimer: number | undefined
  let pendingRemoval: { el: HTMLIFrameElement; timer: number } | null = null
  let messageHandler: ((event: MessageEvent) => void) | null = null

  function clearTimeoutTimer(): void {
    if (timeoutTimer !== undefined) {
      window.clearTimeout(timeoutTimer)
      timeoutTimer = undefined
    }
  }

  function removeMessageListener(): void {
    if (messageHandler) {
      window.removeEventListener('message', messageHandler)
      messageHandler = null
    }
  }

  function fail(message: string): void {
    clearTimeoutTimer()
    errorMessage.value = message
    status.value = 'error'
  }

  function flushPendingRemoval(): void {
    if (pendingRemoval) {
      window.clearTimeout(pendingRemoval.timer)
      pendingRemoval.el.remove()
      pendingRemoval = null
    }
  }

  function destroyIframe(): void {
    const el = iframeEl.value
    if (!el) return
    iframeEl.value = null
    currentCase = null
    clearTimeoutTimer()
    removeMessageListener()
    el.onload = null
    el.onerror = null
    el.src = 'about:blank'
    pendingRemoval = {
      el,
      timer: window.setTimeout(() => {
        el.remove()
        if (pendingRemoval?.el === el) pendingRemoval = null
      }, DESTROY_GRACE_MS),
    }
  }

  function handleMessage(event: MessageEvent): void {
    const el = iframeEl.value
    if (!el || !currentCase) return
    if (event.source !== el.contentWindow) return
    if (!getAllowedOrigins(currentCase).includes(event.origin)) return
    const data = event.data
    if (!isCaseMessage(data)) return
    if (data.caseId !== undefined && data.caseId !== currentCase.id) return

    switch (data.type) {
      case 'case:ready': {
        if (data.protocolVersion !== PROTOCOL_VERSION) {
          console.warn(
            `[casebook] 案例协议版本不匹配：期望 ${PROTOCOL_VERSION}，收到 ${data.protocolVersion}`,
          )
        }
        if (data.metrics) reportedMetrics.value = data.metrics
        clearTimeoutTimer()
        status.value = 'ready'
        break
      }
      case 'case:error': {
        if (data.fatal) {
          fail(`案例上报错误：${data.message}`)
        } else {
          console.warn(`[casebook] 案例非致命错误：${data.message}`)
        }
        break
      }
      case 'case:height': {
        if (Number.isFinite(data.height) && data.height > 0) {
          reportedHeight.value = Math.round(data.height)
        }
        break
      }
      case 'case:fullscreen': {
        el.requestFullscreen?.().catch(() => {
          // 缺少用户手势上下文时浏览器会拒绝，静默忽略
        })
        break
      }
      case 'case:metrics': {
        reportedMetrics.value = data.metrics
        break
      }
    }
  }

  /** 向当前案例发送壳消息（targetOrigin 取案例地址的 origin） */
  function postToCase(message: HostMessage): void {
    const win = iframeEl.value?.contentWindow
    if (!win || !currentCase) return
    try {
      win.postMessage(message, new URL(getCaseUrl(currentCase)).origin)
    } catch {
      // 案例 url 非法时静默忽略
    }
  }

  function mount(caseDef: CaseDefinition, container: HTMLElement): void {
    flushPendingRemoval()
    destroyIframe()
    currentCase = caseDef
    errorMessage.value = ''
    loadTimeMs.value = null
    reportedHeight.value = null
    reportedMetrics.value = null
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
      // 接入协议的案例以 case:ready 为准，load 事件只记录耗时
      if (!caseDef.protocol) {
        clearTimeoutTimer()
        status.value = 'ready'
      }
    }
    el.onerror = () => {
      fail('案例页面加载失败：请确认案例服务已启动、地址正确，且未禁止被 iframe 嵌入。')
    }
    iframeEl.value = el
    messageHandler = handleMessage
    window.addEventListener('message', messageHandler)
    timeoutTimer = window.setTimeout(() => {
      fail(
        `案例加载超时（${READY_TIMEOUT_MS / 1000} 秒）：若案例已接入 case-bridge 却未收到就绪信号，请检查案例控制台。`,
      )
    }, READY_TIMEOUT_MS)
    container.appendChild(el)
  }

  onScopeDispose(() => {
    destroyIframe()
    flushPendingRemoval()
  })

  return {
    status,
    errorMessage,
    loadTimeMs,
    reportedHeight,
    reportedMetrics,
    iframeEl,
    mount,
    postToCase,
  }
}
