import React from 'react'
import { v4 as uuidv4 } from 'uuid'

interface UUIDProps {
  value?: string
  onChange?: (value: string) => void
  length?: number
}

const UUID: React.FC<UUIDProps> = ({ value, onChange, length }) => {
  React.useEffect(() => {
    if (!value && onChange) {
      let uuid = uuidv4()
      if (length) {
        uuid = uuid.substring(0, length)
      }
      onChange(uuid)
    }
  }, [value, onChange, length])

  // UUID 组件不渲染任何 UI
  return null
}

export default UUID
