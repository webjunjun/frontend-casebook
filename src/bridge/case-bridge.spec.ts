// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCaseBridge, type CaseBridge, type CaseBridgeOptions } from '../../case-bridge.js'

const bridges: CaseBridge[] = []

function makeTarget() {
  const received: unknown[] = []
  const target = {
    postMessage: vi.fn((msg: unknown) => {
      received.push(msg)
    }),
  }
  return { target: target as unknown as Window, received }
}

function setupBridge(options: CaseBridgeOptions = {}) {
  const { target, received } = makeTarget()
  const bridge = createCaseBridge({ targetWindow: target, ...options })
  if (bridge) bridges.push(bridge)
  return { bridge, target, received }
}

afterEach(() => {
  for (const bridge of bridges) bridge.destroy()
  bridges.length = 0
  delete document.documentElement.dataset.theme
})

describe('case-bridge 初始化', () => {
  it('非 iframe 环境（无 parent）返回 null', () => {
    expect(createCaseBridge()).toBeNull()
  })

  it('注入 targetWindow 后正常初始化', () => {
    const { bridge } = setupBridge()
    expect(bridge).not.toBeNull()
  })
})

describe('case-bridge 自动上报', () => {
  it('window load 后自动上报 case:ready（协议版本 1）', () => {
    const { received } = setupBridge()
    window.dispatchEvent(new Event('load'))
    expect(received).toEqual([{ type: 'case:ready', protocolVersion: '1' }])
  })

  it('autoReady=false 时不自动上报', () => {
    const { received } = setupBridge({ autoReady: false })
    window.dispatchEvent(new Event('load'))
    expect(received).toEqual([])
  })

  it('未捕获错误自动上报为非致命 case:error', () => {
    const { received } = setupBridge()
    window.dispatchEvent(new ErrorEvent('error', { message: 'boom' }))
    expect(received).toEqual([{ type: 'case:error', message: 'boom', fatal: false }])
  })

  it('unhandledrejection 自动上报', () => {
    const { received } = setupBridge()
    window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'oops' }))
    expect(received).toEqual([{ type: 'case:error', message: 'oops', fatal: false }])
  })
})

describe('case-bridge API', () => {
  it('配置 caseId 后消息携带 caseId', () => {
    const { received } = setupBridge({ caseId: 'demo' })
    window.dispatchEvent(new Event('load'))
    expect(received[0]).toMatchObject({ type: 'case:ready', caseId: 'demo' })
  })

  it('ready 可携带指标', () => {
    const { bridge, received } = setupBridge({ autoReady: false })
    bridge!.ready({ fps: 60, loadTimeMs: 120 })
    expect(received).toEqual([
      { type: 'case:ready', protocolVersion: '1', metrics: { fps: 60, loadTimeMs: 120 } },
    ])
  })

  it('sendHeight / reportMetrics / reportError 按协议发送', () => {
    const { bridge, received } = setupBridge()
    bridge!.sendHeight(500)
    bridge!.reportMetrics({ drawCalls: 42 })
    bridge!.reportError('严重错误', true)
    expect(received).toEqual([
      { type: 'case:height', height: 500 },
      { type: 'case:metrics', metrics: { drawCalls: 42 } },
      { type: 'case:error', message: '严重错误', fatal: true },
    ])
  })

  it('requestFullscreen 发送全屏请求', () => {
    const { bridge, received } = setupBridge()
    bridge!.requestFullscreen()
    expect(received).toEqual([{ type: 'case:fullscreen' }])
  })
})

describe('case-bridge 接收壳消息', () => {
  it('host:theme 写入 <html data-theme>', () => {
    const { target } = setupBridge()
    window.dispatchEvent(
      new MessageEvent('message', {
        source: target,
        data: { type: 'host:theme', theme: 'dark' },
      }),
    )
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('来源不是壳时忽略', () => {
    const { bridge } = setupBridge()
    window.dispatchEvent(
      new MessageEvent('message', {
        source: window,
        data: { type: 'host:theme', theme: 'dark' },
      }),
    )
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(bridge).not.toBeNull()
  })

  it('非法主题值忽略', () => {
    const { target } = setupBridge()
    window.dispatchEvent(
      new MessageEvent('message', {
        source: target,
        data: { type: 'host:theme', theme: 'hacker' },
      }),
    )
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})

describe('case-bridge 销毁', () => {
  it('destroy 后不再上报错误', () => {
    const { bridge, received } = setupBridge()
    bridge!.destroy()
    window.dispatchEvent(new ErrorEvent('error', { message: 'after-destroy' }))
    expect(received).toEqual([])
  })
})
