<template>
  <s-layout 
    title="站内信"
    tabbar="/pages/index/notify"
    navbar="inner"
    :bgStyle="template.page"
    :navbarStyle="template.navigationBar"
    onShareAppMessage>
    <s-empty
      v-if="list.length === 0"
      icon="/static/cart-empty.png"
      text="暂无站内信"
    />
    <!-- 搜索框 -->
    <wd-icon name="filter" size="22px" custom-style="filter-custom-style" @click="filterSearch" style="position:fixed;top:100px;right:5px;"></wd-icon>
    <view class="pt-4" v-for="(item, index) in list" :key="index">
      <wd-card>
        <view class="justify-start h-auto">
          <view class="color-black">发送人名称：{{ item.templateNickname }}</view>
          <view class="color-black">发送时间：{{ item.createTime }}</view>
          <view class="color-black">类型：
            <text v-if="item.templateType === 1">通知公告</text>
            <text v-if="item.templateType === 2">系统消息</text>
            <text v-if="item.templateType === 3">流程消息</text>
          </view>
          <view class="color-black">内容：{{ item.templateContent }}</view>
          <view class="color-black">是否已读：
            <text :style="`color:${
              item.readStatus ? 'green' : 'red'
            }`">{{ item.readStatus ? '是' : '否'  }}</text>
          </view>
        </view>
        <template #footer>
          <view>
            <wd-button
              size="small"
              @click="handleRead(item)"
              v-if="(item.userType !=1 && item.readStatus!=true)"
            >已读</wd-button>
            <wd-button
              size="small"
              @click="handleViewData(item)"
              v-if="item.routePath != null && item.routeParams.processed === false && item.routeParams.ccIdentification === true"
            >办理时数据</wd-button>
            <wd-button
              size="small"
              @click="handleFlowRecord(item)"
              v-if="item.routePath != null"
            >流转记录</wd-button>
            <wd-button
              size="small"
              @click="handleDetail(item)"
              v-if="item.routePath != null && item.routeParams.processed === true"
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
          <wd-text text="是否已读" bold size="14px" color="#333333"></wd-text>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-picker :columns="statusList" label="" v-model="queryParams.readStatus" clearable />
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
    <wd-toast />
  </s-layout>
</template>

<script lang="ts" setup>
  import { useToast } from 'wot-design-uni'
  import {computed, ref, reactive} from 'vue';
	import {onLoad, onShow, onReachBottom, onPullDownRefresh} from '@dcloudio/uni-app';
	import sheep from '@/sheep';
  import Api from "@/sheep/api/system/api"
  import BigNumber from 'bignumber.js'
	// 隐藏原生tabBar
	uni.hideTabBar();
	const template = computed(() => sheep.$store('app').template?.home);
  const toast = useToast()
  const total = ref(0) // 列表的总页数
  const list = ref([]) // 列表的数据
  const isFirstLoad = ref(false);  //首次加载标识（默认false）
  const loadMoreState = ref<string>('loading')
  let queryParams = reactive({
    pageNo: 1,
    pageSize: 10,
    readStatus: "",
  })
  // 获取列表
  const getList = async () => {
    try {
      const res = await Api.getNotifyList(queryParams)
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
  onShow(async () =>{
    if (isFirstLoad.value) {
      await loadMore()
    }
  })
  onLoad(async () => {
    await loadMore()
    isFirstLoad.value = true; // 标记首次加载完成
  })
  const search = async() => {
    showFilter.value = false
    await getList()
  }
  const clear = async() => {
    queryParams.readStatus = ""
    queryParams.pageNo = 1
    queryParams.pageSize = 10
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
  const statusList = ref([
    { value: true, label: '是' },
    { value: false, label: '否' },
    { value: '', label: '全部' },
  ])
  const handleRead = async(item) => {
    const res = await Api.getUpdateRead(item.id)
    await getList()
  }
  const handleDetail = async(item) => {
    let params = item.routeParams;
    let url = '';
    const appid = new BigNumber(item.appId).toString(36);
    const env = item.env;
    if(params){
        params.ccIdentification = params.ccIdentification ? params.ccIdentification : false
        if(params.taskId){
          url = './backlogCenter/detail'+'?appid='+appid+'&env='+env+'&procInsId='+params.procInsId+'&processed='+params.processed+'&taskId='+params.taskId+'&ccIdentification='+params.ccIdentification;
        } else {
          url = './backlogCenter/detail'+'?appid='+appid+'&env='+env+'&procInsId='+params.procInsId+'&processed='+params.processed+'&taskId='+'&ccIdentification='+params.ccIdentification;
        }
    } else {
      url = './backlogCenter/detail'+'?appid='+appid+'&env='+env;
    }
    uni.navigateTo({
      url: url
    })
  }

  //流转记录
  const handleFlowRecord = (item) => {
    let params = item.routeParams;
    const appid = new BigNumber(item.appId).toString(36);
    const env = item.env;
    const procInsId = params.procInsId;
    const taskId = params.taskId;
    const processed = params.processed;
    const portalKey = uni.getStorageSync('portalVal');
    const ccIdentification = params.ccIdentification ? params.ccIdentification : false
    uni.navigateTo({
      url: './backlogCenter/flowRecord' + "?procInsId=" + procInsId + "&taskId=" + taskId + "&processed=" + processed + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '') + "&ccIdentification=" + ccIdentification
    })
  }
  //办理时提交数据
  const handleViewData = (item) => {
    let params = item.routeParams;
    const appid = new BigNumber(item.appId).toString(36);
    const env = item.env;
    const procInsId = params.procInsId;
    const taskId = params.taskId;
    const processed = params.processed;
    const portalKey = uni.getStorageSync('portalVal');
    const ccIdentification = params.ccIdentification ? params.ccIdentification : false
    uni.navigateTo({
      url: './backlogCenter/viewData' + "?procInsId=" + procInsId + "&taskId=" + taskId + "&processed=" + processed + "&appid=" + appid + "&env=" + env + (portalKey ? '&portalKey=' + portalKey : '') + "&ccIdentification=" + ccIdentification
    })
  }
</script>

<style lang="scss" scoped>

</style>
  
