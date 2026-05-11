import { addRule } from "amis";
import getOnEvent from "./onEvent/aiIndex"
import getDialog from "./dialog/aiIndex"

export default () => {
    let usersList: any
    return {
        name: 'modelDesign',
        "label": "模型设计",
        "type": "button",
        "level": "link",
        "actionType": "dialog",
        "onEvent": getOnEvent(usersList),
        "dialog": getDialog(),
        style: {}
    }

}
