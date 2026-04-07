"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { ChartExportProvider } from "@/components/graph/chart-export-context";
import { NoteGraphStack } from "@/components/graph/note-graph-stack";
import { VoiceQA } from "@/components/qa/voice-qa";
import { ShareDialog } from "@/components/note/share-dialog";
import { DeleteNoteButton } from "@/components/note/delete-note-button";
import { ExportMenu } from "@/components/note/export-menu";
import { api, ApiError } from "@/lib/api";
import { GraphData, NoteItem } from "@/lib/types";

const EMPTY: GraphData = { nodes: [], links: [] };

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-96 animate-pulse rounded-2xl bg-zinc-200/70" />
      <div className="h-24 animate-pulse rounded-2xl bg-zinc-200/70" />
    </div>
  );
}

export default function NoteDetailPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData>(EMPTY);
  const [note, setNote] = useState<NoteItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"graph" | "list">("graph");
  const [showShare, setShowShare] = useState(false);

  const GRAPH_SVG_ID = `graph-svg-${noteId}`;

  useEffect(() => {
    if (!noteId) return;
    setLoading(true);

    Promise.all([api.fetchGraph(noteId), api.fetchNotes()])
      .then(([graph, notes]) => {
        setGraphData(graph ?? { nodes: [], links: [] });
        setNote((notes ?? []).find((n) => n.id === noteId) ?? null);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          router.replace(`/login?redirect=${encodeURIComponent(`/note/${noteId}`)}`);
        }
      })
      .finally(() => setLoading(false));
  }, [noteId, router]);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-2 text-xs text-zinc-400">
          <Link href="/dashboard" className="transition hover:text-zinc-700">
            仪表盘
          </Link>
          <span>/</span>
          <span className="font-medium text-zinc-700">{note?.name ?? "笔记详情"}</span>
        </nav>

        <ChartExportProvider>
          {/* Note header */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-zinc-900">{note?.name ?? "知识图谱"}</h1>
              {note && (
                <p className="mt-1 text-xs text-zinc-400">
                  {note.nodeCount} 个节点 · 创建于 {note.createdAt}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <ExportMenu
                noteName={note?.name ?? "图谱"}
                graphData={graphData}
                svgId={GRAPH_SVG_ID}
              />
              <DeleteNoteButton
                noteId={noteId}
                noteName={note?.name ?? "笔记"}
                redirectTo="/dashboard"
                variant="text"
              />
              <button
                type="button"
                onClick={() => setShowShare(true)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="9.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="2.5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="9.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M4 6.75 8 9M4 5.25 8 2.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                分享
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="mb-5 inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
            {(["graph", "list"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-xs font-medium transition ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {tab === "graph" ? "图谱视图" : "节点列表"}
              </button>
            ))}
          </div>

          {/* Content grid */}
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div>
              {loading ? (
                <Skeleton />
              ) : activeTab === "graph" ? (
                <NoteGraphStack data={graphData} svgId={GRAPH_SVG_ID} />
              ) : (
              /* Node list view */
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-zinc-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-zinc-800">节点列表</h3>
                </div>
                <ul className="divide-y divide-zinc-100">
                  {graphData.nodes.map((node) => (
                    <li key={node.id} className="flex items-start gap-3 px-4 py-3.5">
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          node.type === "concept" ? "bg-blue-100 text-blue-700"
                          : node.type === "person" ? "bg-pink-100 text-pink-700"
                          : node.type === "event" ? "bg-emerald-100 text-emerald-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {node.type === "concept" ? "概念"
                          : node.type === "person" ? "人物"
                          : node.type === "event" ? "事件"
                          : "实体"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900">{node.name}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{node.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-zinc-100 px-4 py-3">
                  <h4 className="mb-2 text-xs font-semibold text-zinc-600">关系列表</h4>
                  <ul className="space-y-1.5">
                    {graphData.links.map((link, i) => {
                      const src = graphData.nodes.find((n) => n.id === link.source);
                      const tgt = graphData.nodes.find((n) => n.id === link.target);
                      return (
                        <li key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="font-medium text-zinc-700">{src?.name}</span>
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-400">{link.relationship}</span>
                          <span className="font-medium text-zinc-700">{tgt?.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              )}
            </div>

            {/* QA panel */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <VoiceQA noteId={noteId} />
            </aside>
          </div>
        </ChartExportProvider>
      </main>

      {/* 分享对话框 */}
      {showShare && (
        <ShareDialog noteId={noteId} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
