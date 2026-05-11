import React, {useEffect, useRef, useState, forwardRef} from 'react';
import {EllipsisOutlined} from '@ant-design/icons';
import {
  Row,
  Col,
  Input,
  Button,
  Form,
  Switch,
  Select,
  Modal,
  Space,
  Tree,
  Tooltip
} from 'antd';
import {getSchemaTpl} from 'amis-editor';
import {getEnvVar} from '@/api/envVar';
import {useAppDispatch, useAppSelector} from '@/redux/hook/hooks';
import {FormulaPicker, JSONSchemaEditor, ConditionBuilder} from 'amis-ui';
import {render as amisRender, FormItem, Icon} from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import {getDataSource, getTableList} from '@/api/antv';
import {filteredData} from '@/components/AntvModel/Content/components/conditionBuilder';
import '@/components/AntvModel/Content/components/index.css';
import {getDataPropsAsOptions} from '@/components/AntvModel/Content/components/DataScope';
import {typeConfig} from '@/components/AntvModel/Content/components/config';
import {service} from '@/utils/request';
import {advancedFeature} from '@/utils/env'

// 开始组件
const PorcessStartModule = forwardRef(function PorcessStartModule(props, ref) {
  const entityList = useAppSelector(state => state.bpmn.entityList);
  const cronRef = useRef();
  console.log(props, '开始组件props');
  const {TextArea, Search} = Input;
  const needValue = useAppSelector(state => state.antvModule.rightNodeData);
  const dispatch = useAppDispatch();
  console.log(needValue, '开始组件needValue');
  const [form] = Form.useForm<{}>();
  const [forms] = Form.useForm<{}>();
  const [editForms] = Form.useForm<{}>();
  const formuVariablesValue = useRef();
  const [arrayEditData,setArrayEditData] = useState()
  const [optionAll,setOptionAll] = useState([])
  // 树形控件 数据
  useEffect(() => {
    setIsSelect(false);
    console.log(needValue, '开始组件11111');
    let arr = [];
    getDataSource().then(res => {
      // console.log(res, 'sssssssssssssssssss');
      res.data.data.links.forEach(item => {
        getTableList(item.queryKey).then(lit => {
          // console.log(lit, 'litlitlitlitlitlit');
          arr.push({
            ...item,
            title: item.label,
            children: lit.data.data
          });
          // console.log(arr, 'arrarrarrarrarr');
          setDeptOptions(arr);
          setAllOptions(arr);
        });
      });
    });
      setOptionAll(entityList.data.options)
    if (props.businessObject.processInstanceStartVariables) {
      let fgie = JSON.parse(props.businessObject.processInstanceStartVariables);
      let inputList = [];
      let proData = [];
      for (let k in fgie.properties) {
        // console.log(k, '循环对象');
        console.log(fgie.properties[k], 'fgie[k]');
        let inpu = {...fgie.properties[k]};
        if (inpu.type == 'string') {
          inpu.inputText = '字符串';
        } else if (inpu.type == 'number') {
          inpu.inputText = '数字';
        } else if (inpu.type == 'boolean') {
          inpu.inputText = '布尔';
        } else if (inpu.type == 'user') {
          inpu.inputText =  '人员'
        } else if (inpu.type == 'users') {
          inpu.inputText = '人员多选'
        } else if (inpu.type == 'object') {
          if (inpu.entity) {
            if (JSON.stringify(inpu.entity) != '{}') {
              inpu.inputText = '实体对象';
              for (let s in inpu.properties) {
                proData.push({
                  ...inpu.properties[s],
                  value: inpu.properties[s].title
                });
              }
              console.log(proData, 'proDataproData');
              // inpu.properties = proData;
            }
          } else if (inpu.properties) {
            inpu.inputText = '对象';
          } else {
            console.log('进入');
            inpu.inputText = '对象';
          }
        } else if (inpu.type == 'entity') {
          inpu.inputText = '实体对象';
        } else if (inpu.type == 'objects') {
          inpu.inputText = '对象';
          // inpu.properties = propertiesData;
        } else if (inpu.type == 'array') {
          if (inpu.arrayType == 'string') {
            inpu.inputText = '字符串数组';
          } else if (inpu.arrayType == 'number') {
            inpu.inputText = '数字数组';
          } else if (inpu.arrayType == 'boolean') {
            inpu.inputText = '布尔数组';
          } else if (inpu.arrayType == 'user') {
            inpu.inputText =  '人员数组'
          } else if (inpu.arrayType == 'users') {
            inpu.inputText = '人员多选数组'
          } else if (inpu.arrayType == 'object') {
            if (inpu.entity) {
              inpu.inputText = '实体对象数组';
            } else {
              inpu.inputText = '对象数组';
            }
          } else if (inpu.arrayType == 'objects') {
            inpu.inputText = '对象数组';
          } else if (inpu.arrayType == 'entity') {
            inpu.inputText = '实体对象数组';
          }
        }
        if(inpu.properties && !inpu.properties.properties){
          inpu.properties = {
            type:'object',
            properties:inpu.properties,
            required:inpu.required
          }
        }
        if(inpu.required && inpu.required.length>0){
          inpu.required = true
        }
        inputList.push({...inpu, key: inpu.title});
      }
      console.log(fgie,'fgie')
      if (fgie.required && fgie.required.length > 0) {
        inputList = inputList.map(sws => {
          let required = false;
          fgie.required.forEach(sj => {
            if (sws.title == sj) {
              required = true;
            }
          });
          return {...sws, required};
        });
      } else if (fgie.required && fgie.required.length == 0) {
        inputList = inputList.map(sws => {
          return {...sws, required: false};
        });
      } else {
        inputList = inputList.map(sws => {
          return {...sws, required: false};
        });
      }
      console.log(inputList, 'inputList');
      inputList = inputList.sort((a, b) => a.title.localeCompare(b.title))
      setFieldData(inputList);
    } else {
      setFieldData([]);
    }
  }, [needValue]);
  // 是否选择实体
  const [isSelect, setIsSelect] = useState(false);
  // 实体选择 弹出层显示隐藏
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  // 实体选择 实体模型选择之后字段
  const [modelProperties, setModelProperties] = useState({});
  // 判断 流程参数 服务变量
  const [serveType, setServeType] = useState('');
  // 流程参数数组
  const [fieldData, setFieldData] = useState();
  // 节点流程参数弹出框显示隐藏
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState('');
  const [arrayValue, setArrayValue] = useState(false);
  const [requiredValue, setRequiredValue] = useState(false);
  const [propertiesValue, setPropertiesValue] = useState();
  const [itemIndex, setItemIndex] = useState();
  // 默认值
  const [defaultValue, setDefault] = useState();
  // 流程参数 添加变量 数据类型
  const [typeValue, setTypeValue] = useState('string');
  // 服务人餐 添加变量 默认值公式输入框类型
  // const formula = useRef('text');
  const [formula, setFormula] = useState('string');
  // 服务人餐 添加变量 展示成员字段数据
  const [showPeopleValue, setShowPeopleValue] = useState(false);
  // 默认值
  const [defaultData, setDefaultData] = useState('');
  // 触发规则 请选择实体
  const [cascaderOptions, setCascaderOptions] = useState([]);
  // 触发模式 间隔触发
  const [startTime, setStartTime] = useState();
  const [endTime, setEndTime] = useState();
  const [intervalInput, setIntervalInput] = useState(1);
  // 触发模式 周期触发
  const [periodicStartTime, setPeriodicStartTime] = useState();
  const [periodicEndTime, setPeriodicEndTime] = useState();
  const [periodicInput, setPeriodicInput] = useState(1);
  // 重复时间
  const [periodicTimeValue, setPeriodicTimeValue] = useState();
  // 周重复时间
  const [periodicWeek, setPeriodicWeek] = useState();

  // 过滤器 更新字段
  const [updateFieldsValue, setUpdateFieldsValue] = useState([]);
  // 添加变量 数据类型为实体对象 实体模型 输入框显示
  const [modelValue, setModelValue] = useState({});
  const modelValueData = useRef({});
  // 过滤器 简单类型列表数据
  const [filterFields, setFilterFields] = useState({});
  const [filterFieldss, setFilterFieldss] = useState([]);
  // 筛选条件 复杂类型弹框数据
  const [modelFilterFields, setModelFilterFields] = useState({});
  // 过滤器
  const [radioValue, setRadioValue] = useState('normal');
  // 筛选条件列表集合
  const [builderData, setBuilderData] = useState([]);
  // 实体模型选择后的字段列表
  const [inputData, setInputData] = useState([]);
  // 触发规则 请选择实体 默认值
  const [modelEventValue, setModelEventValue] = useState();
  // 过滤器 复杂模式 条件格式 弹出层 显示隐藏
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 触发规则 触发模式
  const [intervalValue, setIntervalValue] = useState('interval');
  // 间隔设置
  const [interval, setInterval] = useState(['minute', '5']);
  // 触发规则 触发次数
  const [timesTypeValue, setTimesTypeValue] = useState('custom');
  // 触发规则 触发次数
  const [periodicTimesTypeValue, setPeriodicTimesTypeValue] =
    useState('custom');
  // 触发规则 周期触发 触发周期
  const [periodicValue, setPeriodicValue] = useState('minute');
  // 触发规则 周期触发 每周 重复日期数据
  const [periodicDay, setPeriodicDay] = useState([]);
  // 触发规则 周期触发 每周 重复日期数据
  const [periodicMonth, setPeriodicMonth] = useState([]);
  // 过滤器 更新字段数据
  // const updateFieldsOption = useRef([]);
  const [updateFieldsOption, setUpdateFieldsOption] = useState([]);
  const [updateFieldsOptions, setUpdateFieldsOptions] = useState([]);
  const [timeCycleData, setTimeCycleData] = useState<any>('');
  const formuVariables = useAppSelector(
    state => state.antvModule.formuVariables
  );
  const formuVariable = useAppSelector(state => state.antvModule.formuVariable);
  // 树状图
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [copyTree, setCopyTree] = useState<any>([]);
  const [deptOptions, setDeptOptions] = useState<any>([]);
  const [allOptions, setAllOptions] = useState<any>([]);
  const [treeClickData, setTreeClickData] = useState(); // 点击某个树数据
  // 备份
  const [copyExpandedKeys, setCopyExpandedKeys] = useState();
  useEffect(() => {
    // 环境变量
    getEnvVar().then(envItem => {
      formuVariablesValue.current = formuVariables.filter(res => {
        return (
          res.label != '循环上下文' &&
          res.label != '服务入参' &&
          res.label != '服务变量'
        );
      });
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
      console.log(huanArr, 'arrarrarrarrarrarr');
      if(huanArr.children.length>0) {
        formuVariablesValue.current.push(huanArr);
      }
    });
  }, [formuVariables]);
  function handleData(data) {
    let item = [];
    data.map((list, i) => {
      let newData = {...list};
      newData.value = list.id;
      newData.key = list.id;
      newData.title = list.name;
      newData.children = list.children ? handleData(list.children) : []; // 如果还有子集，就再次调用自己
      item.push(newData);
    });
    return item;
  }
  const onExpand = (newExpandedKeys: React.Key[]) => {
    console.log(newExpandedKeys, 'newExpandedKeysnewExpandedKeys');
    setExpandedKeys(newExpandedKeys);
  };
  // 树形点击
  function handleNodeClick(e, data) {
    console.log(e, 'eeeeeeeeeeeeeeee');
    console.log(data, 'adadadadadadadada');
    console.log(e[0], '11111111');
    // forms.setFieldValue('model', e[0]);
    setTreeClickData(data.node.data);
  }
  const renderTreeNodes = data => {
    // console.log(data, 'datadatadata');
    if (data.length == 0) {
      return;
    }
    // console.log(data, '树状图数据');
    return data.map(item => {
      // console.log(item, 'item');
      // console.log(searchValue, 'searchValue');
      let index;
      let beforeStr;
      let afterStr;
      if (item.title) {
        index = item.title.indexOf(searchValue);
        beforeStr = item.title.substr(0, index);
        afterStr = item.title.substr(index + searchValue.length);
      } else {
        index = item.code.indexOf(searchValue);
        beforeStr = item.code.substr(0, index);
        afterStr = item.code.substr(index + searchValue.length);
      }
      const title =
        index > -1 ? (
          <span>
            {beforeStr}
            <span style={{color: 'red'}}>{searchValue}</span>
            {afterStr}
          </span>
        ) : (
          <span>{item.title}</span>
        );
      if (item.children && item.children.length > 0) {
        return (
          <Tree.TreeNode key={item.key} title={title} disabled={true}>
            {renderTreeNodes(item.children)}
          </Tree.TreeNode>
        );
      }
      // console.log(item,'11111111111111111')
      return <Tree.TreeNode key={item.key} title={title} data={item} />;
    });
  };
  const arrayTreeFilter = (data, predicate, filterText) => {
    const nodes = data;
    // 如果已经没有节点了，结束递归
    if (!(nodes && nodes.length)) {
      return;
    }
    const newChildren = [];
    for (const node of nodes) {
      if (predicate(node, filterText)) {
        // 如果自己（节点）符合条件，直接加入到新的节点集
        newChildren.push(node);
        // 并接着处理其 children,（因为父节点符合，子节点一定要在，所以这一步就不递归了）
        node.children = arrayTreeFilter(node.children, predicate, filterText);
      } else {
        // 如果自己不符合条件，需要根据子集来判断它是否将其加入新节点集
        // 根据递归调用 arrayTreeFilter() 的返回值来判断
        const subs = arrayTreeFilter(node.children, predicate, filterText);
        // 以下两个条件任何一个成立，当前节点都应该加入到新子节点集中
        // 1. 子孙节点中存在符合条件的，即 subs 数组中有值
        // 2. 自己本身符合条件
        if ((subs && subs.length) || predicate(node, filterText)) {
          node.children = subs;
          newChildren.push(node);
        }
      }
    }
    return newChildren;
  };
  const expandedKeysFun = treeData => {
    //展开 key函数
    if (treeData && treeData.length == 0) {
      return [];
    }
    console.log(treeData, '111111');
    let arr = [];
    const expandedKeysFn = treeData => {
      treeData.map((item, index) => {
        arr.push(item.key); //如果数据量小放这里可以
        if (item.children && item.children.length > 0) {
          //arr.push(item.key); //如果数据量大放这里可以
          expandedKeysFn(item.children);
        }
      });
    };
    expandedKeysFn(treeData);
    return arr;
  };
  // 点击按钮 显示实体选择弹出框
  const newClick = () => {
    setEntityModalOpen(true);
  };
  const filterFn = (data, filterText) => {
    //过滤函数
    if (!filterText) {
      return true;
    }
    return new RegExp(filterText, 'i').test(data.title); //我是一title过滤 ，你可以根据自己需求改动
  };
  // 实体选择 输入框数据变化
  const entityChange = e => {
    console.log(e, '实体选择 输入框数据变化');
    const {value} = e.target;
    if (value == '') {
      //为空时要回到最初 的树节点
      setDeptOptions(JSON.parse(copyTree));
      setExpandedKeys(copyExpandedKeys);
    } else {
      let res = arrayTreeFilter(JSON.parse(copyTree), filterFn, value);
      console.log(res, 'resresresrees');
      let expkey = expandedKeysFun(res);
      setDeptOptions(res);
      setExpandedKeys(expkey);
    }
  };
  // 实体选择 点击确认
  const entityHandleOk = () => {
    allOptions.forEach(element => {
      if (element.queryKey == treeClickData.dsKey) {
        setModelValue({
          label: element.name + '/' + treeClickData.name,
          value: element.code + '.' + treeClickData.code
        });
        modelValueData.current = {
          label: element.name + '/' + treeClickData.name,
          value: element.code + '.' + treeClickData.code
        }
        optionAll.forEach(ress => {
            ress.children.forEach(item => {
              if (item.form.queryKey == treeClickData.queryKey) {
                console.log(item, 'itemitemitemitemitem');
                let arr = item.form.fields;
                let required = [];
                let properties = {};
                let nedData = [];
                arr.forEach(element => {
                  if (
                    // !element.nullable &&
                    !element.foreignKeyFlag &&
                    element.type != 'relation' &&
                    !element.isPrimaryKey &&
                    !element.isDeleteDate &&
                    !element.isTenantCode &&
                    element.type != 'formula' &&
                    !element.isCreateDate &&
                    !element.isUpdateDate
                  ) {
                    if(!element.isNullable) {
                      required.push(element.key);
                    }
                  }
                  if (
                    // !element.nullable &&
                    !element.foreignKeyFlag &&
                    element.type != 'relation' &&
                    !element.isPrimaryKey &&
                    !element.isDeleteDate &&
                    !element.isTenantCode &&
                    element.type != 'formula' &&
                    !element.isCreateDate &&
                    !element.isUpdateDate
                  ) {
                    nedData.push(element);
                  }
                  if (
                    // !element.foreignKeyFlag &&
                    element.type != 'relation' &&
                    // !element.isPrimaryKey &&
                    !element.isDeleteDate &&
                    !element.isTenantCode &&
                    element.type != 'formula' &&
                    !element.isCreateDate &&
                    !element.isUpdateDate
                  ) {
                    properties[element.key] = {
                      type: element.type,
                      key: element.key,
                      title: element.name
                    };
                  }
                });
                let field = builderChange(nedData);
                // let field = builderChange(nedData);
                console.log(field, 'fieldfieldfield');
                console.log(nedData, 'nedDatanedDatanedData');
                setInputData(nedData);
                setIsSelect(true);
                setModelProperties({
                  required: required,
                  properties: properties
                });
              }
            });
          });
      }
    });
    setEntityModalOpen(false);
  };
  // 实体选择 点击取消
  const entityHandleCancel = () => {
    setEntityModalOpen(false);
  };

  // 默认值 数据变化
  const defaultFirm = e => {
    console.log(e, '默认值 数据变化');
    setDefaultData(e);
    setDefault(e);
  };
  // 描述 数据变化
  const describeChange = e => {
    console.log(e, '描述 数据变化');
  };
  // 是否数组 数据变化
  const arrayChange = e => {
    console.log(e, '是否数组 数据变化');
    setArrayValue(e);
    setShowFunc(false);
    setTimeout(() => {
      if(e && formula == 'boolean'){
        setDefault('')
        setDefaultData('')
      }else if(!e && formula == 'boolean'){
        setDefault(true)
        setDefaultData(true)
      }
      setShowFunc(true);
    }, 100);
  };
  // 是否必填 数据变化
  const requiredChange = e => {
    console.log(e, '是否必填 数据变化');
    setRequiredValue(e);
  };
  // 获取树形数据
  const getTreeData = () =>{
    console.log(modelValue,'modelValue')
    console.log(allOptions,'allOptions')
    allOptions.forEach(element => {
      if (element.code == modelValueData.current.value.split('.')[0]) {
      // if (element.code == modelValue.value.split('.')[0]) {
          optionAll.forEach(ress => {
            if(ress.value == modelValueData.current.value.split('.')[0]){
            // if(ress.value == modelValue.value.split('.')[0]){
              ress.children.forEach(item => {
                if (item.value == modelValueData.current.value) {
                // if (item.value == modelValue.value.split('.')[1]) {
                // if (item.queryKey == treeClickData.queryKey) {
                  console.log(item, 'itemitemitemitemitem');
                  let arr = item.form.fields;
                  let required = [];
                  let properties = {};
                  let nedData = [];
                  arr.forEach(element => {
                    if (
                      !element.foreignKeyFlag &&
                      element.type != 'relation' &&
                      !element.isPrimaryKey &&
                      !element.isDeleteDate &&
                      !element.isTenantCode &&
                      element.type != 'formula' &&
                      !element.isCreateDate &&
                      !element.isUpdateDate
                    ) {
                      required.push(element.key);
                    }
                    if (
                      !element.foreignKeyFlag &&
                      element.type != 'relation' &&
                      !element.isPrimaryKey &&
                      !element.isDeleteDate &&
                      !element.isTenantCode &&
                      element.type != 'formula' &&
                      !element.isCreateDate &&
                      !element.isUpdateDate
                    ) {
                      nedData.push(element);
                    }
                    if (
                      element.type != 'relation' &&
                      !element.isDeleteDate &&
                      !element.isTenantCode &&
                      element.type != 'formula' &&
                      !element.isCreateDate &&
                      !element.isUpdateDate
                    ) {
                      properties[element.key] = {
                        type: element.type,
                        key: element.key,
                        title: element.name
                      };
                    }
                  });
                  let field = builderChange(nedData);
                  console.log(field, 'fieldfieldfield');
                  console.log(nedData, 'nedDatanedDatanedData');
                  setInputData(nedData);
                  setIsSelect(true);
                  setModelProperties({
                    required: required,
                    properties: properties
                  });
                }
              });
            }
          });
      }
    });
  }
  // 获取字段列表
  const getFieldList = (e) => {
    let nedData:any = []
    let as = 'entity' in e
      ? e?.entity.value.includes('.')
        ? e.entity.value.split('.')
        : []
      : []
    entityList.data.options.forEach(item => {
      if (item.value == as[0]) {
        item.children.forEach(items => {
          if (items.value == as[0]+'.'+as[1]) {
            items.form.fields.forEach(element => {
              if (
                !element.foreignKeyFlag &&
                element.type != 'relation' &&
                !element.isCreateDate &&
                !element.isCreateUser &&
                !element.isDeleteDate &&
                !element.isDeleteFlag &&
                !element.isDeleteUser &&
                !element.isUpdateDate &&
                !element.isUpdateUser &&
                !element.isTenantCode &&
                element.type != 'formula'
              ) {
                nedData.push(element);
              }
            })
          }
        })
      }
    })
    console.log(nedData,'nedDatanedData')
    setInputData(nedData)
  }
  // 编辑变量
  const editClick = (e, index) => {
    console.log(index, '数组数据index');
    console.log(e, '右侧 编辑变量');
    console.log(e.entity, 'e.entity');
    forms.setFieldValue('title', e.title);
    setArrayEditData(e)
    setFormula(e.type);
    setShowPeopleValue(false);
    setItemIndex(index);
    setEditModalOpen(true);
    setEditType('input');
    setDefaultData(e.default);
    setPropertiesValue(undefined);
    setPropertiesData(null);
    if (!e.array) {
      editForms.setFieldValue('array', false);
    }
    if (e.array) {
      editForms.setFieldValue('array', true);
    }
    if (typeof e.required == 'object') {
      if (e.required && e.required.length == 0) {
        editForms.setFieldValue('required', false);
        setRequiredValue(false)
      } else {
        editForms.setFieldValue('required', true);
        setRequiredValue(true)
      }
    } else {
      editForms.setFieldValue('required', e.required ? e.required : false);
      setRequiredValue(e.required ? e.required : false)
    }
    setArrayValue(e.array);
    if (e.type == 'array') {
      editForms.setFieldValue('array', true);
      setArrayValue(true);
      if (e.arrayType == 'entity') {
        editForms.setFieldValue('type', 'object');
        setTypeValue('object');
        setModelValue({
          label: e.entity.label,
          value: e.entity.value
        });
        modelValueData.current = {
          label: e.entity.label,
          value: e.entity.value
        }
        getTreeData()
      } else {
        editForms.setFieldValue('type', e.arrayType);
        editForms.setFieldValue('array', true);
        if (e.type == 'object' && !e.properties) {
          setTypeValue('objects');
          editForms.setFieldValue('type', 'objects');
        } else if (e.type == 'array' && e.inputText == '对象数组') {
          setTypeValue('objects');
          editForms.setFieldValue('type', 'objects');
          setPropertiesValue(
            e.items
              ? e.items.properties
                ? e.items
                : undefined
              : e.properties
              ? e.properties.properties
                ? e
                : undefined
              : undefined
          );
          setPropertiesData(e.items);
        } else {
          setTypeValue(e.arrayType);
          editForms.setFieldValue('type', e.arrayType);
        }
      }
    } else {
      if (e.type == 'object' && e.properties && !e.entity) {
        console.log('进入');
        if (e.inputText == '实体对象') {
          setTypeValue('object');
          editForms.setFieldValue('type', e.type);
          setModelValue({
            label: e.entity.label,
            value: e.entity.value
          });
        modelValueData.current = {
          label: e.entity.label,
          value: e.entity.value
        }
          setModelProperties(e.properties)
          getTreeData()
        } else {
          editForms.setFieldValue('type', 'objects');
          setTypeValue('objects');
          setPropertiesData(e.properties);
          if (e.properties) {
            if (e.properties.properties) {
              setPropertiesValue(e.properties);
            } else {
              setPropertiesValue({
                properties: e.properties,
                type: 'object',
                required: e.required
              });
            }
          }
        }
      } else if (e.type == 'objects') {
        console.log('slandalsdnjklasdnalkjs');
        editForms.setFieldValue('type', 'objects');
        setTypeValue('objects');
        setPropertiesData(e.properties);
        if (e.required) {
          if (e.properties) {
            if (e.properties.properties) {
              setPropertiesValue(e.properties);
            } else {
              setPropertiesValue({
                properties: e.properties,
                type: 'object',
                required: []
              });
            }
          }
        } else {
          if (e.properties) {
            if (e.properties.properties) {
              setPropertiesValue(e.properties);
            } else {
              setPropertiesValue({
                properties: e.properties,
                type: 'object',
                required: []
              });
            }
          }
        }
      } else if (e.type == 'object' && e.properties && e.entity) {
        console.log('进入2');
        setTypeValue('object');
        editForms.setFieldValue('type', e.type);
        setModelValue({
          label: e.entity.label,
          value: e.entity.value
        });
        modelValueData.current = {
          label: e.entity.label,
          value: e.entity.value
        }
        getFieldList(e)
        setModelProperties(e.properties)
        getTreeData()
      } else if (e.type == 'object' && !e.properties) {
        editForms.setFieldValue('type', 'objects');
        setTypeValue('objects');
        if (e.required) {
          if (e.properties) {
            if (e.properties.properties) {
              setPropertiesValue(e.properties);
            } else {
              setPropertiesValue({
                properties: e.properties,
                type: 'object',
                required: []
              });
            }
          }
        } else {
          setPropertiesValue(e.properties);
        }
        getFieldList(e)
      } else {
        console.log('进入2');
        editForms.setFieldValue('type', e.type);
        setTypeValue(e.type);
      }
    }
    editForms.setFieldValue('title', e.title);
    editForms.setFieldValue('describe', e.describe);
    setDefault(e.default);
    console.log(e.data, 'aaaaaaaaaaaaa');
  };
  // 删除变量
  const deleteClick = e => {
    console.log(e, '右侧 删除变量');
    console.log(fieldData, 'fieldData');
    let data = fieldData.filter(res => res.title != e.title);
    data = data.sort((a, b) => a.title.localeCompare(b.title))
    setFieldData(data);
  };
  //   流程参数 添加变量
  const addField = type => {
    setPropertiesData(undefined);
    setDefaultData('');
    setDefault('');
    setShowPeopleValue(false);
    let a = handleData(allOptions);
    setDeptOptions([...a]);
    let cp = JSON.stringify([...a]);
    setCopyTree(cp);
    setCopyExpandedKeys(a);
    if (type == 'inputParams') {
      setServeType('inputParams');
    } else {
      setServeType('variableParams');
    }
    setAddModalOpen(true);
    forms.resetFields();
    forms.setFieldValue('type', 'string');
    setTypeValue('string');
    setFormula('string');
    setArrayValue(false);
    setModelValue({
      label: '',
      value: ''
    });
    modelValueData.current = {
      label: '',
      value: ''
    }
  };
  //   流程参数 添加变量 弹出框关闭取消
  const addHandleCancel = () => {
    setAddModalOpen(false);
  };
  const [showFunc, setShowFunc] = useState(true);
  //   流程参数 添加变量 弹出框 数据类型数据变化
  const typeChange = e => {
    console.log(e, '流程参数 添加变量 弹出框 数据类型数据变化');
    setTypeValue(e);
    setModelValue({
      label: '',
      value: ''
    });
    modelValueData.current = {
      label: '',
      value: ''
    }
    setShowFunc(false);
    setTimeout(() => {
      setShowFunc(true);
    }, 100);
    if (e == 'number') {
      // formula.current = 'number'
      setFormula('number');
      setDefault('');
      setDefaultData('');
    } else if (e == 'boolean') {
      // formula.current = 'boolean'
      setFormula('boolean');
      setDefault(true);
      setDefaultData(true);
    } else {
      // formula.current = 'text'
      setFormula(e);
      setDefault('');
      setDefaultData('');
      setPropertiesValue(undefined);
    }
  };
  // 流程参数 变量名称数据变化
  const titleChange = e => {
    // console.log(e, '流程参数 变量名称数据变化');
  };
  // 流程参数 添加变量弹出层 展示成员字段 数据变化
  const showPeopleChange = e => {
    console.log(e, '流程参数 添加变量弹出层 展示成员字段 数据变化');
    setShowPeopleValue(e);
  };
  // 添加变量 成员字段数据变化
  const [propertiesData, setPropertiesData] = useState();
  const getType = e => {
    let obj = {
      text: '文本',
      textarea: '文本',
      int: '数字',
      float: '数字',
      money: '数字',
      parent: '数字',
      boolean: '布尔',
      date: '文本',
      time: '文本',
      datetime: '文本',
      enum: '文本',
      user: '文本',
      TEXT: '文本',
      TEXTAREA: '文本',
      INT: '数字',
      FLOAT: '数字',
      MONEY: '数字',
      PARENT: '数字',
      BOOLEAN: '布尔',
      DATE: '文本',
      TIME: '文本',
      DATETIME: '文本',
      ENUM: '文本',
      USER: '文本',
      PASSWORD: '文本',
      RICH_TEXT: '文本',
      relation: '文本'
    };
    console.log(e[obj], 'e[obj]');
    return obj[e];
  };
  // 过滤器 复杂模式 条件个数 弹出层
  const inputClick = () => {
    setIsModalOpen(true);
  };
  // 过滤器 复杂模式 条件个数 弹出层取消
  const handleCancel = () => {
    console.log('高级设置取消');
    setIsModalOpen(false);
  };
  const dateOnOk = value => {
    console.log(value, 'dateOnOk');
  };
  // 判断公式编辑器 数据类型
  const setDataType = e => {
    console.log(e, 'eeeeeeeeeeeee');
    let arr: any = [];
    e.forEach(element => {
      if (element.array) {
        arr.push({...element, tag: '数组'});
      } else {
        if (element.type == 'string') {
          arr.push({...element, tag: '文本'});
        } else if (element.type == 'text') {
          arr.push({...element, tag: '文本'});
        } else if (element.type == 'number') {
          arr.push({...element, tag: '数字'});
        } else if (element.type == 'boolean') {
          arr.push({...element, tag: '布尔'});
        } else if (element.type == 'object') {
          arr.push({...element, tag: '对象'});
        } else if (element.type == 'objects') {
          arr.push({...element, tag: '对象'});
        } else if (element.type == 'array') {
          arr.push({...element, tag: '数组'});
        } else if (element.type == 'rich-text') {
          arr.push({...element, tag: '富文本'});
        }
      }
    });
    return arr;
  };
  // 判断增加数据类型
  const changeDataType = e => {
    let arr: any = [];
    e.forEach(element => {
      if (element.type == 'text') {
        arr.push({
          ...element,
          inputText: '字符串',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'string',
          required: !element.isNullable
        });
      } else if (element.type == 'textarea') {
        arr.push({
          ...element,
          inputText: '字符串',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'string',
          required: !element.isNullable
        });
      } else if (element.type == 'int') {
        arr.push({
          ...element,
          inputText: '数字',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'number',
          required: !element.isNullable
        });
      } else if (element.type == 'float') {
        arr.push({
          ...element,
          inputText: '数字',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'number',
          required: !element.isNullable
        });
      } else if (element.type == 'rich-text') {
        arr.push({
          ...element,
          inputText: '富文本',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'rich-text',
          required: !element.isNullable
        });
      } else if (element.type == 'money') {
        arr.push({
          ...element,
          inputText: '数字',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'number',
          required: !element.isNullable
        });
      } else if (element.type == 'enum') {
        arr.push({
          ...element,
          inputText: '字符串',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'string',
          required: !element.isNullable
        });
      } else if (element.type == 'boolean') {
        arr.push({
          ...element,
          inputText: '布尔',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'boolean',
          required: !element.isNullable
        });
      } else if (element.type == 'date') {
        arr.push({
          ...element,
          inputText: '字符串',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'string',
          required: !element.isNullable
        });
      } else if (element.type == 'time') {
        arr.push({
          ...element,
          inputText: '时间',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'time',
          required: !element.isNullable
        });
      } else if (element.type == 'datetime') {
        arr.push({
          ...element,
          inputText: '字符串',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'string',
          required: !element.isNullable
        });
      } else if (element.type == 'date-range') {
        arr.push({
          ...element,
          inputText: '字符串',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'string',
          required: !element.isNullable
        });
      } else if (element.type == 'attachment') {
        arr.push({
          ...element,
          inputText: '附件',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'attachment',
          required: !element.isNullable
        });
      } else if (element.type == 'image') {
        arr.push({
          ...element,
          inputText: '图片',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'image',
          required: !element.isNullable
        });
      } else if (element.type == 'user') {
        arr.push({
          ...element,
          inputText: '人员',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'user',
          required: !element.isNullable
        });
      } else if (element.type == 'users') {
        arr.push({
          ...element,
          inputText: '人员多选',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'users',
          required: !element.isNullable
        });
      } else if (element.type == 'department') {
        arr.push({
          ...element,
          inputText: '字符串',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'string',
          required: !element.isNullable
        });
      } else if (element.type == 'password') {
        arr.push({
          ...element,
          inputText: '字符串',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'string',
          required: !element.isNullable
        });
      } else if (element.type == 'ciphertext') {
        arr.push({
          ...element,
          inputText: '字符串',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'string',
          required: !element.isNullable
        });
      } else if (element.type == 'json') {
        arr.push({
          ...element,
          inputText: 'JSON',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'json',
          required: !element.isNullable
        });
      } else if (element.type == 'formula') {
        arr.push({
          ...element,
          inputText: '公式',
          title: element.name,
          key: element.code ? element.code : element.key,
          type: 'string',
          required: !element.isNullable
        });
      }
    });
    return arr;
  };
  // 添加变量确认
  const addHandleOk = () => {
    console.log(showPeopleValue, '是否展示成员字段');
    console.log('添加变量确认');
    console.log(forms.getFieldValue('type'), 'type');
    console.log(forms.getFieldValue('title'), 'title');
    console.log(forms.getFieldValue('array'), 'array');
    console.log(forms.getFieldValue('required'), 'required');
    console.log(forms.getFieldValue('default'), 'default');
    console.log(defaultData, 'defaultData');
    console.log(modelValue, 'modelValue 数据类型 是 实体对象时');
    console.log(modelProperties, '选择了实体对象 的 实体模型 后保存的值');
    console.log(forms.getFieldValue('describe'), 'describe');
    forms
      .validateFields()
      .then(() => {
        console.log('校验成功');
        let formData = {
          type: forms.getFieldValue('type'),
          title: forms.getFieldValue('title'),
          key: forms.getFieldValue('title'),
          array: forms.getFieldValue('array'),
          required: forms.getFieldValue('required'),
          requireds: forms.getFieldValue('required'),
          default: defaultData,
          describe: forms.getFieldValue('describe'),
          inputText: ''
        };
        let objectData: any = [];
        // if (serveType == 'inputParams') {
          console.log(formData, 'formDataformDataformDataformData');
          console.log(fieldData, 'fieldData');
          let arr = fieldData.filter(item => {
            if (item.key != formData.key) {
              return item;
            }
          });
          if (formData.type == 'string') {
            formData.inputText = '字符串';
            if (formData.array) {
              formData.inputText = '字符串数组';
            }
          } else if (formData.type == 'number') {
            formData.inputText = '数字';
            if (formData.array) {
              formData.inputText = '数字数组';
            }
          } else if (formData.type == 'boolean') {
            formData.inputText = '布尔';
            if (formData.array) {
              formData.inputText = '布尔数组';
            }
          } else if (formData.type == 'user') {
            formData.inputText = '人员';
            if (formData.array) {
              formData.inputText = '人员数组';
            }
          } else if (formData.type == 'users') {
            formData.inputText = '人员多选';
            if (formData.array) {
              formData.inputText = '人员多选数组';
            }
          } else if (formData.type == 'object') {
            formData.inputText = '实体对象';
            if (formData.array) {
              formData.inputText = '实体对象数组';
            }
            formData.entity = {
              label: modelValue.label,
              value: modelValue.value
            };
            if (showPeopleValue) {
              objectData = changeDataType(inputData);
            }
            formData.properties = inputData;
          } else if (formData.type == 'objects') {
            formData.inputText = '对象';
            formData.types = 'objects';
            if (formData.array) {
              formData.inputText = '对象数组';
            }
            formData.properties = propertiesData;
          }
          if (objectData.length == 0) {
            console.log(objectData, 'objectData');
            arr.push(formData);
          } else {
            console.log(objectData, 'objectData');
            console.log(arr, 'arr');
            if (arr.length > 0) {
              let arrs = objectData.filter(item => {
                return (
                  item.type != 'formula' &&
                  item.systemFieldType != 4 &&
                  item.systemFieldType != 5 &&
                  item.systemFieldType != 6 &&
                  item.systemFieldType != 8
                );
              });
              // 创建一个映射（Map）以存储 array1 中的 title 到对象的映射
              const idMap = new Map(arr.map(item => [item.key, item]));
              // 从 array2 中获取不存在于 array1 中的对象
              const uniqueItems = arrs.filter(item => !idMap.has(item.key));
              console.log(uniqueItems, 'uniqueItems');
              // 将 uniqueItems 添加到 array1 中
              const combinedArray = [...arr, ...uniqueItems];
              console.log(combinedArray, 'combinedArray');
              arr = [];
              combinedArray.forEach(item => {
                if (item.type != 'formula') {
                  arr.push({...item, title: item.key});
                }
              });
            }
            if (arr.length == 0) {
              objectData.forEach(item => {
                if (item.type != 'formula') {
                  arr.push({...item, title: item.key});
                }
              });
            }
          }
          console.log(arr, 'arrarrarrarrarr');
          console.log(fieldData, 'fieldData');
          arr = arr.sort((a, b) => a.title.localeCompare(b.title))
          setFieldData(arr);
        // }
        setAddModalOpen(false);
      })
      .catch(e => {
        console.log(e, '校验失败');
        // message.error('请输入必填项')
      });
  };
  // 编辑变量确认
  const editHandleOk = () => {
    console.log('编辑变量确认');
    console.log(showPeopleValue, '是否展示成员字段');
    console.log(editType, 'editType');
    console.log(arrayValue, 'arrayValuearrayValue');
    console.log(requiredValue, 'requiredValuerequiredValue');
    console.log(defaultData, '默认值defaultData');
    console.log(propertiesValue, 'propertiesValue');
    editForms
      .validateFields()
      .then(() => {
        // if (editType == 'input') {
          console.log(editForms.getFieldValue, 'editForms');
          let formData = {
            type: editForms.getFieldValue('type'),
            title: editForms.getFieldValue('title'),
            key: editForms.getFieldValue('title'),
            array: editForms.getFieldValue('array'),
            required: editForms.getFieldValue('required'),
            default: defaultData,
            describe: editForms.getFieldValue('describe')
          };
          console.log(formData, 'formDataformDataformData');
          console.log(fieldData, 'fieldData');
          let listData = [...fieldData];
          console.log(listData, 'listData');
          console.log(listData[itemIndex], 'listData[itemIndex]');
          listData[itemIndex] = {...listData[itemIndex], ...formData};
          listData[itemIndex].required = requiredValue;
          listData[itemIndex].array = arrayValue;
          listData[itemIndex].arrayType = formData.type;
          listData[itemIndex].entity = {
            label: modelValue.label,
            value: modelValue.value
          };
          console.log(listData, 'listData');
          console.log(inputData, 'inputDatainputDatainputData');
          console.log(
            propertiesData,
            'propertiesDatapropertiesDatapropertiesData'
          );
          let objectData: any = [];
          let trimData = listData.map(res => {
            if (res.type == 'array') {
              if (res.array) {
                if (res.arrayType == 'string') {
                  return {...res, inputText: '字符串数组'};
                } else if (res.arrayType == 'number') {
                  return {...res, inputText: '数字数组'};
                } else if (res.arrayType == 'boolean') {
                  return {...res, inputText: '布尔数组'};
                } else if (res.arrayType == 'user') {
                  return {...res, inputText: '人员数组'};
                } else if (res.arrayType == 'users') {
                  return {...res, inputText: '人员多选数组'};
                } else if (res.arrayType == 'object') {
                  if (showPeopleValue) {
                    objectData = changeDataType(inputData);
                  }
                  if (isSelect) {
                    return {
                      ...res,
                      inputText: '实体对象数组',
                      properties: inputData
                    };
                  } else {
                    return {...res, inputText: '实体对象数组'};
                  }
                } else if (res.arrayType == 'objects') {
                  if (res.title == formData.title) {
                    if (propertiesData) {
                      return {
                        ...res,
                        inputText: '对象数组',
                        properties: propertiesData
                      };
                    } else {
                      return {
                        ...res,
                        inputText: '对象数组'
                      };
                    }
                  } else {
                    return {
                      ...res,
                      inputText: '对象数组'
                    };
                  }
                }
              } else {
                if (res.type == 'array') {
                  if (res.arrayType == 'string') {
                    return {...res, inputText: '字符串数组'};
                  } else if (res.arrayType == 'number') {
                    return {...res, inputText: '数字数组'};
                  } else if (res.arrayType == 'boolean') {
                    return {...res, inputText: '布尔数组'};
                  } else if (res.arrayType == 'user') {
                    return {...res, inputText: '人员数组'};
                  } else if (res.arrayType == 'users') {
                    return {...res, inputText: '人员多选数组'};
                  } else if (res.arrayType == 'entity') {
                    if (isSelect) {
                      return {
                        ...res,
                        inputText: '实体对象数组',
                        properties: inputData
                      };
                    } else {
                      return {...res, inputText: '实体对象数组'};
                    }
                  } else if (res.arrayType == 'objects') {
                    if (propertiesData) {
                      return {
                        ...res,
                        inputText: '对象数组',
                        properties: propertiesData
                      };
                    } else {
                      return {
                        ...res,
                        inputText: '对象数组'
                      };
                    }
                  } else if (res.arrayType == 'object') {
                    if (propertiesData) {
                      return {
                        ...res,
                        inputText: '对象数组',
                        // properties: propertiesData
                      };
                    } else {
                      return {
                        ...res,
                        inputText: '对象数组'
                      };
                    }
                  }
                } else {
                  if (res.arrayType == 'string') {
                    return {...res, inputText: '字符串'};
                  } else if (res.arrayType == 'number') {
                    return {...res, inputText: '数字'};
                  } else if (res.arrayType == 'boolean') {
                    return {...res, inputText: '布尔'};
                  } else if (res.arrayType == 'user') {
                    return {...res, inputText: '人员'};
                  } else if (res.arrayType == 'users') {
                    return {...res, inputText: '人员多选'};
                  } else if (res.arrayType == 'object') {
                    return {
                      ...res,
                      inputText: '实体对象',
                      properties: inputData
                    };
                  } else if (res.arrayType == 'objects') {
                    if (propertiesData) {
                      return {
                        ...res,
                        inputText: '对象',
                        properties: propertiesData
                      };
                    } else {
                      return {
                        ...res,
                        inputText: '对象'
                      };
                    }
                    return {
                      ...res,
                      inputText: '对象',
                      // properties: propertiesData
                    };
                  } else if (res.arrayType == 'entity') {
                    if (isSelect) {
                      return {
                        ...res,
                        inputText: '实体对象',
                        properties: inputData
                      };
                    } else {
                      return {...res, inputText: '实体对象'};
                    }
                  }
                }
              }
            } else {
              if (res.type == 'string') {
                if (res.array) {
                  return {...res, inputText: '字符串数组'};
                } else {
                  return {...res, inputText: '字符串'};
                }
              } else if (res.type == 'number') {
                if (res.array) {
                  return {...res, inputText: '数字数组'};
                } else {
                  return {...res, inputText: '数字'};
                }
              } else if (res.type == 'boolean') {
                if (res.array) {
                  return {...res, inputText: '布尔数组'};
                } else {
                  return {...res, inputText: '布尔'};
                }
              } else if (res.type == 'user') {
                if (res.array) {
                  return {...res, inputText: '人员数组'};
                } else {
                  return {...res, inputText: '人员'};
                }
              } else if (res.type == 'users') {
                if (res.array) {
                  return {...res, inputText: '人员多选数组'};
                } else {
                  return {...res, inputText: '人员多选'};
                }
              } else if (res.type == 'object' && res.entity) {
                if (res.array) {
                  if (showPeopleValue) {
                    objectData = changeDataType(inputData);
                  }
                  if (isSelect) {
                    return {
                      ...res,
                      inputText: '实体对象数组',
                      // properties: modelProperties.properties
                      properties: inputData
                    };
                  } else {
                    return {...res, inputText: '实体对象数组'};
                  }
                } else {
                  console.log(
                    modelProperties,
                    'modelPropertiesmodelProperties'
                  );
                  if (showPeopleValue) {
                    objectData = changeDataType(inputData);
                  }
                  if (isSelect) {
                    return {
                      ...res,
                      inputText: '实体对象',
                      properties: modelProperties.properties
                      // properties: inputData
                    };
                  } else {
                    return {...res, inputText: '实体对象'};
                  }
                }
              } else if (res.type == 'objects') {
                if (res.array) {
                  if (res.title == formData.title) {
                    if (propertiesData) {
                      return {
                        ...res,
                        inputText: '对象数组',
                        properties: propertiesData
                        // properties: propertiesData.properties
                        //   ? propertiesData
                        //   : undefined
                      };
                    } else {
                      return {
                        ...res,
                        inputText: '对象数组'
                      };
                    }
                  } else {
                    return {
                      ...res,
                      inputText: '对象数组'
                    };
                  }
                } else {
                  if (res.title == formData.title) {
                    if (propertiesData) {
                      console.log(propertiesData, '进入奥特曼');
                      return {
                        ...res,
                        inputText: '对象',
                        properties: propertiesData
                      };
                    } else {
                      return {
                        ...res,
                        inputText: '对象',
                        properties: null
                      };
                    }
                  } else {
                    return {
                      ...res,
                      inputText: '对象'
                    };
                  }
                }
              } else if (res.type == 'object' && !res.entity) {
                if (res.array) {
                  if (res.title == formData.title) {
                    if (propertiesData) {
                      return {
                        ...res,
                        inputText: '对象数组',
                        properties: propertiesData
                      };
                    } else {
                      return {
                        ...res,
                        inputText: '对象数组'
                      };
                    }
                  } else {
                    return {
                      ...res,
                      inputText: '对象数组'
                    };
                  }
                } else {
                  if (res.title == formData.title) {
                    if (propertiesData) {
                      return {
                        ...res,
                        inputText: '对象',
                        properties: propertiesData
                      };
                    } else {
                      return {
                        ...res,
                        inputText: '对象'
                      };
                    }
                  } else {
                    return {
                      ...res,
                      inputText: '对象'
                    };
                  }
                }
              }
            }
          });
          trimData = trimData.filter(srd => {
            return srd;
          });
          console.log(trimData, 'trimData');
          let arr = trimData.filter(item => {
            if (item) {
              if (item.key != formData.key) {
                return item;
              }
            }
          });
          if (objectData.length == 0) {
            console.log(objectData, 'objectData');
            arr = trimData;
            // arr.push(formData);
          } else {
            console.log(objectData, 'objectData');
            console.log(arr, 'arr');
            if (arr.length > 0) {
              // var reg = /^[^\u4e00-\u9fa5]+$/;
              let arrs = objectData.filter(item => {
                return (
                  item.type != 'formula' &&
                  item.systemFieldType != 4 &&
                  item.systemFieldType != 5 &&
                  item.systemFieldType != 6 &&
                  item.systemFieldType != 8
                );
              });
              // 创建一个映射（Map）以存储 array1 中的 title 到对象的映射
              const idMap = new Map(arr.map(item => [item.key, item]));
              // 从 array2 中获取不存在于 array1 中的对象
              const uniqueItems = arrs.filter(item => !idMap.has(item.key));
              console.log(uniqueItems, 'uniqueItems');
              // 将 uniqueItems 添加到 array1 中
              const combinedArray = [...arr, ...uniqueItems];
              console.log(combinedArray, 'combinedArray');
              arr = [];
              combinedArray.forEach(item => {
                if (item.type != 'formula') {
                  arr.push({...item, title: item.key});
                }
              });
            }
            if (arr.length == 0) {
              objectData.forEach(item => {
                if (item.type != 'formula') {
                  arr.push({...item, title: item.key});
                }
              });
            }
          }
          arr = arr.sort((a, b) => a.title.localeCompare(b.title))
          setFieldData(arr);
          setEditModalOpen(false);
        // }
        setIsSelect(false);
      })
      .catch(e => {
        console.log(e, '校验失败');
      });
  };
  // 编辑变量取消
  const editHandleCancel = () => {
    setEditModalOpen(false);
  };
  // 成员字段 数据变化
  const propertiesChange = e => {
    console.log(e, '成员字段 数据变化');
    setPropertiesData(e);
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
  useEffect(() => {
    setIsSelect(false);
    console.log(fieldData, 'fieldData数据变化');
    console.log(propertiesData, 'propertiesData数据');
    console.log(modelValue, 'modelValue数据');
    console.log(modelProperties, 'modelProperties');
    if(fieldData){
      let needData = [...fieldData];
      let data = {
        type: 'object',
        required: [],
        properties: {}
      };
      let data1 = {
        type: 'object',
        required: [],
        properties: {}
      };
      needData.forEach(res => {
        if (res.required) {
          data.required.push(res.title);
          data1.required.push(res.title);
        }
        if (res.array) {
          if (res.type == 'objects') {
            console.log(propertiesData, 'propertiesDataArr');
            let objectData = forms.getFieldValue('title');
            console.log(objectData, 'objectData');
            console.log(res.title, 'res.title');
            if (objectData) {
              if (res.title == objectData) {
                data.properties[res.title] = {
                  type: 'array',
                  title: res.title,
                  arrayType:
                  propertiesData && propertiesData.type
                    ? propertiesData.type
                    : res.arrayType
                    ? res.arrayType
                    : res.type == 'objects'
                    ? 'object'
                    : res.type,
                  default: res.default,
                  describe: res.describe,
                  items: propertiesData
                  ? propertiesData.properties
                    ? propertiesData
                    : undefined
                  : undefined
                };
                data1.properties[res.title] = {
                  type: 'array',
                  title: res.title,
                  arrayType:
                  propertiesData && propertiesData.type
                    ? propertiesData.type
                    : res.arrayType
                    ? res.arrayType
                    : res.type == 'objects'
                    ? 'object'
                    : res.type,
                  default: res.default,
                  describe: res.describe,
                  items: propertiesData
                      ? propertiesData.properties
                        ? propertiesData
                        : {
                          properties: res.properties,
                          type: 'object',
                          required: []
                        }
                      : undefined
                };
              } else {
                let needProperties: any = {};
                let fgie = JSON.parse(
                  props.businessObject.processInstanceStartVariables
                );
                for (let h in fgie.properties) {
                  if (fgie.properties[h].title == res.title) {
                    needProperties = {...fgie.properties[h]};
                  }
                }
                data.properties[res.title] = {
                  type: 'array',
                  title: res.title,
                  arrayType: 'object',
                  default: res.default,
                  describe: res.describe,
                  items: res.items ? res.items : res.properties
                };
                data1.properties[res.title] = {
                  type: 'array',
                  title: res.title,
                  arrayType: 'object',
                  default: res.default,
                  describe: res.describe,
                  // items: needProperties.items
                  items: res.items ? res.items : res.properties
                };
              }
            } else {
              data.properties[res.title] = {
                type: 'array',
                title: res.title,
                arrayType: res.arrayType ? res.arrayType : res.type,
                default: res.default,
                describe: res.describe,
                items: res.items
                  ? res.items
                  : res.properties.properties
                  ? res.properties
                  : res.properties
                  ? res.properties
                  : {
                      properties: res.properties,
                      type: 'object',
                      required: []
                    },
                    properties: res.items
                    ? res.items
                    : res.properties.properties
                    ? res.properties
                    : res.properties
                    ? res.properties
                    : {
                        properties: res.properties,
                        type: 'object',
                        required: []
                      }
              };
              data1.properties[res.title] = {
                type: 'array',
                title: res.title,
                arrayType: res.arrayType ? res.arrayType : res.type,
                default: res.default,
                describe: res.describe,
                items: res.items
                  ? res.items
                  : res.properties.properties
                  ? res.properties
                  : res.properties
                  ? res.properties
                  : {
                      properties: res.properties,
                      type: 'object',
                      required: []
                    },
                properties: res.items
                  ? res.items
                  : res.properties.properties
                  ? res.properties
                  : res.properties
                  ? res.properties
                  : {
                      properties: res.properties,
                      type: 'object',
                      required: []
                    }
              };
            }
            console.log(data, 'aaaaaaaaa');
          } else if (res.type == 'object') {
            let objectData = forms.getFieldValue('title');
            if (objectData) {
              if (res.title == objectData) {
                data.properties[res.title] = {
                  type: 'array',
                  title: res.title,
                  arrayType: 'entity',
                  default: res.default,
                  describe: res.describe,
                  entity: {
                    label: modelValue.label,
                    value: modelValue.value
                  },
                  items: {
                    type: 'object',
                    required: modelProperties.required,
                    properties: modelProperties.properties
                  }
                };
                data1.properties[res.title] = {
                  type: 'array',
                  title: res.title,
                  arrayType: 'entity',
                  default: res.default,
                  describe: res.describe,
                  entity: {
                    label: modelValue.label,
                    value: modelValue.value
                  },
                  items: {
                    type: 'object',
                    required: modelProperties.required,
                    properties: modelProperties.properties
                  }
                };
              } else {
                let needProperties: any = {};
                let fgie = JSON.parse(
                  props.businessObject.processInstanceStartVariables
                );
                for (let h in fgie.properties) {
                  if (fgie.properties[h].title == res.title) {
                    needProperties = {...fgie.properties[h]};
                  }
                }
                console.log(needProperties, 'needProperties');
                data.properties[res.title] = {
                  type: 'array',
                  title: res.title,
                  arrayType: 'entity',
                  default: res.default,
                  describe: res.describe,
                  entity: needProperties.entity,
                  items: needProperties.items
                };
                data1.properties[res.title] = {
                  type: 'array',
                  title: res.title,
                  arrayType: 'entity',
                  default: res.default,
                  describe: res.describe,
                  entity: needProperties.entity,
                  items: needProperties.items
                };
              }
            } else {
              data.properties[res.title] = {
                type: 'array',
                title: res.title,
                arrayType: 'entity',
                default: res.default,
                describe: res.describe,
                entity: {...res.entity},
                items: {
                  type: 'object',
                  required: modelProperties.required,
                  properties: modelProperties.properties
                }
              };
              data1.properties[res.title] = {
                type: 'array',
                title: res.title,
                arrayType: 'entity',
                default: res.default,
                describe: res.describe,
                entity: {...res.entity},
                items: {
                  type: 'object',
                  required: modelProperties.required,
                  properties: modelProperties.properties
                }
              };
            }
          } else {
            data.properties[res.title] = {
              type: 'array',
              title: res.title,
              arrayType: res.arrayType ? res.arrayType : res.type,
              default: res.default,
              describe: res.describe,
              items: undefined
            };
            data1.properties[res.title] = {
              type: 'array',
              title: res.title,
              arrayType: res.arrayType ? res.arrayType : res.type,
              default: res.default,
              describe: res.describe,
              items: undefined
            };
          }
        } else {
          if (res.type == 'objects') {
            let objectData = forms.getFieldValue('title');
            console.log(objectData, 'objectData');
            if (objectData) {
              if (res.title == objectData) {
                data.properties[res.title] = {
                  type: 'object',
                  types: res.type,
                  title: res.title,
                  default: res.default,
                  describe: res.describe,
                  properties: propertiesData
                    ? propertiesData.properties
                      ? propertiesData
                      : undefined
                    : undefined,
                  required: propertiesData ? propertiesData.required : []
                };
                data1.properties[res.title] = {
                  type: 'object',
                  types: res.type,
                  title: res.title,
                  default: res.default,
                  describe: res.describe,
                  properties: propertiesData
                      ? propertiesData.properties
                        ? propertiesData.properties
                        : propertiesData
                      : undefined,
                  required: propertiesData ? propertiesData.required : []
                };
              } else {
                let needProperties: any = {};
                let fgie = JSON.parse(
                  props.businessObject.processInstanceStartVariables
                );
                for (let h in fgie.properties) {
                  if (fgie.properties[h].title == res.title) {
                    needProperties = {...fgie.properties[h]};
                  }
                }
                data.properties[res.title] = {
                  type: 'object',
                  types: res.type,
                  title: res.title,
                  default: res.default,
                  describe: res.describe,
                  properties: needProperties.properties,
                  required: needProperties.required
                };
                data1.properties[res.title] = {
                  type: 'object',
                  types: res.type,
                  title: res.title,
                  default: res.default,
                  describe: res.describe,
                  properties: needProperties.properties ? needProperties.properties.properties ?
                  {
                    ...needProperties.properties.properties
                  }
                  : needProperties.properties
                  : undefined,
                  required: needProperties.required
                };
              }
            } else {
              data.properties[res.title] = {
                type: 'object',
                types: res.type,
                title: res.title,
                default: res.default,
                describe: res.describe,
                properties: res.properties
              };
              data1.properties[res.title] = {
                type: 'object',
                types: res.type,
                title: res.title,
                default: res.default,
                describe: res.describe,
                properties: res.properties
              };
            }
          } else if (res.type == 'object' && res.properties) {
            let objectData = forms.getFieldValue('title');
            console.log(objectData, 'objectData');
            console.log(res, 'resresresres');

            if (objectData) {
              if (res.title == objectData) {
                console.log('进入11');
                data.properties[res.title] = {
                  type: res.type,
                  title: res.title,
                  default: res.default,
                  describe: res.describe,
                  entity: {
                    label: modelValue.label,
                    value: modelValue.value
                  },
                  required: modelProperties.required,
                  properties: modelProperties.properties
                };
                data1.properties[res.title] = {
                  type: res.type,
                  title: res.title,
                  default: res.default,
                  describe: res.describe,
                  entity: {
                    label: modelValue.label,
                    value: modelValue.value
                  },
                  required: modelProperties.required,
                  properties:  modelProperties.properties ? modelProperties.properties.properties ?
                  {
                    ...modelProperties.properties.properties,
                    required:modelProperties.properties.required,
                    type:modelProperties.properties.type,
                  }
                  : modelProperties.properties
                  : undefined
                };
              } else {
                console.log('进入22');
                let needProperties: any = {};
                let fgie = JSON.parse(
                  props.businessObject.processInstanceStartVariables
                );
                for (let h in fgie.properties) {
                  if (fgie.properties[h].title == res.title) {
                    needProperties = {...fgie.properties[h]};
                  }
                }
                console.log(needProperties, '实体对象');
                data.properties[res.title] = {
                  type: res.type,
                  title: res.title,
                  default: res.default,
                  describe: res.describe,
                  ...needProperties
                };
                data1.properties[res.title] = {
                  type: res.type,
                  title: res.title,
                  default: res.default,
                  describe: res.describe,
                  ...needProperties
                };
              }
            } else {
              console.log('进入');
              data.properties[res.title] = {
                type: res.type,
                title: res.title,
                default: res.default,
                describe: res.describe,
                entity: res.entity,
                required: res.required,
                properties: res.properties
              };
              data1.properties[res.title] = {
                type: res.type,
                title: res.title,
                default: res.default,
                describe: res.describe,
                entity: res.entity,
                required: res.required,
                properties: res.properties
              };
            }
          } else {
            data.properties[res.title] = {
              type: res.type,
              title: res.title,
              default: res.default,
              describe: res.describe,
              ...res
            };
            data1.properties[res.title] = {
              type: res.type,
              title: res.title,
              default: res.default,
              describe: res.describe,
              ...res
            };
          }
        }
        data.properties = {
          ...data.properties
        };
      });
      console.log(data, '流程参数数组列表');
      console.log(propertiesData, 'PropertiesData');
      let fields = fieldData.map(slo => {
        console.log(slo, 'sloslosloslo');
        if (slo.type == 'object') {
          if (slo.array) {
            let childData: any = [];
            if (slo.properties) {
              if (slo.properties.length > 0) {
                childData = [
                  {
                    tag: '对象',
                    title: '成员',
                    label: '成员',
                    disabled: true,
                    children: getDataPropsAsOptions(slo)
                  }
                ];
              }
            }
            return {
              ...slo,
              name: slo.title,
              key: slo.title,
              label: slo.title,
              value: 'processInstanceStartVariables' + '.' + slo.title,
              path: '流程参数' + '.' + slo.title,
              // type: 'string',
              type: 'object',
              children: childData,
              tag: slo.array
                ? '数组'
                : slo.type == 'string'
                ? '文本'
                : slo.type == 'number'
                ? '数字'
                : slo.type == 'boolean'
                ? '布尔'
                : slo.type == 'object'
                ? '对象'
                : slo.type == 'objects'
                ? '对象'
                : slo.type == 'array'
                ? '数组'
                : '文本',
              isMember: false,
              disabled: false
            };
          } else {
            console.log(slo, '对象');
            if (slo.entity && slo.properties) {
              return {
                ...slo,
                name: slo.title,
                key: slo.title,
                label: slo.title,
                value: 'processInstanceStartVariables' + '.' + slo.title,
                path: '流程参数' + '.' + slo.title,
                type: 'object',
                disabled: true,
                children: slo.properties ? getDataPropsAsOptions(slo) : undefined,
                tag: '对象',
                isMember: false
              };
            } else if (slo.arrayType == 'entity') {
              return {
                ...slo,
                name: slo.title,
                key: slo.title,
                label: slo.title,
                value: 'processInstanceStartVariables' + '.' + slo.title,
                path: '流程参数' + '.' + slo.title,
                // type: 'string',
                type: 'object',
                disabled: true,
                children: slo.properties ? getDataPropsAsOptions(slo) : undefined,
                tag: slo.array
                  ? '数组'
                  : slo.type == 'string'
                  ? '文本'
                  : slo.type == 'number'
                  ? '数字'
                  : slo.type == 'boolean'
                  ? '布尔'
                  : slo.type == 'object'
                  ? '对象'
                  : slo.type == 'objects'
                  ? '对象'
                  : slo.type == 'array'
                  ? '数组'
                  : '文本',
                isMember: false
              };
            } else if (!slo.entity && slo.items) {
              return {
                ...slo,
                name: slo.title,
                key: slo.title,
                label: slo.title,
                value: 'processInstanceStartVariables' + '.' + slo.title,
                path: '流程参数' + '.' + slo.title,
                // type: 'string',
                type: 'object',
                disabled: true,
                children:
                  slo.items && slo.items.length > 0
                    ? getDataPropsAsOptions(slo.items)
                    : undefined,
                tag: slo.array
                  ? '数组'
                  : slo.type == 'string'
                  ? '文本'
                  : slo.type == 'number'
                  ? '数字'
                  : slo.type == 'boolean'
                  ? '布尔'
                  : slo.type == 'object'
                  ? '对象'
                  : slo.type == 'objects'
                  ? '对象'
                  : slo.type == 'array'
                  ? '数组'
                  : '文本',
                isMember: false
              };
            } else if (!slo.entity && !slo.items) {
              return {
                ...slo,
                name: slo.title,
                key: slo.title,
                label: slo.title,
                value: 'processInstanceStartVariables' + '.' + slo.title,
                path: '流程参数' + '.' + slo.title,
                type: 'object',
                disabled: true,
                children: slo.properties ? getDataPropsAsOptions(slo) : undefined,
                tag: '对象',
                isMember: false
              };
            } else {
              return {
                ...slo,
                name: slo.title,
                key: slo.title,
                label: slo.title,
                value: 'processInstanceStartVariables' + '.' + slo.title,
                path: '流程参数' + '.' + slo.title,
                // type: 'string',
                type: 'object',
                disabled: true,
                children: slo.properties ? getDataPropsAsOptions(slo) : undefined,
                tag: slo.array
                  ? '数组'
                  : slo.type == 'string'
                  ? '文本'
                  : slo.type == 'number'
                  ? '数字'
                  : slo.type == 'boolean'
                  ? '布尔'
                  : slo.type == 'object'
                  ? '对象'
                  : slo.type == 'objects'
                  ? '对象'
                  : slo.type == 'array'
                  ? '数组'
                  : '文本',
                isMember: false
              };
            }
          }
        } else if (slo.type == 'objects') {
          console.log(slo, 'duis');
          let childrenData = [];
          let childrenDatas = [];
          // if (slo.properties) {
          //   let sloObject = {...slo}
          //   delete sloObject.entity
          //   if(slo.array && !slo.properties.properties){
          //     sloObject.properties =  {
          //       properties: slo.properties,
          //       type: 'object',
          //       required: []
          //     }
          //   }
          //   if(!slo.array && slo.properties.properties){
          //     sloObject.properties =  {
          //       ...slo.properties.properties,
          //       required:slo.required,
          //       type:slo.type
          //     }
          //   }
          //   childrenData = getDataPropsAsOptions(slo);
          // }
          if (slo.properties) {
            let sloObject = {...slo};
            delete sloObject.entity;
            if (slo.properties.properties) {
              sloObject.properties = {
                ...slo.properties.properties,
                required: slo.properties.required,
                type: slo.properties.type
              };
            }
            console.log(sloObject, 'sloObject');
            childrenData = getDataPropsAsOptions(sloObject);
          }
          if (childrenData.length > 0 && slo.array) {
            childrenDatas = [
              {
                tag: '对象',
                title: '成员',
                label: '成员',
                disabled: true,
                children: childrenData
                // children:slo.properties
              }
            ];
          } else {
            childrenDatas = childrenData;
          }
          return {
            ...slo,
            types: slo.type,
            name: slo.title,
            key: slo.title,
            label: slo.title,
            value: 'processInstanceStartVariables' + '.' + slo.title,
            path: '流程参数' + '.' + slo.title,
            // type: 'string',
            type: 'object',
            children: childrenDatas,
            tag: slo.array
              ? '数组'
              : slo.type == 'string'
              ? '文本'
              : slo.type == 'number'
              ? '数字'
              : slo.type == 'boolean'
              ? '布尔'
              : slo.type == 'object'
              ? '对象'
              : slo.type == 'objects'
              ? '对象'
              : slo.type == 'array'
              ? '数组'
              : '文本',
            isMember: false,
            disabled: false
          };
        } else if (slo.type == 'array') {
          if (slo.arrayType == 'entity') {
            let childData: any = [];
            childData = [
              {
                title: '成员',
                tag: '对象',
                label: '成员',
                disabled: true,
                children: getDataPropsAsOptions(slo.items)
              }
            ];
            return {
              ...slo,
              name: slo.title,
              key: slo.title,
              label: slo.title,
              value: 'processInstanceStartVariables' + '.' + slo.title,
              path: '流程参数' + '.' + slo.title,
              type: 'object',
              children: childData,
              tag: '数组',
              isMember: false,
              disabled: false
            };
          } else if (slo.arrayType == 'object' && !slo.entity && slo.items) {
            let childData: any = [];
            childData = [
              {
                title: '成员',
                tag: '对象',
                label: '成员',
                disabled: true,
                children: getDataPropsAsOptions(slo.items)
              }
            ];
            console.log();
            return {
              ...slo,
              name: slo.title,
              key: slo.title,
              label: slo.title,
              children: childData,
              value: 'processInstanceStartVariables' + '.' + slo.title,
              path: '流程参数' + '.' + slo.title,
              tag: '数组',
              isMember: false,
              disabled: false
            };
          } else {
            return {
              ...slo,
              name: slo.title,
              key: slo.title,
              label: slo.title,
              value: 'processInstanceStartVariables' + '.' + slo.title,
              path: '流程参数' + '.' + slo.title,
              tag: '数组',
              isMember: false,
              disabled: false
            };
          }
        } else {
          return {
            ...slo,
            name: slo.title,
            key: slo.title,
            label: slo.title,
            value: 'processInstanceStartVariables' + '.' + slo.title,
            path: '流程参数' + '.' + slo.title,
            // type: 'string',
            tag: slo.array
              ? '数组'
              : slo.type == 'string'
              ? '文本'
              : slo.type == 'number'
              ? '数字'
              : slo.type == 'boolean'
              ? '布尔'
              : slo.type == 'object'
              ? '对象'
              : slo.type == 'objects'
              ? '对象'
              : slo.type == 'array'
              ? '数组'
              : '文本',
            isMember: false,
            disabled: false
          };
        }
      });
      console.log(data, 'data');
      let inputsList = {
        // type: 'object',
        // required: [],
        properties: {
          processInstanceStartVariables: {
            type: 'object',
            required: [],
            title: '流程参数',
            value: 'processInstanceStartVariables',
            ...data1
          }
        }
      };
      console.log(fields, 'fieldsfieldsfields');
      console.log(formuVariables, '表达式formuVariables');
      console.log(inputsList, 'inputsListinputsList');
      let formuVar = getDataPropsAsOptions(inputsList);
      console.log(formuVar, 'formuVarformuVarformuVarformuVarformuVarformuVar');
      console.log(data, 'datadatadatadatadata');
      if(JSON.stringify(data.properties) == '{}'){
        window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
          processInstanceStartVariables: undefined
        });
      }else{
        window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
          processInstanceStartVariables: JSON.stringify(data)
        });
      }
      sessionStorage.setItem('startList', JSON.stringify(formuVar));
    }
  }, [fieldData]);
  const buildDataChange = e => {
    let arr = e.map(element => {
      // console.log(typeConfig[element.type], 'typeConfig[element.type]');
      if (element.children) {
        return {
          ...element,
          type: element.type,
          name: element.key
            ? element.key
            : element.code
            ? element.code
            : element.label,
          disabled: true,
          children: buildDataChange(element.children),
          ...typeConfig[element.type]
        };
      }
      return {
        ...element,
        type: element.type,
        name: element.key
          ? element.key
          : element.code
          ? element.code
          : element.label,
        ...typeConfig[element.type]
      };
    });
    console.log(arr, 'arr');
    return arr;
  };
  useEffect(() => {
    console.log(updateFieldsOption, 'updateFieldsOption');
    // }, [updateFieldsOption.current]);
  }, [updateFieldsOption]);
  const searchRef = useRef(null);
  // 校验是否选择实体对象
  const checkUser = (rule, value) => {
    console.log(value);
    if (modelValue.label) {
      //校验条件自定义
      return Promise.resolve();
    }
    return Promise.reject('这是必填项');
  };
  // 校验变量名称
  const checkName = (rule, value) => {
    console.log(value, 'value');
    if (!value) {
      return Promise.reject('这是必填项');
    }
    const regex = /^[a-zA-Z0-9_](?:[a-zA-Z0-9_.]*)*$/;
    if (regex.test(value)) {
      //校验条件自定义
      return Promise.resolve();
    }
    return Promise.reject('只能输入英文、数字、下划线，字符之间可以包含小数点');
  };
  const modelChange = e => {
    console.log(e, 'eeeeeeeeeeeeeeeeeeee');
    if (e.target.value == '') {
      setModelValue({
        label: '',
        value: ''
      });
      modelValueData.current = {
        label: '',
        value: ''
      }
    }
  };
  return (
    <>
      <Form
        name="basic"
        labelCol={{span: 6}}
        // wrapperCol={{span: 16}}
        // style={{maxWidth: 700}}
        // initialValues={{remember: true}}
        // onFinish={onFinish}
        // onFinishFailed={onFinishFailed}
        form={form}
        autoComplete="off"
        ref={searchRef}
      >
        {/* 节点类型为开始 */}
        <>
          {
            <>
              {!fieldData && <div>{'<空>'}</div>}
              {fieldData && fieldData.length == 0 && <div>{'<空>'}</div>}
              {fieldData && fieldData.length > 0 && (
                <div>
                    {fieldData.map((res, index) => (
                      <Form.Item<FieldType> key={index} style={{width:'99%'}}>
                        <Row gutter={10}>
                          <Col span={20}>
                            {res.required && <div style={{
                              color: 'red',
                              position: 'absolute',
                              zIndex: 9,
                              left: '10px',
                              top: '5px'
                            }}>*</div>}
                            <Input
                              readOnly
                              prefix={res.key}
                              // prefix={res.title}
                              suffix={res.inputText}
                            />
                          </Col>
                          <Col span={4}>
                            {amisRender(
                              {
                                type: 'dropdown-button',
                                className:
                                  'ae-TimelineItemControlItem-dropdown',
                                btnClassName: 'px-2',
                                icon: 'fa fa-ellipsis-h',
                                hideCaret: true,
                                closeOnClick: true,
                                align: 'right',
                                menuClassName:
                                  'ae-TimelineItemControlItem-ulmenu',
                                buttons: [
                                  {
                                    type: 'button',
                                    className:
                                      'ae-TimelineItemControlItem-action',
                                    label: '编辑变量',
                                    onClick: (e: any) => editClick(res, index)
                                  },
                                  {
                                    type: 'button',
                                    className:
                                      'ae-TimelineItemControlItem-action',
                                    label: '删除变量',
                                    onClick: (e: any) => deleteClick(res, index)
                                  }
                                ]
                              },
                              {
                                popOverContainer: null // amis 渲染挂载节点会使用 this.target
                              },
                              {
                                theme: amisEnv.theme
                              }
                            )}
                          </Col>
                        </Row>
                      </Form.Item>
                    ))}
                </div>
              )}
              <Row>
                <Col span={24}>
                  <Button
                    style={{width: '100%', marginTop: '10px'}}
                    onClick={() => addField('inputParams')}
                  >
                    添加变量
                  </Button>
                </Col>
              </Row>
            </>
          }
        </>
        <Modal
          title="添加变量"
          open={addModalOpen}
          onOk={addHandleOk}
          onCancel={addHandleCancel}
          destroyOnClose={true}
          cancelText={'取消'}
          okText={'确认'}
          // footer={false}
          maskClosable={false}
        >
          <Form
            name="basic"
            labelCol={{span: 6}}
            wrapperCol={{span: 16}}
            style={{maxWidth: 700}}
            form={forms}
            autoComplete="off"
          >
            <Form.Item<FieldType>
              label="数据类型"
              name="type"
              rules={[{required: true}]}
            >
              <Select
                value={typeValue}
                onChange={typeChange}
                defaultValue={'string'}
                options={[
                  {
                    label: '字符串',
                    value: 'string'
                  },
                  {
                    label: '数字',
                    value: 'number'
                  },
                  {
                    label: '布尔',
                    value: 'boolean'
                  },
                  {
                    label: '实体对象',
                    value: 'object'
                  },
                  {
                    label: '自定义对象',
                    value: 'objects'
                    // value: 'object'
                  }
                ]}
              />
            </Form.Item>
            {typeValue == 'object' && (
              <>
                <Form.Item<FieldType>
                  label="实体模型"
                  name="model"
                  rules={[{required: true, validator: checkUser}]}
                >
                  <Space.Compact style={{width: '100%'}}>
                    <Input
                      // readOnly
                      allowClear
                      value={modelValue?.label}
                      placeholder="请选择"
                      onChange={modelChange}
                    />
                    <Button icon={<EllipsisOutlined />} onClick={newClick} />
                  </Space.Compact>
                  <Modal
                    title="实体选择"
                    open={entityModalOpen}
                    onOk={entityHandleOk}
                    onCancel={entityHandleCancel}
                    maskClosable={false}
                    cancelText={'取消'}
                    okText={'确认'}
                  >
                    <Search
                      style={{marginBottom: 8}}
                      placeholder="请输入"
                      onChange={entityChange}
                    />
                    <Tree
                      defaultExpandAll
                      style={{height: '400px', overflow: 'auto'}}
                      onExpand={onExpand} // onExpand
                      blockNode
                      expandedKeys={expandedKeys} // 展开固定树节点
                      autoExpandParent={true} // 是否自动展开父节点
                      onSelect={(e, data) => handleNodeClick(e, data)}
                    >
                      {renderTreeNodes(deptOptions)}
                    </Tree>
                  </Modal>
                </Form.Item>
                <Form.Item<FieldType>
                  label={
                    <>
                      <Tooltip title="打开时会将实体中的字段展示到当前变量层级中">
                        <span style={{color: 'red'}}>*</span>展示成员字段
                      </Tooltip>
                    </>
                  }
                  name="showPeople"
                >
                  <Switch
                    checked={showPeopleValue}
                    onChange={showPeopleChange}
                  />
                </Form.Item>
              </>
            )}
            {!showPeopleValue && (
              <Form.Item<FieldType>
                label="变量名称"
                name="title"
                rules={[{required: true, validator: checkName}]}
              >
                <Input onChange={titleChange} />
              </Form.Item>
            )}
            {!showPeopleValue && (
              <>
                <Form.Item<FieldType> label="是否数组" name="array">
                  <Switch onChange={arrayChange} />
                </Form.Item>
                <Form.Item<FieldType> label="是否必填" name="required">
                  <Switch onChange={requiredChange} />
                </Form.Item>
                <Row gutter={10} style={{marginBottom: '10px'}}>
                  <Col span={6} style={{textAlign: 'right'}}>
                    默认值：
                  </Col>
                  {showFunc && (
                    <Col span={16}>
                      {formula == 'string' && !arrayValue
                        ? amisRender(
                            getSchemaTpl('tplFormulaControl', {
                              value: defaultValue,
                              variables: formuVariablesValue.current,
                              onChange: function (e) {
                                defaultFirm(e);
                              },
                              formulaEchoVal: false,
                              advancedFeature: advancedFeature
                            }),
                          {},
                          {
                            theme: amisEnv.theme
                          }
                          )
                        : formula == 'string' && arrayValue
                        ? amisRender(
                            getSchemaTpl('formulaControl-hour', {
                              variables: formuVariablesValue.current,
                              value: defaultValue,
                              onChange: function (e) {
                                defaultFirm(e);
                              },
                              formulaEchoVal: false,
                              advancedFeature: advancedFeature
                            }),
                            {

                            },
                            {
                              theme: amisEnv.theme
                            }
                          )
                        : formula == 'number' && !arrayValue
                        ? amisRender(
                            getSchemaTpl('formulaControl-hour', {
                              variables: formuVariablesValue.current,
                              value: defaultValue,
                              valueType: {
                                type: 'number',
                                placeholder: '请输入'
                              },
                              onChange: function (e) {
                                defaultFirm(e);
                              },
                              formulaEchoVal: false,
                              advancedFeature: advancedFeature
                            }),
                              {},
                              {
                                theme: amisEnv.theme
                              }
                          )
                        : formula == 'boolean' && !arrayValue
                        ? amisRender(
                            getSchemaTpl('formulaControl-hour', {
                              variables: formuVariablesValue.current,
                              value: defaultValue,
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
                                defaultFirm(e);
                              },
                              formulaEchoVal: false,
                              advancedFeature: advancedFeature
                            }),
                                {},
                                {
                                  theme: amisEnv.theme
                                }
                          )
                        : formula == 'objects' ?
                                amisRender(
                                  getSchemaTpl('formulaControl-hour', {
                                    variables: formuVariablesValue.current,
                                    containDisabled:true,
                                    value: defaultValue,
                                    onChange: function(e) {
                                      defaultFirm(e);
                                    },
                                    formulaEchoVal: false,
                                    advancedFeature: advancedFeature
                                  }),
                                  {},
                                  {
                                    theme: amisEnv.theme
                                  }
                                ) : amisRender(
                            getSchemaTpl('formulaControl-hour', {
                              variables: formuVariablesValue.current,
                              value: defaultValue,
                              onChange: function (e) {
                                defaultFirm(e);
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
                  )}
                </Row>
              </>
            )}
            {/* </Form.Item> */}
            <Form.Item<FieldType> label="描述" name="describe">
              <TextArea onChange={describeChange} />
            </Form.Item>
            {typeValue == 'objects' && (
              <>
                <Form.Item<FieldType> label="对象成员字段" name="properties">
                  <JSONSchemaEditor
                    onChange={propertiesChange}
                    value={propertiesValue}
                  />
                </Form.Item>
              </>
            )}
          </Form>
        </Modal>
        <Modal
          title="编辑变量"
          open={editModalOpen}
          onOk={editHandleOk}
          onCancel={editHandleCancel}
          destroyOnClose={true}
          cancelText={'取消'}
          okText={'确认'}
          maskClosable={false}
        >
          <Form
            name="basic"
            labelCol={{span: 6}}
            wrapperCol={{span: 16}}
            style={{maxWidth: 700}}
            form={editForms}
            autoComplete="off"
          >
            <Form.Item<FieldType>
              label="数据类型"
              name="type"
              rules={[{required: true}]}
            >
              <Select
                value={typeValue}
                onChange={typeChange}
                defaultValue={'string'}
                options={[
                  {
                    label: '字符串',
                    value: 'string'
                  },
                  {
                    label: '数字',
                    value: 'number'
                  },
                  {
                    label: '布尔',
                    value: 'boolean'
                  },
                  {
                    label: '实体对象',
                    value: 'object'
                  },
                  {
                    label: '自定义对象',
                    value: 'objects'
                    // value: 'object'
                  }
                ]}
              />
            </Form.Item>
            {typeValue == 'object' && (
              <>
                <Form.Item<FieldType>
                  label="实体模型"
                  name="model"
                  rules={[{required: true, validator: checkUser}]}
                >
                  <Space.Compact style={{width: '100%'}}>
                    <Input
                      // readOnly
                      allowClear
                      value={modelValue?.label}
                      placeholder="请选择"
                      onChange={modelChange}
                    />
                    <Button icon={<EllipsisOutlined />} onClick={newClick} />
                  </Space.Compact>
                  <Modal
                    title="实体选择"
                    open={entityModalOpen}
                    onOk={entityHandleOk}
                    onCancel={entityHandleCancel}
                    maskClosable={false}
                    cancelText={'取消'}
                    okText={'确认'}
                  >
                    <Search
                      style={{marginBottom: 8}}
                      placeholder="请输入"
                      onChange={entityChange}
                    />
                    <Tree
                      blockNode
                      defaultExpandAll
                      style={{height: '400px', overflow: 'auto'}}
                      onExpand={onExpand} // onExpand
                      expandedKeys={expandedKeys} // 展开固定树节点
                      autoExpandParent={true} // 是否自动展开父节点
                      onSelect={(e, data) => handleNodeClick(e, data)}
                    >
                      {renderTreeNodes(deptOptions)}
                    </Tree>
                  </Modal>
                </Form.Item>
                <Form.Item<FieldType>
                  label={
                    <>
                      <Tooltip title="打开时会将实体中的字段展示到当前变量层级中">
                        <span style={{color: 'red'}}>*</span>展示成员字段
                      </Tooltip>
                    </>
                  }
                  name="showPeople"
                >
                  <Switch
                    checked={showPeopleValue}
                    onChange={showPeopleChange}
                  />
                </Form.Item>
              </>
            )}
            {!showPeopleValue && (
              <Form.Item<FieldType>
                label="变量名称"
                name="title"
                rules={[{required: true, validator: checkName}]}
              >
                <Input onChange={titleChange} />
              </Form.Item>
            )}
            {!showPeopleValue && (
              <>
                <Form.Item<FieldType> label="是否数组" name="array">
                  <Switch onChange={arrayChange} defaultChecked={arrayValue} />
                </Form.Item>
                <Form.Item<FieldType> label="是否必填" name="required">
                  <Switch
                    onChange={requiredChange}
                    defaultChecked={requiredValue}
                  />
                </Form.Item>
              </>
            )}
            {/* <Form.Item<FieldType> label="默认值" name="default"> */}
            {!showPeopleValue && (
              <Row gutter={10} style={{marginBottom: '10px'}}>
                <Col span={6} style={{textAlign: 'right'}}>
                  默认值：
                </Col>
                {showFunc && (
                  <Col span={16}>
                    {formula == 'string' && !arrayValue
                      ? amisRender(
                          getSchemaTpl('tplFormulaControl', {
                            value: defaultValue,
                            variables: formuVariablesValue.current,
                            onChange: function (e) {
                              defaultFirm(e);
                            },
                            formulaEchoVal: false,
                            advancedFeature: advancedFeature
                          }),
                        {},
                        {
                          theme: amisEnv.theme
                        }
                        )
                      : formula == 'string' && arrayValue
                      ? amisRender(
                          getSchemaTpl('formulaControl-hour', {
                            value: defaultValue,
                            variables: formuVariablesValue.current,
                            onChange: function (e) {
                              defaultFirm(e);
                            },
                            formulaEchoVal: false,
                            advancedFeature: advancedFeature
                          }),
                          {},
                          {
                            theme: amisEnv.theme
                          }
                        )
                      : formula == 'number' && !arrayValue
                      ? amisRender(
                          getSchemaTpl('formulaControl-hour', {
                            variables: formuVariablesValue.current,
                            value: defaultValue,
                            valueType: {
                              type: 'number',
                              placeholder: '请输入'
                            },
                            onChange: function (e) {
                              defaultFirm(e);
                            },
                            formulaEchoVal: false,
                            advancedFeature: advancedFeature
                          }),
                            {},
                            {
                              theme: amisEnv.theme
                            }
                        )
                      : formula == 'boolean' && !arrayValue
                      ? amisRender(
                          getSchemaTpl('formulaControl-hour', {
                            variables: formuVariablesValue.current,
                            value: defaultValue,
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
                              defaultFirm(e);
                            },
                            formulaEchoVal: false,
                            advancedFeature: advancedFeature
                          }),
                          {},
                          {
                            theme: amisEnv.theme
                          }
                        )
                        : formula == 'array' &&
                        !arrayValue &&
                        arrayEditData.arrayType &&
                        arrayEditData.arrayType == 'boolean'
                      ? amisRender(
                          getSchemaTpl('formulaControl-hour', {
                            variables: formuVariablesValue.current,
                            value: defaultValue,
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
                              defaultFirm(e);
                            },
                            formulaEchoVal: false,
                            advancedFeature: advancedFeature
                          }),
                          {},
                          {
                            theme: amisEnv.theme
                          }
                        )
                              : formula == 'user' && !arrayValue
                                ? amisRender(
                                  {type: 'ae-formulaControl',
                                    value: defaultValue,
                                    variables: formuVariablesValue.current,
                                    onChange: function(e) {
                                      defaultFirm(e);
                                    },
                                    formulaEchoVal: false,
                                    advancedFeature: advancedFeature,
                                    rendererSchema: {
                                      'type': 'user-select',
                                      'searchable':true,
                                      'clearable':true,
                                      'rightButton':true,
                                      'selectMode': "associated",
                                      'leftMode': "tree",
                                      'source': "app://user/source"
                                    }
                                  },{},{fetcher: service, theme: amisEnv.theme}
                                )
                                : formula == 'users' && !arrayValue
                                  ? amisRender(
                                    {type: 'ae-formulaControl',
                                      value: defaultValue,
                                      variables: formuVariablesValue.current,
                                      onChange: function(e) {
                                        defaultFirm(e);
                                      },
                                      formulaEchoVal: false,
                                      advancedFeature: advancedFeature,
                                      rendererSchema: {
                                        'type': 'user-select',
                                        'multiple':true,
                                        'searchable':true,
                                        'clearable':true,
                                        'rightButton':true,
                                        'selectMode': "associated",
                                        'leftMode': "tree",
                                        'source': "app://user/source"
                                      }
                                    },{},{fetcher: service, theme: amisEnv.theme}
                                  ): formula == 'objects' ?
                                    amisRender(
                                      getSchemaTpl('formulaControl-hour', {
                                        variables: formuVariablesValue.current,
                                        containDisabled:true,
                                        value: defaultValue,
                                        onChange: function(e) {
                                          defaultFirm(e);
                                        },
                                        formulaEchoVal: false,
                                        advancedFeature: advancedFeature
                                      }),
                                      {},
                                      {
                                        theme: amisEnv.theme
                                      }
                                    ) : amisRender(
                          getSchemaTpl('formulaControl-hour', {
                            variables: formuVariablesValue.current,
                            value: defaultValue,
                            onChange: function (e) {
                              defaultFirm(e);
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
                )}
              </Row>
            )}
            {/* </Form.Item> */}
            <Form.Item<FieldType> label="描述" name="describe">
              <TextArea onChange={describeChange} />
            </Form.Item>
            {typeValue == 'objects' && (
              <>
                <Row gutter={10} style={{marginBottom: '10px'}}>
                  <Col span={6} style={{textAlign: 'right'}}>
                    对象成员字段：
                  </Col>
                  <Col span={16}>
                    <JSONSchemaEditor
                      onChange={propertiesChange}
                      value={propertiesValue}
                    />
                  </Col>
                </Row>
              </>
            )}
          </Form>
        </Modal>
      </Form>
    </>
  );
});
export default PorcessStartModule;
