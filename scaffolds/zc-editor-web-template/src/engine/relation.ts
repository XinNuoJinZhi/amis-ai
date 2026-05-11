import {Column, Relation, Table} from "./model";
import {genForm} from "./form";
import {filterKey, genCrud, generatePermissionString, getColumns, getFields, getNameFields} from "./crud";

function getInverseSide(relation: Relation, t: Table, tables: Table[]) {
  if (relation.inverseSide != null) {
    return tables.filter(t => t.key == relation.targetKey)[0].relations
      .filter(r => r.key == relation.inverseSide)[0];
  } else {
    for (const t of tables) {
      const r = t.relations.filter(r => r.targetKey == t.key && r.inverseSide == relation.key)[0]
      if (r != null) {
        return r;
      }
    }
    return null;
  }
}

export function getCrudOrViewRelationColumn(c: Column, t: Table, tables: Table[], isStatic: boolean = false,
                                            ref?: string[] | null, picker: boolean = false, dataManagePermission: boolean = true) {
  const relation = t.relations.filter(i => i.key == c.key)[0];
  if (ref != null && ref.includes(relation.id)) {
    return null;
  }
  const inverseSide = getInverseSide(relation, t, tables);
  if (inverseSide != null) {
    if (ref != null && ref.includes(inverseSide.id)) {
      return null;
    }
  }
  if (ref == null) {
    ref = [relation.id];
  } else {
    ref.push(relation.id);
  }
  if (inverseSide != null) {
    ref.push(inverseSide.id);
  }
  let column: any = {label: c.name};
  const table = tables.filter(i => i.key == relation.targetKey)[0];
  if (relation.displayType == null || relation.displayType == '') {
    if (relation.relationMode == '1:1' || relation.relationMode == 'n:1') {
      relation.displayType = 'titleField';
    } else {
      relation.displayType = 'dialog';
    }
  }
  if (relation.displayColumns == null) {
    relation.displayColumns = getDefaultDisplayColumns(relation, table, t);
  } else {
    relation.displayColumns = relation.displayColumns.filter(c => {
      const f = table.fields.filter(i => c == i.key)[0];
      if (f == null) {
        return false;
      }
      return !f.isForeignKey;
    });
  }
  if (relation.displayType == 'titleField') {
    column.type = isStatic ? 'static' : 'text';
    let nameFields = [];
    if (table.titleTpl == null || table.titleTpl == '') {
      column.name = c.key + '.' + table.nameField;
      nameFields.push(table.nameField);
    } else {
      column.name = c.key;
      column.tpl = table.titleTpl;
      nameFields = getNameFields(table);
      const hasRelationNameField = nameFields.some(f => {
        const nameField = table.fields.filter(i => i.key == f)[0];
        if (nameField == null) {
          return false;
        }
        return nameField.type == 'relation';
      });
      if (!hasRelationNameField) {
        table.fields.forEach(i => {
          column.tpl = column.tpl.replaceAll('{{' + i.key + '}}', '${' + c.key + '.' + i.key + '}')
        });
      } else {
        column.tpl = column.tpl.replaceAll('{{', '${').replaceAll('}}', '}')
        const column1 = column;
        if (isStatic) {
          column1.type = 'text';
        }
        column = {
          type: isStatic ? 'static-page' : 'service',
          label: column1.label,
          body: column1
        };
      }
    }
    const fields = getFields(table.fields, table.relations, true, c => {
      if (nameFields.includes(c.key)) {
        return true;
      }
      return relation.displayColumns.includes(c.key) && c.type != 'relation';
    }).map((c, i) => `__fields[${i}]=${c.key}`).join("&");
    if (!(relation.relationMode == '1:1' && relation.inverseSide != null && relation.inverseSide != '')) {
      column.api = `model://${table.dsKey}.${table.key}/` + '${' + relation.foreignKey + '}?' + fields;
    } else {
      column.api = {
        url: `model://${table.dsKey}.${table.key}?` + fields +
          '&' + relation.foreignKey + '=%24%7B' + table.primaryField + '%7D',
        responseData: {
          "&": "${items|first}"
        }
      }
    }
    if (isStatic) {
      column.initApi = column.api;
    }
  } else if (relation.displayType == 'embed' && (relation.relationMode == '1:1' || relation.relationMode == 'n:1')) {
    column.type = isStatic ? "static-property" : "property";
    column.name = c.key;
    column.width = 300;
    column.column = 1;
    const items = getColumns(table, tables, false, false, isStatic, ref,
      c => relation.displayColumns.includes(c.key) && c.type != 'relation', false, false, dataManagePermission);
    column.items = items.map(i => {
      const item = {
        label: i.label,
        body: i
      }
      delete i.label;
      return item;
    })
    const fields = getFields(table.fields, table.relations, false, c => {
      if (!filterKey(items, c)) {
        return false;
      }
      return c.type != 'relation';
    }).map((c, i) => `__fields[${i}]=${c.key}`).join("&");
    if (!(relation.relationMode == '1:1' && relation.inverseSide != null && relation.inverseSide != '')) {
      column.api = `model://${table.dsKey}.${table.key}/` + '${' + relation.foreignKey + '}?' + fields;
      column.sendOn = '${' + relation.foreignKey + '}';
    } else {
      column.api = `model://${table.dsKey}.${table.key}?` + fields +
        '&' + relation.foreignKey + '=%24%7B' + table.primaryField + '%7D';
      column.sendOn = '${' + table.primaryField + '}';
    }
  } else if (relation.displayType == 'embed' && (relation.relationMode == '1:n' || relation.relationMode == 'n:n')) {
    column.type = "container"; // isStatic ? 'static-container' : "container";
    column.name = c.key;
    const columns = getColumns(table, tables, false, false, true,
      ref, c => relation.displayColumns.includes(c.key) && c.type != 'relation');
    columns.forEach(c => {
      c.width = 160;
    })
    let api;
    if (relation.relationMode == 'n:n') {
      api = `model://${t.dsKey}.${t.key}/` + '${' + table.primaryField + '}?__fields[0]=' + table.primaryField + '&' +
        getFields(table.fields, table.relations, false, c => {
          if (c.type == 'relation') {
            return false;
          }
          if (c.isForeignKey) {
            return true;
          }
          if (!filterKey(columns, c)) {
            return false;
          }
          return relation.displayColumns.includes(c.key);
        }).map((c, i) => `__fields[${i + 1}]=${column.name}.${c.key}`).join("&");
    } else if (relation.relationMode == '1:n') {
      api = `model://${table.dsKey}.${table.key}?` +
        getFields(table.fields, table.relations, false, c => {
          if (!filterKey(columns, c)) {
            return false;
          }
          return relation.displayColumns.includes(c.key) && c.type != 'relation';
        }).map((c, i) => `__fields[${i}]=${c.key}`).join("&") +
        '&' + relation.foreignKey + '=%24%7B' + table.primaryField + '%7D';
    }
    column.body = [
      {
        type: "table",
        name: "datalist",
        columns,
        autoGenerateFilter: false,
        affixHeader: false,
        defaultParams: {
          orderBy: "",
          orderDir: ""
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
        syncLocation: true,
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
        headerToolbar: [
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
          }
        ],
        columnsTogglable: false,
        source: "${" + c.key + "}",
        className: "m-b-none"
      }
    ];
    column.api = api;
    column.sendOn = '${' + table.primaryField + '}';
  } else if (relation.displayType == 'dialog' || relation.displayType == 'drawer') {
    column.type = isStatic ? 'static-container' : "container";
    column.name = c.key;
    let apiUrlPart = null;
    let sendOn = null;
    let source = null;
    let nnInverseSideColumn = null;
    if (relation.relationMode == 'n:n') {
      if (relation.inverseSide != null) {
        nnInverseSideColumn = relation.inverseSide;
      } else {
        const targetTable = tables.filter(i => i.key == relation.targetKey)[0];
        nnInverseSideColumn = targetTable.relations
          .filter(i => i.relationMode == 'n:n' && i.inverseSide == relation.key)[0]?.key;
      }
      if (nnInverseSideColumn == null) {
        source = '${' + column.name + ' | default:[]}';
      } else {
        apiUrlPart = nnInverseSideColumn + '.' + t.primaryField + '=%24%7Bfk%7D';
        sendOn = '${fk}';
      }
    } else {
      apiUrlPart = relation.foreignKey + '=%24%7Bfk%7D';
      sendOn = '${fk}';
    }
    const crud = genCrud(table, tables,
      {
        canSearch: relation.relationMode != 'n:n' || nnInverseSideColumn != null,
        canImport: false,
        canExport: false,
        canTruncate: false,
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        isStatic: true,
        apiUrlPart,
        sendOn,
        source
      },
      dataManagePermission, ref != null ? [...ref] : null, c => relation.displayColumns.includes(c.key));
    if (relation.relationMode != 'n:n' || nnInverseSideColumn != null) {
      crud.api.forceAppendDataToQuery = true;
    } else {
      crud.api = {
        url: `model://${t.dsKey}.${t.key}/` + '${fk}?__fields[0]=' + table.primaryField + '&' +
          getFields(table.fields, table.relations, false, c => {
            if (c.type == 'relation') {
              return false;
            }
            if (c.isForeignKey) {
              return true;
            }
            if (!filterKey(crud.columns, c)) {
              return false;
            }
            return relation.displayColumns.includes(c.key);
          }).map((c, i) => `__fields[${i + 1}]=${column.name}.${c.key}`).join("&"),
        sendOn: '${fk}'
      };
      crud.forceAppendDataToQuery = true;
      handleService(crud.columns, false);
    }
    let actionType = relation.displayType;
    column.body = [
      {
        type: "button",
        level: "link",
        className: "no-padder",
        size: "sm",
        actionType: actionType,
        label: relation.displayTpl != null && relation.displayTpl != '' ? relation.displayTpl : `查看关联的「${relation.name}」列表`,
        [actionType]: {
          data: {
            fk: "${" + t.primaryField + "}"
          },
          title: `查看关联的「${relation.name}」列表`,
          size: "lg",
          body: crud,
          actions: [
            {
              type: "button",
              label: "取消",
              actionType: "cancel"
            },
            {
              type: "button",
              level: "primary",
              label: "确认",
              actionType: "cancel"
            }
          ]
        }
      }
    ];
  }
  if (relation.quickEdit && !isStatic && !picker) {
    column.quickEdit = getEdit(relation, table, t, tables, true, false, true, dataManagePermission, ref);
  }
  return column;
}

function setApi(column: any, relation: Relation, table: Table, t: Table, columns?: []) {
  if (relation.relationMode == '1:1' || relation.relationMode == '1:n') {
    const fields = getFields(table.fields, table.relations, false, c => {
      if (c.isPrimaryKey || c.isForeignKey) {
        return true;
      }
      if (columns != null && !filterKey(columns, c)) {
        return false;
      }
      return c.type != 'relation';
    }).map((c, i) => `__fields[${i}]=${c.key}`).join("&");
    if (relation.relationMode == '1:1' && (relation.inverseSide == null || relation.inverseSide == '')) {
      column.api = `model://${table.dsKey}.${table.key}/` + '${' + relation.foreignKey + '}?' + fields;
      column.sendOn = '${' + relation.foreignKey + '}';
    } else {
      column.api = `model://${table.dsKey}.${table.key}?` + fields +
        '&' + relation.foreignKey + '=%24%7B' + table.primaryField + '%7D';
      column.sendOn = '${' + table.primaryField + '}';
    }
  } else if (relation.relationMode == 'n:n') {
    column.api = `model://${t.dsKey}.${t.key}/` + '${' + table.primaryField + '}?__fields[0]=' + table.primaryField + '&' +
      getFields(table.fields, table.relations, false, c => {
        if (c.type == 'relation') {
          return false;
        }
        if (c.isPrimaryKey || c.isForeignKey) {
          return true;
        }
        if (columns != null && !filterKey(columns, c)) {
          return false;
        }
        return relation.displayColumns.includes(c.key);
      }).map((c, i) => `__fields[${i + 1}]=${column.name}.${c.key}`).join("&");
    column.sendOn = '${' + table.primaryField + '}';
  }
}

function getEdit(relation: Relation, table: Table, t: Table, tables: Table[], quickEdit: boolean, tableQuickEdit: boolean = false,
                 optionsAllFields: boolean = false, dataManagePermission: boolean = true, ref?: string[]) {
  const column: any = {label: !quickEdit ? relation.name : ""}
  let config: any;
  if (!quickEdit) {
    config = relation;
  } else {
    config = relation.quickEditSettings;
  }
  if (config.inputType == null || config.inputType == '') {
    if (relation.relationMode == '1:1') {
      config.inputType = 'embed';
    } else if (relation.relationMode == 'n:1') {
      config.inputType = 'select';
    } else if (relation.relationMode == '1:n') {
      config.inputType = 'combo';
    } else {
      config.inputType = 'picker';
    }
  }
  if (relation.displayColumns == null) {
    relation.displayColumns = getDefaultDisplayColumns(relation, table, t);
  } else {
    relation.displayColumns = relation.displayColumns.filter(c =>
      table.fields.some(i => c == i.key));
  }
  if (config.inputColumns == null) {
    config.inputColumns = getDefaultInputColumns(relation, table, t);
  } else {
    config.inputColumns = config.inputColumns.filter(c =>
      table.fields.some(i => c == i.key));
  }
  if (relation.relationMode == '1:n' || relation.relationMode == 'n:n') {
    config.inputCreateable = config.inputCreateable ?? true;
    config.inputEditable = config.inputEditable ?? true;
    config.inputRemovable = config.inputRemovable ?? true;
  }
  if (config.inputType == 'embed' || config.inputType == 'combo') {
    column.type = 'combo';
    column.name = relation.key;
    column.required = !relation.isNullable;
    column.multiLine = true;
    if (relation.relationMode == '1:1' || relation.relationMode == 'n:1') {
      column.items = genForm(table, tables, ref != null ? [...ref] : null, null, false, !quickEdit, false, dataManagePermission);
      column.multiple = false;
      if (!relation.isNullable) {
        column.required = true;
      }
    } else {
      column.items = genForm(table, tables, ref != null ? [...ref] : null,
        c => config.inputColumns.includes(c.key), false, !quickEdit, false, dataManagePermission);
      column.multiple = true;
      if (config.inputCreateable) {
        column.addable = generatePermissionString(table.dsKey, table.key, 'create', dataManagePermission);
      }
      if (config.inputEditable) {
        column.editable = generatePermissionString(table.dsKey, table.key, 'update', dataManagePermission);
      }
      if (config.inputRemovable) {
        column.removable = generatePermissionString(table.dsKey, table.key, 'delete', dataManagePermission);
      }
    }
    setApi(column, relation, table, t, column.items);
    if (relation.relationMode == '1:n' && table.type == 1) {
      column.items.forEach(c => {
        const r = table.relations.filter(i => i.key == c.name || i.key == c.relationKey)[0]
        if (r != null && r.relationMode == 'n:1'
          && t.relations.some(i => i.targetKey == r.targetKey && i.relationMode == 'n:n'
          && (r.inputType == 'select' || r.inputType == 'radios' || r.inputType == 'button-group-select' || r.inputType == 'list-select'))) {
          const _t = tables.filter(i => i.key == r.targetKey)[0];
          c.autoFill = {
            [`${r.key}.${_t.primaryField}`]: '${' + _t.primaryField + '}'
          };
          c.editable = false;
        }
      })
    }
  } else if (config.inputType == 'select' || config.inputType == 'radios' || config.inputType == 'checkboxes'
    || config.inputType == 'button-group-select' || config.inputType == 'list-select') {
    column.type = config.inputType;
    if (relation.relationMode == '1:1' || relation.relationMode == 'n:1') {
      column.name = relation.foreignKey;
    } else {
      column.name = relation.key;
      setApi(column, relation, table, t);
    }
    column.required = !relation.isNullable;
    if (table.titleTpl != null && table.titleTpl != '') {
      column.menuTpl = table.titleTpl.replaceAll('{{', '${').replaceAll('}}', '}')
      column.labelTpl = column.menuTpl;
      column.labelField = '__title';
    } else {
      column.labelField = table.nameField;
    }
    column.valueField = table.primaryField;
    let source = `model://${table.dsKey}.${table.key}/options?`;
    let nameFields = [];
    if (!optionsAllFields) {
      if (table.titleTpl == null || table.titleTpl == '') {
        nameFields.push(table.nameField);
      } else {
        nameFields = getNameFields(table);
      }
    } else {
      nameFields = getFields(table.fields, table.relations, true, c => true).map(c => c.key);
    }
    source = source + nameFields.map((c, i) => `__fields[${i}]=${c}`).join("&");
    const addControls = genForm(table, tables, ref != null ? [...ref] : null, c => config.inputColumns.includes(c.key), false, true, true, dataManagePermission);
    if (config.inputCreateable && table.type != 1) {
      column.creatable = generatePermissionString(table.dsKey, table.key, 'create', dataManagePermission);
      column.addApi = `post:model://${table.dsKey}.${table.key}`;
      column.createBtnLabel = `新增${table.name}`;
      if (relation.relationMode == '1:1' || relation.relationMode == 'n:1') {
        column.addApi = `post:model://${table.dsKey}.${table.key}`;
      }
      column.addControls = addControls;
      column.addDialog = {
        data: {
          $$noPer: `\${$$noPer}`,
          $$permissionsData: `\${$$permissionsData}`,
        }
      }
    }
    const editControls = genForm(table, tables, ref != null ? [...ref] : null, c => config.inputColumns.includes(c.key), true, true, true, dataManagePermission);
    if (table.type == 1) {
      editControls.forEach(c => {
        const r = table.relations.filter(i => i.key == c.name || i.key == c.relationKey)[0]
        if (r != null && r.relationMode == 'n:1'
          && t.relations.some(i => i.targetKey == r.targetKey && i.relationMode == 'n:n')) {
          c.disabled = true;
        }
      })
    }
    if (config.inputEditable) {
      column.editable = generatePermissionString(table.dsKey, table.key, 'update', dataManagePermission);
      column.editApi = `post:model://${table.dsKey}.${table.key}/` + '${' + table.primaryField + '}';
      column.editControls = editControls;
      const fields = getFields(table.fields, table.relations, true, c => {
        if (!filterKey(editControls, c)) {
          return false;
        }
        return config.inputColumns.includes(c.key);
      }).map((c, i) => `__fields[${i}]=${c.key}`).join("&");
      column.editInitApi = `model://${table.dsKey}.${table.key}/` + '${' + table.primaryField + '}?' + fields;
      if (relation.relationMode == '1:1' || relation.relationMode == 'n:1') {
        column.editDialog = {
          data: {
            $$noPer: `\${$$noPer}`,
            $$permissionsData: `\${$$permissionsData}`,
            [`${table.primaryField}`]: '${' + table.primaryField + '}'
          }
        }
      }
    }
    const fields = getFields(table.fields, table.relations, true, c => {
      if (!optionsAllFields && !nameFields.includes(c.key)) {
        return false;
      }
      if (nameFields.includes(c.key)) {
        return true;
      }
      if (c.type == 'relation' && !filterKey(addControls, c) && !filterKey(editControls, c)) {
        return false;
      }
      if (c.isForeignKey) {
        const relation = table.relations.filter(i => i.foreignKey == c.key)[0];
        const f = table.fields.filter(i => i.key == relation.key)[0];
        if (!filterKey(addControls, f) && !filterKey(editControls, f)) {
          return false;
        }
      }
      return relation.displayColumns.includes(c.key) || config.inputColumns.includes(c.key);
    });
    if (relation.relationMode == '1:1' || relation.relationMode == 'n:1') {
      column.autoFill = {};
      if (config.autoFills != null) {
        for (let af of config.autoFills) {
          column.autoFill[af.to] = '${' + af.from + '}';
        }
      }
      column.autoFill[`${relation.key}.${table.primaryField}`] = '${' + table.primaryField + '}';
      if (optionsAllFields) {
        fields.filter(c => {
          return c.type != 'relation';
        }).forEach(c => {
          column.autoFill[`${relation.key}.${c.key}`] = '${' + c.key + '}';
        })
      } else {
        column.autoFill[`${relation.key}.${table.nameField}`] = '${' + table.nameField + '}';
      }
    } else {
      column.autoFill = {
        [relation.key]: "${items|pick:" + [table.primaryField + '~' + table.primaryField, ...fields.filter(c => {
          return c.type != 'relation';
        }).map(c => c.key)].join(",") + "}"
      };
    }
    if (config.inputType == 'select') {
      column.autoFillStrictMode = true;
      if (relation.isNullable) {
        column.clearable = true;
      }
      if (relation.relationMode == '1:n' || relation.relationMode == 'n:n') {
        column.multiple = true;
        column.joinValues = false;
        const _fields = fields.map((c, i) => `__fields[${i}]=${c.key}`).join("&");
        column.source = `model://${table.dsKey}.${table.key}/options?${_fields}`;
      } else {
        if (relation.relationMode == '1:1') {
          column.multiple = false;
        }
        if (config.inputCreateable || config.inputEditable || quickEdit) {
          const _fields = fields.map((c, i) => `__fields[${i}]=${c.key}`).join("&");
          column.autoComplete = `model://${table.dsKey}.${table.key}/options?${_fields}&term=` + "${term}";
        } else {
          if (nameFields.length > 0) {
            source = source + "&";
          }
          column.autoComplete = source + "term=" + "${term}";
        }
        //form表单1:1和n:1 初始化不请求接口报错，暂时这样修改
        column.formInited = true;
      }
    } else if (config.inputType == 'radios' || config.inputType == 'checkboxes'
      || config.inputType == 'button-group-select' || config.inputType == 'list-select') {
      if (config.inputType == 'radios') {
        column.inline = true;
      }
      if (relation.relationMode == '1:n' || relation.relationMode == 'n:n') {
        column.multiple = true;
        column.joinValues = false;
      }
      const _fields = fields.map((c, i) => `__fields[${i}]=${c.key}`).join("&");
      column.source = `model://${table.dsKey}.${table.key}/options?${_fields}`;
      if (config.inputType == 'checkboxes' && config.inputEditable) {
        column.inline = false;
      }
    }
    if (config.inputRemovable) {
      column.removable = generatePermissionString(table.dsKey, table.key, 'delete', dataManagePermission);
      column.deleteApi = `delete:model://${table.dsKey}.${table.key}/` + '${' + table.primaryField + '}';
      column.confirmText = "确定要删除?";
    }
  } else if (config.inputType == 'table') {
    column.type = 'input-table';
    column.name = relation.key;
    column.required = !relation.isNullable;
    column.addBtnLabel = '新增';
    column.addBtnIcon = '';
    column.updateBtnLabel = '编辑';
    column.updateBtnIcon = '';
    column.confirmBtnLabel = '确认';
    column.confirmBtnIcon = '';
    column.cancelBtnLabel = '取消';
    column.cancelBtnIcon = '';
    column.deleteBtnLabel = '删除';
    column.deleteBtnIcon = '';
    if (config.inputCreateable && !table.fields.some(c => c.type == 'relation' && !c.isNullable)) {
      column.addable = generatePermissionString(table.dsKey, table.key, 'create', dataManagePermission);
    }
    if (config.inputEditable) {
      column.editable = generatePermissionString(table.dsKey, table.key, 'update', dataManagePermission);
    }
    if (config.inputRemovable) {
      column.removable = generatePermissionString(table.dsKey, table.key, 'delete', dataManagePermission);
    }
    column.deleteConfirmText = "确认删除?";
    column.needConfirm = true;
    column.multiple = true;
    const cs = getColumns(table, tables, false, true, false,
      ref != null ? [...ref] : null, c => {
        return config.inputColumns.includes(c.key);
      }, false, true, dataManagePermission);
    cs.forEach((c, index) => {
      c.width = 160;
      if (c.type == 'property') {
        c.items.forEach(_c => {
          if (_c.body.type == 'text') {
            _c.body.type = 'static-text';
          }
        })
      }
    })
    column.columns = cs;
    setApi(column, relation, table, t, cs);
  } else if (config.inputType == 'picker') {
    column.type = "picker";
    column.name = relation.key;
    column.required = !relation.isNullable;
    column.embed = true;
    const crud = genCrud(table, tables,
      {
        canImport: false,
        canExport: false,
        canTruncate: false,
        canView: false,
        canAdd: config.inputCreateable && !tableQuickEdit,
        canEdit: !tableQuickEdit,
        canDelete: config.inputRemovable && !tableQuickEdit,
        picker: true
      }, dataManagePermission, ref != null ? [...ref] : null);
    crud.syncLocation = false;
    crud.bodyClassName = "no-border m-b-none";
    crud.placeholder = "暂无数据";
    crud.data = {};
    table.fields.filter(c => !c.isDeleteUser && !c.isDeleteDate && !c.isDeleteFlag && !c.isTenantCode && !c.isForeignKey
      && c.type != 'relation').forEach(c => {
      crud.data[c.key] = '';
    });
    crud.mode = "table";
    crud.tableClassName = "b-a";
    crud.columns[crud.columns.length - 1].buttons?.forEach(i => {
      if (i.label == '编辑' && table.type == 1) {
        i.dialog.body[0].body.forEach(c => {
          const r = table.relations.filter(i => i.key == c.name || i.key == c.relationKey)[0]
          if (r != null && r.relationMode == 'n:1'
            && t.relations.some(i => i.targetKey == r.targetKey && i.relationMode == 'n:n')) {
            c.disabled = true;
          }
        })
      }
      if (i.label == '删除') {
        i.removeSelectItem = true;
      }
    })
    column.source = crud.api;
    column.pickerSchema = crud;
    column.joinValues = false;
    column.valueField = table.primaryField
    column.labelField = table.titleTpl != null && table.titleTpl != '' ? '__title' : table.nameField;
    column.multiple = true;
    setApi(column, relation, table, t, crud.columns);
    handleService(crud.columns, false);
  }
  column.relationKey = relation.key
  return column;
}

function getDefaultDisplayColumns(relation: Relation, table: Table, t: Table) {
  return table.fields.filter(c => {
    if (c.type == 'relation') {
      if (relation.relationMode == '1:1' || relation.relationMode == 'n:1') {
        return false;
      }
    }
    return !c.isDeleteUser && !c.isDeleteDate && !c.isDeleteFlag && !c.isTenantCode && !c.isForeignKey;
  }).map(c => c.key);
}

function getDefaultInputColumns(relation: Relation, table: Table, t: Table) {
  return table.fields.filter(c => {
    return !c.isPrimaryKey && !c.isCreateUser && !c.isCreateDate && !c.isUpdateUser && !c.isUpdateDate
      && !c.isDeleteUser && !c.isDeleteDate && !c.isDeleteFlag && !c.isTenantCode && !c.isForeignKey;
  }).map(c => c.key);
}

export function getFormRelationColumn(c: Column, t: Table, tables: Table[], tableQuickEdit: boolean = false,
                                      optionsAllFields: boolean = false, dataManagePermission: boolean = true, ref?: string[] | null) {
  const relation = t.relations.filter(i => i.key == c.key)[0];
  if (ref != null && ref.includes(relation.id)) {
    return null;
  }
  const inverseSide = getInverseSide(relation, t, tables);
  if (inverseSide != null) {
    if (ref != null && ref.includes(inverseSide.id)) {
      return null;
    }
  }
  if (ref == null) {
    ref = [relation.id];
  } else {
    ref.push(relation.id);
  }
  if (inverseSide != null) {
    ref.push(inverseSide.id);
  }
  const table = tables.filter(i => i.key == relation.targetKey)[0];
  return getEdit(relation, table, t, tables, false, tableQuickEdit, optionsAllFields, dataManagePermission, ref);
}

export function handleService(items: any[], firstLevel: boolean = true) {
  for (let i = 0; i < items.length; i++) {
    let c = items[i];
    if (c.api != null && c.type != 'service' && !(c.type == 'static-page' && c.body?.type != 'property')) {
      if (c.type == 'combo') {
        handleService(c.items, false);
      } else if (c.type == 'static-property' || c.type == 'property') {
        handleService(c.items, false);
      } else if (c.type == 'input-table') {
        handleService(c.columns, false);
      }
      if (!firstLevel) {
        items[i] = {
          type: "service",
          label: c.label,
          width: c.width,
          api: {
            method: "get",
            url: c.api,
            sendOn: c.sendOn
          },
          body: c,
          source: '${' + c.name + '}',
          quickEdit: c.quickEdit,
          _replaceQuickEdit: c._replaceQuickEdit
        };
        if (c.multiple) {
          if (c.api.indexOf('=%24%7B') != -1) {
            items[i].api.responseData = {
              [c.name]: "${items}"
            }
          }
        } else {
          if ((c.type == 'text' || c.type == 'static' || c.type == 'static-text') && (c.name.indexOf('.') != -1 || c.tpl != null && c.tpl.indexOf('.') != -1)) {
            delete c.source;
            delete items[i].body.label;
            if (c.name.indexOf('.') != -1) {
              c.name = c.name.split('.')[1];
            } else if (c.tpl != null && c.tpl.indexOf('.') != -1) {
              c.tpl = c.tpl.replaceAll(c.name + '.', '');
            }
          } else if (c.type == 'static-property' || c.type == 'property') {
            delete c.source;
            if (c.api.indexOf('=%24%7B') != -1) {
              items[i].api.responseData = {
                [c.name]: "${items|first}"
              }
            } else {
              items[i].api.responseData = {
                [c.name]: "$$"
              }
            }
          } else if (c.type == 'container' || (c.body != null && c.body[0]?.type == 'table')) {
            if (c.api.indexOf('=%24%7B') != -1) {
              delete c.body[0].source;
            }
          } else {
            if (c.api.indexOf('=%24%7B') != -1) {
              items[i].api.responseData = {
                [c.name]: "${items|first}"
              }
            } else {
              items[i].api.responseData = {
                [c.name]: "$$"
              }
            }
          }
        }
        delete c.api;
        delete c.sendOn;
        delete c.quickEdit;
        delete c._replaceQuickEdit;
      }
    }
    if (items[i]._replaceQuickEdit) {
      const quickEdit = items[i].quickEdit
      items[i].quickEdit = { ...items[i] }
      items[i].quickEdit.label = quickEdit?.label
      delete items[i].quickEdit.quickEdit
      delete items[i].quickEdit._replaceQuickEdit
    }
  }
  return items;
}
