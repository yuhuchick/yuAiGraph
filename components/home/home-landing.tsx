"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
const HERO_TITLE_LINE1 = "文档进，图谱出";
const HERO_TITLE_LINE2 = "结构化知识的下一代工作台";
const HERO_TITLE_ARIA = `${HERO_TITLE_LINE1}。${HERO_TITLE_LINE2}`;

const heroTitleClass =
  "font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]";

function HeroTypewriterTitle({ instant }: { instant: boolean }) {
  const [line1, setLine1] = useState(() => (instant ? HERO_TITLE_LINE1 : ""));
  const [line2, setLine2] = useState(() => (instant ? HERO_TITLE_LINE2 : ""));
  const [done, setDone] = useState(instant);

  useEffect(() => {
    if (instant) return;
    let i1 = 0;
    let i2 = 0;
    const ms = 130;
    const id = window.setInterval(() => {
      if (i1 < HERO_TITLE_LINE1.length) {
        i1 += 1;
        setLine1(HERO_TITLE_LINE1.slice(0, i1));
        return;
      }
      if (i2 < HERO_TITLE_LINE2.length) {
        i2 += 1;
        setLine2(HERO_TITLE_LINE2.slice(0, i2));
        return;
      }
      setDone(true);
      window.clearInterval(id);
    }, ms);
    return () => window.clearInterval(id);
  }, [instant]);

  return (
    <div className="relative mb-4 w-full">
      <h1 className={`invisible ${heroTitleClass}`} aria-hidden>
        {HERO_TITLE_LINE1}
        <br />
        <span className="gradient-text">{HERO_TITLE_LINE2}</span>
      </h1>
      <h1
        className={`absolute left-0 right-0 top-0 text-center ${heroTitleClass}`}
        aria-label={HERO_TITLE_ARIA}
      >
        {line1}
        <br />
        <span className="gradient-text">{line2}</span>
        {!done && (
          <span
            className="ml-0.5 inline-block h-[0.85em] w-0.5 translate-y-[0.08em] bg-primary align-middle animate-pulse"
            aria-hidden
          />
        )}
      </h1>
    </div>
  );
}

const features = [
  {
    icon: "⚡",
    title: "智能文档解析",
    desc: "支持 PDF、Word、TXT；异步任务进度可追踪。AI 抽取实体与关系，并按语义生成多类要点图（占比、对比、趋势等），告别单一视图。",
    accent: "from-amber-700/18 to-orange-600/10",
    iconBg: "bg-amber-900/10 text-amber-900 ring-1 ring-amber-800/25",
  },
  {
    icon: "◈",
    title: "交互式知识图谱",
    desc: "力导向、树形、放射、网格布局一键切换；节点拖拽、路径高亮。同屏叠加 ECharts 统计与网络视图，结构数据一眼对齐。",
    accent: "from-emerald-800/18 to-teal-700/10",
    iconBg: "bg-emerald-900/10 text-emerald-900 ring-1 ring-emerald-800/25",
  },
  {
    icon: "◇",
    title: "图谱感知问答",
    desc: "基于当前笔记上下文与知识结构的流式对话，Markdown 实时渲染；适合复盘概念关系、快速检索要点。",
    accent: "from-stone-600/18 to-stone-500/10",
    iconBg: "bg-stone-700/10 text-stone-800 ring-1 ring-stone-600/25",
  },
  {
    icon: "⎘",
    title: "导出与协作",
    desc: "JSON 全量数据、知识图谱 SVG、图表 PNG 打包 ZIP 或完整资源包；生成分享链接，支持浏览 / 编辑权限控制。",
    accent: "from-orange-800/18 to-red-900/10",
    iconBg: "bg-orange-900/10 text-orange-950 ring-1 ring-orange-800/25",
  },
];

const stats = [
  { value: "100MB", label: "单文件上限", sub: "可配置" },
  { value: "SSE", label: "流式问答", sub: "低延迟" },
  { value: "4+1", label: "实体 + 图表", sub: "可扩展" },
  { value: "JWT", label: "安全会话", sub: "BFF 代理" },
];

function staggerContainer(reduce: boolean | null, delay = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduce ? 0 : 0.09,
        delayChildren: reduce ? 0 : delay,
      },
    },
  };
}

function staggerItem(reduce: boolean | null): Variants {
  return {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

export function HomeLanding() {
  const reduce = useReducedMotion();

  return (
    <>
      <main className="flex-1 overflow-x-hidden">
        {/* ── Hero ── */}
        <section className="relative pb-20 pt-16 sm:pb-28 sm:pt-24">
          <div className="home-hero-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent_95%)]" />

          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 z-[1] h-[min(560px,90vw)] w-[min(560px,90vw)] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 40% 40%, rgba(154,52,18,0.28), rgba(180,83,9,0.12) 45%, transparent 70%)",
              filter: "blur(48px)",
            }}
            animate={
              reduce
                ? {}
                : {
                    scale: [1, 1.06, 1],
                    opacity: [0.65, 0.85, 0.65],
                  }
            }
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-20 top-20 z-[1] h-64 w-64 rounded-full sm:h-80 sm:w-80"
            style={{
              background: "radial-gradient(circle, rgba(22,101,52,0.22), transparent 65%)",
              filter: "blur(40px)",
            }}
            animate={
              reduce
                ? {}
                : {
                    x: [0, -12, 0],
                    y: [0, 16, 0],
                  }
            }
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-16 bottom-10 z-[1] h-48 w-48 rounded-full sm:bottom-20"
            style={{
              background: "radial-gradient(circle, rgba(120,113,108,0.25), transparent 65%)",
              filter: "blur(36px)",
            }}
            animate={
              reduce
                ? {}
                : {
                    x: [0, 20, 0],
                    opacity: [0.4, 0.65, 0.4],
                  }
            }
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer(reduce, 0)}
              className="flex flex-col items-center"
            >
              <motion.div variants={staggerItem(reduce)}>
                <span className="relative mb-6 inline-flex items-center gap-2 overflow-hidden rounded-full border border-primary/25 bg-card/80 px-4 py-1.5 text-xs font-medium text-primary shadow-sm backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Next.js · Spring Boot · 流式 AI
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-card/50 to-transparent animate-shimmer" />
                </span>
              </motion.div>

              <motion.div variants={staggerItem(reduce)} className="w-full">
                <HeroTypewriterTitle
                  key={reduce === true ? "title-reduced" : "title-type"}
                  instant={reduce === true}
                />
              </motion.div>

              <motion.p
                variants={staggerItem(reduce)}
                className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                上传 PDF / Word / 文本
              </motion.p>
              <motion.p
                variants={staggerItem(reduce)}
                className="mx-auto mb-2 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                由大模型抽取实体、关系与可量化要点
              </motion.p>
              <motion.p
                variants={staggerItem(reduce)}
                className="mb-8 text-xs font-medium uppercase tracking-[0.2em] text-primary/90"
              >
                解析 · 可视化 · 对话 · 导出
              </motion.p>

              <motion.div
                variants={staggerItem(reduce)}
                className="flex flex-wrap items-center justify-center gap-3"
              >
                <motion.div whileHover={reduce ? {} : { scale: 1.03 }} whileTap={reduce ? {} : { scale: 0.98 }}>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-amber-800 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:from-primary-hover hover:to-amber-900 hover:shadow-primary/30"
                  >
                    开始使用
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </motion.div>
                <motion.div whileHover={reduce ? {} : { scale: 1.02 }} whileTap={reduce ? {} : { scale: 0.98 }}>
                  <Link
                    href="/demo"
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/90 px-7 py-3.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm transition hover:border-primary/35 hover:bg-primary-light/80 hover:text-primary"
                  >
                    零登录体验演示
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="relative border-y border-border/90 bg-card/75 backdrop-blur-sm">
          <div className="mx-auto grid max-w-5xl grid-cols-2 sm:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ delay: reduce ? 0 : i * 0.07, duration: 0.4 }}
                className="flex flex-col items-center gap-0.5 border-b border-border py-8 text-center sm:border-b-0 sm:border-r sm:border-border sm:last:border-r-0"
              >
                <span className="bg-gradient-to-r from-primary via-amber-800 to-accent bg-clip-text font-mono text-2xl font-semibold tabular-nums text-transparent sm:text-3xl">
                  {s.value}
                </span>
                <span className="text-xs font-semibold text-foreground">{s.label}</span>
                <span className="text-[10px] text-muted-foreground">{s.sub}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="relative mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduce ? 0 : 0.5 }}
            className="mb-14 text-center"
          >
            <h2 className="mb-3 font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              全链路能力，为深度阅读而生
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              从非结构化文本到可计算、可分享的知识资产——前后端分离架构，API 经 BFF 同源代理，兼顾安全与体验。
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: reduce ? 0 : i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduce ? {} : { y: -6, transition: { type: "spring", stiffness: 400, damping: 22 } }}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card/90 p-5 shadow-sm shadow-stone-900/5 backdrop-blur-sm transition-[box-shadow] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
              >
                <div
                  aria-hidden
                  className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${f.accent} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
                />
                <span
                  className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-lg ${f.iconBg}`}
                >
                  {f.icon}
                </span>
                <h3 className="relative font-serif text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="relative text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto max-w-6xl px-4 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: reduce ? 1 : 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-primary to-stone-950 px-8 py-14 text-center shadow-2xl shadow-stone-900/35"
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(255,252,246,0.28), transparent), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(22,101,52,0.35), transparent)",
              }}
              animate={reduce ? {} : { opacity: [0.35, 0.5, 0.35] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px]"
            />
            <h2 className="relative mb-3 font-serif text-2xl font-semibold text-[#fffcf6] sm:text-3xl">
              准备好升级你的知识工作流？
            </h2>
            <p className="relative mb-8 text-sm text-stone-200 sm:text-base">
              开源前后端可自建部署；云端一键对接 Java API，即刻启用解析与对话能力。
            </p>
            <motion.div whileHover={reduce ? {} : { scale: 1.04 }} whileTap={reduce ? {} : { scale: 0.98 }} className="relative inline-block">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-card px-8 py-3.5 text-sm font-semibold text-primary shadow-lg transition hover:bg-primary-light"
              >
                免费注册
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-t border-border/90 bg-card/80 py-8 text-center text-xs text-muted-foreground backdrop-blur-sm"
      >
        <p>© 2026 AI 知识图谱笔记 · Next.js 16 · React 19 · TypeScript</p>
        <p className="mt-1 text-[10px] text-muted-foreground/90">图谱可视化 · ECharts · 流式 SSE</p>
      </motion.footer>
    </>
  );
}
