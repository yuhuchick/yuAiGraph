"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api, ApiError } from "@/lib/api";
import type { ParseJobInfo } from "@/lib/types";

export type { ParseJobInfo };

interface ParseProgressContextValue {
  jobInfo: ParseJobInfo | null;
  /** 提交后用 jobId 开始轮询 */
  startPolling: (jobId: string, fileName: string) => void;
  /** 请求后端取消当前任务并停止轮询 */
  cancelCurrentParse: () => Promise<void>;
}

const STORAGE_KEY = "pendingParseJobId";
const POLL_INTERVAL = 2000;

const ParseProgressContext = createContext<ParseProgressContextValue>({
  jobInfo: null,
  startPolling: () => {},
  cancelCurrentParse: async () => {},
});

export function useParseProgress() {
  return useContext(ParseProgressContext);
}

// ─── Banner UI ───────────────────────────────────────────────────

function ParseBanner({
  info,
  onCancel,
}: {
  info: ParseJobInfo;
  onCancel: () => void;
}) {
  const isError = info.status === "FAILED";
  const isDone = info.status === "DONE";
  const isCancelled = info.status === "CANCELLED";
  const canCancel = info.status === "PENDING" || info.status === "PROCESSING";

  const bg = isCancelled
    ? "bg-slate-600"
    : isError
      ? "bg-red-600"
      : isDone
        ? "bg-emerald-600"
        : "bg-zinc-900";

  return (
    <div className={`fixed left-0 right-0 top-0 z-50 flex items-center gap-4 px-5 py-3 shadow-lg ${bg}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
        {isError ? (
          <span className="text-sm">✕</span>
        ) : isDone ? (
          <span className="text-sm">✓</span>
        ) : isCancelled ? (
          <span className="text-sm">⏹</span>
        ) : (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">{info.fileName}</span>
          {!isError && !isDone && !isCancelled && (
            <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
              {info.progress}%
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-white/75">{info.stage}</p>
      </div>

      {canCancel && (
        <button
          type="button"
          onClick={() => void onCancel()}
          className="shrink-0 rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
        >
          停止解析
        </button>
      )}

      {!isError && !isDone && !isCancelled && (
        <div className="hidden w-48 shrink-0 sm:block">
          <div className="overflow-hidden rounded-full bg-white/20">
            <div
              className="h-1.5 rounded-full bg-white transition-all duration-500"
              style={{ width: `${info.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Provider ────────────────────────────────────────────────────

export function ParseProgressProvider({ children }: { children: React.ReactNode }) {
  const [jobInfo, setJobInfo] = useState<ParseJobInfo | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearBannerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poll = useCallback(
    async (jobId: string) => {
      try {
        const data = await api.getParseStatus(jobId);
        setJobInfo(data);

        if (
          data.status === "DONE" ||
          data.status === "FAILED" ||
          data.status === "CANCELLED"
        ) {
          stopPolling();
          localStorage.removeItem(STORAGE_KEY);
          if (clearBannerRef.current) clearTimeout(clearBannerRef.current);
          clearBannerRef.current = setTimeout(() => setJobInfo(null), 2500);
        }
      } catch {
        // 网络错误时静默，等待下次轮询
      }
    },
    [stopPolling],
  );

  const startPolling = useCallback(
    (jobId: string, fileName: string) => {
      stopPolling();
      localStorage.setItem(STORAGE_KEY, jobId);
      setJobInfo({ jobId, status: "PENDING", progress: 0, stage: "等待解析...", fileName });
      timerRef.current = setInterval(() => poll(jobId), POLL_INTERVAL);
    },
    [stopPolling, poll],
  );

  const cancelCurrentParse = useCallback(async () => {
    const id = jobInfo?.jobId;
    if (!id) return;
    try {
      await api.cancelParseJob(id);
      stopPolling();
      localStorage.removeItem(STORAGE_KEY);
      setJobInfo((prev) =>
        prev
          ? { ...prev, status: "CANCELLED", progress: prev.progress, stage: "已取消" }
          : null,
      );
      if (clearBannerRef.current) clearTimeout(clearBannerRef.current);
      clearBannerRef.current = setTimeout(() => setJobInfo(null), 2200);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        stopPolling();
        localStorage.removeItem(STORAGE_KEY);
        setJobInfo(null);
      }
    }
  }, [jobInfo?.jobId, stopPolling]);

  useEffect(() => {
    const savedJobId = localStorage.getItem(STORAGE_KEY);
    if (!savedJobId) return;

    api
      .getParseStatus(savedJobId)
      .then((data) => {
        setJobInfo(data);
        if (data.status === "PENDING" || data.status === "PROCESSING") {
          timerRef.current = setInterval(() => poll(savedJobId), POLL_INTERVAL);
        } else {
          localStorage.removeItem(STORAGE_KEY);
          clearBannerRef.current = setTimeout(() => setJobInfo(null), 2500);
        }
      })
      .catch(() => localStorage.removeItem(STORAGE_KEY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      stopPolling();
    },
    [stopPolling],
  );

  const showBanner = jobInfo !== null;

  return (
    <ParseProgressContext.Provider value={{ jobInfo, startPolling, cancelCurrentParse }}>
      {showBanner && (
        <ParseBanner info={jobInfo} onCancel={() => void cancelCurrentParse()} />
      )}
      {showBanner && <div className="h-14" />}
      {children}
    </ParseProgressContext.Provider>
  );
}
