import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetShellPerfForTests, useShellPerf } from './useShellPerf'

class MockObserver {
  static instances: MockObserver[] = []

  readonly callback: PerformanceObserverCallback

  constructor(callback: PerformanceObserverCallback) {
    this.callback = callback
    MockObserver.instances.push(this)
  }

  observe(): void {}

  disconnect(): void {}

  emit(entries: PerformanceEntry[]): void {
    this.callback(
      {
        getEntries: () => entries,
        getEntriesByName: () => [],
        getEntriesByType: () => [],
      } as unknown as PerformanceObserverEntryList,
      this as unknown as PerformanceObserver,
    )
  }
}

describe('useShellPerf', () => {
  beforeEach(() => {
    resetShellPerfForTests()
    MockObserver.instances = []
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('无 PerformanceObserver 时 fcpMs 保持 null', () => {
    vi.stubGlobal('PerformanceObserver', undefined)
    const { fcpMs } = useShellPerf()
    expect(fcpMs.value).toBeNull()
  })

  it('捕获 first-contentful-paint 后回填 fcpMs', () => {
    vi.stubGlobal('PerformanceObserver', MockObserver)
    const { fcpMs } = useShellPerf()
    expect(MockObserver.instances).toHaveLength(1)
    MockObserver.instances[0].emit([
      { name: 'first-contentful-paint', startTime: 123.4 } as PerformanceEntry,
    ])
    expect(fcpMs.value).toBe(123)
  })

  it('单例：重复调用不再创建观察器', () => {
    vi.stubGlobal('PerformanceObserver', MockObserver)
    useShellPerf()
    useShellPerf()
    expect(MockObserver.instances).toHaveLength(1)
  })
})
