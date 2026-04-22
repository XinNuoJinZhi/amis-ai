import { useMemo } from 'react';
import { Tree, Empty, Spin, Button, Tooltip, message } from 'antd';
import { ReloadOutlined, FileOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useFileTree } from '../hooks/useFileTree';
import { useIdeStore } from '../../../../stores/ide';
import { readFile } from '../../../../services/ide';
import type { FsNode } from '../../../../services/ide';
import { useColors } from '../../../../theme';

interface Props {
  taskId: number;
  enabled: boolean;
}

function toDataNode(n: FsNode): DataNode {
  // 图标由 Tree 的 icon render prop 统一提供，这里不再内置颜色
  return {
    title: n.name,
    key: n.path,
    isLeaf: n.type === 'file',
    children: n.children?.map(toDataNode),
  };
}

export default function FileTreePanel({ taskId, enabled }: Props) {
  const darkColors = useColors();
  const { nodes, loading, error, refresh } = useFileTree(taskId, enabled);
  const openFile = useIdeStore((s) => s.openFile);

  const treeData = useMemo(() => nodes.map(toDataNode), [nodes]);

  const handleSelect = async (keys: React.Key[], info: any) => {
    const key = keys[0] as string | undefined;
    if (!key || info?.node?.isLeaf !== true) return;
    try {
      const resp = await readFile(taskId, key);
      if (resp.truncated) {
        message.warning(`${key} 文件过大或为二进制，无法在编辑器打开`);
        return;
      }
      openFile({
        path: resp.path,
        content: resp.content,
        original: resp.content,
        baseMtime: resp.mtime,
        lang: resp.lang,
        dirty: false,
      });
    } catch (e: any) {
      message.error(`打开文件失败：${e?.response?.data?.error || e.message}`);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: darkColors.bg,
        borderRight: `1px solid ${darkColors.border}`,
      }}
    >
      <div
        style={{
          height: 36,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${darkColors.borderSubtle}`,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: darkColors.textMuted,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        <span>Explorer</span>
        <Tooltip title="刷新">
          <Button size="small" type="text" icon={<ReloadOutlined />} onClick={refresh} />
        </Tooltip>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 4px' }}>
        {loading && nodes.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Spin size="small" />
          </div>
        ) : error ? (
          <div style={{ padding: 16, color: darkColors.destructive, fontSize: 12 }}>{error}</div>
        ) : treeData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: darkColors.textSubtle, fontSize: 12 }}>暂无文件</span>
            }
          />
        ) : (
          <Tree
            treeData={treeData}
            showIcon
            blockNode
            switcherIcon={<span style={{ color: darkColors.textSubtle }}>▸</span>}
            icon={(props: any) =>
              props.isLeaf ? (
                <FileOutlined style={{ color: darkColors.textMuted, fontSize: 12 }} />
              ) : props.expanded ? (
                <FolderOpenOutlined style={{ color: darkColors.accentCyan, fontSize: 12 }} />
              ) : (
                <FolderOutlined style={{ color: darkColors.textMuted, fontSize: 12 }} />
              )
            }
            onSelect={handleSelect}
            style={{ background: 'transparent', fontSize: 12.5 }}
          />
        )}
      </div>
    </div>
  );
}
