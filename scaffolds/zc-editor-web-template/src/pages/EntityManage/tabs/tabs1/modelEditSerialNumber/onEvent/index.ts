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
          }
        },
      ]
    }
  }
}
