import React, { useState, useMemo } from 'react'
import { Input, Tree, Popover } from 'antd'
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { TreeDataNode } from 'antd'

interface DepartmentOption {
  label: string
  value: string
}

interface TreeOption {
  id: string | number
  label: string
  value: string
  parentId: string | number
  children?: TreeOption[] | null
}

interface DepartmentItem {
  ref: string
  label: string
  children?: any[]
}

interface DepartmentSelectOptions {
  children: DepartmentItem[]
  leftOptions?: TreeOption[]
}

interface DepartmentSelectProps {
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  options: DepartmentSelectOptions[]
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  multiple?: boolean
  showIcon?: boolean
  style?: React.CSSProperties
  className?: string
}

const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '请选择部门',
  disabled = false,
  clearable = true,
  multiple = false,
  showIcon = true,
  style,
  className,
}) => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // 兼容两种数据格式：
  // 1. 旧格式: [{children, leftOptions}] - leftOptions 包含树形数据
  // 2. 新格式: [{id, label, value, children}] - 直接是树形数据数组
  const optionData = options?.[0]

  // 判断数据格式：如果有 leftOptions 则使用旧格式，否则直接使用 options 数组作为树形数据
  const treeSource = useMemo(() => {
    if (!options || options.length === 0) return []
    // 旧格式：从 leftOptions 获取
    if (optionData?.leftOptions) {
      return optionData.leftOptions
    }
    // 新格式：options 本身就是树形数据数组
    return options as TreeOption[]
  }, [options, optionData])

  const treeData = useMemo(() => {
    if (!treeSource || treeSource.length === 0) return []

    const convertToTreeData = (nodes: TreeOption[]): TreeDataNode[] => {
      return nodes.map((node) => ({
        key: node.value,
        title: node.label,
        children: node.children ? convertToTreeData(node.children) : undefined,
      }))
    }

    return convertToTreeData(treeSource)
  }, [treeSource])

  const allDepartments = useMemo(() => {
    if (!treeSource || treeSource.length === 0) return []

    const flattenTree = (nodes: TreeOption[]): DepartmentOption[] => {
      return nodes.reduce<DepartmentOption[]>((acc, node) => {
        acc.push({ label: node.label, value: node.value })
        if (node.children) {
          acc.push(...flattenTree(node.children))
        }
        return acc
      }, [])
    }

    return flattenTree(treeSource)
  }, [treeSource])

  const filteredDepartments = useMemo(() => {
    if (!searchValue) return allDepartments

    return allDepartments.filter(
      (dept) =>
        dept.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        dept.value.toLowerCase().includes(searchValue.toLowerCase()),
    )
  }, [searchValue, allDepartments])

  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (multiple) {
      onChange?.(selectedKeys as string[])
    } else {
      if (selectedKeys.length > 0) {
        onChange?.(selectedKeys[0] as string)
        setOpen(false)
        setSearchValue('')
      }
    }
  }

  const getDisplayText = () => {
    if (!value) return ''

    if (multiple && Array.isArray(value)) {
      return value.map(v => {
        const dept = allDepartments.find((d) => d.value === v)
        return dept?.label || v
      }).join(', ')
    }

    const selectedDept = allDepartments.find((dept) => dept.value === value)
    return selectedDept?.label || ''
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(multiple ? [] : undefined)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  const dropdownContent = (
    <div style={{ width: 300, maxHeight: 400 }}>
      {searchValue ? (
        <div style={{ padding: '8px 0', maxHeight: 350, overflow: 'auto' }}>
          <Tree
            treeData={filteredDepartments.map(dept => ({
              key: dept.value,
              title: dept.label,
            }))}
            checkable={multiple}
            checkedKeys={multiple && Array.isArray(value) ? value : undefined}
            selectedKeys={!multiple && value ? [value as string] : []}
            onCheck={(checkedKeys) => {
              if (multiple) {
                onChange?.(checkedKeys as string[])
              }
            }}
            onSelect={(selectedKeys) => handleTreeSelect(selectedKeys)}
            showIcon={showIcon}
          />
        </div>
      ) : (
        <div style={{ padding: '8px', maxHeight: 350, overflow: 'auto' }}>
          <Tree
            treeData={treeData}
            checkable={multiple}
            checkedKeys={multiple && Array.isArray(value) ? value : undefined}
            selectedKeys={!multiple && value ? [value as string] : []}
            onCheck={(checkedKeys) => {
              if (multiple) {
                onChange?.(checkedKeys as string[])
              }
            }}
            onSelect={(selectedKeys) => handleTreeSelect(selectedKeys)}
            showIcon={showIcon}
            showLine
          />
        </div>
      )}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
        <Input
          placeholder="搜索部门"
          value={searchValue}
          onChange={handleSearchChange}
          prefix={<SearchOutlined />}
          allowClear
          size="small"
        />
      </div>
    </div>
  )

  const displayText = getDisplayText()
  const hasValue = multiple ? (Array.isArray(value) && value.length > 0) : !!value

  return (
    <Popover
      content={dropdownContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
    >
      <Input
        value={displayText}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
        onClick={() => !disabled && setOpen(true)}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
        className={className}
        suffix={
          clearable && hasValue && !disabled ? (
            <CloseCircleOutlined
              onClick={handleClear}
              style={{ color: 'rgba(0, 0, 0, 0.25)', cursor: 'pointer' }}
            />
          ) : null
        }
      />
    </Popover>
  )
}

export { DepartmentSelect }
export type { DepartmentSelectProps, DepartmentSelectOptions, DepartmentOption, TreeOption }
