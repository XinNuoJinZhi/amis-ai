// A.7：Skills 知识库管理 API 客户端
// 后端路由见 backend/src/handlers/skills_admin.rs

import api from './api';

export interface SkillBucketSummary {
  dir_name: string;
  display_name: string;
  description: string | null;
  has_skill_md: boolean;
  file_count: number;
}

export interface SkillsListResponse {
  skills_root: string;
  buckets: SkillBucketSummary[];
  notice: string;
}

export interface SkillTreeFile {
  name: string;
  type: 'file';
  path: string;
  size: number | null;
  mtime_unix: number | null;
}

export interface SkillTreeDir {
  name: string;
  type: 'dir';
  path: string;
  children: SkillTreeNode[];
}

export type SkillTreeNode = SkillTreeFile | SkillTreeDir;

export interface SkillTreeResponse {
  bucket: string;
  tree: SkillTreeNode[];
}

export interface SkillFileResponse {
  bucket: string;
  path: string;
  content: string;
  size: number;
  mtime_unix: number | null;
  truncated: boolean;
}

export interface SkillWritePayload {
  path: string;
  content: string;
  base_mtime_unix?: number | null;
}

export interface SkillWriteResponse {
  ok: boolean;
  bucket: string;
  path: string;
  mtime_unix: number | null;
  notice: string;
}

export async function listSkillBuckets(): Promise<SkillsListResponse> {
  const { data } = await api.get('/skills');
  return data;
}

export async function getSkillTree(bucket: string): Promise<SkillTreeResponse> {
  const { data } = await api.get(`/skills/${encodeURIComponent(bucket)}/tree`);
  return data;
}

export async function readSkillFile(bucket: string, path: string): Promise<SkillFileResponse> {
  const { data } = await api.get(`/skills/${encodeURIComponent(bucket)}/file`, {
    params: { path },
  });
  return data;
}

export async function writeSkillFile(
  bucket: string,
  payload: SkillWritePayload
): Promise<SkillWriteResponse> {
  const { data } = await api.put(`/skills/${encodeURIComponent(bucket)}/file`, payload);
  return data;
}

// ───── 文件树 CRUD（A.6 round 2） ─────

export async function mkdirInBucket(bucket: string, path: string): Promise<void> {
  await api.post(`/skills/${encodeURIComponent(bucket)}/mkdir`, { path });
}

export async function deletePathInBucket(bucket: string, path: string): Promise<void> {
  await api.delete(`/skills/${encodeURIComponent(bucket)}/file`, { params: { path } });
}

export async function renamePathInBucket(
  bucket: string,
  oldPath: string,
  newPath: string
): Promise<void> {
  await api.post(`/skills/${encodeURIComponent(bucket)}/rename`, {
    old_path: oldPath,
    new_path: newPath,
  });
}

export interface CreateBucketPayload {
  dir_name: string;
  display_name?: string;
  description: string;
  initial_skill_md_body?: string;
}

export async function createBucket(payload: CreateBucketPayload): Promise<{
  ok: boolean;
  bucket: string;
  display_name: string;
  description: string;
  notice: string;
}> {
  const { data } = await api.post('/skills', payload);
  return data;
}
