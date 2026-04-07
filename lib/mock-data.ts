import { GraphData, NoteItem } from "@/lib/types";

export const mockNotes: NoteItem[] = [
  { id: "note-1", name: "人工智能导论", createdAt: "2026-04-01", nodeCount: 17, category: "学术" },
  { id: "note-2", name: "前端性能优化实践", createdAt: "2026-03-28", nodeCount: 12, category: "技术" },
  { id: "note-3", name: "React 状态管理深度解析", createdAt: "2026-03-20", nodeCount: 11, category: "技术" },
];

export const mockGraphMap: Record<string, GraphData> = {
  /* ─────────────────────────────────────────────────────────
     笔记 1：人工智能导论
     节点 14 个（概念 6 · 人物 4 · 事件 3 · 实体 4）
     关系 18 条
  ───────────────────────────────────────────────────────── */
  "note-1": {
    nodes: [
      // 概念
      { id: "a1",  name: "人工智能",       type: "concept", description: "让计算机模拟人类智能行为的学科，涵盖感知、推理、学习与决策。" },
      { id: "a2",  name: "机器学习",       type: "concept", description: "人工智能核心分支，通过数据驱动让模型自动归纳规律，无需显式编程。" },
      { id: "a3",  name: "深度学习",       type: "concept", description: "基于多层神经网络的学习范式，在视觉、语音、语言等领域取得突破。" },
      { id: "a4",  name: "强化学习",       type: "concept", description: "通过试错与奖励信号让智能体在环境交互中学习最优决策策略。" },
      { id: "a5",  name: "自然语言处理",   type: "concept", description: "让计算机理解、生成和翻译人类语言的研究领域，NLP 的核心任务。" },
      { id: "a6",  name: "计算机视觉",     type: "concept", description: "使机器从图像/视频中提取语义信息的学科，广泛应用于识别与检测。" },
      // 人物
      { id: "a7",  name: "图灵",           type: "person",  description: "艾伦·图灵，计算机科学奠基人，提出「图灵测试」以评估机器智能水平。" },
      { id: "a8",  name: "辛顿",           type: "person",  description: "Geoffrey Hinton，深度学习之父，反向传播算法奠基人，2024 诺贝尔奖得主。" },
      { id: "a9",  name: "吴恩达",         type: "person",  description: "Andrew Ng，Coursera 机器学习课程创始人，前百度 AI 实验室负责人。" },
      { id: "a10", name: "奥特曼",         type: "person",  description: "Sam Altman，OpenAI CEO，主导 ChatGPT 的产品化与商业化推广。" },
      // 事件
      { id: "a11", name: "AlphaGo 胜柯洁", type: "event",   description: "2017 年 DeepMind AlphaGo 以 3:0 完胜世界围棋冠军柯洁，引发全球关注。" },
      { id: "a12", name: "ChatGPT 发布",   type: "event",   description: "2022 年 11 月 OpenAI 发布 ChatGPT，两个月用户破亿，开启大模型时代。" },
      { id: "a13", name: "ImageNet 大赛",  type: "event",   description: "2012 年辛顿团队以深度卷积网络获 ImageNet 冠军，深度学习由此爆发。" },
      // 实体
      { id: "a14", name: "Transformer",    type: "object",  description: "2017 年 Google 提出的注意力机制架构，成为 GPT、BERT 等大模型的基础。" },
      { id: "a15", name: "大语言模型",     type: "object",  description: "基于 Transformer 的超大规模预训练模型，如 GPT-4、Claude、Gemini。" },
      { id: "a16", name: "神经网络",       type: "object",  description: "模拟生物神经元连接的数学模型，由输入层、隐藏层、输出层组成。" },
      { id: "a17", name: "GPU 集群",       type: "object",  description: "大规模并行计算单元，深度学习训练的核心基础设施，NVIDIA 主导市场。" },
    ],
    links: [
      { source: "a1",  target: "a2",  relationship: "包含" },
      { source: "a1",  target: "a5",  relationship: "包含" },
      { source: "a1",  target: "a6",  relationship: "包含" },
      { source: "a2",  target: "a3",  relationship: "发展出" },
      { source: "a2",  target: "a4",  relationship: "包含" },
      { source: "a3",  target: "a16", relationship: "依赖" },
      { source: "a3",  target: "a6",  relationship: "推动" },
      { source: "a16", target: "a14", relationship: "演进为" },
      { source: "a14", target: "a15", relationship: "催生" },
      { source: "a15", target: "a5",  relationship: "革新" },
      { source: "a7",  target: "a1",  relationship: "奠基" },
      { source: "a8",  target: "a3",  relationship: "开创" },
      { source: "a8",  target: "a13", relationship: "赢得" },
      { source: "a9",  target: "a2",  relationship: "推广" },
      { source: "a10", target: "a12", relationship: "主导" },
      { source: "a4",  target: "a11", relationship: "驱动" },
      { source: "a15", target: "a12", relationship: "支撑" },
      { source: "a17", target: "a3",  relationship: "加速" },
    ],
    /** 演示用：模拟 AI 解析生成的语义图表（与「文档要点」区域对应） */
    insightCharts: [
      {
        id: "demo_c1",
        title: "AI 子领域着墨对比（示例）",
        rationale: "柱状图对比文中不同技术方向的相对着墨强度。",
        chartType: "bar",
        categories: ["机器学习", "深度学习", "NLP", "计算机视觉", "强化学习"],
        series: [{ name: "相对权重", data: [8, 6, 5, 4, 3] }],
      },
      {
        id: "demo_c2",
        title: "深度学习里程碑（示意）",
        rationale: "表格归纳文中所述关键节点，比纯结构统计更贴近阅读。",
        chartType: "table",
        tableColumns: ["阶段", "代表事件", "意义"],
        tableRows: [
          ["兴起", "2012 AlexNet", "深度学习在视觉任务上取得突破，引发新一轮研究热潮。"],
          ["工程化", "2017 Transformer", "注意力机制成为 NLP 与多模态的基础构件。"],
          ["规模化", "2020+ 大模型", "算力与数据驱动下，通用能力与行业落地并行。"],
        ],
      },
      {
        id: "demo_c3",
        title: "深度学习关注度变化（示意）",
        rationale: "折线表示关键年份上的讨论热度趋势，对应文中的时间叙述。",
        chartType: "line",
        categories: ["2012", "2017", "2020", "2022", "2024"],
        series: [{ name: "热度指数", data: [2, 5, 6, 8, 9] }],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     笔记 2：前端性能优化实践
     节点 12 个（概念 4 · 人物 2 · 事件 2 · 实体 4）
     关系 15 条
  ───────────────────────────────────────────────────────── */
  "note-2": {
    nodes: [
      // 概念
      { id: "b1",  name: "首屏性能",    type: "concept", description: "用户首次看到可交互页面的速度体验，直接影响留存率与转化率。" },
      { id: "b2",  name: "懒加载",      type: "concept", description: "按需加载资源，减少初始包体积，改善 FCP 和 TTI 等关键指标。" },
      { id: "b3",  name: "缓存策略",    type: "concept", description: "利用 HTTP 缓存、Service Worker、CDN 减少重复请求，大幅提升访问速度。" },
      { id: "b4",  name: "代码分割",    type: "concept", description: "将代码按路由/模块拆分，配合动态 import 减少主包体积，提升首屏速度。" },
      // 人物
      { id: "b5",  name: "Addy Osmani", type: "person",  description: "Google Chrome 工程师，《JavaScript 设计模式》作者，性能优化布道者。" },
      { id: "b6",  name: "Paul Irish",  type: "person",  description: "Google Chrome DevTools 创始团队成员，Web 性能标准制定的重要推动者。" },
      // 事件
      { id: "b7",  name: "CWV 标准发布", type: "event",  description: "2020 年 Google 发布 Core Web Vitals，将 LCP/FID/CLS 纳入搜索排名因素。" },
      { id: "b8",  name: "HTTP/2 普及", type: "event",   description: "2015 年 HTTP/2 标准落地，多路复用大幅降低请求开销，推动 CDN 全面升级。" },
      // 实体
      { id: "b9",  name: "LCP 指标",    type: "object",  description: "最大内容绘制（Largest Contentful Paint），目标 < 2.5s，Core Web Vitals 核心之一。" },
      { id: "b10", name: "CDN",          type: "object",  description: "内容分发网络，将静态资源分布到边缘节点，大幅降低 TTFB 和传输延迟。" },
      { id: "b11", name: "Webpack",      type: "object",  description: "主流前端构建工具，支持 Tree Shaking、Code Splitting 等性能优化能力。" },
      { id: "b12", name: "Service Worker", type: "object", description: "浏览器后台脚本，可拦截请求实现离线缓存与预缓存，提升重访速度。" },
    ],
    links: [
      { source: "b1",  target: "b9",  relationship: "衡量" },
      { source: "b1",  target: "b2",  relationship: "优化手段" },
      { source: "b1",  target: "b3",  relationship: "优化手段" },
      { source: "b2",  target: "b4",  relationship: "依赖" },
      { source: "b4",  target: "b11", relationship: "由…实现" },
      { source: "b3",  target: "b10", relationship: "借助" },
      { source: "b3",  target: "b12", relationship: "利用" },
      { source: "b10", target: "b9",  relationship: "改善" },
      { source: "b12", target: "b3",  relationship: "实现" },
      { source: "b5",  target: "b2",  relationship: "推广" },
      { source: "b6",  target: "b7",  relationship: "推动" },
      { source: "b7",  target: "b9",  relationship: "定义" },
      { source: "b8",  target: "b10", relationship: "配合" },
      { source: "b11", target: "b4",  relationship: "支持" },
      { source: "b5",  target: "b1",  relationship: "研究" },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     笔记 3：React 状态管理深度解析
     节点 11 个（概念 4 · 人物 3 · 事件 2 · 实体 4）
     关系 14 条
  ───────────────────────────────────────────────────────── */
  "note-3": {
    nodes: [
      // 概念
      { id: "c1",  name: "状态管理",    type: "concept", description: "管理应用数据流与组件间共享状态的架构方案，是大型前端应用的核心挑战。" },
      { id: "c2",  name: "不可变数据",  type: "concept", description: "Redux 核心约束，状态只能通过纯函数 Reducer 替换，禁止直接修改原对象。" },
      { id: "c3",  name: "单向数据流",  type: "concept", description: "数据从 Store → View 单向流动，Action 触发 Reducer 更新，可预测性强。" },
      { id: "c4",  name: "响应式编程",  type: "concept", description: "以数据流与变化传播为核心范式，Zustand、Jotai、MobX 均采用此思路。" },
      // 人物
      { id: "c5",  name: "Dan Abramov", type: "person",  description: "Redux 核心作者，前 React 核心团队成员，以 Create React App 和 Redux Toolkit 闻名。" },
      { id: "c6",  name: "Daishi Kato", type: "person",  description: "Jotai 与 Zustand 作者，擅长原子化状态设计，日本独立开源开发者。" },
      { id: "c7",  name: "Sophie Alpert", type: "person", description: "前 React 核心团队负责人，推动了 Context API 和 Hooks 的设计与落地。" },
      // 事件
      { id: "c8",  name: "React Hooks 发布", type: "event",  description: "2019 年 React 16.8 正式推出 Hooks，彻底改变状态管理与组件设计范式。" },
      { id: "c9",  name: "Redux Toolkit 发布", type: "event", description: "2019 年 Redux Toolkit 1.0 发布，大幅简化 Redux 样板代码，成为官方推荐方案。" },
      // 实体
      { id: "c10", name: "Redux",       type: "object",  description: "基于 Flux 架构的可预测状态容器，严格单向数据流，生态庞大成熟。" },
      { id: "c11", name: "Zustand",     type: "object",  description: "轻量级状态库，API 极简，无 Provider 包裹，适合中小项目和局部状态。" },
      { id: "c12", name: "Jotai",       type: "object",  description: "原子化状态管理库，细粒度订阅，按需更新，对 React Concurrent 友好。" },
      { id: "c13", name: "Context API", type: "object",  description: "React 内置上下文机制，适合低频更新的全局数据，如主题色、国际化语言。" },
    ],
    links: [
      { source: "c1",  target: "c10", relationship: "方案之一" },
      { source: "c1",  target: "c11", relationship: "方案之一" },
      { source: "c1",  target: "c12", relationship: "方案之一" },
      { source: "c1",  target: "c13", relationship: "方案之一" },
      { source: "c10", target: "c2",  relationship: "遵循" },
      { source: "c10", target: "c3",  relationship: "遵循" },
      { source: "c11", target: "c4",  relationship: "基于" },
      { source: "c12", target: "c4",  relationship: "基于" },
      { source: "c5",  target: "c10", relationship: "创造" },
      { source: "c5",  target: "c9",  relationship: "推动" },
      { source: "c9",  target: "c10", relationship: "简化" },
      { source: "c6",  target: "c12", relationship: "创造" },
      { source: "c6",  target: "c11", relationship: "创造" },
      { source: "c7",  target: "c8",  relationship: "推动" },
      { source: "c8",  target: "c13", relationship: "完善" },
    ],
  },
};
