const pkOption = {
    "label": "主键",
    "value": "pk"
}
const serialNumberOption = {
    "label": "流水号",
    "value": "serial-number"
}
const datetimeRangeOption = {
    "label": "日期时间范围",
    "value": "datetime-range"
}
const timeRangeOption = {
    "label": "时间范围",
    "value": "time-range"
}
const createdByOption = {
    "label": "创建人",
    "value": "createdBy"
}
const updatedByOption = {
    "label": "更新人",
    "value": "updatedBy"
}
const deletedByOption = {
    "label": "删除人",
    "value": "deletedBy"
}
const createdAtOption = {
    "label": "创建时间",
    "value": "createdAt"
}
const updatedAtOption = {
    "label": "更新时间",
    "value": "updatedAt"
}
const deletedAtOption = {
    "label": "删除时间",
    "value": "deletedAt"
}
const doubleOption = {
    "label": "双精度浮点数",
    "value": "double"
}
const decimalOption = {
    "label": "定点数",
    "value": "decimal"
}
const textOption = {
    "label": "单行文本",
    "value": "text"
}
const textareaOption = {
    "label": "多行文本",
    "value": "textarea"
}
const intOption = {
    "label": "整数",
    "value": "int"
}
const bigintOption = {
    "label": "长整数",
    "value": "bigint"
}
const floatOption = {
    "label": "浮点数",
    "value": "float"
}
const richTextOption = {
    "label": "富文本",
    "value": "rich-text"
}
const passwordOption = {
    "label": "密码",
    "value": "password"
}

const attachmentOption = {
    "label": "附件",
    "value": "attachment"
}
const imageOption = {
    "label": "图片",
    "value": "image"
}
const booleanOption = {
    "label": "布尔(开关)",
    "value": "boolean"
}

const deletedOption = {
    "label": "删除标志",
    "value": "deleted"
}

const ciphertextOption = {
    "label": "密文",
    "value": "ciphertext"
}
const dateOption = {
    "label": "日期",
    "value": "date"
}
const datetimeOption = {
    "label": "日期时间",
    "value": "datetime"
}
const timeOption = {
    "label": "时间",
    "value": "time"
}
const enumOption = {
    "label": "枚举",
    "value": "enum"
}
const jsonOption = {
    "label": "JSON",
    "value": "json"
}
const moneyOption = {
    "label": "金额",
    "value": "money"
}
const userOption = {
    "label": "人员信息",
    "value": "user"
}
const usersOption = {
    "label": "人员多选",
    "value": "users"
}
const departmentOption = {
    "label": "部门信息",
    "value": "department"
}
const dateRangeOption = {
    "label": "日期范围",
    "value": "date-range"
}
const parentOption = {
    "label": "父级",
    "value": "parent"
}
const appTenantOption = {
    "label": "租户编码",
    "value": "tenantCode"
}
const timestampOption = {
    "label": "日期时间",
    "value": "timestamp"
}
const pkOptions = [
    pkOption
]
const varcharOptions = [
    textOption,
    serialNumberOption,
    enumOption,
    datetimeRangeOption,
    dateRangeOption,
    timeRangeOption,
    attachmentOption,
    imageOption,
    userOption,
    usersOption,
    departmentOption,
    passwordOption,
    ciphertextOption,
    parentOption,
    createdByOption,
    updatedByOption,
    deletedByOption
]
const textOptions = [
    textareaOption,
    richTextOption
]
const dateOptions = [
    dateOption
]
const datetimeOptions = [
    datetimeOption,
    createdAtOption,
    updatedAtOption,
    deletedAtOption
]
const timeOptions = [
    timeOption
]
const intOptions = [
    intOption,
    enumOption
]
const bigintOptions = [
    bigintOption,
    moneyOption,
    parentOption,
    appTenantOption,
]
const floatOptions = [
    floatOption
]
const doubleOptions = [
    doubleOption
]
const decimalOptions = [
    decimalOption
]
const bitOptions = [
    booleanOption,
    deletedOption
]
const jsonOptions = [
    jsonOption
]
const timestampOptions = [
    timestampOption
]
export const allOptions = {
    pk: pkOptions,
    varchar: varcharOptions,
    text: textOptions,
    date: dateOptions,
    datetime: datetimeOptions,
    time: timeOptions,
    int: intOptions,
    bigint: bigintOptions,
    float: floatOptions,
    double: doubleOptions,
    decimal: decimalOptions,
    bit: bitOptions,
    json: jsonOptions,
    timestamp: timestampOptions
}
