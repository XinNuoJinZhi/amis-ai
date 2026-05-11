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
  DatePicker,
  ConfigProvider,
  message
} from 'antd';
import {useAppSelector} from '@/redux/hook/hooks';
import TimeDuration from './timeDuration';
import TimeCycle from './timeCycle';
import type {DatePickerProps, RangePickerProps} from 'antd/es/date-picker';
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import Dayjs from 'dayjs';
import {getModelEvent, formGet} from '@/api/bpmn';

interface IProps {
  businessObject: any;
  needData: any;
}
const params = new URLSearchParams(window.location.search);
const appId = params.get('appid');
const env = params.get('env');
console.log(params, 'paramsparamsparamsparams');
console.log(appId, 'appIdappIdappIdappId');
console.log(env, 'envenvenvenv');
/**
 * 开始事件事件 组件
 *
 * @param props
 * @constructor
 */
const {Search} = Input;
export default function ElementMessage(props: IProps) {
  console.log(props, '开始信息事件开始信息事件');
  const [messageApi, contextHolder] = message.useMessage();
  // props
  const {businessObject, needData} = props;
  // state
  const [formData, setFormData] = useState<any>();
  const [timeDuration, setTimeDuration] = useState<any>(false);
  // const [time, setTime] = useState('')
  const time = useRef('');
  // 传子组件
  const [durationDefault, setDurationDefault] = useState<any>();
  const searchRef = useRef(null);
  const [businessKeyOptions, setBusinessKeyOptions] = useState<Array<any>>([]);
  // 新增记录前
  const [insertBeforeOptions, setInsertBeforeOptions] = useState<Array<any>>(
    []
  );
  // 新增记录后
  const [insertAfterOptions, setnsertAfterOptions] = useState<Array<any>>([
    {
      value: '2'
    }
  ]);
  // 更新记录前
  const [updateBeforeOptions, setUpdateBeforeOptions] = useState<Array<any>>([
    {
      value: '3'
    }
  ]);
  // 更新记录后
  const [updateAfterOptions, setUpdateAfterOptions] = useState<Array<any>>([
    {
      value: '4'
    }
  ]);
  // 删除记录前
  const [deleteBeforeOptions, setDeleteBeforeOptions] = useState<Array<any>>([
    {
      value: '5'
    }
  ]);
  // 删除记录后
  const [deleteAfterOptions, setDeleteAfterOptions] = useState<Array<any>>([
    {
      value: '6'
    }
  ]);
  // form
  const [form] = Form.useForm<{
    type: string;
    timeDate: string;
    timeDuration: string;
    timeCycle: string;
  }>();
  // redux
  const bpmnPrefix = useAppSelector(state => state.bpmn.prefix);

  /**
   * 初始化
   */
  useEffect(() => {
    if (businessObject) {
      initPageData();
    }
  }, [businessObject?.id]);

  /**
   * 初始化页面数据
   */
  function initPageData() {
    console.log(props, 'businessObjectbusinessObject');
    let businessObject: any =
      window.bpmnInstance?.element?.businessObject || props.businessObject;
    // 获取FormData
    console.log(bpmnPrefix, 'bpmnPrefixbpmnPrefixbpmnPrefix');
    console.log(businessObject, 'businessObjectbusinessObjectbusinessObject');

    if (businessObject.formKey) {
      formGet().then(res => {
        res.data.data.forEach(item => {
          if (businessObject.formKey == 'key_' + item.id) {
            getModelEvent(item.queryKey).then(res => {
              console.log(res, 'ssssss');
              setInsertBeforeOptions(res.data.data);
            });
          }
        });
      });
    }
  }

  function updateBusinessKey(option: any) {
    let {key, value} = option;
    console.log(option, 'optionoptionoptionoptionoption');
    if (key === 'no') {
      // 如果选择无，则默认没有业务标识
      value = '';
    }

    console.log(value, 'valuevaluevalue');
    setFormData({
      type: value
    });
    const extensionElements = window.bpmnInstance.moddle.create(
      'bpmn:ExtensionElements',
      {
        values: [window.bpmnInstance.moddle.create('flowable:formData')]
      }
    );
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      extensionElements
    });
  }

  function _(e) {
    const t = new Date(e);
    return (
      t.setTime(t.getTime()),
      `${t.getFullYear()}-${
        t.getMonth() + 1 < 10 ? '0' + (t.getMonth() + 1) : t.getMonth() + 1
      }-${t.getDate() < 10 ? '0' + t.getDate() : t.getDate()}T ${
        t.getHours() < 10 ? '0' + t.getHours() : t.getHours()
      }:${t.getMinutes() < 10 ? '0' + t.getMinutes() : t.getMinutes()}:${
        t.getSeconds() < 10 ? '0' + t.getSeconds() : t.getSeconds()
      }`
    );
  }
  const changeDate = e => {
    console.log(e, 'eeeeeeeeeeeeeeeee');
    const timerEventDefinition =
      window.bpmnInstance.element.businessObject.eventDefinitions[0];
    // const timeDates = window.bpmnInstance.moddle.create({ body: e.dueDate });
    const timeDates = window.bpmnInstance.moddle.create('bpmn:messageRef', {
      body: e.dueDate
      //  ...e.dueDate
    });
    if (timerEventDefinition.timeDate) {
      delete timerEventDefinition.timeDate;
    }
    if (timerEventDefinition.timeDuration) {
      delete timerEventDefinition.timeDuration;
    }
    if (timerEventDefinition.timeCycle) {
      delete timerEventDefinition.timeCycle;
    }
    console.log(timerEventDefinition, '111111');
    window.bpmnInstance.modeling.updateModdleProperties(
      window.bpmnInstance.element,
      timerEventDefinition,
      {}
    );
    if (e.typeId == 0) {
      window.bpmnInstance.modeling.updateModdleProperties(
        window.bpmnInstance.element,
        timerEventDefinition,
        {
          timeDate: timeDates
        }
      );
    }
    if (e.typeId == 1) {
      window.bpmnInstance.modeling.updateModdleProperties(
        window.bpmnInstance.element,
        timerEventDefinition,
        {
          timeDuration: timeDates
        }
      );
    }
    if (e.typeId == 2) {
      window.bpmnInstance.modeling.updateModdleProperties(
        window.bpmnInstance.element,
        timerEventDefinition,
        {
          timeCycle: timeDates
        }
      );
    }

    console.log(
      window.bpmnInstance.modeler.getDefinitions(),
      'window.bpmnInstance.modeler.getDefinitions()'
    );

    console.log(window.bpmnInstance.element, 'window.bpmnInstance.element');
  };

  const selectClick = () => {
    if (insertBeforeOptions.length == 0) {
      messageApi.open({
        type: 'error',
        content: '请先选择表单'
      });
    }
  };

  // 新增记录前 数据变化
  const insertBeforeChange = e => {
    console.log(e, '新增记录前');
    // window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, { messageRef: e.value });
    console.log(window, 'windowwindowwindowwindowwindow');
    console.log(
      window.bpmnInstance.element,
      'window.bpmnInstance.element.businessObject'
    );
    console.log(
      window.bpmnInstance.element.businessObject,
      'window.bpmnInstance.element.businessObject'
    );
    const timerEventDefinition =
      window.bpmnInstance.element.businessObject.eventDefinitions[0];
    console.log(
      timerEventDefinition,
      'timerEventDefinitiontimerEventDefinition'
    );
    // const timeDates = window.bpmnInstance.moddle.create('messageRef');
    // window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
    // window.bpmnInstance.modeling.updateProperties(timerEventDefinition, {
    //   messageRef: e.value
    // });
    window.bpmnInstance.modeling.updateProperties(
      window.bpmnInstance.element,
      {
        'messageRef': e.value
      },
    );
  };
  // 新增记录后 数据变化
  const insertAfterChange = e => {
    console.log(e, '新增记录后');
  };
  // 更新记录前 数据变化
  const updateBeforeChange = e => {
    console.log(e, '更新记录前');
  };
  // 更新记录后 数据变化
  const updateAfterChange = e => {
    console.log(e, '更新记录后');
  };
  // 删除记录前 数据变化
  const deleteBeforeChange = e => {
    console.log(e, '删除记录前');
  };
  // 删除记录后 数据变化
  const deleteAfterChange = e => {
    console.log(e, '删除记录后');
  };
  return (
    <>
      <Form
        form={form}
        labelCol={{span: 5}}
        wrapperCol={{span: 18}}
        ref={searchRef}
      >
        <Form.Item name="type" label="选择定时类型">
          <Select
            placeholder={'请选择'}
            onChange={(value, option) => updateBusinessKey(option)}
          >
            {businessKeyOptions?.map((e) => {
              return (
                <Select.Option key={e.value} value={e.value}>
                  {e.label}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item name="insertBefore" label="信息类型">
          <Select
            placeholder={'请选择'}
            onChange={(value, option) => insertBeforeChange(option)}
            onClick={selectClick}
          >
            {insertBeforeOptions?.map(e => {
              return (
                <Select.Option key={e.value} value={e.value}>
                  {e.label}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
        {/* <Form.Item name="insertAfter" label="新增记录后">
          <Select
            placeholder={'请选择'}
            onChange={(value, option) => insertAfterChange(option)}
          >
            {insertAfterOptions?.map(e => {
              return (
                <Select.Option key={e.value} value={e.value}>
                  {e.label}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item name="updateBefore" label="更新记录前">
          <Select
            placeholder={'请选择'}
            onChange={(value, option) => updateBeforeChange(option)}
          >
            {updateBeforeOptions?.map(e => {
              return (
                <Select.Option key={e.value} value={e.value}>
                  {e.label}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item name="updateAfter" label="更新记录后">
          <Select
            placeholder={'请选择'}
            onChange={(value, option) => updateAfterChange(option)}
          >
            {updateAfterOptions?.map(e => {
              return (
                <Select.Option key={e.value} value={e.value}>
                  {e.label}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item name="deleteBefore" label="删除记录前">
          <Select
            placeholder={'请选择'}
            onChange={(value, option) => deleteBeforeChange(option)}
          >
            {deleteBeforeOptions?.map(e => {
              return (
                <Select.Option key={e.value} value={e.value}>
                  {e.label}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item name="deleteAfter" label="删除记录后">
          <Select
            placeholder={'请选择'}
            onChange={(value, option) => deleteAfterChange(option)}
          >
            {deleteAfterOptions?.map(e => {
              return (
                <Select.Option key={e.value} value={e.value}>
                  {e.label}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item> */}
      </Form>
    </>
  );
}
