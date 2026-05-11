import getOnEvent from "./onEvent"
import getDialog from "./dialog"

export default () => {
    return {
        name: 'yamlModelTable',
        label: "生成yaml配置",
        type: "button",
        level: "link",
        actionType: "dialog",
        onEvent: getOnEvent(),
        dialog:getDialog()
    }
}
