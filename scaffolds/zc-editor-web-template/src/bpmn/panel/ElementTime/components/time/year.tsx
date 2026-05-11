import Every from '../config/common/every'
import Period from '../config/common/period'
import Range from '../config/common/range'
import Fixed from '../config/common/fixed'
import Empty from '../config/custom/year/empty'
import { BASE_SYMBOL, CUR_YEAR, EMPTY, UPPER_LIMIT_YEAR } from '../../constant/filed'
import watchTime from '../../mixins/watchTime'
import { Row, } from 'antd';
import React, { useEffect, useRef, useState } from 'react';


export default function Year(props: any) {
  const LOWER_LIMIT = CUR_YEAR, LENGTH = UPPER_LIMIT_YEAR, STEP = 1
  const everys = useRef(null)
  const periods = useRef(null)
  const ranges = useRef(null)
  const fixeds = useRef(null)
  const emptys = useRef(null)
  const type_ = useRef(EMPTY)
  const tag_ = useRef(null)
  const timeUnit = useRef('年')
  const symbol = useRef(BASE_SYMBOL)
  const val = useRef(new Date().getFullYear() + ' ... ' + 2099)
  const nums = useRef([])
  const upper = useRef(LOWER_LIMIT)
  const startConfig = {
    min: LOWER_LIMIT,
    step: STEP,
    max: LENGTH
  }
  const cycleConfig = {
    min: STEP,
    step: STEP,
    max: LENGTH
  }
  const lowerConfig = {
    min: LOWER_LIMIT,
    step: STEP
  }
  const upperConfig = {
    step: STEP,
    max: LENGTH
  }
  // 方法
  const initNums = () => {
    for (let i = LOWER_LIMIT; i <= LENGTH; i++) {
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
    // this.$emit('year-change', this.tag_)
    props.yearChange(tag_.current)
  }
  const changeSiblingType = (type) => {
    everys.current.type_.current =
      periods.current.type_.current =
      ranges.current.type_.current =
      fixeds.current.type_.current =
      emptys.current.type_.current = type
    // this.$refs.everys.type_ =
    //   this.$refs.periods.type_ =
    //     this.$refs.ranges.type_ =
    //       this.$refs.fixeds.type_ =
    //         this.$refs.emptys.type_ = type
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
          upper={upper.current}
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
      <Row>
        <Empty
          ref={emptys}
          type={type_.current}
          tag={tag_.current}
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
      time-unit={timeUnit.current}
      type-changed={changeType}
      tag-changed={changeTag}
    />
    <period
      ref="periods"
      type={type_.current}
      tag={tag_.current}
      size={props.size}
      time-unit={timeUnit.current}
      :start-config="startConfig"
      :cycle-config="cycleConfig"
      type-changed={changeType}
      tag-changed={changeTag}
    />
    <range
      ref="ranges"
      type={type_.current}
      tag={tag_.current}
      size={props.size}
      time-unit={timeUnit.current}
      :lower-config="lowerConfig"
      :upper-config="upperConfig"
      :upper="upper"
      type-changed={changeType}
      tag-changed={changeTag}
    />
    <fixed
      ref="fixeds"
      type={type_.current}
      tag={tag_.current}
      size={props.size}
      time-unit={timeUnit.current}
      :nums="nums"
      type-changed={changeType}
      tag-changed={changeTag}
    />
    <empty
      ref="emptys"
      type={type_.current}
      tag={tag_.current}
      type-changed={changeType}
      tag-changed={changeTag}
    />
  </el-row>
</template>

<script>


// 2099 years
const LOWER_LIMIT = CUR_YEAR, LENGTH = UPPER_LIMIT_YEAR, STEP = 1

export default {
  components: {
    Every,
    Period,
    Range,
    Fixed,
    Empty
  },
  mixins: [watchTime],
  props: {
    tag: {
      type: String,
      default: EMPTY
    },
    size: {
      type: String,
      default: 'mini'
    }
  },
  data() {
    return {
      type_: EMPTY,
      // expression of second
      tag_: null,
      timeUnit: this.$t('year.title'),
      symbol: BASE_SYMBOL,
      val: this.$t('year.val'),
      nums: [],
      upper: LOWER_LIMIT,
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
        step: STEP
      },
      upperConfig: {
        step: STEP,
        max: LENGTH
      }
    }
  },
  methods: {
    // xxx years like [ {label: '2019', value: 2019},{label: '2020', value: 2020}...{label: '2099', value: 2099} ]
    initNums() {
      for (let i = LOWER_LIMIT; i <= LENGTH; i++) {
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
      this.$emit('year-change', this.tag_)
    },
    changeSiblingType(type) {
      this.$refs.everys.type_ =
        this.$refs.periods.type_ =
          this.$refs.ranges.type_ =
            this.$refs.fixeds.type_ =
              this.$refs.emptys.type_ = type
    }
  }
}
</script> */}
