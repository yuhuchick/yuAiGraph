"use client";

import { useEffect, useRef, useState } from "react";
import { useChartExport } from "@/components/graph/chart-export-context";
import type { GraphData } from "@/lib/types";

interface Props {
  noteName: string;
  graphData: GraphData;
  svgId: string;
}

export function ExportMenu({ noteName, graphData, svgId }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const chartExport = useChartExport();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const safeName = noteName.replace(/[\\/:*?"<>|]/g, "_") || "graph";
  const chartCount = chartExport?.chartCount ?? 0;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: "application/json" });
    download(blob, `${safeName}-数据.json`);
    setOpen(false);
  };

  const exportSvg = () => {
    const svgEl = document.getElementById(svgId) as SVGSVGElement | null;
    if (!svgEl) return;

    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const cw = svgEl.dataset.graphCw ? parseFloat(svgEl.dataset.graphCw) : NaN;
    const ch = svgEl.dataset.graphCh ? parseFloat(svgEl.dataset.graphCh) : NaN;
    if (Number.isFinite(cw) && Number.isFinite(ch) && cw > 0 && ch > 0) {
      clone.setAttribute("viewBox", `0 0 ${cw} ${ch}`);
      clone.setAttribute("width", String(Math.round(cw)));
      clone.setAttribute("height", String(Math.round(ch)));
    }
    clone.removeAttribute("data-graph-cw");
    clone.removeAttribute("data-graph-ch");
    const str = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([str], { type: "image/svg+xml;charset=utf-8" });
    download(blob, `${safeName}-知识图谱.svg`);
    setOpen(false);
  };

  const exportPdf = async () => {
    if (!chartExport) return;
    setBusy(true);
    try {
      const blob = await chartExport.buildPdf(safeName, graphData, svgId);
      download(blob, `${safeName}-可视化导出.pdf`);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M10 7v3H2V7M6 1v7M3.5 4.5 6 2l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {busy ? "生成中…" : "导出"}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">导出选项</p>
            <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
              PDF 汇总知识图谱截图、全部图表与表格；JSON / SVG 可单独下载
            </p>
          </div>
          <div className="p-1">
            <button
              type="button"
              onClick={exportJson}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <span className="text-sm">📄</span>
              <span>
                <span className="font-medium">数据 JSON</span>
                <span className="mt-0.5 block font-mono text-[10px] text-zinc-400">含图谱与图表规格</span>
              </span>
            </button>
            <button
              type="button"
              onClick={exportSvg}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <span className="text-sm">🖼</span>
              <span>
                <span className="font-medium">知识图谱 SVG</span>
                <span className="mt-0.5 block font-mono text-[10px] text-zinc-400">仅网络图</span>
              </span>
            </button>

            {chartExport && (
              <button
                type="button"
                onClick={() => void exportPdf()}
                disabled={busy}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-indigo-800 hover:bg-indigo-50 disabled:opacity-50"
              >
                <span className="text-sm">📕</span>
                <span>
                  <span className="font-medium">可视化 PDF</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-zinc-500">
                    图谱截图、ECharts 图（{chartCount} 张）与全部表格
                  </span>
                </span>
              </button>
            )}
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
