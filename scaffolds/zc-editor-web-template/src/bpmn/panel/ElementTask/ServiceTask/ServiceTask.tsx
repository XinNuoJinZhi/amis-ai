import {
  data_options,
  encapsulateField,
  listener_type,
  script_type,
  script_type_options,
  task_event_type,
  timer_type,
  timer_type_options
} from '@/bpmn/panel/ElementListener/dataSelf';
import {AppstoreOutlined, DeleteOutlined} from '@ant-design/icons';
import {getSchemaTpl} from 'amis-editor';
import {render as amisRender} from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import * as uuid from 'uuid';
import {FormulaPicker} from 'amis-ui';
import {service} from '@/utils/request';
import {
  Button,
  Divider,
  Form,
  Input,
  Select,
  Space,
  Table,
  Typography,
  notification,
  Radio,
  Row,
  Col,
  Switch,
  Spin
} from 'antd';
import {Ref, useImperativeHandle, useRef, useState, useEffect} from 'react';
import UpdateRecrd from './updateRecord';
import QueryRecord from './queryRecord';
import DeleteRecord from './deleteRecord';
import CallService from './callService';
import HandlersService from './handlersService';
import {useAppDispatch, useAppSelector} from '@/redux/hook/hooks';
import {
  handleProcessId,
  handleProcessName,
  handleServiceRaskList
} from '@/redux/slice/bpmnSlice';
import {
  getGroupListFilterTiming,
  getApiShareList,
  getEntityShareList
} from '@/api/bpmn';
import {filteredDatas, filterData} from './getSchemaChange';
import {filteredData} from './conditionBuilder';
import {getNoLoopRelation,getNoLoopRelations,groupByRelationKeyWithPK} from './config'
import {modifyInnerChildrenValue} from "@/utils/util"
import {getFormatStringByPrecision} from '@/utils';
import {baseURL, devApiUrl, advancedFeature} from '@/utils/env'

const {Option} = Select;
let crudApi = baseURL + devApiUrl;

interface IProps {
  onRef: Ref<any>;
  isTask: boolean;
  reFreshParent: (options: any) => any;
}

export default function EditListener(props: any) {
  console.log(props, '服务propspropspropsprops');
  // props
  const {onRef, isTask, reFreshParent, businessObject} = props;
  console.log(
    businessObject,
    'businessObjectbusinessObjectbusinessObjectbusinessObjectbusinessObject'
  );
  const params = new URLSearchParams(window.location.search);

  // state
  const [open, setOpen] = useState(false);
  const [fieldList, setFieldList] = useState<Array<any>>([]);
  const [eventTypeLabel, setEventTypeLabel] = useState<any>('');
  // 四个记录 数据
  const [nodeValue, setNodeValue] = useState({}); // 当前节点数据
  const [columnInfo, setColumnInfo] = useState([]); // 新增记录 选择对象数组
  const [isfunc, setIsfunc] = useState(true); // 新增记录 选择对象数组
  const [objectKey, setObjectKey] = useState('');
  const [taskTypeValue, setTaskTypeValue] = useState(); // 选择记录类型
  const [keyOption, setKeyOption] = useState([]); // 记录初始化key值数组
  const [cascaderValue, setCascaderValue] = useState([]); // 对象级联
  const [showObject, setShowObject] = useState(false);
  const [callData, setCallData] = useState([]);
  const [formuVariables, setFormuVariables] = useState([]);
  // 实体数据
  const entityList = useAppSelector(state => state.bpmn.entityList);
  const [isUseEff, setIsUseEff] = useState(false); // 是否初始化
  const serviceList = useAppSelector(state => state.bpmn.serviceRaskList);
  const dispatch = useAppDispatch();
  // 是否忽略租户开关
  const [tenantFlagRecord, setTenantFlagRecord] = useState<any>(false);
  // 是否忽略租户输入框
  const [appTenantCodeValue, setAppTenantCodeValue] = useState<any>('');
  // ref
  const editRef = useRef<any>();
  const [showLoading, setShowLoading] = useState(false);
  // form
  const [form] = Form.useForm<{
    key: number;
    eventType: string;
    eventId: string;
    listenerType: string;
    javaClass: string;
    expression: string;
    delegateExpression: string;
    scriptType: string;
    scriptFormat: string;
    scriptValue: string;
    resource: string;
    timerType: string;
    timerValue: string;
    dataMode: string;
    ignoreTenantFlag: boolean;
    appTenantCode: string;
  }>();
  // 监听form字段
  const eventType = Form.useWatch('eventType', form);
  const listenerType = Form.useWatch('listenerType', form);
  const scriptType = Form.useWatch('scriptType', form);
  const timerType = Form.useWatch('timerType', form);

  const schema = {
    type: 'page',
    className: 'b-dark bg-light -ml-5',
    onEvent: {
      init: {
        weight: 0,
        actions: [
          {
            actionType: 'setValue',
            componentId: 'nestedId',
            args: {
              value: nodeValue.modelEventTarget
            }
          }
        ]
      }
    },
    body: {
      type: 'form',
      // "debug": true,
      id: 'formId',
      mode: 'horizontal',
      horizontal: {
        left: 2,
        right: 9.5,
        offset: 2
      },
      wrapWithPanel: false,
      body: [
        {
          required: true,
          type: 'nested-select',
          name: 'nestedSelect',
          id: 'nestedId',
          onlyLeaf: true,
          label: '选择对象:',
          options: cascaderValue?.options,
          value: nodeValue.modelEventTarget
        }
      ],
      onEvent: {
        change: {
          actions: [
            {
              actionType: 'custom',
              script: function (_, doAction, event) {
                setShowLoading(true)
                console.log(_, '_');
                console.log(doAction,'doAction');
                console.log(event, 'event');
                console.log(isUseEff, 'isUseEffisUseEff');
                setObjectKey(event.data.nestedSelect);
                if (!isUseEff) {
                  setColumnInfo([]);
                  setShowLoading(false)
                  setTenantFlagRecord(false);
                  form.setFieldValue('ignoreTenantFlag', false);
                }
                console.log(taskTypeValue, 'taskTypeValue');
                if (taskTypeValue == 1) {
                  if (!isUseEff) {
                    console.log('进入');
                    setColumnInfo([]);
                  }
                  let haveDataArr = false;
                    let junctionRelationsArr: any = {};
                    setCascaderValue(entityList.data);
                    entityList.data.options.forEach(res => {
                      res.children.forEach(items => {
                        if (items.value == event.data.nestedSelect) {
                          haveDataArr = true;
                          res.children.forEach(resc => {
                            if (resc.form.type == 1 || resc.form.type == 2) {
                              let needArs: any = [];
                              resc.form.originRelation.forEach(skjw => {
                                if (skjw.relationMode == 'n:1') {
                                  needArs.push(skjw);
                                }
                              });
                              junctionRelationsArr[resc.key] = needArs;
                            }
                          });
                          let allData: any = [];
                          let relationAllArr: any = [];
                          if (items.form.fields && items.form.fields != null) {
                            let primaryKeyData = items.form.fields.filter(sso=> sso.isPrimaryKey)
                            items.form.fields.forEach((ikj, index) => {
                              if (
                                  !ikj.isForeignKey &&
                                  ikj.type != 'formula' &&
                                  ikj.type != 'relation' &&
                                  // !ikj.isCreateDate &&
                                  // !ikj.isCreateUser &&
                                  !ikj.isDeleteDate &&
                                  !ikj.isDeleteFlag &&
                                  !ikj.isDeleteUser &&
                                  // !ikj.isUpdateDate &&
                                  // !ikj.isUpdateUser &&
                                  !ikj.isTenantCode
                              ) {
                                if (
                                    ikj.label.includes('【') &&
                                    ikj.relationKey &&
                                    ikj.relationKey != ''
                                ) {
                                  if(ikj.isTreeParent){
                                    allData.push({
                                      ...ikj,
                                      // key: ikj.relationKey + '.' + ikj.key,
                                      title: ikj.label,
                                      primaryKeyType: primaryKeyData[0].type
                                    });
                                  }else{
                                    allData.push({
                                      ...ikj,
                                      // key: ikj.relationKey + '.' + ikj.key,
                                      title: ikj.label
                                    });
                                  }
                                } else {
                                  if(ikj.isTreeParent) {
                                    allData.push({...ikj, title: ikj.label,
                                      primaryKeyType: primaryKeyData[0].type
                                    });
                                  }else{
                                    allData.push({...ikj, title: ikj.label});
                                  }
                                }
                              }
                            })
                          }
                          if (
                            items.form.relationFields &&
                            items.form.relationFields != null
                          ) {
                            let relationPrimaryKeyData = groupByRelationKeyWithPK(items.form.relationFields)
                            // allData = [
                            //   ...allData,
                            //   ...items.form.relationFields
                            // ];
                            items.form.relationFields.forEach((ikj, index) => {
                              if (
                                  !ikj.isForeignKey &&
                                  // !ikj.isCreateDate &&
                                  // !ikj.isCreateUser &&
                                  !ikj.isDeleteDate &&
                                  !ikj.isDeleteFlag &&
                                  !ikj.isDeleteUser &&
                                  // !ikj.isUpdateDate &&
                                  // !ikj.isUpdateUser &&
                                  ikj.type != 'formula' &&
                                  !ikj.isTenantCode
                              ) {
                                if (
                                    ikj.label.includes('【') &&
                                    ikj.relationKey &&
                                    ikj.relationKey != ''
                                ) {
                                  if(ikj.isTreeParent){
                                    relationAllArr.push({
                                      ...ikj,
                                      key: ikj.relationKey + '.' + ikj.key,
                                      title: ikj.label,
                                      primaryKeyType: relationPrimaryKeyData[ikj.relationKey].type
                                    });
                                  }else{
                                    relationAllArr.push({
                                      ...ikj,
                                      key: ikj.relationKey + '.' + ikj.key,
                                      title: ikj.label
                                    });
                                  }
                                } else {
                                  if(ikj.isTreeParent){
                                    relationAllArr.push({...ikj, title: ikj.label,
                                      primaryKeyType: relationPrimaryKeyData[ikj.relationKey].type
                                    });
                                  }else{
                                    relationAllArr.push({...ikj, title: ikj.label});
                                  }
                                }
                              }
                            });
                          }
                          let arrs = builderChange(allData);
                          let needArr:any = [];
                          arrs.forEach(item => {
                            if (
                              !item.isForeignKey &&
                              // !item.isPrimaryKey &&
                              item.yuanType != 'formula' &&
                              // item.yuanType != 'relation' &&
                              // !item.isCreateDate &&
                              // !item.isCreateUser &&
                              !item.isDeleteDate &&
                              !item.isDeleteFlag &&
                              !item.isDeleteUser &&
                              // !item.isUpdateDate &&
                              // !item.isUpdateUser &&
                              !item.isTenantCode
                            ) {
                              if (
                                item.label.includes('【') &&
                                item.relationKey != '' &&
                                item.relationKey != null
                              ) {
                                needArr.push({
                                  ...item,
                                  key: item.relationKey + '.' + item.name
                                });
                              } else {
                                needArr.push({...item, key: item.name});
                              }
                            }
                          });
                          console.log(arrs, 'arrs');
                          console.log(needArr, 'needArr');
                          console.log(serviceList, 'serviceList');
                          console.log(isUseEff, 'isUseEff');
                          let objectArr:any = [res.value,event.data.nestedSelect]
                          let lastAllDatas = getNoLoopRelations(relationAllArr,items.form.originRelation,entityList.data.options,objectArr).filter(res=>{
                            return res.type != 'relation';
                          })
                          // let lastAllDatas =  getNoLoopRelation(res.children,items.id)
                          console.log(needArr,'needArr')
                          console.log(lastAllDatas,'lastAllDatas')
                          // needArr = needArr.filter(wjs => lastAllDatas.some(wsw => wsw.label == wjs.label))
                          needArr = [...needArr,...lastAllDatas].map(rsww=>{
                            return {...rsww,yuanType:rsww.yuanType?rsww.yuanType:rsww.type}
                          })
                          let arr = serviceList.map(element => {
                            if (element.serviceTaskId == businessObject.id) {
                              form.setFieldsValue({
                                ignoreTenantFlag: typeof element.tenantConfig == 'string' ?
                                    JSON.parse(element.tenantConfig).ignoreTenantFlag : element.tenantConfig == null ? false : element.tenantConfig.ignoreTenantFlag,
                                appTenantCode: typeof element.tenantConfig == 'string' ?
                                    JSON.parse(element.tenantConfig).appTenantCode : element.tenantConfig == null ? 'false' : element.tenantConfig.appTenantCode
                              });
                              setTenantFlagRecord(false)
                              setAppTenantCodeValue('')
                              setTenantFlagRecord(typeof element.tenantConfig == 'string' ?
                                  JSON.parse(element.tenantConfig).ignoreTenantFlag : element.tenantConfig == null ? false : element.tenantConfig.ignoreTenantFlag);
                              setAppTenantCodeValue(typeof element.tenantConfig == 'string' ?
                                  JSON.parse(element.tenantConfig).appTenantCode : element.tenantConfig == null ? '' : element.tenantConfig.appTenantCode);
                              if (!isUseEff) {
                                setKeyOption(needArr);
                                form.setFieldsValue({
                                  dataMode: 'single'
                                });
                                setRadioData('single');
                                return {
                                  ...element,
                                  modelEventTarget: event.data.nestedSelect,
                                  columnInfo: [],
                                  dataMode: 'single',
                                  fields: items.form.fields,
                                  relationFields: items.form.relationFields,
                                  originRelation: items.form.originRelation,
                                  junctionRelations: junctionRelationsArr
                                };
                              } else {
                                setRadioData(element.dataMode);
                                form.setFieldsValue({
                                  dataMode: element.dataMode
                                });
                                // let newKeyOption = lastAllDatas.map(skjwd => {
                                let newKeyOption = needArr.map(skjwd => {
                                  let returnData = {...skjwd, disabled: false};
                                  element.columnInfo.forEach(elements => {
                                    if (
                                      elements.key &&
                                      elements.key == skjwd.key
                                    ) {
                                      returnData.disabled = true;
                                    }
                                  });
                                  return returnData;
                                });
                                console.log(newKeyOption, 'newKeyOption');
                                setKeyOption(newKeyOption);
                                return {
                                  ...element,
                                  modelEventTarget: event.data.nestedSelect,
                                  fields: items.form.fields,
                                  originRelation: items.form.originRelation,
                                  relationFields: items.form.relationFields,
                                  junctionRelations: junctionRelationsArr
                                };
                              }
                            } else {
                              return element;
                            }
                          });
                          dispatch(handleServiceRaskList(arr));
                        }
                      });
                    });
                    if (!haveDataArr) {
                      setKeyOption([]);
                      serviceList.forEach(element => {
                        if (
                            element.serviceTaskId == props.businessObject.id
                        ) {
                          if(element.tenantConfig){
                            setTenantFlagRecord(typeof element.tenantConfig == 'string' ?
                                JSON.parse(element.tenantConfig).ignoreTenantFlag : element.tenantConfig == null ? false : element.tenantConfig.ignoreTenantFlag);
                            setAppTenantCodeValue(typeof element.tenantConfig == 'string' ?
                                JSON.parse(element.tenantConfig).appTenantCode : element.tenantConfig == null ? '' : element.tenantConfig.appTenantCode);
                            form.setFieldsValue({
                              ignoreTenantFlag: typeof element.tenantConfig == 'string' ?
                                  JSON.parse(element.tenantConfig).ignoreTenantFlag : element.tenantConfig == null ? false : element.tenantConfig.ignoreTenantFlag,
                              appTenantCode: typeof element.tenantConfig == 'string' ?
                                  JSON.parse(element.tenantConfig).appTenantCode : element.tenantConfig == null ? '' : element.tenantConfig.appTenantCode
                            });
                          }else{
                            setTenantFlagRecord(false)
                            setAppTenantCodeValue('')
                            form.setFieldsValue({
                              ignoreTenantFlag:false,
                              appTenantCode:''
                            });
                          }
                        }
                      })
                    }
                    setShowLoading(false)
                } else {
                    setShowLoading(false)
                    setCascaderValue(entityList.data);
                }
                setIsUseEff(false);
              }
            }
          ]
        }
      }
    }
  };

  // 暴露给父组件的方法
  useImperativeHandle(onRef, () => ({
    // 打开弹窗
    showEditDrawer: (rowObj: any) => showDrawer(rowObj)
  }));
  // 对象数组去重
  function uniqueFunc(arr, uniId) {
    const res = new Map();
    return arr.filter(item => !res.has(item[uniId]) && res.set(item[uniId], 1));
  }
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
      console.log(parentLabel,'parentLabel')
      let newValue = `${prefix}.${key}`;
      console.log(newValue,'newValue')
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
      }
      acc[key].children.push(childItem);
      return acc;
    }, {}));
  }
  useEffect(() => {
    console.log(businessObject, 'businessObject数据变化');
    console.log(serviceList, 'serviceList');
    setShowObject(false);
    setIsUseEff(true);
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
    if (businessObject) {
      let key;
      let name;
      // if (businessObject.class) {
      key = 'class';
      name = businessObject.class;
      setEventTypeLabel('Java类');
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          [`flowable:class`]:
            'cn.iocoder.yudao.module.processManage.handler.delegate.RecordDelegate'
        }
      );
      if (serviceList) {
        let haveSamaData = false;
        serviceList.forEach(element => {
          if (
            element.serviceTaskId == businessObject.id ||
            element.id == businessObject.id
          ) {
            haveSamaData = true;
            console.log(element, '选择的节点'); // 确定哪个节点
            if (element.taskType) {
              if (element.taskType == 1) {
                setTenantFlagRecord(false);
                form.setFieldValue('ignoreTenantFlag', false);
                  setCascaderValue(entityList.data);
                  entityList.data.options.forEach(res => {
                    res.children.forEach(item => {
                      if (item.value == element.modelEventTarget) {
                        console.log(item, 'itemitemitemitemitemitemitemitem');
                        let allData: any = [];
                        let relationAllArr: any = [];
                        if (item.form.fields && item.form.fields != null) {
                          let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                          item.form.fields.forEach((ikj, index) => {
                            if (
                                !ikj.isForeignKey &&
                                ikj.type != 'formula' &&
                                ikj.type != 'relation' &&
                                // !ikj.isCreateDate &&
                                // !ikj.isCreateUser &&
                                !ikj.isDeleteDate &&
                                !ikj.isDeleteFlag &&
                                !ikj.isDeleteUser &&
                                // !ikj.isUpdateDate &&
                                // !ikj.isUpdateUser &&
                                !ikj.isTenantCode
                            ) {
                              if (
                                  ikj.label.includes('【') &&
                                  ikj.relationKey &&
                                  ikj.relationKey != ''
                              ) {
                                if(ikj.isTreeParent){
                                  allData.push({
                                    ...ikj,
                                    key: ikj.relationKey + '.' + ikj.key,
                                    title: ikj.label,
                                    primaryKeyType: primaryKeyData[0].type
                                  });
                                }else{
                                  allData.push({
                                    ...ikj,
                                    key: ikj.relationKey + '.' + ikj.key,
                                    title: ikj.label
                                  });
                                }
                              } else {
                                if(ikj.isTreeParent){
                                  allData.push({...ikj, title: ikj.label,
                                    primaryKeyType: primaryKeyData[0].type
                                  });
                                }else{
                                  allData.push({...ikj, title: ikj.label});
                                }
                              }
                            }
                          })
                        }
                        if (
                          item.form.relationFields &&
                          item.form.relationFields != null
                        ) {
                          let relationPrimaryKeyData = groupByRelationKeyWithPK(item.form.relationFields)
                          // allData = [...allData, ...item.form.relationFields];
                          item.form.relationFields.forEach((ikj, index) => {
                            if (
                                !ikj.isForeignKey &&
                                // !ikj.isCreateDate &&
                                // !ikj.isCreateUser &&
                                !ikj.isDeleteDate &&
                                !ikj.isDeleteFlag &&
                                !ikj.isDeleteUser &&
                                // !ikj.isUpdateDate &&
                                // !ikj.isUpdateUser &&
                                ikj.type != 'formula' &&
                                !ikj.isTenantCode
                            ) {
                              if (
                                  ikj.label.includes('【') &&
                                  ikj.relationKey &&
                                  ikj.relationKey != ''
                              ) {
                                if(ikj.isTreeParent){
                                  relationAllArr.push({
                                    ...ikj,
                                    key: ikj.relationKey + '.' + ikj.key,
                                    title: ikj.label,
                                    primaryKeyType: relationPrimaryKeyData[ikj.relationKey].type
                                  });
                                }else{
                                  relationAllArr.push({
                                    ...ikj,
                                    key: ikj.relationKey + '.' + ikj.key,
                                    title: ikj.label
                                  });
                                }
                              } else {
                                if(ikj.isTreeParent){
                                  relationAllArr.push({...ikj, title: ikj.label,
                                    primaryKeyType: relationPrimaryKeyData[ikj.relationKey].type
                                  });
                                }else{
                                  relationAllArr.push({...ikj, title: ikj.label});
                                }
                              }
                            }
                          });
                        }
                        let arrs = builderChange(allData);
                        let needArr = arrs.filter(item => {
                          return (
                            !item.isForeignKey &&
                            item.yuanType != 'formula' &&
                            // !item.isCreateDate &&
                            // !item.isCreateUser &&
                            !item.isDeleteDate &&
                            !item.isDeleteFlag &&
                            !item.isDeleteUser
                            // !item.isUpdateDate &&
                            // !item.isUpdateUser &&
                            // !item.isTenantCode
                          );
                        });
                        console.log(needArr, 'needArr111');
                        let objectArr:any = [res.value,element.modelEventTarget]
                        let lastAllDatas = getNoLoopRelations(relationAllArr,item.form.originRelation,entityList.data.options,objectArr).filter(res=>{
                          return res.type != 'relation';
                        })
                        // let lastAllDatas = getNoLoopRelation(res.children,item.id)
                        console.log(needArr,'needArr')
                        console.log(lastAllDatas,'lastAllDatas')
                        // needArr = needArr.filter(wjs => lastAllDatas.some(wsw => wsw.label == wjs.label))
                        needArr = [...needArr,...lastAllDatas].map(rsww=>{
                          return {...rsww,yuanType:rsww.yuanType?rsww.yuanType:rsww.type}
                        })
                        console.log(needArr,'needArr')
                        let newKeyOption = needArr.map(skjwd => {
                          let returnData = {...skjwd, disabled: false};
                          element.columnInfo.forEach(elements => {
                            if (elements.key && elements.key == skjwd.key) {
                              returnData.disabled = true;
                            }
                          });
                          return returnData;
                        });
                        console.log(newKeyOption, 'newKeyOption');
                        setKeyOption(newKeyOption);
                        console.log(element,'elementelement')
                        form.setFieldsValue({
                          dataMode: element.dataMode,
                          ignoreTenantFlag: typeof element.tenantConfig == 'string' ?
                              JSON.parse(element.tenantConfig).ignoreTenantFlag : element.tenantConfig == null ? false : element.tenantConfig.ignoreTenantFlag,
                          appTenantCode: typeof element.tenantConfig == 'string' ?
                              JSON.parse(element.tenantConfig).appTenantCode : element.tenantConfig == null ? '' : element.tenantConfig.appTenantCode
                        });
                        setRadioData(element.dataMode);
                        setTenantFlagRecord(typeof element.tenantConfig == 'string' ?
                            JSON.parse(element.tenantConfig).ignoreTenantFlag : element.tenantConfig == null ? false : element.tenantConfig.ignoreTenantFlag);
                        setAppTenantCodeValue(typeof element.tenantConfig == 'string' ?
                            JSON.parse(element.tenantConfig).appTenantCode : element.tenantConfig == null ? '' : element.tenantConfig.appTenantCode);
                      }
                    });
                  });
              } else {
                  if(element.taskType == 4) {
                    getEntityShareList().then(shareRes=> {
                      modifyInnerChildrenValue(shareRes.data.data)
                      const shareData = shareRes.data.data;
                      const allData = entityList.data.options.concat(shareData)
                      let obj = {'options': allData }
                      setCascaderValue(obj);
                    })
                  } else {
                    setCascaderValue(entityList.data);
                  }
              }
            }
            setNodeValue({...element, modelEventTarget: element.modelEventTarget});
            console.log(element, 'elementelementelementelement');
            if (element.columnInfo && typeof element.columnInfo != 'string') {
              let ses = element.columnInfo.map(item => {
                if (item.key && item.key.includes('.')) {
                  return {
                    ...item,
                    label: item.label
                  };
                } else if (element.fields) {
                  let sdj = element.fields.filter(jfj => {
                    if (jfj.label == (item.label ? item.label : item.key)) {
                      return {...item};
                    }
                  });
                  console.log(sdj, 'sdj');
                  if (sdj.length > 0) {
                    return {...item, label: sdj[0].label};
                  } else {
                    return item;
                  }
                } else {
                  return item;
                }
              });
              console.log(ses, 'sessesses');
              setColumnInfo(ses);
              setIsfunc(false);
              setTimeout(() => {
                setIsfunc(true);
              }, 100);
            } else {
              setColumnInfo([]);
            }
            form.setFieldsValue({
              eventType: key,
              listenerType: name,
              taskType: element.taskType
            });
            setTimeout(() => {
              setShowObject(true);
            }, 100);
          }
        });
        if (!haveSamaData) {
          let a = [...serviceList, {...businessObject}];
          dispatch(handleServiceRaskList(a));
          setColumnInfo([]);
          setKeyOption([]);
          setTaskTypeValue(0);
          form.setFieldValue('taskType', null);
        }
      } else {
        setNodeValue({});
        dispatch(
          handleServiceRaskList([
            {...businessObject, serviceTaskId: businessObject.id}
          ])
        );
        setTimeout(() => {
          setShowObject(true);
        }, 100);
      }
      console.log(nodeValue, 'nodevalue');
      getGroupListFilterTiming().then(rs => {
        let asd = rs.data.data.map(item => {
          let asr = {...item};
          if (item.children && item.children.length > 0) {
            asr.children = item.children.map(elem => {
              return {
                ...elem,
                value: elem.api.queryKey
              };
            });
          }
          return asr;
        });
        console.log(asd, 'asdasdasdasdasdasdasd');
        asd = asd.filter(i => i.children?.length > 0)
        getApiShareList().then(res=>{
          if(res.data.data.length != 0) {
            for (const group of res.data.data) {
              for (const child of group.children) {
                for(const thirdChild of child.children) {
                  for(const lastChild of thirdChild.children) {
                    lastChild.value = lastChild.queryKey
                  }
                }
              }
            }
          }
          const allData = asd.concat(res.data.data)
          setCallData(allData);
        })
        console.log(form.getFieldValue('taskType'), '1111');
        setTaskTypeValue(form.getFieldValue('taskType'));
        // setTaskTypeValue(element.taskType);
      });
    }
    let arr = JSON.parse(sessionStorage.getItem('userList')); // 表单
    let userArr = JSON.parse(sessionStorage.getItem('getUserList')); // 操作人
    let queryArr = JSON.parse(sessionStorage.getItem('queryList')); // 查询
    let xinArr = JSON.parse(sessionStorage.getItem('getXinList')); // 新增服务
    let callArr = JSON.parse(sessionStorage.getItem('callList')); // 新增服务
    let startArr = JSON.parse(sessionStorage.getItem('startList')); // 流程参数
    let doubleList = JSON.parse(sessionStorage.getItem('doubleList'));
    let processorArr = JSON.parse(sessionStorage.getItem('processorList')); // 自定义参数
    console.log(arr, '上下文数据arr上下文数据arr');
    if (userArr != null && userArr.length > 0) {
      userArr = uniqueFunc(userArr, 'nodeId');
    }
    let arrs: any = [];
    let arrsa: any = [];
    let arrsas: any = [];
    let arrss: any = [];
    let callArrs: any = [];
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
          path: items.id,
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
                  tag: '对象',
                  isMember: false,
                  disabled: false,
                  children: item?.items?.map(it => {
                    return {
                      ...it,
                      name: it.label,
                      key: it.label,
                      label: it.label,
                      value: items.id + '.' + item.name + '.' + it.name,
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
                    value: items.id + '.' + item.name,
                    path: items.id + '.' + item.label,
                    tag: item.tag,
                    isMember: false,
                    disabled: false
                  };
                }else{
                  return undefined
                }
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
        console.log(returnData,'returnDatareturnDatareturnData')
        return returnData
      });
      console.log(arrs, 'arrsarrsarrsarrsarrsarrs');
    }
    if (startArr != null && startArr.length > 0) {
      // startArr.forEach(elements => {
      //   startArrs.push(elements);
      // });
      // console.log(startArr,'startArr')
      // console.log(startArrs,'startArrs')
      startArrs = [...startArr];
    } else {
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
      queryArr.forEach(elements => {
        arrss.push(elements);
      });
    }
    if (callArr != null && callArr.length > 0) {
      callArr.forEach((elements: any) => {
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
              value: elements.nodeId + '.' + elements.outputParameterName,
              path: elements.id + '.' + elements.outputParameterName,
              tag: '对象',
              isMember: false,
              disabled: false,
              children:
                elements.data && elements.data != null
                  ? elements?.data.map(item => {
                    return {
                      name: item.label,
                      key: item.label,
                      label: item.label,
                      value:
                        elements.nodeId +
                        '.' +
                        elements.outputParameterName +
                        '.' +
                        item.label,
                      path: item.label,
                      tag: '文本',
                      isMember: false,
                      disabled: false
                    };
                  })
                  : []
            }
          ]
        });
      });
    }
    let allArr = [
      ...arrss,
      // ...arrs,
      ...arrsa,
      ...arrsas,
      ...callArrs,
      ...startArrs,
      ...processorArrs
    ];
    if (arrs.length > 0) {
      allArr = allArr.map(res => {
        let resArr = {...res};
        arrs.forEach(element => {
          if (res.key == element.key) {
            resArr.children = [...resArr.children, ...element.children];
          }
        });
        return resArr;
      });
    }
    if (doubleList && doubleList.length > 0) {
      doubleList = uniqueFunc(doubleList, 'nodeId');
    }
    if(doubleList && doubleList != null && doubleList.length >0){
      doubleList.forEach(res => {
        if(res.modelEventTarget && res.type == 'bpmn:StartEvent'){
          let items = entityList
              if(items && JSON.stringify(items) === '{}') return
              items.data.options.forEach(ress => {
                ress.children.forEach(item => {
                  if (item.value == res.modelEventTarget) {
                    let allArrs: any = [];
                    if (item.form.fields != null) {
                      allArrs = item.form.fields.filter(fie => {
                        return fie.type != 'relation';
                      });
                    }
                    if (
                      item.form.relationFields &&
                      item.form.relationFields != null
                    ) {
                      allArrs = [...allArrs, ...item.form.relationFields];
                    }
                    console.log(allArrs, 'allArrs');
                    allArrs = allArrs.filter(owo=> {return !owo.isPrimaryKey})
                    console.log(allArrs, 'allArrs');
                    let objectArr:any = [res.value,item.value]
                    let lastAllDatas = getNoLoopRelations(allArrs,item.form.originRelation,items.data.options,objectArr).filter(res=>{
                      return res.type != 'relation';
                    })
                    // let lastAllDatas = getNoLoopRelation(ress.children,item.id)
                    let needArrSout = lastAllDatas.map(resi=>{
                      let returnData = {...resi};
                      if (returnData.relationKey) {
                        returnData.key = returnData.relationKey + '.' + returnData.key;
                      }
                      return returnData
                    })
                    console.log(needArrSout,'needArrSout')
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
                    console.log(allArr,'allArr');
                    console.log(lastArr,'lastArr');
                    allArr = allArr.map(sws=>{
                      let reuei = {...sws}
                      if(sws.key == res.nodeId){
                        reuei.children = [...reuei.children,...lastArr]
                      }
                      return reuei
                    })
                  }
                })
              })
              console.log(allArr,'111111111111111111111');
              setFormuVariables(allArr);
            // })
        }
      })
      let haveModelEventTarget:any = []
      haveModelEventTarget = doubleList.filter(rswe=>{
        return rswe.modelEventTarget && rswe.type == 'bpmn:StartEvent'
      })
      if(haveModelEventTarget.length==0){
        setFormuVariables(allArr);
      }
    }else{
      console.log(allArr,'111111111111111111111');
      setFormuVariables(allArr);
    }
    // setFormuVariables(allArr);
  }, [businessObject.id]);
  useEffect(() => {
    console.log(columnInfo, 'columnInfocolumnInfocolumnInfo');
    if (columnInfo.length == 0) {
      form.validateFields(['fieldDatas']);
    }
  }, [columnInfo]);
  /**
   * 打开弹窗并初始化页面数据
   *
   * @param rowObj
   */
  function showDrawer(rowObj: any) {
    initPageData(rowObj);
    setOpen(true);
  }

  /**
   * 初始化页面数据
   *
   * @param rowObj
   */
  function initPageData(rowObj: any) {
    form.setFieldsValue({
      key: rowObj?.key || -1,
      eventType: rowObj?.protoListener?.eventType.value,
      eventId: rowObj?.protoListener?.id,
      listenerType: rowObj?.protoListener?.listenerType.value,
      javaClass: rowObj?.protoListener?.class,
      expression: rowObj?.protoListener?.expression,
      delegateExpression: rowObj?.protoListener?.delegateExpression,
      scriptType: rowObj?.protoListener?.scriptType?.value,
      scriptFormat: rowObj?.protoListener?.script?.scriptFormat,
      scriptValue: rowObj?.protoListener?.script?.value,
      resource: rowObj?.protoListener?.script?.resource,
      timerType: rowObj?.protoListener?.timerType,
      timerValue: rowObj?.protoListener?.timerValue
    });
    // 初始化rows
    let fields: Array<any> = rowObj?.protoListener?.fields || [];
    let rows: Array<any> = fields.map((el, index) => {
      let field: any = encapsulateField(el);
      let row: any = Object.create(null);
      row.key = index + 1;
      row.fieldName = field.name;
      row.fieldType = field.fieldType.name;
      row.fieldTypeValue = field.fieldType.value;
      row.fieldValue = field.string || field.expression;
      return row;
    });
    setFieldList(rows);
  }
  /**
   * 更新循环基数
   *
   * @param value
   */
  function updateElementAttr(value: string) {
    console.log(value, 'value');
    console.log(eventType, 'eventType');
    // let loopCardinality = null;
    // if (value && value.length) {
    //   loopCardinality = window.bpmnInstance.moddle.create(
    //     'bpmn:FormalExpression',
    //     { body: value },
    //   );
    // }
    console.log(window.bpmnInstance.element, 'window.bpmnInstance.element');
    // window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
    //   messageRef: undefined,
    // });
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      [`flowable:${eventType}`]: value || undefined
    });
  }
  function selectChange(e: any, data: any) {
    console.log(e, 'eeeeee');
    console.log(data, 'data');
    setEventTypeLabel(data.children);
    if (e == 'class') {
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          [`flowable:${e}`]:
            'cn.iocoder.yudao.module.processManage.handler.delegate.RecordDelegate'
        }
      );
    }
  }

  // 实体对象 数据变化
  function taskTypeChange(e) {
    console.log(e, '实体对象 数据变化');
    setTaskTypeValue(e);
    if (e == 1) { //新增记录
        setCascaderValue(entityList.data);
        setNodeValue({
          ...nodeValue,
          modelEventTarget: ''
        });
        setShowObject(false);
        form.setFieldsValue({
          dataMode: 'single'
        });
        setRadioData('single');
        setTimeout(() => {
          setShowObject(true);
        }, 100);
    } else { //服务类型切换触发
        if(e == 4) {
          getEntityShareList().then(shareRes=> {
            modifyInnerChildrenValue(shareRes.data.data)
            const shareData = shareRes.data.data;
            const allData = entityList.data.options.concat(shareData)
            let obj = {'options': allData }
            setCascaderValue(obj);
          })
        } else {
          setCascaderValue(entityList.data)
        }
    }
    setKeyOption([]);
    setColumnInfo([]);
    console.log(serviceList, 'serviceListserviceList');
    console.log(businessObject, 'businessObjectbusinessObject');
    console.log(window.bpmnInstance.element, 'asdjbhasdjlkasdas');

    let arr = [];
    let haveSameData = false;
    if (serviceList && serviceList.length > 0) {
      arr = serviceList.map(element => {
        if (
          element.serviceTaskId == businessObject.id ||
          element.id == businessObject.id
        ) {
          console.log('进入');
          form.setFieldsValue({
            dataMode: 'single'
          });
          setRadioData('single');
          haveSameData = true;
          let moda = {
            // ...element,
            taskType: e,
            modelEventTarget: '',
            serviceTaskId: businessObject.id,
            taskName: window.bpmnInstance.element.businessObject.name
              ? window.bpmnInstance.element.businessObject.name
              : '',
            columnInfo: []
          };
          delete moda.id;
          console.log(moda, 'moda');
          return moda;
        } else {
          return element;
        }
      });
    }
    if (!haveSameData) {
      arr.push({
        serviceTaskId: businessObject.id,
        taskType: e,
        columnInfo: [],
        modelEventTarget: '',
        taskName: window.bpmnInstance.element.businessObject.name
          ? window.bpmnInstance.element.businessObject.name
          : '',
        modelId: params.get('modelId'),
        taskName: businessObject.name
      });
    }
    console.log(arr, 'aaaaa');
    dispatch(handleServiceRaskList(arr));
    setShowObject(true);
    if (e == 5) {
      getGroupListFilterTiming().then(rs => {
        let asd = rs.data.data.map(item => {
          let asr = {...item};
          if (item.children && item.children.length > 0) {
            asr.children = item.children.map(elem => {
              return {
                ...elem,
                value: elem.api.queryKey
              };
            });
          }
          return asr;
        });
        asd = asd.filter(i => i.children?.length > 0)
        getApiShareList().then(res=>{
          if (res.data.data.length != 0) {
            for (const group of res.data.data) {
              for (const child of group.children) {
                for(const thirdChild of child.children) {
                  for(const lastChild of thirdChild.children) {
                    lastChild.value = lastChild.queryKey
                  }
                }
              }
            }
          }
          const allData = asd.concat(res.data.data)
          setCallData(allData);
        })
      });
    }
  }
  // 记录初始化
  // key变化
  function keyChange(e, item) {
    console.log(e, 'key变化');
    console.log(item, 'key变化');
    console.log(keyOption, 'keyOptionkeyOptionkeyOption');
    console.log(columnInfo, 'columnInfocolumnInfocolumnInfo');
    let itemKey = {};
    // let newKeyOption: any = [];
    keyOption.forEach(ikn => {
      if (ikn.key == e) {
        console.log(ikn, 'ikn');
        // newKeyOption.push({...ikn, disabled: true});
        itemKey = {...ikn};
      }
    });

    let arrs = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        console.log(element, 'elementelementelement');
        let newData = element.columnInfo.map(res => {
          if (res.id == item.id) {
            console.log(res, 'res');
            console.log(item, 'item');
            return {
              ...res,
              ...itemKey,
              // key: itemKey.name,
              type: itemKey.types,
              label: itemKey.label
            };
          } else {
            return res;
          }
        });
        let newDatas = element.columnInfo.map(res => {
          if (res.id == item.id) {
            console.log(res, 'res');
            console.log(item, 'item');
            return {
              ...res,
              ...itemKey,
              name: itemKey.name,
              // key: itemKey.label,
              label: itemKey.label,
              // relationKey: itemKey.name.includes('.') ? itemKey.name : '',
              type: itemKey.types,
              formula: null
            };
          } else {
            return res;
          }
        });
        console.log(newDatas, 'newDatasnewDatasnewDatasnewDatasnewDatas');
        console.log(keyOption, 'keyOptionkeyOption');
        setColumnInfo(newDatas);
        let newKeyOption = keyOption.map(skjwd => {
          let returnData = {...skjwd, disabled: false};
          newDatas.forEach(elements => {
            if (elements.key && elements.key == skjwd.key) {
              returnData.disabled = true;
            }
          });
          return returnData;
        });
        setKeyOption(newKeyOption);
        return {
          ...element,
          columnInfo: newData
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arrs));
    // setIsfunc(false);
    // setTimeout(() => {
    //   setIsfunc(true);
    // }, 100);
  }
  // formula变化
  function formulaChange(e, item) {
    console.log(e, 'formula变化');
    console.log(item, 'formula变化');
    console.log(serviceList, 'serviceListserviceList');
    let arrs = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        let newData = element.columnInfo.map(res => {
          console.log(res, 'resresresresres');
          if (res.id == item.id) {
            return {...res, formula: e};
          } else {
            return res;
          }
        });
        return {
          ...element,
          columnInfo: newData
        };
      } else {
        return element;
      }
    });
    console.log(arrs, 'arrs');
    dispatch(handleServiceRaskList(arrs));
  }
  // 删除某项
  function deleteClick(e) {
    console.log(e, '删除某项');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        let arrs = element.columnInfo.filter(res => {
          if (res.id != e.id) {
            return res;
          }
        });
        let newKeyOption = keyOption.map(skjwd => {
          let returnData = {...skjwd, disabled: false};
          arrs.forEach(elements => {
            if (elements.key && elements.key == skjwd.key) {
              returnData.disabled = true;
            }
          });
          return returnData;
        });
        setKeyOption(newKeyOption);
        setColumnInfo(arrs);
        return {
          ...element,
          columnInfo: arrs
        };
      } else {
        return element;
      }
    });
    setIsfunc(false)
    setTimeout(() => {
      setIsfunc(true)
    }, 100);
    dispatch(handleServiceRaskList(arr));
  }
  // 添加某项
  function addField() {
    let needId = uuid.v4();
    let arr = [...columnInfo];
    arr.push({id: needId});
    setColumnInfo(arr);
    let arrs = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        if (element.columnInfo) {
          return {
            ...element,
            columnInfo: [...element.columnInfo, {id: needId}]
          };
        } else {
          return {
            ...element,
            columnInfo: [{id: needId}]
          };
        }
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arrs));
  }
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
    return arr;
  };
  // 根据类型使用不同公式
  const forMuFunction = (node, nodes, data) => {
    // console.log(node, '原数据');
    // console.log(nodes, '原数据1');
    // console.log(data, '原数据2');
    // console.log(columnInfo, 'fieldData');
    let a = filteredDatas(nodes, [...data, ...filterData],node);
    console.log(a, 'aaaaaaaaaaaa');
    a = {
      ...a,
      formulaEchoVal: false,
      onDisabled: (node.isPrimaryKey && !node.relationKey) || node.type == 'serial-number' || node.yuanType == 'serial-number' ? true : false,
      value: node.formula ? node.formula : null,
      placeholder:
        node.relationKey != null && node.isPrimaryKey
          ? '不填写时系统自动生成'
          : node.isPrimaryKey || node.type == 'serial-number' || node.yuanType == 'serial-number'
          ? '新增成功后系统自动生成'
          : '',
      onChange: function (e) {
        console.log(e, '3');
        console.log(node, '4');
        console.log(columnInfo, '5');
        let arrs = columnInfo.map(skjw => {
          if (skjw.id == node.id) {
            if(node.type == 'boolean' || node.type == 'enum'){
              return {
                ...skjw,
                formula: JSON.stringify(e) == '""'?null:e,
                label: skjw.label
              };
            }else{
              return {
                ...skjw,
                formula: e
                  ? e.filename
                    ? {...e, name: e.filename, state: 'uploaded'}
                    : e
                  : e,
                label: skjw.label
              };
            }
          } else {
            return skjw;
          }
        });
        let arrss = columnInfo.map(skjw => {
          if (skjw.id == node.id) {
            if(node.type == 'boolean' || node.type == 'enum'){
              return {
                ...skjw,
                formula: JSON.stringify(e) == '""'?null:e,
                label: skjw.label
              };
            }else{
              return {
                ...skjw,
                formula: e
                  ? e.filename
                    ? {...e, name: e.filename, state: 'uploaded'}
                    : e
                  : e,
                label: skjw.label
              };
            }
          } else {
            return skjw;
          }
        });
        setColumnInfo(arrs);
        let data = serviceList.map(element => {
          if (element.serviceTaskId == businessObject.id) {
            return {
              ...element,
              columnInfo: arrss
            };
          } else {
            return element;
          }
        });
        dispatch(handleServiceRaskList(data));
      }
    };
    if(node.type == 'boolean' || node.type == 'enum'){
      a.value = node.formula
    }
    console.log(a, '显示数据');
    if (a.rendererSchema) {
      if (node.driver) {
        a.rendererSchema.autoUpload = true;
        a.rendererSchema.proxy = true;
        a.rendererSchema.multiple = false;
        a.rendererSchema.useChunk = false;
        a.rendererSchema.drag = false;
        a.rendererSchema.uploadType = 'fileReceptor';
        a.rendererSchema.maxSize = 104857600;
        a.rendererSchema.receiver = {
          url: `${
            node.driver != null && node.driver != ''
              ? crudApi + '/application/app/file/upload/' + node.driver
              : 'default'
          }`,
          method: 'POST',
          requestAdaptor: '',
          adaptor: '',
          messages: {},
          responseData: {
            value: '$$'
          }
        };
      }
      if (node.type == 'select' || node.type == 'enum') {
        if (node.value.valueType.options) {
          a.rendererSchema.options = node.value.valueType.options;
        }
        if (node.value.valueType.source) {
          a.rendererSchema.source = node.value.valueType.source;
        }
      }
      if (node.type == 'dateRang' && node.dbType.toUpperCase() == 'DATETIME') {
        a.rendererSchema.type = 'input-datetime-range';
        a.rendererSchema.displayFormat = 'YYYY-MM-DD HH:mm:ss';
        a.rendererSchema.valueFormat = 'YYYY-MM-DD HH:mm:ss';
      } else if (node.type == 'dateRang' && node.dbType.toUpperCase() == 'DATE') {
        a.rendererSchema.type = 'input-date-range';
        a.rendererSchema.displayFormat = 'YYYY-MM-DD';
        a.rendererSchema.valueFormat = 'YYYY-MM-DD';
      } else if (node.type == 'dateRang' && node.dbType.toUpperCase() == 'TIME') {
        a.rendererSchema.type = 'input-time-range';
        a.rendererSchema.displayFormat = 'HH:mm:ss';
        a.rendererSchema.valueFormat = 'HH:mm:ss';
      }
      a.variables = a.rendererSchema.variables;
      return amisRender(
        getSchemaTpl('formulaControl', a),
        {advancedFeature: advancedFeature},
        {
          fetcher: service,
          theme: amisEnv.theme
        }
      );
    } else {
      if (
        nodes == 'text' ||
        nodes == 'textarea' ||
        nodes == 'rich-text' ||
        nodes == 'password' ||
        nodes == 'ciphertext' ||
        nodes == 'json'
      ) {
        if (node.isPrimaryKey || node.yuanType == 'serial-number') {
          return amisRender(
            getSchemaTpl('formulaControl-hour', a),
            {advancedFeature: advancedFeature},
            {
              fetcher: service,
              theme: amisEnv.theme
            }
          );
        } else {
          return amisRender(
            getSchemaTpl('tplFormulaControl', a),
            {advancedFeature: advancedFeature},
            {
              fetcher: service,
              theme: amisEnv.theme
            }
          );
        }
      } else if(nodes == 'boolean'){
        a.valueType = {
          type: 'select',
          placeholder: '请选择',
          options: [
            {
              value: true,
              label: '开启'
            },
            {
              value: false,
              label: '关闭'
            }
          ]
        }
        return amisRender(
          getSchemaTpl('formulaControl-hour', a),
          {advancedFeature: advancedFeature},
          {
            fetcher: service,
            theme: amisEnv.theme
          }
        );
      } else {
        if(node.type === "time" || node.type === "datetime") {
          const formatString = getFormatStringByPrecision(node.type === "datetime"
            ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss', node.showPrecision > 3 ? 3 : node.showPrecision,node.precisionCompatible);
          a.valueType.format = formatString
          a.valueType.valueFormat = formatString
          a.valueType.inputFormat = formatString
          a.valueType.displayFormat = formatString
          if (node.showPrecision > 3 && !node.precisionCompatible) {
            a = {
              "variables": a.variables,
              "placeholder": a.placeholder,
              "onDisabled": false,
              "formulaEchoVal": false,
              "valueType": {
                "placeholder": ""
              },
              "value": a.value,
              onChange: a.onChange
            }
            return amisRender(
              getSchemaTpl('formulaControl-hour', a),
              {
                advancedFeature: advancedFeature
              },
              {
                fetcher: service,
                theme: amisEnv.theme
              }
            );
          }
        }
        return amisRender(
          getSchemaTpl('formulaControl-hour', a),
          {advancedFeature: advancedFeature},
          {
            fetcher: service,
            theme: amisEnv.theme
          }
        );
      }
    }
  };
  // 是否忽略租户 数据变化
  const tenantFlagChange = e => {
    console.log(e, '是否忽略租户 数据变化');
    setTenantFlagRecord(e);
    setAppTenantCodeValue('')
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          tenantConfig:{
            ignoreTenantFlag: e,
            appTenantCode:''
          }
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 租户公式输入框
  const forMuFunctions = (data) => {
    let a = filteredDatas('text', [...data,...filterData]);
    console.log(a, 'aaaaa');
    a = {
      ...a,
      formulaEchoVal: false,
      placeholder:'请输入',
      valueType: {
        placeholder:'请输入'
      },
      value:appTenantCodeValue,
      onChange: function (e) {
        setAppTenantCodeValue(e)
        let data = serviceList.map(element => {
          if (element.serviceTaskId == businessObject.id) {
            return {
              ...element,
              tenantConfig:{
                ignoreTenantFlag: false,
                appTenantCode:e
              }
            };
          } else {
            return element;
          }
        });
        dispatch(handleServiceRaskList(data));
      }
    };
    return amisRender(
        getSchemaTpl('formulaControl-hour', a),
        {advancedFeature: advancedFeature},
        {
          fetcher: service,
          theme: amisEnv.theme
        }
    );
  };
  const [radioData, setRadioData] = useState('single');
  // 实体对象数据变化
  const radioChange = e => {
    setRadioData(e);
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          dataMode: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  return (
    <>
      <Form labelCol={{span: taskTypeValue==5?5:4}} wrapperCol={{span: 18}} form={form}>
        {/* <Form.Item
          name="eventType"
          label="事件类型"
          rules={[{required: true, message: '请选择事件类型'}]}
        >
          <Select
            placeholder={'请选择'}
            onChange={(e, data) => selectChange(e, data)}
            defaultValue={'class'}
            value={'class'}
            disabled
          >
            {data_options.map(e => {
              return (
                <Option key={e.value} value={e.value}>
                  {e.name}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item
          name="listenerType"
          label={eventTypeLabel}
          rules={[{required: true, message: '请输入'}]}
        >
          <Input
            disabled
            title="cn.iocoder.yudao.module.processManage.handler.delegate.RecordDelegate"
            value={
              'cn.iocoder.yudao.module.processManage.handler.delegate.RecordDelegate'
            }
            defaultValue={
              'cn.iocoder.yudao.module.processManage.handler.delegate.RecordDelegate'
            }
            readOnly
          />
        </Form.Item> */}
        {eventType == 'expression' || eventType == 'delegateExpression' ? (
          <Form.Item
            name="listenerTypeInput"
            label={eventTypeLabel}
            rules={[{required: true, message: '请输入'}]}
          >
            <Input
              onChange={event => {
                console.log(event, 'eventeventeventeventeventeventeventevent');
                updateElementAttr(event.target.value);
                // updateElementAttr(event.currentTarget.value);
              }}
            />
          </Form.Item>
        ) : (
          <></>
        )}
        <Form.Item name="taskType" label={'服务类型'}>
          <Select
            style={{marginLeft:taskTypeValue==5?'20px':'',width:taskTypeValue==5?'96%':''}}
            defaultValue={taskTypeValue}
            // style={{width: 120}}
            value={taskTypeValue}
            placeholder={'请选择'}
            onChange={taskTypeChange}
            options={[
              {value: 1, label: '新增记录', key: 1},
              {value: 2, label: '更新记录', key: 2},
              {value: 3, label: '删除记录', key: 3},
              {value: 4, label: '查询记录', key: 4},
              {value: 5, label: '调用服务', key: 5},
              {value: 6, label: '自定义处理器', key: 6},
            ]}
          />
        </Form.Item>

        {taskTypeValue == 1 && (
          <>
            <Form.Item<FieldType>
                label={'是否忽略租户'}
                name="ignoreTenantFlag"
            >
              <Switch
                  onChange={tenantFlagChange}
                  checked={tenantFlagRecord}
              />
            </Form.Item>
            {
                !tenantFlagRecord && isfunc && (
                    <>
                      <Form.Item<FieldType>
                          label={'指定租户'}
                          name="appTenantCode"
                      >
                        {forMuFunctions(formuVariables)}
                      </Form.Item>
                    </>
                )
            }
            <Spin spinning={showLoading}>
              {showObject &&
                amisRender(
                  schema,
                  {},
                  {
                    fetcher: service,
                    theme: amisEnv.theme
                  }
                )}
            </Spin>
            <>
              <Form.Item name="dataMode" label={'实体对象'}>
                <Radio.Group onChange={radioChange} value={radioData}>
                  <Radio value={'single'}>新增一条记录</Radio>
                  <Radio value={'multi'}>新增多条记录</Radio>
                </Radio.Group>
              </Form.Item>
              <Spin spinning={showLoading}>
                {columnInfo && columnInfo.length == 0 && (
                  <Form.Item<FieldType>
                    rules={[{required: true, message: '这是必填项'}]}
                    name="fieldDatas"
                  >
                    <div style={{marginLeft: '20px'}}>{'<空>'}</div>
                    {/* {'<空>'} */}
                  </Form.Item>
                )}
                {columnInfo &&
                  columnInfo.length > 0 &&
                  columnInfo.map(res => {
                    return (
                      <Form.Item<FieldType>>
                        <Row gutter={10} style={{marginLeft: '20px'}}>
                          <Col span={8}>
                            <Select
                              value={res?.key}
                              placeholder="请选择"
                              onChange={e => keyChange(e, res)}
                            >
                              {keyOption.map((res, index) => {
                                return (
                                  <Option
                                    key={index}
                                    label={res.label}
                                    value={res.key}
                                    disabled={res.disabled}
                                  >
                                    {res.label}
                                  </Option>
                                );
                              })}
                            </Select>
                          </Col>
                          {isfunc && (
                            <Col span={15}>
                              {res?.type
                                ? forMuFunction(res, res?.type, formuVariables)
                                : forMuFunction(res, 'text', formuVariables)}
                              {/* {amisRender(
                              getSchemaTpl('formulaControl-hour', {
                                value: res?.formula,
                                variables: formuVariables,
                                placeholder: '请配置目标值',
                                onChange: function (e) {
                                  formulaChange(e, res);
                                },
                                formulaEchoVal: false
                              })
                            )} */}
                              {/* <FormulaPicker
                              title={' '}
                              data={res?.formula}
                              value={res?.formula}
                              source={res?.formula}
                              allowInput
                              mixedMode
                              inputSettings={{type: res?.type}}
                              mode={'input-group'}
                              placeholder="请配置目标值"
                              variables={formuVariables}
                              onConfirm={e => formulaChange(e, res)}
                            /> */}
                            </Col>
                          )}
                          <Col span={1}>
                            <Button
                              icon={<DeleteOutlined />}
                              onClick={() => deleteClick(res)}
                            />
                          </Col>
                        </Row>
                      </Form.Item>
                    );
                  })}
                <Row style={{marginLeft: '20px'}}>
                  <Col span={24}>
                    <Button
                      style={{width: '90%', marginTop: '10px'}}
                      onClick={addField}
                    >
                      新增
                    </Button>
                  </Col>
                </Row>
              </Spin>
            </>
          </>
        )}
        {taskTypeValue == 2 && (
          <UpdateRecrd
            businessObject={businessObject}
            cascaderValue={cascaderValue}
            formuVariables={formuVariables}
          />
        )}
        {taskTypeValue == 3 && (
          <DeleteRecord
            businessObject={businessObject}
            cascaderValue={cascaderValue}
            formuVariables={formuVariables}
          />
        )}
        {taskTypeValue == 4 && (
          <QueryRecord
            businessObject={businessObject}
            cascaderValue={cascaderValue}
            formuVariables={formuVariables}
          />
        )}
        {taskTypeValue == 5 && (
          <CallService
            businessObject={businessObject}
            cascaderValue={callData}
            formuVariables={formuVariables}
          />
        )}
        {taskTypeValue == 6 && (
          <HandlersService
            businessObject={businessObject}
            cascaderValue={callData}
            formuVariables={formuVariables}
          />
        )}
      </Form>
    </>
  );
}
