/**
 * CaseBridge：让案例接入作品集壳的桥接脚本（零依赖单文件）。
 *
 * 用法（复制进案例项目）：
 *   1. 复制本文件到案例项目（如 public/case-bridge.js）
 *   2. 在 index.html 引入：<script type="module" src="/case-bridge.js"></script>
 *      引入后自动初始化（在 iframe 内时生效，独立打开时静默退出）。
 *   3. 可选 API（window.CaseBridge）：
 *      - ready(metrics)：在自定义时机上报就绪（默认 window load 时自动上报）
 *      - sendHeight(height?)：上报文档高度（默认已用 ResizeObserver 自动上报）
 *      - reportMetrics({ fps, drawCalls, loadTimeMs })：上报性能指标
 *      - reportError(message, fatal)：上报错误（默认已自动上报未捕获错误）
 *      - requestFullscreen()：请求壳全屏运行区
 *
 * 自动能力：
 *   - 就绪上报（case:ready，协议版本 1）
 *   - 运行时错误上报（case:error，非致命）
 *   - 高度上报（case:height，ResizeObserver 观察 documentElement）
 *   - 响应壳的主题切换（host:theme → <html data-theme="light|dark">）
 *
 * 安全说明：
 *   - 消息以 targetOrigin='*' 发送：案例无法预知壳的部署域名（开发跨端口、生产不同域）。
 *     消息只含案例 id、高度、指标等非敏感数据；壳侧会校验事件来源 iframe 与 origin。
 *   - 收到的 host:theme 会校验消息形状，仅写入 <html data-theme>，无其他副作用。
 */

const PROTOCOL_VERSION = '1'

export function createCaseBridge(options = {}) {
  if (typeof window === 'undefined') return null

  const opts = {
    caseId: undefined,
    reportHeight: true,
    reportErrors: true,
    autoReady: true,
    targetWindow: null,
    ...options,
  }

  const target = opts.targetWindow || window.parent
  if (!target || target === window) return null

  function withCaseId(extra = {}) {
    return opts.caseId ? { caseId: opts.caseId, ...extra } : extra
  }

  function post(message) {
    target.postMessage(message, '*')
  }

  function ready(metrics) {
    post(
      withCaseId({
        type: 'case:ready',
        protocolVersion: PROTOCOL_VERSION,
        ...(metrics ? { metrics } : {}),
      }),
    )
  }

  function reportError(message, fatal = false) {
    post(withCaseId({ type: 'case:error', message: String(message), fatal }))
  }

  function sendHeight(height) {
    const h = typeof height === 'number' ? height : document.documentElement.scrollHeight
    post(withCaseId({ type: 'case:height', height: h }))
  }

  function reportMetrics(metrics) {
    post(withCaseId({ type: 'case:metrics', metrics }))
  }

  function requestFullscreen() {
    post(withCaseId({ type: 'case:fullscreen' }))
  }

  function onHostMessage(event) {
    if (event.source !== target) return
    const data = event.data
    if (typeof data !== 'object' || data === null) return
    if (data.type === 'host:theme' && (data.theme === 'light' || data.theme === 'dark')) {
      document.documentElement.dataset.theme = data.theme
    }
  }

  function onError(event) {
    reportError(event.message || '未知运行时错误', false)
  }

  function onRejection(event) {
    reportError(event.reason?.message || String(event.reason), false)
  }

  function onAutoReady() {
    ready()
  }

  window.addEventListener('message', onHostMessage)

  if (opts.reportErrors) {
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
  }

  if (opts.autoReady) {
    window.addEventListener('load', onAutoReady)
  }

  let observer = null
  if (opts.reportHeight && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => sendHeight())
    observer.observe(document.documentElement)
  }

  function destroy() {
    window.removeEventListener('message', onHostMessage)
    if (opts.reportErrors) {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
    if (opts.autoReady) {
      window.removeEventListener('load', onAutoReady)
    }
    if (observer) {
      observer.disconnect()
      observer = null
    }
    if (window.CaseBridge === bridge) {
      delete window.CaseBridge
    }
  }

  const bridge = { ready, reportError, sendHeight, reportMetrics, requestFullscreen, destroy }
  window.CaseBridge = bridge
  return bridge
}

export default createCaseBridge

// 以 <script> 引入时自动初始化；独立打开（非 iframe）时静默退出
if (typeof window !== 'undefined') {
  createCaseBridge()
}
