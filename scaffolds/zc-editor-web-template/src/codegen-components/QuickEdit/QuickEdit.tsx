import React, { useState, useRef, useEffect } from 'react';
import { Popover, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import './QuickEdit.less';

interface QuickEditProps {
  value?: any;
  onChange?: (value: any) => void;
  quickEdit?: boolean | {
    mode?: 'inline' | 'popOver';
    icon?: string;
    type?: string;
    [key: string]: any;
  };
  children?: React.ReactNode;
  disabled?: boolean;
}

/**
 * QuickEdit 快速编辑组件
 * 为静态展示内容添加快速编辑功能
 */
const QuickEdit: React.FC<QuickEditProps> = ({
  value,
  onChange,
  quickEdit,
  children,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // 如果没有启用 quickEdit 或被禁用，直接返回子元素
  if (!quickEdit || disabled) {
    return <>{children}</>;
  }

  const config = typeof quickEdit === 'boolean' ? {} : quickEdit;
  const mode = config.mode || 'popOver';
  const icon = config.icon || 'fa fa-edit';

  const handleSave = () => {
    if (onChange) {
      onChange(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  // inline 模式：直接在原位置显示输入框
  if (mode === 'inline') {
    return (
      <div className="quick-edit-inline">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            autoFocus
            className="quick-edit-input"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="quick-edit-display"
          >
            {children}
          </span>
        )}
      </div>
    );
  }

  // popOver 模式：弹出框编辑
  const editContent = (
    <div className="quick-edit-popover-content">
      <input
        ref={inputRef}
        type="text"
        value={editValue || ''}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSave();
          } else if (e.key === 'Escape') {
            handleCancel();
          }
        }}
        className="quick-edit-input"
      />
      <div className="quick-edit-actions">
        <Button size="small" onClick={handleCancel}>
          取消
        </Button>
        <Button size="small" type="primary" onClick={handleSave}>
          确定
        </Button>
      </div>
    </div>
  );

  return (
    <div className="quick-edit-wrapper">
      <span className="quick-edit-display">{children}</span>
      <Popover
        content={editContent}
        trigger="click"
        open={isEditing}
        onOpenChange={setIsEditing}
        placement="topLeft"
      >
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          className="quick-edit-btn"
        />
      </Popover>
    </div>
  );
};

export default QuickEdit;
