"use client";

import { useId, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** 拉高坐标系，使谷底落在接近区块底部（与主按钮行下方对齐） */
const VB = { w: 920, h: 412 };

const LAYOUT = {
  doc: { x: 24, y: 18, w: 56, h: 64 },
  /** V 谷底：viewBox 底部偏上，映射到整段 Hero 高度时落在按钮下方 */
  ai: { x: VB.w / 2 - 28, y: 322, w: 56, h: 72 },
  chart: { x: VB.w - 24 - 72, y: 18, w: 72, h: 56 },
} as const;

function ports() {
  const d = LAYOUT.doc;
  const a = LAYOUT.ai;
  const c = LAYOUT.chart;
  return {
    docOut: { x: d.x + d.w / 2, y: d.y + d.h },
    aiTop: { x: a.x + a.w / 2, y: a.y },
    chartIn: { x: c.x + c.w / 2, y: c.y + c.h },
  };
}

function buildPaths() {
  const { docOut, aiTop, chartIn } = ports();
  const pathDocToAi = `M ${docOut.x} ${docOut.y} C ${docOut.x + 215} ${docOut.y + 210}, ${aiTop.x - 152} ${aiTop.y - 28}, ${aiTop.x} ${aiTop.y}`;
  const pathAiToViz = `M ${aiTop.x} ${aiTop.y} C ${aiTop.x + 168} ${aiTop.y - 155}, ${chartIn.x - 158} ${chartIn.y - 24}, ${chartIn.x} ${chartIn.y}`;
  return { pathDocToAi, pathAiToViz };
}

function NodeGraphics({
  gid,
  reduce,
}: {
  gid: string;
  reduce: boolean | null;
}) {
  const d = LAYOUT.doc;
  const a = LAYOUT.ai;
  const c = LAYOUT.chart;

  return (
    <>
      <g transform={`translate(${d.x}, ${d.y})`}>
        <motion.rect
          width={d.w}
          height={d.h}
          rx="10"
          stroke="#6366f1"
          strokeWidth="1.75"
          fill="rgba(255, 255, 255, 0.72)"
          animate={
            reduce
              ? {}
              : {
                  strokeOpacity: [0.65, 1, 0.65],
                }
          }
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <path
          d="M18 28h24M18 38h20M18 48h16"
          stroke="#4f46e5"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.62"
        />
        <rect x="34" y="16" width="14" height="10" rx="2" fill="#818cf8" opacity="0.38" />
      </g>

      <g transform={`translate(${a.x}, ${a.y})`}>
        <motion.rect
          x="0"
          y="0"
          width={a.w}
          height={a.h}
          rx="12"
          stroke={`url(#${gid}-wire)`}
          strokeWidth="2.25"
          fill="rgba(255, 255, 255, 0.78)"
          animate={
            reduce
              ? {}
              : {
                  strokeOpacity: [0.6, 1, 0.6],
                }
          }
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <path
          d="M14 24h28M14 36h28M14 48h20"
          stroke="#7c3aed"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.42"
        />
        <circle cx="28" cy="58" r="6" fill="#4f46e5" opacity="0.75" />
        <circle cx="28" cy="58" r="2.5" fill="#e0e7ff" opacity="0.95" />
        {!reduce && (
          <motion.circle
            cx="28"
            cy="58"
            r={10}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="1.35"
            animate={{
              r: [10, 18, 10],
              opacity: [0.3, 0.65, 0.3],
            }}
            transition={{ duration: 2.15, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </g>

      <g transform={`translate(${c.x}, ${c.y})`}>
        <rect
          width={c.w}
          height={c.h}
          rx="10"
          stroke="#06b6d4"
          strokeWidth="1.75"
          fill="rgba(255, 255, 255, 0.72)"
        />
        <rect x="14" y="32" width="10" height="16" rx="2" fill="#6366f1" opacity="0.72" />
        <rect x="30" y="22" width="10" height="26" rx="2" fill="#8b5cf6" opacity="0.78" />
        <rect x="46" y="28" width="10" height="20" rx="2" fill="#22d3ee" opacity="0.78" />
        <line x1="10" y1="50" x2="62" y2="50" stroke="#94a3b8" strokeWidth="1" opacity="0.55" />
        {!reduce && (
          <motion.g
            animate={{ opacity: [0.55, 0.92, 0.55] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="19" cy="18" r="3" fill="#4f46e5" opacity="0.85" />
            <circle cx="36" cy="12" r="3" fill="#7c3aed" opacity="0.85" />
            <circle cx="52" cy="15" r="3" fill="#0891b2" opacity="0.85" />
            <path
              d="M19 18C26 24 30 24 36 12M36 12C42 18 46 16 52 15"
              stroke="#64748b"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
          </motion.g>
        )}
      </g>
    </>
  );
}

/**
 * Hero Banner：加宽 V 形布局，流线端口对接实体边沿；SVG 内后绘制的节点盖住导线。
 * z-[2] 高于光晕球，仍低于正文 z-10。
 */
export function HeroDataFlowBackdrop() {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const gid = `daf-${uid}`;

  const { pathDocToAi, pathAiToViz } = useMemo(() => buildPaths(), []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] flex min-h-0 justify-center overflow-visible [mask-image:linear-gradient(to_bottom,black_14%,rgba(0,0,0,0.5)_36%,rgba(0,0,0,0.52)_72%,rgba(0,0,0,0.35)_88%,transparent_100%)]"
      aria-hidden
    >
      <div className="h-full w-full max-w-[1100px] px-2 opacity-[0.88] sm:px-4 sm:opacity-[0.92] lg:opacity-[0.95]">
        <svg
          className="h-full w-full overflow-visible drop-shadow-[0_1px_14px_rgba(99,102,241,0.1)]"
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          fill="none"
          preserveAspectRatio="xMidYMin meet"
        >
          <defs>
            <linearGradient id={`${gid}-wire`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.88" />
              <stop offset="45%" stopColor="#a78bfa" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.92" />
            </linearGradient>
            <linearGradient id={`${gid}-dim`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.55" />
            </linearGradient>
            <filter
              id={`${gid}-glow`}
              x="-45%"
              y="-45%"
              width="190%"
              height="190%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={`${gid}-pkt`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.2" result="g" />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 底层：虚线参考 + 流光（中段略透，减少与标题叠读干扰） */}
          <g opacity="0.92">
            <path
              d={pathDocToAi}
              stroke={`url(#${gid}-dim)`}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="4 8"
            />
            <path
              d={pathAiToViz}
              stroke={`url(#${gid}-dim)`}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="4 8"
            />
            {!reduce && (
              <>
                <path
                  className="home-flow-stream-a"
                  d={pathDocToAi}
                  stroke={`url(#${gid}-wire)`}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter={`url(#${gid}-glow)`}
                  opacity="0.72"
                />
                <path
                  className="home-flow-stream-b"
                  d={pathAiToViz}
                  stroke={`url(#${gid}-wire)`}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter={`url(#${gid}-glow)`}
                  opacity="0.72"
                />
              </>
            )}
            {reduce && (
              <>
                <path
                  d={pathDocToAi}
                  stroke={`url(#${gid}-wire)`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeOpacity="0.4"
                />
                <path
                  d={pathAiToViz}
                  stroke={`url(#${gid}-wire)`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeOpacity="0.4"
                />
              </>
            )}
          </g>

          {!reduce && (
            <g opacity="0.88">
              <circle r="2.8" fill="#e0e7ff" filter={`url(#${gid}-pkt)`}>
                <animateMotion dur="2.5s" repeatCount="indefinite" path={pathDocToAi} rotate="auto" />
              </circle>
              <circle r="2.2" fill="#22d3ee" opacity="0.9" filter={`url(#${gid}-pkt)`}>
                <animateMotion
                  dur="2.5s"
                  repeatCount="indefinite"
                  begin="0.82s"
                  path={pathDocToAi}
                  rotate="auto"
                />
              </circle>
              <circle r="2.8" fill="#c4b5fd" filter={`url(#${gid}-pkt)`}>
                <animateMotion dur="2.65s" repeatCount="indefinite" path={pathAiToViz} rotate="auto" />
              </circle>
              <circle r="2" fill="#67e8f9" opacity="0.85" filter={`url(#${gid}-pkt)`}>
                <animateMotion
                  dur="2.65s"
                  repeatCount="indefinite"
                  begin="0.88s"
                  path={pathAiToViz}
                  rotate="auto"
                />
              </circle>
            </g>
          )}

          {/* 顶层：实体盖住经过的流线端，端口与 path 终点一致 */}
          <NodeGraphics gid={gid} reduce={reduce} />
        </svg>
      </div>
    </div>
  );
}
