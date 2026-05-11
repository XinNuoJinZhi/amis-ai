import React, { useState, useEffect, useRef } from 'react'
import { read, utils } from 'xlsx'
import { Table } from 'antd'
import { renderAsync } from 'docx-preview'

export interface OfficeViewerProps {
  src?: string | Blob | File
  value?: string | Blob | File | any[] // 支持 Form.Item 自动注入的 value，可能是 fileList 数组
  excelOptions?: {
    height?: number
  }
  docxOptions?: {
    height?: number
  }
}

export const OfficeViewer: React.FC<OfficeViewerProps> = ({
  src,
  value,
  excelOptions,
  docxOptions,
}) => {
  const [tableData, setTableData] = useState<any[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [fileType, setFileType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const docxContainerRef = useRef<HTMLDivElement>(null)

  // 优先使用 value（Form.Item 注入），fallback 到 src
  const fileSource = value || src

  useEffect(() => {
    if (!fileSource) {
      setTableData([])
      setColumns([])
      setFileType(null)
      return
    }

    const loadFile = async () => {
      try {
        setError(null)
        let file: File | Blob | null = null
        let fileName = 'document'

        // 处理 Upload 组件的 fileList 数组
        if (Array.isArray(fileSource) && fileSource.length > 0) {
          const fileObj = fileSource[0]
          file = fileObj.originFileObj || fileObj
          fileName = fileObj.name || fileName
        } else if (fileSource instanceof Blob || fileSource instanceof File) {
          file = fileSource
          if (fileSource instanceof File) {
            fileName = fileSource.name
          }
        } else if (typeof fileSource === 'string') {
          try {
            const response = await fetch(fileSource)
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            file = await response.blob()

            // 尝试从 URL 获取文件名
            try {
              const urlObj = new URL(fileSource, window.location.href)
              const pathname = decodeURIComponent(urlObj.pathname)
              const name = pathname.split('/').pop()
              if (name) fileName = name
            } catch (e) {
              // 忽略 URL 解析错误
            }
          } catch (err) {
            console.error('加载远程文件失败:', err)
            setError(`无法加载文件: ${err instanceof Error ? err.message : String(err)}`)
            return
          }
        }

        if (!file) {
          setError('无效的文件')
          return
        }

        // 判断文件类型
        const ext = fileName.split('.').pop()?.toLowerCase()
        setFileType(ext || null)

        // 读取文件内容
        const arrayBuffer = await file.arrayBuffer()

        // Excel 文件处理 (.xlsx, .csv, .tsv)
        if (ext === 'xlsx' || ext === 'csv' || ext === 'tsv') {
          const workbook = read(arrayBuffer, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]

          if (jsonData.length === 0) {
            setTableData([])
            setColumns([])
            return
          }

          // 第一行作为表头
          const headers = jsonData[0] || []
          const cols = headers.map((header: any, index: number) => ({
            title: header || `列${index + 1}`,
            dataIndex: `col_${index}`,
            key: `col_${index}`,
            ellipsis: true,
          }))

          // 数据行
          const rows = jsonData.slice(1).map((row, rowIndex) => {
            const rowData: any = { key: rowIndex }
            row.forEach((cell: any, colIndex: number) => {
              rowData[`col_${colIndex}`] = cell
            })
            return rowData
          })

          setColumns(cols)
          setTableData(rows)
        } else if (ext === 'docx') {
          // Word 文件处理
          if (docxContainerRef.current) {
            // 清空容器
            docxContainerRef.current.innerHTML = ''
            // 渲染 Word 文档
            await renderAsync(arrayBuffer, docxContainerRef.current, undefined, {
              className: 'docx-preview',
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              ignoreFonts: false,
              breakPages: true,
              ignoreLastRenderedPageBreak: true,
              experimental: false,
              trimXmlDeclaration: true,
              useBase64URL: true,
              renderHeaders: true,
              renderFooters: true,
              renderFootnotes: true,
              renderEndnotes: true,
            })
          }
        } else {
          setError(`不支持的文件类型: ${ext}`)
        }
      } catch (err) {
        console.error('文件加载失败:', err)
        setError(`文件加载失败: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    loadFile()
  }, [fileSource])

  const height = fileType === 'docx' ? docxOptions?.height || 600 : excelOptions?.height || 600

  if (!fileSource) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed #d9d9d9',
          borderRadius: 4,
          color: '#999',
        }}
      >
        请选择 Office 文件
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #ff4d4f',
          borderRadius: 4,
          color: '#ff4d4f',
          padding: 16,
        }}
      >
        {error}
      </div>
    )
  }

  // Word 文件使用 docx-preview 渲染
  if (fileType === 'docx') {
    return (
      <div
        ref={docxContainerRef}
        style={{
          height,
          overflow: 'auto',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          backgroundColor: '#f5f5f5',
        }}
      />
    )
  }

  // Excel 文件使用 Table 渲染
  return (
    <div style={{ height, overflow: 'auto' }}>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content', y: height - 50 }}
        bordered
      />
    </div>
  )
}

export default OfficeViewer
