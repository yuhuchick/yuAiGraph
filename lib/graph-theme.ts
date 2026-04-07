import type { NodeType } from "@/lib/types";

/** 与知识图谱节点配色一致，供 ECharts 等复用 */
export const GRAPH_TYPE_META: Record<
  NodeType,
  { label: string; color: string }
> = {
  concept: { label: "概念", color: "#3b82f6" },
  person: { label: "人物", color: "#ec4899" },
  event: { label: "事件", color: "#10b981" },
  object: { label: "实体", color: "#eab308" },
};
