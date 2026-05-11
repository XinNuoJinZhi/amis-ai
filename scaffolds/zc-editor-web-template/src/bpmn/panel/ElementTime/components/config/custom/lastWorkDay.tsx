import { LAST_WORK_DAY } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import React, {useEffect, useRef, useState, useMemo,forwardRef} from 'react';
import {Radio, Select, message, Tooltip, Button, InputNumber} from 'antd';
// export default function LASTS(props: any) {
const LastWordDay = forwardRef(function LastWordDay(props,ref) {
    const [messageApi, contextHolder] = message.useMessage();

    const label = useRef(LAST_WORK_DAY)
    const type_ = useRef(props.type)
    const proxy = useRef(props.tag)

    const tag_ = useMemo(() => {
      if (type_.current !== LAST_WORK_DAY) {
        return
      }
      proxy.current = LAST_WORK_DAY
    }, [LAST_WORK_DAY]);
  
    useEffect(()=>{
      if (type_.current === label.current) {
        props.tagChanged(tag_)
      }
    },[type_])

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
      本月最后一个工作日
      {/* 本{ props.targetTimeUnit.current }最后一个工作日 */}
      </Radio>
      </Radio.Group>
      </>
    )
})
export default LastWordDay
{/* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      <span class="cell-symbol">{{ tag_ }}</span>
      {{ $t('common.current') }}{{ targetTimeUnit }}{{ $t('custom.latestWorkday') }}
    </el-radio>
  </div>
</template>

<script>
import { LAST_WORK_DAY } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'

export default {
  mixins: [watchValue],
  props: {
    lastWorkDayConfig: {
      type: Object,
      default: null
    },
    size: {
      type: String,
      default: 'mini'
    },
    targetTimeUnit: {
      type: String,
      default: null
    },
    type: {
      type: String,
      default: LAST_WORK_DAY
    },
    tag: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      label: LAST_WORK_DAY,
      type_: this.type,
      proxy: this.tag
    }
  },
  computed: {
    tag_: {
      get() {
        return LAST_WORK_DAY
      },
      set(newValue) {
        if (this.type_ !== LAST_WORK_DAY) {
          return
        }
        this.proxy = LAST_WORK_DAY
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
