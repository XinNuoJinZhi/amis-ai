import { DagreLayout } from '@antv/layout'
import { saveEntityDiagramPosition } from "@/api/entitymanage"
import { Relation, ResItem } from "@/pages/EntityManage/EntityModelDiagram/types";
import { LINE_HEIGHT, NODE_WIDTH } from './graph';
import { Edge, Node, } from '@antv/x6';
import { Model } from '@antv/layout';

function getInverseSide(model: ResItem[], r: Relation, t: ResItem) {
    const t1 = model.filter(t2 => t2.type != 2 && t2.key == r.targetKey)[0]
    const r1 = t1.relations.filter(r2 => r2.targetKey == t.key && r2.inverseSide == r.key)[0]
    if (r1 == null) {
        return null
    }
    return t1.fields.filter(f => f.key == r1.key)[0]
}

function partStr(str) {
    // 匹配中文字符的正则表达式
    const reg = /[\u4e00-\u9fa5]+/;
    let len = 20;
    if (reg.test(str)) {
        len = 10;
    }
    return str.length > len ? str.substring(0, len) + '...' : str;
}

function getRelationTip(relation: Relation) {
    const mapping = {
        "select": "下拉选择框",
        "radios": "单选按钮",
        "button-group-select": "按钮组选择",
        "list-select": "平铺列表选择",
        "combo": "组合",
        "table": "表格编辑",
        "checkboxes": "复选框",
        "picker": "表格选择",
        "titleField": "标题字段",
        "embed": "内嵌展示",
        "dialog": "弹框",
        "drawer": "抽屉"
    };
    if (relation.displayType == null || relation.displayType == '') {
        if (relation.relationMode == '1:1' || relation.relationMode == 'n:1') {
            relation.displayType = 'titleField';
        } else {
            relation.displayType = 'dialog';
        }
    }
    if (relation.inputType == null || relation.inputType == '') {
        if (relation.relationMode == '1:1') {
            relation.inputType = 'embed';
        } else if (relation.relationMode == 'n:1') {
            relation.inputType = 'select';
        } else if (relation.relationMode == '1:n') {
            relation.inputType = 'combo';
        } else {
            relation.inputType = 'picker';
        }
    }
    return '展示形式: ' + mapping[relation.displayType] + '\n输入形式: ' + mapping[relation.inputType];
}

function getData(model: ResItem[]) {
    const nodes: Node.Metadata[] = model.filter((t) => t.type != 2).map(t => {
        return {
            id: t.id,
            shape: "er-rect",
            label: partStr(t.name),
            width: NODE_WIDTH,
            height: LINE_HEIGHT,
            position: {
                "x": t.x,
                "y": t.y
            },
            data: { tip: t.name + '\n' + t.key },
            attrs: {
                rect: {
                    fill: t.type != 1 ? "#5F95FF" : "#8BB8F6"
                },
            },
            ports: [
                {
                    id: t.id,
                    group: "tableTitlePosition",
                },
                ...t.fields.filter(f => {
                    if (f.isForeignKey || f.isDeleteUser || f.isDeleteDate || f.isDeleteFlag || f.isTenantCode) {
                        return false;
                    }
                    if (f.isCreateUser || f.isCreateDate || f.isUpdateUser || f.isUpdateDate) {
                        return false;
                    }
                    return true;
                }).map(f => {
                    let tip = f.name + '\n' + f.key
                    if (f.type == 'relation') {
                        const r = t.relations.filter(i => i.key == f.key)[0];
                        tip = tip + '\n' + getRelationTip(r)
                    } else if (f.isPrimaryKey && f.primaryKeyMode == "AUTO") {
                        tip = tip + '\n' + "自增"
                    }
                    return {
                        id: f.id,
                        group: "list",
                        attrs: {
                            portStarLabel: {
                                text: !f.isNullable ? "*" : ""
                            },
                            portNameLabel: {
                                text: partStr(f.name)
                            },
                            portTypeLabel: {
                                text: f.type != 'relation' ? f.type : t.relations.filter(r => r.key == f.key)[0].relationMode,
                                fill: f.isPrimaryKey && f.primaryKeyMode == "AUTO" ? "#5F95FF" : null
                            },
                        },
                        tip: tip
                    }
                })
            ]
        }
    })
    const edges: Edge.Metadata[] = []
    model.filter(t => t.type != 2).forEach(t => {
        t.relations.forEach(r => {
            if (r.inverseSide != null) {
                return
            }
            const inverseSide = getInverseSide(model, r, t)
            const parts = r.relationMode.split(':')
            const e: Edge.Metadata = {
                id: r.id,
                shape: "edge",
                source: {
                    cell: t.id,
                    port: t.fields.filter(f => f.key == r.key)[0].id
                },
                target: {
                    cell: r.target,
                    port: inverseSide == null ? r.target : inverseSide.id
                },
                attrs: {
                    line: {
                        stroke: inverseSide == null ? "#5F95FF" : "#A2B1C3",
                        strokeWidth: 1.5,
                        targetMarker: inverseSide == null ? "classic" : null,
                    }
                },
                labels: [
                    {
                        markup: [
                            {
                                tagName: 'rect',
                                selector: 'labelBody',
                            },
                            {
                                tagName: 'text',
                                selector: 'labelText',
                            },
                        ],
                        attrs: {
                            labelText: {
                                text: parts[0],
                                fill: '#5F95FF',
                                textAnchor: 'middle',
                                textVerticalAnchor: 'middle',
                            },
                            labelBody: {
                                ref: 'labelText',
                                refX: -7,
                                refY: -3,
                                refWidth: '100%',
                                refHeight: '100%',
                                refWidth2: 13,
                                refHeight2: 7,
                                stroke: '#A2B1C3',
                                fill: '#fff',
                                strokeWidth: 1,
                                rx: 5,
                                ry: 5,
                            },
                        },
                        position: {
                            distance: 0.2,
                            args: {
                                keepGradient: true,
                                ensureLegibility: true,
                            },
                        },
                    },
                    {
                        markup: [
                            {
                                tagName: 'rect',
                                selector: 'labelBody',
                            },
                            {
                                tagName: 'text',
                                selector: 'labelText',
                            },
                        ],
                        attrs: {
                            labelText: {
                                text: parts[1],
                                fill: '#5F95FF',
                                textAnchor: 'middle',
                                textVerticalAnchor: 'middle',
                            },
                            labelBody: {
                                ref: 'labelText',
                                refX: -7,
                                refY: -3,
                                refWidth: '100%',
                                refHeight: '100%',
                                refWidth2: 13,
                                refHeight2: 7,
                                stroke: '#A2B1C3',
                                fill: '#fff',
                                strokeWidth: 1,
                                rx: 5,
                                ry: 5,
                            },
                        },
                        position: {
                            distance: 0.8,
                            args: {
                                keepGradient: true,
                                ensureLegibility: true,
                            },
                        },
                    },
                ],
                tools: [
                    {
                        name: 'tooltip',
                        args: {
                            tooltip: r.relationMode == 'n:1' && inverseSide != null ? '1:n & n:1' : r.relationMode,
                        },
                    },
                ],
                // router: inverseSide == null ? "" : ""
            };
            edges.push(e)
        })
    })
    return { nodes, edges }
}

export async function createDiagramData(model: ResItem[]) {
    console.log("model", model)
    const data = getData(model)
    const nodes = data.nodes.filter(i => i.position?.x == null || i.position?.y == null)
    if (nodes.length > 0) {
        const edges = data.edges.filter(i =>
            nodes.some(n => (i.source as any).cell == n.id) && nodes.some(n => (i.target as any).cell == n.id));
        let x = 0;
        data.nodes.forEach(i => {
            if (i.position?.x != null && i.position?.x > x) {
                x = i.position?.x
            }
        })
        const dagreLayout = new DagreLayout({
            type: 'dagre',
            begin: [x + NODE_WIDTH + 70, 45],
            rankdir: 'LR',
            align: 'UL',
            ranksep: 70,
            nodesep: 45,
            controlPoints: true,
        })
        dagreLayout.layout({ nodes, edges } as unknown as Model)
        let params = nodes.map(i => {
            return {
                id: i.id,
                x: i.x,
                y: i.y
            }
        })
        let res = await saveEntityDiagramPosition(params);
        nodes.forEach(i => {
            const node = data.nodes.filter(n => n.id == i.id)[0];
            i.x = node.x
            i.y = node.y
        })
    }
    console.log("data", data)
    return [...data.nodes, ...data.edges]
}
