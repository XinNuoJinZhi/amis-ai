import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import 'tinymce/tinymce'
import 'tinymce/themes/silver'
import 'tinymce/icons/default'
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/charmap'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/anchor'
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/visualblocks'
import 'tinymce/plugins/code'
import 'tinymce/plugins/fullscreen'
import 'tinymce/plugins/insertdatetime'
import 'tinymce/plugins/media'
import 'tinymce/plugins/table'
import 'tinymce/plugins/help'
import 'tinymce/plugins/wordcount'
import 'tinymce/models/dom'
import 'tinymce/skins/ui/oxide/skin.css'
import 'tinymce/skins/content/default/content.css'
import 'tinymce-i18n/langs5/zh_CN.js'

// 导入 TinyMCE
import tinymce from 'tinymce'

// TinyMCE 类型声明
declare global {
  interface Window {
    tinymce: typeof tinymce
  }
}

// TinyMCE 编辑器实例接口
interface TinyMCEEditor {
  getContent: () => string
  setContent: (content: string) => void
  focus: () => void
  blur: () => void
  insertContent: (content: string) => void
  destroy: () => void
  on: (event: string, callback: (...args: unknown[]) => void) => void
  mode: {
    set: (mode: string) => void
    get: () => string
  }
  selection: {
    getContent: (options?: { format?: string }) => string
  }
  isDirty: () => boolean
  execCommand: (command: string, ui?: boolean, value?: unknown) => void
  plugins: {
    wordcount?: {
      getCount: (type?: string) => number
    }
  }
}

// TinyMCE 编辑器配置接口
interface TinyMCEConfig {
  height?: number
  menubar?: boolean
  plugins?: string[]
  toolbar?: string
  content_style?: string
  language?: string
  branding?: boolean
  resize?: boolean
  statusbar?: boolean
  target?: HTMLElement
  setup?: (editor: TinyMCEEditor) => void
  [key: string]: unknown
}

// RichTextEditor 组件的 Props 接口
interface RichTextEditorProps {
  value?: string // 编辑器内容
  onChange?: (content: string) => void // 内容变化回调
  onInit?: (editor: TinyMCEEditor) => void // 编辑器初始化完成回调
  onFocus?: () => void // 获得焦点回调
  onBlur?: () => void // 失去焦点回调
  onSelectionChange?: (selection: { text: string; html: string; range: unknown }) => void // 选中内容变化回调
  onWordCountChange?: (wordCount: {
    words: number
    characters: number
    charactersWithoutSpaces: number
  }) => void // 字数统计变化回调
  onStatusChange?: (status: {
    isDirty: boolean
    isReadonly: boolean
    isFullscreen: boolean
  }) => void // 编辑器状态变化回调
  config?: TinyMCEConfig // 编辑器配置
  disabled?: boolean // 是否禁用
  placeholder?: string // 占位符
  className?: string // CSS 类名
  style?: React.CSSProperties // 内联样式
}

// 暴露给父组件的方法接口
export interface RichTextEditorRef {
  // 内容操作
  getContent: () => string // 获取编辑器内容
  setContent: (content: string) => void // 设置编辑器内容
  insertContent: (content: string) => void // 插入内容

  // 焦点控制
  focus: () => void // 获得焦点
  blur: () => void // 失去焦点

  // 选择操作
  getSelection: () => { text: string; html: string } // 获取选中内容
  selectAll: () => void // 全选

  // 状态获取
  isDirty: () => boolean // 是否有未保存的更改
  isReadonly: () => boolean // 是否为只读模式
  getWordCount: () => { words: number; characters: number; charactersWithoutSpaces: number } // 获取字数统计

  // 编辑器控制
  undo: () => void // 撤销
  redo: () => void // 重做
  execCommand: (command: string, value?: unknown) => void // 执行编辑器命令

  // 模式切换
  setReadonly: (readonly: boolean) => void // 设置只读模式
  toggleFullscreen: () => void // 切换全屏模式

  // 获取原始编辑器实例
  getEditor: () => TinyMCEEditor | null // 获取 TinyMCE 编辑器实例
}

// 默认配置
const defaultConfig: TinyMCEConfig = {
  inline: false, // 非内联模式
  skin: false, // 禁用默认皮肤
  content_css: false, // 禁用默认内容样式
  height: 400, // 编辑器高度
  branding: false, // 隐藏 TinyMCE 品牌标识
  plugins: [
    'advlist', // 高级列表
    'autolink', // 自动链接
    'link', // 链接
    'image', // 图片
    'lists', // 列表
    'charmap', // 特殊字符
    'preview', // 预览
    'anchor', // 锚点
    'searchreplace', // 查找替换
    'wordcount', // 字数统计
    'visualblocks', // 可视化块
    'code', // 代码
    'fullscreen', // 全屏
    'insertdatetime', // 插入日期时间
    'media', // 媒体
    'table', // 表格
    'help', // 帮助
  ],
  // 主工具栏配置
  toolbar:
    'undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | ' +
    'bullist numlist outdent indent | link image | preview media | ' +
    'fontfamily fontsize forecolor backcolor | print help',
  // 菜单栏配置
  menu: {
    file: {
      title: 'File', // 文件菜单
      items: 'newdocument restoredraft | preview | print ',
    },
    edit: {
      title: 'Edit', // 编辑菜单
      items: 'undo redo | cut copy paste | selectall | searchreplace',
    },
    view: {
      title: 'View', // 视图菜单
      items: 'code | visualaid visualblocks | preview fullscreen',
    },
    insert: {
      title: 'Insert', // 插入菜单
      items:
        'image link media inserttable | charmap hr | anchor | insertdatetime',
    },
    format: {
      title: 'Format', // 格式菜单
      items:
        'bold italic underline strikethrough superscript subscript codeformat | styles blocks fontsize align | forecolor backcolor | removeformat',
    },
    tools: {
      title: 'Tools', // 工具菜单
      items: 'code wordcount',
    },
    table: {
      title: 'Table', // 表格菜单
      items: 'inserttable | cell row column | tableprops deletetable',
    },
    help: { title: 'Help', items: 'help' }, // 帮助菜单
  },
  paste_data_images: true, // 允许粘贴图片数据
  content_style: [
    // 支持图片调整大小的样式
    '.mce-content-body div.mce-resizehandle { background-color: #4099ff; border-color: #4099ff; border-style: solid; border-width: 1px; box-sizing: border-box; height: 10px; position: absolute; width: 10px; z-index: 1298 } .mce-content-body .mce-clonedresizable { cursor: default; opacity: .5; outline: 1px dashed #000; position: absolute; z-index: 10001 }',
    // 修复视频元素显示问题
    '[data-mce-bogus] video {display:none;}',
  ].join('\n'),
  promotion: false, // 禁用推广信息
  license_key: 'gpl', // 使用 GPL 开源许可证
  language: 'zh_CN', // 设置界面语言为简体中文
  help_accessibility: false, // 禁用帮助插件的辅助功能国际化资源加载，避免加载 en.js 等文件失败
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      value = '',
      onChange,
      onInit,
      onFocus,
      onBlur,
      onSelectionChange,
      onWordCountChange,
      onStatusChange,
      config = {},
      disabled = false,
      placeholder,
      className,
      style,
    },
    ref,
  ) => {
    const editorRef = useRef<HTMLTextAreaElement>(null)
    const editorInstanceRef = useRef<TinyMCEEditor | null>(null)
    const isInitialized = useRef(false)

    // 合并配置
    const mergedConfig = { ...defaultConfig, ...config }

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      // 内容操作
      getContent: () => {
        return editorInstanceRef.current ? editorInstanceRef.current.getContent() : ''
      },
      setContent: (content: string) => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.setContent(content)
        }
      },
      insertContent: (content: string) => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.insertContent(content)
        }
      },

      // 焦点控制
      focus: () => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.focus()
        }
      },
      blur: () => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.blur()
        }
      },

      // 选择操作
      getSelection: () => {
        if (editorInstanceRef.current) {
          const selection = editorInstanceRef.current.selection
          return {
            text: selection?.getContent({ format: 'text' }) || '',
            html: selection?.getContent() || '',
          }
        }
        return { text: '', html: '' }
      },
      selectAll: () => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.execCommand('SelectAll')
        }
      },

      // 状态获取
      isDirty: () => {
        return editorInstanceRef.current ? editorInstanceRef.current.isDirty() : false
      },
      isReadonly: () => {
        return editorInstanceRef.current
          ? editorInstanceRef.current.mode.get() === 'readonly'
          : false
      },
      getWordCount: () => {
        if (editorInstanceRef.current) {
          const plugin = editorInstanceRef.current.plugins.wordcount
          if (plugin) {
            return {
              words: plugin.getCount() || 0,
              characters: plugin.getCount('characters') || 0,
              charactersWithoutSpaces: plugin.getCount('characters_no_spaces') || 0,
            }
          }
        }
        return { words: 0, characters: 0, charactersWithoutSpaces: 0 }
      },

      // 编辑器控制
      undo: () => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.execCommand('Undo')
        }
      },
      redo: () => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.execCommand('Redo')
        }
      },
      execCommand: (command: string, value?: unknown) => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.execCommand(command, false, value)
        }
      },

      // 模式切换
      setReadonly: (readonly: boolean) => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.mode.set(readonly ? 'readonly' : 'design')
        }
      },
      toggleFullscreen: () => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.execCommand('mceFullScreen')
        }
      },

      // 获取原始编辑器实例
      getEditor: () => {
        return editorInstanceRef.current
      },
    }))

    // 初始化 TinyMCE
    useEffect(() => {
      const initTinyMCE = async () => {
        // 使用本地安装的 TinyMCE
        initEditor()
      }

      const initEditor = () => {
        if (!editorRef.current || isInitialized.current) return

        window.tinymce.init({
          target: editorRef.current,
          ...mergedConfig,
          setup: (editor: unknown) => {
            const typedEditor = editor as TinyMCEEditor
            editorInstanceRef.current = typedEditor

            // 编辑器准备就绪
            typedEditor.on('init', () => {
              isInitialized.current = true
              if (value) {
                typedEditor.setContent(value)
              }
              if (disabled) {
                typedEditor.mode.set('readonly')
              }
              // 触发初始化完成回调
              onInit?.(typedEditor)
            })

            // 内容变化事件
            typedEditor.on('change keyup', () => {
              const content = typedEditor.getContent()
              onChange?.(content)

              // 触发状态变化回调
              onStatusChange?.({
                isDirty: typedEditor.isDirty(),
                isReadonly: typedEditor.mode.get() === 'readonly',
                isFullscreen: false, // 需要通过其他方式检测全屏状态
              })
            })

            // 获得焦点事件
            typedEditor.on('focus', () => {
              onFocus?.()
            })

            // 失焦事件
            typedEditor.on('blur', () => {
              const content = typedEditor.getContent()
              onChange?.(content)
              onBlur?.()
            })

            // 选择内容变化事件
            typedEditor.on('selectionchange', () => {
              const selection = typedEditor.selection
              onSelectionChange?.({
                text: selection?.getContent({ format: 'text' }) || '',
                html: selection?.getContent() || '',
                range: selection,
              })
            })

            // 字数统计变化事件
            typedEditor.on('wordcountupdate', () => {
              const plugin = typedEditor.plugins.wordcount
              if (plugin) {
                onWordCountChange?.({
                  words: plugin.getCount() || 0,
                  characters: plugin.getCount('characters') || 0,
                  charactersWithoutSpaces: plugin.getCount('characters_no_spaces') || 0,
                })
              }
            })
          },
        })
      }

      initTinyMCE()

      // 清理函数
      return () => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.destroy()
          editorInstanceRef.current = null
          isInitialized.current = false
        }
      }
    }, [])

    // 处理 value 变化
    useEffect(() => {
      if (editorInstanceRef.current && isInitialized.current) {
        const currentContent = editorInstanceRef.current.getContent()
        if (currentContent !== value) {
          editorInstanceRef.current.setContent(value || '')
        }
      }
    }, [value])

    // 处理禁用状态
    useEffect(() => {
      if (editorInstanceRef.current && isInitialized.current) {
        if (disabled) {
          editorInstanceRef.current.mode.set('readonly')
        } else {
          editorInstanceRef.current.mode.set('design')
        }
      }
    }, [disabled])

    return (
      <div className={className} style={style}>
        <textarea
          ref={editorRef}
          placeholder={placeholder}
          style={{ width: '100%', minHeight: '200px' }}
        />
      </div>
    )
  },
)

RichTextEditor.displayName = 'RichTextEditor'

export { RichTextEditor }
export type { RichTextEditorProps }
