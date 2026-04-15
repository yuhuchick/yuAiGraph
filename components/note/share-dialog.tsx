"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Permission = "view" | "edit";

interface Props {
  noteId: string;
  onClose: () => void;
}

export function ShareDialog({ noteId, onClose }: Props) {
  const [permission, setPermission] = useState<Permission>("view");
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // ESC 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [genError, setGenError] = useState("");

  const generate = async () => {
    setLoading(true);
    setShareUrl("");
    setGenError("");
    try {
      const data = await api.createShare(noteId, permission);
      // 优先用后端返回的 URL，兜底用前端当前 origin 拼接
      setShareUrl(data.shareUrl ?? `${window.location.origin}/share/${data.shareCode}`);
    } catch (err) {
      setGenError(err instanceof ApiError ? err.message : "生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">分享图谱</h2>
            <p className="mt-0.5 text-xs text-zinc-500">生成分享链接，控制他人访问权限</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* 权限选择 */}
          <div>
            <p className="mb-2.5 text-xs font-medium text-zinc-700">访问权限</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "view", label: "仅查看", desc: "可浏览图谱，不可编辑", icon: "👁" },
                { value: "edit", label: "可编辑", desc: "可查看并与图谱交互", icon: "✏️" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setPermission(opt.value); setShareUrl(""); }}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                    permission === opt.value
                      ? "border-primary bg-primary-light ring-1 ring-primary/30"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span className="text-xs font-semibold text-zinc-900">{opt.label}</span>
                  <span className="text-xs text-zinc-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={generate}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                生成中...
              </>
            ) : "生成分享链接"}
          </button>

          {/* 生成错误 */}
          {genError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{genError}</p>
          )}

          {/* 链接展示 + 复制 */}
          {shareUrl && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-700">分享链接</p>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                <span className="flex-1 truncate text-xs text-zinc-700">{shareUrl}</span>
                <button
                  onClick={copy}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    copied
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {copied ? "已复制 ✓" : "复制"}
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                {permission === "view" ? "持此链接的任何人均可查看图谱" : "持此链接的任何人均可查看并交互图谱"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
