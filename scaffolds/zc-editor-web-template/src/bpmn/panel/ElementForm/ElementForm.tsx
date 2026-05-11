import React, {useEffect, useRef, useState} from 'react';
import {
  Button,
  Empty,
  Form,
  Input,
  notification,
  Select,
  Space,
  Table,
  Typography,
  Switch,
  Radio,
  Checkbox
} from 'antd';
import {AlignRightOutlined, PlusOutlined} from '@ant-design/icons';
import EditFormField from '@/bpmn/panel/ElementForm/EditFormField/EditFormField';
import {
  checkIsCustomType,
  getFormFieldNameByType
} from '@/bpmn/panel/ElementForm/dataSelf';
import {useAppSelector} from '@/redux/hook/hooks';
import {getSchemaTpl} from 'amis-editor';
import {render as amisRender} from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import {
  filteredDatas,
  filterData
} from '@/bpmn/panel/ElementTask/ServiceTask/getSchemaChange';
import {service} from '@/utils/request';
import {getEnvVar} from '@/api/envVar';
import {
  getNoLoopRelation,
  getNoLoopRelations,
  groupByRelationKeyWithPK
} from '@/bpmn/panel/ElementTask/ServiceTask/config'
import {formGet} from '@/api/bpmn';
import {advancedFeature,baseURL,devApiUrl} from '@/utils/env'
interface IProps {
  businessObject: any;
}
const params = new URLSearchParams(window.location.search);
const appId = params.get('appid');
const env = params.get('env');
console.log(params, 'paramsparamsparamsparams');
console.log(appId, 'appIdappIdappIdappId');
console.log(env, 'envenvenvenv');
/**
 * 表单 组件
 *
 * @param props
 * @constructor
 */
export default function ElementForm(props: IProps) {
  console.log(props, '表单propspropspropspropspropsprops');
  let crudApi = baseURL + devApiUrl;
  // props
  const {businessObject} = props;
  // state
  const [formData, setFormData] = useState<any>();
  const [formFields, setFormFields] = useState<Array<any>>([]);
  const [businessKeyOptions, setBusinessKeyOptions] = useState<Array<any>>([]);
  const [formuVariables, setFormuVariables] = useState([]);
  const fxFormuVariables = useRef<any>([])
  const [showFunc, setShowFunc] = useState(true);
  // 实体数据
  const entityList = useAppSelector(state => state.bpmn.entityList);
  // ref
  const editFormFieldRef = useRef<any>();
  // form
  const [form] = Form.useForm<{
    formKey: string;
  }>();

  // 表单字段设置
  const mappingData = useRef({});
  // 表单字段设置编辑禁用隐藏数据存储
  const editValue = useRef([]);
  const disValue = useRef([]);
  const onlyValue = useRef([]);
  // redux
  const bpmnPrefix = useAppSelector(state => state.bpmn.prefix);

  // 节点表单数据配置
  const [localScopeValue, setLocalScopeValue] = useState(false);
  const [dataSource, setDataSource] = useState([
    // {
    //   key: '1',
    //   name: '全选'
    // }
  ]);
  // 选中表单公式fx上下文数据
  const fxFormData = useRef<any>([]);
  const dataSourceRef = useRef([])
  // 表格加载状态
  const [tableLoading, setTableLoading] = useState(false);

  // 记录表数据
  const formDataList = useRef();

  const [columns, setColumns] = useState([
    {
      title: '表单字段',
      dataIndex: 'name',
      visible: true,
      key: 'name',
      width: 100,
      render: (text, record, index) => (
        <>
          {record.label}
          {!record.isNullable && <span style={{color: 'red'}}>*</span>}
          {/* {record.required && <span style={{color:'red'}}>*</span>} */}
        </>
      )
    },
    {
      title: '可编辑',
      dataIndex: 'editableFields',
      key: 'editableFields',
      width: 100,
      visible: true,
      align: 'center',
      render: (text, record, index) => (
        <>
          {record.name == '全选' ? (
            <Radio
              checked={record.edit}
              onChange={e => editableFieldsChange(e, record, index, '1')}
            />
          ) : (
            <>
              <Radio
                checked={record.edit}
                onChange={e => editableFieldsChange(e, record, index, '1')}
              />
            </>
          )}
        </>
      )
    },
    {
      title: '禁用',
      dataIndex: 'hiddenFields',
      key: 'hiddenFields',
      width: 60,
      visible: true,
      align: 'center',
      render: (text, record, index) => (
        <>
          {record.name == '全选' ? (
            <Radio
              checked={record.dis}
              onChange={e => hiddenFieldsChange(e, record, index, '2')}
            />
          ) : (
            <>
              <Radio
                checked={record.dis}
                onChange={e => hiddenFieldsChange(e, record, index, '2')}
              />
            </>
          )}
        </>
      )
    },
    {
      title: '隐藏',
      dataIndex: 'disableFields',
      key: 'disableFields',
      width: 60,
      visible: true,
      align: 'center',
      render: (text, record, index) => (
        <>
          {record.name == '全选' ? (
            <Radio
              checked={record.onlyRead}
              onChange={e => disableFieldsChange(e, record, index, '3')}
            />
          ) : (
            <>
              <Radio
                checked={record.onlyRead}
                onChange={e => disableFieldsChange(e, record, index, '3')}
              />
            </>
          )}
        </>
      )
    },
    {
      title: '默认值',
      dataIndex: 'defaultValueFields',
      key: 'defaultValueFields',
      visible: true,
      render: (text, record, index) => (
        <>
          {showFunc && (
            <div>{forMuFunction(record, record.primaryKeyType?record.primaryKeyType:record.type, formuVariables)}</div>
          )}
        </>
      )
    }
  ]);
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
  const visibleColumns = columns.filter((col) => col.visible);
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
   * 初始化
   */
  useEffect(() => {
    if (businessObject) {
      initPageData();
      let arr = JSON.parse(sessionStorage.getItem('userList')); // 表单
      let userArr = JSON.parse(sessionStorage.getItem('getUserList')); // 操作人
      let queryArr = JSON.parse(sessionStorage.getItem('queryList')); // 查询
      let xinArr = JSON.parse(sessionStorage.getItem('getXinList')); // 新增服务
      let callArr = JSON.parse(sessionStorage.getItem('callList')); // 新增服务
      let startArr = JSON.parse(sessionStorage.getItem('startList')); // 流程参数
      let doubleList = JSON.parse(sessionStorage.getItem('doubleList')); // 开始节点的事件触发
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
                    value: items.id + '.' + item.name,
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
                        value: items.id + '.' + item.name + '.' + it.name,
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
                  };
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
      let setFormData: any = [
        ...arrss,
        ...arrs,
        // ...arrsa,
        ...arrsas,
        ...callArrs,
        ...startArrs,
        ...processorArrs
      ];
      console.log(setFormData, 'setFormData');
      console.log(arrsa, 'arrsa');
      if (arrs.length > 0) {
        setFormData = setFormData.map(res => {
          let resArr = {...res};
          arrsa.forEach(element => {
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
      getEnvVar().then(envItem => {
        console.log(envItem, 'envItemenvItemenvItemenvItem');
        let huanArr = {
          label: '环境变量',
          children: envItem?.data?.data ? envItem?.data?.data.map(itemItem => {
            return {
              label: itemItem.var,
              value: itemItem.var,
              tag: '文本'
            };
          }) : []
        };
        console.log(huanArr, 'arrarrarrarrarrarr开始');
        if(huanArr.children.length>0){
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
                          // allArr = [...allArr, ...item.form.relationFields];
                        }
                        console.log(allArr, 'allArr');
                        allArr = allArr.filter(owo=> {return !owo.isPrimaryKey && !owo.isTenantCode})
                        console.log(allArr, 'allArr');
                        let objectArr:any = [res.value,item.value]
                        let lastAllDatas = getNoLoopRelations(relationAllArr,item.form.originRelation,items.data.options,objectArr)
                        // let lastAllDatas = getNoLoopRelations(allArr,item.form.originRelation,items.data.data.options,objectArr)
                        // let lastAllDatas = getNoLoopRelation(ress.children,item.id)
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
                  fxFormuVariables.current = setFormData
                // })
            }
          })
          let haveModelEventTarget:any = []
          haveModelEventTarget = doubleList.filter(rswe=>{
            return rswe.modelEventTarget && rswe.type == 'bpmn:StartEvent'
          })
          if(haveModelEventTarget.length==0){
            setFormuVariables(setFormData);
            fxFormuVariables.current = setFormData
          }
        }else{
          setFormuVariables(setFormData);
          fxFormuVariables.current = setFormData
        }
        // setFormuVariables(setFormData);
        // fxFormuVariables.current = setFormData
        if(businessObject.userTaskType && businessObject.userTaskType=='2'){
          setColumns(columns.map((col) =>
            col.key === 'defaultValueFields' ? { ...col, visible: false } : col
          ));
        }else{
          setColumns(columns.map((col) =>
            col.key === 'defaultValueFields' ? { ...col, visible: true } : col
          ));
        }
      });
    }
  }, [businessObject?.id]);
  // 对象数组去重
  function uniqueFunc(arr, uniId) {
    const res = new Map();
    return arr.filter(item => !res.has(item[uniId]) && res.set(item[uniId], 1));
  }
  /**
   * 初始化页面数据
   */
  function initPageData() {
    console.log(props, 'businessObjectbusinessObject');
    let businessObject: any =
      window.bpmnInstance?.element?.businessObject || props.businessObject;
    console.log(businessObject, 'businessObjectbusinessObject');
    // 获取FormData
    console.log(bpmnPrefix, 'bpmnPrefixbpmnPrefixbpmnPrefix');
    editValue.current = [];
    onlyValue.current = [];
    disValue.current = [];
    if (
      props.businessObject.editableFields &&
      props.businessObject.editableFields != ''
    ) {
      editValue.current = props.businessObject.editableFields.split(',');
    }
    if (
      props.businessObject.hiddenFields &&
      props.businessObject.hiddenFields != ''
    ) {
      onlyValue.current = props.businessObject.hiddenFields.split(',');
    }
    if (
      props.businessObject.disableFields &&
      props.businessObject.disableFields != ''
    ) {
      disValue.current = props.businessObject.disableFields.split(',');
    }
    // 获取表单标识和业务标识
    form.setFieldsValue({
      formKey: ''
    });
    if (businessObject.formKey && businessObject.formKey != '') {
      setLocalScopeValue(true);
    } else {
      setLocalScopeValue(false);
    }
    setTableLoading(true);
    formGet()
      .then(res => {
        console.log(res, '获取列表');
        console.log(res.data.data, 'res.data.data');
        createBusinessKeySelectOptions(res.data.data);
        if (res.data.data.length > 0) {
          if (props.businessObject.formKey) {
            let haveData = false
            res.data.data.forEach(itemss => {
              if ('key_' + itemss.queryKey == props.businessObject.formKey) {
                haveData = true
                formDataList.current = [];
                    entityList.data.options.forEach(ress => {
                      ress.children.forEach(item => {
                        if (item.value == itemss.modelEventTarget) {
                          let allArr: any = [];
                          let relationAllArr: any = [];
                          if (item.form.fields != null) {
                            let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                            allArr = item.form.fields.filter(fie => {
                              return fie.type != 'relation' && !fie.isTenantCode;
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
                            // allArr = [...allArr, ...item.form.relationFields];
                          }
                          let newKeyOption: any = [];
                          let objectArr:any = [ress.value,item.value]
                          let lastAllDatas = getNoLoopRelations(relationAllArr,item.form.originRelation,entityList.data.options,objectArr)
                          console.log(allArr,'allArr')
                          console.log(lastAllDatas,'lastAllDatas')
                          allArr = [...allArr,...lastAllDatas]
                          fxFormData.current = [...allArr,...lastAllDatas]
                          console.log(allArr, 'allArr');
                          if(businessObject.userTaskType && businessObject.userTaskType==2){
                            setColumns(columns.map((col) =>
                              col.key === 'defaultValueFields' ? { ...col, visible: false } : col
                            ));
                            allArr.forEach(skjwd => {
                              if (
                                !skjwd.isPrimaryKey &&
                                skjwd.yuanType != 'formula' &&
                                !skjwd.isUpdateDate &&
                                !skjwd.isCreateDate &&
                                !skjwd.isUpdateUser &&
                                !skjwd.isCreateUser &&
                                !skjwd.isTenantCode
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
                          }else{
                            setColumns(columns.map((col) =>
                              col.key === 'defaultValueFields' ? { ...col, visible: true } : col
                            ));
                            allArr.forEach(skjwd => {
                              if (
                                // !skjwd.isForeignKey &&
                                !skjwd.isPrimaryKey &&
                                skjwd.yuanType != 'formula' &&
                                !skjwd.isUpdateDate &&
                                !skjwd.isCreateDate &&
                                !skjwd.isUpdateUser &&
                                !skjwd.isCreateUser &&
                                !skjwd.isTenantCode
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
                          }
                          console.log(newKeyOption, 'newKeyOption');
                          formDataList.current.push(newKeyOption);
                          let aaa = newKeyOption.map(sws => {
                            let bbb = {...sws};
                            editValue.current.forEach(swd => {
                              if (swd == sws.key) {
                                bbb.edit = true;
                              }
                            });
                            onlyValue.current.forEach(swd => {
                              if (swd == sws.key) {
                                bbb.onlyRead = true;
                              }
                            });
                            disValue.current.forEach(swd => {
                              if (swd == sws.key) {
                                bbb.dis = true;
                              }
                            });
                            return bbb;
                          });
                          console.log(aaa, 'aaaaaaaaaaaaaaaaaaaaa');
                          // setTableLoading(true);
                          setShowFunc(false);
                          if (props.businessObject.processFormFieldMapping) {
                            let mappdingObject = JSON.parse(
                              props.businessObject.processFormFieldMapping
                            );
                            console.log(mappdingObject, 'mappdingObject');
                            console.log(
                              JSON.stringify(mappdingObject),
                              'mappdingObject'
                            );
                            if (JSON.stringify(mappdingObject) == '{}') {
                              console.log(businessObject,'asdsadsadasdsadsa')
                              dataSourceRef.current = aaa
                              setDataSource(aaa);
                              mappingData.current = {};
                              aaa.forEach(newK => {
                                mappingData.current[newK.key] =
                                  'formula' in newK ? newK.formula : null;
                              });
                              window.bpmnInstance.modeling.updateProperties(
                                window.bpmnInstance.element,
                                {
                                  processFormFieldMapping: JSON.stringify(
                                    mappingData.current
                                  ),
                                  // localScope: businessObject.$type == 'bpmn:UserTask' ? true :undefined
                                }
                              );
                              setShowFunc(true);
                            } else {
                              let bbb = aaa.map(item => {
                                let itemObj = {...item};
                                mappingData.current[item.key] =
                                  'formula' in item ? item.formula : null;
                                for (let key in mappdingObject) {
                                  if (item.key == key) {
                                    itemObj.formula = mappdingObject[key];
                                    mappingData.current[itemObj.key] =
                                      mappdingObject[key];
                                  }
                                }
                                return itemObj;
                              });
                              console.log('asdsadsadasdsadsa')
                              dataSourceRef.current = bbb
                              setDataSource(bbb);
                              setShowFunc(true);
                            }
                          } else {
                            console.log('asdsadsadasdsadsa')
                            dataSourceRef.current = aaa
                            setDataSource(aaa);
                            mappingData.current = {};
                            aaa.forEach(newK => {
                              mappingData.current[newK.key] =
                                'formula' in newK ? newK.formula : null;
                            });
                            console.log(businessObject,'asdsadsadasdsadsa')
                            window.bpmnInstance.modeling.updateProperties(
                              window.bpmnInstance.element,
                              {
                                processFormFieldMapping: JSON.stringify(
                                  mappingData.current
                                ),
                                localScope: businessObject.$type == 'bpmn:UserTask' ? true :undefined
                              }
                            );
                            setShowFunc(true);
                          }
                        }
                      });
                    });
                    document.getElementsByClassName('ant-col')[2].scrollTop = 0;
                    setTableLoading(false);
              }
            });
            if(!haveData){
              setTableLoading(false);
            }
          } else {
            setTableLoading(false);
          }
        } else {
          setTableLoading(false);
        }
      })
      .catch(e => {
        setTableLoading(false);
      });
  }

  /**
   * 更新表单标识
   *
   * @param value
   */
    // function updateFormKey(value: any) {
    //   window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
    //     formKey: value,
    //   });
    // }
    // 根据类型使用不同公式
  const forMuFunction = (node, nodes, data) => {
      console.log(node, '原数据');
      console.log(nodes, '原数据1');
      console.log(data, '原数据2');
      // console.log(columnInfo, 'fieldData');
      let a = filteredDatas(nodes, [...fxFormuVariables.current, ...filterData],node);
      // let a = filteredDatas(nodes, [...data, ...filterData]);
      console.log(a, 'aaaaaaaaaaaa');
      a = {
        ...a,
        formulaEchoVal: false,
        value: 'formula' in node ? node.formula : null,
        onChange: function (e) {
          console.log(e, '3');
          console.log(e == '', '4');
          console.log(node, '5');
          console.log(mappingData.current, 'mappingData.current');
          console.log(dataSource, 'dataSource');
          // let arrs = dataSource.map(skjw => {
          let arrs:any = dataSourceRef.current.map(skjw => {
            if (skjw.key == node.key) {
              if (node.type == 'boolean' || node.type == 'enum') {
                return {
                  ...skjw,
                  formula: JSON.stringify(e) == '""' ? null : e
                };
              } else {
                return {
                  ...skjw,
                  formula: e
                    ? e.filename
                      ? {...e, name: e.filename, state: 'uploaded'}
                      : e == ''
                        ? null
                        : e
                    : e == ''
                      ? null
                      : e
                };
              }
            } else {
              return skjw;
            }
          });
          setDataSource(arrs);
          dataSourceRef.current = arrs
          for (var mapKey in mappingData.current) {
            if (mapKey == node.key) {
              if (node.type == 'boolean' || node.type == 'enum') {
                mappingData.current[mapKey] =
                  JSON.stringify(e) == '""' ? null : e;
              } else {
                mappingData.current[mapKey] = e
                  ? e.filename
                    ? {...e, name: e.filename, state: 'uploaded'}
                    : e == ''
                      ? null
                      : e
                  : e == ''
                    ? null
                    : e;
              }
            }
          }
          window.bpmnInstance.modeling.updateProperties(
            window.bpmnInstance.element,
            {
              processFormFieldMapping: JSON.stringify(mappingData.current),
              localScope: businessObject.$type == 'bpmn:UserTask' ? true :undefined
            }
          );
        }
      };
      if (node.type == 'boolean' || node.type == 'enum') {
        a.value = node.formula;
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
          if (node.options) {
            a.rendererSchema.options = node.options;
          }
          if (node.source) {
            a.rendererSchema.source = node.source;
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
        } else if (node.type == 'date-range' && node.dbType.toUpperCase() == 'DATETIME') {
          a.rendererSchema.type = 'input-datetime-range';
          a.rendererSchema.displayFormat = 'YYYY-MM-DD HH:mm:ss';
          a.rendererSchema.valueFormat = 'YYYY-MM-DD HH:mm:ss';
        } else if (node.type == 'date-range' && node.dbType.toUpperCase() == 'DATE') {
          a.rendererSchema.type = 'input-date-range';
          a.rendererSchema.displayFormat = 'YYYY-MM-DD';
          a.rendererSchema.valueFormat = 'YYYY-MM-DD';
        } else if (node.type == 'date-range' && node.dbType.toUpperCase() == 'TIME') {
          a.rendererSchema.type = 'input-time-range';
          a.rendererSchema.displayFormat = 'HH:mm:ss';
          a.rendererSchema.valueFormat = 'HH:mm:ss';
        }
        a.variables = a.rendererSchema.variables ? a.rendererSchema.variables : a.variables;
        console.log(a, '时间');
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
          return amisRender(
            getSchemaTpl('tplFormulaControl', a),
            {advancedFeature: advancedFeature},
            {
              fetcher: service,
              theme: amisEnv.theme
            }
          );
        } else if (nodes == 'serial-number') {
          return amisRender(
              getSchemaTpl('formulaControl-hour', a),
              {advancedFeature: advancedFeature, onDisabled: true},
              {
                fetcher: service,
                theme: amisEnv.theme
              }
            );
        } else {
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

  /**
   * 更新业务标识
   *
   * @param option [key, value, children]
   */
  function updateBusinessKey(option: any) {
    console.log(option, 'ssssssssssssssss');
    console.log(businessObject,'sakljdbgasiudgiukasdsgaiu')
    if(businessObject.$type == 'bpmn:UserTask' && !('processOperationSettings' in businessObject)){
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          processOperationSettings: businessObject.$type == 'bpmn:UserTask' ? JSON.stringify(['submit', 'save']) : undefined,
          localScope: businessObject.$type == 'bpmn:UserTask' ? true :undefined
        }
      );
    }
    if (!option) {
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          formKey: undefined,
          localScope: businessObject.$type == 'bpmn:UserTask' ? true :undefined
        }
      );
      setLocalScopeValue(false);
    } else {
      setLocalScopeValue(true);
      setDataSource([]);
      dataSourceRef.current = []
      let {key, value} = option;
      if (key === 'no') {
        // 如果选择无，则默认没有业务标识
        value = '';
      }
      // window.bpmnInstance.modeling.updateModdleProperties(
      //   window.bpmnInstance.element,
      //   formData,
      //   {
      //     businessKey: value,
      //   },
      // );
      editValue.current = [];
      disValue.current = [];
      onlyValue.current = [];
      console.log(window.bpmnInstance.element, 'window.bpmnInstance.element');
      console.log(businessKeyOptions, 'businessKeyOptions');
      let selectData = businessKeyOptions.filter(res => {
        return 'key_' + res.value == option.value;
      });
      console.log(selectData, 'selectDataselectDataselectData');
      formDataList.current = [];
      setTableLoading(true);
          entityList.data.options.forEach(res => {
            res.children.forEach(item => {
              if (item.value == selectData[0].modelEventTarget) {
                console.log(item, 'itemitemitemitemitemitemitem');
                let allArr: any = [];
                let relationAllArr: any = [];
                if (item.form.fields != null) {
                  let primaryKeyData = item.form.fields.filter(sso=> sso.isPrimaryKey)
                  allArr = item.form.fields.filter(fie => {
                    return fie.type != 'relation' && !fie.isTenantCode;
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
                  // allArr = [...allArr, ...item.form.relationFields];
                }
                let newKeyOption: any = [];
                console.log(allArr, 'allArr');
                let objectArr:any = [res.value,item.value]
                let lastAllDatas = getNoLoopRelations(relationAllArr,item.form.originRelation,entityList.data.options,objectArr)
                // let lastAllDatas = getNoLoopRelations(allArr,item.form.originRelation,items.data.data.options,objectArr)
                // let lastAllDatas = getNoLoopRelation(res.children,item.id)
                console.log(lastAllDatas,'lastAllDatas')
                allArr = [...allArr,...lastAllDatas]
                fxFormData.current = [...allArr,...lastAllDatas].map(res=>{
                  let returnData = {...res};
                  if (returnData.relationKey) {
                    returnData.key =
                      returnData.relationKey + '.' + returnData.key;
                  }
                  return returnData
                })
                if(businessObject.userTaskType && businessObject.userTaskType==2) {
                  allArr.forEach(skjwd => {
                    if (
                      !skjwd.isPrimaryKey &&
                      skjwd.yuanType != 'formula' &&
                      !skjwd.isUpdateDate &&
                      !skjwd.isCreateDate &&
                      !skjwd.isUpdateUser &&
                      !skjwd.isCreateUser &&
                      !skjwd.isTenantCode
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
                }else{
                  allArr.forEach(skjwd => {
                    if (
                      // !skjwd.isForeignKey &&
                      !skjwd.isPrimaryKey &&
                      skjwd.yuanType != 'formula' &&
                      !skjwd.isUpdateDate &&
                      !skjwd.isCreateDate &&
                      !skjwd.isUpdateUser &&
                      !skjwd.isCreateUser &&
                      !skjwd.isTenantCode
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
                }
                console.log(newKeyOption, 'newKeyOption');
                mappingData.current = {};
                newKeyOption = newKeyOption.map(newK => {
                  editValue.current.push(newK.key);
                  mappingData.current[newK.key] =
                    'formula' in newK ? newK.formula : null;
                  return {
                    ...newK,
                    edit: true,
                    formula: 'formula' in newK ? newK.formula : null
                  };
                });
                formDataList.current.push(newKeyOption);
                console.log('asdsadsadasdsadsa')
                dataSourceRef.current = newKeyOption
                setDataSource(newKeyOption);
                setShowFunc(false);
                setTimeout(() => {
                  setShowFunc(true);
                  setTimeout(() => {
                    document.getElementsByClassName(
                      //   'ant-table-body'
                      'ant-col'
                    )[2].scrollTop = 0;
                    setTableLoading(false);
                  }, 2000);
                }, 1000);
                console.log(mappingData.current, 'mappingData.current');
                console.log(businessObject,'asdsadsadasdsadsa')
                window.bpmnInstance.modeling.updateProperties(
                  window.bpmnInstance.element,
                  {
                    localScope: businessObject.$type == 'bpmn:UserTask' ? true :undefined,
                    formKey: value,
                    data: JSON.stringify(fxFormData.current),
                    // data: JSON.stringify(selectData[0].data),
                    editableFields: editValue.current.join(','),
                    hiddenFields: '',
                    disableFields: '',
                    processFormFieldMapping: JSON.stringify(mappingData.current)
                  }
                );
              }else{
                setTableLoading(false);
              }
            });
          });
    }
  }

  /**
   * 构造业务标识下拉项
   *
   * @param fields
   */
  function createBusinessKeySelectOptions(e: Array<any>) {
    console.log(e, 'fieldsfieldsfieldsfields');
    let haveForm = false;
    let businessKeyOptions: Array<any> =
      e.map(e => {
        if ('key_' + e.queryKey == businessObject?.formKey) {
          haveForm = true;
        }
        return {
          name: e.formName,
          value: e.queryKey,
          modelEventTarget: e.modelEventTarget,
          // tableKey: e.tableKey,
          data: e.schema ? e.schema.fields : []
        };
      }) || [];
    if (haveForm) {
      form.setFieldsValue({
        formKey: businessObject?.formKey
      });
    } else {
      updateBusinessKey(undefined);
    }
    setBusinessKeyOptions(businessKeyOptions);
  }
  // 切换节点表单
  // function updateElementFormScope(e) {
  //   console.log(e, 'eeeeeeeeeeeeee');
  //   window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
  //     localScope: e
  //   });
  // }
  function editableFieldsChange(e, data, index, text) {
    console.log(e, 'editableFieldsChangeeeeeeeeeeeeeee');
    console.log(data, 'editableFieldsChangedatadatadatadata');
    console.log(index, 'indexindexindex');
    console.log(text, 'texttext');
    console.log(editValue.current, '11111111111111111111');
    let dis = disValue.current.filter(sw => {
      return sw != data.key;
    });
    console.log(dis, 'dis');
    disValue.current = dis;
    let only = onlyValue.current.filter(sw => {
      return sw != data.key;
    });
    console.log(only, 'onlyonly');
    onlyValue.current = only;

    editValue.current.push(data.key);
    console.log(editValue.current, 'editValue.current');
    // let aaa = dataSource.map(sws => {
    let aaa = dataSourceRef.current.map(sws => {
      let bbb = {...sws};
      if (editValue.current.length == 0) {
        bbb.edit = false;
        bbb.dis = false;
        bbb.onlyRead = false;
      } else {
        editValue.current.forEach(swd => {
          if (swd == sws.key) {
            bbb.edit = true;
            bbb.dis = false;
            bbb.onlyRead = false;
          }
        });
      }
      return bbb;
    });
    console.log(aaa, 'aaa');
    console.log('asdsadsadasdsadsa')
    dataSourceRef.current = aaa
    setDataSource(aaa);
    console.log(businessObject,'asdsadsadasdsadsa')
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      editableFields: editValue.current.join(','),
      disableFields: disValue.current.join(','),
      hiddenFields: onlyValue.current.join(','),
      localScope: businessObject.$type == 'bpmn:UserTask' ? true :undefined
    });
  }
  function hiddenFieldsChange(e, data, index, text) {
    console.log(e, 'hiddenFieldsChangeeeeeeeeeeeeeee');
    console.log(data, 'hiddenFieldsChangedatadatadatadata');
    console.log(index, 'indexindexindex');
    console.log(text, 'texttext');
    console.log(disValue.current, '222222');
    // let a = disValue.current.filter(sw => {
    //   return sw != data.key;
    // });
    // console.log(a, 'a2a2a2');
    // disValue.current = a;
    let edit = editValue.current.filter(sw => {
      return sw != data.key;
    });
    console.log(edit, 'edit');
    editValue.current = edit;
    let only = onlyValue.current.filter(sw => {
      return sw != data.key;
    });
    console.log(only, 'onlyonly');
    onlyValue.current = only;
    disValue.current.push(data.key);
    console.log(disValue.current, 'disValue.current');
    // let aaa = dataSource.map(sws => {
    let aaa = dataSourceRef.current.map(sws => {
      let bbb = {...sws};
      if (disValue.current.length == 0) {
        bbb.dis = false;
        bbb.edit = false;
        bbb.onlyRead = false;
      } else {
        disValue.current.forEach(swd => {
          if (swd == sws.key) {
            bbb.dis = true;
            bbb.edit = false;
            bbb.onlyRead = false;
          }
        });
      }
      return bbb;
    });
    console.log('asdsadsadasdsadsa')
    dataSourceRef.current = aaa
    setDataSource(aaa);
    console.log(businessObject,'asdsadsadasdsadsa')
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      editableFields: editValue.current.join(','),
      disableFields: disValue.current.join(','),
      hiddenFields: onlyValue.current.join(','),
      localScope: businessObject.$type == 'bpmn:UserTask' ? true :undefined
    });
  }
  function disableFieldsChange(e, data, index, text) {
    console.log(e, 'disableFieldsChangeeeeeeeeeeeeeee');
    console.log(data, 'disableFieldsChangedatadatadatadata');
    console.log(index, 'indexindexindex');
    console.log(text, 'texttext');
    console.log(onlyValue.current, '33333');
    // let a = onlyValue.current.filter(sw => {
    //   return sw != data.key;
    // });
    // console.log(a, 'a3a3a3a3');
    // onlyValue.current = a;
    let edit = editValue.current.filter(sw => {
      return sw != data.key;
    });
    console.log(edit, 'edit');
    editValue.current = edit;
    let dis = disValue.current.filter(sw => {
      return sw != data.key;
    });
    console.log(dis, 'dis');
    disValue.current = dis;
    onlyValue.current.push(data.key);

    console.log(onlyValue.current, 'onlyValue.current');
    // let aaa = dataSource.map(sws => {
    let aaa = dataSourceRef.current.map(sws => {
      let bbb = {...sws};
      if (onlyValue.current.length == 0) {
        bbb.onlyRead = false;
      } else {
        onlyValue.current.forEach(swd => {
          if (swd == sws.key) {
            bbb.onlyRead = true;
            bbb.dis = false;
            bbb.edit = false;
          }
        });
      }
      return bbb;
    });
    console.log(aaa, 'aaa');
    setDataSource(aaa);
    dataSourceRef.current = aaa
    console.log(businessObject,'asdsadsadasdsadsa')
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      editableFields: editValue.current.join(','),
      disableFields: disValue.current.join(','),
      hiddenFields: onlyValue.current.join(','),
      localScope: businessObject.$type == 'bpmn:UserTask' ? true :undefined
    });
  }
  return (
    <>
      <Form form={form} labelCol={{span: 4}} wrapperCol={{span: 18}}>
        <Form.Item
          name="formKey"
          label={
            <>
              <span style={{color: 'red'}}>*</span>表单
            </>
          }
        >
          <Select
            placeholder={'请选择'}
            disabled={tableLoading}
            onChange={(value, option) => updateBusinessKey(option)}
            allowClear
          >
            {businessKeyOptions?.map(e => {
              return (
                <Select.Option key={'key_' + e.value} value={'key_' + e.value}>
                  {e.name}
                </Select.Option>
              );
            })}
            {/* <Select.Option key={'no'} value={'no'}>
              {'无'}
            </Select.Option> */}
          </Select>
        </Form.Item>
        {/*<Form.Item*/}
        {/*  name="localScope"*/}
        {/*  label="节点表单"*/}
        {/*  valuePropName="checked"*/}
        {/*  tooltip="若为节点表单，则表单信息仅在此节点可用，默认为全局表单，表单信息在整个流程实例中可用"*/}
        {/*>*/}
        {/*  <Switch*/}
        {/*    disabled={businessObject?.$type === 'bpmn:StartEvent'}*/}
        {/*    onChange={updateElementFormScope}*/}
        {/*  ></Switch>*/}
        {/*</Form.Item>*/}
        {localScopeValue && (
          <>
            <div>表单字段设置：</div>
            {/* style={{overflow: 'auto', maxHeight: '500px',Height:'500px'}} */}
            <Table
              loading={tableLoading}
              // scroll={{y: 500}}
              dataSource={dataSource}
              columns={visibleColumns}
              pagination={false}
            />
          </>
        )}
      </Form>
    </>
  );
}
