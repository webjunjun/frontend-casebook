// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { cases } from '../config/cases'
import CaseSidebar from './CaseSidebar.vue'

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    MockIntersectionObserver.instances.push(this)
  }

  observe(): void {}

  unobserve(): void {}

  disconnect(): void {}
}

const cleanups: (() => void)[] = []

async function mountSidebar(path: string): Promise<HTMLDivElement> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/cases/:caseId', name: 'case', component: { template: '<div />' } }],
  })
  await router.push(path)
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp(CaseSidebar).use(router)
  app.mount(el)
  cleanups.push(() => {
    app.unmount()
    el.remove()
  })
  return el
}

afterEach(() => {
  for (const cleanup of cleanups) cleanup()
  cleanups.length = 0
  MockIntersectionObserver.instances = []
  vi.unstubAllGlobals()
})

describe('CaseSidebar', () => {
  it('无 IntersectionObserver 时回退为立即加载缩略图', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const el = await mountSidebar(`/cases/${cases[0].id}`)
    const imgs = el.querySelectorAll<HTMLImageElement>('img.case-thumb')
    expect(imgs).toHaveLength(cases.length)
    imgs.forEach((img, i) => {
      expect(img.getAttribute('src')).toBe(cases[i].thumbnail)
      expect(img.hasAttribute('data-src')).toBe(false)
    })
  })

  it('当前案例项标记 aria-current=page，其余项不标记', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const activeIndex = 1
    const el = await mountSidebar(`/cases/${cases[activeIndex].id}`)
    const links = el.querySelectorAll('a.case-item')
    links.forEach((link, i) => {
      if (i === activeIndex) {
        expect(link.getAttribute('aria-current')).toBe('page')
      } else {
        expect(link.hasAttribute('aria-current')).toBe(false)
      }
    })
  })

  it('有 IntersectionObserver 时先占位，进入视口后加载', async () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    const el = await mountSidebar(`/cases/${cases[0].id}`)
    const observer = MockIntersectionObserver.instances[0]
    expect(observer).toBeDefined()
    const imgs = el.querySelectorAll<HTMLImageElement>('img.case-thumb')
    imgs.forEach((img, i) => {
      expect(img.hasAttribute('data-src')).toBe(true)
      expect(img.getAttribute('src')).not.toBe(cases[i].thumbnail)
    })

    const first = imgs[0]
    observer.callback(
      [{ target: first, isIntersecting: true } as unknown as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver,
    )
    expect(first.getAttribute('src')).toBe(cases[0].thumbnail)
    expect(first.hasAttribute('data-src')).toBe(false)
    expect(imgs[1].hasAttribute('data-src')).toBe(true)
  })
})
