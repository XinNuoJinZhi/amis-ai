// import Cron from './cron'
import React, {useEffect, useRef, useState} from 'react';
import { DEFAULT_CRON_EXPRESSION } from '../constant/filed'
import {Form,Button,message, Input, Select, InputNumber,DatePicker,Row,Col} from 'antd';
import type { DatePickerProps, RangePickerProps } from 'antd/es/date-picker';
import {  ReloadOutlined } from '@ant-design/icons';
import Cron from "qnn-react-cron";
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs'
import MoreTime from './more-time'
export default function StandardFormat(props: any) {
  console.log(props,'StandardFormat props')
  const [moreTimeData,setMoreTimeData] = useState(props.value)
  const [inputData,setInputData] = useState(1)
  const [dateData,setDateData] = useState('2023-11-01T13:49:09')
// form
const [form] = Form.useForm<{
  circulate: number;
  dateTime: string;
  config: string;
}>();
  useEffect(()=>{
    console.log(props.value,'typeof props.valuetypeof props.value')
    if(props.value != '' && typeof props.value == 'object'){
      let data
      let data1
      let data2
      props.value.forEach(res=>{
        if(res.type=='number'){
          data = res.value
        }
        if(res.type=='timeDate'){
          data1 = dayjs(res.value,'YYYY-MM-DD HH:mm:ss')
        }
        if(res.type=='moreTime'){
          data2 = res.value
        }
      })
      // let data = props.value.split('/')
      // console.log(data,'回显的数据')
      // var reg1 = new RegExp("R","g"); // 加'g'，删除字符串里所有的"a"
      // let data1 = Number(data[0].replace(reg1,""))
      // let data2 = dayjs(data[1],'YYYY-MM-DD HH:mm:ss')
      // console.log(data2,'data2data2data2data2')
      // setInputData(data1)
      // setDateData(data[3])
      setMoreTimeData(data2)
      form.setFieldsValue({
        circulate:data,
        dateTime:data1
      })
    }
  },[props.value])

  // 循环次数
  const numberOnChange = (e) =>{
    console.log(e,'循环次数')
    props.timeChange({type:'number',value:e})
  }
  function _(e) {
    const t = new Date(e);
    return t.setTime(t.getTime()),
      `${t.getFullYear()}-${t.getMonth() + 1 < 10 ? "0" + (t.getMonth() + 1) : t.getMonth() + 1}-${t.getDate() < 10 ? "0" + t.getDate() : t.getDate()}T ${t.getHours() < 10 ? "0" + t.getHours() : t.getHours()}:${t.getMinutes() < 10 ? "0" + t.getMinutes() : t.getMinutes()}:${t.getSeconds() < 10 ? "0" + t.getSeconds() : t.getSeconds()}`
  }
  // 日期时间
  const pickerChange = (value, dateString) =>{
    console.log(value,'日期时间改变')
    console.log(dateString,'日期时间改变1')
    let timeDate = _(dateString).replace(/\s*/g, '')
    console.log(timeDate,'timeDatetimeDatetimeDate')
    props.timeChange({type:'timeDate',value:timeDate})
  }

  // 五种时间选择
  const moreTimeChange = (e) =>{
    console.log(e,'五种时间变化值')
    props.timeChange({type:'moreTime',value:e.dueDate})
  }
  return(
    <>
     <Form
     form={form}
    name="basic"
    // labelCol={{ span: 6 }}
    // wrapperCol={{ span: 16 }}
    style={{ maxWidth: 600,marginTop:'10px',textAlign:'left' }}
    initialValues={{ remember: true }}
    autoComplete="off"
  >
    {/* <Form.Item
      label="循环次数："
      name="circulate"
    >
    <InputNumber value={inputData} min={1} defaultValue={inputData} onChange={numberOnChange} />                 
    </Form.Item>
    <Form.Item
      label="日期时间："
      name="dateTime"
    >
     <DatePicker locale={locale} value={dateData} format="YYYY-MM-DD HH:mm:ss" showTime onChange={pickerChange} />
    </Form.Item> */}
    <Form.Item>
      <MoreTime value={moreTimeData} submitChange={(e) => moreTimeChange(e)} />
    </Form.Item>
    </Form>
    </>
  )
}