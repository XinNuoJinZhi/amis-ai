import React, {
  useEffect,
  useRef,
  useState,
  forwardRef
} from 'react';
import {
  Input,
  Form,
  Collapse,
  Button,
  Modal,
  Space,
  message
} from 'antd';
import {VariableList} from 'amis-ui';
import {EllipsisOutlined} from '@ant-design/icons';
import {handleNode} from '@/redux/slice/antvSlice';
import {useAppDispatch, useAppSelector} from '@/redux/hook/hooks';
import {filteredDatas} from '@/components/AntvModel/Content/components/getSchemaChange';
import {service} from '@/utils/request';
import {render as amisRender} from 'amis';
import {env as amisEnv} from '@/hooks/amis';
import {getSchemaTpl} from 'amis-editor';
import {advancedFeature} from '@/utils/env'

// 读取对象数据组件
const Download = forwardRef(function Download(props, ref) {
  const needNode = useAppSelector(state => state.antvModule.node);
  const needValue = useAppSelector(state => state.antvModule.rightNodeData);
  // 公式数据
  const formuVariables = useAppSelector(state => state.antvModule.formuVariables);
  const dispatch = useAppDispatch();
  const [form] = Form.useForm<{}>();
  const needValueData = useRef({});
  const needNodeValue = useRef([]);
  const [appTenantCodeValue, setAppTenantCodeValue] = useState<any>('');
  const [showForn, setShowForn] = useState(false);
  const [outModalOpen, setOutModalOpen] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [targetNameValue, setTargetNameValue] = useState<any>();
  useEffect(() => {
    let arr: any = [];
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
    form.setFieldValue('title', needValue.title);
    form.setFieldValue('url', needValue.url);
    form.setFieldValue('outputName', needValue.outputName);
    setTargetNameValue(needValue.outputName);
    needValueData.current = needValue;
    setAppTenantCodeValue(needValue.url);
    setShowForn(false);
    setTimeout(() => {
      setShowForn(true);
    }, 100);
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
  const urlChange = e => {
    let arr = needNode.map(element => {
      if (element.id == needValue.id) {
        return {
          ...element,
          url: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleNode(arr));
  };
  const outputNameChange = e => {
    setTargetNameValue(e.target.value)
    let arr = needNode.map(element => {
      if (element.id == needValue.id) {
        return {
          ...element,
          outputName: e.target.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleNode(arr));
  };
  // 文件地址公式
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
              url: e
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
  const outClick = () => {
    setOutModalOpen(true);
  };
  const outHandleCancel = () => {
    setOutModalOpen(false);
  };
  const targetNameTreeClick = e => {
    console.log(e, '变量值弹窗值改变');
    setTargetNameValue(e.value ? e.value : e.label);
    let arr = needNode.map(element => {
      if (element.id == needValue.id) {
        return {
          ...element,
          outputName: e.value
        };
      } else {
        return element;
      }
    });
    dispatch(handleNode(arr));
    Modal.destroyAll();
    setOutModalOpen(false);
  };
  // 节点出参 数据变化
  const targetNameChange = e => {
    console.log(e, '节点出参 数据变化');
    const regex = /^[a-zA-Z_][A-Za-z0-9_]*$/;
    if (!regex.test(e.target.value)) {
      setTargetNameValue('');
      message.error('请输入规范的参数名称');
    }
    let arr = needNode.map(element => {
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
            <Form.Item<FieldType> label="文件地址" name="url">
              {/*<Input onChange={urlChange} />*/}
              {showForn && forMuFunctions(formuVariables)}
            </Form.Item>
            <Form.Item<FieldType> label="节点出参" name="outputName">
              <Space.Compact style={{width: '100%'}}>
                <Input
                  onChange={outputNameChange}
                  value={targetNameValue}
                  onBlur={targetNameChange}
                />
                <Button icon={<EllipsisOutlined />} onClick={outClick} />
              </Space.Compact>
            </Form.Item>
            <Modal
              title="选择变量"
              open={outModalOpen}
              onCancel={outHandleCancel}
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
          </Collapse.Panel>
        </Collapse>
      </Form>
    </>
  );
});
export default Download;
