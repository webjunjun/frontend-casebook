/**
 * 壳与案例 iframe 之间的 postMessage 协议类型（壳侧权威定义）。
 * 案例接入方式：在案例项目里引入仓库根目录的 case-bridge.js（阶段 2 提供）。
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
  | { type: 'case:ready'; caseId: string; protocolVersion: string; metrics?: CaseMetrics }
  | { type: 'case:error'; caseId: string; message: string; fatal: boolean }
  | { type: 'case:height'; caseId: string; height: number }
  | { type: 'case:fullscreen'; caseId: string }
  | { type: 'case:metrics'; caseId: string; metrics: CaseMetrics }

/** 壳 → 案例 */
export type HostMessage = { type: 'host:theme'; theme: 'light' | 'dark' } | { type: 'host:ping' }

export type ProtocolMessage = CaseMessage | HostMessage
