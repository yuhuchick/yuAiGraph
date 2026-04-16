const TOKEN_KEY = "kg_token";
const USER_KEY = "kg_user";
/** 仅作为 middleware 可读的标记，不含敏感信息 */
const COOKIE_FLAG = "kg_logged_in";

/** 防止多次触发 location.replace */
let sessionRedirecting = false;

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

// ─── JWT（仅解析 payload，不做签名校验；用于前端过期判断与 cookie 同步）────────

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * 当前 token 是否已过期（或即将过期）。
 * 无 exp 字段时返回 false，交由服务端 401 处理。
 * @param skewMs 提前量，避免边界时刻请求失败
 */
export function isTokenExpired(token: string | null, skewMs = 30_000): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return false;
  return Date.now() >= exp * 1000 - skewMs;
}

function cookieMaxAgeFromToken(token: string): number {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return 604800;
  const sec = Math.floor(exp - Date.now() / 1000);
  return Math.max(60, Math.min(sec, 365 * 24 * 3600));
}

// ─── Token ───────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  const maxAge = cookieMaxAgeFromToken(token);
  document.cookie = `${COOKIE_FLAG}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${COOKIE_FLAG}=; path=/; max-age=0`;
}

// ─── User Info ────────────────────────────────────────────────────

export function getUser(): UserInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserInfo) : null;
  } catch {
    return null;
  }
}

export function setUser(user: UserInfo): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

// ─── Auth Actions ─────────────────────────────────────────────────

/** 登录成功后调用，一次性写入 token + 用户信息 */
export function saveAuth(token: string, user: UserInfo): void {
  setToken(token);
  setUser(user);
}

/**
 * 登录/注册成功后的站内跳转。
 * 使用整页导航（非 client router），确保 `document.cookie` 已落盘后再请求受保护路由；
 * 否则软导航时 middleware 可能读不到 `kg_logged_in`，表现为登录成功却不进入仪表盘。
 * @param redirectPath 查询参数 `redirect`，仅允许以 `/` 开头的站内路径
 */
export function navigateAfterAuth(redirectPath: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const fallback = "/dashboard";
  const raw = redirectPath?.trim();
  if (!raw) {
    window.location.assign(fallback);
    return;
  }
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    window.location.assign(fallback);
    return;
  }
  window.location.assign(raw);
}

/** 退出登录（仅清本地状态，不跳转） */
export function logout(): void {
  sessionRedirecting = false;
  clearToken();
  clearUser();
}

/**
 * 会话失效：清空状态并跳转登录（401、JWT 过期）。
 * 使用 location.replace 触发整页刷新，middleware 能立刻读到 cookie 已清除。
 */
export function logoutSessionRedirect(): void {
  if (typeof window === "undefined") return;
  if (sessionRedirecting) return;
  sessionRedirecting = true;

  const path = window.location.pathname + window.location.search;
  clearToken();
  clearUser();

  const onAuthPage = path.startsWith("/login") || path.startsWith("/register");
  const loginUrl = onAuthPage
    ? "/login?session=expired"
    : `/login?session=expired&redirect=${encodeURIComponent(path)}`;
  window.location.replace(loginUrl);
}

// ─── Request Helpers ──────────────────────────────────────────────

/** 返回带 Authorization 的请求头，无 token 时返回空对象 */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
