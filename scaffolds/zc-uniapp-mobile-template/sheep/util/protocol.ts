
import { useDevBaseUrl } from "@/sheep/util/auth"

//page协议index
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
    if (url.startsWith('app://user')) {
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
    } else if (url.startsWith('app://department')) {
        if (url.indexOf('app://department/source') > -1) {
            return useDevBaseUrl('/system/dept/list-all-simple')
        } else if (url.indexOf('app://department/defer') > -1) {

        } else if (url.indexOf('app://department/options') > -1) {
            return useDevBaseUrl('/system/dept/options')
        }
    } else if (url.startsWith('model://') && url.indexOf('/treeSelect') > -1) {
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
    //api: "post:model://d4dzhnggbl6o.f/truncate" 清空
    } else if (url.startsWith('model://') && url.endsWith('truncate')) {
        // 'model://efhpztz3eku8.school/truncate'
        let urlKey = isAppEnd() ? 'application/crud/model' : 'crud/model'
        const dsCode = url.split('//')[1].split('/')[0].split('.')[0]
        const tableName = url.split('//')[1].split('/')[0].split('.')[1]
        if (method == 'delete') {
            return useDevBaseUrl(`/${urlKey}/${dsCode}/${tableName}/truncate`)
        }
    // 导出数据
    } else if (url.startsWith('model://') && url.split('?')[0].endsWith('exportExcelData')) {
        //model://d95rh9cpwcg0.user-U:1111/exportExcelData
        const paramsCfg = url.split('?')[1]
        const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
        const tableName = url.split('//')[1].split('-')[0].split('.')[1]
        if (method == 'post') {
            return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/export` + (paramsCfg ? '?' + paramsCfg : ''));
        }
    //下载Excel模板
    } else if (url.startsWith('model://') && url.endsWith('downloadExcelTemplate')) {
        //model://d95rh9cpwcg0.user-u:1111/downloadExcelTemplate 下载Excel模板
        const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
        const tableName = url.split('//')[1].split('-')[0].split('.')[1]
        if (method == 'post') {
            return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/downloadExcelTemplate`);
        }
    //上传Excel
    } else if (url.startsWith('model://') && url.endsWith('uploadExcelData')) {
        //model://d95rh9cpwcg0.user-u:1111/uploadExcelData 上传EXCEL
        const dsCode = url.split('//')[1].split('-')[0].split('.')[0]
        const tableName = url.split('//')[1].split('-')[0].split('.')[1]
        if (method == 'post') {
            return useDevBaseUrl(`/crud/page/${dsCode}/${tableName}/uploadExcelData`)
        }
    } else if (url.startsWith('model:') && url.split('?')[0].split('//')[1].indexOf('/') == -1) {
        const paramsStr = url.split(':')[1].split('//')[0];
        const searchParams = new URLSearchParams(paramsStr);
        const appid = searchParams.get('appid');
        const tenantId = searchParams.get('tenantId');
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
    // model://moreone.class/options?__fields[0]=name&__fields[1]=id&term=${term}
    } else if (url.startsWith('model://') && url.split('?')[0].split('//')[1].indexOf('/options') > -1) {
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
    } else if (url.startsWith('model://') && url.split('//')[1].indexOf('/') > -1 && url.indexOf('/formExport/') == -1 && url.indexOf('/downloadFormTemplate') == -1 && url.indexOf('/printExportData') == -1) {
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
    } else if (url.startsWith('model://') && url.indexOf('downloadFormTemplate') > -1) {
        // model://dynamicForm.parts-u%3Ada9d540b5761/downloadFormTemplate
        const dataSourceCode = url.split('-')[0]?.split('//')[1]?.split('.')[0];
        const tableName = url.split('-')[0]?.split('//')[1]?.split('.')[1];
        const parmas = url.indexOf('?') > -1 ? '?' + url.split('?')[1] : ''
        return useDevBaseUrl(`/crud/page/${dataSourceCode}/${tableName}/downloadFormTemplate` + parmas)
    } else if (url.startsWith('model://') && url.indexOf('/formExport/') > -1) {
        // model://dynamicForm.parts-u%3Ada9d540b5761/formExport/${id}
        const dataSourceCode = url.split('-')[0]?.split('//')[1]?.split('.')[0];
        const tableName = url.split('-')[0]?.split('//')[1]?.split('.')[1];
        const key = url.split('-')[1]?.split('/')[2]
        return useDevBaseUrl(`/crud/page/${dataSourceCode}/${tableName}/formExport` + '/' + key)
    } else if (url.startsWith('model://') && url.indexOf('/printExportData')) {
        const dataSourceCode = url.split('-')[0]?.split('//')[1]?.split('.')[0];
        const tableName = url.split('-')[0]?.split('//')[1]?.split('.')[1];
        const parmas = url.indexOf('?') > -1 ? '?' + url.split('?')[1] : ''
        return useDevBaseUrl(`/crud/page/${dataSourceCode}/${tableName}/printExport` + parmas)
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
        // 'api:appid=3333&tenantId=5555//def/eoil12p8m8e8'
        const paramsStr = url.split(':')[1].split('//')[0];
        const searchParams = new URLSearchParams(paramsStr);
        const appid = searchParams.get('appid');
        const tenantId = searchParams.get('tenantId');
        //api://def/en4fy48hx9mo?year=&term=&userName=schools
        if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
            return useDevBaseUrl(`/api/execute/` + paramsVal, appid, tenantId, false)
        } else {
            return useDevBaseUrl(`/api/execute/` + paramsVal)
        }
    } else if (url.startsWith('flow://getProcessFormByDefinitionExtId')) {
        let params = url.split('id=')[1];
        let urlKey = true ? 'application/processManage' : 'processManage'
        return useDevBaseUrl(`/${urlKey}/process/getProcessFormByDefinitionExtId?id=` + params)
    } else if (url.startsWith('flow://getProcessForm')) {
        let urlKey = true ? 'application/processManage' : 'processManage'
        return useDevBaseUrl(`/${urlKey}/process/getProcessForm?definitionId=${definitionId}&deployId=${deploymentId}`)
    } else if (url.startsWith('flow://launchProcessButtonData')) {
        let urlKey = true ? 'application/processManage' : 'processManage'
        return useDevBaseUrl(`/${urlKey}/process/launchProcessButtonData`)
    } else if (url.startsWith('flow://checkLatestVersionByDefinitionKey')) {
        let params = url.split('key=')[1];
        let urlKey = true ? 'application/processManage' : 'processManage'
        return useDevBaseUrl(`/${urlKey}/process/checkLatestVersionByDefinitionKey?processKey=` + params)
    } else if (url.startsWith('flow://startByProcessKey')) {
        let urlKey = true ? 'application/processManage' : 'processManage'
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
        if (url.indexOf('appid') > -1 && url.indexOf('tenantId') > -1) {
            return useDevBaseUrl('/datamanage/page/diagram/jsonSql', appid, tenantId, false)
        } else {
            return useDevBaseUrl('/datamanage/page/diagram/jsonSql')
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
    return url;
}
