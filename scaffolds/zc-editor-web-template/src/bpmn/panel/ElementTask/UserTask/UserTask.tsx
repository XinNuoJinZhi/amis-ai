import React, {useEffect, useState, useMemo, useRef} from 'react';
import {
  DatePicker,
  Form,
  Select,
  Radio,
  Modal,
  Row,
  Col,
  Card,
  Input,
  Tree,
  Tag,
  Button,
  TreeSelect,
  Divider,
  Space,
  Tooltip,
  Switch,
  Table,
  Pagination,
  ConfigProvider,
  Cascader,
  message,
  Checkbox,
  InputNumber
} from 'antd';
import {
  createProperties,
  createListenerObject,
  createProperty,
  extractExtensionList,
  extractOtherExtensionList,
  extractPropertiesExtension,
  updateElementExtensions
} from '@/bpmn/util/panelUtil';
import {service} from '@/utils/request';
import zh_CN from 'antd/es/locale/zh_CN';
import {useAppSelector} from '@/redux/hook/hooks';
import type {DataNode} from 'antd/es/tree';
import {
  assignee_mock,
  candidateGroups_mock,
  candidateUsers_mock
} from '@/bpmn/panel/ElementTask/mockData';
import type { Dayjs } from 'dayjs';
import {
  deptTreeSelect, formGet,
  listRole,
  listUser,
  userRoleDropsDown
} from '@/api/bpmn';
import {PlusOutlined, InfoCircleOutlined} from '@ant-design/icons';
import {getSchemaTpl} from 'amis-editor';
import {render as amisRender, FormItem, Icon} from 'amis';
import {
  getNoLoopRelation,
  getNoLoopRelations,
  groupByRelationKeyWithPK
} from '@/bpmn/panel/ElementTask/ServiceTask/config';
import { filterData } from '@/bpmn/panel/ElementTask/ServiceTask/getSchemaChange';
import {advancedFeature} from '@/utils/env'
import {env as amisEnv} from '@/hooks/amis';

const {TextArea} = Input;
const {Search} = Input;
const keyOptions = {
  assignee: 'assignee',
  candidateUsers: 'candidateUsers',
  candidateGroups: 'candidateGroups',
  dueDate: 'dueDate',
  followUpDate: 'followUpDate',
  priority: 'priority'
};

interface IProps {
  businessObject: any;
}

export const handleTree = (
  data: any[],
  id?: string,
  parentId?: string,
  children?: string
) => {
  if (!Array.isArray(data)) {
    console.warn('data must be an array');
    return [];
  }
  const config = {
    id: id || 'id',
    parentId: parentId || 'parentId',
    childrenList: children || 'children'
  };

  const childrenListMap = {};
  const nodeIds = {};
  const tree: any[] = [];

  for (const d of data) {
    const parentId = d[config.parentId];
    if (childrenListMap[parentId] == null) {
      childrenListMap[parentId] = [];
    }
    nodeIds[d[config.id]] = d;
    childrenListMap[parentId].push(d);
  }

  for (const d of data) {
    const parentId = d[config.parentId];
    if (nodeIds[parentId] == null) {
      tree.push(d);
    }
  }

  function adaptToChildrenList(o) {
    if (childrenListMap[o[config.id]] !== null) {
      o[config.childrenList] = childrenListMap[o[config.id]];
    }
    if (o[config.childrenList]) {
      for (const c of o[config.childrenList]) {
        adaptToChildrenList(c);
      }
    }
  }

  for (const t of tree) {
    adaptToChildrenList(t);
  }

  return tree;
};
/**
 * 用户任务 组件
 *
 * @param props
 * @constructor
 */
export default function UserTask(props: IProps) {
  console.log(props, '用户任务用户任务用户任务用户任务用户任务用户任务');
  const prefix = useAppSelector(state => state.bpmn.prefix);
  // 实体数据
  const entityList = useAppSelector(state => state.bpmn.entityList);

  // const { SHOW_PARENT } = TreeSelect;
  const tableColumns = [
    {
      title: '用户名',
      dataIndex: 'nickname',
      key: 'nickname'
    },
    {
      title: '部门',
      dataIndex: 'deptName',
      key: 'deptName',
      render: deptName => <span>{deptName == null ? '暂无部门' : deptName}</span>
    }
  ];
  const [listenerList, setListenerList] = useState<Array<any>>([]);

  // 流程操作设置
  const [operationOptions, setOperationOptions] = useState([
    {label: '抄送', value: 'cc'},
    {label: '委派', value: 'delegate'},
    {label: '转办', value: 'transfer'},
    {label: '退回', value: 'back'}
  ]);
  const operation1 = [
    {label: '提交', value: 'submit'},
    {label: '暂存', value: 'save'},
    {label: '抄送', value: 'cc'},
    {label: '委派', value: 'delegate'},
    {label: '转办', value: 'transfer'},
    {label: '退回', value: 'back'}];
  const operation2 = [
    {label: '抄送', value: 'cc'},
    {label: '通过', value: 'pass'},
    {label: '委派', value: 'delegate'},
    {label: '转办', value: 'transfer'},
    {label: '退回', value: 'back'},
    {label: '拒绝', value: 'stop'}
  ];
  // 多选默认值
  const [checkboxDefault, setCheckboxDefault] = useState([]);
  // 监听器节点类型
  const ELEMENT_LISTENER_TYPE = {
    TaskListener: 'TaskListener',
    ExecutionListener: 'ExecutionListener'
  };
  // 是否显示表达式种公式组件
  const [showAmis, setShowAmis] = useState(false);
  // 上下文数据
  const [formuVariables, setFormuVariables] = useState([]);
  // 表达式数据
  const defaultValue = useRef('');
  const [bpmnElements, setBpmnElements] = useState<any>(null);
  // const [pagination, setPagination] = useState<any>({
  //   current: 1,
  //   pageSize: 10,
  //   total: 0,
  // })
  const pagination = useRef({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [userTableList, setUserTableList] = useState<any>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>([]);
  const modelUser = useRef<any>([]);
  const chaoModelUser = useRef<any>([]);
  const [userTotal, setUserTotal] = useState<any>(0);
  const [cascaderOptions, setCascaderOptions] = useState([]);
  const [cascaderDefaultValue, setCascaderDefaultValue] = useState([]);
  // 记录表选择数据集合
  const tableValue = useRef([]);
  const selectedUser = useRef({
    ids: [],
    text: []
  });
  const chaoUser = useRef({
    ids: [],
    text: []
  });
  const [deptName, setDeptName] = useState<any>(undefined);
  // const [queryParams, setQueryParams] = useState<any>({
  //   deptId: undefined
  // });
  const queryParams = useRef({
    deptId: undefined,
    pageSize: 10,
    pageNo: 1
  });
  const [treeDefault, setTreeDefault] = useState([]);
  const [userOpen, setUserOpen] = useState<any>(false);
  // const [multiLoopInstance, setMultiLoopInstance] = useState<any>();
  const multiLoopInstance = useRef();
  const treeSelectValue = useRef([]);
  const [deptIds, setDeptIds] = useState<any>([]);
  // const [dataType, setDataType] = useState<any>('USERS');
  const dataType = useRef('USERS');
  // const userTaskType = useRef(1);
  const [userTaskType, setUserTaskType] = useState(1);
  // 处理对象类型
  const [processingObjectType, setProcessingObjectType] = useState(1);
  // 处理对象数据
  const [processingObjectValue, setProcessingObjectValue] = useState();
  // 处理对象下拉数据
  const [processingObject, setProcessingObject] = useState([]);
  const [timeoutHandlerEnable, setTimeoutHandlerEnable] = useState(false);
  // 超时执行动作
  const [specifyingActions, setSpecifyingActions] = useState([
    {
      label: '通知任务处理人',
      value: '1'
    }, {
      label: '通知指定人',
      value: '2'
    }, {
      label: '转交指定人',
      value: '3'
    }, {
      label: '自动同意',
      value: '4'
    }, {
      label: '自动拒绝（终止流程）',
      value: '5'
    }
  ]);
  // 当超过 后 数字选择
  const [timeDuration, setTimeDuration] = useState(6);
  const [timeUnit, setTimeUnit] = useState('2');
  const [timeOptions, setTimeOptions] = useState([
    {label: '分钟', value: 1},
    {label: '小时', value: 2},
    {label: '天', value: 3}
  ]);
  const [timeoutHandlerType, setTimeoutHandlerType] = useState('1');
  const eventDefinition = useRef({
    timeDuration: 6,
    timeUnit: 2
  });
  const [timeInputValue, setTimeInputValue] = useState('');
  const changeUserType = useRef('');
  const chaoData = useRef([]);
  // const [multiLoopType, setMultiLoopType] = useState<any>('Null');
  const multiLoopType = useRef('Null');
  const [showMultiFlog, setShowMultiFlog] = useState<any>(false);
  // const [isSequential, setIsSequential] = useState<any>(false);
  const isSequential = useRef(false);
  const [autoSkipTask, setAutoSkipTask] = useState(false);
  // const autoSkipTask = useRef(false);
  const [roleOptions, setRoleOptions] = useState<any>([]);
  const [roleIdsValue, setRoleIdsValue] = useState<any>([]);
  const roleIds = useRef([]);

  const forData = {
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
        label: '应用角色编码',
        value: 'zcUser.appRoleCodes',
        path: '当前登录用户信息.应用角色编码',
        type: 'array',
        tag: '数组',
        isMember: false,
        disabled: false
      },
      {
        label: '部门名称',
        path: '当前登录用户信息.部门名称',
        value: 'zcUser.department',
        type: 'string',
        tag: '文本'
      },
      {
        label: '部门ID',
        path: '当前登录用户信息.部门ID',
        value: 'zcUser.departmentId',
        type: 'string',
        tag: '文本'
      },
      {
        label: '部门编号',
        path: '当前登录用户信息.部门编号',
        value: 'zcUser.departmentCode',
        type: 'string',
        tag: '文本'
      },
      {
        label: '部门路径',
        path: '当前登录用户信息.部门路径',
        value: 'zcUser.departmentPath',
        type: 'string',
        tag: '文本'
      },
      {
        label: '租户编码',
        path: '当前登录用户信息.租户编码',
        value: 'zcUser.tenantCode',
        type: 'string',
        tag: '文本'
      },
      {
        label: '租户名称',
        path: '当前登录用户信息.租户名称',
        value: 'zcUser.tenantName',
        type: 'string',
        tag: '文本'
      },
      {
        label: '显示名称',
        path: '当前登录用户信息.显示名称',
        value: 'zcUser.displayName',
        type: 'string',
        tag: '文本'
      },
      {
        label: '简称',
        path: '当前登录用户信息.简称',
        value: 'zcUser.abbreviation',
        type: 'string',
        tag: '文本'
      },
      {
        label: '短名字',
        path: '当前登录用户信息.短名字',
        value: 'zcUser.shortName',
        type: 'string',
        tag: '文本'
      }
    ]
  };
  // let roleIds = []
  const [deptTreeData, setDeptTreeData] = useState<any>([]);
  const [deptOptions, setDeptOptions] = useState<any>([]);
  const [deptTempOptions, setDeptTempOptions] = useState<any>([]);
  const [selectedUserDate, setSelectedUserDate] = useState<any>([]);
  const [copyTree, setCopyTree] = useState<any>([]);
  const tanData = useRef([]);
  const [userTaskForm, setUserTaskForm] = useState<any>({
    dataType: '',
    assignee: '',
    candidateUsers: '',
    candidateGroups: '',
    text: ''
    // dueDate: '',
    // followUpDate: '',
    // priority: ''
  });

  const userData = useRef({
    dataType: '',
    assignee: '',
    candidateUsers: '',
    candidateGroups: '',
    text: ''
  });
  const chaoUserData = useRef({
    chaoText: '',
    transactor: ''
  });

  // props
  const {businessObject} = props;
  // form
  const [form] = Form.useForm<{
    assignee: string;
    candidateUsers: string[];
    candidateGroups: string[];
    dueDate: Dayjs;
    followUpDate: Dayjs;
    priority: number;
  }>();

  // 初始化
  useEffect(() => {
    // autoSkipTask.current = false;
    // console.log(window, '初始化windowwindowwindowwindowwindowwindow');
    setBpmnElements(window.bpmnInstance.element);
    setTimeoutHandlerEnable(false)
    if (businessObject) {
      initPageData();
      tableValue.current = [];
      console.log(props, 'propspropspropspropsprops');
      if (
        typeof props.businessObject.assignee == 'string' &&
        props.businessObject.assignee != '' &&
        !props.businessObject.assignee.includes('$')
      ) {
        setSelectedRowKeys([props.businessObject.assignee]);
        tanData.current = [props.businessObject.assignee];
      } else if (
        props.businessObject.candidateUsers &&
        props.businessObject.candidateUsers != '' &&
        props.businessObject.candidateUsers != null
      ) {
        console.log('进入1');
        if (typeof props.businessObject.candidateUsers == 'string') {
          let a = props.businessObject.candidateUsers.split(',');
          let b = a.map(rsw => {
            let sja = rsw;
            userTableList.forEach(rsd => {
              if (Number(rsw) == Number(rsd.id)) {
                sja = rsd.id;
              }
            });
            return sja;
          });
          setSelectedRowKeys(b);
          tanData.current = b;
        } else {
          setSelectedRowKeys([props.businessObject.candidateUsers]);
          tanData.current = [props.businessObject.candidateUsers];
        }
      } else if (
        typeof businessObject.transactor == 'string' &&
        businessObject.transactor != '' &&
        !businessObject.transactor.includes('$')
      ) {
        setSelectedRowKeys([businessObject.transactor]);
        chaoData.current = [businessObject.transactor];
      } else if (
        props.businessObject.transactor &&
        props.businessObject.transactor != '' &&
        props.businessObject.transactor != null
      ) {
        if (typeof props.businessObject.transactor == 'string') {
          let a = props.businessObject.transactor.split(',');
          let b = a.map(rsw => {
            let sja = rsw;
            userTableList.forEach(rsd => {
              if (Number(rsw) == Number(rsd.id)) {
                sja = rsd.id;
              }
            });
            return sja;
          });
          setSelectedRowKeys(b);
          chaoData.current = b;
        } else {
          setSelectedRowKeys([props.businessObject.transactor]);
          chaoData.current = [props.businessObject.transactor];
        }
      } else {
        console.log('进入2');
        setSelectedRowKeys([]);
      }
      if (businessObject.extensionElements) {
        if (businessObject.extensionElements.values.length == 0) {
          // autoSkipTask.current = false;
          setAutoSkipTask(false);
        } else {
          businessObject.extensionElements.values.forEach(res => {
            if (res.$type == 'flowable:ExecutionListener') {
              if (res.fields && res.fields.length > 0) {
                res.fields.forEach(fieldRes => {
                  if (fieldRes.$type == 'flowable:Field') {
                    setAutoSkipTask(JSON.parse(fieldRes.string));
                    // autoSkipTask.current = fieldRes.string;
                  }
                });
              } else {
                // autoSkipTask.current = false;
                setAutoSkipTask(false);
              }
            } else {
              changeAutoSkipTask(false);
            }
          });
        }
      } else {
        changeAutoSkipTask(false);
      }
      if (businessObject.processOperationSettings) {
        setCheckboxDefault(JSON.parse(businessObject.processOperationSettings));
        if (businessObject.userTaskType == '2') {
          setOperationOptions(operation2);
        } else {
          setOperationOptions(operation1);
        }
      } else {
        setCheckboxDefault(['submit', 'save']);
        setOperationOptions(operation1);
        window.bpmnInstance.modeling.updateProperties(
          window.bpmnInstance.element,
          {
            processOperationSettings: businessObject.$type == 'bpmn:UserTask' ? JSON.stringify(['submit', 'save']) : undefined
          }
        );
      }
      if (businessObject.userTaskType && businessObject.userTaskType == '2') {
        setUserTaskType(Number(businessObject.userTaskType));
        if (businessObject.boundaryEventEnable) {
          console.log('进入');
          setTimeoutHandlerEnable(true);
          setTimeoutHandlerType(businessObject.timeoutHandlerType + '');
          if (businessObject.timeoutHandlerType == '1' || businessObject.timeoutHandlerType == '2') {
            setTimeInputValue(businessObject.message);
          }
          if (businessObject.timeoutHandlerType == '2' || businessObject.timeoutHandlerType == '3') {
            let userIdData =
              businessObject['transactor'];
            let userText = businessObject['chaoText'] || [];
            console.log(userText, 'userText');
            if (
              userIdData &&
              userIdData.toString().length > 0 &&
              userText &&
              userText.length > 0
            ) {
              chaoUser.current = {
                ids: userIdData?.toString().split(','),
                text: JSON.parse(userText)
              };
              chaoModelUser.current = JSON.parse(userText);
            }
            if (chaoUser.current.ids.length > 1) {
              setShowMultiFlog(true);
            }
          }
          const timeDurationStr = businessObject.timeoutData;
          setTimeDuration(parseInt(timeDurationStr.slice(2, timeDurationStr.length - 1)));
          setTimeUnit(convertTimeUnit(timeDurationStr.slice(timeDurationStr.length - 1)) + '');
          eventDefinition.current.timeDuration = parseInt(timeDurationStr.slice(2, timeDurationStr.length - 1));
          eventDefinition.current.timeUnit = convertTimeUnit(timeDurationStr.slice(timeDurationStr.length - 1));
        } else {
          setTimeoutHandlerEnable(false);
        }
      } else {
        setUserTaskType(1);
        window.bpmnInstance.modeling.updateProperties(
          window.bpmnInstance.element,
          {
            userTaskType: 1
          }
        );
      }
      let doubleList = JSON.parse(sessionStorage.getItem('doubleList'));
      if (doubleList && doubleList.length > 0) {
        doubleList = uniqueFunc(doubleList, 'nodeId');
      }
      console.log(doubleList, 'doubleList');
      if (doubleList != null) {
        setProcessingObject(
          doubleList.map(res => {
            return {
              ...res,
              label: res.name,
              value: res.nodeId
            };
          })
        );
      }
      if (businessObject.processingObjectType) {
        setProcessingObjectType(Number(businessObject.processingObjectType));
      }
      if (businessObject.processingObject) {
        setProcessingObjectValue(businessObject.processingObject);
      } else {
        setProcessingObjectValue(undefined);
      }
      setShowAmis(false);
      setTimeout(() => {
        setShowAmis(true);
      }, 10);
    }
  }, [businessObject?.id]);
  // useEffect(() => {
  //   getFormu();
  // }, [businessObject]);

  function transformArray(arr, prefix, itemName) {
    return Object.values(arr.reduce((acc, item) => {
      let key = item.relationKey;
      const match = item.label.match(/【(.*?)】/);
      let parentLabel = '';
      if (match != null) {
        parentLabel = match[1];
      } else {
        parentLabel = item.label;
      }
      // console.log(parentLabel, 'parentLabel');
      let newValue = `${prefix}.${key}`;
      // console.log(newValue, 'newValue');
      if (!acc[key]) {
        acc[key] = {
          value: newValue,
          label: parentLabel,
          tag: '对象',
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
  function getFormu() {
    let arr = JSON.parse(sessionStorage.getItem('userList'));
    let userArr = JSON.parse(sessionStorage.getItem('getUserList'));
    let queryArr = JSON.parse(sessionStorage.getItem('queryList'));
    let xinArr = JSON.parse(sessionStorage.getItem('getXinList')); // 新增服务
    let callArr = JSON.parse(sessionStorage.getItem('callList')); // 调用服务
    let startArr = JSON.parse(sessionStorage.getItem('startList')); // 流程参数
    let processorArr = JSON.parse(sessionStorage.getItem('processorList')); // 自定义参数
    if (userArr != null && userArr.length > 0) {
      userArr = uniqueFunc(userArr, 'nodeId');
    }
    let arrs = [];
    let arrss = [];
    let arrsas = [];
    let callArrs = [];
    let startArrs = [];
    let processorArrs: any = [];
    if (processorArr != null && processorArr.length > 0) {
      processorArrs = [...processorArr]
    }
    if (queryArr != null && queryArr.length > 0) {
      queryArr.forEach(elements => {
        arrss.push(elements);
      });
    }
    if (startArr != null && startArr.length > 0) {
      // startArr.forEach(elements => {
      //   startArrs.push(elements);
      // });
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
    if (xinArr != null && xinArr.length > 0) {
      console.log(xinArr,'xinArrxinArrxinArrxinArrxinArrxinArrxinArr')
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
        arrss.push(items);
      });
    }
    console.log(userArr, '上下文操作人');
    console.log(dataType.current, '选择类型');
    if (userArr != null && userArr.length > 0) {
      userArr.forEach(items => {
        if (items.type == 'bpmn:StartEvent') {
          arrs.push({
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
          arrs.push({
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
    let arrDatas: any = [];
    if (arr != null) {
      arr.forEach(element => {
        let children = [];
        if (element.data) {
          let needData = [];
          element.data.forEach(sjn => {
            if (sjn.type == 'user-select') {
              needData.push({
                name: sjn.label,
                key: element.id + sjn.name,
                label: sjn.label,
                value: element.id + '.' + sjn.name,
                path: element.id + '.' + sjn.label,
                tag: '人员信息',
                isMember: false,
                disabled: false
              });
            }
          });
          children = needData;
        }
        if (children.length > 0) {
          arrDatas.push({
            name: element.name,
            key: element.id,
            path: element.name,
            tag: '对象',
            isMember: false,
            disabled: false,
            value: element.id,
            label: element.name,
            children: children
          });
        }
      });
      console.log(arrDatas, 'arrDatasarrDatas');
    }
    arrs = [...arrs, ...arrss, ...arrsas, ...callArrs, ...startArrs, ...filterData, ...processorArrs];
    if (arrDatas.length > 0) {
      arrs = arrs.map(res => {
        let resArr = {...res};
        arrDatas.forEach(element => {
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
    console.log(arrs, 'arrs');
    // if (dataType.current == 'EXPRESSION') {
    //   arrs.push(filterData);
    // }
    let doubleList = JSON.parse(sessionStorage.getItem('doubleList'));
    if (doubleList && doubleList.length > 0) {
      doubleList = uniqueFunc(doubleList, 'nodeId');
    }
    if (doubleList && doubleList != null && doubleList.length > 0) {
      let items = entityList
      if(items && JSON.stringify(items) === '{}') return
          items.data.options.forEach(ress => {
            ress.children.forEach(item => {
              doubleList.forEach(res => {
                if (res.modelEventTarget && res.type == 'bpmn:StartEvent') {
                  if (item.value == res.modelEventTarget){
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
                          !swpoe.isCreateUser){
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
                    let objectArr: any = [res.value, item.value];
                    // let lastAllDatas = getNoLoopRelation(allArr, item.form.originRelation, items.data.data.options, objectArr);
                    // let lastAllDatas = getNoLoopRelation(ress.children,item.id)
                    let lastAllDatas = getNoLoopRelations(relationAllArr,item.form.originRelation,items.data.options,objectArr)
                    let needArrSout = [...allArr,...lastAllDatas].map(resi => {
                      let returnData = {...resi};
                      if (returnData.relationKey) {
                        returnData.key = returnData.relationKey + '.' + returnData.key;
                      }
                      return returnData;
                    });
                    console.log(needArrSout, 'needArrSout');
                    let needArr: any = [];
                    let lastArr: any = [];
                    if (needArrSout && needArrSout.length > 0) {
                      needArrSout.forEach(itemRes => {
                        if(itemRes.relationKey){
                          needArr.push({...itemRes,tag: getTypeChinese(itemRes.type)});
                        }else{
                          lastArr.push({...itemRes,value:res.nodeId+'.'+itemRes.value,
                            tag: getTypeChinese(itemRes.type)});
                        }
                      });
                    }
                    let childrenArr: any = transformArray(needArr, res.nodeId, res.name);
                    lastArr = [...lastArr, ...childrenArr];
                    arrs = arrs.map(sws => {
                      let reuei = {...sws};
                      if (sws.key == res.nodeId) {
                        reuei.children = [...reuei.children, ...lastArr];
                      }
                      return reuei;
                    });
                  }
                }
              });
            });
          });
          console.log(arrs, '111111111111111111111');
          setFormuVariables(arrs);
          setShowAmis(false)
          setTimeout(()=>{
            setShowAmis(true)
          },100)
        // });
      let haveModelEventTarget: any = [];
      haveModelEventTarget = doubleList.filter(rswe => {
        return rswe.modelEventTarget && rswe.type == 'bpmn:StartEvent';
      });
      if (haveModelEventTarget.length == 0) {
        setFormuVariables(arrs);
        setShowAmis(false)
        setTimeout(()=>{
          setShowAmis(true)
        },100)
      }
    } else {
      console.log(arrs,'33333333333333333333')
      setFormuVariables(arrs);
      setShowAmis(false)
      setTimeout(()=>{
        setShowAmis(true)
      },100)
    }
  }

  /**
   * 初始化页面数据
   */
  function initPageData() {
    setSelectedUserDate([]);
    console.log(props, 'propspropspropspropsprops');
    console.log(businessObject, 'propspropspropspropsprops');
    console.log(window, '初始化windowwindowwindowwindowwindowwindow');
    getFormu();
    userData.current = {
      dataType: '',
      assignee: '',
      candidateUsers: '',
      candidateGroups: '',
      text: ''
    };
    chaoUserData.current = {
      chaoText: '',
      transactor: ''
    };
    clearOptionsData();
    // setDataType(businessObject['dataType'])
    dataType.current = businessObject['dataType'];
    setUserTaskType(businessObject['userTaskType']);
    setShowMultiFlog(false);
    if (dataType.current === 'USERS') {
      let userIdData =
        businessObject['candidateUsers'] || businessObject['assignee'];
      let userText = businessObject['text'] || [];
      console.log(userText, 'userText');
      if (
        userIdData &&
        userIdData.toString().length > 0 &&
        userText &&
        userText.length > 0
      ) {
        console.log(
          userIdData?.toString().split(','),
          'userIdData?.toString().split(',
          ')'
        );
        // console.log(userText?.split(','), 'userText?.split(', ')');
        selectedUser.current = {
          ids: userIdData?.toString().split(','),
          text: JSON.parse(userText)
          // text: userText?.split(',')
        };
        modelUser.current = JSON.parse(userText);
      }
      if (selectedUser.current.ids.length > 1) {
        // this.showMultiFlog = true;
        setShowMultiFlog(true);
      }
      console.log(selectedUser.current, 'selectedUser.current');
    } else if (dataType.current === 'ROLES') {
      roleIds.current = [];
      setRoleIdsValue([]);
      getRoleOptions();
      let roleIdData = businessObject['candidateGroups'] || [];
      if (roleIdData && roleIdData.length > 0) {
        console.log('进入111');
        roleIds.current = roleIdData.split(',');
      }
      setRoleIdsValue(roleIds.current);
      console.log(roleIds, 'roleIdsroleIdsroleIdsroleIds');
      // this.showMultiFlog = true;
      setShowMultiFlog(true);
    } else if (dataType.current === 'DEPTS') {
      getDeptTreeData();
      let deptIdData = businessObject['candidateGroups'] || [];
      console.log(deptIdData, 'deptIdDatadeptIdData');
      if (deptIdData && deptIdData.length > 0) {
        // this.deptIds = deptIdData.split(',');
        // setDeptIds([deptIdData.split(',')])
        console.log(businessObject.candidateGroups.split(','), '');
        console.log(businessObject.text.split(','), '');
        let dta = businessObject.candidateGroups.split(',');
        let das = businessObject.text.split(',');
        let size = dta.length;
        let options = [];
        for (let i = 0; i < size; i++) {
          let a = {};
          a['value'] = dta[i];
          a['label'] = das[i];
          a['disabled'] = undefined;
          a['halfChecked'] = undefined;
          options.push(a);
        }
        setDeptIds(options);
      }
      console.log(deptIds, 'DeptIdsDeptIdsDeptIds');
      // this.showMultiFlog = true;
      setShowMultiFlog(true);
    } else if (dataType.current === 'NODEVAR') {
      setTimeout(() => {
        let arr = JSON.parse(sessionStorage.getItem('userList'));
        console.log(arr, '上下文数据arr上下文数据arr');
        let arrDatas: any = [];
        arr.forEach(element => {
          let children = [];
          if (element.data) {
            let needData = [];
            element.data.forEach(sjn => {
              if (sjn.type == 'user-select') {
                needData.push({
                  value: sjn.name,
                  label: sjn.label
                });
              }
            });
            children = needData;
          }
          if (children.length > 0) {
            arrDatas.push({
              value: element.id,
              label: element.name,
              children: children
            });
          }
        });
        console.log(arrDatas, 'arrDatas');
        setCascaderOptions(arrDatas);
      }, 1000);
      if (businessObject.fieldOption.length > 0) {
        let assd = businessObject.fieldOption.split(',');
        setCascaderDefaultValue([assd[0], assd[1]]);
      } else {
        setCascaderDefaultValue(businessObject.fieldOption);
      }
      setShowMultiFlog(true);
    } else if (dataType.current === 'EXPRESSION') {
      defaultValue.current = businessObject?.expression;
      console.log('进入');
      getFormu();
      setShowMultiFlog(true);
    }
    getElementLoop(businessObject);
  }

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

  /**
   * 查询部门下拉树结构
   */
  function getDeptOptions() {
    // return new Promise((resolve, reject) => {
    if (!deptOptions || deptOptions.length <= 0) {
      deptTreeSelect().then(response => {
        console.log(response, 'response');
        let aaaaa = handleTree(response.data.data);
        let bbbbb = handleData(aaaaa);
        bbbbb.unshift({
          id: '',
          key: '',
          name: '全部部门',
          title: '全部部门',
          value: ''
        });
        setDeptOptions([...bbbbb]);
        setDeptTempOptions([...bbbbb]);
        let a = expandedKeysFun([...bbbbb]); //展开key
        let cp = JSON.stringify([...bbbbb]);
        setExpandedKeys(a);
        setCopyTree(cp);
        setCopyExpandedKeys(a);
        handleNodeClick(bbbbb[0].id, {node: {key: bbbbb[0].id}});
        setTreeDefault([bbbbb[0].id + '']);
      });
    } else {
      handleNodeClick(deptOptions[0].id, {node: {key: deptOptions[0].id}});
      setTreeDefault([deptOptions[0].id + '']);
    }
  }

  function getRoleOptions() {
    if (!roleOptions || roleOptions.length <= 0) {
      userRoleDropsDown().then(response => {
        // listRole().then(response => {
        console.log(response, '角色responseresponse');
        setRoleOptions([...response.data.data]);
        // roleOptions.current=response.data.list
        // roleOptions.current=[...response.data.list]
        console.log(roleOptions, 'roleOptionsroleOptions');
      });
      // listRole().then(response => roleOptions = response.rows);
    }
  }

  /**
   * 查询部门下拉树结构（含部门前缀）
   */
  const getDeptTreeData = async () => {
    function refactorTree(data) {
      console.log(data, 'aaaaaaaaaaa');
      return data.map(node => {
        // let treeData = { id: `DEPT${node.value}`, label: node.title, value: node.value };
        // let treeData = { id: `DEPT${node.id}`, label: node.label, parentId: node.parentId, weight: node.weight };
        let treeData = {
          id: `DEPT${node.id}`,
          label: node.name,
          parentId: node.parentId,
          value: `DEPT${node.id}`
        };
        if (node.children && node.children.length > 0) {
          treeData.children = refactorTree(node.children);
        }
        return treeData;
      });
    }

    return new Promise((resolve, reject) => {
      console.log(deptTreeData, 'deptTreeDatadeptTreeDatadeptTreeData');
      console.log(treeSelectValue, 'treeSelectValuetreeSelectValue');
      if (!deptTreeData || deptTreeData.length <= 0) {
        deptTreeSelect()
          .then(response => {
            // deptTreeSelect().then(() => {
            // deptTreeData = refactorTree(this.deptOptions);
            // setDeptTreeData(refactorTree(deptOptions))
            let aaaa = handleTree(response.data.data);
            setDeptTreeData(refactorTree(aaaa));
            resolve(true);
          })
          .catch(() => {
            reject();
          });
      } else {
        resolve(true);
      }
    });
  };

  function getElementLoop(businessObject: any) {
    console.log(businessObject, 'businessObjectbusinessObjectbusinessObject');
    if (!businessObject.loopCharacteristics) {
      multiLoopType.current = 'Null';
      return;
    }
    isSequential.current = businessObject.loopCharacteristics.isSequential;
    if (businessObject.loopCharacteristics.completionCondition) {
      if (
        businessObject.loopCharacteristics.completionCondition.body ===
        '${nrOfCompletedInstances >= nrOfInstances && nrOfInstances != 0}'
      ) {
        multiLoopType.current = 'SequentialMultiInstance';
      } else {
        multiLoopType.current = 'ParallelMultiInstance';
      }
    }
  }

  // 点击添加用户按钮
  function onSelectUsers(e) {
    changeUserType.current = e;
    tanData.current = [];
    pagination.current = {
      ...pagination.current,
      current: 1,
      pageSize: 10
    };
    queryParams.current = {
      deptId: undefined,
      pageSize: 10,
      pageNo: 1
    };
    getDeptOptions();
    setUserTableList([]);
    setUserOpen(true);
    if (e == 'user') {
      if (
        typeof props.businessObject.assignee == 'string' &&
        props.businessObject.assignee != '' &&
        !props.businessObject.assignee.includes('$')
      ) {
        setSelectedRowKeys([props.businessObject.assignee]);
        tanData.current = [props.businessObject.assignee];
      } else if (
        props.businessObject.candidateUsers &&
        props.businessObject.candidateUsers != '' &&
        props.businessObject.candidateUsers != null
      ) {
        console.log('进入1');
        if (typeof props.businessObject.candidateUsers == 'string') {
          let a = props.businessObject.candidateUsers.split(',');
          let b = a.map(rsw => {
            let sja = rsw;
            userTableList.forEach(rsd => {
              if (Number(rsw) == Number(rsd.id)) {
                sja = rsd.id;
              }
            });
            return sja;
          });
          setSelectedRowKeys(b);
          tanData.current = b;
        } else {
          setSelectedRowKeys([props.businessObject.candidateUsers]);
          tanData.current = [props.businessObject.candidateUsers];
        }
      } else {
        setSelectedRowKeys([]);
      }
    }
    if (e == 'chao') {
      chaoData.current = [];
      if (
        typeof businessObject.transactor == 'string' &&
        businessObject.transactor != '' &&
        !businessObject.transactor.includes('$')
      ) {
        setSelectedRowKeys([businessObject.transactor]);
        chaoData.current = [businessObject.transactor];
      } else if (
        businessObject.transactor &&
        businessObject.transactor != '' &&
        businessObject.transactor != null
      ) {
        if (typeof businessObject.transactor == 'string') {
          let a = businessObject.transactor.split(',');
          let b = a.map(rsw => {
            let sja = rsw;
            userTableList.forEach(rsd => {
              if (Number(rsw) == Number(rsd.id)) {
                sja = rsd.id;
              }
            });
            return sja;
          });
          setSelectedRowKeys(b);
          chaoData.current = b;
        } else {
          setSelectedRowKeys([businessObject.transactor]);
          chaoData.current = [businessObject.transactor];
        }
      } else {
        setSelectedRowKeys([]);
      }
    }
  }

  // 重置数据
  function clearOptionsData() {
    chaoUser.current = {
      ids: [],
      text: []
    };
    selectedUser.current = {ids: [], text: []};
    roleIds.current = [];
    setRoleIdsValue([]);
    setDeptIds([]);
  }

  /**
   * 更新节点数据
   */
  function updateElementTask() {
    const taskAttr = Object.create(null);
    let arrData = {};
    for (let key in userData.current) {
      taskAttr[key] = userData.current[key];
    }
    if (timeoutHandlerEnable) {
      for (let key in chaoUserData.current) {
        taskAttr[key] = chaoUserData.current[key];
      }
    }
    if (taskAttr.dataType == 'USERS') {
      arrData = {
        text: JSON.stringify(taskAttr.text),
        dataType: taskAttr.dataType,
        assignee: taskAttr.assignee,
        candidateUsers: taskAttr.candidateUsers,
        fieldOption: undefined,
        expression: undefined,
        candidateGroups: undefined
      };
    } else if (taskAttr.dataType == 'ROLES') {
      arrData = {
        candidateUsers: undefined,
        candidateGroups: taskAttr.candidateGroups,
        dataType: taskAttr.dataType,
        text: taskAttr.text,
        assignee: '${assignee}',
        expression: undefined,
        fieldOption: undefined
      };
    } else if (taskAttr.dataType == 'DEPTS') {
      arrData = {
        candidateUsers: undefined,
        candidateGroups: taskAttr.candidateGroups,
        dataType: taskAttr.dataType,
        assignee: '${assignee}',
        text: taskAttr.text,
        expression: undefined,
        fieldOption: undefined
      };
    } else if (taskAttr.dataType == 'INITIATOR') {
      arrData = {
        candidateUsers: undefined,
        assignee: taskAttr.assignee,
        dataType: taskAttr.dataType,
        text: taskAttr.text,
        expression: undefined,
        candidateGroups: undefined,
        fieldOption: undefined
      };
    } else if (taskAttr.dataType == 'NODEVAR') {
      arrData = {
        candidateUsers: undefined,
        dataType: taskAttr.dataType,
        text: '节点变量',
        assignee: '${assignee}',
        candidateGroups: undefined,
        expression: undefined,
        fieldOption: cascaderDefaultValue
      };
    } else if (taskAttr.dataType == 'EXPRESSION') {
      arrData = {
        candidateUsers: undefined,
        dataType: taskAttr.dataType,
        text: '表达式',
        candidateGroups: undefined,
        fieldOption: undefined,
        expression: defaultValue.current,
        assignee: '${assignee}'
      };
    }
    if (timeoutHandlerEnable) {
      if (taskAttr.transactor == '') {
        arrData.chaoText = undefined;
        arrData.transactor = undefined;
      }else{
        arrData.chaoText = JSON.stringify(taskAttr.chaoText);
        arrData.transactor = taskAttr.transactor;
      }
    }
    console.log(arrData, 'arrDataarrDataarrData');
    console.log(window.bpmnInstance.element, 'window.bpmnInstance.element');
    window.bpmnInstance.modeling.updateProperties(
      window.bpmnInstance.element,
      arrData
    );
  }

  // 选择多实例审批方式
  function changeMultiLoopType(e?: any) {
    console.log(e, 'eeeeeeeeeee');
    // if(e){
    //   isSequential.current=e
    // }
    if (e?.target) {
      // setMultiLoopType(e.target.value)
      multiLoopType.current = e.target.value;
      console.log(multiLoopType, '11111111111111');
    } else {
      isSequential.current = e;
    }
    console.log(multiLoopType, 'multiLoopTypemultiLoopType');
    console.log(window, 'window,window');
    // 取消多实例配置
    if (multiLoopType.current === 'Null') {
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {loopCharacteristics: null, assignee: null}
      );
      return;
    }
    console.log(isSequential, 'isSequentialisSequential');
    // this.multiLoopInstance = window.bpmnInstance.moddle.create("bpmn:MultiInstanceLoopCharacteristics", { isSequential: this.isSequential });
    // setMultiLoopInstance(window.bpmnInstance.moddle.create("bpmn:MultiInstanceLoopCharacteristics", { isSequential: isSequential }))
    // multiLoopInstance.current = window.bpmnInstance.moddle.create("bpmn:MultiInstanceLoopCharacteristics", { isSequential: isSequential })
    multiLoopInstance.current = window.bpmnInstance.moddle.create(
      'bpmn:MultiInstanceLoopCharacteristics',
      {isSequential: isSequential.current}
    );
    console.log(
      multiLoopInstance,
      'multiLoopInstancemultiLoopInstancemultiLoopInstance'
    );
    // 更新多实例配置
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      loopCharacteristics: multiLoopInstance.current,
      assignee: '${assignee}'
    });
    // 完成条件
    let completionCondition = null;
    console.log(multiLoopType, 'multiLoopTypemultiLoopTypemultiLoopType');
    // 会签
    if (multiLoopType.current === 'SequentialMultiInstance') {
      completionCondition = window.bpmnInstance.moddle.create(
        'bpmn:FormalExpression',
        {
          body: '${nrOfCompletedInstances >= nrOfInstances && nrOfInstances != 0}'
        }
      );
    }
    // 或签
    if (multiLoopType.current === 'ParallelMultiInstance') {
      isSequential.current = false;
      multiLoopInstance.current = window.bpmnInstance.moddle.create(
        'bpmn:MultiInstanceLoopCharacteristics',
        {isSequential: false}
      );
      multiLoopInstance.current = window.bpmnInstance.moddle.create(
        'bpmn:MultiInstanceLoopCharacteristics',
        {isSequential: isSequential.current}
      );
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          loopCharacteristics: multiLoopInstance.current,
          assignee: '${assignee}'
        }
      );
      completionCondition = window.bpmnInstance.moddle.create(
        'bpmn:FormalExpression',
        {body: '${nrOfCompletedInstances > 0}'}
      );
    }
    // 更新模块属性信息
    window.bpmnInstance.modeling.updateModdleProperties(
      window.bpmnInstance.element,
      multiLoopInstance.current,
      {
        collection: '${multiInstanceHandler.getUserIds(execution)}',
        elementVariable: 'assignee',
        // elementVariable: 'flowable:assignee',
        // elementVariable: 'assignee',
        completionCondition
      }
    );
  }

  function initRows() {
    // 获取监听器
    let listeners: any[] = extractExtensionList(
      prefix,
      `${
        false
          ? ELEMENT_LISTENER_TYPE.TaskListener
          : ELEMENT_LISTENER_TYPE.ExecutionListener
      }`
    );
    console.log(listeners, 'listeners');
    setListenerList(listeners);
  }

  // 选择 未解析出操作人时 是否自动跳过
  function changeAutoSkipTask(e?: any) {
    console.log(e, '选择 未解析出操作人时 是否自动跳过');
    let options = {
      rowKey: 1,
      eventType: 'end',
      listenerType: 'class',
      javaClass:
        'cn.iocoder.yudao.module.processManage.listener.processTask.AutoSkipTaskListener',
      fields: [
        {
          key: 1,
          fieldName: 'autoSkipTask',
          fieldType: '字符串',
          fieldTypeValue: 'string',
          fieldValue: e + ''
        }
      ]
    };
    // autoSkipTask.current = e;
    setAutoSkipTask(e);
    let listener: any = Object.create(null);
    // listener.id = options.eventId; // 只有任务监听器才需要设置事件id
    listener.event = options.eventType;
    listener.listenerType = options.listenerType;
    listener.expression = options.expression;
    listener.delegateExpression = options.delegateExpression;
    listener.class = options.javaClass;
    // 设置定时器属性
    listener.timerType = options.timerType;
    listener.timerValue = options.timerValue;
    // 创建注入字段对象
    let fields: Array<any> = options.fields;
    if (fields && fields.length > 0) {
      fields = fields.map(el => {
        return {
          name: el.fieldName,
          fieldType: el.fieldTypeValue,
          string: el.fieldValue,
          expression: el.fieldValue
        };
      });
    }
    // 设置注入字段属性
    listener.fields = fields;
    // 设置脚本属性
    listener.scriptType = options.scriptType;
    listener.scriptFormat = options.scriptFormat;
    listener.value = options.scriptValue;
    listener.resource = options.resource;
    // 创建监听器实例
    console.log(listenerList, 'listenerList');
    let listenerObject = createListenerObject(listener, false, prefix);
    console.log(listenerObject, 'listenerObject');
    // 将监听器实例绑定到bpmn
    let newListenerExtensionList: Array<any> = [...listenerList];
    newListenerExtensionList.splice(
      options.rowKey > 0 ? options.rowKey - 1 : listenerList.length,
      1,
      listenerObject
    );
    console.log(newListenerExtensionList, 'newListenerExtensionList');
    updateElementExtensions(
      getOtherExtensionList().concat(newListenerExtensionList)
    );
    // 刷新表格
    initRows();
  }

  // 单选选择
  function changeDataType(val: any) {
    let properties: any = createProperties(prefix, {
      properties: []
    });
    // updateElementExtensions(getOtherExtensionList().concat([properties]));
    console.log(val, '单选选择');
    // setDataType(val)
    dataType.current = val;
    if (
      val === 'ROLES' ||
      val === 'DEPTS' ||
      val === 'NODEVAR' ||
      (val === 'USERS' && selectedUser.current.text.length > 1)
    ) {
      setShowMultiFlog(true);
    } else {
      setShowMultiFlog(false);
    }
    multiLoopType.current = 'Null';
    changeMultiLoopType();
    // 清空 userTaskForm 所有属性值
    Object.keys(userTaskForm).forEach(key => (userTaskForm[key] = null));
    setRoleIdsValue([]);
    setCascaderDefaultValue([]);
    userData.current = {
      ...userData.current,
      candidateUsers: [],
      candidateGroups: [],
      text: [],
      assignee: null,
      dataType: val
    };
    selectedUser.current = {
      ids: [],
      text: []
    };
    if (val === 'USERS') {
      if (
        selectedUser.current &&
        selectedUser.current.ids &&
        selectedUser.current.ids.length > 0
      ) {
        if (selectedUser.current.ids.length === 1) {
          multiLoopType.current = 'SequentialMultiInstance';
          changeMultiLoopType(
            isSequential.current ? isSequential.current : false
          );
          userData.current = {
            ...userData.current,
            assignee: selectedUser.current.ids[0]
          };
        } else {
          multiLoopType.current = 'SequentialMultiInstance';
          changeMultiLoopType(
            isSequential.current ? isSequential.current : false
          );
          userData.current = {
            ...userData.current,
            candidateUsers: selectedUser.current.ids.join()
          };
        }
        userData.current = {
          ...userData.current,
          text: selectedUser.current.text || null
          // text: selectedUser.current.text?.join() || null
        };
      } else {
        multiLoopType.current = 'SequentialMultiInstance';
        changeMultiLoopType(
          isSequential.current ? isSequential.current : false
        );
      }
    } else if (val === 'ROLES') {
      getRoleOptions();
      console.log(businessObject, 'businessObjectbusinessObject');
      let roleIdData = businessObject['candidateGroups'] || [];
      console.log(roleIdData, 'roleIdDataroleIdDataroleIdData');
      if (roleIdData && roleIdData.length > 0) {
        roleIds.current = [];
        setRoleIdsValue([]);
        let data = roleIdData.split(',');
        data.forEach(element => {
          if (element.indexOf('ROLE') != -1) {
            roleIds.current.push(element);
          }
        });
        setRoleIdsValue(roleIds.current);
      }
      if (roleIds.current && roleIds.current.length > 0) {
        console.log('进入角色操作人设置');
        let textArr = roleOptions.filter(
          k => roleIds.current.indexOf(`ROLE${k.id}`) >= 0
        );
        userData.current = {
          ...userData.current,
          text: textArr?.map(k => k.name).join() || null,
          candidateGroups: roleIds.current.join() || null
        };
      }
      multiLoopType.current = 'SequentialMultiInstance';
      changeMultiLoopType(isSequential.current ? isSequential.current : false);
    } else if (val === 'DEPTS') {
      getDeptTreeData();
      console.log(deptIds, 'deptIdsdeptIdsdeptIds');
      if (deptIds && deptIds.length > 0) {
        let textArr: any = [];
        let treeStarkData = JSON.parse(JSON.stringify(deptTreeData));
        deptIds.forEach((item: any) => {
          let stark: any = [];
          stark = stark.concat(treeStarkData);
          while (stark.length) {
            let temp = stark.shift();
            if (temp.children) {
              stark = temp.children.concat(stark);
            }
            if (item === temp.id) {
              textArr.push(temp);
            }
          }
        });
        multiLoopType.current = 'SequentialMultiInstance';
        changeMultiLoopType(
          isSequential.current ? isSequential.current : false
        );
        userData.current = {
          ...userData.current,
          text: textArr?.map(k => k.label).join() || null
        };
      }
      multiLoopType.current = 'SequentialMultiInstance';
      changeMultiLoopType(isSequential.current ? isSequential.current : false);
    } else if (val === 'INITIATOR') {
      multiLoopType.current = 'SequentialMultiInstance';
      changeMultiLoopType(isSequential.current ? isSequential.current : false);
      userData.current = {
        ...userData.current,
        assignee: '${assignee}',
        text: '流程发起人'
      };
    } else if (val === 'NODEVAR') {
      let arr = JSON.parse(sessionStorage.getItem('userList'));
      console.log(arr, '上下文数据arr');
      if (arr != null) {
        let arrDatas: any = [];
        arr.forEach(element => {
          let children = [];
          if (element.data) {
            let needData = [];
            element.data.forEach(sjn => {
              if (sjn.type == 'user-select') {
                needData.push({
                  value: sjn.name,
                  label: sjn.label
                });
              }
            });
            children = needData;
          }
          if (children.length > 0) {
            arrDatas.push({
              value: element.id,
              label: element.name,
              children: children
            });
          }
        });
        console.log(arrDatas, 'arrDatasarrDatas');
        setCascaderOptions(arrDatas);
      }
      multiLoopType.current = 'SequentialMultiInstance';
      changeMultiLoopType(isSequential.current ? isSequential.current : false);
      userData.current = {
        ...userData.current,
        text: '节点变量'
      };
    } else if (val === 'EXPRESSION') {
      // let arr = JSON.parse(sessionStorage.getItem('userList'));
      // let userArr = JSON.parse(sessionStorage.getItem('getUserList'));
      // let queryArr = JSON.parse(sessionStorage.getItem('queryList'));
      // let startArr = JSON.parse(sessionStorage.getItem('startList')); // 流程参数
      // if (userArr != null && userArr.length > 0) {
      //   userArr = uniqueFunc(userArr, 'nodeId');
      // }
      // let aws = [];
      // let startArrs: any = [];
      // if (userArr != null && userArr.length > 0) {
      //   userArr.forEach(items => {
      //     if (items.type == 'bpmn:StartEvent') {
      //       aws.push({
      //         name: items.name,
      //         key: items.nodeId,
      //         label: items.name,
      //         value: items.nodeId,
      //         path: items.id,
      //         tag: '对象',
      //         isMember: false,
      //         disabled: false,
      //         children: [
      //           {
      //             name: '数据ID',
      //             key: items.nodeId,
      //             label: '数据ID',
      //             value: items.nodeId + '.saveDataId',
      //             path: items.id + '.数据ID',
      //             tag: '文本',
      //             isMember: false,
      //             disabled: false
      //           }
      //         ]
      //       });
      //     } else {
      //       aws.push({
      //         name: items.name,
      //         key: items.nodeId,
      //         label: items.name,
      //         value: items.nodeId,
      //         path: items.id,
      //         tag: '对象',
      //         isMember: false,
      //         disabled: false,
      //         children: [
      //           {
      //             name: '操作人',
      //             key: items.nodeId,
      //             label: '操作人',
      //             value: items.nodeId + '.approvalUser',
      //             path: items.id + '.操作人',
      //             tag: '文本',
      //             isMember: false,
      //             disabled: false
      //           },
      //           {
      //             name: '审批意见',
      //             key: items.nodeId,
      //             label: '审批意见',
      //             value: items.nodeId + '.actComment',
      //             path: items.id + '.审批意见',
      //             tag: '文本',
      //             isMember: false,
      //             disabled: false
      //           },
      //           {
      //             name: '数据ID',
      //             key: items.nodeId,
      //             label: '数据ID',
      //             value: items.nodeId + '.saveDataId',
      //             path: items.id + '.数据ID',
      //             tag: '文本',
      //             isMember: false,
      //             disabled: false
      //           }
      //         ]
      //       });
      //     }
      //   });
      // }
      // if (startArr != null && startArr.length > 0) {
      //   startArrs = [...startArr];
      // } else {
      //   startArrs = [
      //     {
      //       label: '流程参数',
      //       value: 'processInstanceStartVariables',
      //       path: '流程参数',
      //       type: '',
      //       tag: '',
      //       isMember: false,
      //       disabled: false
      //     }
      //   ];
      // }
      // if (queryArr != null && queryArr.length > 0) {
      //   aws = [...aws, ...queryArr];
      // }
      // let arrDatas: any = [];
      // if (arr != null) {
      //   arr.forEach(element => {
      //     let children = [];
      //     if (element.data) {
      //       let needData = [];
      //       element.data.forEach(sjn => {
      //         if (sjn.type == 'user-select') {
      //           needData.push({
      //             name: sjn.label,
      //             key: element.id + sjn.name,
      //             label: sjn.label,
      //             value: element.id + '.' + sjn.name,
      //             path: element.id + '.' + sjn.label,
      //             tag: '人员选择',
      //             isMember: false,
      //             disabled: false
      //           });
      //         }
      //       });
      //       children = needData;
      //     }
      //     if (children.length > 0) {
      //       arrDatas.push({
      //         name: element.name,
      //         key: element.id,
      //         path: element.name,
      //         tag: '对象',
      //         isMember: false,
      //         disabled: false,
      //         value: element.id,
      //         label: element.name,
      //         children: children
      //       });
      //     }
      //   });
      //   console.log(arrDatas, 'arrDatasarrDatas');
      // }
      // if (arrDatas.length > 0) {
      //   aws = aws.map(res => {
      //     let resArr = {...res};
      //     arrDatas.forEach(element => {
      //       if (res.key == element.key) {
      //         resArr.children = [...resArr.children, ...element.children];
      //       }
      //     });
      //     return resArr;
      //   });
      // }
      // aws.push(forData);
      // aws = [...aws, ...startArrs];
      // console.log(aws,'4444444444444444444')
      // setFormuVariables(aws);
      setShowMultiFlog(true);
      multiLoopType.current = 'SequentialMultiInstance';
      changeMultiLoopType(isSequential.current ? isSequential.current : false);
      userData.current = {
        dataType: 'EXPRESSION',
        text: '表达式'
      };
      defaultValue.current = '';
      setShowAmis(false);
      setTimeout(() => {
        setShowAmis(true);
      }, 10);
    }
    updateElementTask();
    modelUser.current = [];
  }

  // 树状图
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState('');
  // 备份
  const [copyExpandedKeys, setCopyExpandedKeys] = useState();
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  const onExpand = (newExpandedKeys: React.Key[]) => {
    console.log(newExpandedKeys, 'newExpandedKeysnewExpandedKeys');
    setExpandedKeys(newExpandedKeys);
    // setAutoExpandParent(false);
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
  const filterFn = (data, filterText) => {
    //过滤函数
    if (!filterText) {
      return true;
    }
    return new RegExp(filterText, 'i').test(data.title); //我是一title过滤 ，你可以根据自己需求改动
  };
  // 定义搜索函数
  const searchChange = e => {
    const {value} = e.target;
    if (value == '') {
      //为空时要回到最初 的树节点
      // let { copyTree, copyExpandedKeys } = this.state;
      // let res = this.arrayTreeFilter(JSON.parse(copyTree), this.filterFn, value);
      // let expkey = this.expandedKeysFun(res);
      setDeptOptions(JSON.parse(copyTree));
      setExpandedKeys(copyExpandedKeys);
    } else {
      // let { copyTree, copyExpandedKeys } = this.state;
      console.log(JSON.parse(copyTree), 'JSON.parse(copyTree)');
      console.log(filterFn, 'filterFn');
      console.log(value, 'value');
      let res = arrayTreeFilter(JSON.parse(copyTree), filterFn, value);
      console.log(res, 'resresresrees');
      let expkey = expandedKeysFun(res);
      setDeptOptions(res);
      setExpandedKeys(expkey);
    }
    const newExpandedKeys = value ? expandedKeys : [];
    setExpandedKeys(newExpandedKeys);
    setSearchValue(value);
    setAutoExpandParent(true);
  };

  // 定义渲染树状节点函数
  const renderTreeNodes = data => {
    if (data.length == 0) {
      return;
    }
    return data.map(item => {
      const index = item.title.indexOf(searchValue);
      const beforeStr = item.title.substr(0, index);
      const afterStr = item.title.substr(index + searchValue.length);
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
          <Tree.TreeNode key={item.key} title={title}>
            {renderTreeNodes(item.children)}
          </Tree.TreeNode>
        );
      }
      return <Tree.TreeNode key={item.key} title={title} />;
    });
  };

  // 选择角色
  function changeSelectRoles(val) {
    console.log(val, 'val选择角色');
    setRoleIdsValue(val);
    let groups = null;
    let text = null;
    if (val && val.length > 0) {
      // userTaskForm.dataType = 'ROLES';
      //setUserTaskForm({ ...userTaskForm, dataType: 'ROLES' })
      userData.current = {...userData.current, dataType: 'ROLES'};
      groups = val.join() || null;
      console.log(roleOptions, 'roleOptionsroleOptions');
      let textArr = roleOptions.filter(k => val.indexOf(`ROLE${k.id}`) >= 0);
      // let textArr = roleOptions.filter(k => val.indexOf(`ROLE${k.roleId}`) >= 0);
      console.log(textArr, 'textArrtextArr');
      // text = textArr?.map(k => k.roleName).join() || null;
      text = textArr?.map(k => k.roleName).join() || null;
      console.log(text, 'texttexttexttexttexttext');
    } else {
      userData.current = {...userData.current, dataType: null};
      // multiLoopType.current = 'Null';
      if (val.length == 0) {
        text = null;
        groups = null;
      }
    }
    userData.current = {
      ...userData.current,
      candidateGroups: groups,
      text: text,
      dataType: 'ROLES'
    };
    updateElementTask();
    changeMultiLoopType(isSequential.current ? isSequential.current : false);
  }

  // 部门树状下拉
  function checkedDeptChange(checkedIds: any) {
    console.log(
      checkedIds,
      'checkedIdscheckedIdscheckedIdscheckedIdscheckedIds'
    );
    let needData = checkedIds.map(res => res);
    // let needData = checkedIds.map(res => res.value);
    let groups = null;
    let text = null;
    // this.deptIds = checkedIds;
    setDeptIds(needData);
    // setDeptIds(checkedIds)
    // setDeptIds(treeSelectValue.current)
    if (checkedIds && checkedIds.length > 0) {
      // userTaskForm.dataType = 'DEPTS';
      //setUserTaskForm({ ...userTaskForm, dataType: 'DEPTS' })
      userData.current = {...userData.current, dataType: 'DEPTS'};
      // groups = checkedIds.join() || null;
      groups = needData.join() || null;
      let textArr = [];
      let treeStarkData = JSON.parse(JSON.stringify(deptTreeData));
      // console.log(treeStarkData,'treeStarkDatatreeStarkDatatreeStarkDatatreeStarkData')
      // console.log(treeStarkData.shift(),'.shift()')
      needData.forEach(id => {
        // checkedIds.forEach(id => {
        let stark = [];
        stark = stark.concat(treeStarkData);
        // console.log(stark,'starkstarkstark')
        while (stark.length) {
          let temp = stark.shift();
          if (temp.children) {
            stark = temp.children.concat(stark);
          }
          if (id === temp.id) {
            textArr.push(temp);
          }
        }
      });
      console.log(textArr, 'textArr');
      text = textArr?.map(k => k.label).join() || null;
    } else {
      userData.current = {...userData.current, dataType: null};
      // multiLoopType.current = 'Null';
      if (checkedIds.length == 0) {
        groups = null;
        text = null;
      }
    }
    userData.current = {
      ...userData.current,
      candidateGroups: groups,
      text: text,
      dataType: 'DEPTS'
    };
    updateElementTask();
    changeMultiLoopType(isSequential.current ? isSequential.current : false);
  }

  // 对象数组去重
  function uniqueFunc(arr, uniId) {
    const res = new Map();
    return arr.filter(item => !res.has(item[uniId]) && res.set(item[uniId], 1));
  }

  // 表格多选
  const handleRowSelection = (selectedRowKeys, selectedRows, selected) => {
    console.log(selectedRowKeys, 'selectedRowKeys表格多选');
    console.log(selectedRows, 'selectedRows');
    console.log(selected, 'selectedselected');
    tableValue.current.push(selectedRowKeys[0]);
    let selecteData = [...selectedRows];
    selecteData = uniqueFunc(selecteData, 'id');
    setSelectedUserDate([...selecteData]);
    setSelectedRowKeys([...selectedRowKeys]);
    if (changeUserType.current == 'user') {
      let data = [...modelUser.current, ...selecteData];
      data = uniqueFunc(data, 'id');
      modelUser.current = data;
    } else {
      let chaoNeedData = [...chaoModelUser.current, ...selecteData];
      chaoNeedData = uniqueFunc(chaoNeedData, 'id');
      chaoModelUser.current = chaoNeedData;
    }
  };
  const onSelect = (record, selected, selectedRows, nativeEvent) => {
    if (!selected && modelUser.current.length > 0 && changeUserType.current == 'user') {
      let userList: any = modelUser.current.filter(item1 => {
        return Number(record.id) != Number(item1.id);
      });
      console.log(userList, 'userList');
      modelUser.current = userList;
      let userLists: any = tanData.current.filter(item1 => {
        return Number(record.id) != Number(item1);
      });
      console.log(userLists, 'userList');
      tanData.current = userLists;
    } else {
      let userList: any = chaoModelUser.current.filter(item1 => {
        return Number(record.id) != Number(item1.id);
      });
      console.log(userList, 'userList');
      chaoModelUser.current = userList;
      let userLists: any = chaoData.current.filter(item1 => {
        return Number(record.id) != Number(item1);
      });
      console.log(userLists, 'userList');
      chaoData.current = userLists;
    }
  };
  const onSelectAll = (selected, selectedRows, changeRows) => {
    if (!selected && modelUser.current.length > 0 && changeUserType.current == 'user') {
      let userLists = modelUser.current.filter(
        item1 =>
          changeRows.findIndex(item2 => Number(item2.id) == Number(item1.id)) ==
          -1
      );
      console.log(userLists, 'userList');
      modelUser.current = userLists;
    } else if (!selected && chaoModelUser.current.length > 0 && changeUserType.current == 'chao') {
      let userLists = chaoModelUser.current.filter(
        item1 =>
          changeRows.findIndex(item2 => Number(item2.id) == Number(item1.id)) ==
          -1
      );
      console.log(userLists, 'userList');
      chaoModelUser.current = userLists;
    }
  };
  // 弹窗确认
  const handleTaskUserComplete = (isTag?: any) => {
    console.log(modelUser, 'modelUser');
    console.log(selectedUserDate, 'selectedUserDate');
    console.log(selectedUser.current, '标签显示数组');
    console.log(props, 'props');
    if (!isTag) {
      if (!modelUser.current || modelUser.current.length <= 0) {
        message.warning('请选择用户');
        return;
      }
      if (!chaoModelUser.current || chaoModelUser.current.length <= 0) {
        message.warning('请选择用户');
        return;
      }
    }
    if (changeUserType.current == 'user') {
      userData.current = {...userData.current, dataType: 'USERS'};
      selectedUser.current = {
        text:
          modelUser.current.map(k => {
            return {id: k.id, nickname: k.nickname};
          }) || []
      };
      if (modelUser.current.length === 1) {
        let data1 = modelUser.current[0];
        console.log(data1, 'data');
        userData.current = {
          ...userData.current,
          assignee: '${assignee}',
          text: [{id: data1.id, nickname: data1.nickname}],
          candidateUsers: data1.id
        };
        setShowMultiFlog(false);
        multiLoopType.current = 'SequentialMultiInstance';
        // multiLoopType.current = 'Null';
        changeMultiLoopType(isSequential.current ? isSequential.current : false);
      } else if (modelUser.current.length == 0) {
        userData.current = {
          ...userData.current,
          candidateUsers: null,
          text: null,
          assignee: undefined
        };
        multiLoopType.current = 'Null';
        changeMultiLoopType(false);
        setShowMultiFlog(false);
      } else {
        userData.current = {
          ...userData.current,
          candidateUsers: modelUser.current.map(k => k.id).join() || null,
          text:
            modelUser.current.map(k => {
              return {id: k.id, nickname: k.nickname};
            }) || null,
          // text: modelUser.current.map(k => k.nickname).join() || null,
          assignee: '${assignee}'
        };
        multiLoopType.current = 'SequentialMultiInstance';
        changeMultiLoopType(isSequential.current ? isSequential.current : false);
        setShowMultiFlog(true);
      }
    }
    if (changeUserType.current == 'chao') {
      chaoUser.current = {
        text:
          chaoModelUser.current.map(k => {
            return {id: k.id, nickname: k.nickname};
          }) || []
      };
      if (chaoModelUser.current.length === 1) {
        let data1 = chaoModelUser.current[0];
        console.log(data1, 'data');
        chaoUserData.current = {
          ...chaoUserData.current,
          chaoText: [{id: data1.id, nickname: data1.nickname}],
          transactor: data1.id
        };
      } else if (chaoModelUser.current.length == 0) {
        chaoUserData.current = {
          ...chaoUserData.current,
          transactor: null,
          text: null
        };
      } else {
        chaoUserData.current = {
          ...chaoUserData.current,
          transactor: chaoModelUser.current.map(k => k.id).join() || null,
          chaoText:
            chaoModelUser.current.map(k => {
              return {id: k.id, nickname: k.nickname};
            }) || null
        };
      }
    }
    updateElementTask();
    setUserOpen(false);
  };

  /** 查询用户列表 */
  function getUserList() {
    console.log(selectedRowKeys, 'SelectedRowKeys');
    console.log(queryParams, 'queryParamsqueryParamsqueryParams');
    console.log(modelUser, 'modelUser');
    listUser(queryParams.current).then(response => {
      console.log(response, 'responseresponseresponse');
      let data = response.data.data.list.map((res, index) => {
        return {...res, key: index};
      });
      setUserTableList(data);
      setUserTotal(response.data.data.total);
      pagination.current = {
        ...pagination.current,
        total: response.data.data.total
      };
      let a: any = [];
      if (changeUserType.current == 'user') {
        a =
          typeof tanData.current == 'string'
            ? tanData.current.split(',')
            : tanData.current;
      }
      if (changeUserType.current == 'chao') {
        a =
          typeof chaoData.current == 'string'
            ? chaoData.current.split(',')
            : chaoData.current;
      }
      let b = a.map(rsw => {
        let sja = rsw;
        response.data.data.list.forEach(rsd => {
          if (Number(rsw) == Number(rsd.id)) {
            sja = rsd.id;
          }
        });
        return sja;
      });
      setSelectedRowKeys(b);
    });
  }

  // 部门列表数据点击
  function handleNodeClick(e, data) {
    console.log(e, 'eeeeeeeeeeeeeeee');
    console.log(data, 'adadadadadadadada');
    // this.queryParams.deptId = data.id;
    queryParams.current = {
      deptId: data.node.key,
      pageSize: 10,
      pageNo: 1
    };
    getUserList();
  }

  // 候选用户切换页码
  const handlePageChange = (page, pageSize) => {
    console.log(page, 'pagepagepagepage');
    console.log(pageSize, 'pageSizepageSizepageSizepageSize');
    // setPagination({ ...pagination, current: page });

    pagination.current = {
      ...pagination.current,
      current: page,
      pageSize: pageSize
    };
    queryParams.current = {
      ...queryParams.current,
      pageSize: pageSize,
      pageNo: page
    };
    getUserList();
  };

  // 弹窗取消
  function handleCancel() {
    setUserOpen(false);
    setSelectedRowKeys([]);
  }

  /**
   * 获取其它属性
   */
  function getOtherExtensionList() {
    let otherExtensionList: Array<any> = extractOtherExtensionList(
      prefix,
      `${
        false
          ? ELEMENT_LISTENER_TYPE.TaskListener
          : ELEMENT_LISTENER_TYPE.ExecutionListener
      }`
    );
    return otherExtensionList;
  }

  // 级联数据变化
  function cascaderOnChange(e) {
    console.log(e, '级联数据变化');
    if (e.length == 1) {
      return;
    }
    setCascaderDefaultValue(e);
    let arrData = {
      dataType: 'NODEVAR',
      text: '节点变量',
      assignee: '${assignee}',
      candidateGroups: undefined,
      fieldOption: e
    };
    window.bpmnInstance.modeling.updateProperties(
      window.bpmnInstance.element,
      arrData
    );
    // 创建属性实例
    let property: any = createProperty(prefix, {
      name: 'field',
      value: e[1]
    });
    let propertys: any = createProperty(prefix, {
      name: 'activityId',
      value: e[0]
    });
    console.log(property, 'property');
    let arr = [property, propertys];

    console.log(arr, 'arrrrrrrrrrrrrrr');
    let properties: any = createProperties(prefix, {
      properties: arr
    });
    console.log(properties, 'propertiesproperties');
    // 更新扩展属性
    // updateElementExtensions(getOtherExtensionList().concat([properties]));
  }

  // 表达式数据变化
  function defaultFirm(e) {
    console.log(e, '表达式数据变化');
    defaultValue.current = e;
    userData.current = {
      ...userData.current,
      text: '节点变量',
      dataType: 'EXPRESSION'
    };
    updateElementTask();
  }

  // 用户标签删除回调
  function handleClose(data, data1, data2) {
    changeUserType.current == data2;
    if (data2 == 'user') {
      if (modelUser.current.length > 0) {
        let userLists = modelUser.current.filter(item1 => {
          return Number(data.id) != Number(item1.id);
        });
        console.log(userLists, 'userList');
        modelUser.current = userLists;
      }
      if (tanData.current.length > 0) {
        let userLists = tanData.current.filter(item1 => {
          return Number(data.id) != Number(item1);
        });
        console.log(userLists, 'userList');
        tanData.current = userLists;
      }
    }
    if (data2 == 'chao') {
      if (chaoModelUser.current.length > 0) {
        let userLists = chaoModelUser.current.filter(item1 => {
          return Number(data.id) != Number(item1.id);
        });
        console.log(userLists, 'userList');
        chaoModelUser.current = userLists;
      }
      if (chaoData.current.length > 0) {
        let userLists = chaoData.current.filter(item1 => {
          return Number(data.id) != Number(item1);
        });
        console.log(userLists, 'userList');
        chaoData.current = userLists;
      }
    }
    handleTaskUserComplete(true);
  }

  // 流程操作设置数据变化
  const operationOnChange = e => {
    console.log(e, '多选数据变化');
    setCheckboxDefault(e);
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      processOperationSettings: businessObject.$type == 'bpmn:UserTask' ? JSON.stringify(e) : undefined
    });
  };
  // 用户任务类型数据变化
  const changeUserTaskType = e => {
    console.log('既然怒111111111111')
    setUserTaskType(e);
    if (e == 2) {
      setOperationOptions(operation2);
      setCheckboxDefault(['pass', 'stop']);
      console.log(businessObject, 'ssssssssssssssssss');
      console.log(businessObject.formKey, 'ssssssssssssssssss');
      if (businessObject.formKey) {
        formGet()
          .then(res => {
            console.log(res, 'sssssss');
            if (res.data.data.length > 0) {
              res.data.data.forEach(sjk => {
                if ('key_' + sjk.queryKey == businessObject.formKey) {
                      entityList.data.options.forEach(ress => {
                        ress.children.forEach(item => {
                          if (item.value == sjk.modelEventTarget) {
                            let allArr: any = [];
                            if (item.form.fields != null) {
                              allArr = item.form.fields.filter(fie => {
                                return fie.type != 'relation';
                              });
                            }
                            if (
                              item.form.relationFields &&
                              item.form.relationFields != null
                            ) {
                              allArr = [...allArr, ...item.form.relationFields];
                            }
                            let newKeyOption: any = [];
                            console.log(allArr, 'allArr');
                            allArr.forEach(skjwd => {
                              if (
                                !skjwd.isPrimaryKey &&
                                skjwd.yuanType != 'formula' &&
                                !skjwd.isUpdateDate &&
                                !skjwd.isCreateDate &&
                                !skjwd.isUpdateUser &&
                                !skjwd.isCreateUser
                              ) {
                                let returnData = {
                                  ...skjwd
                                };
                                if (returnData.relationKey) {
                                  returnData.key =
                                    returnData.relationKey + '.' + returnData.key;
                                }
                                newKeyOption.push(returnData);
                              }
                            });
                            console.log(newKeyOption, 'newKeyOption');
                            console.log(businessObject.editableFields);
                            let editableFieldsArr = businessObject.editableFields.split(',');
                            let allQuanArr = [...editableFieldsArr,
                              ...businessObject.hiddenFields.split(','),
                              ...businessObject.disableFields.split(',')];
                            console.log(allQuanArr, 'allQuanArr');
                            const difference1 = newKeyOption.filter(x => !allQuanArr.includes(x.key));
                            const difference2 = difference1.map(r => r.key);
                            console.log(difference1, 'difference1');
                            console.log(difference2, 'difference2');
                            let editValue: any = [...editableFieldsArr, ...difference2];
                            console.log(editValue, 'editValue');
                            window.bpmnInstance.modeling.updateProperties(
                              window.bpmnInstance.element,
                              {
                                // editableFields: difference2.join(',')
                                editableFields: editValue.join(',')
                              }
                            );
                          }
                        });
                      });
                }
              });
            }
          });
      }
      let mappdingObject: any = {};
      if (businessObject.processFormFieldMapping) {
        mappdingObject = JSON.parse(
          props.businessObject.processFormFieldMapping
        );
        for (let key in mappdingObject) {
          mappdingObject[key] = null;
        }
      }
      setProcessingObjectType(1);
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          processFormFieldMapping: JSON.stringify(mappdingObject),
          userTaskType: e,
          processingObjectType: 1,
          processOperationSettings: businessObject.$type == 'bpmn:UserTask' ? JSON.stringify(
            ['pass', 'stop']
          ) : undefined
        }
      );
    } else {
      setProcessingObjectValue('');
      setOperationOptions(operation1);
      setCheckboxDefault(['submit', 'save']);
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          userTaskType: e,
          processingObject: undefined,
          processOperationSettings: businessObject.$type == 'bpmn:UserTask' ? JSON.stringify(
            ['submit', 'save']
          ) : undefined
        }
      );
    }
  };
  // 处理对象数据变化
  const processingObjectChange = e => {
    setProcessingObjectValue(e);
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      processingObject: e
    });
  };
  // 处理对象类型数据变化
  const processingObjectTypeOnchange = e => {
    setProcessingObjectType(e);
    setProcessingObjectValue(undefined);
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      processingObjectType: e,
      processingObject: undefined
    });
  };
  // 自定义处理对象公式编辑器数据变化
  const formulaChange = e => {
    setProcessingObjectValue(e);
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      processingObject: e
    });
  };
  const TimeUnitType = {
    // 分钟
    MINUTE: 1,
    // 小时
    HOUR: 2,
    //天
    DAY: 3
  };
  const convertTimeUnit = (strTimeUnit: string) => {
    if (strTimeUnit === 'M') {
      return 1;
    }
    if (strTimeUnit === 'H') {
      return 2;
    }
    if (strTimeUnit === 'D') {
      return 3;
    }
    return 2;
  };
  const isoTimeDuration = () => {
    let strTimeDuration = 'PT';
    console.log(timeUnit, 'timeUnit');
    console.log(TimeUnitType, 'TimeUnitType');
    console.log(eventDefinition.current, 'eventDefinition.current');
    if (eventDefinition.current.timeUnit == '1') {
      strTimeDuration += eventDefinition.current.timeDuration + 'M';
    }
    if (eventDefinition.current.timeUnit == '2') {
      strTimeDuration += eventDefinition.current.timeDuration + 'H';
    }
    if (eventDefinition.current.timeUnit == '3') {
      strTimeDuration = 'P' + eventDefinition.current.timeDuration + 'D';
    }
    return strTimeDuration;
  };
  const onTimeUnitChange = (e) => {
    setTimeUnit(e);
    eventDefinition.current.timeUnit = e;
    // 分钟，默认是 60 分钟
    if (e == 1) {
      setTimeDuration(60);
      eventDefinition.current.timeDuration = 60;
    }
    // 小时，默认是 6 个小时
    if (e == 2) {
      setTimeDuration(6);
      eventDefinition.current.timeDuration = 6;
    }
    // 天， 默认 1天
    if (e == 3) {
      setTimeDuration(1);
      eventDefinition.current.timeDuration = 1;
    }
    let needData: any = isoTimeDuration();
    window.bpmnInstance.modeling.updateProperties(
      window.bpmnInstance.element,
      {
        timeoutData: needData
      }
    );
  };

  // 指定动作数据变化
  const onTimeoutHandlerTypeChanged = e => {
    console.log(e, '指定动作数据变化');
    setTimeoutHandlerType(e);
    chaoUser.current = {
      text:[],
      ids:[]
    }
    chaoUserData.current = {
      chaoText: '',
      transactor: ''
    };
    chaoModelUser.current = []
    setTimeInputValue('')
    window.bpmnInstance.modeling.updateProperties(
      window.bpmnInstance.element,
      {
        timeoutHandlerType: e,
        message: undefined,
        transactor: undefined,
        chaoText: undefined
      }
    );
  };

  // 选择超期开关时间变化
  function timeoutHandlerChange(val?: any) {
    console.log(val, '选择超期开关时间变化');
    setTimeoutHandlerEnable(val);
    if (val) {
      setTimeoutHandlerType('1');
      // 超时时间表达式
      setTimeDuration(6);
      setTimeUnit('2');
      eventDefinition.current.timeDuration = 6;
      eventDefinition.current.timeUnit = '2';
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          boundaryEventEnable: true,
          timeoutHandlerType: 1,
          timeoutData: 'PT6H'
        }
      );
    } else {
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          boundaryEventEnable: undefined,
          timeoutHandlerType: undefined,
          timeoutData: undefined
        }
      );
    }
  }

  // 超期数字变化
  function updateTimeModdle(e) {
    console.log(e, '超期数字变化');
    setTimeDuration(e);
    eventDefinition.current.timeDuration = e;
    let needData: any = isoTimeDuration();
    console.log(needData, 'needData');
    window.bpmnInstance.modeling.updateProperties(
      window.bpmnInstance.element,
      {
        timeoutData: needData
      }
    );
  }

  // 输入框数据
  function timeInputChange(e) {
    setTimeInputValue(e.target.value);
    window.bpmnInstance.modeling.updateProperties(
      window.bpmnInstance.element,
      {
        message: e.target.value
      }
    );
  }

  return (
    <>
      {/* <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}> */}
      <Row>
        <Col span={24}>
          <h4>
            <b>
              <span style={{color: 'red'}}>*</span>用户任务类型
            </b>
          </h4>
        </Col>
        {/* <Row> */}
        <Col span={24}>
          <Radio.Group
            onChange={e => changeUserTaskType(e.target.value)}
            value={userTaskType}
            defaultValue={userTaskType}
          >
            <Radio value={1}>填写</Radio>
            <Radio value={2}>审批</Radio>
          </Radio.Group>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <h4>
            <b>
              <span style={{color: 'red'}}>*</span>操作人设置
            </b>
          </h4>
        </Col>
        {/* <Row> */}
        <Col span={24}>
          <Radio.Group
            onChange={e => changeDataType(e.target.value)}
            value={dataType.current}
          >
            <Radio value={'USERS'}>
              <span style={{marginRight:"10px"}}>
                指定用户
              </span>
              <Tooltip title="不支持多租户">
                <InfoCircleOutlined />
              </Tooltip>
            </Radio>
            <Radio value={'ROLES'}>角色</Radio>
            <Radio value={'DEPTS'}>
              <span style={{marginRight:"10px"}}>
                部门
              </span>
              <Tooltip title="不支持多租户">
                <InfoCircleOutlined />
              </Tooltip>
            </Radio>
            <Radio value={'INITIATOR'}>发起人</Radio>
            {/* <Radio value={'NODEVAR'}>
              <Tooltip title='仅支持字段类型是"人员信息"或"人员多选"的字段'>
                <InfoCircleOutlined />
              </Tooltip>
              节点变量
            </Radio> */}
            <Radio value={'EXPRESSION'}>表达式</Radio>
          </Radio.Group>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          {dataType.current === 'USERS' ? (
            <div style={{margin: '10px'}}>
              {selectedUser.current.text.map(item => {
                return (
                  <Tag
                    key={item.nickname}
                    color="processing"
                    closable
                    onClose={e => {
                      handleClose(item, e, 'user');
                    }}
                  >
                    {item.nickname}
                  </Tag>
                );
              })}
              <div style={{margin: '10px'}}>
                <Button
                  block
                  size={'small'}
                  type="primary"
                  onClick={() => onSelectUsers('user')}
                >
                  选择用户
                </Button>
              </div>
            </div>
          ) : null}
          {dataType.current === 'ROLES' ? (
            <div style={{width: '100%', margin: '10px 0px'}}>
              <Select
                defaultValue={roleIdsValue}
                value={roleIdsValue}
                mode="multiple"
                placeholder={'请选择角色'}
                onChange={changeSelectRoles}
                style={{minWidth: '100%'}}
              >
                {roleOptions.map(e => {
                  return (
                    <Select.Option
                      key={e.id}
                      value={`ROLE${e.id}`}
                      disabled={e.status === 1}
                    >
                      {e.roleName}
                      {/* {e.name} */}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
          ) : null}
          {dataType.current === 'DEPTS' ? (
            <>
              <TreeSelect
                showSearch
                style={{width: '100%'}}
                value={deptIds}
                dropdownStyle={{maxHeight: 400, overflow: 'auto'}}
                placeholder="请选择"
                allowClear
                multiple
                showCheckedStrategy={TreeSelect.SHOW_ALL}
                treeDefaultExpandAll
                onChange={checkedDeptChange}
                treeData={deptTreeData}
              />
            </>
          ) : null}
          {dataType.current === 'NODEVAR' ? (
            <Cascader
              defaultValue={cascaderDefaultValue}
              options={cascaderOptions}
              onChange={cascaderOnChange}
              placeholder="请选择节点变量"
            />
          ) : null}
          {dataType.current === 'EXPRESSION' &&
            showAmis &&
            amisRender(
              getSchemaTpl('formulaControl-hour', {
                value: defaultValue.current,
                variables: formuVariables,
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
            )}
        </Col>
      </Row>
      <Row>
        <>
          <div>
            <h4>
              <b>
                <span style={{color: 'red'}}>*</span>流程操作设置
              </b>
            </h4>
            <Row>
              <Checkbox.Group
                options={operationOptions}
                value={checkboxDefault}
                onChange={operationOnChange}
              />
            </Row>
          </div>
        </>
      </Row>
      {userTaskType == 2 && (
        <>
          <Row>
            <div>
              <h4>
                <b>
                  <span style={{color: 'red'}}>*</span>处理对象类型
                </b>
              </h4>
              <Row>
                <Col span={24}>
                  <Radio.Group
                    onChange={e => processingObjectTypeOnchange(e.target.value)}
                    value={processingObjectType}
                    defaultValue={processingObjectType}
                  >
                    <Radio value={1}>填写节点</Radio>
                    <Radio value={2}>自定义</Radio>
                  </Radio.Group>
                </Col>
              </Row>
            </div>
          </Row>
          {processingObjectType == 1 && <Row>
            <div>
              <h4>
                <b>
                  <span style={{color: 'red'}}>*</span>选择填写节点
                </b>
              </h4>
              <Row>
                <Col span={24}>
                  <Select
                    defaultValue={processingObjectValue}
                    value={processingObjectValue}
                    placeholder={'请选择填写节点'}
                    onChange={processingObjectChange}
                    style={{minWidth: '200px'}}
                  >
                    {processingObject.map(e => {
                      return (
                        <Select.Option key={e.value}>{e.label}</Select.Option>
                      );
                    })}
                  </Select>
                </Col>
              </Row>
            </div>
          </Row>}
          {processingObjectType == 2 && <Row>
            <div>
              <h4>
                <b>
                  <span style={{color: 'red'}}>*</span>自定义数据ID
                </b>
              </h4>
              <div
                style={{minWidth: '200px'}}
              >
                {showAmis &&
                  amisRender(
                    getSchemaTpl('formulaControl-hour', {
                  variables: formuVariables,
                  value: processingObjectValue,
                  valueType: {
                    type: 'number',
                    placeholder: '请输入'
                  },
                  onChange: function(e) {
                    formulaChange(e);
                  },
                  formulaEchoVal: false,
                  advancedFeature: advancedFeature
                }),
                    {},
                    {
                      theme: amisEnv.theme
                    }
                  )
                }
              </div>
              {/*<Row>*/}
              {/*  <Col span={24}>*/}
              {/*  </Col>*/}
              {/*</Row>*/}
            </div>
          </Row>}
          <Row>
            <div>
              <h4>
                <b>
                  <span style={{color: 'red'}}>*</span>审批人超时未处理
                </b>
              </h4>
            </div>
          </Row>
          <Row>
            <Col span={24}>
              <Switch
                checkedChildren="开启"
                unCheckedChildren="关闭"
                checked={timeoutHandlerEnable}
                onChange={timeoutHandlerChange}
              />
            </Col>
          </Row>
          {timeoutHandlerEnable && <>
            <Row>
              <h4>
                <b>
                  <span style={{color: 'red'}}>*</span>超期执行动作
                </b>
              </h4>
              <Col span={24}>
                <Select
                  defaultValue={timeoutHandlerType}
                  value={timeoutHandlerType}
                  placeholder={'请选择执行动作'}
                  onChange={onTimeoutHandlerTypeChanged}
                  style={{width: '40%'}}
                >
                  {specifyingActions.map(e => {
                    return (
                      <Select.Option key={e.value + ''}>{e.label}</Select.Option>
                    );
                  })}
                </Select>
              </Col>
            </Row>
            {(timeoutHandlerType == '1' || timeoutHandlerType == '2') &&
              (<>
                <Row>
                  <h4>
                    <b>
                      <span style={{color: 'red'}}>*</span>消息模板
                    </b>
                  </h4>
                </Row>
                <Row>
                  <TextArea
                    value={timeInputValue}
                    onChange={timeInputChange}
                    placeholder="请输入消息模板"
                    autoSize={{minRows: 3, maxRows: 5}}
                  />
                </Row>
              </>)
            }
            {(timeoutHandlerType == '2' || timeoutHandlerType == '3') &&
              <>
                {chaoUser.current.text.map(item => {
                  return (
                    <Tag
                      key={item.nickname}
                      color="processing"
                      closable
                      onClose={e => {
                        handleClose(item, e, 'chao');
                      }}
                    >
                      {item.nickname}
                    </Tag>
                  );
                })}
                <div style={{margin: '10px'}}>
                  <Button
                    block
                    size={'small'}
                    type="primary"
                    onClick={() => onSelectUsers('chao')}
                  >
                    选择用户
                  </Button>
                </div>
              </>
            }
            <Row>
              <h4>
                <b>
                  <span style={{color: 'red'}}>*</span>超时时间设置
                </b>
              </h4>
            </Row>
            <Row>
              <Col span={2} style={{lineHeight: '2'}}>
                当超过
              </Col>
              <Col span={4}>
                <InputNumber
                  min={1}
                  value={timeDuration}
                  onChange={updateTimeModdle} />
              </Col>
              <Col span={3}>
                <Select
                  style={{width: '100%'}}
                  defaultValue={timeUnit}
                  value={timeUnit}
                  placeholder={'请选择时间类型'}
                  onChange={onTimeUnitChange}
                >
                  {timeOptions.map(e => {
                    return (
                      <Select.Option key={e.value + ''}>{e.label}</Select.Option>
                    );
                  })}
                </Select>
              </Col>
              <Col span={2} style={{lineHeight: '2'}}>
                未处理
              </Col>
            </Row>
          </>}
        </>
      )}
      <Row>
        {/* {showMultiFlog ? ( */}
        <>
          <div>
            {/* <Divider plain></Divider> */}
            <h4>
              <b>
                <span style={{color: 'red'}}>*</span>多人处理策略
              </b>
              {/* <b>多实例审批方式</b> */}
            </h4>
            <Row>
              <Radio.Group
                value={multiLoopType.current}
                onChange={e => changeMultiLoopType(e)}
              >
                <Space direction="vertical">
                  {/* {dataType.current != 'NODEVAR' &&
                    dataType.current != 'EXPRESSION' ? (
                      <Radio value={'Null'}>无</Radio>
                    ) : null} */}
                  <Radio value={'SequentialMultiInstance'}>
                    会签（需所有操作人同意）
                  </Radio>
                  <Radio value={'ParallelMultiInstance'}>
                    或签（一名操作人同意即可）
                  </Radio>
                </Space>
              </Radio.Group>
            </Row>
            {multiLoopType.current !== 'Null' ? (
              <>
                <Row>
                  <Tooltip title="开启后，实例需按顺序轮流审批">
                    <InfoCircleOutlined />
                  </Tooltip>
                  {/* <el-tooltip content="开启后，实例需按顺序轮流审批" placement="top-start" @click.stop.prevent>
            <i class="header-icon el-icon-info"></i>
          </el-tooltip> */}
                  <span>顺序审批：</span>
                  <Switch
                    disabled={multiLoopType.current === 'ParallelMultiInstance'}
                    defaultChecked={isSequential.current}
                    checked={isSequential.current}
                    onChange={changeMultiLoopType}
                  />
                </Row>
              </>
            ) : null}
          </div>
        </>
        {/* // ) : null} */}
      </Row>
      <Row>
        <Col span={12}>
          <h4>
            <b>
              未解析出操作人时 是否自动跳过:
              <Switch
                checkedChildren="开启"
                unCheckedChildren="关闭"
                // defaultChecked={autoSkipTask}
                checked={autoSkipTask}
                onChange={changeAutoSkipTask}
              />
            </b>
          </h4>
        </Col>
      </Row>

      <Modal
        title="候选用户"
        open={userOpen}
        onOk={handleTaskUserComplete}
        onCancel={handleCancel}
        width={'50%'}
        destroyOnClose
        okText="确认"
        cancelText="取消"
      >
        <Row gutter={20}>
          <Col className="gutter-row" span={7}>
            <Card title="部门列表">
              <div style={{height: '500px', overflow: 'auto'}}>
                {/* <Input placeholder="请输入部门名称" value={deptName} /> */}
                <Search
                  style={{marginBottom: 8}}
                  placeholder="请输入"
                  onChange={searchChange}
                />
                <Tree
                  onExpand={onExpand} // onExpand
                  expandedKeys={expandedKeys} // 展开固定树节点
                  // autoExpandParent={true} // 是否自动展开父节点
                  // selectedKeys={[100]}
                  defaultSelectedKeys={treeDefault}
                  // defaultSelectedKeys={['100']}
                  // autoExpandParent={autoExpandParent} // 是否自动展开父节点
                  // defaultExpandAll={true}
                  // treeData={deptOptions}
                  onSelect={(e, data) => handleNodeClick(e, data)}
                >
                  {renderTreeNodes(deptOptions)}
                </Tree>
              </div>
            </Card>
          </Col>
          {userOpen && (
            <Col className="gutter-row" span={17}>
              <Table
                rowKey="id"
                bordered
                // style={{ width: '50%', margin: 20 }}
                scroll={{
                  y: 500
                }}
                columns={tableColumns}
                dataSource={userTableList}
                rowSelection={{
                  selectedRowKeys: selectedRowKeys,
                  type: 'checkbox',
                  onChange: handleRowSelection,
                  onSelect: onSelect,
                  onSelectAll: onSelectAll
                }}
                // pagination={{ ...pagination.current, onChange: handlePageChange,showSizeChanger:true }}
                pagination={false}
              />
              {userTableList.length > 0 ? (
                <>
                  <Col style={{textAlign: 'center', width: '100%', paddingTop: '20px'}}>
                    <ConfigProvider locale={zh_CN}>
                      <Pagination
                        showSizeChanger
                        showQuickJumper
                        defaultCurrent={pagination.current.current}
                        total={pagination.current.total}
                        onChange={handlePageChange}
                      />
                    </ConfigProvider>
                  </Col>
                </>
              ) : null}
            </Col>
          )}
        </Row>
      </Modal>
    </>
  );
}
