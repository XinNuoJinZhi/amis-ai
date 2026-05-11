import React, { useState, useCallback, useMemo } from 'react'
import { Table as AntTable, Space, Dropdown, Button, Checkbox } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import type { TableProps, ColumnType } from 'antd/es/table'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'

// 列配置接口
export interface TableColumn {
  key: string
  title: string
  dataIndex?: string | string[]
  width?: number
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  sortable?: boolean
  render?: (value: any, record: any, index: number) => React.ReactNode
}

// 分页配置接口
export interface TablePagination {
  current: number
  pageSize: number
  total: number
  onChange?: (page: number, pageSize: number) => void
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: (total: number, range: [number, number]) => React.ReactNode
}

// 行选择配置接口
export interface TableRowSelection {
  selectedRowKeys?: React.Key[]
  onChange?: (selectedRowKeys: React.Key[], selectedRows: any[]) => void
  getCheckboxProps?: (record: any) => any
}

// 组件属性接口
interface CodegenTableProps {
  // 数据相关
  dataSource: any[]
  loading?: boolean
  rowKey?: string | ((record: any) => string)

  // 列配置
  columns: TableColumn[]

  // 分页
  pagination?: false | TablePagination

  // Table 自己的列切换功能（对应 Amis 的 columnsTogglable）
  columnsTogglable?: boolean

  // Table 自己的工具栏（独立 Table 可以有自定义按钮）
  headerToolbar?: React.ReactNode

  // 行选择（可选）
  rowSelection?: TableRowSelection

  // 表格属性
  bordered?: boolean
  size?: 'small' | 'middle' | 'large'
  scroll?: { x?: number | string; y?: number | string }
  className?: string
  style?: React.CSSProperties
}

/**
 * Table 组件 - 纯表格展示组件
 *
 * 职责：
 * - 列配置和数据展示
 * - 列显示切换（columnsTogglable）
 * - 分页（如果配置了）
 * - 行选择（如果配置了）
 *
 * 不负责：
 * - 数据获取（由父组件或 CRUD 负责）
 * - 批量操作（由 CRUD 负责）
 * - 筛选表单（由 CRUD 负责）
 */
const CodegenTable: React.FC<CodegenTableProps> = (props) => {
  const {
    dataSource: rawDataSource = [],
    loading = false,
    rowKey = 'id',
    columns = [],
    pagination = false,
    columnsTogglable = false,
    headerToolbar,
    rowSelection,
    bordered = true,
    size = 'middle',
    scroll,
    className,
    style,
  } = props

  // 确保 dataSource 始终是数组
  const dataSource = useMemo(() => {
    if (Array.isArray(rawDataSource)) {
      return rawDataSource
    }
    // 如果不是数组，返回空数组并打印警告
    console.warn('Table: dataSource 必须是数组，当前值为:', rawDataSource)
    return []
  }, [rawDataSource])

  // 列显示状态
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    columns.forEach((col) => {
      initial[col.key] = true
    })
    return initial
  })

  // 切换列显示
  const toggleColumn = useCallback((key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }, [])

  // 全选/取消全选列
  const toggleAllColumns = useCallback((checked: boolean) => {
    const newVisible: Record<string, boolean> = {}
    columns.forEach((col) => {
      newVisible[col.key] = checked
    })
    setVisibleColumns(newVisible)
  }, [columns])

  // 过滤可见列
  const visibleColumnsConfig = useMemo(() => {
    return columns.filter((col) => visibleColumns[col.key])
  }, [columns, visibleColumns])

  // 转换为 Ant Design Table 的列配置
  const tableColumns: ColumnType<any>[] = useMemo(() => {
    return visibleColumnsConfig.map((col) => {
      const column: ColumnType<any> = {
        key: col.key,
        title: col.title,
        dataIndex: col.dataIndex || col.key,
        width: col.width,
        align: col.align,
        fixed: col.fixed,
        sorter: col.sortable
          ? (a, b) => {
              const aVal = col.dataIndex
                ? Array.isArray(col.dataIndex)
                  ? col.dataIndex.reduce((obj, key) => obj?.[key], a)
                  : a[col.dataIndex]
                : a[col.key]
              const bVal = col.dataIndex
                ? Array.isArray(col.dataIndex)
                  ? col.dataIndex.reduce((obj, key) => obj?.[key], b)
                  : b[col.dataIndex]
                : b[col.key]
              if (typeof aVal === 'string') return aVal.localeCompare(bVal)
              return aVal - bVal
            }
          : undefined,
      }

      if (col.render) {
        column.render = col.render
      }

      return column
    })
  }, [visibleColumnsConfig])

  // 列显示切换下拉菜单
  const columnsTogglerMenu = useMemo(() => {
    const allChecked = columns.every((col) => visibleColumns[col.key])
    const indeterminate = columns.some((col) => visibleColumns[col.key]) && !allChecked

    return {
      items: [
        {
          key: 'all',
          label: (
            <Checkbox
              checked={allChecked}
              indeterminate={indeterminate}
              onChange={(e: CheckboxChangeEvent) => toggleAllColumns(e.target.checked)}
            >
              全选/取消全选
            </Checkbox>
          ),
        },
        { type: 'divider' as const },
        ...columns.map((col) => ({
          key: col.key,
          label: (
            <Checkbox
              checked={visibleColumns[col.key]}
              onChange={() => toggleColumn(col.key)}
            >
              {col.title}
            </Checkbox>
          ),
        })),
      ],
    }
  }, [columns, visibleColumns, toggleColumn, toggleAllColumns])

  // 构建行选择配置
  const tableRowSelection: TableProps<any>['rowSelection'] = useMemo(() => {
    if (!rowSelection) return undefined
    return {
      type: 'checkbox',
      selectedRowKeys: rowSelection.selectedRowKeys,
      onChange: rowSelection.onChange,
      getCheckboxProps: rowSelection.getCheckboxProps,
    }
  }, [rowSelection])

  // 渲染工具栏
  const renderHeaderToolbar = () => {
    if (!headerToolbar && !columnsTogglable) return null

    return (
      <div className="table-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space className="toolbar-left">{headerToolbar}</Space>
        <Space className="toolbar-right">
          {columnsTogglable && (
            <Dropdown
              menu={columnsTogglerMenu}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button icon={<SettingOutlined />} title="列设置" />
            </Dropdown>
          )}
        </Space>
      </div>
    )
  }

  return (
    <div className={`table-container ${className || ''}`} style={style}>
      {renderHeaderToolbar()}

      <AntTable
        dataSource={dataSource}
        columns={tableColumns}
        loading={loading}
        rowKey={rowKey}
        pagination={pagination}
        rowSelection={tableRowSelection}
        bordered={bordered}
        size={size}
        scroll={scroll}
      />
    </div>
  )
}

CodegenTable.displayName = 'Table'

export default CodegenTable
