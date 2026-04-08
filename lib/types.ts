export type NodeType = "concept" | "person" | "event" | "object";

// ─── 解析任务 ─────────────────────────────────────────────────────

export interface ParseJobInfo {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "DONE" | "FAILED" | "CANCELLED";
  progress: number;
  stage: string;
  fileName: string;
  noteId?: string;
  errorMessage?: string;
}

// ─── 认证 ─────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    createdAt: string;
  };
}

export interface AdminUserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface AdminOverview {
  totalUsers: number;
  adminUsers: number;
  totalNotes: number;
  recentUsers: AdminUserRow[];
}

export interface AdminPromptConfig {
  key: string;
  label: string;
  content: string;
  defaultContent: string;
}

// ─── 分享 ─────────────────────────────────────────────────────────

export interface ShareResponse {
  shareCode: string;
  shareUrl: string;
  permission: "view" | "edit";
}

export interface SharedGraphData {
  noteName: string;
  permission: "view" | "edit";
  graph: GraphData;
}

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  description: string;
}

export interface GraphLink {
  source: string;
  target: string;
  relationship: string;
}

/** 与 Java InsightSeriesDto 对齐 */
export interface InsightSeries {
  name: string;
  data: number[];
}

/**
 * AI 根据文档语义生成的单张图表规格（与 Java InsightChartSpecDto 对齐）。
 * chartType：pie | bar | line | radar | scatter | table
 */
export interface InsightChartSpec {
  id: string;
  title: string;
  rationale?: string;
  chartType: string;
  categories?: string[];
  series?: InsightSeries[];
  /** scatter：[[x,y], ...] */
  scatterPoints?: number[][];
  /** table：表头与行数据 */
  tableColumns?: string[];
  tableRows?: string[][];
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  /** 文档语义驱动的多视角图表；旧数据或纯结构统计场景可能为空 */
  insightCharts?: InsightChartSpec[];
}

export interface NoteItem {
  id: string;
  name: string;
  createdAt: string;
  nodeCount: number;
  /** 分类，空字符串表示其他 */
  category?: string;
}

/** 与 Java NoteListResponse 对齐 */
export interface NoteListResponse {
  items: NoteItem[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  allNotesCount: number;
  totalNodeCount: number;
  notesThisMonth: number;
}
