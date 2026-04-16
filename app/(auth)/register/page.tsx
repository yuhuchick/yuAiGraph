"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { navigateAfterAuth, saveAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }

    setLoading(true);

    try {
      const data = await api.register(username, email, password);
      saveAuth(data.token, data.user);
      navigateAfterAuth(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "网络错误，请检查后端服务是否启动");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-[1] flex min-h-screen bg-background">
      {/* Left decorative panel */}
      <div
        className="hidden flex-col justify-between p-10 lg:flex lg:w-[42%]"
        style={{
          background: "linear-gradient(165deg, #166534 0%, #9a3412 48%, #1c1917 100%)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold text-white">
            K
          </span>
          <span className="text-sm font-semibold text-white/90">知识图谱笔记</span>
        </div>

        <div>
          <h2 className="mb-4 font-serif text-2xl font-semibold text-[#fffcf6]">开始你的知识管理之旅</h2>
          <div className="flex flex-col gap-3">
            {["免费使用核心功能", "AI 自动解析文档结构", "图谱无限扩展与分享"].map((t) => (
              <span key={t} className="flex items-center gap-2 text-sm text-white/80">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
                {t}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/40">© 2026 AI 知识图谱笔记</p>
      </div>

      {/* Right form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            K
          </span>
          <span className="font-serif text-base font-semibold text-foreground">知识图谱笔记</span>
        </div>

        <div className="w-full max-w-sm">
          <h1 className="mb-1.5 font-serif text-2xl font-semibold text-foreground">创建账号</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            已有账号？{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
              立即登录
            </Link>
          </p>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="张三"
                required
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground transition focus:border-primary focus:ring-3 focus:ring-primary/15"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground transition focus:border-primary focus:ring-3 focus:ring-primary/15"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位"
                required
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground transition focus:border-primary focus:ring-3 focus:ring-primary/15"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">确认密码</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="再次输入密码"
                required
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground transition focus:border-primary focus:ring-3 focus:ring-primary/15"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "注册中..." : "创建账号"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
