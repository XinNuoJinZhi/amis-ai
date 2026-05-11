// import Cron from './cron'
import React, {useEffect, useRef, useState,forwardRef,useImperativeHandle} from 'react';
import {DEFAULT_CRON_EXPRESSION} from '../constant/filed';
import {Popover, Button, message, Input, Select, Space} from 'antd';
import {ReloadOutlined} from '@ant-design/icons';
import Cron from 'qnn-react-cron';
import './index.css';
const CronInput = forwardRef(function CronInput(props, ref) {

  console.log(props, 'propsssssssssssssss');
  // const cron_ = useRef('')
  const [cron_, setCron_] = useState(props.value);
  const [propverShow, setPropverShow] = useState(false);
  const {value} = props;
  const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    console.log(props, 'cron-input props');
    console.log(value, 'cron-input Value');
    setCron(value);
  }, [value]);
  useEffect(() => {
    setCron(value);
  }, []);
  const setCron = (newValue: any) => {
    console.log(newValue, '格式不正确，必须有6或7位');
    if (!newValue || newValue.trim().length < 11) {
      messageApi.open({
        type: 'error',
        content: '格式不正确，必须有6或7位'
      });
      return;
    }
    // cron_.current = newValue
    // setCron_(newValue)
  };
  let cronRef: any;
  const cronChange = (cron: any) => {
    // console.log(cron,'cron-input回显')
    // console.log(cronRef.getValue(),'cronRef')
    // cron_.current = cron
    setCron_(cronRef.getValue());
    props.cronChange(cronRef.getValue());
    setPropverShow(false);
  };
  const cronReset = () => {
    props.cronReset(value);
    setPropverShow(true);
  };
  const footerData = (
    <>
      <Button
        type="primary"
        onClick={() => {
          let a = cronRef.getValue().split(' ');
          if (a[3] == a[5]) {
            message.error('日和周不能同时为不指定');
            return;
          }
          setCron_(cronRef.getValue()), cronChange(cron_);
        }}
      >
        生成
      </Button>
    </>
  );
  const inputClick = () => {
    setPropverShow(true);
  };
  const content = (
    <div>
      {/* <Cron value={cron_} size={props.size} change={cronChange} /> */}
      <Cron
        value={cron_}
        getCronFns={fns => (cronRef = fns)}
        // onOk={cronChange}
        // 自定义底部按钮后需要自行调用方法来或者值
        footer={footerData}
      />
    </div>
  );
  const closePopover = () => {
    setPropverShow(false);
  };
  useImperativeHandle(ref, () => ({
    closePopover: () => closePopover(),
  }))
  return (
    <>
      <Popover
        content={content}
        visible={propverShow}
        placement="bottom"
        trigger="click"
      >
        <Space.Compact style={{width: '100%'}}>
          <Input
            value={cron_}
            defaultValue={cron_}
            onClick={inputClick}
            placeholder="Cron表达式"
            size={props.size}
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={cronReset}
          ></Button>
        </Space.Compact>
      </Popover>
    </>
  );
});
export default CronInput;