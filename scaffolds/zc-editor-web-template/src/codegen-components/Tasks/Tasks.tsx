import React from 'react'
import { Table, Tag, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'

export interface TaskItem {
  /** 任务名称 */
  label: string
  /** 任务键值 */
  key: string
  /** 任务状态: 0-初始 1-就绪 2-进行中 3-出错不可重试 4-已完成 5-出错可重试 */
  status: 0 | 1 | 2 | 3 | 4 | 5
  /** 备注，支持 HTML */
  remark?: string
}

export interface TasksProps {
  /** 任务列表 */
  items?: TaskItem[]
  /** 外层类名 */
  className?: string
  /** 表格类名 */
  tableClassName?: string
  /** 任务名称列标题 */
  taskNameLabel?: string
  /** 状态列标题 */
  statusLabel?: string
  /** 备注列标题 */
  remarkLabel?: string
  /** 操作列标题 */
  operationLabel?: string
  /** 操作按钮文字 */
  btnText?: string
  /** 重试按钮文字 */
  retryBtnText?: string
  /** 状态文字映射 */
  statusTextMap?: string[]
  /** 提交任务回调 */
  onSubmit?: (item: TaskItem) => void
  /** 重试任务回调 */
  onRetry?: (item: TaskItem) => void
}

// 默认状态颜色映射
const DEFAULT_STATUS_COLORS = ['default', 'processing', 'processing', 'error', 'success', 'error']
// 默认状态文字映射
const DEFAULT_STATUS_TEXT = ['未开始', '就绪', '进行中', '出错', '已完成', '出错']

/**
 * Tasks 异步任务组件
 * 用于显示任务操作集合，类似于 ORP 上线流程
 */
const Tasks: React.FC<TasksProps> = (props) => {
  const {
    items = [],
    className,
    tableClassName,
    taskNameLabel = '任务名称',
    statusLabel = '状态',
    remarkLabel = '备注',
    operationLabel = '操作',
    btnText = '上线',
    retryBtnText = '重试',
    statusTextMap = DEFAULT_STATUS_TEXT,
    onSubmit,
    onRetry,
  } = props

  const columns: ColumnsType<TaskItem> = [
    {
      title: taskNameLabel,
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: statusLabel,
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => {
        const text = statusTextMap[status] || DEFAULT_STATUS_TEXT[status] || '未知'
        const color = DEFAULT_STATUS_COLORS[status] || 'default'
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: remarkLabel,
      dataIndex: 'remark',
      key: 'remark',
      render: (text: string) => (
        text ? <span dangerouslySetInnerHTML={{ __html: text }} /> : '-'
      ),
    },
    {
      title: operationLabel,
      key: 'operation',
      render: (_: any, record: TaskItem) => {
        // 状态 1: 就绪，可操作
        if (record.status === 1) {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => onSubmit?.(record)}
            >
              {btnText}
            </Button>
          )
        }
        // 状态 5: 出错可重试
        if (record.status === 5) {
          return (
            <Button
              danger
              size="small"
              onClick={() => onRetry?.(record)}
            >
              {retryBtnText}
            </Button>
          )
        }
        return '-'
      },
    },
  ]

  return (
    <div className={className}>
      <Table
        className={tableClassName}
        dataSource={items}
        columns={columns}
        rowKey="key"
        pagination={false}
        size="small"
      />
    </div>
  )
}

export { Tasks }
export default Tasks
