<template>
  <view
    class="page-app"
    :class="['theme-' + sys?.mode, 'main-' + sys?.theme, 'font-' + sys?.fontSize]"
  >
    <view class="page-detail">
      <su-navbar
        title="任务办理"
        statusBar
      ></su-navbar>
      <view class="page-body" style="">
        <wd-form ref="form" :model="model">
          <wd-cell-group custom-class="group" title="填写表单" border style="height:690px; position: relative;" :style="{ display: active === 0 ? 'block' : 'none' }">
            <view style="margin-left:0; position: relative; height: 680px;">
              <!-- 加载占位层（覆盖web-view，加载完成后隐藏） -->
              <view v-if="!webViewLoaded" style="display: flex;flex-direction: column;align-items: center;margin-top: 100px;">
                <!-- 加载动画 + 提示文字 -->
                <wd-loading size="50px" />
                <text class="loading-text">表单加载中...请稍候</text>
              </view>
              <view style="margin-left:0; position: relative; height: 680px;" v-show="active==0 && webViewLoaded ? true : false">
                <web-view 
                  :src="webUrl" 
                  id="webViewContainer" 
                  ref="webview"
                  @message="handleWebViewMessage"
                >
                </web-view>
              </view>
            </view>
          </wd-cell-group>
          <wd-cell-group custom-class="group" title="审批流程" border style="height:550px;" :style="{ display: active === 1 ? 'block' : 'none' }">
            <wd-textarea
              label="审批意见"
              label-width="70px"
              type="textarea"
              v-model="model.comment"
              :maxlength="255"
              show-word-limit
              placeholder="请输入审批意见"
              clearable
              prop="comment"
              marker-side="after"
              @focus="handleFocusComment"
              @blur="handleBlurComment"
              :rules="[{ required: true, message: '请输入审批意见' }]"
            />
            <wd-select-picker 
              v-if="actionBtnPer.includes('cc')"
              :columns="copyUserList"
              label="抄送人"
              label-width="70px"
              prop="copyUserIds"
              label-key="nickname"
              value-key="id"
              align-right
              @open="openSelectPicker"
              @close="closeSelectPicker"
              v-model="model.copyUserIds">
            </wd-select-picker>
            <view style="display: flex;justify-content: center">
              <wd-button type="primary" size="small"
                custom-class="custom-btn"
                :loading="submitLoading"
                v-if="actionBtnPer.includes('submit')" 
                @click="(()=>{
                  typeMethod='submit'
                  validateStatus()
                })"
                >提交</wd-button>
              <wd-button type="primary" size="small"
                custom-class="custom-btn" 
                :loading="saveLoading"
                v-if="actionBtnPer.includes('save')"
                @click="(()=>{
                  typeMethod='save'
                  validateStatus()
                })">暂存</wd-button>
              <wd-button type="success" size="small"
                custom-class="custom-btn"
                v-if="actionBtnPer.includes('pass')"
                @click="(()=>{
                  typeMethod='success'
                  validateStatus()
                })">通过</wd-button>
              <wd-button type="primary" size="small"
                custom-class="custom-btn"
                v-if="actionBtnPer.includes('delegate')"
                @click="(()=>{
                  typeMethod='delegate'
                  validateStatus()
                })">委派</wd-button>
              <wd-button type="primary" size="small"
                custom-class="custom-btn"
                v-if="actionBtnPer.includes('transfer')"
                @click="(()=>{
                  typeMethod='transfer'
                  validateStatus()
                })">转办</wd-button>
              <wd-button type="warning" size="small"
                custom-class="custom-btn"
                v-if="actionBtnPer.includes('back')"
                @click="(()=>{
                  typeMethod='back'
                  validateStatus()
                })">退回</wd-button>
              <wd-button type="error" size="small"
                v-if="actionBtnPer.includes('stop')"
                @click="(()=>{
                  typeMethod='reject'
                  validateStatus()
                })">拒绝</wd-button>
            </view>
          </wd-cell-group>
          <!-- 步骤切换按钮 -->
          <div class="steps-control">
            <wd-button 
              class="prev-btn" 
              @click="prevStep" 
              v-if="active!==0"
            >上一步</wd-button>
            <wd-button 
              class="next-btn" 
              @click="nextStep" 
              v-if="active !== 1"
              :disabled="!webViewLoaded"
            >下一步</wd-button>
          </div>
        </wd-form>
      </view>
    </view>
    <!--退回弹窗-->
    <wd-popup
      v-model="showReturn"
      lock-scroll
      :safe-area-inset-bottom="true"
      position="center"
      custom-style="width: 95%;height:60vh;border-radius: 20px 0 0 20px;margin-top:20%;margin-bottom:20%"
    >
      <wd-row gutter=20>
        <wd-gap bg-color="#FFFFFF"></wd-gap>
        <wd-col :span="24">
          <wd-text text="退回流程" bold size="14px" color="#333333"></wd-text>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-radio-group v-model="returnTargetKey" shape="dot" inline>
            <wd-radio 
              v-for="item in returnListData" 
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </wd-radio>
          </wd-radio-group>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-gap bg-color="#FFFFFF"></wd-gap>
        <wd-col :span="24">
          <view style="display: flex;">
            <wd-button type="info" size="medium" @click="cancelReturnDialog">取消</wd-button>
            <wd-button size="medium" @click="confirmReturnDialog">确定</wd-button>
          </view>
        </wd-col>
      </wd-row>
    </wd-popup>
    <!--委派/转办弹窗-->
    <wd-popup
      v-model="showTransfer"
      lock-scroll
      :safe-area-inset-bottom="true"
      position="center"
      custom-style="width: 95%;height:60vh;border-radius: 20px 0 0 20px;margin-top:20%;margin-bottom:20%"
    >
      <wd-row gutter=20>
        <wd-gap bg-color="#FFFFFF"></wd-gap>
        <wd-col :span="24">
          <wd-text :text="showTransferTitle" bold size="14px" color="#333333"></wd-text>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-picker
            :columns="deptList"
            label="部门"
            label-width="70px"
            label-key="name"
            value-key="id"
            align-right
            @confirm="getUser"
            v-model="deptId" />
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-gap bg-color="#FFFFFF"></wd-gap>
        <wd-col :span="24">
          <wd-picker
            :columns="userList"
            v-if="deptId"
            label="用户"
            label-width="70px"
            label-key="username"
            value-key="id"
            align-right
            v-model="userId" />
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-gap bg-color="#FFFFFF"></wd-gap>
        <wd-col :span="24">
          <view style="display: flex;">
            <wd-button type="info" size="medium" @click="cancelTransferDialog">取消</wd-button>
            <wd-button size="medium" @click="confirmTransferDialog">确定</wd-button>
          </view>
        </wd-col>
      </wd-row>
    </wd-popup>
    <!--通过弹窗-->
    <wd-popup
      v-model="showComplete"
      lock-scroll
      :safe-area-inset-bottom="true"
      position="center"
      custom-style="width: 95%;height:60vh;border-radius: 20px 0 0 20px;margin-top:20%;margin-bottom:20%"
    >
      <wd-row gutter=20>
        <wd-gap bg-color="#FFFFFF"></wd-gap>
        <wd-col :span="24">
          <wd-text text="附件上传" bold size="14px" color="#333333"></wd-text>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-col :span="24">
          <wd-tag v-for="(tag, index) in approvalFile" :key="index" custom-class="space" round closable @close="handleClose(tag)">{{tag.fileName}}</wd-tag>
          <wd-progress :percentage="percentage" v-if="showPercentage"/>
          <FileSelector />
          <button @click="selectFile">文件选择</button>
          <wd-gap bg-color="#FFFFFF"></wd-gap>
        </wd-col>
        <wd-gap bg-color="#FFFFFF"></wd-gap>
        <wd-col :span="24">
          <view style="display: flex;">
            <wd-button type="info" size="medium" @click="cancelCompleteDialog">取消</wd-button>
            <wd-button size="medium" @click="confirmCompleteDialog">确定</wd-button>
          </view>
        </wd-col>
      </wd-row>
    </wd-popup>
  </view>
</template>
<script lang="ts" setup>
  import { ref, computed, getCurrentInstance } from 'vue';
	import { onLoad, onReady } from '@dcloudio/uni-app';
  import { getAccessToken, getRefreshToken, getTenantId, getAppTenantCode } from '@/sheep/util/auth'
  import sheep from '@/sheep';
  import Api from "@/sheep/api/system/api"
  import { handleDeptTree, flattenDeptTree } from "@/sheep/util/index"
  import { apiPath, baseUrl, tenantId, appId, env } from '@/sheep/config';
  import {
    chooseFile,
    uploadFile,
    clear,
    abort, // 中断上传
  } from "@/uni_modules/file-selector/index.js";
  import FileSelector from "@/uni_modules/file-selector/components/file-selector/file-selector.vue"

	// 隐藏原生tabBar
	uni.hideTabBar();
  const sysStore = sheep.$store('sys');
  const sys = computed(() => sysStore);
  const currentInstance = getCurrentInstance();
  let wv = null; // 存储原生 WebView 实例
  const webUrl = ref()
  const form = ref()
  const existTaskForm = ref(false)
  const active = ref(0)
  // 存储网页回传的填写内容
  const webFormData = ref<Record<string, any>>({});
  const procInsId = ref('')
  const taskId = ref('')
  onLoad(async(e) => {
    procInsId.value = e.procInsId
    taskId.value = e.taskId ? e.taskId : ''
    webUrl.value = import.meta.env.SHOPRO_WEB_URL +
      '/app/process/handleTask' + "?procInsId=" +  e.procInsId + "&taskId=" + (e.taskId ? e.taskId : '') + "&processed=" + e.processed + "&appid=" +e.appid + "&env=" + e.env + (e.portalKey ? '&portalKey=' + e.portalKey : '') + "&ccIdentification=" + e.ccIdentification
      + '&token=' + getAccessToken()
      + '&refreshToken=' + getRefreshToken()
      + '&tenantId=' + getTenantId()
      + '&appTenantCode=' + getAppTenantCode()

    const params = {
      procInsId: e.procInsId,
      taskId: e.taskId ? e.taskId : '',
      ccIdentification: e.ccIdentification
    }
    const resApp = await Api.getAppProcessDetail(params)
    existTaskForm.value = resApp.data?.existTaskForm
    actionBtnPer.value = resApp.data?.taskFormData?.processOperationSettings ? resApp.data?.taskFormData?.processOperationSettings : []
    const res = await Api.getCopyListData()
    copyUserList.value = res.data
  })
  // App端设置web-view样式（核心）
  const setAppWebViewStyle = () => {
    // #ifdef APP-PLUS
    if (!currentInstance) return;
    // 获取当前页面的原生webview容器
    const currentWebview = currentInstance.proxy?.$getAppWebview();
    if (!currentWebview) return;
    // 获取web-view原生实例（子元素第一个）
    wv = currentWebview.children()[0];
    if (wv) {
      // 关键：top设为tab栏高度（50px），避开tab栏
      wv.setStyle({
        top: 155, // tab栏高度，可根据实际调整
        width: '95%',
        height: '500px',
        left: 30,
      });
    }
    // #endif
  };

  // 页面渲染完成后初始化App端web-view样式
  onReady(() => {
    if (!webUrl.value) {
      console.error('webUrl 为空，无法初始化 web-view');
      return;
    }
    // #ifdef APP-PLUS
    setTimeout(() => {
      setAppWebViewStyle();
    }, 1000); // 延迟确保web-view初始化完成
    // #endif
  });

  const model = ref({
    comment: '',
    copyUserIds: []
  })
  const copyUserList = ref([]) // 抄送人下拉框数据
  const actionBtnPer = ref([])
  let taskFormPromise = ref(false) // 表单填写是否校验
  let approvalPromise = ref(false) // 审批流程是否校验
  let typeMethod = ""
  //父告诉子，开始校验了
  const validateStatus = async() => {
    form.value.validate()
    .then(async({ valid, errors }) => {
      approvalPromise.value = valid
      if (valid) {
        await allValidate();
      }
    })
    .catch((error) => {
      console.log(error, 'error')
    })
  }
  const allValidate = async()=>{
    if(taskFormPromise.value && approvalPromise.value) {
      if(typeMethod==="success") {
        await handleComplete()
      }
      if(typeMethod==="delegate") {
        await handleDelegate()
      }
      //转办
      if(typeMethod==="transfer") {
        await handleTransfer()
      }
      //退回
      if(typeMethod==="back") {
        await handleReturn()
      }
      //拒绝
      if(typeMethod==="reject") {
        await handleReject()
      }
      //提交
      if(typeMethod==="submit") {
        await handleWrite()
      }
      //暂存
      if(typeMethod==="save") {
        await handleSave()
      }
      taskFormPromise.value=false
      approvalPromise.value=false
    }
  }
  // 标记 web-view 是否加载完成
  const webViewLoaded = ref(false);
  /**
 * 修复版：获取 web-view 实例并执行 evalJS
 */
  const getWebViewFormData = () => {
    if (!webViewLoaded.value) {
      uni.showToast({ title: '网页还在加载中', icon: 'none' });
      return;
    }
    uni.showLoading({ title: '获取数据中...' });
    // #ifdef APP-PLUS
    // APP 端：从原生页面实例获取 web-view 子控件
    if (!currentInstance) {
      uni.hideLoading();
      uni.showToast({ title: '页面实例获取失败', icon: 'none' });
      return;
    }
    const currentWebview = currentInstance.proxy?.$getAppWebview();
    if (!currentWebview) {
      uni.hideLoading();
      uni.showToast({ title: '原生页面实例获取失败', icon: 'none' });
      return;
    }
    // APP 端 web-view 是第一个子控件
    const webViewNode = currentWebview.children()[0];
    if (webViewNode && webViewNode.evalJS) {
      webViewNode.evalJS(`collectAllFormData()`);
      uni.hideLoading();
    } else {
      uni.hideLoading();
      uni.showToast({ title: '获取网页实例失败', icon: 'none' });
    }
    // #endif
  };

  const handleWebViewMessage = (e) => {
    const receivedData = e.detail.data.pop() || {};
    // 接收网页主动发送的加载完成标记
    if (receivedData.type === 'webViewLoaded') {
      webViewLoaded.value = true;
    }
    if (receivedData.type === 'validateResult') {
      taskFormPromise.value = receivedData.value;
      if (taskFormPromise.value) {
        
      }
    }
    if(receivedData.type === 'formData') {
      webFormData.value = JSON.parse(receivedData.value);
    }
  };
  const submitLoading = ref(false) //提交按钮
  //提交
  const handleWrite = async() => {
    submitLoading.value = true
    let params = {
      comment: model.value.comment,
      procInsId: procInsId.value,
      taskId: taskId.value,
      copyUserIds: model.value.copyUserIds &&  model.value.copyUserIds.join(','),
    };
    if (existTaskForm.value) {
      params.formConfig = webFormData.value?.param1?.schema
      params.variables = {...webFormData.value.param1?.data}
    }
    try{
      let res = await Api.writeTask(params);
      submitLoading.value = false
      uni.showToast({ title: res.msg, icon: 'none' });
      if(res.code == 0) {
        uni.redirectTo({
          url: './todo'
        })
      }
    } catch(e){
      submitLoading.value = false
    }
  }
  const saveLoading = ref(false) //暂存按钮
  //暂存
  const handleSave = async() => {
    saveLoading.value = true
    let params = {
      comment: model.value.comment,
      procInsId: procInsId.value,
      taskId: taskId.value,
      copyUserIds: model.value.copyUserIds &&  model.value.copyUserIds.join(','),
    };
    if (existTaskForm.value) {
      params.formConfig = webFormData.value?.param1?.schema //不用传，传是为了保持一致，后台接口不接收
      params.variables = {...webFormData.value.param1?.data}
    }
    try{
      let res = await Api.saveTask(params);
      saveLoading.value = false
      uni.showToast({ title: res.msg, icon: 'none' });
      if(res.code == 0) {
        uni.redirectTo({
          url: './todo'
        })
      }
    } catch(e){
      saveLoading.value = false
    }
  }
  //拒绝
  const handleReject = async() => {
    uni.showModal({
      title: '提示',
      content: '拒绝审批单流程会终止，是否继续？',
      success: async function (res) {
        if (res.confirm) {
          let params = {
            comment: model.value.comment,
            procInsId: procInsId.value,
            taskId: taskId.value,
            copyUserIds: model.value.copyUserIds &&  model.value.copyUserIds.join(','),
            id: "",
            targetKey: "",
          };
          if (existTaskForm.value) {
            params.formConfig = webFormData.value?.param1?.schema //不用传，传是为了保持一致，后台接口不接收
            params.variables = {...webFormData.value.param1?.data}
          }
          try{
            let res = await Api.rejectTask(params);
            uni.showToast({ title: res.msg, icon: 'none' });
            if(res.code == 0) {
              uni.redirectTo({
                url: './todo'
              })
            }
          } catch(e){
          }
        }
      },
    });
  }
  const returnListData = ref([])
  const showReturn = ref(false)
  const returnTargetKey = ref()
  //退回
  const handleReturn = async() => {
    let params = {
      comment: model.value.comment,
      procInsId: procInsId.value,
      taskId: taskId.value,
      copyUserIds: model.value.copyUserIds &&  model.value.copyUserIds.join(','),
    };
    let res = await Api.returnTaskListApi(params)
    if(res?.data?.length == 0){
      uni.showToast({
        title: '无可退回的节点',
        icon: 'none',
        duration: 3000,
      }) 
      return;
    }
    returnListData.value = res?.data?.map((item: any) => {
      return {
        label: item.name,
        value: item.id
      }
    })
    showReturn.value = true
  }
  //退回弹窗取消
  const cancelReturnDialog = () => {
    showReturn.value = false
  }
  //退回弹窗确认
  const confirmReturnDialog = async() => {
    if(!returnTargetKey.value) {
      uni.showToast({
        title: '请选择退回节点！',
        icon: 'none',
        duration: 3000,
      }) 
      return;
    }
    let params = {
      comment: model.value.comment,
      procInsId: procInsId.value,
      taskId: taskId.value,
      copyUserIds: model.value.copyUserIds &&  model.value.copyUserIds.join(','),
      targetKey: returnTargetKey.value,
      id: "",
    };
    if (existTaskForm.value) {
      params.formConfig = webFormData.value?.param1?.schema //不用传，传是为了保持一致，后台接口不接收
      params.variables = {...webFormData.value.param1?.data}
    }
    try{
      let res = await Api.returnTask(params);
      uni.showToast({ title: res.msg, icon: 'none' });
      if(res.code == 0) {
        uni.redirectTo({
          url: './todo'
        })
      }
    } catch(e){
    }
  }

  const showTransfer = ref(false)
  const showTransferTitle = ref('')
  const deptOptions = ref([])
  const deptList = ref([])
  const deptId = ref()
  const userList = ref([])
  const userId = ref()
  const type = ref('delegate')
  //转办
  const handleTransfer = async() => {
    showTransfer.value = true
    type.value = 'transfer'
    showTransferTitle.value = '转办任务'
    const res = await Api.getDeptList()
    let dept = handleDeptTree(res.data)
    deptOptions.value.push({ id: 'all', name: '全部部门', parentId: 'all' })
    deptOptions.value.push(...dept)
    deptList.value = flattenDeptTree(deptOptions.value)
  }
  //委派
  const handleDelegate = async() => {
    showTransfer.value = true
    type.value = 'delegate'
    showTransferTitle.value = '委派任务'
    const res = await Api.getDeptList()
    let dept = handleDeptTree(res.data)
    deptOptions.value.push({ id: 'all', name: '全部部门', parentId: 'all' })
    deptOptions.value.push(...dept)
    deptList.value = flattenDeptTree(deptOptions.value)
  }
  //部门点击确定，获取人员
  const getUser = async() => {
    let res
    if(deptId.value == 'all') {
      res = await Api.getUserList('')
    } else {
      res = await Api.getUserList(deptId.value)
    }
    userList.value = res.data
  }
  //委派或转办窗口点击取消
  const cancelTransferDialog = () => {
    showTransfer.value = false
  }
  //委派或转办窗口点击确认
  const confirmTransferDialog = async() => {
    if(!userId.value) {
      uni.showToast({
        title: '请选择用户',
        icon: 'none',
        duration: 3000,
      }) 
      return;
    }
    let params = {
      comment: model.value.comment,
      procInsId: procInsId.value,
      taskId: taskId.value,
      copyUserIds: model.value.copyUserIds &&  model.value.copyUserIds.join(','),
      userId: userId.value,
    };
    if (existTaskForm.value) {
      params.formConfig = webFormData.value?.param1?.schema //不用传，传是为了保持一致，后台接口不接收
      params.variables = {...webFormData.value.param1?.data}
    }
    try{
      let res;
      if (type.value = 'delegate') {
        res = await Api.delegateTask(params);
      } else {
        res = await Api.transferTask(params);
      }
      uni.showToast({ title: res.msg, icon: 'none' });
      if(res.code == 0) {
        uni.redirectTo({
          url: './todo'
        })
      }
    } catch(e){
    }
  }
  const showComplete = ref(false)
  const action = baseUrl + '/dev-api/app/file/upload/default'
  const uploadHeaders = ref()
  const approvalFile = ref([])
  //通过
  const handleComplete = () => {
    showComplete.value = true
    uploadHeaders.value = {
      Authorization: 'Bearer ' + getAccessToken(),
      'tenant-id': getTenantId(),
      'appTenantCode': getAppTenantCode(),
      'app-id': appId,
      'env': env
    }
  }

  //通过弹窗-点击取消
  const cancelCompleteDialog = () => {
    showComplete.value = false
    approvalFile.value = []
  }
  //通过弹窗-点击确定
  const confirmCompleteDialog = () => {
    uni.showModal({
      title: '提示',
      content: '如果上传附件，需要附件正常上传完成后再保存，否则附件不能正常保存？',
      success: async function (res) {
        if (res.confirm) {
          let params = {
            comment: model.value.comment,
            procInsId: procInsId.value,
            taskId: taskId.value,
            copyUserIds: model.value.copyUserIds &&  model.value.copyUserIds.join(','),
            approvalFile: approvalFile.value
          };
          if (existTaskForm.value) {
            params.formConfig = webFormData.value?.param1?.schema //不用传，传是为了保持一致，后台接口不接收
            params.variables = {...webFormData.value.param1?.data}
          }
          try{
            let res = await Api.complete(params);
            uni.showToast({ title: res.msg, icon: 'none' });
            if(res.code == 0) {
              uni.redirectTo({
                url: './todo'
              })
            }
          } catch(e){
          }
        }
      },
    });
  }
  const percentage = ref()
  const showPercentage = ref(false)
  const selectFile = async () => {// 选择文件
    const files = await chooseFile();
    if (!files.length) {
      uni.showToast({
        icon: "none",
        title: "取消选择",
      });
      return;
    }
    const [file] = files;
    try {
      showPercentage.value = true
      const result = await uploadFile({
        file, // 传入file对象即可，内部出做处理
        url: action,
        headers: uploadHeaders.value,
        onprogress(e) { // 上传进度，可以通过abort(file)中断
          // const p = (e.loaded / e.total * 100).toFixed(2)
          percentage.value = e.progress
        },
      });
      approvalFile.value.push({
        file: result.data.url,
        fileName: result.data.filename
      })
      showPercentage.value = false
      console.log("result", result);
    } catch (error) {
      // 大多数情况是不需要处理错误的
      // 401,500,404，跨域、未知错误等
      showPercentage.value = false
      if (error instanceof Error) {
        uni.showToast({
          icon: "none",
          title: error.message,
        });
        console.log("Error：", error);
        return;
      }
      if (error?.statusCode) {
        uni.showToast({
          icon: "none",
          title: String(error.statusCode),
        });
        console.log("statusCode error:", error);
      }
    }
  }
  //删除文件
  const handleClose = (item) => {
    approvalFile.value = approvalFile.value.filter( i=> i.fileName != item.fileName)
  }
  const showSelectPicker = ref(false)
  const openSelectPicker = () => {
    showSelectPicker.value = true
  }
  const closeSelectPicker = () => {
    showSelectPicker.value = false
  }
  const showComment = ref(false)
  const handleFocusComment = () => {
    showComment.value = true
  }
  const handleBlurComment  = () => {
    showComment.value = false
  }
  //点击下一步
  const nextStep = () => {
    getWebViewFormData()  
    setTimeout(async()=>{
      //第一步校验通过显示第二步
      if(taskFormPromise.value) {
        active.value = 1
      }
    },2000)
  }
  const prevStep = () => {
    active.value = 0
  }
</script>

<style lang="scss" scoped>
.page-app {
  box-sizing: border-box;
  background-color: #f6f6f6;
}
.page-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.page-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;
}

.card-container {
  box-sizing: border-box;
}
.card-first {
  height: 60%; 
}
.card-second {
  height: 30%;
}
.custom-card {
  height: 100%;
  background-color: grey;
  box-sizing: border-box;
}
/* web-view占满card高度 */
.web-view-full {
  height: calc(100% - 40px);
  width: 100%;
}
.group {
  margin-top: 12px;
}
.footer {
  padding: 0 25px 21px;
  display: flex;
}
:deep(.wd-textarea__count) {
  width: 56px;
}
.page-app {
  :deep() {
    .custom-btn {
      padding: 15px;
      margin-right: 10px;
    }
    .wd-progress__label{
      width: 40px;
    }
  }
}
.loading-text {
  margin-top: 15px;
  font-size: 14px;
  color: #666;
}
.steps-control{
  display: flex;
  align-items: center;
  justify-content: center;
}
.form{
  background-color: #fff;
}
</style>
