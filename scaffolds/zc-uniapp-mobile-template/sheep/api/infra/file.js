import { baseUrl, adminApiPath, tenantId, appId, env } from '@/sheep/config';
import request from '@/sheep/request';
import { getTenantId, getAccessToken } from "@/sheep/util/auth"
const FileApi = {
  // 上传文件
  uploadFile: (file) => {
    // TODO 芋艿：访问令牌的接入；
    const token = uni.getStorageSync('token');
    uni.showLoading({
      title: '上传中',
    });
    return new Promise((resolve, reject) => {
      // 先定义基础请求头
      const header = {
        Accept: '*/*',
        'tenant-id': getTenantId(),
        Authorization: getAccessToken(),
        'app-id': appId,
        'env': env
      };
      // 判断是否有 portalKey
      if (uni.getStorageSync('portalVal')) {
        header['portal-key'] = uni.getStorageSync('portalVal'); // 添加新字段（key/value 替换为你的实际值）
      }
      uni.uploadFile({
        url: baseUrl + adminApiPath + '/system/user/profile/update-avatar',
        filePath: file,
        name: 'file',
        header: header,
        success: (uploadFileRes) => {
          let result = JSON.parse(uploadFileRes.data);
          if (result.error === 1) {
            uni.showToast({
              icon: 'none',
              title: result.msg,
            });
          } else {
            return resolve(result);
          }
        },
        fail: (error) => {
          console.log('上传失败：', error);
          return resolve(false);
        },
        complete: () => {
          uni.hideLoading();
        },
      });
    });
  },

  // 获取文件预签名地址
  getFilePresignedUrl: (path) => {
    return request({
      url: '/infra/file/presigned-url',
      method: 'GET',
      params: {
        path,
      },
    });
  },

  // 创建文件
  createFile: (data) => {
    return request({
      url: '/infra/file/create', // 请求的 URL
      method: 'POST', // 请求方法
      data: data, // 要发送的数据
    });
  },
};

export default FileApi;
