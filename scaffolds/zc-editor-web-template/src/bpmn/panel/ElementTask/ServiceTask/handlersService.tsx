import React, {
  useEffect,
  useRef,
  useState,
  forwardRef
} from 'react';
import {
  Row,
  Col,
  Input,
  Button,
  Form,
  Switch,
  Radio, Tooltip
} from 'antd';
import {useAppDispatch, useAppSelector} from '@/redux/hook/hooks';
import {handleServiceRaskList} from '@/redux/slice/bpmnSlice';
import {render as amisRender} from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import * as uuid from 'uuid';
import {service} from '@/utils/request';
import {filteredData, getOptionAll} from './conditionBuilder';
import {filteredDatas, filterData} from './getSchemaChange';
import {getOptionsAll} from '@/api/bpmn';
import {getSchemaTpl} from 'amis-editor';
import {DeleteOutlined, InfoCircleOutlined} from '@ant-design/icons';
import {baseURL, devApiUrl, advancedFeature} from '@/utils/env'

let crudApi = baseURL + devApiUrl;
// 删除记录组件
const UpdateRecrd = forwardRef(function UpdateRecrd(props: any, ref) {
  console.log(props, '传的参数');
  const {businessObject, cascaderValue} = props;
  const serviceList = useAppSelector(state => state.bpmn.serviceRaskList);
  const dispatch = useAppDispatch();
  const [form] = Form.useForm<{}>();
  // 删除记录
  const [nodeValue, setNodeValue] = useState([]);
  // 更新字段列表
  const [fieldData, setFieldData] = useState([]);
  // 上下问数据
  const [formuVariables, setFormuVariables] = useState([]);
  // 记录添加按钮数据
  const [createCheck, setCreateCheck] = useState(false);
  // 类型选择默认值
  const [radioValue, setRadioValue] = useState('bean');

  useEffect(() => {
    getOptionAll();
    console.log(props, '传的参数');
    console.log(props.businessObject, 'props.businessObject');
    console.log(serviceList, 'serviceListserviceListserviceListserviceList');
    console.log(cascaderValue, 'cascaderValuecascaderValuecascaderValue');
    let haveSamaData = false;
    setFormuVariables(props.formuVariables);
    if (serviceList) {
      setNodeValue({
        taskType: 6
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
          if (element.params) {
            setFieldData(element.params);
          } else {
            setFieldData([]);
          }
          setRadioValue('mode' in element ? element.mode : 'bean');
          form.setFieldsValue({
            mode: 'mode' in element ? element.mode : 'bean',
            beanName: element.beanName,
            className: element.className,
            outputVarName: element.outputVarName,
            outputEnabled: element.outputEnabled
          });
          setCreateCheck(
            element.outputEnabled == null
              ? false
              : element.outputEnabled
          );
          if (element.params) {
            let paramsArr = [];
            for (const paramsArrKey in element.params) {
              console.log(element.params[paramsArrKey], 'element.params[paramsArrKey]');
              paramsArr.push({
                id: uuid.v4(),
                type: paramsArrKey,
                formula: element.params[paramsArrKey]
              });
            }
            setFieldData(paramsArr);
          }
          if (!('mode' in element)) {
            let arr = serviceList.map(element => {
              if (element.serviceTaskId == businessObject.id) {
                return {
                  ...element,
                  mode: 'bean'
                };
              } else {
                return element;
              }
            });
            dispatch(handleServiceRaskList(arr));
          }
        }
      });
      if (!haveSamaData) {
        let a = [...serviceList, {...businessObject, mode: 'bean'}];
        console.log(a, 'aaaaaaaaaaa');
        dispatch(handleServiceRaskList(a));
      }
    } else {
      console.log('进入2');
      // setRadioValue('bean');
      // setNodeValue({
      //   taskType: 6
      // });
      // dispatch(
      //   handleServiceRaskList([
      //     {...businessObject, serviceTaskId: businessObject.id, taskType: 6}
      //   ])
      // );
    }
  }, [businessObject.id]);
  // 类型选择切换
  const radioChange = e => {
    console.log(e, '新增列表切换');
    setRadioValue(e.target.value);
    form.setFieldValue('filterCondition', []);
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        form.setFieldsValue({
          mode: e.target.value,
          beanName: null,
          className: null,
          outputVarName: null,
          outputEnabled: false
        });
        setCreateCheck(false);
        setFieldData([]);
        return {
          ...element,
          mode: e.target.value,
          params: {},
          beanName: null,
          className: null,
          outputVarName: null,
          outputEnabled: false
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };

  // params入参数据变化渲染
  const paramsInputChange = (e, data) => {
    console.log(fieldData, 'fieldData');
    let oldArr = [...fieldData];
    oldArr = oldArr.map(res => {
      if (res.id == data.id) {
        return {...res, type: e.target.value};
      } else {
        return res;
      }
    });
    setFieldData(oldArr);
    console.log(oldArr, 'oldArr');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          params: oldArr.reduce((acc, item) => {
            acc[item.type] = item.formula ? item.formula : '';
            return acc;
          }, {})
        };
      } else {
        return element;
      }
    });
    console.log(arr, 'arrrrrrrrrrrr');
    dispatch(handleServiceRaskList(arr));
  };

  // params入参数据删除
  const deleteClick = (data) => {
    console.log(fieldData, 'fieldDatafieldData');
    console.log(data, 'datadatadata');
    let oldArr = [...fieldData];
    oldArr = oldArr.filter(res => res.id != data.id);
    setFieldData(oldArr);
    form.setFieldsValue({
      params: oldArr
    });
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          params: oldArr
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };

  const forMuFunction = (node, e, data) => {
    console.log(node, '原数据');
    console.log(fieldData, 'fieldData');
    let a = {
      formulaEchoVal: false,
      variables: [...data, ...filterData],
      value: node?.formula,
      placeholder: '请填写内容',
      onChange: function(e) {
        console.log(e, 'e');
        console.log(node, 'node');
        console.log(fieldData, 'fieldData');
        let arrs = fieldData.map(skjw => {
          if (skjw.id == node.id) {
            return {
              ...skjw,
              formula: e
            };
          } else {
            return skjw;
          }
        });
        console.log(arrs, 'arrs');
        setFieldData(arrs);
        let data = serviceList.map(element => {
          if (element.serviceTaskId == businessObject.id) {
            return {
              ...element,
              params: arrs.reduce((acc, item) => {
                acc[item.type] = item.formula;
                return acc;
              }, {})
            };
          } else {
            return element;
          }
        });
        dispatch(handleServiceRaskList(data));
      }
    };
    console.log(a, '显示数据');
    return amisRender(
      getSchemaTpl('formulaControl-hour', a),
      {advancedFeature: advancedFeature},
      {
        fetcher: service,
        theme: amisEnv.theme
      }
    );
  };

  // 新增类列表数据
  const created = () => {
    let oldArr = [...fieldData];
    oldArr.push({id: uuid.v4()});
    setFieldData(oldArr);
    form.setFieldsValue({
      params: oldArr
    });
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          params: oldArr
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };

  // 出参数据变化
  const outputEnabledOnChange = (e) => {
    console.log(e, '出参数据变化');
    setCreateCheck(e);
    form.setFieldsValue({
      outputVarName: null,
    });
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          outputEnabled: e,
          outputVarName:null
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };

  // 出参输入框变化
  const eventoutputVarNameChange = (e) => {
    console.log(e, 'eventoutputVarName');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        return {
          ...element,
          outputVarName: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };

  // 类名数据变化
  const nameChange = (e, type) => {
    console.log(e, 'eventoutputVarName');
    let arr = serviceList.map(element => {
      if (element.serviceTaskId == businessObject.id) {
        if (type == 'bean') {
          return {
            ...element,
            beanName: e.target.value
          };
        } else {
          return {
            ...element,
            className: e.target.value
          };
        }
      } else {
        return element;
      }
    });
    dispatch(handleServiceRaskList(arr));
  };
  return (
    <>
      <Form
        name="basic"
        labelCol={{span: 5}}
        wrapperCol={{span: 18}}
        style={{maxWidth: 600}}
        labelWrap
        initialValues={{remember: true}}
        form={form}
        autoComplete="off"
      >
        {nodeValue.taskType == 6 && (
          <>
            <Form.Item<FieldType> label="类型mode" name="mode">
              <Radio.Group onChange={radioChange} value={radioValue}>
                <Radio value={'bean'}>调用java bean</Radio>
                <Radio value={'class'}>调用class类</Radio>
              </Radio.Group>
            </Form.Item>
            {radioValue == 'bean' &&
              <Form.Item<FieldType>
                label={
                  <>
                    bean名
                    <Tooltip title="小写类名,eg:invokeJavaServiceHandlerTest">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </>
                }
                name="beanName">
                <Input
                  placeholder={'请输入bean名'}
                  onInput={(e) => nameChange(e, 'bean')}
                />
              </Form.Item>}
            {radioValue == 'class' &&
              <Form.Item
                label={
                  <>
                    class名
                    <Tooltip
                      title="全限定类名,eg:cn.iocoder.yudao.module.processManage.handler.demo.InvokeJavaServiceHandlerTest">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </>
                }
                name="className"
              >
                <Input
                  placeholder={'请输入class名'}
                  onInput={(e) => nameChange(e, 'class')}
                />
              </Form.Item>}
            <Form.Item<FieldType>
              label={
                <>
                  params入参
                  <Tooltip title="Key需小写字母开头，允许字母、数字、下划线">
                    <InfoCircleOutlined />
                  </Tooltip>
                </>
              }
              name="params">
              {fieldData && (
                <>
                  {fieldData.length == 0 && (
                    <div style={{margin: '20px'}}>{'<空>'}</div>
                  )}
                  {fieldData.length > 0 &&
                    fieldData.map(res => {
                      return (
                        <Row gutter="20" style={{marginBottom: '10px'}}>
                          <Col span={10}>
                            <Input
                              placeholder={'请输入'}
                              value={res.type}
                              onInput={(e) => paramsInputChange(e, res)}
                            />
                          </Col>
                          <Col span={10}>
                            {forMuFunction(res, 'text', formuVariables)}
                          </Col>
                          <Col span={4}>
                            <Button
                              icon={<DeleteOutlined />}
                              onClick={() => deleteClick(res)}
                            />
                          </Col>
                        </Row>
                      );
                    })
                  }
                  <Button type="primary" onClick={created}>添加</Button>
                </>
              )}
            </Form.Item>
            <Form.Item<FieldType> label="是否保留出参" name="outputEnabled">
              <Switch defaultChecked onChange={outputEnabledOnChange} checked={createCheck} />
            </Form.Item>
            {createCheck && <Form.Item<FieldType> label="出参名" name="outputVarName">
              <Input
                placeholder={'请输入出参名'}
                onInput={eventoutputVarNameChange}
              />
            </Form.Item>}
          </>
        )}
      </Form>
    </>
  );
});
export default UpdateRecrd;
