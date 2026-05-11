
// import { sortNum } from '../../../util/tools'
import { FIXED } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import { isNumber } from '../../../util/tools'
import { Radio, Select, message, Tooltip, Button } from 'antd';
import React, { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
// export default function Fixed(props: any) {
const Fixed = forwardRef(function Fixed(props, ref) {
  console.log(props, '固定的props数据')
  const sortNum = (a, b) => {
    return a - b
  }
  const needTags = () => {
    let tag = ''
    // const self = this
    // console.log(numArray, 'numArraynumArray')
    if (numArray) {
      if (typeof numArray != 'string' && numArray.length > 0) {
        numArray.sort(sortNum)
        for (let i = 0; i < numArray.length; i++) {
          tag += numArray[i] + FIXED
        }
        tag = tag.substring(0, tag.length - 1)
      }
    }
    tagValue.current = tag
    // console.log(tag, 'tagggggggggggggggggggggggggggggggg')
    return tag
  }
  const [messageApi, contextHolder] = message.useMessage();
  const label = useRef(FIXED)
  // const type_ = useRef(props.type)
  const [type_, setType_] = useState(props.type)
  // const numArray =useRef([])
  const [numArray, setNumArray] = useState([])
  const collapsed = false
  const tagValue = useRef('')
  const needTag = needTags()
  // console.log(props, '固定的props')
  // console.log(needTag, 'needTagneedTagneedTagneedTag')
  const tag_ = useMemo(() => {
    // console.log('进入needTag值变化')
    if (type_ !== FIXED) {
      return
    }
    const arr = tagValue.current.split(FIXED)
    const tempNumArr = []
    arr.forEach(num => {
      if (!isNumber(num) || parseInt(num) < props.nums[0].value || parseInt(num) > props.nums[props.nums.length - 1].value) {
        // this.$message.error(this.$t('common.numError') + ':' + num)
        messageApi.open({
          type: 'error',
          content: '含有非法数字' + ':' + num,
        });
        return
      }
      tempNumArr.push(parseInt(num))
    })
    // console.log(tempNumArr, 'tempNumArrtempNumArr')
    tempNumArr.sort(sortNum)
    // // numArray.current = tempNumArr
    console.log(tempNumArr,'tempNumArrtempNumArrtempNumArrtempNumArr')
    setNumArray(tempNumArr)
    // return needTag
  }, [needTag])

  // 监听
  useEffect(() => {
    console.log('进入进入进入进入', numArray)
    // let labelLength = 0
    // props.nums.forEach(num => {
    //   if (numArray.indexOf(num.value) !== -1) {
    //     labelLength += num.label.length
    //   }
    // })
    // this.collapsed = (labelLength > 6)
    // props.tagChanged('1,3,4')
  }, [numArray])
  useEffect(() => {
    console.log(props.type, 'props.typeprops.typeprops.type')
    // console.log(type_, 'type_type_type_type_type_')
    if (props.type === FIXED) {
      protectNumArray()
    }
    // setType_(props.type)
  }, [props.type])
  useEffect(() => {
    console.log(tag_,'fixd   tag_tag_tag_tag_')
    if (type_ === label.current) {
    props.tagChanged(tag_);
    }
  }, [tag_])

  // useEffect(() => {
  //   tag_ = tag
  // }, [tag])
  // 方法
  const change = (e) => {
    console.log(e, 'eeeeeeeee')
    console.log(tag_,'tag_ fixed')
    setType_(e.target.value)
    // props.typeChanged(type_);
    props.typeChanged(e.target.value);
    // if(!tag_){
    //   props.tagChanged([0]);
    // }else{
    props.tagChanged(tag_);
    // }
    // props.typeChanged(type_.current)
    // this.$emit('type-changed', this.type_)
    // this.$emit('tag-changed', this.tag_)
  }
  const protectNumArray = () => {
    console.log(numArray,'protectNumArrayprotectNumArrayprotectNumArray')
    console.log(props,'propspropspropspropsprops')
    if (numArray.length === 0) {
      // numArray.current.push(props.nums[0].value)
      setNumArray([props.nums[0].value])
    }
  }
  const handleChange = (e) => {
    console.log(e, '选择器选择')
    setNumArray(e)
  }

  useImperativeHandle(ref, () => {
    return { type_ }
  })
  return (
    <>
      <div>
        <Radio.Group value={type_} onChange={change}>
          <Radio value={label.current}>
            <Tooltip placement="top">
              <span>,</span>
            </Tooltip>
            固定的
            <Select
              style={{ minWidth: "320px", width: "120" }}
              // defaultValue="lucy"
              // allowClear
              showSearch={false}
              placeholder="请选择(支持多选)"
              disabled={type_ != label.current}
              // filterOption={(input, option) => (option?.label ?? '').includes(input)}
              // filterSort={(optionA, optionB) =>
              //   (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
              // }
              // getPopupContainer= {triggerNode => triggerNode.parentNode}
              onChange={handleChange}
              mode="multiple"
              value={numArray}
            >
              {props.nums.map(item =>
                <Select.Option
                  key={item.value}
                  label={item.label}
                  value={item.value}>
                </Select.Option>
              )}
            </Select>
            {props.timeUnit.current}
          </Radio>
        </Radio.Group>
      </div>
    </>
  )
})
export default Fixed
{/* <template>
  <div class="cell-div">
    <el-radio v-model="type_" :label="label" @change="change">
      <el-tooltip effect="dark" placement="top">
        <div slot="content">
          {{ tag_ }}
        </div>
        <span class="cell-symbol">,</span>
      </el-tooltip>
      {{ $t('common.specified') }}
      <el-select
        v-model="numArray"
        :collapse-tags="collapsed"
        :size="size"
        :placeholder="$t('common.placeholderMulti')"
        :disabled="type_ !== label"
        filterable
        multiple
        style="width: 100%;"
      >
        <el-option
          v-for="item in nums"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      {{ timeUnit }}
    </el-radio>
  </div>
</template>

<script>
import { sortNum } from '../../../util/tools'
import { FIXED } from '../../../constant/filed'
import watchValue from '../../../mixins/watchValue'
import { isNumber } from '../../../util/tools'

export default {
  mixins: [watchValue],
  props: {
    nums: {
      type: Array,
      default: null
    },
    size: {
      type: String,
      default: 'mini'
    },
    timeUnit: {
      type: String,
      default: null
    },
    type: {
      type: String,
      default: FIXED
    },
    tag: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      label: FIXED,
      type_: this.type,
      numArray: [],
      collapsed: false
    }
  },
  computed: {
    tag_: {
      get() {
        let tag = ''
        const self = this
        if (this.numArray && this.numArray.length) {
          self.numArray.sort(sortNum)
          for (let i = 0; i < this.numArray.length; i++) {
            tag += this.numArray[i] + FIXED
          }
          tag = tag.substring(0, tag.length - 1)
        }
        return tag
      },
      set(newValue) {
        if (this.type_ !== FIXED) {
          return
        }
        const
          arr = newValue.split(FIXED),
          tempNumArr = []
        arr.forEach(num => {
          if (!isNumber(num) || parseInt(num) < this.nums[0].value || parseInt(num) > this.nums[this.nums.length - 1].value) {
            this.$message.error(this.$t('common.numError') + ':' + num)
            return
          }
          tempNumArr.push(parseInt(num))
        })
        tempNumArr.sort(sortNum)
        this.numArray = tempNumArr
      }
    }
  },
  watch: {
    'numArray'(curVal, oldVal) {
      let labelLength = 0
      this.nums.forEach(num => {
        if (curVal.indexOf(num.value) !== -1) {
          labelLength += num.label.length
        }
      })
      this.collapsed = (labelLength > 6)
    },
    type_(curVal, oldVal) {
      if (curVal === FIXED) {
        this.protectNumArray()
      }
    }
  },
  methods: {
    change() {
      this.$emit('type-changed', this.type_)
      this.$emit('tag-changed', this.tag_)
    },
    protectNumArray() {
      if (this.numArray.length === 0) {
        this.numArray.push(this.nums[0].value)
      }
    }
  }
}
</script> */}
