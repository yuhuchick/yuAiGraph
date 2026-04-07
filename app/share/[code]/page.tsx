"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GitHubRepoLinks } from "@/components/layout/github-repo-links";
import { ChartExportProvider } from "@/components/graph/chart-export-context";
import { NoteGraphStack } from "@/components/graph/note-graph-stack";
import { ExportMenu } from "@/components/note/export-menu";
import { api, ApiError } from "@/lib/api";
import type { SharedGraphData } from "@/lib/types";

export default function SharedNotePage() {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<SharedGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    api.getSharedGraph(code)
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setError("分享链接不存在或已失效");
        } else {
          setError("加载失败，请稍后重试");
        }
      })
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* 简洁顶栏 */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="group flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm transition group-hover:bg-indigo-500">K</span>
            <span className="text-sm font-semibold tracking-tight text-zinc-900">知识图谱<span className="text-indigo-600">笔记</span></span>
          </Link>

          <div className="flex items-center gap-2">
            <GitHubRepoLinks compact className="mr-1 border-0 pl-0" />
            {data && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                data.permission === "edit"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-zinc-100 text-zinc-600"
              }`}>
                {data.permission === "edit" ? "✏️ 可交互" : "👁 仅查看"}
              </span>
            )}
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-500"
            >
              免费注册
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-200" />
            <div className="h-96 animate-pulse rounded-2xl bg-zinc-200" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <span className="text-5xl">🔗</span>
            <h2 className="text-lg font-semibold text-zinc-800">{error}</h2>
            <p className="text-sm text-zinc-500">该链接可能已过期或被删除</p>
            <Link href="/" className="mt-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
              回到首页
            </Link>
          </div>
        ) : data ? (
          <ChartExportProvider>
            {/* 标题栏 */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold text-zinc-900">{data.noteName}</h1>
                <p className="mt-1 text-xs text-zinc-400">
                  {data.graph.nodes.length} 个节点 · {data.graph.links.length} 条关系
                  <span className="ml-2 text-zinc-300">|</span>
                  <span className="ml-2">由他人分享</span>
                </p>
              </div>
              <ExportMenu
                noteName={data.noteName}
                graphData={data.graph}
                svgId="shared-graph-svg"
              />
            </div>

            {/* 图谱 */}
            <NoteGraphStack data={data.graph} svgId="shared-graph-svg" />

            {/* 引导注册 */}
            <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 px-6 py-5 text-center">
              <p className="text-sm font-medium text-indigo-900">想创建属于自己的知识图谱？</p>
              <p className="mt-1 text-xs text-indigo-700">上传文档，AI 自动解析，免费使用</p>
              <Link
                href="/register"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                免费注册
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </ChartExportProvider>
        ) : null}
      </main>
    </div>
  );
}
