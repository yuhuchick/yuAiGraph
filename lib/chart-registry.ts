import type { EChartsOption } from "echarts";
import type { GraphData, InsightChartSpec, NodeType } from "@/lib/types";
import { GRAPH_TYPE_META } from "@/lib/graph-theme";

const INSIGHT_PALETTE = ["#6366f1", "#8b5cf6", "#14b8a6", "#f59e0b", "#ec4899", "#0ea5e9"];

/**
 * 将 AI 返回的 InsightChartSpec 转为 ECharts option；数据不合法时返回 null。
 */
export function buildInsightChartOption(spec: InsightChartSpec): EChartsOption | null {
  const t = (spec.chartType || "").toLowerCase().trim();
  if (t === "table") return null;
  if (t === "scatter") {
    const pts = spec.scatterPoints;
    if (!Array.isArray(pts) || pts.length < 2) return null;
    const pairs: [number, number][] = [];
    for (const p of pts) {
      if (!Array.isArray(p) || p.length < 2) continue;
      const x = Number(p[0]);
      const y = Number(p[1]);
      if (Number.isFinite(x) && Number.isFinite(y)) pairs.push([x, y]);
    }
    if (pairs.length < 2) return null;
    return {
      tooltip: { trigger: "item" },
      grid: { left: 48, right: 16, top: 24, bottom: 36 },
      xAxis: { type: "value", scale: true, axisLabel: { fontSize: 10 } },
      yAxis: { type: "value", scale: true, axisLabel: { fontSize: 10 } },
      series: [
        {
          type: "scatter",
          symbolSize: 8,
          data: pairs,
          itemStyle: { color: INSIGHT_PALETTE[0] },
        },
      ],
    };
  }

  const categories = spec.categories ?? [];
  const seriesList = spec.series ?? [];
  if (!categories.length || !seriesList.length) return null;

  const first = seriesList[0];
  if (!first?.data?.length || first.data.length !== categories.length) return null;
  for (let i = 1; i < seriesList.length; i++) {
    const s = seriesList[i];
    if (!s?.data?.length || s.data.length !== categories.length) return null;
  }

  if (t === "pie") {
    const data = categories.map((name, i) => ({
      name,
      value: first.data[i],
      itemStyle: { color: INSIGHT_PALETTE[i % INSIGHT_PALETTE.length] },
    }));
    return {
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      series: [
        {
          type: "pie",
          radius: ["36%", "68%"],
          center: ["50%", "46%"],
          itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
          label: { fontSize: 11 },
          data,
        },
      ],
    };
  }

  if (t === "bar") {
    return {
      tooltip: { trigger: "axis" },
      legend:
        seriesList.length > 1
          ? { bottom: 0, textStyle: { fontSize: 10 }, data: seriesList.map((s) => s.name) }
          : undefined,
      grid: { left: 48, right: 16, top: seriesList.length > 1 ? 28 : 24, bottom: seriesList.length > 1 ? 40 : 32 },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: { fontSize: 11, rotate: categories.some((c) => c.length > 6) ? 28 : 0 },
      },
      yAxis: { type: "value", axisLabel: { fontSize: 11 } },
      series: seriesList.map((s, si) => ({
        name: s.name,
        type: "bar" as const,
        barMaxWidth: 40,
        data: s.data.map((v, i) => ({
          value: v,
          itemStyle: {
            color: INSIGHT_PALETTE[(si * categories.length + i) % INSIGHT_PALETTE.length],
            borderRadius: [6, 6, 0, 0],
          },
        })),
      })),
    };
  }

  if (t === "line") {
    return {
      tooltip: { trigger: "axis" },
      legend:
        seriesList.length > 1
          ? { bottom: 0, textStyle: { fontSize: 10 }, data: seriesList.map((s) => s.name) }
          : undefined,
      grid: { left: 48, right: 16, top: seriesList.length > 1 ? 28 : 24, bottom: seriesList.length > 1 ? 40 : 32 },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: { fontSize: 11, rotate: categories.some((c) => c.length > 6) ? 28 : 0 },
      },
      yAxis: { type: "value", axisLabel: { fontSize: 11 } },
      series: seriesList.map((s, si) => ({
        name: s.name,
        type: "line" as const,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: s.data,
        lineStyle: { width: 2, color: INSIGHT_PALETTE[si % INSIGHT_PALETTE.length] },
      })),
    };
  }

  if (t === "radar") {
    const max = Math.max(...seriesList.flatMap((s) => s.data), 1);
    const indicator = categories.map((name) => ({
      name,
      max: max * 1.15,
    }));
    return {
      tooltip: {},
      legend:
        seriesList.length > 1
          ? { bottom: 0, textStyle: { fontSize: 10 }, data: seriesList.map((s) => s.name) }
          : undefined,
      radar: {
        indicator,
        radius: "62%",
        splitArea: { areaStyle: { color: ["rgba(99,102,241,0.05)", "rgba(99,102,241,0.02)"] } },
      },
      series: [
        {
          type: "radar",
          data: seriesList.map((s, si) => ({
            value: s.data,
            name: s.name,
            areaStyle: { color: `${INSIGHT_PALETTE[si % INSIGHT_PALETTE.length]}33` },
            lineStyle: { color: INSIGHT_PALETTE[si % INSIGHT_PALETTE.length] },
          })),
        },
      ],
    };
  }

  return null;
}

/** 结构区面板：ECharts 或可读表格 */
export type GraphChartPayload =
  | { kind: "echarts"; option: EChartsOption }
  | { kind: "table"; columns: string[]; rows: string[][] };

/** 单份文档可挂载的图表定义：通过 registerGraphChart 扩展新类型 */
export interface GraphChartDefinition {
  id: string;
  title: string;
  description: string;
  build: (data: GraphData) => GraphChartPayload | null;
}

function truncateCell(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t.length) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function buildEntitySummaryTable(data: GraphData): GraphChartPayload | null {
  if (!data.nodes.length) return null;
  const columns = ["实体", "类型", "要点（摘要）"];
  const sorted = [...data.nodes].sort((a, b) => {
    const la = GRAPH_TYPE_META[a.type]?.label;
    const lb = GRAPH_TYPE_META[b.type]?.label;
    if (la !== lb) return la.localeCompare(lb, "zh");
    return a.name.localeCompare(b.name, "zh");
  });
  const rows = sorted.slice(0, 48).map((n) => [
    n.name,
    GRAPH_TYPE_META[n.type]?.label,
    truncateCell(n.description, 96),
  ]);
  return { kind: "table", columns, rows };
}

function buildRelationListTable(data: GraphData): GraphChartPayload | null {
  if (!data.links.length) return null;
  const idToName = new Map(data.nodes.map((n) => [n.id, n.name]));
  const columns = ["源实体", "关系", "目标实体"];
  const rows = data.links.slice(0, 60).map((l) => [
    idToName.get(l.source) ?? l.source,
    (l.relationship || "—").trim() || "—",
    idToName.get(l.target) ?? l.target,
  ]);
  return { kind: "table", columns, rows };
}

const builtinCharts: GraphChartDefinition[] = [
  {
    id: "table-entities",
    title: "核心实体一览",
    description: "表格：实体名称、类型与文内要点摘要，便于快速扫读",
    build: buildEntitySummaryTable,
  },
  {
    id: "table-relations",
    title: "关系清单",
    description: "表格：源—关系—目标，对应图谱中的每条边",
    build: buildRelationListTable,
  },
];

const customCharts: GraphChartDefinition[] = [];

export function registerGraphChart(def: GraphChartDefinition): void {
  if (builtinCharts.some((b) => b.id === def.id) || customCharts.some((c) => c.id === def.id)) {
    console.warn(`[chart-registry] 图表 id 已存在，跳过: ${def.id}`);
    return;
  }
  customCharts.push(def);
}

export function getGraphChartDefinitions(): GraphChartDefinition[] {
  return [...builtinCharts, ...customCharts];
}
