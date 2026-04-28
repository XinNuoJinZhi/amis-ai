// Skills 桶卡片列表页（/knowledge-base/skills）
//
// 设计：
//   - 顶部：标题 + 描述 + skills_root 路径
//   - 卡片网格：每个桶一张卡，最末尾一张"新建桶"卡
//   - 卡片点击进入 /knowledge-base/skills/:bucket（详情编辑页）
//
// 风格保持 v0.dev 暗色 minimal：边框替阴影、mono 字体、hover 微微提升
//
// RBAC 兜底：调用 listSkillBuckets 时若 403 显示 Result，普通用户即使绕路由进来也看不到桶

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Empty, Input, Modal, Result, Space, Spin, message } from 'antd';
import { FileTextOutlined, PlusOutlined, ReloadOutlined, RobotOutlined } from '@ant-design/icons';
import {
  createBucket,
  listSkillBuckets,
  type SkillBucketSummary,
} from '../../services/skills';
import { useColors } from '../../theme';

// 给每个桶生成稳定的"色调"标签，让卡片看起来不那么一片灰
function hueForBucket(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export default function SkillsHome() {
  const c = useColors();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [buckets, setBuckets] = useState<SkillBucketSummary[]>([]);
  const [skillsRoot, setSkillsRoot] = useState('');
  const [notice, setNotice] = useState('');
  const [forbidden, setForbidden] = useState<string | null>(null);

  const [newBucketOpen, setNewBucketOpen] = useState(false);
  const [newBucketDir, setNewBucketDir] = useState('');
  const [newBucketDisplay, setNewBucketDisplay] = useState('');
  const [newBucketDesc, setNewBucketDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setForbidden(null);
    try {
      const resp = await listSkillBuckets();
      setBuckets(resp.buckets);
      setSkillsRoot(resp.skills_root);
      setNotice(resp.notice);
    } catch (e: unknown) {
      const resp = (e as { response?: { status?: number; data?: { error?: string } } }).response;
      if (resp?.status === 403) setForbidden(resp.data?.error ?? '无权访问');
      else message.error(`加载失败：${resp?.data?.error ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitNewBucket = useCallback(async () => {
    const dir = newBucketDir.trim();
    if (!dir) return message.warning('目录名不能为空');
    if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(dir))
      return message.warning('目录名只允许字母数字 _ - ，必须字母或下划线开头');
    if (!newBucketDesc.trim()) return message.warning('description 必填');
    setSubmitting(true);
    try {
      const resp = await createBucket({
        dir_name: dir,
        display_name: newBucketDisplay.trim() || undefined,
        description: newBucketDesc.trim(),
      });
      message.success(`已创建桶 ${resp.bucket}`);
      setNewBucketOpen(false);
      setNewBucketDir('');
      setNewBucketDisplay('');
      setNewBucketDesc('');
      await refresh();
      // 跳进新桶
      navigate(`/knowledge-base/skills/${encodeURIComponent(resp.bucket)}`);
    } catch (e: unknown) {
      const resp = (e as { response?: { status?: number; data?: { error?: string } } }).response;
      if (resp?.status === 409) message.error('该桶已存在');
      else message.error(`创建失败：${resp?.data?.error ?? String(e)}`);
    } finally {
      setSubmitting(false);
    }
  }, [navigate, newBucketDesc, newBucketDir, newBucketDisplay, refresh]);

  const sortedBuckets = useMemo(() => {
    // _common 排首位（必读），其他按 dir_name 排
    const list = [...buckets];
    list.sort((a, b) => {
      if (a.dir_name === '_common') return -1;
      if (b.dir_name === '_common') return 1;
      return a.dir_name.localeCompare(b.dir_name);
    });
    return list;
  }, [buckets]);

  if (forbidden) {
    return (
      <Result status="403" title="无权访问" subTitle={forbidden} />
    );
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 48px)',
        padding: '32px 32px 48px',
        background: c.bg,
      }}
    >
      {/* 标题区 */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 16,
            marginBottom: 6,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: c.text,
              margin: 0,
              letterSpacing: -0.2,
            }}
          >
            Skills 规则手册
          </h2>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: c.textSubtle,
            }}
          >
            {sortedBuckets.length} 个桶
          </span>
        </div>
        <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 12 }}>
          {notice ||
            '编辑桶里的 SKILL.md / references/* 后，对下一个新任务生效；正在跑的任务不会感知。'}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: c.textSubtle,
            marginBottom: 16,
          }}
        >
          skills_root = {skillsRoot || '(loading)'}
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setNewBucketOpen(true)}
          >
            新建桶
          </Button>
          <Button
            icon={<RobotOutlined />}
            onClick={() => navigate('/knowledge-base/skills/new-ai')}
            style={{ borderColor: c.accent, color: c.accent }}
          >
            AI 起草新桶
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 卡片网格 */}
      {loading ? (
        <Spin />
      ) : sortedBuckets.length === 0 ? (
        <Empty description="还没有桶，新建一个开始吧" />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {sortedBuckets.map((b) => (
            <BucketCard key={b.dir_name} bucket={b} c={c} navigate={navigate} />
          ))}
          <NewBucketCard c={c} onClick={() => setNewBucketOpen(true)} />
        </div>
      )}

      {/* 新建桶弹窗 */}
      <Modal
        title="新建 Skill 桶"
        open={newBucketOpen}
        onOk={() => void submitNewBucket()}
        onCancel={() => setNewBucketOpen(false)}
        okText="创建"
        cancelText="取消"
        confirmLoading={submitting}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>
              dir_name（目录名 → skills/&lt;dir&gt;/）
            </div>
            <Input
              value={newBucketDir}
              onChange={(e) => setNewBucketDir(e.target.value)}
              placeholder="例如 react-element-web"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>
              display_name（SKILL.md 的 name；不填则同 dir_name）
            </div>
            <Input
              value={newBucketDisplay}
              onChange={(e) => setNewBucketDisplay(e.target.value)}
              placeholder="例如 React + Element Plus（Web）"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>
              description（必填，给 LLM 看的简介）
            </div>
            <Input.TextArea
              value={newBucketDesc}
              onChange={(e) => setNewBucketDesc(e.target.value)}
              placeholder="例如：把 Amis JSON 翻译成 React 18 + Element Plus 组件代码"
              rows={3}
            />
          </div>
          <Alert
            type="info"
            showIcon
            style={{ fontSize: 12 }}
            message="将自动创建：SKILL.md（含 frontmatter + 模板正文）+ references/ + assets/"
          />
        </Space>
      </Modal>
    </div>
  );
}

function BucketCard({
  bucket,
  c,
  navigate,
}: {
  bucket: SkillBucketSummary;
  c: ReturnType<typeof useColors>;
  navigate: (path: string) => void;
}) {
  const hue = hueForBucket(bucket.dir_name);
  const accent = `hsl(${hue}, 60%, 55%)`;

  return (
    <button
      onClick={() => navigate(`/knowledge-base/skills/${encodeURIComponent(bucket.dir_name)}`)}
      style={{
        textAlign: 'left',
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 140ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 160,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = c.text;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = c.border;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* 顶部：图标 + 状态 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: accent,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}
        >
          <FileTextOutlined />
        </div>
        {!bucket.has_skill_md && (
          <span
            style={{
              fontSize: 10,
              color: '#d97706',
              border: '1px solid #d97706',
              padding: '1px 6px',
              borderRadius: 3,
              fontFamily: 'var(--font-mono)',
            }}
          >
            缺 SKILL.md
          </span>
        )}
      </div>
      {/* 标题 */}
      <div style={{ fontSize: 15, fontWeight: 600, color: c.text, lineHeight: 1.3 }}>
        {bucket.display_name}
      </div>
      <div
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: c.textSubtle,
        }}
      >
        {bucket.dir_name}
      </div>
      {/* 描述（最多 3 行） */}
      <div
        style={{
          fontSize: 12,
          color: c.textMuted,
          lineHeight: 1.5,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}
      >
        {bucket.description || <span style={{ fontStyle: 'italic' }}>(尚无 description)</span>}
      </div>
      {/* 底部：文件数 */}
      <div
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: c.textSubtle,
          marginTop: 4,
        }}
      >
        {bucket.file_count} 文件
      </div>
    </button>
  );
}

function NewBucketCard({
  c,
  onClick,
}: {
  c: ReturnType<typeof useColors>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: `1px dashed ${c.border}`,
        borderRadius: 8,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 140ms ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 160,
        color: c.textMuted,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = c.text;
        e.currentTarget.style.color = c.text;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = c.border;
        e.currentTarget.style.color = c.textMuted;
      }}
    >
      <PlusOutlined style={{ fontSize: 22 }} />
      <span style={{ fontSize: 13, fontWeight: 500 }}>新建桶</span>
      <span style={{ fontSize: 11, color: c.textSubtle, textAlign: 'center' }}>
        含 SKILL.md 模板 + references/ + assets/
      </span>
    </button>
  );
}
