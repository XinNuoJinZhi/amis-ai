import { RANGE } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import { isNumber } from '../../../util/tools'
import {Radio,Select,message,Tooltip,Button,InputNumber } from 'antd';
import React, {useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle} from 'react';
// export default function Range(props: any) {
const Range = forwardRef(function Range(props,ref) {
  console.log(props,'在某某到某某之间')
  const [messageApi, contextHolder] = message.useMessage();

  const label = useRef(RANGE)
  // const type_ = useRef(props.type)
  const [type_,setType_] = useState(props.type)
  // const lower = useRef(0)
  // const upper_ = useRef(props.upper)
  const [lower,setLower] = useState(0)
  const [upper_,setUpper_] = useState(props.upper?props.upper:1)

  const tag_ = useMemo(() => {
    if (type_ !== RANGE) {
      return
    }
    let newValue = lower + RANGE + upper_
    const arr = newValue.split(RANGE)
    if (arr.length !== 2) {
      // this.$message.error(this.$t('common.tagError') + ':' + newValue)
      messageApi.open({
        type: 'error',
        content: '表达式不正确' + ':' + newValue,
      });
      return
    }
    if (!isNumber(arr[0]) || parseInt(arr[0]) < props.lowerConfig.min || parseInt(arr[0]) > props.lowerConfig.max) {
      // this.$message.error(this.$t('period.startError') + ':' + arr[0])
      messageApi.open({
        type: 'error',
        content: '下限格式不符' + ':' + arr[0],
      });
      return
    }
    if (!isNumber(arr[1]) || parseInt(arr[1]) < props.upperConfig.min || parseInt(arr[1]) > props.upperConfig.max) {
      // this.$message.error(this.$t('period.cycleError') + ':' + arr[1])
      messageApi.open({
        type: 'error',
        content: '上限格式不符' + ':' + arr[1],
      });
      return
    }
    if (parseInt(arr[0]) > parseInt(arr[1])) {
      // this.$message.error(this.$t('range.lowerBiggerThanUpperError') + ':' + arr[0] + '>' + arr[1])
      messageApi.open({
        type: 'error',
        content: '下限不能比上限大' + ':' + arr[0] + '>' + arr[1],
      });
      return
    }
    // lower.current = parseInt(arr[0])
    // upper_.current = parseInt(arr[1])
    setLower(parseInt(arr[0]))
    setUpper_(parseInt(arr[1]))
    return lower + RANGE + upper_
  },[lower,upper_])

  useEffect(()=>{
    if (type_ === label.current) {
      console.log(tag_,'111')
      props.tagChanged(tag_);
    }
  },[tag_])

  // 方法
  const change = (e) => {
    props.typeChanged(type_);
    props.tagChanged(tag_);
    // props.typeChanged(e.target.value)
    // props.tagChanged(tag_)
    // this.$emit('type-changed', this.type_)
    // this.$emit('tag-changed', this.tag_)
  }
  const onChange = (e) =>{
    setLower(e)
  }
  const onChange1 = (e) =>{
    setUpper_(e)
  }
  useImperativeHandle(ref,()=>{
    return {type_}
  })
  return (
    <>
    <Radio.Group value={type_} onChange={change}>
    <Radio value={label.current}>
    <span style={{color: '#67c23a'}}>{ tag_ }</span>
    {/* <span class="cell-symbol">{ tag_ }</span> */}
    在
      <InputNumber 
      value={lower}
       precision={0} 
       min={props.lowerConfig.min} 
       step={props.lowerConfig.step} 
       max={upper_}
       size={props.size}
       disabled={type_ !== label.current}
       onChange={onChange}
        />
      { props.timeUnit.current }到
      <InputNumber 
      value={upper_} 
      precision={0} 
      min={lower} 
      step={props.upperConfig.step} 
      max={props.upperConfig.max}
      size={props.size}
      disabled={type_ !== label.current}
      onChange={onChange1} />
      之间的每{ props?.timeUnit?.current }
    </Radio>
    </Radio.Group>
    </>
  )
})
export default Range
{/* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      <span class="cell-symbol">{{ tag_ }}</span>
      {{ $t('common.between') }}
      <el-input-number v-model="lower" :precision="0" :min="lowerConfig.min" :step="lowerConfig.step" :max="upper_" :size="size" :disabled="type_ !== label" />
      {{ timeUnit }}{{ $t('common.and') }}
      <el-input-number v-model="upper_" :precision="0" :min="lower" :step="upperConfig.step" :max="upperConfig.max" :size="size" :disabled="type_ !== label" />
      {{ $t('common.end') }}{{ $t('common.every') }}{{ timeUnit }}
    </el-radio>
  </div>
</template>

<script>
import { RANGE } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import { isNumber } from '../../../util/tools'

export default {
  mixins: [watchValue],
  props: {
    upper: {
      type: Number,
      default: 1
    },
    lowerConfig: {
      type: Object,
      default: null
    },
    upperConfig: {
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
      default: RANGE
    },
    tag: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      label: RANGE,
      type_: this.type,
      lower: 0,
      upper_: this.upper
    }
  },
  computed: {
    tag_: {
      get() {
        return this.lower + RANGE + this.upper_
      },
      set(newValue) {
        if (this.type_ !== RANGE) {
          return
        }
        const arr = newValue.split(RANGE)
        if (arr.length !== 2) {
          this.$message.error(this.$t('common.tagError') + ':' + newValue)
          return
        }
        if (!isNumber(arr[0]) || parseInt(arr[0]) < this.lowerConfig.min || parseInt(arr[0]) > this.lowerConfig.max) {
          this.$message.error(this.$t('range.lowerError') + ':' + arr[0])
          return
        }
        if (!isNumber(arr[1]) || parseInt(arr[1]) < this.upperConfig.min || parseInt(arr[1]) > this.upperConfig.max) {
          this.$message.error(this.$t('range.upperError') + ':' + arr[1])
          return
        }
        if (parseInt(arr[0]) > parseInt(arr[1])) {
          this.$message.error(this.$t('range.lowerBiggerThanUpperError') + ':' + arr[0] + '>' + arr[1])
          return
        }
        this.lower = parseInt(arr[0])
        this.upper_ = parseInt(arr[1])
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
