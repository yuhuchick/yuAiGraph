"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { FileUpload } from "@/components/upload/file-upload";
import { useParseProgress } from "@/components/providers/parse-progress-provider";
import { api } from "@/lib/api";
import { NoteItem } from "@/lib/types";

const TYPE_COLORS = [
  "from-indigo-500 to-violet-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
];

function ParsingPlaceholderCard() {
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
      <span className="absolute left-0 top-0 h-1 w-full animate-pulse rounded-t-2xl bg-gradient-to-r from-indigo-500 to-violet-500" />
      <div className="mt-1 flex items-center gap-3">
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="text-sm font-medium text-indigo-700">正在解析文档，知识图谱生成中...</span>
      </div>
      <div className="h-2 w-2/3 animate-pulse rounded-full bg-indigo-200" />
    </div>
  );
}

function NoteCard({ note, index }: { note: NoteItem; index: number }) {
  const gradient = TYPE_COLORS[index % TYPE_COLORS.length];
  return (
    <Link
      href={`/note/${note.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
    >
      <span className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${gradient} rounded-t-2xl`} />

      <div className="mt-1 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-zinc-900">{note.name}</h3>
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500"
          viewBox="0 0 16 16" fill="none"
        >
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
          {note.nodeCount} 个节点
        </span>
        <span>{note.createdAt}</span>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { jobInfo } = useParseProgress();

  useEffect(() => {
    api.fetchNotes()
      .then((data) => setNotes(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalNodes = notes.reduce((acc, n) => acc + n.nodeCount, 0);
  const isParsing = jobInfo?.status === "PENDING" || jobInfo?.status === "PROCESSING";

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-zinc-900">仪表盘</h1>
          <p className="mt-1 text-sm text-zinc-500">管理你的知识图谱笔记</p>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "笔记数量", value: notes.length, icon: "📒", color: "text-indigo-600 bg-indigo-50" },
            { label: "知识节点", value: totalNodes, icon: "◎", color: "text-violet-600 bg-violet-50" },
            { label: "本月新增", value: 1, icon: "✦", color: "text-emerald-600 bg-emerald-50" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-base ${stat.color}`}>
                {stat.icon}
              </span>
              <div>
                <p className="text-xl font-bold text-zinc-900">{loading ? "—" : stat.value}</p>
                <p className="text-xs text-zinc-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-800">我的笔记</h2>
              <span className="text-xs text-zinc-400">{notes.length} 篇</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-200/70" />
                ))}
              </div>
            ) : notes.length === 0 && !isParsing ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
                <span className="text-3xl">📭</span>
                <p className="text-sm text-zinc-500">还没有笔记，上传文档开始创建吧</p>
              </div>
            ) : (
              <div className="space-y-3">
                {isParsing && <ParsingPlaceholderCard />}
                {notes.map((note, i) => (
                  <NoteCard key={note.id} note={note} index={i} />
                ))}
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <FileUpload onParsed={(id) => router.push(`/note/${id}`)} />
          </aside>
        </div>
      </main>
    </div>
  );
}
