"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { AppHeader } from "@/components/layout/app-header";
import { DeleteNoteButton } from "@/components/note/delete-note-button";
import { FileUpload } from "@/components/upload/file-upload";
import { useParseProgress } from "@/components/providers/parse-progress-provider";
import { api } from "@/lib/api";
import type { NoteItem, NoteListResponse } from "@/lib/types";

const TYPE_COLORS = [
  "from-primary to-amber-800",
  "from-accent to-emerald-900",
  "from-stone-600 to-stone-800",
  "from-orange-700 to-red-900",
];

function fadeUp(reduce: boolean | null, delay = 0): Variants {
  return {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.45, delay, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

function stagger(reduce: boolean | null): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: reduce ? 0 : 0.06 },
    },
  };
}

function ParsingPlaceholderCard({
  reduce,
  onStop,
}: {
  reduce: boolean | null;
  onStop: () => void;
}) {
  return (
    <motion.div
      variants={fadeUp(reduce)}
      className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary-light/95 via-card to-accent-light/40 p-5 shadow-md shadow-primary/10"
    >
      <span className="absolute inset-x-0 top-0 h-[3px] overflow-hidden rounded-t-2xl bg-primary/15">
        <span className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
      </span>
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/15 blur-2xl"
          animate={{ opacity: [0.4, 0.75, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className="relative mt-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-medium text-primary">正在解析文档，知识图谱生成中...</span>
        </div>
        <button
          type="button"
          onClick={onStop}
          className="cursor-pointer shrink-0 rounded-lg border border-primary/35 bg-card/90 px-3 py-1.5 text-xs font-medium text-primary shadow-sm transition hover:bg-primary-light"
        >
          停止解析
        </button>
      </div>
      <div className="relative h-2 w-2/3 overflow-hidden rounded-full bg-primary/10">
        <motion.span
          className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-gradient-to-r from-primary to-amber-700"
          animate={reduce ? {} : { x: ["-100%", "280%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

function NoteCard({
  note,
  index,
  reduce,
  onDeleted,
}: {
  note: NoteItem;
  index: number;
  reduce: boolean | null;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const gradient = TYPE_COLORS[index % TYPE_COLORS.length];
  return (
    <motion.div variants={fadeUp(reduce, index * 0.04)}>
      <div
        role="link"
        tabIndex={0}
        onClick={() => router.push(`/note/${note.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(`/note/${note.id}`);
          }
        }}
        className="group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur-sm transition-colors duration-300 hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/10"
      >
        <span
          className={`absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r ${gradient} rounded-t-2xl opacity-90 transition-opacity group-hover:opacity-100`}
        />
        {!reduce && (
          <span className="pointer-events-none absolute -right-6 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/0 via-primary/12 to-accent/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
        )}

        <div className="relative mt-1 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-sm font-semibold leading-snug text-foreground">{note.name}</h3>
            <span
              className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${
                note.category?.trim()
                  ? "bg-primary-light text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {note.category?.trim() || "其他"}
            </span>
          </div>
          <div className="mt-0.5 flex shrink-0 items-center gap-1">
            <DeleteNoteButton
              variant="icon"
              noteId={note.id}
              noteName={note.name}
              onDeleted={onDeleted}
            />
            <motion.span
              className="inline-flex text-muted-foreground/50 transition group-hover:text-primary"
              whileHover={reduce ? {} : { x: 3 }}
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          </div>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {!reduce && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-40" />
              )}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            {note.nodeCount} 个节点
          </span>
          <span className="text-border">·</span>
          <span>{note.createdAt}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [listData, setListData] = useState<NoteListResponse | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(5);
  const [categoryKey, setCategoryKey] = useState<string>("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const router = useRouter();
  const { jobInfo, cancelCurrentParse } = useParseProgress();
  const reduce = useReducedMotion();
  const doneListRefreshRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setKeyword(keywordInput.trim()), 320);
    return () => clearTimeout(t);
  }, [keywordInput]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; size: number; category?: string; keyword?: string } = {
        page,
        size: pageSize,
      };
      if (categoryKey === "__none__") params.category = "__none__";
      else if (categoryKey) params.category = categoryKey;
      if (keyword) params.keyword = keyword;
      const data = await api.fetchNotesPage(params);
      setListData(data);
    } catch (e) {
      console.error(e);
      setListData(null);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, categoryKey, keyword]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    api
      .fetchNoteCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setPage(0);
  }, [categoryKey, keyword]);

  useEffect(() => {
    const s = jobInfo?.status;
    if (s === "DONE" && !doneListRefreshRef.current) {
      doneListRefreshRef.current = true;
      void loadList();
    }
    if (s !== "DONE") {
      doneListRefreshRef.current = false;
    }
  }, [jobInfo?.status, loadList]);

  const notes = listData?.items ?? [];
  const isParsing = jobInfo?.status === "PENDING" || jobInfo?.status === "PROCESSING";

  const stats = [
    {
      label: "笔记数量",
      value: listData?.allNotesCount ?? 0,
      icon: "◈",
      accent: "from-primary to-amber-800",
      ring: "ring-primary/20",
    },
    {
      label: "知识节点",
      value: listData?.totalNodeCount ?? 0,
      icon: "◎",
      accent: "from-accent to-emerald-900",
      ring: "ring-accent/20",
    },
    {
      label: "本月新增",
      value: listData?.notesThisMonth ?? 0,
      icon: "✦",
      accent: "from-orange-700 to-red-900",
      ring: "ring-orange-700/20",
    },
  ];

  return (
    <div className="relative z-[1] min-h-screen overflow-x-hidden bg-background">
      <div className="home-hero-grid pointer-events-none absolute inset-0 opacity-[0.55] [mask-image:linear-gradient(to_bottom,black_25%,black_50%,transparent_88%)]" />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full sm:right-[10%]"
        style={{
          background: "radial-gradient(circle, rgba(154,52,18,0.16), transparent 68%)",
          filter: "blur(40px)",
        }}
        animate={reduce ? {} : { opacity: [0.5, 0.85, 0.5], scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-32 left-0 h-56 w-56 rounded-full sm:left-[5%]"
        style={{
          background: "radial-gradient(circle, rgba(22,101,52,0.14), transparent 65%)",
          filter: "blur(36px)",
        }}
        animate={reduce ? {} : { opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <AppHeader />

      <main className="relative z-[1] mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger(reduce)}
          className="mb-8 sm:mb-10"
        >
          <motion.h1
            variants={fadeUp(reduce)}
            className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]"
          >
            仪表盘
          </motion.h1>
          <motion.p
            variants={fadeUp(reduce)}
            className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground"
          >
            管理知识图谱笔记，上传文档即可
            <span className="gradient-text font-medium"> 抽取 · 可视化 · 对话</span>
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger(reduce)}
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp(reduce, i * 0.05)}
              whileHover={reduce ? {} : { y: -3, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden rounded-2xl border border-border bg-card/80 px-4 py-4 shadow-sm backdrop-blur-md ring-1 ${stat.ring} sm:px-5 sm:py-4`}
            >
              <div
                className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.accent} opacity-[0.12] blur-2xl`}
              />
              <div className="relative flex items-center gap-3 sm:gap-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} text-sm font-semibold text-white shadow-md shadow-stone-900/15`}
                >
                  {stat.icon}
                </span>
                <div>
                  <p className="font-mono text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
                    {loading ? "—" : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger(reduce)}
          >
            <motion.div variants={fadeUp(reduce)} className="mb-4 space-y-3 border-b border-border pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-sm font-semibold text-foreground">我的笔记</h2>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {loading ? "…" : `${listData?.total ?? 0} 条`}
                  {!loading && listData && listData.total !== listData.allNotesCount
                    ? `（已筛选，共 ${listData.allNotesCount} 篇）`
                    : null}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0">分类</span>
                  <select
                    value={categoryKey}
                    onChange={(e) => setCategoryKey(e.target.value)}
                    className="min-w-[8rem] rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                  >
                    <option value="">全部</option>
                    <option value="__none__">其他</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground sm:max-w-xs">
                  <span className="shrink-0">搜索</span>
                  <input
                    type="search"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="按标题过滤"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                </label>
              </div>
            </motion.div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.45 }}
                    animate={{ opacity: [0.45, 0.85, 0.45] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                    className="h-20 rounded-2xl border border-border bg-gradient-to-r from-muted/90 via-card to-muted/90"
                  />
                ))}
              </div>
            ) : notes.length === 0 && !isParsing && !loading ? (
              <motion.div
                variants={fadeUp(reduce)}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-primary/35 bg-gradient-to-b from-card/95 to-primary-light/40 py-16 text-center backdrop-blur-sm"
              >
                <motion.span
                  className="text-3xl"
                  animate={reduce ? {} : { y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  📭
                </motion.span>
                <p className="text-sm text-muted-foreground">还没有笔记，上传文档开始创建吧</p>
                <Link
                  href="/demo"
                  className="text-sm font-medium text-primary transition hover:text-primary-hover"
                >
                  先看演示示例 →
                </Link>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-3"
                initial="hidden"
                animate="visible"
                variants={stagger(reduce)}
              >
                {isParsing && (
                  <ParsingPlaceholderCard
                    reduce={reduce}
                    onStop={() => void cancelCurrentParse()}
                  />
                )}
                {notes.map((note, i) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    index={i}
                    reduce={reduce}
                    onDeleted={() => void loadList()}
                  />
                ))}
                {!loading && listData && listData.totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-muted-foreground">
                      第 {listData.page + 1} / {listData.totalPages} 页 · 每页 {listData.size} 条
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={page <= 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        上一页
                      </button>
                      <button
                        type="button"
                        disabled={page >= listData.totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="lg:sticky lg:top-20 lg:self-start"
          >
            <div className="rounded-2xl border border-primary/25 bg-card/70 p-0.5 shadow-lg shadow-primary/10 backdrop-blur-md">
              <div className="overflow-hidden rounded-[14px] bg-card/95">
                <FileUpload onParsed={(id) => router.push(`/note/${id}`)} />
              </div>
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  );
}
