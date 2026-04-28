import { useEffect, useState } from 'react';
import { Button, Select, Tooltip, Space } from 'antd';
import { ReloadOutlined, ExportOutlined, CloseOutlined, RocketOutlined, MobileOutlined, DesktopOutlined } from '@ant-design/icons';
import { listTaskPages, getDevStatus, type TaskPage } from '../../../../services/projects';
import { useColors } from '../../../../theme';

// 手机视口预设（贴近主流设备真实宽度，rpx 在这个宽度下渲染才符合手机视觉）
const VIEWPORT_PRESETS = {
  'iphone-se':   { label: 'iPhone SE',   w: 375, h: 667 },
  'iphone-pro':  { label: 'iPhone Pro',  w: 390, h: 844 },
  'iphone-max':  { label: 'iPhone Max',  w: 428, h: 926 },
  'desktop':     { label: '桌面（铺满）', w: 0,   h: 0   }, // 0 = 100%
} as const;
type ViewportKey = keyof typeof VIEWPORT_PRESETS;
const VIEWPORT_STORAGE_KEY = 'amis-ai/preview-viewport';

export interface PreviewAdoptInfo {
  canAdopt: boolean;          // 任务状态允许采纳（succeeded / waiting_user）
  adopted: boolean;           // 已经采纳过
  onRequestAdopt: () => void; // 打开采纳对话框
}

interface Props {
  taskId: number;
  previewPort: number | null;
  devReady: boolean;
  adopt?: PreviewAdoptInfo;
}

// dev server Ready 后，用户可以从预览顶栏直接发起采纳；
// 用户用 ✕ 关闭后本 session 内不再打扰（sessionStorage 按 taskId 维度记）
function adoptBannerDismissKey(taskId: number) {
  return `amis-ai/adopt-banner-dismissed/${taskId}`;
}

export default function PreviewPanel({ taskId, previewPort, devReady, adopt }: Props) {
  const darkColors = useColors();
  const [pages, setPages] = useState<TaskPage[]>([]);
  const [page, setPage] = useState<string>('');
  const [reloadKey, setReloadKey] = useState(0);

  // 视口模式：默认 iphone-se（375×667），覆盖移动端任务的主流场景。
  // 关键作用：uni-app H5 的 rpx 跟视口同宽缩放（runtime 强制 documentElement.fontSize = width/23.4375），
  // PC 浏览器 iframe 100% 宽时 rpx 会成倍放大；锁 375 才能呈现手机真实视觉。
  const [viewport, setViewport] = useState<ViewportKey>(() => {
    try {
      const saved = window.localStorage.getItem(VIEWPORT_STORAGE_KEY) as ViewportKey | null;
      if (saved && saved in VIEWPORT_PRESETS) return saved;
    } catch { /* ignore */ }
    return 'iphone-se';
  });
  const setViewportPersisted = (v: ViewportKey) => {
    setViewport(v);
    try { window.localStorage.setItem(VIEWPORT_STORAGE_KEY, v); } catch { /* ignore */ }
  };
  const vp = VIEWPORT_PRESETS[viewport];
  const isMobileViewport = vp.w > 0;

  // 采纳引导 banner：dev ready 瞬间出现，用户可关闭（按 taskId 维度存 session）
  const [adoptBannerDismissed, setAdoptBannerDismissed] = useState<boolean>(() => {
    try {
      return window.sessionStorage.getItem(adoptBannerDismissKey(taskId)) === '1';
    } catch {
      return false;
    }
  });
  // 切换任务时重新读取 dismissed 状态
  useEffect(() => {
    try {
      setAdoptBannerDismissed(
        window.sessionStorage.getItem(adoptBannerDismissKey(taskId)) === '1'
      );
    } catch {
      /* ignore */
    }
  }, [taskId]);
  const dismissAdoptBanner = () => {
    try {
      window.sessionStorage.setItem(adoptBannerDismissKey(taskId), '1');
    } catch {
      /* ignore */
    }
    setAdoptBannerDismissed(true);
  };
  const showAdoptBanner =
    !!adopt && adopt.canAdopt && !adopt.adopted && devReady && !adoptBannerDismissed;

  useEffect(() => {
    if (!devReady) return;
    listTaskPages(taskId).then((p) => {
      setPages(p);
      if (p.length > 0 && !page) setPage(p[0].path);
    }).catch(() => {});
  }, [taskId, devReady]);

  // Fallback：dev 状态切换时刷新 previewPort
  useEffect(() => {
    if (devReady && previewPort == null) {
      getDevStatus(taskId).catch(() => {});
    }
  }, [taskId, devReady, previewPort]);

  // 脚手架 manifest.json 里 h5.router.mode = "history"，所以 URL 直接用路径（无 /#/）
  // listTaskPages 返回的 path 形如 "pages/index/index"（无前导 /），需要补上
  const src = (() => {
    if (!previewPort || !devReady) return null;
    const base = `http://localhost:${previewPort}`;
    if (!page) return `${base}/`;
    const normalized = page.startsWith('/') ? page : `/${page}`;
    return `${base}${normalized}`;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: darkColors.bg, minWidth: 0 }}>
      <div
        style={{
          height: 36,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${darkColors.borderSubtle}`,
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span className={devReady ? 'v0-pulse' : ''} style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: devReady ? darkColors.accentCyan : darkColors.textSubtle,
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: darkColors.textMuted,
            letterSpacing: 0.4,
          }}>
            PREVIEW{previewPort ? ` · :${previewPort}` : ''}
          </span>
          {pages.length > 0 && (
            <Select
              size="small"
              value={page || undefined}
              onChange={setPage}
              options={pages.map((p) => ({
                label: p.title || p.path,
                value: p.path,
              }))}
              style={{ minWidth: 160, maxWidth: 260 }}
              placeholder="选择页面"
            />
          )}
        </div>
        <Space size={4}>
          <Tooltip title={isMobileViewport ? '手机视口（rpx 按手机宽度渲染）' : '桌面铺满'}>
            <Select
              size="small"
              value={viewport}
              onChange={setViewportPersisted}
              style={{ minWidth: 120 }}
              suffixIcon={isMobileViewport ? <MobileOutlined /> : <DesktopOutlined />}
              options={Object.entries(VIEWPORT_PRESETS).map(([k, v]) => ({
                label: v.w > 0 ? `${v.label} ${v.w}×${v.h}` : v.label,
                value: k,
              }))}
            />
          </Tooltip>
          <Tooltip title="刷新">
            <Button
              size="small"
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => setReloadKey((k) => k + 1)}
              style={{ color: darkColors.textMuted }}
            />
          </Tooltip>
          {src && (
            <Tooltip title="新窗口打开">
              <Button
                size="small"
                type="text"
                icon={<ExportOutlined />}
                onClick={() => window.open(src, '_blank')}
                style={{ color: darkColors.textMuted }}
              />
            </Tooltip>
          )}
        </Space>
      </div>
      {showAdoptBanner && adopt && (
        <div
          style={{
            padding: '8px 12px',
            background: darkColors.surfaceElevated,
            borderBottom: `1px solid ${darkColors.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12,
            color: darkColors.text,
          }}
        >
          <RocketOutlined style={{ color: darkColors.accentCyan }} />
          <span style={{ flex: 1 }}>
            dev server 已就绪 —— 要把这份代码沉淀到 <b>RAG 样例库</b> 吗？
          </span>
          <Button
            type="primary"
            size="small"
            onClick={adopt.onRequestAdopt}
          >
            采纳到 RAG
          </Button>
          <Tooltip title="本任务本次会话内不再提示">
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={dismissAdoptBanner}
              style={{ color: darkColors.textSubtle }}
            />
          </Tooltip>
        </div>
      )}
      <div
        style={{
          flex: 1,
          // 手机视口时外层是深色面板（让"手机壳"浮起来），桌面视口时白底铺满
          background: isMobileViewport ? darkColors.bg : '#FFFFFF',
          overflow: 'auto',
          position: 'relative',
          display: isMobileViewport ? 'flex' : 'block',
          alignItems: isMobileViewport ? 'flex-start' : undefined,
          justifyContent: isMobileViewport ? 'center' : undefined,
          padding: isMobileViewport ? '24px 16px' : 0,
        }}
      >
        {src ? (
          // key 绑定到 reloadKey + page + viewport：换页/换视口时强制重建 iframe，
          // 绕开"仅 hash 变化不触发 iframe 重新导航"的浏览器怪行为，
          // 同时让 uni-app H5 runtime 重新计算 documentElement.fontSize（rpx 跟视口同步）
          <iframe
            key={`${reloadKey}-${page || 'root'}-${viewport}`}
            src={src}
            style={
              isMobileViewport
                ? {
                    width: vp.w,
                    height: vp.h,
                    maxHeight: '100%',
                    border: 'none',
                    background: '#FFFFFF',
                    borderRadius: 18,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.25)',
                    flex: '0 0 auto',
                  }
                : {
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: '#FFFFFF',
                  }
            }
            title="preview"
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: darkColors.bg,
              color: darkColors.textSubtle,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            [ WAITING FOR DEV SERVER ]
          </div>
        )}
      </div>
    </div>
  );
}
