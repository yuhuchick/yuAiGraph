"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";

const features = [
  {
    icon: "⬆",
    title: "上传即解析",
    desc: "支持 PDF / Word / TXT，上传后 AI 自动提取知识点与关系，无需手动整理。",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: "◎",
    title: "图谱可视化",
    desc: "力导向布局，节点可拖拽，点击高亮关联路径，直观呈现知识结构。",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: "✦",
    title: "AI 智能问答",
    desc: "基于图谱内容进行语义检索，流式输出回答，支持多轮追问。",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: "↗",
    title: "导出与分享",
    desc: "一键导出图谱为图片 / PDF，生成分享链接，支持查看与编辑权限控制。",
    color: "bg-emerald-50 text-emerald-600",
  },
];

const stats = [
  { value: "1 000+", label: "页 PDF 支持" },
  { value: "< 30s", label: "平均解析耗时" },
  { value: "4 类", label: "实体类型" },
  { value: "∞", label: "图谱无限扩展" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fb]">
      <AppHeader />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pb-24 pt-20">
          {/* Background blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle at center, #6366f1 0%, #8b5cf6 40%, transparent 70%)",
              filter: "blur(72px)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-10 h-72 w-72 translate-x-1/3 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
              filter: "blur(56px)",
            }}
          />

          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
              AI 驱动 · 知识结构化
            </span>

            <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              输入文字，
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)",
                }}
              >
                即刻生成知识图谱
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-zinc-500 sm:text-lg">
              上传 PDF、Word 或直接输入文本，AI 自动提取实体与关系，
              <br className="hidden sm:block" />
              生成可交互的知识图谱，让知识脉络一目了然。
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-200 active:scale-95"
              >
                开始使用
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/note/note-1"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-95"
              >
                查看演示图谱
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-y border-zinc-200 bg-white">
          <div className="mx-auto grid max-w-4xl grid-cols-2 divide-x divide-y divide-zinc-100 px-4 sm:grid-cols-4 sm:divide-y-0">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 px-6 py-6 text-center">
                <span className="text-2xl font-bold text-zinc-900">{s.value}</span>
                <span className="text-xs text-zinc-500">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold text-zinc-900 sm:text-3xl">
              完整的知识管理闭环
            </h2>
            <p className="text-zinc-500">从输入到洞察，全程 AI 辅助</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-semibold ${f.color}`}
                >
                  {f.icon}
                </span>
                <h3 className="text-sm font-semibold text-zinc-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-indigo-600 px-8 py-14 text-center shadow-xl shadow-indigo-200">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  "radial-gradient(ellipse at top left, #a78bfa 0%, transparent 60%), radial-gradient(ellipse at bottom right, #06b6d4 0%, transparent 60%)",
              }}
            />
            <h2 className="relative mb-4 text-2xl font-bold text-white sm:text-3xl">
              立刻开始构建你的知识图谱
            </h2>
            <p className="relative mb-8 text-indigo-200">免费使用，无需信用卡</p>
            <Link
              href="/dashboard"
              className="relative inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold text-indigo-700 shadow-md transition hover:bg-indigo-50 active:scale-95"
            >
              立即体验
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-400">
        © 2026 AI 知识图谱笔记 · 基于 Next.js 16 + React 19 构建
      </footer>
    </div>
  );
}
