import React, {useEffect, useRef, useState, forwardRef} from 'react';
import {Modal, Radio, message, InputNumber, Checkbox} from 'antd';
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;
interface monthVueProps {
  type?: string;
  cycle?: any;
  loop?: any;
  appoint?: any;
  result?: string;
}
const monthVue = forwardRef(function monthVue(props: any, ref) {
  const {lable} = props;
  interface Props {
    type?: string;
    cycle?: any;
    loop?: any;
    appoint?: any;
    result?: string;
  }
  // const props = withDefaults(defineProps<Props>(), {
  //   type: '1', // 类型
  //   // 周期
  //   cycle: {
  //     start: 1,
  //     end: 2
  //   },
  //   // 循环
  //   loop: {
  //     start: 1,
  //     end: 1
  //   },
  //   // 指定月份
  //   appoint: [],
  //   // 月份结果
  //   result: ''
  // })
  // const emit = defineEmits(['month']);
  const [type, setType] = useState();
  const [appoint, setAppoint] = useState();
  const [result, setResult] = useState();
  const [cycle, setCycle] = useState({
    start: 1,
    end: 2
  });
  const [loop, setLoop] = useState({
    start: 1,
    end: 1
  });

  // 当前选择项
  const getValue = e => {
    setType(e.target.value);
    let emitResule = '';
    // 清空指定月份的选择项
    setAppoint([]);
    if (e.target.value == -1) {
      // 不指定 月份
      setResult('?');
      emitResule = '?';
    } else if (e.target.value == 1) {
      // 指定每月
      setResult('*');
      emitResule = '*';
    } else if (e.target.value == 2) {
      // 指定月份周期
      setResult(cycle.start + '-' + cycle.end);
      emitResule = cycle.start + '-' + cycle.end;
    } else if (e.target.value == 3) {
      // 指定循环周期
      setResult(loop.start + '/' + loop.end);
      emitResule = loop.start + '/' + loop.end;
    } else {
      setAppoint([1]);
      setResult([1].join(','));
      emitResule = [1].join(',');
      // setResult(appoint.join(','))
    }
    console.log('月result', result);
    props.month(emitResule);
  };
  // 选择月份周期
  const getChangeMonth = e => {
    setType(2);
    setCycle({
      ...cycle,
      start: e
    });
    setResult(e + '-' + cycle.end);
    console.log('月result', result);
    props.month(e + '-' + cycle.end);
    // 清空指定状态
    setAppoint([]);
  };
  // 选择月份周期
  const getChangeMonths = e => {
    setType(2);
    setCycle({
      ...cycle,
      end: e
    });
    setResult(cycle.start + '-' + e);
    console.log('月result', result);
    props.month(cycle.start + '-' + e);
    // 清空指定状态
    setAppoint([]);
  };
  // 选择月份循环
  const getLoopMonth = e => {
    setType(3);
    setLoop({
      ...loop,
      start: e
    });
    setResult(e + '/' + loop.end);
    console.log('月result', result);
    props.month(e + '/' + loop.end);
    // 清空指定状态
    setAppoint([]);
  };
  // 选择月份循环
  const getLoopMonths = e => {
    setType(3);
    setLoop({
      ...loop,
      end: e
    });
    setResult(loop.start + '/' + e);
    console.log('月result', result);
    props.month(loop.start + '/' + e);
    // 清空指定状态
    setAppoint([]);
  };
  // 选择指定月份
  const getAppointMonth = e => {
    setAppoint(e);
    setType(4);
    let returnData = e
      .sort((a, b) => {
        return a - b;
      })
      .join(',');
    if (returnData.length == 0) {
      returnData = [1];
    }
    setResult(returnData);
    console.log('月result', result);
    props.month(returnData);
  };
  useEffect(() => {
    setType(props.type ? props.type : 1);
    setCycle(
      props.cycle
        ? props.cycle
        : {
            start: 1,
            end: 2
          }
    );
    setLoop(
      props.loop
        ? props.loop
        : {
            start: 1,
            end: 1
          }
    );
    setAppoint(props.appoint ? props.appoint : []);
    setResult(props.result ? props.result : '');
  }, [props.key]);
  const items = Array.from({length: 12}, (_, index) => index + 1);
  return (
    <>
      <div className="month-box">
        <RadioGroup value={type} onChange={getValue}>
          {/* // <!-- 每月 --> */}
          <div className="box-bottom">
            <Radio value={1}>每月</Radio>
          </div>
          <div className="box-bottom">
            <Radio value={-1}>不指定</Radio>
          </div>
          {/* <!-- 周期 --> */}
          <div className="cycle box-bottom">
            <Radio value={2}>周期</Radio>
            <span style={{marginRight: '8px'}}>从</span>
            <InputNumber
              onChange={getChangeMonth}
              value={cycle.start}
              defaultValue={cycle.start}
              min={1}
              max={11}
              style={{width: '100px'}}
            />
            <span style={{margin: '0 8px'}}>至</span>
            <InputNumber
              onChange={getChangeMonths}
              value={cycle.end}
              defaultValue={cycle.end}
              min={parseInt(cycle.start + 1)}
              max={12}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '8px'}}>月</span>
          </div>
          {/* <!-- 循环 --> */}
          <div className="cycle box-bottom">
            <Radio value={3}>循环</Radio>
            <span style={{marginRight: '8px'}}>从</span>
            <InputNumber
              onChange={getLoopMonth}
              value={loop.start}
              defaultValue={loop.start}
              min={1}
              max={12}
              style={{width: '100px'}}
            />
            <span style={{margin: '0 8px'}}>月开始，每</span>
            <InputNumber
              onChange={getLoopMonths}
              value={loop.end}
              defaultValue={loop.end}
              min={1}
              max={12}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '8px'}}>月执行一次</span>
          </div>
          {/* <!-- 指定 --> */}
          <div className="box-bottom">
            <Radio value={4}>指定</Radio>
          </div>
          <div>
            <CheckboxGroup
              value={appoint}
              className="second-minute-chekck-group"
              onChange={getAppointMonth}
            >
              {items.map(j => {
                return (
                  <Checkbox key={j} value={j}>
                    {j}
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
export default monthVue;
