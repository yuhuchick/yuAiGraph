"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { api, ApiError } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { AdminOverview } from "@/lib/types";

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const data = await api.fetchAdminOverview();
      setOverview(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setError("无管理员权限");
        return;
      }
      setError(e instanceof Error ? e.message : "加载失败");
    }
  }, []);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    (async () => {
      try {
        await loadOverview();
      } finally {
        setLoading(false);
      }
    })();
  }, [router, loadOverview]);

  if (loading) return <p className="text-sm text-zinc-500">加载管理员数据中...</p>;
  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }
  if (!overview) return null;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard title="总用户数" value={overview.totalUsers} />
        <StatCard title="管理员数" value={overview.adminUsers} />
        <StatCard title="总笔记数" value={overview.totalNotes} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-800">用户管理</h2>
        <AdminUsersPanel onStatsRefresh={() => void loadOverview()} />
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
