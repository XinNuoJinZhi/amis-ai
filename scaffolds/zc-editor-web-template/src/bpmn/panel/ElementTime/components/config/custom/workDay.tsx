import { WORK_DAY } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import { isNumber } from '../../../util/tools'
import React, {useEffect, useRef, useState, useMemo,forwardRef,useImperativeHandle} from 'react';
import {Radio, Select, message, Tooltip, Button, InputNumber} from 'antd';
// export default function WorkDay(props: any) {
const WorkDay = forwardRef(function WorkDay(props,ref) {
    const [messageApi, contextHolder] = message.useMessage();

    const label = useRef(WORK_DAY)
    const type_ = useRef(props.type)
    const startDate = useRef(1)

    const tag_ = useMemo(() => {
      if (type_.current !== WORK_DAY) {
        return
      }
      let newValue = startDate.current + WORK_DAY
      const num = newValue.substring(0, newValue.length - WORK_DAY.length)
      if (!isNumber(num) || parseInt(num) < props.startDateConfig.min || parseInt(num) > props.startDateConfig.max) {
        // this.$message.error(this.$t('common.numError') + ':' + num)
        messageApi.open({
          type: 'error',
          content: '含有非法数字' + ':' + num
        });
        return
      }
      startDate.current = num
    }, [startDate.current + WORK_DAY]);
    useEffect(()=>{
      if (type_.current === label.current) {
        props.tagChanged(tag_)
      }
    },[type_])
  useImperativeHandle(ref,()=>{
      return {type_}
    })

    const change = (e) => {
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
      <span >{ tag_ }</span>
      {/* <span class="cell-symbol">{{ tag_ }}</span> */}
      每{ props.targetTimeUnit.current }
      <InputNumber
      value={startDate.current} 
      precision={0}
      min={props.startDateConfig?.min}
      step={props.startDateConfig?.step}
      max={props.startDateConfig?.max}
      size={props.size}
      disabled={type_.current !== label.current} />
      { props.timeUnit.current }最近的工作日
</Radio>
</Radio.Group>
      </>
    )
})
export default WorkDay
{/* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      <span class="cell-symbol">{{ tag_ }}</span>
      {{ $t('common.every') }}{{ targetTimeUnit }}
      <el-input-number v-model="startDate" :precision="0" :min="startDateConfig.min" :step="startDateConfig.step" :max="startDateConfig.max" :size="size" :disabled="type_ !== label" />
      {{ timeUnit }}{{ $t('common.nearest') }}{{ $t('custom.workDay') }}
    </el-radio>
  </div>
</template>

<script>
import { WORK_DAY } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import { isNumber } from '../../../util/tools'

export default {
  mixins: [watchValue],
  props: {
    startDateConfig: {
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
      default: WORK_DAY
    },
    tag: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      label: WORK_DAY,
      type_: this.type,
      startDate: 1
    }
  },
  computed: {
    tag_: {
      get() {
        return this.startDate + WORK_DAY
      },
      set(newValue) {
        if (this.type_ !== WORK_DAY) {
          return
        }
        const num = newValue.substring(0, newValue.length - WORK_DAY.length)
        if (!isNumber(num) || parseInt(num) < this.startDateConfig.min || parseInt(num) > this.startDateConfig.max) {
          this.$message.error(this.$t('common.numError') + ':' + num)
          return
        }
        this.startDate = num
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
