/**
 * 编辑器的store
 * https://juejin.cn/post/6844903767414931463
 * https://zhuanlan.zhihu.com/p/646993873
 */
import { types, Instance} from 'mobx-state-tree';
import { createContext, useContext } from 'react'
export const FormEditorStore = types
  .model('FormEditorStore', {
    preview: types.string,
    type: types.string,
    schema: types.optional(types.frozen(), {}),
  })
  .views(self => {
    return {
      get getSchema() {
        return self.schema;
      },
      get getType() {
        return self.type;
      },
      get getPreview() {
        return self.preview;
      },
    };
  })
  .actions(self => {
    return {
      setSchema(val:any){
        self.schema = val;
      },
      setType(val:any){
        self.type = val;
      },
      setPreview(val:any){
        self.preview = val;
      },
    };
  });
  export type FormEditorStoreInstance = Instance<typeof FormEditorStore>;

  export const store = types.model({
    FormEditorStore: types.optional(FormEditorStore, {
      preview: '',
      type: '',
      schema: ''
    })
  })
  .create({
    preview: '',
    type: '',
    schema: {}
  })
  export const ModelContext = createContext(store)
  export const useStore = () => useContext(ModelContext)
