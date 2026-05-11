import Resource from "./component/Resource"
import {AMISComponent} from "@/hooks/amis";
const schema = {
    "type": "page",
    "body": [{
        "type": "form",
        "title": "",
        "wrapWithPanel": false,
        "body": [
            {
                "label": "",
                "name": "resource_config",
                "asFormItem": true,
                "children": ({
                    value,
                    onChange,
                    data
                }: {
                    value: any,
                    onChange: any,
                    data: any
                }) => {
                    return (
                        <>
                            <Resource value={value} sendValueToFather={(item) => onChange(item)}/>
                        </>
                    )
                }
            }
        ]
    }]
}

export default () => <AMISComponent schema={schema} />;
