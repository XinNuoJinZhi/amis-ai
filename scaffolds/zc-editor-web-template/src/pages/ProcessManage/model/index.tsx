import Model from "./component/model"
import {AMISComponent} from "@/hooks/amis";
const schema = {
    "type": "page",
    "body": [{
        id: "model_config",
        "asFormItem": true,
        children: () => (
            <div>
                <Model />
            </div>
        )
    }]
}
export default () => <AMISComponent schema={schema} />;
