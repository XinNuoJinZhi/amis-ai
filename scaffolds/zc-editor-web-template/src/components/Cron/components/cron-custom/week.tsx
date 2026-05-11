import React, {useEffect, useRef, useState, forwardRef} from 'react';
import {Modal, Radio, message, InputNumber, Checkbox} from 'antd';
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;
interface weekVueProps {
  type: string;
  cycle: any;
  loop: any;
  week: any;
  last: any;
  appoint: any;
}
const weekVue = forwardRef(function weekVue(props: any, ref) {
  // const props = withDefaults(defineProps<Props>(), {
  //   type: '1', // 类型
  //   cycle: {
  //     // 周期
  //     start: 0,
  //     end: 0
  //   },
  //   loop: {
  //     // 循环
  //     start: 0,
  //     end: 0
  //   },
  //   week: {
  //     // 指定周
  //     start: 0,
  //     end: 0
  //   },
  //   last: 0,
  //   appoint: [] // 指定
  // })
  // const emit = defineEmits(['week']);
  const [type, setType] = useState(1);
  const [cycle, setCycle] = useState({
    start: 1,
    end: 2
  });
  const [loop, setLoop] = useState({
    start: 1,
    end: 1
  });
  const [week, setWeek] = useState({
    start: 1,
    end: 1
  });
  const [last, setLast] = useState(1);
  const [appoint, setAppoint] = useState();
  const [result, setResult] = useState();
  // 周- 周期
  const getChangeWeek = e => {
    setType(2);
    setCycle({
      ...cycle,
      start: e
    });
    setResult(e + '-' + cycle.end);
    props.weekChange(e + '-' + cycle.end);
    // 清空指定状态
    setAppoint([]);
  };
  // 周- 周期
  const getChangeWeeks = e => {
    setType(2);
    setCycle({
      ...cycle,
      end: e
    });
    setResult(cycle.start + '-' + e);
    props.weekChange(cycle.start + '-' + e);
    // 清空指定状态
    setAppoint([]);
  };
  // 周- 循环-指定本月第几周星期几开始
  const getLoopWeek = e => {
    setType(3);
    setLoop({
      ...loop,
      start: e
    });
    setResult(e + '/' + loop.end);
    props.weekChange(e + '/' + loop.end);
    // 清空指定状态
    asetAppoint([]);
  };
  // 周- 循环-指定本月第几周星期几开始
  const getLoopWeeks = e => {
    setType(3);
    setLoop({
      ...loop,
      end: e
    });
    setResult(loop.start + '/' + e);
    props.weekChange(loop.start + '/' + e);
    // 清空指定状态
    asetAppoint([]);
  };
  // 指定周 指定本月第几周
  const getWeek = e => {
    setType(7);
    setWeek({
      ...week,
      start: e
    });
    setResult(e + '#' + week.end);
    props.weekChange(e + '#' + week.end);
    // 清空指定状态
    setAppoint([]);
  };
  // 指定周 指定本月第几周
  const getWeeks = e => {
    setType(7);
    setWeek({
      ...week,
      end: e
    });
    setResult(week.start + '#' + e);
    props.weekChange(week.start + '#' + e);
    // 清空指定状态
    setAppoint([]);
  };
  // 周-月末星期几
  const getlastWeek = e => {
    setType(6);
    setLast(e);
    setResult(e + 'L');
    props.weekChange(e + 'L');
    // 清空指定状态
    setAppoint([]);
  };
  // 周-指定日期
  const getAppointWeek = e => {
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
    props.weekChange(returnData);
  };
  // 选择
  const getValue = e => {
    // appoint.value = []
    setType(e.target.value);
    let emitResule = '';
    if (e.target.value == 1) {
      setResult('*');
      emitResule = '*';
    } else if (e.target.value == 2) {
      setResult(cycle.start + '-' + cycle.end);
      emitResule = cycle.start + '-' + cycle.end;
    } else if (e.target.value == 3) {
      // 指定日-循环
      setResult(loop.start + '/' + loop.end);
      emitResule = loop.start + '/' + loop.end;
    } else if (e.target.value == 7) {
      setResult(week.start + '#' + week.end);
      emitResule = week.start + '#' + week.end;
    } else if (e.target.value == 6) {
      setResult(last + 'L');
      emitResule = last + 'L';
    } else if (e.target.value == 4) {
      setResult(appoint.join(','));
      emitResule = appoint.join(',');
    } else {
      setResult('?');
      emitResule = '?';
    }
    props.weekChange(emitResule);
  };

  useEffect(() => {
    console.log(props, 'props周');
    setType(props.type ? Number(props.type) : 1);
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
    setWeek(
      props.week
        ? props.week
        : {
            start: 1,
            end: 1
          }
    );
    setLast(props.last ? props.last : 1);
    setAppoint(props.appoint ? props.appoint : []);
  }, [props.key]);
  const items = Array.from({length: 7}, (_, index) => index + 1);
  return (
    <>
      <div className="day-and-week-box">
        <RadioGroup value={type} onChange={getValue}>
          <div className="box-bottom">
            <Radio value={1}>每周</Radio>
          </div>
          <div className="box-bottom">
            <Radio value={-1}>不指定</Radio>
          </div>
          <div className="box-bottom cycle">
            <Radio value={2}>周期</Radio>
            <span style={{marginLeft: '10px', marginRight: '5px'}}>从星期</span>
            <InputNumber
              onChange={getChangeWeek}
              value={cycle.start}
              defaultValue={cycle.start}
              min={1}
              max={7}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '5px', marginRight: '5px'}}>至星期</span>
            <InputNumber
              onChange={getChangeWeeks}
              value={cycle.end}
              defaultValue={cycle.end}
              min={2}
              max={7}
              style={{width: '100px'}}
            />
          </div>
          <div className="box-bottom cycle">
            <Radio value={3}>循环</Radio>
            <span style={{marginLeft: '10px', marginRight: '5px'}}>从星期</span>
            <InputNumber
              onChange={getLoopWeek}
              value={loop.start}
              defaultValue={loop.start}
              min={1}
              max={7}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '5px', marginRight: '5px'}}>
              开始，每
            </span>
            <InputNumber
              onChange={getLoopWeeks}
              value={loop.end}
              defaultValue={loop.end}
              min={1}
              max={7}
              style={{width: '100px'}}
            />
            天执行一次
          </div>
          <div className="box-bottom cycle">
            <Radio value={7}>指定周</Radio>
            <span style={{marginLeft: '10px', marginRight: '5px'}}>本月第</span>
            <InputNumber
              onChange={getWeek}
              value={week.start}
              defaultValue={week.start}
              min={1}
              max={4}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '5px', marginRight: '5px'}}>
              周，星期
            </span>
            <InputNumber
              onChange={getWeeks}
              value={week.end}
              defaultValue={week.end}
              min={1}
              max={7}
              style={{width: '100px'}}
            />
          </div>
          <div className="box-bottom cycle">
            <Radio value={6}>本月最后一个</Radio>
            <span style={{marginLeft: '10px', marginRight: '5px'}}>星期</span>
            <InputNumber
              onChange={getlastWeek}
              value={last}
              defaultValue={last}
              min={1}
              max={7}
              style={{width: '100px'}}
            />
          </div>
          <div className="box-bottom cycle">
            <Radio value={4}>指定</Radio>
            <CheckboxGroup
              value={appoint}
              style={{marginLeft: '50px', lineHeight: '25px'}}
              className="second-minute-chekck-group"
              onChange={getAppointWeek}
            >
              {items.map(i => {
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
export default weekVue;
