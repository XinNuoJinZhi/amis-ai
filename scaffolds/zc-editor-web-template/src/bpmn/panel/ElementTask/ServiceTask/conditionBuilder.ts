import {getSchemaTpl} from 'amis-editor'

import { useDevBaseUrl } from "@/utils/util"
import 'amis-editor-core/lib/style.css';
import {getNoLoopRelation} from '@/bpmn/panel/ElementTask/ServiceTask/config';
import {advancedFeature} from '@/utils/env'
import {truncateTimePrecision} from '@/utils';
import {useAppSelector} from '@/redux/hook/hooks';
// 对象数组去重
function uniqueFunc(arr, uniId) {
  const res = new Map();
  return arr.filter(item => !res.has(item[uniId]) && res.set(item[uniId], 1));
}
let formuVariables = [
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
]
function transformArray(arr, prefix, itemName) {
    return Object.values(arr.reduce((acc, item) => {
        let key = item.relationKey;
        const match = item.label.match(/【(.*?)】/);
        let parentLabel = ''
        if(match!=null){
            parentLabel = match[1];
        }else{
            parentLabel = item.label
        }
        // console.log(parentLabel,'parentLabel')
        let newValue = `${prefix}.${key}`;
        // console.log(newValue,'newValue')
        if (!acc[key]) {
            acc[key] = {
                value: newValue,
                label: parentLabel,
                tag:'对象',
                children: []
            };
        }
        // 修改 children 中的对象属性，添加 value 和带有父级 label 前缀的 label 属性
        let childItem = {
            ...item,
            value: item.key.includes('.') ? `${newValue}.${item.key.split('.').pop()}` : `${newValue}.${item.key}`,
            label: `${item.label}`
        };
        acc[key].children.push(childItem);
        return acc;
    }, {}));
}
let lastArrData:any = []
export function getOptionAll(entityList?:any){
    formuVariables = [
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
                    label: '租户编码',
                    path: '当前登录用户信息.租户编码',
                    value: 'zcUser.tenantCode',
                    type: 'string',
                    tag: '文本',
                    isMember: false,
                    disabled: false
                },
                {
                    label: '租户名称',
                    path: '当前登录用户信息.租户名称',
                    value: 'zcUser.tenantName',
                    type: 'string',
                    tag: '文本',
                    isMember: false,
                    disabled: false
                },
                {
                    label: '显示名称',
                    path: '当前登录用户信息.显示名称',
                    value: 'zcUser.displayName',
                    type: 'string',
                    tag: '文本',
                    isMember: false,
                    disabled: false
                },
                {
                    label: '简称',
                    path: '当前登录用户信息.简称',
                    value: 'zcUser.abbreviation',
                    type: 'string',
                    tag: '文本',
                    isMember: false,
                    disabled: false
                },
                {
                    label: '短名字',
                    path: '当前登录用户信息.短名字',
                    value: 'zcUser.shortName',
                    type: 'string',
                    tag: '文本',
                    isMember: false,
                    disabled: false
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
    ]
    let arr = JSON.parse(sessionStorage.getItem('userList')); // 表单
    let userArr = JSON.parse(sessionStorage.getItem('getUserList')); // 操作人
    let queryArr = JSON.parse(sessionStorage.getItem('queryList')); // 查询
    let xinArr = JSON.parse(sessionStorage.getItem('getXinList')); // 新增服务
    let callArr = JSON.parse(sessionStorage.getItem('callList')); // 新增服务
    let startArr = JSON.parse(sessionStorage.getItem('startList')); // 流程参数
    let processorArr = JSON.parse(sessionStorage.getItem('processorList')); // 自定义参数
    // console.log(arr, '上下文数据arr上下文数据arr');
    if (userArr != null && userArr.length > 0) {
        userArr = uniqueFunc(userArr, 'nodeId');
    }
    let arrs:any = [];
    let arrsa:any = [];
    let arrsas:any = [];
    let arrss:any = [];
    let callArrs:any = [];
    let startArrs: any = [];
    let processorArrs: any = [];
    if (processorArr != null && processorArr.length > 0) {
        processorArrs = [...processorArr]
    }
    if (arr != null && arr.length > 0) {
        arrs = arr.map(items => {
            let needArr:any = []
            if(items.data && items.data.length>0){
                items.data.forEach(itemRes=>{
                    if(itemRes.relationKey && itemRes.relationKey != null){
                        needArr.push(itemRes);
                    }
                })
            }
            let childrenArr:any = transformArray(needArr,items.id,items.name)
            let returnData =  {
                name: items.name,
                key: items.id,
                label: items.name,
                value: items.id,
                path: items.name,
                tag: '对象',
                isMember: false,
                disabled: false,
                children:
                  items.data &&
                  items.data.map(item => {
                      if (item.type == 'combo') {
                          return {
                              ...item,
                              name: item.label,
                              key: item.label,
                              label: item.label,
                              value: items.id + '.' + item.key,
                              path: items.id + '.' + item.label,
                              tag: '对象',
                              isMember: false,
                              disabled: false,
                              children: item.items.map(it => {
                                  return {
                                      ...it,
                                      name: it.label,
                                      key: it.label,
                                      label: it.label,
                                      value: items.id + '.' + item.key + '.' + it.key,
                                      path: items.id + '.' + item.name + '.' + it.label,
                                      tag: it.tag,
                                      isMember: false,
                                      disabled: false
                                  };
                              })
                          };
                      } else {
                          if(!item.relationKey) {
                              return {
                                  ...item,
                                  name: item.label,
                                  key: item.label,
                                  label: item.label,
                                  value: items.id + '.' + item.key,
                                  path: items.id + '.' + item.label,
                                  tag: item.tag,
                                  isMember: false,
                                  disabled: false
                              };
                          }else{
                              return undefined
                          }
                      }
                  })
            };
            if(returnData.children && returnData.children.length>0){
                returnData.children = returnData.children.filter(sow=> {
                    return sow;
                })
            }
            returnData.children=([...returnData.children,...childrenArr])
            // console.log(returnData,'returnDatareturnDatareturnData')
            return returnData
        });
        // console.log(arrs, 'arrsarrsarrsarrsarrsarrs');
    }
    if (startArr != null && startArr.length > 0) {
        startArrs = [...startArr]
    }else{
        startArrs = [
            {
                label: '流程参数',
                value: 'processInstanceStartVariables',
                path: '流程参数',
                type: '',
                tag: '',
                isMember: false,
                disabled: false
            }
        ];
    }
    if (userArr != null && userArr.length > 0) {
        userArr.forEach(items => {
            if(items.type == 'bpmn:StartEvent'){
                arrsa.push({
                    name: items.id,
                    key: items.nodeId,
                    label: items.id,
                    value: items.nodeId,
                    path: items.id,
                    tag: '对象',
                    isMember: false,
                    disabled: false,
                    children: [
                        {
                            name: '数据ID',
                            key: items.nodeId,
                            label: '数据ID',
                            value: items.nodeId + '.saveDataId',
                            path: items.id + '.数据ID',
                            tag: '文本',
                            isMember: false,
                            disabled: false
                        }
                    ]
                });
            }else{
                arrsa.push({
                    name: items.id,
                    key: items.nodeId,
                    label: items.id,
                    value: items.nodeId,
                    path: items.id,
                    tag: '对象',
                    isMember: false,
                    disabled: false,
                    children: [
                        {
                            name: '操作人',
                            key: items.nodeId,
                            label: '操作人',
                            value: items.nodeId + '.approvalUser',
                            path: items.id + '.操作人',
                            tag: '文本',
                            isMember: false,
                            disabled: false
                        },
                        {
                            name: '审批意见',
                            key: items.nodeId,
                            label: '审批意见',
                            value: items.nodeId + '.actComment',
                            path: items.id + '.审批意见',
                            tag: '文本',
                            isMember: false,
                            disabled: false
                        },
                        {
                            name: '数据ID',
                            key: items.nodeId,
                            label: '数据ID',
                            value: items.nodeId + '.saveDataId',
                            path: items.id + '.数据ID',
                            tag: '文本',
                            isMember: false,
                            disabled: false
                        }
                    ]
                });
            }
        });
    }
    if (xinArr != null && xinArr.length > 0) {
        xinArr.forEach(items => {
            let newItems = {
                name: '主键',
                key: items.label,
                label: '主键',
                value: items.value + '.saveDataId',
                path: items.label + '.主键',
                tag: '文本',
                isMember: false,
                disabled: false
            }
            items.children.unshift(newItems)
            arrsas.push(items);
        });
    }
    if (queryArr != null && queryArr.length > 0) {
        queryArr.forEach((elements:any) => {
            arrss.push(elements);
        });
    }
    if (callArr != null && callArr.length > 0) {
        callArr.forEach((elements:any) => {
            callArrs.push({
                name: elements.id,
                key: elements.nodeId,
                label: elements.id,
                value: elements.nodeId,
                path: elements.id,
                tag: '对象',
                isMember: false,
                disabled: false,
                children: [
                    {
                        name: elements.outputParameterName,
                        key: elements.outputParameterName,
                        label: elements.outputParameterName,
                        value: elements.nodeId+'.'+elements.outputParameterName,
                        path: elements.id+'.'+elements.outputParameterName,
                        tag: '对象',
                        isMember: false,
                        disabled: false,
                        children:elements.data && elements.data.length != 0 ? elements.data.map(item => {
                            return {
                                name: item.label,
                                key: item.label,
                                label: item.label,
                                value: elements.nodeId+'.'+elements.outputParameterName+'.'+item.label,
                                path: item.label,
                                tag: '文本',
                                isMember: false,
                                disabled: false,
                            }
                        }):[]
                    }
                ]
            });
        });
    }
    formuVariables= [ ...arrss,...arrsa,...arrsas,...formuVariables,...callArrs,...startArrs,...processorArrs];
    let doubleList = JSON.parse(sessionStorage.getItem('doubleList'));
    if (doubleList && doubleList.length > 0) {
        doubleList = uniqueFunc(doubleList, 'nodeId');
    }
    if(doubleList && doubleList != null && doubleList.length >0){
        doubleList.forEach(res => {
            if(res.modelEventTarget && res.type == 'bpmn:StartEvent'){
                      entityList.data.options.forEach(ress => {
                          ress.children.forEach(item => {
                              if (item.value == res.modelEventTarget) {
                                  let allArr: any = [];
                                  if (item.form.fields != null) {
                                      allArr = item.form.fields.filter(fie => {
                                          return fie.type != 'relation';
                                      });
                                  }
                                  if (
                                    item.form.relationFields &&
                                    item.form.relationFields != null
                                  ) {
                                      allArr = [...allArr, ...item.form.relationFields];
                                  }
                                  // console.log(allArr, 'allArr');
                                  allArr = allArr.filter(owo=> {return !owo.isPrimaryKey})
                                  // console.log(allArr, 'allArr');
                                  let objectArr:any = [res.value,item.value]
                                  // let lastAllDatas = getNoLoopRelation(allArr,item.form.originRelation,items.data.data.options,objectArr)
                                  let lastAllDatas = getNoLoopRelation(ress.children,item.id)
                                  let needArrSout = lastAllDatas.map(resi=>{
                                      let returnData = {...resi};
                                      if (returnData.relationKey) {
                                          returnData.key = returnData.relationKey + '.' + returnData.key;
                                      }
                                      return returnData
                                  })
                                  // console.log(needArrSout,'needArrSout')
                                  let needArr:any = []
                                  let lastArr:any = []
                                  if(needArrSout && needArrSout.length>0){
                                      needArrSout.forEach(itemRes=>{
                                          if(itemRes.relationKey){
                                              needArr.push(itemRes);
                                          }else{
                                              lastArr.push({...itemRes,value:res.nodeId+'.'+itemRes.value});
                                          }
                                      })
                                  }
                                  let childrenArr:any = transformArray(needArr,res.nodeId,res.name)
                                  lastArr = [...lastArr,...childrenArr]
                                  // console.log(lastArr,'lastArrlastArrlastArrlastArr');
                                  lastArrData = formuVariables.map(sws=>{
                                      let reuei = {...sws}
                                      if(sws.key == res.nodeId){
                                          reuei.children = [...reuei.children,...lastArr]
                                      }
                                      return reuei
                                  })
                              }
                          })
                      })
            }
        })
        let haveModelEventTarget:any = []
        haveModelEventTarget = doubleList.filter(rswe=>{
            return rswe.modelEventTarget && rswe.type == 'bpmn:StartEvent'
        })
        if(haveModelEventTarget.length==0){
            lastArrData = formuVariables
        }
    }else{
        lastArrData = formuVariables
    }
}
export function filteredData(data) {
    let obj = {
        text: 'text',
        textarea: 'text',
        int: 'number',
        float: 'numbers',
        money: 'numbers',
        numbers: 'numbers',
        parent: 'number',
        boolean: 'boolean',
        date: 'date',
        time: 'time',
        datetime: 'datetime',
        image: 'image',
        enum: 'select',
        user: 'user',
        department: 'department',
        TEXT: 'text',
        TEXTAREA: 'text',
        INT: 'number',
        FLOAT: 'numbers',
        MONEY: 'numbers',
        PARENT: 'number',
        BOOLEAN: 'boolean',
        DATE: 'date',
        TIME: 'time',
        DATETIME: 'datetime',
        IMAGE: 'image',
        ENUM: 'select',
        USER: 'user',
        USERS: 'users',
        DEPARTMENT: 'department',
        PASSWORD: 'PASSWORD',
        RICH_TEXT:'text',
        password:'text',
        CIPHERTEXT:'text',
        ciphertext:'text',
        SERIALNUMBER:'text',
        'serial-number':'text',
        RELATION:'text',
        relation:'text',
        FORMULA:'text',
        formula:'text',
        JSON:'text',
        json:'text',
        'rich-text':'text',
        ATTACHMENT: 'text',
        attachment:'text',
        DATE_RANGE:'dateRang',
        'date-range':'dateRang',
        users:'users',
    }
    let customObj = {
        // textarea
        "text": {
            "value": getSchemaTpl('tplFormulaControl', {
                variables: formuVariables,
                placeholder: '',
                valueType: {
                    type: 'text'
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': "select_any_in",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': "select_not_any_in",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                "like",
                "not_like",
                "starts_with",
                "ends_with",
            ]
        },

        // "float"
        // "money"
        // "int"
        // "parent"
        "number": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    type: 'number'
                },
                formulaEchoVal: false,
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "less",
                "less_or_equal",
                "greater",
                "greater_or_equal",
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': "select_any_in",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': "select_not_any_in",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                "like",
                "starts_with",
                "ends_with"
            ]
        },
        "numbers": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                "precision": 2,
                "step": 0.01,
                valueType: {
                    type: 'number',
                    "precision": 2,
                    "step": 0.01,
                },
                formulaEchoVal: false,
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "less",
                "less_or_equal",
                "greater",
                "greater_or_equal",
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': "select_any_in",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': "select_not_any_in",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                "like",
                "starts_with",
                "ends_with"
            ]
        },

        "boolean": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'select',
                    "options": [
                        {
                            "value": true,
                            "label": "开启"
                        },
                        {
                            "value": false,
                            "label": "关闭"
                        }
                    ],
                },
                formulaEchoVal: false,
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
            ]
        },

        "date": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'YYYY-MM-DD',
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "less",
                "less_or_equal",
                "greater",
                "greater_or_equal",
                "between",
                "not_between",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

        "time": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'HH:mm:ss',
                    'viewMode': 'time'
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "less",
                "less_or_equal",
                "greater",
                "greater_or_equal",
                "between",
                "not_between",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

        "datetime": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'YYYY-MM-DD HH:mm:ss',
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "less",
                "less_or_equal",
                "greater",
                "greater_or_equal",
                "between",
                "not_between",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

       "dateRang": {
            "value": getSchemaTpl('formulaControl', {
                variables: formuVariables,
                rendererSchema:{
                    "type": "input-datetime-range"
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                "equal",
                "not_equal",
                "less",
                "less_or_equal",
                "greater",
                "greater_or_equal",
                "between",
                "not_between",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

        "image": {
            "operators": [
                "is_empty",
                "is_not_empty"
            ]
        },

        // enum
        "select": {
            "operators": [
                "select_equals",
                "select_not_equals",
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'select',
                },
                advancedFeature: advancedFeature
            }),
        },

        "user": {
            "operators": [
                {
                    "value": "user_equal",
                    "label": "等于"
                },
                {
                    "value": "user_not_equal",
                    "label": "不等于"
                },
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],

            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'user',
                    "labelField": "nickname",
                    "valueField": "username",
                    "source": useDevBaseUrl("/system/user/list-all-simple"),
                },
                advancedFeature: advancedFeature
            }),
        },
        "users": {
            "operators": [
                {
                    "value": "users_equal",
                    "label": "等于"
                },
                {
                    "value": "users_not_equals",
                    "label": "不等于"
                },
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],

            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'select',
                    "labelField": "nickname",
                    "valueField": "username",
                    "source":useDevBaseUrl("/system/user/list-all-simple"),
                    "multiple": true,
        "searchable": true,
        "selectMode": "group",
                },
                advancedFeature: advancedFeature
            }),
        },

        "department": {
            "operators": [
                {
                    "value": "dep_equal",
                    "label": "等于"
                },
                {
                    "value": "dep_not_equal",
                    "label": "不等于"
                },
                "is_empty",
                "is_not_empty",
                {
                    'label': '包含',
                    'value': 'select_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含',
                    'value': 'select_not_any_in',
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    "value": "dep_belong",
                    "label": "属于"
                },
                {
                    "value": "dep_not_belong",
                    "label": "不属于"
                }
            ],

            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'department',
                    "source": useDevBaseUrl("/system/dept/list-all-simple"),
                },
                advancedFeature: advancedFeature
            }),
        },

    }
    let toManyCustomObj = {
        "text": {
            "value": getSchemaTpl('tplFormulaControl', {
                variables: formuVariables,
                placeholder: '',
                valueType: {
                    type: 'text'
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    "label": "模糊匹配（且）",
                    "value": "like and"
                },
                {
                    "label": "模糊匹配（或）",
                    "value": "like or"
                },
                {
                    "label": "不匹配（且）",
                    "value": "not_like and"
                },
                {
                    "label": "不匹配（或）",
                    "value": "not_like or"
                },
                {
                    "label": "匹配开头（且）",
                    "value": "starts_with and"
                },
                {
                    "label": "匹配开头（或）",
                    "value": "starts_with or"
                },
                {
                    "label": "匹配结尾（且）",
                    "value": "ends_with and"
                },
                {
                    "label": "匹配结尾（或）",
                    "value": "ends_with or"
                }
            ]
        },

        // "float"
        // "money"
        // "int"
        // "parent"
        "number": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    type: 'number'
                },
                formulaEchoVal: false,
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "小于（且）",
                    "value": "less and"
                },
                {
                    "label": "小于（或）",
                    "value": "less or"
                },
                {
                    "label": "小于或等于（且）",
                    "value": "less_or_equal and"
                },
                {
                    "label": "小于或等于（或）",
                    "value": "less_or_equal or"
                },
                {
                    "label": "大于（且）",
                    "value": "greater and"
                },
                {
                    "label": "大于（或）",
                    "value": "greater or"
                },
                {
                    "label": "大于或等于（且）",
                    "value": "greater_or_equal and"
                },
                {
                    "label": "大于或等于（或）",
                    "value": "greater_or_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    "label": "模糊匹配（且）",
                    "value": "like and"
                },
                {
                    "label": "模糊匹配（或）",
                    "value": "like or"
                },
                {
                    "label": "匹配开头（且）",
                    "value": "starts_with and"
                },
                {
                    "label": "匹配开头（或）",
                    "value": "starts_with or"
                },
                {
                    "label": "匹配结尾（且）",
                    "value": "ends_with and"
                },
                {
                    "label": "匹配结尾（或）",
                    "value": "ends_with or"
                }
            ]
        },
        "numbers": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                "precision": 2,
                "step": 0.01,
                valueType: {
                    type: 'number',
                    "precision": 2,
                    "step": 0.01,
                },
                formulaEchoVal: false,
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "小于（且）",
                    "value": "less and"
                },
                {
                    "label": "小于（或）",
                    "value": "less or"
                },
                {
                    "label": "小于或等于（且）",
                    "value": "less_or_equal and"
                },
                {
                    "label": "小于或等于（或）",
                    "value": "less_or_equal or"
                },
                {
                    "label": "大于（且）",
                    "value": "greater and"
                },
                {
                    "label": "大于（或）",
                    "value": "greater or"
                },
                {
                    "label": "大于或等于（且）",
                    "value": "greater_or_equal and"
                },
                {
                    "label": "大于或等于（或）",
                    "value": "greater_or_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    "label": "模糊匹配（且）",
                    "value": "like and"
                },
                {
                    "label": "模糊匹配（或）",
                    "value": "like or"
                },
                {
                    "label": "匹配开头（且）",
                    "value": "starts_with and"
                },
                {
                    "label": "匹配开头（或）",
                    "value": "starts_with or"
                },
                {
                    "label": "匹配结尾（且）",
                    "value": "ends_with and"
                },
                {
                    "label": "匹配结尾（或）",
                    "value": "ends_with or"
                }
            ]
        },

        "boolean": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'select',
                    "options": [
                        {
                            "value": true,
                            "label": "开启"
                        },
                        {
                            "value": false,
                            "label": "关闭"
                        }
                    ],
                },
                formulaEchoVal: false,
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

        "date": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'YYYY-MM-DD',
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "小于（且）",
                    "value": "less and"
                },
                {
                    "label": "小于（或）",
                    "value": "less or"
                },
                {
                    "label": "小于或等于（且）",
                    "value": "less_or_equal and"
                },
                {
                    "label": "小于或等于（或）",
                    "value": "less_or_equal or"
                },
                {
                    "label": "大于（且）",
                    "value": "greater and"
                },
                {
                    "label": "大于（或）",
                    "value": "greater or"
                },
                {
                    "label": "大于或等于（且）",
                    "value": "greater_or_equal and"
                },
                {
                    "label": "大于或等于（或）",
                    "value": "greater_or_equal or"
                },
                {
                    "label": "属于范围（且）",
                    "value": "between and"
                },
                {
                    "label": "属于范围（或）",
                    "value": "between or"
                },
                {
                    "label": "不属于范围（且）",
                    "value": "not_between and"
                },
                {
                    "label": "不属于范围（或）",
                    "value": "not_between or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

        "time": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'HH:mm:ss',
                    'viewMode': 'time'
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "小于（且）",
                    "value": "less and"
                },
                {
                    "label": "小于（或）",
                    "value": "less or"
                },
                {
                    "label": "小于或等于（且）",
                    "value": "less_or_equal and"
                },
                {
                    "label": "小于或等于（或）",
                    "value": "less_or_equal or"
                },
                {
                    "label": "大于（且）",
                    "value": "greater and"
                },
                {
                    "label": "大于（或）",
                    "value": "greater or"
                },
                {
                    "label": "大于或等于（且）",
                    "value": "greater_or_equal and"
                },
                {
                    "label": "大于或等于（或）",
                    "value": "greater_or_equal or"
                },
                {
                    "label": "属于范围（且）",
                    "value": "between and"
                },
                {
                    "label": "属于范围（或）",
                    "value": "between or"
                },
                {
                    "label": "不属于范围（且）",
                    "value": "not_between and"
                },
                {
                    "label": "不属于范围（或）",
                    "value": "not_between or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

        "datetime": {
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'time',
                    'valueFormat': 'YYYY-MM-DD HH:mm:ss',
                },
                advancedFeature: advancedFeature
            }),
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "not_equal or"
                },
                {
                    "label": "小于（且）",
                    "value": "less and"
                },
                {
                    "label": "小于（或）",
                    "value": "less or"
                },
                {
                    "label": "小于或等于（且）",
                    "value": "less_or_equal and"
                },
                {
                    "label": "小于或等于（或）",
                    "value": "less_or_equal or"
                },
                {
                    "label": "大于（且）",
                    "value": "greater and"
                },
                {
                    "label": "大于（或）",
                    "value": "greater or"
                },
                {
                    "label": "大于或等于（且）",
                    "value": "greater_or_equal and"
                },
                {
                    "label": "大于或等于（或）",
                    "value": "greater_or_equal or"
                },
                {
                    "label": "属于范围（且）",
                    "value": "between and"
                },
                {
                    "label": "属于范围（或）",
                    "value": "between or"
                },
                {
                    "label": "不属于范围（且）",
                    "value": "not_between and"
                },
                {
                    "label": "不属于范围（或）",
                    "value": "not_between or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ]
        },

       "dateRang": {
            "value": getSchemaTpl('formulaControl', {
                variables: formuVariables,
                rendererSchema:{
                    "type": "input-datetime-range"
                },
                advancedFeature: advancedFeature
            }),
           "operators": [
               {
                   "label": "等于（且）",
                   "value": "equal and"
               },
               {
                   "label": "等于（或）",
                   "value": "equal or"
               },
               {
                   "label": "不等于（且）",
                   "value": "not_equal and"
               },
               {
                   "label": "不等于（或）",
                   "value": "not_equal or"
               },
               {
                   "label": "小于（且）",
                   "value": "less and"
               },
               {
                   "label": "小于（或）",
                   "value": "less or"
               },
               {
                   "label": "小于或等于（且）",
                   "value": "less_or_equal and"
               },
               {
                   "label": "小于或等于（或）",
                   "value": "less_or_equal or"
               },
               {
                   "label": "大于（且）",
                   "value": "greater and"
               },
               {
                   "label": "大于（或）",
                   "value": "greater or"
               },
               {
                   "label": "大于或等于（且）",
                   "value": "greater_or_equal and"
               },
               {
                   "label": "大于或等于（或）",
                   "value": "greater_or_equal or"
               },
               {
                   "label": "属于范围（且）",
                   "value": "between and"
               },
               {
                   "label": "属于范围（或）",
                   "value": "between or"
               },
               {
                   "label": "不属于范围（且）",
                   "value": "not_between and"
               },
               {
                   "label": "不属于范围（或）",
                   "value": "not_between or"
               },
               {
                   'label': '包含（且）',
                   'value': "select_any_in and",
                   'values': [
                       getSchemaTpl('formulaControl-hour', {
                           containDisabled:true,
                           variables: formuVariables,
                           placeholder: '',
                           advancedFeature: advancedFeature,
                           name: 'selectAnyIn'
                       }),
                   ]
               },
               {
                   'label': '包含（或）',
                   'value': "select_any_in or",
                   'values': [
                       getSchemaTpl('formulaControl-hour', {
                           containDisabled:true,
                           variables: formuVariables,
                           placeholder: '',
                           advancedFeature: advancedFeature,
                           name: 'selectAnyIn'
                       }),
                   ]
               },
               {
                   'label': '不包含（且）',
                   'value': "select_not_any_in and",
                   'values': [
                       getSchemaTpl('formulaControl-hour', {
                           containDisabled:true,
                           variables: formuVariables,
                           placeholder: '',
                           advancedFeature: advancedFeature,
                           name:'selectNotAnyIn'
                       }),
                   ]
               },
               {
                   'label': '不包含（或）',
                   'value': "select_not_any_in or",
                   'values': [
                       getSchemaTpl('formulaControl-hour', {
                           containDisabled:true,
                           variables: formuVariables,
                           placeholder: '',
                           advancedFeature: advancedFeature,
                           name:'selectNotAnyIn'
                       }),
                   ]
               }
           ]
       },

        "image": {
            "operators": [
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                }
            ],
            value:{}
        },

        // enum
        "select": {
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "select_equals and"
                },
                {
                    "label": "等于（或）",
                    "value": "select_equals or"
                },
                {
                    "label": "不等于（且）",
                    "value": "select_not_equals and"
                },
                {
                    "label": "不等于（或）",
                    "value": "select_not_equals or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],
            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'select',
                },
                advancedFeature: advancedFeature
            }),
        },

        "user": {
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "user_equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "user_equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "user_not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "user_not_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],

            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'user',
                    "labelField": "nickname",
                    "valueField": "username",
                    "source": useDevBaseUrl("/system/user/list-all-simple"),
                },
                advancedFeature: advancedFeature
            }),
        },
        "users": {
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "user_equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "user_equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "user_not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "user_not_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                }
            ],


            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'select',
                    "labelField": "nickname",
                    "valueField": "username",
                    "source":useDevBaseUrl("/system/user/list-all-simple"),
                    "multiple": true,
        "searchable": true,
        "selectMode": "group",
                },
                advancedFeature: advancedFeature
            }),
        },

        "department": {
            "operators": [
                {
                    "label": "等于（且）",
                    "value": "dep_equal and"
                },
                {
                    "label": "等于（或）",
                    "value": "dep_equal or"
                },
                {
                    "label": "不等于（且）",
                    "value": "dep_not_equal and"
                },
                {
                    "label": "不等于（或）",
                    "value": "dep_not_equal or"
                },
                {
                    "label": "为空（且）",
                    "value": "is_empty and"
                },
                {
                    "label": "为空（或）",
                    "value": "is_empty or"
                },
                {
                    "label": "不为空（且）",
                    "value": "is_not_empty and"
                },
                {
                    "label": "不为空（或）",
                    "value": "is_not_empty or"
                },
                {
                    'label': '包含（且）',
                    'value': "select_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '包含（或）',
                    'value': "select_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name: 'selectAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（且）',
                    'value': "select_not_any_in and",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    'label': '不包含（或）',
                    'value': "select_not_any_in or",
                    'values': [
                        getSchemaTpl('formulaControl-hour', {
                            containDisabled:true,
                            variables: formuVariables,
                            placeholder: '',
                            advancedFeature: advancedFeature,
                            name:'selectNotAnyIn'
                        }),
                    ]
                },
                {
                    "label": "属于（且）",
                    "value": "dep_belong and"
                },
                {
                    "label": "属于（或）",
                    "value": "dep_belong or"
                },
                {
                    "label": "不属于（且）",
                    "value": "dep_not_belong and"
                },
                {
                    "label": "不属于（或）",
                    "value": "dep_not_belong or"
                }
            ],

            "value": getSchemaTpl('formulaControl-hour', {
                variables: formuVariables,
                valueType: {
                    "type": 'department',
                    "source": useDevBaseUrl("/system/dept/list-all-simple"),
                },
                advancedFeature: advancedFeature
            }),
        },

    }
    let ret = {}
    let beType = obj[data.primaryKeyType?data.primaryKeyType:data.type];
    // console.log(beType,'beType')
    // console.log(data,'data1111111111111111111')
    if (beType == undefined) {
        // console.log(data,'data2222222222')
        ret = beType
    } else {
        // console.log(data,'data3333333')
        ret = {
            "label": data.label,
            "dbType": data.dbType,
            "yuanType": data.type,
            "type": "custom",
            "types": beType,
            "isPrimaryKey":data.isPrimaryKey,
            "primaryKeyType":data.primaryKeyType,
            "isForeignKey":data.isForeignKey,
            "isCreateDate":data.isCreateDate,
            "isCreateUser":data.isCreateUser,
            "isDeleteDate":data.isDeleteDate,
            "isTenantCode":data.isTenantCode,
            "isDeleteFlag":data.isDeleteFlag,
            "isDeleteUser":data.isDeleteUser,
            "isGenerated":data.isGenerated,
            "isNullable":data.isNullable,
            "isTreeParent":data.isTreeParent,
            "isUpdateDate":data.isUpdateDate,
            "isUpdateUser":data.isUpdateUser,
            driver:data.driver,
            "sort":data.sort,
            // "type": data.type,
            // "type": beType,
            "name": data.code?data.code:data.key?data.key:data.name,
            relationKey:data.relationKey?data.relationKey:null,
            relationMode:data.relationMode?data.relationMode:null,
            // "name": data.code,
            // ...customObj[beType]
        }
        if(data.type === 'time' || data.type === 'datetime'){
            ret = {...ret,
                precision:data.precision,
                showPrecision:data.showPrecision,
                precisionCompatible:data.precisionCompatible
            }
            if('defaultValue' in ret){
                ret.defaultValue = truncateTimePrecision(data.defaultValue,data.precisionCompatible && data.showPrecision > 3 ? 3 : data.showPrecision)
            }
           if(data.showPrecision > 3 && !data.precisionCompatible){
                ret.types = 'text'
                beType = 'text'
            }
        }
        if(data.relationMode && data.relationMode.includes(':n')){
            ret = {...ret,...toManyCustomObj[beType]}
        }else{
            ret = {...ret,...customObj[beType]}
        }
        console.log(ret,'retretretret')
        if (beType == 'select') {
            if (data?.meiptions == 'custom') {
                if(data.options){
                    ret['value']['valueType']['options'] = data.options
                }else{
                    ret['value']['valueType']['options'] = []
                }
            } else {
                ret['value']['valueType']['source'] = data.source
            }
        }
        if(ret['value']){
            ret['value']['variables'] = formuVariables
        }
    }

    // console.log(ret,'ret')

    return ret
}
