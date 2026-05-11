import {
  AttachmentColumn, BoolColumn, Column,
  DateRangeColumn, DatetimeColumn,
  EnumColumn,
  FloatColumn,
  FormulaColumn, ImageColumn, IntColumn,
  MoneyColumn,
  Table,
  TextColumn, TimeColumn, UserColumn
} from "./model";
import { getFormRelationColumn, handleService } from "./relation";
import { extractContent } from "@/utils/util"
import { generateDateTimeRegexStr, getFormatStringByPrecision } from "@/utils";
const typeConfig = {
  "int": { type: "input-number" },
  "float": { type: "input-number" },
  "text": { type: "input-text" },
  "textarea": { type: "textarea" },
  "rich-text": { type: "input-rich-text" },
  "password": { type: "input-password" },
  "attachment": { type: "input-file" },
  "boolean": { type: "switch" },
  "ciphertext": { type: "textarea" },
  "date": { type: "input-date" },
  "datetime": { type: "input-datetime" },
  "time": { type: "input-time" },
  "enum": { type: "select" },
  "image": { type: "input-image" },
  "json": { type: "editor" },
  "money": { type: "input-number" },
  "user": { type: "user-select" },
  "users": { type: "user-select" },
  "department": { type: "tree-select" },
  "date-range": { type: "input-date-range" },
  "parent": { type: "tree-select" },
  "serial-number": { type: "input-text" },
}

export function getFormItem(c: Column, table: Table, tables: Table[], ref?: string[] | null, forEdit: boolean = false,
                            tableQuickEdit: boolean = false, optionsAllFields: boolean = false, dataManagePermission: boolean = true) {
  if (c.type != 'relation' && c.type != 'formula') {
    const tc = typeConfig[c.type] != null ? typeConfig[c.type] : {};
    const column: any = {
      type: tc.type,
      name: c.key,
      label: c.name,
      description: c.description,
      required: !c.isNullable && c.type != "serial-number",
      placeholder: "请输入",
      validations: c.validations != null ? Object.assign({}, c.validations) : {},
      validationErrors: c.validationErrors != null ? Object.assign({}, c.validationErrors) : {},
    };
    if (c.defaultValueMode == 'static') {
      if (c.type == 'boolean') {
        if (c.defaultValue != null) {
          column.value = JSON.parse(c.defaultValue as string);
        }
      } else if (c.type == 'enum') {
        const ec = c as EnumColumn;
        if (ec.dbType == "INTEGER") {
          column.value = parseInt(c.defaultValue as string);
        } else {
          column.value = c.defaultValue;
        }
      } else if (c.type != 'password' && c.type != 'ciphertext') {
        column.value = c.defaultValue;
      }
    } else if (c.defaultValueMode == 'current_user' && c.type == 'user') {
      column.value = "${zcUser.name}"
    }
    if (c.type == 'int') {
      const intc = c as IntColumn;
      if (intc.dbType == 'BIGINT') {
        column.big = true;
      }
    } else if (c.type == 'float') {
      column.precision = (c as FloatColumn).scale;
    } else if (c.type == 'text') {
      const textc = c as TextColumn;
      if (textc.length == null || textc.length == '') {
        textc.length = 255;
      }
      if (column.validations.maxLength == null || column.validations.maxLength == '') {
        column.validations.maxLength = textc.length;
      } else if (column.validations.maxLength > textc.length) {
        column.validations.maxLength = textc.length;
      }
      if (column.validationErrors.maxLength == null || column.validationErrors.maxLength == '') {
        column.validationErrors.maxLength = '长度超出限制';
      }
      if (textc.format == 'email') {
        column.type = "input-email";
        column.placeholder = "请输入邮箱地址";
        column.validations.isEmail = true;
        column.validationErrors.isEmail = textc.formatMsg;
      } else if (textc.format == 'url') {
        column.type = "input-url";
        column.placeholder = "请输入网址";
        column.validations.isUrl = true;
        column.validationErrors.isUrl = textc.formatMsg;
      } else if (textc.format == 'id') {
        column.placeholder = "请输入身份证号";
        column.validations.isId = true;
        column.validationErrors.isId = textc.formatMsg;
      } else if (textc.format == 'phone') {
        column.placeholder = "请输入手机号码";
        column.validations.isPhoneNumber = true;
        column.validationErrors.isPhoneNumber = textc.formatMsg;
      } else if (textc.format == 'tel') {
        column.placeholder = "请输入电话号码";
        column.validations.isTelNumber = true;
        column.validationErrors.isTelNumber = textc.formatMsg;
      } else if (textc.format == 'zipcode') {
        column.placeholder = "请输入邮编号码";
        column.validations.isZipcode = true;
        column.validationErrors.isZipcode = textc.formatMsg;
      } else if (textc.format == 'color') {
        column.type = "input-color";
        column.placeholder = "请输入颜色";
      } else if (textc.format == 'year') {
        column.type = "select";
        column.placeholder = "请选择年份";
        column.searchable = true;
        column.clearable = true;
        column.options = [];
        for (let i = 1901; i < 2156; i++) {
          column.options.push({ label: i, value: i })
        }
      }
    } else if (c.type == 'rich-text') {
      delete column.placeholder;
      delete column.validations;
      delete column.validationErrors;
      column.options = {
        menubar: false,
        buttons: [
          "undo",
          "redo",
          "paragraphFormat",
          "textColor",
          "backgroundColor",
          "bold",
          "underline",
          "strikeThrough",
          "formatOL",
          "formatUL",
          "align",
          "quote",
          "insertLink",
          "insertImage",
          "insertEmotion",
          "insertVideo",
          "insertTable",
          "html"
        ],
      };
    } else if (c.type == 'attachment') {
      const ac = c as AttachmentColumn;
      column.joinValues = false;
      column.accept = ac.accept;
      if (ac.maxSize != null && ac.maxSize != '') {
        column.maxSize = 1048576 * ac.maxSize;
      } else {
        column.maxSize = 10485760;
      }
      column.receiver = {
        url: `object-upload://${(ac.driver != null && ac.driver != '') ? ac.driver : 'default'}`
      };
      delete column.placeholder;
      delete column.validations;
      delete column.validationErrors;
    } else if (c.type == 'boolean') {
      if (c.isNullable) {
        const bc = c as BoolColumn;
        column.type = "button-group-select";
        column.options = [
          {
            label: "无",
            value: null
          },
          {
            label: bc.onText ? bc.onText : "开",
            value: true
          },
          {
            label: bc.offText ? bc.offText : "关",
            value: false
          }
        ];
        if (column.value === undefined) {
          column.value = null;
        }
      } else {
        if (column.value === undefined) {
          column.value = false;
        }
      }
      delete column.placeholder;
      delete column.validations;
      delete column.validationErrors;
    } else if (c.type == 'ciphertext') {
      delete column.validations;
      delete column.validationErrors;
    } else if (c.type == 'date') {
      column.format = "YYYY-MM-DD";
      column.timeFormat = "";
      column.format = "YYYY-MM-DD";
      column.valueFormat = "YYYY-MM-DD";
      column.inputFormat = "YYYY-MM-DD";
      column.shortcuts = [
        "thismonth",
        "thisweek",
        "yesterday",
        "today",
        "tomorrow",
        "endofthisweek",
        "endofthismonth"
      ];
      delete column.placeholder;
    } else if (c.type == 'datetime') {
      const dtc = c as DatetimeColumn;
      const compatible = dtc.precisionCompatible || dtc.showPrecision <= 3;
      const formatString = getFormatStringByPrecision("YYYY-MM-DD HH:mm:ss", dtc.showPrecision, dtc.precisionCompatible);
      if (compatible) {
        column.timeFormat = formatString
        column.format = column.timeFormat
        column.valueFormat = column.timeFormat
        column.inputFormat = column.timeFormat
        column.shortcuts = [
          "thismonth",
          "thisweek",
          "yesterday",
          "today",
          "now",
          "tomorrow",
          "endofthisweek",
          "endofthismonth"
        ];
        delete column.placeholder;
      } else {
          column.type = "input-text";
          column.placeholder = '请输入日期以及时间';
          column.clearable = true;
          column.validations = {
            matchRegexp: generateDateTimeRegexStr(formatString)
          };
          column.validationErrors = {
            matchRegexp: `请输入正确的日期时间格式（${formatString}）`
          };
        }
    } else if (c.type == 'time') {
      const tc = c as TimeColumn;
      const compatible = tc.precisionCompatible || tc.showPrecision <= 3;
      const formatString = getFormatStringByPrecision("HH:mm:ss", tc.showPrecision, tc.precisionCompatible);
      if (compatible) {
        column.timeFormat = formatString
        column.format = column.timeFormat
        column.valueFormat = column.timeFormat
        column.inputFormat = column.timeFormat
        column.shortcuts = [
          "12hoursago",
          "6hoursago",
          "1hoursago",
          "now",
          "1hourslater",
          "6hourslater",
          "12hourslater"
        ];
        delete column.placeholder;
      } else {
        column.type = "input-text";
        column.placeholder = '请输入时间';
        column.clearable = true;
        column.validations = {
          matchRegexp: generateDateTimeRegexStr(formatString)
        };
        column.validationErrors = {
          matchRegexp: `请输入正确的时间格式（${formatString}）`
        };
      }
    } else if (c.type == 'date-range') {
      const drc = c as DateRangeColumn;
      if (drc.dbType == 'DATETIME') {
        column.displayFormat = "YYYY-MM-DD HH:mm:ss";
        column.valueFormat = "YYYY-MM-DD HH:mm:ss";
        column.minDate = drc.minDate;
        column.maxDate = drc.maxDate;
      } else if (drc.dbType == 'DATE') {
        column.displayFormat = "YYYY-MM-DD";
        column.valueFormat = "YYYY-MM-DD";
        column.minDate = drc.minDate;
        column.maxDate = drc.maxDate;
      } else if (drc.dbType == 'TIME') {
        column.type = "input-time-range";
        column.displayFormat = "HH:mm:ss";
        column.valueFormat = "HH:mm:ss";
        column.minDate = drc.minDate;
        column.maxDate = drc.maxDate;
      }
      delete column.placeholder;
      delete column.validations;
      delete column.validationErrors;
    } else if (c.type == 'enum') {
      const ec = c as EnumColumn;
      if (ec.options != null) {
        column.options = ec.options;
      } else {
        column.options = [];
      }
      column.source = ec.source;
      column.clearable = true;
      delete column.placeholder;
      delete column.validations;
      delete column.validationErrors;
    } else if (c.type == 'image') {
      const ic = c as ImageColumn;
      column.joinValues = false;
      column.extractValue = true;
      column.accept = [];
      if (ic.allowedTypes.includes('.jpeg')) {
        column.accept.push(".jpeg");
        column.accept.push(".jpg");
      }
      if (ic.allowedTypes.includes('.png')) {
        column.accept.push(".png");
      }
      if (ic.allowedTypes.includes('.gif')) {
        column.accept.push(".gif");
      }
      if (ic.allowedTypes.includes('.svg')) {
        column.accept.push(".svg");
      }
      column.accept = column.accept.join(",");
      if (ic.maxSize != null && ic.maxSize != '') {
        column.maxSize = 1048576 * ic.maxSize;
      } else {
        column.maxSize = 10485760;
      }
      if (ic.restrictRatio != null && ic.restrictRatio != "") {
        const ratios = ic.restrictRatio.split(':');
        column.limit = {
          aspectRatio: ic.restrictRatio == "custom" ? ic.restrictRatioCustom : (parseFloat(ratios[0]) / parseFloat(ratios[1]))
        };
        column.crop = {
          aspectRatio: column.limit.aspectRatio
        }
      }
      column.receiver = {
        url: `object-upload://${(ic.driver != null && ic.driver != '') ? ic.driver : 'default'}`
      };
      column.autoUpload = true;
      delete column.placeholder;
      delete column.validations;
      delete column.validationErrors;
    } else if (c.type == 'json') {
      column.language = "json";
      column.validations.isJson = true;
      column.validationErrors.isJson = "请输入合法的JSON";
      delete column.placeholder;
    } else if (c.type == 'money') {
      column.precision = 2;
      column.prefix = (c as MoneyColumn).currency.icon;
      delete column.validations;
      delete column.validationErrors;
    } else if (c.type == 'user' || c.type == 'users') {
      delete column.placeholder;
      column.selectMode = "associated";
      column.leftMode = "tree";
      column.multiple = c.type == 'users';
      column.searchable = true;
      column.clearable = true;
      column.source = "app://user/source";
      column.deferApi = "app://user/defer?departmentId=${ref}&parentId=${value}";
      column.searchApi = "app://user/search?term=$term";
      if (forEdit && !(c as UserColumn).allowInput) {
        column.disabled = true;
      }
      delete column.placeholder;
      delete column.validations;
      delete column.validationErrors;
    } else if (c.type == 'department') {
      delete column.placeholder;
      column.multiple = false;
      column.searchable = true;
      column.source = "app://department/source";
      column.deferApi = "app://department/defer?parent=${value}";
      delete column.placeholder;
      delete column.validations;
      delete column.validationErrors;
    } else if (c.type == 'formula') {
      const fc = c as FormulaColumn;
      column.formula = fc.formula;
      column.api = `model://${table.dsKey}.${table.key}/compute`;
      delete column.placeholder;
      delete column.validations;
      delete column.validationErrors;
    } else if (c.type == 'parent') {
      column.source = `model://${table.dsKey}.${table.key}/treeSelect?${table.primaryField}=` + '${' + table.primaryField + '}';
    } else if (c.type == 'serial-number') {
      column.placeholder = "自动生成，无需填写";
      column.disabled = true;
    }
    for (const k in column) {
      if (column[k] == undefined && k != 'value') {
        delete column[k];
      }
      if (k == 'validations' && column[k] != null) {
        for (const k1 in column[k]) {
          if (column[k][k1] == undefined) {
            delete column[k][k1];
          }
        }
      }
    }
    return column;
  } else if (c.type == 'relation') {
    return getFormRelationColumn(c, table, tables, tableQuickEdit, optionsAllFields, dataManagePermission, ref != null ? [...ref] : null);
  }
}

export function genForm(table: Table, tables: Table[], ref?: string[] | null, filter?: (c: Column) => boolean,
  forEdit: boolean = false, firstLevel: boolean = true, optionsAllFields: boolean = false, dataManagePermission: boolean = true) {
  const schema = table.fields.filter(c => {
    const r = !c.isPrimaryKey && !c.isCreateUser && !c.isCreateDate && !c.isUpdateUser && !c.isUpdateDate
      && !c.isDeleteUser && !c.isDeleteDate && !c.isDeleteFlag && !c.isTenantCode && !c.isForeignKey;
    if (filter == null) {
      return r;
    }
    return r && filter(c);
  }).map(c => getFormItem(c, table, tables, ref, forEdit, false, optionsAllFields, dataManagePermission));
  return handleService(schema.filter(i => i != null), firstLevel);
}

/**
 * 将表单项转换为只读模式
 *
 * @param formItemSchemas 表单项的schema
 * @returns 转换后的只读表单项schema
 */
export function invertFormItemToReadonly(formItemSchemas: any) {
  let schema: any = { ...formItemSchemas }
  let type: string = schema.type;
  schema.disabled = true;
  if(type=='service'){
    schema.body[0].disabled = true;
    if(schema.body[0].type=='picker'){
      let pickerSchema: any = { ...schema.body[0].pickerSchema }
      pickerSchema.headerToolbar = []
      pickerSchema.autoGenerateFilter = true;
      pickerSchema.columns = pickerSchema.columns.filter((e: any) => e.type != 'operation')
      for(var i=0;i<pickerSchema.columns.length;i++){
        delete pickerSchema.columns[i].searchable
      }
      pickerSchema.itemCheckableOn = "${false}"

      pickerSchema.columnsTogglable = false

      schema.body[0].readOnly = true

      schema.body[0].pickerSchema = pickerSchema
    }
  }
  // console.log(schema, 'schema---invertFormItemToReadonly');
  if (type=='picker') {

    let pickerSchema: any = { ...schema.pickerSchema }

    // pickerSchema.headerToolbar && pickerSchema.headerToolbar.forEach((button: any) => {
    //   button.disabled = true
    // });

    pickerSchema.headerToolbar = []

    // pickerSchema.columns.forEach((column: any) => {

    //   column.type == 'operation' && column.buttons.forEach((button: any) => {
    //     button.disabled = true;
    //   });

    // });

    pickerSchema.autoGenerateFilter = true;

    pickerSchema.columns = pickerSchema.columns.filter((e: any) => e.type != 'operation')
    for(var i=0;i<pickerSchema.columns.length;i++){
      delete pickerSchema.columns[i].searchable
    }
    pickerSchema.itemCheckableOn = "${false}"

    pickerSchema.columnsTogglable = false

    schema.readOnly = true

    schema.pickerSchema = pickerSchema
  }
  // console.log(schema, 'invertFormItemToReadonly');
  if(type=='combo'){
    schema.addable = false
    schema.removable = false
  }
  if(type=='checkboxes'){
    schema.editable = false
    schema.removable = false
  }
  if(type=='input-table'){
    schema.addable = false
    schema.removable = false
  }
  return schema;
}

//a 完全存在b中
function arrayContains(superset, subset) {
  return subset.every(item => superset.includes(item));
}
//const a = ['a1', 'a2'] // dis
//const b = ['b1','b2','a1','a3'] //zijide  a包含b,
function arrayContainsome(superset, subset) {
  return subset.some(item => superset.includes(item));
}

/**
 * 处理任务表单项状态
 *
 * @param fields 数据字段列表
 * @param disableFields 需要禁用的字段名列表
 * @param hiddenFields 需要隐藏的字段名列表
 * @param isRevise 是否为修改模式
 * @returns 无返回值，直接修改传入的fields参数
 */
export const disposeTaskFormItemStatus = (fields: any[], disableFields: string[], hiddenFields: string[], forceDisabled: boolean) => {
  // fields.forEach((item: any, index: number) => {
  //   if (item.items) {
  //     disposeTaskFormItemStatus(item.items, disableFields, hiddenFields, isRevise);
  //   } else {
  //     let isDisable = disableFields.includes(item.name)
  //     let isHidden = hiddenFields.includes(item.name)
  //     const updatedItem = {
  //       hidden: isHidden,
  //       ...(isDisable ? invertFormItemToReadonly(item) : { disable: true, ...item })
  //     }

  //     fields[index] = updatedItem
  //   }
  // });
  //增加个变量，只有第一层的select 有这个判断，其余层的select 没有这个判断
  const isFirstSelect = true
  handleItems(fields, [], hiddenFields, disableFields, forceDisabled, isFirstSelect)
}

const handleItems = (items, path, hiddenFields, disableFields, forceDisabled, isFirstSelect) => {
  if(items == null) return
  for(var i=0;i<items.length;i++){
    const item = items[i]
    let p = [...path, item.name]
    if(item.type=='service'){
      p = [...path, item.body.length > 0 ? item.body[0].name : item.body.name]
    }
    else if(item.type=='list-select' || item.type=='button-group-select' || item.type=='select'){
      p = [...path, item.relationKey ? item.relationKey : item.name]
    }
    // if(item.type=='list-select'){
    //   p = [...path, item.name.indexOf('Id') > -1 ? item.name.split('Id')[0] : item.name]
    // }
    // if(item.type=='button-group-select'){
    //   p = [...path, item.name.indexOf('Id') > -1 ? item.name.split('Id')[0] : item.name]
    // }
    // if(item.type=='select'){
    //   p = [...path, item.name.indexOf('Id') > -1 ? item.name.split('Id')[0] : item.name]
    // }
    if(item.type=='select' && !item.addControls && item.labelField && isFirstSelect){
      p = [...path, item.relationKey + '.' + item.labelField]
    }
    if(item.type=='select' && !item.addControls && item.labelTpl && isFirstSelect && !item.labelField){
      let labelTplVal = extractContent(item.labelTpl)
      for(var gg=0; gg<labelTplVal.length; gg++){
        if (labelTplVal[gg].indexOf('.') >-1) {
          p = [...path, item.relationKey + '.' + labelTplVal[gg].split('.')[0]]
        } else {
          p = [...path, item.relationKey + '.' + labelTplVal[gg]]
        }
      }
    }
    if(item.type=='grid'){
      for(var j=0;j< item.columns.length;j++){
        for(var k=0;k<item.columns[j].body.length;k++){
          p = [...path, item.columns[j].body[k].name]
          const field = p.join('.')
          let isDisable = disableFields.includes(field)
          let isHidden = hiddenFields.includes(field)
          const updatedItem = {
            hidden: isHidden,
            ...(isDisable || forceDisabled ? invertFormItemToReadonly(item.columns[j].body[k]) : { disable: true, ...item.columns[j].body[k] })
          }
          item.columns[j].body[k] = updatedItem

          if(item.columns[j].body[k].items!=null){
            handleItems(item.columns[j].body[k].items, [...path, item.columns[j].body[k].name], hiddenFields, disableFields, forceDisabled, false)
          } else if(item.columns[j].body[k].type=='service'){
            handleItems(item.columns[j].body[k].body[0].items ? item.columns[j].body[k].body[0].items : item.columns[j].body[k].body[0], [...path, item.columns[j].body[k].body[0].name], hiddenFields, disableFields, forceDisabled, false)
          }
        }
      }
    } else {
      const field = p.join('.')
      let isDisable = disableFields.includes(field)
      let isHidden = hiddenFields.includes(field)
      if(item.type=='picker' && !forceDisabled){
        const newField = item.pickerSchema.columns.filter(i => i.type != 'operation' && i.static != true)
        const nameField = []
        let a = []
        for(var b=0;b<newField.length;b++){
          if(newField[b].type == 'service') {
            a = [...path, item.relationKey + '.' + newField[b].body[0].name]
          } else {
            a = [...path, item.relationKey + '.' + newField[b].name]
          }
          nameField.push(a.join('.'))
        }
        const nameFieldCopy = []
        for(var q=0; q<nameField.length; q++){
          if(nameField[q].split('.').length > 2){
            nameFieldCopy.push(nameField[q].split('.')[0]+'.'+nameField[q].split('.')[1])
          } else {
            nameFieldCopy.push(nameField[q])
          }
        }
        if(nameField.length > 0){
          const hideResult = arrayContains(hiddenFields, nameFieldCopy)
          const disResult = arrayContains(disableFields, nameFieldCopy)
          //全部隐藏
          if(hideResult){
            item.hidden = true
          }
          //全部置灰
          if(disResult){
            item.readOnly = true
            item.pickerSchema.autoGenerateFilter = true;
            item.pickerSchema.itemCheckableOn = "${false}"
            item.pickerSchema.columnsTogglable = false
            item.pickerSchema.columns = item.pickerSchema.columns.filter(i => i.type != 'operation')
            for(var v=0;v<item.pickerSchema.columns.length;v++){
              if(item.pickerSchema.columns[v].searchable){
                item.pickerSchema.columns[v].searchable = null
              }
            }
            item.pickerSchema.headerToolbar = item.pickerSchema.headerToolbar.filter(i => i.actionType != 'dialog')
          }
          //一部分隐藏，另一部分置灰
          //先将隐藏的删除，判断剩余的是否全部置灰，
          for(var d=0; d < nameFieldCopy.length; d++){
            if(hiddenFields.includes(nameFieldCopy[d])){
              nameFieldCopy.splice(d, 1)
            }
          }
          const disResult2 = arrayContains(disableFields, nameFieldCopy)
          //全部置灰
          if(disResult2){
            item.readOnly = true
            item.pickerSchema.autoGenerateFilter = true;
            item.pickerSchema.itemCheckableOn = "${false}"
            item.pickerSchema.columnsTogglable = false
            item.pickerSchema.columns = item.pickerSchema.columns.filter(i => i.type != 'operation')
            for(var v=0;v<item.pickerSchema.columns.length;v++){
              if(item.pickerSchema.columns[v].searchable){
                item.pickerSchema.columns[v].searchable = null
              }
            }
            item.pickerSchema.headerToolbar = item.pickerSchema.headerToolbar.filter(i => i.actionType != 'dialog')
          }
        }
        if(item.type=='picker' && forceDisabled){
          item.readOnly = true
          item.pickerSchema.autoGenerateFilter = true;
          item.pickerSchema.itemCheckableOn = "${false}"
          item.pickerSchema.columnsTogglable = false
          item.pickerSchema.columns = item.pickerSchema.columns.filter(i => i.type != 'operation')
          for(var v=0;v<item.pickerSchema.columns.length;v++){
            if(item.pickerSchema.columns[v].searchable){
              item.pickerSchema.columns[v].searchable = null
            }
          }
          item.pickerSchema.headerToolbar = item.pickerSchema.headerToolbar.filter(i => i.actionType != 'dialog')
        }
      } else if(item.type=='input-table' && !forceDisabled){
        const newField = item.columns.filter(i => i.type != 'operation' && i.static != true)
        const nameField = []
        for(var b=0;b<newField.length;b++){
          const a = [...path, item.relationKey + '.' + newField[b].name]
          nameField.push(a.join('.'))
        }
        const nameFieldCopy = []
        for(var q=0; q<nameField.length; q++){
          if(nameField[q].split('.').length > 2){
            nameFieldCopy.push(nameField[q].split('.')[0]+'.'+nameField[q].split('.')[1])
          } else {
            nameFieldCopy.push(nameField[q])
          }
        }
        if(nameField.length > 0){
          const hideResult = arrayContains(hiddenFields, nameFieldCopy)
          const disResult = arrayContains(disableFields, nameFieldCopy)
          //全部隐藏
          if(hideResult){
            item.hidden = true
          }
          //全部置灰
          if(disResult){
            item.disabled = true
            item.addable = false
            item.editable = false
            item.removable = false
            item.needConfirm = false
          }
          //一部分隐藏，另一部分置灰
          //先将隐藏的删除，判断剩余的是否全部置灰，
          for(var d=0; d < nameFieldCopy.length; d++){
            if(hiddenFields.includes(nameFieldCopy[d])){
              nameFieldCopy.splice(d, 1)
            }
          }
          const disResult2 = arrayContains(disableFields, nameFieldCopy)
          //全部置灰
          if(disResult2){
            item.disabled = true
            item.addable = false
            item.editable = false
            item.removable = false
            item.needConfirm = false
          }
        }

        if(nameField.length > 0){
          const objItem = item.columns.filter(i => i.type != 'operation' && i.static != true)
          for(var h=0;h<objItem.length;h++){
            const a = [...path, item.relationKey + '.' + objItem[h].name]
            if(disableFields.includes(a.join('.'))){
              objItem[h].disabled = true
            }
          }
          const disResultsome = arrayContainsome(disableFields, nameFieldCopy)
          if(disResultsome){
            item.addable = false
            item.editable = false
            item.removable = false
            item.columns = objItem
          }
          //当整个input-table是disabled: true时，needConfirm 需要是false, 当input-table 的某一列是置灰的时候， needConfirm 需是默认值true
          if(item.disabled){
            item.needConfirm = false
          }
        }
      } else if(item.type=='select' && item.addControls && !forceDisabled ){
        const newField = item.addControls.filter(i => i.type != 'operation' && i.static != true)
        const nameField = []
        for(var b=0;b<newField.length;b++){
          const a = [...path, item.relationKey + '.' + newField[b].name]
          nameField.push(a.join('.'))
        }
        const nameFieldCopy = []
        for(var q=0; q<nameField.length; q++){
          if(nameField[q].split('.').length > 2){
            nameFieldCopy.push(nameField[q].split('.')[0]+'.'+nameField[q].split('.')[1])
          } else {
            nameFieldCopy.push(nameField[q])
          }
        }
        if(nameField.length > 0){
          const hideResult = arrayContains(hiddenFields, nameFieldCopy)
          const disResult = arrayContains(disableFields, nameFieldCopy)
          //全部隐藏
          if(hideResult){
            item.hidden = true
          }
          //全部置灰
          if(disResult){
            // item.creatable = false
            // item.editable = false
            item.disabled = true
            item.removable = false
          }
          //一部分隐藏，另一部分置灰
          //先将隐藏的删除，判断剩余的是否全部置灰，
          for(var d=0; d < nameFieldCopy.length; d++){
            if(hiddenFields.includes(nameFieldCopy[d])){
              nameFieldCopy.splice(d, 1)
            }
          }
          const disResult2 = arrayContains(disableFields, nameFieldCopy)
          //全部置灰
          if(disResult2){
            // item.creatable = false
            // item.editable = false
            item.disabled = true
            item.removable = false
          }
        }
      } else if(item.type=='checkboxes' && item.addControls && !forceDisabled){
        const newField = item.addControls.filter(i => i.type != 'operation' && i.static != true)
        const nameField = []

        for(var b=0;b<newField.length;b++){
          const a = [...path, item.relationKey + '.' + newField[b].name]
          nameField.push(a.join('.'))
        }
        const nameFieldCopy = []
        for(var q=0; q<nameField.length; q++){
          if(nameField[q].split('.').length > 2){
            nameFieldCopy.push(nameField[q].split('.')[0]+'.'+nameField[q].split('.')[1])
          } else {
            nameFieldCopy.push(nameField[q])
          }
        }

        if(nameField.length > 0){
          const hideResult = arrayContains(hiddenFields, nameFieldCopy)
          const disResult = arrayContains(disableFields, nameFieldCopy)
          //全部隐藏
          if(hideResult){
            item.hidden = true
          }
          //全部置灰
          if(disResult){
            item.editable = false
            item.disabled = true
            item.removable = false
          }
          //一部分隐藏，另一部分置灰
          //先将隐藏的删除，判断剩余的是否全部置灰，
          for(var d=0; d < nameFieldCopy.length; d++){
            if(hiddenFields.includes(nameFieldCopy[d])){
              nameFieldCopy.splice(d, 1)
            }
          }
          const disResult2 = arrayContains(disableFields, nameFieldCopy)
          //全部置灰
          if(disResult2){
            item.editable = false
            item.disabled = true
            item.removable = false
          }
        }
      } else if(item.type=='list-select' && item.addControls && !forceDisabled ){
        const newField = item.addControls.filter(i => i.type != 'operation' && i.static != true)
        const nameField = []
        for(var b=0;b<newField.length;b++){
          const a = [...path, item.relationKey + '.' + newField[b].name]
          nameField.push(a.join('.'))
        }
        const nameFieldCopy = []
        for(var q=0; q<nameField.length; q++){
          if(nameField[q].split('.').length > 2){
            nameFieldCopy.push(nameField[q].split('.')[0]+'.'+nameField[q].split('.')[1])
          } else {
            nameFieldCopy.push(nameField[q])
          }
        }
        if(nameField.length > 0){
          const hideResult = arrayContains(hiddenFields, nameFieldCopy)
          const disResult = arrayContains(disableFields, nameFieldCopy)
          //全部隐藏
          if(hideResult){
            item.hidden = true
          }
          //全部置灰
          if(disResult){
            item.disabled = true
          }
          //一部分隐藏，另一部分置灰
          //先将隐藏的删除，判断剩余的是否全部置灰，
          for(var d=0; d < nameFieldCopy.length; d++){
            if(hiddenFields.includes(nameFieldCopy[d])){
              nameFieldCopy.splice(d, 1)
            }
          }
          const disResult2 = arrayContains(disableFields, nameFieldCopy)
          //全部置灰
          if(disResult2){
            item.disabled = true
          }
        }
      } else {
        const updatedItem = {
          hidden: isHidden,
          ...(isDisable || forceDisabled ? invertFormItemToReadonly(item) : { disable: true, ...item })
        }
        if(updatedItem.hidden && updatedItem?.searchable){
          updatedItem.searchable = null
        }
        items[i] = updatedItem
      }

      if(item.type=='combo'){
        handleItems(item.items, [...path, item.name], hiddenFields, disableFields, forceDisabled, false)
      } else if(item.type=='service'){
        handleItems(item.body.length > 0  ? item.body[0].items : item.body, [...path, item.body.length > 0 ? item.body[0].name : item.body.name], hiddenFields, disableFields, forceDisabled, false)
      } else if(item.type=='picker'){
        //编辑弹框
        handleItems(item.pickerSchema.columns[item.pickerSchema.columns.length-1].buttons && item.pickerSchema.columns[item.pickerSchema.columns.length-1].buttons[0]?.dialog?.body[0]?.body, [...path, item.name], hiddenFields, disableFields, forceDisabled, false)
        //新增弹框
        handleItems(item.pickerSchema.headerToolbar[0] && item.pickerSchema.headerToolbar[0].dialog?.body[0]?.body, [...path, item.name], hiddenFields, disableFields, forceDisabled, false)
        //列表处理
        handleItems(item.pickerSchema.columns, [...path, item.name], hiddenFields, disableFields, forceDisabled, false)
      } else if(item.type=='button-group-select'){
        handleItems(item.addControls, [...path, item.relationKey], hiddenFields, disableFields, forceDisabled, false)
      } else if(item.type=='list-select'){
        handleItems(item.addControls, [...path,item.relationKey], hiddenFields, disableFields, forceDisabled, false)
      } else if(item.type=='select' && item.addControls ){
        handleItems(item.addControls, [...path, item.relationKey], hiddenFields, disableFields, forceDisabled, false)
        handleItems(item.editControls, [...path, item.relationKey], hiddenFields, disableFields, forceDisabled, false)
      } else if(item.type=='input-table'){
        handleItems(item.columns, [...path, item.relationKey], hiddenFields, disableFields, forceDisabled, false)
      } else if(item.type=='checkboxes' && item.addControls && !forceDisabled){
        handleItems(item.addControls, [...path, item.relationKey], hiddenFields, disableFields, forceDisabled, false)
        handleItems(item.editControls, [...path, item.relationKey], hiddenFields, disableFields, forceDisabled, false)
      } else if(item.type=='list-select' && item.addControls ){
        handleItems(item.addControls, [...path, item.relationKey], hiddenFields, disableFields, forceDisabled, false)
        handleItems(item.editControls, [...path, item.relationKey], hiddenFields, disableFields, forceDisabled, false)
      }
    }
  }
}