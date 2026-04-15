"use client";

import type { EChartsOption } from "echarts";
import { useEffect, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { GraphData, InsightChartSpec } from "@/lib/types";
import { useChartExport } from "@/components/graph/chart-export-context";
import { buildInsightChartOption, getGraphChartDefinitions } from "@/lib/chart-registry";

function normalizeTableRows(columns: string[], rows: string[][]): string[][] {
  const n = columns.length;
  if (n === 0) return rows;
  return rows.map((r) => {
    const cells = [...r];
    while (cells.length < n) cells.push("—");
    return cells.slice(0, n);
  });
}

function AnalyticsTableBlock({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="max-h-[min(380px,55vh)] overflow-auto rounded-xl border border-zinc-200/80 bg-zinc-50/30">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-100/95 backdrop-blur-sm">
          <tr>
            {columns.map((c, ci) => (
              <th
                key={`h-${ci}-${c}`}
                className="whitespace-nowrap px-3 py-2.5 font-semibold text-zinc-700 first:rounded-tl-xl last:rounded-tr-xl"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-border bg-card/80 last:border-0 hover:bg-primary-light/50"
            >
              {row.map((cell, ci) => (
                <td key={ci} className="max-w-[min(28rem,40vw)] px-3 py-2 align-top text-zinc-600 break-words">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegisteredEChart({
  exportId,
  title,
  option,
}: {
  exportId: string;
  title: string;
  option: EChartsOption;
}) {
  const chartExport = useChartExport();
  const ref = useRef<InstanceType<typeof ReactECharts>>(null);

  useEffect(() => {
    if (!chartExport) return;
    return chartExport.register({
      id: exportId,
      title,
      getInstance: () => ref.current?.getEchartsInstance() ?? null,
    });
  }, [chartExport, exportId, title]);

  return (
    <ReactECharts
      ref={ref}
      option={option}
      style={{ width: "100%", height: 300 }}
      opts={{ renderer: "canvas" }}
      notMerge
      lazyUpdate
    />
  );
}

type InsightPanel =
  | { kind: "echarts"; spec: InsightChartSpec; option: EChartsOption }
  | { kind: "table"; spec: InsightChartSpec; columns: string[]; rows: string[][] };

interface Props {
  data: GraphData;
}

/**
 * 优先渲染 AI 返回的 insightCharts（文档语义：图或表），再渲染基于图谱的可读表格与力导向图。
 */
export function GraphAnalyticsCharts({ data }: Props) {
  const insightPanels = useMemo((): InsightPanel[] => {
    const specs = data.insightCharts ?? [];
    return specs
      .map((spec): InsightPanel | null => {
        const ct = (spec.chartType || "").toLowerCase().trim();
        if (ct === "table") {
          const columns = spec.tableColumns ?? [];
          const rows = spec.tableRows ?? [];
          if (!columns.length || !rows.length) return null;
          return {
            kind: "table",
            spec,
            columns,
            rows: normalizeTableRows(columns, rows),
          };
        }
        const option = buildInsightChartOption(spec);
        return option ? { kind: "echarts", spec, option } : null;
      })
      .filter((x): x is InsightPanel => x !== null);
  }, [data.insightCharts]);

  const structurePanels = useMemo(() => {
    if (!data.nodes.length) return [];
    return getGraphChartDefinitions()
      .map((def) => {
        const built = def.build(data);
        return built ? { def, built } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [data]);

  if (!insightPanels.length && !structurePanels.length) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-2 border-b border-zinc-200 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800">数据可视化</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            文档要点由解析模型按内容选择图表或表格；下方为实体/关系可读清单与网络视图
          </p>
        </div>
      </div>

      {insightPanels.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">文档要点</h4>
          <div className="flex flex-col gap-6">
            {insightPanels.map((panel, pi) => (
              <article
                key={`insight-${panel.spec.id}-${pi}`}
                className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-sm"
              >
                <header className="border-b border-border bg-primary-light/50 px-4 py-2.5">
                  <h4 className="text-sm font-medium text-zinc-800">{panel.spec.title}</h4>
                  {panel.spec.rationale ? (
                    <p className="mt-0.5 text-xs text-zinc-500">{panel.spec.rationale}</p>
                  ) : null}
                </header>
                {panel.kind === "echarts" ? (
                  <div className="w-full p-2" style={{ minHeight: 300 }}>
                    <RegisteredEChart
                      exportId={`insight-${panel.spec.id}-${pi}`}
                      title={panel.spec.title}
                      option={panel.option}
                    />
                  </div>
                ) : (
                  <div className="p-3 pb-4">
                    <AnalyticsTableBlock columns={panel.columns} rows={panel.rows} />
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {structurePanels.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">内容速览</h4>
          <p className="text-xs text-zinc-400">
            基于当前笔记图谱生成的实体表、关系表与力导向图，便于对照正文快速把握结构
          </p>
          <div className="flex flex-col gap-6 pb-4">
            {structurePanels.map(({ def, built }) => (
              <article
                key={def.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <header className="border-b border-zinc-100 px-4 py-2.5">
                  <h4 className="text-sm font-medium text-zinc-800">{def.title}</h4>
                  <p className="mt-0.5 text-xs text-zinc-400">{def.description}</p>
                </header>
                {built.kind === "echarts" ? (
                  <div className="w-full p-2" style={{ minHeight: 300 }}>
                    <RegisteredEChart
                      exportId={`structure-${def.id}`}
                      title={def.title}
                      option={built.option}
                    />
                  </div>
                ) : (
                  <div className="w-full p-3 pb-4">
                    <AnalyticsTableBlock columns={built.columns} rows={built.rows} />
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
