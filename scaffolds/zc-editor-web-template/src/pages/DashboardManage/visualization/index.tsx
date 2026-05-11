import VisualizationIframe from "./component/visualizationIframe"
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
                <VisualizationIframe />
            </div>
        )
    }]
}
export default () => <AMISComponent schema={schema} />;
