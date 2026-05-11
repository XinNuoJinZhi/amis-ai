import React, {useEffect, useRef, useState} from 'react';
import {Modal, Radio, message} from 'antd';
import CronInput from './components/cron-input';
export default function TimeCycle(props: any) {
  console.log(props, '表单propspropspropspropspropsprops');
  const {cycleShow, show} = props;
  const [groupValue, setValue1] = useState(1); // 第一个Radio.Group的选中状态
  const [cronValue, setCronValue] = useState(props.value);
  const timeValue = useRef(props.value == '' ? '' : props.value);
  const cronRef = useRef(null);
  useEffect(() => {
    console.log(props, '2222222222');
    // if (
    //   !props?.value.dueDate &&
    //   !props?.value.includes(' ') &&
    //   props?.value != ''
    // ) {
    //   setValue1(2);
    //   let timeData = [];
    //   let data = props.value.split('/');
    //   console.log(data, '回显的数据');
    //   var reg1 = new RegExp('R', 'g'); // 加'g'，删除字符串里所有的"a"
    //   let data1 = {type: 'number', value: Number(data[0].replace(reg1, ''))};
    //   let data2 = {type: 'timeDate', value: data[1]};
    //   let data3 = {type: 'moreTime', value: data[2]};
    //   timeData = [data1, data2, data3];
    //   console.log(timeData, 'timeDatatimeDatatimeDatatimeDatatimeData');
    //   timeValue.current = timeData;
    //   setCronValue(props.value);
    //   // timeValue.current=props.value
    // } else {
      setValue1(1);
    // }
  },[])
  useEffect(() => {
    console.log(props, '11111111111111111');
    // if (
    //   !props?.value.dueDate &&
    //   !props?.value.includes(' ') &&
    //   props?.value != ''
    // ) {
    //   setValue1(2);
    //   let timeData = [];
    //   let data = props.value.split('/');
    //   console.log(data, '回显的数据');
    //   var reg1 = new RegExp('R', 'g'); // 加'g'，删除字符串里所有的"a"
    //   let data1 = {type: 'number', value: Number(data[0].replace(reg1, ''))};
    //   let data2 = {type: 'timeDate', value: data[1]};
    //   let data3 = {type: 'moreTime', value: data[2]};
    //   timeData = [data1, data2, data3];
    //   console.log(timeData, 'timeDatatimeDatatimeDatatimeDatatimeData');
    //   timeValue.current = timeData;
    //   setCronValue(props.value);
    //   // timeValue.current=props.value
    // } else {
      setValue1(1);
    // }
  }, [props.value]);
  const handleChange = (e: any) => {
    console.log(e, 'eeeeeeeeeeeeee');
    setValue1(e.target.value); // 更新第一个Radio.Group的选中状态
  };
  const handleOk = () => {
    console.log('handleOk');
    if (groupValue == 2) {
      console.log(timeValue, 'timeValuetimeValuetimeValue');
      if (timeValue.current != '') {
        let xun = timeValue.current.filter(element => {
          return element.type == 'number';
        });
        let dateTime = timeValue.current.filter(element => {
          return element.type == 'timeDate';
        });
        let moreTime = timeValue.current.filter(element => {
          return element.type == 'moreTime';
        });
        console.log(xun, 'xunxunxun');
        console.log(dateTime, 'dateTimedateTimedateTime');
        console.log(moreTime, 'moreTimemoreTimemoreTime');
        if (xun.length == 0) {
          timeValue.current = [
            ...timeValue.current,
            {type: 'number', value: 1}
          ];
        }
        let lastData;
        let lastData1;
        let lastData2;
        let lastData3;
        timeValue.current.forEach(element => {
          if (element.type == 'number') {
            lastData1 = element.value;
          }
          // if(element.type=='timeDate'){
          //   lastData2 = element.value
          // }
          if (element.type == 'moreTime') {
            lastData3 = element.value;
          }
        });
        lastData = 'R' + lastData1 + '/' + lastData3;
        // lastData = 'R' + lastData1 + '/' + lastData2 + '/' + lastData3
        props.cycleChange({
          dueDate: lastData,
          type: 'flowable:TimeCycle',
          typeId: 2
        });
        cycleShow(false);
      } else {
        message.error('请填写具体循环时间！');
      }
    } else {
      props.cycleChange({
        dueDate: cronValue,
        type: 'flowable:TimeCycle',
        typeId: 2
      });
      cycleShow(false);
    }
  };
  const handleCancel = () => {
    console.log('handleCancel');
    console.log(cronRef, 'cronRef');
    cycleShow(false);
    cronRef.current?.closePopover();
  };
  // cron组件改变
  const cronChanges = e => {
    console.log(e, 'eeeeeeeeeeeeeee');
    setCronValue(e);
  };
  // cron组件右侧按钮点击
  const cronResets = e => {
    console.log(e, 'eeeeeeeeeeeeeee');
  };
  // 标准格式时间
  const timeChanges = e => {
    console.log(e, '标准时间值变化');
    console.log(props, '已经存在的数据');
    if (e.type == 'number') {
      timeValue.current = [
        ...timeValue.current,
        {type: e.type, value: e.value}
      ];
    } else if (e.type == 'timeDate') {
      timeValue.current = [
        ...timeValue.current,
        {type: e.type, value: e.value}
      ];
    } else if (e.type == 'moreTime') {
      timeValue.current = [
        ...timeValue.current,
        {type: e.type, value: e.value}
      ];
    }
  };
  return (
    <>
      <Modal
        title="循环时间配置"
        open={show}
        onOk={handleOk}
        onCancel={handleCancel}
        cancelText="取 消"
        okText="确 定"
        maskClosable={false}
      >
        {groupValue == 1 && (
          <div>
            <CronInput
              ref={cronRef}
              value={props.value}
              size="size"
              cronChange={cronChanges}
              cronReset={cronResets}
            />
          </div>
        )}
      </Modal>
    </>
  );
}
