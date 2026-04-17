"use client";

export const GITHUB_FRONTEND_URL = "https://github.com/yuhuchick/yuAiGraph";
export const GITHUB_BACKEND_URL = "https://github.com/yuhuchick/yuAiGraph-back";
export const NAV_SITE_URL = "https://nav.wufly.cn";

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function CompassMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.8 5.2 9.4 9.4 5.2 10.8 6.6 6.6l4.2-1.4z" fill="currentColor" />
    </svg>
  );
}

interface Props {
  /** 窄屏只显示图标，不显示「前端 / 后端」文案 */
  compact?: boolean;
  className?: string;
}

/**
 * 顶栏右侧：导航站 + 前端 / 后端 GitHub 仓库入口
 */
export function GitHubRepoLinks({ compact = false, className = "" }: Props) {
  return (
    <div
      className={`flex items-center gap-0.5 border-l border-border pl-2 ${className}`.trim()}
    >
      <a
        href={NAV_SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        title="导航站点"
        aria-label="打开导航站点"
      >
        <CompassMark className="h-4 w-4 shrink-0" />
        {!compact && <span className="hidden sm:inline">导航</span>}
      </a>
      <a
        href={GITHUB_FRONTEND_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        title="前端：yuAiGraph（Next.js）"
        aria-label="在 GitHub 打开前端仓库 yuAiGraph"
      >
        <GitHubMark className="h-4 w-4 shrink-0" />
        {!compact && <span className="hidden sm:inline">前端</span>}
      </a>
      <a
        href={GITHUB_BACKEND_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        title="后端：yuAiGraph-back（Spring Boot）"
        aria-label="在 GitHub 打开后端仓库 yuAiGraph-back"
      >
        <GitHubMark className="h-4 w-4 shrink-0" />
        {!compact && <span className="hidden sm:inline">后端</span>}
      </a>
    </div>
  );
}
