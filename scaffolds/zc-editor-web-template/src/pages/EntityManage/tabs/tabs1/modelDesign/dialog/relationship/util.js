export function addValueToArray(arr, newValue) {
  // 辅助函数：获取某个值的后缀计数
  function getSuffixCount(value) {
    let count = 0;
    arr.forEach(item => {
      if (item.value.startsWith(value)) {
        const suffix = item.value.replace(value, '');
        if (/^\_\d+$/.test(suffix)) {
          count = Math.max(count, parseInt(suffix.slice(1), 10));
        }
      }
    });
    return count;
  }

  // 检查数组中是否已存在该值
  const existingItem = arr.find(item => item.value === newValue);

  if (existingItem) {
    // 值已存在，需要添加后缀
    const suffixCount = getSuffixCount(newValue);
    let newSuffix = 1;

    // 找到下一个可用的后缀
    while (arr.some(item => item.value === `${newValue}_${newSuffix}`)) {
      newSuffix++;
    }

    // 添加新的值
    arr.push({ value: `${newValue}_${newSuffix}` });
  } else {
    // 值不存在，直接添加
    arr.push({ value: newValue });
  }
}

function parseSuffix(field) {
  const match = field.match(/^(.*?)(?:_(\d+))$/);
  if (match) {
    return { base: match[1], suffix: parseInt(match[2], 10) };
  } else {
    return { base: field, suffix: 0 };
  }
}

export function checkAndRenameField(arr, field, key) {
  // 解析字段名中的后缀
  const { base, suffix } = parseSuffix(field);

  // 检查是否有重复的字段
  const isDuplicate = arr.some(item => item[key]!=null && item[key].toUpperCase() === field.toUpperCase());

  if (!isDuplicate) {
    return field;  // 如果没有重复，直接返回原始字段名
  } else {
    // 如果有重复，生成新的字段名
    const newSuffix = suffix + 1;
    const newFieldName = `${base}_${newSuffix}`;

    // 递归调用自身，检查新字段名是否仍然重复
    return checkAndRenameField(arr, newFieldName, key);
  }
}
