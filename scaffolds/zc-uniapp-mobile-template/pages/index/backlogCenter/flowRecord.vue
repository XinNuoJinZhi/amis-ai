<template>
  <s-layout title="流转记录">
    <view class="pt-4" v-for="(item, index) in list" :key="index">
      <wd-card :title="item.activityName">
        <view v-if="item.activityType === 'startEvent'">
          {{ item.assigneeName }} 在 {{ item.createTime }} 发起流程
        </view>
        <view v-if="item.activityType === 'serviceTask'">
          <view class="color-black">任务创建时间：{{ item.createTime || '-' }}</view>
          <view class="color-black">任务结束时间：{{ item.endTime || '-' }}</view>
          <view class="color-black">耗时：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ item.duration || '-' }}</view>
        </view>
        <view v-if="item.activityType === 'userTask'">
          <view class="color-black">实际办理：{{ item.assigneeName || '-' }}</view>
          <view class="color-black">候选办理：{{ item.candidate || '-' }}</view>
          <view class="color-black">接收时间：{{ item.createTime || '-' }}</view>
          <view class="color-black">办结时间：{{ item.endTime || '-' }}</view>
          <view class="color-black">耗时：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ item.duration || '-' }}</view>
          <view v-for="(file, index) in item.approvalFile" :key="index" style="height:25px;">
            <wd-button type="text" @click="handleDownload(file)">{{file.fileName}}</wd-button>
          </view>
          <view v-if="item.commentList && item.commentList.length > 0">
            <view v-for="(comment, index) in item.commentList" :key="index">
              <wd-divider content-position="left">
                <wd-tag :type="approveTypeTag(comment.type)" style="margin-right: 10px">{{ commentType(comment.type) }}</wd-tag>
                <wd-tag type="default" plain>{{ formatDate(comment.time) }}</wd-tag>
              </wd-divider>
              <span>{{ comment.fullMessage }}</span>
            </view>
          </view>
        </view>
        <view v-if="item.activityType === 'endEvent'">
          {{ item.createTime }} 结束流程
        </view>
      </wd-card>
    </view>
  </s-layout>
</template>
<script lang="ts" setup>
  import { ref, computed } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
  import sheep from '@/sheep';
  import Api from "@/sheep/api/system/api"
  import dayjs from 'dayjs'
  import downloadFile from '@/sheep/util';
	// 隐藏原生tabBar
	uni.hideTabBar();
  const sysStore = sheep.$store('sys');
  const sys = computed(() => sysStore);
  const list = ref([])
  onLoad(async(e) => {
    const params = {
      procInsId: e.procInsId,
      taskId: e.taskId ? e.taskId : '',
      ccIdentification: e.ccIdentification
    }
    const res = await Api.getAppProcessDetail(params)
    list.value = res.data?.historyProcNodeList ? res.data?.historyProcNodeList : []
  })

  const approveTypeTag = (val) => {
    switch (val) {
      case '1': return 'success'
      case '2': return 'warning'
      case '3': return 'danger'
      case '4': return 'primary'
      case '5': return 'success'
      case '6': return 'danger'
      case '7': return 'default'
      case '8': return 'primary'
      case '9': return 'default'
      case '10': return 'success'
      case '11': return 'danger'
      case '12': return 'success'
      case '13': return 'default'
      case '14': return 'default'
      case '15': return 'success'
      case '16': return 'default'
      case '17': return 'default'
    }
  };
  const commentType = (val) => {
    switch (val) {
      case '1': return '通过'
      case '2': return '退回'
      case '3': return '驳回'
      case '4': return '委派'
      case '5': return '转办'
      case '6': return '终止'
      case '7': return '撤回'
      case '8': return '委派通过'
      case '9': return '指定下一节点审批人'
      case '10': return '跳过'
      case '11': return '挂起'
      case '12': return '激活'
      case '13': return '添加办理人'
      case '14': return '删除办理人'
      case '15': return '提交'
      case '16': return '暂存'
      case '17': return '抄送'
    }
  };
  const formatDate = (date: Date, format?: string): string => {
    // 日期不存在，则返回空
    if (!date) {
      return ''
    }
    // 日期存在，则进行格式化
    return date ? dayjs(date).format(format ?? 'YYYY-MM-DD HH:mm:ss') : ''
  }

  const handleDownload = (file) => {
    // 调用下载方法
    downloadFile({
      file: file.file,
      fileName: file.fileName
    }).catch(err => {
      console.log('下载异常：', err);
    });
  }
</script>

<style lang="scss" scoped>
</style>
