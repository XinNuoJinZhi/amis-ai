import {  getEntityDataJson } from "@/api/formEditor"
import {getTableDatas} from '@/api/entitymanage';
export default () => {
    return {
        click: {
            actions: [
                {
                    actionType: "custom",
                    script: function (_: any, doAction: any, event: any) {
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
                        console.log(res, '获取列表详情数据')
                        doAction({
                          actionType: "setValue",
                          componentId: "editorJson",
                          args: {
                            value: res.data.data === null ? '' : res.data.data
                          }
                        });
                      })
                      }else{
                        getEntityDataJson(event.data.dsKey).then((res: any) => {
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
                          console.log(res, '获取列表详情数据1')
                          doAction({
                            actionType: "setValue",
                            componentId: "editorJson",
                            args: {
                              value: res.data.data === null ? '' : res.data.data
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
