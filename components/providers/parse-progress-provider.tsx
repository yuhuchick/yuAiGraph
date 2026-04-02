"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "@/lib/api";
import type { ParseJobInfo } from "@/lib/types";

export type { ParseJobInfo };

interface ParseProgressContextValue {
  jobInfo: ParseJobInfo | null;
  /** 提交后用 jobId 开始轮询 */
  startPolling: (jobId: string, fileName: string) => void;
}

const STORAGE_KEY = "pendingParseJobId";
const POLL_INTERVAL = 2000;

const ParseProgressContext = createContext<ParseProgressContextValue>({
  jobInfo: null,
  startPolling: () => {},
});

export function useParseProgress() {
  return useContext(ParseProgressContext);
}

// ─── Banner UI ───────────────────────────────────────────────────

function ParseBanner({ info }: { info: ParseJobInfo }) {
  const isError = info.status === "FAILED";
  const isDone = info.status === "DONE";

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 flex items-center gap-4 px-5 py-3 shadow-lg ${
        isError ? "bg-red-600" : isDone ? "bg-emerald-600" : "bg-zinc-900"
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
        {isError ? (
          <span className="text-sm">✕</span>
        ) : isDone ? (
          <span className="text-sm">✓</span>
        ) : (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">{info.fileName}</span>
          {!isError && !isDone && (
            <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
              {info.progress}%
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-white/75">{info.stage}</p>
      </div>

      {!isError && !isDone && (
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

  const poll = useCallback(async (jobId: string) => {
    try {
      const data = await api.getParseStatus(jobId);
      setJobInfo(data);

      if (data.status === "DONE" || data.status === "FAILED") {
        stopPolling();
        localStorage.removeItem(STORAGE_KEY);
        // 2.5s 后自动隐藏横幅
        if (clearBannerRef.current) clearTimeout(clearBannerRef.current);
        clearBannerRef.current = setTimeout(() => setJobInfo(null), 2500);
      }
    } catch {
      // 网络错误时静默，等待下次轮询
    }
  }, [stopPolling]);

  const startPolling = useCallback((jobId: string, fileName: string) => {
    stopPolling();
    localStorage.setItem(STORAGE_KEY, jobId);
    // 立即显示占位状态
    setJobInfo({ jobId, status: "PENDING", progress: 0, stage: "等待解析...", fileName });
    // 开始轮询
    timerRef.current = setInterval(() => poll(jobId), POLL_INTERVAL);
  }, [stopPolling, poll]);

  // 页面刷新后：检查 localStorage 是否有未完成任务
  useEffect(() => {
    const savedJobId = localStorage.getItem(STORAGE_KEY);
    if (!savedJobId) return;

    api.getParseStatus(savedJobId)
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
  // 只在挂载时执行一次
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 卸载时清理定时器
  useEffect(() => () => { stopPolling(); }, [stopPolling]);

  const showBanner = jobInfo !== null;

  return (
    <ParseProgressContext.Provider value={{ jobInfo, startPolling }}>
      {showBanner && <ParseBanner info={jobInfo} />}
      {showBanner && <div className="h-14" />}
      {children}
    </ParseProgressContext.Provider>
  );
}
