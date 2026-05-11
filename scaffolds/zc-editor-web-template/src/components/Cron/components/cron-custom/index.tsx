import React, {useEffect, useRef, useState, forwardRef} from 'react';
import {Modal, Radio, message, InputNumber, Checkbox, Card, Tabs} from 'antd';
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;
const TabPane = Tabs.TabPane;
interface weekVueProps {
  type?: string;
  cycle?: any;
  result?: string;
}
import TimeVue from './Time';
import dayVue from './day';
import monthVue from './month';
import yearVue from './year';
const weekVue = forwardRef(function weekVue(props: any, ref) {
  const [activeName, setActiveName] = useState('s'); // el-tab切换
  // 秒
  const [sVal, setSVal] = useState('0');
  // 分
  const [mVal, setMVal] = useState('0');
  // 时
  const [hVal, setHVal] = useState('0');
  // 日
  const [dVal, setDVal] = useState('*');
  // 月
  const [monthVal, setMonthVal] = useState('*');
  // 周
  const [weekVal, setWeekVal] = useState('?');
  // 年
  const [yearVal, setYearVal] = useState(' ');
  // 生成的完整cron表达式
  const [cronExpression, setCronExpression] = useState('');

  // 抛出的年份
  const year = data => {
    setYearVal(data);
    createCron();
  };
  // 抛出的月份
  const month = data => {
    setMonthVal(data);
    createCron();
  };
  // 抛出的秒
  const second = data => {
    setSVal(data);
    createCron();
  };
  // 抛出的分
  const minute = data => {
    setMVal(data);
    createCron();
  };
  // 抛出的时
  const hour = data => {
    setHVal(data);
    createCron();
  };
  // 抛出的周和日
  const dayAndWeek = data => {
    console.log(data, '抛出的周和日');
    setDVal(data.day);
    setWeekVal(data.week);
    createCron();
  };
  // 生成表达式
  const createCron = () => {
    setCronExpression(
      sVal +
        ' ' +
        mVal +
        ' ' +
        hVal +
        ' ' +
        dVal +
        ' ' +
        monthVal +
        ' ' +
        weekVal +
        ' ' +
        yearVal
    );
  };
  useEffect(() => {
    createCron();
  }, []);
  return (
    <>
      <div className="cron-box">
        <Card>
          <Tabs v-model="activeName">
            <TabPane tab="秒" key="s">
              <TimeVue lable="秒" time={second} />
            </TabPane>
            <TabPane tab="分" key="m">
              <TimeVue lable="分" time={minute} />
            </TabPane>
            <TabPane tab="时" key="h">
              <TimeVue lable="时" time={hour} />
            </TabPane>
            <TabPane tab="日(周)" key="d">
              <dayVue lable="日" dayAndWeek={dayAndWeek} />
            </TabPane>
            <TabPane tab="月" key="month">
              <monthVue lable="月" month={month} />
            </TabPane>
            <TabPane tab="年" key="year">
              <yearVue lable="年" year={year} />
            </TabPane>
          </Tabs>
        </Card>

        <div className="table-box">
          <span>生成的表达式为：{cronExpression}</span>
        </div>
      </div>
    </>
  );
});
export default weekVue;
