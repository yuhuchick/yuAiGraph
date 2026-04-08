import {
  AdminOverview,
  AdminPromptConfig,
  AdminUserRow,
  AuthResponse,
  GraphData,
  NoteItem,
  NoteListResponse,
  PageDto,
  ParseJobInfo,
  SharedGraphData,
  ShareResponse,
} from "@/lib/types";
import {
  authHeaders,
  getToken,
  isTokenExpired,
  logoutSessionRedirect,
} from "@/lib/auth";

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

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (typeof window !== "undefined") {
    const token = getToken();
    if (token && isTokenExpired(token)) {
      logoutSessionRedirect();
      throw new ApiError(401, "登录已过期，请重新登录");
    }
  }
  try {
    return await request<T>(path, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers as Record<string, string> | undefined) },
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && typeof window !== "undefined") {
      logoutSessionRedirect();
    }
    throw e;
  }
}

/**
 * 带鉴权的 fetch（用于流式等非 JSON 场景）。401 或本地 JWT 过期时会触发登出跳转。
 */
export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof window !== "undefined") {
    const token = getToken();
    if (token && isTokenExpired(token)) {
      logoutSessionRedirect();
      throw new ApiError(401, "登录已过期，请重新登录");
    }
  }
  const res = await fetch(input, {
    ...init,
    cache: "no-store",
    headers: { ...authHeaders(), ...(init?.headers as Record<string, string> | undefined) },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    logoutSessionRedirect();
    throw new ApiError(401, "未授权，请重新登录");
  }
  return res;
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

  fetchAdminOverview(): Promise<AdminOverview> {
    return authRequest<AdminOverview | null>("/api/admin/overview").then((d) => {
      if (!d) throw new ApiError(500, "管理员概览数据为空");
      return d;
    });
  },

  fetchAdminUsers(params?: {
    page?: number;
    size?: number;
    keyword?: string;
    role?: "" | "USER" | "ADMIN";
  }): Promise<PageDto<AdminUserRow>> {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.size != null) sp.set("size", String(params.size));
    if (params?.keyword) sp.set("keyword", params.keyword);
    if (params?.role) sp.set("role", params.role);
    const qs = sp.toString();
    return authRequest<PageDto<AdminUserRow> | null>(
      `/api/admin/users${qs ? `?${qs}` : ""}`,
    ).then((d) => {
      if (!d) throw new ApiError(500, "用户列表为空");
      return d;
    });
  },

  createAdminUser(payload: {
    username: string;
    email: string;
    password: string;
    role: "USER" | "ADMIN";
  }): Promise<AdminUserRow> {
    return authRequest<AdminUserRow | null>("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((d) => {
      if (!d) throw new ApiError(500, "创建用户失败");
      return d;
    });
  },

  updateAdminUser(
    id: number,
    payload: {
      username: string;
      email: string;
      role: "USER" | "ADMIN";
      password?: string;
    },
  ): Promise<AdminUserRow> {
    return authRequest<AdminUserRow | null>(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((d) => {
      if (!d) throw new ApiError(500, "更新用户失败");
      return d;
    });
  },

  deleteAdminUser(id: number): Promise<void> {
    return authRequest<null>(`/api/admin/users/${id}`, { method: "DELETE" }).then(() => undefined);
  },

  fetchAdminPrompts(): Promise<AdminPromptConfig[]> {
    return authRequest<AdminPromptConfig[] | null>("/api/admin/prompts").then((d) => d ?? []);
  },

  updateAdminPrompt(key: string, content: string): Promise<AdminPromptConfig> {
    return authRequest<AdminPromptConfig | null>(`/api/admin/prompts/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }).then((d) => {
      if (!d) throw new ApiError(500, "更新提示词失败");
      return d;
    });
  },

  // ─── 笔记模块 ─────────────────────────────────────────────────

  fetchNotesPage(params?: {
    page?: number;
    size?: number;
    category?: string;
    keyword?: string;
  }): Promise<NoteListResponse> {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.size != null) sp.set("size", String(params.size));
    if (params?.category) sp.set("category", params.category);
    if (params?.keyword) sp.set("keyword", params.keyword);
    const qs = sp.toString();
    return authRequest<NoteListResponse | null>(`/api/notes${qs ? `?${qs}` : ""}`).then(
      (d) =>
        d ?? {
          items: [],
          total: 0,
          page: 0,
          size: 10,
          totalPages: 0,
          allNotesCount: 0,
          totalNodeCount: 0,
          notesThisMonth: 0,
        },
    );
  },

  /** 兼容：拉取前 500 条（供笔记详情页匹配标题等） */
  fetchNotes(): Promise<NoteItem[]> {
    return this.fetchNotesPage({ page: 0, size: 500 }).then((r) => r.items);
  },

  fetchNoteCategories(): Promise<string[]> {
    return authRequest<string[] | null>("/api/note-categories").then((d) => d ?? []);
  },

  cancelParseJob(jobId: string) {
    return authRequest<null>(`/api/ai/parse-cancel/${encodeURIComponent(jobId)}`, {
      method: "POST",
    });
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
    const res = await fetchWithAuth("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
