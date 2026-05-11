import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { DiffEditor as MonacoDiffEditor, DiffOnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

export interface DiffEditorProps {
  value?: string
  diffValue?: string
  onChange?: (value: string | undefined) => void
  language?: string
  disabled?: boolean
  readOnly?: boolean
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export interface DiffEditorRef {
  getValue: () => string | undefined
  getOriginalValue: () => string | undefined
  getModifiedValue: () => string | undefined
  focus: () => void
  getEditor: () => editor.IStandaloneDiffEditor | null
}

const DiffEditor = forwardRef<DiffEditorRef, DiffEditorProps>(
  (
    {
      value = '',
      diffValue = '',
      onChange,
      language = 'javascript',
      disabled = false,
      readOnly = false,
      height = 300,
      className,
      style,
    },
    ref,
  ) => {
    const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null)

    useImperativeHandle(ref, () => ({
      getValue: () => editorRef.current?.getModifiedEditor().getValue(),
      getOriginalValue: () => editorRef.current?.getOriginalEditor().getValue(),
      getModifiedValue: () => editorRef.current?.getModifiedEditor().getValue(),
      focus: () => editorRef.current?.getModifiedEditor().focus(),
      getEditor: () => editorRef.current,
    }))

    const handleEditorDidMount: DiffOnMount = (editor) => {
      editorRef.current = editor

      // 监听修改后的内容变化
      editor.getModifiedEditor().onDidChangeModelContent(() => {
        const newValue = editor.getModifiedEditor().getValue()
        onChange?.(newValue)
      })
    }

    return (
      <div className={className} style={style}>
        <MonacoDiffEditor
          height={height}
          language={language}
          original={diffValue}
          modified={value}
          onMount={handleEditorDidMount}
          options={{
            readOnly: disabled || readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            automaticLayout: true,
            renderSideBySide: true,
          }}
        />
      </div>
    )
  },
)

DiffEditor.displayName = 'DiffEditor'

export { DiffEditor }
