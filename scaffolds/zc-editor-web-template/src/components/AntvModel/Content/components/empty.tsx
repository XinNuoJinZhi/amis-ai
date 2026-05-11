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
  Modal
} from 'antd';
import {
  VariableList
} from 'amis-ui';
import {handleNode} from '@/redux/slice/antvSlice';
import {useAppDispatch, useAppSelector} from '@/redux/hook/hooks';
import {filteredDatas} from './getSchemaChange';
import {render as amisRender} from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import {getSchemaTpl} from 'amis-editor';
import {service} from '@/utils/request';
import {advancedFeature} from '@/utils/env'

// 占位操作组件
const EmptyModule = forwardRef(function EmptyModule(props, ref) {
  const needNode = useAppSelector(state => state.antvModule.node);
  const needValue = useAppSelector(state => state.antvModule.rightNodeData);
  // 公式数据
  const formuVariables = useAppSelector(
    state => state.antvModule.formuVariables
  );
  const dispatch = useAppDispatch();
  const [form] = Form.useForm<{}>();
  const needValueData = useRef({});
  const needNodeValue = useRef([]);
  // 节点出参
  const [targetNameValue, setTargetNameValue] = useState('');
  // 节点出参弹出框显示隐藏
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 节点出参 弹窗 树数据
  const [treeData, setTreeData] = useState([]);
  // 是否忽略租户开关
  const [tenantFlagRecord, setTenantFlagRecord] = useState<any>(false);
  // 是否忽略租户输入框
  const [appTenantCodeValue, setAppTenantCodeValue] = useState<any>('');
  useEffect(() => {
    form.setFieldValue('title', needValue.title);
    form.setFieldValue('code', needValue.code);
    form.setFieldValue('targetName', needValue.targetName);
    setTargetNameValue(needValue.targetName)
    needValueData.current = needValue;
    let arr: any = [];
    console.log(formuVariables, 'formuVariablesformuVariablesformuVariables');
    formuVariables.forEach(res => {
      if (res.label == '循环上下文') {
        arr.push(res);
      }
      if (
        res.label == '服务入参' ||
        res.label == '服务变量' ||
        res.label == '节点出参'
      ) {
        if (res.children && res.children.length != 0) {
          arr.push(res);
        }
      }
    });
    setTreeData(arr);
    setAppTenantCodeValue(needValue.appTenantCode);
  }, [needValue]);
  useEffect(() => {
    console.log(needNode, 'needNode数据变化');
    needNodeValue.current = needNode;
  }, [needNode]);
  // 节点标题 数据变化
  const inputChange = e => {
    let arr = needNode.map(element => {
      if (element.id == needValue.id) {
        return {
          ...element,
          title: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleNode(arr));
  };
  const codeChange = e => {
    let arr = needNode.map(element => {
      if (element.id == needValue.id) {
        return {
          ...element,
          code: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleNode(arr));
  };
  // 节点出参 数据变化
  const targetNameChange = e => {
    console.log(e, '节点出参 数据变化');
    setTargetNameValue(e.target.value);
    let arr = needNodeValue.current.map(element => {
      if (element.id == needValue.id) {
        return {
          ...element,
          targetName: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleNode(arr));
  };
  // 节点出参按钮点击事件
  const newClick = () => {
    console.log('变量名右侧按钮点击事件');
    setIsModalOpen(true);
  };
  // 弹出框取消关闭
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  // 节点出参数据变化
  const targetNameTreeClick = e => {
    console.log(e, '变量值弹窗值改变');
    setTargetNameValue(e.value);
    let arr = needNodeValue.current.map(element => {
      if (element.id == needValue.id) {
        return {
          ...element,
          targetName: e.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleNode(arr));
    Modal.destroyAll();
    setIsModalOpen(false);
    if (e.type == 'string' || e.type == 'object' || e.type == 'array') {
      form.setFieldValue('dataType', e.type);
    } else {
      form.setFieldValue('dataType', e.type);
    }
  };
  // 是否忽略租户 数据变化
  const tenantFlagChange = e => {
    console.log(e, '是否忽略租户 数据变化');
    setTenantFlagRecord(e);
    setAppTenantCodeValue('');
    let arr = needNodeValue.current.map(element => {
      if (element.id == needValue.id) {
        return {
          ...element,
          ignoreTenantFlag: e,
          appTenantCode: ''
        };
      } else {
        return element;
      }
    });
    dispatch(handleNode(arr));
  };
  // 租户公式输入框
  const forMuFunctions = (data) => {
    let a = filteredDatas('text', data);
    console.log(a, 'aaaaa');
    a = {
      ...a,
      formulaEchoVal: false,
      placeholder: '请输入',
      valueType: {
        placeholder: '请输入'
      },
      value: appTenantCodeValue,
      onChange: function(e) {
        setAppTenantCodeValue(e);
        let data = needNode.map(element => {
          if (element.id == needValue.id) {
            return {
              ...element,
              appTenantCode: e
            };
          } else {
            return element;
          }
        });
        dispatch(handleNode(data));
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
        form={form}
        autoComplete="off"
      >
        <Collapse defaultActiveKey={['1']} expandIconPosition={'end'}>
          <Collapse.Panel header={'基本信息'} key={1}>
            <Form.Item<FieldType> label="节点标题" name="title">
              <Input onChange={inputChange} />
            </Form.Item>
            <Form.Item<FieldType> label="code" name="code">
              <Input onChange={codeChange} />
            </Form.Item>
            <Form.Item name="targetName" label="节点出参">
              <Space.Compact style={{width: '100%'}}>
                <Input
                  id="targetName"
                  value={targetNameValue}
                  onChange={targetNameChange}
                />
                <Button icon={<EllipsisOutlined />} onClick={newClick} />
              </Space.Compact>
              <Modal
                title="选择变量"
                open={isModalOpen}
                onCancel={handleCancel}
                footer={false}
                maskClosable={false}
              >
                <div style={{height: '50vh'}}>
                  <VariableList
                    data={treeData}
                    selectMode={'tree'}
                    expandTree
                    onSelect={targetNameTreeClick}
                    value={''}
                  />
                </div>
              </Modal>
            </Form.Item>
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
          </Collapse.Panel>
        </Collapse>
      </Form>
    </>
  );
});
export default EmptyModule;
