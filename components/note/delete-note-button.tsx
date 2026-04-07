"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api, ApiError } from "@/lib/api";

type Props = {
  noteId: string;
  noteName: string;
  /** 删除成功后的跳转，不传则仅执行 onDeleted */
  redirectTo?: string;
  onDeleted?: () => void;
  /** icon：仅垃圾桶；text：带「删除」文案 */
  variant?: "icon" | "text";
  className?: string;
};

export function DeleteNoteButton({
  noteId,
  noteName,
  redirectTo,
  onDeleted,
  variant = "text",
  className = "",
}: Props) {
  const router = useRouter();
  const titleId = useId();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollLockRef = useRef<{ overflow: string; paddingRight: string } | null>(null);

  useEffect(() => setMounted(true), []);

  const releaseScrollLock = useCallback(() => {
    const snap = scrollLockRef.current;
    if (!snap) return;
    document.body.style.overflow = snap.overflow;
    document.body.style.paddingRight = snap.paddingRight;
    scrollLockRef.current = null;
  }, []);

  const restoreBodyScroll = useCallback(() => {
    releaseScrollLock();
  }, [releaseScrollLock]);

  /** 在绘制前锁定滚动并补偿滚动条宽度，避免 overflow:hidden 导致布局横向跳动 */
  useLayoutEffect(() => {
    if (!open) return;
    if (scrollLockRef.current) return;
    scrollLockRef.current = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open, busy]);

  useEffect(() => {
    return () => {
      releaseScrollLock();
    };
  }, [releaseScrollLock]);

  const runDelete = useCallback(async () => {
    setBusy(true);
    try {
      await api.deleteNote(noteId);
      setOpen(false);
      onDeleted?.();
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "删除失败，请稍后重试";
      window.alert(msg);
    } finally {
      setBusy(false);
    }
  }, [noteId, onDeleted, redirectTo, router]);

  const overlayEase = reduce ? ([0, 0, 1, 1] as const) : ([0.22, 1, 0.36, 1] as const);
  const overlayDuration = reduce ? 0 : 0.22;
  const panelDuration = reduce ? 0 : 0.3;

  const baseBtn =
    variant === "icon"
      ? "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      : "inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700";

  return (
    <>
      <button
        type="button"
        aria-label={`删除笔记 ${noteName}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`${baseBtn} ${className}`}
      >
        {variant === "icon" ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M3.5 3.5V11.5C3.5 12.0523 3.94772 12.5 4.5 12.5H9.5C10.0523 12.5 10.5 12.0523 10.5 11.5V3.5M5.5 3.5V2.5C5.5 1.94772 5.94772 1.5 6.5 1.5H7.5C8.05228 1.5 8.5 1.94772 8.5 2.5V3.5M2 3.5H12"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M2.5 3h7M4.5 3V2h3v1M4 3v6.5a1 1 0 001 1h2a1 1 0 001-1V3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            删除
          </>
        )}
      </button>

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence onExitComplete={restoreBodyScroll}>
            {open && (
              <motion.div
                key="delete-note-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: overlayDuration, ease: overlayEase }}
                onClick={() => !busy && setOpen(false)}
              >
                <motion.div
                  className="w-full max-w-sm rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xl shadow-zinc-900/10"
                  initial={{ opacity: 0, scale: 0.94, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{
                    duration: panelDuration,
                    ease: overlayEase,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 id={titleId} className="text-sm font-semibold text-zinc-900">
                    删除笔记
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                    确定删除「<span className="font-medium text-zinc-800">{noteName}</span>
                    」吗？图谱数据将一并删除且无法恢复。
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setOpen(false)}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void runDelete()}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {busy ? "删除中…" : "删除"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
