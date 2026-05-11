import { UNFIXED } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import React, {useEffect, useRef, useState, useMemo,forwardRef,useImperativeHandle} from 'react';
import {Radio, Select, message, Tooltip, Button, InputNumber} from 'antd';
const Unfixed = forwardRef(function Unfixed(props,ref) {
// export default function LASTS(props: any) {
    const label = useRef(UNFIXED)
    const type_ = useRef(props.type)
    const proxy = useRef(props.tag)

    const tag_ = useMemo(() => {
      
if (type_.current !== UNFIXED) {
          return
        }
        proxy.current = UNFIXED
    }, [UNFIXED]);
  

    const change = (e) => {
      props.typeChanged(e.target.value)
      props.tagChanged(e.target.value)
      // props.typeChanged(type_.current)
      // props.tagChanged(tag_)
      // this.$emit('type-changed', this.type_)
      // this.$emit('tag-changed', this.tag_)
    }
    useEffect(()=>{
      if (type_.current === label.current) {
        props.tagChanged(tag_)
      }
    },[type_])
    useImperativeHandle(ref,()=>{
      return {type_}
    })

    return(
      <>
      <Radio.Group onChange={change} value={type_.current}>
        <Radio value={label.current}>
      <span>{ tag_ }</span>
      {/* <span class="cell-symbol">{{ tag_ }}</span> */}
      不固定
      </Radio>
      </Radio.Group>
      </>
    )
})

export default Unfixed
{/* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      <span class="cell-symbol">{{ tag_ }}</span>
      {{ $t('custom.unspecified') }}
    </el-radio>
  </div>
</template>

<script>
import { UNFIXED } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'

export default {
  mixins: [watchValue],
  props: {
    type: {
      type: String,
      default: UNFIXED
    },
    tag: {
      type: String,
      default: UNFIXED
    }
  },
  data() {
    return {
      label: UNFIXED,
      type_: this.type,
      proxy: this.tag
    }
  },
  computed: {
    tag_: {
      get() {
        return UNFIXED
      },
      set(newValue) {
        if (this.type_ !== UNFIXED) {
          return
        }
        this.proxy = UNFIXED
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
