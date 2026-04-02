"use client";

import { useEffect, useRef, useState } from "react";
import type { GraphData } from "@/lib/types";

interface Props {
  noteName: string;
  graphData: GraphData;
  svgId: string;
}

export function ExportMenu({ noteName, graphData, svgId }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const safeName = noteName.replace(/[\\/:*?"<>|]/g, "_") || "graph";

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: "application/json" });
    download(blob, `${safeName}.json`);
    setOpen(false);
  };

  const exportSvg = () => {
    const svgEl = document.getElementById(svgId) as SVGSVGElement | null;
    if (!svgEl) return;

    // 将 SVG 序列化，加上 xmlns
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const str = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([str], { type: "image/svg+xml;charset=utf-8" });
    download(blob, `${safeName}.svg`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M10 7v3H2V7M6 1v7M3.5 4.5 6 2l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        导出
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="p-1">
            <button
              onClick={exportJson}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <span className="text-sm">{ }</span>
              <span className="font-mono text-zinc-400 text-[10px] bg-zinc-100 rounded px-1">JSON</span>
              导出数据
            </button>
            <button
              onClick={exportSvg}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <span className="text-sm">🖼</span>
              <span className="font-mono text-zinc-400 text-[10px] bg-zinc-100 rounded px-1">SVG</span>
              导出图片
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
