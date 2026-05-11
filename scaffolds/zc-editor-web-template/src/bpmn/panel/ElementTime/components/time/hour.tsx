import Every from '../config/common/every'
import Period from '../config/common/period'
import Range from '../config/common/range'
import Fixed from '../config/common/fixed'
import { BASE_SYMBOL, EVERY } from '../../constant/filed'
import watchTime from '../../mixins/watchTime'
import {Row,} from 'antd';
import React, { useEffect, useRef, useState } from 'react';

export default function Hour(props: any) {
  // 24 hours
  const LENGTH = 24, LOWER_LIMIT = 0, STEP = 1
  const everys = useRef(null)
  const periods = useRef(null)
  const ranges = useRef(null)
  const fixeds = useRef(null)
  const type_ = useRef(EVERY)
  const tag_ = useRef(null)
  const timeUnit = useRef('时')
  const symbol = useRef(BASE_SYMBOL)
  const val = useRef('0 1 2...23')
  const nums = useRef([])
      const startConfig= {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH - 1
      }
      const cycleConfig= {
        min: STEP,
        step: STEP,
        max: LENGTH - 1
      }
      const lowerConfig= {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH - 1
      }
      const upperConfig= {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH - 1
      }
// 60 minutes like [ {label: '0', value: 0},{label: '1', value: 1}...{label: '59', value: 59} ]
const initNums = () => {
  for (let i = 0; i < LENGTH; i++) {
    const item = {
      label: i.toString(),
      value: i
    }
    nums.current.push(item)
  }
}
useEffect(()=>{
  initNums()
},[])
// change type
const changeType = (type) => {
  changeSiblingType(type)
  type_.current = type
}
// change tag
const changeTag = (tag) => {
  tag_.current = tag
  // this.$emit('minute-change', this.tag_)
  props.hourChange(tag_.current)
}
const changeSiblingType = (type) => {
        everys.current.type_ =
        periods.current.type_ =
          ranges.current.type_ =
            fixeds.current.type_ = type
}
      return (
        <>
        <Row>
        <Every
      ref={everys}
      type={type_.current}
      tag={tag_.current}
      timeUnit={timeUnit}
      symbol={symbol.current}
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
      :type="type_"
      :tag="tag_"
      :time-unit="timeUnit"
      :symbol="symbol"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <period
      ref="periods"
      :type="type_"
      :tag="tag_"
      :size="size"
      :time-unit="timeUnit"
      :start-config="startConfig"
      :cycle-config="cycleConfig"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <range
      ref="ranges"
      :type="type_"
      :tag="tag_"
      :size="size"
      :time-unit="timeUnit"
      :lower-config="lowerConfig"
      :upper-config="upperConfig"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <fixed
      ref="fixeds"
      :type="type_"
      :tag="tag_"
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
import { BASE_SYMBOL, EVERY } from '../../constant/filed'
import watchTime from '../../mixins/watchTime'

// 24 hours
const LENGTH = 24, LOWER_LIMIT = 0, STEP = 1

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
      timeUnit: this.$t('hour.title'),
      symbol: BASE_SYMBOL,
      val: this.$t('hour.val'),
      nums: [],
      startConfig: {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH - 1
      },
      cycleConfig: {
        min: STEP,
        step: STEP,
        max: LENGTH - 1
      },
      lowerConfig: {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH - 1
      },
      upperConfig: {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH - 1
      }
    }
  },
  methods: {
    // 24 hours like [ {label: '0', value: 0},{label: '1', value: 1}...{label: '23', value: 23} ]
    initNums() {
      for (let i = 0; i < LENGTH; i++) {
        const item = {
          label: i.toString(),
          value: i
        }
        this.nums.push(item)
      }
    },
    // change type
    changeType(type) {
      this.changeSiblingType(type)
      this.type_ = type
    },
    // change tag
    changeTag(tag) {
      this.tag_ = tag
      this.$emit('hour-change', this.tag_)
    },
    changeSiblingType(type) {
      this.$refs.everys.type_ =
        this.$refs.periods.type_ =
          this.$refs.ranges.type_ =
            this.$refs.fixeds.type_ = type
    }
  }
}
</script> */}
