<template>
  <s-layout title="我的流程">
    <s-empty
      v-if="list.length === 0"
      icon="/static/cart-empty.png"
      text="暂无我的流程"
    />
    <!-- 搜索框 -->
    <wd-icon name="filter" size="24px" custom-style="filter-custom-style" @click="filterSearch" style="position:fixed;top:90px;right:5px;"></wd-icon>
    <view class="pt-4" v-for="(item, index) in list" :key="index">
      <wd-card>
        <view class="justify-start h-auto">
          <view class="color-black">流程编号：{{ item.procInsId }}</view>
          <view class="color-black">流程名称：{{ item.processName }}</view>
          <view class="color-black">流程类别：{{ item.category }}</view>
          <view class="color-black">流程版本：v{{ item.procDefVersion }}</view>
          <view class="color-black">当前节点：{{ item.taskName }}</view>
          <view class="color-black">提交时间：{{ item.createTime }}</view>
          <view class="color-black">流程状态：
            <text v-if="item.processStatus === 'canceled'" :style="`color:#E6A23C`">已取消</text>
            <text v-else-if="item.processStatus === 'completed'" :style="`color:#67C23A`">已完成</text>
            <text v-else-if="item.processStatus === 'terminated'" :style="`color:#F4260F`">已终止</text>
            <text v-else-if="item.processStatus === 'running'" :style="`color:#409EFF`">进行中</text>
            <text v-else-if="item.processStatus === 'suspended'" :style="`color:#909399`">已挂起</text>
          </view>
          <view class="color-black">耗时：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ item.duration }}</view>
        </view>
        <template #footer>
          <view>
            <wd-button
              size="small"
              @click="handleFlowRecord(item)"
            >流转记录</wd-button>
            <wd-button
              size="small"
              @click="handleCancel(item)"
              v-hasPermi="['appProcessManage:task:stopProcess']"
              v-if="item.processStatus != 'completed' && item.processStatus != 'terminated' && item.processStatus != 'canceled'"
            >取消</wd-button>
            <wd-button
              size="small"
              @click="handleRestart(item)"
              v-hasPermi="['appProcessManage:process:restart']"
              v-if="(item.bindInitiationPage == true || (!item.bindInitiationPage && item.processInstanceStartVariablesConfig))"
            >重新发起</wd-button>
            <wd-button
              size="small"
              @click="handleRestartC(item)"
              v-hasPermi="['appProcessManage:process:restart']"
              v-if="item.bindInitiationPage == false  && !item.processInstanceStartVariablesConfig"
            >重新发起</wd-button>
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
          <wd-text text="流程类别" bold size="14px" color="#333333"></wd-text>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-picker :columns="categoryList" label="" v-model="queryParams.categoryKey" clearable />
        </wd-col>
        <wd-gap bg-color="#FFFFFF"></wd-gap>
        <wd-col :span="24">
          <wd-text text="提交开始时间" bold size="14px" color="#333333"></wd-text>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-datetime-picker v-model="startDate" :default-value="defaultValue" use-second @confirm="handleStartConfirm" @cancel="handleStartCancel"/>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-text text="提交结束时间" bold size="14px" color="#333333"></wd-text>
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
    categoryKey: "",
    begin: "",
    end: ""
  })
  // 获取列表
  const getList = async () => {
    try {
      const res = await Api.getOwnList(queryParams)
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
  const categoryList = ref([])
  const startDate = ref('')
  const endDate = ref('')
  const defaultValue = ref<number>(Date.now())
  const getCategoryList = async() => {
    const res = await Api.getCategoryList()
    const result = res?.data ? res.data : []
    result.forEach(i=>{
      i.label = i.categoryName
      i.value = i.queryKey
    })
    categoryList.value = res.data
  }
  onLoad(async () => {
    await loadMore()
    await getCategoryList()
  })
  onShow(async () =>{
    if (isFirstLoad.value) {
      await loadMore()
    }
  })
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
    startDate.value = ""
    endDate.value = ""
    queryParams.pageNo = 1
    queryParams.pageSize = 10
    queryParams.processName = ""
    queryParams.categoryKey = ""
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
  //流转记录
  const handleFlowRecord = async(item) => {
    const appid = new BigNumber(item.appId).toString(36);
    const env = item.env;
    const procInsId = item.procInsId;
    const procDefId = item.procDefId;
    const deployId = item.deployId;
    const processed = false;
    const portalKey = uni.getStorageSync('portalVal');
    const ccIdentification = false
    uni.navigateTo({
      url: './flowRecord' + "?procInsId=" + procInsId + "&deployId=" + deployId + "&definitionId=" + procDefId + "&processed=" + processed + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '') + "&ccIdentification=" + ccIdentification
    })
  }
  const handleCancel = async(item) => {
    uni.showModal({
      title: '提示',
      content: '确认要取消吗？',
      success: async function (res) {
        if (!res.confirm) {
          return;
        }
        const params = {
          procInsId: item.procInsId,
        }
        const res2 = await Api.getStopProcess(params)
        if (res2.code != 0) {
          toast.error(res.msg)
        } else {
          toast.success('取消成功')
        }
        await getList()
      },
    });
  }
  const handleRestart = async(item) => {
    const appid = new BigNumber(item.appId).toString(36);
    const env = item.env;
    const procInsId = item.procInsId;
    const procDefId = item.procDefId;
    const deployId = item.deployId;
    const portalKey = uni.getStorageSync('portalVal');
    uni.navigateTo({
      url: './restart' + "?procInsId=" + procInsId + "&deployId=" + deployId + "&definitionId=" + procDefId + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '')
    })
  }
  const handleRestartC = async(item) => {
    let params = {
      processDefId: item.procDefId,
    };
    const res = await Api.getRestart(params)
    if (res.code != 0) {
      toast.error(res.msg)
    } else {
      toast.success(res.msg)
    }
    await getList()
  }
</script>

<style lang="scss" scoped>

</style>