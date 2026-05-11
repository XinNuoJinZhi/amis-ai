import {RANGE} from '../../../../constant/filed';
import watchValue from '../../../../mixins/watchValue';
import {isNumber} from '../../../../util/tools';

import React, {useEffect, useRef, useState, useMemo,forwardRef,useImperativeHandle} from 'react';
import {Radio, Select, message, Tooltip, Button, InputNumber} from 'antd';
// export default function Range(props: any) {
const Range = forwardRef(function Range(props,ref) {
console.log(props,'range   propsprops')
  const [messageApi, contextHolder] = message.useMessage();

  const label = useRef(RANGE);
  const type_ = useRef(props.type);
  const lower = useRef(1);
  const upper = useRef(1);

  const tag_ = useMemo(() => {
    if (type_.current !== RANGE) {
      return;
    }
    let newValue = lower.current + RANGE + upper.current;
    const arr = newValue.split(RANGE);
    if (arr.length !== 2) {
      // this.$message.error(this.$t('common.tagError') + ':' + newValue)
      messageApi.open({
        type: 'error',
        content: '表达式不正确' + ':' + newValue
      });
      return;
    }
    if (
      !isNumber(arr[0]) ||
      parseInt(arr[0]) < props.nums[0].value ||
      parseInt(arr[0]) > props.nums[props.nums.length - 1].value
    ) {
      // this.$message.error(this.$t('range.lowerError') + ':' + arr[0])
      messageApi.open({
        type: 'error',
        content: '下限格式不符' + ':' + arr[0]
      });
      return;
    }
    if (
      !isNumber(arr[1]) ||
      parseInt(arr[1]) < props.nums[0].value ||
      parseInt(arr[1]) > props.nums[props.nums.length - 1].value
    ) {
      // this.$message.error(this.$t('range.upperError') + ':' + arr[1])
      messageApi.open({
        type: 'error',
        content: '上限格式不符' + ':' + arr[1]
      });
      return;
    }
    if (parseInt(arr[0]) > parseInt(arr[1])) {
      // this.$message.error(this.$t('range.lowerBiggerThanUpperError') + ':' + arr[0] + '>' + arr[1])
      messageApi.open({
        type: 'error',
        content: '下限不能比上限大' + ':' + arr[0] + '>' + arr[1]
      });
      return;
    }
    lower.current = parseInt(arr[0]);
    upper.current = parseInt(arr[1]);
  }, [lower.current , RANGE , upper.current]);
  useEffect(()=>{
    if (type_.current === label.current) {
      props.tagChanged(tag_)
    }
  },[type_])
  useImperativeHandle(ref,()=>{
    return {type_}
  })
  const change = (e) => {
    props.typeChanged(e.target.value);
    props.tagChanged(e.target.value);
    // props.typeChanged(type_.current);
    // props.tagChanged(tag_);
    // this.$emit('type-changed', this.type_)
    // this.$emit('tag-changed', this.tag_)
  };
  return (
    <>
      <Radio.Group onChange={change} value={type_.current}>
        <Radio value={label.current}>
        <span>{tag_}</span>在
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
          value={lower.current}
        >
          {props?.nums?.map(item => (
            <Select.Option
              key={item.value}
              label={item.label}
              value={item.value}
              disabled={item.value > upper.current}
            ></Select.Option>
          ))}
        </Select>
        之间的每{props?.timeUnit?.current}
        {/* <span class="cell-symbol">{{ tag_ }}</span> */}
      </Radio>
      </Radio.Group>
    </>
  );
})
export default Range
{
  /* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      <span class="cell-symbol">{{ tag_ }}</span>
      {{ $t('common.between') }}
      <el-select
        v-model="lower"
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
          :disabled="item.value>upper"
        />
      </el-select>
      {{ $t('common.and') }}
      <el-select
        v-model="upper"
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
          :disabled="item.value<lower"
        />
      </el-select>
      {{ $t('common.end') }}{{ $t('common.every') }}{{ timeUnit }}
    </el-radio>
  </div>
</template>

<script>
import { RANGE } from '../../../../constant/filed'
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
      lower: 1,
      upper: 1
    }
  },
  computed: {
    tag_: {
      get() {
        return this.lower + RANGE + this.upper
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
        if (!isNumber(arr[0]) || parseInt(arr[0]) < this.nums[0].value || parseInt(arr[0]) > this.nums[this.nums.length - 1].value) {
          this.$message.error(this.$t('range.lowerError') + ':' + arr[0])
          return
        }
        if (!isNumber(arr[1]) || parseInt(arr[1]) < this.nums[0].value || parseInt(arr[1]) > this.nums[this.nums.length - 1].value) {
          this.$message.error(this.$t('range.upperError') + ':' + arr[1])
          return
        }
        if (parseInt(arr[0]) > parseInt(arr[1])) {
          this.$message.error(this.$t('range.lowerBiggerThanUpperError') + ':' + arr[0] + '>' + arr[1])
          return
        }
        this.lower = parseInt(arr[0])
        this.upper = parseInt(arr[1])
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
</script> */
}
