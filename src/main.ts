import { createApp } from 'vue'
import { createWebHistory } from 'vue-router'
import App from './App.vue'
import { createAppRouter } from './router'
import './styles/base.css'

// 路由 base 与 vite base 统一由 import.meta.env.BASE_URL 驱动（GH Pages 子路径）
createApp(App)
  .use(createAppRouter(createWebHistory(import.meta.env.BASE_URL)))
  .mount('#app')
