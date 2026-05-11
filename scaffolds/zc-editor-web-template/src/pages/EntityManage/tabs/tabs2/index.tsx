import React from "react";
import EntityDiagram from "../../EntityModelDiagram";

export default () => {
    return {
        "title": "实体模型图",
        "visibleOn": "${ARRAYINCLUDES(${$$permissionsData},'entitymanage:meta-table:query')}",
        "unmountOnExit": true,
        "tab": [{
            "type": "form",
            "wrapWithPanel": false,
            "body": [{
                id: "entityDiagram",
                "asFormItem": true,
                children: ({ value, onChange, data }: any) => {
                    let params = new URLSearchParams(window.location.search);
                    let dsKey = params.get('dsKey') as string;
                    return <EntityDiagram dsKey={dsKey} />
                }
            }]
        }]
    }
}
