<template>
  <s-layout title="待办任务">
    <s-empty
      v-if="list.length === 0"
      icon="/static/cart-empty.png"
      text="暂无待办任务"
    />
  <!-- 搜索框 -->
    <wd-icon name="filter" size="24px" custom-style="filter-custom-style" @click="filterSearch" style="position:fixed;top:90px;right:5px;"></wd-icon>
    <view class="pt-4" v-for="(item, index) in list" :key="index">
      <wd-card>
        <view class="justify-start h-auto">
          <view class="color-black">任务编号：{{ item.taskId }}</view>
          <view class="color-black">流程编号：{{ item.procInsId }}</view>
          <view class="color-black">流程名称：{{ item.processName }}</view>
          <view class="color-black">任务状态：
            <text v-if="item.taskStatus == '1'">进行中</text>
            <text v-else-if="item.taskStatus == '2'">已挂起</text>
          </view>
          <view class="color-black">流程状态：
            <text v-if="item.processStatus === 'canceled'" :style="`color:#E6A23C`">已取消</text>
            <text v-else-if="item.processStatus === 'completed'" :style="`color:#67C23A`">已完成</text>
            <text v-else-if="item.processStatus === 'terminated'" :style="`color:#F4260F`">已终止</text>
            <text v-else-if="item.processStatus === 'running'" :style="`color:#409EFF`">进行中</text>
            <text v-else-if="item.processStatus === 'suspended'" :style="`color:#909399`">已挂起</text>
          </view>
          <view class="color-black">任务节点：{{ item.taskName }}</view>
          <view class="color-black">流程版本：v{{ item.procDefVersion }}</view>
          <view class="color-black">流程发起人：{{ item.startUserName }}</view>
          <view class="color-black">接收时间：{{ item.createTime }}</view>
        </view>
        <template #footer>
          <view>
            <wd-button
              size="small"
              @click="handleFlowRecord(item)"
            >流转记录</wd-button>
            <wd-button
              size="small"
              @click="handleProcess(item)"
              :disabled="item.processStatus == 'suspended' ||  item.taskStatus == 2"
              v-hasPermi="['appProcessManage:process:do']"
            >任务办理</wd-button>
          </view>
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
          <wd-text text="接收开始时间" bold size="14px" color="#333333"></wd-text>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-datetime-picker v-model="startDate" :default-value="defaultValue" use-second @confirm="handleStartConfirm" @cancel="handleStartCancel"/>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-text text="接收结束时间" bold size="14px" color="#333333"></wd-text>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-datetime-picker v-model="endDate" :default-value="defaultValue" use-second @confirm="handleEndConfirm" @cancel="handleEndCancel"/>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <view style="display: flex;">
            <wd-button size="medium" @click="search">查询</wd-button>
            <wd-button type="info" size="medium" @click="clear">重置</wd-button>
          </view>
        </wd-col>
      </wd-row>
    </wd-popup>
    <wd-toast />
  </s-layout>
</template>

<script lang="ts" setup>
  import { useToast } from 'wot-design-uni'
  import {ref, reactive} from 'vue';
	import {onLoad, onShow, onReachBottom, onPullDownRefresh} from '@dcloudio/uni-app';
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
    begin: "",
    end: ""
  })
  // 获取列表
  const getList = async () => {
    try {
      const res = await Api.getTodoList(queryParams)
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
  })
  onShow(async () =>{
    if (isFirstLoad.value) {
      await loadMore()
    }
  })
  const startDate = ref('')
  const endDate = ref('')
  const defaultValue = ref<number>(Date.now())
  const handleStartConfirm = async ({ value }) => {
    startDate.value = value
  }
  const handleEndConfirm = async ({ value }) => {
    endDate.value = value
  }
  const handleStartCancel = () => {
    startDate.value = ''
  }
  const handleEndCancel = () => {
    endDate.value = ''
  }
  const search = async() => {
    queryParams.begin = startDate.value ? Math.floor(startDate.value/1000) : ''
    queryParams.end = endDate.value ? Math.floor(endDate.value/1000) : ''
    showFilter.value = false
    await getList()
  }
  const clear = async() => {
    startDate.value = ''
    endDate.value = ''
    queryParams.pageNo = 1
    queryParams.pageSize = 10
    queryParams.processName = ""
    queryParams.begin = ""
    queryParams.end = ""
    showFilter.value = false
    await getList()
  }
  // 查询相关
  const showFilter = ref(false)
  const filterSearch = () => {
    showFilter.value = true
  }
  const closeFilter = async() => {
    queryParams.begin = startDate.value ? Math.floor(startDate.value/1000) : ''
    queryParams.end = endDate.value ? Math.floor(endDate.value/1000) : ''
    await getList()
  }
  //任务办理
  const handleProcess = async(item) => {
    const appid = new BigNumber(item.appId).toString(36);
    const env = item.env;
    const procInsId = item.procInsId;
    const taskId = item.taskId;
    const processed = true;
    const portalKey = uni.getStorageSync('portalVal');
    const ccIdentification = false
    uni.navigateTo({
      url: './detail' + "?procInsId=" +  procInsId + "&taskId=" + taskId + "&processed=" + processed + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '') + "&ccIdentification=" + ccIdentification
    })
  }
  //流转记录
  const handleFlowRecord = (item) => {
    const appid = new BigNumber(item.appId).toString(36);
    const env = item.env;
    const procInsId = item.procInsId;
    const taskId = item.taskId;
    const processed = true;
    const portalKey = uni.getStorageSync('portalVal');
    const ccIdentification = false
    uni.navigateTo({
      url: './flowRecord' + "?procInsId=" + procInsId + "&taskId=" + taskId + "&processed=" + processed + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '') + "&ccIdentification=" + ccIdentification
    })
  }
</script>

<style lang="scss" scoped>

</style>
