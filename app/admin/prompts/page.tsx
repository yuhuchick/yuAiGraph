"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { AdminPromptConfig } from "@/lib/types";

export default function AdminPromptsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminPromptConfig[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    (async () => {
      try {
        const data = await api.fetchAdminPrompts();
        setItems(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) return <p className="text-sm text-zinc-500">加载提示词配置中...</p>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;

  const onSave = async (key: string, content: string) => {
    setSavingKey(key);
    setError(null);
    try {
      const saved = await api.updateAdminPrompt(key, content);
      setItems((prev) => prev.map((x) => (x.key === key ? saved : x)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "保存失败");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {items.map((cfg) => (
        <PromptCard
          key={cfg.key}
          item={cfg}
          saving={savingKey === cfg.key}
          onSave={onSave}
        />
      ))}
    </div>
  );
}

function PromptCard({
  item,
  saving,
  onSave,
}: {
  item: AdminPromptConfig;
  saving: boolean;
  onSave: (key: string, content: string) => Promise<void>;
}) {
  const [content, setContent] = useState(item.content);

  useEffect(() => {
    setContent(item.content);
  }, [item.content]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">{item.label}</h2>
        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{item.key}</span>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs leading-5 text-zinc-800 outline-none focus:border-indigo-400"
      />
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setContent(item.defaultContent)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          恢复默认草稿
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave(item.key, content)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </section>
  );
}
