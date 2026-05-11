import { baseURL, adminApiUrl } from '@/utils/env'

const isGetTenantId = (url: any) => {
    let path = url.split('?')
    let isSet = path[0] == baseURL + adminApiUrl + '/system/tenant/get-id-by-name'
    return isSet
}

const isSetLogin = (url: any) => {
    let isSet = url == baseURL + adminApiUrl + '/system/auth/login'
    return isSet
}

export { isGetTenantId, isSetLogin }
