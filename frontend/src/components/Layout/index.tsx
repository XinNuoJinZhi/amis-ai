import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getProfile } from '../../services/auth';
import { getPendingCount } from '../../services/codeSamples';
import { getSystemSetting } from '../../services/systemSettings';
import { Badge, Layout, Button, Avatar, Dropdown, Tooltip } from 'antd';
import {
  MessageOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  ReadOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  RocketOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  RightOutlined,
  DownOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  ControlOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores';
import { useColors, useThemeMode } from '../../theme';
import type { ColorPalette } from '../../theme';

const { Header, Sider, Content } = Layout;

interface NavItem {
  /** 类型：item=普通菜单项；group-title=分组标题（仅展示，不可点） */
  type?: 'item' | 'group-title';
  /** 路由 key；有 children 时父项 key 仅作分组标识（点击不导航，只展开/折叠） */
  key: string;
  icon?: React.ReactNode;
  label: string;
  /** 仅 admin 用户可见的菜单项（如知识库管理） */
  adminOnly?: boolean;
  /** 子菜单（父项不可路由，只用于分组） */
  children?: NavItem[];
  /** 2026-04：菜单右侧角标（0 / undefined 时不显示），用于 RAG 待审数等 */
  badge?: number;
}

// 2026-04-25 菜单重组：按业务把项目分两组——「生成 Amis」（自然语言 → JSON）/「Amis 生码」（JSON → 项目）。
// 顶部 AI 对话独立置顶；底部系统设置带二级菜单（与知识库一致）。
const navItems: NavItem[] = [
  { key: '/chat', icon: <MessageOutlined />, label: 'AI 对话' },
  { type: 'group-title', key: 'group:amis-gen', label: '生成 Amis' },
  { key: '/amis', icon: <ThunderboltOutlined />, label: 'Amis 生成' },
  { key: '/history', icon: <HistoryOutlined />, label: '生成历史' },
  { key: '/templates', icon: <AppstoreOutlined />, label: '模板库' },
  { type: 'group-title', key: 'group:amis-code', label: 'Amis 生码' },
  { key: '/projects', icon: <RocketOutlined />, label: '项目工作台' },
  // 知识库菜单仅对 admin 可见，下方根据 user.is_admin 过滤
  {
    key: '/knowledge-base',
    icon: <ReadOutlined />,
    label: '知识库',
    adminOnly: true,
    children: [
      { key: '/knowledge-base/skills', icon: <FileTextOutlined />, label: 'Skills 规则手册' },
      { key: '/knowledge-base/code-samples', icon: <DatabaseOutlined />, label: 'RAG 样例库' },
    ],
  },
  { type: 'group-title', key: 'group:divider', label: '' },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
    children: [
      { key: '/settings/providers', icon: <ApiOutlined />, label: '供应商管理' },
      { key: '/settings/configs', icon: <ControlOutlined />, label: '模型配置' },
      { key: '/settings/system', icon: <ToolOutlined />, label: '系统配置' },
    ],
  },
];

function LogoSquare({ collapsed, c }: { collapsed: boolean; c: ColorPalette }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 14px',
        height: 48,
        borderBottom: `1px solid ${c.borderSubtle}`,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          background: c.text,
          color: c.primaryContrast,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        A
      </div>
      {!collapsed && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 600,
            color: c.text,
            letterSpacing: 0.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          amis-ai
        </span>
      )}
    </div>
  );
}

/// 分组标题（生成 Amis / Amis 生码 / 系统设置上方分隔线等）。
/// - 折叠态统一只画一条细分隔线，不显示文字。
/// - 展开态：有 label 显示成大写小字标题，没 label 当分隔线用。
function GroupTitle({
  label,
  collapsed,
  c,
}: {
  label: string;
  collapsed: boolean;
  c: ColorPalette;
}) {
  if (collapsed || !label) {
    return (
      <div
        style={{
          height: 1,
          background: c.borderSubtle,
          margin: collapsed ? '6px 8px' : '8px 4px 4px',
        }}
      />
    );
  }
  return (
    <div
      style={{
        padding: '12px 12px 4px',
        fontSize: 10,
        fontWeight: 600,
        color: c.textSubtle,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  );
}

function NavButton({
  item,
  active,
  collapsed,
  c,
  onClick,
  indent = 0,
  expandIcon,
  hideIconInIndent = false,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  c: ColorPalette;
  onClick: () => void;
  /** 缩进层级（子菜单为 1） */
  indent?: number;
  /** 父项右侧的展开/折叠图标 */
  expandIcon?: React.ReactNode;
  /** 缩进项是否隐藏 icon（用更小的圆点替代） */
  hideIconInIndent?: boolean;
}) {
  const showLeftIcon = !(indent > 0 && hideIconInIndent);
  const btn = (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        height: indent > 0 ? 28 : 32,
        padding: collapsed
          ? '0'
          : indent > 0
          ? `0 10px 0 ${10 + indent * 18}px`
          : '0 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: active ? c.surfaceElevated : 'transparent',
        border: 'none',
        borderRadius: 6,
        color: active ? c.text : c.textMuted,
        fontSize: indent > 0 ? 12.5 : 13,
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        transition: 'all 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = c.surfaceElevated;
        e.currentTarget.style.color = c.text;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = active ? c.text : c.textMuted;
      }}
    >
      {showLeftIcon && (
        <span style={{ fontSize: indent > 0 ? 13 : 16, display: 'flex', alignItems: 'center' }}>
          {item.icon}
        </span>
      )}
      {!collapsed && (
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {item.label}
          {(item.badge ?? 0) > 0 && (
            <Badge
              count={item.badge}
              size="small"
              overflowCount={99}
              style={{ boxShadow: 'none' }}
            />
          )}
        </span>
      )}
      {!collapsed && expandIcon && (
        <span style={{ display: 'flex', alignItems: 'center', fontSize: 10, opacity: 0.6 }}>
          {expandIcon}
        </span>
      )}
    </button>
  );

  return collapsed ? (
    // 折叠态：用 AntD Badge dot 模式加在按钮外层，避免遮挡 icon
    (item.badge ?? 0) > 0 ? (
      <Tooltip title={`${item.label}（${item.badge} 待审）`} placement="right">
        <Badge count={item.badge} size="small" overflowCount={99} offset={[-4, 4]}>
          {btn}
        </Badge>
      </Tooltip>
    ) : (
      <Tooltip title={item.label} placement="right">{btn}</Tooltip>
    )
  ) : (
    btn
  );
}

/// 渲染单个顶级 nav 节点；如果带 children 则展开/折叠并递归渲染子项。
function NavGroup({
  item,
  collapsed,
  c,
  pathname,
  navigate,
  defaultExpanded,
}: {
  item: NavItem;
  collapsed: boolean;
  c: ColorPalette;
  pathname: string;
  navigate: (path: string) => void;
  defaultExpanded: boolean;
}) {
  const hasChildren = !!item.children?.length;
  const childActive = (k: string) =>
    pathname === k || pathname.startsWith(k + '/');
  const anyChildActive = !!item.children?.some((c2) => childActive(c2.key));
  const selfActive = pathname === item.key || pathname.startsWith(item.key + '/');
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded || anyChildActive);

  // 仅在 pathname 变化时根据"是否落在子项里"调整：
  //   - 进入子项 → 自动展开
  //   - 离开子项（去别的顶级菜单）→ 不动（保留用户上一次的偏好）
  // 关键：不依赖 expanded，避免"用户折叠 → 立刻被自动反弹"的死循环（之前的 bug）。
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (anyChildActive) setExpanded(true);
    }
  }, [pathname, anyChildActive]);

  if (!hasChildren) {
    return (
      <NavButton
        item={item}
        collapsed={collapsed}
        c={c}
        active={selfActive}
        onClick={() => navigate(item.key)}
      />
    );
  }

  // 折叠态：父项展示为单按钮 + tooltip 列出子项；点击直接跳第一个子项
  if (collapsed) {
    const firstChild = item.children![0];
    const tooltipContent = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
        <div style={{ fontWeight: 600, color: c.text, fontSize: 12 }}>{item.label}</div>
        {item.children!.map((ch) => (
          <button
            key={ch.key}
            onClick={(e) => {
              e.stopPropagation();
              navigate(ch.key);
            }}
            style={{
              background: childActive(ch.key) ? c.surfaceElevated : 'transparent',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              color: childActive(ch.key) ? c.text : c.textMuted,
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left' as const,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12 }}>{ch.icon}</span>
            <span>{ch.label}</span>
          </button>
        ))}
      </div>
    );
    return (
      <Tooltip title={tooltipContent} placement="right" trigger="hover">
        <span>
          <NavButton
            item={item}
            collapsed
            c={c}
            active={anyChildActive}
            onClick={() => navigate(firstChild.key)}
          />
        </span>
      </Tooltip>
    );
  }

  // 展开态：父按钮（点击切换展开） + 缩进子按钮
  return (
    <>
      <NavButton
        item={item}
        collapsed={false}
        c={c}
        active={anyChildActive}
        expandIcon={expanded ? <DownOutlined /> : <RightOutlined />}
        onClick={() => setExpanded((e) => !e)}
      />
      {expanded &&
        item.children!.map((ch) => (
          <NavButton
            key={ch.key}
            item={ch}
            collapsed={false}
            c={c}
            indent={1}
            active={childActive(ch.key)}
            onClick={() => navigate(ch.key)}
          />
        ))}
    </>
  );
}

function Breadcrumbs({ pathname, c }: { pathname: string; c: ColorPalette }) {
  const item = navItems.find((n) => pathname === n.key || pathname.startsWith(n.key + '/'));
  const current = item?.label ?? '';
  const segments = pathname.split('/').filter(Boolean);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: c.textMuted,
      }}
    >
      <span style={{ color: c.textSubtle }}>amis-ai</span>
      <span style={{ color: c.textSubtle }}>/</span>
      <span style={{ color: c.text }}>{current || segments[0] || ''}</span>
      {segments.length > 1 && (
        <>
          <span style={{ color: c.textSubtle }}>/</span>
          <span style={{ color: c.textMuted }}>{segments.slice(1).join('/')}</span>
        </>
      )}
    </div>
  );
}

export default function AppLayout() {
  const c = useColors();
  const { mode, toggle } = useThemeMode();
  const { token: authToken, user, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // mount 时拉一次最新 profile，把 localStorage 里可能过时的 user 字段（如新增的 is_admin）覆盖掉。
  // 否则后端加了字段后，老 token 用户登录前一直拿不到。
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    void getProfile()
      .then((freshUser) => {
        if (!cancelled && freshUser) setAuth(authToken, freshUser);
      })
      .catch(() => { /* 静默：401 会被 axios 拦截器处理 */ });
    return () => { cancelled = true; };
  }, [authToken, setAuth]);

  // 2026-04 Phase 0：admin 轮询 RAG 待审数量（用于菜单 Badge 角标）
  // 周期由 system_settings.rag.pending_badge.poll_interval_sec 控制，默认 60s
  // 同时监听 'rag:pending-changed' 自定义事件——业务侧（通过/拒绝/删除）成功后立即重拉，
  // 不必等下一个轮询窗口。事件源：CodeSamplesHome 的 onApprove/onReject/onDelete/批量动作。
  const [pendingCount, setPendingCount] = useState<number>(0);
  useEffect(() => {
    if (!authToken || user?.is_admin !== true) return;
    let cancelled = false;
    let timer: number | null = null;

    const fetchOnce = async () => {
      try {
        const resp = await getPendingCount();
        if (!cancelled) setPendingCount(resp.pending ?? 0);
      } catch {
        /* 静默：Badge 挂了不打断 */
      }
    };

    const onBusinessTrigger = () => { void fetchOnce(); };
    window.addEventListener('rag:pending-changed', onBusinessTrigger);

    const scheduleLoop = async () => {
      // 读周期配置（失败走默认 60s）
      let intervalSec = 60;
      try {
        const cfg = await getSystemSetting('rag.pending_badge.poll_interval_sec');
        const n = Number(cfg?.value);
        if (!Number.isNaN(n) && n >= 10 && n <= 3600) intervalSec = n;
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      await fetchOnce();
      timer = window.setInterval(() => { void fetchOnce(); }, intervalSec * 1000);
    };

    void scheduleLoop();
    return () => {
      cancelled = true;
      if (timer != null) window.clearInterval(timer);
      window.removeEventListener('rag:pending-changed', onBusinessTrigger);
    };
  }, [authToken, user?.is_admin]);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('amis-ai:sider-collapsed');
    return saved === '1';
  });

  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  const dropdownItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const siderWidth = collapsed ? 56 : 220;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('amis-ai:sider-collapsed', next ? '1' : '0');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: c.bg }}>
      <Sider
        width={siderWidth}
        style={{
          background: c.bg,
          borderRight: `1px solid ${c.border}`,
          transition: 'width 180ms ease',
          overflow: 'hidden',
        }}
        trigger={null}
        collapsedWidth={56}
        collapsible
        collapsed={collapsed}
      >
        <LogoSquare collapsed={collapsed} c={c} />
        <div
          style={{
            padding: collapsed ? '8px 6px' : '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {navItems
            // RBAC：非 admin 隐藏 adminOnly 菜单。直接访问 URL 时后端 403 兜底。
            .filter((n) => !n.adminOnly || user?.is_admin === true)
            .map((n) => {
              // 分组标题/分隔线：占独立一行，不进 NavGroup
              if (n.type === 'group-title') {
                return (
                  <GroupTitle
                    key={n.key}
                    label={n.label}
                    collapsed={collapsed}
                    c={c}
                  />
                );
              }
              // 2026-04 Phase 0：给「RAG 样例库」子菜单挂 pending 数角标
              let decorated: NavItem = n;
              if (n.children?.length) {
                const updatedChildren = n.children.map((ch) =>
                  ch.key === '/knowledge-base/code-samples'
                    ? { ...ch, badge: pendingCount }
                    : ch
                );
                decorated = { ...n, children: updatedChildren };
              }
              return (
                <NavGroup
                  key={decorated.key}
                  item={decorated}
                  collapsed={collapsed}
                  c={c}
                  pathname={location.pathname}
                  navigate={navigate}
                  defaultExpanded={false}
                />
              );
            })}
        </div>
      </Sider>
      <Layout style={{ background: c.bg }}>
        <Header
          style={{
            background: c.bg,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${c.border}`,
            height: 48,
            lineHeight: '48px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              size="small"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              style={{ color: c.textMuted }}
            />
            <Breadcrumbs pathname={location.pathname} c={c} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tooltip title={mode === 'dark' ? '切到浅色' : '切到深色'} placement="bottom">
              <Button
                type="text"
                size="small"
                icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggle}
                style={{
                  color: c.textMuted,
                  width: 32,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Tooltip>
            <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
              <Button
                type="text"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 32,
                  color: c.text,
                }}
              >
                <Avatar
                  size={22}
                  icon={<UserOutlined />}
                  style={{ background: c.surfaceElevated, color: c.text }}
                />
                <span style={{ fontSize: 12 }}>{user?.username || '用户'}</span>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 0,
            background: c.bg,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
