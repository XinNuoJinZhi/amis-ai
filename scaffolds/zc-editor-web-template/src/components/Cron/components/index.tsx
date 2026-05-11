import React, {useEffect, useRef, useState, forwardRef, useImperativeHandle} from 'react';
import {Card, Modal, Row, Table, Radio, Tooltip, message, Tabs} from 'antd';
import * as uuid from 'uuid';
import TimeVue from './cron-custom/Time.tsx';
import DayVue from './cron-custom/day.tsx';
import MonthVue from './cron-custom/month.tsx';
import YearVue from './cron-custom/year.tsx';
import WeekVue from './cron-custom/week.tsx';
const TabPane = Tabs.TabPane;
import './cron-custom/css.css';
const CronCustom = forwardRef(function CronCustom(props: any, ref) {
  const {onRef} = props;
  const [forceRenderKey, setForceRenderKey] = useState(0); 
  // 弹窗显示隐藏
  const [open, setOpen] = useState(false);
  // 秒
  const sVal = useRef('*');
  const [sType, setSType] = useState('');
  const [sCycle, setSCycle] = useState();
  const [sLoop, setSLoop] = useState();
  const [sAppoint, setSAppoint] = useState();
  // 分
  const mVal = useRef('*');
  const [mType, setMType] = useState('');
  const [mCycle, setMCycle] = useState();
  const [mLoop, setMLoop] = useState();
  const [mAppoint, setMAppoint] = useState();
  // 时
  const hVal = useRef('*');
  const [hType, setHType] = useState('');
  const [hCycle, setHCycle] = useState();
  const [hLoop, setHLoop] = useState();
  const [hAppoint, setHAppoint] = useState();
  // 日
  const dVal = useRef('?');
  const [dType, setDType] = useState(8);
  const [dCycle, setDCycle] = useState();
  const [dLoop, setDLoop] = useState();
  const [dAppoint, setDAppoint] = useState();
  // 月
  const monthVal = useRef('*');
  const [monthType, setMonthType] = useState('');
  const [monthCycle, setMonthCycle] = useState();
  const [monthLoop, setMonthLoop] = useState();
  const [monthAppoint, setMonthAppoint] = useState();
  // 周
  const weekVal = useRef('*');
  const [weekType, setWeekType] = useState(1);
  const [weekCycle, setWeekCycle] = useState();
  const [weekLoop, setWeekLoop] = useState();
  const [weekNeedWeek, setWeekNeedWeek] = useState();
  const [weekWork, setWeekWork] = useState();
  const [weekLast, setWeekLast] = useState();
  const [weekAppoint, setWeekAppoint] = useState();
  // 年
  const yearVal = useRef('*');
  const [yearType, setYearType] = useState('');
  const [yearCycle, setYearCycle] = useState();
  // 选择cron数据
  const [tipDialogTableData, setTipDialogTableData] = useState([
    {
      second: '*',
      branch: '*',
      Hour: '*',
      day: '?',
      month: '*',
      week: '*',
      year: '*'
    }
  ]);
  // 生成的完整cron表达式
  const [cronExpression, setCronExpression] = useState('');
  // 抛出的年份
  const year = data => {
    console.log(data, '抛出的年份');
    yearVal.current = data;
    createCron();
  };
  // 抛出的月份
  const month = data => {
    console.log(data, '抛出的月份');
    monthVal.current = data;
    createCron();
  };
  // 抛出的秒
  const second = data => {
    console.log(data, '抛出的秒');
    sVal.current = data;
    createCron();
  };
  // 抛出的分
  const minute = data => {
    console.log(data, '抛出的分');
    mVal.current = data;
    createCron();
  };
  // 抛出的时
  const hour = data => {
    console.log(data, '抛出的时');
    hVal.current = data;
    createCron();
  };
  // 抛出的周和日
  const day = data => {
    console.log(data, '抛出的日');
    if (data.day == '?' && data.week == '?') {
      // if (data.day == '?' && weekVal.current == '?') {
      return message.error('日期与星期不可以同时为“不指定”');
    }
    if (data.day != '?' && data.week != '?') {
      // if (data.day != '?' && weekVal.current != '?') {
      return message.error('日期与星期必须有一个为“不指定”');
    }
    dVal.current = data.day;
    weekVal.current = data.week;
    createCron();
  };

  // 抛出的周
  const Week = data => {
    console.log(data, '抛出的周');
    if (data == '?' && dVal.current == '?') {
      return message.error('日期与星期不可以同时为“不指定”');
    }
    if (data != '?' && dVal.current != '?') {
      return message.error('日期与星期必须有一个为“不指定”');
    }
    // setWeekVal(data);
    weekVal.current = data;
    createCron();
  };
  // 生成表达式
  const createCron = () => {
    setTipDialogTableData([
      {
        second: sVal.current,
        branch: mVal.current,
        Hour: hVal.current,
        day: dVal.current,
        month: monthVal.current,
        week: weekVal.current,
        year: yearVal.current
      }
    ]);
    let dataValue =
      sVal.current +
      ' ' +
      mVal.current +
      ' ' +
      hVal.current +
      ' ' +
      dVal.current +
      ' ' +
      monthVal.current +
      ' ' +
      weekVal.current +
      ' ' +
      yearVal.current;
    setCronExpression(dataValue);
  };
  const columns = [
    {
      title: '秒',
      width: 80,
      dataIndex: 'second',
      key: 'second',
      ellipsis: true
    },
    {
      title: '分',
      width: 80,
      dataIndex: 'branch',
      key: 'branch',
      ellipsis: true
    },
    {
      title: '时',
      width: 80,
      dataIndex: 'Hour',
      key: 'Hour',
      ellipsis: true
    },
    {
      title: '日',
      width: 80,
      dataIndex: 'day',
      key: 'day',
      ellipsis: true
    },
    {
      title: '月',
      width: 80,
      dataIndex: 'month',
      key: 'month',
      ellipsis: true
    },
    {
      title: '周',
      width: 80,
      dataIndex: 'week',
      key: 'week',
      ellipsis: true
    },
    {
      title: '年',
      width: 80,
      dataIndex: 'year',
      key: 'year',
      ellipsis: true
    }
  ];
  // 获取Cron 弹出对话框
  const selectCron = cronData => {
    // 日
    setDCycle({
      start: 1,
      end: 2
    });
    setDLoop({
      start: 1,
      end: 1
    });
    setDType(8);
    // 年
    setYearCycle({
      start: '2000',
      end: '2020'
    });
    setYearType(1);
    // 月
    setMonthType(1);
    setMonthCycle({
      start: 1,
      end: 2
    });
    setMonthLoop({
      start: 1,
      end: 1
    });
    // 秒
    setSType(1);
    setSCycle({
      start: 1,
      end: 2
    });
    setSLoop({
      start: 1,
      end: 1
    });
    // 分
    setMType(1);
    setMCycle({
      start: 1,
      end: 2
    });
    setMLoop({
      start: 1,
      end: 1
    });
    // 时
    setHType(1);
    setHCycle({
      start: 1,
      end: 2
    });
    setHLoop({
      start: 1,
      end: 1
    });
    // 周
    setWeekType(1);
    setWeekCycle({
      start: 1,
      end: 2
    });
    setWeekLoop({
      start: 1,
      end: 1
    });
    setWeekNeedWeek({
      start: 1,
      end: 1
    });
    setWeekWork(1);
    setWeekLast(1);
    setSAppoint([]);
    setDAppoint([]);
    setMAppoint([]);
    setHAppoint([]);
    setMonthAppoint([]);
    setWeekAppoint([]);
    setTipDialogTableData([
      {
        second: '*',
        branch: '*',
        Hour: '*',
        day: '?',
        month: '*',
        week: '*',
        year: '*'
      }
    ]);
    sVal.current = '*';
    mVal.current = '*';
    hVal.current = '*';
    dVal.current = '?';
    monthVal.current = '*';
    weekVal.current = '*';
    yearVal.current = '*';
    if (cronData == '') {
      setCronExpression(
        sVal.current +
          ' ' +
          mVal.current +
          ' ' +
          hVal.current +
          ' ' +
          dVal.current +
          ' ' +
          monthVal.current +
          ' ' +
          weekVal.current +
          ' ' +
          yearVal.current
      );
      // form.value.jobCron = cronExpression.value
    } else {
      console.log(cronData.split(' '));
      let data = cronData.split(' ');
      sVal.current = data[0];
      mVal.current = data[1];
      hVal.current = data[2];
      dVal.current = data[3];
      monthVal.current = data[4];
      weekVal.current = data[5];
      yearVal.current = data[6];
      setCronExpression(cronData);
      setTipDialogTableData([
        {
          second: sVal.current,
          branch: mVal.current,
          Hour: hVal.current,
          day: dVal.current,
          month: monthVal.current,
          week: weekVal.current,
          year: yearVal.current
        }
      ]);
      // 周
      if (weekVal.current == '*') {
        setWeekType(1);
      } else if (weekVal.current == '?') {
        setWeekType(-1);
      } else if (weekVal.current.includes('-')) {
        setWeekType(2);
        let data = weekVal.current.split('-');
        setWeekCycle({
          start: data[0],
          end: data[1]
        });
      } else if (weekVal.current.includes('/')) {
        setWeekType(3);
        let data = weekVal.current.split('/');
        setWeekLoop({
          start: data[0],
          end: data[1]
        });
      } else if (weekVal.current.includes('#')) {
        setWeekType(7);
        let data = weekVal.current.split('#');
        setWeekNeedWeek({
          start: data[0],
          end: data[1]
        });
      } else if (weekVal.current.includes(',')) {
        let weekData: any = weekVal.current.split(',');
        weekData = weekData.map(Number);
        setWeekAppoint(weekData);
        setWeekType(4);
      } else if (weekVal.current.includes('L')) {
        setWeekType(6);
        setWeekLast(weekVal.current);
      }
      // 日
      if (dVal.current == '*') {
        setDType(1);
      } else if (dVal.current.includes('-')) {
        setDType(2);
        let data = dVal.current.split('-');
        setDCycle({
          start: data[0],
          end: data[1]
        });
      } else if (dVal.current.includes('/')) {
        setDType(3);
        let data = dVal.current.split('/');
        setDLoop({
          start: data[0],
          end: data[1]
        });
      } else if (dVal.current.includes(',')) {
        let dayData: any = dVal.current.split(',');
        dayData = dayData.map(Number);
        setDAppoint(dayData);
        setDType(4);
      } else if (dVal.current == '?') {
        setDType(8);
      } else if (dVal.current == 'L') {
        setDType(6);
      } else if (dVal.current == 'LW') {
        setDType(7);
      } else {
        let dayData: any = dVal.current.split(',');
        dayData = dayData.map(Number);
        setDAppoint(dayData);
        setDType(4);
      }
      // 秒
      if (sVal.current == '*') {
        setSType(1);
      } else if (sVal.current.includes('-')) {
        setSType(2);
        let data = sVal.current.split('-');
        setSCycle({
          start: data[0],
          end: data[1]
        });
      } else if (sVal.current.includes('/')) {
        setSType(3);
        let data = sVal.current.split('/');
        setSLoop({
          start: data[0],
          end: data[1]
        });
      } else {
        let sData: any = sVal.current.split(',');
        sData = sData.map(Number);
        console.log(sData, 'sDatasDatasData');
        setSAppoint(sData);
        setSType(4);
      }
      // 分
      if (mVal.current == '*') {
        setMType(1);
      } else if (mVal.current.includes('-')) {
        setMType(2);
        let data = mVal.current.split('-');
        setMCycle({
          start: data[0],
          end: data[1]
        });
      } else if (mVal.current.includes('/')) {
        setMType(3);
        let data = mVal.current.split('/');
        setMLoop({
          start: data[0],
          end: data[1]
        });
      } else {
        let mData: any = mVal.current.split(',');
        mData = mData.map(Number);
        setMAppoint(mData);
        setMType(4);
      }
      // 秒
      if (hVal.current == '*') {
        setHType(1);
      } else if (hVal.current.includes('-')) {
        setHType(2);
        let data = hVal.current.split('-');
        setHCycle({
          start: data[0],
          end: data[1]
        });
      } else if (hVal.current.includes('/')) {
        setHType(3);
        let data = hVal.current.split('/');
        setHLoop({
          start: data[0],
          end: data[1]
        });
      } else {
        let hData: any = hVal.current.split(',');
        hData = hData.map(Number);
        setHAppoint(hData);
        setHType(4);
      }
      // 月
      if (monthVal.current == '?') {
        setMonthType(-1);
      } else if (monthVal.current == '*') {
        setMonthType(1);
      } else if (monthVal.current.includes('-')) {
        setMonthType(2);
        let data = monthVal.current.split('-');
        setMonthCycle({
          start: data[0],
          end: data[1]
        });
      } else if (monthVal.current.includes('/')) {
        setMonthType(3);
        let data = monthVal.current.split('/');
        setMonthLoop({
          start: data[0],
          end: data[1]
        });
      } else {
        let monthData: any = monthVal.current.split(',');
        monthData = monthData.map(Number);
        setMonthAppoint(monthData);
        setMonthType(4);
      }
      // 年
      if (yearVal.current == '?') {
        setYearType(-1);
      } else if (yearVal.current == '*') {
        setYearType(1);
      } else {
        console.log('周期');
        let data = yearVal.current.split('-');
        console.log(data, '切割后的数据');
        setYearCycle({
          start: data[0],
          end: data[1]
        });
        setYearType(2);
      }
    }
    setOpen(true);
    setForceRenderKey(uuid.v4())
  };
  const handleOK = () => {
    console.log(cronExpression, 'cronExpression');
    props.getCron(cronExpression);
    handleCancel()
  };
  const handleCancel = () => {
    // 日
    setDCycle({
      start: 1,
      end: 2
    });
    setDLoop({
      start: 1,
      end: 1
    });
    setDType(8);
    // 年
    setYearCycle({
      start: '2000',
      end: '2020'
    });
    setYearType(1);
    // 月
    setMonthType(1);
    setMonthCycle({
      start: 1,
      end: 2
    });
    setMonthLoop({
      start: 1,
      end: 1
    });
    // 秒
    setSType(1);
    setSCycle({
      start: 1,
      end: 2
    });
    setSLoop({
      start: 1,
      end: 1
    });
    // 分
    setMType(1);
    setMCycle({
      start: 1,
      end: 2
    });
    setMLoop({
      start: 1,
      end: 1
    });
    // 时
    setHType(1);
    setHCycle({
      start: 1,
      end: 2
    });
    setHLoop({
      start: 1,
      end: 1
    });
    // 周
    setWeekType(1);
    setWeekCycle({
      start: 1,
      end: 2
    });
    setWeekLoop({
      start: 1,
      end: 1
    });
    setWeekNeedWeek({
      start: 1,
      end: 1
    });
    setWeekWork(1);
    setWeekLast(1);
    setSAppoint([]);
    setDAppoint([]);
    setMAppoint([]);
    setHAppoint([]);
    setMonthAppoint([]);
    setWeekAppoint([]);
    setTipDialogTableData([
      {
        second: '*',
        branch: '*',
        Hour: '*',
        day: '?',
        month: '*',
        week: '*',
        year: '*'
      }
    ]);
    sVal.current = '*';
    mVal.current = '*';
    hVal.current = '*';
    dVal.current = '?';
    monthVal.current = '*';
    weekVal.current = '*';
    yearVal.current = '*';
    setOpen(false);
  };
  useImperativeHandle(onRef, () => ({
    selectCron: (rowObj: any) => selectCron(rowObj),
  }));
  return (
    <>
      <Modal
        width={'50%'}
        // style={{ maxHeight: '50vh' }}
        title={'cron时间生成'}
        open={open}
        okText={'确认'}
        cancelText={'取消'}
        keyboard={false}
        onOk={handleOK}
        onCancel={handleCancel}
        maskClosable={false}
      >
        <Card>
          <Tabs v-model="activeName">
            <TabPane tab="秒" key="s">
              <TimeVue
                lable="秒"
                time={second}
                type={sType}
                cycle={sCycle}
                loop={sLoop}
                appoint={sAppoint}
                key={forceRenderKey}
              />
            </TabPane>
            <TabPane tab="分" key="m">
              <TimeVue
                lable="分"
                time={minute}
                type={mType}
                cycle={mCycle}
                loop={mLoop}
                appoint={mAppoint}
                key={forceRenderKey}
              />
            </TabPane>
            <TabPane tab="时" key="h">
              <TimeVue
                lable="时"
                time={hour}
                type={hType}
                cycle={hCycle}
                loop={hLoop}
                appoint={hAppoint}
                key={forceRenderKey}
              />
            </TabPane>
            <TabPane tab="日" key="d">
              <DayVue
                lable="日"
                day={day}
                type={dType}
                dayCycle={dCycle}
                dayLoop={dLoop}
                appointDay={dAppoint}
                key={forceRenderKey}
              />
            </TabPane>
            <TabPane tab="月" key="month">
              <MonthVue
                lable="月"
                month={month}
                type={monthType}
                cycle={monthCycle}
                loop={monthLoop}
                appoint={monthAppoint}
                key={forceRenderKey}
              />
            </TabPane>
            <TabPane tab="周" key="week">
              <WeekVue
                lable="周"
                weekChange={Week}
                type={weekType}
                cycle={weekCycle}
                loop={weekLoop}
                week={weekNeedWeek}
                work={weekWork}
                last={weekLast}
                appoint={weekAppoint}
                key={forceRenderKey}
              />
            </TabPane>
            <TabPane tab="年" key="year">
              <YearVue
                lable="年"
                type={yearType}
                cycle={yearCycle}
                year={year}
                key={forceRenderKey}
              />
            </TabPane>
          </Tabs>
          <div className="table-box">
            <Table
              columns={columns}
              dataSource={tipDialogTableData}
              pagination={false}
              bordered
            ></Table>
          </div>
        </Card>
      </Modal>
    </>
  );
});
export default CronCustom;
