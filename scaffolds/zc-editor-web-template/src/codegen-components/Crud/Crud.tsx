import React, { useMemo, useRef } from 'react'
import { Space, Dropdown, Button } from 'antd'
import { ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import type { TableColumn } from '../Table'

// 组件属性接口
interface CrudProps {
  // 筛选表单
  filter?: React.ReactNode

  // CRUD 工具栏
  headerToolbar?: React.ReactNode[]
  footerToolbar?: React.ReactNode

  // 批量操作
  bulkActions?: React.ReactNode

  // CRUD 特有功能
  showColumnsToggler?: boolean  // 对应 CRUD headerToolbar 中的 'columns-toggler'
  showReload?: boolean          // 对应 CRUD headerToolbar 中的刷新按钮
  onReload?: () => void

  // 行选择状态（由 CRUD 管理）
  selectedRowKeys?: React.Key[]

  // 行选择配置（传递给 Table）
  rowSelection?: any

  // 内容区域（通常是 Table）
  children: React.ReactNode

  // 列配置（用于 columns-toggler）
  columns?: TableColumn[]
  onColumnsChange?: (visibleKeys: string[]) => void

  // 容器样式
  className?: string
  style?: React.CSSProperties
}

/**
 * Crud 组件 - 数据管理容器组件
 *
 * 职责：
 * - 筛选表单（filter）
 * - 工具栏（headerToolbar、footerToolbar）
 * - 批量操作（bulkActions）
 * - CRUD 级别的列切换（showColumnsToggler，对应 headerToolbar: ['columns-toggler']）
 * - 刷新按钮（showReload）
 * - 组合内部的 Table 组件
 *
 * 不负责：
 * - 列的具体渲染（由 SimpleTable 负责）
 * - Table 自己的 columnsTogglable（由 SimpleTable 负责）
 */
const Crud: React.FC<CrudProps> = (props) => {
  const {
    filter,
    headerToolbar = [],
    footerToolbar,
    bulkActions,
    showColumnsToggler = false,
    showReload = false,
    onReload,
    selectedRowKeys = [],
    rowSelection,
    children,
    columns = [],
    onColumnsChange,
    className,
    style,
  } = props

  // 列显示状态（CRUD 级别的 columns-toggler）
  const [visibleColumnKeys, setVisibleColumnKeys] = React.useState<Set<string>>(() => {
    return new Set(columns.map((col) => col.key))
  })

  // 切换列显示
  const toggleColumn = (key: string) => {
    setVisibleColumnKeys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      onColumnsChange?.(Array.from(newSet))
      return newSet
    })
  }

  // 全选/取消全选列
  const toggleAllColumns = (checked: boolean) => {
    const newSet = checked ? new Set(columns.map((col) => col.key)) : new Set<string>()
    setVisibleColumnKeys(newSet)
    onColumnsChange?.(Array.from(newSet))
  }

  // 列显示切换下拉菜单
  const columnsTogglerMenu = useMemo(() => {
    const allChecked = columns.every((col) => visibleColumnKeys.has(col.key))
    const indeterminate = columns.some((col) => visibleColumnKeys.has(col.key)) && !allChecked

    return {
      items: [
        {
          key: 'all',
          label: (
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={allChecked}
                ref={(input) => {
                  if (input) input.indeterminate = indeterminate
                }}
                onChange={(e) => toggleAllColumns(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              全选/取消全选
            </label>
          ),
        },
        { type: 'divider' as const },
        ...columns.map((col) => ({
          key: col.key,
          label: (
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={visibleColumnKeys.has(col.key)}
                onChange={() => toggleColumn(col.key)}
                style={{ marginRight: 8 }}
              />
              {col.title}
            </label>
          ),
        })),
      ],
    }
  }, [columns, visibleColumnKeys])

  // 处理刷新
  const handleReload = () => {
    onReload?.()
  }

  // 渲染工具栏
  const renderHeaderToolbar = () => {
    if (!filter && headerToolbar.length === 0 && !showColumnsToggler && !showReload && !bulkActions) {
      return null
    }

    // 右侧工具按钮
    const rightTools = (
      <Space>
        {showReload && (
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReload}
            title="刷新"
          />
        )}
        {showColumnsToggler && (
          <Dropdown
            menu={columnsTogglerMenu}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button icon={<SettingOutlined />} title="列设置" />
          </Dropdown>
        )}
      </Space>
    )

    // 左侧内容（自定义工具栏 + 批量操作）
    const leftContent = (
      <>
        {headerToolbar.length > 0 && (
          <Space>
            {headerToolbar.map((item, index) => (
              <React.Fragment key={`header-toolbar-${index}`}>{item}</React.Fragment>
            ))}
          </Space>
        )}
        {bulkActions && selectedRowKeys.length > 0 && (
          <Space>
            <span style={{ marginLeft: 16 }}>
              已选择 {selectedRowKeys.length} 项
            </span>
            {bulkActions}
          </Space>
        )}
      </>
    )

    return (
      <div
        className="crud-header-toolbar"
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div className="toolbar-left">{leftContent}</div>
        <div className="toolbar-right">{rightTools}</div>
      </div>
    )
  }

  // 过滤可见的列
  const visibleColumns = useMemo(() => {
    if (!showColumnsToggler || columns.length === 0) {
      return columns
    }
    return columns.filter((col) => visibleColumnKeys.has(col.key))
  }, [columns, visibleColumnKeys, showColumnsToggler])

  // 克隆子组件并注入过滤后的 columns 和 rowSelection
  const renderChildren = () => {
    // 如果子组件是 Table，需要注入 columns 和 rowSelection
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type &&
          (child.type as any).displayName === 'Table') {
        const injectedProps: any = {
          ...child.props,
        }

        // 如果启用了列切换，注入过滤后的列
        if (showColumnsToggler && columns.length > 0) {
          injectedProps.columns = visibleColumns
        }

        // 如果有 rowSelection 配置，注入到 Table
        if (rowSelection) {
          injectedProps.rowSelection = rowSelection
        }

        return React.cloneElement(child, injectedProps)
      }
      return child
    })
  }

  return (
    <div className={`crud-container ${className || ''}`} style={style}>
      {/* 筛选表单 */}
      {filter && <div className="crud-filter" style={{ marginBottom: 16 }}>{filter}</div>}

      {/* 工具栏 */}
      {renderHeaderToolbar()}

      {/* 内容区域（Table） */}
      <div className="crud-content">{renderChildren()}</div>

      {/* 底部工具栏 */}
      {footerToolbar && (
        <div className="crud-footer-toolbar" style={{ marginTop: 16 }}>
          {footerToolbar}
        </div>
      )}
    </div>
  )
}

Crud.displayName = 'Crud'

export default Crud
