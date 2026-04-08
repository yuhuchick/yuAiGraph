"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GitHubRepoLinks } from "@/components/layout/github-repo-links";
import { getToken, getUser, isTokenExpired, logout, logoutSessionRedirect } from "@/lib/auth";
import type { UserInfo } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "仪表盘" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === "ADMIN";

  // 路由变化时：先检查 JWT 是否过期，再同步用户信息
  useEffect(() => {
    const token = getToken();
    if (token && isTokenExpired(token)) {
      logoutSessionRedirect();
      return;
    }
    const nextUser = getUser();
    const id = window.setTimeout(() => setUser(nextUser), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  // 已登录时定时检查过期（后台挂久了也能自动下线）
  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => {
      const t = getToken();
      if (t && isTokenExpired(t)) {
        logoutSessionRedirect();
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, [user]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setMenuOpen(false);
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm transition group-hover:bg-indigo-500">
            K
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            知识图谱<span className="text-indigo-600">笔记</span>
          </span>
        </Link>

        {/* Nav + Auth */}
        <div className="flex items-center gap-1">
          {/* 导航项：仅登录后显示 */}
          {user && NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin/users"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                pathname.startsWith("/admin")
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              管理后台
            </Link>
          )}

          <GitHubRepoLinks className="ml-2" />

          <div className="ml-1 h-4 w-px bg-zinc-200" />

          {user ? (
            /* ── 已登录：头像 + 下拉菜单 ── */
            <div className="relative ml-2" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-zinc-100"
              >
                {/* 头像 */}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-sm font-medium text-zinc-800 sm:block">
                  {user.username}
                </span>
                <svg
                  className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 12 12" fill="none"
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* 下拉面板 */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                  <div className="border-b border-zinc-100 px-4 py-3">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{user.username}</p>
                    <p className="mt-0.5 text-xs text-zinc-400 truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
                    >
                      <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                        <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                        <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                        <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                      仪表盘
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/users"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
                      >
                        <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none">
                          <path d="M8 2l5 2v4c0 3-2.1 5.3-5 6-2.9-.7-5-3-5-6V4l5-2z" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M5.5 8l1.5 1.5L10.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        管理后台
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                        <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── 未登录：登录 / 注册 ── */
            <>
              <Link
                href="/login"
                className="ml-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="ml-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
