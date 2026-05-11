import type {IAccessor, ICommand} from '@univerjs/presets';
import {CommandType} from '@univerjs/presets';
import {service} from '@/utils/request';
import {getUniverStoreData} from '@/store/univer';
import {toast} from 'amis';

export const DownloadButtonOperation: ICommand = {
  id: 'custom-menu.operation.download-button',
  type: CommandType.OPERATION,
  handler: async (_accessor: IAccessor) => {
    try {
      const {api} = getUniverStoreData() as any;
      const {url, method = 'post', postData} = api;
      await service({
        url,
        responseType: 'blob',
        method,
        postData: postData ? JSON.parse(postData) : undefined
      });
    } catch (error) {
      console.log(error);
      toast.error('下载失败！')
    }
    return true;
  }
};
