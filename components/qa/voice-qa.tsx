"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { authHeaders } from "@/lib/auth";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  /** 等待首个 token 的占位状态 */
  pending?: boolean;
  /** 正在流式输出 */
  streaming?: boolean;
}

let idCounter = 0;
function nextId() {
  return ++idCounter;
}

interface Props {
  noteId?: string;
}

export function VoiceQA({ noteId }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      role: "assistant",
      content: "你好！我是 AI 知识助手。你可以针对当前图谱提问，例如：「机器学习和深度学习是什么关系？」",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = { id: nextId(), role: "user", content: question };
    const replyId = nextId();
    const pendingMsg: Message = { id: replyId, role: "assistant", content: "", pending: true };

    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ noteId, question }),
      });

      if (!res.ok || !res.body) throw new Error("请求失败");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      // 收到第一个 token 时标记为 streaming，后续直接追加，不重置
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        fullText += chunk;
        const snapshot = fullText;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId
              ? { ...m, content: snapshot, pending: false, streaming: true }
              : m,
          ),
        );
      }

      // 流结束，去掉光标
      setMessages((prev) =>
        prev.map((m) => (m.id === replyId ? { ...m, streaming: false } : m)),
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === replyId
            ? { ...m, content: "回答失败，请稍后重试。", pending: false, streaming: false }
            : m,
        ),
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const suggestions = ["深度学习的特点是什么？", "机器学习包含哪些分支？", "两个节点之间的关系是什么？"];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs">✦</span>
        <h3 className="text-sm font-semibold text-zinc-800">AI 知识问答</h3>
        <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">在线</span>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 240, maxHeight: 420 }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* avatar */}
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                msg.role === "user"
                  ? "bg-zinc-800 text-white"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {msg.role === "user" ? "我" : "✦"}
            </div>

            {/* bubble */}
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "rounded-tr-sm bg-zinc-900 text-white"
                  : "rounded-tl-sm bg-zinc-50 text-zinc-800"
              }`}
            >
              {msg.pending ? (
                // 等待首个 token：三点跳动
                <span className="flex items-center gap-1 py-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                </span>
              ) : (
                // 直接渲染流式内容，streaming 时末尾加光标
                <>
                  {msg.content}
                  {msg.streaming && (
                    <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-indigo-500 align-middle" />
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* suggestions */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-1.5 border-t border-zinc-100 px-4 py-2.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* input */}
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2.5">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入问题，按 Enter 发送..."
          disabled={loading}
          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-700 disabled:opacity-40"
        >
          {loading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12.5 7L1.5 2l2 5-2 5 11-5z" fill="currentColor" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
