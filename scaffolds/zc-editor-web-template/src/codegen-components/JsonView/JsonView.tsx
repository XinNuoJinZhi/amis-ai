import React from 'react'
import ReactJsonView from 'react-json-view'

export interface JsonViewProps {
  src: any
  name?: string | false
  theme?: string
  enableClipboard?: boolean
  displayDataTypes?: boolean
  collapseStringsAfterLength?: number | false
  iconStyle?: 'circle' | 'triangle' | 'square'
  quotesOnKeys?: boolean
  sortKeys?: boolean
  collapsed?: boolean | number
  indentWidth?: number
}

export const JsonView: React.FC<JsonViewProps> = ({
  src,
  name = false,
  theme = 'rjv-default',
  enableClipboard = false,
  displayDataTypes = false,
  collapseStringsAfterLength = false,
  iconStyle = 'square',
  quotesOnKeys = true,
  sortKeys = false,
  collapsed = false,
  indentWidth = 2,
}) => {
  return (
    <ReactJsonView
      src={src}
      name={name}
      theme={theme}
      enableClipboard={enableClipboard}
      displayDataTypes={displayDataTypes}
      collapseStringsAfterLength={collapseStringsAfterLength}
      iconStyle={iconStyle}
      quotesOnKeys={quotesOnKeys}
      sortKeys={sortKeys}
      collapsed={collapsed}
      indentWidth={indentWidth}
    />
  )
}

export default JsonView
