"use client";

import type { EChartsOption } from "echarts";
import { useEffect, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { GraphData } from "@/lib/types";
import { useChartExport } from "@/components/graph/chart-export-context";
import { buildInsightChartOption, getGraphChartDefinitions } from "@/lib/chart-registry";

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

interface Props {
  data: GraphData;
}

/**
 * 优先渲染 AI 返回的 insightCharts（按文档语义选图型），再渲染基于图谱结构的衍生图表。
 */
export function GraphAnalyticsCharts({ data }: Props) {
  const insightPanels = useMemo(() => {
    const specs = data.insightCharts ?? [];
    return specs
      .map((spec) => {
        const option = buildInsightChartOption(spec);
        return option ? { spec, option } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [data.insightCharts]);

  const structurePanels = useMemo(() => {
    if (!data.nodes.length) return [];
    return getGraphChartDefinitions()
      .map((def) => {
        const option = def.buildOption(data);
        return option ? { def, option } : null;
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
            文档要点与图谱结构分开展示；要点图由解析模型按内容选择图例类型
          </p>
        </div>
      </div>

      {insightPanels.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">文档要点</h4>
          <div className="flex flex-col gap-6">
            {insightPanels.map(({ spec, option }) => (
              <article
                key={spec.id}
                className="overflow-hidden rounded-2xl border border-indigo-200/60 bg-white shadow-sm"
              >
                <header className="border-b border-zinc-100 bg-indigo-50/40 px-4 py-2.5">
                  <h4 className="text-sm font-medium text-zinc-800">{spec.title}</h4>
                  {spec.rationale ? (
                    <p className="mt-0.5 text-xs text-zinc-500">{spec.rationale}</p>
                  ) : null}
                </header>
                <div className="w-full p-2" style={{ minHeight: 300 }}>
                  <RegisteredEChart exportId={`insight-${spec.id}`} title={spec.title} option={option} />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {structurePanels.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">图谱衍生</h4>
          <div className="flex flex-col gap-6 pb-4">
            {structurePanels.map(({ def, option }) => (
              <article
                key={def.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <header className="border-b border-zinc-100 px-4 py-2.5">
                  <h4 className="text-sm font-medium text-zinc-800">{def.title}</h4>
                  <p className="mt-0.5 text-xs text-zinc-400">{def.description}</p>
                </header>
                <div className="w-full p-2" style={{ minHeight: 300 }}>
                  <RegisteredEChart exportId={`structure-${def.id}`} title={def.title} option={option} />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
