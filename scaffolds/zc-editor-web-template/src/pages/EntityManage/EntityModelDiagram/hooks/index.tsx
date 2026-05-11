import { getEntityDiagramData } from "@/api/entitymanage";
import { Cell, Graph } from "@antv/x6";
import { createDiagramData } from "../data";
import { Dispatch, SetStateAction } from "react";
import React from "react";
import { render as amisRender, toast } from 'amis';
import { service } from "@/utils/request"
import { getUrlParams } from "../utils";
import {env as amisEnv} from '@/hooks/amis';

//获取数据接口
export const getInitData = async (graph: Graph, flag: boolean) => {
    const dsKey = getUrlParams('dsKey');
    let res = await getEntityDiagramData(dsKey);
    if(res.data.code != 0) {
        toast.error(res.data.msg, {
            position: 'top-right'
        });
        return
    }
    let watTableList:any = []
    res.data.data.forEach((res: any) => {
            watTableList.push({
                ...res,
                label: res.key,
                value: res.key
            });
    });
    sessionStorage.setItem('watTableList',JSON.stringify(watTableList));
    let data = await createDiagramData(res.data.data)
    const cells: Cell[] = []
    data.forEach((item: any) => {
        if (item.shape === 'edge') {
            cells.push(graph.createEdge(item))
        } else {
            item.ports.forEach(i => {
                if (i.attrs == null) {
                    return
                }
                if (i.attrs.portTypeLabel.text == 'text') {
                    i.attrs.portTypeLabel.text = "单行文本"
                } else if (i.attrs.portTypeLabel.text == 'textarea') {
                    i.attrs.portTypeLabel.text = "多行文本"
                } else if (i.attrs.portTypeLabel.text == 'int') {
                    i.attrs.portTypeLabel.text = "整数(Int)"
                } else if (i.attrs.portTypeLabel.text == 'float') {
                    i.attrs.portTypeLabel.text = "小数"
                } else if (i.attrs.portTypeLabel.text == 'rich-text') {
                    i.attrs.portTypeLabel.text = "富文本"
                } else if (i.attrs.portTypeLabel.text == 'money') {
                    i.attrs.portTypeLabel.text = "金额"
                } else if (i.attrs.portTypeLabel.text == 'enum') {
                    i.attrs.portTypeLabel.text = "枚举"
                } else if (i.attrs.portTypeLabel.text == 'boolean') {
                    i.attrs.portTypeLabel.text = "布尔(开关)"
                } else if (i.attrs.portTypeLabel.text == 'date') {
                    i.attrs.portTypeLabel.text = "日期"
                } else if (i.attrs.portTypeLabel.text == 'datetime') {
                    i.attrs.portTypeLabel.text = "日期时间"
                } else if (i.attrs.portTypeLabel.text == 'date-range') {
                    i.attrs.portTypeLabel.text = "日期范围"
                } else if (i.attrs.portTypeLabel.text == 'time') {
                    i.attrs.portTypeLabel.text = "时间"
                } else if (i.attrs.portTypeLabel.text == 'attachment') {
                    i.attrs.portTypeLabel.text = "附件"
                } else if (i.attrs.portTypeLabel.text == 'image') {
                    i.attrs.portTypeLabel.text = "图片"
                } else if (i.attrs.portTypeLabel.text == 'user') {
                    i.attrs.portTypeLabel.text = "人员信息"
                } else if (i.attrs.portTypeLabel.text == 'users') {
                    i.attrs.portTypeLabel.text = "人员多选"
                } else if (i.attrs.portTypeLabel.text == 'department') {
                    i.attrs.portTypeLabel.text = "部门信息"
                } else if (i.attrs.portTypeLabel.text == 'password') {
                    i.attrs.portTypeLabel.text = "密码"
                } else if (i.attrs.portTypeLabel.text == 'ciphertext') {
                    i.attrs.portTypeLabel.text = "密文"
                } else if (i.attrs.portTypeLabel.text == 'json') {
                    i.attrs.portTypeLabel.text = "JSON"
                } else if (i.attrs.portTypeLabel.text == 'formula') {
                    i.attrs.portTypeLabel.text = "公式"
                } else if (i.attrs.portTypeLabel.text == 'parent') {
                    i.attrs.portTypeLabel.text = "父级"
                } else if (i.attrs.portTypeLabel.text == 'serial-number') {
                    i.attrs.portTypeLabel.text = "流水号"
                }
            })
            cells.push(graph.createNode(item))
        }
    })
    graph.resetCells(cells)
    if (flag) {
        graph.zoomToFit({ padding: 10, maxScale: 1 })
    }
    return res.data.data
}
export function keyDialog(setShowKeyDialog: Dispatch<SetStateAction<boolean>>) {
    const schema = {
        "type": "page",
        "body": {
            "type": "dialog",
            "show": true,
            "title": '快捷键列表',
            "size": "md",
            "onEvent": {
                "confirm": {
                    "actions": [
                        {
                            "actionType": "custom",
                            "script": async function (obj: any) {
                                setShowKeyDialog(false)
                            }
                        }
                    ]
                },
                "cancel": {
                    "actions": [
                        {
                            "actionType": "custom",
                            "script": async function (obj: any) {
                                setShowKeyDialog(false)
                            }
                        }
                    ]
                }
            },
            "body": [{
                "type": "table",
                "data": [{
                    ability: '缩放',
                    winShortcutKey: 'CTRL + 🖱滚轮',
                    macShortcutKey: '⌘ + 🖱滚轮'
                }],
                "columns": [
                    {
                        "name": "ability",
                        "label": "功能"
                    },
                    {
                        "name": "winShortcutKey",
                        "label": "Win 快捷键",
                    },
                    {
                        "name": "macShortcutKey",
                        "label": "Mac 快捷键"
                    }
                ]
            }]
        }
    }
    return (
        <div>
            {amisRender(schema, {},
                {
                    fetcher: service,
                    theme: amisEnv.theme
                }
            )}
        </div>
    )
}
