import type { GraphData } from "@/lib/types";
import { mockGraphMap } from "@/lib/mock-data";

export type DemoSampleId = "ai" | "perf" | "react";

const NOTE_KEY: Record<DemoSampleId, keyof typeof mockGraphMap> = {
  ai: "note-1",
  perf: "note-2",
  react: "note-3",
};

const TITLES: Record<DemoSampleId, string> = {
  ai: "人工智能导论（演示）",
  perf: "前端性能优化（演示）",
  react: "React 状态管理（演示）",
};

export function parseDemoSample(raw: string | null): DemoSampleId {
  if (raw === "perf" || raw === "performance") return "perf";
  if (raw === "react") return "react";
  return "ai";
}

export function getDemoGraphData(sample: DemoSampleId): GraphData {
  return mockGraphMap[NOTE_KEY[sample]];
}

/** 与当前示例 mock 数据一致的笔记 ID，供已登录用户调用后端问答 */
export function getDemoNoteId(sample: DemoSampleId): string {
  return NOTE_KEY[sample];
}

export function getDemoPageTitle(sample: DemoSampleId): string {
  return TITLES[sample];
}

export const DEMO_GRAPH_SVG_ID = "demo-knowledge-graph-svg";

export const DEMO_SAMPLE_OPTIONS: { id: DemoSampleId; label: string; hint: string }[] = [
  { id: "ai", label: "人工智能导论", hint: "含文档要点图 + 图谱衍生图" },
  { id: "perf", label: "前端性能优化", hint: "图谱衍生统计" },
  { id: "react", label: "React 状态管理", hint: "图谱衍生统计" },
];
