import {service} from '@/utils/request';
import {useAdminBaseUrl} from '@/utils/util';

export interface ConfigVO {
  id: number | undefined;
  category: string;
  name: string;
  key: string;
  value: string;
  type: number;
  visible: boolean;
  remark: string;
  createTime: Date;
}

export interface ConfigPageReqVO {
  name?: string;
  key?: string;
  type?: number;
  createTime?: Date[];
}

export interface ConfigExportReqVO {
  name?: string;
  key?: string;
  type?: number;
  createTime?: Date[];
}

// 查询参数列表
export const getConfigPageApi = (params: ConfigPageReqVO) => {
  return service({url: useAdminBaseUrl('/infra/config/page'), data: params, method: 'get'});
};

// 查询参数列表
export const getConfigListApi = () => {
  return service({url: useAdminBaseUrl('/infra/config/list'), method: 'get'});
};

// 查询参数详情
export const getConfigApi = (id: number) => {
  return service({url: useAdminBaseUrl('/infra/config/get?id=' + id), method: 'get'});
};

// 根据参数键名查询参数值
export const getConfigKeyApi = (configKey: string) => {
  return service({url: useAdminBaseUrl('/infra/config/get-value-by-key?key=' + configKey), method: 'get'});
};

// 新增参数
export const createConfigApi = (data: ConfigVO) => {
  return service({url: useAdminBaseUrl('/infra/config/create'), data, method: 'post'});
};

// 修改参数
export const updateConfigApi = (data: ConfigVO) => {
  return service({url: useAdminBaseUrl('/infra/config/update'), data, method: 'put'});
};

// 删除参数
export const deleteConfigApi = (id: number) => {
  return service({url: useAdminBaseUrl('/infra/config/delete?id=' + id), method: 'delete'});
};

// 导出参数
export const exportConfigApi = (params: ConfigExportReqVO) => {
  return service({url: useAdminBaseUrl('/infra/config/export'), data: params, method: 'download'});
};
