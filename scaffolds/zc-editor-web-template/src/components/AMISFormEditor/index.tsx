import React, { useState, useEffect, useRef } from 'react';
import { Editor, ShortcutKey, registerEditorPlugin, buildMobileWorkflowFormItemsSchema } from 'amis-editor';
import { Icon, Drawer } from 'amis-ui';
import { toast } from 'amis'
import { Modal, Button } from 'antd';
// import 'amis/lib/themes/default.css';
import 'amis-editor-core/lib/style.css';
// import 'amis-ui/lib/themes/cxd.css'
import './components/style.scss';
import { savePageManage, saveAppPageManage, getPageManageContent, getAppPageManageContent, getHistoryData, getAppHistoryData, getEnableVersion, getAppEnableVersion, getEntityData } from "@/api/formEditor"
import { observer } from "mobx-react"
import { useStore } from "@/store/formEditor"
import { getOpenTabIcon, isEqualObject } from '@/utils/util'
import { history } from '@umijs/max';
import { ManagerMobilePlugin, ManagerPersonalComputerPlugin } from "./components/DisabledEditorPlugin"
import { genForm } from "@/engine/form";
import { render as amisRender } from 'amis';
import { service } from "@/utils/request"
import { getFields, filterKey } from "@/engine/crud"
import { uuid, guid } from 'amis-core';
import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
import { registerFunction} from 'amis-formula';
import allUserStore from "@/store/allUser"
import allDeptStore from "@/store/allDept"
import { registerGetUserInfo, registerGetDepInfo, registerGetUserInfoByUserSelect} from "@/utils/util"
import { isAppEnd } from '@/utils/index'
import {openSocket} from "@/utils/webSocket"
import { protocolHandle } from "@/utils/protocol"
import initApiStore from "@/store/initApi"
import permStore from '@/store/permission';
import {baseURL, devApiUrl, adminApiUrl} from '@/utils/env'
import {env as amisRenderEnv} from '@/hooks/amis';

// 注册移动端组件限制
const locationParams = new URLSearchParams(window.location.search);
if(locationParams.get('appEnd')) {
  registerEditorPlugin(ManagerMobilePlugin)
} else {
  registerEditorPlugin(ManagerPersonalComputerPlugin)
}

let iframeUrl = '/amis-editor-mobile/editor.html';
const baseUrl = baseURL;

const urlConfig = {
  baseUrl,
  devApiUrl,
  adminApiUrl
}
const AMISFormEditor: React.FC = observer(() => {
  const { FormEditorStore } = useStore();
  const editorRef = useRef()
  const amisEnv = {
    fetcher: service,
    theme: amisRenderEnv.theme,
  }
  const params = new URLSearchParams(window.location.search);
  const queryKey = params.get('queryKey');
  const formName = params.get('formName');
  const formType = params.get('type')
  const EditorType = {
    EDITOR: 'editor',
    MOBILE: 'mobile',
    FORM: 'form'
  };
  // const schemaVal = {
  //   type: 'page',
  //   title: 'Simple Form Page',
  //   regions: ['body'],
  //   body: []
  // };
  const schemaVal = {
    type: 'doc-entity',
    fields: []
  };
  const schemas = [
    {
      type: 'object',
      properties: {
        'zcUser': {
          type: 'object',
          title: '当前登录用户信息',
          properties: {
            id: {
              type: 'string',
              title: '用户ID'
            },
            name: {
              type: 'string',
              title: '用户名'
            },
            nickName: {
              type: 'string',
              title: '昵称'
            },
            appRoleCodes: {
              type: 'array',
              title: '应用角色编码'
            },
            phone: {
              type: 'string',
              title: '手机号'
            },
            email: {
              type: 'string',
              title: '邮箱'
            },
            avatar: {
              type: 'string',
              title: '头像'
            },
            department: {
              type: 'string',
              title: '部门名称'
            },
            departmentId: {
              type: 'string',
              title: '部门ID'
            },
            departmentCode: {
              type: 'string',
              title: '部门编号'
            },
            departmentPath: {
              type: 'string',
              title: '部门路径'
            },
            tenantCode: {
              type: 'string',
              title: '租户编码'
            },
            tenantName: {
              type: 'string',
              title: '租户名称'
            },
            displayName: {
              type: 'string',
              title: '显示名称'
            },
            abbreviation: {
              type: 'string',
              title: '简称'
            },
            shortName: {
              type: 'string',
              title: '短名字'
            }
          }
        },
        'zcApp': {
          type: 'object',
          title: '当前应用信息',
          properties: {
            id: {
              type: 'string',
              title: '应用ID'
            },
            name: {
              type: 'string',
              title: '应用名称'
            },
            logo: {
              type: 'string',
              title: '应用Logo'
            },
            portals: {
              type: 'array',
              title: '应用门户'
            },
            portalId: {
              type: 'string',
              title: '当前门户ID'
            },
            env: {
              type: 'string',
              title: '当前运行环境'
            },
          }
        },
        'zcCompany': {
          type: 'object',
          title: '应用所属组织信息',
          properties: {
            id: {
              type: 'string',
              title: '组织ID'
            },
            name: {
              type: 'string',
              title: '组织名称'
            },
            logo: {
              type: 'string',
              title: '组织Logo'
            },
            key: {
              type: 'string',
              title: '组织标识'
            }
          }
        },
        'window:location': {
          type: 'object',
          title: '浏览器',
          properties: {
            href: {
              type: 'string',
              title: 'href'
            },
            origin: {
              type: 'string',
              title: 'origin'
            },
            protocol: {
              type: 'string',
              title: 'protocol'
            },
            host: {
              type: 'string',
              title: 'host'
            },
            hostname: {
              type: 'string',
              title: 'hostname'
            },
            port: {
              type: 'string',
              title: 'port'
            },
            pathname: {
              type: 'string',
              title: 'pathname'
            },
            search: {
              type: 'string',
              title: 'search'
            },
            hash: {
              type: 'string',
              title: 'hash'
            }
          }
        }
      }
    },
    {
      type: 'object',
      properties: {
        __query: {
          title: '页面入参',
          type: 'object',
          required: [],
          properties: {
            name: {
              type: 'string',
              title: '用户名'
            }
          }
        },
        __page: {
          title: '页面变量',
          type: 'object',
          required: [],
          properties: {
            num: {
              type: 'number',
              title: '数量'
            }
          }
        }
      }
    }
  ];
  const getSchema = () => {
    const lsSchema = FormEditorStore.getSchema;
    if (lsSchema) {
      return lsSchema;
    }
    return schemaVal;
  };

  const [schema, setSchema] = useState(FormEditorStore.getSchema || schemaVal)
  const [type, setType] = useState(FormEditorStore.getType || EditorType.FORM)
  const [preview, setPreview] = useState(FormEditorStore.getPreview ? true : false)
  const [historyVisible, setHistoryVisible] = useState(false)
  const [historyData, setHistoryData] = useState([]);
  const [id, setId] = useState();
  const [saveBtnStatus, setSaveBtnStatus] = useState(true); //初始进入，不可以点击保存
  //为了保存按钮状态跟踪，当点击保存后，存一版old数据，当schema变化时，和old数据进行比对
  const [oldSchema, setOldSchema] = useState({});
  //当schema 变化没有保存时，点击返回，给出提示
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState('');
  const [IsInitFlag, setIsInitFlag] = useState(false);
  const [IsInitConfirm, setIsInitConfirm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const formTitleRef = useRef('');
  //环境变量
  const [envVar, setEnvVar] = useState({});
  //内存变量
  const [appVar, setAppVar] = useState({});
  const [perType, setPerType] = useState();
  const [noBtn, setNoBtn] = useState(true); // 应用端且页面表单类型是通用的情况下，保存不显示，历史记录不能启用
  const [zcAppVal, setZCAppVal] = useState({});
  const [zcCompanyVal, setZCCompanyVal] = useState({});
  const [zcUserVal, setZCUserVal] = useState({});
  const [variables, setVariables] = useState();
  //保存按钮加loading
  const [saveLoading, setSaveLoading] = useState(false);
  //历史记录按钮是否显示
  const [historyBtn, setHistoryBtn] = useState(false);
  //保存按钮是否显示
  const [btnStatus, setBtnStatus] = useState(false);
  //启用此版本是否显示
  const [enableVer, setEnableVer] = useState(false);
  //是否是点击左上角的<
  const [isClickBack, setIsClickBack] = useState(false);
  //获取详情时返回的modelEventTarget，保存下来给保存接口后
  const [modelEventTarget, setModelEventTarget] = useState('');
  const handleTypeChange = (editorType: any) => {
    const type = editorType || EditorType.FORM;
    FormEditorStore.setType(type);
    setType(type)
    let schema = getSchema()
    setSchema(schema)
  };
  //内容变化时调用（增加或减少组件配置）
  const handleChange = (value: any) => {
    FormEditorStore.setSchema(value);
    setSchema(value);
  };
  const onSave = async () => {
    setSaveLoading(true)
    const params = new URLSearchParams(window.location.search);
    const queryKey = params.get('queryKey');
    let params1 = {
      'content': schema,
      'queryKey': queryKey,
      'modelEventTarget': modelEventTarget,
      'type': formType,
      'perType': perType
    }
    let res
    if(isAppEnd()) {
      res = await saveAppPageManage(params1)
    } else {
      res = await savePageManage(params1)
    }

    if (res.data.code == 0) {
      // await getBackData();
      //保存成功
      toast.success('保存成功', {
        position: 'top-center'
      });
      setSaveLoading(false)
      FormEditorStore.setSchema(schema);
      setOldSchema(schema)
      setSaveBtnStatus(true)
      getBackData();
      setIsInitConfirm(false)
    } else {
      toast.error(res.data.msg, {
        position: 'top-center'
      });
      setSaveLoading(false)
    }
  };
  let childRef: any = null;
  // const handleChildEvent = (ref: any) => {
  //     childRef = ref;
  // }
  const isMobile = type === EditorType.MOBILE;
  const undo = () => {
    editorRef?.current?.undo()
  }

  const redo = () => {
    editorRef?.current?.redo()
  }
  //编辑还是预览按钮操作
  const handlePreviewChange = (preview: any) => {
    FormEditorStore.setPreview(preview ? 'true' : '')
    setPreview(!!preview)
  };
  const togglePreview = () => {
    handlePreviewChange(!preview);
  };

  // 处理环境变量数据
  const disposeVariable = (envList: any, memoryList: any) => {
    let vList: any = []

    if (envList.length) {
        let vData: any = {}
        let schema = {
            name: '',
            title: '环境变量',
            parentId: 'root',
            order: 1,
            schema: {
                type: 'object',
                properties: {}
            }
        }

        let properties: any = {}

        for (let i in envList) {
            let title = envList[i].key;
            let value = envList[i].value;
            properties[title] = {
                type: 'string',
                title: title
            }
            vData[title] = value
        }

        schema.schema.properties = properties
        vList.push(schema)
    }

    if (memoryList?.length) {
        let vData: any = {}
        let schema = {
            name: 'appVariables',
            title: '内存变量',
            parentId: 'root',
            order: 1,
            schema: {
                type: 'object',
                properties: {}
            }
        }

        let properties: any = {}

        for (let i in memoryList) {
            let title = memoryList[i].key;
            let value = memoryList[i].value;
            properties[title] = memoryList[i].variableSchema
            vData[title] = value
        }

        schema.schema.properties = properties
        vList.push(schema)
    }

    setVariables(vList)
  }
  const getBackData = async () => {
    const params = new URLSearchParams(window.location.search);
    const queryKey = params.get('queryKey');
    const appId = params.get('appid');
    const envId = params.get('env');
    const formType = params.get('type');
    if(params.get('appEnd')){
      handleTypeChange('mobile')
    }
    let params1 = {
      'appid': appId,
      'env': envId,
      'queryKey': queryKey,
    }
    let res;
    if (isAppEnd()) {
      res = await getAppPageManageContent(params1)
    } else {
      res = await getPageManageContent(params1)
    }
    if (res.data.code != 0) {
      toast.error(res.data.msg, {
        position: 'top-center'
      });
      return
    }

    let data = permStore.getState().permData
    let filterUpdate =  isAppEnd() ? data.filter(item => item == 'app:form:update') : data.filter(item => item == 'devApp:form:update')
    const updateFlag = filterUpdate.length > 0 ? true : false; //保存
    let filterHistory = isAppEnd() ? data.filter(item => item == 'app:form:formHistory') : data.filter(item => item == 'devApp:form:formHistory')
    const historyFlag = filterHistory.length > 0 ? true : false; //历史记录
    setHistoryBtn(historyFlag)
    let filterSwitchHistory = isAppEnd() ? data.filter(item => item == 'app:form:switchHistoryData') : data.filter(item => item == 'devApp:form:switchHistoryData')
    const switchHistoryFlag = filterSwitchHistory.length > 0 ? true : false; //切换版本
    setEnableVer(switchHistoryFlag)

    let envVar = res?.data?.data?.context?.envVar;
    //处理内存变量
    let memoryVar = res?.data?.data?.context?.appVariables
    disposeVariable(envVar, memoryVar)
    let zcApp = res?.data?.data?.context?.zcApp;
    let zcCompany = res?.data?.data?.context?.zcCompany;
    let zcUser = res?.data?.data?.context?.zcUser;
    let envVarObj = {};
    for (var i = 0; i < envVar?.length; i++) {
      envVarObj[envVar[i].key] = envVar[i].value;
    }
    let appVarObj = {}
    for (var i = 0; i < memoryVar?.length; i++) {
      appVarObj[memoryVar[i].key] = memoryVar[i].value;
    }
    const perType = res?.data?.data?.perType
    //应用端且页面表单类型是通用的情况下，保存不显示，历史记录不能启用
    const noBtnFlag = perType == 1 && isAppEnd() ? false : true
    setNoBtn(noBtnFlag)
    setModelEventTarget(res?.data?.data?.modelEventTarget)
    setBtnStatus(noBtnFlag && updateFlag)
    setPerType(perType)
    setAppVar(appVarObj)
    setEnvVar(envVarObj)
    setZCAppVal(zcApp)
    setZCCompanyVal(zcCompany)
    setZCUserVal(zcUser)
    let backData = res?.data?.data?.schema;
    let id = res.data.data.id;
    setId(id);
    setFormTitle(res?.data?.data?.formName)
    if(formType == 0){
      if (backData == null || backData?.fields?.length == 0 || !backData?.fields || JSON.stringify(backData?.fields) == "{}") {
        setIsInitFlag(true);
        // backData = {type: 'doc-entity', fields: [], title: res?.data?.data?.formName}
        // setSchema(backData ? backData : schemaVal)
        // setOldSchema(backData ? backData : schemaVal)
      } else {
        // FormEditorStore.setSchema(backData);
        setSchema(backData ? backData : schemaVal)
        setOldSchema(backData ? backData : schemaVal)
      }
    } else {
      if(backData == null || backData?.fields?.length == 0 || !backData?.fields || JSON.stringify(backData?.fields) == "{}"){
        let result = {
          type: 'doc-entity',
          fields: [],
          title: formTitleRef.current,
          id: 'u:' + guid()
        }
        setSchema(result ? result : schemaVal)
        setOldSchema(result ? result : schemaVal)
      } else {
        setSchema(backData ? backData : schemaVal)
        setOldSchema(backData ? backData : schemaVal)
      }
    }
    document.title = res.data.data.formName
    getOpenTabIcon()
  }
  const onBack = () => {
    setIsClickBack(true)
    //当schema 变化，没有保存时，点击返回，给一个确认提示框
    if (saveBtnStatus == false) {
      setIsModalOpen(true)
      let url = ''
      if(isAppEnd()){
        url = '/app/formManage' + window.location.search;
      } else{
        url = '/app/design/formManage' + window.location.search;
      }
      setModalInfo('新的修改没有保存，确认要前往:' + url)
    } else {
      setIsModalOpen(false)
      let params = new URLSearchParams(window.location.search);
      const appid = params.get('appid');
      const env = params.get('env');
      const groupKey = params.get('groupKey');
      const portalKey = params.get('portalKey')
      if(isAppEnd()){
        let url = '/app/formManage?appid=' + appid + '&env=' + env + '&groupKey=' + groupKey + (portalKey ? `&portalKey=${portalKey}` : '');
        history.push(url)
      } else{
        let url = '/app/design/formManage?appid=' + appid + '&env=' + env + '&groupKey=' + groupKey;
        history.push(url)
      }
      location.reload()
    }
  }
  const handleOk = () => {
    let params = new URLSearchParams(window.location.search);
    const appid = params.get('appid');
    const env = params.get('env');
    const groupKey = params.get('groupKey');
    const portalKey = params.get('portalKey')
    if(isAppEnd()){
      let url = '/app/formManage?appid=' + appid + '&env=' + env + '&groupKey=' + groupKey + (portalKey ? `&portalKey=${portalKey}` : '');
      history.push(url)
    } else{
      let url = '/app/design/formManage?appid=' + appid + '&env=' + env + '&groupKey=' + groupKey;
      history.push(url)
    }
    location.reload()
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  //获取历史记录数据
  const getHistoryList = async () => {
    const params = new URLSearchParams(window.location.search);
    const queryKey = params.get('queryKey');
    let param = {
      queryKey
    };
    let res;
    if (isAppEnd()) {
      res = await getAppHistoryData(param)
    } else {
      res = await getHistoryData(param)
    }
    if(res.data.code != 0) {
      toast.error(res.data.msg, {
        position: 'top-right'
      });
      setHistoryData(res.data.data)
      return
    }
    let historyData = res.data?.data;
    setHistoryData(historyData)
  }
  //点击历史记录
  const historyCheck = async () => {
    await getHistoryList()
    setHistoryVisible(true)
  }
  //历史记录-启用此版本
  const enableVersion = async (item: any) => {
    const params = new URLSearchParams(window.location.search);
    const appid = params.get('appid');
    const env = params.get('env');
    let param = {
      startUsingFormId: item.id
    }
    let res;
    if (isAppEnd()) {
      res = await getAppEnableVersion(param)
    } else {
      res = await getEnableVersion(param)
    }
    if(res.data.code != 0) {
      toast.error(res.data.msg, {
        position: 'top-right'
      });
      return
    }
    let resId = res.data.data;
    let params1 = {
      'appid': appid,
      'env': env,
      'queryKey': resId,
    }
    let res2;
    if (isAppEnd()) {
      res2 = await getAppPageManageContent(params1)
    } else {
      res2 = await getPageManageContent(params1)
    }
    if (res2.data.code != 0) {
      toast.error(res2.data.msg, {
        position: 'top-center'
      });
      return
    }

    let backData = res2?.data?.data.schema;
    // FormEditorStore.setSchema(backData);
    if (backData == undefined) {
      backData = {
        type: 'doc-entity',
        fields: []
      }
    }
    setSchema(backData);
    toast.success('切换成功', {
      position: 'top-center'
    });
    await getHistoryList()
  }
  //调用实体返回配置字段
  const getEntityList = async () => {
    const params = new URLSearchParams(window.location.search);
    const dsKey = params.get('dsKey');
    const appEnd = params.get('appEnd')
    const modelEventTarget = params.get('modelEventTarget');
    let res = await getEntityData(dsKey);
    const table = res.data.data?.filter(i => i.key == modelEventTarget)[0] ? res.data.data?.filter(i => i.key == modelEventTarget)[0] : { fields:[]}
    let data:any;
    if(appEnd) {
      data = buildMobileWorkflowFormItemsSchema({modelMeta: table, models: res.data.data});
    } else {
      data = genForm(table, res.data.data, null, undefined, false, true, false, false);
    }
    let result = {
      type: 'doc-entity',
      fields: data,
      title: formTitleRef.current,
      primaryField: table.primaryField,
      formApi: `model://${table.dsKey}.${table.key}/` + "${" + table.primaryField + "}?" +
        getFields(table.fields, table.relations, true, c => {
          if (!filterKey(data, c)) {
            return false;
          }
          return !c.isPrimaryKey;
        }).map((c, i) => `__fields[${i}]=${c.key}`).join("&"),
      id: 'u:' + guid()
    }
    setSchema(result ? result : schemaVal)
    setOldSchema(result ? result : schemaVal)
  }
  //请确认-是否立即初始化
  const IsInit = () => {
    const schema = {
      "type": "dialog",
      "show": true,
      "size": "md",
      "title": "请确认",
      "body": "您还没有设计视图，是否立即初始化",
      "actions": [
        {
          "type": "button",
          "label": "取消",
          "onEvent": {
            "click": {
              "actions": [
                {
                  "actionType": "custom",
                  "script": async function () {
                    setIsInitFlag(false);
                    setIsInitConfirm(false);
                  }
                }
              ]
            }
          }
        },
        {
          "type": "button",
          "label": "确认",
          "level": "danger",
          "onEvent": {
            "click": {
              "actions": [
                {
                  "actionType": "custom",
                  "script": async function () {
                    setIsInitFlag(false);
                    setIsInitConfirm(true);
                    getEntityList();
                  }
                }
              ]
            }
          }
        }
      ],
    }
    return (
      <div style={{ height: '88vh' }}>
        {amisRender(schema, {}, {
          fetcher: service,
          theme: amisRenderEnv.theme,
        })}
      </div>
    )
  }
  //获取功能权限数据
  const getPermiDatafg = async () => {
    let permissionRes = await service({
      url: useDevBaseUrl('/app/permission/getPermissionsOwnedByLoginUser'),
      method: 'get',
    })
    let data = permissionRes?.data?.data?.permissions ? permissionRes?.data?.data?.permissions : []
    permStore.dispatch({type: "set", payload: data});
    const initApi = permissionRes?.data?.data?.initApi?.url
    const timeout = permissionRes?.data?.data?.initApi?.timeout
    const method = permissionRes?.data?.data?.initApi?.method
    if(initApi && method){
      const url = protocolHandle(initApi, method)
      let initData = await service({
          url: url,
          method: method?.toLowerCase(),
          config: {
              timeout: timeout ? timeout * 1000 : 60000,
          },
      })
      initApiStore.dispatch({type: "set", payload: initData?.data?.data});
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      openSocket()
      //调用功能权限接口
      await getPermiDatafg()
      await getBackData();
      //获取所用用户的数据
      const getAllUser = async () => {
        const res = await service({
            url: useDevBaseUrl('/system/user/allList'),
            method: 'get',
        })
        for(var i=0;i<res.data.data.length;i++){
          delete res.data.data[i].remark
          delete res.data.data[i].sex
          delete res.data.data[i].postIds
          delete res.data.data[i].status
          delete res.data.data[i].registerStatus
          delete res.data.data[i].loginIp
          delete res.data.data[i].loginDate
          delete res.data.data[i].createTime
          delete res.data.data[i].supervisor
          delete res.data.data[i]?.dept
      }
        allUserStore.dispatch({ type: "set", payload: res.data.data});
      }
      await getAllUser()
      //获取所用用户的数据
      const getAllDept = async () => {
          const res = await service({
              url: useDevBaseUrl('/system/dept/all_list'),
              method: 'get',
          })
          for(var i=0;i<res.data.data.length;i++){
            delete res.data.data[i].sort
            delete res.data.data[i].phone
            delete res.data.data[i].email
            delete res.data.data[i].status
            delete res.data.data[i].createTime
            delete res.data.data[i].children
          }
          allDeptStore.dispatch({ type: "set", payload: res.data.data });
      }
      await getAllDept()
      //注册三个函数，从store里找对应的数据
      registerFunction('GetUserInfo', (userId, field) => {
        return registerGetUserInfo(userId, field)
      });
      registerFunction('GetDepInfo', (id) => {
        return registerGetDepInfo(id)
      });
      registerFunction('GetUserInfoByUserSelect', (result, field) => {
        return registerGetUserInfoByUserSelect(result, field)
      })
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (editorRef?.current?.canUndo() == false && editorRef?.current?.canRedo() == false) {
      if (IsInitConfirm) {
        if(schema?.fields?.length > 0){
          setSaveBtnStatus(false)
        } else {
          setSaveBtnStatus(true)
        }
      } else {
        setSaveBtnStatus(true)
      }
    } else {
      let result = isEqualObject(oldSchema, schema);
      if (result) {
        setSaveBtnStatus(true)
      } else {
        setSaveBtnStatus(false)
      }
    }
  }, [schema])
  useEffect(() => {
    setFormTitle(formTitle)
    formTitleRef.current = formTitle;
  }, [formTitle])

  window.onbeforeunload = function () {
    //isClickBack为true时，代表点击左上角的<,不需弹出浏览器的信息
    if (!saveBtnStatus && !isClickBack) {
      return '未保存更改';
    }
  }

  return (
    <>
      <div>
        <div className="EditorDemo">
          <div id="headerBar" className="EditorHeader">
            <div className="EditorTitle">
              <div className="EditorBack">
                <Icon icon="back" onClick={onBack} />
              </div>
              <div className="page_title_text">
                <p>正在编辑"{formTitle}"</p>
              </div>
            </div>
            {/* <div className="Editor_view_mode_group_container">
              <div className="Editor_view_mode_group">
                <div
                  className={type === EditorType.EDITOR ? `Editor_view_mode_btn is_active`: `Editor_view_mode_btn`}
                  onClick={() => {
                    handleTypeChange(EditorType.EDITOR);
                  }}
                >
                  <Icon icon="pc-preview" title="PC模式" />
                </div>
                <div
                  className={type === EditorType.MOBILE ?  'Editor_view_mode_btn is_active' : 'Editor_view_mode_btn'}
                  onClick={() => {
                    handleTypeChange(EditorType.MOBILE);
                  }}
                >
                  <Icon icon="h5-preview" title="移动模式" />
                </div>
              </div>
            </div> */}
            <div className="Editor_header_actions">
              {!preview &&
                <div className="header_quick_actions">
                  <div
                    className="shortcut_icon_btn spacing"
                    editor-tooltip="撤回"
                    tooltip-position="bottom"
                  >
                    <Icon icon={editorRef?.current?.canUndo() ? 'Withdraw-can' : 'withdraw'} onClick={undo} />
                  </div>
                  <div
                    className="shortcut_icon_btn spacing"
                    editor-tooltip="还原"
                    tooltip-position="bottom"
                  >
                    <Icon icon={editorRef?.current?.canRedo() ? 'restore-can' : 'restore'} onClick={redo} />
                  </div>
                  {historyBtn && <div
                    className="shortcut_icon_btn spacing"
                    editor-tooltip="历史记录"
                    tooltip-position="bottom"
                  >
                    <Icon icon="history" onClick={historyCheck} />
                  </div>}

                  <ShortcutKey />
                </div>
              }
              <Drawer
                size="sm"
                className="history-drawer"
                overlay={false}
                closeOnOutside
                onHide={() => setHistoryVisible(false)}
                show={historyVisible}
                position="right"
                width={'340px'}
              >
                <div className='history-drawer-header'>
                  历史记录
                </div>

                <div className='history-drawer-content'>
                  {
                    historyData && historyData.map((item) => {
                      return (
                        <div className='history-drawer-list'>
                          <div className='history-drawer-left'>
                            <div style={{ display: 'flex' }}>
                              <div className='history-date'>保存于：<span style={{ color: "#007bff" }}>{item.createTime}</span></div>
                            </div>
                            {
                              item.latest == 1 ?
                                <div className='history-drawer-rigth'>
                                  <div style={{ color: 'red' }}>已启用</div>
                                </div>
                                :
                                <div className='history-drawer-rigth'>
                                  {enableVer && noBtn && <div className='history-button1' onClick={() => enableVersion(item)}>启用</div>}
                                </div>
                            }
                          </div>
                          <div className='history-drawer-rigth'>
                            <div className='history-name'><span>用户：{item.creator}</span></div>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </Drawer>
              <div
                className={preview ? `header_action_btn primary` : 'header_action_btn'}
                onClick={togglePreview}
              >
                {preview ? '编辑' : '预览'}
              </div>

              {!preview && btnStatus && (
                <Button
                  onClick={onSave}
                  className={saveBtnStatus ? 'header_action_btn  save_button_disabled' : `header_action_btn`}
                  loading={saveLoading}
                >
                  保存
                </Button>
              )}
            </div>
          </div>
          <div className="EditorInner">
            <Editor
              ref={editorRef}
              isMobile={isMobile}
              onSave={onSave}
              className="is-fixed"
              theme={amisRenderEnv.theme}
              preview={preview}
              showCustomRenderersPanel={true}
              onChange={handleChange}
              onPreview={handlePreviewChange}
              value={schema}
              schemas={schemas}
              iframeUrl={iframeUrl}
              editorType="form"
              variables={variables}
              // $schemaUrl={schemaUrl}
              ctx={
                {
                  zcApp: zcAppVal,
                  zcCompany: zcCompanyVal,
                  zcUser: zcUserVal,
                  app: initApiStore.getState().initApi,
                  ...envVar,
                  appVariables: appVar,
                  $$noPer: false,
                  $$permissionsData: permStore.getState().permData,
                }
              }
              amisEnv={
                amisEnv
              }
              serveBaseUrl={baseUrl}
              urlConfig={urlConfig}
            />
          </div>
        </div>
        <Modal title="提示" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} okText="确认"
          cancelText="取消" theme={'antd'}>
          <p>{modalInfo}</p>
        </Modal>
        {
          IsInitFlag ? IsInit() : null
        }
      </div>
    </>
  )
})

export default AMISFormEditor;

