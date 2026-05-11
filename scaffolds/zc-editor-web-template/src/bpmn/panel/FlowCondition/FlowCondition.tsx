import React, {useEffect, useState, useRef} from 'react';
import {Form, Input, Select, Radio} from 'antd';
import {
  condition_type,
  condition_type_options,
  flow_type,
  flow_type_options,
  script_type,
  script_type_options
} from '@/bpmn/panel/FlowCondition/dataSelf';
import {useWatch} from 'antd/es/form/Form';
import {service} from '@/utils/request';
import {render as amisRender} from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import {getSchemaTpl} from 'amis-editor';
import {getEnvVar} from '@/api/envVar';
import {filteredData} from '../ElementTask/ServiceTask/conditionBuilder';
import {
  getNoLoopRelation,
  getNoLoopRelations,
  groupByRelationKeyWithPK
} from '@/bpmn/panel/ElementTask/ServiceTask/config';
import {useAppSelector} from '@/redux/hook/hooks';
import {advancedFeature} from '@/utils/env'

interface IProps {
  businessObject: any;
}

/**
 * 流转条件 组件
 *
 * @param props
 * @constructor
 */
export default function FlowCondition(props: IProps) {
  // props
  const {businessObject} = props;
  // form
  const [form] = Form.useForm<{
    flowType: string;
    conditionType: string;
    expression: string;
    conditions: string;
    language: string;
    scriptType: string;
    script: string;
    resource: string;
  }>();
  // 条件类型
  const [conditionTypeValue, setConditionTypeValue] = useState("1");
  // 流转条件 表达式显示
  const [inputPlaceholder, setInputPlaceholder] = useState('请输入表达式,使用${}包裹,例:${value == 1},${value>0 && value<=3}');
  // 条件规则存储
  const [modelFilterFields, setModelFilterFields] = useState(undefined);
  // 公式数据存储
  const [formulaValue, setFormulaValue] = useState('');
  // 公式输入框显示隐藏
  const [showAmis, setShowAmis] = useState(true);
  // 公式编辑器数据存储
  const [formuVariables, setFormuVariables] = useState([]);
  // 条件规则存储
  const [updateFieldsOption, setUpdateFieldsOptions] = useState([]);
  // 实体数据
  const entityList = useAppSelector(state => state.bpmn.entityList);
  // watch
  let flowType = useWatch('flowType', form);
  let conditionType = useWatch('conditionType', form);
  let scriptType = useWatch('scriptType', form);

  /**
   * 初始化
   */
  useEffect(() => {
    if (businessObject) {
      initPageData();
    }
  }, [businessObject?.id]);
  function extractValues(expression){
    console.log(expression,'expression')
    console.log(expression.slice(expression.indexOf('execution,') + 1, expression.indexOf(')}')));
    // 假设你想提取从 '[' 到 ']' 之间的内容
    const start = expression.indexOf('execution,') + 2;
    console.log(start,'start')
    const lastIndex = expression.lastIndexOf(')}');
    console.log(lastIndex,'lastIndex')
    const result = expression.substring(start, lastIndex);
    console.log(result,'result')
    let returnData:any = result.split(',')
    return returnData;
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
  // 获取公式数据
  function getFx(){
    let arr = JSON.parse(sessionStorage.getItem('userList')); // 表单
    let userArr = JSON.parse(sessionStorage.getItem('getUserList')); // 操作人
    let queryArr = JSON.parse(sessionStorage.getItem('queryList')); // 查询
    let xinArr = JSON.parse(sessionStorage.getItem('getXinList')); // 新增服务
    let callArr = JSON.parse(sessionStorage.getItem('callList')); // 新增服务
    let startArr = JSON.parse(sessionStorage.getItem('startList')); // 流程参数
    let doubleList = JSON.parse(sessionStorage.getItem('doubleList')); // 开始节点的事件触发
    let processorArr = JSON.parse(sessionStorage.getItem('processorList')); // 自定义参数
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
                if(!item.relationKey){
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
    if (businessObject.$type != 'bpmn:StartEvent') {
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
    }
    if (userArr != null && userArr.length > 0) {
      userArr.forEach(items => {
        if (items.type == 'bpmn:StartEvent') {
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
        } else {
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
    console.log(arrsa,'arrsaarrsaarrsaarrsaarrsaarrsa')
    let setFormData: any = [
      ...arrss,
      ...arrs,
      ...arrsas,
      ...callArrs,
      ...startArrs,
      ...processorArrs
    ];
    console.log(setFormData,'setFormDatasetFormDatasetFormData')
    if (arrs.length > 0) {
      setFormData = setFormData.map(res => {
        let resArr = {...res};
        arrsa.forEach(element => {
          if (res.key == element.key) {
            let allChildren: any = [];
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
    getEnvVar().then(envItem => {
      console.log(envItem, 'envItemenvItemenvItemenvItem');
      let huanArr = {
        label: '环境变量',
        children: envItem.data.data.map(itemItem => {
          return {
            label: itemItem.var,
            value: itemItem.var,
            tag: '文本'
          };
        })
      };
      console.log(huanArr, 'arrarrarrarrarrarr开始');
      if (huanArr.children.length > 0) {
        setFormData.push(huanArr);
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
                      let allArr: any = [];
                      let relationAllArr: any = [];
                      if (item.form.fields != null) {
                        let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                        allArr = item.form.fields.filter(fie => {
                          return fie.type != 'relation';
                        });
                        allArr = allArr.map(swop=>{
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
                        item.form.relationFields.forEach(swpoe=>{
                          if(!swpoe.isDeleteUser &&
                            !swpoe.isDeleteDate &&
                            !swpoe.isDeleteFlag &&
                            !swpoe.isCreateDate &&
                            !swpoe.isUpdateDate &&
                            !swpoe.isUpdateUser &&
                            !swpoe.isTenantCode &&
                            !swpoe.isCreateUser
                          ){
                            if(swpoe.isTreeParent) {
                              relationAllArr.push({...swpoe,
                                primaryKeyType: relationPrimaryKeyData[swpoe.relationKey].type
                              })
                            }else{
                              relationAllArr.push(swpoe)
                            }
                          }
                        })
                      }
                      console.log(allArr, 'allArr');
                      allArr = allArr.filter(owo=> {return !owo.isPrimaryKey && !owo.isTenantCode})
                      console.log(allArr, 'allArr');
                      let objectArr:any = [res.value,item.value]
                      let lastAllDatas = getNoLoopRelations(relationAllArr,item.form.originRelation,items.options,objectArr)
                      let needArrSout = [...allArr,...lastAllDatas].map(resi=>{
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
                            needArr.push({...itemRes,tag: getTypeChinese(itemRes.type)});
                          }else{
                            lastArr.push({...itemRes,value:res.nodeId+'.'+itemRes.value,
                              tag: getTypeChinese(itemRes.type)});
                          }
                        })
                      }
                      let childrenArr:any = transformArray(needArr,res.nodeId,res.name)
                      lastArr = [...lastArr,...childrenArr]
                      setFormData.push({
                        label:res.name,
                        value:res.nodeId,
                        tag:'对象',
                        children:lastArr
                      })
                      console.log(setFormData,'setFormDatasetFormDatasetFormDatasetFormData')
                    }
                  })
                })
                setFormuVariables(setFormData);
              // })
          }
        })
        let haveModelEventTarget:any = []
        haveModelEventTarget = doubleList.filter(rswe=>{
          return rswe.modelEventTarget && rswe.type == 'bpmn:StartEvent'
        })
        if(haveModelEventTarget.length==0){
          setFormuVariables(setFormData);
        }
      }else{
        setFormuVariables(setFormData);
      }
      console.log(setFormData, 'setFormData');
      // setFormuVariables(setFormData);
      // let lastData: any = builderChange(setFormData);
      // console.log(lastData, 'lastData');
      // setUpdateFieldsOptions(lastData);
      setShowAmis(true)
    });
  }
  // 修改条件组合数据
  const builderChange = e => {
    console.log(e, '数据');
    let arr = [];
    for (let i in e) {
      if (
        !e[i].isDeleteDate &&
        !e[i].isTenantCode
      ) {
        let obj = filteredData(e[i]);
        if (obj != undefined) {
          arr.push(obj);
        }
      }
    }
    return arr;
  };
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
      };
      acc[key].children.push(childItem);
      return acc;
    }, {}));
  }
  /**
   * 初始化页面数据
   */
  function initPageData() {
    setFormulaValue('')
    console.log(businessObject,'businessObjectbusinessObject')
    let element = window.bpmnInstance.element;
    let elementSourceRef = element.businessObject.sourceRef;
    // 获取流转类型
    let flowConditionForm: any = Object.create(null);
    if (
      elementSourceRef &&
      elementSourceRef.default &&
      elementSourceRef.default.id === element.id
    ) {
      // 默认
      flowConditionForm.type = flow_type.defaultFlow;
    } else if (!element.businessObject.conditionExpression) {
      // 普通
      flowConditionForm.type = flow_type.normalFlow;
    } else {
      getFx()
      let matches = extractValues(businessObject.conditionExpression.body)
      console.log(matches,'matches');
      // 条件
      const conditionExpression = element.businessObject.conditionExpression;
      flowConditionForm = {
        ...conditionExpression,
        ...businessObject,
        type: flow_type.conditionalFlow
      };
      console.log(flowConditionForm,'flowConditionForm')
      if(matches.length>2){
        flowConditionForm.conditionType = Number(JSON.parse(matches[2]));
      }
      if(matches.length>4){
        let newData =  [...matches.slice(3)];
        console.log(newData,'newData')
        flowConditionForm.conditions = JSON.parse(newData.join(','));
      }else{
        if(matches[3]){
          flowConditionForm.conditions = JSON.parse(matches[3]);
        }else{
          flowConditionForm.conditions = '';
        }
      }
      console.log(flowConditionForm,'flowConditionForm');
      setConditionTypeValue('conditionType' in flowConditionForm ? JSON.parse(flowConditionForm.conditionType) : 2);
      if ('conditionType' in flowConditionForm && flowConditionForm.conditionType == 2) {
        setShowAmis(false)
        setFormulaValue(flowConditionForm.conditions ? flowConditionForm.conditions : '');
      } else {
        setModelFilterFields(flowConditionForm.conditions ? flowConditionForm.conditions : undefined);
      }
    }
    // 初始化表单数据
    form.setFieldsValue({
      flowType: flowConditionForm?.type,
      conditionType: flowConditionForm?.conditionType,
      expression: flowConditionForm?.body,
      conditions: flowConditionForm?.conditions,
      language: flowConditionForm?.language,
      scriptType: flowConditionForm?.scriptType,
      script: flowConditionForm?.body,
      resource: flowConditionForm?.resource
    });

    // 流转条件
    if (!flowConditionForm.body || flowConditionForm.body == '') {
      setInputPlaceholder('请输入表达式,使用${}包裹,例:${value == 1},${value>0 && value<=3}');
    } else {
      setInputPlaceholder(flowConditionForm.body);
    }
  }

  /**
   * 更新流转类型
   *
   * @param value
   */
  function updateFlowType(value: string) {
    let element = window.bpmnInstance.element;
    let elementSource = element.source;
    let elementSourceRef = element.businessObject.sourceRef;
    // 默认流转路径
    if (value === flow_type.defaultFlow) {
      window.bpmnInstance.modeling.updateProperties(element, {
        conditionExpression: undefined
      });
      window.bpmnInstance.modeling.updateProperties(elementSource, {
        default: element
      });
      return;
    }
    // 条件流转路径
    if (value === flow_type.conditionalFlow) {
      let flowConditionRef = window.bpmnInstance.moddle.create(
        'bpmn:FormalExpression'
      );
      let condition = window.bpmnInstance.moddle.create('bpmn:FormalExpression', {
        body: '${expressionHandler.handle(execution,"'+ businessObject.id +'",'+"2"+')}'
      });
      window.bpmnInstance.modeling.updateProperties(element, {
        conditionExpression: condition,
        // conditionType: 1
      });
      setShowAmis(true)
      setConditionTypeValue(2)
      getFx()
      return;
    }
    // 普通流转路径
    if (value === flow_type.normalFlow) {
      // 正常路径，如果来源节点的默认路径是当前连线时，清除父元素的默认路径配置
      if (
        elementSourceRef.default &&
        elementSourceRef.default.id === element.id
      ) {
        window.bpmnInstance.modeling.updateProperties(elementSource, {
          default: null
        });
      }
      window.bpmnInstance.modeling.updateProperties(element, {
        conditionExpression: undefined
      });
    }
  }

  /**
   * 更新流转条件
   */
  function updateFlowCondition() {
    // 获取表单字段
    let fieldsValue = form.getFieldsValue([
      'flowType',
      'conditionType',
      'expression',
      'language',
      'scriptType',
      'script',
      'resource'
    ]);
    if (fieldsValue.expression == '') {
      setInputPlaceholder('请输入表达式,使用${}包裹,例:${value == 1},${value>0 && value<=3}');
    } else {
      setInputPlaceholder(fieldsValue.expression);
    }
    // 更新流转条件
    let condition;
    if (fieldsValue.conditionType === condition_type.expression) {
      condition = window.bpmnInstance.moddle.create('bpmn:FormalExpression', {
        body: fieldsValue.expression
      });
    } else {
      if (fieldsValue.scriptType === script_type.inlineScript) {
        condition = window.bpmnInstance.moddle.create('bpmn:FormalExpression', {
          body: fieldsValue.script,
          language: fieldsValue.language
        });
      } else {
        condition = window.bpmnInstance.moddle.create('bpmn:FormalExpression', {
          resource: fieldsValue.resource,
          language: fieldsValue.language
        });
      }
    }
    // 开始更新
    let element = window.bpmnInstance.element;
    window.bpmnInstance.modeling.updateProperties(element, {
      conditionExpression: condition
    });
  }

  // 条件类型数据变化
  function conditionTypeChange(e) {
    console.log(e, 'e条件类型数据变化');
    setConditionTypeValue(e.target.value);
    form.setFieldsValue({
      conditionType: e.target.value,
      conditions:undefined
    });
    let condition = window.bpmnInstance.moddle.create('bpmn:FormalExpression', {
      body: '${expressionHandler.handle(execution,"'+ businessObject.id +'","'+e.target.value+'")}'
    });
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      conditionExpression:condition
      // conditionType: e.target.value,
      // conditions:undefined
    });
  }

  // 条件类型数据变化
  function objectKeyModelChange(e) {
    console.log(e, '公式数据变化');
    let matches = extractValues(businessObject.conditionExpression.body)
    console.log(matches,'matches');
    console.log(matches.length,'matches');
    setModelFilterFields(e);
    if(matches.length>2 && e){
      let condition = window.bpmnInstance.moddle.create('bpmn:FormalExpression', {
        body: '${expressionHandler.handle(execution,"'+ businessObject.id +'",'+JSON.parse(matches[2])+',"'+e+'")}'
      });
      window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
        conditionExpression:condition
        // conditions: e
      });
    }
  }

  // 公式数据变化
  function formulaChange(e) {
    console.log(e, '公式数据变化');
    setFormulaValue(e);
    let matches = extractValues(businessObject.conditionExpression.body)
    console.log(matches,'matches');
    if(matches.length>2 && e){
    let condition = window.bpmnInstance.moddle.create('bpmn:FormalExpression', {
      body: '${expressionHandler.handle(execution,"'+ businessObject.id +'",'+JSON.parse(matches[2])+',"'+e+'")}'
    });
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      conditionExpression:condition
      // conditions: e
    });
    }
  }

  /**
   * 渲染Process节点独有组件 (版本标签、是否可执行)
   */
  function renderConditionFlowForm() {
    if (flowType === flow_type.conditionalFlow) {
      return (
        <>
          {/*<Form.Item name="conditionType" label="条件格式">*/}
          {/*  <Select placeholder={'请选择'} onChange={updateFlowCondition}>*/}
          {/*    {condition_type_options.map((e) => {*/}
          {/*      return (*/}
          {/*        <Select.Option key={e.value} value={e.value}>*/}
          {/*          {e.name}*/}
          {/*        </Select.Option>*/}
          {/*      );*/}
          {/*    })}*/}
          {/*  </Select>*/}
          {/*</Form.Item>*/}
          {/*{conditionType == condition_type.expression && (*/}
          {/*  <Form.Item label="表达式" name="expression">*/}
          {/*    <Input title={inputPlaceholder} placeholder={inputPlaceholder} onChange={updateFlowCondition} />*/}
          {/*  </Form.Item>*/}
          {/*)}*/}
          <div>
            {/*<Form.Item label="条件类型" name="conditionType">*/}
            {/*  <Radio.Group onChange={conditionTypeChange}>*/}
            {/*    <Radio value={1}>条件规则</Radio>*/}
            {/*    <Radio value={2}>公式</Radio>*/}
            {/*  </Radio.Group>*/}
            {/*</Form.Item>*/}
            {conditionTypeValue == 2 && <Form.Item label="公式" name="conditions">
              {showAmis && <div>
                {amisRender(
                  getSchemaTpl('formulaControl', {
                    value: formulaValue,
                    variables: formuVariables,
                    onChange: function(e) {
                      formulaChange(e);
                    },
                    placeholder: '右侧配置表达式',
                    formulaEchoVal: false,
                    advancedFeature: advancedFeature
                  }),
                  {},
                  {
                    theme: amisEnv.theme
                  }
                )}
              </div>}
            </Form.Item>}
            {/*{conditionTypeValue == 1 &&*/}
            {/*  amisRender(*/}
            {/*    {*/}
            {/*      type: 'service',*/}
            {/*      body: [*/}
            {/*        {*/}
            {/*          type: 'condition-builder',*/}
            {/*          label: ' ',*/}
            {/*          name: 'filterCondition',*/}
            {/*          fields: updateFieldsOption,*/}
            {/*          value: modelFilterFields,*/}
            {/*          onChange: (value: any) => {*/}
            {/*            objectKeyModelChange(value);*/}
            {/*          }*/}
            {/*        }*/}
            {/*      ]*/}
            {/*    },*/}
            {/*    {},*/}
            {/*    {*/}
            {/*      fetcher: service*/}
            {/*    }*/}
            {/*  )*/}
            {/*}*/}
          </div>
          {conditionType === condition_type.script && (
            <>
              <Form.Item label="脚本语言" name="language">
                <Input placeholder={'请输入'} onChange={updateFlowCondition} />
              </Form.Item>
              <Form.Item name="scriptType" label="脚本类型">
                <Select placeholder={'请选择'} onChange={updateFlowCondition}>
                  {script_type_options.map((e) => {
                    return (
                      <Select.Option key={e.value} value={e.value}>
                        {e.name}
                      </Select.Option>
                    );
                  })}
                </Select>
              </Form.Item>
              {scriptType === script_type.inlineScript && (
                <Form.Item label="脚本" name="script">
                  <Input
                    placeholder={'请输入'}
                    onChange={updateFlowCondition}
                  />
                </Form.Item>
              )}
              {scriptType === script_type.externalResource && (
                <Form.Item label="资源地址" name="resource">
                  <Input
                    placeholder={'请输入'}
                    onChange={updateFlowCondition}
                  />
                </Form.Item>
              )}
            </>
          )}
        </>
      );
    }
  }

  return (
    <>
      <Form form={form} labelCol={{span: 5}} wrapperCol={{span: 18}}>
        <Form.Item name="flowType" label="流转类型">
          <Select
            placeholder={'请选择'}
            onChange={(value) => {
              updateFlowType(value);
            }}
          >
            {flow_type_options.map((e) => {
              return (
                <Select.Option key={e.value} value={e.value}>
                  {e.name}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
        {renderConditionFlowForm()}
      </Form>
    </>
  );
}
