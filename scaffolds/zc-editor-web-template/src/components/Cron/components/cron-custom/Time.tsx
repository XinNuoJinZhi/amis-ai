// <!-- 秒,分钟,小时通用组件 -->
import React, {useEffect, useRef, useState, forwardRef} from 'react';
import {Modal, Radio, message, InputNumber, Checkbox} from 'antd';
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;
interface TimeCycleProps {
  lable?: string; // 可选属性
  type?: string; // 可选属性
  cycle?: object; // 可选属性
  loop?: object; // 可选属性
  appoint?: Array; // 可选属性
  result?: string; // 可选属性
}
const TimeVue = forwardRef(function TimeVue(props: any, ref) {
  const {lable} = props;
  // const [props, setProps] = useState(props);
  // export default function TimeCycle(props: any) {
  // const {
  //   lable: '',
  //   // 根据传递进来的lable值决定数值,秒分为60,时24
  //   // appointNumber: props.lable == "时" ? 24 : 60,
  //   // 最大值
  //   // maxTime: lable.value == "时" ? 23 : 59,
  //   // 类型
  //   type: '1',
  //   // 周期
  //   cycle: {
  //     start: 0,
  //     end: 0
  //   },
  //   // 循环
  //   loop: {
  //     start: 0,
  //     end: 0
  //   },
  //   appoint: [], // 指定
  //   result: ''
  // } = props;
  // const emit = defineEmits(['time']);
  const shiItems = Array.from({length: 24}, (_, index) => index);
  const fenItems = Array.from({length: 60}, (_, index) => index);
  // 根据传递进来的lable值决定数值,秒分为60,时24
  const [appointNumber, setAppointNumber] = useState(
    props.lable == '时' ? shiItems : fenItems
  );
  // 最大值
  const [maxTime, setMaxTime] = useState(props.lable == '时' ? 23 : 59);
  // 类型
  const [type, setType] = useState('1');
  // 周期
  const [cycle, setCycle] = useState({
    start: 1,
    end: 2
  });
  // 循环
  const [loop, setLoop] = useState({
    start: 1,
    end: 1
  });
  const [appoint, setAppoint] = useState(); // 指定
  const [result, setResult] = useState('*');

  // 当前选择项
  const getValue = e => {
    console.log(e,'e');
    setType(e.target.value);
    let emitResule = ''
    // 清空指定的选择项
    setAppoint([]);
    if (e.target.value == 1) {
      // 指定每*
      setResult('*');
      emitResule='*'
    } else if (e.target.value == 2) {
      // 指定周期
      console.log(cycle,'cycle')
      setResult(cycle.start + '-' + cycle.end);
      emitResule = cycle.start + '-' + cycle.end;
    } else if (e.target.value == 3) {
      // 指定循环
      console.log(loop,'loop')
      setResult(loop.start + '/' + loop.end);
        emitResule=loop.start + '/' + loop.end;
    } else {
      // 指定日期-默认勾选0
      setAppoint([0]);
      console.log(appoint,'appoint')
      setResult(appoint.join(','));
      emitResule = 0;
    }
    console.log('result', result);
    props.time(emitResule);
  };
  // 选择周期
  const getChangeTime = (e) => {
    setType(2);
    setCycle({
      ...cycle,
      start: e
    });
    setResult(e + '-' + cycle.end);
    console.log('result', result);
    props.time(e + '-' + cycle.end);
    // 清空指定状态
    setAppoint([]);
  };
  // 选择周期
  const getChangeTimes = (e) => {
    setType(2);
    setCycle({
      ...cycle,
      end: e
    });
    setResult(cycle.start + '-' + e);
    console.log('result', result);
    props.time(cycle.start + '-' + e);
    // 清空指定状态
    setAppoint([]);
  };
  // 选择循环
  const getLoopTime = (e) => {
    setType(3);
    setLoop({
      ...loop,
      start: e
    });
    setResult(e + '/' + loop.end);
    console.log('result', result);
    props.time(e + '/' + loop.end);
    // 清空指定状态
    setAppoint([]);
  };
  // 选择循环
  const getLoopTimes = (e) => {
    setType(3);
    setLoop({
      ...loop,
      end: e
    });
    setResult(loop.start + '/' + e);
    console.log('result', result);
    props.time(loop.start + '/' + e);
    // 清空指定状态
    setAppoint([]);
  };
  // 选择指定
  const getAppointTime = (e) => {
    console.log(e,'eeeeee多选')
    setAppoint(e)
    setType(4);
    setResult(
      appoint
        .sort((a, b) => {
          return a - b;
        })
        .join(',')
    );
    console.log('result', result);
    let returnData = e.sort((a, b) => {
      return a - b;
    })
    .join(',')
    if(returnData.length==0){
      returnData=[0]
    }
    props.time(returnData);
  };
  useEffect(() => {
    console.log(props, 'props秒');
    setType(props.type?props.type:1);
    setCycle(props.cycle?props.cycle:{
      start: 1,
      end: 2
    });
    setLoop(props.loop?props.loop:{
      start: 1,
      end: 1
    });
    setAppoint(props.appoint?props.appoint:[]);
    setResult(props.result?props.result:'*');
  }, [props.key]);
  return (
    <>
      <div className="second-minute-hour-box">
        <RadioGroup value={type} onChange={getValue}>
          <div className="box-bottom">
            <Radio value={1}>
              每{lable}
            </Radio>
          </div>
          {/* <!-- 每个周期 --> */}
          <div className="box-bottom cycle">
            <Radio value={2}>
              周期
            </Radio>
            <span style={{marginRight: '8px'}}>从</span>
            <InputNumber
              onChange={getChangeTime}
              value={cycle?.start}
              defaultValue={cycle?.start}
              min={1}
              max={maxTime - 1}
              style={{width: '100px'}}
            />
            <span style={{margin: '0 8px'}}>至</span>
            <InputNumber
              onChange={getChangeTimes}
              value={cycle?.end}
              defaultValue={cycle?.end}
              min={parseInt(cycle?.start) + 1}
              max={maxTime}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '8px'}}>{lable}</span>
          </div>
          {/* <!-- 每个循环 --> */}
          <div className="box-bottom cycle">
            <Radio value={3}>
              循环
            </Radio>
            <span style={{marginRight: '8px'}}>从</span>
            <InputNumber
              onChange={getLoopTime}
              defaultValue={loop?.start}
              value={loop?.start}
              min={0}
              max={maxTime}
              style={{width: '100px'}}
            />
            <span style={{margin: '0 8px'}}>{lable}开始，每</span>
            <InputNumber
              onChange={getLoopTimes}
              value={loop?.end}
              min={1}
              max={maxTime}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '8px'}}>{lable}</span>
            执行一次
          </div>
          {/* <!-- 指定数 --> */}
          <div className="box-bottom">
            <Radio value={4}>
              指定
            </Radio>
          </div>
          <div>
            <CheckboxGroup
              value={appoint}
              className="second-minute-chekck-group"
              onChange={getAppointTime}
            >
                {appointNumber.map(i => {
                  return (
                    <Checkbox key={i} value={i}>
                      {i}
                    </Checkbox>
                  );
                })}
            </CheckboxGroup>
          </div>
        </RadioGroup>
      </div>
    </>
  );
});
export default TimeVue;