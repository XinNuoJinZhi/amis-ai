import React, { useState, useRef, useEffect } from 'react';
import { Anchor } from 'antd';
import type { AnchorLinkItemProps } from 'antd/es/anchor/Anchor';
import './AnchorNav.less';

export interface AnchorNavLink {
  title: string;
  href: string;
  body?: React.ReactNode;
  render?: (props: any) => React.ReactNode;
}

export interface AnchorNavProps {
  links: AnchorNavLink[];
  direction?: 'vertical' | 'horizontal';
  active?: string;
  className?: string;
  style?: React.CSSProperties;
}

const AnchorNav: React.FC<AnchorNavProps> = ({
  links = [],
  direction = 'vertical',
  active,
  className = '',
  style = {},
}) => {
  const [activeKey, setActiveKey] = useState<string>(active || links[0]?.href || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 构建 Anchor 的 items 数据
  const anchorItems: AnchorLinkItemProps[] = links.map((link) => ({
    key: link.href,
    href: `#${link.href}`,
    title: link.title,
  }));

  // 滚动监听，更新当前激活的锚点
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      // 找到当前可见的第一个区域
      for (const link of links) {
        const section = sectionRefs.current.get(link.href);
        if (!section) continue;

        const rect = section.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;

        // 如果区域顶部在可视区域内（考虑一定的偏移量）
        if (relativeTop >= -100 && relativeTop < containerHeight / 2) {
          setActiveKey(link.href);
          break;
        }
      }
    };

    const contentArea = container.querySelector('.anchor-nav-content');
    if (contentArea) {
      contentArea.addEventListener('scroll', handleScroll);
      return () => contentArea.removeEventListener('scroll', handleScroll);
    }
  }, [links]);

  // 点击锚点时滚动到对应位置
  const handleClick = (
    e: React.MouseEvent<HTMLElement>,
    link: { title: React.ReactNode; href: string }
  ) => {
    e.preventDefault();
    const href = link.href.replace('#', '');
    const section = sectionRefs.current.get(href);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveKey(href);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`anchor-nav anchor-nav-${direction} ${className}`}
      style={style}
    >
      {/* 左侧/顶部导航栏 */}
      <div className="anchor-nav-bar">
        <Anchor
          affix={false}
          items={anchorItems}
          getCurrentAnchor={() => `#${activeKey}`}
          onClick={handleClick}
          direction={direction === 'horizontal' ? 'horizontal' : 'vertical'}
        />
      </div>

      {/* 右侧/底部内容区 */}
      <div className="anchor-nav-content">
        {links.map((link) => (
          <div
            key={link.href}
            id={link.href}
            ref={(el) => {
              if (el) {
                sectionRefs.current.set(link.href, el);
              } else {
                sectionRefs.current.delete(link.href);
              }
            }}
            className="anchor-nav-section"
          >
            {/* 渲染锚点内容 */}
            {link.render ? link.render({}) : link.body}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnchorNav;
