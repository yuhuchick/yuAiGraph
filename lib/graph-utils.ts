import type { GraphData } from "@/lib/types";

/** 按节点 id 去重（保留首次出现），并剔除端点不在节点集合中的边 */
export function dedupeGraphData(raw: GraphData): GraphData {
  const seen = new Set<string>();
  const nodes = raw.nodes.filter((n) => {
    if (!n?.id || seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
  const ids = new Set(nodes.map((n) => n.id));
  const links = raw.links.filter(
    (l) => l && ids.has(l.source) && ids.has(l.target),
  );
  return { ...raw, nodes, links };
}
