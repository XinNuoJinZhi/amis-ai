import Every from '../config/common/every';
import Period from '../config/common/period';
import Range from '../config/common/range';
import Fixed from '../config/common/fixed';
import Unfixed from '../config/custom/unfixed';
import WorkDay from '../config/custom/workDay';
import Last from '../config/custom/last';
import LastWorkDay from '../config/custom/lastWorkDay';
import {DAY_OF_MONTH_SYMBOL, EVERY} from '../../constant/filed';
import watchTime from '../../mixins/watchTime';
import {Row} from 'antd';
import React, {useEffect, useRef, useState} from 'react';

export default function DayOfMonth(props: any) {
  // 31 days
  const LENGTH = 31,
    LOWER_LIMIT = 1,
    STEP = 1;
  const everys = useRef(null);
  const periods = useRef(null);
  const ranges = useRef(null);
  const fixeds = useRef(null);
  const unfixeds = useRef(null);
  const lasts = useRef(null);
  const workDays = useRef(null);
  const lastWorkDays = useRef(null);
  const type_ = useRef(EVERY);
  const tag_ = useRef(null);
  const timeUnit = useRef('日');
  const targetTimeUnit = useRef('日');
  const symbol = useRef(DAY_OF_MONTH_SYMBOL);
  const val = useRef('1 2...31');
  const nums = useRef([]);
  const startConfig = {
    min: LOWER_LIMIT,
    step: STEP,
    max: LENGTH
  };
  const startDateConfig = {
    min: LOWER_LIMIT,
    step: STEP,
    max: LENGTH
  };
  const cycleConfig = {
    min: STEP,
    step: STEP,
    max: LENGTH
  };
  const lowerConfig = {
    min: LOWER_LIMIT,
    step: STEP,
    max: LENGTH
  };
  const upperConfig = {
    min: LOWER_LIMIT,
    step: STEP,
    max: LENGTH
  };
  const lastConfig = {
    min: LOWER_LIMIT,
    step: STEP,
    max: LENGTH
  };
  // 31 days like [ {label: '1', value: 1}...{label: '31', value: 31} ]
  const initNums = () => {
    for (let i = 1; i <= LENGTH; i++) {
      const item = {
        label: i.toString(),
        value: i
      };
      nums.current.push(item);
    }
  };
  useEffect(()=>{
    initNums()
  },[])
  // change type
  const changeType = (type) => {
    changeSiblingType(type);
    type_.current = type;
  };
  // change tag
  const changeTag = (tag) => {
    tag_.current = tag;
    // this.$emit('day-of-month-change', this.tag_)
    props.dayOfMonthChange(tag_.current);
  };
  const changeSiblingType = (type) => {
    // console.log(type,'dayOfMointh changeSiblingType')
    // console.log(everys.current,'everys.current')
    // console.log(periods.current,'periods.current')
    // console.log(ranges.current,'ranges.current')
    // console.log(fixeds.current,'fixeds.current')
    // console.log(unfixeds.current,'unfixeds.current')
    // console.log(lasts.current,'lasts.current')
    // console.log(workDays.current,'workDays.current')
    console.log(lastWorkDays.current,'lastWorkDays.current')
    everys.current.type_.current =
      periods.current.type_.current =
      ranges.current.type_.current =
      fixeds.current.type_.current =
      unfixeds.current.type_.current =
      lasts.current.type_.current =
      workDays.current.type_.current =
      // lastWorkDays.current.type_.current =
        type;
  };
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
          nums={nums.current}
          timeUnit={timeUnit}
          typeChanged={changeType}
          tagChanged={changeTag}
        />
      </Row>
      <Row>
         <Unfixed
          ref={unfixeds}
          type={type_.current}
          tag={tag_.current}
          typeChanged={changeType}
          tagChanged={changeTag}
        />
      </Row>
      <Row>
       <WorkDay
          ref={lasts}
          type={type_.current}
          tag={tag_.current}
          size={props.size}
          lastConfig={lastConfig}
          timeUnit={timeUnit}
          targetTimeUnit={targetTimeUnit}
          typeChanged={changeType}
          tagChanged={changeTag}
        />
      </Row>
      <Row>
        <Last
          ref={workDays}
          type={type_.current}
          tag={tag_.current}
          size={props.size}
          startDateConfig={startDateConfig}
          timeUnit={timeUnit}
          targetTimeUnit={targetTimeUnit}
          typeChanged={changeType}
          tagChanged={changeTag}
        />
      </Row>
      <Row>
        <LastWorkDay
          ref={lastWorkDays}
          type={type_.current}
          tag={tag_.current}
          size={props.size}
          targetTimeUnit={targetTimeUnit}
          typeChanged={changeType}
          tagChanged={changeTag}
        />
      </Row>
    </>
  );
}

{
  /* <template>
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
    <unfixed
      ref="unfixeds"
      :type="type_"
      :tag="tag_"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <last
      ref="lasts"
      :type="type_"
      :tag="tag_"
      :size="size"
      :last-config="lastConfig"
      :time-unit="timeUnit"
      :target-time-unit="targetTimeUnit"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <work-day
      ref="workDays"
      :type="type_"
      :tag="tag_"
      :size="size"
      :start-date-config="startDateConfig"
      :time-unit="timeUnit"
      :target-time-unit="targetTimeUnit"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <last-work-day
      ref="lastWorkDays"
      :type="type_"
      :tag="tag_"
      :size="size"
      :target-time-unit="targetTimeUnit"
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
import Unfixed from '../config/custom/unfixed'
import WorkDay from '../config/custom/workDay'
import Last from '../config/custom/last'
import LastWorkDay from '../config/custom/lastWorkDay'
import { DAY_OF_MONTH_SYMBOL, EVERY } from '../../constant/filed'
import watchTime from '../../mixins/watchTime'

// 31 days
const LENGTH = 31, LOWER_LIMIT = 1, STEP = 1

export default {
  components: {
    LastWorkDay,
    Last,
    WorkDay,
    Every,
    Period,
    Range,
    Fixed,
    Unfixed
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
      timeUnit: this.$t('dayOfMonth.timeUnit'),
      targetTimeUnit: this.$t('month.title'),
      symbol: DAY_OF_MONTH_SYMBOL,
      val: this.$t('dayOfMonth.val'),
      nums: [],
      startConfig: {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH
      },
      startDateConfig: {
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
      },
      lastConfig: {
        min: LOWER_LIMIT,
        step: STEP,
        max: LENGTH
      }
    }
  },
  methods: {
    // 31 days like [ {label: '1', value: 1}...{label: '31', value: 31} ]
    initNums() {
      for (let i = 1; i <= LENGTH; i++) {
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
      this.$emit('day-of-month-change', this.tag_)
    },
    changeSiblingType(type) {
      this.$refs.everys.type_ =
        this.$refs.periods.type_ =
          this.$refs.ranges.type_ =
            this.$refs.fixeds.type_ =
              this.$refs.unfixeds.type_ =
                this.$refs.lasts.type_ =
                  this.$refs.workDays.type_ =
                    this.$refs.lastWorkDays.type_ = type
    }
  }
}
</script> */
}
