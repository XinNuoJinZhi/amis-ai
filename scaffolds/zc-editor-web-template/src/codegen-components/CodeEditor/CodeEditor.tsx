import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import MonacoEditor, { OnMount, OnChange } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

export interface CodeEditorProps {
  value?: string
  onChange?: (value: string | undefined) => void
  language?: string
  disabled?: boolean
  readOnly?: boolean
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export interface CodeEditorRef {
  getValue: () => string | undefined
  setValue: (value: string) => void
  focus: () => void
  getEditor: () => editor.IStandaloneCodeEditor | null
}

const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  (
    {
      value = '',
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
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

    useImperativeHandle(ref, () => ({
      getValue: () => editorRef.current?.getValue(),
      setValue: (val: string) => editorRef.current?.setValue(val),
      focus: () => editorRef.current?.focus(),
      getEditor: () => editorRef.current,
    }))

    const handleEditorDidMount: OnMount = (editor) => {
      editorRef.current = editor
    }

    const handleChange: OnChange = (val) => {
      onChange?.(val)
    }

    return (
      <div className={className} style={style}>
        <MonacoEditor
          height={height}
          language={language}
          value={value}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly: disabled || readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </div>
    )
  },
)

CodeEditor.displayName = 'CodeEditor'

export { CodeEditor }
