import {getCreateDdl, getTableDatas} from '@/api/formEditor';
import {format} from "sql-formatter"
export default () => {
    return {
        click: {
            actions: [
                {
                    actionType: "custom",
                    script: function (_: any, doAction: any, event: any) {
                      console.log(event,'获取生成表详情')
                      if(event.data.primaryField){
                        getTableDatas(event.data.dsKey, event.data.queryKey).then((res: any) => {
                          if(res.data.code === 500){
                            doAction({
                              actionType: 'toast',
                              args: {
                                msgType: "error",
                                msg: res.data.msg,
                                position: "top-right"
                              }
                            })
                          }
                          console.log(res, '获取生成表数据1')
                          doAction({
                            actionType: "setValue",
                            componentId: "editorTable",
                            args: {
                              value: res.data.data === null ? '' : format(res.data.data)
                            }
                          });
                        })
                      }else{
                        getCreateDdl(event.data.dsKey).then((res: any) => {
                          if(res.data.code === 500){
                            doAction({
                              actionType: 'toast',
                              args: {
                                msgType: "error",
                                msg: res.data.msg,
                                position: "top-right"
                              }
                            })
                          }
                          console.log(res, '获取生成表数据2')
                          doAction({
                            actionType: "setValue",
                            componentId: "editorTable",
                            args: {
                              value: res.data.data === null ? '' : format(res.data.data)
                            }
                          });
                        })
                      }
                    }
                },
            ]
        }
    }
}
