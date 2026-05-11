import TemplateIframe from "./component/templateIframe"
import {AMISComponent} from "@/hooks/amis";
const schema = {
    "type": "page",
    "body": [{
        id: "model_config",
        "asFormItem": true,
        children: ({
            value,
            onChange,
            data
        }) => (
            <div>
                <TemplateIframe />
            </div>
        )
    }]
}
export default () => <AMISComponent schema={schema} />;
