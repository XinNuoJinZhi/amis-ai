import {getUpdateDdl,getTableDatass} from '@/api/formEditor';
import {format} from "sql-formatter"
export default () => {
  return {
    click: {
      actions: [
        {
          actionType: "custom",
          script: function (_: any, doAction: any, event: any) {
            console.log(event,'获取修改表数据')
            if(event.data.primaryField){
              getTableDatass(event.data.dsKey, event.data.queryKey).then((res: any) => {
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
                console.log(res, '获取修改表数据1')
                  doAction({
                    actionType: "setValue",
                    componentId: "editorUploadTable",
                    args: {
                      value: res.data.data === null ? '' : format(res.data.data)
                    }
                  });
              })
            }else{
              getUpdateDdl(event.data.dsKey).then((res: any) => {
                console.log(res, '获取修改表数据2')
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
                doAction({
                  actionType: "setValue",
                  componentId: "editorUploadTable",
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
