import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';
import {
  EllipsisOutlined,
  DeleteFilled,
  DeleteOutlined,
  DoubleLeftOutlined
} from '@ant-design/icons';
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
  Tree
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
import {filteredData} from './conditionBuilder';
import * as uuid from 'uuid';
import {getNoLoopRelation,getNoLoopRelations} from '@/bpmn/panel/ElementTask/ServiceTask/config';
import {getSchemaTpl} from 'amis-editor';
import {filteredDatas, filterData} from './getSchemaChange';
import {advancedFeature} from '@/utils/env'

// 调用服务组件
const CallService = forwardRef(function CallService(props, ref) {
  console.log(props, '调用服务组件props');
  const {businessObject, cascaderValue} = props;
  const serviceList = useAppSelector(state => state.bpmn.serviceRaskList);
  const serviceListValue = useRef();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm<{}>();
  const [nodeValue, setNodeValue] = useState({});
  const [showObject, setShowObject] = useState(false);
  const isFirst = useRef(false);
  const [isUseEff, setIsUseEff] = useState(false); // 是否初始化
  const [showFuncTion, setShowFuncTion] = useState(true); // 是否初始化
  const [copyData, setCopyData] = useState([]);
  const [showFuncs, setShowFuncs] = useState(true);
  // 上下问数据
  const [formuVariables, setFormuVariables] = useState([]);
  const [outFormuVariables, setOutFormuVariables] = useState([]);
  // 是否忽略租户开关
  const [tenantFlagRecord, setTenantFlagRecord] = useState<any>(false);
  const [showTenant, setShowTenant] = useState<any>(false);
  // 是否忽略租户输入框
  const [appTenantCodeValue, setAppTenantCodeValue] = useState<any>('');
  // const [isFirst,setIsFirst] = useState(false)
  // 实体数据
  const entityList = useAppSelector(state => state.bpmn.entityList);
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
      };
      acc[key].children.push(childItem);
      return acc;
    }, {}));
  }
  useEffect(() => {
    setIsUseEff(true);
    setShowObject(false);
    setShowFuncTion(false);
    console.log(serviceList, 'serviceListserviceList');
    console.log(cascaderValue, 'cascaderValuecascaderValue');
    let arr = JSON.parse(sessionStorage.getItem('userList')); // 表单
    let userArr = JSON.parse(sessionStorage.getItem('getUserList')); // 操作人
    let queryArr = JSON.parse(sessionStorage.getItem('queryList')); // 查询
    let xinArr = JSON.parse(sessionStorage.getItem('getXinList')); // 新增服务
    let callArr = JSON.parse(sessionStorage.getItem('callList')); // 新增服务
    let startArr = JSON.parse(sessionStorage.getItem('startList')); // 流程参数
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
                  }
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
        console.log(returnData,'returnDatareturnDatareturnData')
        return returnData
      });
      console.log(arrs, 'arrsarrsarrsarrsarrsarrs');
    }
    if (startArr != null && startArr.length > 0) {
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
      queryArr.forEach((elements: any) => {
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
                elements.data && elements.data.length != 0
                  ? elements.data.map(item => {
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
      // ...formuVariables,
      ...callArrs,
      ...filterData,
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
    let allArrTwo = [
      ...arrss,
      // ...arrs,
      ...arrsa,
      ...arrsas,
      // ...formuVariables,
      ...callArrs,
      ...filterData,
      ...startArrs,
      ...processorArrs
    ];
    allArr = uniqueFunc(allArr, 'value')
    allArrTwo = uniqueFunc(allArrTwo, 'value')
    if (arrs.length > 0) {
      allArrTwo = allArrTwo.map(res => {
        let resArr = {...res};
        arrs.forEach(element => {
          if (res.key == element.key) {
            let allChildren = [];
            if (resArr.children) {
              allChildren = [...resArr.children];
            }
            if (element.children) {
              allChildren = [...allChildren, ...element.children];
            }
            resArr.children = allChildren;
          }
        });
        return resArr;
      });
    }
    let doubleList = JSON.parse(sessionStorage.getItem('doubleList'));
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
                // let lastAllDatas =  getNoLoopRelation(ress.children,item.id)
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
                console.log(allArr,'allArr')
                console.log(lastArr,'lastArr')
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
        setFormuVariables(allArrTwo);
      }
    }else{
      console.log(allArrTwo,'11111111')
      setFormuVariables(allArrTwo);
    }
    // setFormuVariables(allArr);
    setOutFormuVariables(allArrTwo);
    if (serviceList) {
      serviceList.forEach(element => {
        if (
          element.serviceTaskId == businessObject.id ||
          element.id == businessObject.id
        ) {
          console.log(element, '选择的节点');
          setNodeValue(element);
          setTimeout(() => {
            setShowObject(true);
          }, 100);
          isFirst.current = true;
          form.setFieldsValue({
            useMapping: element.parameterMap
          });
          setRadioValue(element.parameterMap);
          if (element.outputParameterName) {
            form.setFieldsValue({
              outputParameterName: element.outputParameterName
            });
            setParamValue(element.outputParameterName);
          }
          if (element.enterTheParameters) {
            isFirst.current = false;
            setColumnInfo(
              typeof element.enterTheParameters == 'string'
                ? JSON.parse(element.enterTheParameters)
                : element.enterTheParameters
            );
            setShowFuncs(false);
            setTimeout(() => {
              setShowFuncs(true);
            }, 100);
          }
          if (element.outputParameters) {
            setOutputValue(
              typeof element.outputParameters == 'string'
                ? JSON.parse(element.outputParameters)
                : element.outputParameters
            );
          }
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
          setShowTenant(false)
          setTimeout(()=>{
            setShowTenant(true)
          },100)
        }
      });
    } else {
      setShowObject(true);
      setNodeValue({
        taskType: 5
      });
    }
    setShowFuncTion(true);
  }, [props.businessObject]);
  useEffect(() => {
    console.log(serviceList, 'serviceList数据变化');
    serviceListValue.current = serviceList;
  }, [serviceList]);
  // 输出参数 参数映射
  const [radioValue, setRadioValue] = useState(false);
  // 切换调用服务获取输入数据
  const inputSourceData = useRef([]);
  // 切换调用服务获取输出数据
  const outputSourceData = useRef([]);
  const [outputValue, setOutputValue] = useState([]);
  const schema = {
    type: 'page',
    className: 'b-dark bg-light ml-5',
    onEvent: {
      init: {
        weight: 0,
        actions: [
          {
            actionType: 'setValue',
            componentId: 'nestedId',
            args: {
              value: nodeValue.apiQueryKey
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
        right: 9
      },
      wrapWithPanel: false,
      body: [
        {
          required: true,
          type: 'nested-select',
          name: 'nestedSelect',
          id: 'nestedId',
          onlyLeaf: true,
          label: '调用服务：',
          options: cascaderValue,
          value: nodeValue.apiQueryKey
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
                console.log(
                  cascaderValue,
                  'cascaderValuecascaderValuecascaderValue'
                );
                if (!isUseEff) {
                  setColumnInfo([]);
                }
                inputSourceData.current = []; // 输入数据
                outputSourceData.current = []; // 输出数据
                // if (isFirst.current) {
                cascaderValue.forEach(element => {
                  element.children.forEach(item => {
                    if (item.value == event.data.nestedSelect) {
                      console.log(
                        element,
                        'elementelementelementelementelement'
                      );
                      console.log(item, 'itemitemitemitemitem');
                      getInputSourceData(item.api.api.inputParams);
                      outputSourceData.current = getOutputSourceData(
                        item.api.api.bpmnOutPutParams,
                        item
                      );
                    }
                  });
                });
                console.log(
                  inputSourceData.current,
                  ' inputSourceData.current inputSourceData.current'
                );
                console.log(
                  outputSourceData.current,
                  ' outputSourceData.current outputSourceData.current'
                );
                console.log(serviceListValue, 'serviceListValue');
                console.log(isUseEff, 'isUseEff');
                let inputD: any = [];
                if (inputSourceData.current.length > 0) {
                  inputSourceData.current.forEach(res => {
                    if (res.required) {
                      // if (res.type == 'array') {
                      inputD.push(res);
                    }
                  });
                }
                console.log(inputD, 'inputD');
                setColumnInfo(inputD);
                let apiShareConfig = {}
                for (const group of cascaderValue) {
                  if(group?.sourceType == 'apiShare'){
                    for (const child of group.children) {
                      for(const thirdChild of child.children) {
                        for(const lastChild of thirdChild.children) {
                          if (lastChild.queryKey === event.data.nestedSelect) {
                            apiShareConfig = {
                              "targetAppId": lastChild.appId,
                              "targetTenantId": lastChild.tenantId
                            }
                          }
                        }
                      }
                    }
                  }
                }
                let arrs = serviceList.map(element => {
                  // let arrs = serviceListValue.current.map(element => {
                  if (element.serviceTaskId == businessObject.id) {
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
                    console.log(element, 'element');
                    if (!isUseEff) {
                      console.log('进入');
                      if (
                        element.inputSource &&
                        element.inputSource.length > 0
                      ) {
                        setKeyOption(element.inputSource);
                      } else {
                        let newKeyOption = inputSourceData.current.map(
                          skjwd => {
                            let returnData = {
                              ...skjwd,
                              disabled: false
                            };
                            inputD.forEach(elements => {
                              if (elements.label == returnData.label) {
                                returnData.disabled = true;
                              }
                            });
                            return returnData;
                          }
                        );
                        setKeyOption(newKeyOption);
                      }
                      setColumnInfo(inputD);
                      form.setFieldsValue({
                        useMapping: element.parameterMap
                      });
                      setRadioValue(element.parameterMap);
                      // if (
                      //   element.outputParameters &&
                      //   element.outputParameters.lengh != 0
                      // ) {
                      //   setTimeout(() => {
                      //     setOutputValue(element.outputParameters);
                      //   }, 100);
                      // } else {
                      // setTimeout(() => {
                      //     setOutputValue(outputSourceData.current);
                      // }, 100);
                      // }
                      setTimeout(() => {
                        setOutputValue(outputSourceData.current);
                        setCopyData(outputSourceData.current);
                      }, 100);
                      return {
                        ...element,
                        apiQueryKey: event.data.nestedSelect,
                        enterTheParameters: inputD,
                        outputParametersA: outputSourceData.current,
                        parameterMap: element.parameterMap
                          ? element.parameterMap
                          : radioValue
                            ? radioValue
                            : false,
                        // outputParameters: element.outputParameters
                        outputParameters: outputSourceData.current,
                        apiShareConfig: apiShareConfig
                      };
                    } else {
                      console.log(';进入1');
                      if (
                        element.enterTheParameters &&
                        element.enterTheParameters.length > 0
                      ) {
                        let newKeyOption = inputSourceData.current.map(
                          skjwd => {
                            let returnData = {
                              ...skjwd,
                              disabled: false
                            };
                            element.enterTheParameters.forEach(elements => {
                              if (elements.label == returnData.label) {
                                returnData.disabled = true;
                              }
                            });
                            return returnData;
                          }
                        );
                        setKeyOption(newKeyOption);
                      } else {
                        setKeyOption(inputSourceData.current);
                      }
                      let newData = [];
                      if (
                        element.enterTheParameters &&
                        element.enterTheParameters.length > 0
                      ) {
                        newData = element.enterTheParameters;
                      }
                      console.log(newData, 'newData');
                      if (
                        element.enterTheParameters &&
                        element.enterTheParameters.length > 0
                      ) {
                        inputD = element.enterTheParameters;
                      }
                      setColumnInfo(inputD);
                      form.setFieldsValue({
                        useMapping: element.parameterMap
                      });
                      setRadioValue(element.parameterMap);
                      let outputParametersA: any = [];
                      if (
                        element.outputParameters &&
                        element.outputParameters.lengh != 0
                      ) {
                        console.log('进入2');
                        outputParametersA = element.outputParameters;
                        setTimeout(() => {
                          setOutputValue(element.outputParameters);
                          setCopyData(element.outputParameters);
                        }, 100);
                      } else {
                        console.log('进入3');
                        outputParametersA = outputSourceData.current;
                        setTimeout(() => {
                          setOutputValue(outputSourceData.current);
                          setCopyData(outputSourceData.current);
                        }, 100);
                      }
                      return {
                        ...element,
                        apiQueryKey: event.data.nestedSelect,
                        enterTheParameters: inputD,
                        outputParameters: outputParametersA,
                        parameterMap: element.parameterMap
                          ? element.parameterMap
                          : radioValue
                            ? radioValue
                            : false,
                        apiShareConfig: apiShareConfig
                        // outputParameters: outputSourceData.current
                      };
                    }
                  } else {
                    return element;
                  }
                });
                console.log(arrs, 'arrsarrsarrsarrsarrs');
                dispatch(handleServiceRaskList(arrs));
                // }
                isFirst.current = true;
                setIsUseEff(false);
                setShowFuncs(false);
                setTimeout(() => {
                  setShowFuncs(true);
                }, 100);
              }
            }
          ]
        }
      }
    }
  };
  // 筛选条件 简单类型列表数据
  const [filterFields, setFilterFields] = useState([]);
  // 筛选条件 复杂类型弹框数据
  const [modelFilterFields, setModelFilterFields] = useState({});
  // 参数名称数据
  const [paramValue, setParamValue] = useState('');
  // 输入参数列表
  const [columnInfo, setColumnInfo] = useState([]);
  // 输入参数列表 记录初始化key值数组
  const [keyOption, setKeyOption] = useState([]);
  // 对象数组去重
  function uniqueFunc(arr, uniId) {
    const res = new Map();
    return arr.filter(item => !res.has(item[uniId]) && res.set(item[uniId], 1));
  }
  // 获取输入数据
  const getInputSourceData = e => {
    console.log(e, '获取输入数据');
    let inputData: any = [];
    let returnData: any = [];
    if (e && JSON.stringify(e) != '{}') {
      console.log('进入111')
      for (let i in e.properties) {
        // console.log(i, 'iiiiiiiiiiiiiiiiiiiii');
        inputData.push({
          id: uuid.v4(),
          label: i,
          value: i,
          type: e.properties[i].type,
          arrayType: e.properties[i].arrayType
        });
      }
      console.log(inputData, 'inputDatainputDatainputDatainputDatainputData');
      inputData.forEach(element => {
        e.required.forEach(item => {
          if (element.label == item) {
            returnData.push({
              ...element,
              label: element.label,
              value: element.value,
              type: element.type,
              required: true
            });
          }
        });
      });
    }
    let arr = [...returnData, ...inputData];
    returnData = uniqueFunc(arr, 'label');
    console.log(returnData, '输入参数数据');
    inputSourceData.current = returnData;
    return returnData;
  };
  // 获取输出数据
  const getOutputSourceData = (e, data) => {
    console.log(e, '获取输出数据');
    console.log(data, 'aaaaaaaaaaaa');
    let outData: any = [];
    let returnData: any = [];
    if (data.api.api.outputType == 'member') {
      if (JSON.stringify(e) != '{}') {
        if (e.properties) {
          for (let i in e.properties) {
            // console.log(i, 'iiiiiiiiiiiiiiiiiiiii');
            outData.push({
              id: uuid.v4(),
              label: i,
              value: i,
              type: e.properties[i].type
            });
          }
          console.log(outData, 'outDataoutDataoutData');
          if (e.required.length > 0) {
            outData.forEach(element => {
              e.required.forEach(item => {
                if (element.label == item) {
                  returnData.push({
                    ...element,
                    label: element.label,
                    value: element.value,
                    type: element.type,
                    required: true
                  });
                } else {
                  returnData.push({
                    ...element,
                    label: element.label,
                    value: element.value,
                    type: element.type
                  });
                }
              });
            });
          }
        } else if (data.api.api.outputType) {
          e.forEach(element => {
            returnData.push({
              id: uuid.v4(),
              ...element,
              // label: element.key,
              key: element.key,
              formula: '${actServiceResults.' + element.key + '}'
            });
          });
        }
      }
    }
    if (data.api.api.outputType == 'global') {
      returnData = data.api.api.bpmnOutPutParams;
    }

    console.log(returnData, 'returnDatareturnDatareturnDatareturnData');
    let outputData = [];
    if (returnData) {
      returnData.forEach(element => {
        if (element.type == 'object') {
          if (element.children.length > 0) {
            outputData = element.children.map(sjw => {
              if (
                sjw.value.includes('.') &&
                !sjw.value.includes('zcApp') &&
                !sjw.value.includes('zcUser') &&
                !sjw.value.includes('zcCompany')
              ) {
                let needValue = sjw.value.split('.');
                return {
                  ...sjw,
                  id: uuid.v4(),
                  label: needValue[needValue.length - 1],
                  formula: '${' + sjw.value + '}'
                  // '${actServiceResults.' + needValue[needValue.length - 1] + '}'
                };
              } else {
                let needValue = sjw.value.split('.');
                if (sjw.value.includes('zcApp')) {
                  return {
                    ...sjw,
                    id: uuid.v4(),
                    label: needValue[needValue.length - 1],
                    formula: '${' + sjw.value + '}'
                  };
                } else if (sjw.value.includes('zcUser')) {
                  return {
                    ...sjw,
                    id: uuid.v4(),
                    label: needValue[needValue.length - 1],
                    formula: '${' + sjw.value + '}'
                  };
                } else if (sjw.value.includes('zcCompany')) {
                  return {
                    ...sjw,
                    id: uuid.v4(),
                    label: needValue[needValue.length - 1],
                    formula: '${' + sjw.value + '}'
                  };
                } else {
                  return {
                    ...sjw,
                    id: uuid.v4(),
                    label: sjw.value,
                    formula: '${actServiceResults.' + sjw.value + '}'
                  };
                }
              }
            });
          }
        }
        // else{
        //   console.log('进入',element)
        // outputData.push(element)
        // }
      });
    }
    // returnData = returnData.filter(rsw => {
    //   return rsw.key != '';
    // });
    console.log(returnData, 'returnDatareturnDatareturnDatareturnData');
    console.log(outputData, 'outputDataoutputDataoutputDataoutputData');
    setCopyData(outputData);
    outputSourceData.current = outputData;
    // outputSourceData.current = returnData;
    let formfuls = formuVariables.filter(sjkw => {
      return sjkw.label != '当前节点出参';
    });
    formfuls.push({label: '当前节点出参', children: returnData});
    console.log(formfuls, 'formfuls');
    setOutFormuVariables(formfuls);
    // if (!radioValue) {
    setOutputValue(outputData);
    // }
    setTimeout(() => {
      setShowFuncTion(true);
    }, 100);
    return outputData;
  };
  // 添加某项
  function addField() {
    let needId = uuid.v4();
    let arr = [...columnInfo];
    arr.push({id: needId});
    setColumnInfo(arr);
    let arrs = serviceListValue.current.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        if (element.enterTheParameters) {
          return {
            ...element,
            enterTheParameters: [...element.enterTheParameters, {id: needId}]
          };
        } else {
          return {
            ...element,
            enterTheParameters: [{id: needId}]
          };
        }
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arrs));
  }
  // 添加输出某项
  function outAddField() {
    let needId = uuid.v4();
    let arr = [...outputValue];
    arr.push({id: needId});
    setOutputValue(arr);
    console.log(serviceListValue, 'serviceListValueserviceListValue');
    let arrs = serviceListValue.current.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        if (element.outputParameters) {
          let allData = [...element.outputParameters];
          let allDatas = uniqueFunc(allData, 'id');
          return {
            ...element,
            outputParameters: [...allDatas, {id: needId}]
          };
        } else {
          return {
            ...element,
            outputParameters: [{id: needId}]
          };
        }
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arrs));
  }
  // 输出参数切换
  const radioChange = e => {
    console.log(e, '新增列表切换');
    setRadioValue(e.target.value);
    console.log(outputValue, 'outputValue');
    console.log(copyData, 'copyData');
    let newOutPutData = outputValue.filter(res => {
      return res.label;
    });
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        setOutputValue(newOutPutData);
        return {
          ...element,
          parameterMap: e.target.value,
          outputParameters: e.target.value ? newOutPutData : copyData
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  // 输出参数 参数名称数据变化
  const outputParameterNameChange = e => {
    console.log(e, '输出参数 参数名称数据变化');
    setParamValue(e.target.value);
    let arr = serviceListValue.current.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          outputParameterName: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
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
    let a = filteredDatas('text', [...data]);
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
  // key变化
  function keyChange(e, item) {
    console.log(e, 'key变化');
    console.log(item, 'key变化');
    console.log(keyOption, 'keyOptionkeyOptionkeyOption');
    console.log(columnInfo, 'columnInfocolumnInfocolumnInfo');
    let itemKey = '';
    keyOption.forEach(ikn => {
      if (ikn.label == e) {
        console.log(ikn, 'ikn');
        itemKey = ikn.type;
      }
    });
    console.log(serviceList, 'serviceList');
    console.log(serviceListValue.current, 'serviceListValue.current');
    let arrs = serviceListValue.current.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        let newData = element.enterTheParameters.map(res => {
          if (res.label == item.label) {
            return {...res, label: e, value: e, type: itemKey};
          } else {
            return res;
          }
        });
        let newKeyOption = keyOption.map(skjwd => {
          let returnData = {...skjwd, disabled: false};
          newData.forEach(elements => {
            if (elements.label == returnData.label) {
              returnData.disabled = true;
            }
          });
          return returnData;
        });
        console.log(newKeyOption, 'newKeyOption4');
        setKeyOption(newKeyOption);
        console.log(newData, 'newData');
        setColumnInfo(newData);
        return {
          ...element,
          enterTheParameters: newData
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arrs));
    setShowFuncs(false);
    setTimeout(() => {
      setShowFuncs(true);
    }, 100);
  }
  //
  function formulaChange(e, item) {
    // console.log(e, 'formula变化');
    // console.log(item, 'formula变化');
    // console.log(serviceList, 'serviceListserviceList');
    let arrs = serviceListValue.current.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        let newData = element.enterTheParameters.map(res => {
          console.log(res, 'resresresresres');
          if (res.id == item.id) {
            return {...res, formula: e};
          } else {
            return res;
          }
        });
        setColumnInfo(newData);
        return {
          ...element,
          enterTheParameters: newData
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
    let arr = serviceListValue.current.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        let arrs = element.enterTheParameters.filter(res => {
          if (res.id != e.id) {
            return res;
          }
        });
        setColumnInfo(arrs);
        let list = keyOption.map(skjwd => {
          let returnData = {...skjwd, disabled: false};
          arrs.forEach(elements => {
            if (elements.label == returnData.label) {
              returnData.disabled = true;
            }
          });
          return returnData;
        });
        setKeyOption(list)
        return {
          ...element,
          enterTheParameters: arrs
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  }
  // 输出参数 input数据变化
  const outInputChange = (e, item) => {
    console.log(e, '输出第一个值变化');
    console.log(item, '输出第一个值变化');
    console.log(serviceList, 'serviceListserviceList');
    console.log(serviceListValue, 'serviceListValue');
    let arrs = serviceListValue.current.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        let newData = element.outputParameters.map(res => {
          console.log(res, 'resresresresres');
          if (res.id == item.id) {
            return {...res, label: e.target.value, key: e.target.value};
          } else {
            return res;
          }
        });
        setOutputValue(newData);
        return {
          ...element,
          outputParameters: newData
        };
      } else {
        return element;
      }
    });
    console.log(arrs, 'arrs');
    dispatch(handleServiceRaskList(arrs));
  };
  function formulaChanges(e, item, indexs) {
    // console.log(e, 'formula变化');
    // console.log(item, 'formula变化');
    console.log(serviceList, 'serviceListserviceList');
    console.log(serviceListValue.current, 'serviceListValue.current');
    let arrs = serviceListValue.current.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        let newData = element.outputParameters.map((res, index) => {
          // console.log(res, 'resresresresres');
          if (index == indexs) {
            // if (res.id == item.id) {
            return {...res, formula: e};
          } else {
            return res;
          }
        });
        setOutputValue(newData);
        return {
          ...element,
          outputParameters: newData
        };
      } else {
        return element;
      }
    });
    // console.log(arrs, 'arrs');
    dispatch(handleServiceRaskList(arrs));
  }
  // 删除某项
  function deleteClicks(e, index) {
    console.log(e, index, '删除某项');
    console.log(serviceList, 'serviceList');
    console.log(serviceListValue.current);
    let arr = serviceListValue.current.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        let arrs = element.outputParameters.filter((res, ind) => {
          // console.log(ind, 'ind');
          return index != ind;
        });
        console.log(arrs, 'arrsarrsarrsarrsarrsarrs');
        setOutputValue(arrs);
        outputSourceData.current = arrs;
        return {
          ...element,
          outputParameters: arrs
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  }
  return (
    <>
      <Form
        name="basic"
        labelCol={{span: 5}}
        wrapperCol={{span: 18}}
        // style={{maxWidth: 600}}
        labelWrap
        form={form}
        autoComplete="off"
      >
        {nodeValue.taskType == 5 && (
          <>
            {showObject &&
              amisRender(
                schema,
                {},
                {
                  fetcher: service,
                  theme: amisEnv.theme
                }
              )}
          </>
        )}
        <Form.Item<FieldType>
          label="输出参数名称"
          name="outputParameterName"
          rules={[{required: true}]}
        >
          <Input
            style={{marginLeft:'20px',width:'96%'}}
            onChange={outputParameterNameChange}
            value={paramValue}
            defaultValue={paramValue}
          />
          <div style={{marginLeft:'20px'}}>
            输出当前记录的ID,方便于流程中的其他节点引用它;可输入中文、数字、字母或者下划线_
          </div>
        </Form.Item>
        <Form.Item<FieldType>
          label={'是否忽略租户'}
          name="ignoreTenantFlag"
        >
          <Switch
            style={{marginLeft:'20px'}}
            onChange={tenantFlagChange}
            checked={tenantFlagRecord}
          />
        </Form.Item>
        {
          !tenantFlagRecord && showTenant && (
            <>
              <Form.Item<FieldType>
                label={'指定租户'}
                name="appTenantCode"
              >
                <div
                  style={{marginLeft:'20px'}}
                >
                  {forMuFunctions(formuVariables)}
                </div>
              </Form.Item>
            </>
          )
        }
        <div
          style={{
            backgroundColor: '#F2F2F4',
            padding: '10px',
            marginBottom: '10px'
          }}
        >
          输入参数
        </div>
        <Form.Item<FieldType> label="" name="enterTheParameters">
          {columnInfo && columnInfo.length == 0 && (
            <div style={{marginLeft: '20px'}}>{'<空>'}</div>
          )}
          {columnInfo &&
            columnInfo.length > 0 &&
            columnInfo.map(res => {
              return (
                <Form.Item<FieldType>>
                  <Row gutter={10} style={{marginLeft: '20px'}}>
                    <Col span={10}>
                      <Select
                        value={res.value}
                        placeholder="请选择"
                        onChange={e => keyChange(e, res)}
                      >
                        {keyOption.map((res, index) => {
                          return (
                            <Option
                              key={index}
                              value={res.label}
                              disabled={res.disabled}
                            >
                              {res.name}
                            </Option>
                          );
                        })}
                      </Select>
                    </Col>
                    <DoubleLeftOutlined />
                    <Col span={11}>
                      {showFuncs && res.type == 'string'
                        ? amisRender(
                          getSchemaTpl('tplFormulaControl', {
                            value: res.formula,
                            variables: formuVariables,
                            onChange: function (e) {
                              formulaChange(e, res);
                            },
                            formulaEchoVal: false,
                            advancedFeature: advancedFeature
                          }),
                          {},
                          {
                            theme: amisEnv.theme
                          }
                        )
                        : res.type == 'number'
                          ? amisRender(
                            getSchemaTpl('formulaControl-hour', {
                              variables: formuVariables,
                              value: res.formula,
                              valueType: {
                                type: 'number',
                                placeholder: '请输入'
                              },
                              onChange: function (e) {
                                formulaChange(e, res);
                              },
                              formulaEchoVal: false,
                              advancedFeature: advancedFeature
                            }),
                            {},
                            {
                              theme: amisEnv.theme
                            }
                          )
                          : res.type == 'boolean'
                            ? amisRender(
                              getSchemaTpl('formulaControl-hour', {
                                variables: formuVariables,
                                value: res.formula,
                                valueType: {
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
                                },
                                onChange: function (e) {
                                  formulaChange(e, res);
                                },
                                formulaEchoVal: false,
                                advancedFeature: advancedFeature
                              }),
                              {},
                              {
                                theme: amisEnv.theme
                              }
                            )
                            : amisRender(
                              getSchemaTpl('formulaControl-hour', {
                                value: res.formula,
                                variables: formuVariables,
                                onChange: function (e) {
                                  formulaChange(e, res);
                                },
                                formulaEchoVal: false,
                                advancedFeature: advancedFeature
                              }),
                              {},
                              {
                                theme: amisEnv.theme
                              }
                            )}
                    </Col>
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
                新增字段
              </Button>
            </Col>
          </Row>
        </Form.Item>
        <div
          style={{
            backgroundColor: '#F2F2F4',
            padding: '10px',
            marginBottom: '10px'
          }}
        >
          输出参数
        </div>
        <Form.Item<FieldType> label="参数映射" name="useMapping">
          <Radio.Group
            style={{marginLeft:'20px',width:'96%'}}
            onChange={radioChange}
            defaultValue={radioValue}
            value={radioValue}
          >
            <Radio value={false}>无</Radio>
            <Radio value={true}>参数映射</Radio>
          </Radio.Group>
        </Form.Item>
        {!radioValue && (
          <Form.Item<FieldType> label="" name="outputParameters">
            {!copyData && copyData.length == 0 && <>{'<空>'}</>}
            {copyData.map((res, index) => {
              return (
                <>
                  <Row gutter={10} style={{marginLeft: '20px'}}>
                    <Col span={10}>
                      <Input disabled value={res.label} />
                    </Col>
                    <DoubleLeftOutlined />
                    <Col span={10}>
                      <Input disabled value={res.formula} />
                    </Col>
                  </Row>
                </>
              );
            })}
          </Form.Item>
        )}
        {radioValue && (
          <>
            {outputValue && outputValue.length == 0 && (
              <div style={{marginLeft: '20px'}}>{'<空>'}</div>
            )}
            {outputValue &&
              outputValue.length > 0 &&
              outputValue.map((res, index) => {
                return (
                  <>
                    <Form.Item<FieldType>>
                      <Row gutter={10} style={{marginLeft: '20px'}} key={index}>
                        <Col span={10}>
                          <Input
                            value={res.label}
                            onChange={e => outInputChange(e, res)}
                          />
                        </Col>
                        <DoubleLeftOutlined />
                        <Col span={11}>
                          {/* <FormulaPicker
                            title={' '}
                            data={res.formula}
                            value={res.formula}
                            source={res.formula}
                            allowInput
                            mixedMode
                            inputSettings={{type: 'text'}}
                            mode={'input-group'}
                            placeholder="请配置目标值"
                            onConfirm={e => formulaChanges(e, res)}
                            onChange={e => formulaChanges(e, res)}
                          /> */}
                          {showFuncTion &&
                            amisRender(
                              getSchemaTpl('tplFormulaControl', {
                                value: res.formula,
                                variables: outFormuVariables,
                                onChange: function (e) {
                                  formulaChanges(e, res, index);
                                },
                                formulaEchoVal: false,
                                advancedFeature: advancedFeature
                              }),
                              {},
                              {
                                theme: amisEnv.theme
                              }
                            )}
                        </Col>
                        <Col span={1}>
                          <Button
                            icon={<DeleteOutlined />}
                            onClick={() => deleteClicks(res, index)}
                          />
                        </Col>
                      </Row>
                    </Form.Item>
                  </>
                );
              })}
            <Button
              style={{width: '90%', marginTop: '10px'}}
              onClick={outAddField}
            >
              新增字段
            </Button>
          </>
        )}
      </Form>
    </>
  );
});
export default CallService;
