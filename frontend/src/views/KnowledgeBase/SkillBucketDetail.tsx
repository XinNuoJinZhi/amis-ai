// 单桶编辑页（/knowledge-base/skills/:bucket）
//
// 从 SkillsHome 卡片点进来，进入这个左树右编辑器布局。
// 与之前 SkillsManager 的区别：
//   - bucket 从 URL 参数取，无需 Select 切换
//   - 顶栏只展示当前桶的 display_name + description + 返回链接
//   - 进入页面立刻自动打开 SKILL.md（如果存在）
//   - 删除/重命名/新建文件 全走文件树右键（VSCode 风）

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Dropdown,
  Empty,
  Input,
  Modal,
  Result,
  Space,
  Spin,
  Tooltip,
  Tree,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  ReloadOutlined,
  RobotOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import Editor, { type OnMount } from '@monaco-editor/react';
import RewriteDrawer from './RewriteDrawer';
import {
  deletePathInBucket,
  getSkillTree,
  listSkillBuckets,
  mkdirInBucket,
  readSkillFile,
  renamePathInBucket,
  writeSkillFile,
  type SkillBucketSummary,
  type SkillTreeNode,
} from '../../services/skills';
import { useColors, useThemeMode } from '../../theme';

interface OpenFile {
  bucket: string;
  path: string;
  content: string;
  baseMtimeUnix: number | null;
  dirty: boolean;
}

function buildTreeData(nodes: SkillTreeNode[]): DataNode[] {
  return nodes.map((n) => {
    if (n.type === 'dir') {
      return {
        title: n.name,
        key: `dir:${n.path}`,
        selectable: false,
        children: buildTreeData(n.children),
      };
    }
    return { title: n.name, key: `file:${n.path}`, isLeaf: true };
  });
}

function languageForPath(path: string): string {
  if (path.endsWith('.md')) return 'markdown';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.yaml') || path.endsWith('.yml')) return 'yaml';
  return 'plaintext';
}

function extractError(e: unknown): { status?: number; message: string } {
  const resp = (e as { response?: { status?: number; data?: { error?: string } } }).response;
  return { status: resp?.status, message: resp?.data?.error ?? String(e) };
}

export default function SkillBucketDetail() {
  const c = useColors();
  const mode = useThemeMode((s) => s.mode);
  const monacoTheme = mode === 'light' ? 'vs' : 'vs-dark';
  const navigate = useNavigate();
  const { bucket: bucketParam } = useParams<{ bucket: string }>();
  const bucket = decodeURIComponent(bucketParam ?? '');

  const [meta, setMeta] = useState<SkillBucketSummary | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState<string | null>(null);

  const [treeNodes, setTreeNodes] = useState<SkillTreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const [openFile, setOpenFile] = useState<OpenFile | null>(null);

  // AI 改写 Drawer（Task 12）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewritePayload, setRewritePayload] = useState<{
    selection: string;
    startLine: number;
    endLine: number;
  } | null>(null);

  const handleEditorMount: OnMount = useCallback((ed) => {
    editorRef.current = ed;
  }, []);

  const openRewrite = useCallback(() => {
    if (!openFile) return;
    const ed = editorRef.current;
    if (!ed) return;
    const sel = ed.getSelection();
    if (!sel || sel.isEmpty()) {
      message.warning('请先在编辑器里选中一段文本再点 AI 改写');
      return;
    }
    const model = ed.getModel();
    if (!model) return;
    const selectionText: string = model.getValueInRange(sel);
    setRewritePayload({
      selection: selectionText,
      startLine: sel.startLineNumber,
      endLine: sel.endLineNumber,
    });
    setRewriteOpen(true);
  }, [openFile]);

  const applyRewrite = useCallback(
    (newText: string) => {
      if (!rewritePayload || !openFile) return;
      // 按行切片拼接，保留文件前后内容，替换选中的连续行
      const all = openFile.content.split('\n');
      const before = all.slice(0, rewritePayload.startLine - 1);
      const after = all.slice(rewritePayload.endLine);
      const inserted = newText.split('\n');
      const merged = [...before, ...inserted, ...after].join('\n');
      setOpenFile({
        ...openFile,
        content: merged,
        dirty: true,
      });
      message.success('已替换选区，别忘了点保存落盘');
    },
    [rewritePayload, openFile]
  );
  const [fileLoading, setFileLoading] = useState(false);

  const [createUnderModal, setCreateUnderModal] =
    useState<{ parentDir: string; kind: 'file' | 'dir' } | null>(null);
  const [createUnderName, setCreateUnderName] = useState('');

  const [renameModal, setRenameModal] = useState<{ oldPath: string } | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  const suppressDirtyRef = useRef(false);

  // —— 拉桶元数据（用于顶栏显示 description）
  useEffect(() => {
    if (!bucket) return;
    let cancelled = false;
    void (async () => {
      try {
        const resp = await listSkillBuckets();
        if (cancelled) return;
        const found = resp.buckets.find((b) => b.dir_name === bucket);
        if (!found) setMetaError(`桶 "${bucket}" 不存在`);
        else setMeta(found);
      } catch (e) {
        const { status, message: msg } = extractError(e);
        if (status === 403) setForbidden(msg);
        else setMetaError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bucket]);

  const refreshTree = useCallback(async (): Promise<SkillTreeNode[]> => {
    if (!bucket) return [];
    setTreeLoading(true);
    try {
      const resp = await getSkillTree(bucket);
      setTreeNodes(resp.tree);
      const allDirKeys: string[] = [];
      const walk = (n: SkillTreeNode) => {
        if (n.type === 'dir') {
          allDirKeys.push(`dir:${n.path}`);
          n.children.forEach(walk);
        }
      };
      resp.tree.forEach(walk);
      setExpandedKeys(allDirKeys);
      return resp.tree;
    } catch (e) {
      const { status, message: msg } = extractError(e);
      if (status === 403) setForbidden(msg);
      else message.error(`加载文件树失败：${msg}`);
      return [];
    } finally {
      setTreeLoading(false);
    }
  }, [bucket]);

  const openFileFromTree = useCallback(
    async (path: string) => {
      if (!bucket) return;
      if (openFile?.dirty) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Modal.confirm({
            title: '当前文件未保存',
            content: '切换文件会丢失未保存的修改。继续？',
            icon: <ExclamationCircleOutlined />,
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
        if (!confirmed) return;
      }
      setFileLoading(true);
      try {
        const resp = await readSkillFile(bucket, path);
        suppressDirtyRef.current = true;
        setOpenFile({
          bucket: resp.bucket,
          path: resp.path,
          content: resp.content,
          baseMtimeUnix: resp.mtime_unix,
          dirty: false,
        });
        if (resp.truncated) message.warning('文件较大，已截断显示');
      } catch (e) {
        const { message: msg } = extractError(e);
        message.error(`读取失败：${msg}`);
      } finally {
        setFileLoading(false);
      }
    },
    [bucket, openFile]
  );

  // 进入页面：load tree → 自动开 SKILL.md
  useEffect(() => {
    if (!bucket) return;
    let cancelled = false;
    void (async () => {
      const tree = await refreshTree();
      if (cancelled) return;
      const hasSkillMd = tree.some((n) => n.type === 'file' && n.name === 'SKILL.md');
      if (hasSkillMd) void openFileFromTree('SKILL.md');
    })();
    return () => {
      cancelled = true;
    };
    // openFileFromTree 故意不进 deps：我们只想"进入桶时跑一次"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket]);

  const treeData = useMemo(() => buildTreeData(treeNodes), [treeNodes]);

  const onTreeSelect = useCallback(
    (_: unknown, info: { node: DataNode }) => {
      const key = String(info.node.key);
      if (!key.startsWith('file:')) return;
      void openFileFromTree(key.slice('file:'.length));
    },
    [openFileFromTree]
  );

  const onEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;
    if (suppressDirtyRef.current) {
      suppressDirtyRef.current = false;
      return;
    }
    setOpenFile((prev) => (prev ? { ...prev, content: value, dirty: true } : prev));
  }, []);

  const saveCurrent = useCallback(async () => {
    if (!openFile) return;
    setFileLoading(true);
    try {
      const resp = await writeSkillFile(openFile.bucket, {
        path: openFile.path,
        content: openFile.content,
        base_mtime_unix: openFile.baseMtimeUnix,
      });
      setOpenFile((prev) =>
        prev ? { ...prev, baseMtimeUnix: resp.mtime_unix, dirty: false } : prev
      );
      message.success('已保存。下一个新任务将看到新内容');
      void refreshTree();
    } catch (e) {
      const { status, message: msg } = extractError(e);
      if (status === 409) message.error('文件已被他人修改，请重新打开');
      else message.error(`保存失败：${msg}`);
    } finally {
      setFileLoading(false);
    }
  }, [openFile, refreshTree]);

  // —— 右键菜单
  const buildContextMenu = useCallback(
    (target: { path: string; isDir: boolean }): MenuProps['items'] => {
      const parentDir = target.isDir
        ? target.path
        : target.path.split('/').slice(0, -1).join('/') || '';
      return [
        {
          key: 'new-file',
          icon: <FileAddOutlined />,
          label: target.isDir ? '在此新建文件' : '在同级新建文件',
          onClick: () => {
            setCreateUnderModal({ parentDir, kind: 'file' });
            setCreateUnderName('');
          },
        },
        {
          key: 'new-folder',
          icon: <FolderAddOutlined />,
          label: target.isDir ? '在此新建文件夹' : '在同级新建文件夹',
          onClick: () => {
            setCreateUnderModal({ parentDir, kind: 'dir' });
            setCreateUnderName('');
          },
        },
        { type: 'divider' },
        {
          key: 'rename',
          label: '重命名',
          onClick: () => {
            setRenameModal({ oldPath: target.path });
            setRenameNewName(target.path.split('/').pop() ?? '');
          },
        },
        {
          key: 'delete',
          label: '删除',
          danger: true,
          onClick: () => {
            Modal.confirm({
              title: `确认删除 ${target.path}？`,
              content: target.isDir ? '将递归删除该目录下所有内容。' : '将永久删除该文件。',
              okType: 'danger',
              onOk: async () => {
                try {
                  await deletePathInBucket(bucket, target.path);
                  message.success('已删除');
                  if (openFile?.path === target.path) setOpenFile(null);
                  void refreshTree();
                } catch (e) {
                  const { message: msg } = extractError(e);
                  message.error(`删除失败：${msg}`);
                }
              },
            });
          },
        },
      ];
    },
    [bucket, openFile, refreshTree]
  );

  const renderTreeTitle = useCallback(
    (node: DataNode) => {
      const key = String(node.key);
      const path = key.slice(key.indexOf(':') + 1);
      const isDir = key.startsWith('dir:');
      return (
        <Dropdown
          menu={{ items: buildContextMenu({ path, isDir }) }}
          trigger={['contextMenu']}
        >
          <span>{node.title as React.ReactNode}</span>
        </Dropdown>
      );
    },
    [buildContextMenu]
  );

  const newAtBucketRoot = useCallback((kind: 'file' | 'dir') => {
    setCreateUnderModal({ parentDir: '', kind });
    setCreateUnderName('');
  }, []);

  const submitCreateUnder = useCallback(async () => {
    if (!createUnderModal) return;
    const name = createUnderName.trim();
    if (!name) return message.warning('名字不能为空');
    if (createUnderModal.kind === 'file') {
      if (!/^[\w./-]+\.(md|txt|json|ya?ml)$/i.test(name))
        return message.warning('文件扩展名必须为 md/txt/json/yaml/yml');
    } else if (!/^[\w.-]+(\/[\w.-]+)*$/.test(name)) {
      return message.warning('目录名只允许字母数字 _ - .');
    }
    const fullPath = createUnderModal.parentDir
      ? `${createUnderModal.parentDir}/${name}`
      : name;
    setFileLoading(true);
    try {
      if (createUnderModal.kind === 'file') {
        await writeSkillFile(bucket, { path: fullPath, content: '' });
        message.success(`已创建文件 ${fullPath}`);
        await refreshTree();
        void openFileFromTree(fullPath);
      } else {
        await mkdirInBucket(bucket, fullPath);
        message.success(`已创建目录 ${fullPath}`);
        void refreshTree();
      }
      setCreateUnderModal(null);
      setCreateUnderName('');
    } catch (e) {
      const { message: msg } = extractError(e);
      message.error(`创建失败：${msg}`);
    } finally {
      setFileLoading(false);
    }
  }, [bucket, createUnderModal, createUnderName, openFileFromTree, refreshTree]);

  const submitRename = useCallback(async () => {
    if (!renameModal) return;
    const newName = renameNewName.trim();
    if (!newName) return message.warning('新名字不能为空');
    const oldPath = renameModal.oldPath;
    const parent = oldPath.includes('/') ? oldPath.slice(0, oldPath.lastIndexOf('/')) : '';
    const newPath = parent ? `${parent}/${newName}` : newName;
    if (newPath === oldPath) {
      setRenameModal(null);
      return;
    }
    setFileLoading(true);
    try {
      await renamePathInBucket(bucket, oldPath, newPath);
      message.success(`已重命名为 ${newName}`);
      if (openFile?.path === oldPath) setOpenFile({ ...openFile, path: newPath });
      setRenameModal(null);
      setRenameNewName('');
      void refreshTree();
    } catch (e) {
      const { message: msg } = extractError(e);
      message.error(`重命名失败：${msg}`);
    } finally {
      setFileLoading(false);
    }
  }, [bucket, openFile, refreshTree, renameModal, renameNewName]);

  if (forbidden) return <Result status="403" title="无权访问" subTitle={forbidden} />;
  if (!bucket || metaError)
    return (
      <Result
        status="404"
        title="桶不存在"
        subTitle={metaError ?? '请回到列表页选择'}
        extra={
          <Button type="primary" onClick={() => navigate('/knowledge-base/skills')}>
            返回列表
          </Button>
        }
      />
    );

  return (
    <div
      style={{
        height: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 24px 16px',
        background: c.bg,
        boxSizing: 'border-box',
      }}
    >
      {/* 顶栏：返回 + 桶信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Button
          type="text"
          size="small"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/knowledge-base/skills')}
        >
          返回
        </Button>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: c.text }}>
              {meta?.display_name ?? bucket}
            </span>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: c.textSubtle,
              }}
            >
              {bucket}
            </span>
          </div>
          {meta?.description && (
            <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
              {meta.description}
            </div>
          )}
        </div>
        <Tooltip title="刷新文件树">
          <Button size="small" icon={<ReloadOutlined />} onClick={() => void refreshTree()} />
        </Tooltip>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ background: c.surfaceElevated, border: `1px solid ${c.border}`, marginBottom: 12 }}
        message="编辑保存后对下一个新任务生效；正在运行的任务不会感知。"
      />

      {/* 主区：左树右编辑器 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: 12,
        }}
      >
        <div
          style={{
            border: `1px solid ${c.border}`,
            borderRadius: 6,
            background: c.surface,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              borderBottom: `1px solid ${c.border}`,
              background: c.surfaceElevated,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: c.textMuted,
            }}
          >
            <span>{bucket}/</span>
            <Space size={2}>
              <Tooltip title="在桶根新建文件">
                <Button
                  size="small"
                  type="text"
                  icon={<FileAddOutlined />}
                  onClick={() => newAtBucketRoot('file')}
                />
              </Tooltip>
              <Tooltip title="在桶根新建文件夹">
                <Button
                  size="small"
                  type="text"
                  icon={<FolderAddOutlined />}
                  onClick={() => newAtBucketRoot('dir')}
                />
              </Tooltip>
            </Space>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 6 }}>
            {treeLoading ? (
              <Spin />
            ) : treeData.length === 0 ? (
              <Empty description="桶为空，右键或顶部按钮新建" />
            ) : (
              <Tree
                treeData={treeData}
                expandedKeys={expandedKeys}
                onExpand={(k) => setExpandedKeys(k as string[])}
                onSelect={onTreeSelect}
                selectedKeys={openFile ? [`file:${openFile.path}`] : []}
                titleRender={renderTreeTitle}
              />
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${c.border}`,
            borderRadius: 6,
            background: c.surface,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderBottom: `1px solid ${c.border}`,
              background: c.surfaceElevated,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: c.textMuted,
            }}
          >
            <span>
              {openFile
                ? `${openFile.bucket} / ${openFile.path}${openFile.dirty ? ' •' : ''}`
                : '未打开文件'}
            </span>
            <Space size={8}>
              <Tooltip title="在编辑器里选中一段文本后，让 AI 按指定方向改写">
                <Button
                  size="small"
                  icon={<RobotOutlined />}
                  disabled={!openFile || !openFile.path.endsWith('.md')}
                  onClick={openRewrite}
                >
                  AI 改写
                </Button>
              </Tooltip>
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                disabled={!openFile || !openFile.dirty || fileLoading}
                onClick={() => void saveCurrent()}
              >
                保存
              </Button>
            </Space>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {openFile ? (
              <Editor
                height="100%"
                theme={monacoTheme}
                language={languageForPath(openFile.path)}
                value={openFile.content}
                onChange={onEditorChange}
                onMount={handleEditorMount}
                options={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  lineNumbers: 'on',
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  renderWhitespace: 'selection',
                }}
              />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: c.textMuted,
                  fontSize: 13,
                }}
              >
                左侧选择文件开始编辑
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 新建文件 / 文件夹 */}
      <Modal
        title={
          createUnderModal
            ? `${createUnderModal.kind === 'file' ? '新建文件' : '新建文件夹'} @ ${bucket}/${
                createUnderModal.parentDir ? createUnderModal.parentDir + '/' : ''
              }`
            : ''
        }
        open={!!createUnderModal}
        onOk={() => void submitCreateUnder()}
        onCancel={() => {
          setCreateUnderModal(null);
          setCreateUnderName('');
        }}
        okText="创建"
        cancelText="取消"
        confirmLoading={fileLoading}
      >
        <Input
          value={createUnderName}
          onChange={(e) => setCreateUnderName(e.target.value)}
          placeholder={
            createUnderModal?.kind === 'file' ? '例如 new-rule.md' : '例如 components'
          }
          onPressEnter={() => void submitCreateUnder()}
        />
        <p style={{ color: c.textMuted, fontSize: 12, marginTop: 8 }}>
          {createUnderModal?.kind === 'file'
            ? '允许扩展名：md / txt / json / yaml / yml'
            : '只允许字母数字 _ - .'}
        </p>
      </Modal>

      {/* 重命名 */}
      <Modal
        title={`重命名 ${renameModal?.oldPath ?? ''}`}
        open={!!renameModal}
        onOk={() => void submitRename()}
        onCancel={() => {
          setRenameModal(null);
          setRenameNewName('');
        }}
        okText="确定"
        cancelText="取消"
        confirmLoading={fileLoading}
      >
        <Input
          value={renameNewName}
          onChange={(e) => setRenameNewName(e.target.value)}
          onPressEnter={() => void submitRename()}
        />
        <p style={{ color: c.textMuted, fontSize: 12, marginTop: 8 }}>
          只改最后一段（同级重命名）
        </p>
      </Modal>

      {/* AI 改写 Drawer（Task 12） */}
      {openFile && rewritePayload && (
        <RewriteDrawer
          open={rewriteOpen}
          onClose={() => setRewriteOpen(false)}
          bucket={openFile.bucket}
          path={openFile.path}
          selection={rewritePayload.selection}
          fullFile={openFile.content}
          selectionStartLine={rewritePayload.startLine}
          selectionEndLine={rewritePayload.endLine}
          onAccept={applyRewrite}
        />
      )}
    </div>
  );
}
