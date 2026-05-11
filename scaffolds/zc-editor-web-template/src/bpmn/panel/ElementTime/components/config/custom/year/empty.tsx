import {EMPTY} from '../../../../constant/filed';
import watchValue from '../../../../mixins/watchValue';
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';
import {Radio, Select, message, Tooltip, Button, InputNumber} from 'antd';
// export default function Empty(props: any) {
const Empty = forwardRef(function Empty(props, ref) {
  console.log(props,'不配置')
  const label = useRef(EMPTY);
  const type_ = useRef(props.type);
  const proxy = useRef(props.tag);

  const tag_ = useMemo(() => {
    if (type_.current !== EMPTY) {
      return;
    }
    proxy.current = EMPTY;
  }, [EMPTY]);
  useEffect(() => {
    if (type_.current === label.current) {
      props.tagChanged(tag_);
    }
  }, [tag_]);
  useImperativeHandle(ref, () => {
    return {type_};
  });
  const change = (e) => {
    console.log(e,';eeeeeeeeee不配置')
    console.log(type_,'type_')
    console.log(tag_,'tag_')
    props.typeChanged(e.target.value);
    props.tagChanged(tag_);
    // this.$emit('type-changed', this.type_)
    // this.$emit('tag-changed', this.tag_)
  };
  return (
    <>
      <Radio.Group onChange={change} value={type_.current}>
        <Radio value={label.current}>&nbsp;不配置</Radio>
      </Radio.Group>
    </>
  );
});
export default Empty;
{
  /* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      &nbsp;{{ $t('custom.empty') }}
    </el-radio>
  </div>
</template>

<script>
import { EMPTY } from '../../../../constant/filed'
import watchValue from '../../../../mixins/watchValue'

export default {
  mixins: [watchValue],
  props: {
    type: {
      type: String,
      default: EMPTY
    },
    tag: {
      type: String,
      default: EMPTY
    }
  },
  data() {
    return {
      label: EMPTY,
      type_: this.type,
      proxy: this.tag
    }
  },
  computed: {
    tag_: {
      get() {
        return EMPTY
      },
      set(newValue) {
        if (this.type_ !== EMPTY) {
          return
        }
        this.proxy = EMPTY
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
