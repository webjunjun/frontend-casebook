# <案例名>

> 复制本模板到各案例项目仓库，按实际情况填写；性能指标未实测时保留「待测」。

## 简介

一句话说明这个案例演示了什么能力。

## 运行方式

```bash
pnpm install
pnpm dev     # 本地开发（壳 config/cases.ts 的 url 指向这里）
pnpm build
```

## 技术要点

- 核心技术栈与关键实现（如：滚动驱动动画、纹理图集、贝塞尔平滑、LOD/合批等）。
- 已知限制与取舍。

## 接入作品集壳

- 壳侧元数据：`config/cases.ts` 对应条目（url / productionUrl / thumbnail / protocol）。
- 接入 case-bridge：`import './case-bridge.js'` 并将壳侧 `protocol` 置 `true`；支持高度上报时开启 `reportHeight`。

## 性能指标

| 指标       | 数值 | 测量方法                           | 测量环境              |
| ---------- | ---- | ---------------------------------- | --------------------- |
| 首屏加载   | 待测 | PerformanceObserver / 加载管线打点 | Chrome <版本>，<设备> |
| FPS        | 待测 | rAF 采样                           | 同上                  |
| draw calls | 待测 | renderer.info.render.calls         | 同上                  |

## 版权说明

- 素材来源与授权（模型、纹理、图标等）。
- 不包含真实密钥、用户数据或公司敏感信息。
