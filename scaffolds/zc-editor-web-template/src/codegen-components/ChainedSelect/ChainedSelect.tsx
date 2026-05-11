import React, { useState, useEffect, useCallback } from 'react';
import { Select, Space, Spin } from 'antd';

export interface ChainedSelectProps {
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  loadOptions: (parentId: any, level: number) => Promise<any[]>;
  options?: any[];
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  joinValues?: boolean;
  delimiter?: string;
  labelField?: string;
  valueField?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface StackItem {
  options: any[];
  loading: boolean;
}

/**
 * 链式下拉框组件
 * 用于实现无限级别下拉选择
 */
export const ChainedSelect: React.FC<ChainedSelectProps> = ({
  value,
  onChange,
  loadOptions,
  placeholder = '请选择',
  disabled = false,
  joinValues = true,
  delimiter = ',',
  labelField = 'label',
  valueField = 'value',
  className,
  style,
}) => {
  const [stack, setStack] = useState<StackItem[]>([{ options: [], loading: true }]);

  // 解析 value 为数组
  const parseValue = useCallback((val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(delimiter);
    return [];
  }, [delimiter]);

  const valueArr = parseValue(value);

  // 加载初始选项
  useEffect(() => {
    loadOptions(undefined, 0).then(options => {
      setStack([{ options, loading: false }]);
    });
  }, [loadOptions]);

  // 当 value 变化时，加载对应层级的选项
  useEffect(() => {
    if (valueArr.length === 0) return;

    const loadNextLevels = async () => {
      const newStack: StackItem[] = [...stack];

      for (let i = 0; i < valueArr.length; i++) {
        const parentId = valueArr[i];
        if (i + 1 >= newStack.length) {
          // 需要加载下一级
          const nextOptions = await loadOptions(parentId, i + 1);
          if (nextOptions && nextOptions.length > 0) {
            newStack.push({ options: nextOptions, loading: false });
          }
        }
      }

      setStack(newStack);
    };

    loadNextLevels();
  }, [value]);

  // 处理选择变化
  const handleChange = async (index: number, selectedValue: string) => {
    const newValueArr = valueArr.slice(0, index);
    if (selectedValue !== undefined) {
      newValueArr.push(selectedValue);
    }

    // 更新 stack，移除后续层级
    const newStack = stack.slice(0, index + 1);

    // 加载下一级选项
    if (selectedValue !== undefined) {
      const nextOptions = await loadOptions(selectedValue, index + 1);
      if (nextOptions && nextOptions.length > 0) {
        newStack.push({ options: nextOptions, loading: false });
      }
    }

    setStack(newStack);

    // 触发 onChange
    const newValue = joinValues ? newValueArr.join(delimiter) : newValueArr;
    onChange?.(newValue);
  };

  return (
    <Space className={className} style={style} wrap>
      {stack.map((item, index) => (
        <Select
          key={index}
          value={valueArr[index]}
          onChange={(val) => handleChange(index, val)}
          placeholder={placeholder}
          disabled={disabled}
          loading={item.loading}
          style={{ minWidth: 120 }}
          allowClear
          options={item.options.map(opt => ({
            label: opt[labelField],
            value: opt[valueField],
          }))}
        />
      ))}
      {stack[stack.length - 1]?.loading && <Spin size="small" />}
    </Space>
  );
};

export default ChainedSelect;
