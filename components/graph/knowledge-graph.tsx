/* eslint-disable react-hooks/refs */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
      <NodeShape shape={c?.shape} r={r} fill={c?.fill} stroke={c?.stroke} strokeWidth={1.5} />
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
/** 节点纵向/行距下限，避免密堆叠；画布最小高度据此推算 */
const ROW_SLOT = NODE_R * 2 + 16;
const MAX_SVG_DIM = 10000;

/** 图谱视口缩放（1 = 默认；>1 放大内容，<1 缩小见更多） */
const ZOOM_MIN = 0.45;
const ZOOM_MAX = 2.75;
const ZOOM_STEP_WHEEL = 1.09;
const ZOOM_STEP_BUTTON = 1.2;

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

/** 与 layoutTree 相同的层级 BFS，供画布尺寸与树布局复用 */
function assignTreeLevels(nodes: GraphNode[], links: GraphLink[]): Map<string, number> {
  const levels = new Map<string, number>();
  if (!nodes.length) return levels;

  const inDeg = new Map(nodes.map((n) => [n.id, 0]));
  for (const l of links) inDeg.set(l.target, (inDeg.get(l.target) ?? 0) + 1);
  let roots = nodes.filter((n) => inDeg.get(n.id) === 0);
  if (!roots.length) roots = [nodes[0]];

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
  return levels;
}

function layoutTree(nodes: GraphNode[], links: GraphLink[], w: number, h: number): NodePos[] {
  if (!nodes.length) return [];

  const levels = assignTreeLevels(nodes, links);

  // 按层分组
  const byLv = new Map<number, string[]>();
  for (const [id, lv] of levels) {
    if (!byLv.has(lv)) byLv.set(lv, []);
    byLv.get(lv)!.push(id);
  }

  const maxLv = Math.max(...levels.values(), 0);
  // 层号为 0..maxLv 共 (maxLv+1) 层；原先除以 maxLv 会在多层时把最底行挤出画布，盖住下方图例
  const nLevels = maxLv + 1;
  const usableH = Math.max(h - PADDING * 2 - 2 * NODE_R, NODE_R * 2);
  const lvH = usableH / Math.max(nLevels, 1);
  const usableW = Math.max(w - PADDING * 2 - 2 * NODE_R, NODE_R * 2);

  return nodes.map((node) => {
    const lv = levels.get(node.id)!;
    const lvNodes = byLv.get(lv)!;
    const idx = lvNodes.indexOf(node.id);
    const x = PADDING + NODE_R + usableW * (idx + 1) / (lvNodes.length + 1);
    const y = PADDING + NODE_R + lv * lvH + lvH / 2;
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
    const rowH = Math.max(ROW_SLOT, usableH / Math.max(typeNodes.length, 1));
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

/** 逻辑画布宽度（可大于视口）；视口宽度始终为容器宽，通过平移查看 */
function contentCanvasWidth(
  layout: LayoutType,
  nodes: GraphNode[],
  links: GraphLink[],
  wViewport: number,
): number {
  if (!nodes.length) return wViewport;
  if (layout !== "tree") return wViewport;

  const levels = assignTreeLevels(nodes, links);
  const countByLv = new Map<number, number>();
  for (const lv of levels.values()) countByLv.set(lv, (countByLv.get(lv) ?? 0) + 1);
  const maxBreadth = Math.max(1, ...countByLv.values());
  const slotW = NODE_R * 2 + 14;
  const need = Math.ceil(PADDING * 2 + 2 * NODE_R + maxBreadth * slotW);
  return Math.min(MAX_SVG_DIM, Math.max(wViewport, need));
}

function clampPan(
  p: { x: number; y: number },
  vw: number,
  vh: number,
  cw: number,
  ch: number,
): { x: number; y: number } {
  const maxX = Math.max(0, cw - vw);
  const maxY = Math.max(0, ch - vh);
  return {
    x: Math.min(maxX, Math.max(0, p.x)),
    y: Math.min(maxY, Math.max(0, p.y)),
  };
}

function minCanvasHeight(
  layout: LayoutType,
  nodes: GraphNode[],
  links: GraphLink[],
  w: number,
  baseH: number,
): number {
  const n = nodes.length;
  if (n === 0) return Math.max(280, baseH);
  const vPad = PADDING * 2 + 2 * NODE_R;

  let need: number;
  switch (layout) {
    case "grid": {
      const types: NodeType[] = ["concept", "person", "event", "object"];
      const byType = new Map<NodeType, GraphNode[]>(types.map((t) => [t, []]));
      for (const node of nodes) byType.get(node.type as NodeType)?.push(node);
      const active = types.filter((t) => byType.get(t)!.length > 0);
      const maxCol = Math.max(1, ...active.map((t) => byType.get(t)!.length));
      const HEADER_H = 36;
      need = HEADER_H + maxCol * ROW_SLOT + vPad;
      break;
    }
    case "tree": {
      const levels = assignTreeLevels(nodes, links);
      const maxLv = Math.max(0, ...levels.values());
      const nLevels = maxLv + 1;
      need = nLevels * (NODE_R * 2 + 12) + vPad;
      break;
    }
    case "radial":
    case "force": {
      const g = Math.ceil(Math.sqrt(Math.max(n, 1) * 1.45));
      need = g * ROW_SLOT + vPad;
      break;
    }
    default:
      need = baseH;
  }

  return Math.min(MAX_SVG_DIM, Math.max(280, baseH, need));
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

function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
    null
  );
}

interface Props {
  data: GraphData | null | undefined;
  svgId?: string;
}

export function KnowledgeGraph({ data: dataProp, svgId }: Props) {
  const data = dataProp ?? EMPTY_GRAPH;
  const dataRef = useRef(data);
  const layoutRef = useRef<LayoutType>("force");
  dataRef.current = data;

  const graphRootRef = useRef<HTMLDivElement>(null);
  const wasGraphFullscreenRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const posRef       = useRef<NodePos[]>([]);
  const rafRef       = useRef<number>(0);
  const dragRef      = useRef<{ id: string } | null>(null);
  const frameRef     = useRef(0);

  const [viewDim, setViewDim] = useState({ w: 640, h: 420 });
  const [pan, setPan]         = useState({ x: 0, y: 0 });
  const [zoom, setZoom]       = useState(1);
  const [panning, setPanning] = useState(false);
  const [, setTick]           = useState(0);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [layout, setLayout]   = useState<LayoutType>("force");
  const [graphFullscreen, setGraphFullscreen] = useState(false);
  layoutRef.current = layout;

  const contentDim = useMemo(() => {
    const vw = viewDim.w;
    const vh = viewDim.h;
    const cw = contentCanvasWidth(layout, data.nodes, data.links, vw);
    const ch = minCanvasHeight(layout, data.nodes, data.links, cw, vh);
    return { w: cw, h: ch };
  }, [layout, data.nodes, data.links, viewDim.w, viewDim.h]);

  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const viewDimRef = useRef(viewDim);
  const contentDimRef = useRef(contentDim);
  const panDragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  panRef.current = pan;
  zoomRef.current = zoom;
  viewDimRef.current = viewDim;
  contentDimRef.current = contentDim;

  const visibleDim = useMemo(
    () => ({ w: viewDim.w / zoom, h: viewDim.h / zoom }),
    [viewDim.w, viewDim.h, zoom],
  );

  const toggleGraphFullscreen = useCallback(async () => {
    const el = graphRootRef.current;
    if (!el) return;
    try {
      if (getFullscreenElement() === el) {
        const d = document as Document & { webkitExitFullscreen?: () => void };
        if (document.exitFullscreen) await document.exitFullscreen();
        else d.webkitExitFullscreen?.();
      } else {
        const h = el as HTMLElement & { webkitRequestFullscreen?: () => void };
        if (el.requestFullscreen) await el.requestFullscreen();
        else h.webkitRequestFullscreen?.();
      }
    } catch {
      /* 部分环境不支持元素级全屏 */
    }
  }, []);

  useEffect(() => {
    const applyEmbeddedSize = () => {
      const el = containerRef.current;
      if (!el) return;
      const wObs = Math.floor(el.getBoundingClientRect().width);
      if (wObs < 32) return;
      const baseH = Math.max(360, Math.round(wObs * 0.62));
      setViewDim({ w: wObs, h: Math.max(280, baseH) });
    };

    const sync = () => {
      const on = getFullscreenElement() === graphRootRef.current;
      const wasFullscreen = wasGraphFullscreenRef.current;
      wasGraphFullscreenRef.current = on;
      setGraphFullscreen(on);
      // 仅在全屏 → 嵌入 时延后重算，避免首屏重复与全屏残留尺寸
      if (wasFullscreen && !on) {
        requestAnimationFrame(() => {
          requestAnimationFrame(applyEmbeddedSize);
        });
      }
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    sync();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  // ResizeObserver：全屏时用画布区域实际高度，非全屏按宽度比例（与退出全屏后的强制重算一致）
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width < 32) return;
      const inFs = getFullscreenElement() === graphRootRef.current;
      const wObs = Math.floor(width);
      const baseH =
        inFs && height >= 64
          ? Math.floor(height)
          : Math.max(360, Math.round(width * 0.62));
      setViewDim({ w: wObs, h: Math.max(280, baseH) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // 逻辑画布大于视口时限制平移范围（视口尺寸随 zoom 变化）
  useEffect(() => {
    setPan((p) =>
      clampPan(p, visibleDim.w, visibleDim.h, contentDim.w, contentDim.h),
    );
  }, [viewDim.w, viewDim.h, contentDim.w, contentDim.h, visibleDim.w, visibleDim.h]);

  /** 以视口中心为锚点缩放 */
  const applyZoom = useCallback((z1: number) => {
    const z0 = zoomRef.current;
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z1));
    if (Math.abs(clamped - z0) < 1e-6) return;
    const vd = viewDimRef.current;
    const cd = contentDimRef.current;
    const pr = panRef.current;
    const vw0 = vd.w / z0;
    const vh0 = vd.h / z0;
    const cx = pr.x + vw0 / 2;
    const cy = pr.y + vh0 / 2;
    const vw1 = vd.w / clamped;
    const vh1 = vd.h / clamped;
    const np = clampPan({ x: cx - vw1 / 2, y: cy - vh1 / 2 }, vw1, vh1, cd.w, cd.h);
    setZoom(clamped);
    setPan(np);
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const z0 = zoomRef.current;
      const factor = e.deltaY > 0 ? 1 / ZOOM_STEP_WHEEL : ZOOM_STEP_WHEEL;
      const z1 = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z0 * factor));
      if (Math.abs(z1 - z0) < 1e-6) return;
      const vd = viewDimRef.current;
      const cd = contentDimRef.current;
      const pr = panRef.current;
      const rect = el.getBoundingClientRect();
      const fx = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0.5;
      const fy = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.5;
      const vw0 = vd.w / z0;
      const vh0 = vd.h / z0;
      const cx = pr.x + fx * vw0;
      const cy = pr.y + fy * vh0;
      const vw1 = vd.w / z1;
      const vh1 = vd.h / z1;
      const np = clampPan({ x: cx - fx * vw1, y: cy - fy * vh1 }, vw1, vh1, cd.w, cd.h);
      setZoom(z1);
      setPan(np);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [data.nodes.length]);

  // 布局切换或数据/尺寸变化时重新初始化位置
  useEffect(() => {
    posRef.current = buildPositions(layout, data.nodes, data.links, contentDim.w, contentDim.h);
    frameRef.current = 0;
    setTick((n) => n + 1);
  }, [layout, data.nodes, data.links, contentDim]);

  // 力仿真（根据布局决定帧数）
  useEffect(() => {
    if (!data.nodes.length) return;
    cancelAnimationFrame(rafRef.current);
    frameRef.current = 0;

    const maxFrames = SIM_FRAMES[layout];
    if (maxFrames === 0) return;

    const idealLen = Math.min(contentDim.w, contentDim.h) * 0.3;
    const cx = contentDim.w / 2, cy = contentDim.h / 2;

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
        p.x = Math.max(PADDING, Math.min(contentDim.w - PADDING, p.x + p.vx));
        p.y = Math.max(PADDING, Math.min(contentDim.h - PADDING, p.y + p.vy));
      }
      setTick((n) => n + 1);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [layout, data, contentDim]);

  const getPos = useCallback((id: string) => posRef.current.find((p) => p.id === id), []);

  const connectedSet = selected
    ? new Set(
        data.links
          .filter((l) => l.source === selected.id || l.target === selected.id)
          .flatMap((l) => [l.source, l.target]),
      )
    : null;

  const clientToContent = (clientX: number, clientY: number) => {
    const el = svgRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const vd = viewDimRef.current;
    const pr = panRef.current;
    const z = zoomRef.current;
    const vw = vd.w / z;
    const vh = vd.h / z;
    const sx = ((clientX - rect.left) / rect.width) * vw;
    const sy = ((clientY - rect.top) / rect.height) * vh;
    return { x: pr.x + sx, y: pr.y + sy };
  };

  const onSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current || !svgRef.current) return;
    const pos = posRef.current.find((p) => p.id === dragRef.current!.id);
    if (!pos) return;
    const { x, y } = clientToContent(e.clientX, e.clientY);
    const cd = contentDimRef.current;
    pos.x = Math.max(PADDING, Math.min(cd.w - PADDING, x));
    pos.y = Math.max(PADDING, Math.min(cd.h - PADDING, y));
    pos.vx = 0; pos.vy = 0;
    setTick((n) => n + 1);
  };

  const stopDrag = () => { dragRef.current = null; };

  const onBackdropPointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    panDragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      px: panRef.current.x,
      py: panRef.current.y,
    };
    setPanning(true);
  };

  const onBackdropPointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    const d = panDragRef.current;
    if (!d) return;
    const vd = viewDimRef.current;
    const cd = contentDimRef.current;
    const z = zoomRef.current;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    const vw = vd.w / z;
    const vh = vd.h / z;
    setPan(clampPan({ x: d.px - dx / z, y: d.py - dy / z }, vw, vh, cd.w, cd.h));
  };

  const onBackdropPointerUp = (e: React.PointerEvent<SVGRectElement>) => {
    panDragRef.current = null;
    setPanning(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* 已释放 */
    }
  };

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
    const colW = (contentDim.w - PADDING * 2) / active.length;
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
      <div
        ref={graphRootRef}
        className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm [&:fullscreen]:box-border [&:fullscreen]:h-screen [&:fullscreen]:max-h-[100dvh] [&:fullscreen]:rounded-none [&:fullscreen]:border-0"
      >

        {/* ── 头部工具栏 ── */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-zinc-800">知识图谱</h3>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5">
              <button
                type="button"
                title="缩小"
                aria-label="缩小图谱"
                onClick={() => applyZoom(zoomRef.current / ZOOM_STEP_BUTTON)}
                disabled={zoom <= ZOOM_MIN + 1e-6}
                className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35"
              >
                −
              </button>
              <button
                type="button"
                title={zoom === 1 ? "缩放 100%" : "重置为 100%"}
                onClick={() => {
                  if (Math.abs(zoom - 1) < 1e-6) return;
                  applyZoom(1);
                }}
                className="min-w-[2.75rem] px-1.5 text-center text-[11px] font-medium tabular-nums text-zinc-500 hover:text-zinc-800"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                title="放大"
                aria-label="放大图谱"
                onClick={() => applyZoom(zoomRef.current * ZOOM_STEP_BUTTON)}
                disabled={zoom >= ZOOM_MAX - 1e-6}
                className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35"
              >
                +
              </button>
            </div>
            <button
              type="button"
              title={graphFullscreen ? "退出全屏 (Esc)" : "全屏展示图谱"}
              onClick={() => void toggleGraphFullscreen()}
              className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              {graphFullscreen ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M5 2H2v3M9 2h3v3M2 9v3h3M9 12h3V9"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M3 3h3V2H2v4h1V3zm8 0V2H8v1h3v3h1V3zM3 11H2v4h4v-1H3v-3zm8 0v3H8v1h4v-4h-1z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <span className="hidden sm:inline">{graphFullscreen ? "退出全屏" : "全屏"}</span>
            </button>
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
        <div
          ref={containerRef}
          className={`min-h-0 w-full max-w-full overflow-hidden ${graphFullscreen ? "min-h-[280px] flex-1" : ""}`}
        >
          <svg
            ref={svgRef}
            id={svgId}
            width={viewDim.w}
            height={viewDim.h}
            viewBox={`${pan.x} ${pan.y} ${visibleDim.w} ${visibleDim.h}`}
            data-graph-cw={contentDim.w}
            data-graph-ch={contentDim.h}
            className={`block touch-none select-none overflow-hidden ${panning ? "cursor-grabbing" : "cursor-default"}`}
            onMouseMove={onSvgMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={() => {
              stopDrag();
              panDragRef.current = null;
              setPanning(false);
            }}
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

            <rect
              x={0}
              y={0}
              width={contentDim.w}
              height={contentDim.h}
              fill="#fafafa"
              className={panning ? "cursor-grabbing" : "cursor-grab"}
              onPointerDown={onBackdropPointerDown}
              onPointerMove={onBackdropPointerMove}
              onPointerUp={onBackdropPointerUp}
              onPointerCancel={onBackdropPointerUp}
            />

            {/* 分类网格列头 */}
            {gridHeaders.map(({ type, x, y }) => (
              <g key={type} className="pointer-events-none">
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
              const cx = contentDim.w / 2, cy = contentDim.h / 2;
              const maxR = Math.min(contentDim.w, contentDim.h) * 0.43;
              const rings = new Set(posRef.current.map((p) => {
                const dx = p.x - cx, dy = p.y - cy;
                return Math.round(Math.sqrt(dx * dx + dy * dy) / (maxR / 4));
              }));
              return (
                <g className="pointer-events-none">
                  {[...rings].filter((r) => r > 0).map((r) => (
                    <circle key={r} cx={cx} cy={cy} r={r * (maxR / 4)} fill="none" stroke="#f1f5f9" strokeWidth={1} strokeDasharray="4 4" />
                  ))}
                </g>
              );
            })()}

            {/* 层级树横向分隔线 */}
            {layout === "tree" && (() => {
              const lvSet = new Set(posRef.current.map((p) => Math.round(p.y / 40) * 40));
              return (
                <g className="pointer-events-none">
                  {[...lvSet].map((y) => (
                    <line key={y} x1={PADDING} y1={y} x2={contentDim.w - PADDING} y2={y} stroke="#f1f5f9" strokeWidth={1} strokeDasharray="4 4" />
                  ))}
                </g>
              );
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
                <g key={i} opacity={selected && !isActive ? 0.12 : 1} className="pointer-events-none transition-opacity duration-200">
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
                      <NodeShape shape={c?.shape} r={r + 9} fill={c?.stroke} stroke="none" strokeWidth={0} />
                    </g>
                  )}
                  <NodeShape
                    shape={c?.shape}
                    r={r}
                    fill={c?.fill}
                    stroke={isSelected || isConnected ? c.stroke : "#e2e8f0"}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    filter="url(#shadow)"
                  />
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    fontSize={node.name.length > 4 ? 9 : 11}
                    fontWeight="600"
                    fill={c?.text}
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
        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-zinc-100 px-4 py-3">
          {(Object.keys(COLORS) as NodeType[]).map((type) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <LegendShapeIcon type={type} />
              {COLORS[type].label}
            </span>
          ))}
          <span className="ml-auto text-xs text-zinc-400">
            {LAYOUT_META.find((m) => m.id === layout)?.hint} · 空白处拖动平移 · 滚轮缩放 · 节点可拖拽
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
              {nodeConnections.map(({ node, rel, dir }, ci) => (
                <button
                  key={`${node.id}-${rel}-${dir}-${ci}`}
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
