export interface CaseBridgeMetrics {
  fps?: number
  drawCalls?: number
  loadTimeMs?: number
}

export interface CaseBridgeOptions {
  /** 案例 id（与壳配置一致）；不填也能工作，壳按 iframe 来源校验 */
  caseId?: string
  /** 自动上报文档高度变化（ResizeObserver），默认 true */
  reportHeight?: boolean
  /** 自动上报未捕获的运行时错误，默认 true */
  reportErrors?: boolean
  /** window load 后自动上报就绪，默认 true；需要更早就绪可手动调用 ready() */
  autoReady?: boolean
  /** 自定义消息目标窗口（默认 window.parent）；一般无需配置 */
  targetWindow?: Window | null
}

export interface CaseBridge {
  /** 上报就绪（可携带自测指标） */
  ready(metrics?: CaseBridgeMetrics): void
  /** 上报错误；fatal=true 时壳会进入错误态并显示重试 */
  reportError(message: string, fatal?: boolean): void
  /** 上报文档高度（px）；不传则取 documentElement.scrollHeight */
  sendHeight(height?: number): void
  /** 上报性能指标（fps / drawCalls / loadTimeMs） */
  reportMetrics(metrics: CaseBridgeMetrics): void
  /** 请求壳全屏运行区（需要用户手势上下文） */
  requestFullscreen(): void
  /** 移除全部监听与观察器 */
  destroy(): void
}

export function createCaseBridge(options?: CaseBridgeOptions): CaseBridge | null
export default createCaseBridge

declare global {
  interface Window {
    CaseBridge?: CaseBridge
  }
}
