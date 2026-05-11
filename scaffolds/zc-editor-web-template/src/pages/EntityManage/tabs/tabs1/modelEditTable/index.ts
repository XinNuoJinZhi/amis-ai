import getOnEvent from "./onEvent"
import getDialog from "./dialog"

export default () => {
    return {
        name: 'modelTable',
        label: "生成修改表语句",
        type: "button",
        level: "link",
        actionType: "dialog",
        disabledOn: "this.validateStatus !== 0",
        onEvent: getOnEvent(),
        dialog:getDialog()
    }
}
