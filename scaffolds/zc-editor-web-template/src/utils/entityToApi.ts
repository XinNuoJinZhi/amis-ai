/**
 * Entity 源配置转换工具
 * 将 amis 的 entity 配置转换为 API URL
 */

/**
 * 生成简单的 GUID
 */
function guid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface EntitySource {
  entity?: {
    value: string;
    label: string;
    apiShareConfig?: {
      appid: string;
      tenantId: string;
    };
  };
  conditions?: Array<{
    key: string;
    itemValue: string;
  }>;
  order?: Array<{
    mode: 'asc' | 'desc';
    key: string;
  }>;
}

/**
 * 将对象转换为 URL 查询参数字符串
 */
function objectToQueryString(obj: Record<string, any>): string {
  if (typeof obj !== 'object' || obj === null) return '';

  const params = Object.keys(obj)
    .filter(key => obj[key] !== undefined && obj[key] !== null)
    .map(key => {
      let value = obj[key];

      if (Array.isArray(value)) {
        value = value.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(',');
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        value = JSON.stringify(value);
      }

      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    });

  return params.length > 0 ? `?${params.join('&')}` : '';
}

/**
 * 从表达式中提取变量名
 * 支持简单变量和函数表达式
 */
export function extractFieldsFromExpression(expression: string): string[] {
  const fields: string[] = [];

  // 匹配 ${...} 中的内容
  const templateMatch = expression.match(/^\$\{(.+)\}$/);
  if (!templateMatch) {
    // 如果不是模板表达式，直接返回原值
    return [expression];
  }

  const content = templateMatch[1];

  // 匹配函数调用: FUNCTION(arg1, arg2, ...)
  const functionMatch = content.match(/^([A-Z_]+)\((.+)\)$/);
  if (functionMatch) {
    const argsString = functionMatch[2];
    // 解析参数，提取标识符（变量名）
    let currentArg = '';
    let inString = false;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if (char === '"' && (i === 0 || argsString[i - 1] !== '\\')) {
        inString = !inString;
        continue;
      }

      if (char === ',' && !inString) {
        const arg = currentArg.trim();
        // 只添加标识符（变量名），不添加字符串字面量
        if (arg && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(arg)) {
          fields.push(arg);
        }
        currentArg = '';
        continue;
      }

      currentArg += char;
    }

    // 处理最后一个参数
    const lastArg = currentArg.trim();
    if (lastArg && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(lastArg)) {
      fields.push(lastArg);
    }
  } else {
    // 简单变量引用
    fields.push(content);
  }

  return fields;
}

/**
 * 将 entity 源配置转换为 API URL
 */
export function entityToApiUrl(
  source: EntitySource,
  labelField?: string,
  valueField: string = 'value'
): string {
  if (!source.entity?.value) {
    throw new Error('Entity source must have entity.value');
  }

  const data: Record<string, string> = {};

  // 收集需要获取的字段
  const fields: string[] = [];

  // 从 labelField 中提取字段
  if (labelField) {
    const extractedFields = extractFieldsFromExpression(labelField);
    fields.push(...extractedFields);
  }

  // 添加 valueField
  fields.push(valueField);

  // 去重
  const uniqueFields = Array.from(new Set(fields.map(f => f.trim())));

  // 设置 __fields 参数
  uniqueFields.forEach((field, index) => {
    data[`__fields[${index}]`] = field;
  });

  // 处理 conditions
  if (source.conditions) {
    source.conditions.forEach(condition => {
      // 简单处理，假设 itemValue 不包含表达式
      // 实际使用时可能需要 evalJS
      data[`${condition.key}[eq]`] = condition.itemValue;
    });
  }

  // 处理 order
  if (source.order && source.order.length > 0) {
    data.orderFields = source.order
      .filter(item => item.key && item.mode)
      .map(({ key, mode }) => `${key}:${mode}`)
      .join(',');
  }

  const queryParams = objectToQueryString(data);
  const uniqueId = `u:${guid()}`;

  // 构建 URL
  if (source.entity.apiShareConfig) {
    const { appid, tenantId } = source.entity.apiShareConfig;
    return `model:appid=${appid}&tenantId=${tenantId}//${source.entity.value}-${encodeURIComponent(uniqueId)}${queryParams}`;
  } else {
    return `model://${source.entity.value}-${encodeURIComponent(uniqueId)}${queryParams}`;
  }
}
