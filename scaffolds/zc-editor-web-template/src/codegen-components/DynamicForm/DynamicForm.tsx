import React from 'react'
import { Form } from 'antd'

interface DynamicFormProps {
  value?: any
  onChange?: (value: any) => void
  formSchema?: any
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
  name?: string
  label?: string
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  value,
  onChange,
  formSchema,
  disabled = false,
  style,
  className,
}) => {
  const [form] = Form.useForm()

  React.useEffect(() => {
    if (value) {
      form.setFieldsValue(value)
    }
  }, [value, form])

  const handleValuesChange = (_: any, allValues: any) => {
    if (onChange) {
      onChange(allValues)
    }
  }

  if (!formSchema) {
    return <div style={style} className={className}>加载中...</div>
  }

  return (
    <Form
      form={form}
      onValuesChange={handleValuesChange}
      disabled={disabled}
      style={style}
      className={className}
      initialValues={value}
    >
      {/* 这里应该根据 formSchema 动态渲染表单项 */}
      <div>动态表单组件（待实现具体渲染逻辑）</div>
    </Form>
  )
}

export default DynamicForm
