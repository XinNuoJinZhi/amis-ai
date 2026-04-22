import api from './api';

// ───────────────────────── 类型

export interface FsNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  mtime?: number;
  children?: FsNode[];
}

export interface FsTreeResponse {
  root: string;
  depth: number;
  nodes: FsNode[];
}

export interface FsFileResponse {
  path: string;
  size: number;
  mtime: number;
  lang: string;
  truncated: boolean;
  content: string;
}

export interface FsWriteResponse {
  ok: boolean;
  path: string;
  size: number;
  mtime: number;
}

export interface FsWriteConflict {
  error: string;
  server_mtime?: number;
  client_base_mtime?: number;
}

// ───────────────────────── REST

export async function getFsTree(taskId: number, depth = 6): Promise<FsTreeResponse> {
  const { data } = await api.get(`/projects/tasks/${taskId}/ide/fs/tree`, {
    params: { depth },
  });
  return data;
}

export async function readFile(taskId: number, path: string): Promise<FsFileResponse> {
  const { data } = await api.get(`/projects/tasks/${taskId}/ide/fs/file`, {
    params: { path },
  });
  return data;
}

export async function writeFile(
  taskId: number,
  path: string,
  content: string,
  baseMtime?: number,
): Promise<FsWriteResponse> {
  const { data } = await api.put(`/projects/tasks/${taskId}/ide/fs/file`, {
    path,
    content,
    base_mtime: baseMtime ?? 0,
  });
  return data;
}

export async function deleteFsPath(taskId: number, path: string): Promise<{ ok: boolean; path: string }> {
  const { data } = await api.delete(`/projects/tasks/${taskId}/ide/fs/file`, {
    params: { path },
  });
  return data;
}

export async function mkdir(taskId: number, path: string): Promise<{ ok: boolean; path: string }> {
  const { data } = await api.post(`/projects/tasks/${taskId}/ide/fs/mkdir`, { path });
  return data;
}

// ───────────────────────── WebSocket URL

export function buildTerminalWsUrl(taskId: number, cols = 120, rows = 30): string {
  const token = localStorage.getItem('token') || '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const base = `${protocol}//${window.location.host}/api/projects/tasks/${taskId}/ide/terminal`;
  const params = new URLSearchParams({
    cols: String(cols),
    rows: String(rows),
  });
  if (token) params.set('token', token);
  return `${base}?${params.toString()}`;
}
