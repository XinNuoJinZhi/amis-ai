import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Collapse, Drawer, Empty, Tag, Tooltip, message, Alert, Spin } from 'antd';
import {
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useColors } from '../../../../theme';
import type { TaskEvent } from '../hooks/useProjectEvents';
import {
  analyzeProjectTask,
  downloadTaskTracelog,
  getTaskTracelogInfo,
  listTaskTracelogFiles,
  readTaskTracelogFile,
  type AnalyzeTaskResult,
  type TaskTracelogInfo,
} from '../../../../services/projects';

/**
 * 执行详情面板：展示本次任务的 LLM 决策、Skills 选桶、RAG 样例、完整 system prompt。
 * 事件来源：
 *   - llm_selected (backend 在 create_task 里发)
 *   - skills_loaded (claw-agent 在 task_loop 里发)
 *   - rag_samples_injected (backend 在 fetch_rag_extra_sections 里发)
 *   - system_prompt_built (claw-agent 在 task_loop 里发，含完整 prompt)
 */
export function ExecutionDetailsPanel({
  taskId,
  events,
  onRefresh,
}: {
  taskId: number;
  events: TaskEvent[];
  /** 外部传入的刷新回调：重新拉 REST 历史，补齐 backend 异步 insert 的事件（典型：llm_selected） */
  onRefresh?: () => Promise<void> | void;
}) {
  const c = useColors();
  const [fullPromptOpen, setFullPromptOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
      message.success('执行详情已刷新');
    } catch (e: any) {
      message.error(`刷新失败：${e?.message ?? e}`);
    } finally {
      setRefreshing(false);
    }
  };

  // 阶段 4：AI 分析建议
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeTaskResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [rawOpen, setRawOpen] = useState(false);

  // 2026-04-25 任务追踪日志归档信息 + Phase E 在线浏览 Drawer
  const [tracelog, setTracelog] = useState<TaskTracelogInfo | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void getTaskTracelogInfo(taskId)
      .then((info) => {
        if (!cancelled) setTracelog(info);
      })
      .catch(() => {
        /* 静默：tracelog 接口失败不影响主面板 */
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);
  const handleAnalyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await analyzeProjectTask(taskId);
      setAnalysis(result);
      message.success(`分析完成（${result.overall_quality}）`);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? String(e);
      setAnalyzeError(msg);
      message.error(`分析失败：${msg}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // 从事件流里挑出"一次性"的执行详情事件（取第一次出现的，后续任务重启时也稳定）
  const details = useMemo(() => {
    const pick = (type: string) => events.find((e) => e.type === type);
    return {
      // 2026-04-25 amis-translator：优先级最高（决定了下面 LLM/Skills 是否真生效）
      translatorOk: pick('translation_succeeded'),
      translatorMiss: pick('translation_unsupported'),
      llm: pick('llm_selected'),
      skills: pick('skills_loaded'),
      rag: pick('rag_samples_injected'),
      prompt: pick('system_prompt_built'),
    };
  }, [events]);

  const hasAny =
    details.translatorOk ||
    details.translatorMiss ||
    details.llm ||
    details.skills ||
    details.rag ||
    details.prompt;

  if (!hasAny) {
    return (
      <div
        style={{
          padding: 24,
          color: c.textMuted,
          fontSize: 13,
          textAlign: 'center',
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: c.textMuted }}>
              还没收到执行详情事件。任务刚启动后 llm_selected / skills_loaded /
              rag_samples_injected / system_prompt_built 会陆续到达。
            </span>
          }
        >
          {onRefresh && (
            <Button
              size="small"
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              loading={refreshing}
            >
              刷新一次
            </Button>
          )}
        </Empty>
      </div>
    );
  }

  const llmData = (details.llm?.data ?? details.llm) as any;
  const skillsData = (details.skills?.data ?? details.skills) as any;
  const ragData = (details.rag?.data ?? details.rag) as any;
  const promptData = (details.prompt?.data ?? details.prompt) as any;
  const translatorOkData = (details.translatorOk?.data ?? details.translatorOk) as any;
  const translatorMissData = (details.translatorMiss?.data ?? details.translatorMiss) as any;

  const copy = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => message.success(`${label} 已复制`))
      .catch(() => message.error('复制失败'));
  };

  const items = [
    {
      // 2026-04-25 amis-translator：放在 LLM 之上，决定下面 LLM/Skills/RAG 是否真生效
      key: 'translator',
      label: (
        <span>
          🪄 <strong>翻译器（确定性）</strong>{' '}
          {translatorOkData ? (
            <Tag color="success" style={{ marginLeft: 8 }}>
              已直翻 · {Array.isArray(translatorOkData.files) ? translatorOkData.files.length : 0} 文件
            </Tag>
          ) : translatorMissData ? (
            <Tag color="warning" style={{ marginLeft: 8 }}>
              已降级到 LLM
            </Tag>
          ) : (
            <Tag color="default">未尝试</Tag>
          )}
        </span>
      ),
      children: translatorOkData ? (
        <div>
          <div style={{ fontSize: 13, color: c.text, marginBottom: 8 }}>
            ✅ 翻译器完整覆盖了本次任务，**未调用 LLM**。生成的文件：
          </div>
          <ul style={{ margin: '6px 0 12px', paddingLeft: 20 }}>
            {(translatorOkData.files || []).map((f: string) => (
              <li key={f} style={{ fontSize: 13, color: c.text, lineHeight: '22px' }}>
                <code style={{ background: c.surface, padding: '1px 6px', borderRadius: 3 }}>{f}</code>
              </li>
            ))}
          </ul>
          {Array.isArray(translatorOkData.notes) && translatorOkData.notes.length > 0 && (
            <div style={{ fontSize: 12, color: c.textMuted }}>
              <div style={{ marginBottom: 4 }}>翻译器备注：</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {translatorOkData.notes.map((n: string, i: number) => (
                  <li key={i} style={{ lineHeight: '20px' }}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : translatorMissData ? (
        <div>
          <div style={{ fontSize: 13, color: c.text, marginBottom: 8 }}>
            ⚠️ 翻译器无法完整覆盖，已降级走 LLM 兜底。不支持的 Amis type：
          </div>
          <ul style={{ margin: '6px 0 12px', paddingLeft: 20 }}>
            {(translatorMissData.unsupported_types || []).map((t: string, i: number) => (
              <li key={i} style={{ fontSize: 13, color: c.text, lineHeight: '22px' }}>
                <code style={{ background: c.surface, padding: '1px 6px', borderRadius: 3 }}>{t}</code>
              </li>
            ))}
          </ul>
          {Array.isArray(translatorMissData.notes) && translatorMissData.notes.length > 0 && (
            <div style={{ fontSize: 12, color: c.textMuted }}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {translatorMissData.notes.map((n: string, i: number) => (
                  <li key={i} style={{ lineHeight: '20px' }}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <span style={{ color: c.textMuted, fontSize: 13 }}>
          本次任务没有走翻译器路径（兼容旧任务或非 mobile+wot 组合）。
        </span>
      ),
    },
    {
      key: 'llm',
      label: (
        <span>
          📊 <strong>LLM 决策</strong>{' '}
          {llmData ? (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {llmData.provider_name} / {llmData.mode}
            </Tag>
          ) : (
            <Tag color="default">未记录</Tag>
          )}
        </span>
      ),
      children: llmData ? (
        <KeyValueList
          rows={[
            ['mode', llmData.mode],
            ['provider', `#${llmData.provider_id} ${llmData.provider_name}`],
            ['model', llmData.model],
            ['protocol', llmData.protocol],
            ['capability_tier', llmData.capability_tier],
            [
              'complexity_score',
              llmData.complexity_score != null
                ? Number(llmData.complexity_score).toFixed(2)
                : '—',
            ],
            ['reason', llmData.reason],
          ]}
          c={c}
        />
      ) : (
        <span style={{ color: c.textMuted }}>无数据</span>
      ),
    },
    {
      key: 'skills',
      label: (
        <span>
          🎯 <strong>触发的 Skills</strong>{' '}
          {skillsData ? (
            <Tag color="geekblue" style={{ marginLeft: 8 }}>
              {skillsData.selected_buckets?.length ?? 0} 桶
            </Tag>
          ) : (
            <Tag color="default">未记录</Tag>
          )}
        </span>
      ),
      children: skillsData ? (
        <div>
          <KeyValueList
            rows={[
              ['skills_root', skillsData.skills_root],
              ['total_sections', skillsData.total_sections],
              ['extra_sections', skillsData.extra_sections_count],
            ]}
            c={c}
          />
          <div style={{ marginTop: 12, fontSize: 12, color: c.textMuted }}>
            选中的桶（按 priority desc）：
          </div>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
            {(skillsData.selected_buckets || []).map((b: any) => (
              <li
                key={b.dir_name}
                style={{ fontSize: 13, color: c.text, lineHeight: '22px' }}
              >
                <code
                  style={{
                    background: c.surface,
                    padding: '1px 6px',
                    borderRadius: 3,
                    fontSize: 12,
                  }}
                >
                  {b.dir_name}
                </code>{' '}
                <span style={{ color: c.textMuted }}>{b.name}</span>{' '}
                {b.kind && (
                  <Tag
                    color="purple"
                    style={{ marginLeft: 4, fontSize: 11 }}
                  >
                    {b.kind}
                  </Tag>
                )}
                <span style={{ color: c.textMuted, fontSize: 11 }}>
                  {' '}
                  priority={b.priority}
                </span>
                {b.description && (
                  <div
                    style={{
                      color: c.textMuted,
                      fontSize: 12,
                      marginLeft: 4,
                    }}
                  >
                    {b.description}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <span style={{ color: c.textMuted }}>无数据</span>
      ),
    },
    {
      key: 'rag',
      label: (
        <span>
          🧠 <strong>RAG 样例</strong>{' '}
          {ragData ? (
            <Tag color="green" style={{ marginLeft: 8 }}>
              {ragData.total_hits ?? 0} 条命中
            </Tag>
          ) : (
            <Tag color="default">未命中或未记录</Tag>
          )}
        </span>
      ),
      children: ragData ? (
        <div>
          <KeyValueList
            rows={[
              ['top_k', ragData.top_k],
              ['query_length', ragData.query_length],
              [
                'query_preview',
                ragData.query_preview?.slice(0, 100) +
                  ((ragData.query_length ?? 0) > 100 ? '...' : ''),
              ],
            ]}
            c={c}
          />
          <div style={{ marginTop: 12, fontSize: 12, color: c.textMuted }}>
            命中样例（按 similarity desc）：
          </div>
          <table
            style={{
              marginTop: 6,
              fontSize: 12,
              borderCollapse: 'collapse',
              width: '100%',
            }}
          >
            <thead>
              <tr style={{ color: c.textMuted, textAlign: 'left' }}>
                <th style={{ padding: '4px 8px' }}>#</th>
                <th style={{ padding: '4px 8px' }}>team</th>
                <th style={{ padding: '4px 8px' }}>similarity</th>
                <th style={{ padding: '4px 8px' }}>摘要</th>
              </tr>
            </thead>
            <tbody>
              {(ragData.results || []).map((r: any) => (
                <tr
                  key={r.id}
                  style={{ borderTop: `1px solid ${c.border}` }}
                >
                  <td style={{ padding: '4px 8px', color: c.text }}>
                    #{r.id}
                  </td>
                  <td
                    style={{ padding: '4px 8px', color: c.textMuted }}
                  >
                    {r.source_team ?? '-'}
                  </td>
                  <td style={{ padding: '4px 8px', color: c.text }}>
                    {r.similarity != null
                      ? Number(r.similarity).toFixed(3)
                      : '—'}
                  </td>
                  <td
                    style={{
                      padding: '4px 8px',
                      color: c.textMuted,
                      maxWidth: 360,
                    }}
                  >
                    {r.amis_json_summary ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <span style={{ color: c.textMuted }}>
          无数据（可能 code_samples 库为空或检索命中 0 条）
        </span>
      ),
    },
    {
      key: 'prompt',
      label: (
        <span>
          📝 <strong>System Prompt</strong>{' '}
          {promptData ? (
            <Tag color="orange" style={{ marginLeft: 8 }}>
              {promptData.prompt_length ?? 0} 字符
            </Tag>
          ) : (
            <Tag color="default">未记录</Tag>
          )}
        </span>
      ),
      children: promptData ? (
        <div>
          <KeyValueList
            rows={[
              ['length', promptData.prompt_length],
              [
                'sha256',
                promptData.prompt_sha256
                  ? `${String(promptData.prompt_sha256).slice(0, 16)}…`
                  : '—',
              ],
            ]}
            c={c}
          />
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span style={{ color: c.textMuted, fontSize: 12 }}>
                预览（前 500 字符）：
              </span>
              <Tooltip title="复制预览">
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() =>
                    copy(promptData.prompt_preview ?? '', '预览')
                  }
                />
              </Tooltip>
            </div>
            <pre
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 4,
                padding: 12,
                fontSize: 12,
                lineHeight: '20px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: c.text,
                maxHeight: 200,
                overflow: 'auto',
                margin: 0,
              }}
            >
              {promptData.prompt_preview ?? '(空)'}
            </pre>
          </div>
          {promptData.prompt_full && (
            <div style={{ marginTop: 12 }}>
              <Button
                size="small"
                type="primary"
                ghost
                onClick={() => setFullPromptOpen((v) => !v)}
              >
                {fullPromptOpen
                  ? '收起完整 Prompt'
                  : `展开完整 Prompt (${promptData.prompt_length} 字符)`}
              </Button>
              <Tooltip title="复制完整 Prompt">
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() =>
                    copy(promptData.prompt_full, '完整 Prompt')
                  }
                  style={{ marginLeft: 8 }}
                />
              </Tooltip>
              {fullPromptOpen && (
                <pre
                  style={{
                    marginTop: 8,
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                    borderRadius: 4,
                    padding: 12,
                    fontSize: 12,
                    lineHeight: '20px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: c.text,
                    maxHeight: 500,
                    overflow: 'auto',
                  }}
                >
                  {promptData.prompt_full}
                </pre>
              )}
            </div>
          )}
        </div>
      ) : (
        <span style={{ color: c.textMuted }}>无数据</span>
      ),
    },
    {
      key: 'analysis',
      label: (
        <span>
          🤖 <strong>AI 分析建议</strong>{' '}
          {analysis ? (
            <Tag color="magenta" style={{ marginLeft: 8 }}>
              {analysis.overall_quality} · {analysis.issues.length} 条建议
            </Tag>
          ) : (
            <Tag color="default">未分析</Tag>
          )}
        </span>
      ),
      children: (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <Button
              type="primary"
              size="small"
              icon={<ExperimentOutlined />}
              onClick={handleAnalyze}
              loading={analyzing}
            >
              {analysis ? '重新分析' : '分析本次任务'}
            </Button>
            {analysis && (
              <span style={{ fontSize: 11, color: c.textMuted }}>
                analyzer: {analysis.analyzer_provider} / {analysis.analyzer_model}
              </span>
            )}
            {/* 2026-04-25 tracelog 归档下载入口 */}
            {tracelog && tracelog.exists && (
              <>
                <Tooltip title="不下载，直接在弹窗里浏览归档（适合快速扫一眼 analysis_input.md）">
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => setBrowserOpen(true)}
                  >
                    📖 在线查看
                  </Button>
                </Tooltip>
                <Tooltip title={`归档路径：${tracelog.path}（mode=${tracelog.mode}，${(tracelog.size_bytes / 1024).toFixed(1)} KB）。下载后 cat analysis_input.md 喂给 Claude。`}>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadTaskTracelog(taskId)}
                  >
                    📦 下载归档（{(tracelog.size_bytes / 1024).toFixed(0)} KB）
                  </Button>
                </Tooltip>
              </>
            )}
            {tracelog && !tracelog.exists && tracelog.mode === 'disabled' && (
              <Tooltip title="开启需 admin 在「系统设置 → 任务追踪日志」改 tracelog.mode = smart / all_tasks">
                <Tag style={{ fontSize: 11 }}>tracelog 未启</Tag>
              </Tooltip>
            )}
            {tracelog && !tracelog.exists && tracelog.mode !== 'disabled' && (
              <Tag style={{ fontSize: 11 }}>tracelog 暂无（任务可能尚未结束 / smart 模式下成功任务已清）</Tag>
            )}
          </div>

          {analyzing && (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <Spin />
              <div style={{ marginTop: 8, color: c.textMuted, fontSize: 12 }}>
                正在让 LLM 复盘本次任务（读取 events、组装 meta-prompt、调模型）…通常 10-60 秒
              </div>
            </div>
          )}

          {analyzeError && !analyzing && (
            <Alert type="error" message={analyzeError} style={{ marginBottom: 12 }} />
          )}

          {analysis && !analyzing && (
            <div>
              <KeyValueList
                rows={[
                  ['overall_quality', analysis.overall_quality],
                  ['issues_count', analysis.issues.length],
                  ['has_skill_edits', analysis.suggested_skill_edits.length > 0 ? '是' : '否'],
                ]}
                c={c}
              />

              {analysis.issues.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 6 }}>
                    问题清单（按建议排序）：
                  </div>
                  {analysis.issues.map((it, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 8,
                        padding: 8,
                        border: `1px solid ${c.border}`,
                        borderRadius: 4,
                        background: c.surface,
                      }}
                    >
                      <div style={{ fontSize: 12 }}>
                        <Tag color="red">{it.aspect}</Tag>
                        <strong style={{ color: c.text }}>{it.problem}</strong>
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: c.text,
                          lineHeight: '20px',
                        }}
                      >
                        💡 <strong>建议：</strong>
                        {it.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {analysis.suggested_skill_edits.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 6 }}>
                    Skills 补丁建议（复制到对应桶 SKILL.md）：
                  </div>
                  {analysis.suggested_skill_edits.map((e, i) => (
                    <pre
                      key={i}
                      style={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                        borderRadius: 4,
                        padding: 10,
                        fontSize: 11,
                        lineHeight: '18px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: c.text,
                        maxHeight: 240,
                        overflow: 'auto',
                        marginBottom: 8,
                      }}
                    >
                      {e}
                    </pre>
                  ))}
                </div>
              )}

              {analysis.suggested_rag_samples_to_add && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 6 }}>
                    RAG 样例建议：
                  </div>
                  <pre
                    style={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 4,
                      padding: 10,
                      fontSize: 11,
                      lineHeight: '18px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: c.text,
                      maxHeight: 240,
                      overflow: 'auto',
                    }}
                  >
                    {analysis.suggested_rag_samples_to_add}
                  </pre>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <Button
                  size="small"
                  type="text"
                  onClick={() => setRawOpen((v) => !v)}
                >
                  {rawOpen ? '收起 LLM 原始输出' : '展开 LLM 原始输出'}
                </Button>
                {rawOpen && (
                  <pre
                    style={{
                      marginTop: 8,
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 4,
                      padding: 10,
                      fontSize: 11,
                      lineHeight: '18px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: c.text,
                      maxHeight: 400,
                      overflow: 'auto',
                    }}
                  >
                    {analysis.raw}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: 12,
        background: c.bg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{ color: c.textMuted, fontSize: 12 }}>
          🔍 执行详情（本次任务的 LLM 决策 / Skills / RAG / System Prompt）
        </span>
        <Tooltip title="重新拉取事件历史（补齐 backend 异步 insert 的事件，如 LLM 决策）">
          <Button
            size="small"
            type="text"
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={handleRefresh}
            disabled={!onRefresh || refreshing}
            style={{ color: c.textMuted }}
          />
        </Tooltip>
      </div>
      <Collapse
        items={items}
        defaultActiveKey={['llm', 'skills', 'rag']}
        size="small"
        bordered
        style={{ background: 'transparent' }}
      />

      {/* Phase E：在线浏览归档 Drawer（不下载即可 cat） */}
      <TracelogBrowser
        taskId={taskId}
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        c={c}
      />
    </div>
  );
}

/**
 * Phase E：在 Drawer 里浏览 task tracelog 归档。
 *   - 左侧文件树：mount 时拉 /tracelog/ls
 *   - 右侧预览：选中文件后拉 /tracelog/file?path=X，<pre> 显示原文
 *   - 复制按钮：一键复制内容（admin 直接喂给 Claude / LLM）
 *   - 默认选中 analysis_input.md（总索引最有用）
 *
 * 不引入 react-markdown：markdown 源码 <pre> 显示已经够用，
 * 且文件还包括 manifest.json / events.jsonl / llm_calls/*.json，原文展示更通用。
 */
function TracelogBrowser({
  taskId,
  open,
  onClose,
  c,
}: {
  taskId: number;
  open: boolean;
  onClose: () => void;
  c: ReturnType<typeof useColors>;
}) {
  const [files, setFiles] = useState<string[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selected, setSelected] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [size, setSize] = useState<number>(0);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setFilesLoading(true);
    setError(null);
    try {
      const r = await listTaskTracelogFiles(taskId);
      setFiles(r.files);
      // 默认选 analysis_input.md，否则选第一个
      const preferred = r.files.find((f) => f === 'analysis_input.md') ?? r.files[0] ?? '';
      setSelected(preferred);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? String(e));
    } finally {
      setFilesLoading(false);
    }
  }, [taskId]);

  const loadContent = useCallback(
    async (path: string) => {
      if (!path) return;
      setContentLoading(true);
      setError(null);
      try {
        const r = await readTaskTracelogFile(taskId, path);
        setContent(r.content);
        setSize(r.size);
      } catch (e: any) {
        setError(e?.response?.data?.error ?? e?.message ?? String(e));
        setContent('');
      } finally {
        setContentLoading(false);
      }
    },
    [taskId],
  );

  // Drawer 打开时拉文件列表
  useEffect(() => {
    if (open) {
      void loadFiles();
    }
  }, [open, loadFiles]);

  // 选中变化时拉内容
  useEffect(() => {
    if (open && selected) {
      void loadContent(selected);
    }
  }, [open, selected, loadContent]);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(content)
      .then(() => message.success(`已复制 ${selected}（${(size / 1024).toFixed(1)} KB）到剪贴板`))
      .catch((e) => message.error(`复制失败：${e}`));
  };

  return (
    <Drawer
      title={`📂 Task #${taskId} · Tracelog 归档浏览`}
      placement="right"
      width={960}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {/* 左：文件列表 */}
        <div
          style={{
            width: 260,
            borderRight: `1px solid ${c.border}`,
            overflow: 'auto',
            background: c.surface,
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: c.textMuted,
              borderBottom: `1px solid ${c.borderSubtle}`,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            FILES ({files.length})
          </div>
          {filesLoading ? (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <Spin size="small" />
            </div>
          ) : files.length === 0 ? (
            <Empty
              description={<span style={{ color: c.textSubtle, fontSize: 12 }}>归档为空</span>}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '24px 12px' }}
            />
          ) : (
            files.map((f) => {
              const isActive = f === selected;
              return (
                <div
                  key={f}
                  onClick={() => setSelected(f)}
                  style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: isActive ? c.text : c.textMuted,
                    background: isActive ? c.surfaceElevated : 'transparent',
                    borderLeft: isActive ? `2px solid ${c.accentCyan}` : '2px solid transparent',
                    wordBreak: 'break-all',
                  }}
                >
                  {f}
                </div>
              );
            })
          )}
        </div>

        {/* 右：内容预览 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              padding: '8px 12px',
              borderBottom: `1px solid ${c.borderSubtle}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: c.surface,
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: c.text, flex: 1 }}>
              {selected || '（未选中文件）'}
            </span>
            {selected && (
              <>
                <span style={{ fontSize: 11, color: c.textSubtle, fontFamily: 'var(--font-mono)' }}>
                  {(size / 1024).toFixed(1)} KB
                </span>
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                  复制
                </Button>
              </>
            )}
          </div>
          {error ? (
            <Alert type="error" message={error} style={{ margin: 12 }} />
          ) : contentLoading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : (
            <pre
              style={{
                flex: 1,
                margin: 0,
                padding: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                lineHeight: '18px',
                color: c.text,
                background: c.bg,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {content || '（空文件）'}
            </pre>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function KeyValueList({
  rows,
  c,
}: {
  rows: [string, any][];
  c: ReturnType<typeof useColors>;
}) {
  return (
    <table style={{ fontSize: 12, lineHeight: '22px' }}>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td
              style={{
                color: c.textMuted,
                paddingRight: 12,
                verticalAlign: 'top',
                whiteSpace: 'nowrap',
              }}
            >
              {k}
            </td>
            <td style={{ color: c.text, wordBreak: 'break-all' }}>
              {v == null || v === '' ? '—' : String(v)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
