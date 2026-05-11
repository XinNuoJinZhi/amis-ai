import React, { useState, useMemo } from 'react'
import { Select, Tree, List, Input, Popover, Space } from 'antd'
import { SearchOutlined, UserOutlined } from '@ant-design/icons'
import type { TreeDataNode } from 'antd'

interface UserOption {
  label: string
  value: string
}

interface DepartmentOption {
  ref: string
  label?: string
  children: UserOption[]
}

interface TreeOption {
  id: string | number
  label: string
  value: string
  parentId: string | number
  children?: TreeOption[] | null
}

interface UserSelectOptions {
  children: DepartmentOption[]
  leftOptions: TreeOption[]
}

interface UserSelectProps {
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  options: UserSelectOptions[]
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  multiple?: boolean
  style?: React.CSSProperties
  className?: string
}

const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '请选择用户',
  disabled = false,
  allowClear = true,
  multiple = false,
  style,
  className,
}) => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [selectedTreeKey, setSelectedTreeKey] = useState<string>()
  const [rightUsers, setRightUsers] = useState<UserOption[]>([])

  // 获取第一个选项的数据
  const optionData = options?.[0]

  // 转换树形数据格式
  const treeData = useMemo(() => {
    if (!optionData?.leftOptions) return []

    const convertToTreeData = (nodes: TreeOption[]): TreeDataNode[] => {
      return nodes.map((node) => ({
        key: node.value,
        title: node.label,
        children: node.children ? convertToTreeData(node.children) : undefined,
      }))
    }

    return convertToTreeData(optionData.leftOptions)
  }, [optionData?.leftOptions])

  // 获取所有用户数据用于搜索
  const allUsers = useMemo(() => {
    if (!optionData?.children) return []

    return optionData.children.reduce<UserOption[]>((acc, dept) => {
      return acc.concat(dept.children)
    }, [])
  }, [optionData?.children])

  // 根据搜索值过滤用户
  const filteredUsers = useMemo(() => {
    if (!searchValue) return rightUsers

    return allUsers.filter(
      (user) =>
        user.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        user.value.toLowerCase().includes(searchValue.toLowerCase()),
    )
  }, [searchValue, rightUsers, allUsers])

  // 树节点选择处理
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) {
      setSelectedTreeKey(undefined)
      setRightUsers([])
      return
    }

    const selectedKey = selectedKeys[0] as string
    setSelectedTreeKey(selectedKey)

    // 根据选中的树节点找到对应的用户列表
    if (!optionData?.children) {
      setRightUsers([])
      return
    }

    // 查找匹配的部门
    const matchedDept = optionData.children.find((dept) => dept.ref === selectedKey)
    if (matchedDept) {
      setRightUsers(matchedDept.children)
    } else {
      // 如果没有直接匹配，可能是选择了"全部部门"等特殊节点
      if (selectedKey === '-1') {
        // 显示所有用户
        setRightUsers(allUsers)
      } else {
        setRightUsers([])
      }
    }
  }

  // 用户选择处理
  const handleUserSelect = (userValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(userValue)
        ? currentValues.filter(v => v !== userValue)
        : [...currentValues, userValue]
      onChange?.(newValues)
    } else {
      onChange?.(userValue)
      setOpen(false)
      setSearchValue('')
    }
  }

  // 获取选中用户的显示文本
  const getSelectedUserLabel = () => {
    if (!value) return undefined

    if (multiple && Array.isArray(value)) {
      return value.map(v => {
        const user = allUsers.find((u) => u.value === v)
        return user?.label || v
      }).join(', ')
    }

    const selectedUser = allUsers.find((user) => user.value === value)
    return selectedUser?.label
  }

  // 搜索输入处理
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  // 清除搜索
  const handleSearchClear = () => {
    setSearchValue('')
  }

  // 清除选择
  const handleClear = () => {
    onChange?.(multiple ? [] : undefined)
  }

  // 下拉内容
  const dropdownContent = (
    <div style={{ width: 600, height: 400 }}>
      {/* 搜索框 */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <Input
          placeholder="搜索用户"
          value={searchValue}
          onChange={handleSearchChange}
          prefix={<SearchOutlined />}
          allowClear
          onClear={handleSearchClear}
        />
      </div>

      {searchValue ? (
        // 搜索模式：显示搜索结果
        <div style={{ padding: '8px 0', height: 'calc(100% - 49px)', overflow: 'auto' }}>
          <List
            size="small"
            dataSource={filteredUsers}
            renderItem={(user) => {
              const isSelected = multiple && Array.isArray(value)
                ? value.includes(user.value)
                : value === user.value
              return (
                <List.Item
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                  }}
                  onClick={() => handleUserSelect(user.value)}
                >
                  <Space>
                    <UserOutlined />
                    {user.label}
                  </Space>
                </List.Item>
              )
            }}
          />
        </div>
      ) : (
        // 正常模式：左右分栏
        <div style={{ display: 'flex', height: 'calc(100% - 49px)' }}>
          {/* 左侧树形选择 */}
          <div
            style={{
              width: '40%',
              borderRight: '1px solid #f0f0f0',
              padding: '8px',
              overflow: 'auto',
              height: '100%',
            }}
          >
            <Tree
              treeData={treeData}
              onSelect={handleTreeSelect}
              selectedKeys={selectedTreeKey ? [selectedTreeKey] : []}
              showLine
              showIcon={false}
            />
          </div>

          {/* 右侧用户列表 */}
          <div
            style={{
              width: '60%',
              padding: '8px 0',
              overflow: 'auto',
              height: '100%',
            }}
          >
            <List
              size="small"
              dataSource={rightUsers}
              renderItem={(user) => {
                const isSelected = multiple && Array.isArray(value)
                  ? value.includes(user.value)
                  : value === user.value
                return (
                  <List.Item
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                    }}
                    onClick={() => handleUserSelect(user.value)}
                  >
                    <Space>
                      <UserOutlined />
                      {user.label}
                    </Space>
                  </List.Item>
                )
              }}
            />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Popover
      content={dropdownContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
    >
      <Select
        mode={multiple ? 'multiple' : undefined}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        allowClear={allowClear}
        onClear={handleClear}
        style={style}
        className={className}
        open={false} // 阻止默认下拉行为
        onClick={() => !disabled && setOpen(true)}
      >
        {multiple && Array.isArray(value) ? (
          value.map(v => {
            const user = allUsers.find(u => u.value === v)
            return <Select.Option key={v} value={v}>{user?.label || v}</Select.Option>
          })
        ) : (
          value && <Select.Option value={value as string}>{getSelectedUserLabel()}</Select.Option>
        )}
      </Select>
    </Popover>
  )
}

export { UserSelect }
export type { UserSelectProps, UserSelectOptions, UserOption, DepartmentOption, TreeOption }
