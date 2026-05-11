import React, {useEffect, useRef, useState} from 'react';
import {Modal, Form, Radio, InputNumber, Row, Col, Divider} from 'antd';
type FieldType = {
  minute?: string;
  hour?: string;
  day?: string;
  week?: string;
  month?: string;
};

export default function MoreTime(props: any) {
        console.log(props, '持续事件组件');
        const {submitChange, value} = props;
        const [form] = Form.useForm<{
          minute: string;
          hour: string;
          day: string;
          week: string;
          month: string;
        }>();
        const durationRef = useRef(null);
        // const [userTaskForm.current, setUserTaskForm] = useState({})
        const userTaskForm = useRef({});
        const [dueDateForm, setDueDateForm] = useState({
          hourEnum: ['4', '8', '12', '24'],
          hour: null,
          day: null,
          commonEnum: ['1', '2', '3', '4'],
          minuteEnum: ['5', '10', '30', '50'],
          week: null,
          month: null,
          minute: null,
          otherHour: 1,
          otherDay: 5,
          otherWeek: 5,
          otherMonth: 5,
          otherMinute: 1,
          otherHourVisible: false,
          otherDayVisible: false,
          otherWeekVisible: false,
          otherMonthVisible: false,
          otherMinuteVisible: false
        });
      
        const handleOk = (item) => {
          item.hour
            ? -1 == item.hour
              ? (userTaskForm.current.dueDate = 'PT' + item.otherHour + 'H')
              : (userTaskForm.current.dueDate = 'PT' + item.hour + 'H')
            : item.day
            ? -1 == item.day
              ? (userTaskForm.current.dueDate = 'P' + item.otherDay + 'D')
              : (userTaskForm.current.dueDate = 'P' + item.day + 'D')
            : item.week
            ? -1 == item.week
              ? (userTaskForm.current.dueDate = 'P' + item.otherWeek + 'W')
              : (userTaskForm.current.dueDate = 'P' + item.week + 'W')
            : item.month
            ? -1 == item.month
              ? (userTaskForm.current.dueDate = 'P' + item.otherMonth + 'M')
              : (userTaskForm.current.dueDate = 'P' + item.month + 'M')
            : item.minute &&
              (-1 == item.minute
                ? (userTaskForm.current.dueDate =
                    'PT' + item.otherMinute + 'M')
                : (userTaskForm.current.dueDate = 'PT' + item.minute + 'M')),
        //   dueDateForm.hour
        //     ? -1 == dueDateForm.hour
        //       ? (userTaskForm.current.dueDate = 'PT' + dueDateForm.otherHour + 'H')
        //       : (userTaskForm.current.dueDate = 'PT' + dueDateForm.hour + 'H')
        //     : dueDateForm.day
        //     ? -1 == dueDateForm.day
        //       ? (userTaskForm.current.dueDate = 'P' + dueDateForm.otherDay + 'D')
        //       : (userTaskForm.current.dueDate = 'P' + dueDateForm.day + 'D')
        //     : dueDateForm.week
        //     ? -1 == dueDateForm.week
        //       ? (userTaskForm.current.dueDate = 'P' + dueDateForm.otherWeek + 'W')
        //       : (userTaskForm.current.dueDate = 'P' + dueDateForm.week + 'W')
        //     : dueDateForm.month
        //     ? -1 == dueDateForm.month
        //       ? (userTaskForm.current.dueDate = 'P' + dueDateForm.otherMonth + 'M')
        //       : (userTaskForm.current.dueDate = 'P' + dueDateForm.month + 'M')
        //     : dueDateForm.minute &&
        //       (-1 == dueDateForm.minute
        //         ? (userTaskForm.current.dueDate =
        //             'PT' + dueDateForm.otherMinute + 'M')
        //         : (userTaskForm.current.dueDate = 'PT' + dueDateForm.minute + 'M')),
            updateElementTask('dueDate');
        };
        const updateElementTask = e => {
          let t = Object.create(null);
          t[e] =
            'candidateUsers' === e || 'candidateGroups' === e
              ? userTaskForm.current[e] && userTaskForm.current[e].length
                ? userTaskForm.current[e].join()
                : null
              : userTaskForm.current[e] || null;
          console.log(e, 'eeeeeeeeeeeeeeeeeee');
          console.log(userTaskForm.current, 'userTaskForm.current');
          submitChange({
            dueDate: userTaskForm.current.dueDate,
            type: 'flowable:TimeDuration',
            typeId: 1
          });
          // this.$emit("changeDurationTime", this.userTaskForm.current[e])
        };
        //  分钟
        const minuteOnChange = (e: any) => {
          console.log(e, 'minuteOnChangeminuteOnChange');
          // setOtherMinute(e)
          setDueDateForm({
            ...dueDateForm,
            otherMinute: e,
            minute: e
          });
        };
        const changeMinute = (e: any) => {
          console.log(e, 'miRadioChangemiRadioChange');
          console.log(dueDateForm, 'dueDateForm.minute');
          if (e.target.value == 1) {
            // if (e.target.value == 'otherMinute') {
            setDueDateForm(()=>{
                let a = {
                    ...dueDateForm,
                    otherMinuteVisible: true,
                    day: null,
                    week: null,
                    month: null,
                    hour: null,
                    minute: e.target.value,
                    otherMinute: e.target.value,
                    otherHourVisible: false,
                    otherDayVisible: false,
                    otherWeekVisible: false,
                    otherMonthVisible: false
                  }
                handleOk(a)
                  return a
            });
          } else {
            setDueDateForm(()=>{
                let a = {
                    ...dueDateForm,
                    otherMinuteVisible: false,
                    day: null,
                    week: null,
                    month: null,
                    hour: null,
                    minute: e.target.value,
                    otherHourVisible: false,
                    otherDayVisible: false,
                    otherWeekVisible: false,
                    otherMonthVisible: false
                }
                handleOk(a)
                return a
            });
          }
          console.log(dueDateForm, '11111');
        };
        //  小时
        const hourOnChange = (e: any) => {
          console.log(e, 'hourOnChangehourOnChange');
          // setOtherHour(e)
          setDueDateForm({
            ...dueDateForm,
            otherHour: e,
            hour: e
          });
        };
        const changeHour = (e: any) => {
          console.log(e, 'hRadioChangehRadioChange');
          if (e.target.value == 1) {
            // if (e.target.value == 'otherHour') {
            setDueDateForm(()=>{
                let a = {
                    ...dueDateForm,
                    otherMinuteVisible: false,
                    day: null,
                    week: null,
                    month: null,
                    minute: null,
                    hour: e.target.value,
                    otherHourVisible: true,
                    otherDayVisible: false,
                    otherWeekVisible: false,
                    otherMonthVisible: false
                  }
                  handleOk(a)
                  return a
            });
          } else {
            setDueDateForm(()=>{
                let a = {
                    ...dueDateForm,
                    otherMinuteVisible: false,
                    day: null,
                    week: null,
                    month: null,
                    minute: null,
                    hour: e.target.value,
                    otherHourVisible: false,
                    otherDayVisible: false,
                    otherWeekVisible: false,
                    otherMonthVisible: false
                  }
                  handleOk(a)
                  return a 
            });
          }
        };
        //  天
        const dayOnChange = (e: any) => {
          console.log(e, 'dayOnChangedayOnChange');
          // setOtherDay(e)
          setDueDateForm({
            ...dueDateForm,
            otherDay: e,
            day: e
          });
        };
        const changeDay = (e: any) => {
          console.log(e, 'dRadioChangedRadioChange');
          // if (dueDateForm.day == -1) {
          if (e.target.value == 5) {
            // if (e.target.value == 'otherDay') {
            setDueDateForm(()=>{
                let a = {
                    ...dueDateForm,
                    otherMinuteVisible: false,
                    week: null,
                    month: null,
                    hour: null,
                    minute: null,
                    day: e.target.value,
                    otherHourVisible: false,
                    otherDayVisible: true,
                    otherWeekVisible: false,
                    otherMonthVisible: false
                  }
          handleOk(a)
          return a
            });
          } else {
            setDueDateForm(()=>{
                let a = {
                    ...dueDateForm,
                    otherMinuteVisible: false,
                    week: null,
                    month: null,
                    hour: null,
                    minute: null,
                    day: e.target.value,
                    otherHourVisible: false,
                    otherDayVisible: false,
                    otherWeekVisible: false,
                    otherMonthVisible: false
                  }
          handleOk(a)
          return a
            });
          }
        };
        //  周
        const weekOnChange = (e: any) => {
          console.log(e, 'weekOnChangeweekOnChange');
          // setOtherWeek(e)
          setDueDateForm({
            ...dueDateForm,
            otherWeek: e,
            week: e
          });
        };
        const changeWeek = (e: any) => {
          console.log(e, 'wRadioChangewRadioChange');
          if (e.target.value == 5) {
            // if (e.target.value == 'otherWeek') {
            setDueDateForm(()=>{
                let a = {
                    ...dueDateForm,
                    otherMinuteVisible: false,
                    day: null,
                    month: null,
                    hour: null,
                    minute: null,
                    week: e.target.value,
                    otherHourVisible: false,
                    otherDayVisible: false,
                    otherWeekVisible: true,
                    otherMonthVisible: false
                  }
          handleOk(a)
          return a
            });
          } else {
            setDueDateForm(()=>{
                let a = {
                    ...dueDateForm,
                    otherMinuteVisible: false,
                    day: null,
                    month: null,
                    hour: null,
                    minute: null,
                    week: e.target.value,
                    otherHourVisible: false,
                    otherDayVisible: false,
                    otherWeekVisible: false,
                    otherMonthVisible: false
                  }
          handleOk(a)
          return a
            });
          }
        };
        //  月
        const monthOnChange = (e: any) => {
          console.log(e, 'monthOnChangemonthOnChange');
          // setOtherMonth(e)
          setDueDateForm({
            ...dueDateForm,
            otherMonth: e,
            month: e
          });
        };
        const changeMonth = (e: any) => {
          console.log(e, 'mRadioChangemRadioChange');
          if (e.target.value == 5) {
            // if (e.target.value == 'otherMonth') {
            setDueDateForm(()=>{
                let a = {
                    ...dueDateForm,
                    otherMinuteVisible: false,
                    day: null,
                    week: null,
                    hour: null,
                    minute: null,
                    month: e.target.value,
                    otherHourVisible: false,
                    otherDayVisible: false,
                    otherWeekVisible: false,
                    otherMonthVisible: true
                  }
          handleOk(a)
          return a
            });
          } else {
            setDueDateForm(()=>{
                let a = {
                    ...dueDateForm,
                    otherMinuteVisible: false,
                    day: null,
                    week: null,
                    hour: null,
                    minute: null,
                    month: e.target.value,
                    otherHourVisible: false,
                    otherDayVisible: false,
                    otherWeekVisible: false,
                    otherMonthVisible: false
                  }
          handleOk(a)
          return a
            });
          }
        };
        /**
         * 初始化
         */
        useEffect(() => {
          if (value && typeof value == 'string') {
            initPageData();
          }
        }, [props.value]);
        /**
         * 初始化页面数据
         */
        function initPageData() {
          console.log(value,'valuevaluevaluevaluevaluevalue')
          var index = value.lastIndexOf("\/");
          let needValue = value.substring(index + 1,value.length);
          console.log(needValue,'needValueneedValueneedValueneedValue')
          if (needValue.includes('PT')) {
            let data1 = needValue.replace(/[^\d]/g, ' ');
            let data = Number(data1);
            console.log(data, 'dataaaaaaaaaaaaaaaaaaaaaa');
            console.log(typeof data, 'dataaaaaaaaaaaaaaaaaaaaaa');
            if (needValue.includes('M')) {
              if (data == 5 || data == 10 || data == 30 || data == 50) {
                console.log(durationRef, '进入');
                console.log(form, '进入');
                setDueDateForm({
                  hourEnum: ['4', '8', '12', '24'],
                  minute: data,
                  hour: null,
                  day: null,
                  commonEnum: ['1', '2', '3', '4'],
                  minuteEnum: ['5', '10', '30', '50'],
                  week: null,
                  month: null,
                  otherHour: 1,
                  otherDay: 5,
                  otherWeek: 5,
                  otherMonth: 5,
                  otherMinute: 1,
                  otherHourVisible: false,
                  otherDayVisible: false,
                  otherWeekVisible: false,
                  otherMonthVisible: false,
                  otherMinuteVisible: false
                });
              } else {
                setDueDateForm({
                  hourEnum: ['4', '8', '12', '24'],
                  minute: data,
                  hour: null,
                  day: null,
                  commonEnum: ['1', '2', '3', '4'],
                  minuteEnum: ['5', '10', '30', '50'],
                  week: null,
                  month: null,
                  otherHour: 1,
                  otherDay: 5,
                  otherWeek: 5,
                  otherMonth: 5,
                  otherMinute: 1,
                  otherHourVisible: false,
                  otherDayVisible: false,
                  otherWeekVisible: false,
                  otherMonthVisible: false,
                  otherMinuteVisible: true
                });
              }
            } else if (needValue.includes('H')) {
              if (data == 4 || data == 8 || data == 12 || data == 24) {
                console.log(durationRef, '进入');
                console.log(form, '进入');
                setDueDateForm({
                  hourEnum: ['4', '8', '12', '24'],
                  day: null,
                  commonEnum: ['1', '2', '3', '4'],
                  minuteEnum: ['5', '10', '30', '50'],
                  week: null,
                  month: null,
                  minute: null,
                  otherHour: 1,
                  otherDay: 5,
                  otherWeek: 5,
                  otherMonth: 5,
                  otherMinute: 1,
                  otherHourVisible: false,
                  otherDayVisible: false,
                  otherWeekVisible: false,
                  otherMonthVisible: false,
                  otherMinuteVisible: false,
                  hour: data
                });
              } else {
                setDueDateForm({
                  hourEnum: ['4', '8', '12', '24'],
                  day: null,
                  commonEnum: ['1', '2', '3', '4'],
                  minuteEnum: ['5', '10', '30', '50'],
                  week: null,
                  month: null,
                  minute: null,
                  otherHour: 1,
                  otherDay: 5,
                  otherWeek: 5,
                  otherMonth: 5,
                  otherMinute: 1,
                  otherHourVisible: true,
                  otherDayVisible: false,
                  otherWeekVisible: false,
                  otherMonthVisible: false,
                  otherMinuteVisible: false,
                  hour: data
                });
              }
            }
          } else {
            let data = needValue.replace(/[^\d]/g, ' ');
            let needData1 = data.slice(0, -1);
            let needData = Number(needData1);
            console.log(needData, '获取的值');
            console.log(typeof needData, '获取的值的类型');
            if (needValue.includes('D')) {
              if (needData == 1 || needData == 2 || needData == 3 || needData == 4) {
                setDueDateForm({
                  hourEnum: ['4', '8', '12', '24'],
                  hour: null,
                  day: needData,
                  commonEnum: ['1', '2', '3', '4'],
                  minuteEnum: ['5', '10', '30', '50'],
                  week: null,
                  month: null,
                  minute: null,
                  otherHour: 1,
                  otherDay: 5,
                  otherWeek: 5,
                  otherMonth: 5,
                  otherMinute: 1,
                  otherHourVisible: false,
                  otherDayVisible: false,
                  otherWeekVisible: false,
                  otherMonthVisible: false,
                  otherMinuteVisible: false
                });
              } else {
                setDueDateForm({
                  hourEnum: ['4', '8', '12', '24'],
                  hour: null,
                  day: needData,
                  commonEnum: ['1', '2', '3', '4'],
                  minuteEnum: ['5', '10', '30', '50'],
                  week: null,
                  month: null,
                  minute: null,
                  otherHour: 1,
                  otherDay: 5,
                  otherWeek: 5,
                  otherMonth: 5,
                  otherMinute: 1,
                  otherHourVisible: false,
                  otherDayVisible: true,
                  otherWeekVisible: false,
                  otherMonthVisible: false,
                  otherMinuteVisible: false
                });
              }
            } else if (needValue.includes('W')) {
              if (needData == 1 || needData == 2 || needData == 3 || needData == 4) {
                setDueDateForm({
                  hourEnum: ['4', '8', '12', '24'],
                  hour: null,
                  day: null,
                  commonEnum: ['1', '2', '3', '4'],
                  minuteEnum: ['5', '10', '30', '50'],
                  week: needData,
                  month: null,
                  minute: null,
                  otherHour: 1,
                  otherDay: 5,
                  otherWeek: 5,
                  otherMonth: 5,
                  otherMinute: 1,
                  otherHourVisible: false,
                  otherDayVisible: false,
                  otherWeekVisible: false,
                  otherMonthVisible: false,
                  otherMinuteVisible: false
                });
              } else {
                setDueDateForm({
                  hourEnum: ['4', '8', '12', '24'],
                  hour: null,
                  day: null,
                  commonEnum: ['1', '2', '3', '4'],
                  minuteEnum: ['5', '10', '30', '50'],
                  week: needData,
                  month: null,
                  minute: null,
                  otherHour: 1,
                  otherDay: 5,
                  otherWeek: 5,
                  otherMonth: 5,
                  otherMinute: 1,
                  otherHourVisible: false,
                  otherDayVisible: false,
                  otherWeekVisible: true,
                  otherMonthVisible: false,
                  otherMinuteVisible: false
                });
              }
            } else if (needValue.includes('M')) {
              if (needData == 1 || needData == 2 || needData == 3 || needData == 4) {
                setDueDateForm({
                  hourEnum: ['4', '8', '12', '24'],
                  hour: null,
                  day: null,
                  commonEnum: ['1', '2', '3', '4'],
                  minuteEnum: ['5', '10', '30', '50'],
                  week: null,
                  month: needData,
                  minute: null,
                  otherHour: 1,
                  otherDay: 5,
                  otherWeek: 5,
                  otherMonth: 5,
                  otherMinute: 1,
                  otherHourVisible: false,
                  otherDayVisible: false,
                  otherWeekVisible: false,
                  otherMonthVisible: false,
                  otherMinuteVisible: false
                });
              } else {
                setDueDateForm({
                  hourEnum: ['4', '8', '12', '24'],
                  hour: null,
                  day: null,
                  commonEnum: ['1', '2', '3', '4'],
                  minuteEnum: ['5', '10', '30', '50'],
                  week: null,
                  month: needData,
                  minute: null,
                  otherHour: 1,
                  otherDay: 5,
                  otherWeek: 5,
                  otherMonth: 5,
                  otherMinute: 1,
                  otherHourVisible: false,
                  otherDayVisible: false,
                  otherWeekVisible: false,
                  otherMonthVisible: true,
                  otherMinuteVisible: false
                });
              }
            }
          }
        }
        return (
          <>
              {/* <Form
                          form={form}
                          name="basic"
                          labelCol={{ span: 4 }}
                          wrapperCol={{ span: 24 }}
                          ref={durationRef}
                      // initialValues={{ remember: true,...dueDateForm}}
                      // autoComplete="off"
                      >
                          <Form.Item<FieldType> 
                              label="分钟："
                              name="minute" >*/}
              {/* <Radio.Group onChange={changeMinute} buttonStyle="solid"> */}
              {/* <Radio.Group value={dueDateForm.minute} onChange={changeMinute} buttonStyle="solid"> */}
              <div style={{padding: '10px'}}>
                <Row gutter={16}>
                  <Col className="gutter-row" span={4}>
                    分钟：
                  </Col>
                  <Col className="gutter-row" span={20}>
                    <Radio.Group
                      value={dueDateForm.minute}
                      defaultValue={5}
                      onChange={changeMinute}
                      buttonStyle="solid"
                    >
                      <Radio.Button value={5}>5</Radio.Button>
                      <Radio.Button value={10}>10</Radio.Button>
                      <Radio.Button value={30}>30</Radio.Button>
                      <Radio.Button value={50}>50</Radio.Button>
                      <Radio.Button value={dueDateForm.otherMinute}>
                        自定义
                      </Radio.Button>
                      {/* <Radio.Button value={'otherMinute'}>自定义</Radio.Button> */}
                      {dueDateForm.otherMinuteVisible && (
                        <InputNumber
                          min={1}
                          max={999}
                          defaultValue={1}
                          value={dueDateForm.otherMinute}
                          onChange={minuteOnChange}
                        />
                      )}
                    </Radio.Group>
                  </Col>
                </Row>
              </div>
              {/* </Form.Item>
                          <Form.Item<FieldType>
                              label="小时："
                              name="hour" > */}
              <div style={{padding: '10px'}}>
                <Row gutter={[16, 24]}>
                  <Col className="gutter-row" span={4}>
                    小时：
                  </Col>
                  <Col className="gutter-row" span={20}>
                    <Radio.Group
                      value={dueDateForm.hour}
                      onChange={changeHour}
                      buttonStyle="solid"
                    >
                      <Radio.Button value={4}>4</Radio.Button>
                      <Radio.Button value={8}>8</Radio.Button>
                      <Radio.Button value={12}>12</Radio.Button>
                      <Radio.Button value={24}>24</Radio.Button>
                      <Radio.Button value={dueDateForm.otherHour}>
                        自定义
                      </Radio.Button>
                      {/* <Radio.Button value="otherHour">自定义</Radio.Button> */}
                      {dueDateForm.otherHourVisible && (
                        <InputNumber
                          min={1}
                          max={999}
                          defaultValue={1}
                          value={dueDateForm.otherHour}
                          onChange={hourOnChange}
                        />
                      )}
                    </Radio.Group>
                  </Col>
                </Row>
              </div>
      
              {/* </Form.Item>
                          <Form.Item<FieldType>
                              label="天："
                              name="day" > */}
              <div style={{padding: '10px'}}>
                <Row gutter={[16, 24]}>
                  <Col className="gutter-row" span={4}>
                    天：
                  </Col>
                  <Col className="gutter-row" span={20}>
                    <Radio.Group
                      value={dueDateForm.day}
                      onChange={changeDay}
                      buttonStyle="solid"
                    >
                      <Radio.Button value={1}>1</Radio.Button>
                      <Radio.Button value={2}>2</Radio.Button>
                      <Radio.Button value={3}>3</Radio.Button>
                      <Radio.Button value={4}>4</Radio.Button>
                      <Radio.Button value={dueDateForm.otherDay}>自定义</Radio.Button>
                      {/* <Radio.Button value={'otherDay'}>自定义</Radio.Button> */}
                      {dueDateForm.otherDayVisible && (
                        <InputNumber
                          min={5}
                          max={999}
                          defaultValue={1}
                          value={dueDateForm.otherDay}
                          onChange={dayOnChange}
                        />
                      )}
                    </Radio.Group>
                  </Col>
                </Row>
              </div>
              {/* </Form.Item>
                          <Form.Item<FieldType>
                              label="周："
                              name="week" > */}
              <div style={{padding: '10px'}}>
                <Row gutter={[16, 24]}>
                  <Col className="gutter-row" span={4}>
                    周：
                  </Col>
                  <Col className="gutter-row" span={20}>
                    <Radio.Group
                      value={dueDateForm.week}
                      onChange={changeWeek}
                      buttonStyle="solid"
                    >
                      <Radio.Button value={1}>1</Radio.Button>
                      <Radio.Button value={2}>2</Radio.Button>
                      <Radio.Button value={3}>3</Radio.Button>
                      <Radio.Button value={4}>4</Radio.Button>
                      <Radio.Button value={dueDateForm.otherWeek}>
                        自定义
                      </Radio.Button>
                      {/* <Radio.Button value={'otherWeek'}>自定义</Radio.Button> */}
                      {dueDateForm.otherWeekVisible && (
                        <InputNumber
                          min={5}
                          max={999}
                          defaultValue={1}
                          value={dueDateForm.otherWeek}
                          onChange={weekOnChange}
                        />
                      )}
                    </Radio.Group>
                  </Col>
                </Row>
              </div>
              {/* </Form.Item>
                          <Form.Item<FieldType>
                              label="月："
                              name="month" > */}
              <div style={{padding: '10px'}}>
                <Row gutter={[16, 24]}>
                  <Col className="gutter-row" span={4}>
                    月：
                  </Col>
                  <Col className="gutter-row" span={20}>
                    <Radio.Group
                      value={dueDateForm.month}
                      onChange={changeMonth}
                      buttonStyle="solid"
                    >
                      <Radio.Button value={1}>1</Radio.Button>
                      <Radio.Button value={2}>2</Radio.Button>
                      <Radio.Button value={3}>3</Radio.Button>
                      <Radio.Button value={4}>4</Radio.Button>
                      <Radio.Button value={dueDateForm.otherMonth}>
                        自定义
                      </Radio.Button>
                      {/* <Radio.Button value={'otherMonth'}>自定义</Radio.Button> */}
                      {dueDateForm.otherMonthVisible && (
                        <InputNumber
                          min={5}
                          max={999}
                          defaultValue={1}
                          value={dueDateForm.otherMonth}
                          onChange={monthOnChange}
                        />
                      )}
                    </Radio.Group>
                  </Col>
                </Row>
              </div>
          </>
        );
      }