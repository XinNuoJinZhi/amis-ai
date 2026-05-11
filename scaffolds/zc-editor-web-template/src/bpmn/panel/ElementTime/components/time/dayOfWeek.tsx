import Every from '../config/common/every';
import Fixed from '../config/common/fixed';
import Unfixed from '../config/custom/unfixed';
import {DAY_OF_WEEK_SYMBOL, DAYS_OF_WEEK, UNFIXED} from '../../constant/filed';
import Period from '../config/custom/dayOfWeek/period';
import Range from '../config/custom/dayOfWeek/range';
import Last from '../config/custom/dayOfWeek/last';
import WeekDay from '../config/custom/dayOfWeek/weekDay';
import watchTime from '../../mixins/watchTime';
import {getLocale} from '../../util/tools';
import {Row} from 'antd';
import React, {useEffect, useRef, useState} from 'react';

export default function DayOfWeek(props: any) {
  // 31 days
  const LENGTH = 7,
    LOWER_LIMIT = 1,
    STEP = 1;
  const everys = useRef(null);
  const periods = useRef(null);
  const ranges = useRef(null);
  const fixeds = useRef(null);
  const unfixeds = useRef(null);
  const lasts = useRef(null);
  const weekDays = useRef(null);
  const type_ = useRef(UNFIXED);
  const tag_ = useRef(null);
  const timeUnit = useRef('日');
  const targetTimeUnit = useRef('月');
  const symbol = useRef(DAY_OF_WEEK_SYMBOL);
  const val = useRef('1 2...7或星期的缩写(SUN ... SAT)');
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
  // 7 days like [ {label: 'Sunday', value: 1}...{label: 'Saturday', value: 7} ]
  const initNums = () => {
    import('../../translate/dict.js').then(array => {
      nums.current = array['daysOfWeek_' + getLocale()];
    });
  };
  useEffect(()=>{
    initNums()
  },[])
  // change type
  const changeType = type => {
    changeSiblingType(type);
    type_.current = type;
  };
  // change tag
  const changeTag = tag => {
    tag_.current = tag;
    // this.$emit('day-of-week-change', this.tag_)
    props.dayOfWeekChange(tag_.current);
  };
  const changeSiblingType = type => {
    everys.current.type_.current =
      periods.current.type_.current =
      ranges.current.type_.current =
      fixeds.current.type_.current =
      unfixeds.current.type_.current =
      lasts.current.type_.current =
      weekDays.current.type_.current =
        type;
  };
  const resolveCustom = val => {
    for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
      const item = DAYS_OF_WEEK[i];
      if (val.indexOf(item) !== -1) {
        val = val.replace(item, i + 1);
      }
    }
    return val;
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
         <Fixed
          ref={periods}
          type={type_.current}
          tag={tag_.current}
          nums={nums.current}
          size={props.size}
          timeUnit={timeUnit}
          startConfig={startConfig}
          cycleConfig={cycleConfig}
          typeChanged={changeType}
          tagChanged={changeTag}
        />
      </Row>
      <Row>
        <Unfixed
          ref={ranges}
          type={type_.current}
          tag={tag_.current}
          nums={nums.current}
          size={props.size}
          timeUnit={timeUnit}
          typeChanged={changeType}
          tagChanged={changeTag}
        />
      </Row>
      <Row>
        <Period
          ref={fixeds}
          type={type_.current}
          tag={tag_.current}
          size={props.size}
          nums={nums.current}
          typeChanged={changeType}
          tagChanged={changeTag}
        />
      </Row>
      <Row>
        <Range
          ref={unfixeds}
          type={type_.current}
          tag={tag_.current}
          typeChanged={changeType}
          tagChanged={changeTag}
        />
      </Row>
      <Row>
        <Last
          ref={lasts}
          type={type_.current}
          tag={tag_.current}
          nums={nums.current}
          size={props.size}
          timeUnit={timeUnit}
          targetTimeUnit={targetTimeUnit}
          typeChanged={changeType}
          tagChanged={changeTag}
        />
      </Row>
      <Row>
        <WeekDay
          ref={weekDays}
          type={type_.current}
          tag={tag_.current}
          nums={nums.current}
          size={props.size}
          timeUnit={timeUnit}
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
      :nums="nums"
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
      :nums="nums"
      :size="size"
      :time-unit="timeUnit"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <fixed
      ref="fixeds"
      :type="type_"
      :tag="tag_"
      :nums="nums"
      :size="size"
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
      :nums="nums"
      :size="size"
      :time-unit="timeUnit"
      :target-time-unit="targetTimeUnit"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
    <week-day
      ref="weekDays"
      :type="type_"
      :tag="tag_"
      :nums="nums"
      :size="size"
      :time-unit="timeUnit"
      :target-time-unit="targetTimeUnit"
      @type-changed="changeType"
      @tag-changed="changeTag"
    />
  </el-row>
</template>

<script>
import Every from '../config/common/every'
import Fixed from '../config/common/fixed'
import Unfixed from '../config/custom/unfixed'
import { DAY_OF_WEEK_SYMBOL, DAYS_OF_WEEK, UNFIXED } from '../../constant/filed'
import Period from '../config/custom/dayOfWeek/period'
import Range from '../config/custom/dayOfWeek/range'
import Last from '../config/custom/dayOfWeek/last'
import WeekDay from '../config/custom/dayOfWeek/weekDay'
import watchTime from '../../mixins/watchTime'
import { getLocale } from '../../util/tools'

// 31 days
const LENGTH = 7, LOWER_LIMIT = 1, STEP = 1

export default {
  components: {
    WeekDay,
    Every,
    Fixed,
    Unfixed,
    Period,
    Range,
    Last
  },
  mixins: [watchTime],
  props: {
    size: {
      type: String,
      default: 'mini'
    },
    tag: {
      type: String,
      default: UNFIXED
    }
  },
  data() {
    return {
      type_: UNFIXED,
      // expression of second
      tag_: null,
      timeUnit: this.$t('dayOfWeek.timeUnit'),
      targetTimeUnit: this.$t('month.title'),
      symbol: DAY_OF_WEEK_SYMBOL,
      val: this.$t('dayOfWeek.val'),
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
      }
    }
  },
  methods: {
    // 7 days like [ {label: 'Sunday', value: 1}...{label: 'Saturday', value: 7} ]
    initNums() {
      import('../../translate/dict.js').then(array => {
        this.nums = array['daysOfWeek_' + getLocale()]
      })
    },
    // change type
    changeType(type) {
      this.changeSiblingType(type)
      this.type_ = type
    },
    // change tag
    changeTag(tag) {
      this.tag_ = tag
      this.$emit('day-of-week-change', this.tag_)
    },
    changeSiblingType(type) {
      this.$refs.everys.type_ =
        this.$refs.periods.type_ =
          this.$refs.ranges.type_ =
            this.$refs.fixeds.type_ =
              this.$refs.unfixeds.type_ =
                this.$refs.lasts.type_ =
                  this.$refs.weekDays.type_ = type
    },
    resolveCustom(val) {
      for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
        const item = DAYS_OF_WEEK[i]
        if (val.indexOf(item) !== -1) {
          val = val.replace(item, i + 1)
        }
      }
      return val
    }
  }
}
</script> */
}
