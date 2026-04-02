"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GraphData, GraphNode, GraphLink, NodeType } from "@/lib/types";

// ─── 类型定义 ─────────────────────────────────────────────────────

interface NodePos {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

type LayoutType = "force" | "tree" | "radial" | "grid";

// ─── 常量 ─────────────────────────────────────────────────────────

type ShapeType = "circle" | "diamond" | "roundrect" | "hexagon";

const COLORS: Record<
  NodeType,
  { fill: string; stroke: string; text: string; label: string; badge: string; shape: ShapeType; icon: string }
> = {
  concept: { fill: "#dbeafe", stroke: "#3b82f6", text: "#1d4ed8", label: "概念", badge: "bg-blue-100 text-blue-700",   shape: "circle",    icon: "○" },
  person:  { fill: "#fce7f3", stroke: "#ec4899", text: "#9d174d", label: "人物", badge: "bg-pink-100 text-pink-700",    shape: "diamond",   icon: "◇" },
  event:   { fill: "#d1fae5", stroke: "#10b981", text: "#065f46", label: "事件", badge: "bg-emerald-100 text-emerald-700", shape: "roundrect", icon: "▭" },
  object:  { fill: "#fef9c3", stroke: "#eab308", text: "#713f12", label: "实体", badge: "bg-yellow-100 text-yellow-700", shape: "hexagon",   icon: "⬡" },
};

/** 将六边形6个顶点的坐标字符串，以「尖朝上」方式排列 */
function hexPoints(r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${r * Math.cos(a)},${r * Math.sin(a)}`;
  }).join(" ");
}

/** 渲染节点形状（以 transform(x,y) 原点为中心） */
function NodeShape({
  shape, r, fill, stroke, strokeWidth, filter,
}: {
  shape: ShapeType; r: number; fill: string; stroke: string; strokeWidth: number; filter?: string;
}) {
  const common = { fill, stroke, strokeWidth, filter };
  switch (shape) {
    case "diamond":
      return <polygon points={`0,${-r} ${r * 1.05},0 0,${r} ${-r * 1.05},0`} {...common} />;
    case "roundrect":
      return <rect x={-r * 1.25} y={-r * 0.72} width={r * 2.5} height={r * 1.44} rx={10} ry={10} {...common} />;
    case "hexagon":
      return <polygon points={hexPoints(r)} {...common} />;
    default:
      return <circle r={r} {...common} />;
  }
}

/** 图例中展示的迷你形状（16×16 SVG） */
function LegendShapeIcon({ type }: { type: NodeType }) {
  const c = COLORS[type];
  const r = 6;
  return (
    <svg width={16} height={16} viewBox="-8 -8 16 16" className="shrink-0">
      <NodeShape shape={c.shape} r={r} fill={c.fill} stroke={c.stroke} strokeWidth={1.5} />
    </svg>
  );
}

const LAYOUT_META: { id: LayoutType; label: string; icon: string; hint: string }[] = [
  { id: "force",  label: "力导向",  icon: "⑂", hint: "弹簧物理模拟，节点自由排布" },
  { id: "tree",   label: "层级树",  icon: "🌿", hint: "按依赖关系从上到下分层" },
  { id: "radial", label: "放射状",  icon: "◎", hint: "核心节点居中，关系向外辐射" },
  { id: "grid",   label: "分类网格", icon: "⊞", hint: "按实体类型分列展示" },
];

const NODE_R  = 28;
const PADDING = NODE_R + 8;

// 各布局的仿真帧数（0 = 静态，不运行仿真）
const SIM_FRAMES: Record<LayoutType, number> = {
  force: 240,
  tree:  0,
  radial: 60,
  grid:  0,
};

// ─── 布局算法 ─────────────────────────────────────────────────────

function layoutForce(nodes: GraphNode[], w: number, h: number): NodePos[] {
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) * 0.33;
  return nodes.map((node, i) => {
    const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    return { id: node.id, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), vx: 0, vy: 0 };
  });
}

function layoutTree(nodes: GraphNode[], links: GraphLink[], w: number, h: number): NodePos[] {
  if (!nodes.length) return [];

  // 计算入度，找根节点
  const inDeg = new Map(nodes.map((n) => [n.id, 0]));
  for (const l of links) inDeg.set(l.target, (inDeg.get(l.target) ?? 0) + 1);
  let roots = nodes.filter((n) => inDeg.get(n.id) === 0);
  if (!roots.length) roots = [nodes[0]];

  // BFS 分配层级
  const levels = new Map<string, number>();
  const queue: { id: string; lv: number }[] = roots.map((r) => ({ id: r.id, lv: 0 }));
  const visited = new Set<string>(roots.map((r) => r.id));

  while (queue.length) {
    const { id, lv } = queue.shift()!;
    levels.set(id, lv);
    for (const l of links) {
      const child = l.source === id ? l.target : null;
      if (child && !visited.has(child)) {
        visited.add(child);
        queue.push({ id: child, lv: lv + 1 });
      }
    }
  }
  for (const n of nodes) if (!levels.has(n.id)) levels.set(n.id, 0);

  // 按层分组
  const byLv = new Map<number, string[]>();
  for (const [id, lv] of levels) {
    if (!byLv.has(lv)) byLv.set(lv, []);
    byLv.get(lv)!.push(id);
  }

  const maxLv = Math.max(...levels.values(), 0);
  const lvH = (h - PADDING * 2) / Math.max(maxLv, 1);

  return nodes.map((node) => {
    const lv = levels.get(node.id)!;
    const lvNodes = byLv.get(lv)!;
    const idx = lvNodes.indexOf(node.id);
    const x = PADDING + (w - PADDING * 2) * (idx + 1) / (lvNodes.length + 1);
    const y = PADDING + lv * lvH + lvH / 2;
    return { id: node.id, x, y, vx: 0, vy: 0 };
  });
}

function layoutRadial(nodes: GraphNode[], links: GraphLink[], w: number, h: number): NodePos[] {
  if (!nodes.length) return [];
  const cx = w / 2, cy = h / 2;

  // 计算度数，选中心节点
  const deg = new Map(nodes.map((n) => [n.id, 0]));
  for (const l of links) {
    deg.set(l.source, (deg.get(l.source) ?? 0) + 1);
    deg.set(l.target, (deg.get(l.target) ?? 0) + 1);
  }
  const center = [...deg.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? nodes[0].id;

  // BFS 分配环级
  const rings = new Map<string, number>();
  const visited = new Set([center]);
  const q: [string, number][] = [[center, 0]];
  while (q.length) {
    const [id, ring] = q.shift()!;
    rings.set(id, ring);
    const neighbors = links
      .filter((l) => l.source === id || l.target === id)
      .map((l) => (l.source === id ? l.target : l.source))
      .filter((n) => !visited.has(n));
    for (const n of neighbors) { visited.add(n); q.push([n, ring + 1]); }
  }
  const outerRing = (Math.max(...rings.values(), 0)) + 1;
  for (const n of nodes) if (!rings.has(n.id)) rings.set(n.id, outerRing);

  // 按环分组
  const byRing = new Map<number, string[]>();
  for (const [id, ring] of rings) {
    if (!byRing.has(ring)) byRing.set(ring, []);
    byRing.get(ring)!.push(id);
  }

  const maxRing = Math.max(...rings.values(), 1);
  const maxR = Math.min(w, h) * 0.43;

  return nodes.map((node) => {
    const ring = rings.get(node.id)!;
    if (ring === 0) return { id: node.id, x: cx, y: cy, vx: 0, vy: 0 };
    const ringNodes = byRing.get(ring)!;
    const idx = ringNodes.indexOf(node.id);
    const r = (ring / maxRing) * maxR;
    const angle = (idx / ringNodes.length) * Math.PI * 2 - Math.PI / 2;
    return { id: node.id, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), vx: 0, vy: 0 };
  });
}

function layoutGrid(nodes: GraphNode[], w: number, h: number): NodePos[] {
  const types: NodeType[] = ["concept", "person", "event", "object"];
  const byType = new Map<NodeType, GraphNode[]>(types.map((t) => [t, []]));
  for (const n of nodes) byType.get(n.type as NodeType)?.push(n);
  const active = types.filter((t) => byType.get(t)!.length > 0);

  const colW = (w - PADDING * 2) / active.length;
  const HEADER_H = 36;
  const result: NodePos[] = [];

  active.forEach((type, ci) => {
    const typeNodes = byType.get(type)!;
    const colX = PADDING + ci * colW + colW / 2;
    const usableH = h - PADDING * 2 - HEADER_H;
    const rowH = usableH / Math.max(typeNodes.length, 1);
    typeNodes.forEach((node, ri) => {
      result.push({
        id: node.id,
        x: colX,
        y: PADDING + HEADER_H + ri * rowH + rowH / 2,
        vx: 0, vy: 0,
      });
    });
  });
  return result;
}

function buildPositions(
  layout: LayoutType,
  nodes: GraphNode[],
  links: GraphLink[],
  w: number,
  h: number,
): NodePos[] {
  switch (layout) {
    case "tree":   return layoutTree(nodes, links, w, h);
    case "radial": return layoutRadial(nodes, links, w, h);
    case "grid":   return layoutGrid(nodes, w, h);
    default:       return layoutForce(nodes, w, h);
  }
}

// ─── 组件 ─────────────────────────────────────────────────────────

const EMPTY_GRAPH: GraphData = { nodes: [], links: [] };

interface Props {
  data: GraphData | null | undefined;
  svgId?: string;
}

export function KnowledgeGraph({ data: dataProp, svgId }: Props) {
  const data = dataProp ?? EMPTY_GRAPH;
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const posRef       = useRef<NodePos[]>([]);
  const rafRef       = useRef<number>(0);
  const dragRef      = useRef<{ id: string } | null>(null);
  const frameRef     = useRef(0);

  const [dim, setDim]         = useState({ w: 640, h: 420 });
  const [tick, setTick]       = useState(0);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [layout, setLayout]   = useState<LayoutType>("force");

  // ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDim({ w: width, h: Math.max(360, Math.round(width * 0.62)) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // 布局切换或数据/尺寸变化时重新初始化位置
  useEffect(() => {
    posRef.current = buildPositions(layout, data.nodes, data.links, dim.w, dim.h);
    frameRef.current = 0;
    setTick((n) => n + 1);
  }, [layout, data.nodes, data.links, dim]);

  // 力仿真（根据布局决定帧数）
  useEffect(() => {
    if (!data.nodes.length) return;
    cancelAnimationFrame(rafRef.current);
    frameRef.current = 0;

    const maxFrames = SIM_FRAMES[layout];
    if (maxFrames === 0) return;

    const idealLen = Math.min(dim.w, dim.h) * 0.3;
    const cx = dim.w / 2, cy = dim.h / 2;

    const REPULSION   = layout === "force" ? 6000 : 2000;
    const SPRING_K    = layout === "force" ? 0.03  : 0.01;
    const DAMPING     = 0.82;
    const GRAVITY     = layout === "force" ? 0.006 : 0.002;

    const step = () => {
      if (frameRef.current >= maxFrames) return;
      frameRef.current++;
      const pos = posRef.current;

      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[j].x - pos[i].x, dy = pos[j].y - pos[i].y;
          const d = Math.sqrt(dx * dx + dy * dy) || 0.1;
          const f = REPULSION / (d * d);
          pos[i].vx -= (dx / d) * f; pos[i].vy -= (dy / d) * f;
          pos[j].vx += (dx / d) * f; pos[j].vy += (dy / d) * f;
        }
      }
      for (const l of data.links) {
        const s = pos.find((p) => p.id === l.source);
        const t = pos.find((p) => p.id === l.target);
        if (!s || !t) continue;
        const dx = t.x - s.x, dy = t.y - s.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.1;
        const stretch = (d - idealLen) * SPRING_K;
        s.vx += (dx / d) * stretch; s.vy += (dy / d) * stretch;
        t.vx -= (dx / d) * stretch; t.vy -= (dy / d) * stretch;
      }
      for (const p of pos) {
        p.vx += (cx - p.x) * GRAVITY;
        p.vy += (cy - p.y) * GRAVITY;
      }
      for (const p of pos) {
        if (dragRef.current?.id === p.id) continue;
        p.vx *= DAMPING; p.vy *= DAMPING;
        p.x = Math.max(PADDING, Math.min(dim.w - PADDING, p.x + p.vx));
        p.y = Math.max(PADDING, Math.min(dim.h - PADDING, p.y + p.vy));
      }
      setTick((n) => n + 1);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [layout, data, dim]);

  const getPos = useCallback((id: string) => posRef.current.find((p) => p.id === id), []);

  const connectedSet = selected
    ? new Set(
        data.links
          .filter((l) => l.source === selected.id || l.target === selected.id)
          .flatMap((l) => [l.source, l.target]),
      )
    : null;

  const onSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const pos = posRef.current.find((p) => p.id === dragRef.current!.id);
    if (!pos) return;
    pos.x = Math.max(PADDING, Math.min(dim.w - PADDING, e.clientX - rect.left));
    pos.y = Math.max(PADDING, Math.min(dim.h - PADDING, e.clientY - rect.top));
    pos.vx = 0; pos.vy = 0;
    setTick((n) => n + 1);
  };

  const stopDrag = () => { dragRef.current = null; };

  const nodeConnections = selected
    ? data.links
        .filter((l) => l.source === selected.id || l.target === selected.id)
        .map((l) => {
          const otherId = l.source === selected.id ? l.target : l.source;
          const other = data.nodes.find((n) => n.id === otherId);
          return other ? { node: other, rel: l.relationship, dir: l.source === selected.id ? "out" : "in" } : null;
        })
        .filter((x): x is { node: GraphNode; rel: string; dir: "out" | "in" } => x !== null)
    : [];

  // 分类网格：列头坐标
  const gridHeaders = (() => {
    if (layout !== "grid") return [];
    const types: NodeType[] = ["concept", "person", "event", "object"];
    const active = types.filter((t) => data.nodes.some((n) => n.type === t));
    const colW = (dim.w - PADDING * 2) / active.length;
    return active.map((type, ci) => ({
      type,
      x: PADDING + ci * colW + colW / 2,
      y: PADDING + 14,
    }));
  })();

  // 无节点时展示空态
  if (!data.nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white py-20 text-center">
        <span className="text-4xl opacity-40">◎</span>
        <p className="text-sm text-zinc-400">暂无图谱数据</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

        {/* ── 头部工具栏 ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-zinc-800">知识图谱</h3>

          <div className="flex items-center gap-2">
            {/* 布局切换器 */}
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
              {LAYOUT_META.map((lm) => (
                <button
                  key={lm.id}
                  title={`${lm.label}：${lm.hint}`}
                  onClick={() => { setLayout(lm.id); setSelected(null); }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    layout === lm.id
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  <span>{lm.icon}</span>
                  <span className="hidden sm:inline">{lm.label}</span>
                </button>
              ))}
            </div>

            {selected && (
              <button onClick={() => setSelected(null)} className="text-xs text-zinc-400 hover:text-zinc-600">
                取消选中
              </button>
            )}
            <span className="text-xs text-zinc-400">{data.nodes.length} 节点 · {data.links.length} 关系</span>
          </div>
        </div>

        {/* ── SVG 画布 ── */}
        <div ref={containerRef} className="w-full">
          <svg
            ref={svgRef}
            id={svgId}
            width={dim.w}
            height={dim.h}
            className="block cursor-grab select-none active:cursor-grabbing"
            onMouseMove={onSvgMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
          >
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#cbd5e1" />
              </marker>
              <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
              </marker>
              <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000018" />
              </filter>
            </defs>

            {/* 分类网格列头 */}
            {gridHeaders.map(({ type, x, y }) => (
              <g key={type}>
                <rect
                  x={x - 28} y={y - 12}
                  width={56} height={22}
                  rx={11}
                  fill={COLORS[type].fill}
                  stroke={COLORS[type].stroke}
                  strokeWidth={1}
                />
                <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight="600" fill={COLORS[type].text}>
                  {COLORS[type].label}
                </text>
              </g>
            ))}

            {/* 放射状同心圆背景 */}
            {layout === "radial" && (() => {
              const cx = dim.w / 2, cy = dim.h / 2;
              const maxR = Math.min(dim.w, dim.h) * 0.43;
              const rings = new Set(posRef.current.map((p) => {
                const dx = p.x - cx, dy = p.y - cy;
                return Math.round(Math.sqrt(dx * dx + dy * dy) / (maxR / 4));
              }));
              return [...rings].filter((r) => r > 0).map((r) => (
                <circle key={r} cx={cx} cy={cy} r={r * (maxR / 4)} fill="none" stroke="#f1f5f9" strokeWidth={1} strokeDasharray="4 4" />
              ));
            })()}

            {/* 层级树横向分隔线 */}
            {layout === "tree" && (() => {
              const lvSet = new Set(posRef.current.map((p) => Math.round(p.y / 40) * 40));
              return [...lvSet].map((y) => (
                <line key={y} x1={PADDING} y1={y} x2={dim.w - PADDING} y2={y} stroke="#f1f5f9" strokeWidth={1} strokeDasharray="4 4" />
              ));
            })()}

            {/* 边 */}
            {data.links.map((link, i) => {
              const src = getPos(link.source);
              const tgt = getPos(link.target);
              if (!src || !tgt) return null;
              const isActive = connectedSet
                ? connectedSet.has(link.source) && connectedSet.has(link.target)
                : false;
              const mx = (src.x + tgt.x) / 2, my = (src.y + tgt.y) / 2;
              const dx = tgt.x - src.x, dy = tgt.y - src.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              // 树形布局用直线，其他用曲线
              const bend = layout === "tree" ? 0 : 18;
              const nx = (-dy / len) * bend, ny = (dx / len) * bend;
              const qx = mx + nx, qy = my + ny;

              return (
                <g key={i} opacity={selected && !isActive ? 0.12 : 1} className="transition-opacity duration-200">
                  <path
                    d={bend === 0
                      ? `M${src.x},${src.y} L${tgt.x},${tgt.y}`
                      : `M${src.x},${src.y} Q${qx},${qy} ${tgt.x},${tgt.y}`}
                    fill="none"
                    stroke={isActive ? "#6366f1" : "#cbd5e1"}
                    strokeWidth={isActive ? 2 : 1.5}
                    markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow)"}
                  />
                  <text
                    x={qx} y={qy - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill={isActive ? "#6366f1" : "#94a3b8"}
                    className="pointer-events-none"
                  >
                    {link.relationship}
                  </text>
                </g>
              );
            })}

            {/* 节点 */}
            {data.nodes.map((node) => {
              const pos = getPos(node.id);
              if (!pos) return null;
              const c = COLORS[node.type];
              const isSelected  = selected?.id === node.id;
              const isConnected = connectedSet?.has(node.id);
              const isDimmed    = !!(selected && !isSelected && !isConnected);
              const r = isSelected ? NODE_R + 4 : NODE_R;
              const isHovered   = hovered === node.id && !dragRef.current;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  className="cursor-pointer"
                  opacity={isDimmed ? 0.18 : 1}
                  style={{ transition: "opacity 0.2s" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    dragRef.current = { id: node.id };
                    if (layout === "force" || layout === "radial") frameRef.current = 0;
                  }}
                  onClick={() => setSelected(isSelected ? null : node)}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {(isSelected || isHovered) && (
                    <g opacity={0.15}>
                      <NodeShape shape={c.shape} r={r + 9} fill={c.stroke} stroke="none" strokeWidth={0} />
                    </g>
                  )}
                  <NodeShape
                    shape={c.shape}
                    r={r}
                    fill={c.fill}
                    stroke={isSelected || isConnected ? c.stroke : "#e2e8f0"}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    filter="url(#shadow)"
                  />
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    fontSize={node.name.length > 4 ? 9 : 11}
                    fontWeight="600"
                    fill={c.text}
                    className="pointer-events-none select-none"
                  >
                    {node.name.length > 6 ? node.name.slice(0, 5) + "…" : node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 图例 + 当前布局说明 */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-zinc-100 px-4 py-3">
          {(Object.keys(COLORS) as NodeType[]).map((type) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <LegendShapeIcon type={type} />
              {COLORS[type].label}
            </span>
          ))}
          <span className="ml-auto text-xs text-zinc-400">
            {LAYOUT_META.find((m) => m.id === layout)?.hint} · 点击节点查看详情 · 可拖拽
          </span>
        </div>
      </div>

      {/* 选中节点详情面板 */}
      {selected && (
        <div
          className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border bg-white p-4 shadow-sm duration-200"
          style={{ borderColor: COLORS[selected.type].stroke }}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLORS[selected.type].stroke }} />
              <span className="text-sm font-semibold text-zinc-900">{selected.name}</span>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[selected.type].badge}`}>
              {COLORS[selected.type].label}
            </span>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-zinc-600">{selected.description}</p>
          {nodeConnections.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nodeConnections.map(({ node, rel, dir }) => (
                <button
                  key={node.id}
                  onClick={() => setSelected(node)}
                  className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: COLORS[node.type].stroke }} />
                  {dir === "out" ? `→ ${node.name}` : `← ${node.name}`}
                  <span className="text-zinc-400">（{rel}）</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
