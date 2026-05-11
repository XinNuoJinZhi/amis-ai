import { request } from './request';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import { message } from 'antd';

/**
 * 统一的文件上传处理函数
 * 用于 antd Upload 组件的 customRequest
 * @param options Upload 组件传递的参数
 */
export const customUploadRequest = async (options: UploadRequestOption) => {
  const { onSuccess, onError, file, onProgress, action } = options;

  try {
    // 创建 FormData
    const formData = new FormData();
    formData.append('file', file);

    // 使用统一的 request 方法发送请求
    const response = await request({
      url: action as string,
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // 检查响应状态
    if (response && response.code === 0) {
      // 上传成功
      onSuccess?.(response.data, file as any);
      return response.data;
    } else {
      // 上传失败
      const errorMsg = response?.msg || '上传失败';
      message.error(errorMsg);
      onError?.(new Error(errorMsg));
      return null;
    }
  } catch (error: any) {
    console.error('文件上传错误:', error);
    const errorMsg = error?.message || '上传失败';
    message.error(errorMsg);
    onError?.(error);
    return null;
  }
};

/**
 * 获取文件列表的值
 * 用于 Form.Item 的 getValueFromEvent
 */
export const getFileListValue = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};
