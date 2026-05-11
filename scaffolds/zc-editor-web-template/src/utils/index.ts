import history from '@/utils/history'

/** is编辑端 */
const isEditorialEnd = () => {
    let reg = /\/app\/design\//;
    const params = new URLSearchParams(window.location.search);
    let env = params.get('env');
    //开发环境显示预览按钮
    if (reg.test(history.location.pathname)) {
        return true
    } else {
        return false
    }
}
const isAppEnd = () => {
    let reg = /\/app\/design\//;
    const params = new URLSearchParams(window.location.search);
    let env = params.get('env');
    //开发环境显示返回开发按钮
    if (!reg.test(history.location.pathname)) {
        return true
    } else {
        return false
    }
}
// const buildSearch = (path, query = {}) => {
//     if (!_isObject(query)) {
//         console.error('请传入正确的query')
//         return
//     }
//     let str = ''
//     Object.keys(query).forEach(key => {
//         str += `&${key}=${encodeURIComponent(query[key])}`
//     })
//     return `${path}?${str.slice(1)}`
// }

/** 获取appid、env */
const adminParams = new URLSearchParams(history.location.search);
const getEnv = () => {
    return adminParams.get('env') || ''
}
const getAppId = () => {
    return adminParams.get('appid') || ''
}
const getPortalKey = () => {
    return adminParams.get('portalKey') || ''
}
/** 增加多个相同的关系的字段 */
const generateNewData = (data, newItem) => {
    const existingItems = data.map(item => item.code);
    const existingTypes = data.map(item => item.relationMode);

    // 检查是否有相同 type 的项
    const hasSameType = existingTypes.includes(newItem.type);

    if (hasSameType) {
        // 生成新的 name 值
        let newName = newItem.name;
        let counter = 1;
        let found = false;

        while (true) {
            if (!existingItems.includes(newName)) {
                found = true;
                break;
            }

            // 检查是否有类似 name_1, name_2 的项
            const pattern = `${newItem.name}_\\d+`;
            const regex = new RegExp(pattern);
            const matches = existingItems.filter(name => regex.test(name));

            if (matches.length === 0) {
                newName = `${newItem.name}_1`;
                found = true;
                break;
            }

            // 找到最大的编号
            const maxIndex = Math.max(...matches.map(match => parseInt(match.split('_')[1], 10)));
            newName = `${newItem.name}_${maxIndex + 1}`;
            found = true;
            break;
        }

        if (found) {
            // 添加新的数据对象
            const newData = [...data, { name: newName, type: newItem.type }];
            return { newData, lastAddedName: newName };
        }
    } else {
        // 直接添加新的数据对象
        const newData = [...data, newItem];
        return { newData, lastAddedName: newItem.name };
    }
};

// 排序索引列表字段
function processIndexFields(indexStr, dataFieldsMap) {
  const fieldList = indexStr.split(',').map(s => s.trim()).filter(Boolean);
  let dataFieldsMapData = [...(dataFieldsMap || [])];
  let idField = null;
  const normalFields = [];
  const deleteAtFields = [];
  const tenantCodeFields = [];
  const deletedFields = [];

  let deleteCode: any = [];
  const systemFieldTypes = [1, 6, 8, 9];
  deleteCode = dataFieldsMapData
    .filter(item => systemFieldTypes.includes(item.systemFieldType))
    .map(item => item.code);
  console.log(deleteCode, 'deleteCode');
  console.log(deleteCode.length, 'deleteCode.length');
  if (deleteCode.length < 3) {
    let needArr = dataFieldsMapData
      .filter(item => item.systemFieldType == 0)
      .map(item => item.code);
    let haveId = deleteCode.filter(item => item == 'id');
    let haveDeleted = deleteCode.filter(item => item == 'deleted');
    let haveDeletedAt = deleteCode.filter(item => item == 'deletedAt');
    let haveTenantCode = deleteCode.filter(item => item == 'tenantCode');
    let haveIds = needArr.filter(item => item == 'id');
    let haveDeleteds = needArr.filter(item => item == 'deleted');
    let haveDeletedAts = needArr.filter(item => item == 'deletedAt');
    let haveTenantCodes = needArr.filter(item => item == 'tenantCode');
    if (haveId.length == 0 && haveIds.length ==0) {
      dataFieldsMapData.push(
        {code: 'id', systemFieldType: 1}
      );
    } else if (haveDeleted.length == 0 && haveDeleteds.length == 0) {
      dataFieldsMapData.push(
        {code: 'deleted', type: 8, systemFieldType: 8}
      );
    } else if (haveDeletedAt.length == 0 && haveDeletedAts.length == 0) {
      dataFieldsMapData.push(
        {code: 'deletedAt', systemFieldType: 6}
      );
    } else if (haveTenantCode.length == 0 && haveTenantCodes.length == 0) {
      dataFieldsMapData.push(
        {code: 'tenantCode', systemFieldType: 9}
      );
    }
  } else if (deleteCode.length == 0) {
    dataFieldsMapData.push(
      {code: 'id', systemFieldType: 1},
      {code: 'deletedAt', systemFieldType: 6},
      {code: 'deleted', type: 8, systemFieldType: 8},
      {code: 'tenantCode', systemFieldType: 9}
    );
  }
  const dataMap = {};
  for (const item of dataFieldsMapData) {
    dataMap[item.code] = item;
  }
  for (const field of fieldList) {
    const item = dataMap[field];
    const type = item ? item.systemFieldType : 0;
    switch (type) {
      case 1:
        idField = field;
        break;
      case 6:
        deleteAtFields.push(field);
        break;
      case 9:
        tenantCodeFields.push(field);
        break;
      case 8:
        deletedFields.push(field);
        break;
      default:
        normalFields.push(field);
    }
  }
  // 普通字段按字母排序
  // normalFields.sort();
  // 合并结果
  const result = [];
  if (idField) result.push(idField);
  result.push(...normalFields);
  result.push(...deleteAtFields);
  result.push(...tenantCodeFields);
  result.push(...deletedFields);
  return result.join(',');
}

// 系统字段按钮统一操作
function next(codeName,data,doAction,dialogName,keyCrudAdd){
  let fieldData = JSON.parse(sessionStorage.getItem('keyCrud')!)
  let fieldDatas = fieldData.map((res: any) => {
    if(res.uniqueFlag){
      const columnArr = res.columnNames
        .split(',')
        .map(col => col.trim());
      const exists = columnArr.some(col => col === codeName);
      if (!exists && keyCrudAdd) {
        columnArr.push(codeName); // 不存在则添加
      }
      return {
        ...res,
        columnNames: columnArr.join(',')
      }
    } else {
      return res
    }
  })
  let fieldDatase = fieldDatas.map((res: any, index: number) => {
    return { ...res, sort: index + 1,
      columnNames:processIndexFields(res.columnNames,data)}
  })
  sessionStorage.setItem('keyCrud', JSON.stringify(fieldDatase))
  doAction({
    actionType: "setValue", componentId: "keyCrud", "args": {
      "value": {
        "items": fieldDatase
      }
    }
  });
  data.forEach((element: any, index: number) => {
    element.sort = index + 1
  });
  let fieldCruds = data.map((res: any) => {
    if (res.type != 'relation'
      && res.systemFieldType != 6
      && res.systemFieldType != 8
      && res.systemFieldType != 7
      && res.type != 'formula'
      && res.systemFieldType != 9) {
      return res
    }
  })
  let puFieldCruds = data.map((res: any) => {
    if (!res.foreignKeyFlag && res.systemFieldType == 0 && res.type != 'relation') {
      return res
    }
  })
  let fieldKeyCruds = data.map((res: any) => {
    if (res.type != 'relation'
      && res.type != 'formula'
      && res.type != 'textarea'
      && res.type != 'rich-text'
      && res.type != 'json'
      && res.type != 'attachment'
      && res.type != 'image'
      && res.type != 'ciphertext'
      && res.type != 'users') {
      if (res.type == 'text' && res.config.length < 768) {
        return res
      } else if (res.type != 'text') {
        return res;
      }
    }
  })
  sessionStorage.setItem('fieldKeyCruds', JSON.stringify(fieldKeyCruds))
  let waiList = data.filter((res: any) => {
    if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
      return res
    } else if (res.type == 'int' && res.systemFieldType == 0 && res.config.integerType == 'BIGINT') {
      return res
    }
  })
  console.log(data,'asdasddaasdasaaaaaaa')
  let cuList = data.filter((res: any) =>
    (res.type == 'text' || res.type == 'user') && res.systemFieldType == 0)
  let cuTimeList = data.filter((res: any) =>
    res.type == 'datetime' && res.systemFieldType == 0)
  let needPrimaryKeyType:any = []
  needPrimaryKeyType = data.filter((res: any) =>res.systemFieldType == 1)
  if(needPrimaryKeyType.length == 0){
    needPrimaryKeyType.push({type:'int',config:{dbType:'BIGINT'}})
  }
  let treeList = data.filter((res: any) => {
    if(res.type == needPrimaryKeyType[0].type &&
      res.config.dbType == needPrimaryKeyType[0].config.dbType && res.systemFieldType == 0){
      return res
    }
  })
  sessionStorage.setItem('cuList', JSON.stringify(cuList))
  sessionStorage.setItem('cuTimeList', JSON.stringify(cuTimeList))
  sessionStorage.setItem('treeList', JSON.stringify(treeList))
  sessionStorage.setItem('waiList', JSON.stringify(waiList))
  sessionStorage.setItem('puFieldCruds', JSON.stringify(puFieldCruds))
  sessionStorage.setItem('fieldCruds', JSON.stringify(fieldCruds))
  sessionStorage.setItem('fieldCrud', JSON.stringify(data))
  let formulArr: any = []
  data.forEach((item: any) => {
    if (item.systemFieldType != 6
      && item.systemFieldType != 8
      && item.systemFieldType != 7
      && item.type != 'formula'
      && item.systemFieldType != 9) {
      formulArr.push({...item,label:item.name,value:item.code})
    }
  })
  sessionStorage.setItem('formulaData', JSON.stringify(formulArr))
  doAction({
    actionType: "setValue", componentId: "myField", "args": {
      "value": {
        "items": data
      }
    }
  });
  doAction({ actionType: "closeDialog", componentId: dialogName });
}
// 系统字段按钮统一操作后续存储
function systemNext(fieldData,doAction){
  let data = [...fieldData];
  data.forEach((element: any, index: number) => {
    element.sort = index + 1
  });
  let fieldCruds = data.map((res: any) => {
    if (res.type != 'relation'
      && res.systemFieldType !== 6
      && res.systemFieldType !== 7
      && res.systemFieldType !== 8
      && res.systemFieldType !== 9
      && res.type != 'formula') {
      return res
    }
  })
  let puFieldCruds = data.map((res: any) => {
    if (!res.foreignKeyFlag
      && res.systemFieldType == 0
      && res.type != 'relation') {
      return res
    }
  })
  let fieldKeyCruds = data.map((res: any) => {
    if (res.type != 'relation'
      && res.type != 'formula'
      && res.type != 'textarea'
      && res.type != 'rich-text'
      && res.type != 'json'
      && res.type != 'attachment'
      && res.type != 'image'
      && res.type != 'ciphertext'
      && res.type != 'users') {
      if (res.type == 'text' && res.config.length < 768) {
        return res
      } else if (res.type != 'text') {
        return res;
      }
    }
  })
  let waiList = data.filter((res: any) => {
    if (res.type == 'text'
      && res.config.length >= 20
      && res.systemFieldType == 0) {
      return res
    } else if (res.type == 'int'
      && res.systemFieldType == 0
      && res.config.integerType == 'BIGINT') {
      return res
    }
  })
  let cuList = data.filter((res: any) =>
    (res.type == 'text' || res.type == 'user') && res.systemFieldType == 0)
  let cuTimeList = data.filter((res: any) =>
    res.type == 'datetime' && res.systemFieldType == 0)
  let needPrimaryKeyType:any = []
  needPrimaryKeyType = data.filter((res: any) =>res.systemFieldType == 1)
  if(needPrimaryKeyType.length == 0){
    needPrimaryKeyType.push({type:'int',config:{dbType:'BIGINT'}})
  }
  let treeList = data.filter((res: any) => {
    if(res.type == needPrimaryKeyType[0].type &&
      res.config.dbType == needPrimaryKeyType[0].config.dbType && res.systemFieldType == 0){
      return res
    }
  })
  let formulArr: any = []
  data.forEach((item: any) => {
    if (item.type != 'formula'
      && item.systemFieldType != 6
      && item.systemFieldType != 7
      && item.systemFieldType != 8
      && item.systemFieldType != 9
    ) {
      formulArr.push({...item,label:item.name,value:item.code})
    }
  })
  sessionStorage.setItem('cuList', JSON.stringify(cuList))
  sessionStorage.setItem('cuTimeList', JSON.stringify(cuTimeList))
  sessionStorage.setItem('treeList', JSON.stringify(treeList))
  sessionStorage.setItem('waiList', JSON.stringify(waiList))
  sessionStorage.setItem('fieldKeyCruds', JSON.stringify(fieldKeyCruds))
  sessionStorage.setItem('puFieldCruds', JSON.stringify(puFieldCruds))
  sessionStorage.setItem('fieldCruds', JSON.stringify(fieldCruds))
  sessionStorage.setItem('fieldCrud', JSON.stringify(data))
  sessionStorage.setItem('formulaData', JSON.stringify(formulArr))
  doAction({
    actionType: "setValue", componentId: "myField", "args": {
      "value": {
        "items": data
      }
    }
  });
  setTimeout(() => {
    doAction({
      actionType: "setValue", componentId: "myField", "args": {
        "value": {
          "items": data
        }
      }
    });
  }, 1000);
}

const collectPaths = (array: any[]) => {
    const paths: string[] = [];

    function recurse(node: any) {
        if (Array.isArray(node)) {
            node.forEach(item => recurse(item));
        } else if (node && typeof node === 'object') {
            // dev2.0_core 分支用path 字段，url字段废弃了
            if (node.path) {
                if(node.sourceType){
                    if(node.sourceType == 'page' && node.sourceType != 'system'){
                        paths.push('/app'+node.path);
                    }
                } else {
                    paths.push('/app'+node.path);
                }
            }
            if (node.children && Array.isArray(node.children)) {
                recurse(node.children);
            }
        }
    }

    recurse(array);
    return paths;
}

function objectToQueryString(obj: any): string {
  if (!obj) return '';

  const params = new URLSearchParams();

  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => {
          params.append(key, String(item));
        });
      } else {
        params.append(key, String(value));
      }
    }
  });

  return params.toString();
}

export const getFormatStringByPrecision = (format: string, precision: number, precisionCompatible: boolean = true) => {
  // momentJs毫秒精度最大支持3位，限制 precision 最大值为 3
  const processedPrecision = precisionCompatible ? Math.min(precision || 0, 3) : precision;
  return `${format}${(processedPrecision && processedPrecision > 0) ? '.' : ''}${'S'.repeat(processedPrecision)}`
}

/**
 * 固定占位符映射类型（非S类）
 */
type FixedTimePlaceholder = {
  YYYY: string; // 4位年份
  MM: string;   // 2位月份（01-12）
  DD: string;   // 2位日期（01-31）
  HH: string;   // 2位小时（00-23）
  mm: string;   // 2位分钟（00-59）
  ss: string;   // 2位秒（00-59）
};

/**
 * 核心修复：生成无多余转义的正则字符串（直接可用于匹配，无\\d/\\$等错误）
 * @param format 时间格式，示例："YYYY-MM-DD HH:mm:ss.SSSSS"（5位毫秒）
 * @returns 纯净的正则字符串（如 ^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)\.\d{5}$）
 */
export function generateDateTimeRegexStr(format: string): string {
  // 1. 固定占位符的正则规则（直接用单转义，正则解析时会自动识别）
  const fixedPlaceholderMap: FixedTimePlaceholder = {
    YYYY: '\\d{4}',                    // 最终正则解析为 \d{4}
    MM: '(0[1-9]|1[0-2])',             // 月份规则
    DD: '(0[1-9]|[12]\\d|3[01])',      // 最终正则解析为 (0[1-9]|[12]\d|3[01])
    HH: '([01]\\d|2[0-3])',            // 最终正则解析为 ([01]\d|2[0-3])
    mm: '([0-5]\\d)',                  // 最终正则解析为 ([0-5]\d)
    ss: '([0-5]\\d)',                  // 最终正则解析为 ([0-5]\d)
  };

  // 2. 修复后的转义函数：仅转义「正则特殊字符」，但排除 $、空格（避免错误转义）
  // 需转义的字符：. * + ? ^ { } ( ) | [ ] \ - :
  const escapeRegExp = (str: string): string => {
    const escapeChars = /[.*+?^${}()|[\]\\\-:]/g;
    return str.replace(escapeChars, (char) => `\\${char}`);
  };

  // 3. 提取所有连续字母占位符（如 YYYY、SSSSS、mm 等）
  const allPlaceholders = format.match(/[A-Za-z]+/g) || [];

  // 4. 分离S类和固定占位符，按长度降序排序（避免长S被拆分）
  const sPlaceholders = [...new Set(allPlaceholders.filter(ph => /^S+$/.test(ph)))]
    .sort((a, b) => b.length - a.length); // 长S优先（SSSSS > SSSS > ... > S）
  const fixedPlaceholders = [...new Set(allPlaceholders.filter(ph => !/^S+$/.test(ph)))]
    .sort((a, b) => b.length - a.length);

  // 5. 检测未知的非S占位符（友好提示）
  const unknownFixedPh = fixedPlaceholders.filter(ph => !Object.keys(fixedPlaceholderMap).includes(ph));
  if (unknownFixedPh.length > 0) {
    console.warn(`[警告] 未知占位符：${unknownFixedPh.join(', ')}，已按普通字符处理`);
  }

  // 6. 构建占位符匹配正则（先匹配长S，再匹配固定占位符）
  const allMatchPh = [...sPlaceholders, ...fixedPlaceholders];
  const phMatchRegex = new RegExp(`(${allMatchPh.join('|')})`, 'g');

  // 7. 临时标记占位符（避免转义干扰占位符本身）
  const tempMarker = '__PH__';
  let tempIndex = 0;
  const phList: string[] = []; // 存储匹配到的占位符顺序

  // 第一步：替换占位符为临时标记，记录占位符
  const tempFormat = format.replace(phMatchRegex, (match) => {
    phList.push(match);
    return `${tempMarker}${tempIndex++}`;
  });

  // 第二步：仅转义临时格式中的「普通特殊字符」（如 -、:、.），不转义$和空格
  const escapedTempFormat = escapeRegExp(tempFormat);

  // 第三步：替换临时标记为对应正则片段（核心：S数量严格匹配）
  let regexStr = escapedTempFormat.replace(
    new RegExp(`${tempMarker}(\\d+)`, 'g'),
    (_, indexStr) => {
      const index = parseInt(indexStr, 10);
      const placeholder = phList[index];

      // 处理S类占位符：N个S → \d{N}（严格匹配位数）
      if (/^S+$/.test(placeholder)) {
        return `\\d{${placeholder.length}}`; // 最终正则解析为 \d{N}
      }

      // 处理固定占位符：用预设规则，否则转义原字符
      return fixedPlaceholderMap[placeholder as keyof FixedTimePlaceholder] || escapeRegExp(placeholder);
    }
  );

  // 8. 添加首尾锚点（^ 开头、$ 结尾，确保完全匹配，且$不被转义）
  regexStr = `^${regexStr}$`;

  // 最终返回「纯净的正则字符串」（无多余转义，可直接用于new RegExp）
  return regexStr;
}

function truncateTimePrecision(value: any, newPrecision: any) {
  const str = value.trim();

  const parts = str.split('.');
  const mainPart = parts[0];
  let fractional = parts.length > 1 ? parts[1] : '';

  if (parts.length > 2) {
    fractional = parts.slice(1).join('');
  }

  if (parts.length === 1) {
    fractional = '';
  }
  if (newPrecision === 0) {
    return mainPart;
  } else {
    let newFractional = fractional.padEnd(newPrecision, '0').substring(0, newPrecision);
    return `${mainPart}.${newFractional}`;
  }
}
function validateTimeInput(value: any, type: any, precision = 0) {

  // 如果value是数组，递归验证每个元素
  if (Array.isArray(value) && value.length > 0) {
    // 验证数组中的每个元素
    let isValidArray:any = value.every(item => validateTimeInput(item, type, precision));
    if (value.every(item => item.includes('${'))){
      return true;
    }
    return isValidArray;
  }
  if (typeof value !== 'string') return false;
  let str = value.trim();

  if(str.includes('${')) return true;

  function isValidTimeMain(mainStr:any) {
    const regex = /^\d{2}:\d{2}:\d{2}$/;
    if (!regex.test(mainStr)) return false;

    const [hh, mm, ss] = mainStr.split(':').map(Number);
    return hh >= 0 && hh <= 23 &&
      mm >= 0 && mm <= 59 &&
      ss >= 0 && ss <= 59;
  }

  function isValidDateTimeMain(mainStr: any) {
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!regex.test(mainStr)) return false;

    try {
      const date = new Date(mainStr.replace(' ', 'T'));
      const [y, m, d, hh, mm, ss] = mainStr.split(/\D+/).map(Number);
      return date.getFullYear() === y &&
        date.getMonth() + 1 === m &&
        date.getDate() === d &&
        date.getHours() === hh &&
        date.getMinutes() === mm &&
        date.getSeconds() === ss;
    } catch (e) {
      return false;
    }
  }

  function validateFractional(part: any, fractionalStr: any) {
    if (precision === 0) {
      return part.length === 1;
    } else {
      if (part.length !== 2) return false;
      if (fractionalStr.length !== precision) return false;
      return /^\d+$/.test(fractionalStr);
    }
  }

  if (type === 'time') {
    const parts = str.split('.');
    const mainPart = parts[0];
    const fractional = parts.slice(1).join(''); // 防止多个小数点

    if (!isValidTimeMain(mainPart)) return false;
    return validateFractional(parts, fractional);
  }

  if (type === 'datetime') {
    const parts = str.split('.');
    const mainPart = parts[0];
    const fractional = parts.slice(1).join('');

    if (!isValidDateTimeMain(mainPart)) return false;
    return validateFractional(parts, fractional);
  }

  return false;
}

export const toPascalCase = (str: string, separator = '-') => {
  const cleanedStr = str.replace(new RegExp(`[^a-zA-Z0-9${separator}]`, 'g'), '');
  const words = cleanedStr.split(separator);
  const pascalCaseStr = words.map((word: any) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
  return pascalCaseStr;
}

export {
    isEditorialEnd,
    isAppEnd,
    getEnv,
    getAppId,
    getPortalKey,
    generateNewData,
    processIndexFields,
    next,
    systemNext,
    objectToQueryString,
    collectPaths,
    truncateTimePrecision,
    validateTimeInput
}

export { customUploadRequest, getFileListValue } from './upload';
