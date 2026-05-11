/**
 * 公式函数库
 * 用于代码生成器生成的页面中使用的自定义函数
 */

/**
 * 字符串连接函数
 * @param args 要连接的字符串或值
 * @returns 连接后的字符串
 */
export function CONCATENATE(...args: any[]): string {
  return args
    .map(arg => {
      // 处理 null 和 undefined
      if (arg == null) {
        return '';
      }
      return String(arg);
    })
    .join('');
}

/**
 * 年份函数 - 获取当前年份
 * @param date 日期对象或日期字符串，默认为当前日期
 * @returns 年份
 */
export function YEAR(date?: Date | string): number {
  const d = date ? new Date(date) : new Date();
  return d.getFullYear();
}

/**
 * 当前日期时间函数
 * @returns 当前日期时间
 */
export function NOW(): Date {
  return new Date();
}

/**
 * 逻辑判断函数
 * @param condition 条件
 * @param trueValue 条件为真时的值
 * @param falseValue 条件为假时的值
 * @returns 结果
 */
export function IF(condition: any, trueValue: any, falseValue: any): any {
  return condition ? trueValue : falseValue;
}

/**
 * 求平均值函数
 * @param args 数值列表
 * @returns 平均值
 */
export function AVG(...args: any[]): number {
  const validArgs = args.filter(arg => typeof arg === 'number' && !isNaN(arg));
  if (validArgs.length === 0) return 0;
  const sum = validArgs.reduce((a, b) => a + b, 0);
  return parseFloat((sum / validArgs.length).toFixed(2));
}

/**
 * 求和函数
 * @param args 数值列表
 * @returns 总和
 */
export function SUM(...args: any[]): number {
  return args.reduce((sum, current) => {
    const val = parseFloat(current);
    return isNaN(val) ? sum : sum + val;
  }, 0);
}

/**
 * 最大值函数
 * @param args 数值列表
 * @returns 最大值
 */
export function MAX(...args: any[]): number {
  const validArgs = args.filter(arg => typeof arg === 'number' || (typeof arg === 'string' && !isNaN(parseFloat(arg)))).map(Number);
  if (validArgs.length === 0) return 0;
  return Math.max(...validArgs);
}

/**
 * 最小值函数
 * @param args 数值列表
 * @returns 最小值
 */
export function MIN(...args: any[]): number {
  const validArgs = args.filter(arg => typeof arg === 'number' || (typeof arg === 'string' && !isNaN(parseFloat(arg)))).map(Number);
  if (validArgs.length === 0) return 0;
  return Math.min(...validArgs);
}

/**
 * 整数转换函数
 * @param value 值
 * @returns 整数
 */
export function INT(value: any): number {
  return parseInt(value, 10) || 0;
}

/**
 * 浮点数转换函数
 * @param value 值
 * @returns 浮点数
 */
export function FLOAT(value: any): number {
  return parseFloat(value) || 0;
}

/**
 * 四舍五入函数
 * @param number 数值
 * @param precision 精度，默认为 2
 * @returns 结果
 */
export function ROUND(number: any, precision: number = 2): number {
  const num = parseFloat(number);
  if (isNaN(num)) return 0;
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
}

/**
 * 构造日期对象
 * @param year 年
 * @param month 月 (1-12)
 * @param day 日
 * @param hour 时
 * @param minute 分
 * @param second 秒
 * @returns Date 对象
 */
export function DATE(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): Date {
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * 日期转时间戳
 * @param date 日期
 * @param format 格式，'x' 为毫秒，'X' 为秒
 * @returns 时间戳
 */
export function TIMESTAMP(date: any, format: string = 'x'): number {
  const d = date instanceof Date ? date : new Date(date);
  const time = d.getTime();
  return format === 'X' ? Math.floor(time / 1000) : time;
}

/**
 * 日期转字符串
 * @param date 日期
 * @param format 格式字符串 (YYYY-MM-DD 等)
 * @returns 格式化后的日期字符串
 */
export function DATETOSTR(date: any, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const map: Record<string, number> = {
    'M+': d.getMonth() + 1, // 月份
    'D+': d.getDate(), // 日
    'H+': d.getHours(), // 小时
    'm+': d.getMinutes(), // 分
    's+': d.getSeconds(), // 秒
    'q+': Math.floor((d.getMonth() + 3) / 3), // 季度
    'S': d.getMilliseconds() // 毫秒
  };

  if (/(Y+)/.test(format)) {
    format = format.replace(RegExp.$1, (d.getFullYear() + '').substr(4 - RegExp.$1.length));
  }

  for (const k in map) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (map[k] + '') : (('00' + map[k]).substr(('' + map[k]).length)));
    }
  }
  return format;
}

/**
 * 金额大写转换函数
 * @param n 金额数值
 * @returns 大写金额字符串
 */
export function UPPERMONEY(n: any): string {
  let num = parseFloat(n);
  if (isNaN(num)) return '';

  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']];
  const head = num < 0 ? '欠' : '';
  num = Math.abs(num);

  let s = '';
  for (let i = 0; i < fraction.length; i++) {
    s += (digit[Math.floor(num * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
  }
  s = s || '整';
  num = Math.floor(num);

  for (let i = 0; i < unit[0].length && num > 0; i++) {
    let p = '';
    for (let j = 0; j < unit[1].length && num > 0; j++) {
      p = digit[num % 10] + unit[1][j] + p;
      num = Math.floor(num / 10);
    }
    s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
  }
  return head + s.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整');
}
