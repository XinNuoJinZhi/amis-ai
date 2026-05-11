import watchValue from '../../../../mixins/watchValue'
import { WEEK_DAY } from '../../../../constant/filed'
import { isNumber } from '../../../../util/tools'
import React, {useEffect, useRef, useState, useMemo,forwardRef,useImperativeHandle} from 'react';
import {Radio, Select, message, Tooltip, Button, InputNumber} from 'antd';
// export default function WeekDay(props: any) {
const WeekDay = forwardRef(function WeekDay(props,ref) {
  console.log(props,'本月第多少个多少')
  const [messageApi, contextHolder] = message.useMessage();

  const label = useRef(WEEK_DAY)
  const type_ = useRef(props.type)
  const nth = useRef(null)
  const weekDayNum = useRef(1)
  const tag_ = useMemo(() => {
    if (type_.current !== WEEK_DAY) {
      return
    }
    let newValue = weekDayNum.current + WEEK_DAY + nth.current
    const arr = newValue.split(WEEK_DAY)
    if (arr.length !== 2) {
      // this.$message.error(this.$t('common.tagError') + ':' + newValue)
       messageApi.open({
        type: 'error',
        content: '表达式不正确' + ':' + newValue
      });
      return
    }
    if (!isNumber(arr[0]) || parseInt(arr[0]) < props.nums[0].value || parseInt(arr[0]) > props.nums[props.nums.length - 1].value) {
      // this.$message.error(this.$t('weekDay.weekDayNumError') + ':' + arr[0])
       messageApi.open({
        type: 'error',
        content: '周数格式不符' + ':' + arr[0]
      });
      return
    }
    if (!isNumber(arr[1]) || parseInt(arr[1]) < 1 || parseInt(arr[1]) > 5) {
      // this.$message.error(this.$t('weekDay.nthError') + ':' + arr[1])
       messageApi.open({
        type: 'error',
        content: '天数格式不符' + ':' + arr[1]
      });
      return
    }
    weekDayNum.current = parseInt(arr[0])
    nth.current = parseInt(arr[1])
  }, [weekDayNum.current , WEEK_DAY , nth.current]);
  useEffect(()=>{
    if (type_.current === label.current) {
      props.tagChanged(tag_)
    }
  },[type_])
useImperativeHandle(ref,()=>{
    return {type_}
  })
  // 方法
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
      <span>{ tag_ }</span>
      {/* <span class="cell-symbol">{{ tag_ }}</span> */}
      本{ props.targetTimeUnit.current }第
      <InputNumber
      value={nth}
      precision={0}
      size={props.size}
      min={1} 
      step={1}
      max={5} 
      disabled={type_.current !== label.current} />
      个
      <Select
          // defaultValue="lucy"
          // onChange={handleChange}
          placeholder="请选择"
          disabled={type_.current !== label.current}
          filterOption={(input, option) =>
            (option?.label ?? '').includes(input)
          }
          filterSort={(optionA, optionB) =>
            (optionA?.label ?? '')
              .toLowerCase()
              .localeCompare((optionB?.label ?? '').toLowerCase())
          }
          mode="multiple"
          value={weekDayNum.current}
        >
          {props.nums.map(item => (
            <Select.Option
              key={item.value}
              label={item.label}
              value={item.value}
            ></Select.Option>
          ))}
        </Select>
      </Radio>
      </Radio.Group>
    </>
  )
})
export default WeekDay
{/* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      <span class="cell-symbol">{{ tag_ }}</span>
      {{ $t('common.current') }}{{ targetTimeUnit }}{{ $t('common.nth') }}
      <el-input-number v-model="nth" :precision="0" :size="size" :min="1" :step="1" :max="5" :disabled="type_ !== label" />
      {{ $t('common.index') }}
      <el-select
        v-model="weekDayNum"
        :size="size"
        :placeholder="$t('common.placeholder')"
        :disabled="type_ !== label"
        style="width: 100px;"
        filterable
      >
        <el-option
          v-for="item in nums"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-radio>
  </div>
</template>

<script>
import watchValue from '../../../../mixins/watchValue'
import { WEEK_DAY } from '../../../../constant/filed'
import { isNumber } from '../../../../util/tools'

export default {
  mixins: [watchValue],
  props: {
    nums: {
      type: Array,
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
      default: WEEK_DAY
    },
    tag: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      label: WEEK_DAY,
      type_: this.type,
      nth: null,
      weekDayNum: 1
    }
  },
  computed: {
    tag_: {
      get() {
        return this.weekDayNum + WEEK_DAY + this.nth
      },
      set(newValue) {
        if (this.type_ !== WEEK_DAY) {
          return
        }
        const arr = newValue.split(WEEK_DAY)
        if (arr.length !== 2) {
          this.$message.error(this.$t('common.tagError') + ':' + newValue)
          return
        }
        if (!isNumber(arr[0]) || parseInt(arr[0]) < this.nums[0].value || parseInt(arr[0]) > this.nums[this.nums.length - 1].value) {
          this.$message.error(this.$t('weekDay.weekDayNumError') + ':' + arr[0])
          return
        }
        if (!isNumber(arr[1]) || parseInt(arr[1]) < 1 || parseInt(arr[1]) > 5) {
          this.$message.error(this.$t('weekDay.nthError') + ':' + arr[1])
          return
        }
        this.weekDayNum = parseInt(arr[0])
        this.nth = parseInt(arr[1])
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
