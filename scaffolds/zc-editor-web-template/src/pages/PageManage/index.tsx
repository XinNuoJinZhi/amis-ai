import IConSelect from '@/components/IconSelect';
import BigNumber from 'bignumber.js';
import PageSchemaEngine from '@/components/PageSchemaEngine';
import React, {lazy, Suspense} from 'react';
import {useDevBaseUrl, useAdminBaseUrl, assignCustomLevelByDsKey} from '@/utils/util';
import {render as amisRender} from 'amis';
import {getDesignButton} from '@/api/pageManage';
import {toast} from 'amis';
import {store} from '@/store/editor';
import { history } from '@umijs/max';
import { deletePage } from "@/api/pageManage"
import initApiStore from "@/store/initApi"
import permStore from '@/store/permission';
import { isAppEnd } from '@/utils/index'
import {AMISComponent, DynamicComponent, ErrorBoundary} from "@/hooks/amis";
import {useRootContext, RootContextProvider} from '@/hooks/rootContext';
import { getDataSourceList } from "@/api/entitymanage"
import {testMode} from '@/utils/env'
import { $$noPer, dealContextFormat } from '@/utils/dataLoader'

let newOperation = false;
let createResponse: any = null
const dealEdit = async (data) => {
  const queryKey = data?.schemaContent?.queryKey
  const paramsObj = new URLSearchParams(window.location.search);
  const appId = paramsObj.get('appid');
  const env = paramsObj.get('env');
  // const queryKey = paramsObj.get('queryKey');
  let params = {
    queryKey: queryKey,
  }
  let res = await getDesignButton(params)
  let pageType = res.data.data.pageType; // 1 普通页面 3 文件夹
  let pageName = res.data.data.pageName;
  let pageTerminal = res.data.data.pageTerminal;
  let pageCode = res.data.data.pageCode
  // if (pageType == 1) {
    const url = './pageManage/edit?appid=' + appId + '&env=' + env + '&queryKey=' + queryKey + '&pageCode=' + pageCode + (pageTerminal != 2 ? "&pcEnd=true" : "&appEnd=true")
    window.open(url, pageName)
  // } else {
    //给提示信息
  //   toast.info('当前选中的是文件夹，请选择页面进行设计', '提示');
  // }
};
const params = new URLSearchParams(window.location.search)
const appId = params.get('appid')
const env = params.get('env')
const threeDAddress = window.location.origin + '/gl/#/?appid='+appId+'&env='+env
const schema = {
  type: 'page',
  className: 'pageManage',
  aside: [
    {
      type: 'wrapper',
      body: [
        {
          type: 'tpl',
          tpl: '页面管理',
          className: 'page_title'
        },
        {
          type: 'button',
          label: '',
          icon: 'fas fa-plus',
          level: 'link',
          className: 'text-xl text-dark add_plus',
          actionType: 'dialog',
          reload: 'nav',
          visibleOn: '${ARRAYINCLUDES(${$$permissionsData},\'app:page:create\')}',
          dialog: {
            size: 'md',
            title: '创建页面',
            body: [
              {
                type: 'form',
                "initApi": {
                    "method": "get",
                    "url": useDevBaseUrl("/app/page/pageTree?pageType=3"),
                    adaptor: function (payload: any,response:any, api:any, context:any) {
                        const parentList = payload.data?.links ? payload.data?.links : []
                        const parentDefaultVal = payload.data?.links[0]?.queryKey
                        return {
                            ...payload,
                            status: payload.code,
                            data: { ...payload.data, parentList: parentList, parentDefaultVal: parentDefaultVal}
                        };
                    }
                },
                api: {
                  method: 'post',
                  url: useDevBaseUrl('/app/page/create'),
                  requestAdaptor: function(api: any) {
                    if (api.data.pageType == '1') {
                      api.data.pageContent = {
                        type: 'page',
                        title: api.data.pageNameNew,
                        regions: [
                          'body',
                          'toolbar',
                          'header'
                        ]
                      };
                      newOperation = true;
                    }
                    api.data.pageName = api.data.pageNameNew
                    api.data.pageCode= api.data.pageCodeNew
                    return {...api};
                  },
                  adaptor: function(payload: any) {
                    createResponse = payload?.data;
                    return {
                      ...payload,
                      status: payload.code
                    };
                  }
                },
                body: [
                  {
                    type: 'button-group-select',
                    label: '页面终端',
                    name: 'pageTerminal',
                    id: 'pageTerminalId',
                    required: true,
                    value: '1',
                    desc: '${IFS(pageTerminal == \'1\' ,\'默认响应式页面。\')}${IFS(pageTerminal == \'2\' ,\'移动H5独立终端页面。\')} ',
                    options: [
                      {
                        label: 'PC端',
                        value: '1'
                      },
                      {
                        label: "移动端",
                        value: "2",
                        visibleOn: "${ARRAYINCLUDES(${$$permissionsData},'app:publish:mobile')}"
                      },
                      {
                        label: "大屏",
                        value: "3",
                      }
                    ],
                    "onEvent": {
                        "change": {
                            "actions": [
                                {
                                    "actionType": "custom",
                                    script: function (context: any, doAction: Function, event: any) {
                                        if(event.data.value == '3') {
                                            doAction({
                                                "actionType": "setValue",
                                                "componentName": "pageType",
                                                "args": {
                                                    "value": '1'
                                                }
                                            })
                                        }
                                    }
                                }
                            ]
                        }
                    }
                  },
                  {
                    type: 'select',
                    name: 'pageType',
                    label: '页面类型',
                    placeholder: '请选择',
                    required: true,
                    value: '1',
                    desc: '${IFS(pageType == \'1\' ,\'使用外部API，实现各种表单及表格页面。\')}${IFS(pageType == \'2\' ,\'通过导航跳转至外部页面。\')}${IFS(pageType == \'3\' ,\'适合用来作为父级页面。\')} ',
                    options: [
                      {
                        label: '普通页面',
                        value: '1'
                      },
                      {
                        label: '外部链接',
                        value: '2',
                        "hiddenOn": "${pageTerminal == 3}"
                      },
                      {
                        label: '文件夹',
                        value: '3',
                        "hiddenOn": "${pageTerminal == 3}"
                      }
                    ]
                  },
                  {
                    type: 'input-text',
                    name: 'pageNameNew',
                    label: '页面名称',
                    required: true,
                    placeholder: '请输入页面名称',
                    showCounter: true,
                    maxLength: 50
                  },
                  {
                    type: 'input-text',
                    name: 'pageContent',
                    label: '链接地址',
                    placeholder: '请输入链接地址',
                    desc: '外部链接或页面地址',
                    required: 'true',
                    hiddenOn: 'this.pageType == 1 || this.pageType == 3',
                    validations: {
                      matchRegexp: '/^(https?:\/\/)/'
                    },
                    validationErrors: {
                      matchRegexp: '链接地址需以http(s)://开头'
                    }
                  },
                  {
                    type: 'tree-select',
                    name: 'parentKey',
                    label: '父级页面',
                    placeholder: '请选择父级页面',
                    clearable: true,
                    required: true,
                    valueField: 'queryKey',
                    "source": "${parentList}",
                    "value": "${parentDefaultVal}",
                    // source: {
                    //   method: 'get',
                    //   url: useDevBaseUrl('/app/page/pageTree?pageType=3'),
                    //   adaptor: function(payload: any) {
                    //     return {
                    //       ...payload,
                    //       status: payload.code,
                    //       data: {
                    //         ...payload.data,
                    //         options: payload.data?.links ? payload.data?.links : [],
                    //         value: payload.data?.links[0]?.queryKey
                    //       }
                    //     };
                    //   }
                    // }
                  },
                  {
                    type: 'input-text',
                    name: 'menuName',
                    label: '菜单名称',
                    placeholder: '导航中显示的名称，留空将采用页面名称作为菜单名称',
                    showCounter: true,
                    maxLength: 50,
                  },
                  {
                    type: 'input-text',
                    name: 'component',
                    required: true,
                    label: '组件路径'
                  },
                  {
                    type: "input-text",
                    name: "pageCodeNew",
                    label: "编码",
                    placeholder: "请输入编码",
                    showCounter: true,
                    maxLength: 50
                  },
                  {
                    type: 'textarea',
                    name: 'description',
                    label: '描述',
                    placeholder: '请输入描述',
                    showCounter: true,
                    maxLength: 50
                  },
                  {
                    name: 'menuLogo',
                    label: '菜单标识',
                    asFormItem: true,
                    children: ({value, onChange, data}) => (
                      <div>
                        <IConSelect sendValueToFather={(item) => onChange(item)} value={value} />
                      </div>
                    )
                  }
                ]
              }
            ]
          }
        },
        {
          name: 'searchText',
          type: 'input-text',
          className: 'left_page_search',
          label: '',
          placeholder: '输入名称搜索页面',
          clearable: true
        }
      ]
    },
    {
      type: 'nav',
      id: 'nav',
      name: 'nav',
      stacked: true,
      draggable: true,
      target: 'my_service2',
      className: 'w-md',
      itemBadge: {
        "mode": "ribbon",
        "text": "${dsCode}",
        "position": "top-left",
        "visibleOn": "this.dsKey",
        "level": "${customLevel}",
        "size": 20
      },
      // 排序保存接口
      saveOrderApi: useDevBaseUrl('/app/page/treeSort'),
      source: {
        method: 'get',
        url: useDevBaseUrl('/app/page/pageTree?pageName=${searchText}'),
        adaptor: async function(payload: any) {
          const res = await getDataSourceList()
          const dataSourceList = res.data.data.links
          // 递归查找匹配的页面代码并展开所有父节点
          const findAndUnfoldParent = (nodes: any[], targetPageCode: string, parentPath: any[] = []): boolean => {
            for (let i = 0; i < nodes.length; i++) {
              const node = nodes[i]
              const currentPath = [...parentPath, node]

              // 如果找到匹配的 pageCode
              if (node.pageCode === targetPageCode) {
                // 将该节点的所有父节点设置为 unfolded = true
                parentPath.forEach(parentNode => {
                  parentNode.unfolded = true
                })
                return true
              }

              // 如果有子节点，递归查找
              if (node.children && node.children.length > 0) {
                const found = findAndUnfoldParent(node.children, targetPageCode, currentPath)
                if (found) {
                  return true
                }
              }
            }
            return false
          }

          if (newOperation && createResponse?.pageCode) {
            const params = new URLSearchParams(window.location.search);
            const appid = params.get('appid');
            const env = params.get('env');

            // 查找并展开父节点
            if (payload.data.links && payload.data.links.length > 0 && createResponse?.pageCode) {
              payload.data.links.forEach((rootNode: any) => {
                findAndUnfoldParent([rootNode], createResponse.pageCode)
              })
            }

            let url = '';
            if (window.location.pathname == "/app/design/pageManage") {
              url = '/app/design/pageManage?pageCode=' + createResponse.pageCode + '&appid=' + appid + '&env=' + env;
            }
            history.push(url)
          }
          if(payload.code != 0) {
            toast.error(payload.msg, {
              position: 'top-right'
            });
          }
          if(payload.data.links[0].children) {
            payload.data.links[0].children = assignCustomLevelByDsKey(payload.data.links[0].children, dataSourceList)
          }
          return {
            ...payload,
            status: payload.code,
            data: payload?.data ? payload?.data : []
          };
        }
      },
      onEvent: {
        click: {
          actions: [
            {
              actionType: "custom",
              script: function (_, doAction, event) {
                newOperation = false
                createResponse = null
              }
            }
          ]
        }
      },
      itemActions: [
        {
          type: 'dropdown-button',
          level: 'link',
          icon: 'fa fa-ellipsis-h',
          hideCaret: true,
          buttons: [
            {
              type: 'button',
              label: '编辑页面配置',
              visibleOn: '${ARRAYINCLUDES(${$$permissionsData},\'app:page:update\')}',
              actionType: 'dialog',
              reload: 'nav',
              dialog: {
                title: '编辑页面配置',
                "data": {
                  queryKey: "${queryKey}"
                },
                size: 'md',
                body: [
                  {
                    type: 'form',
                    "initApi": {
                      "method": "get",
                      "url":  useDevBaseUrl("/app/page/get?queryKey=${queryKey}"),
                      adaptor: function (payload: any,response:any, api:any, context:any) {
                          return {
                              ...payload,
                              status: payload.code,
                              data: { ...payload.data, orderNum: payload.data?.orderNum}
                          };
                      }
                    },
                    onEvent: {
                      submitSucc: {
                        weight: 0,
                        actions: [
                          {
                            actionType: 'custom',
                            script: async function(context: any, doAction: any, event: any){
                              const params = new URLSearchParams(window.location.search);
                              const appid = params.get('appid');
                              const env = params.get('env');
                              const pageCode = context.props.data.pageCode
                              let url = ''
                              if (window.location.pathname == "/app/design/pageManage") {
                                url = '/app/design/pageManage?pageCode=' + pageCode + '&appid=' + appid + '&env=' + env;
                              }
                              history.push(url)
                              setTimeout(()=>{
                                  doAction({
                                      "actionType": "reload",
                                      "componentId": "my_service",
                                  })
                              }, 1000)
                            }
                          },
                        ]
                      }
                    },
                    api: {
                      method: 'put',
                      url: useDevBaseUrl('/app/page/update'),
                      data: {
                        queryKey: "${queryKey}",
                        pageTerminal: '${pageTerminal}',
                        pageType: '${pageType}',
                        pageName: '${pageName}',
                        pageCode: '${pageCode}',
                        component: '${component}',
                        description: '${description}',
                        parentKey: '${parentKey}',
                        displayInNavigation: '${displayInNavigation}',
                        reservedInTopLabel: '${reservedInTopLabel}',
                        pageResidency: '${pageResidency}',
                        menuName: '${menuName}',
                        menuLogo: '${menuLogo}',
                        pageContent: "${pageContent}",
                        orderNum: "${orderNum}",
                      },
                      requestAdaptor: function(api: any) {
                        //当编辑页面时，只有链接时pageContent 有值，其他类型的话，
                        // pageContent是空字符串，这种时候接口不传pageContent
                        if(api.data.pageContent == ''){
                            api.data.pageContent = undefined
                        }
                        return {...api};
                      },
                      adaptor: function(payload: any) {
                        return {
                          ...payload,
                          status: payload.code
                        };
                      }
                    },
                    body: [
                      {
                        type: 'button-group-select',
                        label: '页面终端',
                        name: 'pageTerminal',
                        options: [
                          {
                            label: 'PC端',
                            value: '1'
                          },
                          {
                            label: "移动端",
                            value: "2",
                            visibleOn: "${ARRAYINCLUDES(${$$permissionsData},'app:publish:mobile')}"
                          },
                          {
                            label: "大屏",
                            value: "3",
                          }
                        ],
                        disabled: true
                      },
                      {
                        type: 'select',
                        name: 'pageType',
                        label: '页面类型',
                        options: [
                          {
                            label: '普通页面',
                            value: '1'
                          },
                          {
                            label: '外部链接',
                            value: '2'
                          },
                          {
                            label: '文件夹',
                            value: '3'
                          }
                        ],
                        disabled: true
                      },
                      {
                        type: 'input-text',
                        name: 'pageName',
                        label: '页面名称',
                        required: true,
                        disabledOn: 'this.homePage == 1',
                        placeholder: '请输入页面名称',
                        showCounter: true,
                        maxLength: 50
                      },
                      {
                        type: 'input-text',
                        name: 'pageContent',
                        label: '链接地址',
                        placeholder: '请输入链接地址',
                        desc: '外部链接或页面地址',
                        required: 'true',
                        hiddenOn: 'this.pageType == 1 || this.pageType == 3',
                        validations: {
                          matchRegexp: '/^(https?:\/\/)/'
                        },
                        validationErrors: {
                          matchRegexp: '链接地址需以http(s)://开头'
                        }
                      },
                      {
                        type: 'tree-select',
                        name: 'parentKey',
                        label: '父级页面',
                        placeholder: '请选择父级页面',
                        hiddenOn: 'this.homePage == 1',
                        clearable: true,
                        required: true,
                        valueField: 'queryKey',
                        source: {
                          method: 'get',
                          url: useDevBaseUrl('/app/page/folders?queryKey=${queryKey}'),
                          adaptor: function(payload: any) {
                            return {
                              ...payload,
                              status: payload.code,
                              data: {
                                ...payload.data,
                                options: payload.data ? payload.data : []
                              }
                            };
                          }
                        }
                      },
                      {
                        type: 'input-text',
                        name: 'menuName',
                        label: '菜单名称',
                        placeholder: '导航中显示的名称，留空将采用页面名称作为菜单名称',
                        maxLength: 50,
                        showCounter: true,
                      },
                      {
                        type: "input-text",
                        name: "pageCode",
                        label: "编码",
                        placeholder: "请输入编码",
                        showCounter: true,
                        maxLength: 50
                      },
                      {
                        type: 'input-text',
                        name: 'component',
                        required: true,
                        label: '组件路径'
                      },
                      {
                        type: 'textarea',
                        name: 'description',
                        label: '描述',
                        placeholder: '请输入描述',
                        showCounter: true,
                        maxLength: 50
                      },
                      {
                        name: 'menuLogo',
                        label: '菜单标识',
                        asFormItem: true,
                        children: ({value, onChange, data}) => (
                          <div>
                            <IConSelect sendValueToFather={(item) => onChange(item)} value={value} />
                          </div>
                        )
                      },
                      {
                        name: 'displayInNavigation',
                        type: 'switch',
                        label: '导航中显示',
                        hidden: true
                      },
                      {
                        name: 'reservedInTopLabel',
                        type: 'switch',
                        label: '顶部标签中保留',
                        hidden: true
                      },
                      {
                        name: 'pageResidency',
                        type: 'switch',
                        label: '页面常驻',
                        hidden: true
                      }
                    ]
                  }
                ]
              }
            },
            {
              type: 'button',
              label: '新建子页面',
              actionType: 'dialog',
              reload: 'nav',
              visibleOn: '${ARRAYINCLUDES(${$$permissionsData},\'app:page:create\')}',
              disabledOn: '(this.pageType == 1 && this.homePage !=1) || this.pageType == 2',
              dialog: {
                size: 'md',
                title: '新建子页面',
                body: [
                  {
                    type: 'form',
                    "initApi": {
                        "method": "get",
                        "url": useDevBaseUrl("/app/page/pageTree?pageType=3"),
                        adaptor: function (payload: any,response:any, api:any, context:any) {
                            const parentList = payload.data?.links ? payload.data?.links : []
                            const parentDefaultVal = payload.data?.links[0]?.queryKey
                            return {
                                ...payload,
                                status: payload.code,
                                data: { ...payload.data, parentList: parentList, parentDefaultVal: parentDefaultVal}
                            };
                        }
                    },
                    api: {
                      method: 'post',
                      url: useDevBaseUrl('/app/page/create'),
                      data: {
                        pageTerminal: '${subPageTerminal}',
                        pageType: '${subPageType}',
                        pageName: '${subPageName}',
                        pageContent: '${subLinkurl}',
                        parentKey: '${subParentKey}',
                        menuName: '${subMenuName}',
                        description: '${subDescription}',
                        menuLogo: '${subMenuLogo}',
                        pageCode: '${subPageCode}',
                        component: '${subComponent}',
                      },
                      requestAdaptor: function(api: any) {
                        if (api.data.pageType == '1') {
                          api.data.pageContent = {
                            type: 'page',
                            title: api.data.pageName,
                            regions: [
                              'body',
                              'toolbar',
                              'header'
                            ]
                          };
                        }
                        return {...api};
                      },
                      adaptor: function(payload: any) {
                        return {
                          ...payload,
                          status: payload.code
                        };
                      }
                    },
                    body: [
                      {
                        type: 'button-group-select',
                        label: '页面终端',
                        name: 'subPageTerminal',
                        required: true,
                        value: '1',
                        desc: '${IFS(subPageTerminal == \'1\' ,\'默认响应式页面。\')}${IFS(subPageTerminal == \'2\' ,\'移动H5独立终端页面。\')} ',
                        options: [
                          {
                            label: 'PC端',
                            value: '1'
                          },
                          {
                            label: "移动端",
                            value: "2",
                            visibleOn: "${ARRAYINCLUDES(${$$permissionsData},'app:publish:mobile')}"
                          },
                          {
                            label: "大屏",
                            value: "3",
                          }
                        ],
                        "onEvent": {
                            "change": {
                                "actions": [
                                    {
                                        "actionType": "custom",
                                        script: function (context: any, doAction: Function, event: any) {
                                            if(event.data.value == '3') {
                                                doAction({
                                                    "actionType": "setValue",
                                                    "componentName": "subPageType",
                                                    "args": {
                                                        "value": '1'
                                                    }
                                                })
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                      },
                      {
                        type: 'select',
                        name: 'subPageType',
                        label: '页面类型',
                        placeholder: '请选择',
                        required: true,
                        value: '1',
                        desc: '${IFS(subPageType == \'1\' ,\'使用外部API，实现各种表单及表格页面。\')}${IFS(subPageType == \'2\' ,\'通过导航跳转至外部页面。\')}${IFS(subPageType == \'3\' ,\'适合用来作为父级页面。\')} ',
                        options: [
                          {
                            label: '普通页面',
                            value: '1'
                          },
                          {
                            label: '外部链接',
                            value: '2',
                            "hiddenOn": "${subPageTerminal == 3}"
                          },
                          {
                            label: '文件夹',
                            value: '3',
                            "hiddenOn": "${subPageTerminal == 3}"
                          }
                        ]
                      },
                      {
                        type: 'input-text',
                        name: 'subPageName',
                        label: '页面名称',
                        required: true,
                        placeholder: '请输入页面名称',
                        showCounter: true,
                        maxLength: 50
                      },
                      {
                        type: 'input-text',
                        name: 'subLinkurl',
                        label: '链接地址',
                        placeholder: '请输入链接地址',
                        desc: '外部链接或页面地址',
                        required: 'true',
                        hiddenOn: 'this.subPageType == 1 || this.subPageType == 3',
                        validations: {
                          matchRegexp: '/^(https?:\/\/)/'
                        },
                        validationErrors: {
                          matchRegexp: '链接地址需以http(s)://开头'
                        }
                      },
                      {
                        type: 'tree-select',
                        name: 'subParentKey',
                        label: '父级页面',
                        placeholder: '请选择父级页面',
                        clearable: true,
                        required: true,
                        valueField: 'queryKey',
                        value: '${queryKey}',
                        "source": "${parentList}",
                        // source: {
                        //   method: 'get',
                        //   url: useDevBaseUrl('/app/page/pageTree?pageType=3'),
                        //   adaptor: function(payload: any) {
                        //     return {
                        //       ...payload,
                        //       status: payload.code,
                        //       data: {
                        //         ...payload.data,
                        //         options: payload.data?.links ? payload.data?.links : []
                        //       }
                        //     };
                        //   }
                        // }
                      },
                      {
                        type: 'input-text',
                        name: 'subMenuName',
                        label: '菜单名称',
                        placeholder: '导航中显示的名称，留空将采用页面名称作为菜单名称',
                        maxLength: 50,
                        showCounter: true,
                      },
                      {
                        type: 'input-text',
                        name: 'subComponent',
                        required: true,
                        label: '组件路径'
                      },
                      {
                        type: "input-text",
                        name: "subPageCode",
                        label: "编码",
                        placeholder: "请输入编码",
                        showCounter: true,
                        maxLength: 50
                      },
                      {
                        type: 'textarea',
                        name: 'subDescription',
                        label: '描述',
                        placeholder: '请输入描述',
                        showCounter: true,
                        maxLength: 50
                      },
                      {
                        name: 'subMenuLogo',
                        label: '菜单标识',
                        asFormItem: true,
                        children: ({value, onChange, data}) => (
                          <div>
                            <IConSelect sendValueToFather={(item) => onChange(item)} value={value} />
                          </div>
                        )
                      }
                    ]
                  }
                ]
              }
            },
            {
              type: 'button',
              label: '新建子文件夹',
              actionType: 'dialog',
              reload: 'nav',
              visibleOn: '${ARRAYINCLUDES(${$$permissionsData},\'app:page:create\')}',
              disabledOn: '(this.pageType == 1 && this.homePage != 1) || this.pageType == 2',
              dialog: {
                title: '新建文件夹',
                body: {
                  type: 'form',
                  api: {
                    method: 'post',
                    url: useDevBaseUrl('/app/page/create'),
                    data: {
                      pageName: '${groupName}',
                      description: '${groupDescription}',
                      parentKey: '${queryKey}',
                      pageType: '3'
                    },
                    adaptor: function(payload: any) {
                      return {
                        ...payload,
                        status: payload.code
                      };
                    }
                  },
                  body: [
                    {
                      type: 'input-text',
                      name: 'groupName',
                      required: true,
                      label: '文件夹名称',
                      maxLength: 50,
                      showCounter: true,
                    },
                    {
                      type: 'input-text',
                      name: 'groupDescription',
                      label: '文件夹说明',
                      maxLength: 50,
                      showCounter: true,
                    }
                  ]
                }
              }
            },
            {
              type: 'button',
              label: '复制',
              actionType: 'dialog',
              reload: 'nav',
              visibleOn: '${ARRAYINCLUDES(${$$permissionsData},\'app:page:copyPage\')}',
              dialog: {
                title: '复制页面',
                size: 'md',
                "data": {
                  queryKey: "${queryKey}",
                  appid: "${appid}"
                },
                body: [
                  {
                    type: 'form',
                    initApi: {
                      method: 'get',
                      url: useDevBaseUrl('/app/page/get?queryKey=${queryKey}'),
                      adaptor: function(payload: any) {
                        return {
                          ...payload,
                          status: payload.code,
                          data: {...payload.data, parentPageVal: payload?.data?.parentKey}
                        };
                      }
                    },
                    api: {
                      method: 'post',
                      url: useDevBaseUrl('/app/page/copyPage'),
                      requestAdaptor: function(api: any) {
                        let appid = new BigNumber(api.data.copyAppId, 36).toString();
                        let pageTerminal = api.data.pageTerminal;
                        let pageType = api.data.pageType;
                        let pageName = api.data.pageName;
                        let copyParentKey = api.data.copyParentKey;
                        let displayInNavigation = api.data.displayInNavigation;
                        let reservedInTopLabel = api.data.reservedInTopLabel;
                        let pageResidency = api.data.pageResidency;
                        let menuName = api.data.menuName;
                        let description = api.data.description;
                        let menuLogo = api.data.menuLogo;
                        let pageContent = api.data.pageContent;
                        let queryKey = api.data.queryKey; //被复制页面的queryKey
                        let pageCode = api.data.pageCodeCopy;
                        let component = api.data.component;
                        if (pageType == '1') {
                          pageContent = {
                            'type': 'page',
                            'title': pageName,
                            'regions': [
                              'body',
                              'toolbar',
                              'header'
                            ]
                          };
                        }
                        return {
                          ...api,
                          data: {
                            latest: 1,
                            appId: appid,
                            pageTerminal: pageTerminal,
                            pageType: pageType,
                            pageName: pageName,
                            parentKey: copyParentKey,
                            displayInNavigation: displayInNavigation,
                            reservedInTopLabel: reservedInTopLabel,
                            pageResidency: pageResidency,
                            menuName: menuName,
                            description: description,
                            menuLogo: menuLogo,
                            pageContent: pageContent,
                            component: component,
                            queryKey: queryKey,
                            pageCode: pageCode,
                          }
                        };
                      },
                      adaptor: function(payload: any) {
                        return {
                          ...payload,
                          status: payload.code
                        };
                      }
                    },
                    body: [
                      {
                        type: 'select',
                        name: 'copyAppId',
                        label: '应用',
                        placeholder: '请选择',
                        required: true,
                        value: '${appid}',
                        source: {
                          method: 'get',
                          url: useAdminBaseUrl('/app/info/all-list'),
                          adaptor: function(payload: any) {
                            payload.data.forEach((item: any) => {
                              item.value = new BigNumber(item.id).toString(36), item.label = item.name;
                            });
                            return {
                              ...payload,
                              status: payload.code,
                              data: {...payload.data, options: payload.data}
                            };
                          }
                        }
                      },
                      {
                        type: 'button-group-select',
                        label: '页面终端',
                        name: 'pageTerminal',
                        required: true,
                        value: '1',
                        desc: '${IFS(pageTerminal == \'1\' ,\'默认响应式页面。\')}${IFS(pageTerminal == \'2\' ,\'移动H5独立终端页面。\')} ',
                        options: [
                          {
                            label: 'PC端',
                            value: '1'
                          },
                          {
                            label: "移动端",
                            value: "2",
                            visibleOn: "${ARRAYINCLUDES(${$$permissionsData},'app:publish:mobile')}"
                          },
                          {
                            label: "大屏",
                            value: "3",
                          }
                        ],
                        "disabled": true,
                      },
                      {
                        type: 'select',
                        name: 'pageType',
                        label: '页面类型',
                        placeholder: '请选择',
                        required: true,
                        disabled: true,
                        desc: '${IFS(pageType == \'1\' ,\'使用外部API，实现各种表单及表格页面。\')}${IFS(pageType == \'2\' ,\'通过导航跳转至外部页面。\')}${IFS(pageType == \'3\' ,\'适合用来作为父级页面。\')} ',
                        options: [
                          {
                            label: '普通页面',
                            value: '1'
                          },
                          {
                            label: '外部链接',
                            value: '2'
                          },
                          {
                            label: '文件夹',
                            value: '3'
                          }
                        ]
                      },
                      {
                        type: 'input-text',
                        name: 'pageName',
                        label: '页面名称',
                        required: true,
                        showCounter: true,
                        maxLength: 50,
                        placeholder: '请输入页面名称'
                      },
                      {
                        type: 'input-text',
                        name: 'pageContent',
                        label: '链接地址',
                        placeholder: '请输入链接地址',
                        desc: '外部链接或页面地址',
                        required: 'true',
                        hiddenOn: 'this.pageType == 1 || this.pageType == 3',
                        validations: {
                          matchRegexp: '/^(https?:\/\/)/'
                        },
                        validationErrors: {
                          matchRegexp: '链接地址需以http(s)://开头'
                        }
                      },
                      {
                        type: 'tree-select',
                        name: 'copyParentKey',
                        label: '父级页面',
                        placeholder: '请选择父级页面',
                        clearable: true,
                        required: true,
                        valueField: 'queryKey',
                        value: '${parentPageVal}',
                        source: {
                          method: 'get',
                          url: useDevBaseUrl('/app/page/getPageTreeByAppId?appId=${copyAppId}'),
                          adaptor: function(payload: any) {
                            return {
                              ...payload,
                              status: payload.code,
                              data: {...payload.data, options: payload.data.links}
                            };
                          }
                        }
                      },
                      {
                        type: 'input-text',
                        name: 'menuName',
                        label: '菜单名称',
                        placeholder: '导航中显示的名称，留空将采用页面名称作为菜单名称',
                        maxLength: 50,
                        showCounter: true,
                      },
                      {
                        type: 'input-text',
                        name: 'component',
                        required: true,
                        label: '组件路径'
                      },
                      {
                        type: "input-text",
                        name: "pageCodeCopy",
                        label: "编码",
                        placeholder: "请输入编码",
                        showCounter: true,
                        maxLength: 50
                      },
                      {
                        type: 'textarea',
                        name: 'description',
                        label: '描述',
                        placeholder: '请输入描述',
                        showCounter: true,
                        maxLength: 50
                      },
                      {
                        name: 'menuLogo',
                        label: '菜单标识',
                        asFormItem: true,
                        children: ({value, onChange, data}) => (
                          <div>
                            <IConSelect sendValueToFather={(item) => onChange(item)} value={value} />
                          </div>
                        )
                      },
                      {
                        name: 'displayInNavigation',
                        type: 'switch',
                        label: '导航中显示',
                        hidden: true
                      },
                      {
                        name: 'reservedInTopLabel',
                        type: 'switch',
                        label: '顶部标签中保留',
                        hidden: true
                      },
                      {
                        name: 'pageResidency',
                        type: 'switch',
                        label: '页面常驻',
                        hidden: true
                      }
                    ]
                  }
                ]
              }
            },
            {
              type: 'button',
              label: '查看信息',
              actionType: 'dialog',
              dialog: {
                title: '查看信息',
                "actions": [
                  {
                    "label": "关闭",
                    "actionType": "close",
                    "level": "default",
                    "type": "button",
                  }
                ],
                "data": {
                  queryKey: "${queryKey}"
                },
                body: {
                  type: 'form',
                  initApi: useDevBaseUrl('/app/page/get?queryKey=${queryKey}'),
                  static: true,
                  body: [
                    {
                      type: 'input-text',
                      name: 'creator',
                      label: '创建人'
                    },
                    {
                      type: 'input-text',
                      name: 'createTime',
                      label: '创建时间'
                    },
                    {
                      type: 'input-text',
                      name: 'updateTime',
                      label: '更新时间'
                    },
                    {
                      type: 'input-text',
                      name: 'updater',
                      label: '更新人'
                    }
                  ]
                }
              }
            },
            {
              type: 'button',
              label: '删除',
              visibleOn: '${ARRAYINCLUDES(${$$permissionsData},\'app:page:delete\')}',
              confirmText: '确认要删除${label}吗？',
              //首页不可以删除
              disabledOn: 'this.homePage == 1',
              onEvent: {
                click: {
                  actions: [
                    {
                      actionType: 'custom',
                      script: async(context: any, doAction: any, e: any) => {
                        const res = await deletePage(e.data.queryKey)
                        if(res.data.code != 0) {
                          toast.error(res.data.msg, {
                            position: 'top-right'
                          });
                        } else {
                          doAction({
                            actionType: 'reload',
                            componentId: 'nav'
                          });
                          if (res.data.data.needConfirm) {
                            doAction({
                              actionType: 'dialog',
                              dialog: {
                                title: '系统消息',
                                body: '当前页面含有子页面，确认会删除所有子页面，确认删除？',
                                onEvent: {
                                  confirm: {
                                    actions: [
                                      {
                                        actionType: 'ajax',
                                        api: {
                                          url: useDevBaseUrl('/app/page/delete?queryKey=${queryKey}&confirmed=true'),
                                          method: 'delete'
                                        }
                                      },
                                      {
                                        actionType: 'reload',
                                        componentId: 'nav'
                                      }
                                    ]
                                  }
                                }
                              }
                            });
                          }
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
    }
  ],
  body: [
    {
      type: 'page',
      id: 'my_service',
      name: 'my_service2',
      initFetchOn: 'this.pageCode',
      "initApi": {
        "method": "get",
        "url": useDevBaseUrl("/app/page/getByPageCode?pageCode=${pageCode}&appid=${appid}&env=${env}"),
        adaptor: async function(payload: any) {
          newOperation = false;
          return {
            ...payload,
            status: payload.code,
            data: {schemaContent: payload.data}
          };
        },
      },
      body: [{
        id: 'pageSchemaEngine',
        component: ({value, onChange, data}: any) => {
          const {context, component, customizeAcl, pageTerminal} = data?.schemaContent || {
            context: null,
            component: null,
            customizeAcl: null
          };
          const systemContext = dealContextFormat(context);
          return (
            <>
              {component && amisRender({
                type: 'flex',
                justify: 'end',
                alignItems: 'center',
                items: [
                  {
                    type: 'button',
                    label: '3D端地址',
                    level: 'primary',
                    className: 'design_3d_button',
                    size: 'sm',
                    actionType: "dialog",
                    dialog: {
                      size: "md",
                      title: "3D端地址",
                      body: [
                        {
                          type: "tpl",
                          tpl: `如果包含3D模块，打开新浏览器tab页或Iframe嵌入地址为：`+threeDAddress + '；'
                        },
                        {
                          type: "tpl",
                          tpl: `如果采用serve方式启动，地址和端口参考启动时的提示信息，并且需要拼接上appid和env查询字符串参数`
                        }
                      ],
                      actions: [
                        {
                            "label": "复制地址",
                            "type": "button",
                            "level": "link",
                            "onEvent": {
                                "click": {
                                    "actions": [
                                        {
                                            "actionType": "custom",
                                            "script": function (row: any) {
                                                let url = threeDAddress
                                                let oInput = document.createElement('textarea')
                                                oInput.value = url
                                                document.body.appendChild(oInput)
                                                oInput.select() // 选择对象;
                                                document.execCommand('Copy') // 执行浏览器复制命令
                                                toast.success('复制成功', {
                                                    position: 'top-center'
                                                });
                                                oInput.remove()
                                            }
                                        }
                                    ]
                                }
                            }

                        },
                        {
                            label: "关闭",
                            actionType: "close",
                            level: "default",
                            type: "button",
                        }
                      ],
                    }
                  }
                ]
              }, {}, {
                theme: 'antd'
              })}
              {
                pageTerminal == 2 ? (
                  <div>移动端组件源码见zc_uniapp代码库的: {`pages/${component}.vue`}</div>
                ) : (
                  component &&
                  <ErrorBoundary>
                    <RootContextProvider value={{
                      systemContext: systemContext,
                      customizeAcl
                    }}>
                      <div className={'page-manage-scroll'}>
                        <DynamicComponent key={component} componentPath={component} />
                      </div>
                    </RootContextProvider>
                  </ErrorBoundary>
                )
              }
            </>
          )
        }
      }]
    }
  ]
};

export default () => <AMISComponent schema={schema} />;
