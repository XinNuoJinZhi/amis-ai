import React, {useEffect, useRef, useState, useMemo} from 'react';

export default function ValTip(props: any) {

  return(
    <>
    值为<strong>{ props.val }</strong>
    </>
  )
}
{/* <template>
  <div class="cell-div">
    {{ $t('common.valTip') }}<strong>{{ val }}</strong>
  </div>
</template>

<script>
export default {
  props: {
    val: {
      type: String,
      default: null
    }
  }
}
</script> */}
