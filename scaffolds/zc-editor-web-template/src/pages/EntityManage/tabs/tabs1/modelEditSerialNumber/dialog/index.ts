import {useAdminBaseUrl, useDevBaseUrl} from '@/utils/util';
import {confirm, toast} from 'amis';
import {clearBefore} from '@/api/entitymanage';

export default () => {
  let tableList: any = [];
  let tableKeyValue: any = '';
  return {
    type: 'dialog',
    title: '流水号记录日志',
    id: 'dialogSerialNumber',
    size: 'lg',
    body: {
      'type': 'form',
      'id': 'ser_log_form',
      'syncLocation': false,
      'initApi': {
        'method': 'get',
        'url': useDevBaseUrl('/entitymanage/serialno/getList?tableKey=${tableKey}&columnKey=${queryKey}&dsKey=${dsKey}&rrule=${rrule}&pageNo=${pageNo}&pageSize=${pageSize}&env=${env}&fieldCode=${fieldCode}&fieldValue=${fieldValue}&date=${date}'),
        'trackExpression': '${env}, ${pageNo}, ${pageSize}, ${date}, ${fieldCode}, ${fieldValue}',
        requestAdaptor: function(api: any) {
          console.log(api, ';aaaaaaaaaaa');
          console.log(tableKeyValue, ';tableKeyValue');
          let tableKey = '';
          let columnKey = '';
          let dsCode = '';
          let rrule = '';
          tableList.forEach(res => {
            res.children.forEach(ress => {
              ress.children.forEach(item => {
                if (item.id == tableKeyValue) {
                  dsCode = res.code;
                  tableKey = ress.id;
                  columnKey = item.id;
                  item.rules.forEach(item => {
                    if (item.type === 'auto-increase') {
                      rrule = item.options.rrule;
                    }
                  });
                }
              });
            });
          });
          console.log({
            ...api,
            query: {
              'tableKey': tableKey,
              'columnKey': columnKey,
              'dsCode': dsCode,
              'rrule': rrule,
              'env': api.query.env,
              'pageNo': api.query.pageNo,
              'pageSize': api.query.pageSize
            }
          }, 'sadsdsadasdasdasdas');
          return {
            ...api,
            query: {
              'tableKey': tableKey,
              'columnKey': columnKey,
              'dsCode': dsCode,
              'rrule': rrule,
              'env': api.query.env,
              'pageNo': api.query.pageNo === '' ? 1 : api.query.pageNo,
              'pageSize': api.query.pageSize === '' ? 10 : api.query.pageSize,
              'date': api.query.date,
              fieldCode: api.query.fieldCode,
              fieldValue: api.query.fieldValue
            }
          };
        },
        adaptor: function(payload: any, response: any, api: any, context: any) {
          const serDevLogList = payload?.data?.list ? payload?.data?.list : [];
          const serDevTotal = payload?.data?.total;
          const serTestLogList = payload?.data?.list ? payload?.data?.list : [];
          const serTestTotal = payload?.data?.total;
          const serProdLogList = payload?.data?.list ? payload?.data?.list : [];
          const serProdTotal = payload?.data?.total;
          return {
            ...payload,
            status: payload.code,
            data: {
              ...payload.data,
              serDevLogList: serDevLogList,
              serDevTotal: serDevTotal,
              serTestLogList: serTestLogList,
              serTestTotal: serTestTotal,
              serProdLogList: serProdLogList,
              serProdTotal: serProdTotal
            }
          };
        }
      },
      'body': [
        {
          label: '表字段选择',
          id: 'fieldSelection',
          name: 'fieldSelection',
          type: 'nested-select',
          required: true,
          onlyLeaf: true,
          source: {
            'method': 'get',
            'url': useDevBaseUrl('/entitymanage/dataSource/getSerialnoCascadeSelect'),
            adaptor: function(payload: any) {
              console.log(payload, 'payloadpayloadpayload');
              let data = [];
              data = payload.data.map(res => {
                return {
                  ...res,
                  label: res.name,
                  value: res.id,
                  children: res.tables.map(item => {
                    return {
                      ...item,
                      label: item.name,
                      value: item.id, children: item.fields.map(itemm => {
                        return {
                          ...itemm, label: itemm.name,
                          value: itemm.id
                        };
                      })
                    };
                  })
                };
              });
              tableList = data;
              return {
                ...payload,
                status: payload.code,
                data: data
              };
            }
          },
          onEvent: {
            change: {
              actions: [
                {
                  actionType: 'custom',
                  script: function(_: any, doAction: any, event: any) {
                    tableKeyValue = event.data.value;
                    doAction({
                      actionType: 'hidden',
                      componentId: 'serDevLogList'
                    });
                    setTimeout(() => {
                      tableList.forEach(res => {
                        res.children.forEach(ress => {
                          ress.children.forEach(item => {
                            if (item.id == event.data.fieldSelection) {
                              item.rules.forEach(item => {
                                if (item.type === 'auto-increase') {
                                  sessionStorage.setItem('rrule', JSON.stringify(item.options.rrule));
                                }
                              });
                            }
                          });
                        });
                      });
                      doAction({
                        actionType: 'show',
                        componentId: 'serDevLogList'
                      });
                      doAction({
                        actionType: 'reload',
                        componentId: 'ser_log_form'
                      });
                    }, 100);
                  }
                }
              ]
            }
          }
        },
        {
          "type": "select",
          "name": "expireTime",
          "label": "",
          "required": true,
          "value": "0",
          "className": "serial_clear",
          'visibleOn': 'this.fieldSelection',
          "hiddenOn": "${ss:rrule == 'fieldValuely' || ss:rrule == 'none'}",
          "options": [
            {
              "label": "全部",
              "value": "0"
            },
            {
              "label": "1个月之前",
              "value": "1"
            },
            {
              "label": "2个月之前",
              "value": "2"
            },
            {
              "label": "3个月之前",
              "value": "3"
            },
            {
              "label": "半年之前",
              "value": "6"
            },
            {
              "label": "1年之前",
              "value": "12"
            },
            {
              "label": "2年之前",
              "value": "24"
            },
            {
              "label": "3年之前",
              "value": "36"
            },
            {
              "label": "5年之前",
              "value": "60"
            },
            {
              "label": "10年之前",
              "value": "120"
            },
          ]
        },
        {
          "type": "button",
          'visibleOn': 'this.fieldSelection',
          "label": "清空",
          "className": "serial_log",
          onEvent: {
            click: {
              actions: [
                {
                  actionType: 'custom',
                  script: async function(_, doAction, event){
                    console.log(event,'event')
                    let tableKey = '';
                    let columnKey = '';
                    let dsCode = '';
                    let rrule = '';
                    tableList.forEach(res => {
                      res.children.forEach(ress => {
                        ress.children.forEach(item => {
                          if (item.id == tableKeyValue) {
                            dsCode = res.code;
                            tableKey = ress.id;
                            columnKey = item.id;
                            item.rules.forEach(item => {
                              if (item.type === 'auto-increase') {
                                rrule = item.options.rrule;
                              }
                            });
                          }
                        });
                      });
                    });
                    const expireTime = event.data.expireTime
                    const params = {
                      tableKey: tableKey,
                      columnKey: columnKey,
                      dsCode: dsCode,
                      rrule: rrule,
                      env: 1,
                      months: expireTime,
                      reverseListFlag: false
                    }
                    confirm("确认要清空吗？", '提示','确定','取消').then(async(res) =>{
                      if(res){
                        const res = await clearBefore(params)
                        if(res.data.code !=0) {
                          toast.error(res.data.msg, {
                            position: 'top-right'
                          });
                          return
                        } else {
                          doAction({
                            "actionType": "setValue",
                            "componentId": "ser_log_form",
                            "args": {
                              "value": {
                                "env": 1,
                                "pageNo": 1,
                                "pageSize": 10,
                                "fieldCode": "",
                                "fieldValue": "",
                                "date": ""
                              }
                            }
                          })
                          setTimeout(() => {
                            doAction({
                              "actionType": "reload",
                              "componentId": "ser_log_form",
                            })
                          }, 300);
                        }
                      }
                    })
                  }
                },
              ]
            }
          }
        },
        {
          'type': 'button',
          'label': '无效日志数据',
          'className': 'serial_log_clear',
          'visibleOn': 'this.fieldSelection',
          'actionType': 'dialog',
          'dialog': {
            'title': '无效日志数据',
            'size': 'lg',
            'data': {
              tableKey: '${tableKey}',
              queryKey: '${queryKey}',
              code: '${code}',
              rrule: '${ss:rrule}',
              dsCode: '${dsCode}',
              pageNo: 1,
              pageSize: 10,
              env: 1,
              fieldCode: '',
              fieldValue: '',
              date: '',
              createdFieldSerialUtilTableFlag: '${createdFieldSerialUtilTableFlag}'
            },
            'body': {
              'type': 'form',
              'id': 'invalid_log_data',
              'syncLocation': false,
              'initApi': {
                'method': 'get',
                'url': useDevBaseUrl('/entitymanage/serialno/getList'),
                'trackExpression': '${env}, ${pageNo}, ${pageSize}, ${date}, ${fieldCode}, ${fieldValue}',
                requestAdaptor: function(api: any) {
                  console.log(api, ';bbbbbbbbbbbbbbbbbbbb');
                  let tableKey = '';
                  let columnKey = '';
                  let dsCode = '';
                  let rrule = '';
                  let createdFieldSerialUtilTableFlag = '';
                  tableList.forEach(res => {
                    res.children.forEach(ress => {
                      ress.children.forEach(item => {
                        if (item.id == tableKeyValue) {
                          dsCode = res.code;
                          tableKey = ress.id;
                          columnKey = item.id;
                          createdFieldSerialUtilTableFlag = item.createdFieldSerialUtilTableFlag === null ? false : item.createdFieldSerialUtilTableFlag;
                          item.rules.forEach(item => {
                            if (item.type === 'auto-increase') {
                              rrule = item.options.rrule;
                            }
                          });
                        }
                      });
                    });
                  });
                  let returnData = {
                    ...api,
                    query: {
                      'tableKey': tableKey,
                      'columnKey': columnKey,
                      'dsCode': dsCode,
                      'rrule': rrule,
                      'env': 1,
                      reverseListFlag: true,
                      createdFieldSerialUtilTableFlag: createdFieldSerialUtilTableFlag,
                      pageNo:1,
                      pageSize:10
                    }
                  }
                  if(api.context){
                    returnData.query = {
                      ...returnData.query,
                      'pageNo': api.context.pageNo === '' ? 1 : api.context.pageNo,
                      'pageSize': api.context.pageSize === '' ? 10 : api.context.pageSize,
                      'date': api.context.date,
                      fieldCode: api.context.fieldCode,
                      fieldValue: api.context.fieldValue
                    }
                  }
                  return returnData
                },
                adaptor: function(payload: any, response: any, api: any, context: any) {
                  const logList = payload?.data?.list ? payload?.data?.list : [];
                  const logTotal = payload?.data?.total;
                  return {
                    ...payload,
                    status: payload.code,
                    data: {...payload.data, invalidLogList: logList, logTotal: logTotal}
                  };
                }
              },
              'body': [
                {
                  'type': 'form',
                  'wrapWithPanel': false,
                  'body': [
                    {
                      'type': 'select',
                      'name': 'expireTime',
                      'label': '',
                      'required': true,
                      'value': '0',
                      'className': 'serial_clear',
                      'options': [
                        {
                          'label': '全部',
                          'value': '0'
                        },
                        {
                          'label': '1个月之前',
                          'value': '1'
                        },
                        {
                          'label': '2个月之前',
                          'value': '2'
                        },
                        {
                          'label': '3个月之前',
                          'value': '3'
                        },
                        {
                          'label': '半年之前',
                          'value': '6'
                        },
                        {
                          'label': '1年之前',
                          'value': '12'
                        },
                        {
                          'label': '2年之前',
                          'value': '24'
                        },
                        {
                          'label': '3年之前',
                          'value': '36'
                        },
                        {
                          'label': '5年之前',
                          'value': '60'
                        },
                        {
                          'label': '10年之前',
                          'value': '120'
                        }
                      ]
                    },
                    {
                      'type': 'button',
                      'label': '清空',
                      'className': 'serial_log',
                      onEvent: {
                        click: {
                          actions: [
                            {
                              actionType: 'custom',
                              script: async function(_, doAction, event) {
                                let tableKey = '';
                                let columnKey = '';
                                let dsCode = '';
                                let rrule = '';
                                let createdFieldSerialUtilTableFlag = '';
                                tableList.forEach(res => {
                                  res.children.forEach(ress => {
                                    ress.children.forEach(item => {
                                      if (item.id == tableKeyValue) {
                                        dsCode = res.code;
                                        tableKey = ress.id;
                                        columnKey = item.id;
                                        createdFieldSerialUtilTableFlag = item.createdFieldSerialUtilTableFlag === null ? false : item.createdFieldSerialUtilTableFlag;
                                        item.rules.forEach(item => {
                                          if (item.type === 'auto-increase') {
                                            rrule = item.options.rrule;
                                          }
                                        });
                                      }
                                    });
                                  });
                                });
                                const expireTime = event.data.expireTime;
                                const params = {
                                  tableKey: tableKey,
                                  columnKey: columnKey,
                                  dsCode: dsCode,
                                  rrule: rrule,
                                  env: 1,
                                  months: expireTime,
                                  reverseListFlag: true,
                                  createdFieldSerialUtilTableFlag: createdFieldSerialUtilTableFlag,
                                };
                                confirm('确认要清空吗？', '提示', '确定', '取消').then(async (res) => {
                                  if (res) {
                                    const res = await clearBefore(params);
                                    if (res.data.code != 0) {
                                      toast.error(res.data.msg, {
                                        position: 'top-right'
                                      });
                                      return;
                                    } else {
                                      doAction({
                                        'actionType': 'setValue',
                                        'componentId': 'invalid_log_data',
                                        'args': {
                                          'value': {
                                            'env': 1,
                                            'pageNo': 1,
                                            'pageSize': 10,
                                            'fieldCode': '',
                                            'fieldValue': '',
                                            'date': ''
                                          }
                                        }
                                      });
                                      setTimeout(() => {
                                        doAction({
                                          'actionType': 'reload',
                                          'componentId': 'invalid_log_data'
                                        });
                                      }, 300);
                                    }
                                  }
                                });
                              }
                            }
                          ]
                        }
                      }
                    },
                    {
                      'type': 'form',
                      'title': '查询条件',
                      'mode': 'inline',
                      'className': '',
                      'body': [
                        {
                          'type': 'input-date',
                          'name': 'date',
                          'label': '时间',
                          'placeholder': '请选择时间',
                          'clearable': true,
                          'format': 'YYYY-MM-DD',
                        },
                        {
                          'type': 'input-text',
                          'name': 'fieldCode',
                          'label': '字段名',
                          'placeholder': '请输入字段名',
                          'clearable': true,
                        },
                        {
                          'type': 'input-text',
                          'name': 'fieldValue',
                          'label': '字段值',
                          'placeholder': '请输入字段值',
                          'clearable': true,
                        },
                        {
                          'type': 'submit',
                          'label': '查询',
                          'level': 'primary',
                          'onEvent': {
                            'click': {
                              'actions': [{
                                'actionType': 'custom',
                                script: function(_, doAction, event) {
                                  setTimeout(() => {
                                    doAction({
                                      'actionType': 'setValue',
                                      'componentId': 'invalid_log_data',
                                      'args': {
                                        'value': {
                                          'env': 1,
                                          'pageNo': 1,
                                          'pageSize': _.props.data.__super.__super.pageSize,
                                          'fieldCode': event.data.fieldCode,
                                          'fieldValue': event.data.fieldValue,
                                          'date': event.data.date
                                        }
                                      }
                                    });
                                  }, 300);
                                }
                              }]
                            }
                          }
                        },
                        {
                          'type': 'button',
                          'label': '重置',
                          'onEvent': {
                            'click': {
                              'actions': [{
                                'actionType': 'custom',
                                script: function(_, doAction, event) {
                                  setTimeout(() => {
                                    doAction({
                                      'actionType': 'setValue',
                                      'componentId': 'invalid_log_data',
                                      'args': {
                                        'value': {
                                          'env': 1,
                                          'pageNo': 1,
                                          'pageSize': _.props.data.__super.__super.pageSize,
                                          'fieldCode': '',
                                          'fieldValue': '',
                                          'date': ''
                                        }
                                      }
                                    });
                                  }, 300);
                                }
                              }]
                            }
                          }
                        }
                      ]
                    },
                    {
                      'type': 'input-table',
                      'labelWidth': 1,
                      'removable': true,
                      'name': 'invalidLogList',
                      'columnsTogglable': false,
                      'columns': [
                        {
                          'name': 'rrule',
                          'label': '重复规则',
                          'type': 'mapping',
                          'map': {
                            'none': '<span>不重复</span>',
                            'daily': '<span>每天重复</span>',
                            'weekly': '<span>每周重复</span>',
                            'monthly': '<span>每月重复</span>',
                            'quarterly': '<span>每季重复</span>',
                            'yearly': '<span>每年重复</span>',
                            'fieldValuely': '<span>不同字段值重复</span>'
                          }
                        },
                        {
                          'name': 'date',
                          'label': '时间'
                        },
                        {
                          'name': 'fieldCode',
                          'label': '字段名'
                        },
                        {
                          'name': 'fieldValue',
                          'label': '字段值'
                        },
                        {
                          'name': 'code',
                          'label': '当前编码'
                        }
                      ],
                      'needConfirm': true,
                      'onEvent': {
                        'deleteSuccess': {
                          'actions': [{
                            'actionType': 'custom',
                            script: function(_, doAction, event) {
                              const pageNo = Math.ceil((('serDevTotal' in _.props.data.__super ? _.props.data.__super.serDevTotal : 2) - 1) / (_.props.data.pageSize ? _.props.data.pageSize : 10));
                              doAction({
                                'actionType': 'setValue',
                                'componentId': 'invalid_log_data',
                                'args': {
                                  'value': {
                                    'env': 1,
                                    'pageNo': pageNo,
                                    'pageSize': (_.props.data.pageSize ? _.props.data.pageSize : 10),
                                    'fieldCode': '',
                                    'fieldValue': '',
                                    'date': ''
                                  }
                                }
                              });
                              setTimeout(() => {
                                doAction({
                                  'actionType': 'reload',
                                  'componentId': 'invalid_log_data'
                                });
                              }, 300);
                            }
                          }]
                        }
                      },
                      'deleteApi': {
                        'method': 'delete',
                        'url': useDevBaseUrl('/entitymanage/serialno/remove'),
                        requestAdaptor: function(api: any, context: any) {
                          const id = api.context.id;
                          const code = api.context.code;
                          const date = api.context.date;
                          const rrule = api.context.rrule;
                          const fieldCode = api.context.fieldCode;
                          const fieldValue = api.context.fieldValue;
                          const tableKey = context.tableKey;
                          const columnKey = context.queryKey;
                          const dsCode = context.dsCode;
                          return {
                            ...api,
                            data: {
                              'id': id,
                              'code': code,
                              'date': date,
                              'rrule': rrule,
                              'fieldCode': fieldCode,
                              'fieldValue': fieldValue,
                              'tableKey': tableKey,
                              'columnKey': columnKey,
                              'dsCode': dsCode,
                              'env': 1
                            }
                          };
                        },
                        adaptor: async function(payload: any) {
                          return {
                            ...payload,
                            status: payload.code
                          };
                        }
                      }
                    },
                    {
                      'type': 'pagination',
                      'layout': 'total,perPage,pager',
                      'mode': 'normal',
                      'total': '${logTotal}',
                      'perPage': 10,
                      'showPerPage': true,
                      'perPageAvailable': [
                        10,
                        20,
                        50,
                        100,
                        200,
                        500,
                        1000
                      ],
                      'activePage': '${pageNo}',
                      'onEvent': {
                        'change': {
                          'actions': [
                            {
                              'actionType': 'setValue',
                              'componentId': 'invalid_log_data',
                              'args': {
                                'value': {
                                  'pageNo': '${event.data.page}',
                                  'pageSize': '${event.data.perPage}'
                                }
                              }
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              ]
            },
            'actions': [
              {
                'label': '关闭',
                'actionType': 'close',
                'level': 'default',
                'type': 'button'
              }
            ]
          }
        },
        {
          'type': 'form',
          'title': '查询条件',
          'mode': 'inline',
          'className': '',
          'visibleOn': 'this.fieldSelection',
          'hiddenOn': '${ss:rrule == \'none\'}',
          'body': [
            {
              'type': 'input-date',
              'name': 'date',
              'label': '时间',
              'placeholder': '请选择时间',
              'clearable': true,
              'format': 'YYYY-MM-DD',
              'hiddenOn': '${ss:rrule == \'fieldValuely\' || ss:rrule == \'none\'}'
            },
            {
              'type': 'input-text',
              'name': 'fieldCode',
              'label': '字段名',
              'placeholder': '请输入字段名',
              'clearable': true,
              'hiddenOn': '${ss:rrule != \'fieldValuely\'}'
            },
            {
              'type': 'input-text',
              'name': 'fieldValue',
              'label': '字段值',
              'placeholder': '请输入字段值',
              'clearable': true,
              'hiddenOn': '${ss:rrule != \'fieldValuely\'}'
            },
            {
              'type': 'submit',
              'label': '查询',
              'level': 'primary',
              'onEvent': {
                'click': {
                  'actions': [{
                    'actionType': 'custom',
                    script: function(_, doAction, event) {
                      console.log(event, 'eventevent');
                      setTimeout(() => {
                        doAction({
                          'actionType': 'setValue',
                          'componentId': 'ser_log_form',
                          'args': {
                            'value': {
                              'env': 1,
                              'pageNo': 1,
                              'pageSize': _.props.data.__super.__super.pageSize,
                              'fieldCode': event.data.fieldCode,
                              'fieldValue': event.data.fieldValue,
                              'date': event.data.date
                            }
                          }
                        });
                      }, 300);
                    }
                  }]
                }
              }
            },
            {
              'type': 'button',
              'label': '重置',
              'onEvent': {
                'click': {
                  'actions': [{
                    'actionType': 'custom',
                    script: function(_, doAction, event) {
                      setTimeout(() => {
                        doAction({
                          'actionType': 'setValue',
                          'componentId': 'ser_log_form',
                          'args': {
                            'value': {
                              'env': 1,
                              'pageNo': 1,
                              'pageSize': _.props.data.__super.__super.pageSize,
                              'fieldCode': '',
                              'fieldValue': '',
                              'date': ''
                            }
                          }
                        });
                      }, 300);
                    }
                  }]
                }
              }
            }
          ]
        },
        {
          'type': 'input-table',
          'visibleOn': 'this.fieldSelection',
          'labelWidth': 1,
          'addable': true,
          'editable': true,
          'removable': true,
          'id': 'serDevLogList',
          'name': 'serDevLogList',
          'columnsTogglable': false,
          'desc': `1、流水号日志按照设置的模式每个周期生成一条新的，记录上存储该周期的第一天的日期。
                              2、修改了是否忽略租户、修改了滚动规则、或者导入了数据中包括重复、后来日期的数据，会造成数据和流水号日志对不上，需要人工在界面上维护流水号日志。`,
          'columns': [
            {
              'name': 'rrule',
              'label': '重复规则',
              'type': 'mapping',
              'map': {
                'none': '<span>不重复</span>',
                'daily': '<span>每天重复</span>',
                'weekly': '<span>每周重复</span>',
                'monthly': '<span>每月重复</span>',
                'quarterly': '<span>每季重复</span>',
                'yearly': '<span>每年重复</span>',
                'fieldValuely': '<span>不同字段值重复</span>'
              },
              'quickEdit': {
                'body': {
                  'type': 'select',
                  'name': 'rrule',
                  'value': '${ss:rrule}',
                  'required': true,
                  'static': true,
                  'options': [
                    {
                      'label': '不重复',
                      'value': 'none',
                      'visibleOn': '${ss:rrule == \'none\'}'
                    },
                    {
                      'label': '每天重复',
                      'value': 'daily',
                      'visibleOn': '${ss:rrule == \'daily\'}'
                    },
                    {
                      'label': '每周重复',
                      'value': 'weekly',
                      'visibleOn': '${ss:rrule == \'weekly\'}'
                    },
                    {
                      'label': '每月重复',
                      'value': 'monthly',
                      'visibleOn': '${ss:rrule == \'monthly\'}'
                    },
                    {
                      'label': '每季重复',
                      'value': 'quarterly',
                      'visibleOn': '${ss:rrule == \'quarterly\'}'
                    },
                    {
                      'label': '每年重复',
                      'value': 'yearly',
                      'visibleOn': '${ss:rrule == \'yearly\'}'
                    },
                    {
                      'label': '不同字段值重复',
                      'value': 'fieldValuely',
                      'visibleOn': '${ss:rrule == \'fieldValuely\'}'
                    }
                  ]
                }
              }
            },
            {
              'name': 'date',
              'label': '时间',
              'hiddenOn': '${ss:rrule == \'fieldValuely\' || ss:rrule == \'none\'}',
              'quickEdit': {
                'body': {
                  'type': 'input-date',
                  'name': 'date',
                  'format': 'YYYY-MM-DD',
                  'value': '${date}',
                  'required': true
                }
              }
            },
            {
              'name': 'fieldCode',
              'label': '字段名',
              'visibleOn': '${ss:rrule == "fieldValuely"}',
              'quickEdit': {
                'body': {
                  'type': 'select',
                  'required': true,
                  'name': 'fieldCode',
                  'labelField': 'name',
                  'valueField': 'key',
                  // 'source': '${ss:serialRepeatField}'
                  "source": {
                    "method": "get",
                    "url": useDevBaseUrl('/entitymanage/table/getMetaTableInfo'),
                    requestAdaptor: function(api: any, context: any) {
                      let tableKey = '';
                      let dsCode = '';
                      tableList.forEach(res => {
                        res.children.forEach(ress => {
                          ress.children.forEach(item => {
                            if (item.id == tableKeyValue) {
                              dsCode = res.code;
                              tableKey = ress.key;
                            }
                          });
                        });
                      });
                      let returnData = {
                        ...api,
                        query: {
                          'tableKey': tableKey,
                          'dsCode': dsCode,
                        }
                      }
                      return returnData
                    },
                    adaptor: function(payload: any) {
                      let data = payload.data.fields
                      //排除系统字段 1-9
                      let sysList = data.filter((ikj: any) => (!ikj.isForeignKey &&
                        !ikj.isCreateDate &&
                        !ikj.isCreateUser &&
                        !ikj.isDeleteDate &&
                        !ikj.isDeleteFlag &&
                        !ikj.isDeleteUser &&
                        !ikj.isUpdateDate &&
                        !ikj.isTenantCode &&
                        !ikj.isPrimaryKey &&
                        !ikj.isUpdateUser))
                      //排除关系字段type = relation
                      let relList = sysList.filter((res: any) => (res.type != 'relation' || (res.type === 'relation' && res.relationMode === 1)))
                      //排除父级字段
                      let parList = relList.filter((res: any) => (res.type != 'parent'))
                      //排除流水号
                      let serList = parList.filter((res: any) => (res.type != 'serial-number'))
                      //排除非必填的
                      let nullList = serList.filter((res: any) => (!res.isNullable))
                      return {
                        ...payload,
                        data: {...payload.data, options: nullList}
                      };
                    },
                  }
                }
              }
            },
            {
              'name': 'fieldValue',
              'label': '字段值',
              'visibleOn': '${ss:rrule == "fieldValuely"}',
              'quickEdit': {
                'body': {
                  'type': 'input-text',
                  'name': 'fieldValue',
                  'id': 'fieldValue'
                }
              }
            },
            {
              'name': 'code',
              'label': '当前编码',
              'quickEdit': {
                'body': {
                  'type': 'input-number',
                  'name': 'code',
                  'required': true,
                  'min': 0
                }
              }
            },
            {
              'name': 'tenantName',
              'label': '租户',
              'quickEdit': {
                'body': {
                  'type': 'select',
                  'name': 'tenantCode',
                  'value': '${tenantCode}',
                  'labelField': 'displayName',
                  'valueField': 'code',
                  'clearable': true,
                  'source': {
                    'method': 'get',
                    'url': useDevBaseUrl('/app/tenant/list'),
                    adaptor: function(payload: any) {
                      return {
                        ...payload,
                        status: payload.code,
                        data: {...payload.data, options: payload.data}
                      };
                    }
                  }
                }
              }
            }
          ],
          'addApi': {
            'method': 'post',
            'url': useDevBaseUrl('/entitymanage/serialno/save'),
            requestAdaptor: function(api: any, context: any) {
              let code = api.data.code;
              let date = api.data.date;
              let rrule = api.data.rrule;
              let tenantCode = api.data.tenantCode;
              let fieldCode = api.data.fieldCode;
              let fieldValue = api.data.fieldValue;
              let tableKey = '';
              let columnKey = '';
              let dsCode = '';
              tableList.forEach(res => {
                res.children.forEach(ress => {
                  ress.children.forEach(item => {
                    if (item.id == api.data.fieldSelection) {
                      dsCode = res.code;
                      tableKey = ress.id;
                      columnKey = item.id;
                      // item.rules.forEach(item => {
                      //   if (item.type === 'auto-increase') {
                      //     rrule = item.options.rrule;
                      //   }
                      // });
                    }
                  });
                });
              });
              return {
                ...api,
                data: {
                  'code': code,
                  'date': date,
                  'rrule': rrule,
                  'tenantCode': tenantCode,
                  'fieldCode': fieldCode,
                  'fieldValue': fieldValue,
                  'tableKey': tableKey,
                  'columnKey': columnKey,
                  'dsCode': dsCode,
                  'env': 1
                }
              };
            },
            adaptor: async function(payload: any) {
              return {
                ...payload,
                status: payload.code
              };
            }
          },
          'needConfirm': true,
          'onEvent': {
            'addSuccess': {
              'actions': [{
                'actionType': 'custom',
                script: function(_, doAction, event) {
                  setTimeout(() => {
                    doAction({
                      'actionType': 'reload',
                      'componentId': 'ser_log_form'
                    });
                  }, 300);
                }
              }]
            },
            'editSuccess': {
              'actions': [
                {
                  'actionType': 'reload',
                  'componentId': 'ser_log_form'
                }
              ]
            },
            'deleteSuccess': {
              'actions': [{
                'actionType': 'custom',
                script: function(_, doAction, event) {
                  console.log(event, '12123213321312', _);
                  const pageNo = Math.ceil((('serDevTotal' in _.props.data.__super ? _.props.data.__super.serDevTotal : 2) - 1) / (_.props.data.pageSize ? _.props.data.pageSize : 10));
                  doAction({
                    'actionType': 'setValue',
                    'componentId': 'ser_log_form',
                    'args': {
                      'value': {
                        'env': 1,
                        'pageNo': pageNo,
                        'pageSize': (_.props.data.pageSize ? _.props.data.pageSize : 10),
                        'fieldCode': '',
                        'fieldValue': '',
                        'date': ''
                      }
                    }
                  });
                  setTimeout(() => {
                    doAction({
                      'actionType': 'reload',
                      'componentId': 'ser_log_form'
                    });
                  }, 300);
                }
              }]
            }
          },
          'updateApi': {
            'method': 'post',
            'url': useDevBaseUrl('/entitymanage/serialno/update'),
            requestAdaptor: function(api: any, context: any) {
              let id = api.data.id;
              let code = api.data.code;
              let date = api.data.date;
              let rrule = api.data.rrule;
              let tenantCode = api.data.tenantCode;
              let fieldCode = api.data.fieldCode;
              let fieldValue = api.data.fieldValue;
              let tableKey = '';
              let columnKey = '';
              let dsCode = '';
              tableList.forEach(res => {
                res.children.forEach(ress => {
                  ress.children.forEach(item => {
                    if (item.id == api.data.fieldSelection) {
                      dsCode = res.code;
                      tableKey = ress.id;
                      columnKey = item.id;
                      // item.rules.forEach(item => {
                      //   if (item.type === 'auto-increase') {
                      //     rrule = item.options.rrule;
                      //   }
                      // });
                    }
                  });
                });
              });
              return {
                ...api,
                data: {
                  'id': id,
                  'code': code,
                  'date': date,
                  'rrule': rrule,
                  'tenantCode': tenantCode,
                  'fieldCode': fieldCode,
                  'fieldValue': fieldValue,
                  'tableKey': tableKey,
                  'columnKey': columnKey,
                  'dsCode': dsCode,
                  'env': 1
                }
              };
            },
            adaptor: async function(payload: any) {
              return {
                ...payload,
                status: payload.code
              };
            }
          },
          'deleteApi': {
            'method': 'delete',
            'url': useDevBaseUrl('/entitymanage/serialno/remove'),
            requestAdaptor: function(api: any, context: any) {
              let id = api.context.id;
              let code = api.context.code;
              let date = api.context.date;
              let rrule = api.context.rrule;
              let fieldCode = api.context.fieldCode;
              let fieldValue = api.context.fieldValue;
              let tableKey = '';
              let columnKey = '';
              let dsCode = '';
              tableList.forEach(res => {
                res.children.forEach(ress => {
                  ress.children.forEach(item => {
                    if (item.id == api.context.fieldSelection) {
                      dsCode = res.code;
                      tableKey = ress.id;
                      columnKey = item.id;
                      // item.rules.forEach(item => {
                      //   if (item.type === 'auto-increase') {
                      //     rrule = item.options.rrule;
                      //   }
                      // });
                    }
                  });
                });
              });
              return {
                ...api,
                data: {
                  'id': id,
                  'code': code,
                  'date': date,
                  'rrule': rrule,
                  'fieldCode': fieldCode,
                  'fieldValue': fieldValue,
                  'tableKey': tableKey,
                  'columnKey': columnKey,
                  'dsCode': dsCode,
                  'env': 1
                }
              };
            },
            adaptor: async function(payload: any) {
              return {
                ...payload,
                status: payload.code
              };
            }
          }
        },
        {
          'visibleOn': 'this.fieldSelection',
          'type': 'pagination',
          'layout': 'total,perPage,pager',
          'mode': 'normal',
          'total': '${serDevTotal}',
          'perPage': 10,
          'showPerPage': true,
          'perPageAvailable': [
            10,
            20,
            50,
            100,
            200,
            500,
            1000
          ],
          'activePage': '${pageNo}',
          'onEvent': {
            'change': {
              'actions': [
                {
                  'actionType': 'setValue',
                  'componentId': 'ser_log_form',
                  'args': {
                    'value': {
                      'pageNo': '${event.data.page}',
                      'pageSize': '${event.data.perPage}'
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    },
    actions: [
      {
        type: 'button',
        actionType: 'cancel',
        label: '关闭'
      }
    ],
    showCloseButton: true,
    closeOnOutside: false,
    closeOnEsc: false,
    showErrorMsg: true,
    showLoading: true,
    draggable: false
  };
}
