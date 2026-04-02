export type NodeType = "concept" | "person" | "event" | "object";

// ─── 解析任务 ─────────────────────────────────────────────────────

export interface ParseJobInfo {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
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
    createdAt: string;
  };
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

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface NoteItem {
  id: string;
  name: string;
  createdAt: string;
  nodeCount: number;
}
