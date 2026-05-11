import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';
import {EllipsisOutlined, DeleteFilled, QuestionCircleOutlined} from '@ant-design/icons';
import {
  Row,
  Col,
  Input,
  Button,
  Space,
  Result,
  Empty,
  Select,
  Form,
  Collapse,
  Switch,
  Cascader,
  Radio,
  Modal,
  Tooltip,
  Spin
} from 'antd';
import {ArrayInput, Controller, InputBox, ConditionBuilder} from 'amis-ui';
import {useAppDispatch, useAppSelector} from '@/redux/hook/hooks';
import {getTableData} from '@/api/entitymanage';
import {handleServiceRaskList} from '@/redux/slice/bpmnSlice';
import {render as amisRender} from 'amis';
import * as uuid from 'uuid';
import {service} from '@/utils/request';
import {filteredData,getOptionAll} from './conditionBuilder';
import {FormulaPicker} from 'amis-ui';
import {filteredDatas, filterData} from './getSchemaChange';
import {getSchemaTpl} from 'amis-editor';
import {getNoLoopRelation,getNoLoopRelations,transformSelectAnyIn,reverseTransformSelectAnyIn,groupByRelationKeyWithPK} from './config'
import {getFormatStringByPrecision} from '@/utils';
import {baseURL, devApiUrl, advancedFeature} from '@/utils/env'
let crudApi = baseURL + devApiUrl;

// 更新记录组件
const UpdateRecrd = forwardRef(function UpdateRecrd(props: any, ref) {
  const entityList = useAppSelector(state => state.bpmn.entityList);
  console.log(props, '传的参数');
  const {businessObject, cascaderValue} = props;
  const serviceList = useAppSelector(state => state.bpmn.serviceRaskList);
  const dispatch = useAppDispatch();

  const [form] = Form.useForm<{}>();
  const [isUseEff, setIsUseEff] = useState(false); // 是否初始化
  // 是否忽略租户开关
  const [tenantFlagRecord, setTenantFlagRecord] = useState<any>(false);
  // 是否忽略租户输入框
  const [appTenantCodeValue, setAppTenantCodeValue] = useState<any>('');

  // 删除记录
  const [nodeValue, setNodeValue] = useState([]);
  const [objectKey, setObjectKey] = useState('');
  const [showObject, setShowObject] = useState(false);
  const [keyOption, setKeyOption] = useState([]); // 筛选条件key值数组
  // 更新字段列表
  const [fieldData, setFieldData] = useState([]);
  // 筛选条件 简单类型列表数据
  const [filterFields, setFilterFields] = useState([]);
  // 筛选条件 复杂类型弹框数据
  const [modelFilterFields, setModelFilterFields] = useState({});
  const modelFilterFieldsData = useRef({});
  // 上下问数据
  const [formuVariables, setFormuVariables] = useState([]);

  // 记录添加按钮数据
  const [createCheck, setCreateCheck] = useState(true);

  // 是否显示筛选条件
  const [isSHow, setIsSHow] = useState(true);
  // 是否显示高级筛选条件
  const [isSHows, setIsSHows] = useState(true);

  // 过滤器 更新字段数据
  const [updateFieldsOption, setUpdateFieldsOption] = useState([]);
  //
  const [showFuncTion, setShowFuncTion] = useState(true);
  useEffect(() => {
    setShowObject(false);
    setIsUseEff(true);
    getOptionAll(entityList)
    console.log(props, '传的参数');
    console.log(props.businessObject, 'props.businessObject');
    console.log(serviceList, 'serviceListserviceListserviceListserviceList');
    console.log(cascaderValue, 'cascaderValuecascaderValuecascaderValue');
    let haveSamaData = false;
    setFormuVariables(props.formuVariables);
    if (serviceList) {
      setNodeValue({
        taskType: 2
      });
      serviceList.forEach(element => {
        if (
          element.serviceTaskId == props.businessObject.id ||
          element.id == businessObject.id
        ) {
          haveSamaData = true;
          console.log(element, '选择的节点1');
          // 确定哪个节点
          setNodeValue(element);
          setTimeout(() => {
            setShowObject(true);
          }, 100);
          setObjectKey(element.modelEventTarget);
          // setTaskTypeValue(element.taskType);
          if (element.updateFields) {
            let ses = element.updateFields.map(item => {
              if (item.key && item.key.includes('.')) {
                return {
                  ...item
                };
              } else {
                if (element.fieldsData) {
                  let sdj = element.fieldsData.filter(jfj => {
                    if (jfj.key == item.key) {
                      return {...item};
                    }
                  });
                  console.log(sdj, 'sdj');
                  if (sdj.length > 0) {
                    return {...item};
                  } else {
                    return item;
                  }
                } else {
                  return item;
                }
              }
            });
            console.log(ses, 'sessessesses');
            setFieldData(ses);
            if (cascaderValue.options) {
              cascaderValue.options.forEach(res => {
                res.children.forEach(item => {
                  if (item.value == element.modelEventTarget) {
                    console.log(item, 'itemitemitemitem');
                    let allData: any = [];
                    let relationAllArr:any = []
                    if (item.form.fields && item.form.fields != null) {
                      let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                      let reasd = item.form.fields.filter(rsw => {
                        return (
                          rsw.yuanType != 'relation' && rsw.type != 'relation' &&
                          !rsw.isPrimaryKey &&
                          !rsw.isTenantCode
                        );
                      });
                      allData = [...reasd];
                      allData = allData.map(swop=>{
                        if(swop.isTreeParent) {
                          return {...swop,
                            primaryKeyType: primaryKeyData[0].type}
                        }else{
                          return swop
                        }
                      })
                    }
                    if (
                      item.form.relationFields &&
                      item.form.relationFields != null
                    ) {
                      let relationPrimaryKeyData = groupByRelationKeyWithPK(item.form.relationFields)
                      item.form.relationFields.forEach(ikj=>{
                        if(!ikj.isDeleteUser &&
                            !ikj.isDeleteDate &&
                            !ikj.isDeleteFlag &&
                            !ikj.isCreateDate &&
                            !ikj.isUpdateDate &&
                            !ikj.isUpdateUser &&
                            !ikj.isCreateUser){
                              if(ikj.isTreeParent){
                                relationAllArr.push({...ikj,
                                  primaryKeyType: relationPrimaryKeyData[ikj.relationKey].type
                                })
                              }else{
                                relationAllArr.push(ikj)
                              }
                        }
                      })
                    }
                      allData = [...allData, ...relationAllArr];
                    let arrs = builderChange(allData);
                    console.log(arrs, 'arrs');
                    let needArr = [];
                    arrs.forEach(item => {
                      if (
                        !item.isForeignKey &&
                        // !item.isPrimaryKey &&
                        // item.type != 'relation' &&
                        item.yuanType != 'formula' &&
                        // item.yuanType != 'relation' &&
                        !item.isUpdateDate &&
                        !item.isCreateDate &&
                        !item.isUpdateUser &&
                        !item.isCreateUser &&
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
                    let needArrs = arrs.filter(item => {
                      return !item.isPrimaryKey && item.yuanType != 'formula';
                    });
                    let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                    let asdArr = item.form.fields.filter(item => {
                      return (
                        item.type != 'relation' &&
                        !item.isDeleteDate &&
                        !item.isTenantCode &&
                        !item.isDeleteUser &&
                        item.type != 'date-range' &&
                        !item.isCreateDate &&
                        !item.isUpdateDate &&
                        !item.isUpdateUser &&
                        !item.isCreateUser &&
                        !item.isTenantCode
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
                    let asd = builderChange(asdArr);
                    console.log(asd, 'asdasdasdasd');
                    asd = asd.filter(skl => {
                      return (
                        skl.yuanType != 'relation' &&
                        skl.yuanType != 'date-range' &&
                        skl.yuanType != 'rich-text' &&
                        skl.yuanType != 'attachment' &&
                        skl.yuanType != 'formula' &&
                        skl.yuanType != 'users' &&
                        skl.yuanType != 'password' &&
                        skl.yuanType != 'ciphertext' &&
                        skl.yuanType != 'json'
                      );
                    });
                    asd = asd.map(res=>{
                      let rertun = {...res}
                      if(res.yuanType == 'time' || res.yuanType == 'datetime'){
                        const formatString = getFormatStringByPrecision(res.yuanType == 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss', rertun.showPrecision > 3 ? 3 : rertun.showPrecision, rertun.precisionCompatible);
                        rertun.value.valueType.format = formatString
                        rertun.value.valueType.valueFormat = formatString
                        rertun.value.valueType.inputFormat = formatString
                        rertun.value.valueType.displayFormat = formatString
                      }
                      return rertun
                    })
                    setUpdateFieldsOption(asd);
                  }
                });
              });
            }
          } else {
            setFieldData([]);
          }
          if (element.fieldsData && element.fieldsData.length > 0) {
            let fieldsDataArr = element.fieldsData.filter(snj => {
              return (
                !snj.isPrimaryKey &&
                snj.yuanType != 'formula' &&
                snj.yuanType != 'relation'
              );
            });
            fieldsDataArr = JSON.parse(JSON.stringify(fieldsDataArr))
            setUpdateFieldsOption(fieldsDataArr.map(res=>{
              let rertun = {...res}
              if(res.yuanType == 'time' || res.yuanType == 'datetime'){
                const formatString = getFormatStringByPrecision(res.yuanType == 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss',rertun.showPrecision > 3 ? 3 : rertun.showPrecision,rertun.precisionCompatible);
                rertun.value.valueType.format = formatString
                rertun.value.valueType.valueFormat = formatString
                rertun.value.valueType.inputFormat = formatString
                rertun.value.valueType.displayFormat = formatString
              }
              return rertun
            }));
          } else {
            if(element.fieldsData && element.fieldsData.length > 0){
              setUpdateFieldsOption(element.fieldsData.map(res=>{
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
            }
          }
          // setFieldData(element.updateFields);
          // setInitFields(element.initFields);
          setRadioValue(element.conditionMode);
          if (element.conditionMode == 1) {
            if (element.filterCondition) {
              let aaa = JSON.parse(JSON.stringify(typeof element.filterCondition == 'string' ? JSON.parse(element.filterCondition) : element.filterCondition));
              aaa = reverseTransformSelectAnyIn(aaa)
              console.log(aaa,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
              setFilterFields(aaa);
              form.setFieldValue('filterCondition', aaa);
              setIsSHow(false);
              setTimeout(() => {
                setIsSHow(true);
              }, 100);
            }
          } else {
            console.log('进入');
            let needArrs = {};
            if (element.filterCondition) {
              if (typeof element.filterCondition == 'string') {
                let a = JSON.parse(element.filterCondition);
                needArrs = JSON.parse(JSON.stringify(a));
              } else {
                let a = element.filterCondition;
                needArrs = JSON.parse(JSON.stringify(a));
              }
              setModelFilterFields(needArrs);
              modelFilterFieldsData.current = needArrs;
            }
          }
          form.setFieldsValue({
            conditionMode: element.conditionMode,
            filterCondition:
              typeof element.filterCondition == 'string'
                ? JSON.parse(element.filterCondition)
                : element.filterCondition
          });
          setCreateCheck(
            element.createRelationRecord == null
              ? true
              : element.createRelationRecord
          );
        }
      });
      if (!haveSamaData) {
        let a = [...serviceList, {...businessObject}];
        dispatch(handleServiceRaskList(a));
      }
    } else {
      setRadioValue(1);
      setShowObject(true);
      setNodeValue({
        taskType: 2
      });
      dispatch(
        handleServiceRaskList([
          {...businessObject, serviceTaskId: businessObject.id}
        ])
      );
    }
  }, [businessObject.id]);
  // 高级设置弹出层显示隐藏
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 类型选择默认值
  const [radioValue, setRadioValue] = useState(1);
  // 数据源级联列表
  const [cascaderOptions, setCascaderOptions] = useState([]);
  const [showLoading, setShowLoading] = useState(false);
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
          onlyLeaf: true,
          id: 'nestedId',
          label: '更新对象:',
          options: cascaderValue.options,
          value: nodeValue.modelEventTarget
        }
      ],
      onEvent: {
        change: {
          actions: [
            {
              actionType: 'custom',
              script: function (_, doAction, event) {
                console.log(_, '_____');
                console.log(
                  doAction,
                  'doActiondoActiondoActiondoActiondoAction'
                );
                console.log(event, 'eventeventeventeventevent');
                console.log(cascaderValue, 'cascaderValuecascaderValue');
                console.log(fieldData,'fieldData')
                console.log(isUseEff,'isUseEff')
                setShowLoading(true)
                setObjectKey(event.data.nestedSelect);
                if (!fieldData) {
                  setFieldData([]);
                }
                let fieldsData: any = [];
                let haveDataArr = false
                  entityList.data.options.forEach(res => {
                    res.children.forEach(item => {
                      if (item.value == event.data.nestedSelect) {
                        haveDataArr = true
                        console.log(item, 'itemitemitemitem');
                        let allData: any = [];
                        let allDatas: any = [];
                        let relationAllArr: any = [];
                        if (item.form.fields && item.form.fields != null) {
                          let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                          let reasd = item.form.fields.filter(rsw => {
                            return (
                              rsw.yuanType != 'relation' &&
                              rsw.type != 'relation' &&
                              !rsw.isPrimaryKey &&
                              !rsw.isTenantCode &&
                              !rsw.isDeleteUser &&
                              !rsw.isDeleteDate &&
                              !rsw.isDeleteFlag &&
                              !rsw.isCreateDate &&
                              !rsw.isUpdateDate &&
                              !rsw.isUpdateUser &&
                              !rsw.isCreateUser
                            );
                          });
                          allData = reasd.map(swop=>{
                            if(swop.isTreeParent) {
                              return {...swop,
                                primaryKeyType: primaryKeyData[0].type}
                            }else{
                              return swop
                            }
                          })
                          item.form.fields.forEach((ikj, index) => {
                            if (
                                !ikj.isPrimaryKey &&
                                !ikj.isForeignKey &&
                                ikj.type != 'formula' &&
                                ikj.type != 'relation' &&
                                !ikj.isCreateDate &&
                                !ikj.isUpdateDate &&
                                !ikj.isUpdateUser &&
                                !ikj.isCreateUser &&
                                !ikj.isTenantCode
                            ) {
                              if (
                                  ikj.label.includes('【') &&
                                  ikj.relationKey &&
                                  ikj.relationKey != ''
                              ) {
                                if(ikj.isTreeParent){
                                  allDatas.push({
                                    ...ikj,
                                    key: ikj.relationKey + '.' + ikj.key,
                                    title: ikj.label,
                                    primaryKeyType: primaryKeyData[0].type
                                  });
                                }else{
                                  allDatas.push({
                                    ...ikj,
                                    key: ikj.relationKey + '.' + ikj.key,
                                    title: ikj.label
                                  });
                                }
                              } else {
                                if(ikj.isTreeParent) {
                                  allDatas.push({...ikj, title: ikj.label,
                                    primaryKeyType: primaryKeyData[0].type
                                  });
                                }else{
                                  allDatas.push({...ikj, title: ikj.label});
                                }
                              }
                            }
                          })
                        }
                        if (item.form.relationFields &&
                          item.form.relationFields != null
                        ) {
                          let relationPrimaryKeyData = groupByRelationKeyWithPK(item.form.relationFields)
                          item.form.relationFields.forEach((ikj, index) => {
                            if (
                                !ikj.isForeignKey &&
                                !ikj.isDeleteDate &&
                                !ikj.isDeleteFlag &&
                                !ikj.isCreateDate &&
                                !ikj.isUpdateDate &&
                                !ikj.isUpdateUser &&
                                !ikj.isCreateUser &&
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
                        allData = [...allData, ...relationAllArr];
                        let arrs = builderChange(allData);
                        console.log(arrs, 'arrs');
                        let needArr:any = [];
                        arrs.forEach(item => {
                          if (
                            !item.isForeignKey &&
                            // !item.isPrimaryKey &&
                            // item.type != 'relation' &&
                            item.yuanType != 'formula' &&
                            // item.yuanType != 'relation' &&
                            !item.isUpdateDate &&
                            !item.isCreateDate &&
                            !item.isUpdateUser &&
                            !item.isCreateUser &&
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
                        let objectArr:any = [res.value,event.data.nestedSelect]
                        let lastAllDatas = getNoLoopRelations(relationAllArr,item.form.originRelation,entityList.data.options,objectArr).filter(res=>{
                          return res.type != 'relation';
                        })
                        // let lastAllDatas =  getNoLoopRelation(res.children,item.id)
                        // needArr = needArr.filter(wjs => lastAllDatas.some(wsw => wsw.label == wjs.label))
                        needArr = [...allDatas,...lastAllDatas].map(rsww=>{
                          return {...rsww,yuanType:rsww.yuanType?rsww.yuanType:rsww.type}
                        })
                        console.log(needArr,'needArr1111')
                        let needArrs = arrs.filter(item => {
                          return (
                            !item.isPrimaryKey && item.yuanType != 'formula'
                          );
                        });
                        let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                        let asdArr = item.form.fields.filter(item => {
                          return (
                            item.type != 'relation' &&
                            !item.isDeleteDate &&
                            !item.isDeleteUser &&
                            item.type != 'date-range' &&
                            !item.isCreateDate &&
                            !item.isUpdateDate &&
                            !item.isUpdateUser &&
                            !item.isDeleteFlag &&
                            !item.isCreateUser &&
                            !item.isTenantCode
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
                        let asd = builderChange(asdArr);
                        console.log(asd, 'asdasdasdasd');
                        asd = asd.filter(skl => {
                          return (
                            skl.yuanType != 'relation' &&
                            skl.yuanType != 'date-range' &&
                            skl.yuanType != 'rich-text' &&
                            skl.yuanType != 'attachment' &&
                            skl.yuanType != 'formula' &&
                            skl.yuanType != 'users' &&
                            skl.yuanType != 'password' &&
                            skl.yuanType != 'ciphertext' &&
                            skl.yuanType != 'json'
                          );
                        });
                        asd = asd.map(res=>{
                          let rertun = {...res}
                          if(res.yuanType == 'time' || res.yuanType == 'datetime'){
                            const formatString = getFormatStringByPrecision(res.yuanType == 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss', rertun.showPrecision > 3 ? 3 : rertun.showPrecision, rertun.precisionCompatible);
                            rertun.value.valueType.format = formatString
                            rertun.value.valueType.valueFormat = formatString
                            rertun.value.valueType.inputFormat = formatString
                            rertun.value.valueType.displayFormat = formatString
                          }
                          return rertun
                        })
                        setUpdateFieldsOption(asd);

                        fieldsData = needArrs;
                        let arr = serviceList.map(element => {
                          if (
                            element.serviceTaskId == props.businessObject.id
                          ) {
                            console.log(element, '1111111');
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
                            if (!radioValue) {
                              if (!isUseEff) {
                                setShowLoading(false)
                                console.log('进入',needArr);
                                setFilterFields({});
                                setModelFilterFields({});
                                modelFilterFieldsData.current = {};
                                form.setFieldValue('filterCondition', {});
                                setKeyOption(needArr);
                                setFieldData([]);
                                setRadioValue(1);
                                form.setFieldsValue({
                                  conditionMode: 1
                                });
                                setIsSHow(false);
                                setTimeout(() => {
                                  setIsSHow(true);
                                }, 100);
                                return {
                                  ...element,
                                  modelEventTarget: event.data.nestedSelect,
                                  updateFields: [],
                                  filterCondition: {},
                                  fieldsData: fieldsData,
                                  conditionMode: 1,
                                  fields: item.form.fields,
                                  originRelation: item.form.originRelation,
                                  relationFields: item.form.relationFields
                                };
                              } else {
                                console.log('进入1');
                                let newKeyOption = needArr.map(skjwd => {
                                  let returnData = {
                                    ...skjwd,
                                    // key: skjwd.name,
                                    disabled: false
                                  };
                                  if (returnData.relationKey) {
                                    returnData.key =
                                      returnData.relationKey +
                                      '.' +
                                      returnData.name;
                                  }
                                  if (
                                    element.updateFields &&
                                    element.updateFields != null &&
                                    element.updateFields.length != 0
                                  ) {
                                    element.updateFields.forEach(elements => {
                                      if (elements.key == returnData.key) {
                                        returnData.disabled = true;
                                      }
                                    });
                                  }
                                  return returnData;
                                });
                                console.log(newKeyOption, 'newKeyOption2');
                                setKeyOption(newKeyOption);
                                if (element.conditionMode == 1) {
                                  if (element.filterCondition) {
                                    let aaa = JSON.parse(JSON.stringify(typeof element.filterCondition == 'string' ? JSON.parse(element.filterCondition) : element.filterCondition));
                                    aaa = reverseTransformSelectAnyIn(aaa)
                                    console.log(aaa,'1111111111111111111111111111111111111111111')
                                    setFilterFields(aaa);
                                    form.setFieldValue('filterCondition', aaa);
                                    setIsSHow(false);
                                    setTimeout(() => {
                                      setIsSHow(true);
                                    }, 100);
                                  }
                                } else {
                                  if (element.filterCondition) {
                                    let needArr = {};
                                    if (
                                      typeof element.filterCondition == 'string'
                                    ) {
                                      let a = JSON.parse(element.filterCondition);
                                      needArr = JSON.parse(JSON.stringify(a));
                                    } else {
                                      let a = element.filterCondition;
                                      needArr = JSON.parse(JSON.stringify(a));
                                    }
                                    setModelFilterFields(needArr);
                                    modelFilterFieldsData.current = needArr;
                                  }
                                }
                                setIsSHow(false);
                                setTimeout(() => {
                                  setIsSHow(true);
                                }, 100);
                                return {
                                  ...element,
                                  modelEventTarget: event.data.nestedSelect,
                                  fieldsData: fieldsData,
                                  conditionMode: 1,
                                  fields: item.form.fields,
                                  originRelation: item.form.originRelation,
                                  relationFields: item.form.relationFields
                                };
                              }
                            } else {
                              console.log('进入3');
                              if (!isUseEff) {
                                setShowLoading(false)
                                console.log('进入4');
                                setKeyOption(needArr);
                                setFieldData([]);
                                setFilterFields({});
                                setRadioValue(1);
                                form.setFieldsValue({
                                  conditionMode: 1
                                });
                                setModelFilterFields({});
                                modelFilterFieldsData.current = {};
                                form.setFieldValue('filterCondition', {});
                                setIsSHow(false);
                                setTimeout(() => {
                                  setIsSHow(true);
                                }, 100);
                                return {
                                  ...element,
                                  modelEventTarget: event.data.nestedSelect,
                                  updateFields: [],
                                  filterCondition: {},
                                  // createRelationRecord: true,
                                  fieldsData: fieldsData,
                                  fields: item.form.fields,
                                  originRelation: item.form.originRelation,
                                  relationFields: item.form.relationFields
                                };
                              } else {
                                console.log(element, '进入5');
                                  entityList.data.options.forEach(res => {
                                    res.children.forEach(item => {
                                      if (item.value == element.modelEventTarget) {
                                        let allData: any = [];
                                        let allDatas: any = [];
                                        let relationAllArr: any = [];
                                        if (
                                          item.form.fields &&
                                          item.form.fields != null
                                        ) {
                                          let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                                          let reasd = item.form.fields.filter(
                                            rsw => {
                                              return (
                                                rsw.yuanType != 'relation' &&
                                                rsw.type != 'relation' &&
                                                !rsw.isPrimaryKey &&
                                                !rsw.isTenantCode
                                              );
                                            }
                                          );
                                          allData = [...reasd];
                                          allData = allData.map(swop=>{
                                            if(swop.isTreeParent) {
                                              return {...swop,
                                                primaryKeyType: primaryKeyData[0].type}
                                            }else{
                                              return swop
                                            }
                                          })
                                          item.form.fields.forEach((ikj, index) => {
                                            if (
                                                !ikj.isPrimaryKey &&
                                                !ikj.isForeignKey &&
                                                ikj.type != 'formula' &&
                                                ikj.type != 'relation' &&
                                                !ikj.isCreateDate &&
                                                !ikj.isUpdateDate &&
                                                !ikj.isUpdateUser &&
                                                !ikj.isDeleteFlag &&
                                                !ikj.isCreateUser &&
                                                !ikj.isTenantCode
                                            ) {
                                              if (
                                                  ikj.label.includes('【') &&
                                                  ikj.relationKey &&
                                                  ikj.relationKey != ''
                                              ) {
                                                if(ikj.isTreeParent){
                                                  allDatas.push({
                                                    ...ikj,
                                                    // key: ikj.relationKey + '.' + ikj.key,
                                                    title: ikj.label,
                                                    primaryKeyType: primaryKeyData[0].type
                                                  });
                                                }else{
                                                  allDatas.push({
                                                    ...ikj,
                                                    // key: ikj.relationKey + '.' + ikj.key,
                                                    title: ikj.label
                                                  });
                                                }
                                              } else {
                                                if(ikj.isTreeParent) {
                                                  allDatas.push({...ikj, title: ikj.label,
                                                    primaryKeyType: primaryKeyData[0].type
                                                  });
                                                }else{
                                                  allDatas.push({...ikj, title: ikj.label});
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
                                          allData = [
                                            ...allData,
                                            ...item.form.relationFields
                                          ];
                                          item.form.relationFields.forEach((ikj, index) => {
                                            if (
                                                !ikj.isForeignKey &&
                                                !ikj.isDeleteDate &&
                                                !ikj.isDeleteFlag &&
                                                !ikj.isCreateDate &&
                                                !ikj.isUpdateDate &&
                                                !ikj.isUpdateUser &&
                                                !ikj.isCreateUser &&
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
                                        console.log(arrs, 'arrs');
                                        let needArr: any = [];
                                        let newKeyOption: any = [];
                                        arrs.forEach(item => {
                                          if (
                                            !item.isForeignKey &&
                                            // !item.isPrimaryKey &&
                                            // item.type != 'relation' &&
                                            item.yuanType != 'formula' &&
                                            // item.yuanType != 'relation' &&
                                            !item.isUpdateDate &&
                                            !item.isCreateDate &&
                                            !item.isUpdateUser &&
                                            !item.isCreateUser &&
                                            !item.isTenantCode
                                          ) {
                                            if (
                                              item.label.includes('【') &&
                                              item.relationKey != '' &&
                                              item.relationKey != null
                                            ) {
                                              needArr.push({
                                                ...item,
                                                key:
                                                  item.relationKey +
                                                  '.' +
                                                  item.name
                                              });
                                            } else {
                                              needArr.push({
                                                ...item,
                                                key: item.name
                                              });
                                            }
                                          }
                                        });
                                        let objectArr:any = [res.value,element.modelEventTarget]
                                        let lastAllDatas = getNoLoopRelations(relationAllArr,item.form.originRelation,entityList.data.options,objectArr).filter(res=>{
                                          return res.type != 'relation';
                                        })
                                        // let lastAllDatas =  getNoLoopRelation(res.children,item.id)
                                        // needArr = needArr.filter(wjs => lastAllDatas.some(wsw => wsw.label == wjs.label))
                                        needArr = [...allDatas,...lastAllDatas].map(rsww=>{
                                          return {...rsww,yuanType:rsww.yuanType?rsww.yuanType:rsww.type}
                                        })
                                        needArr.forEach(skjwd => {
                                          let returnData = {
                                            ...skjwd,
                                            disabled: false
                                          };
                                          if (returnData.relationKey && !returnData.key.includes('.')) {
                                            returnData.key =
                                              returnData.relationKey +
                                              '.' +
                                              returnData.key;
                                          }
                                          if (
                                            element.updateFields &&
                                            element.updateFields != null &&
                                            element.updateFields.length > 0
                                          ) {
                                            element.updateFields.forEach(
                                              elements => {
                                                if (
                                                  elements.key == returnData.key
                                                ) {
                                                  returnData.disabled = true;
                                                }
                                              }
                                            );
                                          }
                                          newKeyOption.push(returnData);
                                        });
                                        setKeyOption(newKeyOption);
                                      }
                                    });
                                  });
                                if (element.conditionMode == 1) {
                                  if (element.filterCondition) {
                                    let aaa = JSON.parse(JSON.stringify(typeof element.filterCondition == 'string' ? JSON.parse(element.filterCondition) : element.filterCondition));
                                    aaa = reverseTransformSelectAnyIn(aaa)
                                    console.log(aaa,'222222222222222222222222222222222')
                                    setFilterFields(aaa);
                                    form.setFieldValue('filterCondition', aaa);
                                    setIsSHow(false);
                                    setTimeout(() => {
                                      setIsSHow(true);
                                    }, 100);
                                  }
                                } else {
                                  if (element.filterCondition) {
                                    console.log('进入2');
                                    let needArr = {};
                                    if (
                                      typeof element.filterCondition == 'string'
                                    ) {
                                      let a = JSON.parse(
                                        element.filterCondition
                                      );
                                      needArr = JSON.parse(JSON.stringify(a));
                                    } else {
                                      let a = element.filterCondition;
                                      needArr = JSON.parse(JSON.stringify(a));
                                    }
                                    setModelFilterFields(needArr);
                                    modelFilterFieldsData.current = needArr;
                                  }
                                }
                                setIsSHow(false);
                                setTimeout(() => {
                                  setIsSHow(true);
                                }, 100);
                                return {
                                  ...element,
                                  modelEventTarget: event.data.nestedSelect,
                                  // updateFields: [],
                                  fieldsData: fieldsData,
                                  fields: item.form.fields,
                                  originRelation: item.form.originRelation,
                                  relationFields: item.form.relationFields
                                };
                              }
                            }
                          } else {
                            return element;
                          }
                        });
                        console.log(arr, 'arrarrarrarrarrarr');
                        dispatch(handleServiceRaskList(arr));
                      }
                    });
                  });
                  if(!haveDataArr){
                    setFieldData([]);
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
                if (!radioValue) {
                  setRadioValue(1);
                  form.setFieldsValue({
                    conditionMode: 1
                  });
                }
                setIsUseEff(false);
              }
            }
          ]
        }
      }
    }
  };
  // 修改条件组合数据
  const builderChange = e => {
    console.log(e, '数据');
    let arr = [];
    for (let i in e) {
      if (
        // e[i].type != 'RELATION' &&
        // e[i].type != 'relation' &&
        !e[i].isDeleteDate
        // e[i].key != 'deleted'
      ) {
        let obj = filteredData(e[i]);
        if (obj != undefined) {
          arr.push(obj);
        }
      }
    }
    return arr;
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
    // console.log(a, 'aaaaa');
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
  // 类型选择切换
  const radioChange = e => {
    console.log(e, '新增列表切换');
    setRadioValue(e.target.value);
    setFilterFields({});
    setModelFilterFields({});
    modelFilterFieldsData.current = {};
    form.setFieldValue('filterCondition', {});
    setIsSHow(false);
    setTimeout(() => {
      setIsSHow(true);
    }, 100);
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          conditionMode: e.target.value,
          filterCondition: {}
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 点击显示高级设置弹出层
  const inputClick = () => {
    setIsModalOpen(true);
    setIsSHows(false)
    setTimeout(()=>{
      form.setFieldsValue({
        filterCondition: JSON.stringify(modelFilterFieldsData.current) === '{}'?{}:reverseTransformSelectAnyIn(modelFilterFieldsData.current)
      });
      setIsSHows(true)
    },100)
  };
  // 高级设置确认
  const handleOk = () => {
    console.log('高级设置确认', modelFilterFields);
    console.log(businessObject.filterCondition, 'needValue.filterCondition');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          filterCondition: transformSelectAnyIn(modelFilterFieldsData.current)
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
    setIsModalOpen(false);
  };
  // 高级设置取消
  const handleCancel = () => {
    console.log('高级设置取消');
    form.setFieldsValue({
      filterCondition:{}
    })
    setIsModalOpen(false);
  };
  // 筛选条件 简单模式
  const objectKeyChange = e => {
    console.log(e, '筛选条件 简单模式');
    let data = Object.assign({}, e);
    console.log(data, 'data');
    if (!isUseEff) {
      let result = reverseTransformSelectAnyIn(data)
      form.setFieldValue('filterCondition',result)
      setFilterFields(transformSelectAnyIn(data));
      let arr = serviceList.map(element => {
        if (element.serviceTaskId == businessObject.id) {
          return {
            ...element,
            filterCondition: transformSelectAnyIn(data)
          };
        } else {
          return element;
        }
      });
      console.log(arr, '类型选择数据');
      dispatch(handleServiceRaskList(arr));
    }
  };
  const objectKeyModelChange = e => {
    console.log(e, '弹框数据变化');
    let aa = JSON.parse(JSON.stringify(e))
    let result = reverseTransformSelectAnyIn(aa)
    form.setFieldValue('filterCondition',result)
    modelFilterFieldsData.current = result
    setModelFilterFields(result);
  };
  // 更新字段列表 添加 弹出弹出框
  const addField = () => {
    let needId = uuid.v4();
    let arr = [...fieldData];
    arr.push({id: needId});
    setFieldData(arr);
    let arrs = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        if (element.updateFields) {
          return {
            ...element,
            updateFields: [...element.updateFields, {id: needId}]
          };
        } else {
          return {
            ...element,
            updateFields: [{id: needId}]
          };
        }
      } else {
        return element;
      }
    });
    console.log(arrs, 'arrs');
    dispatch(handleServiceRaskList(arrs));
  };
  // 更新字段列表 删除
  const deleteClick = item => {
    console.log(item, '更新字段列表 删除');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == props.businessObject.id) {
        let arrs = element.updateFields.filter(res => {
          if (res.id != item.id) {
            return res;
          }
        });
        setFieldData(arrs);
        let newKeyOption = keyOption.map(skjwd => {
          let returnData = {...skjwd, disabled: false};
          arrs.forEach(elements => {
            if (elements.key == returnData.key) {
              returnData.disabled = true;
            }
          });
          return returnData;
        });
        console.log(newKeyOption, 'newKeyOption3');
        setKeyOption(newKeyOption);
        return {
          ...element,
          updateFields: arrs
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 更新字段
  const keyChange = (e, item) => {
    console.log(e, 'eeeeeeeee');
    console.log(item, 'itemitem');
    console.log(keyOption, '筛选条件 简单模式');
    console.log(fieldData, '11111');
    console.log(serviceList, 'serviceList');
    // let data = Object.assign({}, e);
    // item.key = e;
    let itemKey = {};
    keyOption.forEach(ikn => {
      if (ikn.key == e) {
        console.log(ikn, 'ikn');
        itemKey = {...ikn};
      }
    });
    console.log(itemKey,'itemKey')
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        let asd = [];
        let asds = [];
        if (element.updateFields) {
          asd = element.updateFields.map(res => {
            if (res.id == item.id) {
              return {
                ...res,
                ...itemKey,
                name: itemKey.name,
                label: itemKey.label,
                type: itemKey.types ? itemKey.types : itemKey.type,
                formula: null
              };
            } else {
              return res;
            }
          });
          asds = element.updateFields.map(res => {
            if (res.id == item.id) {
              return {
                ...res,
                ...itemKey,
                name: itemKey.name,
                key:
                    'relationKey' in itemKey
                        ? itemKey.key
                        : itemKey.relationKey
                        ? itemKey.relationKey + '.' + itemKey.name
                        : itemKey.key.includes('.')
                        ? itemKey.key
                        : itemKey.key,
                label: itemKey.label,
                type: itemKey.types ? itemKey.types : itemKey.type,
                formula: null
              };
            } else {
              return res;
            }
          });
        }
        console.log(asd,'asdasdasdasdasdasdasdasdasdasdasdasd')
        console.log(asds,'asds')
        setFieldData(asds);
        setShowFuncTion(false);
        setTimeout(() => {
          setShowFuncTion(true);
        }, 10);
        let newKeyOption = keyOption.map(skjwd => {
          let returnData = {...skjwd, disabled: false};
          asds.forEach(elements => {
            if (elements.key == returnData.key) {
              returnData.disabled = true;
            }
          });
          return returnData;
        });
        console.log(newKeyOption, 'newKeyOption4');
        setKeyOption(newKeyOption);
        return {
          ...element,
          updateFields: asd
        };
      } else {
        return element;
      }
    });
    console.log(arr, '类型选择数据');
    dispatch(handleServiceRaskList(arr));
  };
  // 是否追加数据 数据变化
  const createRelationRecordChange = e => {
    console.log(e, 'eeeeeeeeeeeeeeee');
    setCreateCheck(e);
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          createRelationRecord: e
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 高级设置 条件个数
  function filterFieldsValue() {
    console.log(
      JSON.stringify(businessObject.filterCondition) === '{}',
      "JSON.stringify(needValue.filterCondition) === '{}'"
    );
    console.log(modelFilterFields, 'modelFilterFields');
    console.log(businessObject.filterCondition, 'needValue.filterCondition');
    console.log(serviceList, 'serviceList');
    let haveData = 0;
    let haveData1 = false;
    let haveData2 = false;
    serviceList.forEach(element => {
      if (element.serviceTaskId == businessObject.id) {
        console.log(element, 'element');
        if (JSON.stringify(element.filterCondition) === '{}') {
          haveData1 = true;
        } else {
          if (element.filterCondition.length == 0) {
            haveData2 = true;
          } else {
            haveData = element.filterCondition
              ? element.filterCondition.children
                ? element.filterCondition.children.length
                : 0
              : 0;
          }
        }
      }
    });
    if (haveData1) {
      return '0个条件';
    } else if (haveData2) {
      return '0个条件';
    } else if (haveData > 0) {
      return haveData + '个条件';
    }
  }
  const forMuFunction = (node, e, data) => {
    console.log(node, '原数据');
    console.log(e, 'eeeeeee');
    console.log(fieldData, 'fieldData');
    let a = filteredDatas(e, [...data, ...filterData],node);
    a = {
      ...a,
      formulaEchoVal: false,
      value: node?.formula,
      placeholder:
        node.relationKey != null && node.isPrimaryKey
          ? '不填写时系统自动生成'
          : node.isPrimaryKey
          ? '新增成功后系统自动生成'
          : '',
      onChange: function (e) {
        console.log(e, 'e');
        console.log(node, 'node');
        console.log(fieldData, 'fieldData');
        let arrs = fieldData.map(skjw => {
          if (skjw.id == node.id) {
            return {
              ...skjw,
              formula: e
                ? e.filename
                  ? {...e, name: e.filename, state: 'uploaded'}
                  : e
                : e,
              name: skjw.key
            };
          } else {
            return skjw;
          }
        });
        console.log('方法发发发发发发发发')
        let arrss = fieldData.map(skjw => {
          if (skjw.id == node.id) {
            return {
              ...skjw,
              formula: e
                ? e.filename
                  ? {...e, name: e.filename, state: 'uploaded'}
                  : e
                : e,
              name: skjw.key
            };
          } else {
            return skjw;
          }
        });
        setFieldData(arrss);
        let data = serviceList.map(element => {
          if (element.serviceTaskId == businessObject.id) {
            return {
              ...element,
              updateFields: arrs
            };
          } else {
            return element;
          }
        });
        dispatch(handleServiceRaskList(data));
      }
    };
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
      console.log(a, '11111');
      return amisRender(
        getSchemaTpl('formulaControl', a),
        {advancedFeature: advancedFeature},
        {
          fetcher: service,
          theme: amisEnv.theme
        }
      );
    } else {
      console.log(a, '222222');
      if (
        e == 'text' ||
        e == 'textarea' ||
        e == 'rich-text' ||
        e == 'password' ||
        e == 'ciphertext' ||
        e == 'json'
      ) {
        return amisRender(
          getSchemaTpl('tplFormulaControl', a),
          {advancedFeature: advancedFeature},
          {
            fetcher: service,
            theme: amisEnv.theme
          }
        );
      } else {
        if(node.type === "time" || node.type === "datetime"){
          const formatString = getFormatStringByPrecision(node.type === "datetime"
            ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss', node.showPrecision > 3 ? 3 : node.showPrecision,node.precisionCompatible);
          a.valueType.format = formatString
          a.valueType.valueFormat = formatString
          a.valueType.inputFormat = formatString
          a.valueType.displayFormat = formatString
        }
        console.log(a,'进入数据变化字段 ')
        if(node.showPrecision > 3 && !node.precisionCompatible){
          a = {
            "variables": a.variables,
            "placeholder": a.placeholder,
            "onDisabled": false,
            "formulaEchoVal": false,
            "valueType": {
              "placeholder": ""
            },
            "value": a.value,
            onChange:a.onChange
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
  return (
    <>
      <Form
        name="basic"
        labelCol={{span: 4}}
        wrapperCol={{span: 18}}
        style={{maxWidth: 600}}
        labelWrap
        initialValues={{remember: true}}
        form={form}
        autoComplete="off"
      >
        {nodeValue.taskType == 2 && (
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
                !tenantFlagRecord && (
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
            {objectKey && objectKey.length > 0 && (
              <>
                <div style={{backgroundColor: '#F2F2F4', padding: '10px'}}>
                  筛选条件
                </div>
                <Form.Item<FieldType> label="类型选择" name="conditionMode">
                  <Radio.Group onChange={radioChange} value={radioValue}>
                    <Radio value={1}>普通模式</Radio>
                    <Radio value={2}>高级模式</Radio>
                  </Radio.Group>
                </Form.Item>
                {radioValue == 1 && (
                  <Form.Item<FieldType> label="" name="filterCondition">
                    {/* <ConditionBuilder
                      builderMode={'simple'}
                      draggable={false}
                      fields={updateFieldsOption} // 数据
                      onChange={objectKeyChange}
                      value={filterFields}
                      formula={{
                        title: ' ',
                        allowInput: true,
                        mixedMode: true,
                        // inputSettings:{type: res?.type},
                        variables: formuVariables,
                        inputSettings: {type: 'boolean'},
                        mode: 'input-group',
                        placeholder: '请配置目标值'
                      }}
                    /> */}
                    {isSHow && (
                      <>
                        {amisRender({
                          type: 'service',
                          dataProvider: (data, setData) => {
                            console.log(data, 'datad');
                            console.log(filterFields, 'filterFields');
                            setData(filterFields);
                          },
                          body: [
                            {
                              type: 'condition-builder',
                              label: '',
                              name: 'filterCondition',
                              fields: updateFieldsOption,
                              // value: filterFields,
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
                )}
                {radioValue == 2 && (
                  <Form.Item<FieldType> label="条件个数" name="filterCondition">
                    <Input
                      value={
                        JSON.stringify(modelFilterFieldsData.current) == '{}'
                          ? '0个条件'
                          : modelFilterFieldsData.current?.children
                          ? modelFilterFieldsData.current?.children.length +
                            '个条件'
                          : modelFilterFieldsData.current
                          ? modelFilterFields.length + '个条件'
                          : '0个条件'
                      }
                      // value={filterFieldsValue()}
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
                      destroyOnHidden
                    >
                      <Form.Item<FieldType> label="" name="filterCondition">
                      {isSHows && (
                        <>
                          {amisRender({
                            type: 'service',
                            dataProvider: (data, setData) => {
                              setData(modelFilterFieldsData.current);
                            },
                            body: [
                              {
                                type: 'condition-builder',
                                label: '',
                                name: 'filterCondition',
                                fields: updateFieldsOption,
                                value: modelFilterFieldsData.current,
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
                      {/* <ConditionBuilder
                        draggable={false}
                        fields={updateFieldsOption} // 数据
                        onChange={objectKeyModelChange}
                        value={modelFilterFields}
                        formula={{
                          title: ' ',
                          allowInput: true,
                          mixedMode: true,
                          variables: formuVariables,
                          inputSettings: {type: 'boolean'},
                          mode: 'input-group',
                          placeholder: '请配置目标值'
                        }}
                      /> */}
                    </Modal>
                  </Form.Item>
                )}
                <div
                  style={{
                    backgroundColor: '#F2F2F4',
                    padding: '10px',
                    marginBottom: '10px'
                  }}
                >
                  更新字段
                </div>
                {fieldData && (
                  <>
                    {fieldData.length == 0 && (
                      <div style={{marginLeft: '20px'}}>{'<空>'}</div>
                    )}
                    {fieldData.length > 0 &&
                      fieldData.map((res,index) => {
                        return (
                          <Form.Item<FieldType> key={index} style={{marginLeft: '20px'}}>
                            <Row gutter={10}>
                              <Col span={10}>
                                <Select
                                  value={res?.key}
                                  placeholder="请选择"
                                  onChange={e => keyChange(e, res)}
                                >
                                  {keyOption?.map((res, index) => {
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
                              {showFuncTion && (
                                <Col span={11}>
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
                                  onChange={e => formulaChange(e, res)}
                                /> */}
                                  {res?.type
                                    ? forMuFunction(
                                        res,
                                        res.primaryKeyType?res.primaryKeyType:res?.type,
                                        formuVariables
                                      )
                                    : forMuFunction(
                                        res,
                                        'text',
                                        formuVariables
                                      )}
                                </Col>
                              )}
                              <Col span={1}>
                                <Button
                                  icon={<DeleteFilled />}
                                  onClick={() => deleteClick(res)}
                                />
                              </Col>
                            </Row>
                          </Form.Item>
                        );
                      })}
                    <Row>
                      <Col span={24}>
                        <Button
                          style={{width: '100%', marginTop: '10px'}}
                          onClick={addField}
                        >
                          新增
                        </Button>
                      </Col>
                    </Row>
                  </>
                )}
                <Form.Item<FieldType>
                    style={{marginTop: '20px'}}
                  label={
                    <>
                      <Tooltip title="开启选项，为追加模式，追加数据，否则为更新模式">
                      一对多或多对多关系是否追加数据<QuestionCircleOutlined />
                      </Tooltip>
                    </>
                  }
                  name="createRelationRecord"
                >
                  <div style={{marginLeft: '20px'}}>
                    <Switch
                      onChange={createRelationRecordChange}
                      defaultChecked
                      checked={createCheck}
                    />
                  </div>
                </Form.Item>
              </>
            )}
          </>
        )}
      </Form>
    </>
  );
});
export default UpdateRecrd;
