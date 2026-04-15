"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { AdminUserRow, PageDto } from "@/lib/types";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";

type RoleFilter = "" | "USER" | "ADMIN";

export function AdminUsersPanel({ onStatsRefresh }: { onStatsRefresh?: () => void }) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<PageDto<AdminUserRow> | null>(null);

  const load = useCallback(
    async (opts?: { page?: number }) => {
      const p = opts?.page ?? page;
      setLoading(true);
      setErr(null);
      try {
        const res = await api.fetchAdminUsers({
          page: p,
          size,
          keyword: keyword || undefined,
          role: roleFilter || undefined,
        });
        setData(res);
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [page, size, keyword, roleFilter],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const [dialog, setDialog] = useState<"create" | { mode: "edit"; user: AdminUserRow } | null>(null);

  const handleDelete = async (u: AdminUserRow) => {
    if (!window.confirm(`确定删除用户「${u.username}」(${u.email})？`)) return;
    try {
      await api.deleteAdminUser(u.id);
      onStatsRefresh?.();
      await load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "删除失败");
    }
  };

  const columns: DataTableColumn<AdminUserRow>[] = [
    { id: "id", header: "ID", cell: (r) => r.id, className: "tabular-nums text-zinc-600" },
    { id: "username", header: "用户名", cell: (r) => r.username },
    { id: "email", header: "邮箱", cell: (r) => <span className="text-zinc-600">{r.email}</span> },
    {
      id: "role",
      header: "角色",
      cell: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            r.role === "ADMIN" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {r.role}
        </span>
      ),
    },
    { id: "createdAt", header: "注册日期", cell: (r) => <span className="text-zinc-500">{r.createdAt}</span> },
    {
      id: "actions",
      header: "操作",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDialog({ mode: "edit", user: r })}
            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => void handleDelete(r)}
            className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            关键词
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="用户名 / 邮箱"
              className="w-52 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            角色
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as RoleFilter);
                setPage(0);
              }}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800"
            >
              <option value="">全部</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            每页
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setKeyword(keywordInput.trim());
              setPage(0);
            }}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            查询
          </button>
        </div>
        <button
          type="button"
          onClick={() => setDialog("create")}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          新建用户
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
      )}

      <DataTable
        columns={columns}
        rows={data?.content ?? []}
        getRowKey={(r) => r.id}
        loading={loading}
        emptyHint="没有匹配的用户"
      />

      {data && data.totalPages > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600">
          <span>
            共 {data.totalElements} 条 · 第 {data.page + 1} / {data.totalPages} 页
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40"
            >
              上一页
            </button>
            <button
              type="button"
              disabled={page >= data.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {dialog === "create" && (
        <UserFormDialog
          title="新建用户"
          mode="create"
          onClose={() => setDialog(null)}
          onSubmit={async (payload) => {
            await api.createAdminUser(payload);
            onStatsRefresh?.();
            setDialog(null);
            setPage(0);
            await load({ page: 0 });
          }}
        />
      )}
      {dialog && typeof dialog === "object" && dialog.mode === "edit" && (
        <UserFormDialog
          title="编辑用户"
          mode="edit"
          initial={dialog.user}
          onClose={() => setDialog(null)}
          onSubmit={async (payload) => {
            await api.updateAdminUser(dialog.user.id, payload);
            onStatsRefresh?.();
            setDialog(null);
            await load();
          }}
        />
      )}
    </section>
  );
}

function UserFormDialog({
  title,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  mode: "create" | "edit";
  initial?: AdminUserRow;
  onClose: () => void;
  onSubmit: (payload: {
    username: string;
    email: string;
    password?: string;
    role: "USER" | "ADMIN";
  }) => Promise<void>;
}) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">((initial?.role as "USER" | "ADMIN") ?? "USER");
  const [saving, setSaving] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const handleSave = async () => {
    setLocalErr(null);
    if (mode === "create") {
      if (password.length < 6) {
        setLocalErr("密码至少 6 位");
        return;
      }
      setSaving(true);
      try {
        await onSubmit({ username, email, password, role });
      } catch (e) {
        setLocalErr(e instanceof ApiError ? e.message : "保存失败");
      } finally {
        setSaving(false);
      }
      return;
    }
    setSaving(true);
    try {
      const payload: {
        username: string;
        email: string;
        role: "USER" | "ADMIN";
        password?: string;
      } = { username, email, role };
      if (password.trim()) payload.password = password;
      await onSubmit(payload);
    } catch (e) {
      setLocalErr(e instanceof ApiError ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
        {localErr && <p className="mt-2 text-sm text-red-600">{localErr}</p>}
        <div className="mt-4 space-y-3">
          <label className="block text-xs text-zinc-500">
            用户名
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            邮箱
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            {mode === "create" ? "密码" : "新密码（留空则不修改）"}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            角色
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100">
            取消
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
