import React, { useState, useRef } from 'react';
import { Button, Space, Card, Typography, Divider } from 'antd';
import RichTextEditor from './RichTextEditor';
import type { RichTextEditorRef } from './RichTextEditor';

const { Title, Paragraph } = Typography;

const RichTextEditorDemo: React.FC = () => {
  const [content, setContent] = useState('<p>这是一个使用原生 TinyMCE 的富文本编辑器示例</p>');
  const [disabled, setDisabled] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);

  const handleGetContent = () => {
    if (editorRef.current) {
      const currentContent = editorRef.current.getContent();
      console.log('当前内容:', currentContent);
      alert('内容已输出到控制台');
    }
  };

  const handleSetContent = () => {
    if (editorRef.current) {
      const newContent = '<p><strong>这是通过 setContent 方法设置的新内容</strong></p><ul><li>列表项 1</li><li>列表项 2</li></ul>';
      editorRef.current.setContent(newContent);
    }
  };

  const handleInsertContent = () => {
    if (editorRef.current) {
      editorRef.current.insertContent('<p>📝 这是插入的内容</p>');
    }
  };

  const handleFocus = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleToggleDisabled = () => {
    setDisabled(!disabled);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Title level={3}>TinyMCE 富文本编辑器演示</Title>
        <Paragraph>
          这是一个基于原生 TinyMCE 的 React 富文本编辑器组件，支持完整的富文本编辑功能。
        </Paragraph>
        
        <Space wrap style={{ marginBottom: '16px' }}>
          <Button onClick={handleGetContent}>获取内容</Button>
          <Button onClick={handleSetContent}>设置内容</Button>
          <Button onClick={handleInsertContent}>插入内容</Button>
          <Button onClick={handleFocus}>聚焦编辑器</Button>
          <Button onClick={handleToggleDisabled}>
            {disabled ? '启用' : '禁用'}编辑器
          </Button>
        </Space>

        <RichTextEditor
          ref={editorRef}
          value={content}
          onChange={setContent}
          disabled={disabled}
          placeholder="请输入内容..."
          config={{
            height: 400,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'
            ],
            toolbar: 'undo redo | blocks fontfamily fontsize | ' +
              'bold italic underline strikethrough | link image media table | ' +
              'alignleft aligncenter alignright alignjustify | ' +
              'bullist numlist outdent indent | forecolor backcolor removeformat | ' +
              'pagebreak | charmap emoticons | fullscreen preview save print | ' +
              'insertfile undo redo | help',
            menubar: true,
            branding: false
          }}
        />

        <Divider />
        
        <Title level={4}>当前内容预览:</Title>
        <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </Card>
      </Card>
    </div>
  );
};

export default RichTextEditorDemo;