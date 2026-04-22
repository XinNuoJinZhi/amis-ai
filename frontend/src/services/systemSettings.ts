// B.7：系统配置 key/value API 客户端

import api from './api';

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export async function listSystemSettings(): Promise<SystemSetting[]> {
  const { data } = await api.get('/system-settings');
  return data;
}

export async function getSystemSetting(key: string): Promise<SystemSetting | null> {
  try {
    const { data } = await api.get(`/system-settings/${encodeURIComponent(key)}`);
    return data;
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } }).response?.status;
    if (status === 404) return null;
    throw e;
  }
}

export async function upsertSystemSetting(
  key: string,
  payload: { value: string; description?: string | null }
): Promise<SystemSetting> {
  const { data } = await api.put(`/system-settings/${encodeURIComponent(key)}`, payload);
  return data;
}

/** Embedding 维度兼容性探测：列维度 vs env 期望 vs 模型实际输出 */
export interface EmbeddingInfo {
  pg_column_dim: number | null;
  env_dim: number | null;
  actual_model_dim: number | null;
  probe_ok: boolean;
  probe_error: string | null;
  compatible: boolean;
  warnings: { pg_actual_mismatch: boolean; env_pg_mismatch: boolean };
  hint: string;
}

export async function getEmbeddingInfo(): Promise<EmbeddingInfo> {
  const { data } = await api.get('/system/embedding-info');
  return data;
}
