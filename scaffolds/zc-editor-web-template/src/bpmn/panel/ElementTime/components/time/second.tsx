import Every from '../config/common/every'
import Period from '../config/common/period'
import Range from '../config/common/range'
import Fixed from '../config/common/fixed'
import watchTime from '../../mixins/watchTime'
import {Row,} from 'antd';
import { EMPTY, EVERY,BASE_SYMBOL, FIXED, LAST, LAST_WORK_DAY, PERIOD, RANGE, UNFIXED, WEEK_DAY, WORK_DAY } from '../../constant/filed'
import React, { useEffect, useRef, useState } from 'react';
// 60 seconds
export default function Second(props: any) {
  console.log(props,'传参的值props')
  const LENGTH = 60, LOWER_LIMIT = 0, STEP = 1
const everys = useRef(null)
const periods = useRef(null)
const ranges = useRef(null)
const fixeds = useRef(null)
  const [type_,setType_] = useState(EVERY)
  // const type_ = useRef(EVERY)
  const [tag_,setTag_] = useState(props.tag)
  // const tag_ = useRef(props.tag)
  // const tag_ = useRef(null)
  const timeUnit = useRef('秒')
  const symbol = useRef(BASE_SYMBOL)
  const val = useRef('0 1 2...59')
  const nums = useRef([])
  const startConfig = {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH - 1
      }
  const cycleConfig = {
        min: STEP,
        step: STEP,
        max: LENGTH - 1
      }
  const lowerConfig = {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH - 1
      }
 const upperConfig = {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH - 1
      }
      // 60 seconds like [ {label: '0', value: 0},{label: '1', value: 1}...{label: '59', value: 59} ]
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
      resolveTag(props.tag)
    },[])
    useEffect(()=>{
      console.log(tag_,'tag_')
      console.log(props.tag,'props.tag')
      // setTag_(props.tag)
      resolveTag(tag_)
      // resolveTag(props.tag)
    },[props.tag])
    // change type
    const changeType = (types) => {
      console.log(types,'typesssssssssssssssssssss')
      changeSiblingType(types)
      // type_.current = types
      setType_(types)
    }
    // change tag
    const changeTag = (tags) => {
      console.log(tags,'tagss')
      setTag_(tags)
      // tag_.current = tags
      // this.$emit('second-change', this.tag_)
      props.secondChange(tags)
      // props.secondChange(tag_)
    }
    const changeSiblingType = (type) => {
      console.log(type,'typetypetype')
      console.log(everys,'everyseverys')
      console.log(periods,'periodsperiods')
      console.log(ranges,'rangesranges')
      console.log(fixeds,'fixedsfixeds')
      everys.current.type_ = 
      // periods.current.type_ = 
      // ranges.current.type_ = 
      fixeds.current.type_ = type
      // this.$refs.everys.type_ =
      //   this.$refs.periods.type_ =
      //     this.$refs.ranges.type_ =
      //       this.$refs.fixeds.type_ = type 
    }
    const resolveTag = (val) => {
      if (val == null) {
        val = EMPTY
      }
      let temp = null
      val = resolveCustom(val)
      // equals
      if (val === EMPTY) {
        temp = EMPTY
      } else if (val === UNFIXED) {
        temp = UNFIXED
      } else if (val === EVERY) {
        temp = EVERY
      } else if (val === LAST_WORK_DAY) {
        temp = LAST_WORK_DAY
      }
      // contains
      if (temp == null) {
        if (val.startsWith(LAST + '-')) {
          temp = LAST
        } else if (val.endsWith(LAST)) {
          temp = LAST
        } else if (val.endsWith(WORK_DAY) && val.length > WORK_DAY.length) {
          temp = WORK_DAY
        } else if (val.indexOf(WEEK_DAY) > 0) {
          temp = WEEK_DAY
        } else if (val.indexOf(PERIOD) > 0) {
          temp = PERIOD
        } else if (val.indexOf(RANGE) > 0) {
          temp = RANGE
        } else {
          temp = FIXED
        }
      }
      console.log(temp,'temptemptemptemptemptemp')
      setType_(temp)
      changeSiblingType(temp)
      setTag_(val)
    }
    const resolveCustom = (val) => {
      return val
    }
    return (
      <>
      <Row>
      <Every
      ref={everys}
      type={type_}
      tag={tag_}
      timeUnit={timeUnit}
      typeChanged={changeType}
      tagChanged={changeTag}
    />
    </Row>
    {/* <Row>
    <Period
      ref={periods}
      type={type_}
      tag={tag_}
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
      type={type_}
      tag={tag_}
      size={props.size}
      timeUnit={timeUnit}
      lowerConfig={lowerConfig}
      upperConfig={upperConfig}
      typeChanged={changeType}
      tagChanged={changeTag}
    />
    </Row> */}
    <Row>
    <Fixed
      ref={fixeds}
      type={type_}
      tag={tag_}
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
      time-unit={timeUnit}
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <period
      ref="periods"
      type={type_.current}
      tag={tag_.current}
      :size="size"
      time-unit={timeUnit}
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
      time-unit={timeUnit}
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
      time-unit={timeUnit}
      :nums="nums"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
  </el-row>
</template>

<script>

// 60 seconds
const LENGTH = 60, LOWER_LIMIT = 0, STEP = 1

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
      timeUnit: this.$t('second.title'),
      symbol: BASE_SYMBOL,
      val: this.$t('second.val'),
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
    // 60 seconds like [ {label: '0', value: 0},{label: '1', value: 1}...{label: '59', value: 59} ]
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
      this.$emit('second-change', this.tag_)
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
