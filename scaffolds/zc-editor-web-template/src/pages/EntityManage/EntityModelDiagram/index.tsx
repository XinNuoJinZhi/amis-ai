import React, { useState, useEffect, useRef, RefObject } from 'react';
import { observer } from 'mobx-react';
import { service } from '@/utils/request';
import '@antv/x6-react-shape';
import { Graph, } from '@antv/x6';
import { Button, Spin, Tooltip } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { graph } from './graph';
import MyButton from './MyButton';
import { getInitData, keyDialog } from './hooks';
import { render as amisRender } from 'amis';
import { getSchema } from "../index"
import getEditDialog from "../tabs/tabs1/modelDesign"
import { display } from 'html2canvas/dist/types/css/property-descriptors/display';
import permStore from "@/store/permission"
import { history } from '@umijs/max';
import { Icon } from 'amis-ui';
import { useDevBaseUrl } from "@/utils/util"
import {env as amisEnv} from '@/hooks/amis';

export interface EntityDiagramProps {
    dsKey?: string;
}

const EntityDiagram: React.FC<EntityDiagramProps> = observer((props) => {
    const [showKeyDialog, setShowKeyDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newFlag, setNewFlag] = useState(false);
    const [needX, setNeedX] = useState()
    const [needY, setNeedY] = useState()
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [delItem, setDelItem] = useState()
    const [delFlag, setDelFlag] = useState(false);
    const [editFlag, setEditFlag] = useState(false);

    const addNew = async () => {
        setNewFlag(true)
    };
    const entity_diagram_wrap = useRef<HTMLDivElement>(null);
    const miniMap = useRef<HTMLDivElement>(null);
    const [dsName, setDsName] = useState("");
    const [listData, setListData] = useState([]);
    const listDataVal = useRef()
    const [delShow, setDelShow] = useState(true);
    const [addShow, setAddShow] = useState(false);
    const [scaleSize, setScaleSize] = useState(1);
    // const [graphRef, setGraph] = useState<Graph | null>(null);
    const graphRef = useRef<Graph>()
    //初始化
    const getData = async (flag: boolean) => {
        // debugger
        try {
            setLoading(true)
            let res = await getInitData(graphRef.current!, flag)
            setListData(res)
            const dsName = res.length > 0 ? res[0].dsName : ''
            setDsName(dsName);
        } finally {
            setLoading(false)
        }
    };
    useEffect(() => {
        listDataVal.current = listData
    }, [listData])
    useEffect(() => {
        // debugger
        graphRef.current = graph(entity_diagram_wrap, miniMap);
        // 节点的右键菜单
        graphRef.current.on('node:contextmenu', ({ e, x, y, node, view }) => {
            setShowContextMenu(true)
            let windowHeight = document.documentElement.clientHeight
            const p = graphRef.current!.localToPage(x, y)
            p.y = p.y + 90 > windowHeight ? p.y - 80 : p.y
            setNeedX(p.x)
            setNeedY(p.y)
            setDelItem(node.store.data.id)
            let $$permissionsData = permStore.getState().permData
            let filterDel = $$permissionsData.filter(item => item == 'entitymanage:meta-table:delete')
            const delFlag = filterDel.length > 0 ? true : false; //删除
            setDelShow(delFlag)
        })
        graphRef.current.on('scale',({ sx, sy }) => {
            setScaleSize(sx)
        })
        window.addEventListener('resize', handleResize);
        handleResize(); // 初始化宽度
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const handleResize = () => {
        var element = document.getElementById('entityDiagramContainer');
        // 使用children属性获取第一个子元素
        var firstChild = element?.children[0];
        firstChild.style.width = window.innerWidth - 180 - 250 - 48 + 'px'
        firstChild.style.height = window.innerHeight - 191 + 'px'
    }

    // 监听dsKey变化，重新获取数据
    useEffect(() => {
        graphRef.current && getData(true);
        let $$permissionsData = permStore.getState().permData
        let filterAdd = $$permissionsData.filter(item => item == 'entitymanage:meta-table:create')
        const addFlag = filterAdd.length > 0 ? true : false; //删除
        setAddShow(addFlag)
    }, [props.dsKey]);
    const newSchema = {
        "type": "dialog",
        "show": true,
        "title": "新建模型",
        "size": "md",
        "body": {
            "type": "form",
            "preventEnterSubmit": true,
            "api": {
                "method": "post",
                "url": useDevBaseUrl("/entitymanage/table/saveModel"),
                requestAdaptor: function (api:any) {
                    const params = new URLSearchParams(window.location.search);
                    let data = {
                        ...api,
                        data: {
                            dsKey: params.get('dsKey'),
                            tableName: api.body.formName,
                            name: api.body.newModel,
                            primaryKeyMode: api.body.primaryKeyMode,
                            comment: api.body.comment
                        }
                    };
                    return data
                },
                adaptor: function (payload, response, api) {
                    return {
                        ...payload,
                        status: payload.code
                    };
                }
            },
            "body": [
                {
                    "type": "input-text",
                    "name": "newModel",
                    "label": "模型名称",
                    "required": "true",
                    "placeholder": "请填写模型名称",
                    "onEvent": {
                        "change": {
                            "actions": [
                                {
                                    "actionType": "setValue",
                                    "componentId": "formName",
                                    "args": {
                                        "value": "${newModel}"
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "name": "formName",
                    "id": "formName",
                    "type": "input-text",
                    "label": "表名",
                    "desc": "不可修改，请仔细填写，建议只用小写英文和下划线",
                    "placeholder": "请填写表名",
                    "required": "true",
                    "maxLength": 64,
                    "validations": {
                        "matchRegexp": "^[a-zA-Z_][A-Za-z0-9_]*$"
                    },
                    "validationErrors": {
                        "matchRegexp": "请填写规范的表名"
                    }
                },
                {
                    label: '注释',
                    type: 'input-text',
                    mode: 'horizontal',
                    name: 'comment',
                    maxLength: 300,
                    showCounter: true
                },
                {
                    "label": "主键模式",
                    "name": "primaryKeyMode",
                    "type": "button-group-select",
                    "value": "ASSIGN_ID",
                    "options": [
                        {
                            "label": "雪花",
                            "value": "ASSIGN_ID",
                        },
                        {
                            "label": "自增",
                            "value": "AUTO",
                        }
                    ]
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
                "label": "确认",
                "level": "primary",
                "actionType": "confirm",
                "api": {
                    "method": "post",
                    "url": useDevBaseUrl("/entitymanage/table/saveModel"),
                    requestAdaptor: function (api:any) {
                        const params = new URLSearchParams(window.location.search);
                        let data = {
                            ...api,
                            data: {
                                dsKey: params.get('dsKey'),
                                tableName: api.body.formName,
                                name: api.body.newModel,
                                comment: api.body.comment,
                                primaryKeyMode: api.body.primaryKeyMode,
                                confirmed:true
                            }
                        };
                        return data
                    },
                    adaptor: function (payload: any) {
                        setNewFlag(false)
                        getData(false)
                        return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, }
                        };
                    }
                },
                primary: true
            },
        ],
        "onEvent": {
            "cancel": {
                "actions": [{
                    "actionType": "custom",
                    script: function (_, doAction, event) {
                        setNewFlag(false)
                    }
                }]
            }
        }
    }
    const delSchema = {
        "type": "form",
        "initApi": {
            "method": "delete",
            "url": useDevBaseUrl("/entitymanage/table/removeTableById?tableKey=" + delItem)
        },
        "body": {
            "type": "dialog",
            "show": "true",
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
                    "api": {
                        "method": "delete",
                        "url": useDevBaseUrl("/entitymanage/table/removeTableById?tableKey=" + delItem + "&confirmed=true"),
                        adaptor: function (payload: any) {
                            console.log(payload,'payload')
                            if(payload.code != 500){
                                setDelFlag(false)
                                getData(false)
                            }
                            return {
                                ...payload,
                                status: payload.code,
                                data: { ...payload.data, }
                            };
                        }
                    },
                    "label": "确认",
                    "primary": true
                },
            ],
            "onEvent": {
                "cancel": {
                    "actions": [{
                        "actionType": "custom",
                        script: function (_, doAction, event) {
                            setDelFlag(false)
                        }
                    }]
                }
            }
        }
    }
    const deleteTable = (delItem: any) => {
        setDelFlag(true)
    }
    const [editSchema, setEditSchema] = useState<any>(() => {
        const tempEditSchema: any = { ...getEditDialog(), style: { display: "none" }, className: 'modelDesign', }
        console.log(tempEditSchema,'[tempEditSchema')
        tempEditSchema.dialog.actions[1].api.adaptor = function (payload: any) {
        // tempEditSchema.dialog.actions[1].feedback.actions[1].api.adaptor = function (payload: any) {
            getData(false)
            return payload
        }
        return tempEditSchema
    });

    const editTable = () => {
        const modelDesign = document.querySelector(".modelDesign") as HTMLButtonElement
        modelDesign?.click()
    }
    const hideContextMenu = () => {
        setShowContextMenu(false)
    }
    const dataManage = (item: any) => {
        let params = new URLSearchParams(window.location.search);
        const appid = params.get('appid');
        const env = params.get('env');
        const dsKey = params.get('dsKey');
        history.push('/app/design/dataManage?appid=' + appid + '&env=' + env + '&dsKey=' + dsKey + '&queryKey=' + delItem)
    }
    const amisRef = useRef<any>(null);
    return (
        <div>
            <Spin
                indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                spinning={loading}
            >
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', flex: "auto" }}>
                        {addShow && (<Button
                            type="link"
                            icon={<PlusOutlined />}
                            onClick={addNew}
                            className="headerLeft"
                        >
                            新增
                        </Button>)}
                        <MyButton
                            graphRef={graphRef.current!}
                            setShowKeyDialog={setShowKeyDialog}
                            getData={getData}
                            fileName={dsName}
                            scaleSize={scaleSize}
                        ></MyButton>
                    </div>
                    <div style={{ width: '100%', flex: 1,  overflow:"hidden" }} id="entityDiagramContainer" onClick={hideContextMenu}>
                        <div
                            ref={entity_diagram_wrap}
                            style={{
                                height: '73vh',
                                width: '100%',
                                backgroundColor: '#F7F7F9'
                            }}
                        ></div>
                        <div
                            ref={miniMap}
                            style={{ position: 'fixed', bottom: '33px', right: '33px' }}
                        ></div>
                        {showContextMenu && (
                            <div
                                className="box-card"
                                style={{ left: needX + 'px', top: needY + 'px', zIndex: 999 }}
                            >
                                <ul style={{ paddingLeft: 0, margin: 0 }}>
                                    <li
                                        className="text item"
                                        onClick={editTable}
                                    >
                                        <Icon icon="fa fa-edit"
                                            className="icon"
                                            style={{
                                                height: '16px',
                                                width: '16px',
                                                marginRight: '5px',
                                                cursor: 'pointer'
                                            }} />编辑
                                    </li>
                                    {delShow && (<li
                                        className="text item"
                                        onClick={deleteTable}
                                    >
                                        <Icon icon="fa fa-trash"
                                            className="icon"
                                            style={{
                                                height: '16px',
                                                width: '16px',
                                                marginRight: '5px',
                                                cursor: 'pointer'
                                            }} />删除
                                    </li>)}
                                    {/*<li*/}
                                    {/*    className="text item"*/}
                                    {/*    onClick={dataManage}*/}
                                    {/*>*/}
                                    {/*    <Icon icon="fa fa-database"*/}
                                    {/*        className="icon"*/}
                                    {/*        style={{*/}
                                    {/*            height: '16px',*/}
                                    {/*            width: '16px',*/}
                                    {/*            marginRight: '5px',*/}
                                    {/*            cursor: 'pointer'*/}
                                    {/*        }} />*/}
                                    {/*    数据管理*/}
                                    {/*</li>*/}
                                </ul>
                            </div>)
                        }
                        <Tooltip overlayClassName="x6-tooltip" open={true}>
                            <span style={{ position: 'fixed' }} />
                        </Tooltip>
                    </div>
                </div>
                {showKeyDialog ? keyDialog(setShowKeyDialog) : null}
            </Spin>
            {newFlag &&
                amisRender(
                    newSchema,
                    {},
                    {
                        fetcher: service,
                        theme: amisEnv.theme
                    }
                )
            }
            {delFlag &&
                amisRender(
                    delSchema,
                    {},
                    {
                        fetcher: service,
                        theme: amisEnv.theme
                    }
                )
            }
            {
                amisRender(
                    editSchema,
                    {
                        scopeRef: (ref: any) => (amisRef.current = ref),
                        data: {
                            $$permissionsData: permStore.getState().permData,
                            queryKey: delItem
                        }
                    },
                    {
                        fetcher: service,
                        theme: amisEnv.theme
                    }
                )
            }
        </div>
    );
});

export default EntityDiagram;
