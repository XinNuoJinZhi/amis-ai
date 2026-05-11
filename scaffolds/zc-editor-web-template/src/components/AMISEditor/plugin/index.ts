import {registerEditorPlugin, BasePlugin} from 'amis-editor';
import {
  RendererEventContext,
  SubRendererInfo,
  BasicSubRenderInfo,
  PluginInterface
} from 'amis-editor';

const mobileRenderers = [
  // 布局
  'flex',
  'grid',
  'container',
  'collapse-group',
  'tabs',
  // 数据容器
  'form',
  'service',
  // 表单项
  'input-text',
  'textarea',
  'input-number',
  'select',
  'nested-select',
  'checkboxes',
  'radios',
  'input-date',
  'input-date-range',
  'input-datetime',
  'input-time',
  'input-file',
  'input-image',
  'switch',
  'input-range',
  'search-box',
  'user-select',
  'department-select',
  // 功能
  'button',
  'audio',
  'video',
  'qrcode',
  'input-signature',
  // 展示
  'table',
  'card',
  'cards',
  'list',
  'pagination',
  'tpl',
  'icon',
  'link',
  'avatar',
  'image',
  'json',
  'progress',
  'steps',
  'divider',
  'tag',
  'tooltip-wrapper',
  'calendar',
  'input-rating',
  'alert',
  'carousel',
  // 图表
  'chart-pie',
  'chart-column',
  'chart-line'
];

// 移动端特有的组件（PC端没有的）
const mobileOnlyRenderers = [
  'load-more',
  'model-mobile-list',
  'swipe-action'
];

// 有些渲染器的rendererName是一样的，只能通过label进行过滤一下
const filterRenderersByLabel = [
  '自由容器',
  '悬浮容器',
  '水平柱状图',
  '堆叠柱状图',
  '双向对比柱状图',
  '南丁格尔玫瑰图',
  '环形图',
  '堆叠面积图'
];

export class ManagerMobilePlugin extends BasePlugin {
  order = 9999;

  buildSubRenderers(
    context: RendererEventContext,
    renderers: Array<SubRendererInfo>
  ): BasicSubRenderInfo | Array<BasicSubRenderInfo> | void {
    // 更新NPM自定义组件排序和分类
    for (let index = 0, size = renderers.length; index < size; index++) {
      // 判断是否需要隐藏 Editor预置组件
      const pluginRendererName = renderers[index].rendererName;
      const pluginRendererLabel = renderers[index].name;
      const isMobileCommon = [...mobileRenderers, ...mobileOnlyRenderers].includes(pluginRendererName);

      if (
        pluginRendererName &&
        !isMobileCommon ||
        filterRenderersByLabel.includes(pluginRendererLabel)
      ) {
        renderers[index].disabledRendererPlugin = true;
      }
    }
  }
}

export class ManagerPersonalComputerPlugin extends BasePlugin {
  order = 9999;

  buildSubRenderers(
    context: RendererEventContext,
    renderers: Array<SubRendererInfo>
  ): BasicSubRenderInfo | Array<BasicSubRenderInfo> | void {
    // 更新NPM自定义组件排序和分类
    for (let index = 0, size = renderers.length; index < size; index++) {
      // 判断是否需要隐藏 Editor预置组件
      const pluginRendererName = renderers[index].rendererName;
      const pluginRendererLabel = renderers[index].name;

      // 如果是移动端特有的组件，pc禁用
      const isMobileOnly = mobileOnlyRenderers.includes(pluginRendererName);

      if (
        pluginRendererName &&
        isMobileOnly
      ) {
        renderers[index].disabledRendererPlugin = true;
      }
    }
  }
}
