import React, { Fragment, useState, useCallback, useRef, useEffect } from 'react';
import { Select, TimePicker, Input } from 'antd';
 
const Option = Select.Option;
const mwidth80 = { minWidth: 80, marginRight: 10 };
const width150 = { width: 150 };
const eachNum = (start, end, str) => {
  const back = [];
  for (let i = start; i <= end; i++) {
    back.push({
      value: `${i}`,
      label: `${i} ${str}`,
    });
  }
  return back;
};
 
const zhCNLanguage = {
  dayOfWeekList: [
    { label: '周一', value: 'MON' },
    { label: '周二', value: 'TUE' },
    { label: '周三', value: 'WED' },
    { label: '周四', value: 'THU' },
    { label: '周五', value: 'FRI' },
    { label: '周六', value: 'SAT' },
    { label: '周日', value: 'SUN' },
  ],
  minuteOfHoursList: eachNum(0, 59, '分'),
  dayOfMonthList: [
    ...eachNum(1, 31, '号'),
    {
      label: '月末',
      value: 'L',
      exclusive: true,
    },
  ],
  monthOfYearList: eachNum(1, 12, '月'),
  freqList: [
    { value: 'everyHours', label: '每小时' },
    { value: 'everyday', label: '每天' },
    { value: 'week', label: '每周' },
    { value: 'month', label: '每月' },
    // { value: 'year', label: '每年' },
    { value: 'custom', label: '自定义' },
  ],
  date:'日期',
  month:'月份',
  week:'星期',
  minute:'分钟',
}
 
const enUSLanguage = {
  dayOfWeekList: [
    { label: 'Monday', value: 'MON' },
    { label: 'Tuesday', value: 'TUE' },
    { label: 'Wednesday', value: 'WED' },
    { label: 'Thursday', value: 'THU' },
    { label: 'Friday', value: 'FRI' },
    { label: 'Saturday', value: 'SAT' },
    { label: 'Sunday', value: 'SUN' },
  ],
  minuteOfHoursList: eachNum(0, 59, 'Branch'),
  dayOfMonthList: [
    ...eachNum(1, 31, 'Day'),
    {
      label: 'at the end of the month',
      value: 'L',
      exclusive: true,
    },
  ],
  monthOfYearList: eachNum(1, 12, 'Month'),
  freqList: [
    { value: 'everyHours', label: 'every hour' },
    { value: 'everyday', label: 'every day' },
    { value: 'week', label: 'weekly' },
    { value: 'month', label: 'monthly' },
    // { value: 'year', label: '每年' },
    { value: 'custom', label: 'custom' },
  ],
  date:'date',
  month:'month',
  week:'week',
  minute:'minute',
}
 
 
let labelObj = zhCNLanguage;
const exclusiveDays = labelObj.dayOfMonthList.filter((d) => d.exclusive).map((d) => d.value);
const checkIncludeExclusive = (dd) => {
  return !!(dd || []).find((d) => exclusiveDays.includes(d));
};
const cornFormat = (corn, mode) => {
  const value = corn || '0 0 0 * * ?';
  const cronElements = value.split(' ');
  let [ss, mm, HH, dd, MM, week, yyyy] = cronElements;
  let freq;
  if (yyyy !== '*' || /[-\/#]/.test(value) || (!mode && /[,]/.test(value))) {
    freq = 'custom';
  } else if (week !== '?') {
    freq = 'week';
  } else if (MM === '*' && dd === '*' && HH === '*' && mm !== '*' && ss === '0') {
    freq = 'everyHours';
  } else if (MM === '*' && dd === '*') {
    freq = 'everyday';
  } else if (MM === '*') {
    freq = 'month';
  } else if (MM !== '*') {
    freq = 'year';
  }
 
  return {
    freq,
    stringValue: value,
    ss: parseInt(ss) || 0,
    mm: freq === 'everyHours' && !!mode ? mm.split(',').filter((i) => !!i) : parseInt(mm) || 0,
    HH: parseInt(HH) || 0,
    dd: dd.split(',').filter((i) => !!i),
    MM: MM.split(',').filter((i) => !!i),
    week: week.split(',').filter((i) => !!i),
    yyyy,
  };
};
const cornStringify = ({ freq, stringValue, ss, mm, HH, dd, MM, week, yyyy }) => {
  if (freq === 'custom') {
    return stringValue;
  } else if (freq === 'year') {
    week = '?';
    if (!dd || dd.length <= 0) {
      dd = '*';
    }
  } else if (freq === 'month') {
    MM = '*';
    week = '?';
  } else if (freq === 'week') {
    MM = '*';
    dd = '?';
  } else if (freq === 'everyday') {
    MM = '*';
    week = '?';
    dd = '*';
  } else if (freq === 'everyHours') {
    MM = '*';
    week = '?';
    dd = '*';
    HH = '*';
    ss = '0';
  }
 
  return `${ss} ${mm} ${HH} ${dd} ${MM} ${week}`;
};
 
export default function CronForm({ defaultValue, value, onChange, multiple, disabled, language }) {
 
  if(language === 'en'){
    labelObj = enUSLanguage;
  }
  const [objValue, setObjValue] = useState({});
  const thisCron = useRef('');
  const changeValue = useCallback((newObj) => {
    const cronString = cornStringify(newObj);
    thisCron.current = cronString;
    onChange && onChange(cronString);
  });
  const onFreqChanged = useCallback((freq) => {
    setObjValue((oldObj) => {
      const newObj = {
        ...oldObj,
        freq,
        week: freq === 'week' ? ['MON'] : [],
        dd: freq === 'month' ? ['1'] : [],
        mm: Array.isArray(oldObj.mm) ? 0 : oldObj.mm,
        ...(freq === 'everyHours' && multiple
          ? {
            mm: ['0'],
          }
          : {}),
        MM: freq === 'year' ? ['1'] : '*',
        ...(freq === 'custom'
          ? {
            stringValue: cornStringify(oldObj),
          }
          : {}),
      };
      changeValue(newObj);
      return newObj;
    });
  }, []);
  const onMonthOfYearChanged = useCallback((MM) => {
    setObjValue((oldObj) => {
      const newObj = {
        ...oldObj,
        MM,
      };
      changeValue(newObj);
      return newObj;
    });
  }, []);
  const onDayOfWeekChanged = useCallback((week) => {
    setObjValue((oldObj) => {
      const newObj = {
        ...oldObj,
        week,
      };
      changeValue(newObj);
      return newObj;
    });
  }, []);
  const onDayOfMonthChanged = useCallback((dd) => {
    setObjValue((oldObj) => {
      const newObj = {
        ...oldObj,
        dd,
      };
      changeValue(newObj);
      return newObj;
    });
  }, []);
  const onFreqTimeChanged = useCallback((time) => {
    setObjValue((oldObj) => {
      const newTime = time
        ? { ss: time.second(), mm: time.minute(), HH: time.hour() }
        : { ss: 0, mm: 0, HH: 0 };
      const newObj = {
        ...oldObj,
        ...newTime,
      };
      changeValue(newObj);
      return newObj;
    });
  }, []);
  const onMinuteOfHoursListChanged = useCallback((mm) => {
    setObjValue((oldObj) => {
      const newObj = {
        ...oldObj,
        mm,
      };
      changeValue(newObj);
      return newObj;
    });
  }, []);
  const onStringValueChanged = useCallback((e) => {
    e.persist();
    setObjValue((oldObj) => {
      const newObj = {
        ...oldObj,
        stringValue: e.target.value,
      };
      changeValue(newObj);
      return newObj;
    });
  }, []);
  useEffect(() => {
    thisCron.current = value;
    const objValue = cornFormat(value || defaultValue, multiple);
    setObjValue(objValue);
    // 默认按天调度
    if (!value && !defaultValue) {
      changeValue(objValue);
    }
  }, []);
  useEffect(() => {
    if (thisCron.current !== value) {
      thisCron.current = value;
      setObjValue(cornFormat(value, multiple));
    }
  }, [value]);
  const { freq, stringValue, ss, mm, HH, dd = [], MM, week = [] } = objValue;
  const mode = multiple ? 'multiple' : undefined;
  const isYear = freq === 'year',
    isMonth = freq === 'month',
    isWeek = freq === 'week',
    isHours = freq === 'everyHours',
    isCustom = freq === 'custom';
  const isIncludeExclusive = mode && checkIncludeExclusive(dd);
  return (
    <Fragment>
      <Select value={freq} onChange={onFreqChanged} style={mwidth80} disabled={disabled}>
        {labelObj.freqList.map(({ value, label }) => (
          <Option key={value} value={value}>
            {label}
          </Option>
        ))}
      </Select>
 
      {isYear && (
        <Select
          value={MM}
          onChange={onMonthOfYearChanged}
          mode={mode}
          style={mwidth80}
          placeholder={labelObj.month}
          disabled={disabled}
        >
          {labelObj.monthOfYearList.map(({ value, label }) => (
            <Option key={value} value={value}>
              {label}
            </Option>
          ))}
        </Select>
      )}
 
      {(isYear || isMonth) && (
        <Select
          value={dd}
          onChange={onDayOfMonthChanged}
          mode={mode}
          style={mwidth80}
          placeholder={labelObj.date}
          allowClear={isYear}
          disabled={disabled}
        >
          {labelObj.dayOfMonthList.map(({ value, label, exclusive }) => (
            <Option
              key={value}
              value={value}
              disabled={
                mode && dd && dd.length > 0 && isIncludeExclusive === !exclusive
              }
            >
              {label}
            </Option>
          ))}
        </Select>
      )}
 
      {isWeek && (
        <Select
          value={week}
          onChange={onDayOfWeekChanged}
          mode={mode}
          style={mwidth80}
          placeholder={labelObj.week}
          disabled={disabled}
        >
          {labelObj.dayOfWeekList.map(({ value, label }) => (
            <Option key={value} value={value}>
              {label}
            </Option>
          ))}
        </Select>
      )}
 
      {isHours && (
        <Select
          value={mm}
          onChange={onMinuteOfHoursListChanged}
          mode={mode}
          style={mwidth80}
          placeholder={labelObj.minute}
          disabled={disabled}
        >
          {labelObj.minuteOfHoursList.map(({ value, label }) => (
            <Option key={value} value={value}>
              {label}
            </Option>
          ))}
        </Select>
      )}
 
      {!isHours && !isCustom && (
        <TimePicker
          // defaultOpenValue={dayjs('00:00:00', 'HH:mm:ss')}
          onChange={onFreqTimeChanged}
          disabled={disabled}
        />
      )}
 
      {isCustom && (
        <Input
          style={width150}
          value={stringValue}
          onChange={onStringValueChanged}
          disabled={disabled}
        />
      )}
    </Fragment>
  );
}