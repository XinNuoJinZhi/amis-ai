<template>
  <s-layout title="抄送我的">
    <s-empty
      v-if="list.length === 0"
      icon="/static/cart-empty.png"
      text="暂无抄送我的"
    />
      <!-- 搜索框 -->
    <wd-icon name="filter" size="24px" custom-style="filter-custom-style" @click="filterSearch" style="position:fixed;top:90px;right:5px;"></wd-icon>
    <view class="pt-4" v-for="(item, index) in list" :key="index">
      <wd-card>
        <view class="justify-start h-auto">
          <view class="color-black">抄送编号：{{ item.copyId }}</view>
          <view class="color-black">流程编号：{{ item.instanceId }}</view>
          <view class="color-black">标题：{{ item.title }}</view>
          <view class="color-black">流程名称：{{ item.processName }}</view>
          <view class="color-black">发起人：{{ item.originatorName }}</view>
          <view class="color-black">创建时间：{{ item.createTime }}</view>
        </view>
        <template #footer>
          <wd-button
            size="small"
            @click="handleViewData(item)"
          >办理时数据</wd-button>
          <wd-button
            size="small"
            @click="handleFlowRecord(item)"
          >流转记录</wd-button>
        </template>
      </wd-card>
    </view>
    <wd-loadmore
      :state="loadMoreState"
      @reload="loadMore"
    />
    <!-- 搜索弹窗 -->
    <wd-popup
      v-model="showFilter"
      lock-scroll
      position="right"
      :safe-area-inset-bottom="true"
      custom-style="width: 70%;border-radius: 20px 0 0 20px;margin-top: 20%;"
      @close="closeFilter"
    >
    <wd-row gutter=20>
        <wd-gap bg-color="#FFFFFF"></wd-gap>
        <wd-col :span="24">
          <wd-text text="流程名称" bold size="14px" color="#333333"></wd-text>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-input v-model="queryParams.processName" clearable placeholder="请输入流程名称" />
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-gap bg-color="#FFFFFF"></wd-gap>
        <wd-col :span="24">
          <wd-text text="发起人" bold size="14px" color="#333333"></wd-text>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-input v-model="queryParams.originatorName" clearable placeholder="请输入发起人" />
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-gap bg-color="#FFFFFF"></wd-gap>
        <wd-col :span="24">
          <view style="display: flex;">
            <wd-button size="medium" @click="search">查询</wd-button>
            <wd-button type="info" size="medium" @click="clear">重置</wd-button>
          </view>
        </wd-col>
      </wd-row>
    </wd-popup>
  </s-layout>
</template>

<script lang="ts" setup>
  import { useToast } from 'wot-design-uni'
  import { ref, reactive} from 'vue';
	import { onLoad, onShow, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
  import Api from "@/sheep/api/system/api"
  import BigNumber from 'bignumber.js'
	// 隐藏原生tabBar
	uni.hideTabBar();
  const toast = useToast()
  const total = ref(0) // 列表的总页数
  const list = ref([]) // 列表的数据
  const isFirstLoad = ref(false);  //首次加载标识（默认false）
  const loadMoreState = ref<string>('loading')
  let queryParams = reactive({
    pageNo: 1,
    pageSize: 10,
    processName: "",
    originatorName: ""
  })
  // 获取列表
  const getList = async () => {
    try {
      const res = await Api.getCopyList(queryParams)
      if (queryParams.pageNo > 1) {
        list.value = list.value.concat(res.data.list)
      } else {
        list.value = res.data.list
      }
      total.value = res.data.total
      if (list.value.length < total.value) {
        loadMoreState.value = 'loading'
      } else {
        loadMoreState.value = 'finished'
      }
    } catch (error) {
      toast.warning(error)
      loadMoreState.value = 'error'
    }
  }
  const loadMore = async()=> {
    await getList()
  }

  onReachBottom(async() => {
    if (list.value.length < total.value) {
      loadMoreState.value = 'loading'
      queryParams.pageNo++
      await loadMore()
    } else {
      loadMoreState.value = 'finished'
    }
  })

  //下拉刷新
  onPullDownRefresh(() => {
    getList();
    setTimeout(function () {
      uni.stopPullDownRefresh();
    }, 800);
  });

  onLoad(async () => {
    await loadMore()
    isFirstLoad.value = true
  })
  onShow(async () =>{
    if (isFirstLoad.value) {
      await loadMore()
    }
  })
  const search = async() => {
    showFilter.value = false
    await getList()
  }
  const clear = async() => {
    queryParams.pageNo = 1
    queryParams.pageSize = 10
    queryParams.processName = ""
    queryParams.originatorName = ""
    showFilter.value = false
    await getList()
  }
  // 查询相关
  const showFilter = ref(false)
  const filterSearch = () => {
    showFilter.value = true
  }
  const closeFilter = async() => {
    await getList()
  }
  //流转记录
  const handleFlowRecord = (item) => {
    const appid = new BigNumber(item.appId).toString(36);
    const env = item.env;
    const procInsId = item.instanceId;
    const taskId = item.taskId;
    const processed = false;
    const portalKey = uni.getStorageSync('portalVal');
    const ccIdentification = true
    uni.navigateTo({
      url: './flowRecord' + "?procInsId=" + procInsId + "&taskId=" + taskId + "&processed=" + processed + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '') + "&ccIdentification=" + ccIdentification
    })
  }
  //办理时提交数据
  const handleViewData = (item) => {
    const appid = new BigNumber(item.appId).toString(36);
    const env = item.env;
    const procInsId = item.instanceId;
    const taskId = item.taskId;
    const processed = false;
    const portalKey = uni.getStorageSync('portalVal');
    const ccIdentification = true
    uni.navigateTo({
      url: './viewData' + "?procInsId=" + procInsId + "&taskId=" + taskId + "&processed=" + processed + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '') + "&ccIdentification=" + ccIdentification
    })
  }
</script>

<style lang="scss" scoped>

</style>
