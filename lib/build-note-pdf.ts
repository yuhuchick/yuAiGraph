import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getGraphChartDefinitions } from "@/lib/chart-registry";
import type { GraphData } from "@/lib/types";

/** jsPDF-autotable 挂载在实例上的上一张表信息 */
type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

export type PdfChartImage = { title: string; base64Png: string };

export type PdfTableSection = {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: string[][];
};

const NOTO_SC_TTF =
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.2.5/files/noto-sans-sc-chinese-simplified-400-normal.ttf";

const FONT_NAME = "NotoSC";

function normalizeTableRows(columns: string[], rows: string[][]): string[][] {
  const n = columns.length;
  if (n === 0) return rows;
  return rows.map((r) => {
    const cells = [...r];
    while (cells.length < n) cells.push("—");
    return cells.slice(0, n);
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}

let fontBase64Cache: string | null | undefined;

async function ensureCjkFont(pdf: jsPDF): Promise<boolean> {
  if (fontBase64Cache === null) return false;
  if (fontBase64Cache === undefined) {
    try {
      const res = await fetch(NOTO_SC_TTF);
      if (!res.ok) {
        fontBase64Cache = null;
        return false;
      }
      fontBase64Cache = arrayBufferToBase64(await res.arrayBuffer());
    } catch {
      fontBase64Cache = null;
      return false;
    }
  }
  const b64 = fontBase64Cache;
  if (!b64) return false;
  pdf.addFileToVFS(`${FONT_NAME}.ttf`, b64);
  pdf.addFont(`${FONT_NAME}.ttf`, FONT_NAME, "normal");
  pdf.setFont(FONT_NAME);
  return true;
}

/** 从图谱数据收集需写入 PDF 的表格（要点表 + 内容速览表） */
export function collectPdfTableSections(data: GraphData): PdfTableSection[] {
  const sections: PdfTableSection[] = [];
  for (const spec of data.insightCharts ?? []) {
    if ((spec.chartType || "").toLowerCase().trim() !== "table") continue;
    const columns = spec.tableColumns ?? [];
    const rows = spec.tableRows ?? [];
    if (!columns.length || !rows.length) continue;
    sections.push({
      title: spec.title,
      subtitle: spec.rationale,
      columns,
      rows: normalizeTableRows(columns, rows),
    });
  }
  for (const def of getGraphChartDefinitions()) {
    const built = def.build(data);
    if (built?.kind !== "table") continue;
    sections.push({
      title: def.title,
      subtitle: def.description,
      columns: built.columns,
      rows: built.rows,
    });
  }
  return sections;
}

/** 将页面上的知识图谱 SVG 栅格化为 PNG（base64，不含 data: 前缀） */
export async function rasterizeSvgToPngBase64(svgEl: SVGSVGElement): Promise<string | null> {
  try {
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const rect = svgEl.getBoundingClientRect();
    const cw = svgEl.dataset.graphCw ? parseFloat(svgEl.dataset.graphCw) : NaN;
    const ch = svgEl.dataset.graphCh ? parseFloat(svgEl.dataset.graphCh) : NaN;
    const w =
      Number.isFinite(cw) && cw > 0 ? Math.round(cw) : Math.max(360, Math.round(rect.width));
    const h =
      Number.isFinite(ch) && ch > 0 ? Math.round(ch) : Math.max(280, Math.round(rect.height));
    clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
    clone.removeAttribute("data-graph-cw");
    clone.removeAttribute("data-graph-ch");
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    const svgStr = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg image load"));
      img.src = url;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    URL.revokeObjectURL(url);
    if (!ctx) return null;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    return base64 ?? null;
  } catch {
    return null;
  }
}

export type BuildNotePdfInput = {
  noteTitle: string;
  /** 知识图谱 PNG base64（无前缀） */
  graphPngBase64: string | null;
  /** ECharts 导出图，顺序与页面一致 */
  chartImages: PdfChartImage[];
  tables: PdfTableSection[];
};

function addImageSection(
  pdf: jsPDF,
  title: string,
  base64Png: string,
  margin: number,
  maxW: number,
  yRef: { y: number },
  pageH: number,
  useCjkFont: boolean,
) {
  const dataUri = `data:image/png;base64,${base64Png}`;
  const prop = pdf.getImageProperties(dataUri);
  const imgMmH = (prop.height * maxW) / prop.width;
  const titleBlock = 10;
  const gap = 6;
  const needed = titleBlock + imgMmH + gap;
  if (yRef.y + needed > pageH - margin) {
    pdf.addPage();
    yRef.y = margin;
  }
  pdf.setFontSize(11);
  if (useCjkFont) pdf.setFont(FONT_NAME);
  else pdf.setFont("helvetica", "bold");
  pdf.text(title, margin, yRef.y);
  yRef.y += titleBlock;
  pdf.addImage(dataUri, "PNG", margin, yRef.y, maxW, imgMmH);
  yRef.y += imgMmH + gap;
}

/**
 * 生成包含图谱截图、全部 ECharts 图与表格的单个 PDF。
 */
export async function buildNotePdfBlob(input: BuildNotePdfInput): Promise<Blob> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const maxW = pageW - 2 * margin;

  const cjkOk = await ensureCjkFont(pdf);
  if (cjkOk) pdf.setFont(FONT_NAME);
  else pdf.setFont("helvetica", "normal");

  const yRef = { y: margin };

  pdf.setFontSize(16);
  if (cjkOk) pdf.setFont(FONT_NAME);
  else pdf.setFont("helvetica", "bold");
  pdf.text(input.noteTitle, margin, yRef.y);
  yRef.y += 10;

  pdf.setFontSize(9);
  if (cjkOk) pdf.setFont(FONT_NAME);
  else pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(`导出时间：${new Date().toLocaleString("zh-CN")}`, margin, yRef.y);
  pdf.setTextColor(0, 0, 0);
  yRef.y += 12;

  if (input.graphPngBase64) {
    addImageSection(pdf, "知识图谱", input.graphPngBase64, margin, maxW, yRef, pageH, cjkOk);
  }

  for (const chart of input.chartImages) {
    addImageSection(pdf, chart.title, chart.base64Png, margin, maxW, yRef, pageH, cjkOk);
  }

  const tableFont = cjkOk ? FONT_NAME : "helvetica";
  const tableStyles = {
    font: tableFont,
    fontSize: 8,
    cellPadding: 2,
    overflow: "linebreak" as const,
  };

  for (const section of input.tables) {
    const headHeight = section.subtitle ? 18 : 12;
    if (yRef.y + headHeight > pageH - margin) {
      pdf.addPage();
      yRef.y = margin;
    }

    pdf.setFontSize(11);
    pdf.setFont(tableFont);
    pdf.text(section.title, margin, yRef.y);
    yRef.y += 6;
    if (section.subtitle) {
      pdf.setFontSize(8);
      pdf.setTextColor(90, 90, 90);
      const subLines = pdf.splitTextToSize(section.subtitle, maxW);
      pdf.text(subLines, margin, yRef.y);
      pdf.setTextColor(0, 0, 0);
      yRef.y += subLines.length * 3.6 + 2;
    } else {
      yRef.y += 4;
    }

    autoTable(pdf, {
      startY: yRef.y,
      margin: { left: margin, right: margin },
      tableWidth: maxW,
      head: [section.columns],
      body: section.rows,
      styles: tableStyles,
      headStyles: { fillColor: [99, 102, 241], font: tableFont, fontStyle: "normal" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: "grid",
    });

    const last = (pdf as JsPdfWithAutoTable).lastAutoTable;
    yRef.y = (last?.finalY ?? yRef.y) + 10;
  }

  return pdf.output("blob");
}
