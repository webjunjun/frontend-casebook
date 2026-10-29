/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 开发环境允许的案例消息来源（逗号分隔的 origin 白名单）。
   * 默认已自动包含每个案例 url 的 origin；仅当案例地址无法从 url 推导时才需要配置。
   * 生产环境忽略此配置，严格校验同源（location.origin）。
   */
  readonly VITE_CASE_DEV_ORIGINS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
