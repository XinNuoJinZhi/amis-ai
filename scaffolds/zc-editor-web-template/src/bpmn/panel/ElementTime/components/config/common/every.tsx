import {EVERY} from '../../../constant/filed';
import watchValue from '../../../mixins/watchValue';
import {Radio} from 'antd';
import React, {useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle} from 'react';
const Every = forwardRef(function Every(props,ref) {
  console.log(props,'every props every props')
// export default Every: React.FC<> = forwardRef(props: any) {
  const label = useRef(EVERY);
  const [type_,setType_] = useState(props.type);
  // const type_ = useRef(props.type);
  const proxy = useRef(props.tag);
  let tag_:any = EVERY
  // const tag_ = useMemo(() => {
  //   console.log(props, 'propsprops');
  //   console.log(label, 'labellabel');
  //   console.log(type_, 'type_type_');
  //   console.log(proxy, 'proxyproxy');
  //   if (type_ !== EVERY) {
  //     return;
  //   }
  //   proxy.current = EVERY;
  //   return EVERY
  // }, [props.type]);
  // useEffect(()=>{
  //   if (type_ !== EVERY) {
  //     return;
  //   }
  //   proxy.current = EVERY;
  //   tag_ = EVERY
  // },[tag_])

  useEffect(()=>{
    console.log(tag_,'tag_ssssssssss')
    console.log(props.tag,'props.tag')
    tag_ = props.tag
  },[props.tag])

  useEffect(()=>{
    console.log(type_,'every   type_')
    if (type_ === label.current) {
      props.tagChanged(tag_);
    }
    if (type_ !== EVERY) {
      return;
    }
    proxy.current = EVERY;
    tag_ = EVERY
  },[tag_])
  useEffect(()=>{
    setType_(props.type)
  },[props.type])

  // useEffect(()=>{
  //   tag_ = props.tag
  // },[props.tag])
  const change = (e) => {
    console.log(props, 'ssssssssssssssssss');
    console.log(type_, 'type_.currenttype_.currenttype_.currenttype_.current');
    console.log(proxy.current, 'proxy.currentproxy.currentproxy.currentproxy.current');
    console.log(tag_, 'tag_tag_tag_');
    // type_.current = e.target.value
    setType_(e.target.value)
    props.typeChanged(type_);
    props.tagChanged(tag_);
  };
  useImperativeHandle(ref,()=>{
    return {type_}
  })
  return (
    <>
      <div>
        <Radio.Group onChange={change} value={type_}>
        <Radio value={label.current}>
          <span style={{color: '#67c23a'}}>{tag_}</span> 每{props.timeUnit?.current}
        </Radio>
        </Radio.Group>
      </div>
    </>
  );
})
export default Every
{
  /* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      <span class="cell-symbol">{{ tag_ }}</span> {{ $t('common.every') }}{{ timeUnit }}
    </el-radio>
  </div>
</template>

<script>
import { EVERY } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'

export default {
  mixins: [watchValue],
  props: {
    size: {
      type: String,
      default: 'mini'
    },
    timeUnit: {
      type: String,
      default: null
    },
    symbol: {
      type: String,
      default: null
    },
    type: {
      type: String,
      default: EVERY
    },
    tag: {
      type: String,
      default: EVERY
    }
  },
  data() {
    return {
      label: EVERY,
      type_: this.type,
      proxy: this.tag
    }
  },
  computed: {
    tag_: {
      get() {
        return EVERY
      },
      set(newValue) {
        if (this.type_ !== EVERY) {
          return
        }
        this.proxy = EVERY
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
