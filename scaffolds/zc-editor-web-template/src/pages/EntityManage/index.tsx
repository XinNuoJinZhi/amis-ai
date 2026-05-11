import './css.css';
import getAside from './aside';
import getTabs from './tabs';
import bus from '@/utils/bus';
import {registerChatEvent} from '@/utils/chat'
import {useDevBaseUrl} from "@/utils/util";
import getEditDialog from "./tabs/tabs1/modelDesign/AIindex"
import permStore from "@/store/permission";
import {service} from "@/utils/request";
import {render as amisRender, toast} from 'amis';
import React, {useRef, useState} from 'react';
import EntityDiagram from "@/pages/EntityManage/EntityModelDiagram";
import {
    createField,
    editField,
    deleteField,
    createIndex,
    editIndex,
    deleteIndex,
    createRelationship,
    editelationship,
    deleteRelation,
    deleteBaoWRelation,
    deleteWaiRelation,
    deleteBaoMRelation,
    deleteMRelations
} from "@/pages/EntityManage/tabs/tabs1/modelDesign/dialog/field/util";
import * as uuid from 'uuid'
import {AMISComponent} from '@/hooks/amis'
import {env as amisEnv} from '@/hooks/amis';
function getSchema() {
    let dataValue: any = null;
let uuidClassName:any = 'aiModelDesign' + uuid.v4();
    function getModelDesign() {
        console.log('进入')
        return <>
            <div className='qazxsw'>
                {
                    amisRender(
                        {...getEditDialog(), style: {display: "none", zIndex: 1}, className: uuidClassName,},
                          {
                              data: {
                                  $$permissionsData: permStore.getState().permData,
                              }
                          },
                        {
                            fetcher: service,
                            theme: amisEnv.theme
                        }
                    )
                }
            </div>
        </>
    }

    const schema = {
        // 布局
        "type": "page",
        "className": "entityManage",
        "id": "entityManage",
        "data": {
            "ceshi": [],
        },
        "onEvent": {
            "init": {
                "actions": [
                    registerChatEvent(['chat-change'],(val) => {
                        const { busValue, doAction } = val
                        let event = busValue.value
                        console.log(event,'eventeventeventeventevent')
                        console.log(busValue,'busValuebusValuebusValue')
                        if(sessionStorage.getItem('onlineId') != busValue.onlineId) return
                        dataValue = event.response ? event.response : event;
                        console.log(dataValue,'dataValuedataValuedataValue')
                        sessionStorage.setItem('dataValue', JSON.stringify(event))
                        const modelDesign = document.querySelector('.'+uuidClassName)
                        console.log(modelDesign, 'modelDesignmodelDesignmodelDesignmodelDesign')
                        if(document.getElementsByClassName('antd-Drawer')&&
                          document.getElementsByClassName('antd-Drawer').length>0){
                            document.getElementsByClassName('antd-Drawer')[0].style.zIndex = 9999
                        }
                        if (dataValue._action && dataValue._action == 'createTable' && dataValue.metaTable) {
                            console.log('进入生成表覆盖表');
                            if(document.getElementsByClassName('modelDailog').length == 0){
                                doAction({actionType: "reload", componentId: "aiForm"})
                            }else{
                                doAction({actionType: "reload", componentId: "modelDailogForm"})
                            }
                            event.updateAnswerAndStopLoading('已为您创建表。')
                        } else {
                            console.log('进入修改数据')
                            if(dataValue._action == 'createField'){
                                if (dataValue.fields) {
                                    dataValue.fields.forEach(item => {
                                        createField(doAction, {
                                            data: {
                                                ...item,
                                                fieldCode: item.code,
                                                fieldName: item.name,
                                                fieldType: item.type
                                            }
                                        })
                                    })
                                } else {
                                    createField(doAction, {
                                        data: {
                                            ...dataValue,
                                            fieldCode: dataValue.code,
                                            fieldName: dataValue.name,
                                            fieldType: dataValue.type
                                        }
                                    })
                                }
                                event.updateAnswerAndStopLoading('已为您创建字段。')
                            }
                            if(dataValue._action == 'editField'){
                                editField(doAction, {
                                    data: {
                                        ...dataValue,
                                        fieldCode: dataValue.code,
                                        fieldName: dataValue.name,
                                        fieldType: dataValue.type
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您修改字段。')
                            }
                            if(dataValue._action == 'deleteField'){
                                deleteField(doAction, {
                                    data: {
                                        ...dataValue
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您删除字段。')
                            }
                            if(dataValue._action == 'createIndex'){
                                createIndex(doAction, {
                                    data: {
                                        ...dataValue
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您创建索引。')
                            }
                            if(dataValue._action == 'editIndex'){
                                editIndex(doAction, {
                                    data: {
                                        ...dataValue
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您修改索引。')
                            }
                            if(dataValue._action == 'deleteIndex'){
                                deleteIndex(doAction, {
                                    data: {
                                        ...dataValue
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您删除索引。')
                            }
                            if(dataValue._action == 'createRelationship'){
                                createRelationship(doAction, {
                                    data: {
                                        ...dataValue
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您创建关系。')
                            }
                            if(dataValue._action == 'editRelationship'){
                                editelationship(doAction, {
                                    data: {
                                        ...dataValue
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您修改关系。')
                            }
                            if(dataValue._action == 'deleteRelationship'){
                                deleteRelation(doAction, {
                                    data: {
                                        ...dataValue
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您删除关系。')
                            }
                            if(dataValue._action == 'deleteRelationship' &&
                              dataValue.dataType == 'keepForeignKey'){
                                deleteBaoWRelation(doAction, {
                                    data: {
                                        ...dataValue
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您删除关系并且保存外键。')
                            }
                            if(dataValue._action == 'deleteRelationship' &&
                              dataValue.dataType == 'deleteForeignKey'){
                                deleteWaiRelation(doAction, {
                                    data: {
                                        ...dataValue
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您删除关系并且删除外键。')
                            }
                            if(dataValue._action == 'deleteRelationship' &&
                              dataValue.dataType == 'keepMiddleTable'){
                                deleteBaoMRelation(doAction, {
                                    data: {
                                        ...dataValue
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您删除关系并且保留中间表。')
                            }
                            if(dataValue._action == 'deleteRelationship' &&
                              dataValue.dataType == 'deleteMiddleTable'){
                                deleteMRelations(doAction, {
                                    data: {
                                        ...dataValue
                                    }
                                })
                                event.updateAnswerAndStopLoading('已为您删除关系并且删除中间表。')
                            }
                            if(dataValue._action == 'deleteTable'){
                                doAction({
                                    "actionType": "dialog",
                                    dialog:{
                                        title: '是否删除该表',
                                        type: "dialog",
                                        id: "deleteTabless",
                                        body: [
                                            {
                                                "type": "tpl",
                                                "tpl": "<p>是否确认删除该表？</p>",
                                            }
                                        ],
                                        "actions": [
                                            {
                                                "type": "button",
                                                "actionType": "cancel",
                                                "label": "取消",
                                            },
                                            {
                                                "type": "button",
                                                "reload": "none",
                                                "label": "确定",
                                                "primary": true,
                                                "ignoreError": false,
                                                "actionType": "ajax",
                                                api: {
                                                    url: useDevBaseUrl(`/entitymanage/table/removeTableById?tableKey=${dataValue.queryKey}&confirmed=false`),
                                                    method: 'delete'
                                                },
                                                "feedback": {
                                                    "title": "确认",
                                                    "skipRestOnCancel": true,
                                                    "size": "md",
                                                    "body": {
                                                        "type": "form",
                                                        "body": [
                                                            {
                                                                "type": "alert",
                                                                "title": "本次操作将涉及 DB 变更，请确认",
                                                                "body": [{
                                                                    "type": "code",
                                                                    "language": "sql",
                                                                    "value": "${confirmText|raw}"
                                                                }],
                                                                "level": "warning",
                                                                "className": "mb-3"
                                                            }
                                                        ]
                                                    },
                                                    "actions": [
                                                        {
                                                            "type": "button",
                                                            "actionType": "close",
                                                            "label": "取消"
                                                        },
                                                        {
                                                            "type": "button",
                                                            "actionType": "confirm",
                                                            api: {
                                                                url: useDevBaseUrl(`/entitymanage/table/removeTableById?tableKey=${dataValue.queryKey}&confirmed=true`),
                                                                method: "delete",
                                                                adaptor: function (payload: any) {
                                                                    console.log(payload,'payload');
                                                                    if(payload.code == 500){
                                                                        return payload
                                                                    }
                                                                    toast.success('删除成功', {
                                                                        position: 'top-center'
                                                                    });
                                                                    doAction({
                                                                        actionType: "closeDialog",
                                                                        componentId: "deleteTabless",
                                                                    })
                                                                    setTimeout(() => {
                                                                        doAction({
                                                                            "actionType": "reload",
                                                                            componentId: "entityModel"
                                                                        })
                                                                    },500)
                                                                    event.updateAnswerAndStopLoading('已为您删除表。')
                                                                    return payload
                                                                }
                                                            },
                                                            "label": "确认",
                                                            "primary": true
                                                        }
                                                    ]
                                                },
                                            }
                                        ],
                                    },
                                })
                            }
                            if(dataValue._action == 'deleteTables'){
                                console.log(dataValue.tables.map(res=>res.queryKey).join(','),'dataValue.tables.map(res=>res.queryKey).join(\',\')')
                                const params = new URLSearchParams(window.location.search);
                                dataValue.dsKey = params.get('dsKey');
                                dataValue.queryKey = dataValue.tables.map(res=>res.queryKey).join(',');
                                dataValue.code = dataValue.tables.map(res=>res.code).join(',');
                                console.log(dataValue,'dataValuedataValuedataValuedataValue');
                                doAction({
                                    "actionType": "dialog",
                                    dialog:{
                                        title: '是否删除多表',
                                        type: "dialog",
                                        id: "deleteTables",
                                        body: [
                                            {
                                                "type": "tpl",
                                                "tpl": "<p>是否确认删除"+dataValue.code+"表？</p>",
                                            }
                                        ],
                                        "actions": [
                                            {
                                                "type": "button",
                                                "actionType": "cancel",
                                                "label": "取消",
                                            },
                                            {
                                                "type": "button",
                                                "reload": "none",
                                                "label": "确定",
                                                "primary": true,
                                                "ignoreError": false,
                                                "actionType": "ajax",
                                                api: {
                                                    url: useDevBaseUrl(`/entitymanage/table/removeTableBatch?tableKey=${dataValue.queryKey}&dsKey=${dataValue.dsKey}&confirmed=false`),
                                                    method: 'delete'
                                                },
                                                "feedback": {
                                                    "title": "确认",
                                                    "skipRestOnCancel": true,
                                                    "size": "md",
                                                    "body": {
                                                        "type": "form",
                                                        "body": [
                                                            {
                                                                "type": "alert",
                                                                "title": "本次操作将涉及 DB 变更，请确认",
                                                                "body": [{
                                                                    "type": "code",
                                                                    "language": "sql",
                                                                    "value": "${confirmText|raw}"
                                                                }],
                                                                "level": "warning",
                                                                "className": "mb-3"
                                                            }
                                                        ]
                                                    },
                                                    "actions": [
                                                        {
                                                            "type": "button",
                                                            "actionType": "close",
                                                            "label": "取消"
                                                        },
                                                        {
                                                            "type": "button",
                                                            "actionType": "confirm",
                                                            api: {
                                                                url: useDevBaseUrl(`/entitymanage/table/removeTableBatch?tableKey=${dataValue.queryKey}&dsKey=${dataValue.dsKey}&confirmed=true`),
                                                                method: "delete",
                                                                adaptor: function (payload: any) {
                                                                    console.log(payload,'payload');
                                                                    if(payload.code == 500){
                                                                        return payload
                                                                    }
                                                                    doAction({
                                                                        actionType: "closeDialog",
                                                                        componentId: "deleteTables",
                                                                    })
                                                                    toast.success('删除成功', {
                                                                        position: 'top-center'
                                                                    });
                                                                    setTimeout(() => {
                                                                        doAction({
                                                                            "actionType": "reload",
                                                                            componentId: "entityModel"
                                                                        })
                                                                    },500)
                                                                    event.updateAnswerAndStopLoading('已为您删除表。')
                                                                    return payload
                                                                }
                                                            },
                                                            "label": "确认",
                                                            "primary": true
                                                        }
                                                    ]
                                                },
                                            }
                                        ],
                                    },
                                })
                            }
                        }
                        if (document.getElementsByClassName('aiModeDesign').length == 0
                          && document.getElementsByClassName('modelDesign').length == 0
                          && document.getElementsByClassName('modelDailog').length == 0
                          && dataValue._action && dataValue._action == 'createTable' && dataValue.metaTable) {
                            modelDesign?.click()
                        }
                        event.closeDialog()
                    })
                ]
            }
        },
        "aside": getAside(),
        "body": [
            {
                "type": "tabs",
                "hiddenOn": "${IF(dsKey,false,true)}",
                "toolbar": [
                    {
                        "type": "button",
                        "label": "数据字典",
                        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'devApp:dict:query')}",
                        "size": "sm",
                        "onEvent": {
                            "click": {
                                "actions": [
                                ]
                            }
                        },
                        "actionType": "link",
                        "link": "../design/dataDict",
                    }
                ],
                "tabs": getTabs(),
                "onEvent": {
                    "change": {
                        "actions": [
                            {
                                "actionType": "custom",
                                script: function (_: any, doAction: any, event: any) {
                                    console.log(_, '_')
                                    console.log(doAction, 'doAction')
                                    console.log(event, 'event')
                                    if (event.data.value == 3) {
                                        doAction({actionType: "reload", componentId: "logCrud"});
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            getModelDesign()
        ]
    }
    return schema
}

const schema = getSchema()

export default () => <AMISComponent schema={schema} />;
