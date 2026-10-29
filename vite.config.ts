import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// GH Pages 子路径部署：构建默认 base /frontend-casebook/（APP_BASE 可覆盖）；
// 本地 dev 固定 '/'，preview 与构建产物 base 保持一致
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base =
    command === 'serve' && mode === 'development' ? '/' : env.APP_BASE || '/frontend-casebook/'
  return {
    plugins: [vue()],
    base,
  }
})
