import {addRule, toast} from 'amis';
import * as uuid from 'uuid';
import {formatToData} from "@/utils/util";
import {getMoneyList, getZidian, getZippedSnowflakeId} from "@/api/entitymanage";
import {processIndexFields} from '@/utils';
import {checkAndRenameField} from "@/pages/EntityManage/tabs/tabs1/modelDesign/dialog/relationship/util";
// 获取流水号组合规则
export function getRulesNumber(data) {
  let returnData:any = []
  const d = new Date()
  returnData = data.map(sjw=>{
    if(sjw.type == 'date' && sjw.format.toUpperCase() == 'YYYYMM'){
      return `${d.getFullYear()}${String((d.getMonth() + 1)).padStart(2, '0')}`
    } else if(sjw.type == 'date' && sjw.format.toUpperCase() == 'YYYYMMDD'){
      return `${d.getFullYear()}${String((d.getMonth() + 1)).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    } else if(sjw.type == 'date' && sjw.format.toUpperCase() == 'YY'){
      return String(d.getFullYear()).slice(-2)
    } else if(sjw.type == 'date' && sjw.format.toUpperCase() == 'MM'){
      return String((d.getMonth() + 1)).padStart(2, '0')
    } else if(sjw.type == 'date' && sjw.format.toUpperCase() == 'DD'){
      return String(d.getDate()).padStart(2, '0')
    } else if(sjw.type == 'date' && sjw.format.toUpperCase() == 'YYYY'){
      return new Date().getFullYear()
    } else if(sjw.type == 'date' && sjw.format.toUpperCase() == 'YYYYMMDDHH'){
      return `${d.getFullYear()}${String((d.getMonth() + 1)).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}`
    } else if(sjw.type == 'date' && sjw.format.toUpperCase() == 'YYYYMMDDHHMM'){
      return `${d.getFullYear()}${String((d.getMonth() + 1)).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
    } else if(sjw.type == 'date' && sjw.format.toUpperCase() == 'YYYYMMDDHHMMSS'){
      return `${d.getFullYear()}${String((d.getMonth() + 1)).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`
    } else if (sjw.type == 'auto-increase'){
      return String(sjw.options.start).padStart(sjw.options.length, '0');
    } else if(sjw.type == 'text'){
      return sjw.text
    } else if(sjw.type == 'field'){
      return sjw.fieldCode ? '{{'+sjw.fieldCode.fieldCode+ (sjw.fieldCode.relationField ? '.'+ sjw.fieldCode.relationField : '') +'}}' : ''
    }
  })
  return returnData
}
// 新增字段方法
export function createField(doAction,event) {
  let moneyData:any = []
  let dictionaryList:any = []
  getMoneyList().then(res=>{
    moneyData = res.data;
  })
  getZidian().then((res: any) => {
    dictionaryList = res.data.data;
  });
  let fieldCrudData = JSON.parse(sessionStorage.getItem('fieldCrud')!)
  let haveContentCode = []
  haveContentCode = fieldCrudData.filter((res: any) => {
    return res.systemFieldType == 9
  })
  let tenantCodeName = 'tenantCode'
  if (haveContentCode.length > 0) {
    tenantCodeName = haveContentCode[0].code
  }
  let haveTreeParent = []
  haveTreeParent = fieldCrudData.filter((res: any) => {
    return res.type == 'parent'
  })
  let treeParentName = 'parentId'
  if (haveTreeParent.length > 0) {
    treeParentName = haveTreeParent[0].code
  }
  doAction({
    actionType: 'disabled',
    componentId: 'createForm'
  });
  doAction({
    actionType: 'validate',
    componentId: 'createForm',
    outputVar: 'validateResult'
  });
  setTimeout(() => {
    if (event.data?.validateResult?.error =='依赖的部分字段没有通过验证') {
      doAction({
        actionType: 'enabled',
        componentId: 'createForm'
      });
      return;
    }
    if (
        event.data.fieldCode.toUpperCase() == 'ID' ||
        event.data.fieldCode.toUpperCase() == treeParentName.toUpperCase() ||
        event.data.fieldCode.toUpperCase() == tenantCodeName.toUpperCase() ||
        event.data.fieldCode.toUpperCase() == 'CREATEDAT' ||
        event.data.fieldCode.toUpperCase() == 'UPDATEDAT' ||
        event.data.fieldCode.toUpperCase() == 'CREATEDBY' ||
        event.data.fieldCode.toUpperCase() == 'UPDATEBY' ||
        event.data.fieldCode.toUpperCase() == 'DELETEDBY' ||
        event.data.fieldCode.toUpperCase() == 'DELETEDAT' ||
        event.data.fieldCode.toUpperCase() == 'DELETED'
    ) {
      return;
    }
    if (event.data.fieldType == 'date' &&
        event.data.defaultValueMode == 'static') {
      event.data.defaultValue = event.data.defaultValue;
    } else if (
        event.data.fieldType == 'datetime' &&
        event.data.defaultValueMode == 'static'
    ) {
      event.data.defaultValue = event.data.defaultValue;
    } else if (
        event.data.fieldType == 'time' &&
        event.data.defaultValueMode == 'static'
    ) {
      event.data.defaultValue = event.data.defaultValue;
    } else {
      event.data.defaultValue = event.data.defaultValue;
    }
    let rightData: any = {
      onText: event.data.onText,
      offText: event.data.offText,
      rules: event.data.rules,
      colIgnoreTenant: event.data.colIgnoreTenant ? event.data.colIgnoreTenant : JSON.parse(sessionStorage.getItem('ignoreTenantFlag')!),
      sort: 1,
      foreignKeyFlag: false,
      systemFieldType: 0,
      nullable: event.data.nullable, // 是否允许空值
      source: event.data.source
          ? 'app://dictionary/running/list?level=2&encoded=' +
          event.data.source
          : null, // 枚举字典
      sources: event.data.source, // 枚举字典
      msources: event.data.source, // 枚举字典
      token: event.data.token, // 密钥
      dbType: event.data.dbType,
      valueType: event.data.valueType, // 枚举的值类型
      integerType: event.data.integerType, // 整数类型
      decimalType: event.data.decimalType, // 整数类型
      allowedTypes: event.data.picFormat
          ? event.data.picFormat.split(',')
          : '', // 允许的格式
      picFormat: event.data.picFormat, // 允许的格式
      maxSize: event.data.maxSize, // 最大图片
      restrictRatio: event.data.restrictRatio, // 图片比率
      restrictRatioCustom:
      event.data.restrictRatioCustom, // 图片比率提示值
      allowInput: event.data.allowInput, // 是否允许修改
      addOptions: event.data.addOptions, // 枚举新增选项
      meiptions: event.data.meiptions, // 枚举选项值
      options: event.data.options, // 枚举选项值
      defaultValueMode:
      event.data.defaultValueMode, //默认值
      dateTimeDefaultValue:
      event.data.dateTimeDefaultValue, // 日期时间默认值
      dateDefaultValue:
      event.data.dateDefaultValue, // 日期默认值
      timeDefaultValue:
      event.data.timeDefaultValue, // 时间默认值
      minDateTime: event.data.minDateTime,
      minDateDate: event.data.minDateDate,
      minDateTimes: event.data.minDateTimes,
      maxDateTime: event.data.maxDateTime,
      maxDateDate: event.data.maxDateDate,
      maxDateTimes: event.data.maxDateTimes,
      comment: event.data.comment, // 注释
      code: event.data.code, // 字段名
      value: event.data.value, // 字段名
      defaultValue: event.data.defaultValue, // 默认值
      name: event.data.name, // 显示标题
      requiredFlag: event.data.requiredFlag, // 是否必填
      unique: event.data.unique, // 是否唯一
      length: Number(event.data.length), // 当行文本长度
      colLength: event.data.colLength, // 长度
      maxLength: event.data.maxLength, // 长度
      format: event.data.format, // 格式
      formatMsg: event.data.formatMsg, // 提示信息
      minLength: event.data.minLength, // 最小长度
      minLengthMessage:
      event.data.minLengthMessage, // 最小长度提示
      maxLengthMessage:
      event.data.maxLengthMessage, // 最大长度提示
      matchRegexp: event.data.matchRegexp, // 正则校验
      regexpMessage: event.data.regexpMessage, // 正则校验提示信息
      type: event.data.type, // 基本字段类型
      relation: event.data.relation, // 关系
      advanced: event.data.advanced, // 高级字段
      maximum: event.data.maximum, // 最大值
      maxDate: event.data.maxDate, // 最大日期
      minimum: event.data.minimum, // 最小值
      minDate: event.data.minDate, // 最小日期
      minValueMessage: event.data.minValueMessage, // 最小值提示
      minDateMsg: event.data.minDateMsg, // 最小日期提示
      maxValueMessage: event.data.maxValueMessage, // 最大值提示
      maxDateMsg: event.data.maxDateMsg, // 最大日期提示
      accuracy: event.data.accuracy, // 精度
      decimal: event.data.decimal, // 小数位数
      saveNorms: event.data.saveNorms, // 存储规格
      currency: event.data.currency
          ? event.data.currency == 'CNY' ?
              {
                icon: '￥',
                label: '人民币',
                value: 'CNY'
              } : {
                icon: '$',
                label: '美元',
                value: 'USD'
              }
          : {
            icon: '￥',
            label: '人民币',
            value: 'CNY'
          }, // 币种
      driver: event.data.driver, // 对象存储
      accept: event.data.accept, // 文件允许的形式
      PictureRatio: event.data.PictureRatio, // 图片比率
      salt: event.data.salt, // 加盐
      description: event.data.describe, // 描述
      formula: event.data.formula, // 公式
      expression: event.data.expression, // 公式
      colTypeName: '',
      precision: 10, // 精度
      scale: '',
      validations: {},
      validationErrors: {}
    };
    if (rightData.type == 'text') {
      rightData.dbType = 'VARCHAR';
      delete rightData.currency;
    } else if (rightData.type == 'serial-number') {
      rightData.length = 255;
      delete rightData.currency;
    } else if (rightData.type == 'textarea') {
      rightData.dbType = 'TEXTAREA';
      delete rightData.currency;
    } else if (rightData.type == 'rich-text') {
      rightData.dbType = 'RICH_TEXT';
      delete rightData.currency;
    } else if (rightData.type == 'int') {
      if (rightData.integerType == 'INT') {
        rightData.dbType = 'INT';
      } else {
        rightData.dbType = 'BIGINT';
      }
      delete rightData.currency;
    } else if (rightData.type == 'bigint') {
      rightData.dbType = 'LONG';
      delete rightData.currency;
    } else if (rightData.type == 'float') {
      rightData.dbType = event.data.decimalType;
      rightData.scale = event.data.scale
          ? event.data.scale
          : 4;
      rightData.precision = event.data.precision
          ? event.data.precision
          : 10;
      delete rightData.currency;
    } else if (rightData.type == 'money') {
      rightData.dbType = 'BIGINT';
      if (moneyData.length > 0) {
        moneyData.forEach((element: any) => {
          if (element.value == rightData.currency) {
            let iconData = JSON.parse(element.extra);
            rightData.currency = {
              icon: iconData.symbol,
              label: element.label,
              value: element.value
            };
          }
        });
      }
    } else if (rightData.type == 'enum') {
      if(!rightData.addOptions){
        rightData.options = []
        rightData.addOptions = []
      }
      if (
          rightData.addOptions &&
          rightData.addOptions.length > 0
      ) {
        if (rightData.valueType == 'INTEGER') {
          rightData.options =
              rightData.addOptions.map(
                  (element: any) => {
                    return {
                      value: 'value' in element ? Number(element.value) : element.label,
                      label: 'label' in element ? element.label : '',
                      values: 'value' in element ? Number(element.value) : element.label,
                      labels: 'label' in element ? element.label : '',
                    };
                  }
              );
        } else {
          rightData.options =
              rightData.addOptions.map(
                  (element: any) => {
                    return {
                      value: 'value' in element ? element.value : element.label,
                      label: 'label' in element ? element.label : '',
                      values: 'value' in element ? element.value : element.label,
                      labels: 'label' in element ? element.label : '',
                    };
                  }
              );
        }
        rightData.addOptions = rightData.options;
      }
      if (rightData.valueType == 'INTEGER') {
        rightData.dbType = 'INTEGER';
      } else {
        rightData.dbType = 'VARCHAR';
        rightData.length = 255;
      }
      if (rightData.meiptions == 'dictionaries') {
        dictionaryList.forEach((element: any) => {
          if (element.name == rightData.sources) {
            rightData.sources = element.type;
            rightData.source = 'app://dictionary/running/list?level=2&encoded=' + element.type;
            if (element.dbType == 0) {
              rightData.dbType = 'VARCHAR';
              rightData.length = 255;
            }
            if (element.dbType == 1) {
              rightData.dbType = 'INTEGER';
            }
          }
        });
      }
      delete rightData.currency;
    } else if (rightData.type == 'boolean') {
      if (rightData.defaultValueMode == 'static') {
        rightData.defaultValue = rightData.defaultValue
                ? rightData.defaultValue == null
                    ? false
                    : rightData.defaultValue
                : false;
      }
      rightData.dbType = 'BOOLEAN';
      delete rightData.currency;
    } else if (rightData.type == 'date') {
      rightData.dbType = 'DATE';
      delete rightData.currency;
    } else if (rightData.type == 'datetime') {
      rightData.dbType = 'DATETIME';
      delete rightData.currency;
    } else if (rightData.type == 'date-range') {
      if (rightData.dbType == 'DATETIME') {
        rightData.defaultValue = rightData.dateTimeDefaultValue;
        rightData.minDate = rightData.minDateTime;
        rightData.maxDate = rightData.maxDateTime;
      } else if (rightData.dbType == 'DATE') {
        rightData.defaultValue = rightData.dateDefaultValue;
        rightData.minDate = rightData.minDateDate;
        rightData.maxDate = rightData.maxDateDate;
      } else if (rightData.dbType == 'TIME') {
        rightData.defaultValue = rightData.timeDefaultValue;
        rightData.minDate = rightData.minDateTimes;
        rightData.maxDate = rightData.maxDateTimes;
      }
      rightData.length = 200;
      delete rightData.currency;
      delete rightData.format;
    } else if (rightData.type == 'time') {
      rightData.dbType = 'TIME';
      delete rightData.currency;
    } else if (rightData.type == 'user') {
      if (rightData.defaultValueMode == 'current_user') {
        rightData.defaultValue = 'current_user';
      }
      rightData.length = 255;
      rightData.dbType = 'VARCHAR';
      delete rightData.currency;
    } else if (rightData.type == 'users') {
      rightData.length = 5000;
      rightData.usersDefaultValue = event.data.defaultValue;
      rightData.defaultValue ==
      event.data.defaultValue
          ? event.data.defaultValue
          : '';
      rightData.dbType = 'JSON';
      if (rightData.defaultValueMode == 'static') {
        console.log(rightData,'rightDatarightDatarightData');
      } else if (
          rightData.defaultValueMode == 'expression'
      ) {
        rightData.defaultValue = rightData.usersDefaultValue;
      }
      delete rightData.currency;
    } else if (rightData.type == 'department') {
      rightData.dbType = 'VARCHAR';
      rightData.length = 255;
      delete rightData.currency;
    } else if (rightData.type == 'owner') {
      delete rightData.currency;
    } else if (rightData.type == 'password') {
      rightData.dbType = 'VARCHAR';
      rightData.length = 255;
      delete rightData.currency;
    } else if (rightData.type == 'ciphertext') {
      rightData.length = 1000;
      rightData.dbType = 'VARCHAR';
      delete rightData.currency;
    } else if (rightData.type == 'address') {
      delete rightData.currency;
    } else if (rightData.type == 'json') {
      rightData.dbType = 'JSON';
      delete rightData.currency;
    } else if (rightData.type == 'formula') {
      delete rightData.currency;
    } else if (rightData.type == 'attachment') {
      rightData.length = 1000;
      rightData.dbType = 'ATTACHMENT';
      rightData.defaultValueMode = 'static';
      rightData.defaultValue = '';
      delete rightData.currency;
    } else if (rightData.type == 'image') {
      rightData.length = 1000;
      rightData.colTypeName = 'IMAGE';
      rightData.dbType = 'IMAGE';
      rightData.defaultValueMode = 'static';
      rightData.defaultValue = '';
      delete rightData.currency;
    }
    if (event.data.maxLength) {
      rightData.validations.maxLength = event.data.maxLength;
    }
    if (event.data.minLength) {
      rightData.validations.minLength = event.data.minLength;
    }
    if (event.data.matchRegexp) {
      rightData.validations.matchRegexp = event.data.matchRegexp;
    }
    if (event.data.maxLengthMessage) {
      rightData.validationErrors.maxLength = event.data.maxLengthMessage;
    }
    if (event.data.minLengthMessage) {
      rightData.validationErrors.minLength = event.data.minLengthMessage;
    }
    if (event.data.regexpMessage) {
      rightData.validationErrors.matchRegexp = event.data.regexpMessage;
    }
    if (event.data.minimum || event.data.minimum == 0) {
      rightData.validations.minimum = event.data.minimum;
    }
    if (rightData.minDate) {
      rightData.validations.minDate = rightData.minDate;
    }
    if (event.data.minValueMessage) {
      rightData.validationErrors.minimum = event.data.minValueMessage;
    }
    if (event.data.minDateMsg) {
      rightData.validationErrors.minDate = event.data.minDateMsg;
    }
    if (event.data.maximum) {
      rightData.validations.maximum = event.data.maximum;
    }
    if (rightData.maxDate) {
      rightData.validations.maxDate = rightData.maxDate;
    }
    if (event.data.maxValueMessage) {
      rightData.validationErrors.maximum = event.data.maxValueMessage;
    }
    if (event.data.maxDateMsg) {
      rightData.validationErrors.maxDateMsg = event.data.maxDateMsg;
    }
    let isHave = false;
    if (isHave) return;
    if (
        rightData.type == 'text' ||
        rightData.type == 'textarea' ||
        rightData.type == 'user' ||
        rightData.type == 'users' ||
        rightData.type == 'department'
    ) {
      if (
          rightData.defaultValueMode == 'static' &&
          (rightData.defaultValue == '' || !rightData.defaultValue)
      ) {
        rightData.defaultValue = '';
      }
    }
    let needConfig = {...rightData};
    delete needConfig.validations;
    delete needConfig.validationErrors;
    if(rightData.type != 'date-range'){
      delete rightData.dbType;
    }
    delete rightData.rules;
    delete rightData.colIgnoreTenant;
    delete rightData.length;
    if (
        (rightData.defaultValueMode == 'null' ||
            rightData.defaultValueMode == null) &&
        rightData.type != 'rich-text'
    ) {
      rightData.defaultValue = null;
    }
    console.log(rightData,'rightDatarightDatarightDatarightData');
    if (sessionStorage.getItem('fieldCrud')! != null) {
      let data = JSON.parse(sessionStorage.getItem('fieldCrud')!);
      let needV4 = uuid.v4();
      let familyList = data.filter((sj: any) => {
        return (
            sj.systemFieldType == 0 &&
            !sj.foreignKeyFlag &&
            sj.systemFieldType != 1 &&
            sj.type != 'relation' &&
            sj.type != 'formula'
        );
      });
      console.log(familyList, 'familyList');
      if (familyList.length == 0 && needConfig.type != 'formula') {
        doAction({
          actionType: 'setValue',
          componentId: 'nameField',
          args: {
            value: needConfig.code
          }
        });
        sessionStorage.setItem('nameFieldData', needConfig.code)
      }
      data.push({
        appId: event.data.appId,
        label: event.data.fieldCode,
        needId: needV4,
        config: needConfig,
        ...rightData
      });
      data.forEach(
          (element: any, index: number) => {
            element.sort = index + 1;
          }
      );
      let fieldCruds = data.map((res: any) => {
        if (res.type != 'relation'
            && res.systemFieldType != 6
            && res.systemFieldType != 8
            && res.systemFieldType != 9
            && res.systemFieldType != 7
            && res.type != 'formula') {
          return res;
        }
      });
      let puFieldCruds = data.map((res: any) => {
        if (
            !res.foreignKeyFlag &&
            res.systemFieldType == 0 &&
            res.type != 'relation'
        ) {
          return res;
        }
      });
      if (rightData.unique) {
        let keyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
        let fieldDatas = data.filter(
            (res: any) => {
              if (res.systemFieldType == 6) {
                return res;
              }
            }
        );
        let tenantCodeDatas = data.filter(
            (res: any) => {
              return res.systemFieldType == 9
            }
        );
        if (fieldDatas.length > 0) {
          if(tenantCodeDatas.length>0){
            keyData.push({
              needId: needV4,
              columnNames: rightData.code + ','+fieldDatas[0].code+',' + tenantCodeName,
              code: '_'+rightData.code,
              uniqueFlag: true,
              systemIndex: true
            });
          }else{
            keyData.push({
              needId: needV4,
              columnNames: rightData.code + ',' + fieldDatas[0].code,
              code: '_' + rightData.code,
              uniqueFlag: true,
              systemIndex: true
            });
          }
        } else {
          if(tenantCodeDatas.length>0){
            keyData.push({
              needId: needV4,
              columnNames: rightData.code + ',' + tenantCodeName,
              code: '_' + rightData.code,
              uniqueFlag: true,
              systemIndex: true
            });
          }else{
            keyData.push({
              needId: needV4,
              columnNames: rightData.code,
              code: '_' + rightData.code,
              uniqueFlag: true,
              systemIndex: true
            });
          }
        }
        let keyDatas = keyData.map(
            (res: any, index: number) => {
              return {...res, sort: index + 1,
                columnNames:processIndexFields(res.columnNames,data)
              };
            }
        );
        doAction({
          actionType: 'setValue',
          componentId: 'keyCrud',
          args: {
            value: {
              items: keyDatas
            }
          }
        });
        sessionStorage.setItem('keyCrud',JSON.stringify(keyDatas));
      }
      console.log(data,'data数据')
      let fieldKeyCruds = data.map((res: any) => {
        if (
            res.type != 'relation' &&
            res.type != 'formula' &&
            res.type != 'textarea' &&
            res.type != 'rich-text' &&
            res.type != 'json' &&
            res.type != 'attachment' &&
            res.type != 'image' &&
            res.type != 'ciphertext' &&
            res.type != 'users'
        ) {
          if (
              res.type == 'text' &&
              res.config.length < 768
          ) {
            return res;
          } else if (res.type != 'text') {
            return res;
          }
        }
      });
      let waiList = data.filter((res: any) => {
        if (
            res.type == 'text' &&
            res.config.length >= 20 && res.systemFieldType == 0
        ) {
          return res;
        } else if (
            res.type == 'int' &&
            res.systemFieldType == 0 &&
            res.config.integerType == 'BIGINT'
        ) {
          return res;
        }
      });
      let intList = data.filter((res: any) =>
          res.type == 'int' && res.config.dbType == 'BIGINT' && res.systemFieldType == 0)
      let cuList = data.filter((res: any) =>
          (res.type == 'text' || res.type == 'user') && res.systemFieldType == 0)
      let cuTimeList = data.filter((res: any) =>
          res.type == 'datetime' && res.systemFieldType == 0)
      let needPrimaryKeyType:any = []
      needPrimaryKeyType = data.filter((res: any) =>res.systemFieldType == 1)
      if(needPrimaryKeyType.length == 0){
        needPrimaryKeyType.push({type:'int',config:{dbType:'BIGINT'}})
      }
      let treeList = data.filter((res: any) => {
        if(res.type == needPrimaryKeyType[0].type &&
            res.config.dbType == needPrimaryKeyType[0].config.dbType && res.systemFieldType == 0){
          return res
        }
      })
      sessionStorage.setItem('intList', JSON.stringify(intList))
      sessionStorage.setItem('cuList', JSON.stringify(cuList))
      sessionStorage.setItem('cuTimeList', JSON.stringify(cuTimeList))
      sessionStorage.setItem('treeList', JSON.stringify(treeList))
      sessionStorage.setItem('waiList',JSON.stringify(waiList));
      sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
      sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
      sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
      sessionStorage.setItem('fieldCrud',JSON.stringify(data));
      let formulArr: any[] = [];
      data.forEach((item: any) => {
        if (
            item.type != 'formula' &&
            item.systemFieldType != 6 &&
            item.systemFieldType != 7 &&
            item.systemFieldType != 8 &&
            item.systemFieldType != 9
        ) {
          formulArr.push({...item,label:item.name,value:item.code});
        }
      });
      sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
      doAction({
        actionType: 'setValue',
        componentId: 'myField',
        args: {
          value: {
            items: data
          }
        }
      });
    } else {
      event.data.ceshi.push({
        appId: event.data.appId,
        needId: uuid.v4(),
        config: needConfig,
        ...rightData
      });
      event.data.ceshi.forEach(
          (element: any, index: number) => {
            element.sort = index + 1;
          }
      );
      let fieldCruds = event.data.ceshi.map(
          (res: any) => {
            if (res.type != 'relation' && res.systemFieldType != 6
                && res.systemFieldType != 7 && res.systemFieldType != 9
                && res.systemFieldType != 8 && res.type != 'formula') {
              return res;
            }
          }
      );
      let puFieldCruds = event.data.ceshi.map(
          (res: any) => {
            if (
                !res.foreignKeyFlag &&
                res.systemFieldType == 0 &&
                res.type != 'relation'
            ) {
              return res;
            }
          }
      );
      let fieldKeyCruds = event.data.ceshi.map(
          (res: any) => {
            if (
                res.type != 'relation' &&
                res.type != 'formula' &&
                res.type != 'textarea' &&
                res.type != 'rich-text' &&
                res.type != 'json' &&
                res.type != 'attachment' &&
                res.type != 'image' &&
                res.type != 'ciphertext' &&
                res.type != 'users'
            ) {
              if (
                  res.type == 'text' &&
                  res.config.length < 768
              ) {
                return res;
              } else if (res.type != 'text') {
                return res;
              }
            }
          }
      );
      let waiList = event.data.ceshi.filter(
          (res: any) => {
            if (
                res.type == 'text' &&
                res.config.length >= 20 && res.systemFieldType == 0
            ) {
              return res;
            } else if (
                res.type == 'int' &&
                res.systemFieldType == 0 &&
                res.config.integerType == 'BIGINT'
            ) {
              return res;
            }
          }
      );
      sessionStorage.setItem('waiList',JSON.stringify(waiList));
      sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
      sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
      sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
      sessionStorage.setItem('fieldCrud',JSON.stringify(event.data.ceshi));
      let formulArr: any[] = [];
      event.data.ceshi.forEach((item: any) => {
        if (
            item.type != 'formula' &&
            item.systemFieldType != 6 &&
            item.systemFieldType != 7 &&
            item.systemFieldType != 8 &&
            item.systemFieldType != 9
        ) {
          formulArr.push({...item,label:item.name,value:item.code});
        }
      });
      sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
      doAction({
        actionType: 'setValue',
        componentId: 'myField',
        args: {
          value: {
            items: event.data.ceshi
          }
        }
      });
    }
    doAction({
      actionType: 'reload',
      componentId: 'nameField'
    });
    toast.success('添加成功', {
      position: 'top-center'
    });
  }, 100);
}

// 编辑字段方法
export function editField(doAction,event) {
  let dictionaryList:any = []
  let moneyData:any = []
  getMoneyList().then(res=>{
    moneyData = res.data;
  })
  getZidian().then((res: any) => {
    dictionaryList = res.data.data;
  });
  doAction({
    actionType: 'validate',
    componentId: 'editForm',
    outputVar: 'validateResult'
  });
  setTimeout(() => {
    let nsod = event.data.validateResult ? event.data.validateResult.payload : event.data;
    let nsodConfigCode = 'code' in nsod.config ?  nsod.config.code : nsod.__super.code;
    console.log(nsod,'nsod')
    let fieldCrudData = JSON.parse(sessionStorage.getItem('fieldCrud')!)
    let haveContentCode = []
    haveContentCode = fieldCrudData.filter((res: any) => {
      return res.systemFieldType == 9
    })
    let tenantCodeName = 'tenantCode'
    if (haveContentCode.length > 0) {
      tenantCodeName = haveContentCode[0].code
    }
    let haveTreeParent = []
    haveTreeParent = fieldCrudData.filter((res: any) => {
      return res.type == 'parent'
    })
    let treeParentName = 'parentId'
    if (haveTreeParent.length > 0) {
      treeParentName = haveTreeParent[0].code
    }
    console.log('字段集合修改');
    console.log(doAction, 'doActiondoActiondoAction');
    console.log(event, 'eventeventevent');
    if (
        event.data.code.toUpperCase() == 'ID' ||
        event.data.code.toUpperCase() == treeParentName.toUpperCase() ||
        event.data.code.toUpperCase() == tenantCodeName.toUpperCase() ||
        event.data.code.toUpperCase() == 'CREATEDAT' ||
        event.data.code.toUpperCase() == 'UPDATEDAT' ||
        event.data.code.toUpperCase() == 'CREATEDBY' ||
        event.data.code.toUpperCase() == 'UPDATEBY' ||
        event.data.code.toUpperCase() == 'DELETEDBY' ||
        event.data.code.toUpperCase() == 'DELETEDAT' ||
        event.data.code.toUpperCase() == 'DELETED'
    ) {
      return;
    }
    let isTure = false;
    if (event.data.validateResult) {
      console.log(event.data.validateResult, '222222');
      console.log(event.data.validateResult.error);
      console.log(
          event.data.validateResult.error == ''
      );
      if (event.data.validateResult.error == '') {
        isTure = false;
      } else {
        isTure = true;
      }
    }
    console.log(isTure, 'isTure');
    if (isTure) return;
    let cacheEditLists = JSON.parse(sessionStorage.getItem('cacheEditList')!);
    if (event.data.code != event.data.__super.code) {
      let haveFirst = cacheEditLists.filter(
          (li: any) => {
            if (event.data.needId) {
              if (li.needId == event.data.needId) {
                return li;
              }
            } else {
              if (li.id == event.data.id) {
                return li;
              }
            }
          }
      );
      console.log(haveFirst,'haveFirsthaveFirsthaveFirst');
      if (haveFirst.length == 0) {
        cacheEditLists.push({
          ...event.data,
          code: event.data.__super.code,
          id: event.data?.id,
          needId: event.data?.needId
        });
      }
      sessionStorage.setItem('cacheEditList',JSON.stringify(cacheEditLists));
    }
    let nameFieldData = sessionStorage.getItem('nameFieldData')
    if (nameFieldData == event.data.__super.code) {
      doAction({
        actionType: 'setValue',
        componentId: 'nameField',
        args: {
          value: event.data.code
        }
      });
      sessionStorage.setItem('nameFieldData', event.data.code)
    }
    let keyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
    let dataArr1 = keyData.map((res: any) => {
      let splitArr = res.columnNames.split(',');
      let found = false;
      splitArr.forEach((item) => {
        if (item === nsodConfigCode) {
          found = true;
        }
      });
      if (found) {
        // 替换所有精准匹配的项
        let newColumnNames = splitArr.map(item =>
            item === nsodConfigCode ? event.data.code : item
        ).join(',');
        // 判断 res.code 是否为 "_" + nsodConfigCode
        let newCodeStr = res.code;
        if (res.code === "_" + nsodConfigCode) {
          newCodeStr = res.code.replace(nsodConfigCode, event.data.code);
        }
        return {
          ...res,
          code: newCodeStr,
          columnNames: newColumnNames
        };
      } else {
        return res;
      }
    });
    let dataArr1s = dataArr1.map(
        (res: any, index: number) => {
          return {...res, sort: index + 1,
            columnNames:processIndexFields(res.columnNames,fieldCrudData)
          };
        }
    );
    sessionStorage.setItem('keyCrud',JSON.stringify(dataArr1s));
    doAction({
      actionType: 'setValue',
      componentId: 'keyCrud',
      args: {
        value: {
          items: dataArr1s
        }
      }
    });
    let data1 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
    if (
        event.data.type == 'date' &&
        event.data.defaultValueMode == 'static'
    ) {
      if (
          event.data.defaultValue.indexOf('-') > -1 ||
          event.data.defaultValue.indexOf(':') > -1
      ) {
      } else {
        event.data.defaultValue = formatToData(
            event.data.defaultValue
        );
      }
    } else if (
        event.data.type == 'date' &&
        event.data.defaultValueMode == 'null'
    ) {
      event.data.defaultValue = '';
    } else if (
        event.data.type == 'datetime' &&
        event.data.defaultValueMode == 'static'
    ) {
      if (
          event.data.defaultValue.indexOf('-') > -1 ||
          event.data.defaultValue.indexOf(':') > -1
      ) {
      } else {
        event.data.defaultValue = event.data.defaultValue;
      }
    } else if (
        event.data.type == 'datetime' &&
        event.data.defaultValueMode == 'null'
    ) {
      event.data.defaultValue = '';
    } else if (
        event.data.type == 'time' &&
        event.data.defaultValueMode == 'static'
    ) {
      if (
          event.data.defaultValue.indexOf('-') > -1 ||
          event.data.defaultValue.indexOf(':') > -1
      ) {
      } else {
        event.data.defaultValue = event.data.defaultValue;
      }
    } else if (
        event.data.type == 'time' &&
        event.data.defaultValueMode == 'null'
    ) {
      event.data.defaultValue = '';
    } else {
      event.data.defaultValue = event.data.defaultValue;
    }
    let rightData: any = {
      sort: 1,
      rules:event.data.config.rules,
      queryKey: event.data.needId
          ? undefined
          : event.data.queryKey,
      usersDefaultValue:
      event.data.config.usersDefaultValue,
      onText: event.data.config.onText,
      offText: event.data.config.offText,
      foreignKeyFlag: false,
      systemFieldType: event.data.systemFieldType
          ? event.data.systemFieldType
          : 0,
      source: event.data.config.source
          ? 'app://dictionary/running/list?level=2&encoded=' +
          event.data.config.source
          : null, // 枚举字典
      sources: event.data.config.sources, // 枚举字典
      msources: event.data.config.msources, // 枚举字典
      nullable: event.data.config.nullable, // 是否允许空值
      token: event.data.config.token, // 密钥
      dbType: event.data.config.dbType, // 小数类型
      allowedTypes: event.data.config.picFormat
          ? event.data.config.picFormat.split(',')
          : '', // 允许的格式
      picFormat: event.data.config.picFormat,
      restrictRatio: event.data.config.restrictRatio, // 图片比率
      restrictRatioCustom:
      event.data.config.restrictRatioCustom, // 图片比率提示值
      minDateMsg: event.data.minDateMsg, // 最小提示提示
      maxDateMsg: event.data.maxDateMsg, // 最大日期提示
      maxDate: event.data.maxDate, // 最大日期
      minDate: event.data.minDate, // 最小日期
      allowInput: event.data.config.allowInput, // 是否允许修改
      meiptions: event.data.config.meiptions, // 枚举选项值
      options: event.data.config.options, // 枚举选项值
      addOptions: event.data.config.addOptions, // 枚举选项值
      defaultValueMode: event.data.defaultValueMode, //默认值
      comment: event.data.comment, // 注释
      code: event.data.code, // 字段名
      defaultValue: event.data.defaultValue, // 默认值
      name: event.data.name, // 显示标题
      unique: event.data.config.unique, // 是否唯一
      length: Number(event.data.config.length), // 当行文本长度
      maxLength: event.data.config.maxLength, // 长度
      format: event.data.config.format, // 格式
      formatMsg: event.data.config.formatMsg, // 提示信息
      minLength: event.data.config.minLength, // 最小长度
      minLengthMessage:
      event.data.config.minLengthMessage, // 最小长度提示
      maxLengthMessage:
      event.data.config.maxLengthMessage, // 最大长度提示
      type: event.data.type, // 基本字段类型
      valueType: event.data.config.valueType,
      dateTimeDefaultValue:
      event.data.config.dateTimeDefaultValue,
      dateDefaultValue:
      event.data.config.dateDefaultValue,
      timeDefaultValue:
      event.data.config.timeDefaultValue,
      minDateTime: event.data.config.minDateTime,
      minDateDate: event.data.config.minDateDate,
      minDateTimes: event.data.config.minDateTimes,
      maxDateTime: event.data.config.maxDateTime,
      maxDateDate: event.data.config.maxDateDate,
      maxDateTimes: event.data.config.maxDateTimes,
      maximum: event.data.config.maximum, // 最大值
      minimum: event.data.config.minimum, // 最小值
      minValueMessage: event.data.minValueMessage, // 最小值提示
      maxValueMessage:
      event.data.config.maxValueMessage, // 最大值提示
      currency: event.data.config.currency
          ? event.data.config.currency == 'CNY' ?
              {
                icon: '￥',
                label: '人民币',
                value: 'CNY'
              } : {
                icon: '$',
                label: '美元',
                value: 'USD'
              }
          : {
            icon: '￥',
            label: '人民币',
            value: 'CNY'
          }, // 币种
      driver: event.data.config.driver, // 对象存储
      accept: event.data.config.accept, // 文件允许的形式
      maxSize: event.data.config.maxSize, // 最大附件
      salt: event.data.config.salt, // 加盐
      description: event.data.description, // 描述
      formula: event.data.config.formula, // 公式
      expression: event.data.config.expression, // 公式
      colTypeName: '',
      precision: 10, // 精度
      scale: '',
      validations: {},
      validationErrors: {}
    };
    if (rightData.type == 'text') {
      rightData.dbType = 'VARCHAR';
      delete rightData.currency;
    } else if (rightData.type == 'textarea') {
      rightData.dbType = 'TEXTAREA';
      delete rightData.currency;
    } else if (rightData.type == 'serial-number') {
      rightData.length = 255;
      delete rightData.currency;
    } else if (rightData.type == 'rich-text') {
      rightData.dbType = 'RICH_TEXT';
      delete rightData.currency;
    } else if (
        rightData.type == 'int' ||
        rightData.type == 'bigint'
    ) {
      if (rightData.dbType == 'INT') {
        rightData.dbType = 'INT';
      } else {
        rightData.dbType = 'BIGINT';
      }
      delete rightData.currency;
    }
    else if (rightData.type == 'float') {
      rightData.scale = event.data.config.scale
          ? event.data.config.scale
          : 4;
      rightData.precision = event.data.config.precision
          ? event.data.config.precision
          : 10;
      delete rightData.currency;
      rightData.decimalType = event.data.config.dbType
    } else if (rightData.type == 'money') {
      rightData.dbType = 'BIGINT';
      if (moneyData.length > 0) {
        moneyData.forEach((element: any) => {
          if (element.value == rightData.currency) {
            let iconData = JSON.parse(element.extra);
            rightData.currency = {
              icon: iconData.symbol,
              label: element.label,
              value: element.value
            };
          }
        });
      }
    } else if (rightData.type == 'enum') {
      console.log(rightData, '修改rightDatarightData');
      if(!rightData.addOptions){
        rightData.options = []
        rightData.addOptions = []
      }
      if (
          rightData.addOptions &&
          rightData.addOptions.length > 0
      ) {
        if (rightData.valueType == 'INTEGER') {
          rightData.options = rightData.addOptions.map(
              (element: any) => {
                return {
                  value: 'values' in element ? Number(element.values) : element.labels,
                  label: 'labels' in element ? element.labels : '',
                  values: 'values' in element ? Number(element.values) : element.labels,
                  labels: 'labels' in element ? element.labels : ''
                };
              }
          );
        } else {
          rightData.options = rightData.addOptions.map(
              (element: any) => {
                return {
                  value: 'values' in element ? element.values : element.labels,
                  label: 'labels' in element ? element.labels : '',
                  values: 'values' in element ? element.values : element.labels,
                  labels: 'labels' in element ? element.labels : ''
                };
              }
          );
        }
        rightData.addOptions = rightData.options;
      }
      if (rightData.valueType == 'INTEGER') {
        rightData.dbType = 'INTEGER';
      } else {
        rightData.length = 255;
        rightData.dbType = 'VARCHAR';
      }
      if (rightData.meiptions == 'dictionaries') {
        dictionaryList.forEach((element: any) => {
          if (element.name == rightData.msources) {
            rightData.sources = element.type;
            rightData.source =
                'app://dictionary/running/list?level=2&encoded=' +
                element.type;
            if (element.dbType == 0) {
              rightData.length = 255;
              rightData.dbType = 'VARCHAR';
            }
            if (element.dbType == 1) {
              rightData.dbType = 'INTEGER';
            }
          }
        });
      }
      delete rightData.currency;
    } else if (rightData.type == 'boolean') {
      rightData.dbType = 'BOOLEAN';
      if (rightData.defaultValueMode == 'static') {
        rightData.defaultValue = rightData.defaultValue
            ? rightData.defaultValue == null
                ? false
                : rightData.defaultValue
            : false;
      }
      delete rightData.currency;
    } else if (rightData.type == 'date') {
      rightData.dbType = 'DATE';
      delete rightData.currency;
    } else if (rightData.type == 'datetime') {
      rightData.dbType = 'DATETIME';
      delete rightData.currency;
    } else if (rightData.type == 'date-range') {
      if (rightData.dbType == 'DATETIME') {
        rightData.defaultValue = rightData.dateTimeDefaultValue;
        rightData.minDate = rightData.minDateTime;
        rightData.maxDate = rightData.maxDateTime;
      } else if (rightData.dbType == 'DATE') {
        rightData.defaultValue =
            rightData.dateDefaultValue;
        rightData.minDate = rightData.minDateDate;
        rightData.maxDate = rightData.maxDateDate;
      } else if (rightData.dbType == 'TIME') {
        rightData.defaultValue =
            rightData.timeDefaultValue;
        rightData.minDate = rightData.minDateTimes;
        rightData.maxDate = rightData.maxDateTimes;
      }
      rightData.length = 200;
      delete rightData.currency;
    } else if (rightData.type == 'time') {
      rightData.dbType = 'TIME';
      delete rightData.currency;
    } else if (rightData.type == 'user') {
      rightData.length = 255;
      rightData.dbType = 'VARCHAR';
      if (
          rightData.defaultValueMode == 'current_user'
      ) {
        rightData.defaultValue = 'current_user';
      }
      delete rightData.currency;
    } else if (rightData.type == 'users') {
      console.log(rightData.usersDefaultValue,'rightData.usersDefaultValue');
      rightData.dbType = 'JSON';
      if (rightData.defaultValueMode == 'static') {
        console.log(rightData.usersDefaultValue,'修改的rightData.usersDefaultValue');
        rightData.defaultValue = rightData.usersDefaultValue;
        rightData.usersDefaultValue = rightData.usersDefaultValue;
      } else if (
          rightData.defaultValueMode == 'expression'
      ) {
        rightData.defaultValue = event.data.defaultValue;
        rightData.usersDefaultValue = event.data.defaultValue;
      } else {
        rightData.defaultValue = '';
        rightData.usersDefaultValue = '';
      }
      console.log(rightData.usersDefaultValue,'111111111111');
      rightData.length = 5000;
      delete rightData.currency;
    } else if (rightData.type == 'department') {
      rightData.length = 255;
      rightData.dbType = 'VARCHAR';
      delete rightData.currency;
    } else if (rightData.type == 'owner') {
      delete rightData.currency;
    } else if (rightData.type == 'password') {
      rightData.length = 255;
      rightData.dbType = 'VARCHAR';
      delete rightData.currency;
    } else if (rightData.type == 'ciphertext') {
      rightData.length = 1000;
      rightData.dbType = 'VARCHAR';
      delete rightData.currency;
    } else if (rightData.type == 'address') {
      delete rightData.currency;
    } else if (rightData.type == 'json') {
      rightData.dbType = 'JSON';
      delete rightData.currency;
    } else if (rightData.type == 'formula') {
      delete rightData.currency;
    } else if (rightData.type == 'attachment') {
      rightData.dbType = 'TEXT';
      rightData.length = 1000;
      rightData.defaultValueMode = 'static';
      rightData.defaultValue = '';
      delete rightData.currency;
    } else if (rightData.type == 'image') {
      rightData.colTypeName = 'IMAGE';
      rightData.length = 1000;
      rightData.dbType = 'IMAGE';
      rightData.defaultValueMode = 'static';
      rightData.defaultValue = '';
      delete rightData.currency;
    }
    if (event.data.config.maxLength) {
      rightData.validations.maxLength = event.data.config.maxLength;
      rightData.maxLength = event.data.config.maxLength;
    }
    if (event.data.config.minLength) {
      rightData.validations.minLength = event.data.config.minLength;
      rightData.minLength = event.data.config.minLength;
    }
    if (event.data?.validations?.matchRegexp) {
      rightData.validations.matchRegexp = event.data.validations.matchRegexp;
      rightData.matchRegexp = event.data.validations.matchRegexp;
    }
    if (event.data?.config?.maxLengthMessage) {
      rightData.validationErrors.maxLength = event.data.config.maxLengthMessage;
      rightData.maxLengthMessage = event.data.config.maxLengthMessage;
    }
    if (event.data?.config?.minLengthMessage) {
      rightData.validationErrors.minLength = event.data.config.minLengthMessage;
      rightData.minLengthMessage = event.data.config.minLengthMessage;
    }
    if (event.data?.validationErrors?.matchRegexp) {
      rightData.validationErrors.matchRegexp = event.data.validationErrors.matchRegexp;
      rightData.matchRegexp = event.data.validationErrors.matchRegexp;
    }
    if (
        event.data?.config?.minimum ||
        event.data?.config?.minimum == 0
    ) {
      rightData.validations.minimum = event.data.config.minimum;
      rightData.minimum = event.data.config.minimum;
    }
    if (rightData.minDate) {
      rightData.validations.minDate = rightData.minDate;
      rightData.minDate = rightData.minDate;
    }
    if (event.data?.config?.minValueMessage) {
      rightData.validationErrors.minimum = event.data.config.minValueMessage;
      rightData.minValueMessage = event.data.config.minValueMessage;
    }
    if (event.data?.config?.minDateMsg) {
      rightData.validationErrors.minDate = event.data.config.minDateMsg;
      rightData.minDateMsg = event.data.config.minDateMsg;
    }
    if (event.data?.config?.maximum) {
      rightData.validations.maximum = event.data.config.maximum;
      rightData.maximum = event.data.config.maximum;
    }
    if (rightData.maxDate) {
      rightData.validations.maxDate = rightData.maxDate;
      rightData.maxDate = rightData.maxDate;
    }
    if (event.data?.config?.maxValueMessage) {
      rightData.validationErrors.maximum = event.data.config.maxValueMessage;
      rightData.maximum = event.data.config.maxValueMessage;
      rightData.maxValueMessage = event.data.config.maxValueMessage;
    }
    if (event.data?.config?.maxDateMsg) {
      rightData.validationErrors.maxDateMsg = event.data.config.maxDateMsg;
      rightData.maxDateMsg = event.data.config.maxDateMsg;
      rightData.maxDateMsg = event.data.config.maxDateMsg;
    }
    let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!);
    let affData = JSON.parse(sessionStorage.getItem('affectCrud')!);
    let haveKeyArr = JSON.parse(sessionStorage.getItem('haveQueryKeyKey')!);
    if (
        rightData.defaultValueMode == 'null' &&
        rightData.type != 'rich-text'
    ) {
      rightData.defaultValue = null;
    }
    if (
        rightData.defaultValueMode == null &&
        rightData.type != 'rich-text'
    ) {
      rightData.defaultValue = null;
    }
    let keyDatas = dataArr1s;
    if (rightData.unique == false) {
      let keyArr = keyDatas.filter((element: any) => {
        return element.code != '_'+rightData.code;
      });
      let keyArrs = keyArr.map(
          (res: any, index: number) => {
            return {...res, sort: index + 1,
              columnNames:processIndexFields(res.columnNames,dataArr)
            };
          }
      );
      doAction({
        actionType: 'setValue',
        componentId: 'keyCrud',
        args: {
          value: {
            items: keyArrs
          }
        }
      });
      sessionStorage.setItem('keyCrud',JSON.stringify(keyArrs));
    } else if (rightData.unique == true) {
      let fieldDatas = dataArr.filter((res: any) => {
        if (res.systemFieldType == 6) {
          return res;
        }
      });
      let tenantCodeDatas = dataArr.filter(
          (res: any) => {
            return res.systemFieldType == 9
          }
      );
      console.log(fieldDatas, 'fieldDatas');
      let queryKeyObject = {}
      if(haveKeyArr && haveKeyArr.length > 0){
        queryKeyObject = haveKeyArr.find((element: any) => {
          return element.code == '_' + nsodConfigCode;
        });
      }
      let haveSame = false;
      keyDatas.forEach((element: any) => {
        if (element.code == '_' + nsodConfigCode) {
          haveSame = true;
        }
      });
      console.log(haveSame,'haveSamehaveSamehaveSamehaveSame')
      if (haveSame) {
        console.log('进入', keyDatas);
        let quitkeyData = keyDatas.map((dshj: any) => {
          let daij = {...dshj};
          if (
              daij.columnNames.includes(nsodConfigCode + ',') ||
              daij.columnNames.includes(',' + nsodConfigCode) ||
              daij.columnNames == nsodConfigCode
          ) {
            console.log(daij, '进入');
            let samne = daij.columnNames.split(',');
            let sjam = [];
            sjam = samne.map((sj: any) => {
              if (sj == nsodConfigCode) {
                return nsod.code;
              } else {
                return sj;
              }
            });
            console.log(sjam, 'sjam');
            daij.columnNames = sjam.join(',');
          }
          console.log(daij, 'daijdaijdaij');
          return daij;
        });
        if(rightData.unique == true){
          let haveUniqueFlag = true
          console.log(rightData,'rightData')
          keyDatas.forEach((element: any) => {
            if(element.code == '_' + nsodConfigCode){
              haveUniqueFlag = false
            }
          });
          if(haveUniqueFlag){
            let keyDataArr = {
              needId: event.data.needId
                  ? event.data.needId
                  : event.data.id,
              columnNames: rightData.code,
              code: '_'+rightData.code,
              uniqueFlag: true,
              systemIndex: true
            }
            if(queryKeyObject && JSON.stringify(queryKeyObject) != '{}'){
              keyDataArr.queryKey = queryKeyObject.queryKey
            }
            quitkeyData.push(keyDataArr)
          }
        }
        console.log(quitkeyData, 'quitkeyData');
        let quitkeyDatas = quitkeyData.map(
            (res: any, index: number) => {
              return {...res, sort: index + 1,
                columnNames:processIndexFields(res.columnNames,dataArr)
              };
            }
        );
        doAction({
          actionType: 'setValue',
          componentId: 'keyCrud',
          args: {
            value: {
              items: quitkeyDatas
            }
          }
        });
        sessionStorage.setItem('keyCrud',JSON.stringify(quitkeyDatas));
      } else {
        console.log('进入1', keyDatas);
        let haveUniqueFlag = true
        console.log(rightData,'rightData')
        keyDatas.forEach((element: any) => {
          if(element.code == '_'+rightData.code){
            haveUniqueFlag = false
          }
        });
        if(haveUniqueFlag){
          if (fieldDatas.length > 0) {
            if(tenantCodeDatas.length>0){
              let keyDataArr = {
                needId: event.data.needId
                    ? event.data.needId
                    : event.data.id,
                columnNames: rightData.code + ','+fieldDatas[0].code+','+tenantCodeName,
                code: '_'+rightData.code,
                uniqueFlag: true,
                systemIndex: true
              }
              if(queryKeyObject && JSON.stringify(queryKeyObject) != '{}'){
                keyDataArr.queryKey = queryKeyObject.queryKey
              }
              keyDatas.push(keyDataArr);
            }else{
              let keyDataArr = {
                needId: event.data.needId
                    ? event.data.needId
                    : event.data.id,
                columnNames: rightData.code + ','+fieldDatas[0].code,
                code: '_'+rightData.code,
                uniqueFlag: true,
                systemIndex: true
              }
              if(queryKeyObject && JSON.stringify(queryKeyObject) != '{}'){
                keyDataArr.queryKey = queryKeyObject.queryKey
              }
              keyDatas.push(keyDataArr);
            }
          } else {
            if(tenantCodeDatas.length>0){
              let keyDataArr = {
                needId: event.data.needId
                    ? event.data.needId
                    : event.data.id,
                columnNames: rightData.code + ','+tenantCodeName,
                code: '_'+rightData.code,
                uniqueFlag: true,
                systemIndex: true
              }
              if(queryKeyObject && JSON.stringify(queryKeyObject) != '{}'){
                keyDataArr.queryKey = queryKeyObject.queryKey
              }
              keyDatas.push(keyDataArr);
            }else{
              let keyDataArr = {
                needId: event.data.needId
                    ? event.data.needId
                    : event.data.id,
                columnNames: rightData.code,
                code: '_'+rightData.code,
                uniqueFlag: true,
                systemIndex: true
              }
              if(queryKeyObject && JSON.stringify(queryKeyObject) != '{}'){
                keyDataArr.queryKey = queryKeyObject.queryKey
              }
              keyDatas.push(keyDataArr);
            }
          }
        }
        let keyDatase = keyDatas.map(
            (res: any, index: number) => {
              return {...res, sort: index + 1,
                columnNames:processIndexFields(res.columnNames,dataArr)
              };
            }
        );
        doAction({
          actionType: 'setValue',
          componentId: 'keyCrud',
          args: {
            value: {
              items: keyDatase
            }
          }
        });
        sessionStorage.setItem('keyCrud',JSON.stringify(keyDatase));
      }
    }
    if (
        rightData.type == 'text' ||
        rightData.type == 'textarea' ||
        rightData.type == 'user' ||
        rightData.type == 'users' ||
        rightData.type == 'department'
    ) {
      if (
          rightData.defaultValueMode == 'static' &&
          (rightData.defaultValue == '' ||
              !rightData.defaultValue)
      ) {
        rightData.defaultValue = '';
      }
    }
    let needConfig = {...rightData};
    delete needConfig.validations;
    delete needConfig.validationErrors;
    delete rightData.dbType;
    delete rightData.rules;
    delete rightData.colIgnoreTenant;
    delete rightData.length;
    let isHave = false;
    if (dataArr) {
      dataArr.forEach((res: any) => {
        if (res.needId) {
          if (
              res.needId != event.data.needId &&
              res.code == event.data.code
          ) {
            isHave = true;
          }
        } else {
          if (
              res.id != event.data.id &&
              res.code == event.data.code
          ) {
            isHave = true;
          }
        }
      });
    }
    let cacheEditListss = JSON.parse(sessionStorage.getItem('cacheEditList')!);
    if (cacheEditListss && cacheEditListss.length > 1) {
      console.log('进入选择');
      cacheEditListss.forEach((lists: any) => {
        if (
            lists.code.toUpperCase() == event.data.code.toUpperCase()
        ) {
          isHave = true;
        }
      });
    }
    if (isHave) return;
    rightData.foreignKeyFlag = event.data.foreignKeyFlag;
    console.log(data1, 'data1data1');
    let data = data1.map((element: any) => {
      if (element.id) {
        if (element.id == event.data.id) {
          if (element.foreignKeyFlag) {
            let data1 = affData.map((res: any) => {
              if (res.foreignKey == event.data.__super.code) {
                return {
                  ...res,
                  foreignKey: event.data.code
                };
              } else {
                return res;
              }
            });
            console.log(data1, 'data1data1data1');
            sessionStorage.setItem('affectCrud',JSON.stringify(data1));
            doAction({
              actionType: 'setValue',
              componentId: 'affectCrud',
              args: {
                value: {
                  items: data1
                }
              }
            });
          }
          return {
            ...rightData,
            config: needConfig,
            id: element.id
          };
        } else {
          return element;
        }
      } else if (element.needId) {
        if (
            element.foreignKeyFlag &&
            element.needId == event.data.needId
        ) {
          let data1 = affData.map((res: any) => {
            if (
                res.foreignKey == event.data.__super.code
            ) {
              return {
                ...res,
                foreignKey: event.data.code
              };
            } else {
              return res;
            }
          });
          sessionStorage.setItem('affectCrud',JSON.stringify(data1));
          doAction({
            actionType: 'setValue',
            componentId: 'affectCrud',
            args: {
              value: {
                items: data1
              }
            }
          });
          return {
            appId: event.data.appId,
            ...rightData,
            foreignKeyFlag: true,
            config: needConfig,
            needId: event.data.needId
          };
        } else {
          if (
              element.type != 'relation' &&
              element.needId == event.data.needId
          ) {
            return {
              appId: event.data.appId,
              ...rightData,
              config: needConfig,
              needId: event.data.needId
            };
          } else {
            return element;
          }
        }
      } else if (element.queryKey) {
        if (
            element.type != 'relation' &&
            element.queryKey == event.data.queryKey
        ) {
          let data1 = affData.map((res: any) => {
            if (
                res.foreignKey == event.data.__super.code
            ) {
              return {
                ...res,
                foreignKey: event.data.code
              };
            } else {
              return res;
            }
          });
          doAction({
            actionType: 'setValue',
            componentId: 'affectCrud',
            args: {
              value: {
                items: data1
              }
            }
          });
          return {
            appId: event.data.appId,
            ...rightData,
            config: needConfig,
            needId: event.data.needId
          };
        }else{
          return element;
        }
      } else {
        return element;
      }
    });
    data.forEach((element: any, index: number) => {
      if(element){
        element.sort = index + 1;
      }
    });
    let fieldCruds = data.map((res: any) => {
      if (res.type != 'relation' && res.systemFieldType != 6
          && res.systemFieldType != 7 && res.systemFieldType != 9
          && res.systemFieldType != 8 && res.type != 'formula') {
        return res;
      }
    });
    let puFieldCruds = data.map((res: any) => {
      if (
          !res.foreignKeyFlag &&
          res.systemFieldType == 0 &&
          res.type != 'relation'
      ) {
        return res;
      }
    });
    let fieldKeyCruds = data.map((res: any) => {
      if (
          res.type != 'relation' &&
          res.type != 'formula' &&
          res.type != 'textarea' &&
          res.type != 'rich-text' &&
          res.type != 'json' &&
          res.type != 'attachment' &&
          res.type != 'image' &&
          res.type != 'ciphertext' &&
          res.type != 'users'
      ) {
        if (
            res.type == 'text' &&
            res.config.length < 768
        ) {
          return res;
        } else if (res.type != 'text') {
          return res;
        }
      }
    });
    let waiList: any[] = [];
    data.forEach((res: any) => {
      if (
          res.type == 'text' &&
          res.config.length >= 20 && res.systemFieldType == 0
      ) {
        waiList.push({
          ...res,
          label: res.code,
          value: res.code
        });
      } else if (
          res.type == 'int' &&
          res.systemFieldType == 0 &&
          res.config.integerType == 'BIGINT'
      ) {
        waiList.push({
          ...res,
          label: res.code,
          value: res.code
        });
      }
    });
    console.log(waiList, 'waiListwaiList');
    if(haveKeyArr && haveKeyArr.length > 0){
      let haveKeyArrArr = haveKeyArr.map((item:any) => {
        if(item.code == '_' + nsodConfigCode){
          return {
            ...item,
            code:'_' + rightData.code
          }
        }else{
          return item
        }
      });
      sessionStorage.setItem('haveQueryKeyKey',JSON.stringify(haveKeyArrArr));
    }
    sessionStorage.setItem('waiList',JSON.stringify(waiList));
    sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
    sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
    sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
    sessionStorage.setItem('fieldCrud',JSON.stringify(data));
    let formulArr: any[] = [];
    data.forEach((item: any) => {
      if (
          item.type != 'formula' &&
          item.systemFieldType != 6 &&
          item.systemFieldType != 7 &&
          item.systemFieldType != 8 &&
          item.systemFieldType != 9
      ) {
        formulArr.push({...item,label:item.name,value:item.code});
      }
    });
    sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
    doAction({
      actionType: 'setValue',
      componentId: 'myField',
      args: {
        value: {
          items: data
        }
      }
    });
    let systemFieldData = JSON.parse(sessionStorage.getItem('haveSystemQueryKey')!)
    if(systemFieldData && systemFieldData.length > 0){
      systemFieldData = systemFieldData.filter((item:any) => item.code != nsodConfigCode);
    }
    sessionStorage.setItem('haveSystemQueryKey',JSON.stringify(systemFieldData));
    doAction({
      actionType: 'reload',
      componentId: 'nameField'
    });
    toast.success('修改成功', {
      position: 'top-center'
    });
  }, 10);
}

// 删除字段方法
export  function deleteField(doAction,event: any) {
  console.log('字段集合删除');
  console.log(event, 'eventeventevent');
  let newArr = JSON.parse(sessionStorage.getItem('fieldCrud')!);
  let haveKeyArr = JSON.parse(sessionStorage.getItem('haveQueryKeyKey')!);
  let newArr1 = newArr.filter((res: any) => {
    // return res.code != event.data.code
    if (res.id) {
      return res.id != event.data.id;
    } else if (res.needId) {
      return res.needId != event.data.needId;
    } else {
      return res;
    }
  });
  newArr1.forEach((element: any, index: number) => {
    element.sort = index + 1;
  });
  let fieldCruds = newArr1.map((res: any) => {
    if (res.type != 'relation' && res.systemFieldType != 6
        && res.systemFieldType != 7 && res.systemFieldType != 9
        && res.systemFieldType != 8 && res.type != 'formula') {
      return res;
    }
  });
  let puFieldCruds = newArr1.map((res: any) => {
    if (
        !res.foreignKeyFlag &&
        res.systemFieldType == 0 &&
        res.type != 'relation'
    ) {
      return res;
    }
  });
  let fieldKeyCruds = newArr1.map((res: any) => {
    if (
        res.type != 'relation' &&
        res.type != 'formula' &&
        res.type != 'textarea' &&
        res.type != 'rich-text' &&
        res.type != 'json' &&
        res.type != 'attachment' &&
        res.type != 'image' &&
        res.type != 'ciphertext' &&
        res.type != 'users'
    ) {
      if (
          res.type == 'text' &&
          res.config.length < 768
      ) {
        return res;
      } else if (res.type != 'text') {
        return res;
      }
    }
  });
  let waiList = newArr1.filter((res: any) => {
    if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
      return res;
    } else if (
        res.type == 'int' &&
        res.systemFieldType == 0 &&
        res.config.integerType == 'BIGINT'
    ) {
      return res;
    }
  });
  if(haveKeyArr && haveKeyArr.length > 0){
    let haveKeyArrArr = haveKeyArr.filter((item:any) => {
      return item.code != '_' + event.data.code
    });
    sessionStorage.setItem('haveQueryKeyKey',JSON.stringify(haveKeyArrArr));
  }
  sessionStorage.setItem('waiList', JSON.stringify(waiList));
  sessionStorage.setItem('fieldKeyCruds', JSON.stringify(fieldKeyCruds));
  sessionStorage.setItem('puFieldCruds', JSON.stringify(puFieldCruds));
  sessionStorage.setItem('fieldCruds', JSON.stringify(fieldCruds));
  sessionStorage.setItem('fieldCrud', JSON.stringify(newArr1));
  let formulArr: any[] = [];
  newArr1.forEach((item: any) => {
    if (
        item.type != 'formula' &&
        item.systemFieldType != 6 &&
        item.systemFieldType != 7 &&
        item.systemFieldType != 8 &&
        item.systemFieldType != 9
    ) {
      formulArr.push({...item,label:item.name,value:item.code});
    }
  });
  sessionStorage.setItem('formulaData', JSON.stringify(formulArr));
  doAction({
    actionType: 'setValue',
    componentId: 'myField',
    args: {
      value: {
        items: newArr1
      }
    }
  });
  let nameFieldData = sessionStorage.getItem('nameFieldData')
  console.log(nameFieldData,'nameFieldData')
  console.log(event.data.code,'event.data.code')
  if (nameFieldData == event.data.code) {
    let ars = newArr1.filter((sc: any) => {
      return sc.systemFieldType == 0 && sc.type != 'formula' ;
    });
    console.log(ars, 'arsarsarsarsarsars');
    if (ars.length > 0) {
      doAction({
        actionType: 'setValue',
        componentId: 'nameField',
        args: {
          value: ars[0].code
        }
      });
      // nameFieldData = ars[0].code;
      sessionStorage.setItem('nameFieldData', ars[0].code)
    } else {
      doAction({
        actionType: 'setValue',
        componentId: 'nameField',
        args: {
          value: 'id'
        }
      });
      // nameFieldData = 'id';
      sessionStorage.setItem('nameFieldData', 'id')
    }
  }
  let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
  let data = data1.filter((res: any) => {
    // return res.code != event.data.code
    if (res.id) {
      return res.id != event.data.id;
    } else if (res.needId) {
      return res.needId != event.data.needId;
    } else {
      return res;
    }
  });
  sessionStorage.setItem('affectCrud',JSON.stringify(data));
  doAction({
    actionType: 'setValue',
    componentId: 'affectCrud',
    args: {
      value: {
        items: data
      }
    }
  });
  let dataArr = JSON.parse(sessionStorage.getItem('keyCrud')!);
  console.log(dataArr,'dataArr')
  let fieldDatas = [];
  fieldDatas = dataArr.map((res: any) => {
    let needCode = 'config' in event.data ?
        'code' in event.data.config ? event.data.config.code : event.data.code
        : event.data.code
    let splitArr = res.columnNames.split(',');
    let found = false;
    splitArr.forEach((item) => {
      if (item === needCode) {
        found = true;
      }
    });
    if (found) {
      const filteredArr = splitArr.filter(item => item !== needCode);
      return {
        ...res,
        columnNames: filteredArr.join(',')
      };
    } else {
      return res;
    }
  });
  console.log(fieldDatas,'fieldDatas')
  let deleteCode: any[] = [];
  const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  deleteCode = newArr
      .filter(item => systemFieldTypes.includes(item.systemFieldType))
      .map(item => item.code);
  const blackListFields = new Set([
    'id',
    'deleted',
    'deletedAt',
    'deletedBy',
    'updatedAt',
    'createdAt',
    'createdBy',
    'updatedBy',
    ...deleteCode
  ]);
  console.log(blackListFields,'blackListFields')
  let fieldDataes: any[] = [];
  console.log(fieldDatas,'fieldDatasfieldDatasfieldDatasfieldDatas')
  fieldDatas.forEach((res: any) => {
    const { columnNames } = res;
    if (!columnNames || columnNames.trim() === '') return;
    const fields = columnNames.split(',')
    const hasNonBlacklisted = fields.every(f => blackListFields.has(f));
    console.log(hasNonBlacklisted,'hasNonBlacklisted')
    if (!hasNonBlacklisted || !res.uniqueFlag) {
      fieldDataes.push(res);
    }
  });
  let fieldDataese = fieldDataes.map(
      (res: any, index: number) => {
        return {...res, sort: index + 1,
          columnNames:processIndexFields(res.columnNames,newArr1)
        };
      }
  );
  console.log(fieldDataes, 'fieldDataes');
  sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataese));
  let systemFieldData = JSON.parse(sessionStorage.getItem('haveSystemQueryKey')!)
  if(systemFieldData && systemFieldData.length > 0){
    systemFieldData = systemFieldData.filter((item:any) => item.code != event.data.code);
  }
  sessionStorage.setItem('haveSystemQueryKey',JSON.stringify(systemFieldData));
  doAction({
    actionType: 'setValue',
    componentId: 'keyCrud',
    args: {
      value: {
        items: fieldDataese
      }
    }
  });
  doAction({
    actionType: 'reload',
    componentId: 'nameField'
  });
  toast.success('删除成功', {
    position: 'top-center'
  });
}

// 新增索引方法
export function createIndex(doAction,event: any) {
  let codeName:any = ''
  getZippedSnowflakeId().then((needSnowId: any) => {
    codeName = needSnowId.data.data
  let fieldData = JSON.parse(sessionStorage.getItem('fieldCrud')!)
  let deleteCode: any[] = [];
  let deleteCode1: any[] = [];
  const systemFieldTypes = [1, 6, 8, 9]; // 要提取的字段类型
  const fieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  deleteCode = fieldData
      .filter(item => systemFieldTypes.includes(item.systemFieldType))
      .map(item => item.code);
  deleteCode1 = fieldData
      .filter(item => fieldTypes.includes(item.systemFieldType))
      .map(item => item.code);
  const blackListFields = [
    'id',
    'deleted',
    'deletedAt',
    ...deleteCode
  ];
  const blackList = new Set([
    'id',
    'deleted',
    'deletedAt',
    'deletedBy',
    'updatedAt',
    'createdAt',
    'createdBy',
    'updatedBy',
    ...deleteCode1
  ]);
  if (
      blackListFields.some(val => val === event.data.columnNames) &&
      event.data.uniqueFlag
  ) {
    return
  }
  if (/^(?!_).*/.test(event.data.code) == false) {
    return
  }
  let yuan = event.data.columnNames.split(',')
  let isTures = yuan.filter((res: any) => {
    if (!blackList.has(res)) {
      return res
    }
  })
  console.log(isTures, 'isTures')
  if (isTures.length == 0 && event.data.uniqueFlag) {
    return
  }
  console.log('新增索引设置')
  console.log(doAction, 'doActiondoActiondoActiondoAction')
  console.log(event, 'eventeventeventevent')
  setTimeout(() => {
    if (/^[a-zA-Z_][A-Za-z0-9_]*$/.test(event.data.code) == false) return
    if (!event.data.columnNames) return
    // if (!event.data.columnKeys) return
    let codeNames
    if (!event.data.code || event.data.code == "") {
      codeNames = codeName
    } else {
      codeNames = event.data.code
    }
    let data: any = JSON.parse(sessionStorage.getItem('keyCrud')!)
    let dataArr = JSON.parse(sessionStorage.getItem('keyCrud')!)
    let fieldDataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
    console.log(fieldData, 'fieldData')
    let deleteString = ''
    let fieldDatas = fieldData.filter((res: any) => res.systemFieldType == 6)
    deleteString  = fieldDatas.length > 0 ? fieldDatas[0].code : ''
    let haveContentCode = fieldData.filter((res: any) => {
      return res.systemFieldType == 9
    })
    let isHave = false
    dataArr.forEach((res: any) => {
      if (res.code == event.data.code) {
        isHave = true
      }
    })
    if (isHave) return
    if (fieldDatas.length > 0 && event.data.uniqueFlag) {
      const columnArr = event.data.columnNames
          .split(',')                    // 分割
          .map(col => col.trim());       // 去空格
      const exists = columnArr.some(col => col === deleteString);
      if (!exists) {
        columnArr.push(deleteString); // 不存在则添加
      }
      if(haveContentCode.length > 0 && event.data.uniqueFlag){
        const contentExists = columnArr.some(col => col === haveContentCode[0].code);
        if (!contentExists) {
          columnArr.push(haveContentCode[0].code); // 不存在则添加
        }
        data.push({
          needId: uuid.v4(),
          columnNames: columnArr.join(','),
          code: codeNames,
          uniqueFlag: event.data.uniqueFlag ? event.data.uniqueFlag : false,
        })
      } else {
        data.push({
          needId: uuid.v4(),
          columnNames: columnArr.join(','),
          code: codeNames,
          uniqueFlag: event.data.uniqueFlag ? event.data.uniqueFlag : false,
        })
      }
    } else if(haveContentCode.length > 0
        && event.data.uniqueFlag
        && (!event.data.columnNames.includes(','+haveContentCode[0].code)
            && !event.data.columnNames.includes(haveContentCode[0].code))){
      const columnArr = event.data.columnNames
          .split(',')                    // 分割
          .map(col => col.trim());       // 去空格
      const exists = columnArr.some(col => col === haveContentCode[0].code);
      if (!exists) {
        columnArr.push(haveContentCode[0].code); // 不存在则添加
      }
      data.push({
        needId: uuid.v4(),
        columnNames: columnArr.join(','),
        code: codeNames,
        uniqueFlag: 'uniqueFlag' in event.data ? event.data.uniqueFlag : false,
      })
    } else {
      data.push({
        needId: uuid.v4(),
        columnNames: event.data.columnNames,
        code: codeNames,
        uniqueFlag: 'uniqueFlag' in event.data ? event.data.uniqueFlag : false,
      });
    }
    let dataws = data.map((res: any, index: number) => {
      return { ...res, sort: index + 1,
        columnNames:processIndexFields(res.columnNames,fieldDataArr)
      }
    })
    console.log(dataws,'datawsdatawsdatawsdatawsdatawsdataws')
    sessionStorage.setItem('keyCrud', JSON.stringify(dataws))
    console.log(data, '增加索引字段')
    doAction({
      actionType: "setValue", componentId: "keyCrud", "args": {
        "value": {
          "items": dataws
        }
      }
    });
  }, 10);
})

}

// 修改索引方法
export function editIndex(doAction,event: any) {
  let codeName:any = []
  getZippedSnowflakeId().then((needSnowId: any) => {
    codeName = needSnowId.data.data
  console.log('修改索引设置')
  console.log(doAction, 'doActiondoActiondoActiondoAction')
  console.log(event, 'eventeventeventevent')
  let fieldData = JSON.parse(sessionStorage.getItem('fieldCrud')!)
  if (!event.data.columnNames) return
  if (/^(?!_).*/.test(event.data.code) == false) {
    return
  }
  let haveContentCode = []
  haveContentCode = fieldData.filter((res: any) => {
    return res.systemFieldType == 9
  })
  let tenantCodeName = 'tenantCode'
  if (haveContentCode.length > 0) {
    tenantCodeName = haveContentCode[0].code
  }
  let deleteCode: any[] = [];
  const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  deleteCode = fieldData
      .filter(item => systemFieldTypes.includes(item.systemFieldType))
      .map(item => item.code);
  const blackList = new Set([
    'id',
    'deleted',
    'deletedAt',
    'deletedBy',
    'updatedAt',
    'createdAt',
    'createdBy',
    'updatedBy',
    ...deleteCode
  ]);
  let yuan = event.data.columnNames.split(',')
  let isTures = yuan.filter((res: any) => {
    if (!blackList.has(res)) {
      return res
    }
  })
  console.log(isTures, 'isTures')
  if (isTures.length == 0 && event.data.uniqueFlag) {
    return
  }
  let codeNames: any
  if ((event.data.code && event.data.code == "") || !event.data.code) {
    console.log('进入')
    codeNames = codeName
  } else {
    codeNames = event.data.code
  }
  if (!/^[a-zA-Z_][A-Za-z0-9_]*$/.test(codeNames)) { return }
  let dataArr = JSON.parse(sessionStorage.getItem('keyCrud')!)
  let deleteString = ''
  let fieldDatas = fieldData.filter((res: any) => res.systemFieldType == 6)
  deleteString = fieldDatas.length > 0 ? fieldDatas[0].code : ''
  let isHave = false
  dataArr.forEach((res: any) => {
    if (res.needId) {
      if (res.needId != event.data.needId && res.code == event.data.code) {
        isHave = true
      }
    } else {
      if (res.id != event.data.id && res.code == event.data.code) {
        isHave = true
      }
    }
  })
  if (isHave) return
  let data1 = JSON.parse(sessionStorage.getItem('keyCrud')!)
  let data = data1.map((element: any) => {
    if (element.id && (element.id == event.data.id)) {
      if (fieldDatas.length > 0 &&
          event.data.uniqueFlag &&
          (!event.data.columnNames.includes(','+deleteString) &&
              !event.data.columnNames.includes(deleteString))) {
        const columnArr = event.data.columnNames
            .split(',')
            .map(col => col.trim());
        const exists = columnArr.some(col => col === deleteString);
        if (!exists) {
          columnArr.push(deleteString);
        }
        if(haveContentCode.length > 0
            && event.data.uniqueFlag
            && (!event.data.columnNames.includes(','+tenantCodeName)
                && !event.data.columnNames.includes(tenantCodeName))){
          const tenantExists = columnArr.some(col => col === tenantCodeName);
          if (!tenantExists) {
            columnArr.push(tenantCodeName);
          }
          return {
            ...event.data,
            queryKey:event.data.queryKey,
            id: event.data.id,
            code: codeNames,
            uniqueFlag: 'uniqueFlag' in event.data ? event.data.uniqueFlag : false,
            appId: event.data.appId,
            columnNames: columnArr.join(','),
            createTime: event.data.createTime,
            env: event.data.env,
            latest: event.data.latest,
            tableKey: event.data.tableKey,
            ver: event.data.ver,
          }
        }else{
          return {
            ...event.data,
            queryKey:event.data.queryKey,
            id: event.data.id,
            code: codeNames,
            uniqueFlag: 'uniqueFlag' in event.data ? event.data.uniqueFlag : false,
            appId: event.data.appId,
            columnNames: columnArr.join(','),
            createTime: event.data.createTime,
            env: event.data.env,
            latest: event.data.latest,
            tableKey: event.data.tableKey,
            ver: event.data.ver,
          }
        }
      } else {
        return {
          ...event.data,
          queryKey:event.data.queryKey,
          id: event.data.id,
          code: codeNames,
          uniqueFlag: 'uniqueFlag' in event.data ? event.data.uniqueFlag : false,
          appId: event.data.appId,
          columnNames: event.data.columnNames,
          createTime: event.data.createTime,
          env: event.data.env,
          latest: event.data.latest,
          tableKey: event.data.tableKey,
          ver: event.data.ver,
        }
      }
    } else if (element.needId && (element.needId == event.data.needId)) {
      if (fieldDatas.length > 0 &&
          event.data.uniqueFlag &&
          (!event.data.columnNames.includes(','+deleteString) &&
              !event.data.columnNames.includes(deleteString))) {
        const columnArr = event.data.columnNames
            .split(',')                    // 分割
            .map(col => col.trim());
        const exists = columnArr.some(col => col === deleteString);
        if (!exists) {
          columnArr.push(deleteString); // 不存在则添加
        }
        if(haveContentCode.length > 0
            && event.data.uniqueFlag
            && (!event.data.columnNames.includes(','+tenantCodeName)
                && !event.data.columnNames.includes(tenantCodeName))){
          const tenantExists = columnArr.some(col => col === tenantCodeName);
          if (!tenantExists) {
            columnArr.push(tenantCodeName); // 不存在则添加
          }
          return {
            ...event.data,
            needId: event.data.needId,
            queryKey:event.data.queryKey,
            code: codeNames,
            uniqueFlag: 'uniqueFlag' in event.data ? event.data.uniqueFlag : false,
            appId: event.data.appId,
            columnNames: columnArr.join(','),
            createTime: event.data.createTime,
            env: event.data.env,
            latest: event.data.latest,
            tableKey: event.data.tableKey,
            ver: event.data.ver,
          }
        }else{
          return {
            ...event.data,
            needId: event.data.needId,
            queryKey:event.data.queryKey,
            code: codeNames,
            uniqueFlag: 'uniqueFlag' in event.data ? event.data.uniqueFlag : false,
            appId: event.data.appId,
            columnNames: columnArr.join(','),
            createTime: event.data.createTime,
            env: event.data.env,
            latest: event.data.latest,
            tableKey: event.data.tableKey,
            ver: event.data.ver,
          }
        }
      } else {
        return {
          ...event.data,
          needId: event.data.needId,
          queryKey:event.data.queryKey,
          code: codeNames,
          uniqueFlag: 'uniqueFlag' in event.data ? event.data.uniqueFlag : false,
          appId: event.data.appId,
          columnNames: event.data.columnNames,
          createTime: event.data.createTime,
          env: event.data.env,
          latest: event.data.latest,
          tableKey: event.data.tableKey,
          ver: event.data.ver,
        }
      }
    } else {
      return element
    }
  })
  console.log(data, 'aaaaaaaa')
  let dataws = data.map((res: any, index: number) => {
    return { ...res, sort: index + 1,
      columnNames:processIndexFields(res.columnNames,fieldData)
    }
  })
  sessionStorage.setItem('keyCrud', JSON.stringify(dataws))
  console.log(data, '修改索引设置')
  doAction({
    actionType: "setValue", componentId: "keyCrud", "args": {
      "value": {
        "items": dataws
      }
    }
  });
})
}

// 删除索引方法
export function deleteIndex(doAction,event: any) {
  console.log('删除索引设置')
  console.log(doAction, 'doActiondoActiondoActiondoAction')
  console.log(event, 'eventeventeventevent')
  let data1 = JSON.parse(sessionStorage.getItem('keyCrud')!)
  let fieldData = JSON.parse(sessionStorage.getItem('fieldCrud')!)
  console.log(data1, '111111111')
  let data = data1.filter((res: any) => {
    if (res.needId) {
      return res.needId != event.data.needId
    } else {
      return res.id != event.data.id
    }
  })
  let dataws = data.map((res: any, index: number) => {
    return { ...res, sort: index + 1,
      columnNames:processIndexFields(res.columnNames,fieldData)
    }
  })
  sessionStorage.setItem('keyCrud', JSON.stringify(dataws))
  console.log(data, 'datadatadata')
  doAction({
    actionType: "setValue", componentId: "keyCrud", "args": {
      "value": {
        "items": dataws
      }
    }
  });
}

// 新增关系方法
export function createRelationship(doAction,event: any) {
  console.log('关系设置添加');
  console.log(doAction,'doActiondoAction');
  console.log(event, 'eventeventeventeventevent');
  let inverseJoinColumnCodes = 'inverseJoinColumnCodes' in event.data ? event.data.inverseJoinColumnCodes : event.data.inverseJoinColumnCode
  if (!event.data.targetKey) return;
  let namesTest = /^[a-zA-Z_][A-Za-z0-9_]*$/
  if(!namesTest.test(event.data.code)) return
  if(!event.data.joinColumnAtTarget){
    if('inverseSideKey' in event.data && event.data.inverseSideKey != '0'){
      if(!namesTest.test(event.data.name)) return
    }
  }
  // if (!event.data.tableKey) return
  let assData = JSON.parse(sessionStorage.getItem('targetList')!);
  console.log(assData,'assDataassData');
  if(event.data.relationMode == '3' && event.data.determineType=='choice'){
    let allIsNull:any = []
    let cunIsNull:any = []
    allIsNull = assData.filter(res=>{
      return !res.isNullable && !res.isPrimaryKey
    })
    cunIsNull = allIsNull.filter((res: any) => {
      if (event.data.joinColumnCode == res.key) {
        return res
      }
      if (event.data.inverseJoinColumnCode == res.key) {
        return res
      }
    });
    console.log(allIsNull,'allIsNull')
    console.log(cunIsNull,'cunIsNull')
    if(allIsNull.length != cunIsNull.length && !event.data.withCustomProps){
      return
    }
  }
  let needUuid = uuid.v4();
  let data = JSON.parse(sessionStorage.getItem('affectCrud')!);
  let data1 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
  if(event.data.inverseSideKey == '0' && !('foreignKeyCode' in event.data)){
    let targetFieldData = JSON.parse(sessionStorage.getItem('targetFieldList'))
    console.log(targetFieldData,'targetFieldData')
    console.log(inverseJoinColumnCodes,'inverseJoinColumnCodes')
    let aaaa = checkAndRenameField(targetFieldData,inverseJoinColumnCodes,'code')
    let bbbb = checkAndRenameField(targetFieldData,inverseJoinColumnCodes,'name')
    let cccc = checkAndRenameField(data,bbbb,'foreignKeyCode')
    console.log(aaaa == bbbb,'aaaa == bbbb')
    if(aaaa == bbbb == cccc){
      inverseJoinColumnCodes = aaaa
    }else{
      inverseJoinColumnCodes = cccc
    }
  }
  if('foreignKeyCode' in event.data){
    inverseJoinColumnCodes = event.data.foreignKeyCode
  }
  // let havadata:boolean = false
  // data1.forEach(res=>{
  //   if(res.code == event.data.names){
  //     havadata = true
  //   }
  // })
  // console.log(havadata,'havadatahavadata')
  // if(havadata)return
  console.log(inverseJoinColumnCodes,'inverseJoinColumnCodes');
  if (event.data.relationMode == '3') {
    // if(event.data.joinTableCode == '' && !event.data.joinColumnAtTarget){return}
    console.log('多对多');
    // if (event.data.relationMode == 'MORE_MORE') {
    data.push({
      joinTableExpand:event.data.joinTableExpand,
      determineType:event.data.determineType,
      joinTableKey: event.data.joinTableKey,
      joinColumnKey: event.data.joinColumnKey,
      joinTableCode: event.data.joinTableCode,
      joinColumnCode: event.data.joinColumnCode,
      inverseJoinColumnCode: event.data.inverseJoinColumnCode,
      inverseJoinColumnKey: event.data.inverseJoinColumnKey,
      nullable: event.data.nullable,
      // event.data.joinColumnAtTarget
      //     ? relationNullable
      //     : event.data.nullable
      //         ? !event.data.nullable
      //         : true, // 允许空值
      // forTableName: event.data.modelName,// 目标模型名
      // forTableKey: event.data.queryKey, // 当前模型
      name: event.data.name, // 当前模型
      // name: refTable, // 当前模型
      // name: event.data.codes, // 当前模型
      needId: needUuid,
      joinColumnAtTarget: event.data.joinColumnAtTarget,
      inverseSideKey: event.data.inverseSideKey,
      // foreignKey:inverseJoinColumnCodes,
      tableKey: event.data.tableKey, // 目标模型
      fieldInOppositeFlag:
      event.data.fieldInOppositeFlag, // 关联字段在对方
      code: event.data.code, // 字段名
      cascadeRemove: event.data.cascadeRemove
          ? event.data.cascadeRemove
          : false, // 级联删除
      conCascadeFlag: event.data.conCascadeFlag, // 级联更新
      fkName: event.data.fkName, // 外键
      withCustomProps: event.data.withCustomProps, // 可自定义属性
      relationMode: event.data.relationMode, // 关系类型
      fieldItemType: event.data.fieldItemType, // 关系类型
      targetCode: event.data.targetCode, // 父表模型名称
      targetName: event.data.targetName, // 父表模型名称
      // refTableName: refTable, // 父表模型名称
      targetKey: event.data.targetKey, // 目标模型
      // foreignKey: event.data.names,
      foreignKeyKey: event.data.foreignKeyKey,
      foreignKeyCode: event.data.joinColumnCode
          ? event.data.joinColumnCode
          : inverseJoinColumnCodes
    });
  } else if (event.data.relationMode == '2') {
    console.log('一对多');
    if(!event.data.inverseSideKey || event.data.inverseSideKey==''){
      return
    }
    data.push({
      joinTableCode: event.data.joinTableCode, // 中间表名
      joinColumnCode: event.data.joinColumnCode, // 关联本身字段名
      inverseJoinColumnCode:
      event.data.inverseJoinColumnCode, // 关联目标字段名
      name: event.data.name, // 当前模型
      needId: needUuid,
      joinColumnAtTarget: true,
      inverseSideKey: event.data.inverseSideKey,
      // foreignKey:inverseJoinColumnCodes,
      tableKey: event.data.tableKey, // 目标模型
      fieldInOppositeFlag:
      event.data.fieldInOppositeFlag, // 关联字段在对方
      code: event.data.code, // 字段名
      nullable: event.data.nullable, // 允许空值                                                                                                                    ,// 允许空值
      // nullable: !event.data.nullable,// 允许空值
      cascadeRemove: event.data.cascadeRemove, // 级联删除
      conCascadeFlag: event.data.conCascadeFlag, // 级联更新
      fkName: event.data.fkName, // 外键
      withCustomProps: event.data.withCustomProps, // 可自定义属性
      relationMode: event.data.relationMode, // 关系类型
      fieldItemType: event.data.fieldItemType, // 关系类型
      targetCode: event.data.targetCode, // 父表模型名称
      targetName: event.data.targetName, // 父表模型名称
      targetKey: event.data.targetKey, // 目标模型
      foreignKeyKey: event.data.foreignKeyKey,
      foreignKeyCode: inverseJoinColumnCodes
    });
  } else if (event.data.relationMode == '1') {
    console.log('多对一');
    let waiD: any = {};
    data1.forEach((sjw: any) => {
      if (sjw.code == event.data.name) {
        waiD = {...sjw};
      }
    });
    console.log(waiD, 'waiD');
    data.push({
      joinTableCode: event.data.joinTableCode, // 中间表名
      joinColumnCode: event.data.joinColumnCode, // 关联本身字段名
      inverseJoinColumnCode:
      event.data.inverseJoinColumnCode, // 关联目标字段名
      name: event.data.name, // 当前模型
      needId: needUuid,
      joinColumnAtTarget: false,
      inverseSideKey: event.data.inverseSideKey,
      tableKey: event.data.tableKey, // 目标模型
      fieldInOppositeFlag:
      event.data.fieldInOppositeFlag, // 关联字段在对方
      code: event.data.code, // 字段名
      nullable:
          event.data.determineType == 'create'
              ? event.data.nullable
              : waiD.nullable, // 允许空值
      cascadeRemove: event.data.cascadeRemove, // 级联删除
      conCascadeFlag: event.data.conCascadeFlag, // 级联更新
      fkName: event.data.fkName, // 外键
      withCustomProps: event.data.withCustomProps, // 可自定义属性
      relationMode: event.data.relationMode, // 关系类型
      fieldItemType: event.data.relationMode, // 关系类型
      targetCode: event.data.targetCode, // 父表模型名称
      targetName: event.data.targetName, // 父表模型名称
      targetKey: event.data.targetKey, // 目标模型
      foreignKeyCode: event.data.joinColumnAtTarget
          ? inverseJoinColumnCodes
          : event.data.name
    });
  } else {
    console.log('一对一');
    let waiD: any = {};
    data1.forEach((sjw: any) => {
      if (sjw.code == event.data.name) {
        waiD = {...sjw};
      }
    });
    console.log(waiD, 'waiD');
    data.push({
      joinTableCode: event.data.joinTableCode, // 中间表名
      joinColumnCode: event.data.joinColumnCode, // 关联本身字段名
      inverseJoinColumnCode:
      event.data.inverseJoinColumnCode, // 关联目标字段名
      name: event.data.name, // 当前模型
      needId: needUuid,
      joinColumnAtTarget: event.data.joinColumnAtTarget,
      inverseSideKey: event.data.inverseSideKey,
      tableKey: event.data.tableKey, // 目标模型
      fieldInOppositeFlag:
      event.data.fieldInOppositeFlag, // 关联字段在对方
      code: event.data.code, // 字段名
      nullable:event.data.nullable, // 允许空值
      cascadeRemove: event.data.cascadeRemove, // 级联删除
      conCascadeFlag: event.data.conCascadeFlag, // 级联更新
      fkName: event.data.fkName, // 外键
      withCustomProps: event.data.withCustomProps, // 可自定义属性
      relationMode: event.data.relationMode, // 关系类型
      fieldItemType: event.data.relationMode, // 关系类型
      targetCode: event.data.targetCode, // 父表模型名称
      targetName: event.data.targetName, // 父表模型名称
      targetKey: event.data.targetKey, // 目标模型
      foreignKeyKey: event.data.foreignKeyKey,
      foreignKeyCode: event.data.joinColumnAtTarget
          ? inverseJoinColumnCodes
          : event.data.name
    });
  }
  // 多对多选择可自定义属性后 添加一条多对多和一条一对多数据
  if (
      event.data.relationMode == '3' &&
      event.data.withCustomProps &&
      !event.data.joinColumnAtTarget
  ) {
    data.push({
      relationMode: 2,
      isNullable: true, //该字段可用于自动生成的一对多的反向关系显示隐藏的判断
      nullable: true,
      fieldItemType: 2,
      code: event.data.joinTableCode + 's',
      name: event.data.joinTableCode + 's',
      cascadeRemove: event.data.cascadeRemove
          ? event.data.cascadeRemove
          : false, // 级联删除
      targetCode: event.data.targetCode,
      targetName: event.data.targetName,
      foreignKey: event.data.foreignKey,
      foreignKeyCode: event.data.foreignKeyCode,
      needId: needUuid + 1,
      targetType: 1,
      needHaveId:true
    });
  }
  data.forEach((element: any, index: number) => {
    element['sort'] = index + 1;
  });
  console.log(data, 'sssss');
  sessionStorage.setItem('affectCrud',JSON.stringify(data));
  doAction({
    actionType: 'setValue',
    componentId: 'affectCrud',
    args: {
      value: {
        items: data
      }
    }
  });
  if (
      event.data.relationMode != '2' &&
      event.data.relationMode != '3' &&
      !event.data.joinColumnAtTarget
  ) {
    if (event.data.determineType == 'create') {
      data1.push({
        sort: 1,
        type: event.data.refTableType,
        dbType: event.data.refTableType=='text'?'VARCHAR':'BIGINT',
        code: event.data.name,
        name: event.data.name,
        precision: 10,
        isForeignKey: true,
        nullable:
            'nullable' in event.data
                ? event.data.nullable
                : true,
        foreignKeyFlag: true,
        config: {
          dbType: event.data.refTableType=='text'?'VARCHAR':'BIGINT'
        },
        needId: needUuid,
        relationMode: event.data.relationMode,
        defaultValueMode: 'null'
      });
    } else {
      data1 = data1.map((sjk: any) => {
        if (sjk.code == event.data.name) {
          let yuanData: any = [];
          if (sessionStorage.getItem('yuanData')!) {
            yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
            yuanData.push({...sjk, needId: needUuid});
          } else {
            yuanData.push({...sjk, needId: needUuid});
          }
          sessionStorage.setItem('yuanData',JSON.stringify(yuanData));
          return {
            ...sjk,
            foreignKeyFlag: true,
            isForeignKey: true,
            precision: 10,
            needId: needUuid,
            relationMode: event.data.relationMode,
            defaultValueMode: 'null'
          };
        } else {
          return sjk;
        }
      });
    }
  }
  // let refTables = event.data.codes;
  let refTables = event.data.name;
  let refTabless = event.data.joinTableCode + 's';
  let needData: any = JSON.parse(sessionStorage.getItem('fieldCrud')!);
  needData.forEach((element: any) => {
    if (
        element.name.toUpperCase() == event.data.name.toUpperCase()
    ) {
      refTables = checkAndRenameField(needData,event.data.name,'name')
    }
    if (
        element.name.toUpperCase() == refTabless.toUpperCase()
    ) {
      refTabless = checkAndRenameField(needData,event.data.joinTableCode,'name')
    }
  });
  let waiD: any = {};
  data1.forEach((sjw: any) => {
    if (sjw.code == event.data.name) {
      waiD = {...sjw};
    }
  });
  console.log(data,'aaaaaaaaaaaaaaaaaaaaaa')
  console.log(refTables,'refTablesrefTablesrefTables')
  let lastData = data.map(rsw=>{
    let returnDara = {...rsw}
    if(rsw.code == event.data.code){
      returnDara.name = refTables
    }
    return returnDara
  })
  sessionStorage.setItem('affectCrud',JSON.stringify(lastData));
  doAction({
    actionType: 'setValue',
    componentId: 'affectCrud',
    args: {
      value: {
        items: lastData
      }
    }
  });
  let nsjs = {
    sort: 1,
    type: 'relation',
    code: event.data.code,
    name: refTables,
    precision: 10,
    nullable:event.data.nullable,
    foreignKeyFlag: false,
    systemFieldType: 0,
    needId: needUuid,
    relationMode: event.data.relationMode
  }
  console.log(JSON.stringify(nsjs.nullable) == undefined,'JSON.stringify(nsjs.nullable) == undefined')
  data1.push({
    ...nsjs,
    nullable:JSON.stringify(nsjs.nullable) == undefined ? true : nsjs.nullable
  });
  if (
      event.data.relationMode == '3' &&
      event.data.withCustomProps &&
      !event.data.joinColumnAtTarget
  ) {
    data1.push({
      sort: 1,
      type: 'relation',
      code: refTabless,
      name: refTabless,
      precision: 10,
      nullable:
          'nullable' in event.data
              ? event.data.nullable
              : true,
      foreignKeyFlag: false,
      systemFieldType: 0,
      needId: needUuid,
      relationMode: '2'
    });
  }
  console.log(data1, 'dasdasdasdasdasdsa');
  data1.forEach((element: any, index: number) => {
    element.sort = index + 1;
  });
  let fieldCruds = data1.map((res: any) => {
    if (
        res.type != 'relation' &&
        res.systemFieldType != 6 &&
        res.systemFieldType != 7 &&
        res.systemFieldType != 8 &&
        res.systemFieldType != 9 && res.type != 'formula'
    ) {
      return res;
    }
  });
  let puFieldCruds = data1.map((res: any) => {
    if (
        !res.foreignKeyFlag &&
        res.systemFieldType == 0 &&
        res.type != 'relation'
    ) {
      return res;
    }
  });
  let fieldKeyCruds = data1.map((res: any) => {
    if (
        res.type != 'relation' &&
        res.type != 'formula' &&
        res.type != 'textarea' &&
        res.type != 'rich-text' &&
        res.type != 'json' &&
        res.type != 'attachment' &&
        res.type != 'image' &&
        res.type != 'ciphertext' &&
        res.type != 'users'
    ) {
      if (
          res.type == 'text' &&
          res.config.length < 768
      ) {
        return res;
      } else if (res.type != 'text') {
        return res;
      }
    }
  });
  let waiList = data1.filter((res: any) => {
    if (res.type == 'text' && res.config.length >= 20 && res.systemFieldType == 0) {
      return res;
    } else if (
        res.type == 'int' &&
        res.systemFieldType == 0 &&
        res.config.dbType == 'BIGINT'
    ) {
      return res;
    }
  });
  let intList = data1.filter((res: any) =>
      res.type == 'int' && res.config.dbType == 'BIGINT' && res.systemFieldType == 0)
  let cuList = data1.filter((res: any) =>
      (res.type == 'text' || res.type == 'user') && res.systemFieldType == 0)
  let cuTimeList = data1.filter((res: any) =>
      res.type == 'datetime' && res.systemFieldType == 0)
  let needPrimaryKeyType:any = []
  needPrimaryKeyType = data1.filter((res: any) =>res.systemFieldType == 1)
  if(needPrimaryKeyType.length == 0){
    needPrimaryKeyType.push({type:'int',config:{dbType:'BIGINT'}})
  }
  let treeList = data1.filter((res: any) => {
    if(res.type == needPrimaryKeyType[0].type &&
        res.config.dbType == needPrimaryKeyType[0].config.dbType && res.systemFieldType == 0){
      return res
    }
  })
  sessionStorage.setItem('intList', JSON.stringify(intList))
  sessionStorage.setItem('cuList', JSON.stringify(cuList))
  sessionStorage.setItem('cuTimeList', JSON.stringify(cuTimeList))
  sessionStorage.setItem('treeList', JSON.stringify(treeList))
  sessionStorage.setItem('waiList',JSON.stringify(waiList));
  sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
  sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
  sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
  sessionStorage.setItem('fieldCrud',JSON.stringify(data1));
  let formulArr: any[] = [];
  data1.forEach((item: any) => {
    if (
        item.type != 'formula' &&
        item.systemFieldType != 6 &&
        item.systemFieldType != 7 &&
        item.systemFieldType != 8 &&
        item.systemFieldType != 9
    ) {
      formulArr.push({...item,label:item.name,value:item.code});
    }
  });
  sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
  doAction({
    actionType: 'setValue',
    componentId: 'myField',
    args: {
      value: {
        items: data1
      }
    }
  });
  doAction({
    actionType: 'reload',
    componentId: 'nameField'
  });
  // }, 1000);
}

// 修改关系方法
export function editelationship(doAction,event: any) {
  console.log('修改关系设置');
  console.log(doAction,'doActiondoActiondoActiondoAction');
  console.log(event,'eventeventeventevent');
  // if (event.data.relationMode != 3) {
  doAction({
    actionType: 'validate',
    componentId: 'rationForm',
    outputVar: 'validateResult'
  });
  // }
  doAction({
    actionType: 'disabled',
    componentId: 'rationForm'
  });
  doAction({
    actionType: 'disabled',
    componentId: 'buttonID'
  });

  setTimeout(() => {
    if (
        event.data?.validateResult?.error ==
        '依赖的部分字段没有通过验证'
    ) {
      doAction({
        actionType: 'enabled',
        componentId: 'rationForm'
      });
      doAction({
        actionType: 'enabled',
        componentId: 'buttonID'
      });
      return;
    }
    // 修改外键 关联字段集合列表相应数据的code name修改
    let fieldData = JSON.parse(sessionStorage.getItem('fieldCrud')!);
    let fieldData1 = fieldData.map(
        (res: any) => {
          if (res.code == event.data?.__super.foreignKeyCode && res.foreignKeyFlag) {
            console.log('进入');
            return {
              ...res,
              code: event.data.foreignKeyCode,
              name: event.data.foreignKeyCode,
              nullable: event.data.nullable
            };
          } else if (
              res.code == event.data?.__super.code &&
              res.code != event.data.code &&
              res.type == 'relation'
          ) {
            console.log('进入1');
            return {
              ...res,
              code: event.data.code,
              name: event.data.name,
              nullable: event.data.nullable
            };
          } else if (
              res.code == event.data.code &&
              res.type == 'relation'
          ) {
            console.log('进入2');
            return {
              ...res,
              name: event.data.name,
              nullable: event.data.nullable
            };
          } else {
            console.log('进入3');
            return res;
          }
        }
    );
    fieldData1.forEach(
        (element: any, index: number) => {
          element.sort = index + 1;
        }
    );
    let fieldCruds = fieldData1.map(
        (res: any) => {
          if (
              res.type != 'relation' &&
              res.systemFieldType != 6 &&
              res.systemFieldType != 7 &&
              res.systemFieldType != 8 &&
              res.systemFieldType != 9 &&
              res.type != 'formula'
          ) {
            return res;
          }
        }
    );
    let puFieldCruds = fieldData1.map(
        (res: any) => {
          if (
              !res.foreignKeyFlag &&
              res.systemFieldType == 0 &&
              res.type != 'relation'
          ) {
            return res;
          }
        }
    );
    let fieldKeyCruds = fieldData1.map(
        (res: any) => {
          if (
              res.type != 'relation' &&
              res.type != 'formula' &&
              res.type != 'textarea' &&
              res.type != 'rich-text' &&
              res.type != 'json' &&
              res.type != 'attachment' &&
              res.type != 'image' &&
              res.type != 'ciphertext' &&
              res.type != 'users'
          ) {
            if (
                res.type == 'text' &&
                res.config.length < 768
            ) {
              return res;
            } else if (res.type != 'text') {
              return res;
            }
          }
        }
    );
    let waiList = fieldData1.filter(
        (res: any) => {
          if (
              res.type == 'text' &&
              res.config.length >= 20 && res.systemFieldType == 0
          ) {
            return res;
          } else if (
              res.type == 'int' &&
              res.systemFieldType == 0 &&
              res.config.dbType ==
              'BIGINT'
          ) {
            return res;
          }
        }
    );
    sessionStorage.setItem('waiList',JSON.stringify(waiList));
    sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
    sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
    sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
    sessionStorage.setItem('fieldCrud',JSON.stringify(fieldData1));
    let formulArr: any[] = [];
    fieldData1.forEach((item: any) => {
      if (
          item.type != 'formula' &&
          item.systemFieldType != 6 &&
          item.systemFieldType != 7 &&
          item.systemFieldType != 8 &&
          item.systemFieldType != 9
      ) {
        formulArr.push({...item,label:item.name,value:item.code});
      }
    });
    sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
    doAction({
      actionType: 'setValue',
      componentId: 'myField',
      args: {
        value: {
          items: fieldData1
        }
      }
    });
    let affData = JSON.parse(sessionStorage.getItem('affectCrud')!);
    let data1 = affData.map(
        (element: any) => {
          if (element.needId) {
            if (element.needId == event.data.needId) {
              let nsod = event.data;
              let data = {
                ...element,
                ...nsod,
                foreignKeyCode:
                    nsod.foreignKeyCode,
                foreignKeyKey:
                    nsod.foreignKeyKey
              };
              if (data.config?.displayColumns || data.config?.displayColumns == '') {
                if (data.config?.displayColumns == '') {
                  let asrr = JSON.parse(sessionStorage.getItem('affevtData')!);
                  let asrrs: any = [];
                  if(asrr && asrr.length<0){
                    asrr.forEach(
                        (element: any) => {
                          asrrs.push(
                              element.queryKey
                          );
                        }
                    );
                  }
                  data.config.displayColumns = asrrs.length==0?null:asrrs;
                } else {
                  if (typeof data.config?.displayColumns != 'string') {
                    let retuData:any = []
                    retuData = data.config.displayColumns.map(
                        (col: any) => {
                          return col.queryKey ==
                          null
                              ? col
                              : col.queryKey;
                        }
                    );
                    data.config.displayColumns = retuData.length==0?null:retuData
                  } else {
                    let needD = []
                    needD = data.config.displayColumns.split(',');
                    data.config.displayColumns = needD.length == 0 ? null : needD;
                  }
                }
              }
              if (
                  event.data.relationMode != 3 &&
                  event.data.relationMode != 0 &&
                  event.data.relationMode != 2
              ) {
                if (
                    data.config?.quickEditSettings?.inputColumnss ||
                    data.config?.quickEditSettings?.inputColumnss == ''
                ) {
                  if (data.config?.quickEditSettings?.inputColumnss == '') {
                    let asrr = JSON.parse(sessionStorage.getItem('inputData')!);
                    let asrrs: any = [];
                    asrr.forEach((element: any) => {
                          asrrs.push(element.queryKey);
                    });
                    data.config.quickEditSettings.inputColumns = asrrs.length==0?null:asrrs;
                  } else {
                    if (typeof data.config.quickEditSettings.inputColumnss =='string') {
                      let ratData = []
                      ratData = data.config.quickEditSettings.inputColumnss.split(',');
                      data.config.quickEditSettings.inputColumns = ratData.length==0?null:ratData
                    } else {
                      let needDat: any[] = [];
                      data.config.quickEditSettings.inputColumnss.forEach(
                          (it: any) => {
                            needDat.push(it.queryKey==null?it:it.queryKey);
                          }
                      );
                      console.log(needDat,'needDatneedDat');
                      data.config.quickEditSettings.inputColumns = needDat.length==0?null:needDat;
                    }
                  }
                }
              }
              if (event.data.relationMode != 0) {
                if (data.config?.inputColumnss || data.config?.inputColumnss == '') {
                  if (data.config.inputColumnss == '') {
                    let asrr = JSON.parse(sessionStorage.getItem('inputData')!);
                    let asrrs: any = [];
                    asrr.forEach(
                        (element: any) => {
                          asrrs.push(
                              element.queryKey
                              // element.code
                          );
                        }
                    );
                    data.config.inputColumns = asrrs.length==0?null:asrrs;
                  } else {
                    if (typeof data.config.inputColumnss == 'string') {
                      let retunData = []
                      retunData = data.config.inputColumnss.split(',');
                      data.config.inputColumns = retunData.length==0?null:retunData
                    } else {
                      let art: any[] = [];
                      data.config.inputColumnss.forEach(
                          (res: any) => {
                            if (res === null) {
                              console.log("null");
                            } else if (typeof res === "string") {
                              console.log("string");
                              art.push(res)
                            } else if (typeof res === "object" && res !== null) {
                              console.log("object");
                              art.push(res.queryKey)
                            }
                          }
                      );
                      data.config.inputColumns = art.length==0?null:art;
                    }
                  }
                }
              }
              if(data.relationMode == 3){
                if(data.config && data.config.inputType!="table" && data.config.inputType!="select"){
                  data.config.inputEditable = true
                }
              }
              return {
                ...data
              };
            } else {
              return element;
            }
          } else {
            if (element.queryKey == event.data.queryKey) {
              console.log('存在queryKey');
              let nsod = event.data.validateResult
                  ? event.data.validateResult.payload
                  : event.data;
              let data = {
                ...element,
                ...nsod,
                foreignKeyCode:nsod.foreignKeyCode
                    ? event.data.foreignKeyCode
                    : event.data.inverseJoinColumnCodes,
                foreignKeyKey:event.data.foreignKeyKey,
                    // nsod.joinColumnAtTarget ?  inverseJoinColumnKeys == null ? nsod.foreignKeyKey : inverseJoinColumnKeys : undefined
              };
              data = JSON.parse(JSON.stringify(data))
              if (data.config?.displayColumns || data.config?.displayColumns == '') {
                if (data.config?.displayColumns == '') {
                  let asrr = JSON.parse(sessionStorage.getItem('affevtData')!);
                  let asrrs: any = [];
                  if(asrr && asrr.length>0){
                    asrr.forEach((element: any) => {
                          asrrs.push(element.queryKey);
                        });
                  }
                  data.config.displayColumns = asrrs.length==0?null:asrrs;
                } else {
                  if (typeof data.config?.displayColumns != 'string') {
                    let returnData:any = []
                    returnData =
                        data.config.displayColumns.map(
                            (col: any) => {
                              return col.code == null ? col : col.queryKey;
                            }
                        );
                    data.config.displayColumns = returnData.length==0?null:returnData
                  } else {
                    let needD = []
                    needD = data.config.displayColumns.split(',');
                    data.config.displayColumns = needD.length==0?null:needD;
                  }
                }
              }
              if (event.data.relationMode != 3 &&
                  event.data.relationMode != 0 &&
                  event.data.relationMode != 2) {
                if (data.config?.quickEditSettings?.inputColumnss ||
                    data.config?.quickEditSettings?.inputColumnss == '') {
                  if (data.config?.quickEditSettings?.inputColumnss == '') {
                    let asrr = JSON.parse(sessionStorage.getItem('inputData')!);
                    let asrrs: any = [];
                    asrr.forEach((element: any) => {
                          asrrs.push(element.queryKey);
                        });
                    data.config.quickEditSettings.inputColumns = asrrs.length==0?null:asrrs;
                  } else {
                    console.log('进入11111111111111');
                    if (typeof data.config.quickEditSettings.inputColumnss =='string') {
                      let returnData:any = []
                      returnData = data.config.quickEditSettings.inputColumnss.split(',');
                      data.config.quickEditSettings.inputColumns = returnData.length==0?null:returnData
                    } else {
                      let needDat: any[] = [];
                      data.config.quickEditSettings.inputColumnss.forEach(
                          (it: any) => {
                            needDat.push(it.queryKey == null ? it : it.queryKey);
                          }
                      );
                      data.config.quickEditSettings.inputColumns = needDat.length==0?null:needDat;
                    }
                  }
                }
              }
              if (event.data.relationMode != 0) {
                if (data.config.inputColumnss || data.config.inputColumnss == ''                                                    ) {
                  console.log('进入');
                  if (data.config.inputColumnss == '') {
                    let asrr = JSON.parse(sessionStorage.getItem('inputData')!);
                    let asrrs: any = [];
                    asrr.forEach((element: any) => {
                          asrrs.push(element.queryKey);
                        });
                    data.config.inputColumns = asrrs.length==0?null:asrrs;
                  } else {
                    if (typeof data.config.inputColumnss == 'string') {
                      let returnData:any = []
                      returnData = data.config.inputColumnss.split(',');
                      data.config.inputColumns = returnData.length==0?null:returnData
                    } else {
                      let art: any[] = [];
                      data.config.inputColumnss.forEach(
                          (res: any) => {
                            if (res === null) {
                              console.log("null");
                            } else if (typeof res === "string") {
                              console.log("string");
                              art.push(res)
                            } else if (typeof res === "object" && res !== null) {
                              console.log("object");
                              art.push(res.queryKey)
                            }
                          }
                      );
                      data.config.inputColumns = art.length==0?null:art;
                    }
                  }
                }
              }
              console.log(data, 'datadata');
              if(data.relationMode == 3){
                if(data.config && data.config.inputType!="table" && data.config.inputType!="select"){
                  data.config.inputEditable = true
                }
              }
              return {
                ...data
              };
            } else {
              return element;
            }
          }
        }
    );
    if(event.data.relationMode=='3' && event.data.withCustomProps){
      data1 = data1.map((resk:any,index: number)=>{
        let returnResk = {...resk,
          sort: index + 1
        }
        if(event.data.joinTableKey){
          if(resk.targetKey == event.data.joinTableKey
              && resk.relationMode == 2){
            returnResk.targetCode = event.data.joinTableCode
            returnResk.targetName = event.data.joinTableCode
          }
        }else{
          if(resk.targetCode == event.data.joinTableCode
              && resk.relationMode == 2){
            returnResk.targetCode = event.data.joinTableCode
            returnResk.targetName = event.data.joinTableCode
          }
        }
        return returnResk
      })
    }
    sessionStorage.setItem('affectCrud',JSON.stringify(data1));
    console.log(data1,'data1')
    data1 = data1.map((res: any) => {
      let returnData = {
        ...res
      };
      delete returnData._action;
      delete returnData.__super;
      return returnData
    });
    doAction({
      actionType: 'setValue',
      componentId: 'affectCrud',
      args: {
        value: {
          items: data1
        }
      }
    });
    doAction({
      actionType: 'reload',
      componentId: 'nameField'
    });
    let neKeyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
    if (neKeyData.length > 0) {
      let neKeyData2 = neKeyData.map(
          (dshj: any) => {
            let daij = {...dshj};
            let nsod = event.data.validateResult
                ? event.data.validateResult.payload
                : event.data;
            if (
                event.data.foreignKeyCode &&
                nsod.foreignKeyCode != nsod.__super.foreignKeyCode
            ) {
              if (
                  daij.columnNames.includes(nsod.__super.foreignKeyCode + ',') ||
                  daij.columnNames.includes(',' +nsod.__super.foreignKeyCode) ||
                  daij.columnNames == nsod.__super.foreignKeyCode
              ) {
                console.log(daij, '进入');
                let samne = daij.columnNames.split(',');
                let sjam: any = [];
                samne.map((sj: any) => {
                  if (sj == nsod.__super.foreignKeyCode) {
                    sjam.push(nsod.foreignKeyCode);
                  } else {
                    sjam.push(sj);
                  }
                });
                console.log(sjam, 'sjam');
                daij.columnNames = sjam.join(',');
              }
              console.log(daij,'daijdaijdaij');
              return daij;
            } else {
              return dshj;
            }
          }
      );
      let deleteCode: any[] = [];
      const systemFieldTypes = [1, 6, 8, 9];
      deleteCode = fieldData1
          .filter(item => systemFieldTypes.includes(item.systemFieldType))
          .map(item => item.code);
      const blackListFields = new Set([
        'id',
        'deleted',
        'deletedAt',
        ...deleteCode
      ]);
      let fieldDataesa = neKeyData2.filter((res: any) => {
        const { columnNames } = res;
        if (!columnNames) return false;
        const allInBlacklist = columnNames.split(',').every(field => blackListFields.has(field));
        if(res.uniqueFlag){
          return !allInBlacklist;
        }else{
          return true
        }
      });
      let fieldDataesae =
          fieldDataesa.map(
              (res: any, index: number) => {
                return {
                  ...res,
                  sort: index + 1,
                  columnNames:processIndexFields(res.columnNames,fieldData1)
                };
              }
          );
      sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataesae));
      doAction({
        actionType: 'setValue',
        componentId: 'keyCrud',
        args: {
          value: {
            items: fieldDataesae
          }
        }
      });
    }
    // doAction({
    //   actionType: 'close',
    //   componentId: 'uploadAffect'
    // });
  }, 1000);
}

// 删除关系方法
export function deleteRelation(doAction,event: any) {
  console.log('删除关系设置');
  console.log(doAction,'doActiondoActiondoActiondoAction');
  console.log(event, 'eventeventeventevent');
  let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
  let data = data1.filter((res: any) => {
    if (event.data.needId) {
      return res.needId != event.data.needId;
    } else {
      return res.id != event.data.id;
    }
  });
  data.forEach((element: any, index: number) => {
    element.sort = index + 1;
  });
  sessionStorage.setItem('affectCrud',JSON.stringify(data));
  doAction({
    actionType: 'setValue',
    componentId: 'affectCrud',
    args: {
      value: {
        items: data
      }
    }
  });
  let data2 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
  console.log(data2, 'ssssssssssss');
  let yuanData: any;
  if (sessionStorage.getItem('yuanData')!) {
    yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
  }
  console.log(yuanData,'yuanData')
  let data3: any[] = [];
  data2.forEach((ress: any) => {
    if ('__super' in event.data && event.data.__super.foreignKeyCode) {
      console.log(yuanData, '进入');
      let haveData = {};
      if (yuanData) {
        yuanData.forEach((siw: any) => {
          if (ress.needId) {
            if (
                siw.needId == ress.needId &&
                ress.systemFieldType == 0 &&
                ress.type != 'relation'
            ) {
              haveData = siw;
            }
          }
        });
      }
      if (JSON.stringify(haveData) === '{}') {
        console.log('进入');
        if (
            ress.code !=
            event.data.__super.foreignKeyCode &&
            ress.code != event.data.__super.code
        ) {
          data3.push(ress);
        }
      } else {
        console.log('进入1');
        console.log(haveData, 'haveData[0]');
        data3.push(haveData);
      }
    } else if (
        event.data.inverseSideKey != null &&
        ress.type == 'relation' &&
        (ress.needId || ress.id)
    ) {
      console.log('进入1');
      if (ress.code != event.data.code) {
        data3.push(ress);
      }
    } else {
      console.log('进入2');
      if (event.data.id) {
        if (ress.id != event.data.id) {
          data3.push(ress);
        }
      } else {
        if (ress.needId != event.data.needId) {
          data3.push(ress);
        }
      }
    }
  });
  console.log(data3, 'data3data3data3');
  data3.forEach((element: any, index: number) => {
    element.sort = index + 1;
  });
  let fieldCruds = data3.map((res: any) => {
    if (res.type != 'relation' && res.systemFieldType != 6
        && res.systemFieldType != 7 && res.systemFieldType != 9
        && res.systemFieldType != 8 && res.type != 'formula') {
      return res;
    }
  });
  let puFieldCruds = data3.map((res: any) => {
    if (
        !res.foreignKeyFlag &&
        res.systemFieldType == 0 &&
        res.type != 'relation'
    ) {
      return res;
    }
  });
  let fieldKeyCruds = data3.map((res: any) => {
    if (
        res.type != 'relation' &&
        res.type != 'formula' &&
        res.type != 'textarea' &&
        res.type != 'rich-text' &&
        res.type != 'json' &&
        res.type != 'attachment' &&
        res.type != 'image' &&
        res.type != 'ciphertext' &&
        res.type != 'users'
    ) {
      if (
          res.type == 'text' &&
          res.config.length < 768
      ) {
        return res;
      } else if (res.type != 'text') {
        return res;
      }
    }
  });
  let waiList = data3.filter((res: any) => {
    if (
        res.type == 'text' &&
        res.config.length >= 20 && res.systemFieldType == 0
    ) {
      return res;
    } else if (
        res.type == 'int' &&
        res.systemFieldType == 0 &&
        res.config.dbType == 'BIGINT'
    ) {
      return res;
    }
  });
  sessionStorage.setItem('waiList',JSON.stringify(waiList));
  sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
  sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
  sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
  sessionStorage.setItem('fieldCrud',JSON.stringify(data3));
  let formulArr: any[] = [];
  data3.forEach((item: any) => {
    if (
        item.type != 'formula' &&
        item.systemFieldType != 6 &&
        item.systemFieldType != 7 &&
        item.systemFieldType != 8 &&
        item.systemFieldType != 9
    ) {
      formulArr.push({...item,label:item.name,value:item.code});
    }
  });
  sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
  doAction({
    actionType: 'setValue',
    componentId: 'myField',
    args: {
      value: {
        items: data3
      }
    }
  });
  doAction({
    actionType: 'reload',
    componentId: 'nameField'
  });
  let neKeyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
  console.log(neKeyData, 'neKeyDataneKeyData');
  if (neKeyData.length > 0) {
    let neKeyData2 = neKeyData.map(
        (dshj: any) => {
          if (event.data.foreignKeyCode) {
            let daij = {...dshj};
            if (daij.columnNames.includes(event.data.foreignKeyCode + ',') ||
                daij.columnNames.includes(',' + event.data.foreignKeyCode) ||
                daij.columnNames == event.data.foreignKeyCode
            ) {
              console.log(daij, '进入');
              let samne = daij.columnNames.split(',');
              let sjam: any = [];
              sjam = samne.filter((sj: any) => {
                if (sj != event.data.foreignKeyCode) {
                  return sj;
                }
              });
              daij.columnNames = sjam.join(',');
            }
            console.log(daij, 'daijdaijdaij');
            return daij;
          }
        }
    );
    let deleteCode: any[] = [];
    const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    deleteCode = data3
        .filter(item => systemFieldTypes.includes(item.systemFieldType))
        .map(item => item.code);
    const blackListFields = new Set([
      'id',
      'deleted',
      'deletedAt',
      'deletedBy',
      'updatedAt',
      'createdAt',
      'createdBy',
      'updatedBy',
      ...deleteCode
    ]);
    let fieldDataes: any[] = [];
    neKeyData2.forEach((res: any) => {
      const { columnNames } = res;
      if (!columnNames) {
        return;
      }
      const fields = columnNames
          .split(',')
          .map(f => f.trim())
          .filter(Boolean);
      const hasNonBlacklisted = fields.some(field => !blackListFields.has(field));
      if (hasNonBlacklisted && !res.uniqueFlag) {
        fieldDataes.push(res);
      }else if(!res.uniqueFlag){
        fieldDataes.push(res);
      }
    });
    let fieldDataese = fieldDataes.map(
        (res: any, index: number) => {
          return {...res, sort: index + 1,
            columnNames:processIndexFields(res.columnNames,data3)
          };
        }
    );
    sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataese));
    doAction({
      actionType: 'setValue',
      componentId: 'keyCrud',
      args: {
        value: {
          items: fieldDataese
        }
      }
    });
    let nameFieldData = sessionStorage.getItem('nameFieldData')
    if (nameFieldData == event.data.foreignKeyCode) {
      let ars = data3.filter(sc => {
        return sc.systemFieldType == 0;
      });
      console.log(ars, 'arsarsarsarsarsars');
      if (ars.length > 0) {
        doAction({
          actionType: 'setValue',
          componentId: 'nameField',
          args: {
            value: ars[0].code
          }
        });
        // nameFieldData = ars[0].code;
        sessionStorage.setItem('nameFieldData', ars[0].code)
      } else {
        doAction({
          actionType: 'setValue',
          componentId: 'nameField',
          args: {
            value: 'id'
          }
        });
        // nameFieldData = 'id';
        sessionStorage.setItem('nameFieldData', 'id')
      }
    }
  }
  doAction({
    actionType: 'closeDialog',
    componentId: 'deleteDialogId'
  });
}

// 删除关系方法(保留外键字段)
export function deleteBaoWRelation(doAction,event: any) {
  console.log(doAction, 'doAction保留外键字段');
  console.log(event, 'event保留外键字段');
  let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
  let data4 = data1.filter((res: any) => {
    if (event.data.needId) {
      return res.needId != event.data.needId;
    } else {
      return res.id != event.data.id;
    }
  });
  data4.forEach((element: any, index: number) => {
    element.sort = index + 1;
  });
  sessionStorage.setItem('affectCrud',JSON.stringify(data4));
  doAction({
    actionType: 'setValue',
    componentId: 'affectCrud',
    args: {
      value: {
        items: data4
      }
    }
  });
  let data = JSON.parse(sessionStorage.getItem('fieldCrud')!);
  let data2 = data.map((res: any) => {
    if (event.data.foreignKeyCode == res.code) {
      if (res.type == 'int') {
        console.log('shjbsjahbdashjkdb');
        return {
          ...res,
          defaultValueMode: 'static',
          defaultValue: 0,
          foreignKeyFlag: false,
          config: {
            ...res.config,
            nullable: res.nullable,
            defaultValueMode: 'static',
            defaultValue: 0
          }
        };
      } else {
        return {
          ...res,
          foreignKeyFlag: false,
          config: {
            ...res.config,
            nullable: res.nullable
          }
        };
      }
    } else {
      return res;
    }
  });
  console.log(data2, 'data2data2data2');
  let yuanData: any;
  if (sessionStorage.getItem('yuanData')!) {
    yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
  }
  let data3: any[] = [];
  data2.forEach((ress: any) => {
    if (!event.data.foreignKeyFlag) {
      if (event.data.__super.foreignKeyCode) {
        console.log(yuanData, '进入');
        let haveData: any = {};
        if (yuanData) {
          yuanData.forEach((siw: any) => {
            if (ress.needId) {
              if (
                  siw.needId == ress.needId &&
                  ress.systemFieldType == 0 &&
                  ress.type != 'relation'
              ) {
                // return siw
                haveData = siw;
              }
            }
          });
        }
        if (JSON.stringify(haveData) === '{}') {
          console.log(ress,'进入保留');
          if(ress.type == 'relation' && ress.code == event.data.__super.code){
          }else  {
            data3.push(ress);
          }
        } else {
          console.log('进入1');
          console.log(haveData, 'haveData[0]');
          if (haveData.type == 'int') {
            data3.push({
              ...haveData,
              defaultValueMode: 'static',
              defaultValue: 0,
              foreignKeyFlag: false,
              config: {
                ...haveData.config,
                nullable: haveData.nullable,
                defaultValueMode: 'static',
                defaultValue: 0
              }
            });
          } else {
            data3.push(haveData);
          }
        }
      } else if (
          event.data.inverseSideKey != null &&
          ress.type == 'relation' &&
          (ress.needId || ress.id)
      ) {
        console.log('进入1');
        if (ress.code != event.data.code) {
          data.push(ress);
        }
        // return res.code != event.data.code
      } else {
        console.log('进入2');
        if (event.data.id) {
          if (ress.id != event.data.id) {
            data.push(ress);
          }
          // return res.id != event.data.id
        } else {
          if (ress.needId != event.data.needId) {
            data.push(ress);
          }
          // return res.needId != event.data.needId
        }
      }
    }
  });
  sessionStorage.setItem('fieldCrud',JSON.stringify(data3));
  doAction({
    actionType: 'setValue',
    componentId: 'myField',
    args: {
      value: {
        items: data3
      }
    }
  });
  doAction({
    actionType: 'reload',
    componentId: 'nameField'
  });
  doAction({
    actionType: 'closeDialog',
    componentId: 'deleteDialogId'
  });
}

// 删除关系方法(删除外键字段)
export function deleteWaiRelation(doAction,event: any) {
  console.log('删除关系设置');
  console.log(_, '____');
  console.log(
      doAction,
      'doActiondoActiondoActiondoAction'
  );
  console.log(event, 'eventeventeventevent');
  let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
  let data = data1.filter((res: any) => {
    // return res.code != event.data.code
    if (event.data.needId) {
      return res.needId != event.data.needId;
    } else {
      return res.id != event.data.id;
    }
  });
  data.forEach((element: any, index: number) => {
    element.sort = index + 1;
  });
  sessionStorage.setItem('affectCrud',JSON.stringify(data));
  doAction({
    actionType: 'setValue',
    componentId: 'affectCrud',
    args: {
      value: {
        items: data
      }
    }
  });
  let data2 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
  console.log(data2, 'ssssssssssss');
  let yuanData: any;
  if (sessionStorage.getItem('yuanData')!) {
    yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
  }
  let data3: any[] = [];
  data2.forEach((ress: any) => {
    if (event.data.__super.foreignKeyCode) {
      console.log(yuanData, '进入');
      let haveData = {};
      if (yuanData) {
        yuanData.forEach((siw: any) => {
          if (ress.needId) {
            if (
                siw.needId == ress.needId &&
                ress.systemFieldType == 0 &&
                ress.type != 'relation'
            ) {
              // return siw
              haveData = siw;
            }
          }
        });
      }
      if (JSON.stringify(haveData) === '{}') {
        if(ress.type == 'relation' && ress.code == event.data.__super.code){
        } else if (ress.code != event.data.__super.foreignKeyCode) {
          data3.push(ress);
        }
      } else {
        console.log('进入1');
        console.log(haveData, 'haveData[0]');
        data3.push(haveData);
        // return haveData
      }
      // return res.queryKey != event.data.fieldKey
    } else if (
        event.data.inverseSideKey != null &&
        ress.type == 'relation' &&
        (ress.needId || ress.id)
    ) {
      console.log('进入1');
      if (ress.code != event.data.code) {
        data.push(ress);
      }
      // return res.code != event.data.code
    } else {
      console.log('进入2');
      if (event.data.id) {
        if (ress.id != event.data.id) {
          data.push(ress);
        }
        // return res.id != event.data.id
      } else {
        if (ress.needId != event.data.needId) {
          data.push(ress);
        }
        // return res.needId != event.data.needId
      }
    }
  });
  console.log(data3, 'data3data3data3');
  data3.forEach((element: any, index: number) => {
    element.sort = index + 1;
  });
  let fieldCruds = data3.map((res: any) => {
    // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
    if (res.type != 'relation' && res.systemFieldType != 6
        && res.systemFieldType != 7 && res.systemFieldType != 9
        && res.systemFieldType != 8 && res.type != 'formula') {
      return res;
    }
  });
  let puFieldCruds = data3.map((res: any) => {
    if (
        !res.foreignKeyFlag &&
        res.systemFieldType == 0 &&
        res.type != 'relation'
    ) {
      return res;
    }
  });
  let fieldKeyCruds = data3.map((res: any) => {
    if (
        res.type != 'relation' &&
        res.type != 'formula' &&
        res.type != 'textarea' &&
        res.type != 'rich-text' &&
        res.type != 'json' &&
        res.type != 'attachment' &&
        res.type != 'image' &&
        res.type != 'ciphertext' &&
        res.type != 'users'
    ) {
      if (
          res.type == 'text' &&
          res.config.length < 768
      ) {
        return res;
      } else if (res.type != 'text') {
        return res;
      }
    }
  });
  let waiList = data3.filter((res: any) => {
    if (
        res.type == 'text' &&
        res.config.length >= 20 && res.systemFieldType == 0
    ) {
      return res;
    } else if (
        res.type == 'int' &&
        res.systemFieldType == 0 &&
        res.config.dbType == 'BIGINT'
    ) {
      return res;
    }
  });
  sessionStorage.setItem('waiList',JSON.stringify(waiList));
  sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
  sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
  sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
  sessionStorage.setItem('fieldCrud',JSON.stringify(data3));
  let formulArr: any[] = [];
  data3.forEach((item: any) => {
    if (
        item.type != 'formula' &&
        item.systemFieldType != 6 &&
        item.systemFieldType != 7 &&
        item.systemFieldType != 8 &&
        item.systemFieldType != 9
    ) {
      formulArr.push({...item,label:item.name,value:item.code});
    }
  });
  sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
  doAction({
    actionType: 'setValue',
    componentId: 'myField',
    args: {
      value: {
        items: data3
      }
    }
  });
  doAction({
    actionType: 'reload',
    componentId: 'nameField'
  });
  let neKeyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
  console.log(neKeyData, 'neKeyDataneKeyData');
  if (neKeyData.length > 0) {
    let neKeyData2 = neKeyData.map(
        (dshj: any) => {
          if (event.data.foreignKeyCode) {
            let daij = {...dshj};
            if (daij.columnNames.includes(event.data.foreignKeyCode + ',') ||
                daij.columnNames.includes(',' + event.data.foreignKeyCode) ||
                daij.columnNames == event.data.foreignKeyCode
            ) {
              console.log(daij, '进入');
              let samne = daij.columnNames.split(',');
              let sjam: any = [];
              sjam = samne.filter((sj: any) => {
                if (sj != event.data.foreignKeyCode) {
                  return sj;
                }
              });
              console.log(sjam, 'sjam');
              daij.columnNames = sjam.join(',');
            }
            console.log(daij, 'daijdaijdaij');
            return daij;
          }
        }
    );
    let deleteCode: any[] = [];
    const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    deleteCode = data3
        .filter(item => systemFieldTypes.includes(item.systemFieldType))
        .map(item => item.code);
    const blackListFields = new Set([
      'id',
      'deleted',
      'deletedAt',
      'deletedBy',
      'updatedAt',
      'createdAt',
      'createdBy',
      'updatedBy',
      ...deleteCode
    ]);
    let fieldDataes: any[] = [];
    neKeyData2.forEach((res: any) => {
      const { columnNames } = res;
      if (!columnNames) {
        return;
      }
      const fields = columnNames
          .split(',')
          .map(f => f.trim())
          .filter(Boolean);
      const hasNonBlacklisted = fields.some(field => !blackListFields.has(field));
      if (hasNonBlacklisted && !res.uniqueFlag) {
        fieldDataes.push(res);
      }else if(!res.uniqueFlag){
        fieldDataes.push(res);
      }
    });
    let fieldDataese = fieldDataes.map(
        (res: any, index: number) => {
          return {...res, sort: index + 1,
            columnNames:processIndexFields(res.columnNames,data3)
          };
        }
    );
    sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataese));
    doAction({
      actionType: 'setValue',
      componentId: 'keyCrud',
      args: {
        value: {
          items: fieldDataese
        }
      }
    });
    let nameFieldData = sessionStorage.getItem('nameFieldData')
    if (
        nameFieldData == event.data.foreignKeyCode
    ) {
      let ars = data3.filter(sc => {
        return sc.systemFieldType == 0;
      });
      console.log(ars, 'arsarsarsarsarsars');
      if (ars.length > 0) {
        doAction({
          actionType: 'setValue',
          componentId: 'nameField',
          args: {
            value: ars[0].code
          }
        });
        // nameFieldData = ars[0].code;
        sessionStorage.setItem('nameFieldData', ars[0].code)
      } else {
        doAction({
          actionType: 'setValue',
          componentId: 'nameField',
          args: {
            value: 'id'
          }
        });
        // nameFieldData = 'id';
        sessionStorage.setItem('nameFieldData', 'id')
      }
    }
  }
  doAction({
    actionType: 'closeDialog',
    componentId: 'deleteDialogId'
  });
}

// 删除关系方法(保留中间表)
export function deleteBaoMRelation(doAction,event: any) {
  console.log('删除关系设置');
  console.log(_, '____');
  console.log(
      doAction,
      'doActiondoActiondoActiondoAction'
  );
  console.log(event, 'eventeventeventevent');
  let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
  let data = data1.filter((res: any) => {
    if (event.data.needId) {
      return res.needId != event.data.needId;
    } else {
      return res.id != event.data.id;
    }
  });
  data.forEach((element: any, index: number) => {
    element.sort = index + 1;
  });
  sessionStorage.setItem('affectCrud',JSON.stringify(data));
  doAction({
    actionType: 'setValue',
    componentId: 'affectCrud',
    args: {
      value: {
        items: data
      }
    }
  });
  let data2 = JSON.parse(sessionStorage.getItem('fieldCrud')!);
  console.log(data2, 'ssssssssssss');
  let yuanData: any;
  if (sessionStorage.getItem('yuanData')!) {
    yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
  }
  let data3: any[] = [];
  data2.forEach((ress: any) => {
    if (event.data.__super.foreignKeyCode) {
      console.log(yuanData, '进入');
      let haveData = {};
      if (yuanData) {
        yuanData.forEach((siw: any) => {
          if (ress.needId) {
            if (
                siw.needId == ress.needId &&
                ress.systemFieldType == 0 &&
                ress.type != 'relation'
            ) {
              // return siw
              haveData = siw;
            }
          }
        });
      }
      if (JSON.stringify(haveData) === '{}') {
        console.log('进入');
        if (
            ress.code !=
            event.data.__super.foreignKeyCode &&
            ress.code != event.data.__super.code
        ) {
          data3.push(ress);
        }
        // return res.code != event.data.__super.foreignKeyCode && res.code != event.data.__super.code
      } else {
        console.log('进入1');
        console.log(haveData, 'haveData[0]');
        data3.push(haveData);
        // return haveData
      }
      // return res.queryKey != event.data.fieldKey
    } else if (
        event.data.inverseSideKey != null &&
        ress.type == 'relation' &&
        (ress.needId || ress.id)
    ) {
      console.log('进入1');
      if (ress.code != event.data.code) {
        data.push(ress);
      }
      // return res.code != event.data.code
    } else {
      console.log('进入2');
      if (event.data.id) {
        if (ress.id != event.data.id) {
          data.push(ress);
        }
        // return res.id != event.data.id
      } else {
        if (ress.needId != event.data.needId) {
          data.push(ress);
        }
        // return res.needId != event.data.needId
      }
    }
  });
  console.log(data3, 'data3data3data3');
  data3.forEach((element: any, index: number) => {
    element.sort = index + 1;
  });
  let fieldCruds = data3.map((res: any) => {
    // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
    if (res.type != 'relation' && res.systemFieldType != 6
        && res.systemFieldType != 7 && res.systemFieldType != 9
        && res.systemFieldType != 8 && res.type != 'formula') {
      return res;
    }
  });
  let puFieldCruds = data3.map((res: any) => {
    if (
        !res.foreignKeyFlag &&
        res.systemFieldType == 0 &&
        res.type != 'relation'
    ) {
      return res;
    }
  });
  let fieldKeyCruds = data3.map((res: any) => {
    if (
        res.type != 'relation' &&
        res.type != 'formula' &&
        res.type != 'textarea' &&
        res.type != 'rich-text' &&
        res.type != 'json' &&
        res.type != 'attachment' &&
        res.type != 'image' &&
        res.type != 'ciphertext' &&
        res.type != 'users'
    ) {
      if (
          res.type == 'text' &&
          res.config.length < 768
      ) {
        return res;
      } else if (res.type != 'text') {
        return res;
      }
    }
  });
  let waiList = data3.filter((res: any) => {
    if (
        res.type == 'text' &&
        res.config.length >= 20 && res.systemFieldType == 0
    ) {
      return res;
    } else if (
        res.type == 'int' &&
        res.systemFieldType == 0 &&
        res.config.dbType == 'BIGINT'
    ) {
      return res;
    }
  });
  sessionStorage.setItem('waiList',JSON.stringify(waiList));
  sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
  sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
  sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
  sessionStorage.setItem('fieldCrud',JSON.stringify(data3));
  let formulArr: any[] = [];
  data3.forEach((item: any) => {
    if (
        item.type != 'formula' &&
        item.systemFieldType != 6 &&
        item.systemFieldType != 7 &&
        item.systemFieldType != 8 &&
        item.systemFieldType != 9
    ) {
      formulArr.push({...item,label:item.name,value:item.code});
    }
  });
  sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
  doAction({
    actionType: 'setValue',
    componentId: 'myField',
    args: {
      value: {
        items: data3
      }
    }
  });
  doAction({
    actionType: 'reload',
    componentId: 'nameField'
  });
  let neKeyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
  console.log(neKeyData, 'neKeyDataneKeyData');
  if (neKeyData.length > 0) {
    let neKeyData2 = neKeyData.map(
        (dshj: any) => {
          if (event.data.foreignKeyCode) {
            let daij = {...dshj};
            if (daij.columnNames.includes(event.data.foreignKeyCode + ',') ||
                daij.columnNames.includes(',' + event.data.foreignKeyCode) ||
                daij.columnNames == event.data.foreignKeyCode
            ) {
              console.log(daij, '进入');
              let samne = daij.columnNames.split(',');
              let sjam: any = [];
              sjam = samne.filter((sj: any) => {
                if (sj != event.data.foreignKeyCode) {
                  return sj;
                }
              });
              console.log(sjam, 'sjam');
              daij.columnNames = sjam.join(',');
            }
            console.log(daij, 'daijdaijdaij');
            return daij;
          }
        }
    );
    let deleteCode: any[] = [];
    const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    deleteCode = data3
        .filter(item => systemFieldTypes.includes(item.systemFieldType))
        .map(item => item.code);
    const blackListFields = new Set([
      'id',
      'deleted',
      'deletedAt',
      'deletedBy',
      'updatedAt',
      'createdAt',
      'createdBy',
      'updatedBy',
      ...deleteCode
    ]);
    let fieldDataes: any[] = [];
    neKeyData2.forEach((res: any) => {
      const { columnNames } = res;
      if (!columnNames) {
        return;
      }
      const fields = columnNames
          .split(',')
          .map(f => f.trim())
          .filter(Boolean);
      const hasNonBlacklisted = fields.some(field => !blackListFields.has(field));
      if (hasNonBlacklisted && !res.uniqueFlag) {
        fieldDataes.push(res);
      }else if(!res.uniqueFlag){
        fieldDataes.push(res);
      }
    });
    let fieldDataese = fieldDataes.map(
        (res: any, index: number) => {
          return {...res, sort: index + 1,
            columnNames:processIndexFields(res.columnNames,data3)
          };
        }
    );
    sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataese));
    doAction({
      actionType: 'setValue',
      componentId: 'keyCrud',
      args: {
        value: {
          items: fieldDataese
        }
      }
    });
    let nameFieldData =
        sessionStorage.getItem('nameFieldData')
    if (
        nameFieldData == event.data.foreignKeyCode
    ) {
      let ars = data3.filter(sc => {
        return sc.systemFieldType == 0;
      });
      console.log(ars, 'arsarsarsarsarsars');
      if (ars.length > 0) {
        doAction({
          actionType: 'setValue',
          componentId: 'nameField',
          args: {
            value: ars[0].code
          }
        });
        // nameFieldData = ars[0].code;
        sessionStorage.setItem('nameFieldData', ars[0].code)
      } else {
        doAction({
          actionType: 'setValue',
          componentId: 'nameField',
          args: {
            value: 'id'
          }
        });
        // nameFieldData = 'id';
        sessionStorage.setItem('nameFieldData', 'id')
      }
    }
  }
  let removeRelationsArr = JSON.parse(
      sessionStorage.getItem('removeRelations')!
  );
  console.log(removeRelationsArr,'removeRelationsArr')
  removeRelationsArr.push(event.data.queryKey)
  console.log(removeRelationsArr,'removeRelationsArr')
  sessionStorage.setItem('removeRelations',JSON.stringify(removeRelationsArr));
  doAction({
    actionType: 'closeDialog',
    componentId: 'deleteDialogId'
  });
}

// 删除关系方法(删除中间表)
export function deleteMRelations(doAction,event: any) {
  console.log('删除关系设置');
  console.log(_, '____');
  console.log(
      doAction,
      'doActiondoActiondoActiondoAction'
  );
  console.log(event, 'eventeventeventevent');
  let data1 = JSON.parse(sessionStorage.getItem('affectCrud')!);
  let data = data1.filter((res: any) => {
    // return res.code != event.data.code
    if (event.data.needId) {
      return res.needId != event.data.needId;
    } else {
      return res.id != event.data.id;
    }
  });
  data.forEach((element: any, index: number) => {
    element.sort = index + 1;
  });
  sessionStorage.setItem('affectCrud',JSON.stringify(data));
  doAction({
    actionType: 'setValue',
    componentId: 'affectCrud',
    args: {
      value: {
        items: data
      }
    }
  });
  let data2 = JSON.parse(
      sessionStorage.getItem('fieldCrud')!
  );
  console.log(data2, 'ssssssssssss');
  let yuanData: any;
  if (sessionStorage.getItem('yuanData')!) {
    yuanData = JSON.parse(sessionStorage.getItem('yuanData')!);
  }
  let data3: any[] = [];
  data2.forEach((ress: any) => {
    if (event.data.__super.foreignKeyCode) {
      console.log(yuanData, '进入');
      let haveData = {};
      if (yuanData) {
        yuanData.forEach((siw: any) => {
          if (ress.needId) {
            if (
                siw.needId == ress.needId &&
                ress.systemFieldType == 0 &&
                ress.type != 'relation'
            ) {
              // return siw
              haveData = siw;
            }
          }
        });
      }
      if (JSON.stringify(haveData) === '{}') {
        console.log('进入');
        if (
            ress.code !=
            event.data.__super.foreignKeyCode &&
            ress.code != event.data.__super.code
        ) {
          data3.push(ress);
        }
        // return res.code != event.data.__super.foreignKeyCode && res.code != event.data.__super.code
      } else {
        console.log('进入1');
        console.log(haveData, 'haveData[0]');
        data3.push(haveData);
        // return haveData
      }
      // return res.queryKey != event.data.fieldKey
    } else if (
        event.data.inverseSideKey != null &&
        ress.type == 'relation' &&
        (ress.needId || ress.id)
    ) {
      console.log('进入1');
      if (ress.code != event.data.code) {
        data.push(ress);
      }
      // return res.code != event.data.code
    } else {
      console.log('进入2');
      if (event.data.id) {
        if (ress.id != event.data.id) {
          data.push(ress);
        }
        // return res.id != event.data.id
      } else {
        if (ress.needId != event.data.needId) {
          data.push(ress);
        }
        // return res.needId != event.data.needId
      }
    }
  });
  console.log(data3, 'data3data3data3');
  data3.forEach((element: any, index: number) => {
    element.sort = index + 1;
  });
  let fieldCruds = data3.map((res: any) => {
    // if (res.relationMode == null || (res.relationMode == 0 || res.relationMode == 1)) {
    if (res.type != 'relation' && res.systemFieldType != 6
        && res.systemFieldType != 7 && res.systemFieldType != 9
        && res.systemFieldType != 8 && res.type != 'formula') {
      return res;
    }
  });
  let puFieldCruds = data3.map((res: any) => {
    if (
        !res.foreignKeyFlag &&
        res.systemFieldType == 0 &&
        res.type != 'relation'
    ) {
      return res;
    }
  });
  let fieldKeyCruds = data3.map((res: any) => {
    if (
        res.type != 'relation' &&
        res.type != 'formula' &&
        res.type != 'textarea' &&
        res.type != 'rich-text' &&
        res.type != 'json' &&
        res.type != 'attachment' &&
        res.type != 'image' &&
        res.type != 'ciphertext' &&
        res.type != 'users'
    ) {
      if (
          res.type == 'text' &&
          res.config.length < 768
      ) {
        return res;
      } else if (res.type != 'text') {
        return res;
      }
    }
  });
  let waiList = data3.filter((res: any) => {
    if (
        res.type == 'text' &&
        res.config.length >= 20 && res.systemFieldType == 0
    ) {
      return res;
    } else if (
        res.type == 'int' &&
        res.systemFieldType == 0 &&
        res.config.dbType == 'BIGINT'
    ) {
      return res;
    }
  });
  sessionStorage.setItem('waiList',JSON.stringify(waiList));
  sessionStorage.setItem('fieldKeyCruds',JSON.stringify(fieldKeyCruds));
  sessionStorage.setItem('puFieldCruds',JSON.stringify(puFieldCruds));
  sessionStorage.setItem('fieldCruds',JSON.stringify(fieldCruds));
  sessionStorage.setItem('fieldCrud',JSON.stringify(data3));
  let formulArr: any[] = [];
  data3.forEach((item: any) => {
    if (
        item.type != 'formula' &&
        item.systemFieldType != 6 &&
        item.systemFieldType != 7 &&
        item.systemFieldType != 8 &&
        item.systemFieldType != 9
    ) {
      formulArr.push({...item,label:item.name,value:item.code});
    }
  });
  sessionStorage.setItem('formulaData',JSON.stringify(formulArr));
  doAction({
    actionType: 'setValue',
    componentId: 'myField',
    args: {
      value: {
        items: data3
      }
    }
  });
  doAction({
    actionType: 'reload',
    componentId: 'nameField'
  });
  let neKeyData = JSON.parse(sessionStorage.getItem('keyCrud')!);
  console.log(neKeyData, 'neKeyDataneKeyData');
  if (neKeyData.length > 0) {
    // let neKeyData2 = neKeyData.filter((res:any) => {
    //     if (event.data.foreignKeyCode) {
    //         return res.columnNames != event.data.foreignKeyCode
    //     }
    // })
    let neKeyData2 = neKeyData.map(
        (dshj: any) => {
          if (event.data.foreignKeyCode) {
            let daij = {...dshj};
            if (daij.columnNames.includes(event.data.foreignKeyCode + ',') ||
                daij.columnNames.includes(',' + event.data.foreignKeyCode) ||
                daij.columnNames == event.data.foreignKeyCode
            ) {
              console.log(daij, '进入');
              let samne = daij.columnNames.split(',');
              let sjam: any = [];
              sjam = samne.filter((sj: any) => {
                if (sj != event.data.foreignKeyCode) {
                  return sj;
                }
              });
              console.log(sjam, 'sjam');
              daij.columnNames = sjam.join(',');
            }
            console.log(daij, 'daijdaijdaij');
            return daij;
          }
        }
    );
    let deleteCode: any[] = [];
    const systemFieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    deleteCode = data3
        .filter(item => systemFieldTypes.includes(item.systemFieldType))
        .map(item => item.code);
    const blackListFields = new Set([
      'id',
      'deleted',
      'deletedAt',
      'deletedBy',
      'updatedAt',
      'createdAt',
      'createdBy',
      'updatedBy',
      ...deleteCode
    ]);
    let fieldDataes: any[] = [];
    neKeyData2.forEach((res: any) => {
      const { columnNames } = res;
      if (!columnNames) {
        return;
      }
      const fields = columnNames
          .split(',')
          .map(f => f.trim())
          .filter(Boolean);
      const hasNonBlacklisted = fields.some(field => !blackListFields.has(field));
      if (hasNonBlacklisted && !res.uniqueFlag) {
        fieldDataes.push(res);
      }else if(!res.uniqueFlag){
        fieldDataes.push(res);
      }
    });
    let fieldDataese = fieldDataes.map(
        (res: any, index: number) => {
          return {...res, sort: index + 1,
            columnNames:processIndexFields(res.columnNames,data3)
          };
        }
    );
    sessionStorage.setItem('keyCrud',JSON.stringify(fieldDataese));
    doAction({
      actionType: 'setValue',
      componentId: 'keyCrud',
      args: {
        value: {
          items: fieldDataese
        }
      }
    });
    let nameFieldData =
        sessionStorage.getItem('nameFieldData')
    if (
        nameFieldData == event.data.foreignKeyCode
    ) {
      let ars = data3.filter(sc => {
        return sc.systemFieldType == 0;
      });
      console.log(ars, 'arsarsarsarsarsars');
      if (ars.length > 0) {
        doAction({
          actionType: 'setValue',
          componentId: 'nameField',
          args: {
            value: ars[0].code
          }
        });
        // nameFieldData = ars[0].code;
        sessionStorage.setItem('nameFieldData', ars[0].code)
      } else {
        doAction({
          actionType: 'setValue',
          componentId: 'nameField',
          args: {
            value: 'id'
          }
        });
        // nameFieldData = 'id';
        sessionStorage.setItem('nameFieldData', 'id')
      }
    }
  }
  doAction({
    actionType: 'closeDialog',
    componentId: 'deleteDialogId'
  });
}
