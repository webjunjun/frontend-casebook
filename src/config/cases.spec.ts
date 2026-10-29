import { describe, expect, it } from 'vitest'
import { cases, findCase } from './cases'

describe('案例配置', () => {
  it('至少包含一个案例', () => {
    expect(cases.length).toBeGreaterThan(0)
  })

  it('id 唯一', () => {
    const ids = new Set(cases.map((c) => c.id))
    expect(ids.size).toBe(cases.length)
  })

  it('必填字段非空', () => {
    for (const c of cases) {
      expect(c.title.trim()).not.toBe('')
      expect(c.summary.trim()).not.toBe('')
      expect(c.thumbnail.trim()).not.toBe('')
      expect(c.url.trim()).not.toBe('')
    }
  })

  it('每个案例都有指标占位且未实测写待测', () => {
    for (const c of cases) {
      expect(c.metrics.length).toBeGreaterThan(0)
      for (const m of c.metrics) {
        expect(m.label.trim()).not.toBe('')
        expect(m.value).toBe('待测')
        expect(m.method.trim()).not.toBe('')
      }
    }
  })

  it('findCase 可查到每个案例', () => {
    for (const c of cases) {
      expect(findCase(c.id)).toBe(c)
    }
    expect(findCase('not-exist')).toBeUndefined()
  })
})
