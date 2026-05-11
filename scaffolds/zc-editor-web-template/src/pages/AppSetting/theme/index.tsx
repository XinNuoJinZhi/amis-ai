import { isAppEnd } from "@/utils";
import { getTenantId } from "@/utils/auth"
import { shareTheme, updateTheme } from "@/api/theme";
import { useDevBaseUrl, findEditMenu } from "@/utils/util"
import {toast} from 'amis';
let deleteApi = isAppEnd() ? useDevBaseUrl("/application/app/theme/delete?id=${id}") : useDevBaseUrl("/app/theme/delete?id=${id}")
let crudApi = isAppEnd() ? useDevBaseUrl("/application/app/theme/page") : useDevBaseUrl("/app/theme/page")
let createApi = isAppEnd() ? useDevBaseUrl("/application/app/theme/create") : useDevBaseUrl("/app/theme/create")
let setDefaultApi = isAppEnd() ? useDevBaseUrl("/application/app/theme/setDefault?id=${id}") : useDevBaseUrl("/app/theme/setDefault?id=${id}")
let exportCssApi = isAppEnd() ? useDevBaseUrl("/application/app/theme/export/css?id=${id}") : useDevBaseUrl("/app/theme/export/css?id=${id}")
let exportJsonApi = isAppEnd() ? useDevBaseUrl("/application/app/theme/export/json?id=${id}") : useDevBaseUrl("/app/theme/export/json?id=${id}")
let setBuiltApi = isAppEnd() ? useDevBaseUrl("/application/app/theme/setBuilt") : useDevBaseUrl("/app/theme/setBuilt")
let importApi = isAppEnd() ? useDevBaseUrl("/application/app/theme/import") : useDevBaseUrl("/app/theme/import")
const params = new URLSearchParams(window.location.search);
const appId = params.get('appid');
let env = params.get('env');
import { history } from '@umijs/max';
import {AMISComponent} from "@/hooks/amis";

const createQuery = function (type: number) {	// 1: 创建 2： 导入
	return {
		"method": "post",
		"url": type == 1 ? createApi : importApi,
		requestAdaptor: function (api: any) {
			let name = api.data.name;
			let remark = api.data.remark;
			let status = api.data.status;
			let type = api.data.type;
			let appLevelFlag = api.data.appLevelFlag
			let file = api.data.file;
			let shared = api.data.shared;
			return {
				...api,
				data: {
					"name": name,
					"remark": remark,
					"type": type,
					"status": status,
					"shared": shared,
					"appLevelFlag": appLevelFlag,
					"file": file,
				}
			};
		},
		adaptor: function (payload: any) {
			return {
				...payload,
				status: payload.code
			};
		}
	}
}

const isEdit = findEditMenu('/app/design/theme') ? true : false
let TenantId = getTenantId()

const schema = {
	"type": "page",
	"className": "theme-tabs",
	"body": [
		{
			"type": "tabs",
			"tabsMode": "simple",
			"defaultKey": 0,
			"id": "tabs-change-receiver",
			"tabs": [
				{
					"body": {
						"type": "crud",
						"name": "cardCRUD",
						"className": "card-crud",
						"id": "cardCRUD",
						"mode": "cards",
						"defaultParams": {
							"perPage": "6"
						},
						"syncLocation": false,
						"columnsCount": 3,
						"api": {
							"method": "get",
							"url": crudApi,
							"data": {
								"pageNo": "${page}",
								"pageSize": "${perPage}",
								"name": "${name|default:undefined}",
							},
							adaptor: function (payload: any) {
								return {
									...payload,
									status: payload.code,
									data: { ...payload?.data, items: payload?.data?.list ? payload.data.list : [] }
								};
							},
						},
						"headerToolbar": [
							{
								"label": "新增主题",
								"type": "button",
								"actionType": "dialog",
								"icon": "fa fa-plus",
								"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:create')}",
								"level": "primary",
								"dialog": {
									"title": "新增主题",
									"body": {
										"type": "form",
										"api": createQuery(1),
										"body": [
											{

												"type": "input-text",
												"name": "name",
												"label": "主题名称",
												"required": true,
												"showCounter": true,
												"maxLength": 100,
											},
											// {
											// 	"type": "button-group-select",
											// 	"label": "主题级别",
											// 	"name": "appLevelFlag",
											// 	"value": false,
											// 	"options": [
											// 		{
											// 			"label": "组织级",
											// 			"value": false
											// 		},
											// 		{
											// 			"label": "应用级",
											// 			"value": true
											// 		}
											// 	],
											// },
											{
												"type": "input-text",
												"name": "remark",
												"label": "主题描述",
												"showCounter": true,
												"maxLength": 200,

											},
											// {
											// 	"type": "radios",
											// 	"label": "是否共享",
											// 	"name": "shared",
											// 	"value": 0,
											// 	"visibleOn": "${appLevelFlag == 0}",
											// 	"options": [
											// 		{
											// 			"label": "是",
											// 			"value": 1
											// 		},
											// 		{
											// 			"label": "否",
											// 			"value": 0
											// 		},
											// 	]
											// },
											{
												"type": "radios",
												"label": "主题状态",
												"name": "status",
												"options": [
													{
														"label": "启用",
														"value": 0
													},
													{
														"label": "停用",
														"value": 1
													}
												],
												"value": 0
											}
										]
									}
								}
							},
							{
								"label": "导入主题",
								"type": "button",
								"actionType": "dialog",
								"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:import')}",
								"dialog": {
									"title": "导入主题",
									"body": {
										"type": "form",
										"api": createQuery(2),
										"body": [
											{

												"type": "input-text",
												"name": "name",
												"label": "主题名称",
												"required": true
											},
											// {
											// 	"type": "button-group-select",
											// 	"label": "主题级别",
											// 	"name": "appLevelFlag",
											// 	"value": false,
											// 	"options": [
											// 		{
											// 			"label": "组织级",
											// 			"value": false,
											// 		},
											// 		{
											// 			"label": "应用级",
											// 			"value": true
											// 		}
											// 	]
											// },
											{
												"type": "input-text",
												"name": "remark",
												"label": "主题描述"

											},
											// {
											// 	"type": "radios",
											// 	"label": "是否共享",
											// 	"name": "shared",
											// 	"value": 0,
											// 	"visibleOn": "${appLevelFlag == 0}",
											// 	"options": [
											// 		{
											// 			"label": "是",
											// 			"value": 1
											// 		},
											// 		{
											// 			"label": "否",
											// 			"value": 0
											// 		},
											// 	]
											// },
											{
												"type": "radios",
												"label": "主题状态",
												"name": "status",
												"options": [
													{
														"label": "启用",
														"value": 0
													},
													{
														"label": "停用",
														"value": 1
													}
												],
												"value": 0
											},
											{
												"label": "文件上传",
												"type": "input-file",
												"name": "file",
												"asBlob": true,
												"accept": ".json",
												"required": true,
												// "maxSize": 1048576,
											}
										]
									}
								}
							},
							{
								"label": "设为内置主题",
								"type": "button",
								"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:setDefault')}",
								"actionType": "ajax",
								"confirmText": "确认设置为内置主题吗？",
								"confirmTitle": "提示",
								"api": `put:${setBuiltApi}`
							},
							{
								"label": "",
								"icon": "fa fa-repeat",
								"type": "button",
								"actionType": "reload",
								"target": "cardCRUD",
								"align": "right"
							},
							{
								"type": "button-group",
								"btnActiveLevel": "primary",
								"align": "right",
								"buttons": [
									{
										"type": "button",
										"icon": "fa fa-table",
										"level": "primary",
										"onEvent": {
											"click": {
												"actions": [
													{
														"actionType": "changeActiveKey",
														"componentId": "tabs-change-receiver",
														"args": {
															"activeKey": 1
														}
													},
													{
														"actionType": "reload",
														"componentId": "cardCRUD",
													}
												]
											}
										}
									},
									{
										"type": "button",
										"icon": "fa fa-list",
										"onEvent": {
											"click": {
												"actions": [
													{
														"actionType": "changeActiveKey",
														"componentId": "tabs-change-receiver",
														"args": {
															"activeKey": 2
														}
													},
													{
														"actionType": "reload",
														"componentId": "tableCRUD",
													}
												]
											}
										}
									}
								]
							},
							{
								"type": "search-box",
								"name": "name",
								"align": "right",
								"placeholder": "请输入查询条件",
								"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:query')}"
							}
						],
						"footerToolbar": [
							"statistics",
							"switch-per-page",
							"pagination"
						],
						"perPageAvailable": [6, 9, 12, 15, 18],
						"alwaysShowPagination": true,
						"card": {
							"className": "theme-card",
							"body": [
								{
									"type": "wrapper",
									"className": "theme-card-mask",
									"body": {
										"type": "flex",
										"className": "theme-card-opts",
										"justify": "center",
										"alignItems": "center",
										"items": [
											{
												"className": "theme-card-opts-menu",
												"tooltip": "编辑",
												"type": "button",
												"icon": "fa fa-edit",
												"visible": isEdit,
												// "disabledOn": "${shared && tenantId != " + TenantId + " ? true : false}",
												"onEvent": {
													"click": {
														"actions": [
															{
																"actionType": "custom",
																"script": function(context:any, doAction: any, e: any) {
																	if (e.data.shared && e.data.tenantId != TenantId) {
																		history.push(`/app/design/themeEdit?id=${e.data.id}&appid=${appId}&env=${env}&shared=true`)
																	} else {
																		 history.push(`/app/design/themeEdit?id=${e.data.id}&appid=${appId}&env=${env}`)
																	}
																}
															}
														]
													}
												},
												"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:update')}",
											},
											{
												"className": "theme-card-opts-menu",
												"tooltip": "设为默认",
												"icon": "fa fa-cogs",
												"type": "button",
												"actionType": "ajax",
												"disabledOn": "${defaultFlag || status == 1}",
												"confirmText": "确认将当前主题设为默认？",
												"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:setDefault')}",
												"api": `put:${setDefaultApi}`
											},
											{
												"className": "theme-card-opts-menu",
												"tooltip": "删除",
												"icon": "fa fa-trash-o",
												"type": "button",
												"actionType": "ajax",
												"disabledOn": "${shared && tenantId != " + TenantId + " ? true : false}",
												"confirmText": "确认要删除当前主题？",
												"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:delete')}",
												"api": `delete:${deleteApi}`
											},
											{
												"className": "theme-card-opts-menu",
												"tooltip": "导出主题",
												"icon": "fa fa-file-code-o",
												"type": "button",
												"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:export')}",
												"actionType": "download",
												"disabledOn": "${thumbnail ? false : true}",
												"api": {
													"method": "get",
													"url": exportJsonApi,
													adaptor: function (payload: any) {
														return {
															...payload,
															status: payload?.code ? payload?.code : 0
														};
													}
												}
											},
											{
												"className": "theme-card-opts-menu",
												"tooltip": "导出为css",
												"icon": "fa fa-file-text-o",
												"type": "button",
												"disabledOn": "${thumbnail ? false : true}",
												"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:export')}",
												"actionType": "download",
												"api": {
													"method": "get",
													"url": exportCssApi,
													"Access-Control-Expose-Headers": "Content-Disposition",
													adaptor: function (payload: any) {
														return {
															...payload,
															status: payload.code
														};
													}
												}
											}
										]
									}
								},
								{
									"type": "image",
									"innerClassName": "no-border",
									"thumbMode": "h-full",
									"className": "theme-card-image",
									"name": "thumbnail",
									"visibleOn": "${thumbnail}"
								},
								{
									"type": "flex",
									"alignItems": "center",
									"justify": "center",
									"style": {height: '240px', width: '100%', background: '#e6f0ff'},
									"items": [{
										"type": "tpl",
										"style": { fontSize: '18px', color: '#999' },
										"tpl": "<p>编辑后可显示页面截图</p>"
									}],
									"visibleOn": "${!thumbnail}"
								},
								{
									"type": "wrapper",
									"size": "none",
									"className": "theme-card-cont",
									"body": [
										{
											"type": "wrapper",
											"size": "none",
											"body": {
												"type": "wrapper",
												"size": "none",
												"className": "theme-card-flex",
												"body": [
													{
														"type": "tpl",
														"size": "none",
														"className": "theme-card-ellipsis",
														"tpl": "$name",
														"showNativeTitle": true,
													},
													{
														"type": "wrapper",
														"size": "none",
														"body": [
															{
																"type": "tooltip-wrapper",
																"content": "外部主题",
																"inline": true,
																"visibleOn": "${shared == 1 && tenantId != " + TenantId + "}",
																"body": {
																	"type": "button",
																	"icon": "fa fa-star-o", // "${appId ? 'star' : 'star-o'}"
																	"className": "theme-card-icon",
																}
															},
															// {
															// 	"type": "tooltip-wrapper",
															// 	"content": "${shared ? (createdFlag && tenantId == " + TenantId + " ? '取消共享' : '主题已共享') : '共享主题'}",
															// 	"inline": true,
															// 	"body": {
															// 		"type": "button",
															// 		"icon": "fa fa-share-alt",
															// 		"visibleOn": "${appId == null}",
															// 		"className": "theme-card-icon ${shared ? 'active' : ''} ${shared && created == false ? 'cursor' : ''}",
															// 		"disabledOn": "${ createdFlag && tenantId == " + TenantId + " ? false : true }",
															// 		// "actionType": "ajax",
															// 		// "api": "${shared ? '' : `put:${setBuiltApi}`}",
															// 		"onEvent": {
															// 			"click": {
															// 				"actions": [
															// 					{
															// 						"actionType": "custom",
															// 						"script": function(e: any, doAction: any) {
															// 							if (!e.props.data.shared) {
															// 								shareTheme({ id: e.props.data.id})
															// 							} else {
															// 								updateTheme({ ...e.props.data, shared: 0 })
															// 							}
															// 							setTimeout(() => {
															// 								doAction({ actionType: "reload", componentId: "cardCRUD" })
															// 							}, 500);
															// 						}
															// 					}
															// 				]
															// 			}
															// 		},
															// 		"confirmText": "${shared ? '确认取消共享当前主题？' : '确认共享当前主题？'}",
															// 	}
															// },
															// {
															// 	"type": "tag",
															// 	"size": "mini",
															// 	"label": "${appId ? '应用级' : '组织级'}",
															// 	"style": {cursor: 'text'},
															// 	"color": "${appId ? 'active' : 'success'}",
															// },
															{
																"type": "switch",
																"name": "status",
																"style": { "display": 'inline-block' },
																"onText": "开启",
																"offText": "关闭",
																"trueValue": 0,
																"falseValue": 1,
																"visibleOn": "${adminFlag && tenantId == " + TenantId + "}",
																"onEvent": {
																	"change": {
																		"weight": 0,
																		"actions": [
																			{
																				"actionType": "confirmDialog",
																				"dialog": {
																					"type": "dialog",
																					"title": "修改状态",
																					"body": [
																						{
																							"type": "tpl",
																							"tpl": "确定要修改主题状态吗？",
																							"wrapperComponent": "",
																							"inline": false,
																						}
																					],
																					"showCloseButton": true,
																					"showErrorMsg": true,
																					"showLoading": true,
																					"className": "app-popover",
																					"actions": [
																						{
																							"type": "button",
																							"actionType": "cancel",
																							"label": "取消"
																						},
																						{
																							"type": "button",
																							"actionType": "confirm",
																							"label": "确定",
																							"primary": true
																						}
																					]
																				}
																			},
																			{
																				"actionType": "custom",
																				"script": async function(e: any, doAction: any) {
																					const res = await updateTheme({ ...e.props.data, status: e.props.data.status == 1 ? 0 : 1 })
																					if(res.data.code != 0) {
																						toast.error(res.data.msg, {
																							position: "top-right"
																						})
																						return
																					}
																					setTimeout(() => {
																						doAction({ actionType: "reload", componentId: "cardCRUD" })
																					}, 500);
																				}
																			}
																		]
																	}
																},
															}
														]
													}
												]
											}
										},
										{
											"type": "wrapper",
											"size": "none",
											"body": {
												"type": "wrapper",
												"size": "12",
												"className": "theme-card-flex theme-card-flex-sub",
												"body": [
													{
														"type": "tpl",
														"size": "none",
														"className": "theme-card-ellipsis",
														"tpl": "$remark",
														"showNativeTitle": true,
													},
													{
														"type": "wrapper",
														"size": "none",
														"body": "${DATETOSTR(createTime, 'YYYY-MM-DD hh:mm:ss')}"
													}
												]
											}
										}
									]
								}
							],
						},
						"placeholder": "暂无数据"
					}
				},
				{
					"body": {
						"type": "crud",
						"name": "tableCRUD",
						"id": "tableCRUD",
						"className": "table-crud",
						"syncLocation": false,
						"autoFillHeight": true,
						"api": {
							"method": "get",
							"url": crudApi,
							"data": {
								"pageNo": "${page}",
								"pageSize": "${perPage}",
								"name": "${name|default:undefined}",
							},
							adaptor: function (payload: any) {
								return {
									...payload,
									status: payload.code,
									data: { ...payload?.data, items: payload?.data?.list ? payload.data.list : [] }
								};
							},
						},
						"headerToolbar": [
							{
								"label": "新增主题",
								"type": "button",
								"actionType": "dialog",
								"icon": "fa fa-plus",
								"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:create')}",
								"level": "primary",
								"dialog": {
									"title": "新增主题",
									"body": {
										"type": "form",
										"api": createQuery(1),
										"body": [
											{

												"type": "input-text",
												"name": "name",
												"label": "主题名称",
												"required": true,
												"showCounter": true,
												"maxLength": 100,
											},
											// {
											// 	"type": "button-group-select",
											// 	"label": "主题级别",
											// 	"name": "appLevelFlag",
											// 	"value": 0,
											// 	"options": [
											// 		{
											// 			"label": "组织级",
											// 			"value": 0
											// 		},
											// 		{
											// 			"label": "应用级",
											// 			"value": 1
											// 		}
											// 	]
											// },
											{
												"type": "input-text",
												"name": "remark",
												"label": "主题描述",
												"showCounter": true,
												"maxLength": 200,

											},
											// {
											// 	"type": "radios",
											// 	"label": "是否共享",
											// 	"name": "shared",
											// 	"value": 0,
											// 	"visibleOn": "${appLevelFlag == 0}",
											// 	"options": [
											// 		{
											// 			"label": "是",
											// 			"value": 1
											// 		},
											// 		{
											// 			"label": "否",
											// 			"value": 0
											// 		},
											// 	]
											// },
											{
												"type": "radios",
												"label": "主题状态",
												"name": "status",
												"options": [
													{
														"label": "启用",
														"value": 0
													},
													{
														"label": "停用",
														"value": 1
													}
												],
												"value": 0
											}
										]
									}
								}
							},
							{

								"label": "导入主题",
								"type": "button",
								"actionType": "dialog",
								"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:import')}",
								"dialog": {
									"title": "导入主题",
									"body": {
										"type": "form",
										"api": createQuery(2),
										"body": [
											{

												"type": "input-text",
												"name": "name",
												"label": "主题名称",
												"required": true
											},
											// {
											// 	"type": "button-group-select",
											// 	"label": "主题级别",
											// 	"name": "appLevelFlag",
											// 	"value": 0,
											// 	"options": [
											// 		{
											// 			"label": "组织级",
											// 			"value": 0,
											// 			"level": "primary"
											// 		},
											// 		{
											// 			"label": "应用级",
											// 			"value": 1
											// 		}
											// 	]
											// },
											{
												"type": "input-text",
												"name": "remark",
												"label": "主题描述"

											},
											// {
											// 	"type": "radios",
											// 	"label": "是否共享",
											// 	"name": "shared",
											// 	"visibleOn": "${appLevelFlag == 0}",
											// 	"value": 0,
											// 	"options": [
											// 		{
											// 			"label": "是",
											// 			"value": 1
											// 		},
											// 		{
											// 			"label": "否",
											// 			"value": 0
											// 		},
											// 	]
											// },
											{
												"type": "radios",
												"label": "主题状态",
												"name": "status",
												"options": [
													{
														"label": "启用",
														"value": 0
													},
													{
														"label": "停用",
														"value": 1
													}
												],
												"value": 0
											},
											{
												"label": "文件上传",
												"type": "input-file",
												"name": "file",
												"asBlob": true,
												"accept": ".json",
												"required": true,
												// "maxSize": 1048576,
											}
										]
									}
								}
							},
							{
								"label": "设为内置主题",
								"type": "button",
								"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:setDefault')}",
								"actionType": "ajax",
								"api": `put:${setBuiltApi}`
							},
							{
								"label": "",
								"icon": "fa fa-repeat",
								"type": "button",
								"actionType": "reload",
								"target": "tableCRUD",
								"align": "right"
							},
							{
								"type": "button-group",
								"btnActiveLevel": "primary",
								"align": "right",
								"buttons": [
									{
										"type": "button",
										"icon": "fa fa-table",
										"onEvent": {
											"click": {
												"actions": [
													{
														"actionType": "changeActiveKey",
														"componentId": "tabs-change-receiver",
														"args": {
															"activeKey": 1
														}
													},
													{
														"actionType": "reload",
														"componentId": "cardCRUD",
													}
												]
											}
										}
									},
									{
										"type": "button",
										"icon": "fa fa-list",
										"level": "primary",
										"onEvent": {
											"click": {
												"actions": [
													{
														"actionType": "changeActiveKey",
														"componentId": "tabs-change-receiver",
														"args": {
															"activeKey": 2
														}
													},
													{
														"actionType": "reload",
														"componentId": "tableCRUD",
													}
												]
											}
										}
									}
								]
							},
							{
								"type": "search-box",
								"name": "name",
								"align": "right",
								"placeholder": "请输入查询条件",
								"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:query')}"
							}
						],
						"footerToolbar": [
							"statistics",
							"switch-per-page",
							"pagination"
						],
						"alwaysShowPagination": true,
						"autoGenerateFilter": true,
						"columns": [
							{
								"name": "name",
								"label": "主题名称"
							},
							{
								"name": "code",
								"label": "主题编码"
							},
							{
								"name": "remark",
								"label": "描述"
							},
							{
								"name": "${DATETOSTR(createTime, 'YYYY-MM-DD hh:mm:ss')}",
								"label": "创建时间"
							},
							{
								"name": "status",
								"label": "状态",
								"quickEdit": {
									"mode": "inline",
									"type": "switch",
									"onText": "开启",
									"offText": "关闭",
									"trueValue": 0,
									"falseValue": 1,
									"disabledOn": "${!(adminFlag && tenantId == " + TenantId + ")}",
									"onEvent": {
										"change": {
											"weight": 0,
											"actions": [
												{
													"actionType": "confirmDialog",
													"dialog": {
														"type": "dialog",
														"title": "修改状态",
														"body": [
															{
																"type": "tpl",
																"tpl": "确定要修改主题状态吗？",
																"wrapperComponent": "",
																"inline": false,
															}
														],
														"showCloseButton": true,
														"showErrorMsg": true,
														"showLoading": true,
														"className": "app-popover",
														"actions": [
															{
																"type": "button",
																"actionType": "cancel",
																"label": "取消"
															},
															{
																"type": "button",
																"actionType": "confirm",
																"label": "确定",
																"primary": true
															}
														]
													}
												},
												{
													"actionType": "custom",
													"script": async function(e: any, doAction: any) {
														const res = await updateTheme({ ...e.props.data, status: e.props.data.status == 1 ? 0 : 1 })
														if(res.data.code != 0) {
															toast.error(res.data.msg, {
																position: "top-right"
															})
															return
														}
														setTimeout(() => {
															doAction({ actionType: "reload", componentId: "tableCRUD" })
														}, 500);
													}
												}
											]
										}
									}
								}
							},
							{
								"type": "operation",
								"label": "操作",
								"buttons": [
									{
										"label": "编辑",
										"type": "button",
										"visible": isEdit,
										// "disabledOn": "${shared && tenantId != " + TenantId + " ? true : false}",
										"level": "link",
										"onEvent": {
											"click": {
												"actions": [
													{
														"actionType": "custom",
														"script": function(context: any, doAction: any, e: any ) {
															if (e.data.shared && e.data.tenantId != TenantId) {
																 history.push(`/app/design/themeEdit?id=${e.data.id}&appid=${appId}&env=${env}&shared=true`)
															} else {
																 history.push(`/app/design/themeEdit?id=${e.data.id}&appid=${appId}&env=${env}`)
															}
														}
													}
												]
											}
										},
										"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:update')}",
									},
									{
										"label": "删除",
										"type": "button",
										"actionType": "ajax",
										"level": "link",
										"disabledOn": "${shared && tenantId != " + TenantId + " ? true : false}",
										"confirmText": "确认要删除当前主题？",
										"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:delete')}",
										"api": {
											"url": deleteApi,
											"method": "delete"
										}
									},
									{
										"label": "导出",
										"type": "button",
										"level": "link",
										"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:export')}",
										"actionType": "download",
										"disabledOn": "${thumbnail ? false : true}",
										"api": {
											"method": "get",
											"url": exportJsonApi,
											"Access-Control-Expose-Headers": "Content-Disposition",
											adaptor: function (payload: any) {
												return {
													...payload,
													status: payload?.code ? payload?.code : 0
												};
											}
										}
									},
									{
										"label": "导出为css",
										"type": "button",
										"level": "link",
										"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:export')}",
										"actionType": "download",
										"disabledOn": "${thumbnail ? false : true}",
										"api": {
											"method": "get",
											"url": exportCssApi,
											"Access-Control-Expose-Headers": "Content-Disposition",
											adaptor: function (payload: any) {
												return {
													...payload,
													status: payload.code
												};
											}
										}
									},
									{
										"label": "设为默认",
										"type": "button",
										"actionType": "ajax",
										"level": "link",
										"confirmText": "确认将当前主题设为默认？",
										"disabledOn": "${defaultFlag || status == 1}",
										"visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'app:theme:setDefault')}",
										"api": `put:${setDefaultApi}`
									},
									// {
									// 	"label": "${shared ? (createdFlag && tenantId == " + TenantId + " ? '取消共享' : '主题已共享') : '共享主题'}",
									// 	"type": "button",
									// 	"actionType": "ajax",
									// 	"level": "link",
									// 	"visibleOn": "${appId == null}",
									// 	"disabledOn": "${ createdFlag && tenantId == " + TenantId + " ? false : true }",
									// 	"onEvent": {
									// 		"click": {
									// 			"actions": [
									// 				{
									// 					"actionType": "custom",
									// 					"script": function(e: any, doAction: any) {
									// 						if (!e.props.data.shared) {
									// 							shareTheme({ id: e.props.data.id})
									// 						} else {
									// 							updateTheme({ ...e.props.data, shared: 0 })
									// 						}
									// 						setTimeout(() => {
									// 							doAction({ actionType: "reload", componentId: "tableCRUD" })
									// 						}, 500);
									// 					}
									// 				}
									// 			]
									// 		}
									// 	},
									// 	"confirmText": "${shared ? '确认取消共享当前主题？' : '确认共享当前主题？'}",
									// }
								]
							}
						],
						"placeholder": "暂无数据"
					}
				}
			]
		}
	]
}

export default () => <AMISComponent schema={schema} />;
