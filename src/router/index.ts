import { createRouter, createWebHistory, type Router, type RouterHistory } from 'vue-router'
import { cases, findCase } from '../config/cases'
import CaseView from '../views/CaseView.vue'

export function createAppRouter(history: RouterHistory = createWebHistory()): Router {
  const router = createRouter({
    history,
    routes: [
      { path: '/', redirect: () => ({ name: 'case', params: { caseId: cases[0].id } }) },
      { path: '/cases/:caseId', name: 'case', component: CaseView },
      {
        path: '/:pathMatch(.*)*',
        redirect: () => ({ name: 'case', params: { caseId: cases[0].id } }),
      },
    ],
  })

  router.beforeEach((to) => {
    if (to.name === 'case') {
      const raw = to.params.caseId
      const caseId = Array.isArray(raw) ? raw[0] : raw
      if (!caseId || !findCase(caseId)) {
        return { name: 'case', params: { caseId: cases[0].id } }
      }
    }
    return true
  })

  return router
}
