import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { cases } from '../config/cases'
import { createAppRouter } from './index'

describe('路由', () => {
  const router = createAppRouter(createMemoryHistory())

  it('根路径重定向到第一个案例', async () => {
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('case')
    expect(router.currentRoute.value.params.caseId).toBe(cases[0].id)
  })

  it('未知案例 id 重定向到第一个案例', async () => {
    await router.push('/cases/unknown-id')
    expect(router.currentRoute.value.params.caseId).toBe(cases[0].id)
  })

  it('已知案例 id 直达对应案例', async () => {
    const target = cases[1]
    await router.push(`/cases/${target.id}`)
    expect(router.currentRoute.value.params.caseId).toBe(target.id)
  })
})
