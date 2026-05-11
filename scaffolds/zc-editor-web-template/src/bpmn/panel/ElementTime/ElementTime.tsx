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
  Modal
} from 'antd';
import {useAppSelector} from '@/redux/hook/hooks';
import TimeDuration from './timeDuration';
import TimeCycle from '@/components/TimeCycle/timeCycle';
import type {DatePickerProps, RangePickerProps} from 'antd/es/date-picker';
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import Dayjs from 'dayjs';
import Cron from '@/components/Cron/components/index';
import Corn from '@/components/Cron/cron';
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
 * 开始时间事件 组件
 *
 * @param props
 * @constructor
 */
const {Search} = Input;
export default function ElementForm(props: IProps) {
  console.log(props, '开始时间事件开始时间事件');

  // props
  const {businessObject, needData} = props;
  // cron编辑器显示隐藏
  const [cronShow, setCronShow] = useState(false);
  // cron值
  const [cronData, setCronData] = useState('');
  // state
  const [formData, setFormData] = useState<any>();
  const [timeDuration, setTimeDuration] = useState<any>(false);
  // const [time, setTime] = useState('')
  const time = useRef('');
  // 传子组件
  const [durationDefault, setDurationDefault] = useState<any>();
  // 持续时间默认值
  const [durationValue, setDurationValue] = useState<any>('');
  const searchRef = useRef(null);

  const [timeCycle, setTimeCycle] = useState<any>(false);
  const [timeCycleData, setTimeCycleData] = useState<any>('');
  const [elementBoundaryInfo, setElementBoundaryInfo] = useState<any>({
    cancelActivity: true,
    timeDuration: '',
    timeCycle: '',
    timeDate: '',
    timeType: ''
  });
  const cronRef = useRef()
  const [formFields, setFormFields] = useState<Array<any>>([]);
  const [businessKeyOptions, setBusinessKeyOptions] = useState<Array<any>>([
    {
      label: '开始时间',
      value: 'flowable:TimeDate'
    },
    {
      label: '持续时间',
      value: 'flowable:TimeDuration'
    },
    {
      label: '循环时间',
      value: 'flowable:TimeCycle'
    }
  ]);
  // ref
  const editFormFieldRef = useRef<any>();
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
    // 开始时间
    if (businessObject.eventDefinitions) {
      if (businessObject?.eventDefinitions[0].timeDate) {
        setFormData({
          ...formData,
          type: 'flowable:TimeDate'
        });
        // time.current=businessObject.eventDefinitions[0].timeDate.body.replace(/T/g,' ')
        time.current = Dayjs(
          businessObject.eventDefinitions[0].timeDate.body.replace(/T/g, ' ')
        );
        // time.current=moment(businessObject.eventDefinitions[0].timeDate.body.replace(/T/g,' '),'YYYY-MM-DD HH:mm:ss')
        console.log(time.current, 'time.current');
        form.setFieldsValue({
          type: 'flowable:TimeDate',
          timeDate: time.current
        });
      }
    }
    // 持续时间
    if (businessObject.eventDefinitions) {
      if (businessObject.eventDefinitions[0].timeDuration) {
        setFormData({
          ...formData,
          type: 'flowable:TimeDuration'
        });
        form.setFieldsValue({
          type: 'flowable:TimeDuration',
          timeDuration: businessObject.eventDefinitions[0].timeDuration.body
        });
        setDurationDefault(
          businessObject.eventDefinitions[0].timeDuration.body
        );
      }
    }
    // 循环时间
    if (businessObject.eventDefinitions) {
      if (businessObject.eventDefinitions[0].timeCycle) {
        setFormData({
          ...formData,
          type: 'flowable:TimeCycle'
        });
        form.setFieldsValue({
          type: 'flowable:TimeCycle',
          timeCycle: businessObject.eventDefinitions[0].timeCycle.body
        });
      }
    }
    if (businessObject.timerTaskSwitch) {
      form.setFieldValue('timeCycle', businessObject.expScheduledTasks);
      setTimeCycleData(businessObject.expScheduledTasks);
    }
  }

  /**
   * 更新表单标识
   *
   * @param value
   */
  // function updatetype(value: any) {
  // window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
  //   type: value,
  // });
  // }

  /**
   * 更新业务标识
   *
   * @param option [key, value, children]
   */
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
    // const extensionElement = window.bpmnInstance.moddle.create("bpmn:timerEventDefinition", {
    //   values: [
    //     window.bpmnInstance.moddle.create(
    //       "flowable:formData"
    //     ),
    //   ],
    //  })
    // window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
    //       loopCharacteristics: multiLoopInstance.current,
    //       assignee: '${assignee}'
    //     });
  }

  /**
   * 构造业务标识下拉项
   *
   * @param fields
   */
  // function createBusinessKeySelectOptions(fields: Array<any>) {
  //   let businessKeyOptions: Array<any> =
  //     fields?.map((e) => {
  //       return {
  //         name: e.formName,
  //         value: e.formId,
  //         // name: e.label,
  //         // value: e.id,
  //       };
  //     }) || [];
  //   setBusinessKeyOptions(businessKeyOptions);
  // }
  const durationOnSearch = (value, _e, info) => {
    console.log(value, 'valuevaluevaluevaluevalue');
    console.log(_e, '_e_e_e_e_e');
    console.log(info, 'infoinfoinfoinfoinfo');
    setTimeDuration(true);
    setDurationDefault(value);
  };
  const cycleOnSearch = (value, _e, info) => {
    console.log(value, 'valuevaluevaluevaluevalue');
    console.log(_e, '_e_e_e_e_e');
    console.log(info, 'infoinfoinfoinfoinfo');
    // setTimeCycle(true)
    setCronShow(true);
    setCronData(value);
    setTimeCycleData(value);
    console.log(cronRef.current,'cronRef.current')
    cronRef.current.selectCron(value)
  };
  // 获取cron回调
  const getCron = e => {
    console.log(e, '获取cron回调');
    form.setFieldValue('timeCycle', e);
    setTimeCycleData(e);
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      expScheduledTasks: e
    });
  };
  // 选择时间
  const dateOnChange = (
    // value: DatePickerProps['value'] | RangePickerProps['value'],
    // dateString: [string, string] | string,
    value,
    dateString
  ) => {
    console.log('Selected Time: ', value);
    console.log('Formatted Selected Time: ', dateString);
    console.log(_(dateString).replace(/\s*/g, ''), ' _(dateString)');
    let timeDate = _(dateString).replace(/\s*/g, '');
    // time.current = timeDate
    changeDate({dueDate: timeDate, type: 'flowable:TimeDate', typeId: 0});
  };

  const timeDurationShow = () => {
    console.log('进入');
    setTimeDuration(false);
  };
  // 循环时间弹窗子组件关闭弹窗确定事件
  const timeCycleShow = () => {
    console.log('循环时间弹窗子组件关闭弹窗确定事件');
    setTimeCycle(false);
  };
  const timeCycleChange = item => {
    console.log(item, 'eeeeeeeeeeeeeeeeeee');
    form.setFieldValue('timeCycle', item.dueDate);
    setTimeCycleData(item.dueDate);
    // searchRef.current.setFieldsValue({
    //   "timeCycle": item.dueDate
    // })
    window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
      expScheduledTasks: item.dueDate
    });
    // changeDate(item)
  };
  // 持续时间 确认时间
  const durationSubmit = item => {
    console.log(item, 'item...........');
    // setDurationValue(item)
    console.log(searchRef, 'searchRefsearchRef');
    searchRef.current.setFieldsValue({
      timeDuration: item.dueDate
    });
    changeDate(item);
  };
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

  //
  const changeDate = e => {
    console.log(e, 'eeeeeeeeeeeeeeeee');
    const timerEventDefinition =
      window.bpmnInstance.element.businessObject.eventDefinitions[0];
    // const timeDates = window.bpmnInstance.moddle.create({ body: e.dueDate });
    const timeDates = window.bpmnInstance.moddle.create(
      'bpmn:FormalExpression',
      {
        body: e.dueDate
        //  ...e.dueDate
      }
    );
    // const timeDates = window.bpmnInstance.moddle.create("flowable:timeDate",{ body: e.dueDate });

    // const timeDates = window.bpmnInstance.moddle.create('timeDate',{ body: e.dueDate });
    // const timeDates = window.bpmnInstance.moddle.create(e.type, { body: e.dueDate });
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
    //     console.log(needData.get('elementRegistry'),'111111111')
    //     console.log(needData.get('elementRegistry')._elements,'222222222')
    //     let elements = needData.get('elementRegistry')._elements
    //     console.log(elements,'elementselementselementselements')
    //     let timerStartEvent;
    //       for (let element of Object.entries(elements)) {
    //       // for (let element of Object.keys(elements)) {
    //     // for (let element of elements) {
    //     // for (const [id, element] of elements) {
    //       console.log(element,'elementelementelement')
    //       console.log(element[1].element.businessObject,'elementelementelement')
    //       const businessObject = element[1].element.businessObject;

    //       // 判断是否为定时开始事件
    //       if (businessObject.$type === 'bpmn:StartEvent' && businessObject.eventDefinitions[0].$type === 'bpmn:TimerEventDefinition') {
    //         timerStartEvent = element;
    //         break;
    //       }
    //     }
    //     console.log(timerStartEvent,'timerStartEventtimerStartEventtimerStartEventtimerStartEvent')
    //    //获取添加的定时事件的节点
    //    console.log(window.bpmnInstance,'window.bpmnInstancewindow.bpmnInstancewindow.bpmnInstance')
    //    console.log(businessObject,'businessObjectbusinessObjectbusinessObjectbusinessObject')
    //   //  let timerEventDef = bpmnElement.businessObject.eventDefinitions[0]
    //     let timerEventDef = businessObject.eventDefinitions[0]
    //       for (const key in timerEventDef) {
    //         if ( !(key == '$type' || key == 'id')){
    //           delete timerEventDef[key]
    //         }
    //       }
    //    const timeCycle = window.bpmnInstance.moddle.create("bpmn:FormalExpression", { body:111 });
    //    const timeDate = window.bpmnInstance.moddle.create("bpmn:FormalExpression", { body:222 });
    //    const timeDuration = window.bpmnInstance.moddle.create("bpmn:FormalExpression", { body:333 });
    //    console.log(timerEventDef,'timerEventDeftimerEventDeftimerEventDef')
    //    console.log(timeCycle,'timeCycletimeCycletimeCycletimeCycle')
    //    console.log(timeDate,'timeDatetimeDatetimeDatetimeDate')
    //    console.log(timeDuration,'timeDurationtimeDurationtimeDurationtimeDuration')
    //    console.log(timerStartEvent[1].element,'timerStartEvent[1].element')
    // console.log(window.bpmnInstance.element,'window.bpmnInstance.elementwindow.bpmnInstance.element')
    //   let loopCardinality = null;
    //   loopCardinality = window.bpmnInstance.moddle.create(
    //     'bpmn:FormalExpression',
    //     { body: e },
    //   );
    // window.bpmnInstance.modeling.updateModdleProperties(
    //   window.bpmnInstance.element,
    //   window.bpmnInstance.element.businessObject.eventDefinitions,
    //   {
    //     loopCardinality,
    //   },
    // );
    console.log(
      window.bpmnInstance.modeler.getDefinitions(),
      'window.bpmnInstance.modeler.getDefinitions()'
    );
    // // 获取定时开始事件
    // const startEvent = elementRegistry.get('StartEvent_1');

    // 获取timerEventDefinition节点

    // 添加时间日期子节点
    // const timeDates = window.bpmnInstance.moddle.create('bpmn:FormalExpression', { body: '2022-01-01T00:00:00Z' });
    // console.log(timerEventDefinition,'timerEventDefinition')
    // timerEventDefinition.timeDate = timeDate;

    // 添加时间间隔子节点
    // const timeDurations = window.bpmnInstance.moddle.create('bpmn:FormalExpression', { body: 'PT1H' });
    // timerEventDefinition.timeDuration = timeDuration;

    // window.bpmnInstance.modeling.updateModdleProperties(window.bpmnInstance.element,timerEventDef,{
    // window.bpmnInstance.modeling.updateModdleProperties(timerStartEvent[1].element,
    // timerEventDef,
    // window.bpmnInstance.element.businessObject.loopCharacteristics,
    // {
    // timeCycle, timeDate, timeDuration
    // type:'1111111'
    // })
    // window.bpmnInstance.modeling.updateProperties(timerStartEvent[1].element.businessObject.eventDefinitions[0], { formKey: 11111 });

    //  console.log(window.bpmnInstance.element.businessObject.get('timerEventDefinition'),'window.bpmnInstances.elementRegistry.get(this.elementBaseInfo.id)')
    //  this.timeElement = window.bpmnInstances.elementRegistry.get(this.elementBaseInfo.id)
    //获取节点的子节点 timerEventDefinition
    // var timerEventDef = this.timeElement.businessObject.eventDefinitions[0]
    // 创建一个表达式
    // let timeDate = window.bpmnInstances.bpmnFactory.create('bpmn:Expression')
    //将表达式作为  子节点 timerEventDefinition的属性子节点
    // timeDate.$parent = timerEventDef
    // 添加属性
    // timerEventDef[timeType] = value
    // timerEventDef[timeType].body = value

    // console.log(window.bpmnInstance.element.businessObject,'businessObjectbusinessObjectbusinessObject')
    // let t = {}
    //   // , i = window.bpmnInstance.element.businessObject.get("timerEventDefinition")[0];
    //   , i = window.bpmnInstance.element.businessObject.get("eventDefinitions")[0];

    // console.log(i, "---------businessObject")
    // console.log(businessObject.get, "---------businessObject")
    // if (e === "timeDate") {
    //   setElementBoundaryInfo({
    //     ...elementBoundaryInfo,
    //     timeCycle: "",
    //     timeDuration: "",
    //   })
    //   const t = _(elementBoundaryInfo[e]);
    //   let needData = elementBoundaryInfo[e]
    //   setElementBoundaryInfo({
    //     ...elementBoundaryInfo,
    //     // elementBoundaryInfo[e]:t
    //   })

    //   console.log(elementBoundaryInfo, "-------info"),
    //     i && (delete i.timeCycle,
    //       delete i.timeDuration)
    // } else {
    //   "timeCycle" === e ?
    //     (setElementBoundaryInfo({
    //       ...elementBoundaryInfo,
    //       timeDate: "",
    //       timeDuration: "",
    //     }), i && (delete i.timeDate, delete i.timeDuration))
    //     : "timeDuration" === e &&
    //     (setElementBoundaryInfo({
    //       ...elementBoundaryInfo,
    //       timeDate: "",
    //       timeCycle: "",
    //     }), i && (delete i.timeDate, delete i.timeCycle))
    // }
    // const n = window.bpmnInstance.moddle.create("flowable:" + (e.charAt(0).toUpperCase() + e.slice(1)), {
    //   id: elementBoundaryInfo.id,
    //   body: elementBoundaryInfo[e]
    // });
    // console.log(n,'nnnnnnnnnn')
    // t = {
    //   'xsi:type': n
    //   // 'xsi:type': n
    //   // [elementBoundaryInfo.timeType]: n
    // }
    // console.log("flowable:" + (e.charAt(0).toUpperCase() + e.slice(1)),'"flowable:" + (e.charAt(0).toUpperCase() + e.slice(1))')
    //   console.log(i, "------parent"),
    //   console.log(window.bpmnInstance.element,'window.bpmnInstance.element')
    //   console.log(t,'ttttt')
    console.log(window.bpmnInstance.element, 'window.bpmnInstance.element');
    // window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element.businessObject.eventDefinitions[0], { type:111111 });
    // window.bpmnInstance.modeling.updateModdleProperties(
    //   window.bpmnInstance.element,
    //   window.bpmnInstance.element.businessObject.loopCharacteristics,
    //   {
    //     type:111111
    //   },
    // );
    // const extensionElements = window.bpmnInstance.moddle.updateProperties(
    //   'bpmn:timerEventDefinition',
    //   {
    //     values: [
    //       window.bpmnInstance.moddle.create(
    //         `flowable:TimeDate`,
    //         {
    //           body: 11111,
    //         },
    //       ),
    //     ],
    //   },
    // );
    // window.bpmnInstance.modeling.updateModdleProperties(
    //   window.bpmnInstance.element,
    //   {
    //     extensionElements,
    //   },
    // );

    // const documentation = window.bpmnInstance.bpmnFactory?.create(
    //   'bpmn:timeDuration',
    //   {
    //     text: value,
    //   },
    // );
    // window.bpmnInstance.modeling.updateProperties(window.bpmnInstance.element, {
    //   documentation: value ? [documentation] : undefined,
    // });
    // window.bpmnInstance.modeling.updateModdleProperties(
    //   window.bpmnInstance.element, i,
    //   {
    //     ...t
    //   },
    // );
  };
  return (
    <>
      <Form
        form={form}
        labelCol={{span: 5}}
        wrapperCol={{span: 18}}
        ref={searchRef}
      >
        {/* <Form.Item name="type" label="选择定时类型">
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
        </Form.Item> */}
        {formData?.type == 'flowable:TimeDate' && (
          <Form.Item name="timeDate" label="选择日期时间">
            <DatePicker
              locale={locale}
              showTime
              onChange={dateOnChange}
              // onOk={dateOnOk}
              // value={'2023-09-01 11:20:28'}
              // value={moment(time.current, 'YYYY-MM-DD HH:mm:ss')}
              // value={time.current}
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>
        )}
        {formData?.type == 'flowable:TimeDuration' && (
          <Form.Item name="timeDuration" label="输入等待时间">
            <Search
              readOnly
              placeholder="请输入等待时间"
              onSearch={durationOnSearch}
            />
          </Form.Item>
        )}
        {/* {formData?.type == 'flowable:TimeCycle' && (
          <Form.Item name="timeCycle" label="输入循环时间">
            <Search readOnly value={timeCycleData} placeholder="请输入循环时间" onSearch={cycleOnSearch} />
          </Form.Item>
        )} */}
        <Form.Item name="timeCycle" label="选择时间">
          <Search
            readOnly
            value={timeCycleData}
            placeholder="请选择时间"
            onSearch={cycleOnSearch}
          />
        </Form.Item>
      </Form>
      <Cron show={cronShow} cronData={cronData} getCron={getCron} onRef={cronRef} />
      <TimeDuration
        show={timeDuration}
        value={durationDefault}
        changeShow={timeDurationShow}
        submitClick={item => durationSubmit(item)}
      />
      <TimeCycle
        value={timeCycleData}
        show={timeCycle}
        cycleShow={timeCycleShow}
        cycleChange={timeCycleChange}
      />
      <span style={{ color: '#A7A7A7' }}>
        在平台中执行时，限制小于每分钟1次的定时任务按每分钟1次执行，生成应用后执行无此限制
      </span>
    </>
  );
}
