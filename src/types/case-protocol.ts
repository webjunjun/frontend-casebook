/**
 * 壳与案例 iframe 之间的 postMessage 协议类型（壳侧权威定义）。
 * 案例接入方式：在案例项目里引入仓库根目录的 case-bridge.js。
 *
 * caseId 为可选字段：壳侧按 event.source 锁定具体 iframe；
 * 若消息携带 caseId，则必须与当前案例一致，否则丢弃。
 */
export const PROTOCOL_VERSION = '1'

/** 壳侧 iframe 状态机 */
export type CaseStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface CaseMetrics {
  /** 帧率（案例自测） */
  fps?: number
  /** draw calls（3D 案例自测） */
  drawCalls?: number
  /** 案例首屏加载耗时 ms（案例自测） */
  loadTimeMs?: number
}

/** 案例 → 壳 */
export type CaseMessage =
  | {
      type: 'case:ready'
      caseId?: string
      protocolVersion: string
      metrics?: CaseMetrics
    }
  | { type: 'case:error'; caseId?: string; message: string; fatal: boolean }
  | { type: 'case:height'; caseId?: string; height: number }
  | { type: 'case:fullscreen'; caseId?: string }
  | { type: 'case:metrics'; caseId?: string; metrics: CaseMetrics }

/** 壳 → 案例 */
export type HostMessage = { type: 'host:theme'; theme: 'light' | 'dark' }

export type ProtocolMessage = CaseMessage | HostMessage

function hasOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string'
}

function hasOptionalCaseId(data: Record<string, unknown>): boolean {
  return hasOptionalString(data.caseId)
}

/** 运行时守卫：判断任意数据是否为合法的案例 → 壳消息 */
export function isCaseMessage(data: unknown): data is CaseMessage {
  if (typeof data !== 'object' || data === null) return false
  const msg = data as Record<string, unknown>
  switch (msg.type) {
    case 'case:ready':
      return hasOptionalCaseId(msg) && typeof msg.protocolVersion === 'string'
    case 'case:error':
      return (
        hasOptionalCaseId(msg) && typeof msg.message === 'string' && typeof msg.fatal === 'boolean'
      )
    case 'case:height':
      return hasOptionalCaseId(msg) && typeof msg.height === 'number'
    case 'case:fullscreen':
      return hasOptionalCaseId(msg)
    case 'case:metrics':
      return hasOptionalCaseId(msg) && typeof msg.metrics === 'object' && msg.metrics !== null
    default:
      return false
  }
}

/** 运行时守卫：判断任意数据是否为合法的壳 → 案例消息 */
export function isHostMessage(data: unknown): data is HostMessage {
  if (typeof data !== 'object' || data === null) return false
  const msg = data as Record<string, unknown>
  return msg.type === 'host:theme' && (msg.theme === 'light' || msg.theme === 'dark')
}
