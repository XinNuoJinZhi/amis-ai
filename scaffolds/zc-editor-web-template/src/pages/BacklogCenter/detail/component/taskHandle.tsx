import React, { useState, useEffect, useRef } from 'react';
import { render as amisRender } from 'amis';
import { service } from "@/utils/request"
import { complete,writeTask,saveTask, delegateTask, transferTask, rejectTask, returnTaskListApi, returnTask, updateRead } from '@/api/backlogCenter'
import { history } from '@umijs/max';
import { confirm, toast } from 'amis';
import { disposeTaskFormItemStatus } from '@/engine/form'
import {getSchemaTpl} from 'amis-editor'
import { useAdminBaseUrl, useDevBaseUrl } from "@/utils/util"
import {Spin} from 'antd';
import { processAndFetchOptions } from "@/utils/util"
import initApiStore from "@/store/initApi"
import permStore from '@/store/permission';
import {env as amisEnv} from '@/hooks/amis';
const TaskHandle: React.FC = (props) => {
  let taskFormData = props.taskFormData;
  let existTaskForm = props.existTaskForm;
  let messageIds = props.messageIds;
  let noApprovalData = props.noApprovalData
  //环境变量
  const [envVar, setEnvVar] = useState({});
  const [zcAppVal, setZCAppVal] = useState({});
  const [zcCompanyVal, setZCCompanyVal] = useState({});
  const [zcUserVal, setZCUserVal] = useState({});
  const [copyUser, setCopyUser] = useState([]);
  const [nextUser, setNextUser] = useState([]);
  const [noticeSuccess, setNoticeSuccess] = useState(false);
  const formInfo = React.useRef();
  //下面审批意见的form
  const approveForm = React.useRef();
  const [taskForm, setTaskForm] = useState({
    procInsId: "", // 流程实例编号
    taskId: "",// 流程任务编号
  })
  const taskFormVal = useRef({})
  const [editForm, setEditForm] = useState({})
  const editFormVal = useRef({})
  const [subForm, setSubForm] = useState({})
  const subFormVal = useRef({})
  const [returnTaskList, setReturnTaskList] = useState([]);
  const returnTaskListVal = useRef([])
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [uploadFileUrl, setUploadFileUrl] = useState(null);
  const [uploadFileName, setUploadFileName] = useState(null);
  const [approvalFile, setApprovalFile] = useState<any[]>([]);
  const approvalFileVal = useRef(null)
  const uploadFileUrlVal = useRef(null)
  const uploadFileNameVal = useRef(null)
  const [uploadSchema,setUploadSchema] = useState({})
  const [returnSchema,setReturnSchema] = useState({})
  const [showLoading, setShowLoading] = useState(false);
  const initData = () => {
    const params = new URLSearchParams(window.location.search);
    const procInsId = params.get('procInsId');
    const taskId = params.get('taskId');
    setTaskForm({ ...taskForm, procInsId: procInsId, taskId: taskId })
    //接口增加返回envVar
    let envVarData = props?.envVar?.envVar;
    let zcApp = props?.envVar?.zcApp;
    let zcCompany = props?.envVar?.zcCompany;
    let zcUser = props?.envVar?.zcUser;
    let obj = {};
    for (var i = 0; i < envVarData?.length; i++) {
      obj[envVarData[i].key] = envVarData[i].value;
    }
    setEnvVar(obj)
    setZCAppVal(zcApp)
    setZCCompanyVal(zcCompany)
    setZCUserVal(zcUser)
  };
  //初始化
  useEffect(() => {
    initData()
  }, [])
  useEffect(() => {
    setCopyUser(copyUser)
  }, [copyUser])
  useEffect(() => {
    setNextUser(nextUser)
  }, [nextUser])
  useEffect(() => {
    uploadFileUrlVal.current = uploadFileUrl
  }, [uploadFileUrl])
  useEffect(() => {
    uploadFileNameVal.current = uploadFileName
  }, [uploadFileName])

  useEffect(() => {
    approvalFileVal.current = approvalFile
  }, [approvalFile])

  useEffect(() => {
    subFormVal.current = subForm
  }, [subForm])
  useEffect(() => {
    taskFormVal.current = taskForm
  }, [taskForm])
  useEffect(() => {
    editFormVal.current = editForm
  }, [editForm])

  useEffect(() => {
    returnTaskListVal.current = returnTaskList
  }, [returnTaskList])

  if (noticeSuccess) {
    // 检查 uni 是否已初始化
    if (window.uni) {
      // 已初始化，直接调用
      uni.postMessage({
        data: {
          action: 'backToList'
        }
      });
    } else {
      // 未初始化，监听事件等待触发（仅可能在页面刚加载时出现）
      document.addEventListener('UniAppJSBridgeReady', function() {
        uni.postMessage({
          data: {
            action: 'backToList'
          }
        });
      });
    }
  }

  //通过时上传附件
  const handleUploadOk = async () => {
    setShowLoading(true)
    let params = {
      comment: subFormVal.current.comment,
      procInsId: taskFormVal.current.procInsId,
      taskId: taskFormVal.current.taskId,
      copyUserIds: subFormVal.current.copyUserIds && subFormVal.current.copyUserIds.join(','),
      nextUserIds: subFormVal.current.nextUserIds && subFormVal.current.nextUserIds.join(','),
      // file: uploadFileUrlVal.current,
      // fileName: uploadFileNameVal.current,
      approvalFile: approvalFileVal.current
    };
    if (existTaskForm) {
      // params.variables = {...editFormVal.current};
      const formInfoObj = (formInfo.current as any).getComponentByName('formInfo')
      const fetcher: any = formInfoObj.props.env.fetcher
      const fieldsVal = await processAndFetchOptions(formInfoObj.props.$schema.body, fetcher, formInfo.current)
      formInfoObj.props.$schema.fields = fieldsVal
      delete formInfoObj.props.$schema.body
      params.formConfig = formInfoObj.props.$schema
      params.variables = {...formInfoObj.props.data}
    }
    try{
      let res = await complete(params);
      if (res.data.code != 0) {
        setShowLoading(false)
        toast.error(res.data.msg, {
          position: "top-center"
        })
      } else {
        toast.success(res.data.msg, {
          position: "top-center"
        })
      }
      setUploadSchema({})
      // const param = new URLSearchParams(window.location.search);
      const messageId = messageIds;
      if (messageId.length > 0) {
        await updateRead(messageId)
      }
      if (res.data.code != 500) {
        if (window.location.pathname == "/app/detail") { // 移动端点击提交之后的逻辑
          setNoticeSuccess(true)
        } else {
          const param = new URLSearchParams(window.location.search);
          const appid = param.get('appid');
          const env = param.get('env');
          const portalKey = param.get('portalKey')
          let url = '/app/todoList' + "?appid=" + appid + "&env=" + env + (portalKey ? `&portalKey=${portalKey}` : '')
          history.push(url)
        }
      }
    } catch{
      setUploadSchema({})
    }
    setShowLoading(false)
  }
  const handleUploadCancel = () => {
    // setIsUploadOpen(false)
    setUploadSchema({})
  }
  const importUrl = useDevBaseUrl('/app/file/upload/default')
  //填写表单-form校验
  const formInfoValidate = async () => {
    const formInfoObj = (formInfo.current as any).getComponentByName('formInfo')
    const approveFormObj = (approveForm.current as any).getComponentByName('approveForm')
    const isResult = await formInfoObj.validate()
    const isResultSub = await approveFormObj.validate()
    return isResult && isResultSub
  }
  //通过
  const handleComplete = async () => {
    let result = await formInfoValidate()
    if (result) {
      // setIsUploadOpen(true)
      FileUpload()
    }
  }
  //委派
  const handleDelegate = async () => {
    let result = await formInfoValidate()
    return result
  }
  //转办
  const handleTransfer = async () => {
    let result = await formInfoValidate()
    return result
  }
  //退回
  const handleReturn = async () => {
    let result = await formInfoValidate()
    if (result) {
      let params = {
        comment: subFormVal.current.comment,
        procInsId: taskFormVal.current.procInsId,
        taskId: taskFormVal.current.taskId,
        copyUserIds: subFormVal.current.copyUserIds && subFormVal.current.copyUserIds.join(','),
        nextUserIds: subFormVal.current.nextUserIds && subFormVal.current.nextUserIds.join(',')
      };
      let res = await returnTaskListApi(params)
      if(res?.data?.data.length == 0){
        toast.warning('无可退回的节点');
        return;
      }
      let dataList = []
      dataList = res?.data?.data?.map((item: any) => {
        return {
          label: item.name,
          value: item.id
        }
      })
      setReturnTaskList(dataList);
      // setIsReturnOpen(true);
      ReturnDialog()
    }
  }
  //退回任务-点击确定
  const handleReturnOk = async (data) => {
    if (!data) {
      toast.error('请选择退回节点！', {
        position: "top-center"
      })
      return false
    }
    setShowLoading(true)
    let params = {
      comment: subFormVal.current.comment,
      procInsId: taskFormVal.current.procInsId,
      taskId: taskFormVal.current.taskId,
      copyUserIds: subFormVal.current.copyUserIds && subFormVal.current.copyUserIds.join(','),
      nextUserIds: subFormVal.current.nextUserIds && subFormVal.current.nextUserIds.join(','),
      targetKey: data,
      id: "",
    };
    if (existTaskForm) {
      const formInfoObj = (formInfo.current as any).getComponentByName('formInfo')
      const fetcher: any = formInfoObj.props.env.fetcher
      const fieldsVal = await processAndFetchOptions(formInfoObj.props.$schema.body, fetcher, formInfo.current)
      formInfoObj.props.$schema.fields = fieldsVal
      delete formInfoObj.props.$schema.body
      params.formConfig = formInfoObj.props.$schema
      params.variables = {...formInfoObj.props.data}
    }
    let res = await returnTask(params);
    const messageId = messageIds;
    if (messageId.length > 0) {
      await updateRead(messageId)
    }
    if (res.data.code != 0) {
      setShowLoading(false)
      toast.error(res.data.msg, {
        position: "top-center"
      })
      return
    } else {
      toast.success(res.data.msg, {
        position: "top-center"
      })
      setReturnSchema({})
    }
    setShowLoading(false)
    if (window.location.pathname == "/app/detail") { // 移动端点击提交之后的逻辑
      setNoticeSuccess(true)
    } else {
      const param = new URLSearchParams(window.location.search);
      const appid = param.get('appid');
      const env = param.get('env');
      const portalKey = param.get('portalKey')
      let url = '/app/todoList' + "?appid=" + appid + "&env=" + env + (portalKey ? `&portalKey=${portalKey}` : '')
      history.push(url)
    }
  }
  const handleReturnCancel = () => {
    // setIsReturnOpen(false);
    setReturnSchema({})
  }
  //拒绝
  const handleReject = async () => {
    let result = await formInfoValidate()
    if (result) {
      confirm(
        '拒绝审批单流程会终止，是否继续？',
        '提示',
        '确认',
        '取消'
      ).then(async res => {
        if (res) {
          setShowLoading(true)
          let params = {
            comment: subFormVal.current.comment,
            procInsId: taskFormVal.current.procInsId,
            taskId: taskFormVal.current.taskId,
            copyUserIds: subFormVal.current.copyUserIds && subFormVal.current.copyUserIds.join(','),
            nextUserIds: subFormVal.current.nextUserIds && subFormVal.current.nextUserIds.join(','),
            id: "",
            targetKey: "",
          };
          if (existTaskForm) {
            const formInfoObj = (formInfo.current as any).getComponentByName('formInfo')
            const fetcher: any = formInfoObj.props.env.fetcher
            const fieldsVal = await processAndFetchOptions(formInfoObj.props.$schema.body, fetcher, formInfo.current)
            formInfoObj.props.$schema.fields = fieldsVal
            delete formInfoObj.props.$schema.body
            params.formConfig = formInfoObj.props.$schema
            params.variables = {...formInfoObj.props.data}
          }
          rejectTask(params).then(async (res) => {
            if (res.data.code != 0) {
              setShowLoading(false)
              toast.error(res.data.msg, {
                position: "top-center"
              })
            } else {
              toast.success(res.data.msg, {
                position: "top-center"
              })
            }
            if (res.data.code == 0) {
              // const param = new URLSearchParams(window.location.search);
              const messageId = messageIds;
              if (messageId.length > 0) {
                await updateRead(messageId)
              }
              setShowLoading(false)
              if (window.location.pathname == "/app/detail") { // 移动端点击提交之后的逻辑
                setNoticeSuccess(true)
              } else {
                const param = new URLSearchParams(window.location.search);
                const appid = param.get('appid');
                const env = param.get('env');
                const portalKey = param.get('portalKey')
                let url = '/app/todoList' + "?appid=" + appid + "&env=" + env + (portalKey ? `&portalKey=${portalKey}` : '')
                history.push(url)
              }
            }
          })
        }
      });
    }
  }
  //审批任务填写
  const handleWrite = async() => {
    let result = await formInfoValidate()
    if (result) {
      setShowLoading(true)
      let params = {
        comment: subFormVal.current.comment,
        procInsId: taskFormVal.current.procInsId,
        taskId: taskFormVal.current.taskId,
        copyUserIds: subFormVal.current.copyUserIds && subFormVal.current.copyUserIds.join(','),
        nextUserIds: subFormVal.current.nextUserIds && subFormVal.current.nextUserIds.join(','),
      };
      if (existTaskForm) {
        const formInfoObj = (formInfo.current as any).getComponentByName('formInfo')
        // console.log(formInfoObj,'formInfoObj')
        // formInfoObj.props.store.children[0].loadOptions
        const fetcher: any = formInfoObj.props.env.fetcher
        const fieldsVal = await processAndFetchOptions(formInfoObj.props.$schema.body, fetcher, formInfo.current)
        formInfoObj.props.$schema.fields = fieldsVal
        console.log(formInfoObj.props.$schema.fields,'formInfoObj.props.$schema.fields')
        delete formInfoObj.props.$schema.body
        params.formConfig = formInfoObj.props.$schema
        params.variables = {...formInfoObj.props.data}
      }
      try{
        let res = await writeTask(params);
        if (res.data.code != 0) {
          setShowLoading(false)
          toast.error(res.data.msg, {
            position: "top-center"
          })
        } else {
          toast.success(res.data.msg, {
            position: "top-center"
          })
        }
        const messageId = messageIds;
        if (messageId.length > 0) {
          await updateRead(messageId)
        }
        setShowLoading(false)
        if (res.data.code != 500) {
          if (window.location.pathname == "/app/detail") { // 移动端点击提交之后的逻辑
            setNoticeSuccess(true)
          } else {
            const param = new URLSearchParams(window.location.search);
            const appid = param.get('appid');
            const env = param.get('env');
            const portalKey = param.get('portalKey')
            let url = '/app/todoList' + "?appid=" + appid + "&env=" + env + (portalKey ? `&portalKey=${portalKey}` : '')
            history.push(url)
          }
        }
      } catch {
      }
    }
  }
  //暂存
  const handleSave = async() => {
    let result = await formInfoValidate()
    if (result) {
      setShowLoading(true)
      let params = {
        comment: subFormVal.current.comment,
        procInsId: taskFormVal.current.procInsId,
        taskId: taskFormVal.current.taskId,
        copyUserIds: subFormVal.current.copyUserIds && subFormVal.current.copyUserIds.join(','),
        nextUserIds: subFormVal.current.nextUserIds && subFormVal.current.nextUserIds.join(','),
      };
      if (existTaskForm) {
        const formInfoObj = (formInfo.current as any).getComponentByName('formInfo')
        params.variables = {...formInfoObj.props.data}
      }
      try{
        let res = await saveTask(params);
        if (res.data.code != 0) {
          setShowLoading(false)
          toast.error(res.data.msg, {
            position: "top-center"
          })
        } else {
          toast.success(res.data.msg, {
            position: "top-center"
          })
        }
        const messageId = messageIds;
        if (messageId.length > 0) {
          await updateRead(messageId)
        }
        setShowLoading(false)
        if (res.data.code != 500) {
          if (window.location.pathname == "/app/detail") { // 移动端点击提交之后的逻辑
            setNoticeSuccess(true)
          } else {
            const param = new URLSearchParams(window.location.search);
            const appid = param.get('appid');
            const env = param.get('env');
            const portalKey = param.get('portalKey')
            let url = '/app/todoList' + "?appid=" + appid + "&env=" + env + (portalKey ? `&portalKey=${portalKey}` : '')
            history.push(url)
          }
        }
      } catch {
      }
    }
  }
  // const dealDataStatus = (data, disableFields, hiddenFields) => {
  //   data.map(i => {
  //     if (i.items) {
  //       dealDataStatus(i.items, disableFields, hiddenFields)
  //     } else if (i.body) {
  //       dealDataStatus(i.body, disableFields, hiddenFields)
  //     } else {
  //       if (disableFields.includes(i.name)) {
  //         i.disabled = true
  //       } else {
  //         i.disabled = false
  //       }
  //       if (hiddenFields.includes(i.name)) {
  //         i.hidden = true
  //       } else {
  //         i.hidden = false
  //       }
  //     }
  //   })
  // }
  //委派任务点击确定
  const handleDelegateTask = async (data) => {
    if (data.length == 0) {
      toast.error('请选择用户', {
        position: "top-center"
      })
      return false
    } else {
      let params = {
        comment: subFormVal.current.comment,
        procInsId: taskFormVal.current.procInsId,
        taskId: taskFormVal.current.taskId,
        copyUserIds: subFormVal.current.copyUserIds && subFormVal.current.copyUserIds.join(','),
        nextUserIds: subFormVal.current.nextUserIds && subFormVal.current.nextUserIds.join(','),
        userId: data[0],
      };
      if (existTaskForm) {
        // params.variables = {...editFormVal.current};
        const formInfoObj = (formInfo.current as any).getComponentByName('formInfo')
        const fetcher: any = formInfoObj.props.env.fetcher
        const fieldsVal = await processAndFetchOptions(formInfoObj.props.$schema.body, fetcher, formInfo.current)
        formInfoObj.props.$schema.fields = fieldsVal
        delete formInfoObj.props.$schema.body
        params.formConfig = formInfoObj.props.$schema
        params.variables = {...formInfoObj.props.data}
      }
      let res = await delegateTask(params);
      if (res.data.code != 0) {
        toast.error(res.data.msg, {
          position: "top-center"
        })
        return
      }
      toast.success(res.data.msg, {
        position: "top-center"
      })
      const param = new URLSearchParams(window.location.search);
      const appid = param.get('appid');
      const env = param.get('env');;
      // const param = new URLSearchParams(window.location.search);
      const messageId = messageIds;
      if (messageId.length > 0) {
        await updateRead(messageId)
      }
      if (window.location.pathname == "/app/detail") { // 移动端点击提交之后的逻辑
        setNoticeSuccess(true)
      } else {
        const portalKey = param.get('portalKey')
        let url = '/app/todoList' + "?appid=" + appid + "&env=" + env + (portalKey ? `&portalKey=${portalKey}` : '')
        history.push(url)
      }
    }
  }
  //转办任务点击确定
  const handleTransferTask = async (data) => {
    if (data.length == 0) {
      toast.error('请选择用户', {
        position: "top-center"
      })
      return false
    } else {
      let params = {
        comment: subFormVal.current.comment,
        procInsId: taskFormVal.current.procInsId,
        taskId: taskFormVal.current.taskId,
        copyUserIds: subFormVal.current.copyUserIds && subFormVal.current.copyUserIds.join(','),
        nextUserIds: subFormVal.current.nextUserIds && subFormVal.current.nextUserIds.join(','),
        userId: data[0],
      };
      if (existTaskForm) {
        // params.variables = {...editFormVal.current};
        const formInfoObj = (formInfo.current as any).getComponentByName('formInfo')
        const fetcher: any = formInfoObj.props.env.fetcher
        const fieldsVal = await processAndFetchOptions(formInfoObj.props.$schema.body, fetcher, formInfo.current)
        formInfoObj.props.$schema.fields = fieldsVal
        delete formInfoObj.props.$schema.body
        params.formConfig = formInfoObj.props.$schema
        params.variables = {...formInfoObj.props.data}
      }
      let res = await transferTask(params);
      if (res.data.code != 0) {
        toast.error(res.data.msg, {
          position: "top-center"
        })
        return
      }
      toast.success(res.data.msg, {
        position: "top-center"
      })
      const param = new URLSearchParams(window.location.search);
      const appid = param.get('appid');
      const env = param.get('env');;
      // const param = new URLSearchParams(window.location.search);
      const messageId = messageIds;
      if (messageId.length > 0) {
        await updateRead(messageId)
      }
      if (window.location.pathname == "/app/detail") { // 移动端点击提交之后的逻辑
        setNoticeSuccess(true)
      } else {
        const portalKey = param.get('portalKey')
        let url = '/app/todoList' + "?appid=" + appid + "&env=" + env + (portalKey ? `&portalKey=${portalKey}` : '')
        history.push(url)
      }
    }
  }
  const InputForm = () => {
    const initApi = taskFormData && taskFormData.formApi ? taskFormData.formApi : ''
    const primaryField = taskFormData && taskFormData.primaryField ? taskFormData.primaryField : ''
    let disableFields = taskFormData.disableFields ? taskFormData.disableFields : [];
    let hiddenFields = taskFormData.hiddenFields ? taskFormData.hiddenFields : [];
    const forceDisabled = false
    disposeTaskFormItemStatus(taskFormData.fields, disableFields, hiddenFields, forceDisabled)
    let disAllCombo = []
    let hideAllCombo = []
    for(var i=0;i<taskFormData.fields.length;i++){
      if(taskFormData.fields[i].type=='combo'){
          for(var j=0;j<taskFormData.fields[i].items.length;j++){
              const val = taskFormData.fields[i].items[j].disabled ? taskFormData.fields[i].items[j].disabled : false
              disAllCombo.push(val)
              const hideVal = taskFormData.fields[i].items[j].hidden ? taskFormData.fields[i].items[j].hidden : false
              hideAllCombo.push(hideVal)
              if(taskFormData.fields[i].items[j].type == 'service'){
                  const val = taskFormData.fields[i].items[j].body[0].readOnly
                  disAllCombo.push(val)
                  const hideVal = taskFormData.fields[i].items[j].hidden ? taskFormData.fields[i].items[j].hidden : false
                  hideAllCombo.push(hideVal)
              }
          }
          taskFormData.fields[i].disabled = [...new Set(disAllCombo)].length > 1 ? false : [...new Set(disAllCombo)][0]
          taskFormData.fields[i].hidden = [...new Set(hideAllCombo)].length > 1 ? false : [...new Set(hideAllCombo)][0]
      }
      //移动端表单将combo 改为 select
      if(taskFormData.fields[i].type=='select'){
        const name = taskFormData.fields[i].name
        taskFormData.fields[i].hidden = hiddenFields.some(item => item.split('.')[0] === name);
      }
      //移动端表单将combo 改为 select
      if(taskFormData.fields[i].type=='select'){
        const name = taskFormData.fields[i].name
        taskFormData.fields[i].disabled = disableFields.some(item => item.split('.')[0] === name);
      }
    }
    let disAllBtnGroupSel = []
    let hideAllBtnGroupSel = []
    for(var i=0;i<taskFormData.fields.length;i++){
      if(taskFormData.fields[i].type=='button-group-select'){
        for(var j=0;j<taskFormData.fields[i]?.addControls?.length;j++){
          const val = taskFormData.fields[i].addControls[j].disabled ? taskFormData.fields[i].addControls[j].disabled : false
          disAllBtnGroupSel.push(val)
          const hideVal = taskFormData.fields[i].addControls[j].hidden ? taskFormData.fields[i].addControls[j].hidden : false
          hideAllBtnGroupSel.push(hideVal)
        }
        taskFormData.fields[i].disabled = [...new Set(disAllBtnGroupSel)].length > 1 ? false : [...new Set(disAllBtnGroupSel)][0]
        taskFormData.fields[i].hidden = [...new Set(hideAllBtnGroupSel)].length > 1 ? false : [...new Set(hideAllBtnGroupSel)][0]
      }
    }
    const schema = {
      type: "form",
      name: "formInfo",
      initApi: (taskFormData.dataId != null && taskFormData.dataId != '') ? initApi.replace('${' + primaryField + '}', taskFormData.dataId) : '',
      title: taskFormData && taskFormData.title ? taskFormData.title : '',
      body: taskFormData && taskFormData.fields ? taskFormData.fields : [],
      data: !(taskFormData.dataId != null && taskFormData.dataId != '') ? taskFormData.variables : {},
      actions: [],
      onEvent: taskFormData.onEvent
    }
    return (
      <div>
        {amisRender(schema, {
          scopeRef: (ref: any) => (formInfo.current = ref),
          context: {
            zcApp: zcAppVal,
            zcCompany: zcCompanyVal,
            zcUser: zcUserVal,
            app: initApiStore.getState().initApi,
            ...envVar,
            $$noPer: true,
            $$permissionsData: permStore.getState().permData,
          }
        }, {
          fetcher: service,
          theme: amisEnv.theme
        })}
      </div>
    )
  };
  const ApproveForm = () => {
    const submitBtn = taskFormData.processOperationSettings.includes('submit')
    const saveBtn = taskFormData.processOperationSettings.includes('save')
    const copyBtn = taskFormData.processOperationSettings.includes('cc')
    const passBtn = taskFormData.processOperationSettings.includes('pass')
    const delegateBtn = taskFormData.processOperationSettings.includes('delegate')
    const transferBtn = taskFormData.processOperationSettings.includes('transfer')
    const backBtn = taskFormData.processOperationSettings.includes('back')
    const stopBtn = taskFormData.processOperationSettings.includes('stop')
    const noApprovalDataDis = noApprovalData
    const schema = {
      "type": "form",
      "name": "approveForm",
      "className": "approveForm",
      "title": "",
      "mode": "horizontal",
      "wrapWithPanel": false,
      "body": [{
        "name": "comment",
        "type": "textarea",
        "label": "审批意见",
        "required": true,
        "showCounter": true,
        "maxLength": 255,
        "placeholder": "请输入审批意见",
      },
      {
        "type": "input-group",
        "label": "抄送人",
        "visible": copyBtn,
        "body": [
          {
            // "type": "input-tag",
            "type": "select",
            "name": "copyUserIds",
            "id": "copyUserIds",
            // "closable": true,
            "multiple": true,
            "selectMode": 'group',
            "clearable": true,
            "labelField": 'nickname',
            "valueField": "id",
            "placeholder": "请通过右侧按钮选择抄送人",
            "joinValues": false,
            "extractValue": true,
            "source": useDevBaseUrl("/application/system/user/allList")
          },
          getSchemaTpl('deptUserSelect', {
            "label": false,
            "name": "copyUserIds",
            "dialogTitle": "选择抄送人",
            "deptApi": useDevBaseUrl("/system/dept/all_list"), //部门Api
            "userApi": useDevBaseUrl("/system/user/all_page"), //人员Api
            "btCustom": {
              "icon": "fa fa-edit",
              "level": "primary",
              "style": {
                borderRadius: '50%',
                marginLeft: '15px'
              },
              "label": '',
            },
          }),
        ]
      },
      // {
      //   "type": "input-group",
      //   "label": "指定审批人",
      //   "body": [
      //     {
      //       // "type": "input-tag",
      //       "type": "select",
      //       "name": "nextUserIds",
      //       "id": "nextUserIds",
      //       // "closable": true,
      //       "multiple": true,
      //       "selectMode": 'group',
      //       "clearable": true,
      //       "labelField": 'nickname',
      //       "valueField": "id",
      //       "placeholder": "请通过右侧按钮选择审批人",
      //       "joinValues": false,
      //       "extractValue": true,
      //       "source": useDevBaseUrl("/application/system/user/allList")
      //     },
      //     getSchemaTpl('deptUserSelect',
      //     {
      //       "label": '',
      //       "name": "nextUserId",
      //       "value": "${nextUserIds}",
      //       "dialogTitle": "指定审批人",
      //       "deptApi": useDevBaseUrl("/system/dept/all_list"), //部门Api
      //       "userApi": useDevBaseUrl("/system/user/all_page"), //人员Api
      //       "btCustom": {
      //         "icon": "fa fa-edit",
      //         "level": "primary",
      //         "style": {
      //           borderRadius: '50%',
      //           marginLeft: '15px'
      //         },
      //         "label": '',
      //       },
      //       onDataChange: async (action: object, event: object, data: any): void => {
      //         action({
      //           actionType: "setValue",
      //           componentName: "nextUserIds",
      //           "args": {
      //             "value": data
      //           }
      //         })
      //       }
      //     })
      //   ],
      //   "description": "如果指定审批人是多个，并且下一任务不是多实例任务，会将指定的审批人作为下一任务的候选人。"
      // },
      {
        "type": "wrapper",
        "className": "processDetail",
        style: { display: 'flex' },
        "body": [
          {
            "label": "提交",
            "type": "button",
            "visible": submitBtn,
            "disabled": noApprovalDataDis,
            "icon": "fa fa-check",
            "level": "info",
            "style": {
              "marginLeft": "15px"
            },
            "onEvent": {
              "click": {
                "actions": [{
                  "actionType": "custom",
                  "script": async(context, doAction, event) => {
                    await handleWrite()
                    doAction({
                      actionType: 'broadcast',
                      "args": {
                        "eventName": "noticeRefresh"
                      },
                    });
                  }
                }]
              }
            }
          },
          {
            "label": "暂存",
            "type": "button",
            "visible": saveBtn,
            "disabled": noApprovalDataDis,
            "icon": "fa fa-check",
            "level": "info",
            "style": {
              "marginLeft": "15px"
            },
            "onEvent": {
              "click": {
                "actions": [{
                  "actionType": "custom",
                  "script": async(context, doAction, event) => {
                    await handleSave()
                    doAction({
                      actionType: 'broadcast',
                      "args": {
                        "eventName": "noticeRefresh"
                      },
                    });
                  }
                }]
              }
            }
          },
          {
            "label": "通过",
            "type": "button",
            "icon": "fa fa-check",
            "level": "success",
            "visible": passBtn,
            "disabled": noApprovalDataDis,
            "onEvent": {
              "click": {
                "actions": [{
                  "actionType": "custom",
                  "script": (context, doAction, event) => {
                    handleComplete()
                  }
                }]
              }
            }
          },
          getSchemaTpl('deptUserSelect',
          {
            "label": "",
            "name": "userId",
            "dialogTitle": "委派任务",
            "selectMode": 'radio',
            "deptApi": useDevBaseUrl("/system/dept/all_list"), //部门Api
            "userApi": useDevBaseUrl("/system/user/all_page"), //人员Api
            "btCustom": {
              "icon": "fa fa-paper-plane-o",
              "level": "info",
              "label": '委派',
              "visible": delegateBtn,
              "disabled": noApprovalDataDis,
              "onClick": async () => {
                let res = await handleDelegate()
                return res;
              },
            },
            onDataChange: async (action: object, event: object, data: any): void => {
              //委派任务弹窗点击确定
              await handleDelegateTask(data)
              action({
                actionType: 'broadcast',
                "args": {
                  "eventName": "noticeRefresh"
                },
              });
            }
          }),
          getSchemaTpl('deptUserSelect',
          {
            "label": "",
            "name": "userId",
            "dialogTitle": "转办任务",
            "selectMode": 'radio',
            "deptApi": useDevBaseUrl("/system/dept/all_list"), //部门Api
            "userApi": useDevBaseUrl("/system/user/all_page"), //人员Api
            "btCustom": {
              "icon": "fa fa-edit",
              "level": "info",
              "label": '转办',
              "visible": transferBtn,
              "disabled": noApprovalDataDis,
              "onClick": async () => {
                let res = await handleTransfer()
                return res;
              },
            },
            onDataChange: async (action: object, event: object, data: any): void => {
              //转办任务弹窗点击确定
              await handleTransferTask(data)
              action({
                actionType: 'broadcast',
                "args": {
                  "eventName": "noticeRefresh"
                },
              });
            }
          }),
          {
            "label": "退回",
            "type": "button",
            "visible": backBtn,
            "disabled": noApprovalDataDis,
            "icon": "fa fa-arrow-left",
            "level": "warning",
            "style": {
              "marginLeft": "15px"
            },
            "onEvent": {
              "click": {
                "actions": [{
                  "actionType": "custom",
                  "script": (context, doAction, event) => {
                    handleReturn()
                  }
                }]
              }
            }
          },
          {
            "label": "拒绝",
            "type": "button",
            "visible": stopBtn,
            "disabled": noApprovalDataDis,
            "icon": "fa fa-close",
            "level": "danger",
            "style": {
              "marginLeft": "15px"
            },
            "onEvent": {
              "click": {
                "actions": [{
                  "actionType": "custom",
                  "script": async(context, doAction, event) => {
                    await handleReject()
                    doAction({
                      actionType: 'broadcast',
                      "args": {
                        "eventName": "noticeRefresh"
                      },
                    });
                  }
                }]
              }
            }
          }]
      }],
      actions: [],
      onEvent: {
        "change": {
          "actions": [
            {
              "actionType": "custom",
              script: function (data: any) {
                setSubForm(data.props.data)
              }
            }
          ]
        }
      }
    }
    return (
      <div>
        {amisRender(schema, {
          scopeRef: (ref: any) => (approveForm.current = ref),
          context: {
            zcApp: zcAppVal,
            zcCompany: zcCompanyVal,
            zcUser: zcUserVal,
            app: initApiStore.getState().initApi,
            ...envVar,
            $$noPer: true,
            $$permissionsData: permStore.getState().permData,
          }
        }, {
          fetcher: service,
          theme: amisEnv.theme
        })}
      </div>
    )
  };
  //通过的附件上传弹窗
  const FileUpload = () => {
    const schema = {
      type: "dialog",
      "title": "附件上传",
      show: true,
      "body": [{
        "type": "input-file",
        "name": "file",
        "label": "",
        "accept": "*",
        "multiple": true,
        "receiver": {
          "method": "post",
          "url": importUrl,
          adaptor: function (payload: any) {
            if(payload?.data?.url){
              setApprovalFile(prevFiles => {
                // 检查是否已存在相同 fileName 的文件
                const isDuplicate = prevFiles.some(item => item.fileName === payload.data.filename);
                if (isDuplicate) {
                  return prevFiles; // 重复则不更新
                }
                return [...prevFiles, { file: payload.data.url, fileName: payload.data.filename }];
              });
            } else {
              setApprovalFile([])
            }
            // setUploadFileUrl(payload.data.url)
            // setUploadFileName(payload.data.filename)
            return {
              ...payload,
              status: payload.code,
              data: {
                "value": payload.data
              }
            };
          }
        },
        "drag": true,
        onEvent: {
          "remove": {
            "actions": [
              {
                "actionType": "custom",
                "script": async function (obj: any, doAction, event) {
                  const files = event.data.name && obj.state.files.filter(i=> i.name != event.data.name)
                  const fileResult = []
                  for(var i=0;i<files?.length;i++){
                    fileResult.push({
                      file: files[i]?.value?.url,
                      fileName: files[i]?.name
                    })
                  }
                  setApprovalFile(fileResult)
                  // setUploadFileUrl('')
                  // setUploadFileName('')
                }
              }
            ]
          }
        }
      }],
      "actions": [
        {
          "type": "button",
          "label": "取消",
          "onEvent": {
            "click": {
              "actions": [
                {
                  "actionType": "custom",
                  "script": async function (obj: any, doAction, event) {
                    await handleUploadCancel()
                  }
                }
              ]
            }
          }
        },
        {
          "type": "button",
          "label": "确认",
          "level": "primary",
          "onEvent": {
            "click": {
              "actions": [
                {
                  "actionType": "custom",
                  "script": async function (data: any, doAction, event) {
                    confirm("如果上传附件，需要附件正常上传完成后再保存，否则附件不能正常保存？", '提示','确认','取消').then(async(res) =>{
                      if(res){
                        setUploadSchema({})
                        await handleUploadOk()
                        doAction({
                          actionType: 'broadcast',
                          "args": {
                            "eventName": "noticeRefresh"
                          },
                        });
                      }
                    })
                  }
                }
              ]
            }
          }
        }
      ],
    }
    setUploadSchema(schema)
  };
  //退回的弹窗
  const ReturnDialog = () => {
    const schema = {
      type: "dialog",
      "title": "退回流程",
      show: true,
      "body": [{
        "name": "radios",
        "type": "radios",
        "label": "",
        "options": returnTaskListVal.current
      }],
      "actions": [
        {
          "type": "button",
          "label": "取消",
          "onEvent": {
            "click": {
              "actions": [
                {
                  "actionType": "custom",
                  "script": async function (obj: any, doAction, event) {
                    await handleReturnCancel()
                  }
                }
              ]
            }
          }
        },
        {
          "type": "button",
          "label": "确认",
          "level": "primary",
          "onEvent": {
            "click": {
              "actions": [
                {
                  "actionType": "custom",
                  "script": async function (data: any, doAction, event) {
                    // setReturnSchema({})
                    await handleReturnOk(event.data.radios)
                    doAction({
                      actionType: 'broadcast',
                      "args": {
                        "eventName": "noticeRefresh"
                      },
                    });
                  }
                }
              ]
            }
          }
        }
      ],
    }
    setReturnSchema(schema)
  }
  return (

      <div style={{ border: '1px solid white' }}>
        <Spin spinning={showLoading}>
          {
            existTaskForm ?
              <div style={{ width: '100%', marginBottom: '20px', border: '1px solid #e4e7ed', padding: '20px' }}>
                <div className="clearfix">
                  <span>填写表单</span>
                </div>
                <div style={{ width: '100%', paddingLeft: '100px' }}>
                  {
                    InputForm()
                  }
                </div>
              </div> : null
          }

          <div style={{ width: '100%', marginBottom: '20px', border: '1px solid #e4e7ed', padding: '20px' }}>
            <div className="clearfix">
              <span>审批流程</span>
            </div>
            <div style={{ width: '100%', paddingLeft: '100px' }}>
              {
                ApproveForm()
              }
            </div>
          </div>
        </Spin>
        <div>
          {amisRender(returnSchema,{}, {
            fetcher: service,
            theme: amisEnv.theme
          })}
        </div>
        <div>
          {amisRender(uploadSchema,{}, {
            fetcher: service,
            theme: amisEnv.theme
          })}
        </div>
      </div>

  )
}
export default TaskHandle;
