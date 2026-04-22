export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  is_active: boolean;
  /** A.6 RBAC：是否管理员（控制知识库管理菜单可见性 + skills 接口可调） */
  is_admin?: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LlmProvider {
  id: number;
  name: string;
  base_url: string;
  is_active: boolean;
  created_at: string;
  protocol: string;
  /** auto 模式能力档位：fast / balanced / strong / frontier */
  capability_tier: string;
  /** auto 模式下该供应商被选中时优先用的模型名 */
  preferred_model: string | null;
}

export interface ModelConfig {
  id: number;
  task_type: string;
  provider_id: number;
  model_name: string;
  temperature: number;
  max_tokens: number | null;
  is_active: boolean;
}

export interface GenerationHistory {
  id: number;
  user_id: number;
  user_prompt: string;
  generated_json: string;
  model_used: string | null;
  status: 'generated' | 'adopted' | 'rejected';
  feedback: string | null;
  final_json: string | null;
  created_at: string;
  adopted_at: string | null;
}

export interface AmisTemplate {
  id: number;
  title: string;
  description: string | null;
  amis_json: string;
  category: string | null;
  tags: string[] | null;
  source: string;
  quality_score: number;
  usage_count: number;
  created_at: string;
}
