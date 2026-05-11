import { confirm, alert, toast } from 'amis';
import FlowRecord from './component/flowRecord'
import TaskHandle from './component/taskHandle'
import PageView from '@/components/PageView'
import BPMNProcessViewer from "@/components/BPMNProcessViewer/index"
import { history } from '@umijs/max';
import { useDevBaseUrl } from "@/utils/util"
import { updateRead } from '@/api/backlogCenter'
import {AMISComponent} from "@/hooks/amis";
let height = document.documentElement.clientHeight - 205 + 'px';
const schema = {
    "type": "page",
    "initApi": {
        "method": "get",
        "url": useDevBaseUrl("/application/processManage/process/detail?procInsId=${procInsId}&taskId=${taskId}&ccIdentification=${ccIdentification}"),
        adaptor: function (payload:any) {
            let historyProcNodeList = payload.data?.historyProcNodeList;
            let xmlData = payload.data?.bpmnXml;
            let finishedInfo = payload.data?.flowViewer;
            let taskFormData = payload.data?.taskFormData;
            let existTaskForm = payload.data?.existTaskForm;
            let envVar = payload.data?.context;
            const params = new URLSearchParams(window.location.search);
            const processed = params.get('processed');
            const showFormInfoFlag = payload.data?.processFormList.length > 0 ? true : false;
            const messageIds = payload.data?.messageIds;
            const todoFlag = payload.data?.todoFlag;
            if(payload.data?.todoFlag == false && messageIds.length > 0){
                updateRead(messageIds)
            }
            if(processed == 'true' && payload.data?.todoFlag == false){
                confirm("该任务已办理", '提示','关闭','').then(async(res) =>{
                    if(res){
                        const param = new URLSearchParams(window.location.search);
                        const appid = param.get('appid');
                        const env = param.get('env');
                        const portalKey = param.get('portalKey')
                        let url = '/app/todoList' + "?appid=" + appid + "&env=" + env + (portalKey ? `&portalKey=${portalKey}` : '')
                        history.push(url)
                    }
                })
            }
            let noApprovalData = false
            if(payload.data?.taskFormData && payload.data?.taskFormData?.dataExists == false){
                toast.error('审批数据不存在', {
                    position: 'top-center'
                });
                noApprovalData = true
            }
            const result = true;
            return {
                ...payload,
                status: payload.code,
                data: {historyProcNodeList:historyProcNodeList, xmlData:xmlData, finishedInfo:finishedInfo, taskFormData:taskFormData, existTaskForm:existTaskForm, envVar:envVar, showFormInfoFlag:showFormInfoFlag, result: result, messageIds: messageIds, todoFlag: todoFlag, noApprovalData: noApprovalData}
            };
        }
    },
    "onEvent": {
        "inited": {
            "actions": [
                {
                    "actionType": "custom",
                    "script": function(_, doAction, event){
                        if(event.data.todoFlag == false && event.data.messageIds.length > 0){
                            doAction({
                                actionType: 'broadcast',
                                "args": {
                                    "eventName": "noticeRefresh"
                                },
                            });
                        }
                    }
                }
            ]
        },
    },
    "initFetchOn": "this.procInsId",
    "body": {
        "type": "page",
        "data": {
            activeKeyOne: 0,
            activeKeyTwo: 1,
        },
        "visibleOn": "${result}",
        "body": {
            "type": "tabs",
            "id": "tabs-change",
            // "unmountOnExit": true,
            "activeKey": "${(processed == 'true' && showFormInfoFlag) ? ${activeKeyOne|toInt} : ${activeKeyTwo|toInt}}",
            "tabs": [
                {
                    "title": "任务办理",
                    "visibleOn": "${processed == 'true'}",
                    "className": "process_detail",
                    "tab": [{
                        "type": "page",
                        "body": [{
                            name: 'formRender',
                            asFormItem: true,
                            "visibleOn": "${taskFormData}",
                            children: ({ value, onChange, data }) => (
                                <TaskHandle taskFormData={data.taskFormData} existTaskForm={data.existTaskForm} envVar={data.envVar} messageIds={data.messageIds} noApprovalData={data.noApprovalData}/>
                            )
                        }]
                    }]
                },
                {
                    "title": "办理时提交数据",
                    "className": "process_detail",
                    "visibleOn": "${showFormInfoFlag}",
                    "tab": [{
                        "type": "page",
                        "body": [{
                            name: 'formRender',
                            asFormItem: true,
                            children: ({ value, onChange, data }) => (
                                <PageView />
                            )
                        }]
                    }]
                },
                {
                    "title": "流转记录",
                    "className": "process_detail",
                    "tab": [{
                        "type": "page",
                        "body": [{
                            name: 'formRender',
                            asFormItem: true,
                            "visibleOn": "${historyProcNodeList}",
                            children: ({ value, onChange, data }) => (
                                <FlowRecord historyProcNodeList={data.historyProcNodeList} />
                            )
                        }]
                    }]
                },
                {
                    "title": "流程跟踪",
                    "className": "process_detail",
                    "tab": [{
                        "type": "page",
                        "body": [{
                            name: 'formRender',
                            // asFormItem: true,
                            "visibleOn": "${xmlData}",
                            children: ({ value, onChange, data }) => (
                                <BPMNProcessViewer height={height} xml={data.xmlData}
                                    finishedInfo={data.finishedInfo} allCommentList={data.historyProcNodeList}/>
                            )
                        }]
                    }]
                },
            ]
        }
    },
}

export default () => <AMISComponent schema={schema} />;
