/**
 * 根存储
 */
import { EditorStore } from './editor'
import { createContext, useContext } from 'react'
import { types } from 'mobx-state-tree'
// 定义context
export const store = types.model({
  EditorStore: types.optional(EditorStore, {
    preview: '',
    type: '',
    schema: '',
    newPageData: '',
    oldPageData: '',
    appVariables: {}
  } as any)
})
.create({
  // @ts-ignore
  preview: '',
  type: '',
  schema: '',
  newPageData: '',
  oldPageData: '',
  appVariables: {},
  versionId: ""
})

export const ModelContext = createContext(store)
export const useStore = () => useContext(ModelContext)
