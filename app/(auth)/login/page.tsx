"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.login(email, password);
      saveAuth(data.token, data.user);
      router.push(searchParams.get("redirect") ?? "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "网络错误，请检查后端服务是否启动");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fb]">
      {/* Left decorative panel */}
      <div
        className="hidden flex-col justify-between p-10 lg:flex lg:w-[42%]"
        style={{
          background: "linear-gradient(145deg, #4f46e5 0%, #7c3aed 60%, #0891b2 100%)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold text-white">
            K
          </span>
          <span className="text-sm font-semibold text-white/90">知识图谱笔记</span>
        </div>

        <div>
          <blockquote className="mb-6 text-xl font-medium leading-relaxed text-white">
            &ldquo;知识不在于多，而在于连接。&rdquo;
          </blockquote>
          <div className="flex flex-col gap-3">
            {["上传文档即生成图谱", "AI 智能问答与检索", "可视化知识关联"].map((t) => (
              <span key={t} className="flex items-center gap-2 text-sm text-white/80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
                {t}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/40">© 2026 AI 知识图谱笔记</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
            K
          </span>
          <span className="text-base font-semibold text-zinc-900">知识图谱笔记</span>
        </div>

        <div className="w-full max-w-sm">
          <h1 className="mb-1.5 text-2xl font-bold text-zinc-900">欢迎回来</h1>
          <p className="mb-8 text-sm text-zinc-500">
            还没有账号？{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              免费注册
            </Link>
          </p>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
