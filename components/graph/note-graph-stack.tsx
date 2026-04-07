"use client";

import type { GraphData } from "@/lib/types";
import { KnowledgeGraph } from "@/components/graph/knowledge-graph";
import { GraphAnalyticsCharts } from "@/components/graph/graph-analytics-charts";

interface Props {
  data: GraphData;
  svgId: string;
}

/**
 * 笔记图谱纵向堆叠：上方为交互式 SVG 图谱，下方为多块 ECharts，整列随页面向下延伸滚动。
 */
export function NoteGraphStack({ data, svgId }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <KnowledgeGraph data={data} svgId={svgId} />
      <GraphAnalyticsCharts data={data} />
    </div>
  );
}
