import {useAppDispatch, useAppSelector} from '@/redux/hook/hooks';
import React, {useEffect, useState} from 'react';
import {toast} from 'amis';
// 引入bpmn建模器
import BpmnModeler from 'bpmn-js/lib/Modeler';

// 引入属性解析文件和对应的解析器
import activitiDescriptor from '@/bpmn/descriptor/activiti.json';
import camundaDescriptor from '@/bpmn/descriptor/camunda.json';
import flowableDescriptor from '@/bpmn/descriptor/flowable.json';
import * as activitiExtension from '@/bpmn/moddle/activiti';
import * as camundaExtension from '@/bpmn/moddle/camunda';
import * as flowableExtension from '@/bpmn/moddle/flowable';
import {useDevBaseUrl} from '@/utils/util';
// 引入bpmn工作流绘图工具(bpmn-js)样式
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';

// 引入属性面板(properties-panel)样式
import 'bpmn-js-properties-panel/dist/assets/element-templates.css';
import 'bpmn-js-properties-panel/dist/assets/properties-panel.css';

// 引入翻译模块
import customTranslate from '@/bpmn/translate/customTranslate.js';
import translationsCN from '@/bpmn/translate/zh.js';

// 模拟流转流程
import TokenSimulationModule from 'bpmn-js-token-simulation';
import 'bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css';
import './index.css';

// 引入流程图文件
import DefaultEmptyXML from '@/bpmn/constant/emptyXml';
import {service} from '@/utils/request';
// 引入当前组件样式
import {
  Button,
  Col,
  ConfigProvider,
  Dropdown,
  MenuProps,
  message,
  Modal,
  Row,
  Space,
  Tooltip
} from 'antd';

// 组件引入
// import ConfigServer from '@/components/ProcessDesigner/components/ConfigServer/ConfigServer';
import Previewer from '@/components/ProcessDesigner/components/Previewer/Previewer';
import PropertyPanel from '@/components/ProcessDesigner/components/PropertyPanel/PropertyPanel';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BugOutlined,
  CompressOutlined,
  DownloadOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  RedoOutlined,
  SyncOutlined,
  UndoOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  EditOutlined
} from '@ant-design/icons';

// 常量引入
import {
  ACTIVITI_PREFIX,
  CAMUNDA_PREFIX,
  FLOWABLE_PREFIX
} from '@/bpmn/constant/constants';
// import { darkThemeData, defaultThemeData } from '@/pages/ProcessManage/bpm/globalTheme';
import {
  darkThemeData,
  defaultThemeData
} from '@/components/ProcessDesigner/globalTheme';
import {
  handleProcessId,
  handleProcessName,
  handleServiceRaskList
} from '@/redux/slice/bpmnSlice';
import ButtonGroup from 'antd/es/button/button-group';

// 接口
import {getBpmnXml, modelPost} from '@/api/bpmn';
import {getOpenTabIcon} from '@/utils/util';
import {validateTimeInput} from '@/utils';

export default function ProcessDesigner(props) {
  console.log(props, 'propspropspropsprops111111');
  const serviceList = useAppSelector(state => state.bpmn.serviceRaskList);
  const modelName = useAppSelector(state => state.bpmn.processName);
  // state
  const [bpmnModeler, setBpmnModeler] = useState<any>();
  const [simulationStatus, setSimulationStatus] = useState<boolean>(false);
  const [zoomSize, setZoomSize] = useState<number>(1);
  const [revocable, setRevocable] = useState<boolean>(false);
  const [recoverable, setRecoverable] = useState<boolean>(false);
  // const [darkTheme, setDarkTheme] = useState<any>();
  // redux
  const bpmnPrefix = useAppSelector(state => state.bpmn.prefix);
  // const processId = useAppSelector((state) => state.bpmn.processId);
  const processId = props.bpmnXml.modelKey;
  // const processName = useAppSelector((state) => state.bpmn.processName);
  let processName = '';
  const colorPrimary = useAppSelector(state => state.theme.colorPrimary);
  const borderRadius = useAppSelector(state => state.theme.borderRadius);
  const darkMode = useAppSelector(state => state.theme.darkMode);
  const dispatch = useAppDispatch();
  //保存文件按钮是否显示
  const [saveBtn, setSaveBtn] = useState(false);
  //页面是否有可写权限
  const [writeFlag, setWriteFlag] = useState(false);
  // ref
  const refFile = React.useRef<any>();

  /**
   * 初始化建模器
   * 1、这一步在绘制流程图之前进行，且随流程前缀改变而改变；
   * 2、因为解析器和解析文件与流程引擎类型(也就是前缀)有关，因此这里依赖的变量是放在redux里的流程前缀名
   */
  useEffect(() => {
    // 重新加载前需要销毁之前的modeler，否则页面上会加载出多个建模器
    console.log(bpmnPrefix, 'bpmnPrefixbpmnPrefixbpmnPrefixbpmnPrefix');
    console.log(bpmnModeler, 'bpmnPrefixbpmnPrefixbpmnPrefixbpmnPrefix');
    if (bpmnModeler) {
      bpmnModeler.destroy();
      setBpmnModeler(undefined);
    }
    (async () => {
      // 每次重新加载前需要先消除之前的流程信息
      dispatch(handleProcessId(undefined));
      await dispatch(handleProcessName(undefined));
      initBpmnModeler();
    })();
  }, [bpmnPrefix]);

  /**
   * 初始化建模器
   */
  function initBpmnModeler() {
    console.log('【初始化建模器】1、初始化建模器开始');
    const modeler = new BpmnModeler({
      container: '#canvas',
      height: '96vh',
      keyboard: {bindTo: document},
      additionalModules: getAdditionalModules(),
      moddleExtensions: getModdleExtensions()
    });
    modeler.get('keyboard').unbind();
    setBpmnModeler(modeler);

    /**
     * 添加解析器
     */
    function getAdditionalModules() {
      console.log('【初始化建模器】2、添加解析器');
      const modules: Array<any> = [];
      if (bpmnPrefix === FLOWABLE_PREFIX) {
        modules.push(flowableExtension);
      }
      if (bpmnPrefix === CAMUNDA_PREFIX) {
        modules.push(camundaExtension);
      }
      if (bpmnPrefix === ACTIVITI_PREFIX) {
        modules.push(activitiExtension);
      }
      // 添加翻译模块
      const TranslateModule = {
        // translate: ["value", customTranslate(translations || translationsCN)] translations是自定义的翻译文件
        translate: ['value', customTranslate(translationsCN)]
      };
      modules.push(TranslateModule);
      // 添加模拟流转模块
      modules.push(TokenSimulationModule);
      return modules;
    }

    /**
     * 添加解析文件
     */
    function getModdleExtensions() {
      console.log('【初始化建模器】3、添加解析文件');
      const extensions: any = {};
      if (bpmnPrefix === FLOWABLE_PREFIX) {
        extensions.flowable = flowableDescriptor;
      }
      if (bpmnPrefix === CAMUNDA_PREFIX) {
        extensions.camunda = camundaDescriptor;
      }
      if (bpmnPrefix === ACTIVITI_PREFIX) {
        extensions.activiti = activitiDescriptor;
      }
      return extensions;
    }

    console.log('【初始化建模器】4、初始化建模器结束');
  }

  /**
   * 绘制流程图，并设置属性面板的监听器
   * 1、建模器初始化完成后，开始绘制流程图，如果需要创建空白的流程图可以使用bpmnModeler.createDiagram()方法，但是这个流程的id是固定的，是bpmn内部默认的xml字符串；
   */
  useEffect(() => {
    if (!bpmnModeler) return;
    (async () => {
      let bpmnXml;
      // 绘制流程图
      // await createBpmnDiagram(xxx);
      try {
        let bpmnData = await getBpmnXml(props.bpmnXml.modelKey);
        if (bpmnData.data.code != 0) {
          toast.error(bpmnData.data.msg, {
            position: 'top-right'
          });
          return;
        }
        // let bpmnData = await getBpmnXml(props.bpmnXml.modelId);
        console.log(bpmnData, 'bpmnData');
        document.title = bpmnData.data.data.modelName;
        processName = bpmnData.data.data.modelName;
        getOpenTabIcon();
        bpmnXml = bpmnData.data.data.modelXml;
        dispatch(handleProcessName(bpmnData.data.data.modelName));
        // let aclFlag = bpmnData.data.data.acl;
        // let witeFlagVal = aclFlag.includes('write');
        // setWriteFlag(witeFlagVal);
        let arr = bpmnData.data.data.serviceTaskExtList.map(res => {
          if (res.taskType == 1) {
            return {
              ...res,
              fields: JSON.parse(res?.fields),
              relationFields: JSON.parse(res?.relationFields),
              filterCondition: JSON.parse(res?.filterCondition),
              columnInfo: JSON.parse(res?.columnInfo)
            };
          } else if (res.taskType == 2) {
            return {
              ...res,
              fields: JSON.parse(res?.fields),
              relationFields: JSON.parse(res?.relationFields),
              filterFields: JSON.parse(res?.filterCondition),
              updateFields: JSON.parse(res?.columnInfo)
            };
          } else if (res.taskType == 3) {
            return {
              ...res,
              fields: JSON.parse(res?.fields),
              relationFields: JSON.parse(res?.relationFields),
              filterFields: JSON.parse(res?.filterCondition)
            };
          } else if (res.taskType == 4) {
            let sortData = JSON.parse(res.sortingSettings);
            let pagingData = JSON.parse(res.pagingSettings);
            console.log(sortData, 'sortData');
            console.log(pagingData, 'pagingData');
            return {
              ...res,
              fields: JSON.parse(res?.fields),
              relationFields: JSON.parse(res?.relationFields),
              filterFields: JSON.parse(res?.filterCondition),
              orderType: sortData == null ? '' : sortData.orderType,
              orderBy: sortData == null ? '' : sortData.orderBy,
              maxCount: pagingData == null ? 50 : pagingData.maxCount,
              page: pagingData == null ? 1 : pagingData.page,
              perPage: pagingData == null ? 10 : pagingData.perPage,
              skip: pagingData == null ? 0 : pagingData.skip
            };
          } else if (res.taskType == 5) {
            return {
              ...res,
              enterTheParameters: JSON.parse(res.enterTheParameters),
              outputParameters: JSON.parse(res.outputParameters)
            };
          } else if (res.taskType == 6) {
            return {
              ...res,
              ...JSON.parse(res.customProcessorConfig)
            };
          }
        });
        console.log(arr, '接口返回赋值值');
        dispatch(handleServiceRaskList(arr));
      } catch (error) {
        console.log(error, '接口错误');
      }
      await createBpmnDiagram(bpmnXml);
      // 之后绑定属性面板监听器
      bindPropertiesListener();
      getPermiDatafg();
    })();
  }, [bpmnModeler]);


  function resetZoom() {
    setZoomSize(1);
    bpmnModeler.get('canvas').zoom('fit-viewport', 'auto');
  }

  /**
   * 绘制流程图
   * 1、调用 modeler 的 importXML 方法，将 xml 字符串转为图像；
   *
   * @param xml
   */
  function createBpmnDiagram(xml?: string) {
    console.log('【绘制流程图】1、开始绘制流程图');
    console.log(processId, '编号ID');
    console.log(processName, '常规名称');

    let newId = processId || 'Process_' + new Date().getTime();
    let newName = processName || '业务流程_' + new Date().getTime();
    // let newId = xml.modelKey || 'Process_' + new Date().getTime();
    // let newName = xml.modelName || '业务流程_' + new Date().getTime();

    let newXML = xml ? xml : DefaultEmptyXML(newId, newName, bpmnPrefix);
    // 执行importXML方法
    try {
      bpmnModeler?.importXML(newXML);
    } catch (e) {
      console.error('【流程图绘制出错】错误日志如下: ↓↓↓');
      console.error(e);
    }
    // 更新流程信息，初始化建模器后，有了modeler，通过modeler获取到canvas，就能拿到rootElement，从而获取到流程的初始信息
    console.log('【绘制流程图】2、更新流程节点信息');
    setTimeout(() => {
      const canvas = bpmnModeler.get('canvas');
      const rootElement = canvas.getRootElement();
      console.log(
        rootElement,
        'rootElementrootElementrootElementrootElementrootElementrootElement'
      );
      // 获取流程id和name
      const id: string = rootElement.id;
      const name: string = rootElement.businessObject.name;
      dispatch(handleProcessId(id));
      // dispatch(handleProcessName(name));
      console.log(
        bpmnModeler.getDefinitions().rootElements[0].id,
        'modeler.getDefinitions().rootElements[0].id'
      );
      const newId = bpmnModeler.getDefinitions().rootElements[0].id;
      let processElement: any = bpmnModeler.get('elementRegistry').get(newId);
      let arts = bpmnModeler.get('modeling', true);
      console.log(modelName, 'modelName');
      console.log(processName, 'processName');
      arts.updateProperties(processElement, {
        name: processName,
        isExecutable: true
      });
      resetZoom();
    }, 10);
    console.log('【绘制流程图】3、流程图绘制完成');
  }

  /**
   * 属性面板监听器
   * 1、属性面板监听器，当监听到属性面板的属性发生变化，会同步更新到xml字符串中；
   * 2、监听器要等到流程图绘制结束后才能添加；
   */
  function bindPropertiesListener() {
    console.log('【绑定属性面板监听器】1、开始绑定');
    bpmnModeler?.on('commandStack.changed', async () => {
      // 监听当前是否可撤销与恢复
      let revocable: boolean = bpmnModeler.get('commandStack').canUndo();
      let recoverable: boolean = bpmnModeler.get('commandStack').canRedo();
      setRevocable(revocable);
      setRecoverable(recoverable);
      //  其它操作
    });
    console.log('【绑定属性面板监听器】2、绑定成功');
    setZoomSize(1);
    bpmnModeler.get('canvas').zoom('fit-viewport', 'auto');
  }

  // 获取保存值
  function getNeedArr(data) {
    console.log(data, '获取保存值');
    let returnData: any = [];
    if (data.length > 0) {
      data.forEach(shjw => {
        if (shjw.key && shjw.formula) {
          returnData.push({...shjw, type: shjw.yuanType});
        } else if (shjw.key && !shjw.formula) {
          if (shjw.yuanType == 'boolean') {
            let nesData = {...shjw, type: shjw.yuanType};
            if ('formula' in nesData) {
              returnData.push({...shjw, type: shjw.yuanType});
            } else {
              returnData.push({...shjw, type: shjw.yuanType, formula: null});
            }
          } else {
            returnData.push({...shjw, type: shjw.yuanType, formula: null});
          }
        } else if (shjw.label && !shjw.formula) {
          returnData.push({...shjw, formula: null});
        } else if (shjw.label && shjw.formula) {
          returnData.push({...shjw});
        }
      });
    }
    if (returnData.length == 0) {
      return null;
    } else {
      return JSON.stringify(returnData);
    }
  }

  // 保存文件按钮
  function saveClick() {
    function validateFilterTimeFields(fields, filterFields, fieldType) {
      const fieldMap = new Map();
      fields.forEach(f => {
        if (f.name) {
          fieldMap.set(f.name, f);
        }
      });
      let errors: any = [];

      function traverse(node) {
        console.log(node, '循环数据');
        if (node.conjunction && Array.isArray(node.children)) {
          node.children.forEach(traverse);
          return;
        }

        if (node.left && node.left.type === 'field' && node.left.field && node.op && node.hasOwnProperty('right')) {
          const fieldName = node.left.field;
          const fieldConfig = fieldMap.get(fieldName);
          if (fieldConfig && (fieldConfig[fieldType] === 'time' || fieldConfig[fieldType] === 'datetime')) {
            const value = node.right ?? '';
            if (!value || value === '') {
              return;
            }
            const validateResult = validateTimeInput(value, fieldConfig[fieldType], fieldConfig.showPrecision);
            if(value.includes('${')) return
            if (validateResult !== true) {
              const errorMsg = typeof validateResult === 'string'
                ? validateResult
                : `时间格式不正确`;

              errors.push({
                fieldName,
                label: fieldConfig.label || fieldName,
                value,
                operator: node.op,
                error: errorMsg
              });
            }
          }
        }
      }

      if (filterFields && Array.isArray(filterFields.children)) {
        traverse(filterFields);
      }
      return errors.length === 0 ? [] : errors;
    }

    bpmnModeler.saveXML({format: true}).then(({xml}) => {
      console.log(serviceList, 'serviceList');
      let serList: any = [];
      serviceList.forEach(res => {
        if (xml.includes(res.serviceTaskId)) {
          if (res.taskType == 1) {
            let needData = {
              ...res,
              outputParameterName: null,
              enterTheParameters: null,
              outputParameters: null,
              tenantConfig:res.tenantConfig
                ? JSON.stringify(res.tenantConfig) == '{}'
                  ? "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}"
                  : typeof res.tenantConfig == 'string'
                    ? res.tenantConfig
                    : res?.tenantConfig.length == 0
                      ? "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}"
                      : JSON.stringify(res?.tenantConfig)
                : "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}",
              columnInfo: res.columnInfo
                ? JSON.stringify(res?.columnInfo) == '{}'
                  ? null
                  : typeof res?.columnInfo == 'string'
                    ? res?.columnInfo
                    : res?.columnInfo.length == 0
                      ? null
                      : getNeedArr(res?.columnInfo)
                : null,
              fields: res.fields
                ? JSON.stringify(res?.fields) == '{}'
                  ? null
                  : typeof res?.fields == 'string'
                    ? res?.fields
                    : res?.fields.length == 0
                      ? null
                      : JSON.stringify(res?.fields)
                : null,
              relationFields: res.relationFields
                ? JSON.stringify(res?.relationFields) == '{}'
                  ? null
                  : typeof res?.relationFields == 'string'
                    ? res?.relationFields
                    : res?.relationFields.length == 0
                      ? null
                      : JSON.stringify(res?.relationFields)
                : null,
              originRelation: res.originRelation
                ? JSON.stringify(res?.originRelation) == '{}'
                  ? null
                  : typeof res?.originRelation == 'string'
                    ? res?.originRelation
                    : res?.originRelation.length == 0
                      ? null
                      : JSON.stringify(res?.originRelation)
                : null,
              junctionRelations: 'junctionRelations' in res
                ? JSON.stringify(res?.junctionRelations) == '{}'
                  ? null
                  : res?.junctionRelations == null ? null : typeof res?.junctionRelations == 'string'
                    ? res?.junctionRelations
                    : res?.junctionRelations.length == 0
                      ? null
                      : JSON.stringify(res?.junctionRelations)
                : null,
              filterCondition: res.filterCondition
                ? res?.filterCondition == null
                  ? null
                  : JSON.stringify(res?.filterCondition) == '{}'
                    ? null
                    : typeof res?.filterCondition == 'string'
                      ? res?.filterCondition
                      : res?.filterCondition.length == 0
                        ? null
                        : JSON.stringify(res?.filterCondition)
                : null
            };
            if ('junctionRelations' in res && JSON.stringify(needData.junctionRelations) === '{}') {
              needData.junctionRelations = null;
            }
            serList.push(needData);
          } else if (res.taskType == 2) {
            serList.push({
              ...res,
              outputParameterName: null,
              enterTheParameters: null,
              outputParameters: null,
              tenantConfig:res.tenantConfig
                ? JSON.stringify(res.tenantConfig) == '{}'
                  ? "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}"
                  : typeof res.tenantConfig == 'string'
                    ? res.tenantConfig
                    : res?.tenantConfig.length == 0
                      ? "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}"
                      : JSON.stringify(res?.tenantConfig)
                : "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}",
              filterCondition: res.filterCondition
                ? res?.filterCondition == null
                  ? null
                  : JSON.stringify(res?.filterCondition) == '{}'
                    ? null
                    : typeof res?.filterCondition == 'string'
                      ? res?.filterCondition
                      : res?.filterCondition.length == 0
                        ? null
                        : JSON.stringify(res?.filterCondition)
                : null,
              columnInfo: res.updateFields
                ? JSON.stringify(res?.updateFields) == '{}'
                  ? null
                  : typeof res?.updateFields == 'string'
                    ? res?.updateFields
                    : res?.updateFields.length == 0
                      ? null
                      : getNeedArr(res?.updateFields)
                : null,
              fields: res.fields
                ? JSON.stringify(res?.fields) == '{}'
                  ? null
                  : typeof res?.fields == 'string'
                    ? res?.fields
                    : res?.fields.length == 0
                      ? null
                      : JSON.stringify(res?.fields)
                : null,
              relationFields: res.relationFields
                ? JSON.stringify(res?.relationFields) == '{}'
                  ? null
                  : typeof res?.relationFields == 'string'
                    ? res?.relationFields
                    : res?.relationFields.length == 0
                      ? null
                      : JSON.stringify(res?.relationFields)
                : null,
              originRelation: res.originRelation
                ? JSON.stringify(res.originRelation) == '{}'
                  ? null
                  : typeof res.originRelation == 'string'
                    ? res.originRelation
                    : res.originRelation.length == 0
                      ? null
                      : JSON.stringify(res.originRelation)
                : null
            });
          } else if (res.taskType == 3) {
            serList.push({
              ...res,
              columnInfo: null,
              initFields: null,
              relationFields: null,
              outputParameterName: null,
              enterTheParameters: null,
              outputParameters: null,
              tenantConfig:res.tenantConfig
                ? JSON.stringify(res.tenantConfig) == '{}'
                  ? "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}"
                  : typeof res.tenantConfig == 'string'
                    ? res.tenantConfig
                    : res?.tenantConfig.length == 0
                      ? "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}"
                      : JSON.stringify(res?.tenantConfig)
                : "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}",
              fields: res.fields
                ? JSON.stringify(res?.fields) == '{}'
                  ? null
                  : typeof res?.fields == 'string'
                    ? res?.fields
                    : res?.fields.length == 0
                      ? null
                      : JSON.stringify(res?.fields)
                : null,
              filterCondition: res.filterCondition
                ? res?.filterCondition == null
                  ? null
                  : JSON.stringify(res?.filterCondition) == '{}'
                    ? null
                    : typeof res?.filterCondition == 'string'
                      ? res?.filterCondition
                      : res?.filterCondition.length == 0
                        ? null
                        : JSON.stringify(res?.filterCondition)
                : null,
              originRelation: res.originRelation
                ? JSON.stringify(res.originRelation) == '{}'
                  ? null
                  : typeof res.originRelation == 'string'
                    ? res.originRelation
                    : res.originRelation.length == 0
                      ? null
                      : JSON.stringify(res.originRelation)
                : null
            });
          } else if (res.taskType == 4) {
            serList.push({
              ...res,
              outputParameterName: null,
              enterTheParameters: null,
              outputParameters: null,
              queryRecords: res.queryRecords ? res.queryRecords : 1,
              tenantConfig:res.tenantConfig
                ? JSON.stringify(res.tenantConfig) == '{}'
                  ? "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}"
                  : typeof res.tenantConfig == 'string'
                    ? res.tenantConfig
                    : res?.tenantConfig.length == 0
                      ? "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}"
                      : JSON.stringify(res?.tenantConfig)
                : "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}",
              fields: res.fields
                ? JSON.stringify(res.fields) == '{}'
                  ? null
                  : typeof res.fields == 'string'
                    ? res.fields
                    : res?.fields.length == 0
                      ? null
                      : JSON.stringify(res?.fields)
                : null,
              relationFields: res.relationFields
                ? JSON.stringify(res.relationFields) == '{}'
                  ? null
                  : typeof res.relationFields == 'string'
                    ? res.relationFields
                    : res.relationFields.length == 0
                      ? null
                      : JSON.stringify(res?.relationFields)
                : null,
              originRelation: res.originRelation
                ? JSON.stringify(res?.originRelation) == '{}'
                  ? null
                  : typeof res?.originRelation == 'string'
                    ? res?.originRelation
                    : res?.originRelation.length == 0
                      ? null
                      : JSON.stringify(res?.originRelation)
                : null,
              columnInfo: res.columnInfo
                ? JSON.stringify(res.columnInfo) == '{}'
                  ? null
                  : typeof res.columnInfo == 'string'
                    ? res.columnInfo
                    : res.columnInfo.length == 0
                      ? null
                      : JSON.stringify(res.columnInfo)
                : null,
              sortingSettings:
                JSON.stringify({
                  orderType: res?.orderType,
                  orderBy: res?.orderBy
                }) == '{}'
                  ? null
                  : typeof res?.sortingSettings == 'string'
                    ? res?.sortingSettings
                    : JSON.stringify({
                      orderType: res?.orderType,
                      orderBy: res?.orderBy
                    }),
              pagingSettings:
                JSON.stringify({
                  maxCount: res?.maxCount,
                  page: res?.page,
                  perPage: res?.perPage,
                  skip: res?.skip
                }) == '{}'
                  ? null
                  : JSON.stringify({
                    maxCount: res?.maxCount,
                    page: res?.page,
                    perPage: res?.perPage,
                    skip: res?.skip
                  }),
              filterCondition: res.filterCondition
                ? res?.filterCondition == null
                  ? null
                  : JSON.stringify(res?.filterCondition) == '{}'
                    ? null
                    : typeof res?.filterCondition == 'string'
                      ? res?.filterCondition
                      : res?.filterCondition.length == 0
                        ? null
                        : JSON.stringify(res?.filterCondition)
                : null,
              apiShareConfig: JSON.stringify(res.apiShareConfig) == '{}' ? null : typeof res.apiShareConfig == 'string' ?  res.apiShareConfig : res.apiShareConfig == null ? null : JSON.stringify(res.apiShareConfig)
            });
          } else if (res.taskType == 5) {
            let aa = {
              apiQueryKey: res.apiQueryKey,
              serviceTaskId: res.serviceTaskId,
              taskType: res.taskType,
              outputParameterName: res.outputParameterName,
              parameterMap: res.parameterMap,
              taskName: res.taskName,
              tenantConfig:res.tenantConfig
                ? JSON.stringify(res.tenantConfig) == '{}'
                  ? "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}"
                  : typeof res.tenantConfig == 'string'
                    ? res.tenantConfig
                    : res?.tenantConfig.length == 0
                      ? "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}"
                      : JSON.stringify(res?.tenantConfig)
                : "{\"ignoreTenantFlag\":false,\"appTenantCode\":\"\"}",
              originRelation: res.originRelation
                ? JSON.stringify(res.originRelation) == '{}'
                  ? null
                  : typeof res.originRelation == 'string'
                    ? res.originRelation
                    : res.originRelation.length == 0
                      ? null
                      : JSON.stringify(res.originRelation)
                : null,
              enterTheParameters: res.enterTheParameters
                ? res.enterTheParameters == null
                  ? null
                  : JSON.stringify(res.enterTheParameters) == '{}'
                    ? null
                    : typeof res.enterTheParameters == 'string'
                      ? res.enterTheParameters
                      : res.enterTheParameters.length == 0
                        ? null
                        : getNeedArr(res.enterTheParameters)
                : null,
              outputParameters: res.outputParameters
                ? res?.outputParameters == null
                  ? null
                  : JSON.stringify(res?.outputParameters) == '{}'
                    ? null
                    : typeof res?.outputParameters == 'string'
                      ? res?.outputParameters
                      : res?.outputParameters.length == 0
                        ? null
                        : getNeedArr(res?.outputParameters)
                : null,
              apiShareConfig: JSON.stringify(res.apiShareConfig) == '{}' ? null : typeof res.apiShareConfig == 'string' ?  res.apiShareConfig : res.apiShareConfig == null ? null : JSON.stringify(res.apiShareConfig)
            };
            if (res.columnInfo) {
              delete aa.columnInfo;
            }
            serList.push(aa);
          } else if (res.taskType == 6) {
            let aa = {
              apiQueryKey: res.apiQueryKey,
              serviceTaskId: res.serviceTaskId,
              taskType: res.taskType,
              outputParameterName: res.outputParameterName,
              parameterMap: res.parameterMap,
              taskName: res.taskName,
              "customProcessorConfig": {
                "mode":res.mode,
                "beanName": res.beanName,
                "className": res.className,
                "params": res.params,
                "outputEnabled": res.outputEnabled,
                "outputVarName": res.outputVarName
              }
            }
            console.log(aa,'aaaaaaa')
            serList.push(aa);
          }
        }
      });
      console.log(serList, 'serList');
      if (serList.length == 1 && serList[0] == null) {
        serList = [];
      }
      console.log(serList, 'serList');
      console.log(xml, '保存文件数据');
      let createNoHaveObjectkey = {
        timeInput: []
      };
      let deleteNoHaveObjectkey = {
        timeInput: []
      };
      let updateNoHaveObjectkey = {
        timeInput: []
      };
      let queryNoHaveObjectkey = {
        timeInput: []
      };
      serList.forEach(items => {
        console.log(items, 'items');
        if (items.taskType === 1) {
          let fieldList = JSON.parse(items.columnInfo);
          if (fieldList && fieldList.length > 0) {
            fieldList.forEach(item1 => {
              if ((item1.type === 'datetime' || item1.type === 'time') && item1.showPrecision > 3) {
                if (item1.formula != null && !(validateTimeInput(item1.formula, item1.type, item1.precisionCompatible && item1.showPrecision > 3 ? 3 : item1.showPrecision))) {
                  createNoHaveObjectkey.timeInput.push(items);
                }
              }
            });
          }
        }
        if (items.taskType === 2) {
          if (items.updateFields && items.updateFields.length > 0) {
            items.updateFields.forEach(item1 => {
              if ((item1.type === 'datetime' || item1.type === 'time') && item1.showPrecision > 3) {
                if (item1.formula != null && !(validateTimeInput(item1.formula, item1.type, item1.precisionCompatible && item1.showPrecision > 3 ? 3 : item1.showPrecision))) {
                  updateNoHaveObjectkey.timeInput.push(items);
                }
              }
            });
          }
          if (validateFilterTimeFields(JSON.parse(items.fields), JSON.parse(items.filterCondition), 'type').length > 0) {
            updateNoHaveObjectkey.timeInput.push(items);
          }
        }
        if (items.taskType === 3) {
          if (validateFilterTimeFields(JSON.parse(items.fields), JSON.parse(items.filterCondition), 'yuanType').length > 0) {
            deleteNoHaveObjectkey.timeInput.push(items);
          }
        }
        if (items.taskType === 4) {
          if (validateFilterTimeFields(JSON.parse(items.fields), JSON.parse(items.filterCondition), 'type').length > 0) {
            queryNoHaveObjectkey.timeInput.push(items);
          }
        }
      });
      if (createNoHaveObjectkey.timeInput.length > 0) {
        toast.error('保存失败，新增服务任务字段填写格式不正确！');
        return;
      }
      if (deleteNoHaveObjectkey.timeInput.length > 0) {
        toast.error('保存失败，删除服务任务字段填写格式不正确！');
        return;
      }
      if (updateNoHaveObjectkey.timeInput.length > 0) {
        toast.error('保存失败，更新服务任务字段填写格式不正确！');
        return;
      }
      if (queryNoHaveObjectkey.timeInput.length > 0) {
        toast.error('保存失败，查询服务任务字段填写格式不正确！');
        return;
      }
      let data = {
        bpmnXml: xml,
        modelKey: props.bpmnXml.modelKey,
        // modelId: props.bpmnXml.modelId,
        serviceTaskList: serList,
        modelName: modelName
      };
      console.log(data,'skhadgukdgasiudgas')
      modelPost(
        Object.assign(data, {
          newVersion: true
        })
      )
        .then(res => {
          console.log(res, '保存回显');
          if (res.data.code === 0) {
            alert('保存成功');
            // 当前页面关闭
            // window.close();
            // window.opener.location.reload();
            // 跳转到上层页面
            // window.location.href =
            //   'http://localhost:5000/app/design/processManage/model';
            // 刷新提示
            // window.addEventListener("beforeunload", (event) => {
            //   // Cancel the event as stated by the standard.
            //   event.preventDefault();
            //   // Chrome requires returnValue to be set.
            //   event.returnValue = "";
            //   });
          } else {
            alert(res.data.msg);
            // if (res.data.msg == '当前版本已被修改') {
            //   window.close();
            //   window.opener.location.reload();
            // }
            // messageApi.open({
            //   type: 'error',
            //   content: res.data.msg,
            // });
          }
        })
        .catch(error => {
          console.log(error, 'errorerror');
          // message.error(error)
          alert(error);
        });
    });
  }

  //获取功能权限数据
  const getPermiDatafg = async () => {
    let permissionRes = await service({
      url: useDevBaseUrl('/app/permission/getPermissionsOwnedByLoginUser'),
      method: 'get'
    });
    let data = permissionRes.data.data.permissions;
    let filterUpdate = data.filter(
      item => item == 'processManage:model:update'
    );
    const updateFlag = filterUpdate.length > 0 ? true : false; //保存
    setSaveBtn(updateFlag);
  };

  /**
   * 渲染保存按钮
   */
  function renderSaveButton() {
    // function saveData() {
    //   const file = refFile.current.files[0];
    //   let reader = new FileReader();
    //   reader.readAsText(file);
    //   reader.onload = function (this) {
    //     let xmlStr: any = this.result || undefined;
    //     console.log('【正在打开本地文件】文件内容如下: ↓↓↓');
    //     console.log(xmlStr);
    //     createBpmnDiagram(xmlStr);
    //   };
    // }

    return (
      <>
        {/*writeFlag*/}
        {saveBtn && (
          <Button
            type="primary"
            size={'small'}
            icon={<EditOutlined />}
            onClick={saveClick}
          >
            {'保存文件'}
          </Button>
         )}
      </>
    );
  }

  /**
   * 渲染导入按钮
   */
  function renderImportButton() {
    function importLocalFile() {
      const file = refFile.current.files[0];
      let reader = new FileReader();
      reader.readAsText(file);
      reader.onload = function(this) {
        let xmlStr: any = this.result || undefined;
        console.log('【正在打开本地文件】文件内容如下: ↓↓↓');
        console.log(xmlStr);
        createBpmnDiagram(xmlStr);
      };
    }

    return (
      <>
        <Button
          type="primary"
          size={'small'}
          icon={<FolderOpenOutlined />}
          onClick={() => {
            refFile.current.click();
          }}
        >
          {'打开文件'}
        </Button>
        <input
          type={'file'}
          id="files"
          ref={refFile}
          accept=".xml, .bpmn"
          style={{display: 'none'}}
          onChange={importLocalFile}
        />
      </>
    );
  }

  /**
   * 渲染下载按钮
   */
  function renderDownloadButton() {
    // 下载菜单
    const items: MenuProps['items'] = [
      {
        label: <a onClick={downloadProcessAsXml}>{'XML文件'}</a>,
        key: '1'
      },
      {
        label: <a onClick={downloadProcessAsSvg}>{'SVG图像'}</a>,
        key: '2'
      },
      {
        label: <a onClick={downloadProcessAsBpmn}>{'BPMN文件'}</a>,
        key: '3'
      }
    ];

    /**
     * 下载流程图
     * @param type
     * @param name
     */
    async function downloadProcess(type: string, name?: string) {
      try {
        // 按需要类型创建文件并下载
        if (type === 'xml' || type === 'bpmn') {
          const {err, xml} = await bpmnModeler.saveXML();
          // 读取异常时抛出异常
          if (err) {
            console.error(`【下载流程图出错】: ${err.message || err}`);
          }
          let {href, filename} = setEncoded(type.toUpperCase(), name, xml);
          downloadFunc(href, filename);
        } else {
          const {err, svg} = await bpmnModeler.saveSVG();
          // 读取异常时抛出异常
          if (err) {
            return console.error(err);
          }
          let {href, filename} = setEncoded('SVG', name, svg);
          downloadFunc(href, filename);
        }
      } catch (e: any) {
        console.error(`【下载流程图出错】: ${e.message || e}`);
      }

      /**
       * 根据所需类型进行转码并返回下载地址
       * @param type
       * @param filename
       * @param data
       */
      function setEncoded(
        type: string,
        filename = processId || 'diagram',
        data: any
      ) {
        const encodedData = encodeURIComponent(data);
        return {
          filename: `${filename}.${type}`,
          href: `data:application/${
            type === 'svg' ? 'text/xml' : 'bpmn20-xml'
          };charset=UTF-8,${encodedData}`,
          data: data
        };
      }

      /**
       * 文件下载方法
       * @param href
       * @param filename
       */
      function downloadFunc(href: string, filename: string) {
        if (href && filename) {
          let a = document.createElement('a');
          a.download = filename; //指定下载的文件名
          a.href = href; //  URL对象
          a.click(); // 模拟点击
          URL.revokeObjectURL(a.href); // 释放URL 对象
        }
      }
    }

    /**
     * 另存为xml文件
     */
    function downloadProcessAsXml() {
      downloadProcess('xml').then(() => message.info('成功另存为xml文件'));
    }

    /**
     * 另存为bpmn文件
     */
    function downloadProcessAsBpmn() {
      downloadProcess('bpmn').then(() => message.info('成功另存为bpmn文件'));
    }

    /**
     * 另存为svg文件
     */
    function downloadProcessAsSvg() {
      downloadProcess('svg').then(() => message.info('成功另存为svg文件'));
    }

    return (
      <>
        <Dropdown menu={{items}} trigger={['click']}>
          <Button
            type="primary"
            size={'small'}
            onClick={e => e.preventDefault()}
          >
            <Space>
              <DownloadOutlined />
              {'下载文件'}
            </Space>
          </Button>
        </Dropdown>
      </>
    );
  }

  /**
   * 渲染预览按钮
   */
  function renderPreviewButton() {
    // 预览菜单
    const items: MenuProps['items'] = [
      {
        label: <Previewer modeler={bpmnModeler} type={'xml'} />,
        key: '1'
      },
      {
        label: <Previewer modeler={bpmnModeler} type={'json'} />,
        key: '2'
      }
    ];

    return (
      <>
        <Dropdown menu={{items}} trigger={['click']}>
          <Button
            type="primary"
            size={'small'}
            onClick={e => e.preventDefault()}
          >
            <Space>
              <EyeOutlined />
              {'预览'}
            </Space>
          </Button>
        </Dropdown>
      </>
    );
  }

  /**
   * 渲染模拟流转按钮
   */
  // function renderSimulationButton() {
  //   function handleSimulation() {
  //     bpmnModeler.get('toggleMode').toggleMode();
  //     setSimulationStatus(!simulationStatus);
  //   }

  //   return (
  //     <>
  //       <Button type="primary" size={'small'} onClick={() => handleSimulation()}>
  //         <Space>
  //           <BugOutlined />
  //           {simulationStatus ? '退出' : '模拟'}
  //         </Space>
  //       </Button>
  //     </>
  //   );
  // }

  /**
   * 渲染 对齐按钮组
   */
  function renderAlignControlButtons() {
    const [open, setOpen] = useState(false);
    const [align, setAlign] = useState<
      'left' | 'right' | 'top' | 'bottom' | 'center' | 'middle'
    >('left');

    function handleOpen(
      align: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'middle'
    ) {
      const Selection = bpmnModeler.get('selection');
      const SelectedElements = Selection.get();
      console.log(SelectedElements, 'SelectedElementsSelectedElements');
      if (!SelectedElements || SelectedElements.length <= 1) {
        message.warning('请按住 Shift 键选择多个元素对齐').then(() => {
        });
        return;
      }
      setAlign(align);
      setOpen(true);
    }

    function handleElAlign() {
      const Align = bpmnModeler.get('alignElements');
      const Selection = bpmnModeler.get('selection');
      const SelectedElements = Selection.get();
      if (!SelectedElements || SelectedElements.length <= 1) {
        message.warning('请按住 Ctrl 键选择多个元素对齐').then(() => {
        });
        return;
      }
      Align.trigger(SelectedElements, align);
      setOpen(false);
    }

    return (
      <>
        <Modal
          title="确认对齐"
          okText={'确认'}
          cancelText={'取消'}
          open={open}
          onOk={() => handleElAlign()}
          onCancel={() => setOpen(false)}
        >
          <p>{'自动对齐可能造成图形变形,是否继续?'}</p>
        </Modal>
        <Tooltip title="向左对齐">
          <Button
            type={'default'}
            size={'small'}
            style={{width: '45px'}}
            icon={<AlignLeftOutlined />}
            onClick={() => handleOpen('left')}
          />
        </Tooltip>
        <Tooltip title="向右对齐">
          <Button
            type={'default'}
            size={'small'}
            style={{width: '45px'}}
            icon={<AlignRightOutlined />}
            onClick={() => handleOpen('right')}
          />
        </Tooltip>
        <Tooltip title="向上对齐">
          <Button
            type={'default'}
            size={'small'}
            style={{width: '45px'}}
            icon={<VerticalAlignTopOutlined />}
            onClick={() => handleOpen('top')}
          />
        </Tooltip>
        <Tooltip title="向下对齐">
          <Button
            type={'default'}
            size={'small'}
            style={{width: '45px'}}
            icon={<VerticalAlignBottomOutlined />}
            onClick={() => handleOpen('bottom')}
          />
        </Tooltip>
        <Tooltip title="水平居中">
          <Button
            type={'default'}
            size={'small'}
            style={{width: '45px'}}
            icon={<AlignCenterOutlined />}
            onClick={() => handleOpen('center')}
          />
        </Tooltip>
        <Tooltip title="垂直居中">
          <Button
            type={'default'}
            size={'small'}
            style={{width: '45px'}}
            icon={<VerticalAlignMiddleOutlined />}
            onClick={() => handleOpen('middle')}
          />
        </Tooltip>
      </>
    );
  }

  /**
   * 渲染 视图操作按钮组
   */
  function renderScaleControlButtons() {
    const zoomStep = 0.1;

    function handleZoomIn() {
      let newSize: number = Math.floor(zoomSize * 100 + zoomStep * 100) / 100;
      if (newSize > 4) {
        newSize = 4;
        message.warning('已达到最大倍数 400%, 不能继续放大').then(() => {
        });
      }
      setZoomSize(newSize);
      bpmnModeler.get('canvas').zoom(newSize);
    }

    function handleZoomOut() {
      let newSize: number = Math.floor(zoomSize * 100 - zoomStep * 100) / 100;
      if (newSize < 0.2) {
        newSize = 0.2;
        message.warning('已达到最小倍数 20%, 不能继续缩小').then(() => {
        });
      }
      setZoomSize(newSize);
      bpmnModeler.get('canvas').zoom(newSize);
    }

    return (
      <>
        <div>
          <Tooltip title="缩小视图">
            <Button
              type={'default'}
              size={'small'}
              style={{width: '45px'}}
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
            />
          </Tooltip>
          <Button type={'default'} size={'small'} style={{width: '65px'}}>
            {Math.floor(zoomSize * 10 * 10) + '%'}
          </Button>
          <Tooltip title="放大视图">
            <Button
              type={'default'}
              size={'small'}
              style={{width: '45px'}}
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
            />
          </Tooltip>
          <Tooltip title="重置视图并居中">
            <Button
              type={'default'}
              size={'small'}
              style={{width: '45px'}}
              icon={<CompressOutlined />}
              onClick={resetZoom}
            />
          </Tooltip>
        </div>
      </>
    );
  }

  /**
   * 渲染 撤销恢复按钮组
   */
  function renderStackControlButtons() {
    function handleUndo() {
      bpmnModeler.get('commandStack').undo();
    }

    function handleRedo() {
      bpmnModeler.get('commandStack').redo();
    }

    function handleRestart() {
      createBpmnDiagram();
    }

    return (
      <>
        <Tooltip title="撤销">
          <Button
            type={'default'}
            size={'small'}
            style={{width: '45px'}}
            disabled={!revocable}
            icon={<UndoOutlined />}
            onClick={handleUndo}
          />
        </Tooltip>
        <Tooltip title="恢复">
          <Button
            type={'default'}
            size={'small'}
            style={{width: '45px'}}
            disabled={!recoverable}
            icon={<RedoOutlined />}
            onClick={handleRedo}
          />
        </Tooltip>
        <Tooltip title="重新绘制">
          <Button
            type={'default'}
            size={'small'}
            style={{width: '45px'}}
            icon={<SyncOutlined />}
            onClick={handleRestart}
          />
        </Tooltip>
      </>
    );
  }

  /**
   * 渲染顶部工具栏
   */
  function renderToolBar() {
    return (
      <>
        <Space
          direction={'horizontal'}
          size={8}
          style={{marginTop: 3, marginBottom: 3}}
        >
          {/* 基本操作按钮组 */}
          <ButtonGroup>
            {renderSaveButton()}
            {/* {renderImportButton()} */}
            {/* {renderDownloadButton()} */}
            {renderPreviewButton()}
            {/* {renderSimulationButton()} */}
          </ButtonGroup>
          {/* 对齐按钮组 */}
          <ButtonGroup>{renderAlignControlButtons()}</ButtonGroup>
          {/* 缩放按钮组 */}
          <ButtonGroup>{renderScaleControlButtons()}</ButtonGroup>
          {/* 撤销按钮组 */}
          <ButtonGroup>{renderStackControlButtons()}</ButtonGroup>
          {/*配置中心按钮*/}
          {/*<ConfigServer />*/}
        </Space>
      </>
    );
  }

  return (
    <>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: colorPrimary,
            borderRadius: borderRadius,
            // 暗夜主题
            ...(darkMode && darkThemeData)
          }
        }}
      >
        <Row
          gutter={0}
          style={{
            backgroundColor: darkMode
              ? defaultThemeData.darkBgColor
              : defaultThemeData.lightBgColor
          }}
        >
          <Col span={1}>
            {/*todo 2022/10/31 快捷工具栏，暂时留空，后面补充一个简易palette栏*/}
          </Col>
          <Col span={13}>
            {renderToolBar()}
            <div
              id="canvas"
              style={{
                background:
                  'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlMGUwZTAiIG9wYWNpdHk9Ii4yIi8+PHBhdGggZD0iTTQwIDBIMHY0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTBlMGUwIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+) repeat'
              }}
              // style={{
              //   backgroundColor: darkMode
              //     ? defaultThemeData.darkCanvasBgColor
              //     : defaultThemeData.lightCanvasBgColor,
              //   backgroundImage:
              //     'linear-gradient(#8E8E8E 1px, transparent 0), linear-gradient(90deg,#8E8E8E 1px, transparent 0)',
              //   backgroundSize: '20px 20px',
              // }}
            />
          </Col>
          <Col
            span={10}
            style={{
              height: '100vh',
              overflowY: 'auto',
              backgroundColor: darkMode
                ? defaultThemeData.darkBgColor
                : defaultThemeData.lightBgColor
              // borderLeft: '1px solid #eee ',
            }}
          >
            <PropertyPanel modeler={bpmnModeler} />
          </Col>
        </Row>
      </ConfigProvider>
    </>
  );
}
