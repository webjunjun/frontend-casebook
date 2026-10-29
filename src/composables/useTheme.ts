import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'casebook-theme'

/** 模块级单例：初始值由 index.html 内联脚本写入的 data-theme 决定，避免闪烁 */
const theme = ref<Theme>('dark')

export function useTheme() {
  function apply(next: Theme): void {
    theme.value = next
    document.documentElement.dataset.theme = next
    localStorage.setItem(STORAGE_KEY, next)
  }

  function init(): void {
    theme.value = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  }

  function toggle(): void {
    apply(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, apply, toggle, init }
}
