"use client";

import type { ECharts } from "echarts";
import type { GraphData } from "@/lib/types";
import {
  buildNotePdfBlob,
  collectPdfTableSections,
  rasterizeSvgToPngBase64,
  type PdfChartImage,
} from "@/lib/build-note-pdf";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ChartExportRegistration = {
  id: string;
  title: string;
  getInstance: () => ECharts | null;
};

export type ChartExportContextValue = {
  chartCount: number;
  register: (r: ChartExportRegistration) => () => void;
  /** 单份 PDF：图谱截图 + 全部 ECharts + 要点/速览表格 */
  buildPdf: (folderName: string, graphData: GraphData, svgId: string) => Promise<Blob>;
};

const ChartExportContext = createContext<ChartExportContextValue | null>(null);

export function useChartExport(): ChartExportContextValue | null {
  return useContext(ChartExportContext);
}

function sanitizeFilePart(name: string, maxLen = 72): string {
  const s = name
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
  return s || "export";
}

export function ChartExportProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef(new Map<string, ChartExportRegistration>());
  const [chartCount, setChartCount] = useState(0);

  const syncCount = () => setChartCount(mapRef.current.size);

  const register = useCallback((r: ChartExportRegistration) => {
    mapRef.current.set(r.id, r);
    syncCount();
    return () => {
      mapRef.current.delete(r.id);
      syncCount();
    };
  }, []);

  const collectChartPngs = useCallback((): PdfChartImage[] => {
    const out: PdfChartImage[] = [];
    for (const r of mapRef.current.values()) {
      const inst = r.getInstance();
      if (!inst) continue;
      try {
        inst.resize();
        const dataUrl = inst.getDataURL({
          type: "png",
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });
        const base64 = dataUrl.split(",")[1];
        if (!base64) continue;
        out.push({
          title: r.title.trim() || r.id,
          base64Png: base64,
        });
      } catch {
        // 实例未就绪或渲染失败时跳过
      }
    }
    return out;
  }, []);

  const buildPdf = useCallback(
    async (folderName: string, graphData: GraphData, svgId: string) => {
      const chartImages = collectChartPngs();
      const svgEl = document.getElementById(svgId) as SVGSVGElement | null;
      const graphPngBase64 = svgEl ? await rasterizeSvgToPngBase64(svgEl) : null;
      const tables = collectPdfTableSections(graphData);
      return buildNotePdfBlob({
        noteTitle: sanitizeFilePart(folderName, 80),
        graphPngBase64,
        chartImages,
        tables,
      });
    },
    [collectChartPngs],
  );

  const value = useMemo(
    () => ({ chartCount, register, buildPdf }),
    [chartCount, register, buildPdf],
  );

  return <ChartExportContext.Provider value={value}>{children}</ChartExportContext.Provider>;
}
