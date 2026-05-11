import { Graph } from "@antv/x6"
export const LINE_HEIGHT = 24
export const NODE_WIDTH = 166

Graph.registerPortLayout(
    'erPortPosition',
    (portsPositionArgs) => {
        return portsPositionArgs.map((_, index) => {
            return {
                position: {
                    x: 0,
                    y: (index + 1) * LINE_HEIGHT,
                },
                angle: 0,
            }
        })
    },
    true,
)

Graph.registerPortLayout(
    'erTableTitlePortPosition',
    (portsPositionArgs) => {
        return portsPositionArgs.map((_, index) => {
            return {
                position: {
                    x: 0,
                    y: LINE_HEIGHT,
                },
                angle: 0,
            }
        })
    },
    true,
)

Graph.registerNode(
    'er-rect',
    {
        inherit: 'rect',
        markup: [
            {
                tagName: 'rect',
                selector: 'body',
            },
            {
                tagName: 'text',
                selector: 'label',
            },
        ],
        attrs: {
            rect: {
                strokeWidth: 1,
                stroke: '#5F95FF',
                fill: '#5F95FF',
            },
            label: {
                fontWeight: 'bold',
                fill: '#ffffff',
                fontSize: 12,
            },
        },
        ports: {
            groups: {
                list: {
                    markup: [
                        {
                            tagName: 'rect',
                            selector: 'portBody',
                        },
                        {
                            tagName: 'text',
                            selector: 'portStarLabel',
                        },
                        {
                            tagName: 'text',
                            selector: 'portNameLabel',
                        },
                        {
                            tagName: 'text',
                            selector: 'portTypeLabel',
                        },
                    ],
                    attrs: {
                        portBody: {
                            width: NODE_WIDTH,
                            height: LINE_HEIGHT,
                            strokeWidth: 1,
                            stroke: '#5F95FF',
                            fill: '#EFF4FF',
                            // magnet: true,
                            // magnet: false,  // 禁用此端口的连线功能
                        },
                        portStarLabel: {
                            ref: 'portBody',
                            refX: 5,
                            refY: 6,
                            fontSize: 10,
                            fill: 'red',
                        },
                        portNameLabel: {
                            ref: 'portBody',
                            refX: 10,
                            refY: 6,
                            fontSize: 10,
                        },
                        portTypeLabel: {
                            ref: 'portBody',
                            refX: 157,
                            refY: 6,
                            fontSize: 10,
                            textAnchor: 'end',
                        },
                    },
                    position: 'erPortPosition',
                },
                tableTitlePosition: {
                    markup: [
                        {
                            tagName: 'rect',
                            selector: 'tableTitlePortBody',
                        }
                    ],
                    attrs: {
                        tableTitlePortBody: {
                            width: NODE_WIDTH,
                            height: 1,
                        },
                    },
                    position: 'erTableTitlePortPosition',
                }
            },
        },
    },
    true,
)
