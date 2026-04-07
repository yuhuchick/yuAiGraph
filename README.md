# AI 知识图谱笔记

基于 **Next.js** 的 Web 前端，通过 **App Router API 路由** 代理到 **Spring Boot** 后端，实现文档解析、知识图谱可视化、AI 问答与分享等功能。

## 架构说明

```
浏览器 → Vercel（Next.js）→ /api/* 服务端代理 → Java 后端 → MySQL
```

- 浏览器只请求同源 `/api/*`，JWT 与业务逻辑在服务端转发，避免在浏览器直连后端域名。
- 本地开发时，将 `JAVA_API_BASE` 指向 `http://localhost:8080`。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16、React 19、TypeScript、Tailwind CSS 4 |
| BFF | Next.js Route Handlers（`app/api/**/route.ts`） |
| 后端 | 见同工作区或独立仓库中的 **Java Spring Boot** 项目（`ai-back`） |

## 环境变量

复制 `.env.example` 为 `.env.local`：

| 变量 | 说明 |
|------|------|
| `JAVA_API_BASE` | Java API 根地址。本地：`http://localhost:8080`；Vercel 生产：`https://你的 API 域名`（无尾斜杠） |

生产环境在 **Vercel → Project → Settings → Environment Variables** 中配置 `JAVA_API_BASE`，修改后需重新部署。

## 本地开发

```bash
npm install
npm run dev
```

默认 <http://localhost:3000>。请先启动后端（见 `ai-back` README），否则登录、笔记等接口会失败。

```bash
npm run build   # 生产构建
npm run start   # 本地预览生产构建
npm run lint
```

## 部署（前端）

推荐 **Vercel**：连接 Git 仓库，配置 `JAVA_API_BASE` 指向公网可访问的 HTTPS 后端地址。

注意：`api` 子域名建议 **DNS 直连源站**，不要对 API 域名套 CDN（否则易出现 TLS/403 等问题）。

## 仓库中的脚本

- `deploy.sh`：在 **自建 Linux 服务器** 上部署前端时使用（需 Node、PM2、Nginx 等）。若仅使用 Vercel 部署前端，可忽略。

## 相关仓库

- 后端 Java 服务：与本项目配套的 Spring Boot 应用（例如仓库名 `yuAiGraph-back` / `ai-back`）。

## 知识图谱可视化

- **交互 SVG 图谱**：`components/graph/knowledge-graph.tsx`（力导向 / 树 / 放射 / 网格等布局）。
- **多图表看板**：同一笔记在下方展示多块 **ECharts**（饼图、柱状图、折线图、雷达图、力导向网络等），数据均来自同一份 `GraphData`。
- **导出 PDF**：笔记页「导出 → 可视化 PDF」会生成单份 PDF，包含知识图谱栅格图、全部已注册的 ECharts 截图，以及文档要点表与内容速览表（正文使用在线加载的 Noto Sans SC 字体，离线失败时可能缺字）。
- **扩展新图表类型**：在 `lib/chart-registry.ts` 中调用 `registerGraphChart({ id, title, description, build })`，`build` 返回 `{ kind: "echarts", option }` 或 `{ kind: "table", columns, rows }`；内置列表由 `getGraphChartDefinitions()` 返回。

## 更多信息

- Next.js 行为以项目内 `node_modules/next` 文档为准（本项目使用的 Next 版本可能与公开文档有差异）。
- 代理与统一响应格式见 `lib/proxy.ts`、`lib/api.ts`。
