import { LAST } from '../../../../constant/filed'
import watchValue from '../../../../mixins/watchValue'
import { isNumber } from '../../../../util/tools'
import React, {useEffect, useRef, useState,useMemo,forwardRef,useImperativeHandle} from 'react';
import {Radio,Select,message,Tooltip,Button,InputNumber } from 'antd';
const Last = forwardRef(function Last(props,ref) {
// export default function Last(props: any) {
  const [messageApi, contextHolder] = message.useMessage();

  const label = useRef(LAST)
  const type_ = useRef(props.type)
  const lastNum = useRef(7)
  const tag_ = useMemo(() => {
    if (type_.current !== LAST) {
      return
    }
    let newValue = (lastNum.current >= 1 && lastNum.current < 7 ? lastNum.current : '') + LAST
    if (newValue === LAST) {
      lastNum.current = 7
      return
    }
    const numStr = newValue.substring(0, newValue.length - 1)
    if (!isNumber(numStr) || parseInt(numStr) < props.nums[0].value || parseInt(numStr) > props.nums[props.nums.length - 1].value) {
      // this.$message.error(this.$t('common.numError') + ':' + numStr)
      messageApi.open({
        type: 'error',
        content: '含有非法数字' + ':' + numStr,
      });
      return
    }
    lastNum.current = parseInt(numStr)
  },[(lastNum.current >= 1 && lastNum.current < 7 ? lastNum.current : '') + LAST])
  useEffect(()=>{
    if (type_.current === label.current) {
      props.tagChanged(tag_)
    }
  },[type_])

  // 方法
  const change = (e) => {
    props.typeChanged(e.target.value)
    props.tagChanged(e.target.value)
    // props.typeChanged(type_.current)
    // props.tagChanged(tag_)
    // this.$emit('type-changed', this.type_)
    // this.$emit('tag-changed', this.tag_)
  }

  useImperativeHandle(ref,()=>{
    return {type_}
  })
  return(
    <>
    <Radio.Group onChange={change} value={type_.current}>
        <Radio value={label.current}>
    <span>{ tag_ }</span>
    {/* <span class="cell-symbol">{ tag_ }</span> */}
    本{ props.targetTimeUnit.current }最后一个
    <Select
              style={{ minWidth: "320px", width: "120" }}
              // defaultValue="lucy"
              // onChange={handleChange}
              placeholder="请选择"
              disabled={type_.current !== label.current}
              filterOption={(input, option) => (option?.label ?? '').includes(input)}
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
              }
              mode="multiple"
              value={lastNum.current}>
              {props?.nums?.map(item =>
                <Select.Option
                  key={item.value}
                  label={item.label}
                  value={item.value}>
                </Select.Option>
              )}
            </Select>
    </Radio>
    </Radio.Group>
    </>
  )
})

export default Last
{/* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      <span class="cell-symbol">{{ tag_ }}</span>
      {{ $t('common.current') }}{{ targetTimeUnit }}{{ $t('custom.lastOne') }}
      <el-select
        v-model="lastNum"
        :size="size"
        :placeholder="$t('common.placeholder')"
        :disabled="type_ !== label"
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
import { LAST } from '../../../../constant/filed'
import watchValue from '../../../../mixins/watchValue'
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
      lastNum: 7
    }
  },
  computed: {
    tag_: {
      get() {
        return (this.lastNum >= 1 && this.lastNum < 7 ? this.lastNum : '') + LAST
      },
      set(newValue) {
        if (this.type_ !== LAST) {
          return
        }
        if (newValue === LAST) {
          this.lastNum = 7
          return
        }
        const numStr = newValue.substring(0, newValue.length - 1)
        if (!isNumber(numStr) || parseInt(numStr) < this.nums[0].value || parseInt(numStr) > this.nums[this.nums.length - 1].value) {
          this.$message.error(this.$t('common.numError') + ':' + numStr)
          return
        }
        this.lastNum = parseInt(numStr)
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
