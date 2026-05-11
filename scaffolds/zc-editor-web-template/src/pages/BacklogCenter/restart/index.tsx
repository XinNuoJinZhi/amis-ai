import AppRestartSchemaEngine from "@/components/AppRestartSchemaEngine"
import { useDevBaseUrl } from "@/utils/util"
import {AMISComponent} from "@/hooks/amis";
const schema = {
    "type": "page",
    "className": "process_restart",
    "initApi": {
        "method": "get",
        "url": useDevBaseUrl("/application/processManage/process/getProcessForm?definitionId=${definitionId}&deployId=${deployId}&procInsId=${procInsId}"),
        adaptor: function (payload:any) {
            let context = payload.data?.context;
            let schemaContent = payload.data?.formContent;
            if(schemaContent)delete schemaContent.title
            let title = payload.data.formContent?.title
            let formValue = payload.data?.processVariables;
            let disFields = payload.data.disableFieldsValue
            let hiddenFields = payload.data.hiddenFieldsValue
            let dataId = payload.data.dataId
            let variables = payload.data.variables
            let result = payload.code == 0 ? true : false
            return {
                ...payload,
                status: payload.code,
                data: { ...payload.data, context: context, title: title, schemaContent: schemaContent, disFields: disFields, hiddenFields: hiddenFields, formValue: formValue, dataId: dataId, variables: variables, result: result }
            };
        },
    },
    "initFetchOn": "this.definitionId",
    "body": [{
        "type": "page",
        "initApi": {
            "method": "get",
            "url": useDevBaseUrl("/application/processManage/process/getStartVarConfig?processDefId=${definitionId}"),
            adaptor: function (payload:any) {
                return {
                    ...payload,
                    status: payload.code,
                    data: { ...payload.data, properties: payload?.data?.properties, required: payload?.data?.required }
                };
            },
        },
        "initFetchOn": "this.definitionId",
        body: [{
            id: "appRestart",
            "visibleOn": "${result}",
            children: ({ value, onChange, data }) => {
                return <AppRestartSchemaEngine context={data.__super.context} schemaContent={data.__super.schemaContent} disFields={data.__super.disFields} hiddenFields={data.__super.hiddenFields} dataId={data.__super.dataId} variables={data.__super.variables} schemaValue={data.__super.formValue} title={data.__super.title} value={value} properties={data.properties} required={data.required}/>
            }
        }],
    }],

}

export default () => <AMISComponent schema={schema} />;
