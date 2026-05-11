import React from 'react'

interface HiddenProps {
  value?: any
  onChange?: (value: any) => void
}

const Hidden: React.FC<HiddenProps> = () => {
  // Hidden 组件不渲染任何 UI
  return null
}

export default Hidden
