
const createdByOption = {
    "label": "创建人",
    "value": "createdBy"
}
const serialNumberOption = {
    "label": "流水号",
    "value": "serial-number"
}
const updatedByOption = {
    "label": "更新人",
    "value": "updatedBy"
}

const createdAtOption = {
    "label": "创建时间",
    "value": "createdAt"
}
const updatedAtOption = {
    "label": "更新时间",
    "value": "updatedAt"
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
const appTenantOption = {
    "label": "租户编码",
    "value": "tenantCode"
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
const formulaOption = {
    "label": "公式",
    "value": "formula"
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

const relationOption = {
    "label": "关系",
    "value": "relation"
}

const primaryKeyOption = {
    "label": "主键",
    "value": "primary-key"
}
const doubleOption = {
    "label": "双精度浮点数",
    "value": "double"
}
const decimalOption = {
    "label": "定点数",
    "value": "decimal"
}
const datetimeRangeOption = {
    "label": "日期时间范围",
    "value": "datetime-range"
}
const timeRangeOption = {
    "label": "时间范围",
    "value": "time-range"
}
// export const allFieldOptions = [
//     textOption,
//     textareaOption,
//     intOption,
//     floatOption,
//     richTextOption,
//     passwordOption,
//     attachmentOption,
//     imageOption,
//     booleanOption,
//     ciphertextOption,
//     dateOption,
//     datetimeOption,
//     timeOption,
//     enumOption,
//     jsonOption,
//     moneyOption,
//     formulaOption,
//     userOption,
//     usersOption,
//     departmentOption,
//     dateRangeOption,
//     parentOption,
//     relationOption,
// ]
const textOptions = [
    textOption,
    primaryKeyOption,
    textareaOption,
    richTextOption,
    serialNumberOption,
    enumOption,
    booleanOption,
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
    jsonOption,
    parentOption,
    createdByOption,
    updatedByOption,
]
const intOptions = [
    intOption,
    primaryKeyOption,
    textOption,
    textareaOption,
    bigintOption,
    floatOption,
    doubleOption,
    decimalOption,
    richTextOption,
    moneyOption,
    serialNumberOption,
    enumOption,
    booleanOption,
    parentOption,
    createdByOption,
    updatedByOption,
    appTenantOption
]
const bigintOptions = [
    bigintOption,
    primaryKeyOption,
    textOption,
    textareaOption,
    doubleOption,
    decimalOption,
    richTextOption,
    moneyOption,
    serialNumberOption,
    parentOption,
    appTenantOption,
    createdByOption,
    updatedByOption
]
const datetimeOptions = [
    datetimeOption,
    dateOption,
    timeOption,
    textOption,
    textareaOption,
    richTextOption,
    createdAtOption,
    updatedAtOption
]
const dateOptions = [
    dateOption,
    datetimeOption,
    textOption,
    textareaOption,
    richTextOption,
    createdAtOption,
    updatedAtOption
]
const timeOptions = [
    timeOption,
    datetimeOption,
    textOption,
    textareaOption,
    richTextOption,
    createdAtOption,
    updatedAtOption
]

const floatOptions = [
    floatOption,
    doubleOption,
    decimalOption,
    textOption,
    textareaOption,
    richTextOption,
    moneyOption,
]
export const allOptions = {
    text: textOptions,
    int: intOptions,
    bigint: bigintOptions,
    datetime: datetimeOptions,
    date: dateOptions,
    time: timeOptions,
    float: floatOptions
}
