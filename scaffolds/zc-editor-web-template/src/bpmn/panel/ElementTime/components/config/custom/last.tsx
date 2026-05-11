import { LAST } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import { isNumber } from '../../../util/tools'
import React, {useEffect, useRef, useState, useMemo,forwardRef,useImperativeHandle} from 'react';
import {Radio, Select, message, Tooltip, Button, InputNumber} from 'antd';
// export default function LASTS(props: any) {
  const LASTS = forwardRef(function LASTS(props,ref) {

    const [messageApi, contextHolder] = message.useMessage();

const label = useRef(LAST)
const type_ = useRef(props.type)
const lastNum = useRef(1)

const tag_ = useMemo(() => {
  if (type_.current !== LAST) {
    return
  }
  let newValue = lastNum.current === 1 ? LAST : LAST + '-' + (lastNum.current - 1)
  if (newValue === LAST) {
    lastNum.current = 1
    return
  }
  const numStr = newValue.substring(2)
  if (!isNumber(numStr) || parseInt(numStr) < props.lastConfig.min - 1 || parseInt(numStr) > props.lastConfig.max - 1) {
    // this.$message.error(this.$t('common.numError') + ':' + numStr)
    messageApi.open({
        type: 'error',
        content: '含有非法数字' + ':' + numStr
      });
    return
  }
  lastNum.current = parseInt(numStr) + 1
}, [lastNum.current === 1 ? LAST : LAST + '-' + (lastNum.current - 1)]);
useEffect(()=>{
  if (type_.current === label.current) {
    props.tagChanged(tag_)
  }
},[type_])
useImperativeHandle(ref,()=>{
  return {type_}
})
const  change = (e) => {
  props.typeChanged(e.target.value)
  props.tagChanged(e.target.value)
  // props.typeChanged(type_.current)
  // props.tagChanged(tag_)
  // this.$emit('type-changed', this.type_)
  // this.$emit('tag-changed', this.tag_)
}
  return (
    <>
    <Radio.Group onChange={change} value={type_.current}>
        <Radio value={label.current}>
      <span>{ tag_ }</span>
      本月倒数第
      {/* 本{ props.targetTimeUnit.current }倒数第 */}
      {/* <span class="cell-symbol">{{ tag_ }}</span> */}
      <InputNumber 
      value={lastNum.current} 
      precision={0}
      min={props.lastConfig?.min}
      step={props.lastConfig?.step}
      max={props.lastConfig?.max} 
      size={props.size} 
      disabled={type_.current !== label.current} />
      { props.timeUnit.current }
      </Radio>
      </Radio.Group>
    </>
  )

})
export default LASTS
{/* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      <span class="cell-symbol">{{ tag_ }}</span>
      {{ $t('common.current') }}{{ targetTimeUnit }}{{ $t('custom.lastTh') }}
      <el-input-number v-model="lastNum" :precision="0" :min="lastConfig.min" :step="lastConfig.step" :max="lastConfig.max" :size="size" :disabled="type_ !== label" />
      {{ timeUnit }}
    </el-radio>
  </div>
</template>

<script>
import { LAST } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import { isNumber } from '../../../util/tools'

export default {
  mixins: [watchValue],
  props: {
    lastConfig: {
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
    targetTimeUnit: {
      type: String,
      default: null
    },
    type: {
      type: String,
      default: LAST
    },
    tag: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      label: LAST,
      type_: this.type,
      lastNum: 1
    }
  },
  computed: {
    tag_: {
      get() {
        return this.lastNum === 1 ? LAST : LAST + '-' + (this.lastNum - 1)
      },
      set(newValue) {
        if (this.type_ !== LAST) {
          return
        }
        if (newValue === LAST) {
          this.lastNum = 1
          return
        }
        const numStr = newValue.substring(2)
        if (!isNumber(numStr) || parseInt(numStr) < this.lastConfig.min - 1 || parseInt(numStr) > this.lastConfig.max - 1) {
          this.$message.error(this.$t('common.numError') + ':' + numStr)
          return
        }
        this.lastNum = parseInt(numStr) + 1
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
