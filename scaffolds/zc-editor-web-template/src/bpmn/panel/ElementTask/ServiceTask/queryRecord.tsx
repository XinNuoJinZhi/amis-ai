import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';
import {EllipsisOutlined, DeleteFilled} from '@ant-design/icons';
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
  Tree,
  message,
  InputNumber,
  Spin
} from 'antd';
import {
  ArrayInput,
  Controller,
  InputBox,
  ConditionBuilder,
  Combo,
  FormulaPicker
} from 'amis-ui';
import {handleServiceRaskList} from '@/redux/slice/bpmnSlice';
import {useAppDispatch, useAppSelector} from '@/redux/hook/hooks';
import {getTableData} from '@/api/entitymanage';
import {render as amisRender} from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import {service} from '@/utils/request';
import {filteredData, getOptionAll} from './conditionBuilder';
import {getEntityShareList} from '@/api/bpmn';
import {getNoLoopRelation} from '@/bpmn/panel/ElementTask/ServiceTask/config';
import {filterData, filteredDatas} from '@/bpmn/panel/ElementTask/ServiceTask/getSchemaChange';
import {getSchemaTpl} from 'amis-editor';
import {transformSelectAnyIn,reverseTransformSelectAnyIn} from './config'
import {getFormatStringByPrecision} from '@/utils';
import {advancedFeature} from '@/utils/env'

// 查询记录组件
const QueryRecord = forwardRef(function QueryRecord(props, ref) {
  const entityList = useAppSelector(state => state.bpmn.entityList);
  console.log(props, '查询记录组件props');
  const {businessObject, cascaderValue} = props;
  const serviceList = useAppSelector(state => state.bpmn.serviceRaskList);
  const dispatch = useAppDispatch();
  const [form] = Form.useForm<{}>();
  const [nodeValue, setNodeValue] = useState({});
  const [showObject, setShowObject] = useState(false);
  const [isUseEff, setIsUseEff] = useState(false); // 是否初始化
  const [isShow, setIsShow] = useState(true);
  const [isShows, setIsShows] = useState(true);
  // 是否忽略租户开关
  const [tenantFlagRecord, setTenantFlagRecord] = useState<any>(false);
  // 是否忽略租户输入框
  const [appTenantCodeValue, setAppTenantCodeValue] = useState<any>('');
  useEffect(() => {
    setShowObject(false);
    setIsUseEff(true);
    console.log(serviceList, 'serviceListserviceList');
    console.log(cascaderValue, 'cascaderValuecascaderValue');
    setFormuVariables(props.formuVariables);
    getOptionAll(entityList)
    if (serviceList) {
      serviceList.forEach(element => {
        if (
          element.serviceTaskId == props.businessObject.id ||
          element.id == businessObject.id
        ) {
          console.log(element, '选择的节点');
          console.log(typeof cascaderValue, 'typeof cascaderValue');
          // 确定哪个节点
          let arrs = [];
          if (typeof cascaderValue == 'object' && cascaderValue.options) {
            cascaderValue.options.forEach(res => {
              res.children.forEach(item => {
                if (item.value == element.modelEventTarget) {
                  setKeyOption([...item.form.fields]);
                  let arrArr = [
                    ...item.form?.fields,
                    ...item.form?.relationFields
                  ];
                  let arrArrs = [];
                  arrArr.forEach(ikj => {
                    if (
                      ikj.type != 'relation' &&
                      !ikj.isDeleteUser &&
                      !ikj.isDeleteDate  &&
                        // !ikj.isCreateDate &&
                        // !ikj.isUpdateDate &&
                        // !ikj.isUpdateUser &&
                        !ikj.isDeleteFlag
                        // !ikj.isCreateUser &&
                        // !ikj.isTenantCode
                    ) {
                      if (
                        item.label.includes('【') &&
                        item.relationKey &&
                        item.relationKey != ''
                      ) {
                        arrArrs.push({
                          ...item,
                          key: item.relationKey + '.' + item.key,
                          value: ikj.relationKey + '.' + ikj.key
                        });
                      } else {
                        arrArrs.push({...item, key: item.key});
                      }
                    }
                  });
                  arrs = builderChange(arrArrs);
                  console.log(arrArrs, 'arrArrs');
                  setQueryOptions(arrArrs);
                  let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                  let asdArr = item.form.fields.filter(ikj => {
                    if (
                      ikj.type != 'relation' &&
                      ikj.type != 'formula' &&
                      !ikj.isDeleteUser &&
                      !ikj.isDeleteDate &&
                        !ikj.isCreateDate &&
                        !ikj.isUpdateDate &&
                        !ikj.isUpdateUser &&
                        !ikj.isDeleteFlag &&
                        !ikj.isCreateUser &&
                        !ikj.isTenantCode
                    ) {
                      return ikj;
                    }
                  });
                  asdArr = asdArr.map(swop=>{
                    if(swop.isTreeParent) {
                      return {...swop,
                        primaryKeyType: primaryKeyData[0].type}
                    }else{
                      return swop
                    }
                  })
                  console.log(asdArr, 'asdArr');
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
                  setUpdateFieldsOption(asd.map(res=>{
                    let rertun = {...res}
                    if(res.yuanType == 'time' || res.yuanType == 'datetime'){
                      const formatString = getFormatStringByPrecision(
                        res.yuanType == 'datetime' ?
                          'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss', rertun.showPrecision > 3 ? 3 : rertun.showPrecision, rertun.precisionCompatible);
                      rertun.value.valueType.format = formatString
                      rertun.value.valueType.valueFormat = formatString
                      rertun.value.valueType.inputFormat = formatString
                      rertun.value.valueType.displayFormat = formatString
                    }
                    return rertun
                  }));
                  setDataOptions([...item.form.fields]);
                  console.log(element, 'ssssssssssssssssssssssssssss');
                }
              });
            });
          }
          setNodeValue(element);
          setTimeout(() => {
            let ars = [];
            console.log(arrs, 'arrs');
            console.log(element.columnInfo, 'element.columnInfo');
            console.log(typeof element.columnInfo, 'typeof element.columnInfo');
            if (element.columnInfo && element.columnInfo.length > 0) {
              if (typeof element.columnInfo == 'string') {
                let sef = JSON.parse(element.columnInfo);
                arrs.forEach(sa => {
                  sef.forEach(des => {
                    if (des.includes('.')) {
                      let top = des.split('.')[0];
                      let last = des.split('.')[1];
                      console.log(sa, 'sa');
                      console.log(top, 'top');
                      console.log(last, 'last');
                      if (last == sa.name && sa.label.includes(top)) {
                        ars.push(sa.label);
                      }
                    } else {
                      if (des == sa.name) {
                        ars.push(sa.label);
                      }
                    }
                  });
                });
                console.log(ars, 'ars');
                setQueryFieldsValue(ars);
                form.setFieldsValue({
                  columnInfo: ars
                });
              } else {
                arrs.forEach(sa => {
                  element.columnInfo.forEach(des => {
                    if (des.includes('.')) {
                      let top = des.split('.')[0];
                      let last = des.split('.')[1];
                      console.log(sa, 'sa');
                      console.log(top, 'top');
                      console.log(last, 'last');
                      if (last == sa.name && sa.label.includes(top)) {
                        ars.push(sa.label);
                      }
                    } else {
                      if (des == sa.name) {
                        ars.push(sa.label);
                      }
                    }
                  });
                });
                console.log(ars, 'ars');
                setQueryFieldsValue(ars);
                form.setFieldsValue({
                  columnInfo: ars
                });
              }
            }
            console.log('进入');
            setShowObject(true);
          }, 100);
          setObjectKey(element.modelEventTarget);
          console.log(element, 'element');
          console.log(element.queryRecords, 'element.queryRecords');
          if (element.queryRecords == null) {
            setRadioData(1); // 赋值查询记录
          } else {
            setRadioData(element.queryRecords); // 赋值查询记录
          }
          setFilterModeData(element.conditionMode); // 类型选择
          if (element.conditionMode == 2) {
            let needArr = {};
            if (element.filterCondition) {
              if (typeof element.filterCondition == 'string') {
                let a = JSON.parse(element.filterCondition);
                needArr = JSON.parse(JSON.stringify(a));
              } else {
                let a = element.filterCondition;
                needArr = JSON.parse(JSON.stringify(a));
              }
              setModelFilterFields(needArr);
              modelFilterFieldsData.current = needArr;
            }
          } else {
            if (typeof element.filterCondition == 'string') {
              setFilterFields(JSON.parse(element.filterCondition));
              setIsShow(false);
              setTimeout(() => {
                setIsShow(true);
              }, 100);
            } else {
              setFilterFields(element.filterCondition);
              setIsShow(false);
              setTimeout(() => {
                setIsShow(true);
              }, 100);
            }
          }
          setParamValue(element.queryRecordsOutputParameterName);
          let order = {};
          if (element.sortingSettings != null && element.modelEventTarget) {
            if (typeof element.sortingSettings == 'string') {
              order.orderBy = JSON.parse(element.sortingSettings).orderBy;
              order.orderType = JSON.parse(element.sortingSettings).orderType;
            } else {
              order.orderBy = element.orderBy;
              order.orderType = element.orderType;
            }
          }
          if (element.orderBy) {
            order.orderBy = element.orderBy;
          }
          if (element.orderType) {
            order.orderType = element.orderType;
          }
          console.log(element.maxCount, 'element.maxCount');
          if ('maxCount' in element) {
            order.maxCount = element.maxCount;
            order.page = element.page;
            order.perPage = element.perPage;
            order.skip = element.skip;
          } else if (element.pagingSettings != null) {
            if (typeof element.pagingSettings == 'string') {
              order.maxCount = JSON.parse(element.pagingSettings).maxCount;
              order.page = JSON.parse(element.pagingSettings).page;
              order.perPage = JSON.parse(element.pagingSettings).perPage;
              order.skip = JSON.parse(element.pagingSettings).skip;
            } else {
              order.maxCount = element.maxCount;
              order.page = element.page;
              order.perPage = element.perPage;
              order.skip = element.skip;
            }
          }
          // setMaxCountValue(order.maxCount);
          //   setPageValue(order.page);
          //   setPerPageValue(order.perPage);
          //   setSkipValue(order.skip);
          console.log(order, 'order');
          form.setFieldsValue({
            conditionMode: element.conditionMode,
            filterCondition:
              typeof element.filterCondition == 'string'
                ? JSON.parse(element.filterCondition)
                : element.filterCondition,
            queryRecordsOutputParameterName:
              element.queryRecordsOutputParameterName,
            queryRecords:
              element.queryRecords == null ? 1 : element.queryRecords,
            // queryFields: element.queryFields,
            // columnInfo: element.columnInfo,
            orderBy: order.orderBy,
            orderType: order.orderType,
            maxCount: order.maxCount,
            page: order.page,
            perPage: order.perPage,
            skip: order.skip
          });
        }
      });
    } else {
      setShowObject(true);
      setNodeValue({
        taskType: 4
      });
    }
  }, [businessObject.id]);
  const {Search} = Input;

  // 查询服务对象
  const [objectKey, setObjectKey] = useState('');
  const [keyOption, setKeyOption] = useState([]); // 筛选条件key值数组

  // 数据源数据
  const [objectData, setObjectData] = useState([]);
  // 节点出参弹出层显示隐藏
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  // 高级设置弹出层显示隐藏
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 排序设置 排序规则
  const [orderModeData, setOrderModeData] = useState('fixed');
  // 排序设置 排列规则 动态排序
  const [formulaData, setFormulaData] = useState('');
  // 分页设置 起始偏移量
  const [skipData, setSkipData] = useState('');
  // 分页设置 每页数量
  const [perPageData, setPerPageData] = useState('');
  // 分页设置 查询页
  const [pageData, setPageData] = useState('');
  // 分页设置 记录总行数
  const [maxCountData, setMaxCountData] = useState('');
  // 查询记录
  const [radioData, setRadioData] = useState(1);
  // 查询条件列表
  const [fieldData, setFieldData] = useState([]);
  // const fieldData = useRef([]);
  // 弹框
  const [addModalOpen, setAddModalOpen] = useState(false);
  // 弹框
  const [addsModalOpen, setAddsModalOpen] = useState(false);
  // 筛选条件 类型选择数据
  const [filterModeData, setFilterModeData] = useState(1);
  // 过滤器 更新字段数据
  const [updateFieldsOption, setUpdateFieldsOption] = useState([]);
  // 排序字段
  const [dataOptions, setDataOptions] = useState([]);
  // 查询字段
  const [queryOptions, setQueryOptions] = useState([]);
  // 公式数据
  // const formuVariables = useAppSelector(
  //   state => state.antvModule.formuVariables
  // );
  // 上下问数据
  const [formuVariables, setFormuVariables] = useState([]);
  // 排序设置 固定排序列表
  const [orderParamsData, setOrderParamsData] = useState([]);
  // 查询字段数据
  const [queryFieldsValue, setQueryFieldsValue] = useState([]);
  // 最大查询数量
  const [maxCountValue, setMaxCountValue] = useState([]);
  // 查询页
  const [pageValue, setPageValue] = useState([]);
  // 每页记录数量
  const [perPageValue, setPerPageValue] = useState([]);
  // 偏移量
  const [skipValue, setSkipValue] = useState([]);
  // 查询字段数据变化
  const selectChange = (e, item) => {
    console.log(e, '源格式下拉转换eeeeeeee');
    console.log(item, 'item');
    setQueryFieldsValue(e);

    console.log(queryOptions, 'queryOptionsqueryOptions');
    let itemKey: any = [];
    queryOptions.forEach(ikn => {
      e.forEach(element => {
        if (ikn.key == element) {
          console.log(ikn, 'ikn');
          itemKey.push(ikn.key);
        }
      });
    });

    console.log(itemKey, 'itemKeyitemKey');
    let arrs = serviceList.map(element => {
      if (element.serviceTaskId == props.businessObject.id) {
        return {
          ...element,
          columnInfo: itemKey
          // queryFields: e
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arrs));
  };
  const orderByChange = (e, item) => {
    setQueryFieldsValue(e);
    let arrs = serviceList.map(element => {
      if (element.serviceTaskId == props.businessObject.id) {
        return {
          ...element,
          orderBy: e
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arrs));
  };
  // 顺序设置数据变化
  const orderTypeChange = (e, item) => {
    setQueryFieldsValue(e);
    let arrs = serviceList.map(element => {
      if (element.serviceTaskId == props.businessObject.id) {
        return {
          ...element,
          orderType: e
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arrs));
  };
  // 字段赋值 选择字段 树形控件 默认值
  const [modelCheckedKeys, setModelCheckedKeys] = useState([]);
  // 筛选条件 简单类型列表数据
  const [filterFields, setFilterFields] = useState({});
  // 筛选条件 复杂类型弹框数据
  const [modelFilterFields, setModelFilterFields] = useState({});
  const modelFilterFieldsData = useRef({});
  // 参数名称数据
  const [paramValue, setParamValue] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  // 查询对象
  let val = ''
  if(nodeValue?.apiShareConfig && typeof (nodeValue?.apiShareConfig) == 'string') {
    val = JSON.parse(nodeValue?.apiShareConfig).targetAppId + '&' + nodeValue.modelEventTarget
  } else if (nodeValue?.apiShareConfig && Object.keys(nodeValue?.apiShareConfig).length) {
    val = (nodeValue?.apiShareConfig).targetAppId + '&' + nodeValue.modelEventTarget
  } else {
    val = nodeValue.modelEventTarget
  }
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
              value: val
            }
          }
        ]
      }
    },
    body: {
      type: 'form',
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
          label: '查询对象:',
          options: cascaderValue?.options,
          value: val
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
                console.log(radioData, 'radioDataradioDataradioDataradioData');
                console.log(cascaderValue, '查询对象cascaderValue');
                setShowLoading(true)
                setObjectKey(event.data.nestedSelect);
                setModelFilterFields({});
                setFilterFields({});
                setIsShow(false);
                setTimeout(() => {
                  setIsShow(true);
                }, 100);
                let haveDataArr = false;
                  entityList.data.options.forEach(res => {
                    res.children.forEach(items => {
                      if (items.value == event.data.nestedSelect) {
                        haveDataArr = true
                        let arrArr = [];
                        if (items.form.fields != null) {
                           arrArr.push(...items.form.fields);
                        }
                        if (items.form.relationFields != null) {
                          arrArr.push(...items.form.relationFields);
                        }
                        // let objectArr:any = [res.value,items.value]
                        // let lastAllDatas = getNoLoopRelation(arrArr,items.form.originRelation,item.data.data.options,objectArr)
                        // console.log(lastAllDatas,'lastAllDatas')
                        // arrArr = lastAllDatas
                        console.log(arrArr, 'arrArrarrArrarrArrarrArrarrArr');
                        let arrArrs = [];
                        arrArr.forEach(ikj => {
                          if (
                            ikj.type != 'relation' &&
                            !ikj.isDeleteUser &&
                            !ikj.isDeleteDate &&
                              // !ikj.isCreateDate &&
                              // !ikj.isUpdateDate &&
                              // !ikj.isUpdateUser &&
                              !ikj.isDeleteFlag
                              // !ikj.isCreateUser &&
                              // !ikj.isTenantCode
                          ) {
                            // return ikj;
                            if (
                              ikj.label.includes('【') &&
                              ikj.relationKey &&
                              ikj.relationKey != ''
                            ) {
                              arrArrs.push({
                                ...ikj,
                                key: ikj.relationKey + '.' + ikj.key,
                                value: ikj.relationKey + '.' + ikj.key
                              });
                            } else {
                              arrArrs.push({...ikj, key: ikj.key});
                            }
                          }
                        });
                        console.log(arrArrs, 'arrArrs');
                        let arrs = builderChange(arrArrs);
                        if (serviceList) {
                          serviceList.forEach(element => {
                            if (
                              element.serviceTaskId ==
                                props.businessObject.id ||
                              element.id == businessObject.id
                            ) {
                              setTimeout(() => {
                                let ars = [];
                                console.log(arrs, 'arrs');
                                if (
                                  element.columnInfo &&
                                  element.columnInfo.length > 0
                                ) {
                                  if (typeof element.columnInfo == 'string') {
                                    let sef = JSON.parse(element.columnInfo);
                                    ars = sef;
                                    console.log(ars, 'ars');
                                    if (isUseEff) {
                                      setQueryFieldsValue(ars);
                                      form.setFieldsValue({
                                        columnInfo: ars
                                      });
                                    }
                                  } else {
                                    ars =
                                      typeof element.columnInfo == 'string'
                                        ? JSON.parse(element.columnInfo)
                                        : element.columnInfo;
                                    console.log(ars, 'ars');
                                    if (isUseEff) {
                                      setQueryFieldsValue(ars);
                                      form.setFieldsValue({
                                        columnInfo: ars
                                      });
                                    }
                                  }
                                }
                                console.log('进入');
                                setShowObject(true);
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
                              }, 100);
                            }
                          });
                        }
                        console.log(arrs, 'arrs');
                        setQueryOptions(arrArrs);
                        setKeyOption([...items.form.fields]);
                        setDataOptions([...items.form.fields]);
                        console.log(items.form.fields, 'items.form.fields');
                        let primaryKeyData = items.form.fields.filter(sso=> sso.isPrimaryKey)
                        let asdArr = items.form.fields.filter(ikjs => {
                          if (
                            ikjs.type != 'relation' &&
                            ikjs.type != 'formula' &&
                            !ikjs.isDeleteUser &&
                            !ikjs.isDeleteDate &&
                              !ikjs.isCreateDate &&
                              !ikjs.isUpdateDate &&
                              !ikjs.isUpdateUser &&
                              !ikjs.isDeleteFlag &&
                              !ikjs.isCreateUser &&
                              !ikjs.isTenantCode
                          ) {
                            return ikjs;
                          }
                        });
                        asdArr = asdArr.map(swop=>{
                          if(swop.isTreeParent) {
                            return {...swop,
                              primaryKeyType: primaryKeyData[0].type}
                          }else{
                            return swop
                          }
                        })
                        console.log(asdArr, 'asdArr1');
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
                        console.log(
                          serviceList,
                          'serviceListserviceListserviceListserviceList'
                        );
                        console.log(isUseEff, 'isUseEff');
                        let arr = serviceList.map(element => {
                          if (
                            element.serviceTaskId == props.businessObject.id
                          ) {
                            if (!isUseEff) {
                              setFilterFields({});
                              setModelFilterFields({});
                              modelFilterFieldsData.current = {};
                              setIsShow(false);
                              setTimeout(() => {
                                setIsShow(true);
                              }, 100);
                              form.setFieldsValue({
                                conditionMode: 1,
                                filterCondition:[]
                              });
                              setRadioData(1);
                              form.setFieldsValue({
                                queryRecords: 1
                              });
                              return {
                                taskType: element.taskType,
                                modelEventTarget: event.data.nestedSelect,
                                serviceTaskId: element.serviceTaskId,
                                columnInfo: [],
                                queryRecords: 1,
                                conditionMode: 1,
                                filterCondition:[],
                                queryRecordsOutputParameterName:
                                  element.queryRecordsOutputParameterName,
                                taskName: element.taskName,
                                fields: items.form.fields,
                                relationFields: items.form.relationFields,
                                originRelation: items.form.originRelation
                              };
                            } else {
                              console.log(';进图');
                              if (element.conditionMode == 1) {
                                if (element.filterCondition) {
                                  let aaa = JSON.parse(JSON.stringify(typeof element.filterCondition == 'string' ? JSON.parse(element.filterCondition) : element.filterCondition));
                                  aaa = reverseTransformSelectAnyIn(aaa)
                                  console.log(aaa,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                                  setFilterFields(aaa);
                                  form.setFieldValue('filterCondition', aaa);
                                }
                              } else {
                                console.log('进入2');
                                let needArr = {};
                                if (element.filterCondition) {
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
                              return {
                                ...element,
                                modelEventTarget: event.data.nestedSelect,
                                fields: items.form.fields,
                                relationFields: items.form.relationFields,
                                originRelation: items.form.originRelation,
                                initFields: [],
                                queryRecords: element.queryRecords
                                  ? element.queryRecords
                                  : 1
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
                  getEntityShareList().then(shareRes => {
                    setShowLoading(false)
                    shareRes.data.data.forEach(res => {
                      res.sourceType == 'apiShare' && res.children.forEach(child => {
                        child.children.forEach(subChild=>{
                          subChild.children.forEach(items=>{
                            if (items.appId + '&' +items.value == event.data.nestedSelect) {
                              haveDataArr = true
                              let arrArr = [];
                              if (items.form.fields != null) {
                                arrArr.push(...items.form.fields);
                              }
                              if (items.form.relationFields != null) {
                                arrArr.push(...items.form.relationFields);
                              }
                              // let objectArr:any = [res.value,items.value]
                              // let lastAllDatas = getNoLoopRelation(arrArr,items.form.originRelation,item.data.data.options,objectArr)
                              // console.log(lastAllDatas,'lastAllDatas')
                              // arrArr = lastAllDatas
                              console.log(arrArr, 'arrArrarrArrarrArrarrArrarrArr');
                              let arrArrs = [];
                              arrArr.forEach(ikj => {
                                if (
                                  ikj.type != 'relation' &&
                                  !ikj.isDeleteUser &&
                                  !ikj.isDeleteDate &&
                                    !ikj.isCreateDate &&
                                    !ikj.isUpdateDate &&
                                    !ikj.isUpdateUser &&
                                    !ikj.isDeleteFlag &&
                                    !ikj.isCreateUser &&
                                    !ikj.isTenantCode
                                ) {
                                  // return ikj;
                                  if (
                                    ikj.label.includes('【') &&
                                    ikj.relationKey &&
                                    ikj.relationKey != ''
                                  ) {
                                    arrArrs.push({
                                      ...ikj,
                                      key: ikj.relationKey + '.' + ikj.key,
                                      value: ikj.relationKey + '.' + ikj.key
                                    });
                                  } else {
                                    arrArrs.push({...ikj, key: ikj.key});
                                  }
                                }
                              });
                              console.log(arrArrs, 'arrArrs');
                              let arrs = builderChange(arrArrs);
                              if (serviceList) {
                                serviceList.forEach(element => {
                                  if (
                                    element.serviceTaskId ==
                                      props.businessObject.id ||
                                    element.id == businessObject.id
                                  ) {
                                    setTimeout(() => {
                                      let ars = [];
                                      console.log(arrs, 'arrs');
                                      if (
                                        element.columnInfo &&
                                        element.columnInfo.length > 0
                                      ) {
                                        if (typeof element.columnInfo == 'string') {
                                          let sef = JSON.parse(element.columnInfo);
                                          ars = sef;
                                          console.log(ars, 'ars');
                                          if (isUseEff) {
                                            setQueryFieldsValue(ars);
                                            form.setFieldsValue({
                                              columnInfo: ars
                                            });
                                          }
                                        } else {
                                          ars =
                                            typeof element.columnInfo == 'string'
                                              ? JSON.parse(element.columnInfo)
                                              : element.columnInfo;
                                          console.log(ars, 'ars');
                                          if (isUseEff) {
                                            setQueryFieldsValue(ars);
                                            form.setFieldsValue({
                                              columnInfo: ars
                                            });
                                          }
                                        }
                                      }
                                      console.log('进入');
                                      setShowObject(true);
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
                                    }, 100);
                                  }
                                });
                              }
                              console.log(arrs, 'arrs');
                              setQueryOptions(arrArrs);
                              setKeyOption([...items.form.fields]);
                              setDataOptions([...items.form.fields]);
                              console.log(items.form.fields, 'items.form.fields');
                              let primaryKeyData = items.form.fields.filter(sso=> sso.isPrimaryKey)
                              let asdArr = items.form.fields.filter(ikjs => {
                                if (
                                  ikjs.type != 'relation' &&
                                  ikjs.type != 'formula' &&
                                  !ikjs.isDeleteUser &&
                                  !ikjs.isDeleteDate &&
                                    !ikjs.isCreateDate &&
                                    !ikjs.isUpdateDate &&
                                    !ikjs.isUpdateUser &&
                                    !ikjs.isDeleteFlag &&
                                    !ikjs.isCreateUser &&
                                    !ikjs.isTenantCode
                                ) {
                                  return ikjs;
                                }
                              });
                              asdArr = asdArr.map(swop=>{
                                if(swop.isTreeParent) {
                                  return {...swop,
                                    primaryKeyType: primaryKeyData[0].type}
                                }else{
                                  return swop
                                }
                              })
                              console.log(asdArr, 'asdArr1');
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
                              setUpdateFieldsOption(asd);
                              console.log(
                                serviceList,
                                'serviceListserviceListserviceListserviceList'
                              );
                              console.log(isUseEff, 'isUseEff');
                              let apiShareConfig = {}
                              apiShareConfig.targetAppId = items.appId
                              apiShareConfig.targetTenantId = items.tenantId
                              let arr = serviceList.map(element => {
                                if (
                                  element.serviceTaskId == props.businessObject.id
                                ) {
                                  if (!isUseEff) {
                                    setFilterFields({});
                                    setModelFilterFields({});
                                    modelFilterFieldsData.current = {};
                                    setIsShow(false);
                                    setTimeout(() => {
                                      setIsShow(true);
                                    }, 100);
                                    form.setFieldsValue({
                                      conditionMode: 1,
                                      filterCondition:[]
                                    });
                                    setRadioData(1);
                                    form.setFieldsValue({
                                      queryRecords: 1
                                    });
                                    return {
                                      taskType: element.taskType,
                                      modelEventTarget: event.data.nestedSelect.indexOf('&') > -1 ? event.data.nestedSelect.split("&")[1] : event.data.nestedSelect,
                                      apiShareConfig: apiShareConfig,
                                      serviceTaskId: element.serviceTaskId,
                                      columnInfo: [],
                                      filterCondition:[],
                                      queryRecords: 1,
                                      conditionMode: 1,
                                      queryRecordsOutputParameterName:
                                        element.queryRecordsOutputParameterName,
                                      taskName: element.taskName,
                                      fields: items.form.fields,
                                      relationFields: items.form.relationFields,
                                      originRelation: items.form.originRelation
                                    };
                                  } else {
                                    console.log(';进图');
                                    if (element.conditionMode == 1) {
                                      if (element.filterCondition) {
                                        let aaa = JSON.parse(JSON.stringify(typeof element.filterCondition == 'string' ? JSON.parse(element.filterCondition) : element.filterCondition));
                                        aaa = reverseTransformSelectAnyIn(aaa)
                                        console.log(aaa,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                                        setFilterFields(aaa);
                                        form.setFieldValue('filterCondition', aaa);
                                      }
                                    } else {
                                      console.log('进入2');
                                      let needArr = {};
                                      if (element.filterCondition) {
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
                                    return {
                                      ...element,
                                      modelEventTarget: event.data.nestedSelect.indexOf('&') > -1 ? event.data.nestedSelect.split("&")[1] : event.data.nestedSelect,
                                      apiShareConfig: apiShareConfig,
                                      fields: items.form.fields,
                                      relationFields: items.form.relationFields,
                                      originRelation: items.form.originRelation,
                                      initFields: [],
                                      queryRecords: element.queryRecords
                                        ? element.queryRecords
                                        : 1
                                    };
                                  }
                                } else {
                                  return element;
                                }
                              });
                              dispatch(handleServiceRaskList(arr));
                            }
                          })
                        })
                      });
                    });
                  })

                  if (!haveDataArr) {
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
                  if (!isUseEff) {
                    form.setFieldsValue({
                      orderType: [],
                      orderBy: [],
                      columnInfo: []
                    });
                    setQueryFieldsValue([]);
                  }
                console.log(radioData, 'radioDataradioData');
                console.log(radioData == null, 'radioDataradioData');
                console.log(filterModeData, 'filterModeData');
                if (!radioData) {
                  setRadioData(1);
                  form.setFieldsValue({
                    queryRecords: 1
                  });
                  radioChange({target: {value: 1}});
                } else if (radioData == null) {
                  setRadioData(1);
                  form.setFieldsValue({
                    queryRecords: 1
                  });
                  radioChange({target: {value: 1}});
                }
                if (!isUseEff) {
                  setFilterModeData(1);
                }
                if (!filterModeData) {
                  setFilterModeData(1);
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
      let obj = filteredData(e[i]);
      if (obj != undefined) {
        arr.push(obj);
      }
    }
    return arr;
  };
  // 查询记录切换
  const radioChange = e => {
    console.log(e, '新增列表切换');
    setRadioData(e.target.value);
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        if (e.target.value == 1) {
          return {
            ...element,
            queryRecords: e.target.value
          };
        } else {
          form.setFieldsValue({
            maxCount: element.maxCount ? element.maxCount : '50',
            page: element.page ? element.page : '1',
            perPage: element.perPage ? element.perPage : '10',
            skip: element.skip ? element.skip : '0'
          });
          return {
            ...element,
            queryRecords: e.target.value,
            maxCount: element.maxCount ? element.maxCount : '50',
            page: element.page ? element.page : '1',
            perPage: element.perPage ? element.perPage : '10',
            skip: element.skip ? element.skip : '0'
          };
        }
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 筛选条件 类型选择
  const filterModeChange = e => {
    setFilterModeData(e.target.value);
    setFilterFields({});
    setModelFilterFields({});
    modelFilterFieldsData.current = {};
    setIsShow(false);
    setTimeout(() => {
      setIsShow(true);
    }, 100);
    form.setFieldValue('filterCondition', []);
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          conditionMode: e.target.value,
          filterCondition: []
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
    setIsShows(false);
      form.setFieldsValue({
        filterCondition: JSON.stringify(modelFilterFieldsData.current) === '{}'?{}:reverseTransformSelectAnyIn(modelFilterFieldsData.current)
      });
    setTimeout(() => {
      setIsShows(true);
    }, 100);
  };
  // 高级设置确认
  const handleOk = () => {
    console.log('高级设置确认');
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
    setIsModalOpen(false);
  };
  // 筛选条件 复杂类型
  const objectKeyModelChange = (e) => {
    console.log(e, '弹框数据变化');
    let aa = JSON.parse(JSON.stringify(e))
    let result = reverseTransformSelectAnyIn(aa)
    form.setFieldValue('filterCondition',result)
    modelFilterFieldsData.current = result
    setModelFilterFields(result);
  };
  // 查询条件列表 弹出框 取消
  const addHandleCancel = () => {
    setAddModalOpen(false);
  };
  // 弹出层输入框 数据变化
  const addSearchChange = () => {};
  // 节点标题 数据变化
  const inputChange = e => {
    console.log(e, '节点标题 数据变化');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          title: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 节点出参 数据变化
  const targetNameChange = e => {
    console.log(e, '节点出参 数据变化');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          targetName: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 筛选条件 简单类型数据
  const filterFieldsChange = e => {
    let data = Object.assign({}, e);
    console.log(data, 'data');
    let result = reverseTransformSelectAnyIn(data)
    if (!isUseEff) {
    form.setFieldValue('filterCondition',result)
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
      dispatch(handleServiceRaskList(arr));
    }
  };
  // 筛选条件 复杂模式
  function filterFieldsValue() {
    console.log(
      JSON.stringify(businessObject.filterCondition) === '{}',
      "JSON.stringify(needValue.filterCondition) === '{}'"
    );
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
              ? element.filterCondition.children.length
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
  // 排序设置 动态排序
  const orderParamsChange = e => {
    console.log(e, '排序设置 动态排序');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          orderParams: e
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 分页设置 偏移量
  const skipChange = e => {
    console.log(e, '分页设置 偏移量');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          skip: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 分页设置 每页记录数量
  const perPageChange = e => {
    console.log(e, '分页设置 每页记录数量');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          perPage: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 分页设置 查询页
  const pageChange = e => {
    console.log(e, '分页设置 查询页');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          page: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 分页设置 最大查询数量
  const maxCountChange = e => {
    console.log(e, '分页设置 最大查询数量');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          maxCount: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 输出参数 参数名称数据变化
  const outputParamNameChange = e => {
    console.log(e, '输出参数 参数名称数据变化');
    setParamValue(e.target.value);
    const regex = /^[a-zA-Z_][A-Za-z0-9_]*$/;
    if (!regex.test(e.target.value)) {
      return message.error('请输入规范的参数名称');
    }
    console.log(serviceList, 'serviceList');
    console.log(businessObject, 'businessObject');
    let sameName = false;
    serviceList.forEach(element => {
      if (element.serviceTaskId != businessObject.id) {
        if (
          element.taskType == 4 &&
          element.queryRecordsOutputParameterName != null
        ) {
          if (element.queryRecordsOutputParameterName == e.target.value) {
            setParamValue('');
            sameName = true;
          }
        }
      }
    });
    if (sameName) {
      return alert('参数名称重复');
    }
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          queryRecordsOutputParameterName: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 参数名称数据变化
  const queryChange = e => {
    setParamValue(e.target.value);
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
  return (
    <>
      <Form
        name="basic"
        labelCol={{span: 4}}
        wrapperCol={{span: 18}}
        style={{maxWidth: 600}}
        labelWrap
        form={form}
        autoComplete="off"
      >
        {nodeValue.taskType == 4 && (
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
          </>
        )}
        <Form.Item<FieldType> label="查询记录" name="queryRecords">
          <Radio.Group
            onChange={radioChange}
            defaultValue={radioData}
            value={radioData}
          >
            <Radio value={1}>单条记录</Radio>
            <Radio value={2}>多条记录</Radio>
          </Radio.Group>
        </Form.Item>
        {objectKey && objectKey.length > 0 && (
          <>
            <>
              <Form.Item<FieldType> label="类型选择" name="conditionMode">
                <Radio.Group
                  onChange={filterModeChange}
                  defaultValue={filterModeData}
                  value={filterModeData}
                >
                  <Radio value={1}>简单类型</Radio>
                  <Radio value={2}>复杂类型</Radio>
                </Radio.Group>
              </Form.Item>
              {filterModeData == 1 && (
                <Form.Item<FieldType> label="" name="filterCondition">
                  {/* <ConditionBuilder
                    builderMode={'simple'}
                    draggable={false}
                    fields={updateFieldsOption}
                    onChange={filterFieldsChange}
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
                  {isShow && (
                    <>
                      {amisRender({
                        type: 'service',
                        dataProvider: (data, setData) => {
                          console.log(filterFields, 'filterFields');
                          setData(filterFields);
                        },
                        body: [
                          {
                            type: 'condition-builder',
                            label: ' ',
                            name: 'filterCondition',
                            fields: updateFieldsOption,
                            value: filterFields,
                            draggable: false,
                            builderMode: 'simple',
                            onChange: (value: any) => {
                              filterFieldsChange(value);
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
              {filterModeData == 2 && (
                <Form.Item<FieldType> label="条件个数" name="filterCondition">
                  <Input
                    // value={filterFieldsValue()}
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
                    <Form.Item<FieldType> label="" name="filterCondition">
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
                    {/* <ConditionBuilder
                      draggable={false}
                      fields={updateFieldsOption} // 数据
                      onChange={objectKeyModelChange}
                      value={modelFilterFields}
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
                    </Form.Item>
                  </Modal>
                </Form.Item>
              )}
              <Form.Item<FieldType> label="查询字段" name="columnInfo"
                rules={[{required: true, message: '这是必填项'}]}
                >
                <Select
                  placeholder={'请选择'}
                  onChange={(e, data) => selectChange(e, data)}
                  mode="multiple"
                  defaultValue={queryFieldsValue}
                  value={queryFieldsValue}
                >
                  {queryOptions.map((e, index) => {
                    return (
                      <Option key={e.key} label={e.label} value={e.key}>
                        {e.label}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </>
          </>
        )}
        {radioData == 2 && (
          <>
            <Form.Item<FieldType> label="排序字段" name="orderBy">
              <Select
                placeholder={'请选择'}
                onChange={(e, data) => orderByChange(e, data)}
              >
                {dataOptions.map(e => {
                  return (
                    <Option key={e.label} value={e.key}>
                      {e.label}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
            <Form.Item<FieldType> label="顺序设置" name="orderType">
              <Select
                placeholder={'请选择'}
                onChange={orderTypeChange}
                options={[
                  {
                    label: '升序',
                    value: 'ASC'
                  },
                  {
                    label: '降序',
                    value: 'DESC'
                  }
                ]}
              />
            </Form.Item>
            <Form.Item<FieldType> label="最大查询数量" name="maxCount">
              <Input
                type="number"
                min={1}
                onChange={maxCountChange}
                value={maxCountValue}
              />
            </Form.Item>
            <Form.Item<FieldType> label="查询页" name="page">
              <Input
                type="number"
                min={1}
                onChange={pageChange}
                value={pageValue}
              />
            </Form.Item>
            <Form.Item<FieldType> label="每页记录数量" name="perPage">
              <Input
                type="number"
                min={1}
                onChange={perPageChange}
                value={perPageValue}
              />
            </Form.Item>
            <Form.Item<FieldType> label="偏移量" name="skip">
              <Input
                type="number"
                min={0}
                onChange={skipChange}
                value={skipValue}
              />
            </Form.Item>
          </>
        )}
        <Form.Item<FieldType>
          label="参数名称"
          name="queryRecordsOutputParameterName"
          rules={[{required: true, message: '这是必填项'}]}
        >
          <Input
            // onChange={outputParamNameChange}
            onBlur={outputParamNameChange}
            onChange={queryChange}
            value={paramValue}
            defaultValue={paramValue}
          />
          <span style={{color: '#B0B0B0'}}>
            {/* 输出当前记录的ID，方便于流程中的其他节点引用它；可输入中文、数字、字母或者下划线_ */}
            输出当前记录的ID，方便于流程中的其他节点引用它；可输入数字、字母或者下划线_
          </span>
        </Form.Item>
      </Form>
    </>
  );
});
export default QueryRecord;
