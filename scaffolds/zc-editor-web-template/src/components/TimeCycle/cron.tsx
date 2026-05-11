import React from 'react';
import {Input, Tabs, Radio, Checkbox, Row, Col} from 'antd';
import {observer, inject} from 'mobx-react';
import {injectIntl, intlShape} from 'react-intl';
const TabPane = Tabs.TabPane;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;

export default function CRONExpression(props: any) {
  const options = [];
  const hourOptions = [];
  const daysForMonOptions = [];
  const monthOptions = [];
  const weekOptions = [];
  for (let i = 0; i < 60; i++) {
    options.push(i.toString());
  }
  for (let i = 0; i < 24; i++) {
    hourOptions.push(i.toString());
  }
  for (let i = 1; i < 32; i++) {
    daysForMonOptions.push(i.toString());
  }
  for (let i = 1; i < 13; i++) {
    monthOptions.push(i.toString());
  }
  for (let i = 1; i < 7; i++) {
    weekOptions.push(i.toString());
  }
  const state = {
    searchValue: '',
    CRONExpression: '',
    CRONVal: '',
    secondVal: '*',
    minVal: '*',
    hourVal: '*',
    dayOfMonVal: '*',
    MonVal: '*',
    dayOfWekVal: '?',
    yearVal: '',
    secondCycleStart: '',
    secondCycleEnd: '',
    secondStart: '',
    secondEvery: '',
    secondChecked: '',
    SecondRadiochecked: 1,
    minuteCycleStart: '',
    minuteCycleEnd: '',
    minuteStart: '',
    minuteEvery: '',
    minuteChecked: '',
    minuteRadiochecked: 1,
    hourCycleStart: '',
    hourCycleEnd: '',
    hourStart: '',
    hourEvery: '',
    hourChecked: '',
    hourRadiochecked: 1,
    daysCycleStart: '',
    daysCycleEnd: '',
    daysStart: '',
    daysEvery: '',
    daysChecked: '',
    daysForWorking: '',
    daysRadiochecked: 1,
    monthCycleStart: '',
    monthCycleEnd: '',
    monthStart: '',
    monthEvery: '',
    monthChecked: '',
    monthRadiochecked: 1,
    weekCycleStart: '',
    weekCycleEnd: '',
    weekStart: '',
    weekEvery: '',
    weekChecked: '',
    weekRadiochecked: 1,
    yearCycleStart: '',
    yearCycleEnd: '',
    yearRadiochecked: 1
  };
  //生成复选框
  const createChecks = data => {
    return data.map(index => {
      return (
        <Col key={index} span={4}>
          <Checkbox value={index.toString()}>{index}</Checkbox>
        </Col>
      );
    });
  };
  //CRONtabs页切换回调
  const callback = key => {
    console.log(key);
  };

  //CRON-秒-radio选择回调
  const onSecondRadioChange = e => {
    // console.log('Second radio checked',e.target.value)
    let SecondRadiochecked = e.target.value;
    setState({SecondRadiochecked});
    switch (SecondRadiochecked) {
      case 1:
        setState({
          secondVal: '*',
          minVal: '*',
          hourVal: '*',
          dayOfMonVal: '*',
          MonVal: '*',
          dayOfWekVal: '?',
          yearVal: ''
        });
        break;
      case 2:
        setState({
          secondVal: state.secondCycleStart + '-' + state.secondCycleEnd
        });
        break;
      case 3:
        setState({secondVal: state.secondStart + '/' + state.secondEvery});
        break;
      case 4:
        setState({secondVal: state.secondChecked});
        break;
    }
    // CRONExpression();
  };
  //CRON-秒-指定选择复选框
  const nSecndcheckChange = checkedValues => {
    let secondChecked = checkedValues.join(',');
    if (state.SecondRadiochecked == 4) {
      setState({secondVal: secondChecked});
    }
    setState({secondChecked: secondChecked});
  };
  //CRON-秒-指定周期-周期开始值输入框的回调
  const secondCycleStart = e => {
    if (state.SecondRadiochecked == 2) {
      setState({
        secondVal: e.target.value + '-' + state.secondCycleEnd
      });
    }
    setState({secondCycleStart: e.target.value});
  };
  //CRON-秒-指定周期-周期结束值输入框的回调
  const secondCycleEnd = e => {
    if (state.SecondRadiochecked == 2) {
      setState({
        secondVal: state.secondCycleStart + '-' + e.target.value
      });
    }
    setState({secondCycleEnd: e.target.value});
  };
  //CRON-秒-指定从几秒开始
  const secondStart = e => {
    if (state.SecondRadiochecked == 3) {
      setState({
        secondVal: e.target.value + '/' + state.secondEvery
      });
    }
    setState({secondStart: e.target.value});
  };
  //CRON-秒-指定每几秒执行一次
  const secondEvery = e => {
    if (state.SecondRadiochecked == 3) {
      setState({
        secondVal: state.secondStart + '/' + e.target.value
      });
    }
    setState({secondEvery: e.target.value});
  };
  //CRON-分钟-radio选择回调
  const onMinuteRadioChange = e => {
    // console.log('Second radio checked',e.target.value)
    let minuteRadiochecked = e.target.value;
    setState({minuteRadiochecked});
    switch (minuteRadiochecked) {
      case 1:
        setState({
          minVal: '*',
          hourVal: '*',
          dayOfMonVal: '*',
          MonVal: '*',
          dayOfWekVal: '?',
          yearVal: ''
        });
        break;
      case 2:
        setState({minVal: state.minuteCycleStart + '-' + state.minuteCycleEnd});
        break;
      case 3:
        setState({minVal: state.minuteStart + '/' + state.minuteEvery});
        break;
      case 4:
        setState({minVal: state.minuteChecked});
        break;
    }
    if (minuteRadiochecked != 1) {
      const {secondVal} = state;
      if (secondVal == '*') {
        setState({secondVal: '0'});
      }
    }
    // CRONExpression();
  };
  //CRON-分钟-指定选择复选框
  const onMinuteCheckChange = checkedValues => {
    let minuteChecked = checkedValues.join(',');
    if (state.minuteRadiochecked == 4) {
      setState({minVal: minuteChecked});
    }
    setState({minuteChecked: minuteChecked});
  };
  //CRON-分钟-指定周期-周期开始值输入框的回调
  const minuteCycleStart = e => {
    if (state.minuteRadiochecked == 2) {
      setState({minVal: e.target.value + '-' + state.minuteCycleEnd});
    }
    setState({minuteCycleStart: e.target.value});
  };
  //CRON-分钟-指定周期-周期结束值输入框的回调
  const minuteCycleEnd = e => {
    if (state.minuteRadiochecked == 2) {
      setState({minVal: state.minuteCycleStart + '-' + e.target.value});
    }
    setState({minuteCycleEnd: e.target.value});
  };
  //CRON-分钟-指定从几秒开始
  const minuteStart = e => {
    if (state.minuteRadiochecked == 3) {
      setState({minVal: e.target.value + '/' + state.minuteEvery});
    }
    setState({minuteStart: e.target.value});
  };
  //CRON-分钟-指定每几秒执行一次
  const minuteEvery = e => {
    if (state.minuteRadiochecked == 3) {
      setState({minVal: state.minuteStart + '/' + e.target.value});
    }
    setState({minuteEvery: e.target.value});
  };
  //CRON-小时-radio选择回调
  const onHourRadioChange = e => {
    // console.log('Second radio checked',e.target.value)
    let hourRadiochecked = e.target.value;
    setState({hourRadiochecked});
    switch (hourRadiochecked) {
      case 1:
        setState({
          hourVal: '*',
          dayOfMonVal: '*',
          MonVal: '*',
          dayOfWekVal: '?',
          yearVal: ''
        });
        break;
      case 2:
        setState({hourVal: state.hourCycleStart + '-' + state.hourCycleEnd});
        break;
      case 3:
        setState({hourVal: state.hourStart + '/' + state.hourEvery});
        break;
      case 4:
        setState({hourVal: state.hourChecked});
        break;
    }
    if (hourRadiochecked != 1) {
      const {secondVal, minVal} = state;
      if (secondVal == '*') {
        setState({secondVal: '0'});
      }
      if (minVal == '*') {
        setState({minVal: '0'});
      }
    }
    // CRONExpression();
  };
  //CRON-小时-指定选择复选框
  const onHourCheckChange = checkedValues => {
    let hourChecked = checkedValues.join(',');
    if (state.hourRadiochecked == 4) {
      setState({hourVal: hourChecked});
    }
    setState({hourChecked: hourChecked});
  };
  //CRON-小时-指定周期-周期开始值输入框的回调
  const hourCycleStart = e => {
    if (state.hourRadiochecked == 2) {
      setState({hourVal: e.target.value + '-' + state.hourCycleEnd});
    }
    setState({hourCycleStart: e.target.value});
  };
  //CRON-小时-指定周期-周期结束值输入框的回调
  const hourCycleEnd = e => {
    if (state.hourRadiochecked == 2) {
      setState({hourVal: state.hourCycleStart + '-' + e.target.value});
    }
    setState({hourCycleEnd: e.target.value});
  };
  //CRON-小时-指定从几秒开始
  const hourStart = e => {
    if (state.hourRadiochecked == 3) {
      setState({hourVal: e.target.value + '/' + state.hourEvery});
    }
    setState({hourStart: e.target.value});
  };
  //CRON-小时-指定每几秒执行一次
  const hourEvery = e => {
    if (state.hourRadiochecked == 3) {
      setState({hourVal: state.hourStart + '/' + e.target.value});
    }
    setState({hourEvery: e.target.value});
  };
  //CRON-日-radio选择回调
  const onDaysRadioChange = e => {
    // console.log('Second radio checked',e.target.value)
    let daysRadiochecked = e.target.value;
    setState({daysRadiochecked});
    switch (daysRadiochecked) {
      case 1:
        setState({
          dayOfMonVal: '*',
          MonVal: '*',
          dayOfWekVal: '?',
          yearVal: ''
        });
        break;
      case 2:
        setState({dayOfMonVal: '?'});
        break;
      case 3:
        setState({
          dayOfMonVal: state.daysCycleStart + '-' + state.daysCycleEnd
        });
        break;
      case 4:
        setState({dayOfMonVal: state.daysStart + '/' + state.daysEvery});
        break;
      case 5:
        setState({dayOfMonVal: state.daysForWorking});
        break;
      case 6:
        setState({dayOfMonVal: 'L'});
        break;
      case 7:
        setState({dayOfMonVal: state.daysChecked});
        break;
    }
    if (daysRadiochecked != 1) {
      const {secondVal, minVal, hourVal} = state;
      if (secondVal == '*') {
        setState({secondVal: '0'});
      }
      if (minVal == '*') {
        setState({minVal: '0'});
      }
      if (hourVal == '*') {
        setState({hourVal: '0'});
      }
    }
    // CRONExpression();
  };
  //CRON-日-指定选择复选框
  const onDaysCheckChange = checkedValues => {
    let daysChecked = checkedValues.join(',');
    if (state.daysRadiochecked == 7) {
      setState({dayOfMonVal: daysChecked});
    }
    setState({daysChecked: daysChecked});
  };
  //CRON-日-指定周期-周期开始值输入框的回调
  const daysCycleStart = e => {
    if (state.daysRadiochecked == 3) {
      setState({dayOfMonVal: e.target.value + '-' + state.daysCycleEnd});
    }
    setState({daysCycleStart: e.target.value});
  };
  //CRON-日-指定周期-周期结束值输入框的回调
  const daysCycleEnd = e => {
    if (state.daysRadiochecked == 3) {
      setState({dayOfMonVal: state.daysCycleStart + '-' + e.target.value});
    }
    setState({daysCycleEnd: e.target.value});
  };
  //CRON-日-指定从多少开始
  const daysStart = e => {
    if (state.daysRadiochecked == 4) {
      setState({dayOfMonVal: e.target.value + '/' + state.daysEvery});
    }
    setState({daysStart: e.target.value});
  };
  //CRON-日-指定每多久执行一次
  const daysEvery = e => {
    if (state.daysRadiochecked == 4) {
      setState({dayOfMonVal: state.daysStart + '/' + e.target.value});
    }
    setState({daysEvery: e.target.value});
  };
  //CRON-日-指定最近日期的工作日执行
  const daysForWorking = e => {
    if (state.daysRadiochecked == 5) {
      setState({dayOfMonVal: e.target.value + 'W'});
    }
    setState({daysForWorking: e.target.value + 'W'});
  };
  //CRON-月-radio选择回调
  const onMonthRadioChange = e => {
    // console.log('Second radio checked',e.target.value)
    let monthRadiochecked = e.target.value;
    setState({monthRadiochecked});
    switch (monthRadiochecked) {
      case 1:
        setState({MonVal: '*', dayOfWekVal: '?', yearVal: ''});
        break;
      case 2:
        setState({MonVal: '?'});
        break;
      case 3:
        setState({MonVal: state.monthCycleStart + '-' + state.monthCycleEnd});
        break;
      case 4:
        setState({MonVal: state.monthStart + '/' + state.monthEvery});
        break;
      case 5:
        setState({MonVal: state.monthChecked});
        break;
    }
    if (monthRadiochecked != 1) {
      const {secondVal, minVal, hourVal, dayOfMonVal} = state;
      if (secondVal == '*') {
        setState({secondVal: '0'});
      }
      if (minVal == '*') {
        setState({minVal: '0'});
      }
      if (hourVal == '*') {
        setState({hourVal: '0'});
      }
      if (dayOfMonVal == '*') {
        setState({dayOfMonVal: '0'});
      }
    }
    // CRONExpression();
  };
  //CRON-月-指定选择复选框
  const onMonthCheckChange = checkedValues => {
    let monthChecked = checkedValues.join(',');
    if (state.monthRadiochecked == 5) {
      setState({MonVal: monthChecked});
    }
    setState({monthChecked: monthChecked});
  };
  //CRON-月-指定周期-周期开始值输入框的回调
  const monthCycleStart = e => {
    if (state.monthRadiochecked == 3) {
      setState({MonVal: e.target.value + '-' + state.monthCycleEnd});
    }
    setState({monthCycleStart: e.target.value});
  };
  //CRON-月-指定周期-周期结束值输入框的回调
  const monthCycleEnd = e => {
    if (state.monthRadiochecked == 3) {
      setState({MonVal: state.monthCycleStart + '-' + e.target.value});
    }
    setState({monthCycleEnd: e.target.value});
  };
  //CRON-月-指定从多久开始
  const monthStart = e => {
    if (state.monthRadiochecked == 4) {
      setState({MonVal: e.target.value + '/' + state.monthEvery});
    }
    setState({monthStart: e.target.value});
  };
  //CRON-月-指定每多久执行一次
  const monthEvery = e => {
    if (state.monthRadiochecked == 4) {
      setState({MonVal: state.monthStart + '/' + e.target.value});
    }
    setState({monthEvery: e.target.value});
  };
  //CRON-周-radio选择回调
  const onWeekRadioChange = e => {
    // console.log('Second radio checked',e.target.value)
    let weekRadiochecked = e.target.value;
    setState({weekRadiochecked});
    switch (weekRadiochecked) {
      case 1:
        setState({dayOfWekVal: '*', yearVal: ''});
        break;
      case 2:
        setState({dayOfWekVal: '?'});
        break;
      case 3:
        setState({
          dayOfWekVal: state.weekCycleStart + '-' + state.weekCycleEnd
        });
        break;
      case 4:
        setState({dayOfWekVal: state.weekStart + '#' + state.weekEvery});
        break;
      case 5:
        setState({dayOfWekVal: 'L'});
        break;
      case 6:
        setState({dayOfWekVal: state.weekChecked});
        break;
    }
    if (weekRadiochecked != 1) {
      const {secondVal, minVal, hourVal, dayOfMonVal, MonVal} = state;
      if (secondVal == '*') {
        setState({secondVal: '0'});
      }
      if (minVal == '*') {
        setState({minVal: '0'});
      }
      if (hourVal == '*') {
        setState({hourVal: '0'});
      }
      if (dayOfMonVal == '*') {
        setState({dayOfMonVal: '0'});
      }
      if (MonVal == '*') {
        setState({MonVal: '0'});
      }
    }
    // CRONExpression();
  };
  //CRON-周-指定选择复选框
  const onWeekCheckChange = checkedValues => {
    let weekChecked = checkedValues.join(',');
    if (state.weekRadiochecked == 6) {
      setState({dayOfWekVal: weekChecked});
    }
    setState({weekChecked: weekChecked});
  };
  //CRON-周-指定周期-周期开始值输入框的回调
  const weekCycleStart = e => {
    if (state.weekRadiochecked == 3) {
      setState({dayOfWekVal: e.target.value + '-' + state.weekCycleEnd});
    }
    setState({weekCycleStart: e.target.value});
  };
  //CRON-周-指定周期-周期结束值输入框的回调
  const weekCycleEnd = e => {
    if (state.weekRadiochecked == 3) {
      setState({dayOfWekVal: state.weekCycleStart + '-' + e.target.value});
    }
    setState({weekCycleEnd: e.target.value});
  };
  //CRON-周-指定从多久开始
  const weekStart = e => {
    if (state.weekRadiochecked == 4) {
      setState({dayOfWekVal: e.target.value + '#' + state.weekEvery});
    }
    setState({weekStart: e.target.value});
  };
  //CRON-周-指定每多久执行一次
  const weekEvery = e => {
    if (state.weekRadiochecked == 4) {
      setState({dayOfWekVal: state.weekStart + '#' + e.target.value});
    }
    setState({weekEvery: e.target.value});
  };
  //CRON-年-radio选择回调
  const onYearRadioChange = e => {
    // console.log('Second radio checked',e.target.value)
    let yearRadiochecked = e.target.value;
    setState({yearRadiochecked});
    switch (yearRadiochecked) {
      case 1:
        setState({yearVal: ''});
        break;
      case 2:
        setState({yearVal: '*'});
        break;
      case 3:
        setState({yearVal: state.yearCycleStart + '-' + state.yearCycleEnd});
        break;
    }
    if (yearRadiochecked != 2) {
      const {secondVal, minVal, hourVal, dayOfMonVal, MonVal, dayOfWekVal} =
        state;
      if (secondVal == '*') {
        setState({secondVal: '0'});
      }
      if (minVal == '*') {
        setState({minVal: '0'});
      }
      if (hourVal == '*') {
        setState({hourVal: '0'});
      }
      if (dayOfMonVal == '*') {
        setState({dayOfMonVal: '0'});
      }
      if (MonVal == '*') {
        setState({MonVal: '0'});
      }
      if (dayOfWekVal == '*') {
        setState({dayOfWekVal: '?'});
      }
    }
    // CRONExpression();
  };
  //CRON-年-指定周期-周期开始值输入框的回调
  const yearCycleStart = e => {
    if (state.yearRadiochecked == 3) {
      setState({yearVal: e.target.value + '-' + state.yearCycleEnd});
    }
    setState({yearCycleStart: e.target.value});
  };
  //CRON-年-指定周期-周期结束值输入框的回调
  const yearCycleEnd = e => {
    if (state.yearRadiochecked == 3) {
      setState({yearVal: state.yearCycleStart + '-' + e.target.value});
    }
    setState({yearCycleEnd: e.target.value});
  };
  const componentWillUpdate = (nextProps, nextState) => {
    // console.log(nextState,'next')
    props.UI.changeCRONExpression(
      nextState.secondVal +
        ' ' +
        nextState.minVal +
        ' ' +
        nextState.hourVal +
        ' ' +
        nextState.dayOfMonVal +
        ' ' +
        nextState.MonVal +
        ' ' +
        nextState.dayOfWekVal +
        ' ' +
        nextState.yearVal
    );
  };
  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px'
  };
  return (
    <div className="too">
      <Tabs defaultActiveKey="1" onChange={callback}>
        <TabPane
          tab="秒"
          key="1"
          style={{
            margin: '24px 0px',
            background: '#fff',
            minHeight: 280
          }}
        >
          <RadioGroup name="radiogroup" onChange={onSecondRadioChange}>
            <Radio style={radioStyle} value={1}>
              每秒 允许的通配符[, - * /]{' '}
            </Radio>
            <Radio style={radioStyle} value={2}>
              按周期 周期从{' '}
              <Input
                type="number"
                size="small"
                onChange={secondCycleStart}
                style={{width: 100}}
              />
              -{' '}
              <Input
                size="small"
                type="number"
                onChange={secondCycleEnd}
                style={{width: 100}}
              />{' '}
              秒
            </Radio>
            <Radio style={radioStyle} value={3}>
              从{' '}
              <Input
                type="number"
                size="small"
                onChange={secondStart}
                style={{width: 100}}
              />{' '}
              秒开始， 每{' '}
              <Input
                type="number"
                size="small"
                onChange={secondEvery}
                style={{width: 100}}
              />{' '}
              秒执行一次
            </Radio>
            <Radio style={radioStyle} value={4}>
              指定
              <br />
              <CheckboxGroup
                style={{width: '100%'}}
                onChange={onSecndcheckChange}
              >
                <Row> {createChecks(options)} </Row>
              </CheckboxGroup>
            </Radio>
          </RadioGroup>
        </TabPane>
        <TabPane tab="分钟" key="2">
          <RadioGroup name="radiogroup" onChange={onMinuteRadioChange}>
            <Radio style={radioStyle} value={1}>
              分钟 允许的通配符[, - * /]{' '}
            </Radio>
            <Radio style={radioStyle} value={2}>
              按周期 周期从{' '}
              <Input
                type="number"
                size="small"
                onChange={minuteCycleStart}
                style={{width: 100}}
              />
              -{' '}
              <Input
                size="small"
                type="number"
                onChange={minuteCycleEnd}
                style={{width: 100}}
              />{' '}
              分钟
            </Radio>
            <Radio style={radioStyle} value={3}>
              从{' '}
              <Input
                type="number"
                size="small"
                onChange={minuteStart}
                style={{width: 100}}
              />{' '}
              分钟开始， 每{' '}
              <Input
                type="number"
                size="small"
                onChange={minuteEvery}
                style={{width: 100}}
              />{' '}
              分钟执行一次
            </Radio>
            <Radio style={radioStyle} value={4}>
              指定
              <br />
              <CheckboxGroup
                style={{width: '100%'}}
                onChange={onMinuteCheckChange}
              >
                <Row> {createChecks(options)} </Row>
              </CheckboxGroup>
            </Radio>
          </RadioGroup>
        </TabPane>
        <TabPane tab="小时" key="3">
          <RadioGroup name="radiogroup" onChange={onHourRadioChange}>
            <Radio style={radioStyle} value={1}>
              小时 允许的通配符[, - * /]{' '}
            </Radio>
            <Radio style={radioStyle} value={2}>
              按周期 周期从{' '}
              <Input
                type="number"
                size="small"
                onChange={hourCycleStart}
                style={{width: 100}}
              />
              -{' '}
              <Input
                size="small"
                type="number"
                onChange={hourCycleEnd}
                style={{width: 100}}
              />{' '}
              小时
            </Radio>
            <Radio style={radioStyle} value={3}>
              从{' '}
              <Input
                type="number"
                size="small"
                onChange={hourStart}
                style={{width: 100}}
              />{' '}
              小时开始， 每{' '}
              <Input
                type="number"
                size="small"
                onChange={hourEvery}
                style={{width: 100}}
              />{' '}
              小时执行一次
            </Radio>
            <Radio style={radioStyle} value={4}>
              指定
              <br />
              <CheckboxGroup
                style={{width: '100%'}}
                onChange={onHourCheckChange}
              >
                <Row> {createChecks(hourOptions)} </Row>
              </CheckboxGroup>
            </Radio>
          </RadioGroup>
        </TabPane>
        <TabPane tab="日" key="4">
          <RadioGroup name="radiogroup" onChange={onDaysRadioChange}>
            <Radio style={radioStyle} value={1}>
              日 允许的通配符[, - * / L W]{' '}
            </Radio>
            <Radio style={radioStyle} value={2}>
              不指定{' '}
            </Radio>
            <Radio style={radioStyle} value={3}>
              按周期 周期从{' '}
              <Input
                type="number"
                size="small"
                onChange={daysCycleStart}
                style={{width: 100}}
              />
              -{' '}
              <Input
                size="small"
                type="number"
                onChange={daysCycleEnd}
                style={{width: 100}}
              />{' '}
              日
            </Radio>
            <Radio style={radioStyle} value={4}>
              从{' '}
              <Input
                type="number"
                size="small"
                onChange={daysStart}
                style={{width: 100}}
              />{' '}
              日开始， 每{' '}
              <Input
                type="number"
                size="small"
                onChange={daysEvery}
                style={{width: 100}}
              />{' '}
              日执行一次
            </Radio>
            <Radio style={radioStyle} value={5}>
              每月{' '}
              <Input
                type="number"
                size="small"
                onChange={daysForWorking}
                style={{width: 100}}
              />{' '}
              号最近的工作日
            </Radio>
            <Radio style={radioStyle} value={6}>
              每月的最后一天{' '}
            </Radio>
            <Radio style={radioStyle} value={7}>
              指定
              <br />
              <CheckboxGroup
                style={{width: '100%'}}
                onChange={onDaysCheckChange}
              >
                <Row> {createChecks(daysForMonOptions)} </Row>
              </CheckboxGroup>
            </Radio>
          </RadioGroup>
        </TabPane>
        <TabPane tab="月" key="5">
          <RadioGroup name="radiogroup" onChange={onMonthRadioChange}>
            <Radio style={radioStyle} value={1}>
              月 允许的通配符[, - * /]{' '}
            </Radio>
            <Radio style={radioStyle} value={2}>
              不指定{' '}
            </Radio>
            <Radio style={radioStyle} value={3}>
              按周期 周期从{' '}
              <Input
                type="number"
                size="small"
                onChange={monthCycleStart}
                style={{width: 100}}
              />
              -{' '}
              <Input
                size="small"
                type="number"
                onChange={monthCycleEnd}
                style={{width: 100}}
              />{' '}
              月
            </Radio>
            <Radio style={radioStyle} value={4}>
              从{' '}
              <Input
                type="number"
                size="small"
                onChange={monthStart}
                style={{width: 100}}
              />{' '}
              月开始， 每{' '}
              <Input
                type="number"
                size="small"
                onChange={monthEvery}
                style={{width: 100}}
              />{' '}
              月执行一次
            </Radio>
            <Radio style={radioStyle} value={5}>
              指定
              <br />
              <CheckboxGroup
                style={{width: '100%'}}
                onChange={onMonthCheckChange}
              >
                <Row> {createChecks(monthOptions)} </Row>
              </CheckboxGroup>
            </Radio>
          </RadioGroup>
        </TabPane>
        <TabPane tab="周" key="6">
          <RadioGroup name="radiogroup" onChange={onWeekRadioChange}>
            <Radio style={radioStyle} value={1}>
              周 允许的通配符[, - * L #]{' '}
            </Radio>
            <Radio style={radioStyle} value={2}>
              不指定{' '}
            </Radio>
            <Radio style={radioStyle} value={3}>
              按周期 周期从 星期
              <Input
                type="number"
                size="small"
                onChange={weekCycleStart}
                style={{width: 100}}
              />
              -{' '}
              <Input
                size="small"
                type="number"
                onChange={weekCycleEnd}
                style={{width: 100}}
              />
            </Radio>
            <Radio style={radioStyle} value={4}>
              第{' '}
              <Input
                type="number"
                size="small"
                onChange={weekStart}
                style={{width: 100}}
              />{' '}
              周 的星期{' '}
              <Input
                type="number"
                size="small"
                onChange={weekEvery}
                style={{width: 100}}
              />
            </Radio>
            <Radio style={radioStyle} value={5}>
              每月的最后一周{' '}
            </Radio>
            <Radio style={radioStyle} value={6}>
              指定
              <br />
              <CheckboxGroup
                style={{width: '100%'}}
                onChange={onWeekCheckChange}
              >
                <Row> {createChecks(weekOptions)} </Row>
              </CheckboxGroup>
            </Radio>
          </RadioGroup>
        </TabPane>
        <TabPane tab="年" key="7">
          <RadioGroup name="radiogroup" onChange={onYearRadioChange}>
            <Radio style={radioStyle} value={1}>
              不指定 允许的通配符[, - * /] 非必填{' '}
            </Radio>
            <Radio style={radioStyle} value={2}>
              每年{' '}
            </Radio>
            <Radio style={radioStyle} value={3}>
              按周期 周期从{' '}
              <Input
                type="number"
                size="small"
                onChange={yearCycleStart}
                style={{width: 100}}
              />
              -{' '}
              <Input
                size="small"
                type="number"
                onChange={yearCycleEnd}
                style={{width: 100}}
              />
            </Radio>
          </RadioGroup>
        </TabPane>
      </Tabs>
      CRON表达式：
      <Input
        type="text"
        size="small"
        style={{width: 200}}
        value={props.UI.CRONExpression}
      />
      <p style={{color: 'red'}}>
        注意：若点击确定生成，原属任务的CRON表达式将覆盖。
      </p>
    </div>
  );
}
