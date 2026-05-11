<template>
    <view v-if="portalData.length > 0" class="customer-card">
      <wd-row :gutter="0" style="display: block; height: 34px">
        <wd-picker :columns="portalData" label="门户" v-model="portalVal" @confirm="portalChange" />
      </wd-row>
    </view>
</template>

<script setup>
import Api from "@/sheep/api/system/api"
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
const portalData = ref([])
const portalVal = ref(0)
const getPortalData = async () => {
  const res = await Api.getPortalList()
  const data = res.data ? res.data : []
  portalData.value = data.map(j=> {
    return {
      value: j.portalKey,
      label: j.portalName
    }
  })
  if (uni.getStorageSync('portalVal') && portalData.value.length > 0) {
    portalVal.value = uni.getStorageSync('portalVal')
  }
}
const portalChange = (e) => {
  uni.setStorageSync('portalVal', e.value);
}
onLoad(async() => {
  await getPortalData()
});
</script>

<style lang="scss" scoped>
.customer-card {
  padding-top: 10px;
  padding-bottom: 10px;
  margin: var(--wot-card-margin, 0 var(--wot-size-side-padding, 15px));
  font-size: var(--wot-card-fs, var(--wot-fs-content, 14px));
  line-height: var(--wot-card-line-height, 1.1);
  background-color: var(--wot-card-bg, var(--wot-color-white, white));
  border-radius: var(--wot-card-radius, 8px);
  box-shadow: var(
    --wot-card-shadow-color,
    0px 4px 8px 0px rgba(0, 0, 0, 0.02)
  );
}
.customer-card :deep(.wd-cell){
  padding-left: 0 !important;
}
</style>
