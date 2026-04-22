// 知识库顶层容器：仅作为路由 Outlet 宿主。
// 真正的内容拆到 SkillsHome / SkillBucketDetail / CodeSamplesHome。
// 高度由各子页自己撑（每个子页都用 calc(100vh - 48px)）。
import { Outlet } from 'react-router-dom';
import { useColors } from '../../theme';

export default function KnowledgeBase() {
  const c = useColors();
  return (
    <div style={{ background: c.bg, minHeight: 'calc(100vh - 48px)' }}>
      <Outlet />
    </div>
  );
}
