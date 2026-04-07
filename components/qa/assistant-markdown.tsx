"use client";

import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mdComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 break-words last:mb-0 [&:first-child]:mt-0">{children}</p>
  ),
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-0.5 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-0.5 pl-4 last:mb-0">{children}</ol>,
  li: ({ children, className }) => (
    <li className={`leading-relaxed ${className || ""}`.trim()}>{children}</li>
  ),
  input: ({ type, checked, ...props }) =>
    type === "checkbox" ? (
      <input
        type="checkbox"
        checked={Boolean(checked)}
        readOnly
        className="mr-1.5 align-middle accent-indigo-600"
        {...props}
      />
    ) : (
      <input type={type} {...props} />
    ),
  h1: ({ children }) => (
    <h4 className="mb-2 mt-3 border-b border-zinc-200 pb-1 text-sm font-semibold first:mt-0">{children}</h4>
  ),
  h2: ({ children }) => (
    <h4 className="mb-2 mt-3 text-sm font-semibold first:mt-0">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="mb-1.5 mt-2 text-sm font-semibold first:mt-0">{children}</h5>
  ),
  h4: ({ children }) => (
    <h6 className="mb-1.5 mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 first:mt-0">
      {children}
    </h6>
  ),
  strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-indigo-300 pl-3 text-zinc-600">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-zinc-200" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-500"
    >
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="my-2 max-w-full overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-[0.75rem] leading-relaxed text-zinc-100">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /language-[\w-]+/.test(className || "");
    if (isBlock) {
      return (
        <code className={`block font-mono text-zinc-100 ${className || ""}`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-zinc-200/90 px-1 py-0.5 font-mono text-[0.85em] text-zinc-800"
        {...props}
      >
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="my-2 max-w-full overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full min-w-[240px] border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-zinc-100">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-zinc-200 px-2 py-1.5 font-semibold text-zinc-800">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-zinc-100 px-2 py-1.5 text-zinc-700">{children}</td>,
  tr: ({ children }) => <tr>{children}</tr>,
};

interface Props {
  content: string;
}

/** AI 助手气泡内 Markdown（GFM：表格、删除线、任务列表等） */
export function AssistantMarkdown({ content }: Props) {
  if (!content.trim()) {
    return null;
  }

  return (
    <div className="assistant-md text-sm leading-relaxed text-zinc-800 [&_pre_code]:bg-transparent [&_pre_code]:p-0">
      <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {content}
      </Markdown>
    </div>
  );
}
