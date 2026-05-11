//   <!-- 由于日和周的选择会有冲突性，其中一个必然为? 因此将内容写到一个文件中 -->
import React, {useEffect, useRef, useState, forwardRef} from 'react';
import {Modal, Radio, message, InputNumber, Checkbox} from 'antd';
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;
interface DayProps {
  // 类型
  type?: string;
  // 日-周期
  dayCycle?: any;
  // 日-循环
  dayLoop?: any;
  // 日-指定
  appointDay?: any;
  // 日-工作日
  work?: any;
  // 周-周期
  weekCycle?: any;
  // 周-循环
  weekLoop?: any;
  // 周-月末星期几
  last?: any;
  // 周-指定
  appointWeek?: any;
  // 周-转义
  weekFormat?: any;
  // 结果
  result?: any;
}
const DayVue = forwardRef(function DayVue(props: any, ref) {
  const {lable} = props;
  // const emit = defineEmits(['day']);
  // const props = withDefaults(defineProps<Props>(), {
  //   // 类型
  //   type: '8',
  //   // 日-周期
  //   dayCycle: {
  //     start: 0,
  //     end: 0
  //   },
  //   // 日-循环
  //   dayLoop: {
  //     start: 0,
  //     end: 0
  //   },
  //   // 日-指定
  //   appointDay: [],
  //   // 日-工作日
  //   work: 1,
  //   // 周-周期
  //   weekCycle: {
  //     start: 0,
  //     end: 0
  //   },
  //   // 周-循环
  //   weekLoop: {
  //     start: 0,
  //     end: 0
  //   },
  //   // 周-月末星期几
  //   last: 1,
  //   // 周-指定
  //   appointWeek: [],
  //   // 周-转义
  //   weekFormat: {
  //     1: '天',
  //     2: '一',
  //     3: '二',
  //     4: '三',
  //     5: '四',
  //     6: '五',
  //     7: '六'
  //   },
  //   // 结果
  //   result: {
  //     day: '',
  //     week: ''
  //   }
  // })
  // 类型
  const [type, setType] = useState(8);
  // 日-周期
  const [dayCycle, setDayCycle] = useState({
    start: 1,
    end: 2
  });
  // 日-循环
  const [dayLoop, setDayLoop] = useState({
    start: 1,
    end: 1
  });
  // 日-指定
  const [appointDay, setAppointDay] = useState();
  // 日-工作日
  const [work, setWork] = useState(1);
  // 周-周期
  const [weekCycle, setWeekCycle] = useState({
    start: 1,
    end: 2
  });
  // 周-循环
  const [weekLoop, setWeekLoop] = useState({
    start: 1,
    end: 1
  });
  // 周-月末星期几
  const [last, setLast] = useState(1);
  // 周-指定
  const [appointWeek, setAppointWeek] = useState();
  // 周-转义
  const [weekFormat, setWeekFormat] = useState({
    1: '天',
    2: '一',
    3: '二',
    4: '三',
    5: '四',
    6: '五',
    7: '六'
  });
  // 结果
  const [result, setResult] = useState({
    day: '',
    week: ''
  });

  // 当前选项
  const getValue = e => {
    // 清空指定的选择项
    setAppointWeek([]);
    setAppointDay([]);
    setType(e.target.value);
    let emitResule = {};
    if (e.target.value == 1) {
      // 指定每天
      // 星期则为？
      setResult({...result, day: '*', week: '?'});
      emitResule = {...result, day: '*', week: '?'};
    } else if (e.target.value == 2) {
      // 指定日-周期
      // 星期则为？
      setResult({
        ...result,
        day: dayCycle.start + '-' + dayCycle.end,
        week: '?'
      });
      emitResule = {
        ...result,
        day: dayCycle.start + '-' + dayCycle.end,
        week: '?'
      };
    } else if (e.target.value == 3) {
      // 指定日-循环
      // 星期则为？
      setResult({
        ...result,
        day: dayLoop.start + '/' + dayLoop.end,
        week: '?'
      });
      emitResule = {
        ...result,
        day: dayLoop.start + '/' + dayLoop.end,
        week: '?'
      };
    } else if (e.target.value == 5) {
      // 指定工作日
      // 星期则为？
      setResult({...result, day: work + 'W', week: '?'});
      emitResule = {...result, day: work + 'W', week: '?'};
    } else if (e.target.value == 6) {
      // 月最后一天
      // 星期则为？
      setResult({...result, day: 'L', week: '?'});
      emitResule = {...result, day: 'L', week: '?'};
    } else if (e.target.value == 7) {
      // 月最后一个工作日
      // 星期则为？
      setResult({...result, day: 'LW', week: '?'});
      emitResule = {...result, day: 'LW', week: '?'};
    } else if (e.target.value == 4) {
      // 指定日期-默认勾选0
      // 星期则为？
      setAppointDay([1]);
      setResult({
        ...result,
        day: [1].join(','),
        // day:appointDay.join(','),
        week: '?'
      });
      emitResule = {
        ...result,
        day: [1].join(','),
        week: '?'
      };
    } else if (e.target.value == 11) {
      // 指定每周
      // 日则为？
      setResult({...result, week: '*', day: '?'});
      emitResule = {...result, week: '*', day: '?'};
    } else if (e.target.value == 12) {
      // 指定周-周期
      // 日则为？
      setResult({
        ...result,
        week: weekCycle.start + '-' + weekCycle.end,
        day: '?'
      });
      emitResule = {
        ...result,
        week: weekCycle.start + '-' + weekCycle.end,
        day: '?'
      };
    } else if (e.target.value == 13) {
      // 指定周-循环
      // 日则为？
      setResult({
        ...result,
        week: weekLoop.end + '#' + weekLoop.start,
        day: '?'
      });
      emitResule = {
        ...result,
        week: weekLoop.end + '#' + weekLoop.start,
        day: '?'
      };
    } else if (e.target.value == 15) {
      // 指定周-月末周几
      // 日则为？
      setResult({...result, week: last + 'L', day: '?'});
      emitResule = {...result, week: last + 'L', day: '?'};
    } else if (e.target.value == 14) {
      // 指定日期-默认勾选0
      // 日则为？
      setAppointWeek([1]);
      setResult({
        ...result,
        week: [1].join(','),
        // week:appointWeek.join(','),
        day: '?'
      });
      emitResule = {
        ...result,
        week: [1].join(','),
        day: '?'
      };
    } else if (e.target.value == 8) {
      setResult({...result, day: '?'});
      emitResule = {...result, day: '?'};
    } else {
      console.log('none');
    }
    props.day(emitResule);
  };
  // 日-周期
  const getChangeDay = e => {
    console.log(e, 'eeeee');
    setType(2);
    setDayCycle({
      ...dayCycle,
      start: e
    });
    setResult({
      ...result,
      day: e + '-' + dayCycle.end,
      week: '?'
    });
    props.day({
      ...result,
      day: e + '-' + dayCycle.end,
      week: '?'
    });
    // 清空指定状态
    setAppointWeek([]);
    setAppointDay([]);
  };
  // 日-周期
  const getChangeDays = e => {
    setType(2);
    setDayCycle({
      ...dayCycle,
      end: e
    });
    setResult({
      ...result,
      day: dayCycle.start + '-' + e,
      week: '?'
    });
    props.day({
      ...result,
      day: dayCycle.start + '-' + e,
      week: '?'
    });
    // 清空指定状态
    setAppointWeek([]);
    setAppointDay([]);
  };
  // 日-循环
  const getLoopDay = e => {
    setType(3);
    setDayLoop({
      ...dayLoop,
      start: e
    });
    setResult({
      ...setResult,
      day: e + '/' + dayLoop.end,
      week: '?'
    });
    // 清空指定状态
    setAppointWeek([]);
    setAppointDay([]);
  };
  // 日-循环
  const getLoopDays = e => {
    setType(3);
    setDayLoop({
      ...dayLoop,
      end: e
    });
    setResult({
      ...setResult,
      day: dayLoop.start + '/' + e,
      week: '?'
    });
    // 清空指定状态
    setAppointWeek([]);
    setAppointDay([]);
  };
  // 日-指定工作日
  const getworkDay = e => {
    setType(5);
    setWork(e);
    setResult({...result, day: e + 'W', week: '?'});
    props.day({...result, day: e + 'W', week: '?'});
    // 清空指定状态
    setAppointWeek([]);
    setAppointDay([]);
  };
  // 日-指定日期
  const getAppointDay = e => {
    setType(4);
    setAppointDay(e);
    setAppointWeek([]);
    let returnData = e
      .sort((a, b) => {
        return a - b;
      })
      .join(',');
    if (returnData.length == 0) {
      returnData = [1];
    }
    setResult({
      ...result,
      day: returnData,
      week: '?'
    });
    props.day({
      ...result,
      day: returnData,
      week: '?'
    });
  };
  useEffect(() => {
    console.log(props, 'props日');
    setType(props.type ? Number(props.type) : 8);
    setDayCycle(
      props.dayCycle
        ? props.dayCycle
        : {
            start: 1,
            end: 2
          }
    );
    setDayLoop(
      props.dayLoop
        ? props.dayLoop
        : {
            start: 1,
            end: 1
          }
    );
    setAppointDay(props.appointDay ? props.appointDay : '');
    setWork(props.work ? props.work : 1);
    setWeekCycle(
      props.weekCycle
        ? props.weekCycle
        : {
            start: 1,
            end: 2
          }
    );
    setWeekLoop(
      props.weekLoop
        ? props.weekLoop
        : {
            start: 1,
            end: 1
          }
    );
    setAppointWeek(props.appointWeek ? props.appointWeek : []);
    setLast(props.last ? props.last : 1);
    setWeekFormat(
      props.weekFormat
        ? props.weekFormat
        : {
            1: '天',
            2: '一',
            3: '二',
            4: '三',
            5: '四',
            6: '五',
            7: '六'
          }
    );
    setResult(
      props.result
        ? props.result
        : {
            day: '',
            week: ''
          }
    );
  }, [props.key]);
  const items = Array.from({length: 31}, (_, index) => index + 1);
  return (
    <>
      <div className="day-and-week-box">
        <RadioGroup value={type} onChange={getValue}>
          {/* <!-- 日 --> */}
          <div className="box-bottom">
            <Radio value={1}>每日</Radio>
          </div>
          <div className="box-bottom">
            <Radio value={8}>不指定</Radio>
          </div>
          <div className="box-bottom cycle">
            <Radio value={2}>日周期</Radio>
            <span style={{marginRight: '8px'}}>从</span>
            <InputNumber
              onChange={getChangeDay}
              value={dayCycle.start}
              defaultValue={dayCycle.start}
              min={1}
              max={31}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '8px', marginRight: '8px'}}>至</span>
            <InputNumber
              onChange={getChangeDays}
              value={dayCycle.end}
              defaultValue={dayCycle.end}
              min={2}
              max={31}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '8px'}}>日</span>
          </div>
          <div className="box-bottom cycle">
            <Radio value={3}>日循环</Radio>
            <span style={{marginRight: '8px'}}>从</span>
            <InputNumber
              onChange={getLoopDay}
              value={dayLoop.start}
              defaultValue={dayLoop.start}
              min={1}
              max={31}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '8px', marginRight: '8px'}}>
              日开始，每
            </span>
            <InputNumber
              onChange={getLoopDays}
              value={dayLoop.end}
              defaultValue={dayLoop.end}
              min={1}
              max={31}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '8px'}}>日执行一次</span>
          </div>
          <div className="box-bottom cycle">
            <Radio value={5}>工作日</Radio>
            <span style={{marginRight: '8px'}}>每月</span>
            <InputNumber
              onChange={getworkDay}
              value={work}
              defaultValue={work}
              min={1}
              max={31}
              style={{width: '100px'}}
            />
            <span style={{marginLeft: '8px'}}>号，最近的工作日</span>
          </div>
          <div className="box-bottom">
            <Radio value={6}>月最后一天</Radio>
          </div>
          <div className="box-bottom">
            <Radio value={7}>月最后一个工作日</Radio>
          </div>
          <div className="box-bottom">
            <Radio value={4}>指定日</Radio>
          </div>
          <div>
            <CheckboxGroup
              value={appointDay}
              className="second-minute-chekck-group"
              onChange={getAppointDay}
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
export default DayVue;
