import React, {useEffect, useRef, useState} from 'react';
import {
  Form,
  Input,
  message,
  Switch,
  Tooltip,
  Select,
  Cascader,
  Radio,
  Modal
} from 'antd';
import {InfoCircleOutlined} from '@ant-design/icons';
import {handleProcessId, handleProcessName} from '@/redux/slice/bpmnSlice';
import {useAppDispatch, useAppSelector} from '@/redux/hook/hooks';
import {handleServiceRaskList} from '@/redux/slice/bpmnSlice';
import {render as amisRender} from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import {filteredData} from '@/bpmn/panel/ElementTask/ServiceTask/conditionBuilder';
import {
  getNoLoopRelation,
  getNoLoopRelations,
  groupByRelationKeyWithPK
} from '@/bpmn/panel/ElementTask/ServiceTask/config';
import {service} from '@/utils/request';
import {transformSelectAnyIn,reverseTransformSelectAnyIn} from "../ElementTask/ServiceTask/config";
import {getFormatStringByPrecision} from '@/utils';

const keyOptions = {
  id: 'id',
  name: 'name',
  isExecutable: 'isExecutable',
  versionTag: 'versionTag',
  eventTriggering: 'eventTriggering',
  eventDefinitionType: 'eventDefinitionType',
  modelEventTarget: 'modelEventTarget',
  bindInitiationPage: 'bindInitiationPage',
  filterMode: 'filterMode',
  filterFields: 'filterFields',
  timerTaskSwitch: 'timerTaskSwitch',
  actPriority: 'actPriority',
};

interface IProps {
  businessObject: any;
}

/**
 * 常规信息 组件
 *
 * @param props
 * @constructor
 */
export default function ElementBaseInfo(props: IProps) {
  console.log(props, '常规信息propspropspropspropsprops');
  const serviceList = useAppSelector(state => state.bpmn.serviceRaskList);
  const entityList = useAppSelector(state => state.bpmn.entityList);
  // const modelName = useAppSelector(state => state.bpmn.processName);
  // const processId = useAppSelector(state => state.bpmn.processId);
  const serviceListValue = useRef([]);
  const isUseEff = useRef(false);
  // props
  const {businessObject} = props;
  // form
  const [form] = Form.useForm<{
    id: string;
    name: string;
    isExecutable: boolean;
    bindInitiationPage: boolean;
    timerTaskSwitch: boolean;
    versionTag: string;
    eventTriggering: string;
    modelEventTarget: string;
    filterMode: string;
    filterFields: object;
    eventDefinitionType: number;
    actPriority: number;
  }>();
  // redux
  const dispatch = useAppDispatch();

  // 选择实体
  const [cascaderOptions, setCascaderOptions] = useState([]);

  // 过滤器的相关应用
  const [radioValue, setRadioValue] = useState('normal');
  const modelFilterFieldsData = useRef({});
  // 筛选条件 简单类型列表数据
  const [filterFields, setFilterFields] = useState({});
  // 筛选条件 复杂类型弹框数据
  const [modelFilterFields, setModelFilterFields] = useState({});
  const [isShow, setIsShow] = useState(true);
  const [isShows, setIsShows] = useState(false);
  const yuanData = useRef([])
  // 过滤器 更新字段数据
  const [updateFieldsOption, setUpdateFieldsOption] = useState([]);
  // 高级设置弹出层显示隐藏
  const [isModalOpen, setIsModalOpen] = useState(false);
  /**
   * 只监听id的原因:
   * 1、只有切换当前节点才重新执行初始化操作
   * 2、当前节点属性变化时,不需要重新初始化操作
   * 3、因为每个节点的id是必不相同的,所以可以用作依赖项
   */
  useEffect(() => {
    if (businessObject) {
      isUseEff.current = true;
      initPageData();
    }
    if(businessObject && businessObject.$type != "bpmn:UserTask" && businessObject.extensionElements){
      window.bpmnInstance?.modeling?.updateProperties(
        window.bpmnInstance?.element,
        {
          extensionElements: undefined,
        },
      );
    }
    if(businessObject && businessObject.$type != "bpmn:UserTask" && businessObject.loopCharacteristics){
      window.bpmnInstance?.modeling?.updateProperties(
        window.bpmnInstance?.element,
        {
          loopCharacteristics: undefined,
        },
      );
    }
    if(businessObject && businessObject.$type == "bpmn:ServiceTask"){
      if(!('calss' in businessObject)){
        window.bpmnInstance.modeling.updateProperties(
          window.bpmnInstance.element,
          {
            [`flowable:class`]:
              'cn.iocoder.yudao.module.processManage.handler.delegate.RecordDelegate'
          }
        );
      }
    }
  }, [businessObject?.id]);
  useEffect(() => {
    form.setFieldsValue({
      name: businessObject?.name,
      actPriority: businessObject?.actPriority
    });
  }, [businessObject?.name]);
  useEffect(() => {
    console.log(serviceList, '常规信息数据变化');
    serviceListValue.current = serviceList;
  }, [serviceList]);
  const schema = {
    type: 'page',
    className: 'b-dark bg-light',
    onEvent: {
      init: {
        weight: 0,
        actions: [
          {
            actionType: 'setValue',
            componentId: 'nestedId',
            args: {
              value: businessObject?.modelEventTarget ?
                businessObject.modelEventTarget.includes('.')
                  ? businessObject.modelEventTarget : null : null,
            }
          }
        ]
      }
    },
    body: {
      type: 'form',
      mode: 'horizontal',
      horizontal: {
        left: 0.1,
        right: 10
      },
      wrapWithPanel: false,
      body: [
        {
          required: true,
          type: 'nested-select',
          name: 'nestedSelect',
          id: 'nestedId',
          onlyLeaf: true,
          label: '',
          options: cascaderOptions,
          value: businessObject?.modelEventTarget ?
    businessObject.modelEventTarget.includes('.')
      ? businessObject.modelEventTarget : null : null,
        }
      ],
      onEvent: {
        change: {
          actions: [
            {
              actionType: 'custom',
              script: function(_, doAction, event) {
                console.log(_, doAction, event, '_____');
                // console.log(cascaderValue, 'cascaderValuecascaderValue');
                console.log(isUseEff, 'isUseEffisUseEffisUseEff');
                // setCascaderOptions(event.data.nestedSelect);
                if(!isUseEff.current){
                  setFilterFields({});
                  setModelFilterFields({});
                  modelFilterFieldsData.current = {};
                  form.setFieldValue('filterFields', {});
                  window.bpmnInstance.modeling.updateProperties(
                      window.bpmnInstance.element,
                      {
                        filterFields: undefined
                      }
                  );
                }
                  entityList.data.options.forEach(res => {
                    res.children.forEach(item => {
                      if (item.value == event.data.nestedSelect) {
                        form.setFieldValue('modelEventTarget', event.data.nestedSelect);
                        window.bpmnInstance.modeling.updateProperties(
                          window.bpmnInstance.element,
                          {
                            modelEventTarget: item.value
                          }
                        );
                        let relationAllArr = []
                        let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                        let asdArr = item.form.fields.filter(item => {
                          return (
                            item.type != 'relation' &&
                            !item.isDeleteUser &&
                            !item.isDeleteDate &&
                            !item.isTenantCode &&
                            !item.isForeignKey &&
                            !item.isDeleteFlag &&
                            !item.isCreateDate &&
                            !item.isUpdateDate &&
                            !item.isUpdateUser &&
                            !item.isCreateUser &&
                            item.type != 'date-range' &&
                            item.type != 'rich-text' &&
                            item.type != 'attachment' &&
                            item.type != 'formula' &&
                            // item.type != 'users' &&
                            item.type != 'password' &&
                            item.type != 'ciphertext' &&
                            item.type != 'json'
                          );
                        });
                        asdArr = asdArr.map(swop=>{
                          if(swop.isTreeParent) {
                            return {...swop,
                              primaryKeyType: primaryKeyData[0].type}
                          }else{
                            return swop
                          }
                        })
                        if (
                            item.form.relationFields &&
                            item.form.relationFields != null
                        ) {
                          let relationPrimaryKeyData = groupByRelationKeyWithPK(item.form.relationFields)
                          item.form.relationFields.forEach((ikj, index) => {
                            // if(ikj.relationMode != '1:n'){
                              if (
                                  !ikj.isForeignKey &&
                                  !ikj.isDeleteUser &&
                                  !ikj.isDeleteDate &&
                                  !ikj.isDeleteFlag &&
                                  !ikj.isCreateDate &&
                                  !ikj.isUpdateDate &&
                                  !ikj.isUpdateUser &&
                                  !ikj.isCreateUser &&
                                  ikj.type != 'formula'  &&
                                  ikj.type != 'date-range' &&
                                  ikj.type != 'rich-text' &&
                                  ikj.type != 'attachment' &&
                                  ikj.type != 'formula' &&
                                  // ikj.type != 'users' &&
                                  ikj.type != 'password' &&
                                  ikj.type != 'ciphertext' &&
                                  ikj.type != 'json' &&
                                  !ikj.isTenantCode
                              ) {
                                if (
                                    ikj.label.includes('【') &&
                                    ikj.relationKey &&
                                    ikj.relationKey != ''
                                ) {
                                  if(ikj.isTreeParent) {
                                    relationAllArr.push({
                                      ...ikj,
                                      // key: ikj.relationKey + '.' + ikj.key,
                                      title: ikj.label,
                                      primaryKeyType: relationPrimaryKeyData[ikj.relationKey].type
                                    });
                                  }else{
                                    relationAllArr.push({
                                      ...ikj,
                                      // key: ikj.relationKey + '.' + ikj.key,
                                      title: ikj.label
                                    });
                                  }
                                } else {
                                  if(ikj.isTreeParent) {
                                    relationAllArr.push({...ikj, title: ikj.label,
                                      primaryKeyType: relationPrimaryKeyData[ikj.relationKey].type
                                    });
                                  }else{
                                    relationAllArr.push({...ikj, title: ikj.label});
                                  }
                                }
                              }
                            // }
                          });
                        }
                        let objectArr:any = [res.value,event.data.nestedSelect]
                        let lastAllDatas = getNoLoopRelations(relationAllArr,item.form.originRelation,entityList.data.options,objectArr).filter(res=>{
                          return res.type != 'relation';
                        })
                        console.log(asdArr,'asdArrasdArrasdArrasdArr')
                        console.log(lastAllDatas,'lastAllDatas')
                        asdArr = [...asdArr,...lastAllDatas]
                        let asds = builderChange(asdArr);
                        let asd:any = asds.map(sjsw => {
                            if (
                                sjsw.label.includes('【') &&
                                sjsw.relationKey != '' &&
                                sjsw.relationKey != null
                            ) {
                              return{
                                ...sjsw,
                                key: sjsw.relationKey + '.' + sjsw.name,
                                name: sjsw.relationKey + '.' + sjsw.name,
                              };
                            } else {
                              return{...sjsw, key: sjsw.name};
                            }
                          // }
                        });
                        asd = asd.filter(swsw=>{
                          return !swsw.isTenantCode
                        })
                        console.log(asd, 'asdasdasdasd');
                        yuanData.current = asd;
                        let haveDefinitionType = form.getFieldValue('eventDefinitionType')
                        console.log(haveDefinitionType,'aaaaaa')
                        if(haveDefinitionType && haveDefinitionType == 1){
                          asd = asd.filter(item => item.yuanType !== "serial-number")
                              .filter(item => (!item.isPrimaryKey) || (item.isPrimaryKey && item.relationKey !== null));
                        }
                        asd = asd.map(item => {
                          if (item.yuanType == 'users') {
                            return {
                              ...item,
                              value:{
                                ...item.value,
                                "type": "ae-formulaControl",
                                rendererSchema: {
                                  'type': 'user-select',
                                  'multiple':true,
                                  'searchable':true,
                                  'clearable':true,
                                  'rightButton':true,
                                  'selectMode': "associated",
                                  'leftMode': "tree",
                                  'source': "app://user/source"
                                },
                              }
                            };
                          }
                          return item;
                        });
                        setUpdateFieldsOption(asd.map(res=>{
                          let rertun = {...res}
                          if(res.yuanType == 'time' || res.yuanType == 'datetime'){
                            const formatString = getFormatStringByPrecision(res.yuanType == 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss', rertun.showPrecision > 3 ? 3 : rertun.showPrecision, rertun.precisionCompatible);
                            rertun.value.valueType.format = formatString
                            rertun.value.valueType.valueFormat = formatString
                            rertun.value.valueType.inputFormat = formatString
                            rertun.value.valueType.displayFormat = formatString
                          }
                          return rertun
                        }));
                        console.log(serviceList, 'serviceList');
                      }
                    });
                  });
                isUseEff.current = false;
              }
            }
          ]
        }
      }
    }
  };

  /**
   * 初始化页面数据
   */
  function initPageData() {
    console.log(
      businessObject,
      'businessObjectbusinessObjectbusinessObjectbusinessObject'
    );
    form.setFieldsValue({
      id: businessObject?.id,
      name: businessObject?.name,
      actPriority: businessObject?.actPriority,
      eventTriggering: businessObject?.eventTriggering || false,
      eventDefinitionType: businessObject?.eventDefinitionType?Number(businessObject?.eventDefinitionType):undefined,
      modelEventTarget: businessObject.modelEventTarget
        ? businessObject?.modelEventTarget.includes('.')
          ? [
              businessObject.modelEventTarget.split('.')[0],
              businessObject.modelEventTarget.split('.')[1]
            ]
          : ''
        : '',
      isExecutable: businessObject?.isExecutable || false,
      filterMode: businessObject.filterMode?businessObject.filterMode:'normal',
      filterFields: businessObject.filterFields?
          typeof businessObject.filterFields == 'string' ?
              reverseTransformSelectAnyIn(JSON.parse(businessObject.filterFields))
              :
              reverseTransformSelectAnyIn(businessObject.filterFields)
          :"",
      bindInitiationPage: businessObject?.bindInitiationPage || false,
      timerTaskSwitch: businessObject?.timerTaskSwitch || false,
      versionTag: businessObject?.versionTag,
    });
    if (businessObject?.eventTriggering) {
        setCascaderOptions(entityList.data.options);
        entityList.data.options.forEach(res => {
          res.children.forEach(item => {
            if (businessObject.modelEventTarget && item.value == businessObject.modelEventTarget.split('.')[1]) {
              console.log(item, 'itemitemitemitem');
              let allData: any = [];
              if (item.form.fields && item.form.fields != null) {
                let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                allData = item.form.fields.map(swop=>{
                  if(swop.isTreeParent) {
                    return {...swop,
                      primaryKeyType: primaryKeyData[0].type}
                  }else{
                    return swop
                  }
                })
              }
              let arrs = builderChange(allData);
              console.log(arrs, 'arrs');
              let needArr: any = [];
              arrs.forEach(item => {
                if(!swsw.isTenantCode){
                    if (
                      item.label.includes('【') &&
                      item.relationKey != '' &&
                      item.relationKey != null
                    ) {
                      needArr.push({
                        ...item,
                        key: item.relationKey + '.' + item.name,
                        name: item.relationKey + '.' + item.name
                      });
                    } else {
                      needArr.push({...item, key: item.name});
                    }
                }
              });
              console.log(needArr, 'needArr');
              let newNeedArr = needArr.map(sjw => {
                return {
                  disabled: false,
                  isMember: false,
                  label: sjw.label,
                  path: sjw.label,
                  tag: getTypeChinese(sjw.types),
                  type: "string",
                  value: sjw.key
                }
              })
              needArr = needArr.map(rres => {
                let returnData = {...rres};
                let returnVar: any = [];
                if (returnData.value && returnData.value.variables) {
                  returnData.value.variables.forEach(sws => {
                    if (sws.label != '流程参数') {
                      returnVar.push(sws);
                    }
                  });
                  returnVar.push({
                    disabled: false,
                    isMember: false,
                    label: '实体数据',
                    path: '实体数据',
                    children: newNeedArr
                  });
                  returnData.value.variables = returnVar;
                } else if (!returnData.value) {
                  returnData.value = {
                    variables: [
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
                      },
                      {
                        disabled: false,
                        isMember: false,
                        label: '实体数据',
                        path: '实体数据',
                        children: newNeedArr
                      }
                    ]
                  };
                }
                return returnData;
              });
              console.log(needArr, 'needArr');
              setIsShow(false);
              setTimeout(() => {
                setIsShow(true);
              }, 100);
              needArr = needArr.map(item => {
                if (item.yuanType == 'users') {
                  return {
                    ...item,
                    value:{
                      ...item.value,
                      "type": "ae-formulaControl",
                      rendererSchema: {
                        'type': 'user-select',
                        'multiple':true,
                        'searchable':true,
                        'clearable':true,
                        'rightButton':true,
                        'selectMode': "associated",
                        'leftMode': "tree",
                        'source': "app://user/source"
                      },
                    }
                  };
                }
                return item;
              });
              setUpdateFieldsOption(needArr.map(res=>{
                let rertun = {...res}
                if(res.yuanType == 'time' || res.yuanType == 'datetime'){
                  const formatString = getFormatStringByPrecision(res.yuanType == 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss', rertun.showPrecision > 3 ? 3 : rertun.showPrecision, rertun.precisionCompatible);
                  rertun.value.valueType.format = formatString
                  rertun.value.valueType.valueFormat = formatString
                  rertun.value.valueType.inputFormat = formatString
                  rertun.value.valueType.displayFormat = formatString
                }
                return rertun
              }));
              yuanData.current = needArr;
            }
          });
        })
    }
    if (businessObject.filterMode) {
      setRadioValue(businessObject.filterMode)
      modelFilterFieldsData.current = businessObject.filterFields?
          typeof businessObject.filterFields == 'string' ?
          JSON.parse(businessObject.filterFields)
              :businessObject.filterFields
          :{}
    }else{
      setRadioValue('normal')
    }
  }

  /**
   * 更新常规信息
   *
   * @param key
   * @param value
   */
  function updateElementAttr(key: string, value: any) {
    console.log(key, 'key');
    console.log(value, 'value');
    console.log(keyOptions, 'keyOptions');
    console.log(window.bpmnInstance.element, 'window.bpmnInstance.element');
    if (key === keyOptions.id) {
      // id校验, 这里做一次校验是因为输入框监听的是change事件,输入框自带的校验无法拦截到,因此要在这里处理一下,防止将非法值更新到流程中
      const {status: validateFlag} = validateId(value);
      if (!validateFlag) {
        return;
      } else {
        try {
          window.bpmnInstance.elementRegistry._validateId(value);
        } catch (e: any) {
          message
            .error('编号已存在,当前修改未生效')
            .then(() => console.log(e.message));
          return;
        }
      }
      // 更新id
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          id: value,
          di: {id: `${businessObject[key]}_di`}
        }
      );
    } else {
      if (key == 'bindInitiationPage' && !value) {
        window.bpmnInstance.modeling.updateProperties(
          window.bpmnInstance.element,
          {
            formKey: undefined,
            data: undefined
          }
        );
      }
      if (key == 'timerTaskSwitch' && !value) {
        window.bpmnInstance.modeling.updateProperties(
          window.bpmnInstance.element,
          {
            formKey: undefined,
            data: undefined
          }
        );
      }
      if (key == 'timerTaskSwitch' && value) {
        window.bpmnInstance.modeling.updateProperties(
          window.bpmnInstance.element,
          {
            processInstanceStartVariables: undefined
          }
        );
      }
      // 更新其他属性
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          [key]: value || undefined
        }
      );
    }
    // 如果当前是process节点,则更新redux中的processId和processName
    if (businessObject.$type === 'bpmn:Process') {
      if (key === keyOptions.id) {
        dispatch(handleProcessId(value));
      } else if (key === keyOptions.name) {
        dispatch(handleProcessName(value));
      }
    }

    let arr = [];
    if (serviceListValue.current && serviceListValue.current.length > 0) {
      arr = serviceListValue.current.map(element => {
        if (element.serviceTaskId == businessObject.id) {
          return {
            ...element,
            taskName: value
          };
        } else {
          return element;
        }
      });
    }
    dispatch(handleServiceRaskList(arr));
  }

  /**
   * 校验id
   *
   * @param value
   */
  function validateId(value: string) {
    if (!value) {
      return {
        status: false,
        message: '编号为空'
      };
    } else if (value.includes(' ')) {
      return {
        status: false,
        message: '编号中包含空格'
      };
    } else {
      return {
        status: true,
        message: 'ok'
      };
    }
  }

  /**
   * 名称id
   *
   * @param value
   */
  function validateName(value: string) {
    if (!value) {
      return {
        status: false,
        message: '名称为空'
      };
    } else if (value.includes(' ')) {
      return {
        status: false,
        message: '名称中包含空格'
      };
    } else {
      return {
        status: true,
        message: 'ok'
      };
    }
  }
  function filterConditionTree(conditionTree, fields) {
    const serialNumberFields = new Set(
        fields
            .filter(field => field.yuanType === 'serial-number')
            .map(field => field.name)
    );

    const primaryKeyNonRelationFields = new Set(
        fields
            .filter(field => field.isPrimaryKey && field.relationKey == null)
            .map(field => field.name)
    );

    function traverse(node) {
      if (!node) return null;

      // 叶子节点判断
      if (node.left && node.right && typeof node.op === 'string') {
        const fieldName = node.left.field;

        if (
            serialNumberFields.has(fieldName) ||
            primaryKeyNonRelationFields.has(fieldName)
        ) {
          return null; // 过滤掉
        }

        return node;
      }

      // 处理非叶子节点
      if (Array.isArray(node.children)) {
        const filteredChildren = node.children
            .map(child => traverse(child))
            .filter(child => child !== null);

        if (filteredChildren.length === 0) {
          // ✅ 修改点：返回空 children 而不是 null
          return {
            ...node,
            children: []
          };
        }

        return {
          ...node,
          children: filteredChildren
        };
      }

      console.warn('Unknown node structure:', node);
      return null;
    }

    return traverse(conditionTree);
  }
  // 事件触发类型数据变化
  function eventTriggeringChange(e) {
    form.setFieldValue('eventTriggering', e);
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      eventDefinitionType: e
    });
    console.log(props,'props')
    console.log(updateFieldsOption,'updateFieldsOption')
    console.log(cascaderOptions,'CascaderOptions')
    if(updateFieldsOption && updateFieldsOption.length > 0 && e == 1){
      let newData = updateFieldsOption.filter(item => item.yuanType !== "serial-number")
          .filter(item => (!item.isPrimaryKey) || (item.isPrimaryKey && item.relationKey !== null));
      setUpdateFieldsOption(newData.map(res=>{
        let rertun = {...res}
        if(res.yuanType == 'time' || res.yuanType == 'datetime'){
          const formatString = getFormatStringByPrecision(res.yuanType == 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss', rertun.showPrecision > 3 ? 3 : rertun.showPrecision, rertun.precisionCompatible);
          rertun.value.valueType.format = formatString
          rertun.value.valueType.valueFormat = formatString
          rertun.value.valueType.inputFormat = formatString
          rertun.value.valueType.displayFormat = formatString
        }
        return rertun
      }))
      let result = null
      if(props.businessObject.filterFields){
         result = filterConditionTree(JSON.parse(props.businessObject.filterFields),updateFieldsOption);
        form.setFieldValue('filterFields',result)
        setFilterFields(result);
        let data = Object.assign({}, result);
        console.log(data, 'data');
        if (e) {
          window.bpmnInstance.modeling.updateProperties(
            window.bpmnInstance.element,
            {
              filterFields: JSON.stringify(reverseTransformSelectAnyIn(data))
            }
          );
        }
      }
    }else{
      console.log(yuanData.current,'yuanData.current')
      setUpdateFieldsOption(yuanData.current.map(res=>{
        let rertun = {...res}
        if(res.yuanType == 'time' || res.yuanType == 'datetime'){
          const formatString = getFormatStringByPrecision(res.yuanType == 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss', rertun.showPrecision > 3 ? 3 : rertun.showPrecision, rertun.precisionCompatible);
          rertun.value.valueType.format = formatString
          rertun.value.valueType.valueFormat = formatString
          rertun.value.valueType.inputFormat = formatString
          rertun.value.valueType.displayFormat = formatString
        }
        return rertun
      }))
    }
  }

  /**
   * 渲染Process节点独有组件 (版本标签、是否可执行)
   */
  function renderProcessExtension() {
    if (businessObject?.$type === 'bpmn:Process') {
      return (
        <>
          {/* <Form.Item label="版本标签" name="versionTag">
            <Input
              placeholder={'请输入'}
              onChange={(event) => {
                updateElementAttr(
                  keyOptions.versionTag,
                  event.currentTarget.value,
                );
              }}
            />
          </Form.Item> */}
          <Form.Item label="可执行" name="isExecutable" valuePropName="checked">
            <Switch
              checkedChildren="开"
              unCheckedChildren="关"
              onChange={checked => {
                updateElementAttr(keyOptions.isExecutable, checked);
              }}
            />
          </Form.Item>
        </>
      );
    }
  }

  /**
   * 渲染Process节点独有组件 (只有开始节点才有) 绑定发起页面
   */
  function renderBindInitiationPage() {
    if (
      window?.bpmnInstance?.element?.businessObject?.$type === 'bpmn:StartEvent' &&
      !window?.bpmnInstance?.element?.businessObject.eventDefinitions &&
      !window?.bpmnInstance?.element?.businessObject.eventTriggering &&
      !window?.bpmnInstance?.element?.businessObject.timerTaskSwitch
    ) {
      return (
        <>
          <Form.Item label="绑定发起页面" name="bindInitiationPage">
            <Switch
              checkedChildren="开"
              unCheckedChildren="关"
              onChange={bindInitiationPage => {
                if (bindInitiationPage) {
                  form.setFieldValue('timerTaskSwitch', false);
                  form.setFieldValue('eventTriggering', false);
                  window.bpmnInstance.modeling.updateProperties(
                    window.bpmnInstance.element,
                    {
                      eventTriggering: undefined,
                      timerTaskSwitch: undefined,
                      expScheduledTasks: undefined
                    }
                  );
                } else {
                  window.bpmnInstance.modeling.updateProperties(
                    window.bpmnInstance.element,
                    {
                      processFormFieldMapping: undefined,
                      editableFields: undefined,
                      hiddenFields: undefined,
                      disableFields: undefined
                    }
                  );
                  if (form.getFieldValue('timerTaskSwitch')) {
                    window.bpmnInstance.modeling.updateProperties(
                      window.bpmnInstance.element,
                      {
                        timerTaskSwitch: true,
                        expScheduledTasks: '* * * * * ? *'
                      }
                    );
                  }
                }
                updateElementAttr(
                  keyOptions.bindInitiationPage,
                  bindInitiationPage
                );
              }}
            />
          </Form.Item>
        </>
      );
    }
  }

  /**
   * 渲染Process节点独有组件 (只有开始节点才有) 事件触发按钮
   */
  function renderEventTriggeredSwitch() {
    if (
      window?.bpmnInstance?.element?.businessObject?.$type === 'bpmn:StartEvent' &&
      !window?.bpmnInstance?.element?.businessObject.eventDefinitions &&
      !window?.bpmnInstance?.element?.businessObject.bindInitiationPage &&
      !window?.bpmnInstance?.element?.businessObject.timerTaskSwitch
    ) {
      return (
        <>
          <Form.Item
            label={
              <>
                事件触发开关
                <Tooltip title="开启会删除流程入参数据">
                  <InfoCircleOutlined />
                </Tooltip>
              </>
            }
            name="eventTriggering"
          >
            <Switch
              checkedChildren="开"
              unCheckedChildren="关"
              onChange={eventTriggering => {
                console.log(eventTriggering, '事件触发开关eventTriggering');
                if (eventTriggering) {
                    setCascaderOptions(entityList.data.options);
                  form.setFieldValue('timerTaskSwitch', false);
                  form.setFieldValue('actPriority', 0);
                  form.setFieldValue('bindInitiationPage', false);
                  form.setFieldValue('filterMode', 'normal');
                  form.setFieldValue('eventDefinitionType', undefined);
                  setRadioValue('normal');
                  window.bpmnInstance.modeling.updateProperties(
                    window.bpmnInstance.element,
                    {
                      actPriority:0,
                      eventTriggering:true,
                      timerTaskSwitch: undefined,
                      processInstanceStartVariables: undefined,
                      expScheduledTasks: undefined,
                      processFormFieldMapping: undefined,
                      editableFields: undefined,
                      hiddenFields: undefined,
                      disableFields: undefined,
                      bindInitiationPage: undefined,
                      filterMode: 'normal',
                      filterFields: undefined
                    }
                  );
                  setIsShow(false);
                  setTimeout(() => {
                    setIsShow(true);
                  }, 100);
                } else {
                  setUpdateFieldsOption([])
                  form.setFieldValue('eventTriggering', false);
                  form.setFieldValue('eventDefinitionType', '');
                  form.setFieldValue('modelEventTarget', '');
                  form.setFieldValue('filterMode', 'normal');
                  setRadioValue('normal');
                  window.bpmnInstance.modeling.updateProperties(
                    window.bpmnInstance.element,
                    {
                      actPriority:undefined,
                      eventTriggering: undefined,
                      expScheduledTasks: undefined,
                      processFormFieldMapping: undefined,
                      editableFields: undefined,
                      hiddenFields: undefined,
                      disableFields: undefined,
                      eventDefinitionType: undefined,
                      modelEventTarget: undefined,
                      bindInitiationPage: undefined,
                      filterMode: undefined,
                      filterFields: undefined
                    }
                  );
                }
                updateElementAttr(keyOptions.eventTriggering, eventTriggering);
              }}
            />
          </Form.Item>
        </>
      );
    }
  }

  // 获取类型中文
  const getTypeChinese = e => {
    if (e == 'input-text') {
      return '单行文本';
    } else if (e == 'text') {
      return '单行文本';
    } else if (e == 'textarea') {
      return '多行文本';
    } else if (e == 'int') {
      return '整数(Int)';
    } else if (e == 'number') {
      return '整数(Int)';
    } else if (e == 'input-number') {
      return '整数(Int)';
    } else if (e == 'float') {
      return '小数';
    } else if (e == 'rich-text') {
      return '富文本';
    } else if (e == 'input-rich-text') {
      return '富文本';
    } else if (e == 'money') {
      return '金额';
    } else if (e == 'enum') {
      return '枚举';
    } else if (e == 'select') {
      return '枚举';
    } else if (e == 'boolean') {
      return '布尔(开关)';
    } else if (e == 'switch') {
      return '布尔(开关)';
    } else if (e == 'date') {
      return '日期';
    } else if (e == 'input-date') {
      return '日期';
    } else if (e == 'datetime') {
      return '日期时间';
    } else if (e == 'input-datetime') {
      return '日期时间';
    } else if (e == 'input-date-range') {
      return '日期范围';
    } else if (e == 'date-range') {
      return '日期范围';
    } else if (e == 'time') {
      return '时间';
    } else if (e == 'input-time') {
      return '时间';
    } else if (e == 'input-file') {
      return '附件';
    } else if (e == 'attachment') {
      return '附件';
    } else if (e == 'input-image') {
      return '图片';
    } else if (e == 'image') {
      return '图片';
    } else if (e == 'user') {
      return '人员信息';
    } else if (e == 'user-select') {
      return '人员信息';
    } else if (e == 'users') {
      return '人员多选';
    } else if (e == 'department') {
      return '部门信息';
    } else if (e == 'tree-select') {
      return '部门信息';
    } else if (e == 'password') {
      return '密码';
    } else if (e == 'input-password') {
      return '密码';
    } else if (e == 'ciphertext') {
      return '密文';
    } else if (e == 'serial-number') {
      return '流水号';
    } else if (e == 'json') {
      return 'JSON';
    } else if (e == 'editor') {
      return 'JSON';
    } else if (e == 'formula') {
      return '公式';
    } else if (e == 'parent') {
      return '父级';
    } else if (e == 'combo') {
      return '关系';
    } else if (!e) {
      return '整数';
    } else {
      return '对象';
    }
  };
  // 修改条件组合数据
  const builderChange = e => {
    console.log(e, '数据');
    let arr = [];
    for (let i in e) {
      let obj = filteredData(e[i]);
      if (obj != undefined) {
        arr.push(obj);
      }
    }
    console.log(arr, 'arr');
    return arr;
  };

  /**
   * 渲染Process节点独有组件 (只有开始节点才有) 事件触发类型
   */
  function renderEventDefinitionType() {
    if (
      window?.bpmnInstance?.element?.businessObject?.$type === 'bpmn:StartEvent' &&
      window?.bpmnInstance?.element?.businessObject.eventTriggering
    ) {
      return (
        <>
          <Form.Item label="事件触发类型" name="eventDefinitionType" required>
            <Select
              placeholder={'请选择事件触发类型'}
              onChange={eventTriggeringChange}
              options={[
                {value: 1, label: '新增记录前'},
                {value: 2, label: '新增记录后'},
                {value: 3, label: '更新记录前'},
                {value: 4, label: '更新记录后'},
                {value: 5, label: '删除记录前'},
                {value: 6, label: '删除记录后'}
              ]}
            />
          </Form.Item>
        </>
      );
    }
  }
  /**
   * 渲染Process节点独有组件 (只有开始节点才有) 事件触发 优先级
   */
  function renderPriority() {
    if (
      window?.bpmnInstance?.element?.businessObject?.$type === 'bpmn:StartEvent' &&
      window?.bpmnInstance?.element?.businessObject.eventTriggering
    ) {
      return (
        <>
          <Form.Item label="优先级" name="actPriority" required>
            <Input
              type='number'
              placeholder={'请输入'}
              onChange={event => {
                updateElementAttr(keyOptions.actPriority, event.currentTarget.value);
              }}
            />
          </Form.Item>
        </>
      );
    }
  }
  /**
   * 渲染Process节点独有组件 (只有开始节点才有) 事件触发所绑定的实体
   */
  function renderModelEventTarget() {
    console.log(businessObject,'事件触发所绑定的实体')
    if (
      window?.bpmnInstance?.element?.businessObject?.$type === 'bpmn:StartEvent' &&
      window?.bpmnInstance?.element?.businessObject.eventTriggering
    ) {
      return (
        <>
          <Form.Item
            label="事件触发所绑定的实体"
            name="modelEventTarget"
            required
          >
            <div style={{marginTop:'-10px'}}>
              {
                amisRender(
                  schema,
                  {},
                  {
                    fetcher: service,
                    theme: amisEnv.theme
                  }
                )
              }
            </div>
          </Form.Item>
        </>
      );
    }
  }

  // 类型选择切换
  const radioChange = e => {
    console.log(e, '新增列表切换');
    setRadioValue(e.target.value);
    setFilterFields({});
    setModelFilterFields({});
    modelFilterFieldsData.current = {};
    form.setFieldValue('filterFields', {});
    setIsShow(false);
    setTimeout(() => {
      setIsShow(true);
    }, 100);
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      filterMode: e.target.value,
      filterFields: undefined
    });
  };

  // 筛选条件 简单模式
  const objectKeyChange = e => {
    console.log(e, '筛选条件 简单模式');
    let data = Object.assign({}, e);
    console.log(data, 'data');
    let result = reverseTransformSelectAnyIn(data)
    console.log(result,'resultresultresultresult')
    form.setFieldValue('filterFields',result)
    setFilterFields(result);
    if (e) {
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          filterFields: JSON.stringify(transformSelectAnyIn(data))
        }
      );
    }
  };
  const objectKeyModelChange = e => {
    console.log(e, '弹框数据变化');
    let aa = JSON.parse(JSON.stringify(e));
    let result = reverseTransformSelectAnyIn(aa)
    form.setFieldValue('filterFields',result)
    // setModelFilterFields(aa);
    modelFilterFieldsData.current = result
  };
  // 点击显示高级设置弹出层
  const inputClick = () => {
    setIsModalOpen(true);
    console.log(modelFilterFieldsData.current,'askdjgaskdas')
    setIsShows(false)
    setTimeout(()=>{
      form.setFieldsValue({
        filterFields:JSON.stringify(modelFilterFieldsData.current) === '{}'?{}:reverseTransformSelectAnyIn(modelFilterFieldsData.current),
      });
      setIsShows(true)
    },100)
  };
  // 高级设置确认
  const handleOk = () => {
    console.log('高级设置确认');
    console.log(businessObject.filterCondition, 'needValue.filterCondition');
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      filterFields: JSON.stringify(transformSelectAnyIn(modelFilterFieldsData.current))
    });
    setIsModalOpen(false);
  };
  // 高级设置取消
  const handleCancel = () => {
    console.log('高级设置取消');
    form.setFieldsValue({
      filterFields:{}
    })
    setIsModalOpen(false);
  };

  /**
   * 渲染Process节点独有组件 (只有开始节点才有) 过滤器
   */
  function renderFilterFields() {
    if (
      window?.bpmnInstance?.element?.businessObject?.$type === 'bpmn:StartEvent' &&
      window?.bpmnInstance?.element?.businessObject.eventTriggering
    ) {
      return (
        <>
          <b>过滤器</b>
          <Form.Item label="类型选择" name="filterMode">
            <Radio.Group
              onChange={radioChange}
              // defaultValue={radioValue}
              value={radioValue}
            >
              <Radio value={'normal'}>普通模式</Radio>
              <Radio value={'advanced'}>高级模式</Radio>
            </Radio.Group>
          </Form.Item>
          {radioValue == 'normal' && (
            <>
              <Form.Item<FieldType> label="" name="filterFields">
                {isShow && (
                  <>
                    {amisRender({
                      type: 'service',
                      dataProvider: (data, setData) => {
                        // console.log(data, '普通模式');
                        console.log(filterFields, '普通模式');
                        setData(filterFields);
                      },
                      body: [
                        {
                          type: 'condition-builder',
                          label: ' ',
                          name: 'filterFields',
                          fields: updateFieldsOption,
                          draggable: false,
                          builderMode: 'simple',
                          onChange: (value: any) => {
                            objectKeyChange(value);
                          }
                        }
                      ]
                    },
                        {},
                        {
                          fetcher: service,
                          theme: amisEnv.theme
                        })}
                  </>
                )}
              </Form.Item>
            </>
          )}
          {radioValue == 'advanced' && (
            <Form.Item label="条件个数" name="filterFields">
              <Input
                value={
                  JSON.stringify(modelFilterFieldsData.current) == '{}'
                    ? '0个条件'
                    : modelFilterFieldsData.current?.children
                    ? modelFilterFieldsData.current?.children.length + '个条件'
                    : modelFilterFieldsData.current
                    ? modelFilterFields.length + '个条件'
                    : '0个条件'
                }
                readOnly
                onClick={inputClick}
              />
              <Modal
                title="高级设置"
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                okText={'确认'}
                cancelText={'取消'}
                maskClosable={false}
              >
                <Form.Item label="" name="filterFields">
                  {isShows && (
                    <>
                      {amisRender({
                        type: 'service',
                        dataProvider: (data, setData) => {
                          setData(modelFilterFieldsData.current);
                        },
                        body: [
                          {
                            type: 'condition-builder',
                            label: ' ',
                            name: 'filterFields',
                            fields: updateFieldsOption,
                            // value: modelFilterFieldsData.current,
                            onChange: (value: any) => {
                              objectKeyModelChange(value);
                            }
                          }
                        ]
                      },
                          {},
                          {
                            fetcher: service,
                            theme: amisEnv.theme
                          })}
                    </>
                  )}
                </Form.Item>
              </Modal>
            </Form.Item>
          )}
        </>
      );
    }
  }

  /**
   * 渲染Process节点独有组件 (只有开始节点才有)
   */
  function renderTimerTaskSwitch() {
    if (
      window?.bpmnInstance?.element?.businessObject?.$type === 'bpmn:StartEvent' &&
      !window?.bpmnInstance?.element?.businessObject.eventDefinitions &&
      !window?.bpmnInstance?.element?.businessObject.bindInitiationPage &&
      !window?.bpmnInstance?.element?.businessObject.eventTriggering
    ) {
      return (
        <>
          <Form.Item
            label={
              <>
                定时开关
                <Tooltip title="开启会删除流程入参数据">
                  <InfoCircleOutlined />
                </Tooltip>
              </>
            }
            name="timerTaskSwitch"
          >
            <Switch
              checkedChildren="开"
              unCheckedChildren="关"
              onChange={timerTaskSwitch => {
                updateElementAttr(keyOptions.timerTaskSwitch, timerTaskSwitch);
              }}
            />
          </Form.Item>
        </>
      );
    }
  }

  return (
    <>
      <Form
        name="basics"
        labelWrap
        initialValues={{remember: true}}
        form={form}
        labelCol={{span: 5}}
      >
        <Form.Item
          label="编号"
          name="id"
          required
          rules={[
            {
              validator: (_, value) => {
                const validateId$1 = validateId(value);
                return validateId$1.status
                  ? Promise.resolve()
                  : Promise.reject(new Error(validateId$1.message));
              }
            }
          ]}
        >
          <Input
            placeholder={'请输入'}
            onChange={event => {
              updateElementAttr(keyOptions.id, event.currentTarget.value);
            }}
            disabled
          />
          {/* disabled={businessObject?.$type === 'bpmn:Process'} */}
        </Form.Item>
        <Form.Item
          label="名称"
          name="name"
          required={
            props.businessObject?.$type != 'bpmn:SequenceFlow' &&
            props.businessObject?.$type != 'bpmn:ExclusiveGateway' &&
            props.businessObject?.$type != 'bpmn:ParallelGateway'
          }
          rules={[
            {
              validator: (_, value) => {
                const validateId$1 = validateName(value);
                return validateId$1.status
                  ? Promise.resolve()
                  : Promise.reject(new Error(validateId$1.message));
              }
            }
          ]}
        >
          <Input
            placeholder={'请输入'}
            onChange={event => {
              updateElementAttr(keyOptions.name, event.currentTarget.value);
            }}
          />
        </Form.Item>
        {/* {renderProcessExtension()} */}
        {renderEventTriggeredSwitch()}
        {renderModelEventTarget()}
        {renderEventDefinitionType()}
        {renderPriority()}
        {renderFilterFields()}
        {renderBindInitiationPage()}
        {renderTimerTaskSwitch()}
      </Form>
    </>
  );
}
