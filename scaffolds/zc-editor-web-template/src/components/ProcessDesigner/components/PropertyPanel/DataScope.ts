import {Evaluator, parse} from 'amis-formula';

export interface TreeItem {
  children?: TreeArray;
  [propName: string]: any;
}
export interface TreeArray extends Array<TreeItem> {}
/**
 * 类似于 arr.map 方法，此方法主要针对类似下面示例的树形结构。
 * [
 *     {
 *         children: []
 *     },
 *     // 其他成员
 * ]
 *
 * @param {Tree} tree 树形数据
 * @param {Function} iterator 处理函数，返回的数据会被替换成新的。
 * @return {Tree} 返回处理过的 tree
 */
export function mapTree<T extends TreeItem>(
  tree: Array<T>,
  iterator: (
    item: T,
    key: number,
    level: number,
    paths: Array<T>,
    indexes: Array<number>
  ) => T,
  level: number = 1,
  depthFirst: boolean = false,
  paths: Array<T> = [],
  indexes: Array<number> = []
) {
  return tree.map((item: any, index) => {
    if (depthFirst) {
      let children: TreeArray | undefined = item.children
        ? mapTree(
            item.children,
            iterator,
            level + 1,
            depthFirst,
            paths.concat(item),
            indexes.concat(index)
          )
        : undefined;
      children && (item = {...item, children: children});
      item = iterator(item, index, level, paths, indexes.concat(index)) || {
        ...(item as object)
      };
      return item;
    }

    item = iterator(item, index, level, paths, indexes.concat(index)) || {
      ...(item as object)
    };

    if (item.children && item.children.splice) {
      item.children = mapTree(
        item.children,
        iterator,
        level + 1,
        depthFirst,
        paths.concat(item),
        indexes.concat(index)
      );
    }

    return item;
  });
}
/**
 * 将例如像 a.b.c 或 a[1].b 的字符串转换为路径数组
 *
 * @param string 要转换的字符串
 */
export const keyToPath = (string: string = '') => {
  const result = [];

  if (string.charCodeAt(0) === '.'.charCodeAt(0)) {
    result.push('');
  }

  string.replace(
    new RegExp(
      '[^.[\\]]+|\\[(?:([^"\'][^[]*)|(["\'])((?:(?!\\2)[^\\\\]|\\\\.)*?)\\2)\\]|(?=(?:\\.|\\[\\])(?:\\.|\\[\\]|$))',
      'g'
    ),
    (match, expression, quote, subString) => {
      let key = match;
      if (quote) {
        key = subString.replace(/\\(\\)?/g, '$1');
      } else if (expression) {
        key = expression.trim();
      }
      result.push(key);
      return '';
    }
  );

  return result;
};
export const DATASCHEMA_TYPE_MAP: {[type: string]: string} = {
  boolean: '布尔',
  integer: '整数',
  number: '数字',
  string: '文本',
  array: '数组',
  object: '对象'
};
/**
 * 生成 8 位随机数字。
 *
 * @return {string} 8位随机数字
 */
export function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + s4();
}

export type JSONSchema =  {
  group?: string; // 分组
  typeLabel?: string; // 类型说明
};

export class DataScope {
  // 指向父级
  parent?: DataScope;
  readonly children: Array<DataScope> = [];

  // 全局不能重复，用来快速定位
  readonly id: string;

  // todo 如果想要跨过层级直接获取某一层的数据域，用这个字段
  ref?: string;

  // scope 的名字，同一个层级不允许重名
  name?: string;

  // scope 分类
  tag?: string;

  // scope 分组（不同scope）
  group?: string;

  // scope 的描述信息
  description?: string;

  readonly schemas: Array<JSONSchema> = [];

  constructor(schemas: JSONSchema | Array<JSONSchema>, id: string) {
    this.setSchemas(Array.isArray(schemas) ? schemas : [schemas]);
    this.id = id;
  }

  addChild(id: string, schema?: JSONSchema | Array<JSONSchema>): DataScope {
    const child = new DataScope(
      schema || {
        type: 'object',
        properties: {}
      },
      id
    );

    this.children.push(child);
    child.parent = this;
    return child;
  }

  removeChild(idOrScope: string | DataScope) {
    const idx = this.children.findIndex(item =>
      typeof idOrScope === 'string' ? idOrScope === item.id : item === idOrScope
    );

    if (~idx) {
      const scope = this.children[idx];
      delete scope.parent;
      this.children.splice(idx, 1);
    }
  }

  setSchemas(schemas: Array<JSONSchema>) {
    this.schemas.splice(0, this.schemas.length);

    for (let schema of schemas) {
      if (schema.type !== 'object') {
        throw new TypeError('data scope accept only object');
      }
      this.schemas.push({
        $id: guid(),
        ...schema
      });
    }
    return this;
  }

  addSchema(schema: JSONSchema) {
    schema = {
      $id: guid(),
      ...schema
    };
    this.schemas.push(schema);
    return this;
  }

  removeSchema(id: string) {
    const idx = this.schemas.findIndex(schema => schema.$id === id);
    if (~idx) {
      this.schemas.splice(idx, 1);
    }
    return this;
  }

  contains(scope: DataScope) {
    let from: DataScope | undefined = scope;
    while (from) {
      if (this === from) {
        return true;
      }
      from = from.parent;
    }
    return false;
  }

  assignSchema(target: any, schema: any): any {
    // key相同，type也相同
    if (target.type && target.type === schema.type) {
      if (target.type === 'array') {
        // 先只考虑items，不考虑contains
        if (target.items) {
          if (Array.isArray(target.items)) {
            if (schema.items) {
              if (Array.isArray(schema.items)) {
                // 如果都是数组，就后者覆盖前者
                return schema.items;
              } else {
                // 否则，追加
                return {
                  ...target,
                  items: [...target.items, schema.items]
                };
              }
            } else {
              return {
                ...target,
                ...schema
              };
            }
          } else {
            // 非数组，则merge
            return {
              ...target,
              items: this.assignSchema(target.items, schema.items)
            };
          }
        } else {
          return schema;
        }
      } else if (target.type === 'object' && target.properties) {
        let properties: any = {};

        // 合并属性
        for (let key of Array.from(
          new Set([
            ...Object.keys(target.properties),
            ...Object.keys(schema.properties)
          ])
        )) {
          const value = target.properties[key];
          if (value) {
            properties[key] = schema.properties[key]
              ? this.assignSchema(value, schema.properties[key])
              : value;
          } else {
            properties[key] = schema.properties[key];
          }
        }
        return {
          ...target,
          properties
        };
      } else {
        return schema;
      }
    } else {
      // key相同、type不同
      if (Array.isArray(target.oneOf)) {
        return {
          ...target, // 先做个显示过度，因formula还没支持oneOf
          oneOf: [...target.oneOf, schema]
        };
      } else {
        return {
          ...target, // 先做个显示过度，因formula还没支持oneOf
          oneOf: [target, schema]
        };
      }
    }
  }

  getMergedSchema() {
    const mergedSchema: any = {
      type: 'object',
      properties: {}
    };

    this.schemas.forEach(schema => {
      const properties: any = schema.properties || {};
      Object.keys(properties).forEach(key => {
        const value = properties[key];
        if (mergedSchema.properties[key]) {
          mergedSchema.properties[key] = this.assignSchema(
            mergedSchema.properties[key],
            value
          );
        } else {
          mergedSchema.properties[key] = value;
        }
      });
    });

    return mergedSchema;
  }

  protected buildOptions(
    options: Array<any>,
    schema: JSONSchema,
    path: {label: string; value: string} = {label: '', value: ''},
    key: string = '',
    isMember?: boolean // 是否是数组成员
  ) {
    // todo 支持 oneOf, anyOf
    let option: any = {
      label: schema.title || key,
      value: schema.title === '成员' ? '' : path.value,
      path: schema.title === '成员' ? '' : path.label,
      type: schema.type,
      tag:
        schema.typeLabel ??
        DATASCHEMA_TYPE_MAP[schema.type as string] ??
        schema.type,
      description: schema.description,
      isMember,
      disabled: schema.title === '成员'
    };

    // 处理option分组
    if (schema.group) {
      const index = options.findIndex(item => item.label === schema.group);
      if (~index) {
        options[index].children.push(option);
      } else {
        options.push({
          label: schema.group,
          value: '',
          children: [option]
        });
      }
    } else {
      options.push(option);
    }

    if (schema.type === 'object' && schema.properties) {
      option.children = [];
      const keys = Object.keys(schema.properties);

      keys.forEach(key => {
        const child: any = schema.properties![key];
        this.buildOptions(
          option.children,
          child,
          {
            label: path.label + (path.label ? '.' : '') + (child.title ?? key),
            value: path.value + (path.value ? '.' : '') + key
          },
          key,
          schema.title === '成员'
        );
      });
    } else if (schema.type === 'array' && (schema.items as any)?.properties) {
      option.children = [];

      this.buildOptions(
        option.children,
        {
          title: '成员',
          ...(schema.items as any),
          disabled: true
        },
        {
          label: path.label,
          value: path.value
        },
        'items',
        schema.title === '成员'
      );

      option.children = mapTree(option.children, item => ({
        ...item
        // disabled: true
      }));
    }
  }

  getDataPropsAsOptions() {
    const variables: Array<any> = [];
    this.buildOptions(variables, this.getMergedSchema());
    return variables[0].children;
  }

  getSchemaByPath(path: string) {
    const parts = keyToPath(path);

    for (let schema of this.schemas) {
      const result = parts.reduce((schema: JSONSchema, key: string) => {
        if (schema && schema.type === 'object' && schema.properties) {
          return schema.properties[key] as JSONSchema;
        }

        return null;
      }, schema);

      if (result) {
        return result;
      }
    }
    return null;
  }

  getSchemaById(id: string) {
    return this.schemas?.find(item => item.$id === id);
  }
}
export function assignSchema(target: any, schema: any): any {
  // key相同，type也相同
  if (target.type && target.type === schema.type) {
    if (target.type === 'array') {
      // 先只考虑items，不考虑contains
      if (target.items) {
        if (Array.isArray(target.items)) {
          if (schema.items) {
            if (Array.isArray(schema.items)) {
              // 如果都是数组，就后者覆盖前者
              return schema.items;
            } else {
              // 否则，追加
              return {
                ...target,
                items: [...target.items, schema.items]
              };
            }
          } else {
            return {
              ...target,
              ...schema
            };
          }
        } else {
          // 非数组，则merge
          return {
            ...target,
            items: assignSchema(target.items, schema.items)
          };
        }
      } else {
        return schema;
      }
    } else if (target.type === 'object' && target.properties) {
      let properties: any = {};

      // 合并属性
      for (let key of Array.from(
        new Set([
          ...Object.keys(target.properties),
          ...Object.keys(schema.properties)
        ])
      )) {
        const value = target.properties[key];
        if (value) {
          properties[key] = schema.properties[key]
            ? assignSchema(value, schema.properties[key])
            : value;
        } else {
          properties[key] = schema.properties[key];
        }
      }
      return {
        ...target,
        properties
      };
    } else {
      return schema;
    }
  } else {
    // key相同、type不同
    if (Array.isArray(target.oneOf)) {
      return {
        ...target, // 先做个显示过度，因formula还没支持oneOf
        oneOf: [...target.oneOf, schema]
      };
    } else {
      return {
        ...target, // 先做个显示过度，因formula还没支持oneOf
        oneOf: [target, schema]
      };
    }
  }
}
export function getMergedSchema(schemas) {
  console.log(schemas)
  const mergedSchema: any = {
    type: 'object',
    properties: {}
  };

  // schemas.forEach(schema => {
    const properties: any = schemas.properties || {};
    // const properties: any = schema.properties || {};
    Object.keys(properties).forEach(key => {
      const value = properties[key];
      if (mergedSchema.properties[key]) {
        mergedSchema.properties[key] = assignSchema(
          mergedSchema.properties[key],
          value
        );
      } else {
        mergedSchema.properties[key] = value;
      }
    });
  // });
console.log(mergedSchema,'mergedSchemamergedSchemamergedSchemamergedSchema')
  return mergedSchema;
}
export function getDataPropsAsOptions(e) {
  const variables: Array<any> = [];
  buildOptions(variables, getMergedSchema(e));
  console.log(variables[0].children,'variables[0].childrenvariables[0].childrenvariables[0].childrenvariables[0].children')
  return variables[0].children;
}
// 获取类型中文
const getTypeChinese = e => {
  var reg = /^[^\u4e00-\u9fa5]+$/;
    if(!reg.test(e)){
    return e
    }else{
      if (e == 'text') {
        return '单行文本';
      } else if (e == 'textarea') {
        return '多行文本';
      } else if (e == 'int') {
        return '整数(Int)';
      } else if (e == 'float') {
        return '小数';
      } else if (e == 'rich-text') {
        return '富文本';
      } else if (e == 'money') {
        return '金额';
      } else if (e == 'enum') {
        return '枚举';
      } else if (e == 'boolean') {
        return '布尔(开关)';
      } else if (e == 'date') {
        return '日期';
      } else if (e == 'datetime') {
        return '日期时间';
      } else if (e == 'date-range') {
        return '日期范围';
      } else if (e == 'time') {
        return '时间';
      } else if (e == 'attachment') {
        return '附件';
      } else if (e == 'image') {
        return '图片';
      } else if (e == 'user') {
        return '人员信息';
      } else if (e == 'users') {
        return '人员多选';
      } else if (e == 'department') {
        return '部门信息';
      } else if (e == 'password') {
        return '密码';
      } else if (e == 'ciphertext') {
        return '密文';
      } else if (e == 'serial-number') {
        return '流水号';
      } else if (e == 'json') {
        return 'JSON';
      } else if (e == 'formula') {
        return '公式';
      } else if (e == 'parent') {
        return '父级';
      } else if (!e) {
        return '整数';
      } else {
        return '对象';
      }
    }
};
export function buildOptions(
  options: Array<any>,
  schema: JSONSchema,
  path: {label: string; value: string} = {label: '', value: ''},
  key: string = '',
  isMember?: boolean // 是否是数组成员
) {
  let option: any = {
    label: schema.title || key,
    value: schema.title === '成员' ? '' : path.value,
    path: schema.title === '成员' ? '' : path.label,
    type: schema.type,
    tag:
      schema.typeLabel ??
      DATASCHEMA_TYPE_MAP[schema.type as string] ??
      getTypeChinese(schema.type),
    description: schema.description,
    isMember,
    disabled: schema.title === '成员'
  };
  console.log(option,'optionoptionoptionoptionoptionoption')

  // 处理option分组
  if (schema.group) {
    const index = options.findIndex(item => item.label === schema.group);
    if (~index) {
      options[index].children.push(option);
    } else {
      options.push({
        label: schema.group,
        value: '',
        children: [option]
      });
    }
  } else {
    options.push(option);
  }

  if (schema.type === 'object' && schema.properties) {
    option.children = [];
    const keys = Object.keys(schema.properties);

    keys.forEach(key => {
      const child: any = schema.properties![key];
      buildOptions(
        option.children,
        child,
        {
          label: path.label + (path.label ? '.' : '') + (child.title ?? key),
          value: path.value + (path.value ? '.' : '') + key
        },
        key,
        schema.title === '成员'
      );
    });
  } else if (schema.type === 'array' && (schema.items as any)?.properties) {
    option.children = [];

    buildOptions(
      option.children,
      {
        title: '成员',
        ...(schema.items as any),
        disabled: true
      },
      {
        label: path.label,
        value: path.value
      },
      'items',
      schema.title === '成员'
    );

    option.children = mapTree(option.children, item => ({
      ...item
      // disabled: true
    }));
  }
}
export async function getVariables(that: any) {
  let variablesArr: any[] = [];

  const {variables, requiredDataPropsVariables} = that.props;
  if (!variables || requiredDataPropsVariables) {
    // 从amis数据域中取变量数据
    const {node, manager} = that.props.formProps || that.props;
    let vars = await resolveVariablesFromScope(node, manager);
    if (Array.isArray(vars)) {
      if (!that.isUnmount) {
        variablesArr = vars;
      }
    }
  }
  if (variables) {
    if (Array.isArray(variables)) {
      variablesArr = [...variables, ...variablesArr];
    } else if (typeof variables === 'function') {
      variablesArr = [...variables(that), ...variablesArr];
    } else if (isExpression(variables)) {
      variablesArr = [
        ...resolveVariableAndFilter(
          that.props.variables as any,
          that.props.data,
          '| raw'
        ),
        ...variablesArr
      ];
    }
  }

  return variablesArr;
}
export const resolveVariableAndFilter = (
  path?: string,
  data: object = {},
  defaultFilter: string = '| html',
  fallbackValue = (value: any) => value
) => {
  if (!path || typeof path !== 'string') {
    return undefined;
  }

  try {
    const ast = parse(path, {
      evalMode: false,
      allowFilter: true
    });

    const ret = new Evaluator(data, {
      defaultFilter
    }).evalute(ast);

    return ret == null && !~path.indexOf('default') && !~path.indexOf('now')
      ? fallbackValue(ret)
      : ret;
  } catch (e) {
    console.warn(e);
    return undefined;
  }
};
// 用于判断是否优先使用value。
export function isExpression(expression: any): boolean {
  console.log(expression,'expression')
  // if (!expression || !isString(expression)) {
  //   // 非字符串类型，比如：Object、Array类型、boolean、number类型
  //   return false;
  // }
  // // 备注1: "\\${xxx}"不作为表达式，至少含一个${xxx}才算是表达式

  // // 备注2: safari 不支持 /(?<!\\)(\${).+(\})/.test(expression)
  // return /(^|[^\\])\$\{.+\}/.test(expression);
}
