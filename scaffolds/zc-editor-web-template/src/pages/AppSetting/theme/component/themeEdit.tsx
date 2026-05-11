import { delFile, updateTheme, uploadFile } from "@/api/theme";
import { getUrlParams } from "@/pages/EntityManage/EntityModelDiagram/utils";
import { isAppEnd } from "@/utils"
import {toast} from 'amis';
import html2canvas from "html2canvas";
import { useDevBaseUrl } from "@/utils/util"
import {DataColorSchema, defaultColors} from './dataColor';
import { ColorGenerator } from 'amis-theme-editor-helper'
import {enumText} from '../util'
import permStore from '@/store/permission';
const familyOpts = [{ value: 'SimSun', label: '宋体' }, { value: 'SimHei', label: '黑体' }, { value: 'Microsoft YaHei', label: '微软雅黑' }, { value: 'FangSong', label: '仿宋' }, { value: 'KaiTi', label: '楷体' }, { value: 'LiSu', label: '隶书' }, { value: 'YouYuan', label: '幼圆' }, { value: 'FZShuti', label: '方正舒体' }, { value: 'FZYaoti', label: '方正姚体' }, { value: 'STCaiyun', label: '华文彩云' }, { value: 'STHupo', label: '华文琥珀' }]

const getApi = isAppEnd() ? useDevBaseUrl("/application/app/theme/get?id=${id}") : useDevBaseUrl("/app/theme/get?id=${id}")
/**
 * base64 转换为 file
 * 先将base64转换成blob，再将blob转换成file文件，此方法不存在浏览器不兼容问题
 * @param base64Url
 * @param filename
 * @returns
 */
const base64UrlToFile = (base64Url: any, filename: string) => {
	// 获取到base64编码
	const arr = base64Url.split(',');
	const mime = arr[0].match(/:(.*?);/)[1];
	// 将base64编码转为字符串
	const bstr = atob(arr[1]);
	let n = bstr.length;
	// 创建初始化为0的，包含length个元素的无符号整型数组
	const u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new File([u8arr], filename, { type: mime });
};

const gradationArr = [{ key: '1', brightness: -160 }, { key: '2', brightness: -120 }, { key: '3', brightness: -80 }, { key: '4', brightness: -40 }, { key: '6', brightness: 40 }, { key: '7', brightness: 80 }, { key: '8', brightness: 120 }, { key: '9', brightness: 160 }, { key: '10', brightness: 200 }]

function runTheme(theme: any) {
	let varStyleTag = document.getElementById('theme-edit');
	if (!varStyleTag) {
		varStyleTag = document.createElement('style');
		varStyleTag.id = 'theme-edit';
		document.body.appendChild(varStyleTag);
	}

	// const rootDom = document.querySelector(':root')
	// const root = getComputedStyle(rootDom as Element).cssText
	// const rootStyle = document.documentElement.childNodes[0].childNodes
	// var rootText:string = ''
	// rootStyle.forEach((f: any) => {
	// 	if (f.attributes && f.attributes.hasOwnProperty('data-vite-dev-id') && f.attributes[1].nodeValue.indexOf('amis-editor-core') > -1) {
	// 		rootText = f.attributes[1].ownerElement.innerText
	// 	}
	// })
	// console.log(rootText)
	const vars = [];
	const names = new Set();
	for (const type in theme) {
		if (type.startsWith('_')) {
			for (const name in theme[type]) {
				const value = theme[type][name];
				if (typeof value !== undefined && value !== '') {
					names.add(name);
					if (name == '--fonts-base-family') {
						names.add('font-family')
						vars.push(`font-family: ${value.replace(/[;<>]*/g, '')};`)
					}
					vars.push(`${name}:${value.replace(/[;<>]*/g, '')};`);
					// varsObj[name] = value.replace(/[;<>]*/g, '')
				}
			}
		}
	}

	var styleReplace = [...vars].join('') + enumText

	// bca-disable-line
	varStyleTag.innerHTML = `.theme-edit, .AMISCSSWrapper { ${styleReplace} }`;
	//   ${[...vars].join('')}

	// 如果是改自定义样式
	let styleTag = document.getElementById('customStyle');
	if (!styleTag) {
		styleTag = document.createElement('style');
		styleTag.id = 'customStyle';
		document.body.appendChild(styleTag);
	}
	if (theme?.style) {
		// bca-disable-line
		styleTag.innerHTML = theme.style;
	}
}

function generationColor(colorText: string, brightness: number) {
	let r = parseInt(colorText.substring(1, 3), 16)
	let g = parseInt(colorText.substring(3, 5), 16)
	let b = parseInt(colorText.substring(5, 7), 16)

	// 调整亮度
	r += brightness;
	g += brightness;
	b += brightness;

	// 确保RGB值在0-255范围内
	r = r < 0 ? 0 : r > 255 ? 255 : r;
	g = g < 0 ? 0 : g > 255 ? 255 : g;
	b = b < 0 ? 0 : b > 255 ? 255 : b;

	// 返回调整后的颜色
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function clearLocal(back: boolean = true) {
	localStorage.removeItem('/app/design/themeEdit/app/page/form/amis-theme-editor')
	const styleDom = document.getElementById('customStyle')
	const varsDom = document.getElementById('theme-edit')
	varsDom?.parentNode?.removeChild(varsDom)
	styleDom?.parentNode?.removeChild(styleDom)
	back && window.history.back()
}

function isArrayEqual(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (Array.isArray(a[i]) && Array.isArray(b[i])) {
			if (!isArrayEqual(a[i], b[i])) return false;
		} else if (typeof a[i] === 'object' && a[i] !== null && b[i] !== null) {
			if (!isDeepObjectEqual(a[i], b[i])) return false;
		} else {
			if (a[i] !== b[i]) return false;
		}
	}
	return true;
}

function isDeepObjectEqual(obj1, obj2) {
	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);

	if (keys1.length !== keys2.length) return false;

	for (const key of keys1) {
		if (!(key in obj2)) return false;

		if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
			if (!isArrayEqual(obj1[key], obj2[key])) return false;
		} else if (typeof obj1[key] === 'object' && obj1[key] !== null && typeof obj2[key] === 'object' && obj2[key] !== null) {
			if (!isDeepObjectEqual(obj1[key], obj2[key])) return false;
		} else {
			if (obj1[key] !== obj2[key]) return false;
		}
	}

	return true;
}
const schema = {
	"type": "form",
	"id": "theme_form",
	"initApi": {
		"method": "get",
		"url": getApi,
		"sendOn": "${id}",
		adaptor: function (payload: any) {
			var isEdit = getUrlParams('shared') !== null && getUrlParams('shared') == 'true' ? false : true
			const theme = payload?.data?.content
			const data = permStore.getState().permData
			let filterUpdate = data.filter(item => item == 'app:theme:update')
			const updateFlag = filterUpdate.length > 0 ? true : false; //保存
			const isShowSaveBtn = isEdit && updateFlag
			return {
				...payload,
				status: payload.code,
				data: {
					...payload.data,
					theme,
					vars: {},
					isEdit,
					isShowSaveBtn,
					dataColor: payload?.data?.dataColor ?? defaultColors
				}
			};
		}
	},
	"title": false,
	"persistData": "amis-theme-editor",
	"actions": [],
	"onEvent": {
		"inited": {
			"actions": [
				{
					"actionType": "custom",
					"script": (context: any, doAction: any, event: any) => {
						console.log(event, 'init')
						const theme = event.data.theme;
						theme && runTheme(theme)
						// theme && runTheme(theme, event.data, (val: any) => {
						// 	event.setData('vars', val)
						// });
					}
				}
			]
		},
		"change": {
			"actions": [
				{
					"actionType": "custom",
					"script": (context: any, doAction: any, event: any) => {
						const theme = event.data.theme;
						theme && runTheme(theme)
						// theme && runTheme(theme, event.data, (val: any) => {
						// 	event.setData('vars', val)
						// });
					}
				}
			]
		}
	},
	onChange: (values: any, diff: any) => {
		console.log(values, diff)
		if(values.theme && values.theme._vars && diff.theme && diff.theme._vars) {
			const theme = { _vars: { ...values.theme._vars, ...diff.theme._vars } };
			theme && runTheme(theme);
		}
	},
	"body": [
		{
			"type": "custom",
			onMount: () => {
				const formTag = document.getElementsByTagName('form')[0];
				formTag.id = 'themeForm';
			},
			onUnmount: () => {
				clearLocal(false)
			}
		},
		{
			"type": "page",
			"body": [
				{
					"type": "button",
					"label": "返回",
					"id": "backBtn",
					"style": { marginRight: '10px' },
					"onEvent": {
						"click": {
							"actions": [
								{
									"actionType": "custom",
									"script": function () {
										clearLocal()
									}
								}
							]
						}
					}
				},
				{
					"type": "button",
					"label": "保存",
					"level": "primary",
					"id": "saveBtn",
					"visibleOn": "${isShowSaveBtn}",
					"onEvent": {
						"click": {
							"actions": [
								{
									"actionType": "custom",
									"loading": true,
									"script":async function (_: any, doAction: any, e: any) {
										const theme = e.data.theme
										// 判断数据色是否修改
										const isSame = isArrayEqual(defaultColors, e.data.dataColor);

										if ((!theme || !Object.keys(theme).length) && isSame) {
											doAction({
												"actionType": "dialog",
												"dialog": { "title": "提示", "body": "请配置主题样式后再保存！" }
											})
											return; 
										}

										if ((e.data.theme && Object.keys(theme).length) || !isSame) {
											const varArr: string[] = []
											if(theme != null && theme._vars){
												Object.entries(theme._vars).forEach(m => {
													m[1] && varArr.push(m[0] + ': ' + m[1])
												})
											}
											if (varArr.length == 0 && isSame) {
												doAction({
													"actionType": "dialog",
													"dialog": { "title": "提示", "body": "请配置主题样式后再保存！" }
												})
												doAction({
													"actionType": "enabled",
													"componentId": "saveBtn"
												})
												return false
											}
										}
										// 2. 禁用按钮（提前做，避免重复点击）
										doAction({ "actionType": "disabled", "componentId": "saveBtn" })
										doAction({ "actionType": "disabled", "componentId": "backBtn" })
										try {
											doAction({
												"actionType": "dialog",
												"dialog": { "title": "提示", "body": "截取当前页面中，请稍候！" , "actions": [], "showCloseButton": false, "id":"editThemeInfo"}
											})
											var node = document.getElementsByClassName('gridScreen')[0] as any
											node.style.height = '800px'

											// 3. 把截图放到微任务/宏任务，避免阻塞UI
											const canvas = await new Promise((resolve) => {
											// 延迟10ms执行，让浏览器先完成按钮禁用的UI更新
												setTimeout(async () => {
													const canvas = await html2canvas(node, {
														useCORS: true,
														allowTaint: false,
														scale: 1,
														logging: false,
														ignoreElements: (el) => el.style.display === 'none'
													});
													resolve(canvas);
												}, 10);
											});

											// 4. 压缩图片（关键！减少base64体积和处理时间）
											const thumbnailBase64 = canvas.toDataURL('image/png', 0.8); // 质量从1.0降到0.8，体积减半
											const varArr: string[] = []
											if(theme != null && theme?._vars){
												Object.entries(theme._vars).forEach(m => {
													m[1] && varArr.push(m[0] + ': ' + m[1])
												})
											}
											// 5. 接口请求也异步执行，且用await避免回调嵌套
											const varString = varArr.join(';')
											let css = varString + ';' + (theme?.style || '');
											if(varArr.length==0){
												css = ''
											}
											const content = theme;
											const queryParams = {
												...e.data.__super,
												css,
												thumbnail: thumbnailBase64,
												content,
												code: undefined
											};

											const res = await updateTheme(queryParams);
											// 6. 接口成功后的提示
											if (res.data.code !== 0) {
												toast.error(res.data.msg, { position: "top-right" });
											} else {
												clearLocal();
												toast.success("保存成功！", { position: "top-right" });
											}
										} catch (err) {
											// 异常处理，避免页面卡死
											toast.error("保存失败，请重试！", { position: "top-right" });
										} finally {
											// 无论成功失败，都恢复按钮可用
											doAction({ "actionType": "enabled", "componentId": "saveBtn" });
											doAction({ "actionType": "enabled", "componentId": "backBtn" });
											doAction({
												"actionType": "closeDialog",
												"componentId": "editThemeInfo",
											})
										}
									}
								}
							]
						}
					}
				}
			]
		},
		{
			"type": "grid",
			"label": false,
			"columns": [
				{
					"md": 4,
					"body": [
						{
							"type": "tabs",
							"tabs": [
								{
									"title": "基础设置",
									"body": [
										{
											"type": "page",
											"body": "变量设置",
											"label": false
										},
										{
											"type": "tabs",
											"mode": "vertical",
											"subFormMode": "normal",
											"tabs": [
												{
													id: "colorTab",
													"title": "颜色",
													"body": [
														{
															title: "品牌色",
															"type": "fieldSet",
															"collapsable": true,
															className: 'theme-fieldset',
															"size": "base",
															"body": [
																{
																	type: "button",
																	size: "xs",
																	className: "generate",
																	level: "link",
																	label: "生成",
																	disabledOn: "theme == null || !theme._vars['--colors-brand-5']",
																	onEvent: {
																		click: {
																			actions: [
																				{
																					actionType: "confirmDialog",
																					confirmBtnLevel: "primary",
																					dialog: {
																						type: "dialog",
																						title: '确认自动生成色阶吗？',
																						id: "u:a3b61551d276",
																						body: [
																							{
																								type: 'tpl',
																								tpl: '确定生成色阶后将覆盖原有设置'
																							},
																						],
																						actions: [
																							{
																								name: "syncColorChanges",
																								type: "checkbox",
																								label: false,
																								option: "是否联动所有颜色更改",
																								style: {
																									margin: 'auto',
																									marginBottom: 'auto !important',
																									marginLeft: 0,
																									fontSize: '12px',
																								},
																								onEvent: {
																									change: {
																										weight: 0,
																										actions: [
																											{
																												componentId: "u:a3b61551d276",
																												ignoreError: false,
																												actionType: "setValue",
																												args: {
																													value: {
																														syncColorChanges: "${event.data.value}"
																													}
																												}
																											}
																										]
																									}
																								}
																							},
																							{
																								type: "button",
																								actionType: "cancel",
																								label: "取消"
																							},
																							{
																								type: "button",
																								actionType: "confirm",
																								label: "确认",
																								primary: true
																							}
																						],
																						onEvent: {
																							confirm: {
																								weight: 0,
																								actions: [
																									{
																										actionType: "custom",
																										script: function (context: any, doaction: any, e: any) {
																											const color = e.data.theme._vars['--colors-brand-5'] || '#144bcc'
																											const generateColorShades = new ColorGenerator(color)
																											// 中性色处理
																											const neutralColor = generateColorShades.getNeutralColor()
																												.reduce((acc: any, item: any, index: number) => {
																													// 文字
																													acc[`--colors-neutral-text-${index + 1}`] = item.hex;
																													// 填充
																													acc[`--colors-neutral-fill-${index + 1}`] = item.hex;
																													// 线条
																													acc[`--colors-neutral-line-${index + 1}`] = item.hex;
																													return acc;
																												}, {});
																											// 数据色
																											const dataColor = generateColorShades.getDataColor()
																												.map((item: any, index: number) => {
																												return {
																													label: ['默认','经典','过渡'][index] ?? '自定义',
																													token: `dataColor${index + 1}`,
																													colors: item.map((color: any) => color.checkedColor)
																												}
																											})
																											// 品牌色
																											const derivedColor = generateColorShades.getDerivedColor()
																											// 是否联动所有颜色更改
																											const syncColorChanges = e.data.syncColorChanges
																											const resultObj =
																												derivedColor.reduce((acc: any, item: any, index: number) => {
																												acc[`--colors-brand-${index + 1}`] = item.hex;
																												return acc;
																											}, {});

																											const themeValue = {
																												'_vars': {
																													...e.data.theme['_vars'],
																													...resultObj,
																													...(syncColorChanges ? neutralColor : {})
																												}
																											}
																											const themeForm = {
																												...e.data,
																												theme: themeValue
																											}

																											if (syncColorChanges){
																												themeForm.dataColor = [
																													...dataColor,
																													...(e.data.dataColor ?? []).filter((item: any) => item?.custom),
																												]
																											}

																											doaction({
																												actionType: "setValue",
																												componentId: "theme_form",
																												args: {
																													value: themeForm
																												}
																											})
																											runTheme(themeValue)
																										}
																									}
																								]
																							}
																						}
																					},
																				},
																			]
																		}
																	}
																},
																{
																	type: "container",
																	className: "theme-sub-color",
																	body: [
																		{
																			"type": "input-color",
																			"label": "常规（基色）",
																			"name": "theme._vars[\"--colors-brand-5\"]",
																			"disabledOn": "!isEdit"
																		},
																		{
																			"type": "input-color",
																			"label": "点击",
																			"name": "theme._vars[\"--colors-brand-4\"]",
																			"disabledOn": "!isEdit"
																		},
																		{
																			"type": "input-color",
																			"label": "悬浮",
																			"name": "theme._vars[\"--colors-brand-6\"]",
																			"disabledOn": "!isEdit"
																		},
																		{
																			"type": "input-color",
																			"label": "背景",
																			"name": "theme._vars[\"--colors-brand-10\"]",
																			"disabledOn": "!isEdit"
																		},
																		{
																			"type": "wrapper",
																			style: { padding: 0 },
																			hidden: true,
																			"id": "brand_hidden",
																			body: [
																				{
																					"type": "input-color",
																					"label": "brand-1",
																					"name": "theme._vars[\"--colors-brand-1\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "brand-2",
																					"name": "theme._vars[\"--colors-brand-2\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "brand-3",
																					"name": "theme._vars[\"--colors-brand-3\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "brand-7",
																					"name": "theme._vars[\"--colors-brand-7\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "brand-8",
																					"name": "theme._vars[\"--colors-brand-8\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "brand-9",
																					"name": "theme._vars[\"--colors-brand-9\"]",
																					"disabledOn": "!isEdit"
																				}
																			]
																		}
																	]
																},
																{
																	type: "button",
																	size: "xs",
																	level: "link",
																	label: "展开",
																	id: "brand_down",
																	"onEvent": {
																		"click": {
																			"actions": [
																				{
																					"actionType": "show",
																					"componentId": "brand_hidden",
																				},
																				{
																					"actionType": "show",
																					"componentId": "brand_up",
																				},
																				{
																					"actionType": "hidden",
																					"componentId": "brand_down",
																				},
																			]
																		}
																	}
																},
																{
																	type: "button",
																	size: "xs",
																	hidden: true,
																	id: "brand_up",
																	level: "link",
																	label: "收起",
																	"onEvent": {
																		"click": {
																			"actions": [
																				{
																					"actionType": "hidden",
																					"componentId": "brand_hidden"
																				},
																				{
																					"actionType": "hidden",
																					"componentId": "brand_up",
																				},
																				{
																					"actionType": "show",
																					"componentId": "brand_down",
																				},
																			]
																		}
																	}
																}
															]
														},
														{
															title: "中性色",
															"type": "fieldSet",
															"collapsable": true,
															"size": "base",
															className: 'theme-fieldset',
															"body": [
																{
																	"collapsable": true,
																	title: "文字",
																	type: "fieldSet",
																	size: "base",
																	className: 'theme-fieldset',
																	body: [
																		{
																			type: "container",
																			className: "theme-sub-color",
																			body: [
																				{
																					"type": "input-color",
																					"label": "强调/正文标题",
																					"name": "theme._vars[\"--colors-neutral-text-2\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "次强调/正文标题",
																					"name": "theme._vars[\"--colors-neutral-text-4\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "辅助说明",
																					"name": "theme._vars[\"--colors-neutral-text-5\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "禁用",
																					"name": "theme._vars[\"--colors-neutral-text-6\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "纯白文字",
																					"name": "theme._vars[\"--colors-neutral-text-11\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "wrapper",
																					style: { padding: 0 },
																					hidden: true,
																					"id": "text_hidden",
																					body: [
																						{
																							"type": "input-color",
																							"label": "neutral-text-1",
																							"name": "theme._vars[\"--colors-neutral-text-1\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-text-3",
																							"name": "theme._vars[\"--colors-neutral-text-3\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-text-7",
																							"name": "theme._vars[\"--colors-neutral-text-7\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-text-8",
																							"name": "theme._vars[\"--colors-neutral-text-8\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-text-9",
																							"name": "theme._vars[\"--colors-neutral-text-9\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-text-10",
																							"name": "theme._vars[\"--colors-neutral-text-10\"]",
																							"disabledOn": "!isEdit"
																						}
																					]
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					label: "展开",
																					id: "text_down",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "show",
																									"componentId": "text_hidden"
																								},
																								{
																									"actionType": "show",
																									"componentId": "text_up",
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "text_down",
																								},
																							]
																						}
																					}
																				},
																				{
																					type: "button",
																					size: "xs",
																					id: "text_up",
																					level: "link",
																					label: "收起",
																					hidden: true,
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "hidden",
																									"componentId": "text_hidden"
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "text_up",
																								},
																								{
																									"actionType": "show",
																									"componentId": "text_down",
																								},
																							]
																						}
																					}
																				}
																			]
																		}
																	]
																},
																{
																	"collapsable": true,
																	type: "fieldSet",
																	size: "base",
																	collapsed: true,
																	title: "填充",
																	className: 'theme-fieldset',
																	body: [
																		{
																			type: "container",
																			className: "theme-sub-color",
																			body: [
																				{
																					"type": "input-color",
																					"label": "纯白填充",
																					"name": "theme._vars[\"--colors-neutral-fill-11\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "浅/禁用背景",
																					"name": "theme._vars[\"--colors-neutral-fill-10\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "分割线",
																					"name": "theme._vars[\"--colors-neutral-fill-8\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "深/灰底悬浮",
																					"name": "theme._vars[\"--colors-neutral-fill-7\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "wrapper",
																					style: { padding: 0 },
																					hidden: true,
																					"id": "fill_hidden",
																					body: [
																						{
																							"type": "input-color",
																							"label": "neutral-fill-1",
																							"name": "theme._vars[\"--colors-neutral-fill-1\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-fill-2",
																							"name": "theme._vars[\"--colors-neutral-fill-2\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-fill-3",
																							"name": "theme._vars[\"--colors-neutral-fill-3\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-fill-4",
																							"name": "theme._vars[\"--colors-neutral-fill-4\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-fill-5",
																							"name": "theme._vars[\"--colors-neutral-fill-5\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-fill-6",
																							"name": "theme._vars[\"--colors-neutral-fill-6\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-fill-9",
																							"name": "theme._vars[\"--colors-neutral-fill-9\"]",
																							"disabledOn": "!isEdit"
																						}
																					]
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					label: "展开",
																					id: "fill_down",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "show",
																									"componentId": "fill_hidden"
																								},
																								{
																									"actionType": "show",
																									"componentId": "fill_up",
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "fill_down",
																								},
																							]
																						}
																					}
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					id: "fill_up",
																					label: "收起",
																					hidden: true,
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "hidden",
																									"componentId": "fill_hidden"
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "fill_up",
																								},
																								{
																									"actionType": "show",
																									"componentId": "fill_down",
																								},
																							]
																						}
																					}
																				}
																			]
																		}
																	]
																},
																{
																	"collapsable": true,
																	type: "fieldSet",
																	size: "base",
																	collapsed: true,
																	title: "线条",
																	className: 'theme-fieldset',
																	body: [
																		{
																			type: "container",
																			className: "theme-sub-color",
																			body: [
																				{
																					"type": "input-color",
																					"label": "浅",
																					"name": "theme._vars[\"--colors-neutral-line-10\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "常规",
																					"name": "theme._vars[\"--colors-neutral-line-8\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "深",
																					"name": "theme._vars[\"--colors-neutral-line-6\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "重",
																					"name": "theme._vars[\"--colors-neutral-line-4\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "wrapper",
																					style: { padding: 0 },
																					hidden: true,
																					"id": "line_hidden",
																					body: [
																						{
																							"type": "input-color",
																							"label": "neutral-line-1",
																							"name": "theme._vars[\"--colors-neutral-line-1\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-line-2",
																							"name": "theme._vars[\"--colors-neutral-line-2\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-line-3",
																							"name": "theme._vars[\"--colors-neutral-line-3\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-line-5",
																							"name": "theme._vars[\"--colors-neutral-line-5\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-line-7",
																							"name": "theme._vars[\"--colors-neutral-line-7\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-line-9",
																							"name": "theme._vars[\"--colors-neutral-line-9\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "neutral-line-11",
																							"name": "theme._vars[\"--colors-neutral-line-11\"]",
																							"disabledOn": "!isEdit"
																						}
																					]
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					id: "line_down",
																					label: "展开",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "show",
																									"componentId": "line_hidden"
																								},
																								{
																									"actionType": "show",
																									"componentId": "line_up",
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "line_down",
																								},
																							]
																						}
																					}
																				},
																				{
																					type: "button",
																					size: "xs",
																					id: "line_up",
																					level: "link",
																					hidden: true,
																					label: "收起",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "hidden",
																									"componentId": "line_hidden"
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "line_up",
																								},
																								{
																									"actionType": "show",
																									"componentId": "line_down",
																								},
																							]
																						}
																					}
																				}
																			]
																		}
																	]
																}

															]
														},
														{
															title: "辅助色",
															"type": "fieldSet",
															"collapsable": true,
															"size": "base",
															className: 'theme-fieldset',
															"body": [
																{
																	"collapsable": true,
																	type: "fieldSet",
																	size: "base",
																	className: 'theme-fieldset',
																	title: "失败色",
																	body: [
																		{
																			type: "container",
																			className: "theme-sub-color",
																			body: [
																				{
																					"type": "button",
																					"size": "xs",
																					"level": "link",
																					"disabledOn": "theme == null || !theme._vars['--colors-error-5']",
																					className: "generate",
																					"label": "生成",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "confirmDialog",
																									"dialog": {
																										"title": "确认自动生成色阶吗？",
																										"msg": "确定生成色阶后将覆盖原有设置"
																									}
																								},
																								{
																									"actionType": "custom",
																									"script": function (context: any, doaction: any, e: any) {
																										const color = e.data.theme._vars['--colors-error-5'] || '#f23d3d'
																										const generateColorShades = new ColorGenerator(color)
																										const derivedColor = generateColorShades.getDerivedColor()
																										const resultObj =
																											derivedColor.reduce((acc: any, item: any, index: number) => {
																												acc[`--colors-error-${index + 1}`] = item.hex;
																												return acc;
																											}, {});
																										const themeValue = {
																											'_vars': {
																												...e.data.theme['_vars'],
																												...resultObj
																											}
																										}
																										const themeForm = {
																											...e.data, theme: themeValue
																										}
																										doaction({
																											actionType: "setValue",
																											componentId: "theme_form",
																											args: {
																												value: themeForm
																											}
																										})
																										runTheme(themeValue)
																									}
																								}
																							]
																						}
																					}
																				},
																				{
																					"type": "input-color",
																					"label": "常规（基色）",
																					"name": "theme._vars[\"--colors-error-5\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "点击",
																					"name": "theme._vars[\"--colors-error-4\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "悬浮",
																					"name": "theme._vars[\"--colors-error-6\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "背景",
																					"name": "theme._vars[\"--colors-error-10\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "wrapper",
																					style: { padding: 0 },
																					hidden: true,
																					"id": "error_hidden",
																					body: [
																						{
																							"type": "input-color",
																							"label": "error-1",
																							"name": "theme._vars[\"--colors-error-1\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "error-2",
																							"name": "theme._vars[\"--colors-error-2\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "error-3",
																							"name": "theme._vars[\"--colors-error-3\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "error-7",
																							"name": "theme._vars[\"--colors-error-7\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "error-8",
																							"name": "theme._vars[\"--colors-error-8\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "error-9",
																							"name": "theme._vars[\"--colors-error-9\"]",
																							"disabledOn": "!isEdit"
																						}
																					]
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					label: "展开",
																					id: "error_down",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "show",
																									"componentId": "error_hidden"
																								},
																								{
																									"actionType": "show",
																									"componentId": "error_up",
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "error_down",
																								},
																							]
																						}
																					}
																				},
																				{
																					type: "button",
																					size: "xs",
																					id: "error_up",
																					level: "link",
																					label: "收起",
																					hidden: true,
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "hidden",
																									"componentId": "error_hidden"
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "error_up",
																								},
																								{
																									"actionType": "show",
																									"componentId": "error_down",
																								},
																							]
																						}
																					}
																				}
																			]
																		}
																	]
																},
																{
																	collapsable: true,
																	type: "fieldSet",
																	collapsed: true,
																	size: "base",
																	title: "警告色",
																	className: 'theme-fieldset',
																	body: [
																		{
																			type: "container",
																			className: "theme-sub-color",
																			body: [
																				{
																					"type": "button",
																					"size": "xs",
																					"level": "link",
																					className: "generate",
																					"disabledOn": "theme == null || !theme._vars['--colors-warning-5']",
																					"label": "生成",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "confirmDialog",
																									"dialog": {
																										"title": "确认自动生成色阶吗？",
																										"msg": "确定生成色阶后将覆盖原有设置"
																									}
																								},
																								{
																									"actionType": "custom",
																									"script": function (context: any, doaction: any, e: any) {
																										const color = e.data.theme._vars['--colors-warning-5'] || '#ff9326'
																										const generateColorShades = new ColorGenerator(color)
																										const derivedColor = generateColorShades.getDerivedColor()
																										const resultObj =
																											derivedColor.reduce((acc: any, item: any, index: number) => {
																												acc[`--colors-warning-${index + 1}`] = item.hex;
																												return acc;
																											}, {});
																										const themeValue = {
																											'_vars': {
																												...e.data.theme['_vars'],
																												...resultObj
																											}
																										}
																										const themeForm = {
																											...e.data, theme: themeValue
																										}
																										doaction({
																											actionType: "setValue",
																											componentId: "theme_form",
																											args: {
																												value: themeForm
																											}
																										})
																										runTheme(themeValue)
																									}
																								}
																							]
																						}
																					}
																				},
																				{
																					"type": "input-color",
																					"label": "常规（基色）",
																					"name": "theme._vars[\"--colors-warning-5\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "点击",
																					"name": "theme._vars[\"--colors-warning-4\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "悬浮",
																					"name": "theme._vars[\"--colors-warning-6\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "背景",
																					"name": "theme._vars[\"--colors-warning-10\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "wrapper",
																					style: { padding: 0 },
																					"id": "warning_hidden",
																					hidden: true,
																					body: [
																						{
																							"type": "input-color",
																							"label": "warning-1",
																							"name": "theme._vars[\"--colors-warning-1\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "warning-2",
																							"name": "theme._vars[\"--colors-warning-2\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "warning-3",
																							"name": "theme._vars[\"--colors-warning-3\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "warning-7",
																							"name": "theme._vars[\"--colors-warning-7\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "warning-8",
																							"name": "theme._vars[\"--colors-warning-8\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "warning-9",
																							"name": "theme._vars[\"--colors-warning-9\"]",
																							"disabledOn": "!isEdit"
																						}
																					]
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					id: "warning_down",
																					label: "展开",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "show",
																									"componentId": "warning_hidden"
																								},
																								{
																									"actionType": "show",
																									"componentId": "warning_up",
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "warning_down",
																								},
																							]
																						}
																					}
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					id: "warning_up",
																					label: "收起",
																					hidden: true,
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "hidden",
																									"componentId": "warning_hidden"
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "warning_up",
																								},
																								{
																									"actionType": "show",
																									"componentId": "warning_down",
																								},
																							]
																						}
																					}
																				}
																			]
																		}
																	]
																},
																{
																	collapsable: true,
																	type: "fieldSet",
																	size: "base",
																	collapsed: true,
																	title: "成功色",
																	className: 'theme-fieldset',
																	body: [
																		{
																			type: "container",
																			className: "theme-sub-color",
																			body: [
																				{
																					"type": "button",
																					"size": "xs",
																					"level": "link",
																					"disabledOn": "theme == null || !theme._vars['--colors-success-5']",
																					"label": "生成",
																					className: "generate",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "confirmDialog",
																									"dialog": {
																										"title": "确认自动生成色阶吗？",
																										"msg": "确定生成色阶后将覆盖原有设置"
																									}
																								},
																								{
																									"actionType": "custom",
																									"script": function (context: any, doaction: any, e: any) {
																										const color = e.data.theme._vars['--colors-success-5'] || '#30bf13'
																										const generateColorShades = new ColorGenerator(color)
																										const derivedColor = generateColorShades.getDerivedColor()
																										const resultObj =
																											derivedColor.reduce((acc: any, item: any, index: number) => {
																												acc[`--colors-success-${index + 1}`] = item.hex;
																												return acc;
																											}, {});
																										const themeValue = {
																											'_vars': {
																												...e.data.theme['_vars'],
																												...resultObj
																											}
																										}
																										const themeForm = {
																											...e.data, theme: themeValue
																										}
																										doaction({
																											actionType: "setValue",
																											componentId: "theme_form",
																											args: {
																												value: themeForm
																											}
																										})
																										runTheme(themeValue)
																									}
																								}
																							]
																						}
																					}
																				},
																				{
																					"type": "input-color",
																					"label": "常规（基色）",
																					"name": "theme._vars[\"--colors-success-5\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "点击",
																					"name": "theme._vars[\"--colors-success-4\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "悬浮",
																					"name": "theme._vars[\"--colors-success-6\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "背景",
																					"name": "theme._vars[\"--colors-success-10\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "wrapper",
																					style: { padding: 0 },
																					hidden: true,
																					"id": "success_hidden",
																					body: [
																						{
																							"type": "input-color",
																							"label": "success-1",
																							"name": "theme._vars[\"--colors-success-1\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "success-2",
																							"name": "theme._vars[\"--colors-success-2\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "success-3",
																							"name": "theme._vars[\"--colors-success-3\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "success-7",
																							"name": "theme._vars[\"--colors-success-7\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "success-8",
																							"name": "theme._vars[\"--colors-success-8\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "success-9",
																							"name": "theme._vars[\"--colors-success-9\"]",
																							"disabledOn": "!isEdit"
																						}
																					]
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					id: "success_down",
																					label: "展开",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "show",
																									"componentId": "success_hidden"
																								},
																								{
																									"actionType": "show",
																									"componentId": "success_up",
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "success_down",
																								},
																							]
																						}
																					}
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					id: "success_up",
																					label: "收起",
																					hidden: true,
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "hidden",
																									"componentId": "success_hidden"
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "success_up",
																								},
																								{
																									"actionType": "show",
																									"componentId": "success_down",
																								},
																							]
																						}
																					}
																				}
																			]
																		}
																	]
																},
																{
																	collapsable: true,
																	type: "fieldSet",
																	size: "base",
																	collapsed: true,
																	title: "链接色",
																	className: 'theme-fieldset',
																	body: [
																		{
																			type: "container",
																			className: "theme-sub-color",
																			body: [
																				{
																					"type": "button",
																					"size": "xs",
																					"level": "link",
																					className: "generate",
																					"label": "生成",
																					"disabledOn": "theme == null || !theme._vars['--colors-link-5']",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "confirmDialog",
																									"dialog": {
																										"title": "确认自动生成色阶吗？",
																										"msg": "确定生成色阶后将覆盖原有设置"
																									}
																								},
																								{
																									"actionType": "custom",
																									"script": function (context: any, doaction: any, e: any) {
																										const color = e.data.theme._vars['--colors-link-5'] || '#2468f2'
																										const generateColorShades = new ColorGenerator(color)
																										const derivedColor = generateColorShades.getDerivedColor()
																										const resultObj =
																											derivedColor.reduce((acc: any, item: any, index: number) => {
																												acc[`--colors-link-${index + 1}`] = item.hex;
																												return acc;
																											}, {});
																										const themeValue = {
																											'_vars': {
																												...e.data.theme['_vars'],
																												...resultObj
																											}
																										}
																										const themeForm = {
																											...e.data, theme: themeValue
																										}
																										doaction({
																											actionType: "setValue",
																											componentId: "theme_form",
																											args: {
																												value: themeForm
																											}
																										})
																										runTheme(themeValue)
																									}
																								}
																							]
																						}
																					}
																				},
																				{
																					"type": "input-color",
																					"label": "常规（基色）",
																					"name": "theme._vars[\"--colors-link-5\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "点击",
																					"name": "theme._vars[\"--colors-link-4\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "悬浮",
																					"name": "theme._vars[\"--colors-link-6\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "背景",
																					"name": "theme._vars[\"--colors-link-10\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "wrapper",
																					style: { padding: 0 },
																					hidden: true,
																					"id": "link_hidden",
																					body: [
																						{
																							"type": "input-color",
																							"label": "link-1",
																							"name": "theme._vars[\"--colors-link-1\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "link-2",
																							"name": "theme._vars[\"--colors-link-2\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "link-3",
																							"name": "theme._vars[\"--colors-link-3\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "link-7",
																							"name": "theme._vars[\"--colors-link-7\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "link-8",
																							"name": "theme._vars[\"--colors-link-8\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "link-9",
																							"name": "theme._vars[\"--colors-link-9\"]",
																							"disabledOn": "!isEdit"
																						}
																					]
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					id: "link_down",
																					label: "展开",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "show",
																									"componentId": "link_hidden"
																								},
																								{
																									"actionType": "show",
																									"componentId": "link_up",
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "link_down",
																								},
																							]
																						}
																					}
																				},
																				{
																					type: "button",
																					size: "xs",
																					id: "link_up",
																					level: "link",
																					label: "收起",
																					hidden: true,
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "hidden",
																									"componentId": "link_hidden"
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "link_up",
																								},
																								{
																									"actionType": "show",
																									"componentId": "link_down",
																								},
																							]
																						}
																					}
																				}
																			]
																		}
																	]
																},
																{
																	"collapsable": true,
																	type: "fieldSet",
																	size: "base",
																	collapsed: true,
																	className: 'theme-fieldset',
																	title: "提示色",
																	body: [
																		{
																			type: "container",
																			className: "theme-sub-color",
																			body: [
																				{
																					"type": "button",
																					"size": "xs",
																					"level": "link",
																					className: "generate",
																					"disabledOn": "theme == null || !theme._vars['--colors-info-5']",
																					"label": "生成",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "confirmDialog",
																									"dialog": {
																										"title": "确认自动生成色阶吗？",
																										"msg": "确定生成色阶后将覆盖原有设置"
																									}
																								},
																								{
																									"actionType": "custom",
																									"script": function (context: any, doaction: any, e: any) {
																										const color = e.data.theme._vars['--colors-info-5'] || '#2468f2'
																										const generateColorShades = new ColorGenerator(color)
																										const derivedColor = generateColorShades.getDerivedColor()
																										const resultObj =
																											derivedColor.reduce((acc: any, item: any, index: number) => {
																												acc[`--colors-info-${index + 1}`] = item.hex;
																												return acc;
																											}, {});
																										const themeValue = {
																											'_vars': {
																												...e.data.theme['_vars'],
																												...resultObj
																											}
																										}
																										const themeForm = {
																											...e.data, theme: themeValue
																										}
																										doaction({
																											actionType: "setValue",
																											componentId: "theme_form",
																											args: {
																												value: themeForm
																											}
																										})
																										runTheme(themeValue)
																									}
																								}
																							]
																						}
																					}
																				},
																				{
																					"type": "input-color",
																					"label": "常规（基色）",
																					"name": "theme._vars[\"--colors-info-5\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "点击",
																					"name": "theme._vars[\"--colors-info-4\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "悬浮",
																					"name": "theme._vars[\"--colors-info-6\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "背景",
																					"name": "theme._vars[\"--colors-info-10\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "wrapper",
																					style: { padding: 0 },
																					"id": "info_hidden",
																					hidden: true,
																					body: [
																						{
																							"type": "input-color",
																							"label": "info-1",
																							"name": "theme._vars[\"--colors-info-1\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "info-2",
																							"name": "theme._vars[\"--colors-info-2\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "info-3",
																							"name": "theme._vars[\"--colors-info-3\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "info-7",
																							"name": "theme._vars[\"--colors-info-7\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "info-8",
																							"name": "theme._vars[\"--colors-info-8\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "info-9",
																							"name": "theme._vars[\"--colors-info-9\"]",
																							"disabledOn": "!isEdit"
																						}
																					]
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					id: "info_down",
																					label: "展开",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "show",
																									"componentId": "info_hidden"
																								},
																								{
																									"actionType": "show",
																									"componentId": "info_up",
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "info_down",
																								},
																							]
																						}
																					}
																				},
																				{
																					type: "button",
																					size: "xs",
																					id: "info_up",
																					level: "link",
																					label: "收起",
																					hidden: true,
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "hidden",
																									"componentId": "info_hidden"
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "info_up",
																								},
																								{
																									"actionType": "show",
																									"componentId": "info_down",
																								},
																							]
																						}
																					}
																				}
																			]
																		}
																	]
																},
																{
																	"collapsable": true,
																	type: "fieldSet",
																	size: "base",
																	collapsed: true,
																	className: 'theme-fieldset',
																	title: "其他色",
																	body: [
																		{
																			type: "container",
																			className: "theme-sub-color",
																			body: [
																				{
																					"type": "button",
																					"size": "xs",
																					"level": "link",
																					className: "generate",
																					"disabledOn": "theme == null || !theme._vars['--colors-other-5']",
																					"label": "生成",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "confirmDialog",
																									"dialog": {
																										"title": "确认自动生成色阶吗？",
																										"msg": "确定生成色阶后将覆盖原有设置"
																									}
																								},
																								{
																									"actionType": "custom",
																									"script": function (context: any, doaction: any, e: any) {
																										const color = e.data.theme._vars['--colors-other-5'] || '#2468f2'
																										const generateColorShades = new ColorGenerator(color)
																										const derivedColor = generateColorShades.getDerivedColor()
																										const resultObj =
																											derivedColor.reduce((acc: any, item: any, index: number) => {
																												acc[`--colors-other-${index + 1}`] = item.hex;
																												return acc;
																											}, {});
																										const themeValue = {
																											'_vars': {
																												...e.data.theme['_vars'],
																												...resultObj
																											}
																										}
																										const themeForm = {
																											...e.data, theme: themeValue
																										}
																										doaction({
																											actionType: "setValue",
																											componentId: "theme_form",
																											args: {
																												"value": themeForm
																											}
																										})
																										runTheme(themeValue)
																									}
																								}
																							]
																						}
																					}
																				},
																				{
																					"type": "input-color",
																					"label": "常规（基色）",
																					"name": "theme._vars[\"--colors-other-5\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "点击",
																					"name": "theme._vars[\"--colors-other-4\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "悬浮",
																					"name": "theme._vars[\"--colors-other-6\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "input-color",
																					"label": "背景",
																					"name": "theme._vars[\"--colors-other-10\"]",
																					"disabledOn": "!isEdit"
																				},
																				{
																					"type": "wrapper",
																					style: { padding: 0 },
																					"id": "other_hidden",
																					hidden: true,
																					body: [
																						{
																							"type": "input-color",
																							"label": "other-1",
																							"name": "theme._vars[\"--colors-other-1\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "other-2",
																							"name": "theme._vars[\"--colors-other-2\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "other-3",
																							"name": "theme._vars[\"--colors-other-3\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "other-7",
																							"name": "theme._vars[\"--colors-other-7\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "other-8",
																							"name": "theme._vars[\"--colors-other-8\"]",
																							"disabledOn": "!isEdit"
																						},
																						{
																							"type": "input-color",
																							"label": "other-9",
																							"name": "theme._vars[\"--colors-other-9\"]",
																							"disabledOn": "!isEdit"
																						}
																					]
																				},
																				{
																					type: "button",
																					size: "xs",
																					level: "link",
																					id: "other_down",
																					label: "展开",
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "show",
																									"componentId": "other_hidden"
																								},
																								{
																									"actionType": "show",
																									"componentId": "other_up",
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "other_down",
																								},
																							]
																						}
																					}
																				},
																				{
																					type: "button",
																					size: "xs",
																					id: "other_up",
																					level: "link",
																					label: "收起",
																					hidden: true,
																					"onEvent": {
																						"click": {
																							"actions": [
																								{
																									"actionType": "hidden",
																									"componentId": "other_hidden"
																								},
																								{
																									"actionType": "hidden",
																									"componentId": "other_up",
																								},
																								{
																									"actionType": "show",
																									"componentId": "other_down",
																								},
																							]
																						}
																					}
																				}
																			]
																		}
																	]
																}
															]
														},
														DataColorSchema
													]
												},
												{
													"title": "字体",
													"body": [
														{
															"type": "select",
															"label": "基础字体",
															"options": familyOpts,
															"clearable": true,
															"name": "theme._vars[\"--fonts-base-family\"]",
															"placeholder": "请选择基础字体",
															"disabledOn": "!isEdit"
														},
														{
															"type": "select",
															"label": "等宽字体",
															"clearable": true,
															"options": [{ label: 'SFMono-Regular', value: 'SFMono-Regular' }, { label: 'Menlo', value: 'Menlo' }, { label: 'Monaco', value: 'Monaco' }, { label: 'Consolas', value: 'Consolas' }, { label: 'Liberation Mono', value: 'Liberation Mono' }, { label: 'Courier New', value: 'Courier New' }, { label: 'monospace', value: 'monospace' }],
															"name": "theme._vars[\"--fontFamilyMonospace\"]",
															"placeholder": "请选择等宽字体",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "基础字体大小",
															"name": "theme._vars[\"--fonts-size-7\"]",
															"placeholder": "14px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "最小字体大小",
															"name": "theme._vars[\"--fonts-size-9\"]",
															"placeholder": "11px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "小字体大小",
															"name": "theme._vars[\"--fonts-size-8\"]",
															"placeholder": "12px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "中型字体大小",
															"name": "theme._vars[\"--fonts-size-6\"]",
															"placeholder": "16px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "大字体大小",
															"name": "theme._vars[\"--fonts-size-5\"]",
															"placeholder": "18px",
															"disabledOn": "!isEdit"
														},
														// {
														// 	"type": "input-text",
														// 	"label": "超大字体大小",
														// 	"name": "theme._vars[\"--fonts-size-5\"]",
														// 	"placeholder": "24px",
														// 	"disabledOn": "!isEdit"
														// },
														{
															"type": "input-text",
															"label": "行高",
															"name": "theme._vars[\"--fonts-lineHeight-2\"]",
															"placeholder": "1.5",
															"disabledOn": "!isEdit"
														}
													]
												},
												{
													"title": "间距",
													"body": [
														{
															"type": "input-text",
															"label": "基础间距",
															"name": "theme._vars[\"--sizes-size-5\"]",
															"placeholder": "8px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "特小间距",
															"name": "theme._vars[\"--sizes-size-2\"]",
															"placeholder": "2px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "极小间距",
															"name": "theme._vars[\"--sizes-size-3\"]",
															"placeholder": "4px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "小间距",
															"name": "theme._vars[\"--sizes-size-4\"]",
															"placeholder": "6px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "中间距",
															"name": "theme._vars[\"--sizes-size-6\"]",
															"placeholder": "10px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "大间距",
															"name": "theme._vars[\"--sizes-size-7\"]",
															"placeholder": "12px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "极大间距",
															"name": "theme._vars[\"--sizes-size-8\"]",
															"placeholder": "14px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "特大间距",
															"name": "theme._vars[\"--sizes-size-9\"]",
															"placeholder": "16px",
															"disabledOn": "!isEdit"
														}
													]
												},
												{
													"title": "边框",
													"body": [
														{
															"type": "input-text",
															"label": "基础边框粗细",
															"name": "theme._vars[\"--borders-width-2\"]",
															"placeholder": "1px",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "中粗",
															"name": "theme._vars[\"--borders-width-3\"]",
															"placeholder": "2px",
															"disabledOn": "!isEdit"
															,
														},
														{
															"type": "input-text",
															"label": "特粗",
															"name": "theme._vars[\"--borders-width-4\"]",
															"placeholder": "4x",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-text",
															"label": "边框圆角大小",
															"placeholder": "4px",
															"name": "theme._vars[\"--borders-radius-3\"]",
															"disabledOn": "!isEdit"
														}
													]
												},
												{
													"title": "链接",
													"body": [
														{
															"type": "input-color",
															"label": "链接颜色",
															"name": "theme._vars[\"--colors-link-5\"]",
															"disabledOn": "!isEdit"
														},
														{
															"type": "input-color",
															"label": "链接在鼠标移上去的颜色",
															"name": "theme._vars[\"--colors-link-6\"]",
															"disabledOn": "!isEdit"
														},
														{
															"type": "select",
															"label": "链接下划线",
															"clearable": true,
															"options": [{ label: 'none', value: 'none' }, { label: 'underline', value: 'underline' }],
															"name": "theme._vars[\"--link-text-decoration\"]",
															"placeholder": "none",
															"disabledOn": "!isEdit"
														},
														{
															"type": "select",
															"label": "链接在鼠标移上去后的下划线",
															"clearable": true,
															"options": [{ label: 'none', value: 'none' }, { label: 'underline', value: 'underline' }],
															"name": "theme._vars[\"--link-onClick-text-decoration\"]",
															"placeholder": "none",
															"disabledOn": "!isEdit"
														}
													]
												},
												{
													"title": "动画",
													"body": [
														{
															"type": "input-text",
															"label": "动画时长",
															"placeholder": "0.2s",
															"name": "theme._vars[\"--animation-duration\"]",
															"disabledOn": "!isEdit"
														}
													]
												},
												// {
												// 	"title": "其它变量",
												// 	"body": [
												// 		{
												// 			"type": "combo",
												// 			"multiple": true,
												// 			"name": "theme._otherVars",
												// 			"items": [
												// 				{
												// 					"type": "input-text",
												// 					"placeholder": "变量名",
												// 					"required": true,
												// 					"name": "key"
												// 				},
												// 				{
												// 					"type": "input-text",
												// 					"placeholder": "变量值",
												// 					"required": true,
												// 					"name": "value"
												// 				}
												// 			]
												// 		}
												// 	]
												// }
											]
										}
									]
								},
								{
									"title": "自定义 CSS",
									"body": [
										{
											"label": false,
											"type": "editor",
											"name": "theme.style",
											"size": "lg",
											"options": {
												"lineNumbers": "off"
											},
											"language": "css"
										}
									]
								},
								{
									"title": "查看设置的变量",
									"body": [
										{
											"type": "static-tpl",
											"pipeIn": (value: any, data: any) => {
												console.log(value, data)
												const vars = [];
												const names = new Set();
												const theme = data.data?.theme || {};
												for (const type in theme) {
													if (type.startsWith('_')) {
														for (const name in theme[type]) {
															const value = theme[type][name];
															if (typeof value !== undefined && value !== '') {
																names.add(name);
																if (name == '--Layout-asideLink-onHover-color') {
																	names.add('--Layout-asideLink-onHover-iconColor')
																	vars.push(`--Layout-asideLink-onHover-iconColor: ${value.replace(/[;<>]*/g, '')};`)
																}
																vars.push(
																	`${name}: ${value.replace(/[;<>]*/g, '')};`
																);
															}
														}
													}
												}
												if (vars.length) {
													return `<pre>${vars.join('\n')}</pre>`;
												} else {
													return '未设置变量';
												}
											}
										}
									]
								}
							]
						}
					]
				},
				{
					"md": 8,
					"type": "container",
					"className": "theme-edit",
					"columnClassName": "b-l",
					"body": [
						{
							"type": "tabs",
							"className": "gridScreen",
							"tabs": [
								{
									"title": "表单预览",
									"tab": {
										"type": "form",
										"title": "表单项",
										"className": "--text-color",
										"mode": "horizontal",
										"wrapWithPanel": false,
										"autoFocus": true,
										"body": [
											{
												"type": "group",
												"body": [
													{
														"type": "input-text",
														"name": "var1",
														"label": "输入框",
														"clearable": true,
														"className": "--text--loud-color"
													},
													{
														"type": "input-number",
														"name": "number",
														"label": "数字",
														"placeholder": "",
														"inline": true,
														"value": 5,
														"min": 1,
														"max": 10
													}
												]
											},
											{
												"type": "group",
												"body": [
													{
														"type": "input-tag",
														"name": "tag",
														"label": "标签",
														"placeholder": "",
														"clearable": true,
														"className": "--text--loud-color",
														"options": [
															{
																"label": "诸葛亮",
																"value": "zhugeliang"
															},
															{
																"label": "曹操",
																"value": "caocao"
															},
															{
																"label": "钟无艳",
																"value": "zhongwuyan"
															},
															{
																"label": "野核",
																"children": [
																	{
																		"label": "李白",
																		"value": "libai"
																	},
																	{
																		"label": "韩信",
																		"value": "hanxin"
																	},
																	{
																		"label": "云中君",
																		"value": "yunzhongjun"
																	}
																]
															}
														]
													},
													{
														"type": "input-text",
														"disabled": true,
														"name": "disabled",
														"label": "禁用状态",
														"placeholder": "这里禁止输入内容"
													}
												]
											},
											{
												"type": "group",
												"body": [
													{
														"type": "input-text",
														"name": "text-sug",
														"label": "文本提示",
														"options": [
															"lixiaolong",
															"zhouxingxing",
															"yipingpei",
															"liyuanfang"
														],
														"addOn": {
															"type": "input-text",
															"label": "$"
														}
													},
													{
														"type": "input-text",
														"name": "text-sug-multiple",
														"label": "文本提示多选",
														"multiple": true,
														"options": [
															"lixiaolong",
															"zhouxingxing",
															"yipingpei",
															"liyuanfang"
														]
													}
												]
											},
											{
												"type": "button-toolbar",
												"label": "按钮",
												"buttons": [
													{
														"type": "action",
														"label": "默认"
													},
													{
														"type": "action",
														"label": "信息",
														"level": "info"
													},
													{
														"type": "action",
														"label": "主要",
														"level": "primary"
													},
													{
														"type": "action",
														"label": "次要",
														"level": "secondary"
													},
													{
														"type": "action",
														"label": "成功",
														"level": "success"
													},
													{
														"type": "action",
														"label": "警告",
														"level": "warning"
													},
													{
														"type": "action",
														"label": "危险",
														"level": "danger"
													},
													{
														"type": "action",
														"label": "浅色",
														"level": "light"
													},
													{
														"type": "action",
														"label": "深色",
														"level": "dark"
													},
													{
														"type": "action",
														"label": "链接",
														"level": "link"
													}
												]
											},
											{
												"type": "group",
												"body": [
													{
														"type": "radios",
														"name": "radios",
														"label": "单选",
														"className": "theme-radio",
														"value": 3,
														"options": [
															{
																"label": "选项1",
																"value": 1
															},
															{
																"label": "选项2",
																"value": 2
															},
															{
																"label": "选项3",
																"disabled": true,
																"value": 3
															}
														]
													},
													{
														"type": "checkboxes",
														"name": "checkboxes",
														"className": "theme-checkbox",
														"label": "多选框",
														"value": 3,
														"options": [
															{
																"label": "选项1",
																"value": 1
															},
															{
																"label": "选项2",
																"value": 2
															},
															{
																"label": "选项3",
																"disabled": true,
																"value": 3
															}
														]
													}
												]
											},
											{
												"type": "group",
												"body": [
													{
														"type": "switch",
														"name": "switch",
														"onText": "开",
														"offText": "关",
														"label": "开关"
													},
													{
														"type": "switch",
														"name": "switch2",
														"value": true,
														"label": "开关开启"
													},
													{
														"type": "switch",
														"name": "switch3",
														"value": true,
														"disabled": true,
														"label": "开关禁用"
													}
												]
											},
											{
												"type": "group",
												"body": [
													{
														"type": "button-group-select",
														"name": "btn-group",
														"label": "按钮组",
														"options": [
															{
																"label": "选项 A",
																"value": 1
															},
															{
																"label": "选项 B",
																"value": 2
															},
															{
																"label": "选项 C",
																"value": 3
															}
														]
													},
													{
														"type": "list-select",
														"name": "List",
														"label": "List",
														"options": [
															{
																"label": "选项 A",
																"value": 1
															},
															{
																"label": "选项 B",
																"value": 2
															},
															{
																"label": "选项 C",
																"value": 3
															}
														]
													}
												]
											},
											{
												"type": "group",
												"body": [
													{
														"type": "select",
														"name": "type",
														"label": "单选",
														"inline": true,
														"options": [
															{
																"label": "选项1",
																"value": 1
															},
															{
																"label": "选项2",
																"value": 2
															}
														]
													},
													{
														"type": "select",
														"name": "type2",
														"label": "多选",
														"multiple": true,
														"options": [
															{
																"label": "选项1",
																"value": 1
															},
															{
																"label": "选项2",
																"value": 2
															}
														]
													}
												]
											},
											{
												"type": "group",
												"body": [
													{
														"type": "input-date",
														"name": "date",
														"inline": true,
														"label": "日期"
													},
													{
														"type": "input-time",
														"name": "time",
														"inline": true,
														"label": "时间"
													}
												]
											},
											{
												"type": "group",
												"label": "步骤条",
												"body": [
													{
														"type": "steps",
														"value": 1,
														"steps": [
															{
																"title": "First",
																"subTitle": "this is subTitle",
																"description": "this is description"
															},
															{
																"title": "Second"
															},
															{
																"title": "Last"
															}
														]
													},
												]
											},
											{
												"type": "input-date-range",
												"name": "daterangee",
												"inline": true,
												"label": "时间范围"
											},
											{
												"type": "input-group",
												"size": "sm",
												"inline": true,
												"label": "Icon 组合",
												"body": [
													{
														"type": "icon",
														"addOnclassName": "no-bg",
														"className": "text-sm",
														"icon": "search"
													},
													{
														"type": "input-text",
														"placeholder": "搜索作业ID/名称",
														"inputClassName": "b-l-none p-l-none",
														"name": "jobName"
													}
												]
											},
											{
												"type": "input-tree",
												"name": "tree",
												"label": "树",
												"options": [
													{
														"label": "Folder A",
														"value": 1,
														"children": [
															{
																"label": "file A",
																"value": 2
															},
															{
																"label": "file B",
																"value": 3
															}
														]
													},
													{
														"label": "file C",
														"value": 4
													},
													{
														"label": "file D",
														"value": 5
													}
												]
											},
											{
												"type": "group",
												"body": [
													{
														"type": "input-tree",
														"name": "trees",
														"label": "树多选",
														"multiple": true,
														"options": [
															{
																"label": "Folder A",
																"value": 1,
																"children": [
																	{
																		"label": "file A",
																		"value": 2
																	},
																	{
																		"label": "file B",
																		"value": 3
																	}
																]
															},
															{
																"label": "file C",
																"value": 4
															},
															{
																"label": "file D",
																"value": 5
															}
														]
													},
													{
														"type": "nested-select",
														"name": "nestedSelect",
														"label": "级联选择器",
														"options": [
															{
																"label": "概念",
																"value": "concepts",
																"children": [
																	{
																		"label": "配置与组件",
																		"value": "schema"
																	},
																	{
																		"label": "数据域与数据链",
																		"value": "scope"
																	},
																	{
																		"label": "模板",
																		"value": "template"
																	},
																	{
																		"label": "数据映射",
																		"value": "data-mapping"
																	},
																	{
																		"label": "表达式",
																		"value": "expression"
																	},
																	{
																		"label": "联动",
																		"value": "linkage"
																	},
																	{
																		"label": "行为",
																		"value": "action"
																	},
																	{
																		"label": "样式",
																		"value": "style"
																	}
																]
															},
															{
																"label": "类型",
																"value": "types",
																"children": [
																	{
																		"label": "SchemaNode",
																		"value": "schemanode"
																	},
																	{
																		"label": "API",
																		"value": "api"
																	},
																	{
																		"label": "Definitions",
																		"value": "definitions"
																	}
																]
															},
															{
																"label": "组件",
																"value": "zujian",
																"children": [
																	{
																		"label": "布局",
																		"value": "buju",
																		"children": [
																			{
																				"label": "Page 页面",
																				"value": "page"
																			},
																			{
																				"label": "Container 容器",
																				"value": "container"
																			},
																			{
																				"label": "Collapse 折叠器",
																				"value": "Collapse"
																			}
																		]
																	},
																	{
																		"label": "功能",
																		"value": "gongneng",
																		"children": [
																			{
																				"label": "Action 行为按钮",
																				"value": "action-type"
																			},
																			{
																				"label": "App 多页应用",
																				"value": "app"
																			},
																			{
																				"label": "Button 按钮",
																				"value": "button"
																			}
																		]
																	},
																	{
																		"label": "数据输入",
																		"value": "shujushuru",
																		"children": [
																			{
																				"label": "Form 表单",
																				"value": "form"
																			},
																			{
																				"label": "FormItem 表单项",
																				"value": "formitem"
																			},
																			{
																				"label": "Options 选择器表单项",
																				"value": "options"
																			}
																		]
																	},
																	{
																		"label": "数据展示",
																		"value": "shujuzhanshi",
																		"children": [
																			{
																				"label": "CRUD 增删改查",
																				"value": "crud"
																			},
																			{
																				"label": "Table 表格",
																				"value": "table"
																			},
																			{
																				"label": "Card 卡片",
																				"value": "card"
																			}
																		]
																	},
																	{
																		"label": "反馈",
																		"value": "fankui"
																	}
																]
															}
														]
													}
												]
											},
											{
												"type": "matrix-checkboxes",
												"name": "matrix",
												"label": "矩阵开关",
												"rowLabel": "行标题说明",
												"columns": [
													{
														"label": "列1"
													},
													{
														"label": "列2"
													}
												],
												"rows": [
													{
														"label": "行1"
													},
													{
														"label": "行2"
													}
												]
											},
											{
												"type": "combo",
												"name": "combo2",
												"label": "组合多条",
												"multiple": true,
												"value": [
													{}
												],
												"items": [
													{
														"name": "a",
														"type": "input-text",
														"placeholder": "A"
													},
													{
														"name": "b",
														"type": "select",
														"options": [
															"a",
															"b",
															"c"
														]
													}
												]
											},
											{
												"type": "input-file",
												"name": "file",
												"label": "文件上传",
												"joinValues": false
											},
											{
												"type": "input-range",
												"name": "range",
												"label": "范围"
											},
											{
												"type": "divider"
											}
										],
										"actions": []
									}
								},
								{
									"title": "表格预览",
									"tab": {
										"type": "crud",
										"syncLocation": false,
										"data": {
											"items": [
												{
													"engine": "Trident",
													"browser": "Internet Explorer 4.0",
													"platform": "Win 95+",
													"version": "4",
													"id": 1,
													"status": "fail",
												},
												{
													"engine": "Trident",
													"browser": "Internet Explorer 5.0",
													"platform": "Win 95+",
													"id": 2,
													"status": "success",
												},
												{
													"engine": "Trident",
													"browser": "Internet Explorer 5.5",
													"platform": "Win 95+",
													"id": 3,
													"status": "schedule",
												},
												{
													"engine": "Trident",
													"browser": "Internet Explorer 6",
													"platform": "Win 98+",
													"id": 4,
													"status": "queue",
												},
												{
													"engine": "Trident",
													"browser": "Internet Explorer 7",
													"platform": "Win XP SP2+",
													"id": 5,
													"status": "fail",
												},
												{
													"engine": "Trident",
													"browser": "AOL browser (AOL desktop)",
													"platform": "Win XP",
													"id": 6,
													"status": "pending",
												}
											]
										},
										"source": "${items}",
										"columns": [
											{
												"name": "id",
												"label": "ID"
											},
											{
												"name": "engine",
												"label": "Rendering engine"
											},
											{
												"name": "browser",
												"label": "Browser"
											},
											{
												"name": "platform",
												"label": "Platform(s)"
											},
											{
											  "name": "status",
											  "label": "状态",
											  "type": "mapping",
											  "map": {
												"*": {
												  "type": "status"
												}
											  }
											}
										]
									}
								},
								{
									title: "code代码",
									tab: {
										"label": "code代码",
										"inline": true,
										"type": "code",
										"language": "javascript",
										"value": "(function () {\n  let amisJSON = {\n    type: 'page',\n    title: '表单页面',\n    body: {\n      type: 'form',\n      mode: 'horizontal',\n    body: [\n        {\n          label: 'Name',\n          type: 'input-text',\n          name: 'name'\n        },\n        {\n          label: 'Email',\n          type: 'input-email',\n          name: 'email'\n        }\n      ]\n    }\n});"

									}
								}
							]
						}
					]
				}
			]
		}
	]
}
export default schema
