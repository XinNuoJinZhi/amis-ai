/**
 * 编辑器的store
 * https://juejin.cn/post/6844903767414931463
 * https://zhuanlan.zhihu.com/p/646993873
 */
import {types, Instance} from 'mobx-state-tree';
import {createContext, useContext} from 'react';
import {evalJS} from 'amis-core';

export const EditorStore = types
  .model('EditorStore', {
    preview: types.string,
    type: types.string,
    schema: types.optional(types.frozen(), {}),
    newPageData: types.optional(types.frozen(), {}),
    oldPageData: types.optional(types.frozen(), {}),
    versionId: types.optional(types.string, ''),
    appVariables: types.optional(types.frozen(), {}),
    modules: types.optional(types.frozen(), {}),
    envVariables: types.optional(types.frozen(), {}),
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
      get getNewPageData() {
        return self.newPageData;
      },
      get getOldPageData() {
        return self.oldPageData;
      },
      get getVersionId() {
        return self.versionId;
      },
      getAppVariables(obj: any = {}) {
        const appVariables = self.appVariables;
        const result: any = {};
        for (const key in appVariables) {
          const value = appVariables[key];
          if (typeof value === 'string') {
            const envVar = Array.isArray(self.envVariables)
              ? self.envVariables.find((item: any) => item.name === key)
              : self.envVariables[key];
            const evalResult = evalJS(value, obj);
            // 如果返回的是函数，则执行函数获取实际值
            const finalResult = typeof evalResult === 'function' ? evalResult() : evalResult;

            const matchType =
              envVar?.type === 'integer'
                ? typeof finalResult === 'number'
                : typeof finalResult === envVar?.type;
            result[key] = envVar?.type && matchType ? finalResult : value;
          } else {
            result[key] = value;
          }
        }
        return result;
      },
      get getModules() {
        return self.modules;
      },
      getEnvVariables(obj:any={}) {
          return self.envVariables;
      },
    };
  })
  .actions(self => {
    return {
      setSchema(val: any) {
        self.schema = val;
      },
      setType(val: any) {
        self.type = val;
      },
      setPreview(val: any) {
        self.preview = val;
      },
      setNewPageData(val: any) {
        self.newPageData = val;
      },
      setOldPageData(val: any) {
        self.oldPageData = val;
      },
      setVersionId(val: any) {
        self.versionId = val;
      },
      setAppVariables(val: any) {
        self.appVariables = val;
      },
      setModules(val: any) {
        self.modules = val;
      },
      setEnvVariables(val: any) {
        self.envVariables = val;
      }
    };
  });
export type EditorStoreInstance = Instance<typeof EditorStore>;

export const store = types
  .model({
    EditorStore: types.optional(EditorStore, {
      preview: '',
      type: '',
      schema: {
        type: 'page',
        title: '',
        regions: ['body', 'toolbar', 'header'],
        body: []
      },
      newPageData: {},
      oldPageData: {},
      versionId: '',
      appVariables: {
        n: '1'
      },
      envVariables: {}
    })
  })
  .create({});
export const ModelContext = createContext(store);
export const useStore = () => useContext(ModelContext);
