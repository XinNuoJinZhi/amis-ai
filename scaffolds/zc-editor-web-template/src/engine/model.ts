
/**
 * 字段
 */
export interface Column {

    /**
     * 唯一标识，对应数据库query_key
     */
    id: string

    /**
     * 英文名称，对应数据库code
     */
    key: string

    /**
     * 中文名称
     */
    name: string

    /**
     * 类型，如int、text，小写
     */
    type: string

    /**
     * 描述
     */
    description: string

    /**
     * 默认值模式，如null、static、expression，数据库中是枚举，需转换成字符串
     */
    defaultValueMode: string

    /**
     * 默认值
     */
    defaultValue: string | string[]

    /**
     * 注释
     */
    comment : string

    /**
     * 是否可空，对应数据库nullable
     */
    isNullable: boolean

    /**
     * 是否主键，根据数据库system_field_type=1判断
     */
    isPrimaryKey: boolean

    /**
     * 是否生成，根据数据库system_field_type=1判断
     */
    isGenerated: boolean

    /**
     * 是否外键，对应数据库foreign_key_flag
     */
    isForeignKey: boolean

    /**
     * 是否唯一，对应数据库unique_flag
     */
    isUnique: boolean

    /**
     * 排序
     */
    sort: number

    /**
     * 验证集合
     */
    validations: {

        /**
         * 最大长度
         */
        maxLength: number

        /**
         * 最小长度
         */
        minLength: number

        /**
         * 匹配正则
         */
        matchRegexp: string

    }

    /**
     * 验证错误集合
     */
    validationErrors: {

        /**
         * 最大长度
         */
        maxLength: string

        /**
         * 最小长度
         */
        minLength: string

        /**
         * 匹配正则
         */
        matchRegexp: string

    }

    /**
     * 系统字段类型
     */
    systemFieldType: number

    /**
     * 是否创建用户，根据数据库system_field_type=2判断
     */
    isCreateUser?: boolean

    /**
     * 是否更新用户，根据数据库system_field_type=3判断
     */
    isUpdateUser?: boolean

    /**
     * 是否创建时间，根据数据库system_field_type=4判断
     */
    isCreateDate?: boolean

    /**
     * 是否更新时间，根据数据库system_field_type=5判断
     */
    isUpdateDate?: boolean

    /**
     * 是否删除时间，根据数据库system_field_type=6判断
     */
    isDeleteDate?: boolean

    /**
     * 是否删除用户，根据数据库system_field_type=7判断
     */
    isDeleteUser?: boolean

    /**
     * 是否删除标志，根据数据库system_field_type=8判断
     */
    isDeleteFlag?: boolean

    /**
     * 是否租户编码，根据数据库system_field_type=9判断
     */
    isTenantCode?: boolean

}

/**
 * 文本字段
 */
export interface TextColumn extends Column {

    /**
     * 长度
     */
    length: number

    /**
     * 格式，如email
     */
    format: string

    /**
     * 格式消息
     */
    formatMsg: string

}

/**
 * 整数字段
 */
export interface IntColumn extends Column {

    /**
     * 数据库类型，INT BIGINT
     */
    dbType: string

}

/**
 * 小数字段
 */
export interface FloatColumn extends Column {

    /**
     * 数据库类型，DOUBLE、FLOAT、DECIMAL
     */
    dbType: string

    /**
     * 精度，如10
     */
    precision: number

    /**
     * 范围，如4
     */
    scale: number

}

/**
 * 布尔字段
 */
export interface BoolColumn extends Column {

    /**
     * 真值文字
     */
    onText: string

    /**
     * 假值文字
     */
    offText: string

}

/**
 * 日期时间字段
 */
export interface DatetimeColumn extends Column {

    /**
     * 显示精度
     */
    showPrecision: number

    /**
     * 兼容模式
     */
    precisionCompatible: boolean

}

/**
 * 时间字段
 */
export interface TimeColumn extends Column {

    /**
     * 显示精度
     */
    showPrecision: number

    /**
     * 兼容模式
     */
    precisionCompatible: boolean

}

/**
 * 日期范围字段
 */
export interface DateRangeColumn extends Column {

    /**
     * 数据库类型，date、time、datetime
     */
    dbType: string

    /**
     * 最小日期
     */
    minDate: number

    /**
     * 最大日期
     */
    maxDate: number

    /**
     * 最小日期提示
     */
    minDateMsg: string

    /**
     * 最大日期提示
     */
    maxDateMsg: string

}

/**
 * 密码字段
 */
export interface PasswordColumn extends Column {

    /**
     * 盐
     */
    salt: string

}

/**
 * 加密字段
 */
export interface CipherTextColumn extends Column {

    /**
     * 密钥
     */
    token: string

}

/**
 * 附件字段
 */
export interface AttachmentColumn extends Column {

    /**
     * 文件配置名称
     */
    driver: string

    /**
     * 接受
     */
    accept: string

    /**
     * 最大大小
     */
    maxSize: number

}

/**
 * 图片字段
 */
export interface ImageColumn extends Column {

    /**
     * 文件配置名称
     */
    driver: string

    /**
     * 允许类型
     */
    allowedTypes: string[]

    /**
     * 图片比例，如custom
     */
    restrictRatio: string

    /**
     * 自定义图片比例
     */
    restrictRatioCustom: number

    /**
     * 最大大小
     */
    maxSize: number

}

/**
 * 枚举字段
 */
export interface EnumColumn extends Column {

    /**
     * 数据库类型，VARCHAR、INTEGER
     */
    dbType: string

    /**
     * 选项集合
     */
    options?: { label: string, value: string }[]

    /**
     * 接口地址，如 app://dictionary/running/list?level=2&encoded=dict2
     */
    source?: string

}

/**
 * 货币字段
 */
export interface MoneyColumn extends Column {

    /**
     * 货币
     */
    currency: { icon: string, label: string, value: string }

}

/**
 * 人员字段
 */
export interface UserColumn extends Column {

    /**
     * 允许输入
     */
    allowInput: boolean

}

/**
 * 公式字段
 */
export interface FormulaColumn extends Column {

    /**
     * 公式
     */
    formula: string

}

/**
 * 关系
 */
export interface Relation {

    /**
     * 唯一标识，对应数据库query_key
     */
    id: string

    /**
     * 英文名称，对应数据库code
     */
    key: string

    /**
     * 名称
     */
    name: string

    /**
     * 关系模式，如 1:1
     */
    relationMode: string

    /**
     * 描述
     */
    description: string

    /**
     * 目标表唯一标识，对应数据库target_key
     */
    target: string

    /**
     * 目标表英文名称，对应数据库target_code
     */
    targetKey: string

    /**
     * 目标表中文名称
     */
    targetName: string

    /**
     * 字段唯一标识，对应数据库field_key
     */
    fieldId: string

    /**
     * 外键字段英文名称
     */
    foreignKey: string

    /**
     * 是否可空，对应数据库nullable
     */
    isNullable: boolean

    /**
     * 级联删除
     */
    cascadeRemove: boolean

    /**
     * 反向关系唯一标识，对应数据库inverse_side_key
     */
    inverseSide: string

    /**
     * 排序
     */
    sort: number

    /**
     * 显示类型，如embed
     */
    displayType: string

    /**
     * 显示字段集合
     */
    displayColumns: string[]

    /**
     * 显示模板
     */
    displayTpl: string

    /**
     * 自动填充
     */
    autoFills: { to: string, from: string }[]

    /**
     * 输入类型，如select
     */
    inputType: string

    /**
     * 输入字段集合
     */
    inputColumns: string[]

    /**
     * 是否输入可新增
     */
    inputCreateable: boolean

    /**
     * 是否输入可编辑
     */
    inputEditable: boolean

    /**
     * 是否输入可删除
     */
    inputRemovable: string

    /**
     * 是否快速编辑
     */
    quickEdit: boolean

    /**
     * 快速编辑设置
     */
    quickEditSettings: {

        /**
         * 输入类型，如select
         */
        inputType: string

        /**
         * 自动填充
         */
        autoFills: { to: string, from: string }[]

        /**
         * 输入字段集合
         */
        inputColumns: string[]

        /**
         * 是否输入可新增
         */
        inputCreateable: boolean

        /**
         * 是否输入可编辑
         */
        inputEditable: boolean

        /**
         * 是否输入可删除
         */
        inputRemovable: string

    }

}

/**
 * 关系
 */
export interface NNRelation extends Relation {

    /**
     * 包含自定义属性
     */
    withCustomProps: boolean

    /**
     * 中间表
     */
    joinTable: {

        /**
         * 中间表英文名称
         */
        key: string

        /**
         * 连接字段
         */
        joinColumn: {

            /**
             * 字段英文名称
             */
            key: string

        }

        /**
         * 反向连接字段
         */
        inverseJoinColumn: {

            /**
             * 字段英文名称
             */
            key: string

        }

    }

}

/**
 * 表
 */
export interface Table {

    /**
     * 唯一标识，对应数据库query_key
     */
    id: string

    /**
     * 英文名称，对应数据库code
     */
    key: string

    /**
     * 中文名称
     */
    name: string

    /**
     * 类型，0. normal 1. middleWithData 2. middle
     */
    type: number

    /**
     * 描述
     */
    description: string

    /**
     * 数据源，对应数据库ds_key
     */
    dsId: string

    /**
     * 数据源英文名称，对应数据库数据源的code
     */
    dsKey: string

    /**
     * 名称字段，如id
     */
    nameField: string

    /**
     * 父级字段，如parentId
     */
    parentField: string

    /**
     * 父级字段，如id
     */
    primaryField: string

    /**
     * 标题模板，如${code}_${name}
     */
    titleTpl: string

    /**
     * 是否软删除
     */
    useSoftDelete: boolean

    /**
     * 是否是树
     */
    isTree: boolean

    /**
     * 树模式，如materialized-path，数据库中是枚举，需转换成字符串
     */
    treePattern: string

    /**
     * 排序
     */
    sort: number

    /**
     * 字段集合
     */
    fields: Array<Column | TextColumn | FloatColumn | DateRangeColumn | PasswordColumn | CipherTextColumn | AttachmentColumn | ImageColumn | EnumColumn | MoneyColumn | UserColumn | FormulaColumn>

    /**
     * 关系集合
     */
    relations: Array<Relation | NNRelation>

}
