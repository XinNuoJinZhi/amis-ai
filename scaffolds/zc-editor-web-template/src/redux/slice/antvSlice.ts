import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FLOWABLE_PREFIX } from '@/bpmn/constant/constants';

// 定义redux属性的名称和类型
export interface antVState {
  // 原始数据
  rawData: object,
  // 图节点集合
  node: Array,
  // 节点位置
  pointLayer: object
  // 图版本
  apiVersion: string
  // 拖拽时节点值
  addMenuItem: string
  // 右键点击的节点数据
  rightNodeData: object
  // 公式列表数据
  formuVariables: Array
  // 公式列表数据（备份）
  formuVariable: Array
  // 是否显示历史记录
  sourceCode: boolean
  // 是否显示源码
  history: boolean
  // 是否显示调试
  debuggingValue: boolean
  // 保存按钮是否点击
  saveState: boolean
  // 节点入参 数据
  nodeInData: Array
  // 节点出参 数据
  nodeOutData: Array
  // 循环内的 节点出参 数据
  xunNodeOutData: Array
  // 撤销按钮是否点击
  undoState: boolean
  // 前进按钮是否点击
  redoState: boolean
  // 右侧抽屉宽度
  rightWidth: Number
  // 图是否改变
  pictureChange: boolean
}

// 定义redux属性的默认值
const initialState: antVState = {
  pointLayer: { x: 0, y: 0 },
  addMenuItem: '',
  node: [],
  rightNodeData: {},
  formuVariables: [
    {
      label: '服务变量',
      children: []
    },
    {
      label: '服务入参',
      value: 'input',
      path: '服务入参',
      type: 'object',
      tag: '对象',
      isMember: false,
      disabled: false,
      children:[]
    },
    {
      label: '当前登录用户信息',
      value: 'zcUser',
      path: '当前登录用户信息',
      type: 'object',
      tag: '对象',
      isMember: false,
      disabled: false,
      children: [
        {
          label: '用户ID',
          value: 'zcUser.id',
          path: '当前登录用户信息.用户ID',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        },
        {
          label: '用户名',
          value: 'zcUser.name',
          path: '当前登录用户信息.用户名',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        },
        {
          label: '手机号',
          value: 'zcUser.phone',
          path: '当前登录用户信息.手机号',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        },
        {
          label: '邮箱',
          value: 'zcUser.email',
          path: '当前登录用户信息.邮箱',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        },
        {
          label: '昵称',
          value: 'zcUser.nickName',
          path: '当前登录用户信息.昵称',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        },
        {
            label: '应用角色编码',
            value: 'zcUser.appRoleCodes',
            path: '当前登录用户信息.应用角色编码',
            type: 'array',
            tag: '数组',
            isMember: false,
            disabled: false
        },
        {
          label: '部门名称',
          path: '当前登录用户信息.部门名称',
          value: 'zcUser.department',
          type: 'string',
          tag: '文本'
        },
        {
            label: '部门ID',
            path: '当前登录用户信息.部门ID',
            value: 'zcUser.departmentId',
            type: 'string',
            tag: '文本'
        },
        {
            label: '部门编号',
            path: '当前登录用户信息.部门编号',
            value: 'zcUser.departmentCode',
            type: 'string',
            tag: '文本'
        },
        {
            label: '部门路径',
            path: '当前登录用户信息.部门路径',
            value: 'zcUser.departmentPath',
            type: 'string',
            tag: '文本'
        },
        {
            label: '租户编码',
            path: '当前登录用户信息.租户编码',
            value: 'zcUser.tenantCode',
            type: 'string',
            tag: '文本'
        },
        {
            label: '租户名称',
            path: '当前登录用户信息.租户名称',
            value: 'zcUser.tenantName',
            type: 'string',
            tag: '文本'
        },
        {
            label: '显示名称',
            path: '当前登录用户信息.显示名称',
            value: 'zcUser.displayName',
            type: 'string',
            tag: '文本'
        },
        {
            label: '简称',
            path: '当前登录用户信息.简称',
            value: 'zcUser.abbreviation',
            type: 'string',
            tag: '文本'
        },
        {
            label: '短名字',
            path: '当前登录用户信息.短名字',
            value: 'zcUser.shortName',
            type: 'string',
            tag: '文本'
        }
      ]
    },
    {
      label: '当前应用信息',
      value: 'zcApp',
      path: '当前应用信息',
      type: 'object',
      tag: '对象',
      isMember: false,
      disabled: false,
      children: [
        {
          label: '应用ID',
          value: 'zcApp.id',
          path: '当前应用信息.应用ID',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        },
        {
          label: '应用名称',
          value: 'zcApp.name',
          path: '当前应用信息.应用名称',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        },
        {
          label: '应用Logo',
          value: 'zcApp.logo',
          path: '当前应用信息.应用Logo',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        },
        {
          label: '应用门户',
          value: 'zcApp.portals',
          path: '当前应用信息.应用门户',
          type: 'array',
          tag: '数组',
          isMember: false,
          disabled: false
        },
        {
          label: '当前运行环境',
          value: 'zcApp.env',
          path: '当前应用信息.当前运行环境',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        }
      ]
    },
    {
      label: '应用所属组织信息',
      value: 'zcCompany',
      path: '应用所属组织信息',
      type: 'object',
      tag: '对象',
      isMember: false,
      disabled: false,
      children: [
        {
          label: '组织ID',
          value: 'zcCompany.id',
          path: '应用所属组织信息.组织ID',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        },
        {
          label: '组织名称',
          value: 'zcCompany.name',
          path: '应用所属组织信息.组织名称',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        },
        {
          label: '应用标识',
          value: 'zcCompany.key',
          path: '应用所属组织信息.应用标识',
          type: 'string',
          tag: '文本',
          isMember: false,
          disabled: false
        }
      ]
    }
  ],
  formuVariable:[],
  sourceCode: false,
  history:false,
  debuggingValue:false,
  saveState: false,
  rawData: {},
  apiVersion: '',
  nodeInData:[],
  nodeOutData: [],
  xunNodeOutData: [],
  undoState:false,
  redoState:false,
  rightWidth:380,
  pictureChange:false
};

/**
 * 定义修改redux属性的方法
 */
export const antvSlice = createSlice({
  name: 'antv',
  initialState,
  reducers: {
    // 修改原始数据
    handleRawData: (state, action) => {
      console.log(action, 'actionactionaction')
      state.rawData = action.payload;
    },
    // 修改整图节点
    handleNode: (state, action) => {
      state.node = action.payload;
    },
    // 修改图版本
    handApiVersion: (state, action) => {
      state.apiVersion = action.payload;
    },
    // 修改节点坐标
    handlePointLayer: (state, action) => {
      state.pointLayer = action.payload;
    },
    // 修改每次拖拽的节点值
    handleAddMenuItem: (state, action) => {
      state.addMenuItem = action.payload;
    },
    // 修改点击不同的节点的数值
    handleRightNodeData: (state, action) => {
      state.rightNodeData = action.payload;
    },
    // 修改公式列表数据
    handleFormuVariables: (state, action) => {
      state.formuVariables = action.payload;
    },
    // 修改公式列表数据(备份)
    handleFormuVariable: (state, action) => {
      state.formuVariable = action.payload;
    },
    // 修改是否显示源码
    handleSourceCode: (state, action) => {
      state.sourceCode = action.payload;
    },
    // 修改是否显示历史记录
    handleHistory: (state, action) => {
      state.history = action.payload;
    },
    // 修改是否显示调试
    handleDebuggingValue: (state, action) => {
      state.debuggingValue = action.payload;
    },
    // 修改是否保存
    handleSaveState: (state, action) => {
      state.saveState = action.payload;
    },
    // 修改节点入参数据
    handNodeInData: (state, action) => {
      state.nodeInData = action.payload;
    },
    // 修改节点出参数据
    handNodeOutData: (state, action) => {
      state.nodeOutData = action.payload;
    },
    // 修改循环 节点出参数据
    handXunNodeOutData: (state, action) => {
      state.xunNodeOutData = action.payload;
    },
    // 修改撤销
    handUndoState: (state, action) => {
      state.undoState = action.payload;
    },
    // 修改前进
    handRedoState: (state, action) => {
      state.redoState = action.payload;
    },
    // 修改右侧抽屉宽度
    handRightWidth: (state, action) => {
      state.rightWidth = action.payload;
    },
    // 修改右侧抽屉宽度
    handPictureChange: (state, action) => {
      state.pictureChange = action.payload;
    },
  },
});

export const {
  handleRawData,
  handleNode,
  handlePointLayer,
  handleAddMenuItem,
  handleRightNodeData,
  handleFormuVariables,
  handleFormuVariable,
  handleSourceCode,
  handleHistory,
  handleDebuggingValue,
  handleSaveState,
  handNodeInData,
  handNodeOutData,
  handXunNodeOutData,
  handUndoState,
  handRedoState,
  handRightWidth,
  handPictureChange,
  handApiVersion
} = antvSlice.actions;

export default antvSlice.reducer;
