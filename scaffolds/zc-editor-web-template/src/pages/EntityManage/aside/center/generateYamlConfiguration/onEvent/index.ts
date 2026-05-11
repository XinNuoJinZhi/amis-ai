import {getYaml} from '@/api/formEditor';
export default () => {
    return {
        click: {
            actions: [
                {
                    actionType: "custom",
                    script: function (_: any, doAction: any, event: any) {
                      console.log(event,'获取生成yaml配置')
                        getYaml(event.data.queryKey).then((res: any) => {
                            console.log(res, '获取生成yaml配置')
                            doAction({
                                actionType: "setValue",
                                componentId: "yamlEditorTable",
                                args: {
                                    value: res.data.data
                                }
                            });
                        })
                    }
                },
            ]
        }
    }
}
