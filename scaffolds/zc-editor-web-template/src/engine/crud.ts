import {
  BoolColumn,
  Column,
  DateRangeColumn, DatetimeColumn,
  EnumColumn,
  FloatColumn,
  IntColumn,
  MoneyColumn,
  Relation,
  Table,
  TextColumn, TimeColumn
} from "./model";
import { genForm, getFormItem } from "./form";
import { getCrudOrViewRelationColumn, handleService } from "./relation";
import { generateDateTimeRegexStr, getFormatStringByPrecision, isAppEnd } from "@/utils";

function getLabelNameMap(fields: Column[], relations: Relation[], tables: Table[]) {
  const r = {};
  for (let c of fields) {
    // if (!c.isForeignKey) {
    //   if (c.type != 'relation') {
    //     r[c.name] = c.key;
    //   } else {
    //     const relation = relations.filter(i => i.key == c.key)[0];
    //     const table = tables.filter(i => i.key == relation.targetKey)[0];
    //     r[c.key] = c.key + '.' + table.nameField;
    //     for (let rc of table.fields) {
    //       if (!rc.isDeleteUser && !rc.isDeleteDate && !rc.isDeleteFlag && !rc.isTenantCode) {
    //         r[c.key + '.' + rc.name] = c.key + '.' + rc.key;
    //       }
    //     }
    //   }
    // }
    if (!c.isForeignKey && !c.isDeleteUser && !c.isDeleteDate && !c.isDeleteFlag && !c.isTenantCode) {
      r[c.name] = c.key;
    }
  }
  return r;
}

function getNameLabelMap(fields: Column[], relations: Relation[], tables: Table[]) {
  const r = {};
  for (let c of fields) {
    // if (!c.isForeignKey) {
    //   if (c.type != 'relation') {
    //     r[c.key] = c.name;
    //   } else if (!c.isDeleteUser && !c.isDeleteDate && !c.isDeleteFlag && !c.isTenantCode) {
    //     const relation = relations.filter(i => i.key == c.key)[0];
    //     const table = tables.filter(i => i.key == relation.targetKey)[0];
    //     for (let rc of table.fields) {
    //       if (!rc.isDeleteUser && !rc.isDeleteDate && !rc.isDeleteFlag && !c.isTenantCode) {
    //         r[c.key + '.' + rc.key] = c.key + '.' + rc.name;
    //       }
    //     }
    //   }
    // }
    if (!c.isForeignKey && !c.isDeleteUser && !c.isDeleteDate && !c.isDeleteFlag && !c.isTenantCode) {
      r[c.key] = c.name;
    }
  }
  return r;
}

export function getFields(fields: Column[], relations: Relation[], forForm: boolean, filter?: (c: Column) => boolean) {
  return fields.filter(c => {
    if (!forForm && c.type == 'relation') {
      const relation = relations.filter(i => i.key == c.key)[0];
      if ((relation.relationMode == '1:n' || relation.relationMode == 'n:n')
        && (relation.displayType == null || relation.displayType == ''
          || relation.displayType == 'dialog' || relation.displayType == 'drawer')
      ) {
        return false;
      }
    }
    let r = !c.isDeleteUser && !c.isDeleteDate && !c.isDeleteFlag && !c.isTenantCode;
    if (forForm) {
      r = r && !c.isPrimaryKey && !c.isCreateUser && !c.isCreateDate && !c.isUpdateUser && !c.isUpdateDate;
    }
    if (filter == null) {
      return r;
    }
    if (filter(c)) {
      return r;
    } else if (c.isForeignKey) {
      const relation = relations.filter(i => i.foreignKey == c.key)[0];
      if (relation != null
        && (relation.relationMode == "1:1" && relation.inverseSide == null || relation.relationMode == "n:1")) {
        return filter(fields.filter(i => i.key == relation.key)[0])
      }
      return false;
    }
    return false;
  });
}

const typeConfig = {
  "int": {type: "native-number", searchableType: "input-number", static: true}, // type 由input-number 改为native-number，是因为精度丢失问题
  "float": {type: "input-number", searchableType: "input-number", static: true},
  "text": {type: "text", searchableType: "input-text", static: null},
  "textarea": {type: "static-tpl", searchableType: "input-text", static: null},
  "rich-text": {type: "static-tpl", static: null},
  "password": {type: "static-tpl", static: null},
  "attachment": {type: "static-tpl", static: null},
  "boolean": {type: "switch", searchableType: "button-group-select", static: true},
  "ciphertext": {type: "textarea", static: true},
  "date": {type: "input-date", searchableType: "input-date", static: true},
  "datetime": {type: "input-datetime", searchableType: "input-datetime", static: true},
  "time": {type: "input-time", searchableType: "input-time", static: true},
  "enum": {type: "mapping", searchableType: "select", static: null},
  "image": {type: "static-image", static: null},
  "json": {type: "static-json", searchableType: "editor", static: null},
  "money": {type: "input-number", searchableType: "input-number", static: true},
  "user": {type: "static-mapping", searchableType: "user-select", static: true},
  "users": {type: "static-mapping", static: true},
  "department": {type: "static-mapping", searchableType: "tree-select", static: true},
  "date-range": {type: "static-tpl", searchableType: "input-date-range", static: null},
  "formula": {type: "static-json", static: null},
  "parent": {type: "static-mapping", searchableType: "tree-select", static: true},
  "serial-number": {type: "static-text", searchableType: "input-text", static: true},
}

export function getColumns(table: Table, tables: Table[], searchable: boolean = true, quickEdit: boolean = false,
                           isStatic: boolean = false, ref?: string[] | null, filter?: (c: Column) => boolean,
                           picker: boolean = false, _replaceQuickEdit: boolean = false, dataManagePermission: boolean = true) {
  return table.fields.filter(c => {
    const r = !c.isDeleteUser && !c.isDeleteDate && !c.isDeleteFlag && !c.isTenantCode && !c.isForeignKey;
    if (filter == null) {
      return r;
    }
    return r && filter(c);
  }).map(c => {
    let column: any;
    if (c.type != 'relation') {
      const tc = typeConfig[c.type] != null ? typeConfig[c.type] : {};
      column = {
        type: tc.type,
        name: c.key,
        label: c.name,
        description: c.description,
        static: tc.static,
      };
      if (searchable) {
        column.searchable = {
          type: tc.searchableType,
          name: c.key,
          label: c.name,
          placeholder: "请输入",
          validations: c.validations != null ? Object.assign({}, c.validations) : {},
          validationErrors: c.validationErrors != null ? Object.assign({}, c.validationErrors) : {},
          clearable: true,
          style: { minWidth: "193px" }
        };
      }
      if (c.type == 'int' || c.type == 'float') {
        column.kilobitSeparator = false;
        column.suffix = "";
        if (c.type == 'int') {
          if (c.isPrimaryKey) {
            column.width = 160;
          }
          const intc = c as IntColumn;
          if (intc.dbType == 'BIGINT') {
            if (searchable) {
              column.searchable.big = true;
            }
          }
        } else {
          column.precision = (c as FloatColumn).scale;
          if (searchable) {
            column.searchable = {
              label: column.label,
              type: "group",
              body: [
                {
                  type: "input-number",
                  name: c.key + "[bt][from]",
                  size: "sm",
                  placeholder: "开头",
                  precision: column.precision,
                  validations: {},
                  validationErrors: {},
                  clearable: true,
                  mode: "inline"
                },
                {
                  type: "input-number",
                  name: c.key + "[bt][to]",
                  size: "sm",
                  placeholder: "结尾",
                  precision: column.precision,
                  validations: {},
                  validationErrors: {},
                  clearable: true,
                  mode: "inline"
                }
              ]
            };
          }
        }
      } else if (c.type == 'text') {
        if (isStatic) {
          column.type = 'static';
        }
        const textc = c as TextColumn;
        if (textc.length == null || textc.length == '') {
          textc.length = 255;
        }
        if (searchable) {
          if (column.searchable.validations.maxLength == null || column.searchable.validations.maxLength == '') {
            column.searchable.validations.maxLength = textc.length;
          } else if (column.searchable.validations.maxLength > textc.length) {
            column.searchable.validations.maxLength = textc.length;
          }
          if (column.searchable.validationErrors.maxLength == null || column.searchable.validationErrors.maxLength == '') {
            column.searchable.validationErrors.maxLength = '长度超出限制';
          }
        }
        if (textc.format == 'email') {
          column.type = isStatic ? 'static-link' : 'link';
          column.href = "mailto:${" + c.key + "}";
          column.body = "${" + c.key + "}";
          if (searchable) {
            column.searchable.type = "input-email";
            column.searchable.placeholder = "请输入邮箱地址";
            column.searchable.validations.isEmail = true;
            column.searchable.validationErrors.isEmail = textc.formatMsg;
          }
        } else if (textc.format == 'url') {
          column.type = isStatic ? 'static-link' : 'link';
          if (searchable) {
            column.searchable.type = "input-url";
            column.searchable.placeholder = "请输入网址";
            column.searchable.validations.isUrl = true;
            column.searchable.validationErrors.isUrl = textc.formatMsg;
          }
        } else if (textc.format == 'id') {
          if (searchable) {
            column.searchable.placeholder = "请输入身份证号";
            column.searchable.validations.isId = true;
            column.searchable.validationErrors.isId = textc.formatMsg;
          }
        } else if (textc.format == 'phone') {
          column.type = isStatic ? 'static-link' : 'link';
          column.href = "tel:${" + c.key + "}";
          column.body = "${" + c.key + "}";
          if (searchable) {
            column.searchable.placeholder = "请输入手机号码";
            column.searchable.validations.isPhoneNumber = true;
            column.searchable.validationErrors.isPhoneNumber = textc.formatMsg;
          }
        } else if (textc.format == 'tel') {
          column.type = isStatic ? 'static-link' : 'link';
          column.href = "tel:${" + c.key + "}";
          column.body = "${" + c.key + "}";
          if (searchable) {
            column.searchable.placeholder = "请输入电话号码";
            column.searchable.validations.isTelNumber = true;
            column.searchable.validationErrors.isTelNumber = textc.formatMsg;
          }
        } else if (textc.format == 'zipcode') {
          if (searchable) {
            column.searchable.placeholder = "请输入邮编号码";
            column.searchable.validations.isZipcode = true;
            column.searchable.validationErrors.isZipcode = textc.formatMsg;
          }
        } else if (textc.format == 'color') {
          column.type = isStatic ? 'static-color' : 'color';
          if (searchable) {
            column.searchable.type = "input-color";
            column.searchable.placeholder = "请输入颜色";
          }
        } else if (textc.format == 'year') {
          if (searchable) {
            column.searchable.type = "select";
            column.searchable.placeholder = "请选择年份";
            column.searchable.searchable = true;
            column.searchable.options = [];
            for (let i = 1901; i < 2156; i++) {
              column.searchable.options.push({label: i, value: i})
            }
          }
        }
      } else if (c.type == 'textarea') {
        column.tpl = '${' + c.key + '}';
        if (searchable) {
          delete column.searchable.placeholder;
          delete column.searchable.validations;
          delete column.searchable.validationErrors;
        }
      } else if (c.type == 'rich-text') {
        column.tpl = '${' + c.key + '|raw}';
        column.className = "me-Richtext-view";
        column.width = 300;
        if (searchable) {
          delete column.searchable;
        }
      } else if (c.type == 'password') {
        column.tpl = '******';
        if (searchable) {
          delete column.searchable;
        }
      } else if (c.type == 'attachment') {
        column.tpl = "<% let value = data && data['" + c.key + "'];%><% if (value) { %>\n        <%\n          let file = value;\n          try {\n            file = typeof file === 'string' ? JSON.parse(file) : file;\n          } catch {\n            file = {}\n          }\n          let url = file.url;\n          let a = document.createElement('a');\n          a.href = url;\n        %>\n          <a target=\"_blank\" href=\"<%= url %>\" download><%- file.name %></a>\n        <% } else {%>\n          -\n        <% }%>\n        ";
        if (searchable) {
          delete column.searchable;
        }
      } else if (c.type == 'boolean') {
        const boolc = c as BoolColumn;
        column.onText = boolc.onText ? boolc.onText : "开";
        column.offText = boolc.offText ? boolc.offText : "关";
        if (searchable) {
          column.searchable.size = "sm";
          column.searchable.value = "";
          column.searchable.options = [
            {
              "label": "全部",
              "value": ""
            },
            {
              "label": boolc.onText ? boolc.onText : "开",
              "value": true
            },
            {
              "label": boolc.offText ? boolc.offText : "关",
              "value": false
            }
          ];
          column.searchable.clearable = true;
          delete column.searchable.placeholder;
          delete column.searchable.validations;
          delete column.searchable.validationErrors;
        }
      } else if (c.type == 'ciphertext') {
        if (searchable) {
          delete column.searchable;
        }
      } else if (c.type == 'date') {
        column.format = "YYYY-MM-DD";
        column.inputFormat = "YYYY-MM-DD";
        if (searchable) {
          const shortcuts = [
            "thismonth",
            "thisweek",
            "yesterday",
            "today",
            "tomorrow",
            "endofthisweek",
            "endofthismonth"
          ];
          column.searchable = {
            label: column.label,
            type: "group",
            body: [
              {
                type: "input-date",
                name: c.key + "[bt][from]",
                size: "sm",
                timeFormat: "",
                format: "YYYY-MM-DD",
                valueFormat: "YYYY-MM-DD",
                inputFormat: "YYYY-MM-DD",
                displayFormat: "YYYY-MM-DD",
                shortcuts,
                validations: {},
                validationErrors: {},
                clearable: true,
                placeholder: "开头",
                mode: "inline"
              },
              {
                type: "input-date",
                name: c.key + "[bt][to]",
                size: "sm",
                timeFormat: "",
                format: "YYYY-MM-DD",
                valueFormat: "YYYY-MM-DD",
                inputFormat: "YYYY-MM-DD",
                displayFormat: "YYYY-MM-DD",
                shortcuts,
                validations: {},
                validationErrors: {},
                clearable: true,
                placeholder: "结尾",
                mode: "inline"
              }
            ]
          };
        }
      } else if (c.type == 'datetime') {
        const dtc = c as DatetimeColumn;
        const compatible = dtc.precisionCompatible || dtc.showPrecision <= 3;
        const formatString = getFormatStringByPrecision("YYYY-MM-DD HH:mm:ss", dtc.showPrecision, dtc.precisionCompatible);
        if (compatible) {
          column.format = formatString;
          column.inputFormat = column.format;
          if (searchable) {
            const shortcuts = [
              "thismonth",
              "thisweek",
              "yesterday",
              "today",
              "now",
              "tomorrow",
              "endofthisweek",
              "endofthismonth"
            ];
            column.searchable = {
              label: column.label,
              type: "group",
              body: [
                {
                  type: "input-datetime",
                  name: c.key + "[bt][from]",
                  size: "sm",
                  timeFormat: column.format,
                  format: column.format,
                  valueFormat: column.format,
                  inputFormat: column.format,
                  displayFormat: column.format,
                  shortcuts,
                  validations: {},
                  validationErrors: {},
                  clearable: true,
                  placeholder: "开头",
                  mode: "inline"
                },
                {
                  type: "input-datetime",
                  name: c.key + "[bt][to]",
                  size: "sm",
                  timeFormat: column.format,
                  format: column.format,
                  valueFormat: column.format,
                  inputFormat: column.format,
                  displayFormat: column.format,
                  shortcuts,
                  validations: {},
                  validationErrors: {},
                  clearable: true,
                  placeholder: "结尾",
                  mode: "inline"
                }
              ]
            };
          }
        } else {
          column.type = "static-tpl";
          column.searchable = {
            type: "input-text",
            label: column.name,
            name: column.key,
            required: false,
            clearable: true,
            placeholder: '请输入日期以及时间',
            validations: {
              matchRegexp: generateDateTimeRegexStr(formatString)
            },
            validationErrors: {
              matchRegexp: `请输入正确的日期时间格式（${formatString}）`
            }
          }
        }
      } else if (c.type == 'time') {
        const tc = c as TimeColumn;
        const compatible = tc.precisionCompatible || tc.showPrecision <= 3;
        const formatString = getFormatStringByPrecision("HH:mm:ss", tc.showPrecision, tc.precisionCompatible);
        if (compatible) {
          column.format = formatString;
          column.inputFormat = column.format;
          if (searchable) {
            const shortcuts = [
              "12hoursago",
              "6hoursago",
              "1hoursago",
              "now",
              "1hourslater",
              "6hourslater",
              "12hourslater"
            ];
            column.searchable = {
              label: column.label,
              type: "group",
              body: [
                {
                  type: "input-time",
                  name: c.key + "[bt][from]",
                  size: "sm",
                  timeFormat: column.format,
                  format: column.format,
                  valueFormat: column.format,
                  inputFormat: column.format,
                  displayFormat: column.format,
                  shortcuts,
                  validations: {},
                  validationErrors: {},
                  clearable: true,
                  placeholder: "开头",
                  mode: "inline"
                },
                {
                  type: "input-time",
                  name: c.key + "[bt][to]",
                  size: "sm",
                  timeFormat: column.format,
                  format: column.format,
                  valueFormat: column.format,
                  inputFormat: column.format,
                  displayFormat: column.format,
                  shortcuts,
                  validations: {},
                  validationErrors: {},
                  clearable: true,
                  placeholder: "结尾",
                  mode: "inline"
                }
              ]
            };
          }
        } else {
          column.type = "static-tpl";
          column.searchable = {
            type: "input-text",
            label: column.name,
            name: column.key,
            required: false,
            clearable: true,
            placeholder: '请输入时间',
            validations: {
              matchRegexp: generateDateTimeRegexStr(formatString)
            },
            validationErrors: {
              matchRegexp: `请输入正确的时间格式（${formatString}）`
            }
          }
        }
      } else if (c.type == 'date-range') {
        const drc = c as DateRangeColumn;
        if (drc.dbType == 'DATETIME') {
          column.tpl = "<% let value = data && data['" + c.key + "'];%><%= value && value.split(',').map(item => formatDate(item, \"YYYY-MM-DD HH:mm:ss\", \"YYYY-MM-DD HH:mm:ss\")).join(' 到 ') %>";
          if (searchable) {
            column.searchable.displayFormat = "YYYY-MM-DD HH:mm:ss";
            column.searchable.valueFormat = "YYYY-MM-DD HH:mm:ss";
            column.searchable.minDate = drc.minDate;
            column.searchable.maxDate = drc.maxDate;
          }
        } else if (drc.dbType == 'DATE') {
          column.tpl = "<% let value = data && data['" + c.key + "'];%><%= value && value.split(',').map(item => formatDate(item, \"YYYY-MM-DD\", \"YYYY-MM-DD\")).join(' 到 ') %>";
          if (searchable) {
            column.searchable.displayFormat = "YYYY-MM-DD";
            column.searchable.valueFormat = "YYYY-MM-DD";
            column.searchable.minDate = drc.minDate;
            column.searchable.maxDate = drc.maxDate;
          }
        } else if (drc.dbType == 'TIME') {
          column.tpl = "<% let value = data && data['" + c.key + "'];%><%= value && value.split(',').map(item => formatDate(item, \"HH:mm:ss\", \"HH:mm:ss\")).join(' 到 ') %>";
          if (searchable) {
            column.searchable.displayFormat = "HH:mm:ss";
            column.searchable.valueFormat = "HH:mm:ss";
            column.searchable.minDate = drc.minDate;
            column.searchable.maxDate = drc.maxDate;
          }
        }
        if (searchable) {
          column.searchable.value = '';
          delete column.searchable.placeholder;
          delete column.searchable.validations;
          delete column.searchable.validationErrors;
        }
      } else if (c.type == 'enum') {
        if (isStatic) {
          column.type = 'static-mapping';
        }
        const ec = c as EnumColumn;
        column.map = {};
        if (ec.options != null) {
          for (let option of ec.options) {
            column.map[option.value] = option.label
          }
          if (searchable) {
            column.searchable.options = ec.options;
          }
        } else {
          if (searchable) {
            column.searchable.options = [];
          }
        }
        column.source = ec.source;
        if (searchable) {
          column.searchable.source = ec.source;
          delete column.searchable.placeholder;
          delete column.searchable.validations;
          delete column.searchable.validationErrors;
        }
      } else if (c.type == 'image') {
        if (searchable) {
          delete column.searchable;
        }
      } else if (c.type == 'json') {
        if (searchable) {
          delete column.searchable;
        }
      } else if (c.type == 'money') {
        column.precision = 2;
        column.prefix = (c as MoneyColumn).currency.icon;
        if (searchable) {
          column.searchable.precision = column.precision;
          column.searchable.prefix = column.prefix;
          delete column.searchable.validations;
          delete column.searchable.validationErrors;
        }
      } else if (c.type == 'user') {
        column.source = "app://user/options";
        column.itemSchema = {
          type: "tag",
          label: "${label}"
        };
        if (searchable) {
          delete column.searchable.placeholder;
          column.searchable.selectMode = "associated";
          column.searchable.leftMode = "tree";
          column.searchable.extractValue = true;
          column.searchable.joinValues = false;
          column.searchable.multiple = false;
          column.searchable.searchable = true;
          column.searchable.source = "app://user/source";
          column.searchable.deferApi = "app://user/defer?departmentId=${ref}&parentId=${value}";
          column.searchable.searchApi = "app://user/search?term=$term";
          delete column.searchable.placeholder;
          delete column.searchable.validations;
          delete column.searchable.validationErrors;
        }
      } else if (c.type == 'users') {
        column.source = "app://user/options";
        column.name = "${" + column.name + "|split}";
        column.itemSchema = {
          type: "tag",
          label: "${label}"
        };
        if (searchable) {
          delete column.searchable;
        }
      } else if (c.type == 'department') {
        column.source = "app://department/options";
        column.itemSchema = {
          type: "tag",
          label: "${label}"
        };
        if (searchable) {
          column.searchable.multiple = false;
          column.searchable.searchable = true;
          column.searchable.source = "app://department/source";
          column.searchable.deferApi = "app://department/defer?parent=${value}";
          delete column.searchable.placeholder;
          delete column.searchable.validations;
          delete column.searchable.validationErrors;
        }
      } else if (c.type == 'formula') {
        column.width = 156;
        if (searchable) {
          delete column.searchable;
        }
      } else if (c.type == 'parent') {
        column.valueField = table.primaryField;
        column.labelOverrideMap = {
          "0" : "顶级"
        }
        if (table.titleTpl == null || table.titleTpl == '') {
          column.source = `model://${table.dsKey}.${table.key}/options?__fields[0]=` + table.nameField;
          column.itemSchema = {
            type: "tag",
            label: "${" + table.nameField + "}"
          };
          if (searchable) {
            column.searchable.source = `model://${table.dsKey}.${table.key}/treeSelect?__fields[0]=` + table.nameField;
          }
        } else {
          const fields = getNameFields(table).map((c, i) => `__fields[${i}]=${c}`).join("&");
          column.source = `model://${table.dsKey}.${table.key}/options?` + fields;
          column.itemSchema = {
            type: "tag",
            label: "${__title}"
          };
          if (searchable) {
            column.searchable.source = `model://${table.dsKey}.${table.key}/treeSelect?` + fields;
          }
        }
      }
      for (const k in column) {
        if (column[k] == undefined) {
          delete column[k];
        }
        if (k == 'searchable' && column[k] != null) {
          for (const k1 in column[k]) {
            if (column[k][k1] == undefined) {
              delete column[k][k1];
            }
            if (k1 == 'validations' && column[k][k1] != null) {
              for (const k2 in column[k][k1]) {
                if (column[k][k1][k2] == undefined) {
                  delete column[k][k1][k2];
                }
              }
            }
          }
        }
      }
    } else {
      column = getCrudOrViewRelationColumn(c, table, tables, isStatic, ref != null ? [...ref] : null, picker, dataManagePermission);
      if (column != null && _replaceQuickEdit) {
        column._replaceQuickEdit = true;
      }
    }
    if (column != null && quickEdit) {
      delete column.static;
      const quickEdit = getFormItem(c, table, tables, ref, false, true, true);
      column.quickEdit = handleService([quickEdit], false)[0];
      column.quickEdit.label = '';
      if (column.quickEdit.body != null) {
        column.quickEdit.body.label = '';
        if (column.quickEdit.body instanceof Array) {
          (column.quickEdit.body as any)?.forEach(i => {
            i.label = '';
          });
        }
      }
    }
    return column;
  }).filter(i => i != null);
}

export function getNameFields(table: Table) {
  const fields = [];
  const regex = /\{\{(.+?)}}/g;
  const match = table.titleTpl.match(regex);
  if (match != null) {
    match.forEach(i => {
      let f = i.replace("{{", "").replace("}}", "").split(".")[0];
      if (f.indexOf("[") != -1) {
        f = f.split("[")[0]
      }
      const field = table.fields.filter(i => i.key == f)[0];
      if (field != null && !fields.includes(f)) {
        fields.push(f);
      }
    })
  }
  return fields;
}

export function filterKey(columns: any[], c: Column) {
  if (columns.flatMap(i => {
    const r = [];
    let item = i;
    if (item.type == "service" || item.type == "static-page") {
      item = item.body;
    }
    if (item.name != null) {
      let name = item.name;
      if (name.startsWith("${")) {
        name = name.replaceAll("${", "").replaceAll("}", "")
        name = name.split("|")[0]
      }
      const keys = name.split('.');
      if (keys.length > 1) {
        r.push(keys[0]);
      } else {
        r.push(name);
      }
    }
    if (item.relationKey != null) {
      const keys = item.relationKey.split('.');
      if (keys.length > 1) {
        r.push(keys[0]);
      } else {
        r.push(item.relationKey);
      }
    }
    return r;
  }).some(i => i == c.key)) {
    return true;
  }
  return false;
}

export function generatePermissionString(dsKey: string, key: string, type: string, dataManagePermission: boolean = true) {
  const app = !isAppEnd() ? 'devApp' : 'app'
  const per = type == 'query' || type == 'export' ? 'query' : 'edit'
  return `\${` + (dataManagePermission ? `ARRAYINCLUDES($$permissionsData, '${app}:datamanage:${per}') && (` : '')
    + `$$noPer || ARRAYINCLUDES($$permissionsData, 'app:${dsKey}:${key}:${type}')` + (dataManagePermission? `)` : '') + '}'
}

export interface CrudConfig {
  apiUrlPart?: string
  sendOn?: string
  source?: string
  canSearch?: boolean
  canImport?: boolean
  canExport?: boolean
  canTruncate?: boolean
  canAdd?: boolean
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  picker?: boolean
  firstLevel?: boolean
}

export function genCrud(table: Table, tables: Table[], config: CrudConfig, dataManagePermission: boolean = true,
                        ref?: string[] | null, filter?: (c: Column) => boolean) {
  const columns = getColumns(table, tables, config.canSearch == null || config.canSearch,
    false, config.isStatic == true, ref, filter, config.picker, false, dataManagePermission);
  const schema: any = {
    type: 'crud',
    name: "datalist",
    id: "datalist",
    autoFillHeight: config?.firstLevel,
    columns,
    autoGenerateFilter: true,
    affixHeader: false,
    api: {
      method: "get",
      url: `model://${table.dsKey}.${table.key}?` +
        getFields(table.fields, table.relations, false, c => {
          if (c.type == 'relation' && config.picker) {
            const relation = table.relations.filter(i => i.key == c.key)[0];
            if (relation.relationMode == 'n:n') {
              return false;
            }
          }
          if (!filterKey(columns, c)) {
            return false;
          }
          if (filter && !filter(c)) {
            return false;
          }
          return true;
        }).map((c, i) => `__fields[${i}]=${c.key}`).join("&"),
      forceAppendDataToQuery: false
    },
    defaultParams: {
      orderBy: table.primaryField,
      orderDir: "asc"
    },
    quickSaveApi: {
      method: "post",
      url: `model://${table.dsKey}.${table.key}/bulkUpdate`,
      data: {
        items: "${rows}"
      }
    },
    expandConfig: {
      expand: "all"
    },
    syncLocation: false, //搜索合重置会跳到上一个
    primaryField: table.primaryField,
    headingClassName: "m-b-sm",
    bodyClassName: "no-border",
    placeholder: {
      type: "container",
      className: ":Table-placeholder",
      body: [
        "<div>您还没有任何数据</div>"
      ]
    },
    bulkActions: [],
    headerToolbar: [],
    footerToolbar: [
      "statistics",
      "switch-per-page",
      "pagination"
    ],
    columnsTogglable: true,
    reUseRow: false
  };
  if ((config.canAdd == null || config.canAdd) && table.type == 0) {
    (schema.headerToolbar as any[]).push(
      {
        label: `新增「${table.name}」`,
        type: "button",
        actionType: "dialog",
        size: "sm",
        level: "primary",
        icon: "fa fa-plus pull-left",
        dialog: {
          title: `新增「${table.name}」`,
          body: [
            {
              type: 'form',
              api: `post:model://${table.dsKey}.${table.key}`,
              body: genForm(table, tables, ref != null ? [...ref] : null, filter, false, true, true, dataManagePermission)
            }
          ],
          size: "md",
          data: {
            fk: "${" + table.primaryField + "}"
          }
        },
        visibleOn: generatePermissionString(table.dsKey, table.key, 'create', dataManagePermission)
      });
  }
  if ((config.canImport == null || config.canImport) && table.type == 0) {
    (schema.headerToolbar as any[]).push(
      {
        label: "上传 Excel 数据",
        type: "button",
        size: "sm",
        onEvent: {
          click: {
            actions: [
              {
                actionType: "dialog",
                dialog: {
                  title: "上传 Excel 数据",
                  body: {
                    type: "form",
                    api: `post:model://${table.dsKey}.${table.key}/uploadExcelData`,
                    // asyncApi: `post:model://${table.dsKey}.${table.key}/uploadExcelData/check`,
                    body: [
                      {
                        type: "radios",
                        name: "mode",
                        label: "导入模式",
                        value: "all",
                        options: [
                          {
                            "label": "全量导入",
                            "value": "all"
                          },
                          {
                            "label": "增量导入",
                            "value": "increment"
                          }
                        ],
                        description: "${mode == \"increment\" ? \"增量模式将根据主键是否存在进行新增或更新\" : \"\"}"
                      },
                      {
                        type: "input-file",
                        name: "file",
                        label: "Excel 文件",
                        accept: ".xlsx",
                        asBlob: true,
                        required: true,
                        maxSize: 104857600,
                        description: ""
                      },
                      {
                        type: "hidden",
                        name: "labelNameMap",
                        value: getLabelNameMap(table.fields, table.relations, tables)
                      },
                      {
                        type: "static-container",
                        body: [
                          {
                            label: "下载 Excel 模板",
                            type: "button",
                            level: "link",
                            className: "no-padder",
                            onEvent: {
                              click: {
                                actions: [
                                  {
                                    actionType: "ajax",
                                    args: {
                                      api: {
                                        method: "post",
                                        url: `model://${table.dsKey}.${table.key}/downloadExcelTemplate`,
                                        data: {
                                          nameLabelMap: getNameLabelMap(table.fields, table.relations, tables)
                                        },
                                        responseType: "blob"
                                      }
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        ]
                      }
                    ],
                    onEvent: {
                      submitSucc: {
                        actions: [
                          {
                            actionType: "reload",
                            componentId: "datalist"
                          }
                        ]
                      }
                    }
                  }
                }
              }
            ]
          }
        },
        visibleOn: generatePermissionString(table.dsKey, table.key, 'import', dataManagePermission)
      });
    schema.autoFillHeight = true
  }
  if (config.canExport == null || config.canExport) {
    (schema.headerToolbar as any[]).push(
      {
        label: "导出数据",
        size: "sm",
        type: "button",
        onEvent: {
          click: {
            actions: [
              {
                actionType: "ajax",
                args: {
                  api: {
                    method: "post",
                    url: `model://${table.dsKey}.${table.key}/exportExcelData?` +
                      getFields(table.fields, table.relations, false, c => {
                        if (c.type == 'relation' && config.picker) {
                          const relation = table.relations.filter(i => i.key == c.key)[0];
                          if (relation.relationMode == 'n:n') {
                            return false;
                          }
                        }
                        if (!filterKey(columns, c)) {
                          return false;
                        }
                        if (filter && !filter(c)) {
                          return false;
                        }
                        return true;
                      }).map((c, i) => `${c.key}=%24%7B${c.key}%7D`).join("&"),
                    responseType: "blob"
                  }
                }
              }
            ]
          }
        },
        visibleOn: generatePermissionString(table.dsKey, table.key, 'export', dataManagePermission)
      });
  }
  const has11NotNullable = tables.some(t => t.relations
    .some(r => r.targetKey == table.key && r.relationMode == '1:1' && !r.isNullable));
  if ((config.canTruncate == null || config.canTruncate) && !has11NotNullable) {
    (schema.headerToolbar as any[]).push(
      {
        label: "清空数据",
        type: "button",
        level: "danger",
        confirmText: "清空数据不会同步清除关系表数据，同时即便是开启了软删除此操作也是物理删除，并且会清空表中的所有应用租户的全部数据，确定要操作吗？",
        actionType: "ajax",
        align: "right",
        api: `delete:model://${table.dsKey}.${table.key}/truncate`,
        reload: "datalist?page=1",
        visibleOn: generatePermissionString(table.dsKey, table.key, 'delete', dataManagePermission)
      });
  }
  (schema.headerToolbar as any[]).push(
    {
      type: "bulk-actions"
    },
    {
      type: "columns-toggler",
      align: "right",
      draggable: true
    },
    {
      label: "",
      icon: "fa fa-refresh",
      type: "button",
      actionType: "reload",
      target: "datalist",
      align: "right"
    });
  if (config.canView == null || config.canView
    || config.canEdit == null || config.canEdit
    || config.canDelete == null || config.canDelete) {
    const operation: any = {
      type: "operation",
      width: 150,
      label: "操作",
      buttons: []
    };
    if (config.canView == null || config.canView) {
      const form = getColumns(table, tables, false, false, true, ref, filter);
      operation.buttons.push({
        label: "查看",
        type: "button",
        level: "link",
        actionType: "dialog",
        dialog: {
          title: `查看${table.name}数据「` + "${" + table.primaryField + "}」",
          size: "base",
          body: [
            {
              type: "form",
              initApi: `model://${table.dsKey}.${table.key}/` + "${" + table.primaryField + "}?" +
                getFields(table.fields, table.relations, false, c => {
                  if (!filterKey(form, c)) {
                    return false;
                  }
                  if (filter && !filter(c)) {
                    return false;
                  }
                  return true;
                }).map((c, i) => `__fields[${i}]=${c.key}`).join("&"),
              body: form,
            }
          ],
          data: {
            [table.primaryField]: "${" + table.primaryField + "}"
          }
        },
        visibleOn: generatePermissionString(table.dsKey, table.key, 'query', dataManagePermission)
      });
    }
    if (config.canEdit == null || config.canEdit) {
      const form = genForm(table, tables, ref != null ? [...ref] : null, filter, true, true, true, dataManagePermission);
      operation.buttons.push({
        label: "编辑",
        type: "button",
        level: "link",
        actionType: "dialog",
        dialog: {
          title: `编辑${table.name}数据「` + "${" + table.primaryField + "}」",
          size: "md",
          body: [
            {
              type: "form",
              initApi: `model://${table.dsKey}.${table.key}/` + "${" + table.primaryField + "}?" +
                getFields(table.fields, table.relations, true, c => {
                  if (!filterKey(form, c)) {
                    return false;
                  }
                  if (filter && !filter(c)) {
                    return false;
                  }
                  return !c.isPrimaryKey;
                }).map((c, i) => `__fields[${i}]=${c.key}`).join("&"),
              api: `post:model://${table.dsKey}.${table.key}/` + "${" + table.primaryField + "}",
              body: form,
            }
          ],
          data: {
            [table.primaryField]: "${" + table.primaryField + "}"
          }
        },
        visibleOn: generatePermissionString(table.dsKey, table.key, 'update', dataManagePermission)
      });
    }
    if ((config.canDelete == null || config.canDelete) && !has11NotNullable) {
      operation.buttons.push({
        label: "删除",
        type: "button",
        level: "link",
        actionType: "ajax",
        confirmText: table.useSoftDelete ? "确定要删除？" : "<b>警告！当前数据源模型未开启软删除功能，确认后会删除远端数据库中的数据</b>，确定要删除？",
        api: `delete:model://${table.dsKey}.${table.key}/` + "${" + table.primaryField + "}",
        visibleOn: generatePermissionString(table.dsKey, table.key, 'delete', dataManagePermission)
      });
    }
    schema.columns.push(operation);
  }
  if (config.apiUrlPart != null && config.apiUrlPart != '') {
    schema.api.url = schema.api.url + '&' + config.apiUrlPart;
  }
  if (config.sendOn != null && config.sendOn != '') {
    schema.api.sendOn = config.sendOn;
  }
  if (config.source != null && config.source != '') {
    schema.source = config.source;
  }
  return schema;
}