import type { EChartsOption } from "echarts";
import type { GraphData, GraphLink, GraphNode, InsightChartSpec, NodeType } from "@/lib/types";
import { GRAPH_TYPE_META } from "@/lib/graph-theme";

const INSIGHT_PALETTE = ["#6366f1", "#8b5cf6", "#14b8a6", "#f59e0b", "#ec4899", "#0ea5e9"];

/**
 * 将 AI 返回的 InsightChartSpec 转为 ECharts option；数据不合法时返回 null。
 */
export function buildInsightChartOption(spec: InsightChartSpec): EChartsOption | null {
  const t = (spec.chartType || "").toLowerCase().trim();
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

/** 单份文档可挂载的图表定义：通过 registerGraphChart 扩展新类型 */
export interface GraphChartDefinition {
  id: string;
  title: string;
  description: string;
  buildOption: (data: GraphData) => EChartsOption | null;
}

function countByType(nodes: GraphNode[]): { name: string; value: number; itemStyle?: { color: string } }[] {
  const acc = new Map<NodeType, number>();
  for (const n of nodes) {
    acc.set(n.type, (acc.get(n.type) ?? 0) + 1);
  }
  return (Object.keys(GRAPH_TYPE_META) as NodeType[])
    .map((t) => ({
      name: GRAPH_TYPE_META[t].label,
      value: acc.get(t) ?? 0,
      itemStyle: { color: GRAPH_TYPE_META[t].color },
    }))
    .filter((x) => x.value > 0);
}

function topRelationships(links: GraphLink[], top = 14) {
  const m = new Map<string, number>();
  for (const l of links) {
    const k = l.relationship.trim() || "未命名关系";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, value]) => ({ name, value }));
}

function nodeDegrees(nodes: GraphNode[], links: GraphLink[]) {
  const deg = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  for (const l of links) {
    deg.set(l.source, (deg.get(l.source) ?? 0) + 1);
    deg.set(l.target, (deg.get(l.target) ?? 0) + 1);
  }
  return nodes
    .map((n) => ({ name: n.name, value: deg.get(n.id) ?? 0 }))
    .sort((a, b) => b.value - a.value);
}

const builtinCharts: GraphChartDefinition[] = [
  {
    id: "pie-types",
    title: "实体类型占比",
    description: "饼图：各类型节点数量分布",
    buildOption(data) {
      const seriesData = countByType(data.nodes);
      if (!seriesData.length) return null;
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
            data: seriesData,
          },
        ],
      };
    },
  },
  {
    id: "bar-types",
    title: "实体类型数量",
    description: "柱状图：各类型节点数量对比",
    buildOption(data) {
      const seriesData = countByType(data.nodes);
      if (!seriesData.length) return null;
      return {
        tooltip: { trigger: "axis" },
        grid: { left: 48, right: 16, top: 24, bottom: 32 },
        xAxis: {
          type: "category",
          data: seriesData.map((d) => d.name),
          axisLabel: { fontSize: 11 },
        },
        yAxis: { type: "value", minInterval: 1, axisLabel: { fontSize: 11 } },
        series: [
          {
            type: "bar",
            data: seriesData.map((d) => ({ value: d.value, itemStyle: { color: d.itemStyle?.color } })),
            barMaxWidth: 48,
            itemStyle: { borderRadius: [6, 6, 0, 0] },
          },
        ],
      };
    },
  },
  {
    id: "bar-relations",
    title: "关系类型频次",
    description: "柱状图：关系标签出现次数（Top）",
    buildOption(data) {
      const rows = topRelationships(data.links, 14);
      if (!rows.length) return null;
      return {
        tooltip: { trigger: "axis" },
        grid: { left: 12, right: 24, top: 16, bottom: 8, containLabel: true },
        xAxis: { type: "value", minInterval: 1, axisLabel: { fontSize: 10 } },
        yAxis: {
          type: "category",
          data: rows.map((r) => r.name),
          axisLabel: { fontSize: 10, width: 100, overflow: "truncate" },
        },
        series: [
          {
            type: "bar",
            data: rows.map((r) => r.value),
            itemStyle: { color: "#6366f1", borderRadius: [0, 4, 4, 0] },
          },
        ],
      };
    },
  },
  {
    id: "line-degree",
    title: "节点连接度分布",
    description: "折线图：按连接度从高到低排列的节点（反映枢纽程度）",
    buildOption(data) {
      const sorted = nodeDegrees(data.nodes, data.links);
      if (sorted.length < 2) return null;
      const top = sorted.slice(0, Math.min(24, sorted.length));
      return {
        tooltip: {
          trigger: "axis",
          formatter: (params: unknown) => {
            const p = Array.isArray(params) ? params[0] : params;
            if (!p || typeof p !== "object" || !("dataIndex" in p)) return "";
            const i = (p as { dataIndex: number }).dataIndex;
            const row = top[i];
            return row ? `${row.name}<br/>连接度: ${row.value}` : "";
          },
        },
        grid: { left: 40, right: 16, top: 24, bottom: 64 },
        xAxis: {
          type: "category",
          data: top.map((_, i) => `${i + 1}`),
          name: "排序序号",
          nameLocation: "middle",
          nameGap: 28,
          axisLabel: { fontSize: 10 },
        },
        yAxis: { type: "value", minInterval: 1, name: "连接数", axisLabel: { fontSize: 10 } },
        series: [
          {
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            data: top.map((d) => d.value),
            lineStyle: { width: 2, color: "#8b5cf6" },
            areaStyle: { color: "rgba(139, 92, 246, 0.08)" },
          },
        ],
      };
    },
  },
  {
    id: "graph-force",
    title: "关系网络（力导向）",
    description: "ECharts 力导向图：同一文档的另一种网络视图",
    buildOption(data) {
      if (!data.nodes.length) return null;
      const cat = { concept: 0, person: 1, event: 2, object: 3 };
      return {
        tooltip: {},
        legend: {
          data: (Object.keys(GRAPH_TYPE_META) as NodeType[]).map((t) => GRAPH_TYPE_META[t].label),
          bottom: 0,
          textStyle: { fontSize: 10 },
        },
        series: [
          {
            type: "graph",
            layout: "force",
            roam: true,
            draggable: true,
            force: {
              repulsion: Math.min(420, 120 + data.nodes.length * 12),
              edgeLength: [40, 120],
            },
            label: { show: true, fontSize: 10 },
            lineStyle: { color: "#cbd5e1", curveness: 0.12 },
            categories: (Object.keys(GRAPH_TYPE_META) as NodeType[]).map((t) => ({
              name: GRAPH_TYPE_META[t].label,
              itemStyle: { color: GRAPH_TYPE_META[t].color },
            })),
            data: data.nodes.map((n) => ({
              id: n.id,
              name: n.name,
              category: cat[n.type],
              symbolSize:
                14 +
                Math.min(
                  18,
                  (data.links.filter((l) => l.source === n.id || l.target === n.id).length || 0) * 2,
                ),
            })),
            links: data.links.map((l) => ({
              source: l.source,
              target: l.target,
              label: { show: data.links.length <= 20, formatter: l.relationship, fontSize: 9 },
            })),
            emphasis: { focus: "adjacency", lineStyle: { width: 3 } },
          },
        ],
      };
    },
  },
  {
    id: "radar-type-balance",
    title: "类型结构雷达",
    description: "雷达图：各类型相对规模（按当前最大值归一化坐标轴）",
    buildOption(data) {
      const seriesData = countByType(data.nodes);
      if (!seriesData.length) return null;
      const max = Math.max(...seriesData.map((d) => d.value), 1);
      const indicators = seriesData.map((d) => ({
        name: d.name,
        max: max * 1.15,
      }));
      return {
        tooltip: {},
        radar: {
          indicator: indicators,
          radius: "62%",
          splitArea: { areaStyle: { color: ["rgba(99,102,241,0.05)", "rgba(99,102,241,0.02)"] } },
        },
        series: [
          {
            type: "radar",
            data: [
              {
                value: seriesData.map((d) => d.value),
                name: "本笔记",
                areaStyle: { color: "rgba(99, 102, 241, 0.2)" },
                lineStyle: { color: "#6366f1" },
              },
            ],
          },
        ],
      };
    },
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
