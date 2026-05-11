import {BasePlugin} from 'amis-editor';
import {
  RendererEventContext,
  SubRendererInfo,
  BasicSubRenderInfo
} from 'amis-editor';

const mobileRenderers = [
  // 布局
  'grid',
  'tabs',
  // 数据容器
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
  // 'input-file',
  // 'input-image',
  'switch',
  'input-range',
  'user-select',
  'department-select',
  // 功能
  'video',
  // 展示
  'tpl',
  'image',
  // 图表
  'chart-pie',
  'chart-column',
  'chart-line'
];

const PersonalComputerRenderers = [
  // 布局
  'grid',
  'tabs',
  // 数据容器
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
  'input-file',
  'input-image',
  'switch',
  'transfer-picker',
  'input-table',
  'input-rich-text',
  'input-signature',
  'dynamic-form',
  'input-range',
  'user-select',
  'department-select',
  // 展示
  'tpl',
  'image',
  'pdf-viewer',
  // 报表
  'target-number',
  'chart-percent',
  'chart-column',
  'chart-pie',
  'chart-line',
  'chart-radar',
  'chart-funnel',
  'chart-scatter',
  'chart-bubble',
  'chart-waterfall',
  'chart-word-cloud',
  'chart-map',
  'chart-scatter-map',
  'chart-calendar',
  'chart-sankey',
  // 功能
  'table-view',
  'video',
]

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

      if (
        pluginRendererName &&
        !mobileRenderers.includes(pluginRendererName) ||
        // 有些组件的rendererName是一样的，只能通过label进行过滤一下
        [
          '水平柱状图',
          '堆叠柱状图',
          '双向对比柱状图',
          '南丁格尔玫瑰图',
          '环形图',
          '堆叠面积图'
        ].includes(pluginRendererLabel)
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

      if (
        pluginRendererName &&
        !PersonalComputerRenderers.includes(pluginRendererName)
      ) {
        renderers[index].disabledRendererPlugin = true;
      }
    }
  }
}
