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
    id: 'pixi-scroll',
    title: 'PixiJS 长卷滚动动画',
    summary: '滚动驱动的长卷叙事：视差分层、帧动画序列与纹理图集，节流与 ticker 同步保证流畅度。',
    tech: ['PixiJS', '滚动驱动', '纹理图集', 'rAF 同步'],
    thumbnail: '/thumbnails/pixi-scroll.svg',
    url: 'http://localhost:5174',
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
    url: 'http://localhost:5175',
    productionUrl: '',
    protocol: false,
    metrics: [
      { label: '笔画延迟', value: '待测', method: 'pointerdown → 首段渲染耗时采样' },
      { label: '内存占用', value: '待测', method: 'Chrome Performance Memory 面板' },
    ],
  },
  {
    id: 'three-house',
    title: 'Three.js 3D 看房',
    summary:
      '3D 空间漫游与交互可视化：GLTF/DRACO 加载、LOD 与合批、热点标注与轨道/第一人称双模式。',
    tech: ['Three.js', 'GLTF/DRACO', 'LOD', 'draw call 优化'],
    thumbnail: '/thumbnails/three-house.svg',
    url: 'http://localhost:5176',
    productionUrl: '',
    protocol: false,
    metrics: [
      { label: '首屏加载', value: '待测', method: 'Performance API + 资源加载统计' },
      { label: 'FPS', value: '待测', method: 'rAF 采样' },
      { label: 'draw calls', value: '待测', method: 'renderer.info.render.calls' },
    ],
  },
  {
    id: 'medieval',
    title: 'Three.js 中世纪乡村',
    summary: '中世纪乡村场景展示：模型加载管线、LOD、合批与阴影优化，聚焦性能指标而非美术。',
    tech: ['Three.js', '模型加载', '合批', '阴影优化'],
    thumbnail: '/thumbnails/medieval.svg',
    url: 'http://localhost:5177',
    productionUrl: '',
    protocol: false,
    metrics: [
      { label: '场景加载时间', value: '待测', method: '加载管线打点统计' },
      { label: 'FPS', value: '待测', method: 'rAF 采样' },
      { label: 'draw calls', value: '待测', method: 'renderer.info.render.calls' },
      { label: '显存占用', value: '待测', method: 'renderer.info.memory' },
    ],
  },
]

export function findCase(id: string): CaseDefinition | undefined {
  return cases.find((c) => c.id === id)
}

export function getCaseUrl(caseDef: CaseDefinition): string {
  return import.meta.env.PROD && caseDef.productionUrl !== '' ? caseDef.productionUrl : caseDef.url
}
