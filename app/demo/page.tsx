"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ChartExportProvider } from "@/components/graph/chart-export-context";
import { NoteGraphStack } from "@/components/graph/note-graph-stack";
import { ExportMenu } from "@/components/note/export-menu";
import { VoiceQA } from "@/components/qa/voice-qa";
import { getToken, isTokenExpired } from "@/lib/auth";
import {
  DEMO_GRAPH_SVG_ID,
  DEMO_SAMPLE_OPTIONS,
  getDemoGraphData,
  getDemoNoteId,
  getDemoPageTitle,
  parseDemoSample,
  type DemoSampleId,
} from "@/lib/demo-sample";

function readAuthed(): boolean {
  if (typeof window === "undefined") return false;
  const t = getToken();
  return !!t && !isTokenExpired(t);
}

function DemoQaPanel({ sample }: { sample: DemoSampleId }) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const sync = () => setAuthed(readAuthed());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const noteId = getDemoNoteId(sample);

  const { examples, welcome, suggestions } = useMemo(() => {
    if (sample === "perf") {
      return {
        examples: ["首屏性能最关键指标是什么？", "懒加载和代码分割如何配合？"],
        welcome:
          "你好！已根据当前登录态连接后端。请针对本页「前端性能」演示图谱提问（需你的账号下存在对应笔记数据时回答才准确）。",
        suggestions: ["首屏性能最关键指标是什么？", "懒加载和代码分割如何配合？", "如何衡量 Core Web Vitals？"],
      };
    }
    if (sample === "react") {
      return {
        examples: ["Redux 与 Zustand 各适合什么场景？", "Context API 适合管什么状态？"],
        welcome:
          "你好！已根据当前登录态连接后端。请针对本页「React 状态」演示图谱提问（需你的账号下存在对应笔记数据时回答才准确）。",
        suggestions: ["Redux 与 Zustand 各适合什么场景？", "Context API 适合管什么状态？", "服务端组件里状态放哪里？"],
      };
    }
    return {
      examples: ["「深度学习」与「机器学习」是什么关系？", "图灵对人工智能有哪些贡献？"],
      welcome:
        "你好！已根据当前登录态连接后端。请针对本页「人工智能导论」演示图谱提问（需你的账号下存在对应笔记数据时回答才准确）。",
      suggestions: ["深度学习与机器学习是什么关系？", "图灵对人工智能有哪些贡献？", "Transformer 在图谱里和哪些节点相连？"],
    };
  }, [sample]);

  const loginRedirect = useMemo(() => {
    const path = sample === "ai" ? "/demo" : `/demo?sample=${sample}`;
    return `/login?redirect=${encodeURIComponent(path)}`;
  }, [sample]);

  if (authed) {
    return (
      <VoiceQA
        key={sample}
        noteId={noteId}
        welcomeMessage={welcome}
        suggestions={suggestions}
      />
    );
  }

  return (
    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-800">AI 知识问答</h3>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          登录后将使用当前会话调用流式问答，并关联与本演示同 ID 的笔记（如 note-1 / note-2 / note-3）。
        </p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3 px-4 py-6">
        <p className="text-center text-xs text-zinc-400">示例问题（登录后可对图谱实时提问）</p>
        <ul className="space-y-2 text-xs text-zinc-600">
          {examples.map((q) => (
            <li key={q} className="rounded-lg bg-zinc-50 px-3 py-2">
              「{q}」
            </li>
          ))}
        </ul>
        <Link
          href={loginRedirect}
          className="mt-2 block rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          登录后体验问答
        </Link>
      </div>
    </div>
  );
}

function DemoInner() {
  const searchParams = useSearchParams();
  const sample = useMemo(
    () => parseDemoSample(searchParams.get("sample")),
    [searchParams],
  );

  const graphData = useMemo(() => getDemoGraphData(sample), [sample]);
  const title = getDemoPageTitle(sample);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-6">

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs font-medium text-zinc-500">切换示例</span>
          {DEMO_SAMPLE_OPTIONS.map((opt) => {
            const active = sample === opt.id;
            const href = opt.id === "ai" ? "/demo" : `/demo?sample=${opt.id}`;
            return (
              <Link
                key={opt.id}
                href={href}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
                title={opt.hint}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>

        <ChartExportProvider>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-zinc-900">{title}</h1>
              <p className="mt-1 text-xs text-zinc-400">
                {graphData.nodes.length} 个节点 · {graphData.links.length} 条关系
                {graphData.insightCharts?.length ? ` · ${graphData.insightCharts.length} 张要点图` : ""}
              </p>
            </div>
            <ExportMenu noteName={title} graphData={graphData} svgId={DEMO_GRAPH_SVG_ID} />
          </div>

          <div className="grid gap-5">
            <NoteGraphStack data={graphData} svgId={DEMO_GRAPH_SVG_ID} />
          </div>
        </ChartExportProvider>
      </main>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#f8f9fb]">
          <AppHeader />
          <p className="p-12 text-center text-sm text-zinc-500">加载演示…</p>
        </div>
      }
    >
      <DemoInner />
    </Suspense>
  );
}
