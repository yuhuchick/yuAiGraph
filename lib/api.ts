import {
  AuthResponse,
  GraphData,
  NoteItem,
  ParseJobInfo,
  SharedGraphData,
  ShareResponse,
} from "@/lib/types";
import { authHeaders } from "@/lib/auth";

// ─── 错误类 ───────────────────────────────────────────────────────

/** 携带 HTTP 状态码的 API 错误，供调用方精确判断（如 401 跳转登录） */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── 核心请求封装 ─────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: "no-store", ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new ApiError(res.status, body.message ?? `请求失败 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers as Record<string, string> | undefined) },
  });
}

// ─── 认证模块 ─────────────────────────────────────────────────────

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>("/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  },

  register(username: string, email: string, password: string) {
    return request<AuthResponse>("/api/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
  },

  // ─── 笔记模块 ─────────────────────────────────────────────────

  fetchNotes(): Promise<NoteItem[]> {
    return authRequest<NoteItem[] | null>("/api/notes")
      .then((d) => d ?? []);
  },

  deleteNote(noteId: string) {
    return authRequest<null>(`/api/notes/${noteId}`, { method: "DELETE" });
  },

  fetchGraph(noteId: string): Promise<GraphData> {
    return authRequest<GraphData | null>(`/api/graph?noteId=${encodeURIComponent(noteId)}`)
      .then((d) => d ?? { nodes: [], links: [] });
  },

  // ─── AI 解析模块 ──────────────────────────────────────────────

  parseDocument(formData: FormData): Promise<{ jobId: string }> {
    return authRequest<{ jobId: string } | null>("/api/ai/parse-document", {
      method: "POST",
      body: formData,
    }).then((d) => d ?? { jobId: "" });
  },

  getParseStatus(jobId: string): Promise<ParseJobInfo> {
    return authRequest<ParseJobInfo | null>(
      `/api/ai/parse-status/${encodeURIComponent(jobId)}`,
    ).then((d) => {
      if (!d) throw new ApiError(404, "任务不存在");
      return d;
    });
  },

  getPendingJobs(): Promise<ParseJobInfo[]> {
    return authRequest<ParseJobInfo[] | null>("/api/ai/parse-status/pending")
      .then((d) => d ?? []);
  },

  /**
   * 流式 AI 问答，返回原始 Response 供调用方用 ReadableStream 读取。
   * 不经过 request() 封装，因为需要流式消费而非一次性 json()。
   */
  async chatStream(noteId: string, question: string): Promise<Response> {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ noteId, question }),
    });
    if (!res.ok) {
      throw new ApiError(res.status, "AI 对话请求失败");
    }
    return res;
  },

  // ─── 分享模块 ─────────────────────────────────────────────────

  createShare(noteId: string, permission: "view" | "edit"): Promise<ShareResponse> {
    return authRequest<ShareResponse | null>(`/api/share/${encodeURIComponent(noteId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permission }),
    }).then((d) => {
      if (!d) throw new ApiError(500, "生成分享链接失败");
      return d;
    });
  },

  getSharedGraph(code: string): Promise<SharedGraphData> {
    return request<SharedGraphData | null>(`/api/share-view/${encodeURIComponent(code)}`)
      .then((d) => {
        if (!d) throw new ApiError(404, "分享链接不存在或已失效");
        return d;
      });
  },
};

// ─── 保留旧名称，兼容已有调用 ─────────────────────────────────────

/** @deprecated 请使用 api.fetchNotes() */
export const fetchNotes = () => api.fetchNotes();

/** @deprecated 请使用 api.fetchGraph() */
export const fetchGraphData = (noteId: string) => api.fetchGraph(noteId);
