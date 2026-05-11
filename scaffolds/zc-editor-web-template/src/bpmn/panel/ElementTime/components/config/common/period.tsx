import { EVERY, PERIOD } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import { isNumber } from '../../../util/tools'
import {Radio,Select,message,Tooltip,Button,InputNumber } from 'antd';
import React, {useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle} from 'react';
// export default function Period(props: any) {
const Period = forwardRef(function Period(props,ref) {
  console.log(props,'period222222222222222')
  const [messageApi, contextHolder] = message.useMessage();

  const label = useRef(PERIOD)
  const [type_,setType_] = useState(props.type)
  // const type_ = useRef(props.type)
  // const start = useRef(0)
  // const cycle = useRef(1)
  const [start,setStart] = useState(0)
  const [cycle,setCycle] = useState(1)

  const tag_ = useMemo(() => {
    console.log(type_,'type_.currenttype_.current')
    if (type_ !== '/') {
      return
    }
    console.log('进入')
    let newValue = start + '/' + cycle
    const arr = newValue.split('/')
    if (arr.length !== 2) {
      // this.$message.error(this.$t('common.tagError') + ':' + newValue)
      messageApi.open({
        type: 'error',
        content: '表达式不正确' + ':' + newValue,
      });
      return
    }
    if (arr[0] === EVERY) {
      arr[0] = 0
    }
    if (!isNumber(arr[0]) || parseInt(arr[0]) < props.startConfig.min || parseInt(arr[0]) > props.startConfig.max) {
      // this.$message.error(this.$t('period.startError') + ':' + arr[0])
      messageApi.open({
        type: 'error',
        content: '开始格式不符' + ':' + arr[0],
      });
      return
    }
    if (!isNumber(arr[1]) || parseInt(arr[1]) < props.cycleConfig.min || parseInt(arr[1]) > props.cycleConfig.max) {
      // this.$message.error(this.$t('period.cycleError') + ':' + arr[1])
      messageApi.open({
        type: 'error',
        content: '循环格式不符' + ':' + arr[1],
      });
      return
    }
    console.log(parseInt(arr[0]),'parseInt(arr[0])')
    console.log(parseInt(arr[1]),'parseInt(arr[1])')
    // start.current = parseInt(arr[0])
    // cycle.current = parseInt(arr[1])
    setStart(parseInt(arr[0]))
    setCycle(parseInt(arr[1]))
    return start + '/' + cycle
  },[start,cycle])

  useEffect(()=>{
    if (type_ === label.current) {
      console.log(tag_,'从第某某开始某某')
      props.tagChanged(tag_);
    }
  },[tag_])
  useEffect(()=>{
    // tag_ = props.tag
    props.tagChanged(props.tag);
  },[props.tag])

  // 方法
  const change = (e) => {
    console.log(e,'eeeeee')
    console.log(type_,'type_.currenttype_.current')
    console.log(tag_,'tag_tag_')
    // type_.current = e.target.value
    props.typeChanged(type_);
    props.tagChanged(tag_);
    // props.typeChanged(type_.current)
    // this.$emit('type-changed', this.type_)
    // this.$emit('tag-changed', this.tag_)
  }

  const onChange = (e) =>{
    // console.log(e,'数值变化')
    // start = e
    setStart(e)
  }
  const onChange1 = (e) =>{
    // console.log(e,'数值变化1')
    // cycle = e
    setCycle(e)
  }
  useImperativeHandle(ref,()=>{
    return {type_}
  })
  return(
    <>
    {/* <Radio value={type_.current} name={label.current} onChange={change}> */}
    {/* <Radio.Group onChange={change} value={type_.current} defaultValue={'0/1'}> */}
    <Radio.Group onChange={change} value={type_}>
      <Radio value={label.current}>
    <span style={{color: '#67c23a'}}>{ tag_ }</span>
    {/* <span class="cell-symbol">{ tag_ }</span> */}
    从第
    <InputNumber 
    value={start}
    min={props.startConfig.min} 
    max={props.startConfig.max} 
    precision={0} 
    disabled={type_ !== label.current}
    step={props.startConfig.step}
    onChange={onChange}
    // onChange={onChange} 
    />
      { props.timeUnit.current }开始每
      <InputNumber
       value={cycle} 
       precision={0}
       min={props.cycleConfig.min}
       step={props.cycleConfig.step} 
       max={props.cycleConfig.max} 
       size={props.size} 
       disabled={type_ !== label.current} 
       onChange={onChange1}
      //  onChange={onChange1}
       />
      { props.timeUnit.current }
      </Radio>
    </Radio.Group>
    </>
  )
})
export default Period
{/* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      <span class="cell-symbol">{{ tag_ }}</span>
      {{ $t('common.fromThe') }}
      <el-input-number v-model="start" :precision="0" :min="startConfig.min" :step="startConfig.step" :max="startConfig.max" :size="size" :disabled="type_ !== label" />
      {{ timeUnit }}{{ $t('common.start') }}{{ $t('common.every') }}
      <el-input-number v-model="cycle" :precision="0" :min="cycleConfig.min" :step="cycleConfig.step" :max="cycleConfig.max" :size="size" :disabled="type_ !== label" />
      {{ timeUnit }}
    </el-radio>
  </div>
</template>

<script>
import { EVERY, PERIOD } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import { isNumber } from '../../../util/tools'

export default {
  mixins: [watchValue],
  props: {
    startConfig: {
      type: Object,
      default: null
    },
    cycleConfig: {
      type: Object,
      default: null
    },
    size: {
      type: String,
      default: 'mini'
    },
    timeUnit: {
      type: String,
      default: null
    },
    type: {
      type: String,
      default: PERIOD
    },
    tag: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      label: PERIOD,
      type_: this.type,
      start: 0,
      cycle: 1
    }
  },
  computed: {
    tag_: {
      get() {
        return this.start + PERIOD + this.cycle
      },
      set(newValue) {
        if (this.type_ !== PERIOD) {
          return
        }
        const arr = newValue.split(PERIOD)
        if (arr.length !== 2) {
          this.$message.error(this.$t('common.tagError') + ':' + newValue)
          return
        }
        if (arr[0] === EVERY) {
          arr[0] = 0
        }
        if (!isNumber(arr[0]) || parseInt(arr[0]) < this.startConfig.min || parseInt(arr[0]) > this.startConfig.max) {
          this.$message.error(this.$t('period.startError') + ':' + arr[0])
          return
        }
        if (!isNumber(arr[1]) || parseInt(arr[1]) < this.cycleConfig.min || parseInt(arr[1]) > this.cycleConfig.max) {
          this.$message.error(this.$t('period.cycleError') + ':' + arr[1])
          return
        }
        this.start = parseInt(arr[0])
        this.cycle = parseInt(arr[1])
      }
    }
  },
  methods: {
    change() {
      this.$emit('type-changed', this.type_)
      this.$emit('tag-changed', this.tag_)
    }
  }
}
</script> */}
