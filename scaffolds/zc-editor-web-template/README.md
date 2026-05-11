<p align="center">
 <img src="https://img.shields.io/github/license/YunaiV/ruoyi-vue-pro"/>
</p>

# 智搭 - 零代码平台

**社区版：完整的零代码平台，包含带关系的实体模型元数据建模，自动创建修改数据库中的表结构，后端crud接口自动生成；页面和表单可视化编辑器，支持公式，支持元数据驱动的带关系的crud界面一键生成和高级图表功能；基于liteflow的完善的服务编排功能，可视化配置接口逻辑，支持分支循环组件、crud组件、sql和js组件、调用服务编排和发送http请求等各种组件，支持公式和上下文数据传递；基于flowable的高级工作流引擎功能，支持填写、审批和service等各种节点，service节点支持调用crud和服务编排等功能，支持公式和上下文数据传递；支持可视化大屏开发，数据可对接服务编排的接口数据或外部接口数据；支持功能权限、资源权限、行权限、应用权限各种维度的权限控制，保障系统安全可靠；支持开发环境，测试环境，正式环境数据隔离，工作流程为在开发环境开发，完成后发布到测试环境测试，通过后发布到正式环境使用，系统支持任意环境任意版本恢复到开发环境开发，然后重新发布。**

**企业版：在社区版完整的零代码平台功能的基础上，支持生成可独立部署的应用的前后端代码的功能，并且包含与之配套的低代码平台的相关功能。生成后的应用既能通过mybatis和编码开发界面的传统方式开发，又能通过元数据驱动和可视化方式开发。企业版还包含应用内多租户的SAAS功能支持、平台内应用接口共享及OpenAPI接口外部共享、应用会员和支付管理、移动端支持、3D模块等高级功能。**

如果这个项目让你有所收获，记得 Star 关注哦，这对我们是非常不错的鼓励与支持。

## 🐶 新手必读

* 企业版地址：<http://app.xinnuojinzhi.com>
* 智搭平台开发操作详细演示：<http://product.xinnuojinzhi.com/column/course/details?id=2>

## 快速开始

```
npm install
npm run dev
```

## 修改门户登录页（如：增加轮播背景图）
1. **背景图配置**：在门户编辑界面中，可为登录页配置背景图。配置规则如下：已配置：从门户预览退出至登录页时，将显示所配置的背景图。未配置：登录页将回退显示默认背景图。
2. **登录页定制**：完成「生成后组件名称」配置后，可在以下路径对登录页的视觉效果进行自定义修改`src/pages/user/login/<组件名称>/index.tsx`。注意：登录页的配置项内容本身不可修改，仅可对页面的视觉呈现（如布局、样式、背景效果等）进行调整。
3. 轮播背景图配置
Ant Design 提供 Carousel 轮播组件，支持自动播放、播放间隔、过渡效果等配置。以下为轮播背景图的参考实现：
```javascript
<Carousel
  autoplay
  autoplaySpeed={3000}
  dots={false}
  effect="fade"
>
  {backgroundImages.map((src: string, index: number) => (
    <div key={index}>
      <img
        className={styles.carouselImage}
        src={src}
        alt={`background-${index}`}
      />
    </div>
  ))}
</Carousel>
```

## 占位组件使用 antv g2二开自定义温度计图表
1. **找到占位组件的页面**：通过pageCode, 在`src/pages/Business/PageFcw7q0m3op34/PageFcw7q0m3op34Schema.tsx` 
2. **引入二开自定义温度计图表**: <Thermometer currentTemp={value} min={0} max={100} unit="°C" /> currentTemp代表当前接口轮询接口的返回值。
3. **二开自定义温度计图表的代码如下**：
```javascript
import { useEffect, useRef } from 'react';
import { Chart } from '@antv/g2';

// G2 5.4.8 垂直温度计
const Thermometer = ({ currentTemp = 0,
  min = 0,
  max = 100,
  unit = '°C',
  widthVal = 120,
  heightVal = 360
}) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: heightVal,
      width: widthVal,
    });

    // 全局配置
    chart.options({
      axis: false,
      legend: false,
      tooltip: false,
    });

    // 坐标系
    chart.coordinate({ type: 'cartesian' });
    chart.scale('x', { padding: 0.3 });
    // 1. 温度计背景管
    chart
      .interval()
      .data([{ type: 'tube', y: max }])
      .encode('x', 'type')
      .encode('y', 'y')
      .scale({ y: { domain: [min, max] } })
      .style({
        fill: '#E8E8E8',
        stroke: '#D0D0D0',
        radius: 20,
        width: 28,
      });

    // 2. 水银柱（保存引用用于更新）
    const mercury = chart
      .interval()
      .data([{ type: 'liquid', y: currentTemp }])
      .encode('x',  () => 'tube')
      .encode('y', 'y')
      .style({
        fill: '#FF3030',
        radius: 20,
        width: 26,
      })
      .animate('enter', { duration: 500 })
      .animate('update', { duration: 400, easing: 'easeQuadOut' });

    // 3. 底部圆球
    chart
      .point()
      .data([{ x: 'liquid', y: 0 }])
      .encode('x', () => 'tube')
      .encode('y', 'y')
      .encode('size', 15)
      .style({
        fill: '#FF3030',
        stroke: '#fff',
        lineWidth: 2,
      });

    // 4. 文字（保存引用用于更新）
    const text = chart
      .text()
      .data([{ x: 'liquid', y: max / 2, text: `${currentTemp.toFixed(1)}${unit}` }])
      .encode('x', 'x')
      .encode('y', 'y')
      .encode('text', 'text')
      .style({
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#333',
        textAlign: 'center',
      });

    chart.render();
    chartRef.current = { mercury, text }; // 保存元素引用

    return () => chart.destroy();
  }, [min, max]);

  useEffect(() => {
    if (!chartRef.current) return;
    const { mercury, text } = chartRef.current;

    // 更新水银柱
    mercury.changeData([{ type: 'liquid', y: currentTemp }]);

    // 更新文字
    text.changeData([
      { x: 'liquid', y: max / 2, text: `${currentTemp.toFixed(1)}${unit}` },
    ]);
  }, [currentTemp, max]);

  return <div ref={containerRef} style={{ margin: '0 auto' }} />;
};

export default Thermometer;
```
4. 安装依赖，命令： npm install @antv/g2@5.4.8 --legacy-peer-deps
