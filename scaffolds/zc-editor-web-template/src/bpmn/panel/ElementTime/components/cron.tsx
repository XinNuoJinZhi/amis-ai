import Second from './time/second'
import Minute from './time/minute'
import Hour from './time/hour'
import DayOfMonth from './time/dayOfMonth'
import Month from './time/month'
import Year from './time/year'
import DayOfWeek from './time/dayOfWeek'
import { getLocale } from '../util/tools'
import React, { useEffect, useRef, useState } from 'react';
import {
  Popover, Button, Input, Select, Space,Row,Col, Tabs,
} from 'antd';

import {
  EMPTY,
  EVERY,
  UNFIXED,
  BASE_SYMBOL,
  DAY_OF_MONTH_SYMBOL,
  DAY_OF_WEEK_SYMBOL,
  DEFAULT_CRON_EXPRESSION
} from '../constant/filed'

export default function Cron(props: any) {
  console.log(props,'Cron组件接受的数据')
  const {TabPane} = Tabs
  const [tabData,setTabData] = useState('1')
  const [activeTabName, setActiveTabName] = useState(1)
  const [tag, setTag] = useState({
    second: EVERY,
    minute: EVERY,
    hour: EVERY,
    dayOfMonth: EVERY,
    month: EVERY,
    dayOfWeek: UNFIXED,
    year: EMPTY
  })
  const input1 = useRef()
  const input2 = useRef()
  const input3 = useRef()
  const input4 = useRef()
  const input5 = useRef()
  const input6 = useRef()
  const input7 = useRef()
  const inputRef = React.createRef();
  // 监听tag
  useEffect(() => {
    console.log(tag,'监听cron总值的变化')
    changeCron()
  }, [tag])
  // 监听传参value
  useEffect(() => {
    console.log(props.value,'监听传参值的变化')
    changeTime(props.value)
  }, [props.value])
  // 监听传参activeTabName
  // useEffect(() => {
  //   console.log(activeTabName, 'activeTabName')
  //   const input_ = inputRef.current['input' + activeTabName]
  //   if (input_) {
  //     input_.focus()
  //   }
  // }, [activeTabName])

  const timeUnits = useRef(['秒', '分', '时', '日', '月', '周', '年'])
  const vals = useRef([
    '0 1 2...59', '0 1 2...59', '0 1 2...23', '1 2...31',
    '1 2...12，或12个月的缩写(JAN ... DEC)',
    '1 2...7或星期的缩写(SUN ... SAT)',
    new Date().getFullYear() + ' ... ' + 2099
  ])
  const symbols = useRef([
    BASE_SYMBOL, BASE_SYMBOL, BASE_SYMBOL, DAY_OF_MONTH_SYMBOL, BASE_SYMBOL, DAY_OF_WEEK_SYMBOL, BASE_SYMBOL
  ])
  // const sample = useRef('')
  const [sample,setSample] = useState('')
  const cases = useRef([])
  const bakCases = useRef([])
  const changeSecond = (tags: any) => {
    console.log(tags,'tagtagtagtag')
    setTag({...tag,second:tags})
  }
  const changeMinute = (tags: any) => {
    setTag({...tag,minute:tags})
  }
  const changeHour = (tags: any) => {
    setTag({...tag,hour:tags})
  }
  const changeDayOfMonth = (tags: any) => {
    setTag({...tag,dayOfMonth:tags})
  }
  const changeMonth = (tags: any) => {
    setTag({...tag,month:tags})
  }
  const changeDayOfWeek = (tags: any) => {
    setTag({...tag,dayOfWeek:tags})
  }
  const changeYear = (tags: any) => {
    setTag({...tag,year:tags})
  }
  const changeCron = () => {
    const cron = (tag.second + ' ' + tag.minute + ' ' + tag.hour + ' ' + tag.dayOfMonth + ' ' +
      tag.month + ' ' + tag.dayOfWeek + ' ' + tag.year).trim()
    // this.$emit('change', cron)
    props.change(cron)
  }
  const changeTime = (newValue: any) => {
    console.log(newValue,'newValue')
    if (!newValue || newValue.trim().length < 11) {
      // this.$message.error(this.$t('common.wordNumError'))
      return
    }
    const arr = newValue.trim().split(' ')
    if (arr.length !== 6 && arr.length !== 7) {
      // this.$message.error(this.$t('common.wordNumError'))
      return
    }
    setTag({
      second:arr[0],
      minute: arr[1],
hour: arr[2],
dayOfMonth: arr[3],
month: arr[4],
dayOfWeek: arr[5],
year: arr.length === 7 ? arr[6] : ''
    })
    // tag.second = arr[0]
    // tag.minute = arr[1]
    // tag.hour = arr[2]
    // tag.dayOfMonth = arr[3]
    // tag.month = arr[4]
    // tag.dayOfWeek = arr[5]
    // tag.year = arr.length === 7 ? arr[6] : ''
  }
  const filterCase = (query: any) => {
    if (query !== '') {
      // this.loading = true
      setTimeout(() => {
        // this.loading = false
        cases.current = bakCases.current.filter(item => {
          return item.label.toLowerCase()
            .indexOf(query.toLowerCase()) !== -1 ||
            item.value.toLowerCase()
              .indexOf(query.toLowerCase()) !== -1
        })
      }, 100)
    } else {
      cases.current = bakCases.current
    }
  }
  const loadConst = () => {
    import('../translate/dict.js').then(array => {
      bakCases.current = cases.current = array['cases_' + getLocale()]
    })
  }
  useEffect(()=>{
    loadConst()
    filterCase('')
    changeTime(props.value)
  },[])
const input1Change = (e) =>{
  console.log(e,'分input值变化')
  setTag({...tag,second:e.target.value})
}
  // 帮助tab选择
  const handleChange = (e) =>{
    console.log(e,'帮助的下拉选择e')
    // sample.current=e
    setSample(e)
  }
const dataOnFocus = (e) =>{
  console.log(e,'聚焦')
  setTabData(e+'')
}
const onChange = (e) =>{
  console.log(e,'tab选择')
  setTabData(e)
  if(e==1){
    input1.current!.focus({
      cursor: 'end',
    });
  }
  if(e==2){
    input2.current!.focus({
      cursor: 'end',
    });
  }
  if(e==3){
    input3.current!.focus({
      cursor: 'end',
    });
  }
  if(e==4){
    input4.current!.focus({
      cursor: 'end',
    });
  }
  if(e==5){
    input5.current!.focus({
      cursor: 'end',
    });
  }
  if(e==6){
    input6.current!.focus({
      cursor: 'end',
    });
  }
  if(e==7){
    input7.current!.focus({
      cursor: 'end',
    });
  }
}
  return (
    <>
      <Row>
        <Row gutter={2}>
          <Col className="gutter-row" span={3}>
            <Input ref={input1} value={tag.second} onChange={input1Change} size={props.size} onFocus={()=>dataOnFocus(1)} />
            {/* <Input value={tag.second} size={props.size} onFocus={activeTabName == 1} /> */}
          </Col>
          <Col className="gutter-row" span={3}>
            <Input ref={input2} value={tag.minute} size={props.size} onFocus={()=>dataOnFocus(2)} />
            {/* <Input ref={"input2"} value={tag.minute} size={props.size} focus={"activeTabName='2'"} /> */}
          </Col>
          <Col className="gutter-row" span={3}>
            <Input ref={input3} value={tag.hour} size={props.size} onFocus={()=>dataOnFocus(3)}/>
            {/* <Input ref={"input3"} value={tag.hour} size={props.size} focus={"activeTabName='3'"} /> */}
          </Col>
          <Col className="gutter-row" span={3}>
            <Input ref={input4} value={tag.dayOfMonth} size={props.size} onFocus={()=>dataOnFocus(4)}/>
            {/* <Input ref={"input4"} value={tag.dayOfMonth} size={props.size} focus={"activeTabName='4'"} /> */}
          </Col>
          <Col className="gutter-row" span={3}>
            <Input ref={input5} value={tag.month} size={props.size} onFocus={()=>dataOnFocus(5)}/>
            {/* <Input ref={"input5"} value={tag.month} size={props.size} focus={"activeTabName='5'"} /> */}
          </Col>
          <Col className="gutter-row" span={3}>
            <Input ref={input6} value={tag.dayOfWeek} size={props.size} onFocus={()=>dataOnFocus(6)} />
            {/* <Input ref={"input6"} value={tag.dayOfWeek} size={props.size} focus={"activeTabName='6'"} /> */}
          </Col>
          <Col className="gutter-row" span={3}>
            <Input ref={input7} value={tag.year} size={props.size} onFocus={()=>dataOnFocus(7)} />
            {/* <Input ref={"input7"} value={tag.year} size={props.size} focus={"activeTabName='7'"} /> */}
          </Col>
        </Row>
      </Row>
      <Row>
        <Tabs
          onChange={onChange}
          activeKey={tabData}
          type="card"
          defaultActiveKey={'1'}
          
        // items={[
        //   {key:'1',label:''},
        //   {key:'2',label:''},
        //   {key:'3',label:''},
        //   {key:'4',label:''},
        //   {key:'5',label:''},
        //   {key:'6',label:''},
        //   {key:'7',label:''},
        //   {key:'8',label:''},
        // ]}
        >
          {/* {items => items.map((item:any) => (
            <> */}
          <TabPane tab={'秒'} key='1'>
            <Second
              tag={tag.second}
              size={props.size}
              secondChange={changeSecond}
            />
          </TabPane>
           {/* <TabPane tab={'分'} key='2'>
            <Minute
              tag={tag.minute}
              size={props.size}
              minuteChange={changeMinute}
            />
          </TabPane>
          <TabPane tab={'时'} key="3">
            <Hour
              tag={tag.hour}
              size={props.size}
              hourChange={changeHour}
            />
          </TabPane>
          <TabPane tab={'日'} key="4">
            <DayOfMonth
              tag={tag.dayOfMonth}
              size={props.size}
              dayOfMonthChange={changeDayOfMonth}
            />
          </TabPane>
          <TabPane tab={'月'} key="5">
            <Month
              tag={tag.month}
              size={props.size}
              monthChange={changeMonth}
            />
          </TabPane>
          <TabPane tab={'周'} key="6">
            <DayOfWeek
              tag={tag.dayOfWeek}
              size={props.size}
              dayOfWeekChange={changeDayOfWeek}
            />
          </TabPane>
          <TabPane tab={'年'} key="7">
            <Year
              tag={tag.year}
              size={props.size}
              yearChange={changeYear}
            />
          </TabPane> */}
            {/* <span style={{ marginRight: "10px" }}> */}
              {/* <Button size={props.size} type="primary" onClick={() => changeTime(sample)}>使用</Button> */}
            {/* </span> */}
          {/* <TabPane tab={'帮助'} key="8">
            <Row>
              <Button disabled={!sample || sample.trim().length < 11} size={props.size} type="primary" onClick={() => changeTime(sample)}>使用</Button>
            </Row>
            <Row>
            <Select
              style={{ minWidth: "320px", width: "120" }} 
              defaultValue="lucy"
              onChange={handleChange}
              placeholder="请选择"
              value={sample}
              filterOption={(input, option) => (option?.label ?? '').includes(input)}
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
              }
            >
              {cases.current.map(item =>
                <Select.Option
                  key={item.value}
                  label={item.label}
                  value={item.value}>
                  <span style={{ float: "left" }}>{item.label}</span>
                  <span style={{ float: "right", color: "#8492a6",fontSize: "13px" }}>{item.value}</span>
                </Select.Option>
              )}
            </Select>
            </Row>
            <Row>
            <span style={{ marginLeft: "5px" }}>
              { sample }
            </span>
            </Row>
            <Row>
            {timeUnits.current.map((item, index) =>
              <>
              <Row>
                {item}:值为<strong>{vals[index]}</strong>
                通配符支持<strong>{symbols[index]}</strong> 
              </Row>
              </>
            )}
            </Row>
          </TabPane> */}s
            {/* <el-select
              v-model="sample"
              :size={props.size}
              :placeholder="$t('common.placeholder')"
              :filter-method="filterCase"
              style="min-width: 320px;"
              filterable
            >
              <el-option
                v-for="item in cases"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <span style="float: left">{{ item.label }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ item.value }}</span>
              </el-option>
            </el-select>
            <span style="margin-left: 5px;">
              {{ sample }}
            </span>
           </div>
            {/* <div v-for="(item, index) in timeUnits" :key="index">
            {{ item }}:{{ $t('common.valTip') }}<strong>{{ vals[index] }}</strong>
            {{ $t('common.symbolTip') }}<strong>{{ symbols[index] }}</strong>
            </div> */}
           {/* </Row> */}
           {/* </>))} */}
        </Tabs>
      </Row>
    </>
  )

}

