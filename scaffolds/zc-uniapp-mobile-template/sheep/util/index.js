import dayjs from 'dayjs';
// 引入 luch-request
import Request from 'luch-request';

/**
 * 将一个整数转换为分数保留两位小数
 * @param {number | string | undefined} num 整数
 * @return {number} 分数
 */
export const formatToFraction = (num) => {
  if (typeof num === 'undefined') return 0;
  const parsedNumber = typeof num === 'string' ? parseFloat(num) : num;
  return parseFloat((parsedNumber / 100).toFixed(2));
};

/**
 * 将一个数转换为 1.00 这样
 * 数据呈现的时候使用
 *
 * @param {number | string | undefined} num 整数
 * @return {string} 分数
 */
export const floatToFixed2 = (num) => {
  let str = '0.00';
  if (typeof num === 'undefined') {
    return str;
  }
  const f = formatToFraction(num);
  const decimalPart = f.toString().split('.')[1];
  const len = decimalPart ? decimalPart.length : 0;
  switch (len) {
    case 0:
      str = f.toString() + '.00';
      break;
    case 1:
      str = f.toString() + '.0';
      break;
    case 2:
      str = f.toString();
      break;
  }
  return str;
};

/**
 * 将一个分数转换为整数
 *
 * @param {number | string | undefined} num 分数
 * @return {number} 整数
 */
export const convertToInteger = (num) => {
  if (typeof num === 'undefined') return 0;
  const parsedNumber = typeof num === 'string' ? parseFloat(num) : num;
  // TODO 分转元后还有小数则四舍五入
  return Math.round(parsedNumber * 100);
};

/**
 * 时间日期转换
 * @param {dayjs.ConfigType} date 当前时间，new Date() 格式
 * @param {string} format 需要转换的时间格式字符串
 * @description format 字符串随意，如 `YYYY-mm、YYYY-mm-dd`
 * @description format 季度："YYYY-mm-dd HH:MM:SS QQQQ"
 * @description format 星期："YYYY-mm-dd HH:MM:SS WWW"
 * @description format 几周："YYYY-mm-dd HH:MM:SS ZZZ"
 * @description format 季度 + 星期 + 几周："YYYY-mm-dd HH:MM:SS WWW QQQQ ZZZ"
 * @returns {string} 返回拼接后的时间字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  // 日期不存在，则返回空
  if (!date) {
    return '';
  }
  // 日期存在，则进行格式化
  if (format === undefined) {
    format = 'YYYY-MM-DD HH:mm:ss';
  }
  return dayjs(date).format(format);
}

/**
 * 构造树型结构数据
 *
 * @param {*} data 数据源
 * @param {*} id id字段 默认 'id'
 * @param {*} parentId 父节点字段 默认 'parentId'
 * @param {*} children 孩子节点字段 默认 'children'
 * @param {*} rootId 根Id 默认 0
 */
export function handleTree(
  data,
  id = 'id',
  parentId = 'parentId',
  children = 'children',
  rootId = 0,
) {
  // 对源数据深度克隆
  const cloneData = JSON.parse(JSON.stringify(data));
  // 循环所有项
  const treeData = cloneData.filter((father) => {
    let branchArr = cloneData.filter((child) => {
      //返回每一项的子级数组
      return father[id] === child[parentId];
    });
    branchArr.length > 0 ? (father.children = branchArr) : '';
    //返回第一层
    return father[parentId] === rootId;
  });
  return treeData !== '' ? treeData : data;
}

/**
 * 重置分页对象
 *
 * TODO 芋艿：需要处理其它页面
 *
 * @param pagination 分页对象
 */
export function resetPagination(pagination) {
  pagination.list = [];
  pagination.total = 0;
  pagination.pageNo = 1;
}

/**
 * 将值复制到目标对象，且以目标对象属性为准，例：target: {a:1} source:{a:2,b:3} 结果为：{a:2}
 * @param target 目标对象
 * @param source 源对象
 */
export const copyValueToTarget = (target, source) => {
  const newObj = Object.assign({}, target, source);
  // 删除多余属性
  Object.keys(newObj).forEach((key) => {
    // 如果不是target中的属性则删除
    if (Object.keys(target).indexOf(key) === -1) {
      delete newObj[key];
    }
  });
  // 更新目标对象值
  Object.assign(target, newObj);
};

/**
 * 解析 JSON 字符串
 *
 * @param str
 */
export function jsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error(`str[${str}] 不是一个 JSON 字符串`);
    return '';
  }
}

// 创建请求实例（全局可复用）
const http = new Request({
  timeout: 60000, // 下载超时时间设为60秒
  // 响应类型设为 arraybuffer 处理二进制文件
  responseType: 'arraybuffer'
});

/**
 * uniapp 通用文件下载方法（适配 H5/APP/小程序）
 * @param {Object} file - 文件信息对象
 * @param {string} file.file - 文件下载地址
 * @param {string} file.fileName - 自定义文件名
 */
const downloadFile = (file) => {
  // 入参校验
  if (!file || !file.file) {
    uni.showToast({
      title: '下载地址不能为空',
      icon: 'none'
    });
    return Promise.reject(new Error('下载地址不能为空'));
  }

  // 处理文件名（确保有后缀）
  let filename = file.fileName || `下载文件_${Date.now()}`;
  
  // 根据运行环境选择不同的下载方式
  const platform = uni.getSystemInfoSync().platform;
  
  // 1. H5 端：模拟浏览器下载（兼容原逻辑）
  if (process.env.UNI_PLATFORM === 'h5') {
    return http.get(file.file, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      responseType: 'arraybuffer'
    }).then(response => {
      // 将 arraybuffer 转为 blob
      const blob = new Blob([response.data]);
      // 创建下载链接（H5端唯一保留的DOM操作）
      const linkNode = document.createElement('a');
      linkNode.download = filename;
      linkNode.style.display = 'none';
      linkNode.href = URL.createObjectURL(blob);
      document.body.appendChild(linkNode);
      linkNode.click();
      // 清理资源
      URL.revokeObjectURL(linkNode.href);
      document.body.removeChild(linkNode);
      uni.showToast({
        title: '文件下载成功',
        icon: 'success'
      });
      return { success: true, message: '下载成功' };
    }).catch(error => {
      uni.showToast({
        title: `下载失败：${error.message || '网络错误'}`,
        icon: 'none'
      });
      console.error('H5下载失败：', error);
      return Promise.reject(error);
    });
  }

  // 2. APP/小程序端：使用uniapp原生下载API
  return new Promise((resolve, reject) => {
    uni.showLoading({
      title: '下载中...',
      mask: true
    });

    // 调用uniapp原生下载方法
    uni.downloadFile({
      url: file.file,
      timeout: 60000,
      success: (downloadRes) => {
        uni.hideLoading();
        // 下载成功（状态码200）
        if (downloadRes.statusCode === 200) {
          // 保存文件到本地
          uni.saveFile({
            tempFilePath: downloadRes.tempFilePath,
            success: (saveRes) => {
              uni.showToast({
                title: '文件保存成功',
                icon: 'success'
              });
              // 提示文件保存位置（APP端可打开）
              uni.showModal({
                title: '下载完成',
                content: `文件已保存至：${saveRes.savedFilePath}`,
                confirmText: '打开文件',
                success: (res) => {
                  if (res.confirm) {
                    // 尝试打开文件（仅APP端支持）
                    if (platform === 'android' || platform === 'ios') {
                      uni.openDocument({
                        filePath: saveRes.savedFilePath,
                        showMenu: true,
                        fail: () => {
                          uni.showToast({
                            title: '无法打开该文件',
                            icon: 'none'
                          });
                        }
                      });
                    }
                  }
                }
              });
              resolve({
                success: true,
                savedFilePath: saveRes.savedFilePath,
                message: '文件下载并保存成功'
              });
            },
            fail: (saveErr) => {
              uni.showToast({
                title: `保存失败：${saveErr.errMsg}`,
                icon: 'none'
              });
              reject(saveErr);
            }
          });
        } else {
          // 下载失败（非200状态码）
          const errMsg = `下载失败，状态码：${downloadRes.statusCode}`;
          uni.showToast({
            title: errMsg,
            icon: 'none'
          });
          reject(new Error(errMsg));
        }
      },
      fail: (downloadErr) => {
        uni.hideLoading();
        uni.showToast({
          title: `下载失败：${downloadErr.errMsg}`,
          icon: 'none'
        });
        reject(downloadErr);
      }
    });
  });
};

// 导出方法供页面使用
export default downloadFile;

export const handleDeptTree = (data, id, parentId, children) => {
  if (!Array.isArray(data)) {
    console.warn('data must be an array')
    return []
  }
  const config = {
    id: id || 'id',
    parentId: parentId || 'parentId',
    childrenList: children || 'children'
  }

  const childrenListMap = {}
  const nodeIds = {}
  const tree = []

  for (const d of data) {
    const parentId = d[config.parentId]
    if (childrenListMap[parentId] == null) {
      childrenListMap[parentId] = []
    }
    nodeIds[d[config.id]] = d
    childrenListMap[parentId].push(d)
  }

  for (const d of data) {
    const parentId = d[config.parentId]
    if (nodeIds[parentId] == null) {
      tree.push(d)
    }
  }

  for (const t of tree) {
    adaptToChildrenList(t)
  }

  function adaptToChildrenList(o) {
    if (childrenListMap[o[config.id]] !== null) {
      o[config.childrenList] = childrenListMap[o[config.id]]
    }
    if (o[config.childrenList]) {
      for (const c of o[config.childrenList]) {
        adaptToChildrenList(c)
      }
    }
  }

  return tree
}

export const flattenDeptTree = (treeData, parentName = '') => {
  let result = [];
  
  // 遍历每一级节点
  treeData.forEach(node => {
    // 1. 拼接当前节点的名称（父级名称 + 当前名称，根节点无父级则直接用当前名称）
    const currentName = parentName ? `${parentName}/${node.name}` : node.name;
    
    // 2. 复制当前节点，替换name为拼接后的名称，删除children字段（扁平化）
    const flatNode = {
      ...node,
      name: currentName, // 替换为拼接后的名称
      children: undefined // 删除children字段，实现扁平化
    };
    
    // 3. 将处理后的节点加入结果数组
    result.push(flatNode);
    
    // 4. 递归处理子节点（如果有children）
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      const childrenFlat = flattenDeptTree(node.children, currentName);
      result = result.concat(childrenFlat);
    }
  });
  
  return result;
};