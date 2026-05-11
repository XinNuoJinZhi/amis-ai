import {service} from '@/utils/request';
import {Form} from 'antd';
import {filteredData} from './conditionBuilder';
import {render as amisRender, toast} from 'amis';
import {transformSelectAnyIn, reverseTransformSelectAnyIn} from '@/components/AntvModel/Content/components/DataScope';
import {isAppEnd} from '@/utils';
import {useDevBaseUrl} from '@/utils/util';
import {env as amisEnv} from '@/hooks/amis';

const DeleteRecord = (props) => {
  let conditionApi = isAppEnd() ? useDevBaseUrl('/application/entitymanage/table/getMetaColumnSelect') : useDevBaseUrl('/entitymanage/table/getMetaColumnSelect');
  const [form] = Form.useForm<{}>();
  // 筛选条件 简单模式
  const objectKeyChange = e => {
    if (e) {
      let aa = JSON.parse(JSON.stringify(e));
      let result = reverseTransformSelectAnyIn(aa);
      form.setFieldValue('filterCondition', result);
      props.data.onChange(transformSelectAnyIn(aa));
    } else if (props.data.data.filterCondition) {
      let aa = JSON.parse(JSON.stringify(props.data.data.filterCondition));
      let result = reverseTransformSelectAnyIn(aa);
      form.setFieldValue('filterCondition', result);
    }
  };
  return (
    <>
      <Form
        name="basic"
        initialValues={{remember: true}}
        form={form}
        autoComplete="off"
      >
        <Form.Item<FieldType> label="条件组件" name="filterCondition" style={{marginLeft: '-100px'}}>
          {amisRender(
            {
              type: 'service',
              body: [
                {
                  type: 'condition-builder',
                  name: 'filterCondition',
                  'source': {
                    'method': 'get',
                    'url': conditionApi,
                    'data': {
                      'tableKey': '${tableKey}'
                    },
                    adaptor: function(payload: any) {
                      let da = payload.data;
                      let arr = [];
                      let filtrationList = [6, 7, 8, 9];
                      for (let i in da) {
                        let obj = filtrationList.indexOf(da[i].systemFieldType) != -1 ? undefined : filteredData(da[i]);
                        if (obj != undefined) {
                          arr.push(obj);
                        }
                      }
                      if(payload.code != 0) {
                        toast.error(payload.msg, {
                            position: 'top-right'
                        });
                      }
                      return {
                        ...payload,
                        status: payload.code,
                        data: { ...payload.data, fields: arr }
                      };
                    }
                  },
                  onChange: (value: any) => {
                    objectKeyChange(value);
                  }
                }
              ]
            },
            {},
            {
              fetcher: service,
              theme: amisEnv.theme
            }
          )}
        </Form.Item>
      </Form>
    </>
  );
};
export default DeleteRecord;
