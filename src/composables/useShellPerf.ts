import { ref, type Ref } from 'vue'

/** 壳首屏 FCP（模块级单例，避免重复观察） */
const fcpMs = ref<number | null>(null)
let observed = false

/**
 * 观察壳自身的 first-contentful-paint（幂等）。
 * 无 PerformanceObserver 的环境静默返回 null（未实测时保持 null 占位）。
 */
export function useShellPerf(): { fcpMs: Ref<number | null> } {
  if (!observed) {
    observed = true
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              fcpMs.value = Math.round(entry.startTime)
              observer.disconnect()
              break
            }
          }
        })
        observer.observe({ type: 'paint', buffered: true })
      } catch {
        // 个别浏览器不支持 paint 类型，保持 null
      }
    }
  }
  return { fcpMs }
}

/** 测试专用：重置模块级状态 */
export function resetShellPerfForTests(): void {
  fcpMs.value = null
  observed = false
}
