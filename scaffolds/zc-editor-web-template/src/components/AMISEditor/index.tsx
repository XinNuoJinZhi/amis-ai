import React, {useState, useEffect, useRef} from 'react';
import {Editor, ShortcutKey, setThemeConfig, registerEditorPlugin} from 'amis-editor';
import {antdData} from 'amis-theme-editor-helper';
import {Icon, Drawer} from 'amis-ui';
import {Select, toast} from 'amis'
import {DSLBuilder} from 'amis-editor-core'
import {openSocket} from "@/utils/webSocket"
// import 'amis/lib/themes/default.css';
import 'amis-editor-core/lib/style.css';
import './components/style.scss';
import initApiStore from "@/store/initApi"
import permStore from '@/store/permission';
import {
    savePageManage,
    getPageManageContent,
    getPageOption,
    getHistoryData,
    getEnableVersion,
    getCompareData,
    savePageApiPer
} from "@/api/editor"

import {observer} from "mobx-react"
import {useStore} from "@/store/editor"
import {render as amisRender} from 'amis';
import {service} from "@/utils/request"
import {TreeSelect, Modal, Divider, Space, Button} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import {getOpenTabIcon, isEqualObject} from '@/utils/util'
import { history } from '@umijs/max';
import IConSelect from "@/components/IconSelect"
import {useDevBaseUrl, useAdminBaseUrl} from "@/utils/util"
import {registerFunction} from 'amis-formula';
import allUserStore from "@/store/allUser"
import allDeptStore from "@/store/allDept"
import {registerGetUserInfo, registerGetDepInfo, registerGetUserInfoByUserSelect} from "@/utils/util"
import {toPascalCase} from '@/utils';
import { protocolHandle } from "@/utils/protocol"
import {setStorePermData} from '@/store/permission';
import bus from '@/utils/bus';
import {ManagerMobilePlugin, ManagerPersonalComputerPlugin} from './plugin';
import {evalJS} from "amis-core";
import {advancedFeature,baseURL,devApiUrl, adminApiUrl, sheetEditorPath, testMode, basePath} from '@/utils/env'

// 设置主题配置
setThemeConfig(antdData);

// 注册移动端组件限制
const locationParams = new URLSearchParams(window.location.search);
if (locationParams.get('appEnd')) {
    registerEditorPlugin(ManagerMobilePlugin)
} else {
    registerEditorPlugin(ManagerPersonalComputerPlugin)
}

let iframeUrl = '/amis-editor-mobile/editor.html';
const BASE_PATH = basePath;

const urlConfig = {
    baseUrl: baseURL,
    devApiUrl,
    adminApiUrl
}
const AMISEditor: React.FC = observer(() => {
    const {EditorStore} = useStore();
    const editorRef = useRef()
    // console.log(14, editorRef?.current)
    // console.log(15, editorRef?.current?.canUndo())
    // console.log(16, EditorStore.getType)
    const params = new URLSearchParams(window.location.search);
    const queryKey = params.get('queryKey');
    const amisEnv = {
        fetcher: service,
        pdfjsWorkerSrc: `${BASE_PATH}pdf.worker.mjs`,
        notify(type: string, msg: string, conf: any) {
            // console.log(`${type}-------${msg}`)
            if (!preview) return // 编辑模式不弹出提示
            if (msg == "Cannot read properties of undefined (reading 'data')") return
            if (msg == "您暂无权限进行此操作") return
            if (msg.includes('没有查询表单分组列表权限')) return
            (toast as any)[type](msg, conf)
        },
    }
    const EditorType = {
        EDITOR: 'editor',
        MOBILE: 'mobile',
    };
    const schemaVal = {
        type: 'page',
        title: 'Simple Form Page',
        regions: ['body'],
        body: []
    };
    const schemas = [
        {
            type: 'object',
            properties: {
                'zcUser': {
                    type: 'object',
                    title: '当前登录用户信息',
                    properties: {
                        id: {
                            type: 'string',
                            title: '用户ID'
                        },
                        name: {
                            type: 'string',
                            title: '用户名'
                        },
                        nickName: {
                            type: 'string',
                            title: '昵称'
                        },
                        appRoleCodes: {
                            type: 'array',
                            title: '应用角色编码'
                        },
                        phone: {
                            type: 'string',
                            title: '手机号'
                        },
                        email: {
                            type: 'string',
                            title: '邮箱'
                        },
                        avatar: {
                            type: 'string',
                            title: '头像'
                        },
                        department: {
                            type: 'string',
                            title: '部门名称'
                        },
                        departmentId: {
                            type: 'string',
                            title: '部门ID'
                        },
                        departmentCode: {
                            type: 'string',
                            title: '部门编号'
                        },
                        departmentPath: {
                            type: 'string',
                            title: '部门路径'
                        },
                        tenantCode: {
                            type: 'string',
                            title: '租户编码'
                        },
                        tenantName: {
                            type: 'string',
                            title: '租户名称'
                        },
                        displayName: {
                            type: 'string',
                            title: '显示名称'
                        },
                        abbreviation: {
                            type: 'string',
                            title: '简称'
                        },
                        shortName: {
                            type: 'string',
                            title: '短名字'
                        }
                    }
                },
                'zcApp': {
                    type: 'object',
                    title: '当前应用信息',
                    properties: {
                        id: {
                            type: 'string',
                            title: '应用ID'
                        },
                        name: {
                            type: 'string',
                            title: '应用名称'
                        },
                        logo: {
                            type: 'string',
                            title: '应用Logo'
                        },
                        portals: {
                            type: 'array',
                            title: '应用门户'
                        },
                        portalId: {
                            type: 'string',
                            title: '当前门户ID'
                        },
                        env: {
                            type: 'string',
                            title: '当前运行环境'
                        },
                    }
                },
                'zcCompany': {
                    type: 'object',
                    title: '应用所属组织信息',
                    properties: {
                        id: {
                            type: 'string',
                            title: '组织ID'
                        },
                        name: {
                            type: 'string',
                            title: '组织名称'
                        },
                        logo: {
                            type: 'string',
                            title: '组织Logo'
                        },
                        key: {
                            type: 'string',
                            title: '组织标识'
                        }
                    }
                },
                'window:location': {
                    type: 'object',
                    title: '浏览器',
                    properties: {
                        href: {
                            type: 'string',
                            title: 'href'
                        },
                        origin: {
                            type: 'string',
                            title: 'origin'
                        },
                        protocol: {
                            type: 'string',
                            title: 'protocol'
                        },
                        host: {
                            type: 'string',
                            title: 'host'
                        },
                        hostname: {
                            type: 'string',
                            title: 'hostname'
                        },
                        port: {
                            type: 'string',
                            title: 'port'
                        },
                        pathname: {
                            type: 'string',
                            title: 'pathname'
                        },
                        search: {
                            type: 'string',
                            title: 'search'
                        },
                        hash: {
                            type: 'string',
                            title: 'hash'
                        }
                    }
                }
            }
        },
        {
            type: 'object',
            properties: {
                __query: {
                    title: '页面入参',
                    type: 'object',
                    required: [],
                    properties: {
                        name: {
                            type: 'string',
                            title: '用户名'
                        }
                    }
                },
                __page: {
                    title: '页面变量',
                    type: 'object',
                    required: [],
                    properties: {
                        num: {
                            type: 'number',
                            title: '数量'
                        }
                    }
                }
            }
        }
    ];
    const getSchema = () => {
        const lsSchema = EditorStore.getSchema;
        if (lsSchema) {
            return lsSchema;
        }
        return schemaVal;
    };

    const [schema, setSchema] = useState(EditorStore.getSchema || schemaVal)
    const [type, setType] = useState(EditorStore.getType || EditorType.EDITOR)
    const [preview, setPreview] = useState(EditorStore.getPreview ? true : false)
    const [id, setId] = useState();
    const [saveBtnStatus, setSaveBtnStatus] = useState(true); //初始进入，不可以点击保存
    //为了保存按钮状态跟踪，当点击保存后，存一版old数据，当schema变化时，和old数据进行比对
    const [oldSchema, setOldSchema] = useState({});
    //当schema 变化没有保存时，点击返回，给出提示
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInfo, setModalInfo] = useState('');
    //当schema 变化没有保存时，点击切换页面，给出提示
    const [isModalShow, setIsModalShow] = useState(false);
    const [modalPageInfo, setModalPageInfo] = useState('');
    const [selectVal, setSelectVal] = useState('');
    //pc模式还是H5模式
    //环境变量
    const [envVar, setEnvVar] = useState({});
    //内存变量
    const [appVar, setAppVar] = useState({});
    const [zcAppVal, setZCAppVal] = useState({});
    const [zcCompanyVal, setZCCompanyVal] = useState({});
    const [zcUserVal, setZCUserVal] = useState({});
    //权限数据
    const [permData, setPermData] = useState([])
    //导出按钮loading
    const [exportLoading, setExportLoading] = useState(false);
    //导入按钮loading
    const [importLoading, setImportLoading] = useState(false);
    const [variables, setVariables] = useState();
    //是否是点击左上角的<
    const [isClickBack, setIsClickBack] = useState(false);

    const [pageCode, setPageCode] = useState('');
    const [exportDisable, setExportDisable] = useState(false);

    const handleTypeChange = (editorType: any) => {
        const type = editorType || EditorType.EDITOR;
        EditorStore.setType(type);
        setType(type)
        let schema = getSchema()
        setSchema(schema)
    };
    //内容变化时调用（增加或减少组件配置）
    const handleChange = (value: any) => {
        EditorStore.setSchema(value);
        setSchema(value);
    };

    // 导入
    const onImport = () =>{
        try {
            setImportLoading(true)
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';

            fileInput.addEventListener('change', function(event: any) {
                const file = event.target.files[0];

                if (file) {
                    const reader = new FileReader();

                    reader.onload = function(e: any) {
                        const jsonData = JSON.parse(e.target.result);
                        console.log(jsonData,'jsonData')
                        setOldSchema(jsonData)
                        setSchema(jsonData)
                    };

                    reader.readAsText(file);
                }
            });

            fileInput.click();
        } finally {
            setImportLoading(false)
        }
    }
    const getGlobalEventList = (schema: any, globalList: any) => {
        let schemaVal = JSON.stringify(schema)
        console.log(schemaVal,'schemaVal')
        function findUniqueNames(data: any, str: string) {
            const foundNames = new Set();

            for (const item of data) {
                const name = new URLSearchParams(window.location.search).get('appid') + '_' + item.name;
                const regex = new RegExp(name, "g");

                if (regex.test(str)) {
                    foundNames.add(item.name);
                }
            }

            return Array.from(foundNames).join(",");
        }

        return findUniqueNames(globalList, schemaVal)
    }
    // 导出
    const onExport = async () => {
        try {
            setExportLoading(true)
            const apiQueryKey = []
            let params1 = {
                'id': id,
                type: 'page', ...schema,
            }
            const data = {
                'id': id,
                type: 'page', ...schema,
            };
            let globalList = (window as any).editorStore.globalEvents
            if(globalList && globalList.length > 0){
                params1.globalEvent = getGlobalEventList(schema,globalList);
                data.globalEvent = getGlobalEventList(schema,globalList);
            }
            const fileContent = JSON.stringify(data, null, 2);

            // 创建一个Blob对象，这里我们指定MIME类型为'text/plain'
            const blob = new Blob([fileContent], { type: 'application/json' });

            // 创建一个临时的<a>元素用于下载
            const a = document.createElement('a');

            // 创建一个指向Blob对象的URL
            const url = URL.createObjectURL(blob);

            // 设置<a>元素的href属性为生成的URL，并设置下载的文件名
            a.href = url;
            a.download = (pageCode ? toPascalCase(`page-${pageCode}-schema`) : 'PageDownloadedSchema') + '.json'
            // 'downloadedFile.json'; // 设置下载的文件名

            // 将<a>元素添加到文档中（这一步不是必需的，只是为了演示）
            document.body.appendChild(a);

            // 模拟点击事件来触发下载
            a.click();

            // 下载完成后，释放URL对象（这一步很重要，以避免内存泄漏）
            URL.revokeObjectURL(url);
        } finally {
            setExportLoading(false)
        }
    };
    const isMobile = type === EditorType.MOBILE;

    const undo = () => {
        (editorRef?.current as any)?.undo()
    }

    const redo = () => {
        (editorRef?.current as any)?.redo()
    }
    //编辑还是预览按钮操作
    const handlePreviewChange = (preview: any) => {
        EditorStore.setPreview(preview ? 'true' : '')
        setPreview(!!preview)
    };
    const togglePreview = () => {
        handlePreviewChange(!preview);
    };

    const getBackData = async () => {
        let url = window.location.href;
        url = decodeURI(url);
        var arr1 = url.split("?");
        var obj: any = {}
        if (arr1.length > 1) {
            var arr2 = arr1[1].split("&");
            for (var i = 0; i < arr2.length; i++) {
                var curArr = arr2[i].split("=");
                obj[curArr[0]] = decodeURIComponent(curArr[1])
            }
        }
        if (obj.appEnd) {
            handleTypeChange('mobile')
        }
        const queryKey = obj.queryKey;
        let appId = obj.appid;
        let envId = obj.env;
        let params1 = {
            'appid': appId,
            'env': envId,
            'queryKey': queryKey,
        }
        let res = await getPageManageContent(params1)
        if (res.data.code != 0) {
            toast.error(res.data.msg, {
                position: 'top-right'
            });
            return
        }
        setPageCode(res?.data?.data?.pageCode)
        let envVar = res?.data?.data?.context?.envVar
        //处理内存变量
        let memoryVar = res?.data?.data?.context?.appVariables
        disposeVariable(envVar, memoryVar)
        let zcApp = res?.data?.data?.context?.zcApp;
        let zcCompany = res?.data?.data?.context?.zcCompany;
        let zcUser = res?.data?.data?.context?.zcUser;
        // let witeFlagVal = res?.data?.data?.acl?.includes('write');
        // setWriteFlag(witeFlagVal)
        let envVarObj: any = {};
        for (var i = 0; i < envVar?.length; i++) {
            envVarObj[envVar[i].key] = envVar[i].value;
        }
        let appVarObj: any = {}
        for (var i = 0; i < memoryVar?.length; i++) {
            let val = memoryVar[i].value
            if (typeof memoryVar[i].value === 'string') {
                const evalResult = evalJS(memoryVar[i].value, {
                    zcApp: zcApp,
                    zcCompany: zcCompany,
                    zcUser: zcUser,
                });
                // 兼容旧结构 (memoryVar[i].type) 和新结构 (memoryVar[i].variableSchema.type)
                const variableType = memoryVar[i].variableSchema?.type || memoryVar[i].type;
                const matchType = variableType === 'integer' ? typeof evalResult === 'number' : typeof evalResult === variableType;
                val = (variableType && matchType) ? evalResult : memoryVar[i].value;
            }
            appVarObj[memoryVar[i].key] = val
        }
        setAppVar(appVarObj)
        setEnvVar(envVarObj)
        setZCAppVal(zcApp)
        setZCCompanyVal(zcCompany)
        setZCUserVal(zcUser)
        let id = res.data.data.id;
        setId(id);
        document.title = res.data.data.pageName
        getOpenTabIcon()
    }
    const dealData = (data: any) => {
        for (var i = 0; i < data.length; i++) {
            if (data[i].children) {
                data[i] = {...data[i], disabled: true, title: data[i].label, value: data[i].queryKey}
                dealData(data[i].children)
            } else {
                if (data[i].pageType === '3' || data[i].pageType === '2') {
                    data[i] = {...data[i], disabled: true, title: data[i].label, value: data[i].queryKey}
                } else {
                    data[i] = {...data[i], disabled: false, title: data[i].label, value: data[i].queryKey}
                }
            }
        }
        return data;
    }
    const onBack = () => {
        setIsClickBack(true)
        //当schema 变化，没有保存时，点击返回，给一个确认提示框
        if (saveBtnStatus == false) {
            setIsModalOpen(true)
            let url = '/app/design/pageManage' + window.location.search;
            setModalInfo('新的修改没有保存，确认要前往:' + url)
        } else {
            setIsModalOpen(false)
            let params = new URLSearchParams(window.location.search);
            const appid = params.get('appid');
            const env = params.get('env');
            const pageCode = params.get('pageCode');
            let url = '/app/design/pageManage?pageCode=' + pageCode + '&appid=' + appid + '&env=' + env;
            // window.close();
            history.push(url)
            location.reload()
        }
        // let url = window.location.protocol+window.location.host + '/app/design/pageManage' + window.location.search;
        // window.close();
        // window.location.href=url;
    }
    const handleOk = () => {
        let url = '/app/design/pageManage' + window.location.search;
        // window.close();
        history.push(url)
        location.reload()
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const handlePageOk = async () => {
        const params = new URLSearchParams(window.location.search);
        const appid = params.get('appid');
        const env = params.get('env');
        const portalKey = params.get('portalKey')
        let params1 = {
            'appid': appid,
            'env': env,
            'queryKey': selectVal,
        }
        let res = await getPageManageContent(params1);
        //改变选项的话，地址栏的queryKey 也需改变
        let pageName = res?.data?.data.pageName;
        let pageCode = res?.data?.data.pageCode;
        let url = '?appid=' + appid + "&env=" + env + "&queryKey=" + selectVal + (portalKey ? `&portalKey=${portalKey}` : '') + '&pageCode=' + pageCode + (res.data.data.pageTerminal == 1 ? "&pcEnd=true" : "&appEnd=true");
        window.location.href = url;
        setIsModalShow(false);
    };

    const handlePageCancel = () => {
        setIsModalShow(false);
    };

    // 处理环境变量数据
    const disposeVariable = (envList: any, memoryList: any) => {
        let vList: any = []

        if (envList.length) {
            let vData: any = {}
            let schema = {
                name: '',
                title: '环境变量',
                parentId: 'root',
                order: 1,
                schema: {
                    type: 'object',
                    properties: {}
                }
            }

            let properties: any = {}

            for (let i in envList) {
                let title = envList[i].key;
                let value = envList[i].value;
                properties[title] = {
                    type: 'string',
                    title: title
                }
                vData[title] = value
            }

            schema.schema.properties = properties
            vList.push(schema)
        }

        if (memoryList?.length) {
            let vData: any = {}
            let schema = {
                name: 'appVariables',
                title: '内存变量',
                parentId: 'root',
                order: 1,
                schema: {
                    type: 'object',
                    properties: {}
                }
            }

            let properties: any = {}

            for (let i in memoryList) {
                let title = memoryList[i].key;
                let value = memoryList[i].value;
                properties[title] = memoryList[i].variableSchema
                vData[title] = value
            }

            schema.schema.properties = properties
            vList.push(schema)
        }

        setVariables(vList)
    }

    //获取权限数据
    const getPermissionCfg = async () => {
        const params = new URLSearchParams(window.location.search);
        const pageCode = params.get('pageCode');
        let permissionRes = await service({
            url: useDevBaseUrl('/app/permission/getCustomizePermissionsByPageCode?pageCode=' + pageCode),
            method: 'get',
        })
        let data = permissionRes.data.data.customizeAcl
        setPermData(data)
    }
    //获取功能权限数据
    const getPermiDatafg = async () => {
        let permissionRes = await service({
            url: useDevBaseUrl('/app/permission/getPermissionsOwnedByLoginUser'),
            method: 'get',
        })
        let data = permissionRes.data.data.permissions
        setStorePermData(data)
        const initApi = permissionRes?.data?.data?.initApi?.url
        const timeout = permissionRes?.timeout
        const method = permissionRes?.data?.data?.initApi?.method
        if (initApi && method) {
            const url = protocolHandle(initApi, method)
            let initData = await service({
                url: url,
                method: method?.toLowerCase(),
                config: {
                    timeout: timeout ? timeout * 1000 : 60000,
                },
            })
            initApiStore.dispatch({type: "set", payload: initData?.data?.data});
        }
    }
    useEffect(() => {
        const fetchData = async () => {
            setExportDisable(true)

            openSocket();
            // 先调用自定义权限接口
            await getPermissionCfg();
            // 再调用功能权限接口
            await getPermiDatafg();

            await getBackData();

            // 获取所用用户的数据
            const getAllUser = async () => {
                const res = await service({
                    url: useDevBaseUrl('/system/user/allList'),
                    method: 'get',
                });
                for (let i = 0; i < res.data.data.length; i++) {
                    delete res.data.data[i].remark;
                    delete res.data.data[i].sex;
                    delete res.data.data[i].postIds;
                    delete res.data.data[i].status;
                    delete res.data.data[i].registerStatus;
                    delete res.data.data[i].loginIp;
                    delete res.data.data[i].loginDate;
                    delete res.data.data[i].createTime;
                    delete res.data.data[i].supervisor;
                    delete res.data.data[i]?.dept;
                }
                allUserStore.dispatch({type: "set", payload: res.data.data});
            };
            await getAllUser();

            // 获取所用用户的数据
            const getAllDept = async () => {
                const res = await service({
                    url: useDevBaseUrl('/system/dept/all_list'),
                    method: 'get',
                });
                for (let i = 0; i < res.data.data.length; i++) {
                    delete res.data.data[i].sort;
                    delete res.data.data[i].phone;
                    delete res.data.data[i].email;
                    delete res.data.data[i].status;
                    delete res.data.data[i].createTime;
                    delete res.data.data[i].children;
                }
                allDeptStore.dispatch({type: "set", payload: res.data.data});
            };
            await getAllDept();

            // 注册三个函数，从 store 里找对应的数据
            registerFunction('GetUserInfo', (userId, field) => {
                return registerGetUserInfo(userId, field);
            });
            registerFunction('GetDepInfo', (id) => {
                return registerGetDepInfo(id);
            });
            registerFunction('GetUserInfoByUserSelect', (result, field) => {
                return registerGetUserInfoByUserSelect(result, field);
            });

            setExportDisable(false)
        };

        fetchData();
        }, []);

    useEffect(() => {
        const monitorChat = () => {
            const chatChangeHandler = (val: any) => {
                if (sessionStorage.getItem('onlineId') !== val.onlineId) return
                const {response, updateAnswerAndStopLoading, closeDialog} = val.value;
                console.log(response, 'response');
                const dslBuilder = new DSLBuilder({
                    fetcher: service,
                    origin: `${baseURL}/dev-api/`
                })
                // 判断response是否为JSON字符串，如果是则转换为对象，如果不是则直接使用
                let processedResponse;
                try {
                    processedResponse = JSON.parse(response);
                } catch (error) {
                    processedResponse = response;
                }

                // setSchema(JSON.parse(response))
                dslBuilder.convertDSLToSchema(processedResponse).then(buildSchema => {
                    (editorRef?.current as any)?.manager?.addElem(buildSchema);
                    updateAnswerAndStopLoading && updateAnswerAndStopLoading('已为您生成')
                    closeDialog && closeDialog()
                });
            };

            const chatBeforeRequestHandler = (val: any) => {
                if (sessionStorage.getItem('onlineId') !== val.onlineId) return
                const {addRequestParams} = val.value;

                // 使用最新值而不是闭包中的值
                addRequestParams && addRequestParams({
                    schema: schema
                })
            };

            // 注册事件监听器
            bus.on('chat-change', chatChangeHandler);
            bus.on('chat-beforeRequest', chatBeforeRequestHandler);

            // 返回清理函数
            return () => {
                bus.off('chat-change', chatChangeHandler);
                bus.off('chat-beforeRequest', chatBeforeRequestHandler);
            };
        };

        return monitorChat(); // 返回清理函数
    }, [schema]);

    useEffect(() => {
        // if (editorRef?.current?.canUndo() == false && editorRef?.current?.canRedo() == false) {
        //     setSaveBtnStatus(true)
        // } else {
        let result = isEqualObject(oldSchema, schema);
        if (result) {
            setSaveBtnStatus(true)
        } else {
            setSaveBtnStatus(false)
        }
        // }
    }, [schema])

    window.onbeforeunload = function () {
        //isClickBack为true时，代表点击左上角的<,不需弹出浏览器的信息
        if (!saveBtnStatus && !isClickBack) {
            return '未保存更改';
        }
    }

    return (
        <>
            <div>
                {
                    <div className="EditorDemo">
                        <div id="headerBar" className="EditorHeader">
                            <div className="EditorTitle">
                                <div className="EditorBack">
                                    <Icon icon="back" onClick={onBack}/>
                                </div>
                                <div className="page_title_text">
                                </div>
                            </div>
                            <div className="Editor_header_actions">
                                {!preview &&
                                    <div className="header_quick_actions">
                                        <div
                                            className="shortcut_icon_btn spacing"
                                            editor-tooltip="撤回"
                                            tooltip-position="bottom"
                                        >
                                            <Icon icon={(editorRef?.current as any)?.canUndo() ? 'Withdraw-can' : 'withdraw'}
                                                onClick={undo}/>
                                        </div>
                                        <div
                                            className="shortcut_icon_btn spacing"
                                            editor-tooltip="还原"
                                            tooltip-position="bottom"
                                        >
                                            <Icon icon={(editorRef?.current as any)?.canRedo() ? 'restore-can' : 'restore'}
                                                onClick={redo}/>
                                        </div>
                                        <ShortcutKey/>
                                    </div>
                                }
                                <div
                                    className={preview ? `header_action_btn primary` : 'header_action_btn'}
                                    onClick={togglePreview}
                                >
                                    {preview ? '编辑' : '预览'}
                                </div>
                                <Button
                                  onClick={onImport}
                                  className={'header_action_btn'}
                                  // className={saveBtnStatus ? 'header_action_btn  save_button_disabled' : `header_action_btn`}
                                  loading={importLoading}
                                >
                                    导入
                                </Button>
                                <Button
                                  onClick={onExport}
                                  // className={'header_action_btn'}
                                  className={exportDisable ? 'header_action_btn  save_button_disabled' : `header_action_btn`}
                                  loading={exportLoading}
                                >
                                    导出
                                </Button>
                            </div>
                        </div>
                        <div className="EditorInner">
                            <Editor
                                ref={editorRef}
                                isMobile={isMobile}
                                onExport={onExport}
                                className="is-fixed"
                                theme={'antd'}
                                preview={preview}
                                showCustomRenderersPanel={true}
                                onChange={handleChange}
                                onPreview={handlePreviewChange}
                                value={schema}
                                schemas={schemas}
                                variables={variables}
                                iframeUrl={iframeUrl}
                                // $schemaUrl={schemaUrl}
                                ctx={
                                    {
                                        zcApp: zcAppVal,
                                        zcCompany: zcCompanyVal,
                                        zcUser: zcUserVal,
                                        ...envVar,
                                        appVariables: appVar,
                                        app: initApiStore.getState().initApi,
                                        $$noPer: false,
                                        $$permissionsData: permStore.getState().permData,
                                        $$testMode: testMode
                                    }
                                }
                                amisEnv={
                                    amisEnv
                                }
                                serveBaseUrl={baseURL}
                                urlConfig={urlConfig}
                                sheetEditorPath={sheetEditorPath}
                                ctmPermissionList={permData}
                                advancedFeature={advancedFeature}
                                testMode={testMode}
                            />
                        </div>
                    </div>
                }
                <Modal title="提示" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} okText="确认"
                       cancelText="取消">
                    <p>{modalInfo}</p>
                </Modal>
                <Modal title="提示" open={isModalShow} onOk={handlePageOk} onCancel={handlePageCancel} okText="确认"
                       cancelText="取消">
                    <p>{modalPageInfo}</p>
                </Modal>
            </div>
        </>
    )
})

export default AMISEditor;

