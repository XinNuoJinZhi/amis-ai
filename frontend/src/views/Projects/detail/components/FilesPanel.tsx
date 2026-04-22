import { useColors } from '../../../../theme';
import FileTreePanel from '../panels/FileTreePanel';
import EditorPanel from '../panels/EditorPanel';

interface Props {
  taskId: number;
}

/**
 * WorkspaceView 下"文件" Tab 的内容：
 * 左侧文件树 + 右侧 Monaco 编辑器，内部再分两栏。
 */
export default function FilesPanel({ taskId }: Props) {
  const c = useColors();

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, background: c.bg }}>
      <div style={{ width: 240, flexShrink: 0, minHeight: 0 }}>
        <FileTreePanel taskId={taskId} enabled />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <EditorPanel taskId={taskId} />
      </div>
    </div>
  );
}
