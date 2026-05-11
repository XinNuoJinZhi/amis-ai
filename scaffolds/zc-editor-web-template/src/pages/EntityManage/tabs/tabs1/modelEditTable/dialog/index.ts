import {useDevBaseUrl} from '@/utils/util';

export default () => {
  return {
    type: 'dialog',
    title: '修改表语句',
    id: 'dialogEditorUploadTable',
    body: [
      {
        "type": "spinner",
        "showOn": '${editorUploadTable==null}',
        "overlay": '${editorUploadTable==null}',
        body:[
          {
            label: false,
            type: 'editor',
            name: 'editorUploadTable',
            id: 'editorUploadTable',
            size: 'lg',
            options: {
              lineNumbers: 'off'
            },
            language: 'sql',
            disabled: true,
          },
          {
            "type": "alert",
            "body": "提示：该功能为架构比对功能，只会生成新增和删除语句，如有改名场景，请自行处理。",
            "level": "danger",
            "className": "mb-1"
          }
        ]
      }
    ],
    actions: [
      {
        type: 'button',
        actionType: 'cancel',
        label: '取消'
      },
      {
        close: false,
        type: 'button',
        actionType: 'confirm',
        label: '下载',
        id:'uploadDownload',
        primary: true,
        visibleOn: '${primaryField && editorUploadTable!=null && editorUploadTable!=""}',
        onEvent: {
          click: {
            actions: [
              {
                actionType: 'ajax',
                args: {
                  api: {
                    method: 'post',
                    url: useDevBaseUrl('/entitymanage/table/getUpdateDdlDownload'),
                    responseType: 'blob',
                    data: {
                      item: '${editorUploadTable}'
                    }
                  }
                }
              }
            ]
          }
        }
      },
      {
        close: false,
        type: 'button',
        actionType: 'confirm',
        label: '下载',
        // disabled: '${editorUploadTable==null}',
        id:'uploadDownload',
        primary: true,
        visibleOn: '${!primaryField && editorUploadTable!=null && editorUploadTable!=""}',
        onEvent: {
          click: {
            actions: [
              {
                actionType: 'ajax',
                args: {
                  api: {
                    method: 'post',
                    url: useDevBaseUrl('/entitymanage/dataSource/getUpdateDdlDownload'),
                    responseType: 'blob',
                    data: {
                      items: '${editorUploadTable}'
                    }
                  }
                }
              }
            ]
          }
        }
      }
    ],
    showCloseButton: true,
    closeOnOutside: false,
    closeOnEsc: false,
    showErrorMsg: true,
    showLoading: true,
    draggable: false
  };
}
