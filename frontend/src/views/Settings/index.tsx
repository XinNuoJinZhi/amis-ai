// 系统设置顶层容器：仅作为路由 Outlet 宿主。
// 真正的内容拆到 LlmProviders / ModelConfigs / SystemSettings 三个子路由。
// 与「知识库」一致，左侧菜单的「系统设置」会展开三个二级菜单项控制 URL。
import { Outlet } from 'react-router-dom';
import { useColors } from '../../theme';

export default function Settings() {
  const c = useColors();
  return (
    <div
      style={{
        background: c.bg,
        minHeight: 'calc(100vh - 48px)',
        padding: '20px 24px',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <Outlet />
    </div>
  );
}
