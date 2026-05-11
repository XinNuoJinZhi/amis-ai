# RichTextEditor 富文本编辑器组件

基于原生 TinyMCE 的 React 富文本编辑器组件，提供完整的富文本编辑功能。

## 特性

- 🚀 基于原生 TinyMCE，功能强大
- 📝 支持完整的富文本编辑功能
- 🎨 可自定义配置和样式
- 💪 TypeScript 支持
- 🔧 提供 ref 方法进行编程式控制
- 📱 响应式设计

## 基本用法

```tsx
import React, { useState } from 'react';
import { RichTextEditor } from '@/components/RichTextEditor';

function App() {
  const [content, setContent] = useState('<p>初始内容</p>');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="请输入内容..."
    />
  );
}
```

## 高级用法

### 自定义配置

```tsx
import React, { useState } from 'react';
import { RichTextEditor } from '@/components/RichTextEditor';

function App() {
  const [content, setContent] = useState('');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      config={{
        height: 500,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'
        ],
        toolbar: 'undo redo | blocks fontsize | bold italic underline | ' +
          'alignleft aligncenter alignright | bullist numlist | ' +
          'forecolor backcolor | link image | fullscreen',
        menubar: true
      }}
    />
  );
}
```

### 使用 ref 进行编程式控制

```tsx
import React, { useRef, useState } from 'react';
import { RichTextEditor, RichTextEditorRef } from '@/components/RichTextEditor';
import { Button, Space } from 'antd';

function App() {
  const editorRef = useRef<RichTextEditorRef>(null);
  const [content, setContent] = useState('');
  const [editorStatus, setEditorStatus] = useState({
    isDirty: false,
    isReadonly: false,
    isFullscreen: false
  });

  const handleGetContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      console.log('当前内容:', content);
    }
  };

  const handleSetContent = () => {
    if (editorRef.current) {
      editorRef.current.setContent('<p>新的内容</p>');
    }
  };

  const handleInsertContent = () => {
    if (editorRef.current) {
      editorRef.current.insertContent('<p>插入的内容</p>');
    }
  };

  const handleGetSelection = () => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      console.log('选中内容:', selection);
    }
  };

  const handleToggleReadonly = () => {
    if (editorRef.current) {
      const isReadonly = editorRef.current.isReadonly();
      editorRef.current.setReadonly(!isReadonly);
    }
  };

  // 编辑器状态变化回调
  const handleStatusChange = (status) => {
    setEditorStatus(status);
    console.log('编辑器状态变化:', status);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={handleGetContent}>获取内容</Button>
        <Button onClick={handleSetContent}>设置内容</Button>
        <Button onClick={handleInsertContent}>插入内容</Button>
        <Button onClick={handleGetSelection}>获取选择</Button>
        <Button onClick={handleToggleReadonly}>切换只读</Button>
      </Space>
      
      <div style={{ marginBottom: 16 }}>
        <p>编辑器状态: 是否有更改: {editorStatus.isDirty ? '是' : '否'} | 只读模式: {editorStatus.isReadonly ? '是' : '否'}</p>
      </div>
      
      <RichTextEditor
        ref={editorRef}
        value={content}
        onChange={setContent}
        onStatusChange={handleStatusChange}
        placeholder="请输入内容..."
      />
    </div>
  );
}
```

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | string | '' | 编辑器内容 |
| onChange | (content: string) => void | - | 内容变化回调 |
| onInit | (editor: TinyMCEEditor) => void | - | 编辑器初始化完成回调 |
| onFocus | () => void | - | 编辑器获得焦点回调 |
| onBlur | () => void | - | 编辑器失去焦点回调 |
| onSelectionChange | (selection: { text: string; html: string; range: unknown }) => void | - | 选择内容变化回调 |
| onWordCountChange | (wordCount: { words: number; characters: number; charactersWithoutSpaces: number }) => void | - | 字数统计变化回调 |
| onStatusChange | (status: { isDirty: boolean; isReadonly: boolean; isFullscreen: boolean }) => void | - | 编辑器状态变化回调 |
| config | TinyMCEConfig | defaultConfig | TinyMCE 配置 |
| disabled | boolean | false | 是否禁用 |
| placeholder | string | - | 占位符 |
| className | string | - | 容器类名 |
| style | React.CSSProperties | - | 容器样式 |

### Ref 方法

#### 内容操作
| 方法 | 说明 | 类型 |
| --- | --- | --- |
| getContent | 获取编辑器内容 | () => string |
| setContent | 设置编辑器内容 | (content: string) => void |
| insertContent | 插入内容 | (content: string) => void |

#### 焦点控制
| 方法 | 说明 | 类型 |
| --- | --- | --- |
| focus | 聚焦编辑器 | () => void |
| blur | 失焦编辑器 | () => void |

#### 选择操作
| 方法 | 说明 | 类型 |
| --- | --- | --- |
| getSelection | 获取选中内容 | () => { text: string; html: string } |
| selectAll | 全选内容 | () => void |

#### 状态获取
| 方法 | 说明 | 类型 |
| --- | --- | --- |
| isDirty | 是否有未保存的更改 | () => boolean |
| isReadonly | 是否为只读模式 | () => boolean |
| getWordCount | 获取字数统计 | () => { words: number; characters: number; charactersWithoutSpaces: number } |

#### 编辑器控制
| 方法 | 说明 | 类型 |
| --- | --- | --- |
| undo | 撤销操作 | () => void |
| redo | 重做操作 | () => void |
| execCommand | 执行编辑器命令 | (command: string, value?: unknown) => void |

#### 模式切换
| 方法 | 说明 | 类型 |
| --- | --- | --- |
| setReadonly | 设置只读模式 | (readonly: boolean) => void |
| toggleFullscreen | 切换全屏模式 | () => void |

#### 高级功能
| 方法 | 说明 | 类型 |
| --- | --- | --- |
| getEditor | 获取原始TinyMCE实例 | () => TinyMCEEditor \| null |

### TinyMCEConfig

常用配置选项：

```typescript
interface TinyMCEConfig {
  height?: number;           // 编辑器高度
  menubar?: boolean;         // 是否显示菜单栏
  plugins?: string[];        // 插件列表
  toolbar?: string;          // 工具栏配置
  content_style?: string;    // 内容样式
  language?: string;         // 语言
  branding?: boolean;        // 是否显示 TinyMCE 品牌
  resize?: boolean;          // 是否可调整大小
  statusbar?: boolean;       // 是否显示状态栏
}
```

## 注意事项

1. 组件会自动加载 TinyMCE CDN 资源，首次使用时可能需要等待加载
2. 如果需要离线使用，请下载 TinyMCE 资源到本地并修改加载路径
3. 组件销毁时会自动清理 TinyMCE 实例
4. 建议在生产环境中使用 TinyMCE 的付费版本以获得更好的功能和支持

## 演示

查看 `RichTextEditorDemo.tsx` 文件获取完整的使用示例。