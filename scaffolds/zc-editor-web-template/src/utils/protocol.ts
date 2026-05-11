// 1.app://user/source
// 2.app://department/source
// 3.model://${table.dsKey}.${table.key}/treeSelect 一个是树
// 4.model://${table.dsKey}.${table.key} 一个是表格
// 5.model://${table.dsKey}.${table.key} 单条
// 6.app://dictionary/running/list?level=2&encoded=

//流程相关填写页面
//pathname: "/page/pageRestart" 底座-重新发起-发起流程
//pathname: "/page/pageView" 改成 '/page/formInfo'底座-流程详情-表单信息
//pathname: "/page/pageEdit" 底座-流程详情-任务办理
//pathname: "/app/design/create" 编辑端-流程管理-发起流程-发起
//pathname: "/app/flowCenter"  应用端-流程中心-发起
//pathname: "/app/restartProcess" 应用端-待办中心-重新发起
//pathname: "/app/processDetail" 应用端-待办中心-流程详情-表单信息和任务办理
//return /datamanage/from/query/{dataSourceCode}.{tableCode}

import {isEditorialEnd, isAppEnd} from '@/utils/index'
import {useDevBaseUrl, useAdminBaseUrl} from "@/utils/util"
import { mockData } from '@/utils/env'
import dynamicPageStore from "@/store/dynamicPage"

//按页面分，model协议页面管理、动态页面、流程管理相关填写都加判断
export function protocolHandle(url: string, method: string) {
    // console.log('调用后端接口转换前：', method + ' ', url)
    if (url == '' || url == null) {
        return url;
    }
    if(url.indexOf('://') == -1 && !url.startsWith('/api/upload') && !url.startsWith('api:') && !url.startsWith('model:')) {
        if (url.startsWith('/')) {
            return useDevBaseUrl(url)
        } else {
            return useDevBaseUrl('/'+url)
        }
    }
    const dynamicPageVal = dynamicPageStore.getState().dynamicPage
    if (url.startsWith('app://user')) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=app_user')
        } else {
            if (url.indexOf('app://user/source') > -1) {
                let params = url.split('?')[1];
                if (url.indexOf('?') > -1) {
                    return useDevBaseUrl('/system/user/departUser' + '?' + params)
                } else {
                    return useDevBaseUrl('/system/user/departUser')
                }
            } else if (url.indexOf('app://user/search') > -1) {
                let params = url.split('?')[1];
                if (url.indexOf('?') > -1) {
                    return useDevBaseUrl('/system/user/departUserSearch' + '?' + params)
                } else {
                    return useDevBaseUrl('/system/user/departUserSearch')
                }
            } else if (url.indexOf('app://user/defer') > -1) {
                let params = url.split('?')[1];
                if (url.indexOf('?') > -1) {
                    return useDevBaseUrl('/system/user/departUser' + '?' + params)
                } else {
                    return useDevBaseUrl('/system/user/departUser')
                }
            } else if (url.indexOf('app://user/options') > -1) {
                return useDevBaseUrl('/system/user/options')
            }
        }
    } else if (url.startsWith('app://department')) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=app_department')
        } else {
            if (url.indexOf('app://department/source') > -1) {
                return useDevBaseUrl('/system/dept/list-all-simple')
            } else if (url.indexOf('app://department/defer') > -1) {

            } else if (url.indexOf('app://department/options') > -1) {
                return useDevBaseUrl('/system/dept/options')
            }
        }
    } else if (url.startsWith('model://') && url.indexOf('/treeSelect') > -1) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=model_tree')
        } else {
            let pathname = window.location.pathname;
            if (pathname == '/app/design/pageManage' || pathname =='/app/design/pageManage/chart') { //页面管理
                // 'model://Wqqq.allField/treeSelect'
                const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                let params = url.split('?')[1];
                if (method == 'get') {
                    if (url.indexOf('?') > -1) {
                        return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/treeSelect` + '?' + params)
                    } else {
                        return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/treeSelect`)
                    }
                }
            } else if (dynamicPageVal.includes(pathname) && isAppEnd()) {//应用端动态页面
                let params = url.split('?')[1];
                let urlKey = isAppEnd() ? 'application/crud/page' : 'crud/page'
                const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                if (method == 'get') {
                    if (url.indexOf('?') > -1) {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/treeSelect` + '?' + params)
                    } else {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/treeSelect`)
                    }
                }
            } else if (pathname == '/page/pageRestart' || pathname == '/page/pageView' || pathname == '/page/formInfo' || pathname == '/page/pageEdit' || pathname == '/app/flowCenter' || pathname == '/app/design/create' || pathname == '/app/flowCenter' || pathname == '/app/restartProcess' || pathname == '/app/processDetail') {//流程相关
                // 'model://eguzbu2f10jk.a/treeSelect?id='
                let params = url.split('?')[1];
                let urlKey = isAppEnd() ? 'application/crud/form' : 'crud/form'
                const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                if (method == 'get') {
                    if (url.indexOf('?') > -1) {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/treeSelect` + '?' + params)
                    } else {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/treeSelect`)
                    }
                }
            } else if (pathname == '/app/design/pageManage/edit') {
                // 'model://Wqqq.allField/treeSelect'
                let params = url.split('?')[1];
                const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                if (method == 'get') {
                    if (url.indexOf('?') > -1) {
                        return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}/treeSelect` + '?' + params)
                    } else {
                        return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}/treeSelect`)
                    }
                }
            } else {
                // model://d4wujw3isge8.t161/treeSelect
                // model://Wqqq.allField/treeSelect?__fields[0]=id
                let params = url.split('?')[1];
                const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                if (method == 'get') {
                    let urlKey = isAppEnd() ? 'application/crud/model' : 'crud/model'
                    if (url.indexOf('?') > -1) {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/treeSelect` + '?' + params)
                    } else {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/treeSelect`)
                    }
                }
            }
        }
        //api: "post:model://d4dzhnggbl6o.f/truncate" 清空
    } else if (url.startsWith('model://') && url.endsWith('truncate')) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=model_tree')
        } else {
            // 'model://efhpztz3eku8.school/truncate'
            let urlKey = isAppEnd() ? 'application/crud/model' : 'crud/model'
            const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
            const tableName = url.split('//')[1].split('/')[0].split('.')[1]
            if (method == 'delete') {
                return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/truncate`)
            }
        }
        // 导出数据
    } else if (url.startsWith('model://') && url.split('?')[0].endsWith('exportExcelData')) {
        if (mockData == 'true' && method == 'get') {
            return useDevBaseUrl('/infra/config/get-value-by-key?key=model_tree')
        } else {
            //model://d95rh9cpwcg0.user-U:1111/exportExcelData
            let pathname = window.location.pathname;
            const paramsCfg = url.split('?')[1]
            if (pathname == '/app/design/pageManage' || pathname == '/app/design/sheetEditor' || pathname =='/app/design/pageManage/chart') { //页面管理
                // 'model://ecf2yamphaf4.p1-u%3Ae3eab3d6a3d8/exportExcelData'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/export` + (paramsCfg ? '?' + paramsCfg : ''));
                }
            } else if (dynamicPageVal.includes(pathname) && isAppEnd()) { //应用端动态页面
                // 'model://ecf2yamphaf4.p1-u%3Ae3eab3d6a3d8/exportExcelData'
                let urlKey = isAppEnd() ? 'application/crud/page' : 'crud/page'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/export` + (paramsCfg ? '?' + paramsCfg : ''))
                }
            } else if (pathname == '/page/pageRestart' || pathname == '/page/pageView' || pathname == '/page/formInfo' || pathname == '/page/pageEdit' || pathname == '/app/flowCenter' || pathname == '/app/design/create' || pathname == '/app/flowCenter' || pathname == '/app/restartProcess' || pathname == '/app/processDetail') { //流程相关
                let urlKey = isAppEnd() ? 'application/crud/form' : 'crud/form'
                // 'model://ecf2yamphaf4.a-u%3A6c2b5f7e6c7a/exportExcelData'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/export` + (paramsCfg ? '?' + paramsCfg : ''));
                }
            } else if (pathname == '/app/design/pageManage/edit') {
                // 'model://ecf2yamphaf4.a-u%3A6c2b5f7e6c7a/exportExcelData'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}/export` + (paramsCfg ? '?' + paramsCfg : ''));
                }
            } else {
                // 'model://efhpztz3eku8.school/exportExcelData'
                let urlKey = isAppEnd() ? 'application/crud/model' : 'crud/model'
                const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/export` + (paramsCfg ? '?' + paramsCfg : ''));
                }
            }
        }
        //下载Excel模板
    } else if (url.startsWith('model://') && url.endsWith('downloadExcelTemplate')) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=model_tree')
        } else {
            //model://d95rh9cpwcg0.user-u:1111/downloadExcelTemplate 下载Excel模板
            let pathname = window.location.pathname;
            if (pathname == '/app/design/pageManage' || pathname =='/app/design/pageManage/chart') { //页面管理
                // 'model://ecf2yamphaf4.p1-u%3Ae3eab3d6a3d8/downloadExcelTemplate'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/downloadExcelTemplate`);
                }
            } else if (dynamicPageVal.includes(pathname) && isAppEnd()) { //应用端动态页面
                // 'model://ecf2yamphaf4.p1-u%3Ae3eab3d6a3d8/downloadExcelTemplate'
                let urlKey = isAppEnd() ? 'application/crud/page' : 'crud/page'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/downloadExcelTemplate`)
                }
            } else if (pathname == '/page/pageRestart' || pathname == '/page/pageView' || pathname == '/page/formInfo' || pathname == '/page/pageEdit' || pathname == '/app/flowCenter' || pathname == '/app/design/create' || pathname == '/app/flowCenter' || pathname == '/app/restartProcess' || pathname == '/app/processDetail') { //流程相关
                let urlKey = isAppEnd() ? 'application/crud/form' : 'crud/form'
                // 'model://ecf2yamphaf4.a-u%3A6c2b5f7e6c7a/downloadExcelTemplate'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/downloadExcelTemplate`)
                }
            } else if (pathname == '/app/design/pageManage/edit') {
                // 'model://ecf2yamphaf4.a-u%3A6c2b5f7e6c7a/downloadExcelTemplate'
                // 'model://ecf2yamphaf4.a-u%3A6c2b5f7e6c7a/downloadExcelTemplate'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}/downloadExcelTemplate`)
                }
            } else {
                // 'model://efhpztz3eku8.school/downloadExcelTemplate'
                let urlKey = isAppEnd() ? 'application/crud/model' : 'crud/model'
                const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/downloadExcelTemplate`)
                }
            }
        }
        //上传Excel
    } else if (url.startsWith('model://') && url.endsWith('uploadExcelData')) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=model_tree')
        } else {
            //model://d95rh9cpwcg0.user-u:1111/uploadExcelData 上传EXCEL
            let pathname = window.location.pathname;
            if (pathname == '/app/design/pageManage' || pathname =='/app/design/pageManage/chart') { //页面管理
                // 'model://ecf2yamphaf4.p1-u%3Ae3eab3d6a3d8/uploadExcelData'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/uploadExcelData`)
                }
            } else if (dynamicPageVal.includes(pathname) && isAppEnd()) { //应用端动态页面
                // 'model://ecf2yamphaf4.p1-u%3Ae3eab3d6a3d8/uploadExcelData'
                let urlKey = isAppEnd() ? 'application/crud/page' : 'crud/page'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/uploadExcelData`)
                }
            } else if (pathname == '/page/pageRestart' || pathname == '/page/pageView' || pathname == '/page/formInfo' || pathname == '/page/pageEdit' || pathname == '/app/flowCenter' || pathname == '/app/design/create' || pathname == '/app/flowCenter' || pathname == '/app/restartProcess' || pathname == '/app/processDetail') { //流程相关
                let urlKey = isAppEnd() ? 'application/crud/form' : 'crud/form'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/uploadExcelData`)
                }
            } else if (pathname == '/app/design/pageManage/edit') {
                // 'model://ecf2yamphaf4.a-u%3A6c2b5f7e6c7a/uploadExcelData'
                const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}/uploadExcelData`)
                }
            } else {
                // 'model://efhpztz3eku8.school/uploadExcelData'
                let urlKey = isAppEnd() ? 'application/crud/model' : 'crud/model'
                const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                if (method == 'post') {
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/uploadExcelData`)
                }
            }
        }
    } else if (url.startsWith('model:') && url.split('?')[0].split('//')[1].indexOf('/') == -1) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=model_table')
        } else {
            let pathname = window.location.pathname;
            const paramsStr = url.split(':')[1].split('//')[0];
            const searchParams = new URLSearchParams(paramsStr);
            const appid = searchParams.get('appid');
            const tenantId = searchParams.get('tenantId');
            if (pathname == '/app/design/pageManage' || pathname =='/app/design/pageManage/chart') { //页面管理
                //新增
                if (method == 'post') {
                    // 'model://ecf2yamphaf4.p1-u%3A0554a11df878'
                    const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                    return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/save`)
                } else if (method == 'get') {
                     //列表 'model://ecf2yamphaf4.p1-u%3A0554a11df878?__fields[0]=id&__fields[1]=f&__fields[2]=b&orderBy=id&orderDir=asc&page=1&perPage=10'
                    const params = url.split("?")[1]
                    const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                    if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                        return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/query?` + params, appid, tenantId, false)
                    } else {
                        return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/query?` + params)
                    }
                }
            } else if (dynamicPageVal.includes(pathname) && isAppEnd()) { //应用端动态页面
                //新增
                let urlKey = isAppEnd() ? 'application/crud/page' : 'crud/page'
                if (method == 'post') {
                    //'model://ecf2yamphaf4.p1-u%3Ae3eab3d6a3d8'
                    const dsCode = url.split('//')[1].split("-")[0].split('.')[0]
                    const tableName = url.split('//')[1].split("-")[0].split('.')[1]
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/save`)
                    //获取列表
                } else if (method == 'get') {
                    //'model://ecf2yamphaf4.p1-u%3Ae3eab3d6a3d8?__fields[0]=id&__fields[1]=f&__fields[2]=b&orderBy=id&orderDir=asc&page=1&perPage=10'
                    const dsCode = url.split('//')[1].split("-")[0].split('.')[0]
                    const tableName = url.split('//')[1].split("-")[0].split('.')[1]
                    const params = url.split('?')[1]
                    if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/query?`+params, appid, tenantId, false)
                    } else {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/query?`+params)
                    }
                }
            } else if (pathname == '/page/pageRestart' || pathname == '/page/pageView' || pathname == '/page/formInfo' || pathname == '/page/pageEdit' || pathname == '/app/flowCenter' || pathname == '/app/design/create' || pathname == '/app/flowCenter' || pathname == '/app/restartProcess' || pathname == '/app/processDetail') { //流程相关
                //新增
                let urlKey = isAppEnd() ? 'application/crud/form' : 'crud/form'
                if (method == 'post') {
                    // 'model://eguzbu2f10jk.c'
                    const dsCode = url.split("//")[1].split('.')[0]
                    const tableName = url.split("//")[1].split('.')[1]
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/save`)
                    //获取列表
                } else if (method == 'get') {
                    // 'model://eguzbu2f10jk.c?__fields[0]=id&__fields[1]=c1&__fields[2]=c2&orderBy=id&orderDir=asc&page=1&perPage=10'
                    const dsCode = url.split('?')[0].split("//")[1].split('.')[0]
                    const tableName = url.split('?')[0].split("//")[1].split('.')[1]
                    const params = url.split('?')[1]
                    if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/query?` + params, appid, tenantId, false)
                    } else {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/query?` + params)
                    }
                }
            } else if (pathname == '/app/design/pageManage/edit' || pathname == '/app/design/formManage/form/edit') {
                let tableKeyVal = url.split('//')[1].split('-')[0];
                let params = url.split('?')[1]
                //新增
                if (url.indexOf('?') == -1) {
                    // 'model://ecf2yamphaf4.a-u%3A4f03d895f64f'
                    const dsCode = url.split("//")[1].split("-")[0].split('.')[0]
                    const tableName = url.split("//")[1].split("-")[0].split('.')[1]
                    return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}/save`)
                    //获取列表
                } else if (method == 'get') {
                    // 'model://ecf2yamphaf4.a-u%3A0bd34542460b?__fields[0]=id&__fields[1]=a1&__fields[2]=aaaaa&orderBy=id&orderDir=asc&$$id=81712312cc24&page=1&perPage=10'
                    const dsCode = url.split('?')[0].split("//")[1].split("-")[0].split('.')[0]
                    const tableName = url.split('?')[0].split("//")[1].split("-")[0].split('.')[1]
                    const params = url.split('?')[1]
                    if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                        return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}/query?` + params, appid, tenantId, false)
                    } else {
                        return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}/query?` + params)
                    }
                }
            } else {
                let urlKey = isAppEnd() ? 'application/crud/model' : 'crud/model'
                //新增
                if (url.indexOf('?') == -1) {
                    const dsCode = url.split("//")[1].split('.')[0]
                    const tableName = url.split("//")[1].split('.')[1]
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/save`)
                    //获取列表
                } else if (method == 'get') {
                    const dsCode = url.split('?')[0].split("//")[1].split('.')[0]
                    const tableName = url.split('?')[0].split("//")[1].split('.')[1]
                    const params = url.split('?')[1]
                    if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/query?`+params, appid, tenantId, false)
                    } else {
                        return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/query?`+params)
                    }
                }
            }
        }
        // model://moreone.class/options?__fields[0]=name&__fields[1]=id&term=${term}
    } else if (url.startsWith('model://') && url.split('?')[0].split('//')[1].indexOf('/options') > -1) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=model_option')
        } else {
            let pathname = window.location.pathname;
            if (pathname == '/app/design/pageManage' || pathname =='/app/design/pageManage/chart') { //页面管理
                //'model://outer.class/options?__fields[0]=name&term='
                //'model://eguzbu2f10jk.b-u%3Aaa5d838b772d/options?__fields[0]=a&__fields[1]=id&term='
                const params = url.split('?')[1];
                let dsCode = ''
                if (url.split('?')[0].split("//")[1].indexOf('-') > -1) {
                    dsCode = url.split('?')[0].split("//")[1].split("-")[0].split('.')[0]
                } else {
                    dsCode = url.split('?')[0].split("//")[1].split("/")[0].split('.')[0]
                }
                let tableName = ''
                if (url.split('?')[0].split("//")[1].indexOf('-') > -1) {
                    tableName = url.split('?')[0].split("//")[1].split("-")[0].split('.')[1]
                } else {
                    tableName = url.split('?')[0].split("//")[1].split("/")[0].split('.')[1]
                }
                return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}` + '/options?' + params)
            } else if (dynamicPageVal.includes(pathname) && isAppEnd()) { //应用端动态页面
                //'model://outer.class/options?__fields[0]=name&term='
                //'model://eguzbu2f10jk.b-u%3Aaa5d838b772d/options?__fields[0]=a&__fields[1]=id&term='
                const params = url.split('?')[1];
                let dsCode = ''
                if (url.split('?')[0].split("//")[1].indexOf('-') > -1) {
                    dsCode = url.split('?')[0].split("//")[1].split("-")[0].split('.')[0]
                } else {
                    dsCode = url.split('?')[0].split("//")[1].split("/")[0].split('.')[0]
                }
                let tableName = ''
                if (url.split('?')[0].split("//")[1].indexOf('-') > -1) {
                    tableName = url.split('?')[0].split("//")[1].split("-")[0].split('.')[1]
                } else {
                    tableName = url.split('?')[0].split("//")[1].split("/")[0].split('.')[1]
                }
                let urlKey = isAppEnd() ? 'application/crud/page' : 'crud/page'
                return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}` + '/options?' + params)
            } else if (pathname == '/page/pageRestart' || pathname == '/page/pageView' || pathname == '/page/formInfo' || pathname == '/page/formInfo' || pathname == '/page/pageEdit' || pathname == '/app/flowCenter' || pathname == '/app/design/create' || pathname == '/app/flowCenter' || pathname == '/app/restartProcess' || pathname == '/app/processDetail') { //流程相关
                // 'model://eguzbu2f10jk.b/options?__fields[0]=a&term='
                const dsCode = url.split('?')[0].split("//")[1].split("/")[0].split('.')[0]
                const tableName = url.split('?')[0].split("//")[1].split("/")[0].split('.')[1]
                let params = url.split('?')[1];
                let urlKey = isAppEnd() ? 'application/crud/form' : 'crud/form'
                return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}` + '/options?' + params);
            } else if (pathname == '/app/design/pageManage/edit') {
                //'model://eguzbu2f10jk.b-u%3Aaa5d838b772d/options?__fields[0]=a&__fields[1]=id&term='
                let params = url.split('?')[1]
                let dsCode = ''
                if (url.split('?')[0].split("//")[1].indexOf('-') > -1) {
                    dsCode = url.split('?')[0].split("//")[1].split("-")[0].split('.')[0]
                } else {
                    dsCode = url.split('?')[0].split("//")[1].split("/")[0].split('.')[0]
                }
                let tableName = ''
                if (url.split('?')[0].split("//")[1].indexOf('-') > -1) {
                    tableName = url.split('?')[0].split("//")[1].split("-")[0].split('.')[1]
                } else {
                    tableName = url.split('?')[0].split("//")[1].split("/")[0].split('.')[1]
                }
                return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}` + '/options?' + params);
            } else {
                //'model://eguzbu2f10jk.b/options?__fields[0]=a&term='
                let params = url.split('?')[1];
                let urlKey = isAppEnd() ? 'application/crud/model' : 'crud/model'
                const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}` + '/options?' + params);
            }
        }
    } else if (url.startsWith('model://') && url.split('//')[1].indexOf('/') > -1 && url.indexOf('/formExport/') == -1 && url.indexOf('/downloadFormTemplate') == -1 && url.indexOf('/printExportData') == -1) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=model_item')
        } else {
            let pathname = window.location.pathname;
            if (pathname == '/app/design/pageManage' || pathname =='/app/design/pageManage/chart') { //页面管理
                //删除
                if (method == 'delete') {
                    // 'model://ecf2yamphaf4.p1-u%3A0554a11df878/1904780184680947714'
                    const id = url.split('//')[1].split('/')[1];
                    const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                    return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/deleteById/` + id)
                    //点击编辑获取详情
                } else if (method == 'get') {
                    // 'model://ecf2yamphaf4.p1-u%3A0554a11df878/1904744388649312258?__fields[0]=f&__fields[1]=b'
                    const param = url.split('?')[1]
                    const id = url.split('//')[1].split('/')[1].split('?')[0];
                    const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                    return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/getInfoById/` + id + '?' + param)
                    //编辑窗口点击确定
                } else if (method == 'post') {
                    // 'model://ecf2yamphaf4.p1-u%3A0554a11df878/1904744388649312258'
                    const id = url.split('//')[1].split('/')[1];
                    const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                    return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/update/` + id)
                }
            } else if (dynamicPageVal.includes(pathname) && isAppEnd()) { //应用端动态页面
                //删除
                let urlKey = isAppEnd() ? 'application/crud/page' : 'crud/page'
                if (method == 'delete') {
                    // 'model://ecf2yamphaf4.p1-u%3Ae3eab3d6a3d8/1904744388649312258'
                    const id = url.split('//')[1].split('/')[1];
                    const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/deleteById/` + id)
                    //点击编辑获取详情
                } else if (method == 'get') {
                    // 'model://ecf2yamphaf4.p1-u%3Ae3eab3d6a3d8/1904744388649312258?__fields[0]=f&__fields[1]=b'
                    const id = url.split('//')[1].split('?')[0].split('/')[1];
                    const param = url.split('?')[1]
                    const dsCode = url.split('//')[1].split('/')[0].split('-')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('/')[0].split('-')[0].split('.')[1]
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/getInfoById/` + id + '?' + param)
                    //编辑窗口点击确定
                } else if (method == 'post') {
                    // 'model://ecf2yamphaf4.p1-u%3Ae3eab3d6a3d8/1904744388649312258'
                    const id = url.split('//')[1].split('/')[1]
                    const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/update/` + id)
                }
            } else if (pathname == '/page/pageRestart' || pathname == '/page/pageView' || pathname == '/page/formInfo' || pathname == '/page/pageEdit' || pathname == '/app/flowCenter' || pathname == '/app/design/create' || pathname == '/app/flowCenter' || pathname == '/app/restartProcess' || pathname == '/app/processDetail') {
                let urlKey = isAppEnd() ? 'application/crud/form' : 'crud/form'
                //删除
                if (method == 'delete') {
                    // 'model://eguzbu2f10jk.c/1905068470561722370'
                    const id = url.split('//')[1].split('/')[1];
                    const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/deleteById/` + id)
                    //点击编辑获取详情
                } else if (method == 'get') {
                    // 'model://eguzbu2f10jk.c/1905061155418722306?__fields[0]=c1&__fields[1]=c2'
                    const id = url.split('//')[1].split('/')[1].split('?')[0];
                    const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                    const param = url.split('?')[1]
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/getInfoById/` + id + '?' + param)
                    //编辑窗口点击确定
                } else if (method == 'post') {
                    //'model://eguzbu2f10jk.c/1905061155418722306'
                    const id = url.split('//')[1].split('/')[1];
                    const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/update/` + id)
                }
            } else if (pathname == '/app/design/pageManage/edit') {
                //删除
                if (method == 'delete') {
                    // 'model://ecf2yamphaf4.a-u%3Adc121bf03486/1899665260166369282'
                    const id = url.split('//')[1].split('/')[1];
                    const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                    return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}/deleteById/` + id)
                    //点击编辑获取详情
                } else if (method == 'get') {
                    // 'model://ecf2yamphaf4.a-u%3Adc121bf03486/1899665260166369282?__fields[0]=a1&__fields[1]=aaaaa'
                    const id = url.split('?')[0].split('//')[1].split('/')[1];
                    const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                    const param = url.split('?')[1]
                    return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}/getInfoById/`+ id + '?' + param)
                    //编辑窗口点击确定
                } else if (method == 'post') {
                    // 'model://ecf2yamphaf4.a-u%3Adc121bf03486/1899665260166369282'
                    const id = url.split('//')[1].split('/')[1];
                    const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
                    const tableName = url.split('//')[1].split('-')[0].split('.')[1]
                    return useDevBaseUrl(`/crud/model/${dsCode}/${tableName}/update/` + id)
                }
            } else {
                let id = url.split('//')[1].split('/')[1];
                let urlKey = isAppEnd() ? 'application/crud/model' : 'crud/model'
                const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
                const tableName = url.split('//')[1].split('/')[0].split('.')[1]
                //删除
                if (method == 'delete') {
                    // 'model://ecf2yamphaf4.p1/1904743740490932225'
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/deleteById/` + id)
                    //点击编辑获取详情
                } else if (method == 'get') {
                    // 'model://ecf2yamphaf4.p1/1904740704464953346?__fields[0]=f&__fields[1]=b'
                    const id = url.split('//')[1].split('?')[0].split('/')[1];
                    const param = url.split('?')[1]
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/getInfoById/` + id + '?' + param)
                    //编辑窗口点击确定
                } else if (method == 'post') {
                    // 'model://ecf2yamphaf4.p1/1904740704464953346'
                    return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/update/` + id)
                }
            }
        }
    } else if (url.startsWith('model://') && url.indexOf('downloadFormTemplate') > -1) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=model_item')
        } else {
            // model://dynamicForm.parts-u%3Ada9d540b5761/downloadFormTemplate
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('ref');
            const dataSourceCode = url.split('-')[0]?.split('//')[1]?.split('.')[0];
            const tableName = url.split('-')[0]?.split('//')[1]?.split('.')[1];
            const parmas = url.indexOf('?') > -1 ? '?' + url.split('?')[1] : ''
            if(ref?.indexOf('app/design/pageManage/edit') > -1) {
                return useDevBaseUrl(`/crud/model/${dataSourceCode}/${tableName}/downloadFormTemplate` + parmas)
            } else if(ref?.indexOf('/app/design/') > -1) {
                return useDevBaseUrl(`/crud/page/${dataSourceCode}/${tableName}/downloadFormTemplate` + parmas)
            } else {
                return useDevBaseUrl(`/crud/page/${dataSourceCode}/${tableName}/downloadFormTemplate` + parmas)
            }
        }
    } else if (url.startsWith('model://') && url.indexOf('/formExport/') > -1) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=model_item')
        } else {
            // model://dynamicForm.parts-u%3Ada9d540b5761/formExport/${id}
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('ref');
            const dataSourceCode = url.split('-')[0]?.split('//')[1]?.split('.')[0];
            const tableName = url.split('-')[0]?.split('//')[1]?.split('.')[1];
            const key = url.split('-')[1]?.split('/')[2]
            if(ref?.indexOf('app/design/pageManage/edit') > -1) {
                return useDevBaseUrl(`/crud/model/${dataSourceCode}/${tableName}/formExport` + '/' + key)
            } else if(ref?.indexOf('/app/design/') > -1) {
                return useDevBaseUrl(`/crud/page/${dataSourceCode}/${tableName}/formExport` + '/' + key)
            } else {
                return useDevBaseUrl(`/crud/page/${dataSourceCode}/${tableName}/formExport` + '/' + key)
            }
            
        }
    } else if (url.startsWith('model://') && url.indexOf('/printExportData')) {
        if (mockData == 'true' && method == 'get') {
            return useAdminBaseUrl('/infra/config/get-value-by-key?key=model_item')
        } else {
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('ref');
            const dataSourceCode = url.split('-')[0]?.split('//')[1]?.split('.')[0];
            const tableName = url.split('-')[0]?.split('//')[1]?.split('.')[1];
            const parmas = url.indexOf('?') > -1 ? '?' + url.split('?')[1] : ''
            if(ref?.indexOf('app/design/pageManage/edit') > -1) {
                return useDevBaseUrl(`/crud/model/${dataSourceCode}/${tableName}/printExport` + parmas)
            } else if(ref?.indexOf('app/design') > -1) {
                return useDevBaseUrl(`/crud/page/${dataSourceCode}/${tableName}/printExport` + parmas)
            } else {
                return useDevBaseUrl(`/crud/page/${dataSourceCode}/${tableName}/printExport` + parmas)
            }
        }
    } else if (url.startsWith('app://dictionary')) {
        //app://dictionary/running/list?level=2&encoded=
        //todo: 先用? 分割，取后面。 level=2&encoded=dd 找一个公共方法，把encoded 取回来
        //后端根据dictType查对应字典，先查应用级，再查组织级。（如果应用级有就不用查组织级的了）要区分应用和环境。
        let search = url.split('?')[1];
        let params = new URLSearchParams(search);
        let encoded = params.get('encoded');
        return useDevBaseUrl('/app/dict-data/list-all?dictType=' + encoded)
    } else if (url.startsWith('object-upload')) {
        //object-upload://default  上传附件
        let params = url.split('//')[1];
        return useDevBaseUrl('/app/file/upload/' + params)
    } else if (url.startsWith('api:')) {
        let paramsVal = url.split('//')[1];
        let pathname = window.location.pathname;
        // 'api:appid=3333&tenantId=5555//def/eoil12p8m8e8'
        const paramsStr = url.split(':')[1].split('//')[0];
        const searchParams = new URLSearchParams(paramsStr);
        const appid = searchParams.get('appid');
        const tenantId = searchParams.get('tenantId');

        // 临时测试：使用 /api/page/{pageCode}/execute/{dsCode}/{tableCode} 格式
        // pageCode 从 URL 参数获取，appid 和 env 也从 URL 参数获取
        const urlParams = new URLSearchParams(window.location.search);
        const pageCode = urlParams.get('pageCode') || 'f5cqkkzw7e9s'; // 临时默认值
        const appidParam = urlParams.get('appid') || 'eziexztefvnk'; // 临时默认值
        const envParam = urlParams.get('env') || '1'; // 临时默认值

        // 构建新格式 URL: /api/page/{pageCode}/execute/{dsCode}/{tableCode}?pageCode=xxx&appid=xxx&env=xxx
        const hasQuery = paramsVal.indexOf('?') > -1;
        const separator = hasQuery ? '&' : '?';
        const extraParams = `pageCode=${pageCode}&appid=${appidParam}&env=${envParam}`;

        //api://def/en4fy48hx9mo?year=&term=&userName=schools
        if (pathname == '/app/design/pageManage' || pathname =='/app/design/pageManage/chart') {
            //api://def/en4fy48hx9mo?year=&term=&userName=schools
            if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                return useDevBaseUrl(`/api/execute/` + paramsVal + separator + extraParams, appid, tenantId, false)
            } else {
                return useDevBaseUrl(`/api/execute/` + paramsVal + separator + extraParams)
            }
        } else if (dynamicPageVal.includes(pathname) && isAppEnd()) {
            let urlKey = isAppEnd() ? 'application/api' : 'api'
            if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                return useDevBaseUrl(`/${urlKey}/execute/` + paramsVal + separator + extraParams, appid, tenantId, false)
            } else {
                return useDevBaseUrl(`/${urlKey}/execute/` + paramsVal + separator + extraParams)
            }
        } else if (pathname == '/app/design/pageManage/edit') {
            //'api://ei6md5m8y8ld'
            let paramsCfg = ''
            if (paramsVal.indexOf('?') > -1) {
                paramsCfg = paramsVal + '&preview=true'
            } else {
                paramsCfg = paramsVal + '?preview=true'
            }
            if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                return useDevBaseUrl(`/api/execute/` + paramsCfg + '&' + extraParams, appid, tenantId, false)
            } else {
                return useDevBaseUrl(`/api/execute/` + paramsCfg + '&' + extraParams)
            }
        } else {
            let urlKey = isAppEnd() ? 'application/api' : 'api'
            if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                return useDevBaseUrl(`/${urlKey}/execute/` + paramsVal + separator + extraParams, appid, tenantId, false)
            } else {
                return useDevBaseUrl(`/${urlKey}/execute/` + paramsVal + separator + extraParams)
            }
        }
    } else if (url.startsWith('flow://getProcessFormByDefinitionExtId')) {
        let params = url.split('id=')[1];
        let urlKey = isAppEnd() ? 'application/processManage' : 'processManage'
        return useDevBaseUrl(`/${urlKey}/process/getProcessFormByDefinitionExtId?id=` + params)
    } else if (url.startsWith('flow://getProcessForm')) {
        let urlKey = isAppEnd() ? 'application/processManage' : 'processManage'
        return useDevBaseUrl(`/${urlKey}/process/getProcessForm?definitionId=${definitionId}&deployId=${deploymentId}`)
    } else if (url.startsWith('flow://launchProcessButtonData')) {
        let urlKey = isAppEnd() ? 'application/processManage' : 'processManage'
        return useDevBaseUrl(`/${urlKey}/process/launchProcessButtonData`)
    } else if (url.startsWith('flow://checkLatestVersionByDefinitionKey')) {
        let params = url.split('key=')[1];
        let urlKey = isAppEnd() ? 'application/processManage' : 'processManage'
        return useDevBaseUrl(`/${urlKey}/process/checkLatestVersionByDefinitionKey?processKey=` + params)
    } else if (url.startsWith('flow://startByProcessKey')) {
        let urlKey = isAppEnd() ? 'application/processManage' : 'processManage'
        return useDevBaseUrl(`/${urlKey}/process/startByProcessKey`)
    } else if (url.startsWith('/api/upload/file')) {
        return useDevBaseUrl(`/app/file/upload/default`)
    } else if (url.startsWith('/api/upload')) {
        return useDevBaseUrl(`/app/file/upload/default`)
    } else if (url.startsWith("jsonql:")) {
        const paramsStr = url.split(':')[1].split('//')[0];
        const searchParams = new URLSearchParams(paramsStr);
        const appid = searchParams.get('appid');
        const tenantId = searchParams.get('tenantId');
        let pathname = window.location.pathname;
        if (pathname == '/app/design/pageManage' || pathname =='/app/design/pageManage/chart') {
            if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                return useDevBaseUrl('/datamanage/page/diagram/jsonSql', appid, tenantId, false)
            } else {
                return useDevBaseUrl('/datamanage/page/diagram/jsonSql')
            }
        } else if (dynamicPageVal.includes(pathname) && isAppEnd()) {
            if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                return useDevBaseUrl('/application/datamanage/page/diagram/jsonSql', appid, tenantId, false)
            } else {
                return useDevBaseUrl('/application/datamanage/page/diagram/jsonSql')
            }
        }  else if (pathname == '/page/pageRestart' || pathname == '/page/pageView' || pathname == '/page/formInfo' || pathname == '/page/pageEdit' || pathname == '/app/flowCenter' || pathname == '/app/design/create' || pathname == '/app/flowCenter' || pathname == '/app/restartProcess' || pathname == '/app/processDetail') { //流程相关
            let urlKey = isAppEnd() ? '/application/datamanage/form/diagram/jsonSql' : '/datamanage/diagram/form/jsonSql'
            if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                return useDevBaseUrl(urlKey, appid, tenantId, false)
            } else {
                return useDevBaseUrl(urlKey)
            }
        } else if (pathname == '/app/design/pageManage/edit') {
            if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                return useDevBaseUrl('/datamanage/model/diagram/jsonSql', appid, tenantId, false)
            } else {
                return useDevBaseUrl('/datamanage/model/diagram/jsonSql')
            }
        } else {
            let urlKey = isAppEnd() ? '/application/datamanage/model/diagram/jsonSql' : '/datamanage/model/diagram/jsonSql'
            if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
                return useDevBaseUrl(urlKey, appid, tenantId, false)
            } else {
                return useDevBaseUrl(urlKey)
            }
        }
    } else if (url.startsWith('form://processManage/form/getByCode')) {
        const code = url.split('//')[1].split('/')[3]
        return useDevBaseUrl(`/processManage/form/getByCode?code=` + code)
    } else if (url.startsWith('data://')) {
        const url_path = url.split('//')[1]
        return useDevBaseUrl(`/${url_path}`)
    } else if (url.startsWith('pay://')) {
        const url_path = url.split('//')[1]
        return useDevBaseUrl(`/pay/${url_path}`)
    }
    // console.log('调用后端接口转换后：', method + ' ', url)
    // return encodeURI(url);
    return url;
}
