import Every from '../config/common/every'
import Period from '../config/common/period'
import Range from '../config/common/range'
import Fixed from '../config/common/fixed'
import { BASE_SYMBOL, EVERY, MONTHS } from '../../constant/filed'
import watchTime from '../../mixins/watchTime'
import {Row,} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
export default function Second(props: any) {
// 1 months
const LENGTH = 12, LOWER_LIMIT = 1, STEP = 1
const everys = useRef(null)
const periods = useRef(null)
const ranges = useRef(null)
const fixeds = useRef(null)
const type_ = useRef(EVERY)
const tag_ = useRef(null)
const timeUnit = useRef('月')
const symbol = useRef(BASE_SYMBOL)
const val = useRef('1 2...12，或12个月的缩写(JAN ... DEC)')
const nums = useRef([])
      const startConfig= {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH
      }
      const cycleConfig= {
        min: STEP,
        step: STEP,
        max: LENGTH
      }
      const lowerConfig= {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH
      }
      const upperConfig= {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH
      }

// 12 months like [ {label: '0', value: 0},{label: '1', value: 1}...{label: '59', value: 59} ]
const initNums = () => {
  for (let i = 0; i < LENGTH; i++) {
    const item = {
      label: (i + 1).toString(),
      value: i + 1
    }
    nums.current.push(item)
  }
}
useEffect(()=>{
  initNums()
},[])
// change type
const changeType = (type) => {
  type_.current = type
  changeSiblingType(type)
}
// change tag
const changeTag = (tag) => {
  tag_.current = tag
  // this.$emit('month-change', this.tag_)
  props.monthChange(tag_.current)
}
const changeSiblingType = (type) => {
        everys.current.type_.current =
            periods.current.type_.current =
              ranges.current.type_.current =
                fixeds.current.type_.current = type
}
const resolveCustom = (val) => {
  for (let i = 0; i < MONTHS.length; i++) {
    const item = MONTHS[i]
    if (val.indexOf(item) !== -1) {
      val = val.replace(item, i + 1)
    }
  }
  return val
}


  return (
    <>
    <Row>
    <Every
      ref={everys}
      type={type_.current}
      tag={tag_.current}
      timeUnit={timeUnit}
      typeChanged={changeType}
      tagChanged={changeTag}
    />
    </Row>
    <Row>
    <Period
      ref={periods}
      type={type_.current}
      tag={tag_.current}
      size={props.size}
      timeUnit={timeUnit}
      startConfig={startConfig}
      cycleConfig={cycleConfig}
      typeChanged={changeType}
      tagChanged={changeTag}
    />
    </Row>
    <Row>
    <Range
      ref={ranges}
      type={type_.current}
      tag={tag_.current}
      size={props.size}
      timeUnit={timeUnit}
      lowerConfig={lowerConfig}
      upperConfig={upperConfig}
      typeChanged={changeType}
      tagChanged={changeTag}
    />
    </Row>
    <Row>
    <Fixed
      ref={fixeds}
      type={type_.current}
      tag={tag_.current}
      size={props.size}
      timeUnit={timeUnit}
      nums={nums.current}
      typeChanged={changeType}
      tagChanged={changeTag}
    />
    </Row>
    </>
  )
}
{/* <template>
  <el-row>
    <every
      ref="everys"
      type={type_.current}
      tag={tag_.current}
      :time-unit="timeUnit"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <period
      ref="periods"
      type={type_.current}
      tag={tag_.current}
      :size="size"
      :time-unit="timeUnit"
      :start-config="startConfig"
      :cycle-config="cycleConfig"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <range
      ref="ranges"
      type={type_.current}
      tag={tag_.current}
      :size="size"
      :time-unit="timeUnit"
      :lower-config="lowerConfig"
      :upper-config="upperConfig"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <fixed
      ref="fixeds"
      type={type_.current}
      tag={tag_.current}
      :size="size"
      :time-unit="timeUnit"
      :nums="nums"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
  </el-row>
</template>

<script>
import Every from '../config/common/every'
import Period from '../config/common/period'
import Range from '../config/common/range'
import Fixed from '../config/common/fixed'
import { BASE_SYMBOL, EVERY, MONTHS } from '../../constant/filed'
import watchTime from '../../mixins/watchTime'

// 1 months
const LENGTH = 12, LOWER_LIMIT = 1, STEP = 1

export default {
  components: {
    Every,
    Period,
    Range,
    Fixed
  },
  mixins: [watchTime],
  props: {
    tag: {
      type: String,
      default: EVERY
    },
    size: {
      type: String,
      default: 'mini'
    }
  },
  data() {
    return {
      type_: EVERY,
      // expression of second
      tag_: null,
      timeUnit: this.$t('month.title'),
      symbol: BASE_SYMBOL,
      val: this.$t('month.val'),
      nums: [],
      startConfig: {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH
      },
      cycleConfig: {
        min: STEP,
        step: STEP,
        max: LENGTH
      },
      lowerConfig: {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH
      },
      upperConfig: {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH
      }
    }
  },
  methods: {
    // 12 months like [ {label: '0', value: 0},{label: '1', value: 1}...{label: '59', value: 59} ]
    initNums() {
      for (let i = 0; i < LENGTH; i++) {
        const item = {
          label: (i + 1).toString(),
          value: i + 1
        }
        this.nums.push(item)
      }
    },
    // change type
    changeType(type) {
      this.type_ = type
      this.changeSiblingType(type)
    },
    // change tag
    changeTag(tag) {
      this.tag_ = tag
      this.$emit('month-change', this.tag_)
    },
    changeSiblingType(type) {
      this.$refs.everys.type_ =
        this.$refs.periods.type_ =
          this.$refs.ranges.type_ =
            this.$refs.fixeds.type_ = type
    },
    resolveCustom(val) {
      for (let i = 0; i < MONTHS.length; i++) {
        const item = MONTHS[i]
        if (val.indexOf(item) !== -1) {
          val = val.replace(item, i + 1)
        }
      }
      return val
    }
  }
}
</script> */}
