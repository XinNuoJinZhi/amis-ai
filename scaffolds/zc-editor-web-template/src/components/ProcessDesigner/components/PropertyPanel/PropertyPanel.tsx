import React, {useEffect, useRef, useState} from 'react';
import {Collapse, Space, Typography} from 'antd';
import ElementBaseInfo from '@/bpmn/panel/ElementBaseInfo/ElementBaseInfo';

import ElementDocument from '@/bpmn/panel/ElementDocument/ElementDocument';
import ExtensionProperties from '@/bpmn/panel/ExtensionProperties/ExtensionProperties';
import SignalMessage from '@/bpmn/panel/SignalMessage/SignalMessage';
import ElementListener from '@/bpmn/panel/ElementListener/ElementListener';
import ElementTask from '@/bpmn/panel/ElementTask/ElementTask';
import MultiInstance from '@/bpmn/panel/MultiInstance/MultiInstance';
import ElementForm from '@/bpmn/panel/ElementForm/ElementForm';
import ElementSettings from '@/bpmn/panel/ElementSettings/ElementSettings';
import ElementTime from '@/bpmn/panel/ElementTime/ElementTime';
import ElementMessage from '@/bpmn/panel/ElementTime/ElementMessage';
import ElementParameters from '@/bpmn/panel/ElementProcessParameters/startModule';
import {
  AppstoreOutlined,
  AuditOutlined,
  BellOutlined,
  BulbTwoTone,
  DatabaseTwoTone,
  DeploymentUnitOutlined,
  FileOutlined,
  FileTextOutlined,
  FileTwoTone,
  FireOutlined,
  InfoCircleOutlined,
  NodeIndexOutlined,
  NotificationOutlined,
  OrderedListOutlined,
  RetweetOutlined,
  SoundOutlined
} from '@ant-design/icons';
import {initBpmnInstance} from '@/bpmn/util/windowUtil';
import {useAppDispatch, useAppSelector} from '@/redux/hook/hooks';
import FlowCondition from '@/bpmn/panel/FlowCondition/FlowCondition';
import './s.css';
import {handleServiceRaskList,handleEntityList} from '@/redux/slice/bpmnSlice';
import {getOptionsAll} from '@/api/bpmn';
import {getDataPropsAsOptions} from './DataScope';
interface IProps {
  modeler: any;
}

/**
 * 属性面板
 * @param props
 * @constructor
 */
export default function PropertyPanel(props: IProps) {
  console.log(props, 'propspropspropspropsprops 属性面板1111111');
  // props属性
  const {modeler} = props;
  console.log(
    modeler,
    'modelermodelermodelermodelermodelermodelermodelermodelermodelermodeler'
  );
  // state
  const [element, setElement] = useState<any>();
  const [businessObject, setBusinessObject] = useState<any>();
  const [modeling, setModeling] = useState<any>();
  const [bpmnFactory, setBpmnFactory] = useState<any>();
  const [moddle, setModdel] = useState<any>();
  const [rootElements, setRootElements] = useState([]);
  const prefaceData = useRef([]) // 前序节点数据存储
  const sourceData = useRef([]) // 前序节点数据存储
  const serviceListData = useRef({});
  // redux
  const processId = useAppSelector(state => state.bpmn.processId);
  const colorPrimary = useAppSelector(state => state.theme.colorPrimary);
  console.log(processId, 'processId');
  const dispatch = useAppDispatch();

  // 是否开启绑定发起页面
  const [bindShow, setBindShow] = useState(true);
  // 是否开启定时开关
  const [timeShow, setTimeShow] = useState(true);
  // 是否开启事件触发开关
  const [eventTriggering, setEventTriggering] = useState(true);

  const serviceList = useAppSelector(state => state.bpmn.serviceRaskList);
  const serviceListValue = useRef({});
  // 点击节点上下文数据存储
  const contextData = useRef([]);
  // 点击节点上下文用户组件数据存储
  const getUserList = useRef([]);
  // 点击节点上下文新增服务上下文数据
  const getXinList = useRef([]);
  // 查询服务上下文数据
  const queryList = useRef([]);
  // 点击节点上下文调用服务节点数据
  const callList = useRef([]);
  // 获取用户为填写以及开始节点开启事件触发的节点数据
  const doubleList = useRef([])
  // 获取自定义处理器节点数据
  const processorList = useRef([])

  const assignmentData = needData => {
    let data = {
      type: '',
      required: [],
      properties: {}
    };
    needData.forEach(res => {
      data.type = 'object';
      if (res.required) {
        data.required.push(res.title);
      }
      if (res.array) {
        if (res.type == 'objects') {
          data.properties[res.title] = {
            type: 'array',
            title: res.title,
            arrayType: res.type,
            default: res.default,
            describe: res.describe,
            items: res.items
              ? res.items
              : res.properties.properties
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
              : {
                  properties: res.properties,
                  type: 'object',
                  required: []
                }
          };
          console.log(data, 'aaaaaaaaa');
        } else if (res.type == 'object') {
          data.properties[res.title] = {
            type: 'array',
            title: res.title,
            arrayType: 'entity',
            default: res.default,
            describe: res.describe,
            entity: {...res.entity},
            items: {...items}
          };
        } else {
          data.properties[res.title] = {
            type: 'array',
            title: res.title,
            arrayType: res.arrayType ? res.arrayType : res.type,
            default: res.default,
            describe: res.describe,
            items: {
              type: res.type
            }
          };
        }
      } else {
        if (res.type == 'objects') {
          data.properties[res.title] = {
            type: 'object',
            types: res.type,
            title: res.title,
            default: res.default,
            describe: res.describe,
            properties: res.properties
          };
        } else if (res.type == 'object' && res.properties) {
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
        } else {
          data.properties[res.title] = {
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
    let inputsList = {
      type: 'object',
      required: [],
      properties: {
        processInstanceStartVariables: {
          type: 'object',
          required: [],
          title: '流程参数',
          value: 'processInstanceStartVariables',
          ...data
        }
      }
    };
    let formuVar = getDataPropsAsOptions(inputsList);
    sessionStorage.setItem('startList', JSON.stringify(formuVar));
  };
  /**
   * 初始化
   */
  useEffect(() => {
    initBpmnInstance();
    // 避免初始化，流程图未加载完导致出错
    console.log('初始化进入');
    console.log(processId, 'processIdprocessIdprocessIdprocessId');
    serviceListData.current = {}
    if (modeler) {
      sessionStorage.removeItem('startList');
      console.log('init方法');
      init();
      let allData = modeler.get('elementRegistry').getAll();
      if (allData.length > 0) {
        allData.forEach(item => {
          if (item.type == 'bpmn:StartEvent') {
            console.log(item, '获取开始节点数据');
            // sessionStorage.setItem('startList', JSON.stringify(formuVar));
            if (item.businessObject.processInstanceStartVariables) {
              let fgie = JSON.parse(
                item.businessObject.processInstanceStartVariables
              );
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
                inputList.push({...inpu, key: inpu.title});
              }
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
              assignmentData(inputList);
            }
          }
        });
      }
    }
  }, [processId]);

  /**
   * 初始化时,设置监听器
   * 1.这部分不直接放到 init() 方法里,是为了防止在用户主动修改processId时,产生多个监听器
   * 2.特别注意: 监听器只能设置一次，如果执行多次，会设置多个监听器,浪费资源
   */
  useEffect(() => {
    console.log(modeler, '监听器');
    // 避免初始化，流程图未加载完导致出错
    if (modeler) {
      // 设置监听器，监听所有工作就绪后，默认选中process节点 (TODO 2022/12/4 注意:没有找到关于 import.done 事件,目前这段代码是没有执行到的,先放这里吧)
      modeler?.on('import.done', (e: any) => {
        confirmCurrentElement(null);
        // 获取rootElements
        setRootElements(modeler.getDefinitions().rootElements);
        window.bpmnInstance.rootElements =
          modeler.getDefinitions().rootElements;
      });
      // 设置监听器，监听选中节点变化 (特别注意：监听器只能设置一次，如果执行多次，会设置多个监听器)
      modeler?.on('selection.changed', (e: any) => {
        console.log(e, 'eeeeeeeeeeeeeeeeeeeee');
        console.log(modeler);
        console.log(modeler.get('modeling'));
        console.log(modeler.get('moddle'));
        console.log(modeler.get('bpmnFactory'));
        // console.log(modeler.get('modeling').getIncoming(e),'1111111111111111111111')
        confirmCurrentElement(e.newSelection[0] || null);
      });
      // 设置监听器，监听当前节点属性变化
      modeler?.on('element.changed', ({element}: any) => {
        console.log(
          element,
          'elementelementelement设置监听器，监听当前节点属性变化'
        );
        console.log(
          window,
          'windowwindowwindowwindow设置监听器，监听当前节点属性变化'
        );
        console.log(
          element.businessObject.bindInitiationPage,
          'element.businessObject.bindInitiationPage'
        );
        let arr: any = [];
        let arrs: any = [];
        if (element.type != 'bpmn:ServiceTask') {
          console.log(serviceListValue, 'serviceListValue');
          console.log(element.id, 'element.id');
          serviceListValue.current.forEach(uten => {
            if (uten.serviceTaskId == element.id) {
              arr.push(uten);
            }
          });
        }
        console.log(arr, 'arrarrarrarrarrarr');
        if (arr.length == 0) {
          arrs = serviceListValue.current;
        } else {
          serviceListValue.current.forEach(elements => {
            arr.forEach(is => {
              if (elements.id != is.id) {
                arrs.push(elements);
              }
            });
          });
        }
        console.log(arrs, 'arrs');
        dispatch(handleServiceRaskList(arrs));
        if (element.businessObject.bindInitiationPage) {
          setBindShow(true);
        } else {
          setBindShow(false);
        }
        if (element.businessObject.timerTaskSwitch) {
          setTimeShow(true);
        } else {
          setTimeShow(false);
        }
        if (element.businessObject.eventTriggering) {
          setEventTriggering(true);
        } else {
          setEventTriggering(false);
        }
        if (
          element &&
          window.bpmnInstance.element &&
          element.id === window.bpmnInstance.element.businessObject.id
        ) {
          confirmCurrentElement(element);
        }
      });
      modeler?.on('connect.end', (element: any) => {
        console.log(element,'线移除')
        const { source, target } = element.context.connection;
        prefaceData.current = []
        sourceData.current = target
        console.log(source,'source')
        console.log(source.businessObject,'source.businessObject')
        isPredecessor(source.businessObject.incoming)
        console.log(prefaceData.current,'prefaceData.current')
        console.log(sourceData.current,'sourceData.current')
        if(prefaceData.current.length>0){
          prefaceData.current.forEach(res=>{
            if(res.id == sourceData.current.id){
              let modelFunction = modeler.get('modeling', true)
              modelFunction.removeConnection(element.context.connection)
            }
          })
        }
      });
    }
    console.log('监听器');
  }, [modeler]);
  useEffect(() => {
    console.log(serviceList, 'serviceListserviceListserviceList');
    serviceListValue.current = serviceList;
  }, [serviceList]);

  function isPredecessor(e) {
    if (e) {
      if (e.length == 1) {
        let haveSame:any = []
        console.log(prefaceData.current,'prefaceData.current')
        if(prefaceData.current.length>0){
          haveSame = prefaceData.current.filter(pres=>{
            return pres.id == e[0].sourceRef.id
          })
        }
        console.log(haveSame,'haveSame')
        if(haveSame.length>0){
          return
        }
        if (e[0].sourceRef.incoming) {
          prefaceData.current.push(e[0].sourceRef)
          isPredecessor(e[0].sourceRef.incoming);
        }
      } else {
        e.forEach(res => {
          let haveSame:any = []
        console.log(prefaceData.current,'prefaceData.current')
        if(prefaceData.current.length>0){
          haveSame = prefaceData.current.filter(pres=>{
            return pres.id == res.sourceRef.id
          })
        }
        console.log(haveSame,'haveSame')
        if(haveSame.length>0){
          return
        }
          if (res.sourceRef.incoming) {
            prefaceData.current.push(res.sourceRef)
            isPredecessor(res.sourceRef.incoming);
          }
        });
      }
    }
  }
  function init() {
    console.log(modeler, '【初始化bpmn实例】2、初始化,设置实际值');
    // 设置window的bpmnInstance对象属性
    window.bpmnInstance.modeler = modeler;
    window.bpmnInstance.elementRegistry = modeler.get('elementRegistry');
    window.bpmnInstance.modeling = modeler.get('modeling', true);
    window.bpmnInstance.bpmnFactory = modeler.get('bpmnFactory', true);
    window.bpmnInstance.moddle = modeler.get('moddle', true);
    console.log('【初始化bpmn实例】3、初始化完成');

    // 获取modeling
    setModeling(modeler.get('modeling', true));
    // 获取bpmnFactory
    setBpmnFactory(modeler.get('bpmnFactory', true));
    // 获取moddle
    setModdel(modeler.get('moddle', true));

    //设置默认选中流程process节点
    confirmCurrentElement(null);
    console.log(window, 'windowwindowwindowwindow');
  }

  /**
   * 确认当前选中节点
   * @param element
   */
  function confirmCurrentElement(element: any) {
    if(element){
      if(JSON.stringify(serviceListData.current) === '{}'){
        getOptionsAll({
          withSystemFields: true,
          withRelationFields: true
        }).then(item => {
          serviceListData.current = item.data;
          dispatch(handleEntityList(item.data));
        })
      }
    }
    console.log(element,'确认当前节点element')
    contextData.current = [];
    getUserList.current = [];
    getXinList.current = [];
    queryList.current = [];
    callList.current = [];
    doubleList.current = [];
    processorList.current = [];
    sessionStorage.removeItem('userList');
    sessionStorage.removeItem('getUserList');
    sessionStorage.removeItem('getXinList');
    sessionStorage.removeItem('queryList');
    sessionStorage.removeItem('callList');
    sessionStorage.removeItem('doubleList');
    sessionStorage.removeItem('processorList');
    if(element && element.businessObject){
      if (element.businessObject.incoming || element.businessObject.sourceRef || (element.incoming && element.incoming.length>0)) {
      console.log('进入1111')
      prefaceData.current = []
      if(element.incoming && element.incoming.length>0){
           getTopNode(element.incoming);
      }else{
        getTopNode(element.businessObject.incoming || element?.businessObject?.sourceRef?.incoming || element.incoming);
      }
      console.log(serviceListValue, 'serviceListserviceListserviceList');
      console.log(contextData.current, '获取上下文数据');
      sessionStorage.setItem('userList', JSON.stringify(contextData.current));
      sessionStorage.setItem('getUserList',JSON.stringify(getUserList.current));
      sessionStorage.setItem('getXinList', JSON.stringify(getXinList.current));
      sessionStorage.setItem('queryList', JSON.stringify(queryList.current));
      sessionStorage.setItem('callList', JSON.stringify(callList.current));
      sessionStorage.setItem('doubleList', JSON.stringify(doubleList.current));
      sessionStorage.setItem('processorList', JSON.stringify(processorList.current));
    }
    }
    // 如果element为空，则设置流程节点为当前节点，否则设置选中节点为当前节点 (点击canvas空白处默认指流程节点)
    if (!element) {
      console.log('确认当前选中节点', element);
      // 查询流程节点的id,并通过id获取流程节点
      if(modeler.getDefinitions()){
        const newId = modeler.getDefinitions().rootElements[0].id;
        let processElement: any = modeler.get('elementRegistry').get(newId);
        setElement(processElement);
        window.bpmnInstance.element = processElement;
        setBusinessObject(
          JSON.parse(JSON.stringify(processElement?.businessObject || null))
        );
      }
      console.log(element, 'elementelementelementelementelementelement');
      return;
    }
    window.bpmnInstance.element = element;
    let str:any = [];
    let cache = JSON.stringify(element.businessObject, function (key, value) {
      if (typeof value === 'object' && value !== null) {
        if (str.indexOf(value) !== -1) {
          return;
        }
        str.push(value);
      }
      return value;
    });
    str = null;
    setBusinessObject(JSON.parse(cache));
    setElement(element);
    console.log(element, 'elementelementelementelementelementelement');
    console.log(element.businessObject.incoming, '是否存在前序节点');
    // console.log(element.businessObject.incoming.length)
    // console.log(element.businessObject.incoming.length>0)
    if (element.businessObject.bindInitiationPage) {
      setBindShow(true);
    } else {
      setBindShow(false);
    }
    if (element.businessObject.timerTaskSwitch) {
      setTimeShow(true);
    } else {
      setTimeShow(false);
    }
    if (element.businessObject.eventTriggering) {
      setEventTriggering(true);
    } else {
      setEventTriggering(false);
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
  // 获取连接到点击节点的前序节点
  function getTopNode(e) {
    console.log(e, '获取连接到点击节点的前序节点');
    console.log(e.length, '数组长度');
    // console.log(typeof e, '判断e的类型');
    if (e) {
      if (e.length == 1) {
        if(e[0].sourceRef){
          if (e[0].sourceRef.data && (e[0].sourceRef.$type == 'bpmn:UserTask' || e[0].sourceRef.$type == 'bpmn:StartEvent')) {
            console.log(e[0], 'resresresresres');
            let sourceRefData = JSON.parse(e[0].sourceRef.data);
            console.log(sourceRefData,'sourceRefData')
            contextData.current.push({
              id: e[0].sourceRef.id,
              name: e[0].sourceRef.name ? e[0].sourceRef.name : e[0].sourceRef.id,
              data: sourceRefData.map(item => {
                return {
                  ...item,
                  // children:item.columns?item.columns:[],
                  tag: getTypeChinese(item.type)
                };
              })
            });
          }
          if (e[0].sourceRef.$type == 'bpmn:ServiceTask') {
            getRetaion(e[0].sourceRef.id,e[0].sourceRef.name);
          }
          if (e[0].sourceRef.$type == 'bpmn:UserTask' || e[0].sourceRef.$type == 'bpmn:StartEvent') {
            if(e[0].sourceRef.$type == 'bpmn:StartEvent'
              && (e[0].sourceRef.filterMode || e[0].sourceRef.bindInitiationPage) &&
              !e[0].sourceRef.timerTaskSwitch){
              getUserList.current.push({
                id: e[0].sourceRef.name ? e[0].sourceRef.name : e[0].sourceRef.id,
                nodeId: e[0].sourceRef.id,
                name: e[0].sourceRef.name ? e[0].sourceRef.name : e[0].sourceRef.id,
                type:e[0].sourceRef.$type
              });
            }
            if (e[0].sourceRef.$type == 'bpmn:UserTask'){
              getUserList.current.push({
                id: e[0].sourceRef.name ? e[0].sourceRef.name : e[0].sourceRef.id,
                nodeId: e[0].sourceRef.id,
                name: e[0].sourceRef.name ? e[0].sourceRef.name : e[0].sourceRef.id,
                type:e[0].sourceRef.$type
              });
            }
            console.log(e[0].sourceRef,'e[0].sourceRef')
            if(e[0].sourceRef.$type == 'bpmn:StartEvent' && (e[0].sourceRef.eventTriggering || e[0].sourceRef.bindInitiationPage)){
              console.log('进入')
              doubleList.current.push({
                id: e[0].sourceRef.name ? e[0].sourceRef.name : e[0].sourceRef.id,
                nodeId: e[0].sourceRef.id,
                name: e[0].sourceRef.name ? e[0].sourceRef.name : e[0].sourceRef.id,
                type:e[0].sourceRef.$type,
                modelEventTarget:e[0].sourceRef.modelEventTarget,
              })
            }
            if(e[0].sourceRef.$type == 'bpmn:UserTask' && e[0].sourceRef.userTaskType == 1){
              doubleList.current.push({
                id: e[0].sourceRef.name ? e[0].sourceRef.name : e[0].sourceRef.id,
                nodeId: e[0].sourceRef.id,
                name: e[0].sourceRef.name ? e[0].sourceRef.name : e[0].sourceRef.id,
                type:e[0].sourceRef.$type
              })
            }
          }
          let haveSame:any = []
          console.log(prefaceData.current,'prefaceData.current')
          if(prefaceData.current.length>0){
            haveSame = prefaceData.current.filter(pres=>{
              return pres.id == e[0].sourceRef.id
            })
          }
          console.log(haveSame,'haveSame')
          if(haveSame.length>0){
            return
          }
          if (e[0].sourceRef.incoming) {
            prefaceData.current.push(e[0].sourceRef)
            getTopNode(e[0].sourceRef.incoming);
          }
        }else if(e[0].businessObject?.sourceRef){
          if (e[0].businessObject.sourceRef.data && (e[0].businessObject.sourceRef.$type == 'bpmn:UserTask' || e[0].businessObject.sourceRef.$type == 'bpmn:StartEvent')) {
            console.log(e[0], 'resresresresres');
            let sourceRefData = JSON.parse(e[0].businessObject.sourceRef.data);
            console.log(sourceRefData,'sourceRefData')
            contextData.current.push({
              id: e[0].businessObject.sourceRef.id,
              name: e[0].businessObject.sourceRef.name ? e[0].businessObject.sourceRef.name : e[0].businessObject.sourceRef.id,
              data: sourceRefData.map(item => {
                return {
                  ...item,
                  // children:item.columns?item.columns:[],
                  tag: getTypeChinese(item.type)
                };
              })
            });
          }
          if (e[0].businessObject.sourceRef.$type == 'bpmn:ServiceTask') {
            getRetaion(e[0].businessObject.sourceRef.id,e[0].businessObject.sourceRef.name);
          }
          if (e[0].businessObject.sourceRef.$type == 'bpmn:UserTask' || e[0].businessObject.sourceRef.$type == 'bpmn:StartEvent') {
            if(e[0].businessObject.sourceRef.$type == 'bpmn:StartEvent'
              && (e[0].businessObject.sourceRef.filterMode || e[0].businessObject.sourceRef.bindInitiationPage) &&
              !e[0].businessObject.sourceRef.timerTaskSwitch){
              getUserList.current.push({
                id: e[0].businessObject.sourceRef.name ? e[0].businessObject.sourceRef.name : e[0].businessObject.sourceRef.id,
                nodeId: e[0].businessObject.sourceRef.id,
                name: e[0].businessObject.sourceRef.name ? e[0].businessObject.sourceRef.name : e[0].businessObject.sourceRef.id,
                type:e[0].businessObject.sourceRef.$type
              });
            }
            if (e[0].businessObject.sourceRef.$type == 'bpmn:UserTask'){
              getUserList.current.push({
                id: e[0].businessObject.sourceRef.name ? e[0].businessObject.sourceRef.name : e[0].businessObject.sourceRef.id,
                nodeId: e[0].businessObject.sourceRef.id,
                name: e[0].businessObject.sourceRef.name ? e[0].businessObject.sourceRef.name : e[0].businessObject.sourceRef.id,
                type:e[0].businessObject.sourceRef.$type
              });
            }
            console.log(e[0].businessObject.sourceRef,'e[0].businessObject.sourceRef')
            if(e[0].businessObject.sourceRef.$type == 'bpmn:StartEvent' && (e[0].businessObject.sourceRef.eventTriggering || e[0].businessObject.sourceRef.bindInitiationPage)){
              console.log('进入')
              doubleList.current.push({
                id: e[0].businessObject.sourceRef.name ? e[0].businessObject.sourceRef.name : e[0].businessObject.sourceRef.id,
                nodeId: e[0].businessObject.sourceRef.id,
                name: e[0].businessObject.sourceRef.name ? e[0].businessObject.sourceRef.name : e[0].businessObject.sourceRef.id,
                type:e[0].businessObject.sourceRef.$type,
                modelEventTarget:e[0].businessObject.sourceRef.modelEventTarget,
              })
            }
            if(e[0].businessObject.sourceRef.$type == 'bpmn:UserTask' && e[0].businessObject.sourceRef.userTaskType == 1){
              doubleList.current.push({
                id: e[0].businessObject.sourceRef.name ? e[0].businessObject.sourceRef.name : e[0].businessObject.sourceRef.id,
                nodeId: e[0].businessObject.sourceRef.id,
                name: e[0].businessObject.sourceRef.name ? e[0].businessObject.sourceRef.name : e[0].businessObject.sourceRef.id,
                type:e[0].businessObject.sourceRef.$type
              })
            }
          }
          let haveSame:any = []
          console.log(prefaceData.current,'prefaceData.current')
          if(prefaceData.current.length>0){
            haveSame = prefaceData.current.filter(pres=>{
              return pres.id == e[0].businessObject.sourceRef.id
            })
          }
          console.log(haveSame,'haveSame')
          if(haveSame.length>0){
            return
          }
          if (e[0].businessObject.sourceRef.incoming) {
            prefaceData.current.push(e[0].businessObject.sourceRef)
            getTopNode(e[0].businessObject.sourceRef.incoming);
          }
        }
      } else {
        e.forEach(res => {
          if(res.sourceRef){
            if (res.sourceRef.data && (res.sourceRef.$type == 'bpmn:UserTask' || res.sourceRef.$type == 'bpmn:StartEvent')) {
              let sourceRefData = JSON.parse(res.sourceRef?.data);
              console.log(sourceRefData,'sourceRefData')
              contextData.current.push({
                id: res.sourceRef.id,
                name: res.sourceRef.name ? res.sourceRef.name : res.sourceRef.id,
                // data: JSON.parse(res.sourceRef?.data)
                data: sourceRefData.map(item => {
                  return {
                    ...item,
                    // children:item.columns?item.columns:[],
                    tag: getTypeChinese(item.type)
                  };
                })
              });
            }
            if (!res.sourceRef.data && (res.sourceRef.$type == 'bpmn:UserTask' || res.sourceRef.$type ==  'bpmn:StartEvent')) {
              contextData.current.push({
                id: res.sourceRef.id,
                name: res.sourceRef.name ? res.sourceRef.name : res.sourceRef.id
              });
            }
            if (res.sourceRef.$type == 'bpmn:UserTask' || res.sourceRef.$type == 'bpmn:StartEvent'
            ) {
              if(res.sourceRef.$type == 'bpmn:StartEvent'
                && (res.sourceRef.filterMode || res.sourceRef.bindInitiationPage) &&
                !res.sourceRef.timerTaskSwitch) {
                getUserList.current.push({
                  id: res.sourceRef.name ? res.sourceRef.name : res.sourceRef.id,
                  nodeId: res.sourceRef.id,
                  name: res.sourceRef.name ? res.sourceRef.name : res.sourceRef.id,
                  type: res.sourceRef.$type
                });
              }
              if(res.sourceRef.$type == 'bpmn:UserTask'){
                getUserList.current.push({
                  id: res.sourceRef.name ? res.sourceRef.name : res.sourceRef.id,
                  nodeId: res.sourceRef.id,
                  name: res.sourceRef.name ? res.sourceRef.name : res.sourceRef.id,
                  type: res.sourceRef.$type
                });
              }
            console.log(e[0].sourceRef,'e[0].sourceRef11111111111')
            if(e[0].sourceRef.$type == 'bpmn:StartEvent' &&  (e[0].sourceRef.eventTriggering || e[0].sourceRef.bindInitiationPage)){
              doubleList.current.push({
                id: res.sourceRef.name ? res.sourceRef.name : res.sourceRef.id,
                nodeId: res.sourceRef.id,
                name: res.sourceRef.name ? res.sourceRef.name : res.sourceRef.id,
                type: res.sourceRef.$type,
                modelEventTarget:res.sourceRef.modelEventTarget,
              })
            }
            if(e[0].sourceRef.$type == 'bpmn:UserTask' && e[0].sourceRef.userTaskType==1){
              doubleList.current.push({
                id: res.sourceRef.name ? res.sourceRef.name : res.sourceRef.id,
                nodeId: res.sourceRef.id,
                name: res.sourceRef.name ? res.sourceRef.name : res.sourceRef.id,
                type: res.sourceRef.$type
              })
            }
            }
            let haveSame:any = []
          console.log(prefaceData.current,'prefaceData.current')
          if(prefaceData.current.length>0){
            haveSame = prefaceData.current.filter(pres=>{
              return pres.id == res.sourceRef.id
            })
          }
          console.log(haveSame,'haveSame')
          if(haveSame.length>0){
            return
          }
            if (res.sourceRef.incoming) {
              prefaceData.current.push(res.sourceRef)
              getTopNode(res.sourceRef.incoming);
            }
          }else if(res.businessObject.sourceRef){
            if (res.businessObject.sourceRef.data && (res.businessObject.sourceRef.$type == 'bpmn:UserTask' || res.businessObject.sourceRef.$type == 'bpmn:StartEvent')) {
              let sourceRefData = JSON.parse(res.businessObject.sourceRef?.data);
              console.log(sourceRefData,'sourceRefData')
              contextData.current.push({
                id: res.businessObject.sourceRef.id,
                name: res.businessObject.sourceRef.name ? res.businessObject.sourceRef.name : res.businessObject.sourceRef.id,
                data: sourceRefData.map(item => {
                  return {
                    ...item,
                    tag: getTypeChinese(item.type)
                  };
                })
              });
            }
            if (!res.businessObject.sourceRef.data && (res.businessObject.sourceRef.$type == 'bpmn:UserTask' || res.businessObject.sourceRef.$type ==  'bpmn:StartEvent')) {
              contextData.current.push({
                id: res.businessObject.sourceRef.id,
                name: res.businessObject.sourceRef.name ? res.businessObject.sourceRef.name : res.businessObject.sourceRef.id
              });
            }
            if (res.businessObject.sourceRef.$type == 'bpmn:UserTask' || res.businessObject.sourceRef.$type == 'bpmn:StartEvent'
            ) {
              if(res.businessObject.sourceRef.$type == 'bpmn:StartEvent'
                && (res.businessObject.sourceRef.filterMode || res.businessObject.sourceRef.bindInitiationPage) &&
                !res.businessObject.sourceRef.timerTaskSwitch) {
                getUserList.current.push({
                  id: res.businessObject.sourceRef.name ? res.businessObject.sourceRef.name : res.businessObject.sourceRef.id,
                  nodeId: res.businessObject.sourceRef.id,
                  name: res.businessObject.sourceRef.name ? res.businessObject.sourceRef.name : res.businessObject.sourceRef.id,
                  type: res.businessObject.sourceRef.$type
                });
              }
              if(res.businessObject.sourceRef.$type == 'bpmn:UserTask'){
                getUserList.current.push({
                  id: res.businessObject.sourceRef.name ? res.businessObject.sourceRef.name : res.businessObject.sourceRef.id,
                  nodeId: res.businessObject.sourceRef.id,
                  name: res.businessObject.sourceRef.name ? res.businessObject.sourceRef.name : res.businessObject.sourceRef.id,
                  type: res.businessObject.sourceRef.$type
                });
              }
              console.log(e[0].businessObject.sourceRef,'e[0].sourceRef11111111111')
              if(e[0].businessObject.sourceRef.$type == 'bpmn:StartEvent' &&  (e[0].businessObject.sourceRef.eventTriggering || e[0].businessObject.sourceRef.bindInitiationPage)){
                doubleList.current.push({
                  id: res.businessObject.sourceRef.name ? res.businessObject.sourceRef.name : res.businessObject.sourceRef.id,
                  nodeId: res.businessObject.sourceRef.id,
                  name: res.businessObject.sourceRef.name ? res.businessObject.sourceRef.name : res.businessObject.sourceRef.id,
                  type: res.businessObject.sourceRef.$type,
                  modelEventTarget:res.businessObject.sourceRef.modelEventTarget,
                })
              }
              if(e[0].businessObject.sourceRef.$type == 'bpmn:UserTask' && e[0].businessObject.sourceRef.userTaskType==1){
                doubleList.current.push({
                  id: res.businessObject.sourceRef.name ? res.businessObject.sourceRef.name : res.businessObject.sourceRef.id,
                  nodeId: res.businessObject.sourceRef.id,
                  name: res.businessObject.sourceRef.name ? res.businessObject.sourceRef.name : res.businessObject.sourceRef.id,
                  type: res.businessObject.sourceRef.$type
                })
              }
            }
            let haveSame:any = []
            console.log(prefaceData.current,'prefaceData.current')
            if(prefaceData.current.length>0){
              haveSame = prefaceData.current.filter(pres=>{
                return pres.id == res.businessObject.sourceRef.id
              })
            }
            console.log(haveSame,'haveSame')
            if(haveSame.length>0){
              return
            }
            if (res.businessObject.sourceRef.incoming) {
              prefaceData.current.push(res.businessObject.sourceRef)
              getTopNode(res.businessObject.sourceRef.incoming);
            }
          }
        });
      }
    }
  }
  // 获取前序查询服务节点数据
  function getRetaion(e,eName) {
    console.log(e, 'id');
    console.log(eName, 'eName');
    console.log(serviceListValue, 'serviceListValue');
    serviceListValue.current.forEach(element => {
      // 获取前序查询节点数据
      if (
        element.serviceTaskId == e &&
        element.taskType == 4 &&
        element.queryRecordsOutputParameterName != null &&
        element.columnInfo != null &&
        element.columnInfo.length > 0
      ) {
        console.log(element, '11111111111');
        console.log(businessObject,'sjkadnhsajkdnas');
        let columnInfoData =
          typeof element.columnInfo == 'string'
            ? JSON.parse(element.columnInfo)
            : element.columnInfo;
        if (element.queryRecords == 1) {
          let fieldsArr: any = [];
          if (element.fields) {
            fieldsArr = [...element.fields];
          }
          let relaArr: any = [];
          if (element.relationFields) {
            relaArr = [...element.relationFields];
          }
          let ars: any = [];
          let fars: any = [];
          relaArr.forEach(sa => {
            columnInfoData.forEach(des => {
              if (des.includes('.')) {
                let top = des.split('.')[0];
                let last = des.split('.')[1];
                console.log(sa, 'sa');
                console.log(top, 'top');
                console.log(last, 'last');
                if (last == sa.key && sa.relationKey == top) {
                  ars.push({
                    ...sa,
                    title: sa.label,
                    value: sa.relationKey + '.' + sa.key
                  });
                }
              }
            });
          });
          fieldsArr.forEach(sa => {
            columnInfoData.forEach(des => {
              if (des == sa.key) {
                fars.push({...sa, title: sa.label, value: sa.key});
              }
            });
          });
          let relationArr = buildTree(ars);
          let recordsData = {
            type: 'object',
            required: [],
            properties: {}
          };
          fars.forEach(res => {
            recordsData.properties[res.value] = {
              type: res.type,
              // type: 'object',
              required: [],
              title: res.label,
              label: res.label,
              value: res.value
            };
          });
          relationArr.forEach(res => {
            let ard = {};
            if (res.children && res.children.length > 0) {
              res.children.forEach(element => {
                ard[element.key] = {
                  type: element.type,
                  required: [],
                  title: element.label,
                  label: element.label,
                  value: element.relationKey + '.' + element.key
                };
              });
            }
            console.log(res, 'sssssss');
            recordsData.properties[res.value] = {
              type: 'array',
              required: [],
              title: res.label,
              label: res.label,
              value: res.value,
              items: {
                required: [],
                title: '成员',
                type: 'object',
                properties: ard
              }
            };
          });
          let recordsData1 = {
            properties: {},
            type: 'object',
            required: []
          };
          if(typeof eName == 'undefined'){
            recordsData1.properties[e] = {
              value: e,
              title: e,
              type: 'object',
              properties: {}
            };
            recordsData1.properties[e].properties[
              element.queryRecordsOutputParameterName
            ] = {
              value: element.queryRecordsOutputParameterName,
              title: element.queryRecordsOutputParameterName,
              label: element.queryRecordsOutputParameterName,
              type: 'object',
              properties: recordsData.properties
            };
          }else{
            recordsData1.properties[e] = {
              value: e,
              title: eName,
              type: 'object',
              properties: {}
            };
            recordsData1.properties[e].properties[
              element.queryRecordsOutputParameterName
            ] = {
              value: element.queryRecordsOutputParameterName,
              title: element.queryRecordsOutputParameterName,
              label: element.queryRecordsOutputParameterName,
              type: 'object',
              properties: recordsData.properties
            };
          }
          console.log(recordsData, 'recordsData');
          console.log(recordsData1, 'recordsData1');
          console.log(
            getDataPropsAsOptions(recordsData1),
            'getDataPropsAsOptions(recordsData1)'
          );
          let scs = getDataPropsAsOptions(recordsData1);
          queryList.current.push(scs[0]);
        }
        if (element.queryRecords == 2) {
          let fieldsArr: any = [];
          if (element.fields) {
            fieldsArr = [...element.fields];
          }
          let relaArr: any = [];
          if (element.relationFields) {
            relaArr = [...element.relationFields];
          }
          let ars: any = [];
          let fars: any = [];
          relaArr.forEach(sa => {
            columnInfoData.forEach(des => {
              if (des.includes('.')) {
                let top = des.split('.')[0];
                let last = des.split('.')[1];
                console.log(sa, 'sa');
                console.log(top, 'top');
                console.log(last, 'last');
                if (last == sa.key && sa.relationKey == top) {
                  ars.push({
                    ...sa,
                    title: sa.label,
                    value: sa.relationKey + '.' + sa.key
                  });
                }
              }
            });
          });
          fieldsArr.forEach(sa => {
            columnInfoData.forEach(des => {
              if (des == sa.key) {
                fars.push({...sa, title: sa.label, value: sa.key});
              }
            });
          });
          let relationArr = buildTree(ars);
          console.log(relationArr, 'relationArr1');
          let recordsData = {
            type: 'object',
            required: [],
            properties: {}
          };
          fars.forEach(res => {
            recordsData.properties[res.value] = {
              // type: 'object',
              type: res.type,
              required: [],
              title: res.label,
              label: res.label,
              value: res.value
            };
          });
          relationArr.forEach(res => {
            let ard = {};
            if (res.children && res.children.length > 0) {
              res.children.forEach(element => {
                ard[element.key] = {
                  type: element.type,
                  required: [],
                  title: element.label,
                  label: element.label,
                  value: element.key
                  // value: element.relationKey+'.'+element.key,
                };
              });
            }
            console.log(res, 'sssssss');
            console.log(ard, 'ard');
            recordsData.properties[res.value] = {
              type: 'object',
              required: [],
              title: undefined,
              // label:res.label,
              // value: res.value,
              properties: ard
              // items:{
              //   required:[],
              //   // title:'成员',
              //   type:"object",
              //   properties:ard
              // }
            };
          });
          let recordsData1 = {
            properties: {},
            type: 'object',
            required: []
          };
          if(typeof eName == 'undefined'){
            recordsData1.properties[e] = {
              value: e,
              title: e,
              type: 'object',
              properties: {}
            };
            recordsData1.properties[e].properties[
                element.queryRecordsOutputParameterName
                ] = {
              value: element.queryRecordsOutputParameterName,
              title: element.queryRecordsOutputParameterName,
              label: element.queryRecordsOutputParameterName,
              type: 'array',
              required: [],
              items: {
                required: [],
                title: '成员',
                type: 'object',
                properties: recordsData.properties
              }
            };
          }else{
            recordsData1.properties[e] = {
              value: e,
              title: eName,
              type: 'object',
              properties: {}
            };
            recordsData1.properties[e].properties[
                element.queryRecordsOutputParameterName
                ] = {
              value: element.queryRecordsOutputParameterName,
              title: element.queryRecordsOutputParameterName,
              label: element.queryRecordsOutputParameterName,
              type: 'array',
              required: [],
              items: {
                required: [],
                title: '成员',
                type: 'object',
                properties: recordsData.properties
              }
            };
          }
          console.log(recordsData, 'recordsData');
          console.log(recordsData1, 'recordsData1');
          console.log(
            getDataPropsAsOptions(recordsData1),
            'getDataPropsAsOptions(recordsData1)'
          );
          let scs = getDataPropsAsOptions(recordsData1);
          console.log(scs, 'scsscsscsscs');
          queryList.current.push(scs[0]);
        }
      }
      // 获取前序新增节点数据
      if (element.serviceTaskId == e && element.taskType == 1) {
        console.log(modeler.get('elementRegistry').get(e), 'asdlhgasdbsakasbk');
        let nodeId = modeler.get('elementRegistry').get(e);
        let createdOutPutParameterName = '';
        if (nodeId.businessObject.name) {
          createdOutPutParameterName = nodeId.businessObject.name;
        //   getXinList.current.push({
        //     id: nodeId.businessObject.name,
        //     nodeId: element.serviceTaskId,
        //     type: element.dataMode
        //   });
        } else {
          createdOutPutParameterName = element.serviceTaskId;
        //   getXinList.current.push({
        //     id: element.serviceTaskId,
        //     nodeId: element.serviceTaskId,
        //     type: element.dataMode
        //   });
        }
        let columnInfoData =
          typeof element.columnInfo == 'string'
            ? JSON.parse(element.columnInfo)
            : element.columnInfo;
        if (element.dataMode == 'single') {
          let fieldsArr: any = [];
          if (element.fields) {
            fieldsArr = [...element.fields];
          }
          let relaArr: any = [];
          if (element.relationFields) {
            relaArr = [...element.relationFields];
          }
          let ars: any = [];
          let fars: any = [];
          relaArr.forEach(sa => {
            columnInfoData.forEach(des => {
              if('key' in des){
                if (des.key.includes('.')) {
                  let top = des.key.split('.')[0];
                  let last = des.key.split('.')[1];
                  console.log(sa, 'sa');
                  console.log(top, 'top');
                  console.log(last, 'last');
                  if (last == sa.key && sa.relationKey == top) {
                    ars.push({
                      ...sa,
                      title: sa.label,
                      value: sa.relationKey + '.' + sa.key
                    });
                  }
                }
              }
            });
          });
          fieldsArr.forEach(sa => {
            columnInfoData.forEach(des => {
              if (des.key == sa.key) {
                fars.push({...sa, title: sa.label, value: sa.key});
              }
            });
          });
          let relationArr = buildTree(ars);
          let recordsData = {
            type: 'object',
            required: [],
            properties: {}
          };
          fars.forEach(res => {
            recordsData.properties[res.value] = {
              type: res.type,
              // type: 'object',
              required: [],
              title: res.label,
              label: res.label,
              value: res.value
            };
          });
          relationArr.forEach(res => {
            let ard = {};
            if (res.children && res.children.length > 0) {
              res.children.forEach(element => {
                ard[element.key] = {
                  type: element.type,
                  required: [],
                  title: element.label,
                  label: element.label,
                  value: element.relationKey + '.' + element.key
                };
              });
            }
            console.log(res, 'sssssss');
            recordsData.properties[res.value] = {
              type: 'array',
              required: [],
              title: res.label,
              label: res.label,
              value: res.value,
              items: {
                required: [],
                title: '成员',
                type: 'object',
                properties: ard
              }
            };
          });
          let recordsData1 = {
            properties: {},
            type: 'object',
            required: []
          };
          if(typeof eName == 'undefined'){
            recordsData1.properties[e] = {
              value: e,
              title: e,
              type: 'object',
              properties: {}
            };
            recordsData1.properties[e].properties[
              'saveData'
              ] = {
              value: 'saveData',
              title: 'saveData',
              label: 'saveData',
              type: 'object',
              properties: recordsData.properties
            };
          }else{
            recordsData1.properties[e] = {
              value: e,
              title: eName,
              type: 'object',
              properties: {}
            };
            recordsData1.properties[e].properties[
              'saveData'
              ] = {
              value: 'saveData',
              title: 'saveData',
              label: 'saveData',
              type: 'object',
              properties: recordsData.properties
            };
          }
          console.log(recordsData, 'recordsData');
          console.log(recordsData1, 'recordsData1');
          console.log(
            getDataPropsAsOptions(recordsData1),
            'getDataPropsAsOptions(recordsData1)'
          );
          let scs = getDataPropsAsOptions(recordsData1);
          getXinList.current.push(scs[0]);
        }
        if (element.dataMode == 'multi') {
          let fieldsArr: any = [];
          if (element.fields) {
            fieldsArr = [...element.fields];
          }
          let relaArr: any = [];
          if (element.relationFields) {
            relaArr = [...element.relationFields];
          }
          let ars: any = [];
          let fars: any = [];
          relaArr.forEach(sa => {
            columnInfoData.forEach(des => {
              if('key' in des) {
                if (des.key.includes('.')) {
                  let top = des.key.split('.')[0];
                  let last = des.key.split('.')[1];
                  console.log(sa, 'sa');
                  console.log(top, 'top');
                  console.log(last, 'last');
                  if (last == sa.key && sa.relationKey == top) {
                    ars.push({
                      ...sa,
                      title: sa.label,
                      value: sa.relationKey + '.' + sa.key
                    });
                  }
                }
              }
            });
          });
          fieldsArr.forEach(sa => {
            columnInfoData.forEach(des => {
              if (des.key == sa.key) {
                fars.push({...sa, title: sa.label, value: sa.key});
              }
            });
          });
          let relationArr = buildTree(ars);
          console.log(relationArr, 'relationArr1');
          let recordsData = {
            type: 'object',
            required: [],
            properties: {}
          };
          fars.forEach(res => {
            recordsData.properties[res.value] = {
              // type: 'object',
              type: res.type,
              required: [],
              title: res.label,
              label: res.label,
              value: res.value
            };
          });
          relationArr.forEach(res => {
            let ard = {};
            if (res.children && res.children.length > 0) {
              res.children.forEach(element => {
                ard[element.key] = {
                  type: element.type,
                  required: [],
                  title: element.label,
                  label: element.label,
                  value: element.key
                  // value: element.relationKey+'.'+element.key,
                };
              });
            }
            console.log(res, 'sssssss');
            console.log(ard, 'ard');
            recordsData.properties[res.value] = {
              type: 'object',
              required: [],
              title: undefined,
              // label:res.label,
              // value: res.value,
              properties: ard
              // items:{
              //   required:[],
              //   // title:'成员',
              //   type:"object",
              //   properties:ard
              // }
            };
          });
          let recordsData1 = {
            properties: {},
            type: 'object',
            required: []
          };
          if(typeof eName == 'undefined'){
            recordsData1.properties[e] = {
              value: e,
              title: e,
              type: 'object',
              properties: {}
            };
            recordsData1.properties[e].properties[
              'saveData'
              ] = {
              value: 'saveData',
              title: 'saveData',
              label: 'saveData',
              type: 'array',
              required: [],
              items: {
                required: [],
                title: '成员',
                type: 'object',
                properties: recordsData.properties
              }
            };
          }else{
            recordsData1.properties[e] = {
              value: e,
              title: eName,
              type: 'object',
              properties: {}
            };
            recordsData1.properties[e].properties[
              'saveData'
              ] = {
              value: 'saveData',
              title: 'saveData',
              label: 'saveData',
              type: 'array',
              required: [],
              items: {
                required: [],
                title: '成员',
                type: 'object',
                properties: recordsData.properties
              }
            };
          }
          console.log(recordsData, 'recordsData');
          console.log(recordsData1, 'recordsData1');
          console.log(
            getDataPropsAsOptions(recordsData1),
            'getDataPropsAsOptions(recordsData1)'
          );
          let scs = getDataPropsAsOptions(recordsData1);
          console.log(scs, 'scsscsscsscs');
          getXinList.current.push(scs[0]);
        }
      }
      // 获取前序调用服务节点数据
      if (
        element.serviceTaskId == e &&
        element.taskType == 5 &&
        element.outputParameterName &&
        element.outputParameterName != ''
      ) {
        let nodeId = modeler.get('elementRegistry').get(e);
        console.log(nodeId, 'nodeId');
        if (nodeId.businessObject.name) {
          callList.current.push({
            id: nodeId.businessObject.name,
            nodeId: element.serviceTaskId,
            outputParameterName: element.outputParameterName,
            data: element.outputParameters
          });
        } else {
          callList.current.push({
            id: element.serviceTaskId,
            nodeId: element.serviceTaskId,
            outputParameterName: element.outputParameterName,
            data: element.outputParameters
          });
        }
      }
      if (
        element.serviceTaskId == e &&
        element.taskType == 6 &&
        element.outputEnabled &&
        element.outputVarName &&
        element.outputVarName != ''
      ){
        let nodeId = modeler.get('elementRegistry').get(e);
        console.log(nodeId,'nodeIdnodeId')
        let createdOutPutParameterName = '';
        if (nodeId.businessObject.name) {
          createdOutPutParameterName = nodeId.businessObject.name;
        } else {
          createdOutPutParameterName = element.serviceTaskId;
        }
        processorList.current.push(
          {
            "label": createdOutPutParameterName,
            "value": element.serviceTaskId,
            "path": createdOutPutParameterName,
            "type": "object",
            "tag": "对象",
            "isMember": false,
            "disabled": false,
            "children": [
              {
                "label": element.outputVarName,
                "value": element.serviceTaskId+'.'+element.outputVarName,
                "path": element.outputVarName,
                "type": "text",
                "tag": "单行文本",
                "isMember": false,
                "disabled": false
              }
            ]
          }
        );
      }
    });
  }
  // 树形结构变化
  const buildTree = data => {
    const result = [];
    data.forEach(item => {
      console.log(item, 'itemitemitemitemitem');
      const labels = item.label.match(/【(.*?)】/);
      if (labels) {
        const parent = result.find(child => child.title === labels[1]);
        if (parent) {
          parent.children.push({...item, title: item.label});
        } else {
          result.push({
            title: labels[1],
            value: item.relationKey,
            children: [{...item, title: item.label}]
          });
        }
      } else {
        result.push({...item, title: item.label, value: item.relationKey});
      }
    });
    return result;
  };
  /**
   * 渲染 常规信息 组件
   * 1、所有节点都有
   */
  function renderElementBaseInfo() {
    return (
      <Collapse.Panel
        header={
          <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
            <InfoCircleOutlined twoToneColor={colorPrimary} />
            &nbsp;常规信息
          </Typography>
        }
        key={1}
        // // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <ElementBaseInfo businessObject={businessObject} />
      </Collapse.Panel>
    );
  }

  /**
   * 渲染 流转条件 组件
   */
  function renderFlowCondition() {
    let conditionFormVisible: boolean = !!(
      element?.type === 'bpmn:SequenceFlow' &&
      element?.source &&
      element?.source?.type?.indexOf('StartEvent') === -1
    );
    if (conditionFormVisible) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
              <RetweetOutlined twoToneColor={colorPrimary} />
              &nbsp;流转条件
            </Typography>
          }
          key={12}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <FlowCondition businessObject={businessObject} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 消息与信号 组件
   * 1、只有 Process 有
   */
  function renderSignalMessage() {
    if (element?.type === 'bpmn:Process') {
      return (
        <Collapse.Panel
          header={
            <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
              <SoundOutlined twoToneColor={colorPrimary} />
              &nbsp;消息与信号
            </Typography>
          }
          key={3}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <SignalMessage businessObject={businessObject} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 时间开始事件 组件
   */
  function renderElementTime() {
    // if (
    //   element?.type === 'bpmn:StartEvent' &&
    //   (element?.businessObject?.eventDefinitions
    //     ? element?.businessObject?.eventDefinitions[0]?.$type ===
    //       'bpmn:TimerEventDefinition'
    //     : false)
    // ) {
    if (element?.businessObject?.$type === 'bpmn:StartEvent' && !bindShow && timeShow) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
              <FileTextOutlined twoToneColor={colorPrimary} />
              &nbsp;开始时间
              {/* &nbsp;开始事件 */}
            </Typography>
          }
          key={12}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <ElementTime
            businessObject={businessObject}
            needData={props.modeler}
          />
          {/* <ElementTime businessObject={props?.businessObject?.businessObjects} /> */}
        </Collapse.Panel>
      );
    }
  }
  /**
   * 渲染 信息开始事件 组件
   */
  function renderElementMessage() {
    if (
      element?.type === 'bpmn:StartEvent'
      // element?.type === 'bpmn:StartEvent' && (element?.businessObject?.eventDefinitions?element?.businessObject?.eventDefinitions[0]?.$type === 'bpmn:MessageEventDefinition':false)
    ) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
              <FileTextOutlined twoToneColor={colorPrimary} />
              &nbsp;开始事件
            </Typography>
          }
          key={13}
          showArrow={true}
          forceRender={false}
        >
          <ElementMessage
            businessObject={businessObject}
            needData={props.modeler}
          />
        </Collapse.Panel>
      );
    }
  }
  /**
   * 渲染 开始 组件参数
   */
  function renderProcessParameters() {
    if (
      (element?.type === 'bpmn:StartEvent' ||
      element?.businessObject.$type === 'bpmn:StartEvent')
      && !timeShow
      && !eventTriggering
    ) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
              <FileTextOutlined twoToneColor={colorPrimary} />
              &nbsp;流程入参
            </Typography>
          }
          key={13}
          showArrow={true}
          forceRender={false}
        >
          <ElementParameters
            businessObject={businessObject}
            needData={props.modeler}
          />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 表单 组件
   * 1、只有 UserTask 或 StartEvent 有
   */
  function renderElementForm() {
    if (
      element?.businessObject?.$type === 'bpmn:UserTask' ||
      (element?.businessObject?.$type === 'bpmn:StartEvent' && bindShow)
    ) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
              <FileTextOutlined twoToneColor={colorPrimary} />
              &nbsp;表单
            </Typography>
          }
          key={4}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <ElementForm businessObject={businessObject} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 任务 组件
   * 1、所有 Task 类节点都有
   */
  function renderElementTask() {
    if (element?.type.indexOf('Task') !== -1) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
              <FireOutlined twoToneColor={colorPrimary} />
              &nbsp;{'任务'}
            </Typography>
          }
          key={5}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <ElementTask businessObject={businessObject} />
        </Collapse.Panel>
      );
    }
  }

    /**
   * 渲染 流程操作设置 组件
   * 1、只有 UserTask 有
   */
    function renderElementSettings() {
      if (
        element?.type === 'bpmn:UserTask'
      ) {
        return (
          <Collapse.Panel
            header={
              <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
                <FileTextOutlined twoToneColor={colorPrimary} />
                &nbsp;流程操作设置
              </Typography>
            }
            key={9}
            showArrow={true}
            forceRender={false}
          >
            <ElementSettings businessObject={businessObject} />
          </Collapse.Panel>
        );
      }
    }

  /**
   * 渲染 多实例 组件
   * 1、所有 Task 类节点都有
   */
  function renderMultiInstance() {
    if (element?.type.indexOf('Task') !== -1) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
              <DeploymentUnitOutlined twoToneColor={colorPrimary} />
              &nbsp;多实例
            </Typography>
          }
          key={6}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <MultiInstance businessObject={businessObject} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 执行监听器 组件
   * 1、所有节点都有
   */
  function renderExecutionListener() {
    if (element?.type === 'bpmn:UserTask') {
      return (
        <Collapse.Panel
          header={
            <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
              <BellOutlined twoToneColor={colorPrimary} />
              &nbsp;执行监听器
            </Typography>
          }
          key={7}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <ElementListener businessObject={businessObject} isTask={false} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 任务监听器 组件
   * 1、只有 UserTask 才有
   */
  function renderTaskListener() {
    if (element?.type === 'bpmn:UserTask') {
      return (
        <Collapse.Panel
          header={
            <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
              <BellOutlined twoToneColor={colorPrimary} />
              &nbsp;任务监听器
            </Typography>
          }
          key={8}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <ElementListener businessObject={businessObject} isTask={true} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 扩展属性 组件
   * 1、所有节点都有
   */
  function renderExtensionProperties() {
    if (
      element?.type === 'bpmn:ServiceTask' ||
      element?.type === 'bpmn:UserTask'
    ) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
              <NodeIndexOutlined twoToneColor={colorPrimary} />
              &nbsp;扩展属性
            </Typography>
          }
          key={10}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <ExtensionProperties businessObject={businessObject} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 其它属性(元素文档) 组件
   * 1、所有节点都有
   */
  function renderElementOtherInfo() {
    return (
      <Collapse.Panel
        header={
          <Typography style={{color: colorPrimary, fontWeight: 'bold'}}>
            <FileOutlined twoToneColor={colorPrimary} />
            &nbsp;元素文档
          </Typography>
        }
        key={11}
        // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <ElementDocument businessObject={businessObject} />
      </Collapse.Panel>
    );
  }

  return (
    <>
      <Space direction="vertical" size={0} style={{display: 'flex'}}>
        <Collapse
          bordered={false}
          expandIconPosition={'end'}
          /* accordion为true时只展示一个面板 */
          accordion={true}
          defaultActiveKey={['1']}
          destroyInactivePanel={true}
        >
          {renderElementBaseInfo()}
          {renderFlowCondition()}
          {/* 消息与信号 */}
          {/* {renderSignalMessage()} */}
          {renderElementForm()}
          {/* 流程操作设置 */}
          {/* {renderElementSettings()} */}
          {/* 。开始事件 */}
          {renderElementTime()}
          {/* {renderElementMessage()} */}
          {renderElementTask()}
          {/* 服务入参 */}
          {renderProcessParameters()}
          {/* 多实例 */}
          {/* {renderMultiInstance()} */}
          {/* 执行监听器 */}
          {/* {renderExecutionListener()} */}
          {/* 任务监听器 */}
          {/* {renderTaskListener()} */}
          {/* 扩展属性 */}
          {/* {renderExtensionProperties()} */}
          {/* 元素文档 */}
          {/* {renderElementOtherInfo()} */}
        </Collapse>
      </Space>
    </>
  );
}
