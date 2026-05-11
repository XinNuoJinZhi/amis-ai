import React from 'react';
import { Checkbox, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export interface MatrixColumn {
  label: string;
  col?: string;
}

export interface MatrixRow {
  label: string;
  row?: string;
}

export interface MatrixValue {
  label?: string;
  checked: boolean;
}

export interface MatrixCheckboxesProps {
  columns: MatrixColumn[];
  rows: MatrixRow[];
  rowLabel?: string;
  value?: MatrixValue[][];
  defaultValue?: MatrixValue[][];
  onChange?: (value: MatrixValue[][]) => void;
  multiple?: boolean;
  singleSelectMode?: 'cell' | 'row' | 'column';
  xCheckAll?: boolean;
  yCheckAll?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  disabled?: boolean;
  style?: React.CSSProperties;
}

const MatrixCheckboxes: React.FC<MatrixCheckboxesProps> = ({
  columns = [],
  rows = [],
  rowLabel,
  value,
  defaultValue,
  onChange,
  multiple = true,
  singleSelectMode = 'column',
  xCheckAll = false,
  yCheckAll = false,
  textAlign = 'center',
  disabled = false,
  style,
}) => {
  // 初始化矩阵值 (按 ZC Amis 格式: value[columnIndex][rowIndex])
  // 注意：当 value 是空数组时，需要使用默认值
  const buildDefaultValue = () => columns.map((col) => rows.map((row) => ({ ...row, ...col, checked: false })));
  const matrixValue = (value && value.length > 0) ? value : (defaultValue && defaultValue.length > 0) ? defaultValue : buildDefaultValue();

  // 处理单元格点击 (x=colIndex, y=rowIndex)
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (disabled) return;

    const newValue = matrixValue.map((col, x) =>
      col.map((cell, y) => {
        if (x === colIndex && y === rowIndex) {
          return { ...cell, checked: !cell.checked };
        }
        if (!multiple) {
          // 单选模式
          if (singleSelectMode === 'cell') {
            return { ...cell, checked: false };
          }
          if (singleSelectMode === 'row' && y === rowIndex) {
            return { ...cell, checked: false };
          }
          if (singleSelectMode === 'column' && x === colIndex) {
            return { ...cell, checked: false };
          }
        }
        return cell;
      })
    );

    // 单选模式下设置当前单元格为选中
    if (!multiple) {
      newValue[colIndex][rowIndex].checked = true;
    }

    onChange?.(newValue);
  };

  // 处理行全选 (遍历所有列的该行)
  const handleRowCheckAll = (rowIndex: number, checked: boolean) => {
    if (disabled) return;
    const newValue = matrixValue.map((col) =>
      col.map((cell, y) => (y === rowIndex ? { ...cell, checked } : cell))
    );
    onChange?.(newValue);
  };

  // 处理列全选 (遍历该列的所有行)
  const handleColCheckAll = (colIndex: number, checked: boolean) => {
    if (disabled) return;
    const newValue = matrixValue.map((col, x) =>
      col.map((cell) => (x === colIndex ? { ...cell, checked } : cell))
    );
    onChange?.(newValue);
  };

  // 检查行是否全选 (检查所有列的该行)
  const isRowAllChecked = (rowIndex: number) => {
    if (!matrixValue.length) return false;
    return matrixValue.every((col) => col[rowIndex]?.checked);
  };

  // 检查行是否部分选中 (至少一个选中但不是全选)
  const isRowIndeterminate = (rowIndex: number) => {
    if (!matrixValue.length) return false;
    const checkedCount = matrixValue.filter((col) => col[rowIndex]?.checked).length;
    return checkedCount > 0 && checkedCount < matrixValue.length;
  };

  // 检查列是否全选 (检查该列的所有行)
  const isColAllChecked = (colIndex: number) => {
    return matrixValue[colIndex]?.every((cell) => cell.checked) ?? false;
  };

  // 检查列是否部分选中 (至少一个选中但不是全选)
  const isColIndeterminate = (colIndex: number) => {
    if (!matrixValue[colIndex]) return false;
    const checkedCount = matrixValue[colIndex].filter((cell) => cell.checked).length;
    return checkedCount > 0 && checkedCount < matrixValue[colIndex].length;
  };

  // 构建表格列
  const tableColumns: ColumnsType<any> = [
    {
      title: rowLabel || '',
      dataIndex: 'rowLabel',
      key: 'rowLabel',
      fixed: 'left',
      width: 120,
      render: (_: any, record: any, rowIndex: number) => (
        <>
          {xCheckAll && multiple && (
            <Checkbox
              checked={isRowAllChecked(rowIndex)}
              indeterminate={isRowIndeterminate(rowIndex)}
              onChange={(e) => handleRowCheckAll(rowIndex, e.target.checked)}
              disabled={disabled}
              style={{ marginRight: 8 }}
            />
          )}
          {record.rowLabel}
        </>
      ),
    },
    ...columns.map((col, colIndex) => ({
      title: yCheckAll && multiple ? (
        <div style={{ textAlign }}>
          <Checkbox
            checked={isColAllChecked(colIndex)}
            indeterminate={isColIndeterminate(colIndex)}
            onChange={(e) => handleColCheckAll(colIndex, e.target.checked)}
            disabled={disabled}
          >
            {col.label}
          </Checkbox>
        </div>
      ) : (
        col.label
      ),
      dataIndex: `col_${colIndex}`,
      key: `col_${colIndex}`,
      align: textAlign as 'left' | 'center' | 'right',
      render: (_: any, record: any, rowIndex: number) => (
        <Checkbox
          checked={matrixValue[colIndex]?.[rowIndex]?.checked}
          onChange={() => handleCellClick(rowIndex, colIndex)}
          disabled={disabled}
        />
      ),
    })),
  ];

  // 构建表格数据
  const tableData = rows.map((row, rowIndex) => ({
    key: rowIndex,
    rowLabel: row.label,
  }));

  return (
    <Table
      columns={tableColumns}
      dataSource={tableData}
      pagination={false}
      bordered
      size="small"
      style={style}
    />
  );
};

export default MatrixCheckboxes;
