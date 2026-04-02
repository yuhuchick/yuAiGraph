"use client";

import { DragEvent, FormEvent, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useParseProgress } from "@/components/providers/parse-progress-provider";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_SIZE = 100 * 1024 * 1024;

const EXT_ICONS: Record<string, string> = {
  pdf: "📄",
  doc: "📝",
  docx: "📝",
  txt: "📃",
};

function getExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  onParsed: (noteId: string) => void;
}

export function FileUpload({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [noteName, setNoteName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const { jobInfo, startPolling } = useParseProgress();

  // 监听全局 jobInfo，解析完成时触发跳转
  const prevJobIdRef = useRef<string | null>(null);
  if (jobInfo?.status === "DONE" && jobInfo.noteId && prevJobIdRef.current === jobInfo.jobId) {
    prevJobIdRef.current = null;
    // 用 setTimeout 避免在渲染中触发导航
    setTimeout(() => onParsed(jobInfo.noteId!), 0);
  }

  const validate = (f: File | null): string => {
    if (!f) return "请先选择文件";
    if (!ACCEPTED_TYPES.includes(f.type)) return "仅支持 PDF、Word、TXT 文件";
    if (f.size > MAX_SIZE) return "文件大小不能超过 100MB";
    return "";
  };

  const pickFile = (f: File | null) => {
    const msg = validate(f);
    if (msg) { setErrMsg(msg); setFile(null); return; }
    setErrMsg("");
    setFile(f);
  };

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0] ?? null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const msg = validate(file);
    if (msg || !noteName.trim()) { setErrMsg(msg || "请填写笔记名称"); return; }

    setSubmitting(true);
    setErrMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file!);
      formData.append("noteName", noteName);

      const { jobId } = await api.parseDocument(formData);

      prevJobIdRef.current = jobId;
      startPolling(jobId, file!.name);

      setFile(null);
      setNoteName("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setErrMsg(err instanceof ApiError ? err.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const isParsing = jobInfo?.status === "PENDING" || jobInfo?.status === "PROCESSING";
  const canSubmit = !!file && !!noteName.trim() && !submitting && !isParsing;

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-zinc-800">上传文档生成图谱</h3>

      {/* note name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-name" className="text-xs font-medium text-zinc-600">
          笔记名称
        </label>
        <input
          id="note-name"
          value={noteName}
          onChange={(e) => setNoteName(e.target.value)}
          placeholder="例如：机器学习入门"
          disabled={isParsing}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
        />
      </div>

      {/* drop zone */}
      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition ${
          isParsing
            ? "pointer-events-none border-indigo-200 bg-indigo-50/40"
            : dragging
            ? "border-indigo-400 bg-indigo-50"
            : file
            ? "border-emerald-300 bg-emerald-50"
            : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isParsing && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        {isParsing ? (
          <>
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            <span className="text-sm text-indigo-600">正在解析中，请稍候...</span>
          </>
        ) : file ? (
          <>
            <span className="text-3xl">{EXT_ICONS[getExt(file.name)] ?? "📁"}</span>
            <span className="text-sm font-medium text-zinc-800">{file.name}</span>
            <span className="text-xs text-zinc-500">{formatBytes(file.size)}</span>
          </>
        ) : (
          <>
            <span className="text-3xl">☁️</span>
            <span className="text-sm text-zinc-600">
              {dragging ? "松开以上传" : "拖拽文件至此，或点击选择"}
            </span>
            <span className="text-xs text-zinc-400">支持 PDF、Word、TXT，最大 100MB</span>
          </>
        )}
      </div>

      {/* error */}
      {errMsg && <p className="text-xs text-red-500">{errMsg}</p>}

      {/* submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? (
          <>
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            提交中...
          </>
        ) : isParsing ? (
          "解析中，请稍候..."
        ) : (
          "提交并解析"
        )}
      </button>
    </form>
  );
}
