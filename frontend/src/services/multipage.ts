// 多页面任务 API 客户端
//
// 复用 /api/projects/tasks 端点，body 加 pages 字段即触发 backend 多页路径

import api from './api';

export interface PageInput {
  amis_json: string;
  route_path?: string;
}

export interface CreateMultipageTaskRequest {
  title: string;
  tech_stack: string;
  pages: PageInput[];
  execution_strategy: 'unified' | 'isolated';
  reuse_strategy?: 'r1_skeleton' | 'r2_prompt' | 'r3_refactor' | 'r4_none';
}

export interface CreateTaskResponse {
  task_id: number;
}

export async function createMultipageTask(
  req: CreateMultipageTaskRequest
): Promise<CreateTaskResponse> {
  const resp = await api.post<CreateTaskResponse>('/projects/tasks', {
    title: req.title,
    amis_json: '{}', // 兼容旧字段
    tech_stack: req.tech_stack,
    pages: req.pages,
    execution_strategy: req.execution_strategy,
    reuse_strategy: req.reuse_strategy,
  });
  return resp.data;
}
