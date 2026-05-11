import React, { useState, useMemo } from 'react'
import { Transfer, Table, Input } from 'antd'
import type { TransferProps, TransferItem } from 'antd/es/transfer'
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface'

export interface TableTransferColumn {
  dataIndex: string
  title: string
  width?: number | string
  render?: (value: any, record: any) => React.ReactNode
}

export interface TableTransferItem extends TransferItem {
  [key: string]: any
}

export interface TableTransferProps
  extends Omit<TransferProps<TableTransferItem>, 'children'> {
  columns: TableTransferColumn[]
  leftColumns?: TableTransferColumn[]
  rightColumns?: TableTransferColumn[]
  showSearch?: boolean
  searchPlaceholder?: string
  leftSearchPlaceholder?: string
  rightSearchPlaceholder?: string
}

const TableTransfer: React.FC<TableTransferProps> = ({
  columns,
  leftColumns,
  rightColumns,
  showSearch = false,
  searchPlaceholder = '请输入搜索内容',
  leftSearchPlaceholder,
  rightSearchPlaceholder,
  dataSource = [],
  targetKeys = [],
  onChange,
  disabled,
  ...restProps
}) => {
  const [leftSearchValue, setLeftSearchValue] = useState('')
  const [rightSearchValue, setRightSearchValue] = useState('')

  // 左侧数据（未选中的）
  const leftDataSource = useMemo(() => {
    const data = dataSource.filter((item) => !targetKeys.includes(item.key!))
    if (!leftSearchValue) return data
    return data.filter((item) =>
      columns.some((col) => {
        const value = item[col.dataIndex]
        return value && String(value).toLowerCase().includes(leftSearchValue.toLowerCase())
      })
    )
  }, [dataSource, targetKeys, leftSearchValue, columns])

  // 右侧数据（已选中的）
  const rightDataSource = useMemo(() => {
    const data = dataSource.filter((item) => targetKeys.includes(item.key!))
    if (!rightSearchValue) return data
    return data.filter((item) =>
      columns.some((col) => {
        const value = item[col.dataIndex]
        return value && String(value).toLowerCase().includes(rightSearchValue.toLowerCase())
      })
    )
  }, [dataSource, targetKeys, rightSearchValue, columns])

  // 转换列配置为 Table 的 columns 格式
  const convertColumns = (cols: TableTransferColumn[]): ColumnsType<TableTransferItem> => {
    return cols.map((col) => ({
      dataIndex: col.dataIndex,
      title: col.title,
      width: col.width,
      render: col.render,
      ellipsis: true,
    }))
  }

  const actualLeftColumns = leftColumns || columns
  const actualRightColumns = rightColumns || columns

  // 处理选择变化
  const handleSelectChange = (
    direction: 'left' | 'right',
    selectedKeys: string[]
  ) => {
    if (direction === 'left') {
      // 从左侧选择，添加到右侧
      const newTargetKeys = [...targetKeys, ...selectedKeys]
      onChange?.(newTargetKeys, direction, selectedKeys)
    } else {
      // 从右侧选择，从右侧移除
      const newTargetKeys = targetKeys.filter((key) => !selectedKeys.includes(key))
      onChange?.(newTargetKeys, direction, selectedKeys)
    }
  }

  // 渲染表格
  const renderTable = (
    direction: 'left' | 'right',
    data: TableTransferItem[],
    cols: TableTransferColumn[]
  ) => {
    const isLeft = direction === 'left'
    const searchValue = isLeft ? leftSearchValue : rightSearchValue
    const setSearchValue = isLeft ? setLeftSearchValue : setRightSearchValue
    const placeholder = isLeft
      ? leftSearchPlaceholder || searchPlaceholder
      : rightSearchPlaceholder || searchPlaceholder

    const rowSelection: TableRowSelection<TableTransferItem> = {
      onChange: (selectedRowKeys) => {
        handleSelectChange(direction, selectedRowKeys as string[])
      },
      getCheckboxProps: (record) => ({
        disabled: disabled || record.disabled,
      }),
    }

    return (
      <div className="table-transfer-panel">
        {showSearch && (
          <div style={{ padding: '8px 8px 0' }}>
            <Input.Search
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
              size="small"
            />
          </div>
        )}
        <Table
          rowSelection={rowSelection}
          columns={convertColumns(cols)}
          dataSource={data}
          size="small"
          pagination={false}
          scroll={{ y: 300 }}
          rowKey="key"
          style={{ pointerEvents: disabled ? 'none' : undefined }}
        />
      </div>
    )
  }

  return (
    <div className="table-transfer" style={{ display: 'flex', gap: 16 }}>
      <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 6 }}>
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #d9d9d9',
            background: '#fafafa',
          }}
        >
          源列表 ({leftDataSource.length})
        </div>
        {renderTable('left', leftDataSource, actualLeftColumns)}
      </div>
      <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 6 }}>
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #d9d9d9',
            background: '#fafafa',
          }}
        >
          目标列表 ({rightDataSource.length})
        </div>
        {renderTable('right', rightDataSource, actualRightColumns)}
      </div>
    </div>
  )
}

export default TableTransfer
