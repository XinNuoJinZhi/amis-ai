import getOnEvent from "./onEvent"
import getDialog from "./dialog"

export default () => {
    return {
        name: 'modelJson',
        label: "生成元数据json",
        type: "button",
        level: "link",
        actionType: "dialog",
        disabledOn: "this.validateStatus !== 0",
        onEvent: getOnEvent(),
        dialog:getDialog()
    }

}
