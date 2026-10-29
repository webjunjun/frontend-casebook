// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, type EffectScope } from 'vue'
import type { CaseDefinition } from '../config/cases'
import { READY_TIMEOUT_MS, useIframeCase } from './useIframeCase'

const CASE_ORIGIN = 'http://localhost:5174'

function makeCase(overrides: Partial<CaseDefinition> = {}): CaseDefinition {
  return {
    id: 'test-case',
    title: '测试案例',
    summary: 's',
    tech: [],
    thumbnail: '/t.svg',
    url: `${CASE_ORIGIN}/`,
    productionUrl: '',
    protocol: false,
    metrics: [],
    ...overrides,
  }
}

function mockContentWindow(el: HTMLIFrameElement): Window {
  const fake = { postMessage: vi.fn() } as unknown as Window
  Object.defineProperty(el, 'contentWindow', { value: fake, configurable: true })
  return fake
}

const scopes: EffectScope[] = []

function setup(overrides: Partial<CaseDefinition> = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const scope = effectScope()
  scopes.push(scope)
  const api = scope.run(() => useIframeCase())!
  const caseDef = makeCase(overrides)
  api.mount(caseDef, container)
  const el = container.querySelector('iframe')!
  const fakeWin = mockContentWindow(el)
  return { container, scope, api, caseDef, el, fakeWin }
}

function sendMessage(data: unknown, source: Window, origin: string): void {
  window.dispatchEvent(new MessageEvent('message', { source, origin, data }))
}

function readyMessage(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { type: 'case:ready', protocolVersion: '1', ...extra }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  for (const scope of scopes) scope.stop()
  scopes.length = 0
  document.body.innerHTML = ''
})

describe('useIframeCase 生命周期', () => {
  it('mount 创建 iframe 并设置安全属性', () => {
    const { container, caseDef, el } = setup()
    expect(el).toBeTruthy()
    expect(el.parentElement).toBe(container)
    expect(el.title).toContain(caseDef.title)
    expect(el.allowFullscreen).toBe(true)
    expect(el.getAttribute('sandbox')).toContain('allow-scripts')
    expect(el.getAttribute('sandbox')).toContain('allow-same-origin')
    expect(el.dataset.caseId).toBe(caseDef.id)
    expect(container.querySelectorAll('iframe').length).toBe(1)
  })

  it('非协议案例：load 事件进入 ready 并记录耗时', () => {
    const { api, el } = setup()
    expect(api.status.value).toBe('loading')
    el.dispatchEvent(new Event('load'))
    expect(api.status.value).toBe('ready')
    expect(api.loadTimeMs.value).toBeTypeOf('number')
  })

  it('非协议案例：error 事件进入错误态', () => {
    const { api, el } = setup()
    el.dispatchEvent(new Event('error'))
    expect(api.status.value).toBe('error')
    expect(api.errorMessage.value).toContain('加载失败')
  })

  it('8 秒超时未就绪进入错误态', () => {
    vi.useFakeTimers()
    const { api } = setup({ protocol: true })
    vi.advanceTimersByTime(READY_TIMEOUT_MS)
    expect(api.status.value).toBe('error')
    expect(api.errorMessage.value).toContain('超时')
  })

  it('协议案例：load 后仍等待 case:ready', () => {
    const { api, el, fakeWin } = setup({ protocol: true })
    el.dispatchEvent(new Event('load'))
    expect(api.status.value).toBe('loading')
    sendMessage(readyMessage(), fakeWin, CASE_ORIGIN)
    expect(api.status.value).toBe('ready')
  })

  it('协议案例：case:ready 携带指标时记录', () => {
    const { api, fakeWin } = setup({ protocol: true })
    sendMessage(readyMessage({ metrics: { fps: 60 } }), fakeWin, CASE_ORIGIN)
    expect(api.status.value).toBe('ready')
    expect(api.reportedMetrics.value?.fps).toBe(60)
  })
})

describe('useIframeCase 消息校验', () => {
  it('event.source 不是当前 iframe 时丢弃', () => {
    const { api } = setup({ protocol: true })
    const stranger = {} as unknown as Window
    sendMessage(readyMessage(), stranger, CASE_ORIGIN)
    expect(api.status.value).toBe('loading')
  })

  it('origin 不在白名单时丢弃', () => {
    const { api, fakeWin } = setup({ protocol: true })
    sendMessage(readyMessage(), fakeWin, 'http://evil.example.com')
    expect(api.status.value).toBe('loading')
  })

  it('生产环境只接受同源消息', () => {
    vi.stubEnv('PROD', true)
    const { api, fakeWin } = setup({ protocol: true })
    sendMessage(readyMessage(), fakeWin, CASE_ORIGIN)
    expect(api.status.value).toBe('loading')
    sendMessage(readyMessage(), fakeWin, window.location.origin)
    expect(api.status.value).toBe('ready')
  })

  it('caseId 与当前案例不一致时丢弃', () => {
    const { api, fakeWin } = setup({ protocol: true })
    sendMessage(readyMessage({ caseId: 'other-case' }), fakeWin, CASE_ORIGIN)
    expect(api.status.value).toBe('loading')
  })

  it('非法消息形状丢弃', () => {
    const { api, fakeWin } = setup({ protocol: true })
    sendMessage('hello', fakeWin, CASE_ORIGIN)
    sendMessage({ type: 'case:ready', protocolVersion: 123 }, fakeWin, CASE_ORIGIN)
    sendMessage({ type: 'unknown:thing' }, fakeWin, CASE_ORIGIN)
    expect(api.status.value).toBe('loading')
  })

  it('case:error fatal=true 进入错误态', () => {
    const { api, fakeWin } = setup({ protocol: true })
    sendMessage({ type: 'case:error', message: '案例崩溃', fatal: true }, fakeWin, CASE_ORIGIN)
    expect(api.status.value).toBe('error')
    expect(api.errorMessage.value).toContain('案例崩溃')
  })

  it('case:error fatal=false 不打断加载', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { api, fakeWin } = setup({ protocol: true })
    sendMessage({ type: 'case:error', message: '小问题', fatal: false }, fakeWin, CASE_ORIGIN)
    expect(api.status.value).toBe('loading')
    expect(warn).toHaveBeenCalled()
  })

  it('case:height 更新高度，非法值忽略', () => {
    const { api, fakeWin } = setup({ protocol: true })
    sendMessage({ type: 'case:height', height: 640 }, fakeWin, CASE_ORIGIN)
    expect(api.reportedHeight.value).toBe(640)
    sendMessage({ type: 'case:height', height: -5 }, fakeWin, CASE_ORIGIN)
    expect(api.reportedHeight.value).toBe(640)
  })

  it('case:metrics 更新指标', () => {
    const { api, fakeWin } = setup({ protocol: true })
    sendMessage({ type: 'case:metrics', metrics: { drawCalls: 42 } }, fakeWin, CASE_ORIGIN)
    expect(api.reportedMetrics.value?.drawCalls).toBe(42)
  })
})

describe('useIframeCase 销毁与切换', () => {
  it('切换案例：旧 iframe 先 about:blank，宽限期后移除', () => {
    vi.useFakeTimers()
    const { container, api, el: firstEl } = setup()
    api.mount(makeCase({ id: 'second' }), container)
    expect(firstEl.src).toContain('about:blank')
    expect(container.querySelectorAll('iframe').length).toBe(2)
    vi.advanceTimersByTime(300)
    expect(container.querySelectorAll('iframe').length).toBe(1)
    expect(container.querySelector('iframe')!.dataset.caseId).toBe('second')
  })

  it('连续切换：pending 的旧 iframe 被立即移除', () => {
    vi.useFakeTimers()
    const { container, api } = setup()
    api.mount(makeCase({ id: 'B' }), container)
    api.mount(makeCase({ id: 'C' }), container)
    const iframes = container.querySelectorAll('iframe')
    expect(iframes.length).toBe(2)
    expect(iframes[iframes.length - 1].dataset.caseId).toBe('C')
    vi.advanceTimersByTime(300)
    expect(container.querySelectorAll('iframe').length).toBe(1)
  })

  it('scope 销毁后监听被移除，消息不再处理', () => {
    const { scope, api, fakeWin } = setup({ protocol: true })
    scope.stop()
    sendMessage(readyMessage(), fakeWin, CASE_ORIGIN)
    expect(api.status.value).toBe('loading')
  })

  it('postToCase 以案例地址 origin 发送消息', () => {
    const { api, fakeWin } = setup()
    api.postToCase({ type: 'host:theme', theme: 'light' })
    expect(fakeWin.postMessage).toHaveBeenCalledWith(
      { type: 'host:theme', theme: 'light' },
      CASE_ORIGIN,
    )
  })
})
