const TOKEN_KEY = "kg_token";
const USER_KEY = "kg_user";
/** 仅作为 middleware 可读的标记，不含敏感信息 */
const COOKIE_FLAG = "kg_logged_in";

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

// ─── Token ───────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  // 同步写入 cookie，供 Next.js middleware 读取（不含 JWT 本身）
  document.cookie = `${COOKIE_FLAG}=1; path=/; max-age=604800; SameSite=Lax`;
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

/** 退出登录 */
export function logout(): void {
  clearToken();
  clearUser();
}

// ─── Request Helpers ──────────────────────────────────────────────

/** 返回带 Authorization 的请求头，无 token 时返回空对象 */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
