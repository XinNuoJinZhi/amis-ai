import {isEqual} from 'lodash-es';
import dayjs from 'dayjs';
import {getAppId, isEditorialEnd} from '../utils';
import { baseURL, adminApiUrl, devApiUrl } from '@/utils/env'
import {getAppInfo} from '@/api/system';
import appDefaultImg from '@/assets/imgs/app-default.png';
import allUserStore from '@/store/allUser';
import allDeptStore from '@/store/allDept';
import {service} from '@/utils/request';
import {evalExpressionWithConditionBuilderAsync, isPureVariable, normalizeApi} from 'amis-core';
import editMenuStore from '@/store/editMenu';
import appMenuStore from '@/store/appMenu';
import {useCache} from '@/hooks/web/useCache'
const {wsCache} = useCache('sessionStorage')
export const urlData = () => {
  let url = window.location.href;
  url = decodeURI(url);
  var arr1 = url.split("?");
  var obj = {}
  if (arr1.length > 1) {
    var arr2 = arr1[1].split("&");
    for (var i = 0; i < arr2.length; i++) {
      var curArr = arr2[i].split("=");
      obj[curArr[0]] = decodeURIComponent(curArr[1])
    }
  }
  return obj;
}
//判断2个数组对象是否相等
export const isEqualArray = (arr1: any, arr2: any) => {
  if (arr1.length !== arr2.length) {
    return false
  }
  for (let i = 0; i < arr1.length; i++) {
    const obj1 = arr1[i];
    const obj2 = arr2[i];
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
      return false;
    }
    for (let j = 0; j < keys1.length; j++) {
      const key = keys1[j];
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }
  }
  return true;
}

//判断2个数组对象是否相等
export const isEqualObject = (obj1: any, obj2: any) => {
  // return Object.entries(obj1).toString() === Object.entries(obj2).toString()
  return isEqual(obj1, obj2)
}

export function formatDate(date: Date, format?: string): string {
  // 日期不存在，则返回空
  if (!date) {
    return ''
  }
  // 日期存在，则进行格式化
  if (format === undefined) {
    format = 'YYYY-MM-DD HH:mm:ss'
  }
  return dayjs(date).format(format)
}
//格式化时间戳到 Y+M+D
export function formatToData(dateStr: any) {
  var date = new Date(dateStr * 1000);
  var Y = date.getFullYear() + '-';
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
  var D = date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate();
  return Y + M + D;
}
//格式化时间戳到 Y+M+D+h+m+s
export function formatToDataTime(dateStr: any) {
  var date = new Date(dateStr * 1000);
  var Y = date.getFullYear() + '-';
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
  var D = date.getDate() < 10 ? '0' + (date.getDate()) + ' ' : date.getDate() + ' ';
  var h = date.getHours() < 10 ? '0' + date.getHours() + ':' : date.getHours() + ':';
  var m = date.getMinutes() < 10 ? '0' + date.getMinutes() + ':' : date.getMinutes() + ':';
  var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  return Y + M + D + h + m + s;
}
//格式化时间戳到 h+m
export function formatToTime(dateStr: any) {
  var date = new Date(dateStr * 1000);
  var h = date.getHours() < 10 ? '0' + date.getHours() + ':' : date.getHours() + ':';
  var m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  return h + m;
}
//格式化时间戳到 Y+M+D
export function formatToDatas(dateStr: any) {
  var date = new Date(dateStr * 1000);
  var Y = date.getFullYear() + '-';
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
  var D = date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate();
  return Y + '-' + M + '-' + D;
}
//格式化时间戳到 Y+M+D+h+m+s
export function formatToDataTimes(dateStr: any) {
  var date = new Date(dateStr * 1000);
  var Y = date.getFullYear() + '-';
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
  var D = date.getDate() < 10 ? '0' + (date.getDate()) + ' ' : date.getDate() + ' ';
  var h = date.getHours() < 10 ? '0' + date.getHours() + ':' : date.getHours() + ':';
  var m = date.getMinutes() < 10 ? '0' + date.getMinutes() + ':' : date.getMinutes() + ':';
  var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  return Y + '-' + M + '-' + D + ' ' + h + ':' + m + ':' + s;
}
//格式化时间戳到 h+m
export function formatToTimes(dateStr: any) {
  var date = new Date(dateStr * 1000);
  var h = date.getHours() < 10 ? '0' + date.getHours() + ':' : date.getHours() + ':';
  var m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  return h + ':' + m;
}

// 格式化文件大小
export function formatSize(cellValue: any, digits = 1) {
  const unitArr = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const srcSize = parseFloat(cellValue)
  const index = Math.floor(Math.log(srcSize) / Math.log(1024))
  const size = srcSize / Math.pow(1024, index)
  return size.toFixed(2) + ' ' + unitArr[digits];
}

export function getTabIcon(icon: string) {
  var link = document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'icon';
  link.href = icon; // 新图标的URL
  document.getElementsByTagName('head')[0].appendChild(link);
}

export async function getOpenTabIcon() {
  const appInfoRes = await getAppInfo(getAppId());
  const logo = appInfoRes.data.data.icon ? appInfoRes.data.data.icon : appDefaultImg;
  getTabIcon(logo)
}

export const useDevBaseUrl = (url: string, appid?: any, tenantId?: any, onlyUrl = true) => {
  if (onlyUrl) {
    return baseURL + devApiUrl + url
  }
  return {
    url: baseURL + devApiUrl + url,
    appid: appid,
    tenantId: tenantId
  }
}

export const useAdminBaseUrl = (url: string, appid?: any, tenantId?: any, onlyUrl = true) => {
  if (onlyUrl) {
    return baseURL + adminApiUrl + url
  }
  return {
    url: baseURL + adminApiUrl + url,
    appid: appid,
    tenantId: tenantId
  }
}
//组织函数-用户信息逻辑
export function registerGetUserInfo(userId: any, field: any) {
  const data = allUserStore.getState().userData
  const user = data.filter(i=>i.id == userId || i.username == userId)
  //remark sex postIds status registerStatus loginIp loginDate createTime supervisor dept
  if (user) {
      if (Array.isArray(field)) {
          const result:any = {}
          for(var i=0;i<field.length;i++){
            result[field[i]] = user[0][field[i]]
          }
          return result;
      }
      return user[0];
  }
}
//组织函数-部门信息逻辑
export function registerGetDepInfo(id:any) {
  const data = allDeptStore.getState().deptData
  //sort phone email status createTime children
  const res = data.filter(i=>i.id == id || i.code == id)
  return res[0]
}
//组织函数-人员选择逻辑
export function registerGetUserInfoByUserSelect(result, field){
  //remark sex postIds status registerStatus loginIp loginDate createTime supervisor dept
  const data = allUserStore.getState().userData
  const resArray = result.split(',')
  const res:any = []
  resArray.forEach(item =>{
      const data2=data.filter(i =>i.username == item)
      if(data2.length > 0){
        res.push(...data2)
      }
  })
  if(res.length > 0){
      if (Array.isArray(field)) {
          // const result2:any = []
          // for(var i=0;i<field.length;i++){
          //     for(var j=0;j< res.length;j++){
          //         result2.push(res[j][field[i]])
          //     }
          // }
          // return result2;
          const filteredItems = res.map(item =>
            field.reduce((acc, field1) => {
              acc[field1] = item[field1];
              return acc;
            }, {})
          )
          return filteredItems
      }
      return res;
  } else {
    return []
  }
}

//很大的数取模运算
export const longDecimalMod = (numberStr, modulus) => {
  let result = 0;
  for (let i = 0; i < numberStr.length; i++) {
    result = (result * 10 + parseInt(numberStr[i])) % modulus;
  }
  return 'bg'+result;
}

export const processAndFetchOptions  = async (obj: any, fetcher: any, current: any): Promise<any> => {
  // 处理数组
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(async (item) => {
      return await processAndFetchOptions (item, fetcher, current);
    }));
  }

  // 处理对象
  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        let value = obj[key];
        // 如果键名是 'source' || 'autoComplete' 且值是字符串，则特殊处理
        if (!isPureVariable(value) && (key === 'source' || key === 'autoComplete')) {
          try {
            const propsData = current.getComponentById(obj.id) ? current.getComponentById(obj.id).props.data : {}
            const response = await fetcher(value, propsData, undefined,false);
            // console.log(response, 'res');
            newObj['options'] =
              response.data?.options ||
              response.data?.items ||
              response.data?.rows ||
              response.data ||
              [];
          } catch (error) {
            console.error('Error fetching data for source:', error);
            // 可以选择设置一个默认值或者保留原始值等
            newObj['options'] = []; // 或者其他适当的默认值
          }
        }
        // api特殊处理
        else if (key === 'api' && obj.type === 'service') {
          // console.log(obj,'obj')
          let api = normalizeApi(value);
          // console.log(api,'normalizeApi(value)')
          const propsData = current.getComponentById(obj.id) ? current.getComponentById(obj.id).props.data : {}
          // console.log(propsData,'propsData')
          // 发送请求前，判断是否需要发送
          const sendOn = api.sendOn ? await evalExpressionWithConditionBuilderAsync(
            api.sendOn,
            propsData ?? {},
            false
          ) : true;

          if (!sendOn) {
            newObj[key] = value;
          } else {
            const response = await fetcher(api, propsData, undefined, false);
            // console.log(response,'response---api')
            newObj['data'] = Array.isArray(response.data) ? {
              items: response.data
            } : response.data;
          }
        } else if (obj.type === 'crud') {
          if (isColumnsCheckRelevanceCRUD(obj)) {
            obj.columns = obj.columns.filter((column: any) => {
              return column.type != 'container'
            })
            return obj
          } else {
            newObj[key] = value;
          }
        }
        else {
          // 递归处理其他属性
          value = await processAndFetchOptions (value, fetcher, current);
          newObj[key] = value;
        }
      }
    }
    return newObj;
  }

  // 如果 obj 不是数组或对象，则直接返回
  return obj;
};

const isColumnsCheckRelevanceCRUD  = (crudSchema: any): boolean => {
  console.log(crudSchema,'crudSchema---checkColumnsForCrudRelevance')
  return crudSchema.columns.some((column: any) => {
    if (column.type === 'container' && column.body[0]) {
      const { type, actionType } = column.body[0];
      if (type === 'button' && (actionType === 'drawer' || actionType === 'dialog') &&  column.body[0][actionType]) {
        return column.body[0][actionType].body.type === 'crud';
      }
    }
    return false;
  });
};

export const extractContent = (str: any) => {
  // 使用正则表达式匹配 ${} 中的内容
  const regex = /\$\{([^}]+)\}/g;
  let matches;
  const result = [];

  // 使用 exec 方法在字符串中查找所有匹配项
  while ((matches = regex.exec(str)) !== null) {
      // matches[1] 是捕获组中的内容，即 ${} 中的内容
      result.push(matches[1]);
  }
  return result;
}
const findNodeByUrl = (nodes, targetUrl) => {
  // 1. 边界判断：若 nodes 不是数组，直接返回 null
  if (!Array.isArray(nodes)) return null;

  // 2. 遍历当前节点数组
  for (const node of nodes) {
    // 3. 检查当前节点的 url 是否匹配目标
    if (node.url === targetUrl) {
      return node; // 找到匹配节点，直接返回
    }

    // 4. 若当前节点有 children，递归遍历 children
    if (node.children && Array.isArray(node.children)) {
      const matchedChild = findNodeByUrl(node.children, targetUrl);
      // 若递归找到结果，直接返回（避免继续遍历其他节点）
      if (matchedChild) {
        return matchedChild;
      }
    }
  }

  // 5. 遍历完所有节点未找到，返回 null
  return null;
}
export const findEditMenu = (menu: string) => {
  const editMenuList = editMenuStore.getState().editMenuData
  const appMenuList = appMenuStore.getState().appMenuData
  if (menu == '/app/design/dataManage') {
    const filterEntity = editMenuList.filter(i=>i.url == '/app/design/entityManage')
    if(filterEntity && filterEntity[0] && filterEntity[0]?.children && filterEntity[0]?.children[0]?.url == 'dataManage') {
      return true
    } else {
      return false
    }
  } else if(menu == '/app/design/appPermissions') {
    const setMenu = findNodeByUrl(editMenuList, 'appPermissions')
    if(setMenu && setMenu?.children && setMenu?.children[0]?.url == 'rowPermission') {
      return true
    } else {
      return false
    }
  } else if (menu == '/app/design/theme') {
    const setMenu = editMenuList.filter(i => i.url == '/app/design/appSetting')
    const themMenu = setMenu[0]?.children.filter(i => i.url == 'theme')
    if(themMenu && themMenu[0] && themMenu[0]?.children && themMenu[0]?.children[0]?.url == 'themeEdit') {
      return true
    } else {
      return false
    }
  } else if (menu == '/app/appPermissions') {
    let setMenu = findNodeByUrl(appMenuList, 'appPermissions')
    if(setMenu && setMenu?.children && setMenu?.children[0]?.url == 'rowPermission') {
      return true
    } else {
      return false
    }
  } else if (menu == '/app/ownProcessDetail') {
    let setMenu = findNodeByUrl(appMenuList, 'processDetail')
    if(setMenu !== null && typeof setMenu === 'object' && Object.keys(setMenu).length > 0) {
      return true
    } else {
      return false
    }
  } else if (menu == '/app/ownProcessRestart') {
    let setMenu = findNodeByUrl(appMenuList, 'ownProcess')
    if(setMenu && setMenu.children && setMenu.children[0]?.url== 'restartProcess') {
      return true
    } else {
      return false
    }
  } else if (menu == '/app/flowIntervention') {
    let setMenu = findNodeByUrl(appMenuList, 'flowIntervention')
    if(setMenu && setMenu?.children && setMenu?.children[0]?.url == 'nodeIntervention') {
      return true
    } else {
      return false
    }
  }
}

export const findPathByValue = (data:[], targetValue:'') => {
  // 遍历顶级分组
  for (const group of data) {
    // 检查当前分组的子项
    const child = group.children.find(item => item.value === targetValue);

    if (child) {
      // 找到匹配的子项，返回组合路径
      return `${group.label}/${child.label}`;
    }
  }

  // 未找到匹配的路径
  return null;
}

export const findPathById= (data:[], targetValue:'') => {
  // 遍历顶级分组
  for (const group of data) {
    // 检查当前分组的子项
    const child = group.children.find(item => item.id === targetValue);

    if (child) {
      // 找到匹配的子项，返回组合路径
      return `${group.label}/${child.label}`;
    }
  }

  // 未找到匹配的路径
  return null;
}

export const getLabelsByValue = (data:[], targetValue:'') =>{
  for (const category of data) {
    if (Array.isArray(category.children)) {
      for (const child of category.children) {
        if (child.value === targetValue) {
          return {
            categoryLabel: category.label,
            childLabel: child.label
          };
        }
      }
    }
  }
  return null;
}

export const buildSectionTree = (list: any) => {
  // 首先，我们需要找到所有 parentId=0 的节点，作为根节点
  let roots = list.filter(item => item.parentId === 0);
  // 创建一个映射，以便快速根据 id 找到对应的对象
  let itemById = new Map(list.map(item => [item.id, item]));

  // 递归函数，用于添加子节点
  function addChildren(item) {
    item.children = (item.children || []).concat(...list
      .filter(child => child.parentId === item.id)
      .map(child => {
        addChildren(child); // 递归地为子节点添加它们的子节点
        return child;
      })
    );
  }

  // 对每个根节点调用 addChildren 函数
  roots.forEach(addChildren);
  // 返回构建好的树形结构
  return roots;
}

export const tryLoadLogo = (logoUrl: string, fallbackUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = logoUrl;

    img.onload = () => {
      // 图片加载成功
      resolve(logoUrl);
    };

    img.onerror = () => {
      // 图片加载失败，使用默认图片
      resolve(fallbackUrl);
    };
  })
}
// 递归处理函数：遍历数组，找到最里层children并修改value
export const modifyInnerChildrenValue = (items) => {
  // 遍历当前层级的每个元素
  items.forEach(item => {
    // 判断当前元素是否有children，且children是有效的非空数组
    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
      // 递归处理子层级
      modifyInnerChildrenValue(item.children);
    } else {
      // 没有子层级，判断是否为最里层（包含appId和value）
      if (item.appId && item.value !== undefined) {
        // 修改value为 "appId&原value"
        item.value = `${item.appId}&${item.value}`;
      }
    }
  });
}

// 转换逻辑
export const transformData = (origin) => {
  // 1. 初始化分组容器和顶级属性容器
  const grouped = {}; // 按 code 分组：{ a: { ... }, b: { ... } }
  const topLevel = {}; // 顶级属性：{ backendMode: 1, ... }

  // 2. 遍历原始数据，拆分处理
  Object.entries(origin).forEach(([key, value]) => {
    if (key.includes('&')) {
      // 处理带 & 的键（属于 dataInfo）
      const [code, prop] = key.split('&'); // 拆分 code 和属性名（如 'a&host' → ['a', 'host']）
      // 初始化该 code 的对象（若不存在），并添加 code 字段
      if (!grouped[code]) {
        grouped[code] = { code }; // 初始化时加入 code 字段
      }
      // 绑定属性（如 grouped.a.host = 1）
      grouped[code][prop] = value;
    } else {
      // 处理顶级属性（直接存入 topLevel）
      topLevel[key] = value;
    }
  });

  // 3. 组装结果：dataInfo 为分组对象的数组，拼接顶级属性
  return {
    dataInfos: Object.values(grouped), // 将 grouped 转为数组
    ...topLevel // 合并顶级属性
  };
}

export const getTemplate = () => {
    return wsCache.get('template')
}

export const addSelectValToAllNodes = (nodes) =>{
  return nodes.map(node => {
    // 深拷贝节点，避免修改原始数据；添加selectVal（初始值为空，可根据业务改）
    const newNode = {
      ...node,
      selectVal: 0, // 初始值：空（或设为默认选项值，如 node.defaultValue）
      options: node.type == 3 ? [
        { "value": 0, "label": "不控制" },
        { "value": 1, "label": "后端控制" },
        { "value": 2, "label": "前端隐藏" }
      ] : [
        { "value": 0, "label": "不控制" },
        { "value": 2, "label": "前端隐藏" }
      ]
    };

    // 如果有子节点，递归处理
    if (node.children && node.children.length > 0) {
      newNode.children = addSelectValToAllNodes(node.children);
    }

    return newNode;
  });
}

export const extractValidMenuNodes = (treeData, resultArr) => {
  // 1. 先将referenceArr的menuId提取为Set（优化查询性能，从O(n)降为O(1)）
  const resultMenuIds = new Set(resultArr.map(item => item.menuId));

  // 2. 初始化结果数组（一维）
  const result = [];

  // 3. 递归处理单个节点的函数
  const processNode = (node) => {
    // 双重条件判断：满足任一条件则收集
    const isCondition1Met = node.selectVal !== undefined && node.selectVal !== 0; // 条件1：selectVal≠0
    const isCondition2Met = node.selectVal === 0 && resultMenuIds.has(node.id); // 条件2：selectVal=0但id在reference中

    if (isCondition1Met || isCondition2Met) {
      result.push({
        menuId: node.id, // 保留id原始类型（字符串/数字）
        memberPermissionMode: node.selectVal // 取节点自身的selectVal（0或非0）
      });
    }

    // 4. 如果节点有子节点，递归处理子节点（深度遍历所有层级）
    if (node.children && node.children.length > 0) {
      node.children.forEach(childNode => processNode(childNode));
    }
  };

  // 5. 遍历顶层节点，启动递归
  treeData.forEach(topNode => processNode(topNode));

  // 6. 返回最终的一维数组
  return result;
}

// 回显数据处理
export const updateSelectValByResult = (all, result) => {
  // 1. 构建result的ID-值映射表（{menuId: memberPermissionMode}），优化查询效率
  const resultMap = result.reduce((map, item) => {
    // 注意：menuId可能是字符串/数字，与all数组的id类型保持一致，确保严格匹配
    map[item.menuId] = item.memberPermissionMode;
    return map;
  }, {});

  // 2. 递归遍历并更新节点的selectVal
  const updateNode = (node) => {
    // 深拷贝节点（避免直接修改原始数据，可选：若允许修改原数据可删除此步）
    const updatedNode = { ...node };

    // 3. 检查当前节点id是否在resultMap中，若匹配则更新selectVal
    if (resultMap.hasOwnProperty(updatedNode.id)) {
      updatedNode.selectVal = resultMap[updatedNode.id];
    }

    // 4. 若节点有子节点，递归处理子节点（覆盖所有嵌套层级）
    if (updatedNode.children && updatedNode.children.length > 0) {
      updatedNode.children = updatedNode.children.map(child => updateNode(child));
    }

    return updatedNode;
  };

  // 5. 遍历all数组的顶层节点，启动递归更新
  return all.map(topNode => updateNode(topNode));
}

// 处理数据的主函数
export const assignCustomLevelByDsKey = (data, dataSourceList) => {
  const customLevel = ['info', 'success', 'warning', 'danger'];
  // 步骤1：收集所有非文件夹元素中首次出现的 dsKey（去重）
  const uniqueDsKeys = [];

  // 递归收集唯一 dsKey（跳过 pageType=3 的文件夹，处理子元素）
  function collectUniqueDsKeys(items) {
    items.forEach(item => {
      // 文件夹不参与收集，仅递归处理子元素
      if (item.pageType == 3) {
        if (item.children && item.children.length > 0) {
          collectUniqueDsKeys(item.children);
        }
        return;
      }
      if (item.pageType == 2 && isEditorialEnd()) {
        item.disabled = true
      } else {
        item.disabled = false
      }
      // 非文件夹，收集首次出现的 dsKey
      const key = item.dsKey;
      if (key && !uniqueDsKeys.includes(key)) {
        uniqueDsKeys.push(key);
      }

      // 递归处理子元素（无论是否为文件夹，子元素都需检查）
      if (item.children && item.children.length > 0) {
        collectUniqueDsKeys(item.children);
      }
    });
  }

  // 深拷贝数据，避免修改原数据
  const clonedData = JSON.parse(JSON.stringify(data));
  collectUniqueDsKeys(clonedData);

  // 步骤2：为每个唯一 dsKey 分配 customLevel（每4组一循环）
  const dsKeyToLevelMap = new Map();

  for (var i = 0; i < dataSourceList.length; i++) {
    // 用索引对 4 取余，实现循环复用（0→info，1→success，2→warning，3→danger，4→info...）
    const levelIndex = i % customLevel.length;
    dataSourceList[i].customLevel = customLevel[levelIndex]
  }

  uniqueDsKeys.forEach((key, index) => {
    // 用索引对 4 取余，实现循环复用（0→info，1→success，2→warning，3→danger，4→info...）
    // const levelIndex = index % customLevel.length;
    const filterObj = dataSourceList.filter(i=>i.queryKey == key)
    dsKeyToLevelMap.set(key, filterObj[0].customLevel);
  });

  // 步骤3：递归为非文件夹元素分配 customLevel（文件夹不处理）
  function assignLevelToItems(items) {
    items.forEach(item => {
      // 文件夹不添加 customLevel，仅处理子元素
      if (item.pageType == 3) {
        if (item.children && item.children.length > 0) {
          assignLevelToItems(item.children);
        }
        return;
      }

      // 非文件夹，分配对应 customLevel（无 dsKey 则设为空）
      const key = item.dsKey;
      item.customLevel = key ? dsKeyToLevelMap.get(key) || '' : '';

      // 递归处理子元素
      if (item.children && item.children.length > 0) {
        assignLevelToItems(item.children);
      }
    });
  }

  // 执行分配
  assignLevelToItems(clonedData);
  return clonedData;
}
/**
 * 递归搜索整个data结构，找到id匹配的目标节点（支持任意层级）
 * @param {Array} nodeList - 当前要搜索的节点数组
 * @param {string|number} id - 目标节点的id
 * @returns {object|null} - 找到的目标节点，未找到则返回null
 */
export const findTargetNode = (nodeList, id) =>{
  // 遍历当前层级的节点
  for (const node of nodeList) {
    // 统一转为字符串比较，兼容id为数字或字符串的情况
    if (String(node.id) === String(id)) {
      return node; // 找到目标节点，直接返回
    }
    // 若当前节点有children，递归搜索下一层
    if (node.children && node.children.length) {
      const found = findTargetNode(node.children, id);
      if (found) return found; // 下层找到目标节点，向上返回
    }
  }
  return null; // 遍历完所有节点未找到
}

/**
 * 递归修改目标节点下所有children的selectVal
 * @param {Array} children - 目标节点的children数组
 * @param {number} val - 要赋值的selectVal（即目标节点的selectVal）
 */
export const updateAllChildrenSelectVal = (children, val) =>{
  if (!children || !children.length) return; // 无children时终止递归
  children.forEach(child => {
    child.selectVal = val; // 修改当前子节点的selectVal
    // 若当前子节点还有children，递归处理下一层
    if (child.children && child.children.length) {
      updateAllChildrenSelectVal(child.children, val);
    }
  });
}

export const updateSelectVal = (data, targetId, newSelectVal) =>{
  // 遍历当前层级节点
  for (const node of data) {
    // 匹配目标ID，修改selectVal
    if (node.id === targetId) {
      node.selectVal = newSelectVal;
      return; // 找到后直接退出，无需继续遍历
    }
    // 存在子节点则递归遍历
    if (node.children && node.children.length > 0) {
      updateSelectVal(node.children, targetId, newSelectVal);
    }
  }
}

