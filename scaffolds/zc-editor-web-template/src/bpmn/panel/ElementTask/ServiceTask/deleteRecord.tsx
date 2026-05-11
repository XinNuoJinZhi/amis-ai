import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';
import {EllipsisOutlined} from '@ant-design/icons';
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
  Spin
} from 'antd';
import {useAppDispatch, useAppSelector} from '@/redux/hook/hooks';
import {handleServiceRaskList} from '@/redux/slice/bpmnSlice';
import {render as amisRender} from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import * as uuid from 'uuid';
import {service} from '@/utils/request';
import {filteredData,getOptionAll} from './conditionBuilder';
import {filterData, filteredDatas} from '@/bpmn/panel/ElementTask/ServiceTask/getSchemaChange';
import {getSchemaTpl} from 'amis-editor';
import {reverseTransformSelectAnyIn, transformSelectAnyIn} from "@/components/AntvModel/Content/components/DataScope";
import {getFormatStringByPrecision} from '@/utils';
import {advancedFeature} from '@/utils/env'

// 删除记录组件
const DeleteRecord = forwardRef(function DeleteRecord(props: any, ref) {
  console.log(props, '传的参数');
  const {businessObject, cascaderValue} = props;
  const serviceList = useAppSelector(state => state.bpmn.serviceRaskList);
  const dispatch = useAppDispatch();
  const [form] = Form.useForm<{}>();
  const entityList = useAppSelector(state => state.bpmn.entityList);

  // 删除记录
  const [nodeValue, setNodeValue] = useState([]);
  const [objectKey, setObjectKey] = useState('');
  const [keyOption, setKeyOption] = useState([]); // 筛选条件key值数组
  const [showObject, setShowObject] = useState(false);

  const [isShow, setIsShow] = useState(false);
  const [isShows, setIsShows] = useState(false);

  // 上下问数据
  const [formuVariables, setFormuVariables] = useState([]);
  // 筛选条件 简单类型列表数据
  const [filterFields, setFilterFields] = useState({});
  // 筛选条件 复杂类型弹框数据
  const [modelFilterFields, setModelFilterFields] = useState({});
  const modelFilterFieldsData = useRef({});
  const [isUseEff, setIsUseEff] = useState(false); // 是否初始化
  // 过滤器 更新字段数据
  const [updateFieldsOption, setUpdateFieldsOption] = useState([]);
  useEffect(() => {
    setIsUseEff(true);
    setShowObject(false);
    console.log(props, '传的参数');
    console.log(props.businessObject, 'props.businessObject');
    console.log(serviceList, 'serviceListserviceListserviceListserviceList');
    console.log(cascaderValue, 'cascaderValue');
    setFormuVariables(props.formuVariables);
    getOptionAll(entityList)
    if (serviceList) {
      setNodeValue({
        taskType: 3
      });
      setTimeout(() => {
        setShowObject(true);
      }, 100);
      serviceList.forEach(element => {
        if (
          element.serviceTaskId == props.businessObject.id ||
          element.id == businessObject.id
        ) {
          console.log(element, '选择的节点');
          // 确定哪个节点
          setNodeValue(element);
          setObjectKey(element.modelEventTarget);
          // setTaskTypeValue(element.taskType);
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
              console.log(needArr,'needArr')
              modelFilterFieldsData.current = needArr;
            }
          } else {
            let aaa = JSON.parse(JSON.stringify(
                element.filterCondition ?
                typeof element.filterCondition == 'string'
                ? JSON.parse(element.filterCondition)
                : element.filterCondition : 1));
            aaa = reverseTransformSelectAnyIn(aaa)
            setFilterFields(aaa);
            form.setFieldValue('filterCondition', aaa);
          }
          setIsShow(false);
          setTimeout(() => {
            setIsShow(true);
          }, 100);
          // setKeyOption(element.fieldsData);
          // setUpdateFieldsOption(element.fieldsData);
          if(element.fields && element.fields.length > 0){
            let dataList = JSON.parse(JSON.stringify(element.fields))
            setUpdateFieldsOption(dataList.map(res=>{
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
          }else{
            setUpdateFieldsOption(element.fields)
          }
          // setInitFields(element.initFields);
          setRadioValue(element.conditionMode);
          let filterConditionData = JSON.parse(JSON.stringify(
              element.filterCondition ?
                  typeof element.filterCondition == 'string'
                      ? JSON.parse(element.filterCondition)
                      : element.filterCondition : 1));
          filterConditionData = reverseTransformSelectAnyIn(filterConditionData)
          form.setFieldsValue({
            conditionMode: element.conditionMode,
            filterCondition:filterConditionData
          });
        }
      });
    } else {
      setShowObject(true);
      setNodeValue({
        taskType: 3
      });
    }
  }, [businessObject.id]);
  // 高级设置弹出层显示隐藏
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 类型选择默认值
  const [radioValue, setRadioValue] = useState(1);
  const [showLoading, setShowLoading] = useState(false);
  // 是否忽略租户开关
  const [tenantFlagRecord, setTenantFlagRecord] = useState<any>(false);
  // 是否忽略租户输入框
  const [appTenantCodeValue, setAppTenantCodeValue] = useState<any>('');
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
          id: 'nestedId',
          onlyLeaf: true,
          label: '删除对象:',
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
                console.log(_, doAction, event, '_____');
                console.log(cascaderValue, 'cascaderValuecascaderValue');
                console.log(isUseEff, 'isUseEffisUseEffisUseEff');
                setShowLoading(true)
                if(!isUseEff){
                  setShowLoading(false)
                  setFilterFields({});
                  setModelFilterFields({});
                  modelFilterFieldsData.current = {};
                  form.setFieldValue('filterCondition', {});
                  let arr = serviceList.map(element => {
                    if (element.serviceTaskId == businessObject.id) {
                      return {
                        ...element,
                        filterCondition: undefined
                      };
                    } else {
                      return element;
                    }
                  });
                  console.log(arr, '类型选择数据');
                  dispatch(handleServiceRaskList([...arr]));
                }
                setObjectKey(event.data.nestedSelect);
                let haveDataArr = false;
                  entityList.data.options.forEach(res => {
                    res.children.forEach(item => {
                      if (item.value == event.data.nestedSelect) {
                        haveDataArr = true
                        setKeyOption([
                          ...item.form.fields
                          // ...item.form.relations
                        ]);
                        let asdArr = item.form.fields.filter(item => {
                          return (
                            item.type != 'relation' &&
                            // item.key != 'deletedAt' &&
                            // item.key != 'deleted' &&
                            !item.isDeleteUser &&
                            !item.isDeleteDate &&
                            item.type != 'date-range' &&
                            item.type != 'rich-text' &&
                            item.type != 'attachment' &&
                            item.type != 'formula' &&
                            item.type != 'users' &&
                            item.type != 'password' &&
                            item.type != 'ciphertext' &&
                            item.type != 'json' &&
                            !item.isCreateDate &&
                            !item.isUpdateDate &&
                            !item.isUpdateUser &&
                            !item.isDeleteFlag &&
                            !item.isCreateUser &&
                            !item.isTenantCode
                          );
                        });
                        let asds = builderChange(asdArr);
                        let asd = asds.map(sjsw => {
                            return sjsw;
                        });
                        console.log(asd, 'asdasdasdasd');
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
                        console.log(isUseEff, 'isUseEff');
                        let arr = serviceList.map(element => {
                          if (
                            element.serviceTaskId == props.businessObject.id
                          ) {
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
                            if (!isUseEff) {
                              setFilterFields({});
                              setModelFilterFields({});
                              modelFilterFieldsData.current = {};
                              setRadioValue(1);
                              form.setFieldsValue({
                                filterCondition: {},
                                conditionMode: 1,
                                ignoreTenantFlag: typeof element.tenantConfig == 'string' ?
                                    JSON.parse(element.tenantConfig).ignoreTenantFlag : element.tenantConfig == null ? false : element.tenantConfig.ignoreTenantFlag,
                                appTenantCode: typeof element.tenantConfig == 'string' ?
                                    JSON.parse(element.tenantConfig).appTenantCode : element.tenantConfig == null ? '' : element.tenantConfig.appTenantCode
                              });
                              setIsShow(false);
                              setTimeout(() => {
                                setIsShow(true);
                              }, 100);
                              return {
                                ...element,
                                modelEventTarget: event.data.nestedSelect,
                                conditionMode: element.conditionMode
                                  ? element.conditionMode
                                  : 1,
                                fields: asd,
                                filterCondition: {},
                                relationFields: item.form.relationFields,
                                originRelation: item.form.originRelation,
                              };
                            } else {
                              return {
                                ...element,
                                modelEventTarget: event.data.nestedSelect,
                                fields: asd,
                                relationFields: item.form.relationFields,
                                originRelation: item.form.originRelation
                              };
                            }
                          } else {
                            return element;
                          }
                        });
                        console.log(arr, 'arrarrarrarr');
                        dispatch(handleServiceRaskList(arr));
                      }
                    });
                  });
                  setShowLoading(false)
                  if(!haveDataArr){
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
      let obj = filteredData(e[i]);
      if (obj != undefined) {
        arr.push(obj);
      }
    }
    return arr;
  };
  // 类型选择切换
  const radioChange = e => {
    console.log(e, '新增列表切换');
    setRadioValue(e.target.value);
    setFilterFields({});
    setModelFilterFields({});
    modelFilterFieldsData.current = {};
    form.setFieldValue('filterCondition', {});
    setIsShow(false);
    setTimeout(() => {
      setIsShow(true);
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
    setIsShows(false)
    setTimeout(()=>{
      form.setFieldsValue({
        filterCondition: JSON.stringify(modelFilterFieldsData.current) === '{}'?{}:reverseTransformSelectAnyIn(modelFilterFieldsData.current)
      });
      setIsShows(true)
    },100)
  };
  // 高级设置确认
  const handleOk = () => {
    console.log('高级设置确认');
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
    let aa = JSON.parse(JSON.stringify(modelFilterFieldsData.current));
    setModelFilterFields(transformSelectAnyIn(aa))
    dispatch(handleServiceRaskList(arr));
    setIsModalOpen(false);
  };
  // 高级设置取消
  const handleCancel = () => {
    console.log('高级设置取消');
    setIsModalOpen(false);
  };
  // 筛选条件 简单模式
  const objectKeyChange = e => {
    console.log(e, '筛选条件 简单模式');
    let data = Object.assign({}, e);
    console.log(data, 'data');
    if (e) {
      let result = reverseTransformSelectAnyIn(data)
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
      console.log(arr, '类型选择数据');
      dispatch(handleServiceRaskList([...arr]));
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

  // 高级设置 条件个数
  function filterFieldsValue() {
    console.log(serviceList, 'serviceListserviceListserviceListserviceList');
    let haveData = 0;
    let haveData1 = false;
    let haveData2 = false;
    serviceList.forEach(element => {
      if (element.serviceTaskId == businessObject.id) {
        console.log(element, 'element');
        if (JSON.stringify(element.filterCondition) === '{}') {
          haveData1 = true;
        } else if (typeof element.filterCondition == 'object') {
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
        initialValues={{remember: true}}
        form={form}
        autoComplete="off"
      >
        {nodeValue.taskType == 3 && (
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
                <Form.Item<FieldType> label="类型选择" name="conditionMode">
                  <Radio.Group
                    onChange={radioChange}
                    defaultValue={radioValue}
                    value={radioValue}
                  >
                    <Radio value={1}>普通模式</Radio>
                    <Radio value={2}>高级模式</Radio>
                  </Radio.Group>
                </Form.Item>
                {radioValue == 1 && (
                  <>
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
                      {isShow && (
                        <>
                          {amisRender({
                            type: 'service',
                            dataProvider: (data, setData) => {
                              console.log(data, '普通模式');
                              console.log(filterFields,'普通模式');
                              setData(filterFields);
                            },
                            body: [
                              {
                                type: 'condition-builder',
                                label: ' ',
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
                  </>
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
                    {/* <Input value={'0个条件'} readOnly onClick={inputClick} /> */}
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
                      <Form.Item<FieldType> label="" name="filterCondition">
                        {isShows && (
                          <>
                            {amisRender({
                              type: 'service',
                              dataProvider: (data, setData) => {
                              //   console.log(data, '高级模式');
                              //   console.log(modelFilterFieldsData.current,'高级模式');
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
                      </Form.Item>
                    </Modal>
                  </Form.Item>
                )}
              </>
            )}
          </>
        )}
      </Form>
    </>
  );
});
export default DeleteRecord;
