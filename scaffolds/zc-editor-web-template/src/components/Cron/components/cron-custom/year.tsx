import React, {useEffect, useRef, useState, forwardRef} from 'react';
import {Modal, Radio, message, InputNumber, Checkbox} from 'antd';
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;
interface weekVueProps {
  type?: string;
  cycle?: any;
  result?: string;
}
const weekVue = forwardRef(function weekVue(props: any, ref) {
  // const props = withDefaults(defineProps<Props>(), {
  //   type: '1', // 类型
  //   cycle: {
  //     // 周期
  //     start: 2000,
  //     end: 2020
  //   },
  //   // 年份选择结果
  //   result: ''
  // })
  const [type, setType] = useState(1); // 类型
  const [cycle, setCycle] = useState({
    // 周期
    start: 2000,
    end: 2020
  });
  // 年份选择结果
  const [result, setResult] = useState('');
  // const emit = defineEmits(['year']);
  const getValue = e => {
    setType(e.target.value);
    let emitResule = '';
    if (e.target.value == -1) {
      // 不指定 年份为空(年份允许为空)
      setResult('?');
      emitResule = '?';
    } else if (e.target.value == 1) {
      // 指定每年
      setResult('*');
      emitResule = '*';
    } else {
      // 指定年份周期
      setResult(cycle.start + '-' + cycle.end);
      emitResule = cycle.start + '-' + cycle.end;
    }
    console.log('年result', result);
    props.year(emitResule);
  };
  // 选择年份周期
  const getChangeYear = (e) => {
    setType(2);
    setCycle({
      ...cycle,
      start: e
    });
    setResult(e + '-' + cycle.end);
    console.log('年result', result);
    props.year(e + '-' + cycle.end);
  };
  // 选择年份周期
  const getChangeYears = (e) => {
    setType(2);
    setCycle({
      ...cycle,
      end: e
    });
    setResult(cycle.start + '-' + e);
    console.log('年result', result);
    props.year(cycle.start + '-' + e);
  };
  useEffect(() => {
    console.log(props, 'props');
    setType(props.type ? props.type : 1);
    setCycle(
      props.cycle
        ? props.cycle
        : {
            start: 2000,
            end: 2020
          }
    );
    setResult(props.result ? props.result : '');
  }, [props.key]);
  return (
    <>
      <div className="year-box">
        <RadioGroup value={type} onChange={getValue}>
          <div className="box-bottom">
            <Radio value={1}>每年</Radio>
          </div>
          <div className="box-bottom">
            <Radio value={-1}>不指定</Radio>
          </div>
          <div className="cycle">
            <Radio value={2}>周期</Radio>
            <span style={{marginRight: '8px'}}>从</span>
            <InputNumber
              onChange={getChangeYear}
              value={cycle.start}
              defaultValue={cycle.start}
              min={0}
              style={{width: '120px'}}
            />
            <span style={{margin: '0 8px'}}>至</span>
            <InputNumber
              onChange={getChangeYears}
              value={cycle.end}
              defaultValue={cycle.end}
              min={parseInt(cycle.start)}
              style={{width: '120px'}}
            />
            <span style={{marginLeft: '8px'}}>年</span>
          </div>
        </RadioGroup>
      </div>
    </>
  );
});
export default weekVue;
