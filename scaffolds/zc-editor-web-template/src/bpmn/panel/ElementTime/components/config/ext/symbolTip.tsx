import React, {useEffect, useRef, useState, useMemo} from 'react';

export default function SymbolTip(props: any) {

  return(
    <>
    通配符支持<strong>{ props.symbol }</strong>
    </>
  )
}

{/* <template>
  <div class="cell-div">
    {{ $t('common.symbolTip') }}<strong>{{ symbol }}</strong>
  </div>
</template>

<script>
export default {
  props: {
    symbol: {
      type: String,
      default: null
    }
  }
}
</script> */}
