import api from './api';

// ── 维度注册表类型（与 backend/src/handlers/registry.rs 保持一致）

export interface RegistryUiLib {
  id: string;
  name: string;
}

export interface RegistryStack {
  id: string;
  name: string;
  ui_libs: RegistryUiLib[];
}

export interface RegistryPlatform {
  id: string;
  name: string;
  stacks: RegistryStack[];
}

export interface RegistryTemplate {
  name: string;
  platform: string;
  tech_stacks: string[];
  ui_libs: string[];
  has_scaffold: boolean;
  dev_command: string | null;
  default_skill_buckets: string[];
}

export interface RegistrySkillBucket {
  dir_name: string;
  display_name: string;
  description: string | null;
  kind: string | null;
  platforms: string[];
  tech_stacks: string[];
  ui_libs: string[];
  requires: string[];
  conflicts: string[];
  priority: number;
}

export interface ResolveSkillsPayload {
  platform?: string | null;
  tech_stacks?: string[];
  ui_libs?: string[];
  template_name?: string | null;
  explicit_buckets?: string[];
  legacy_stack?: string | null;
}

export interface ResolveSkillsResponse {
  selected: string[];
  sections: number;
  warnings: string[];
}

// ── API 调用

export async function listPlatforms(): Promise<RegistryPlatform[]> {
  const { data } = await api.get('/registry/platforms');
  return data;
}

export async function listTemplates(): Promise<RegistryTemplate[]> {
  const { data } = await api.get('/registry/templates');
  return data;
}

export async function listSkillBuckets(): Promise<RegistrySkillBucket[]> {
  const { data } = await api.get('/registry/skills');
  return data;
}

export async function resolveSkills(payload: ResolveSkillsPayload): Promise<ResolveSkillsResponse> {
  const { data } = await api.post('/registry/resolve-skills', payload);
  return data;
}
