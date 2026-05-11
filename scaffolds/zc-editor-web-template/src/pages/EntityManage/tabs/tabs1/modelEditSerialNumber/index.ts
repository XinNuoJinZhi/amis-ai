import getOnEvent from "./onEvent"
import getDialog from "./dialog"

export default () => {
    return {
        name: 'modelSerialNumber',
        label: "编辑流水号日志",
        type: "button",
        level: "link",
        actionType: "dialog",
        disabledOn: "this.validateStatus !== 0",
        onEvent: getOnEvent(),
        dialog:getDialog()
    }
}
