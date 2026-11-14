export interface CaseMetric {
  label: string
  value: string
  /** 未实测时的测量方法 */
  method: string
}

export interface CaseDefinition {
  id: string
  title: string
  summary: string
  tech: string[]
  /** 缩略图路径（public/ 下，推荐 640×400 WebP） */
  thumbnail: string
  /** iframe 地址；开发环境可指向本地案例 dev server */
  url: string
  /** 生产环境地址；为空时回退到 url */
  productionUrl: string
  /** 案例是否接入 case-bridge 协议（ready/高度/全屏/主题上报） */
  protocol: boolean
  /** 性能指标占位；未实测一律写“待测” */
  metrics: CaseMetric[]
}

export const cases: CaseDefinition[] = [
  {
    id: 'fake-jump',
    title: '仿跳一跳小游戏',
    summary:
      '仿微信跳一跳：长按蓄力、松手起跳，抛物线运动与落地判定驱动连续跳跃计分，相机跟随聚焦性能指标而非美术。',
    tech: ['Three.js', '长按蓄力', '抛物线物理', '落地判定', '相机跟随'],
    thumbnail: '/thumbnails/fake-jump.svg',
    url: 'https://webjunjun.github.io/pure-project/threeDemo/fake_jump.html',
    productionUrl: '',
    protocol: false,
    metrics: [
      { label: '蓄力响应', value: '待测', method: 'pointerdown → 蓄力开始耗时采样' },
      { label: '跳跃帧率', value: '待测', method: 'rAF 采样' },
      { label: '落地判定延迟', value: '待测', method: '起跳 → 落地回调耗时采样' },
    ],
  },
  {
    id: 'pixi-scroll',
    title: '仿我在童话里遇到你的时光',
    summary: '滚动驱动的长卷叙事：视差分层、帧动画序列与纹理图集，节流与 ticker 同步保证流畅度。',
    tech: ['PixiJS', '滚动驱动', '纹理图集', 'rAF 同步'],
    thumbnail: '/thumbnails/pixi-scroll.svg',
    url: 'https://webjunjun.github.io/pixijs-parallax/',
    productionUrl: '',
    protocol: false,
    metrics: [
      { label: '滚动帧率', value: '待测', method: 'rAF 采样 + Performance API' },
      { label: '首屏可交互', value: '待测', method: 'PerformanceObserver 采集' },
      { label: '纹理显存', value: '待测', method: 'WebGL renderer 统计' },
    ],
  },
  {
    id: 'signature',
    title: 'Canvas 签名板',
    summary: '高 DPI 手写签名板：Pointer Events 采集、贝塞尔平滑、撤销重做与 PNG 导出。',
    tech: ['Canvas 2D', 'Pointer Events', '贝塞尔平滑', '导出 PNG'],
    thumbnail: '/thumbnails/signature.svg',
    url: 'https://webjunjun.github.io/pure-project/signDemo/signature.html',
    productionUrl: '',
    protocol: false,
    metrics: [
      { label: '笔画延迟', value: '待测', method: 'pointerdown → 首段渲染耗时采样' },
      { label: '内存占用', value: '待测', method: 'Chrome Performance Memory 面板' },
    ],
  },
  {
    id: 'dashboard-demo',
    title: '数据可视化大屏',
    summary:
      'Vue 3 数据大屏：ECharts 趋势/排行图与 GeoJSON 区域地图，DataV 边框装饰，按设计稿等比缩放适配任意分辨率，10 秒轮询聚合多接口数据后整屏刷新。',
    tech: ['Vue 3 + Vite', 'ECharts 6', 'DataV 边框', '等比缩放适配', '数据轮询'],
    thumbnail: '/thumbnails/dashboard.svg',
    url: 'https://webjunjun.github.io/vue3-dashboard-light/page1',
    productionUrl: '',
    protocol: false,
    metrics: [
      {
        label: '首屏可交互',
        value: '待测',
        method: 'PerformanceObserver 采集 FCP/LCP → 首个数据帧渲染',
      },
      {
        label: '轮询刷新耗时',
        value: '待测',
        method: '10s 轮询 → 5 个接口聚合 → 图表重绘耗时采样',
      },
      {
        label: '缩放适配重排',
        value: '待测',
        method: 'ResizeObserver 触发后 transform 缩放的重排耗时采样',
      },
    ],
  },
  {
    id: 'piano',
    title: '移动端钢琴',
    summary:
      'Web Audio 实时合成的移动端钢琴：多点触控与滑奏连续发声，可调主音量、八度切换与延音，关注按键到发声的链路延迟。',
    tech: ['Web Audio API', '多点触控', '滑奏识别', '实时合成'],
    thumbnail: '/thumbnails/piano.svg',
    url: 'https://webjunjun.github.io/pure-project/pianoDemo/piano.html',
    productionUrl: '',
    protocol: false,
    metrics: [
      { label: '发声延迟', value: '待测', method: 'pointerdown → AudioContext 发声耗时采样' },
      { label: '多指并发', value: '待测', method: '多指同时按下时同时发声数统计' },
      { label: '音频节点回收', value: '待测', method: '长时间弹奏后活跃 OscillatorNode 数量采样' },
    ],
  },
]

export function findCase(id: string): CaseDefinition | undefined {
  return cases.find((c) => c.id === id)
}

export function getCaseUrl(caseDef: CaseDefinition): string {
  return import.meta.env.PROD && caseDef.productionUrl !== '' ? caseDef.productionUrl : caseDef.url
}

/** public/ 资源 URL：拼接 Vite base，兼容 GH Pages 子路径部署 */
export function getAssetUrl(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '')
}
