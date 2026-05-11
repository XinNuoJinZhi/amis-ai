export default () => {
    return {
        "title": "确认",
        "mode": "horizontal",
        "body": [
            {
                "name": "name",
                "type": "input-text",
                "label": "数据源名称",
                "static": true,
                "value": "${name}",
                "maxLength": 200,
                "showCounter": true,
            },
            {
                "name": "text",
                "type": "input-text",
                "label": "数据源Key",
                "static": true,
                "value": "${key}"
            },
            {
                "type": "control",
                "label": "同步模式",
                "body": {
                    "type": "mapping",
                    "value": 1,
                    "map": {
                        "1": "<span class='label label-primary'>自动同步</span>",
                        "2": "<span class='label label-primary'>手动同步</span>"
                    }
                }
            },
            {
                "type": "control",
                "label": "隔离模式",
                "body": {
                    "type": "mapping",
                    "value": 1,
                    "map": {
                        "1": "<span class='label label-success'>数据库隔离</span>"
                    }
                }
            },
            {
                "type": "control",
                "label": "数据库信息",
                "body": {
                    "type": "mapping",
                    "value": "1",
                    "map": {
                        "0": "<span class='label label-default'>内部数据库</span>",
                        "1": "<span class='label label-default'>外部数据库</span>"
                    }
                }
            }
        ]
    }
}
