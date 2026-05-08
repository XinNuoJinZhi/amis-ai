import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input, message, Radio, Select, Space } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { createMultipageTask, type PageInput } from '../../services/multipage';

const { TextArea } = Input;

type ExecMode = 'unified' | 'isolated';
type ReuseStrategy = 'r1_skeleton' | 'r2_prompt' | 'r3_refactor' | 'r4_none';

export default function CreateMultipageTask() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [techStack, setTechStack] = useState('uniapp-wot-h5');
  const [execMode, setExecMode] = useState<ExecMode>('isolated');
  const [reuseStrategy, setReuseStrategy] = useState<ReuseStrategy>(
    'r1_skeleton'
  );
  const [pages, setPages] = useState<PageInput[]>([{ amis_json: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const updatePage = (idx: number, patch: Partial<PageInput>) => {
    setPages(pages.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const addPage = () => setPages([...pages, { amis_json: '' }]);

  const removePage = (idx: number) =>
    setPages(pages.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!title.trim()) return message.warning('标题必填');
    if (pages.length === 0) return message.warning('至少 1 页');
    if (pages.some((p) => !p.amis_json.trim()))
      return message.warning('每页 amis JSON 必填');

    setSubmitting(true);
    try {
      const r = await createMultipageTask({
        title: title.trim(),
        tech_stack: techStack,
        pages,
        execution_strategy: execMode,
        reuse_strategy: execMode === 'isolated' ? reuseStrategy : undefined,
      });
      message.success(`任务创建成功（id=${r.task_id}）`);
      navigate(`/projects/${r.task_id}`);
    } catch (e: unknown) {
      const resp = (e as { response?: { data?: { error?: string } } }).response;
      message.error(`创建失败：${resp?.data?.error ?? String(e)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="新建多页面反向飞轮任务" style={{ margin: 24 }}>
      <Form layout="vertical">
        <Form.Item label="任务标题" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="如：电商后台管理系统"
          />
        </Form.Item>

        <Form.Item label="技术栈">
          <Select
            value={techStack}
            onChange={setTechStack}
            options={[{ value: 'uniapp-wot-h5', label: 'UniApp + Wot UI H5' }]}
          />
        </Form.Item>

        <Form.Item label="执行模式">
          <Radio.Group
            value={execMode}
            onChange={(e) => setExecMode(e.target.value as ExecMode)}
            buttonStyle="solid"
          >
            <Radio.Button value="isolated">
              独立（多 session 并发）
            </Radio.Button>
            <Radio.Button value="unified">统筹（单 session）</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {execMode === 'isolated' && (
          <Form.Item label="复用策略">
            <Radio.Group
              value={reuseStrategy}
              onChange={(e) => setReuseStrategy(e.target.value as ReuseStrategy)}
            >
              <Radio value="r1_skeleton">R1 骨架先行（推荐）</Radio>
              <Radio value="r2_prompt">R2 prompt 注入</Radio>
              <Radio value="r3_refactor">R3 后处理重构</Radio>
              <Radio value="r4_none">R4 不复用（baseline）</Radio>
            </Radio.Group>
          </Form.Item>
        )}

        <Form.Item label={`页面（共 ${pages.length} 页）`}>
          {pages.map((p, idx) => (
            <Card
              key={idx}
              size="small"
              style={{ marginBottom: 8 }}
              title={`页面 #${idx + 1}`}
              extra={
                pages.length > 1 ? (
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => removePage(idx)}
                  />
                ) : null
              }
            >
              <Form.Item label="路由路径（留空 LLM 推断）">
                <Input
                  placeholder="如 /users/list"
                  value={p.route_path ?? ''}
                  onChange={(e) =>
                    updatePage(idx, { route_path: e.target.value })
                  }
                />
              </Form.Item>

              <Form.Item label="amis JSON" required>
                <TextArea
                  rows={6}
                  placeholder='{"type":"page",...}'
                  value={p.amis_json}
                  onChange={(e) =>
                    updatePage(idx, { amis_json: e.target.value })
                  }
                />
              </Form.Item>
            </Card>
          ))}

          <Button icon={<PlusOutlined />} onClick={addPage}>
            添加一页
          </Button>
        </Form.Item>

        <Space>
          <Button type="primary" loading={submitting} onClick={submit}>
            创建任务
          </Button>
          <Button onClick={() => navigate(-1)}>取消</Button>
        </Space>
      </Form>
    </Card>
  );
}
