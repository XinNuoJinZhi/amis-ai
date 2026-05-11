<template>
  <s-layout title="已办任务">
    <s-empty
      v-if="list.length === 0"
      icon="/static/cart-empty.png"
      text="暂无已办任务"
    />
  <!-- 搜索框 -->
    <wd-icon name="filter" size="24px" custom-style="filter-custom-style" @click="filterSearch" style="position:fixed;top:90px;right:5px;"></wd-icon>
    <view class="pt-4" v-for="(item, index) in list" :key="index">
      <wd-card>
        <view class="justify-start h-auto">
          <view class="color-black">任务编号：{{ item.taskId }}</view>
          <view class="color-black">流程编号：{{ item.procInsId }}</view>
          <view class="color-black">流程名称：{{ item.processName }}</view>
          <view class="color-black">任务节点：{{ item.taskName }}</view>
          <view class="color-black">流程发起人：{{ item.startUserName }}</view>
          <view class="color-black">接收时间：{{ item.createTime }}</view>
          <view class="color-black">审批时间：{{ item.finishTime }}</view>
          <view class="color-black">耗时：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ item.duration }}</view>
        </view>
        <template #footer>
          <view>
            <wd-button
              size="small"
              @click="handleViewData(item)"
            >办理时数据</wd-button>
            <wd-button
              size="small"
              @click="handleFlowRecord(item)"
            >流转记录</wd-button>
            <wd-button
              size="small"
              @click="handleWithdraw(item)"
              v-hasPermi="['appProcessManage:process:revokeProcess']"
            >撤回</wd-button>
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
          <wd-text text="审批开始时间" bold size="14px" color="#333333"></wd-text>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-datetime-picker v-model="startDate" :default-value="defaultValue" use-second @confirm="handleStartConfirm" @cancel="handleStartCancel"/>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-text text="审批结束时间" bold size="14px" color="#333333"></wd-text>
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
  import { ref, reactive } from 'vue';
	import { onLoad,onShow, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
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
    finishBegin: "",
    finishEnd: ""
  })
  // 获取列表
  const getList = async () => {
    try {
      const res = await Api.getFinishList(queryParams)
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
    queryParams.finishBegin = startDate.value ? Math.floor(startDate.value/1000) : ''
    queryParams.finishEnd = endDate.value ? Math.floor(endDate.value/1000) : ''
    showFilter.value = false
    await getList()
  }
  const clear = async() => {
    startDate.value = ''
    endDate.value = ''
    queryParams.pageNo =1
    queryParams.pageSize =10
    queryParams.processName = ''
    queryParams.finishBegin = ""
    queryParams.finishEnd = ""
    showFilter.value = false
    await getList()
  }
  // 查询相关
  const showFilter = ref(false)
  const filterSearch = () => {
    showFilter.value = true
  }
  const closeFilter = async() => {
    queryParams.finishBegin = startDate.value ? Math.floor(startDate.value/1000) : ''
    queryParams.finishEnd = endDate.value ? Math.floor(endDate.value/1000) : ''
    await getList()
  }
  const handleWithdraw = (item) => {
    uni.showModal({
      title: '提示',
      content: '确认要撤回吗？',
      success: async function (res) {
        if (!res.confirm) {
          return;
        }
        const params = {
          procInsId: item.procInsId,
          taskId: item.taskId
        }
        const res2 = await Api.getRevokeProcess(params)
        if (res2.code != 0) {
          toast.error(res2.msg)
        } else {
          toast.success('撤回成功')
        }
        await getList()
      },
    });
  }
  //流转记录
  const handleFlowRecord = (item) => {
    const appid = new BigNumber(item.appId).toString(36);
    const env = item.env;
    const procInsId = item.procInsId;
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
    const procInsId = item.procInsId;
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
