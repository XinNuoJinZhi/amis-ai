import React, {useEffect, useState} from 'react';
import {Checkbox, Form} from 'antd';
import type {GetProp} from 'antd';
interface IProps {
  businessObject: any;
}

/**
 * 流程操作设置 组件
 *
 * @param props
 * @constructor
 */
export default function ElementSettings(props: IProps) {
  // props
  const {businessObject} = props;
  // 多选默认值
  const [checkboxDefault, setCheckboxDefault] = useState([]);
  console.log(props, 'props');
  console.log(businessObject, 'businessObject');
  // 初始化
  useEffect(() => {
    if (businessObject) {
      initPageData();
    }
  }, [businessObject?.id]);
  const options = [
    {label: '抄送', value: 'cc'},
    {label: '通过', value: 'pass'},
    {label: '委派', value: 'delegate'},
    {label: '转办', value: 'transfer'},
    {label: '退回', value: 'back'},
    {label: '拒绝', value: 'stop'}
  ];

  const onChange = e => {
    console.log(e,'多选数据变化')
    setCheckboxDefault(e);
    window.bpmnInstance.modeling.updateProperties(
      window.bpmnInstance.element,
      {
        processOperationSettings: businessObject.$type == 'bpmn:UserTask' ? JSON.stringify(e) : undefined
      }
    );
  };
  /**
   * 初始化页面数据
   */
  function initPageData() {
    if (businessObject.processOperationSettings) {
      setCheckboxDefault(JSON.parse(businessObject.processOperationSettings))
    } else {
      setCheckboxDefault([
        'cc',
        'pass',
        'delegate',
        'transfer',
        'back',
        'stop'
      ]);
      window.bpmnInstance.modeling.updateProperties(
        window.bpmnInstance.element,
        {
          processOperationSettings:businessObject.$type == 'bpmn:UserTask' ? JSON.stringify([
            'cc',
            'pass',
            'delegate',
            'transfer',
            'back',
            'stop'
          ]) : undefined
        }
      );
    }
  }

  return (
    <>
    <span style={{color:'red'}}>*</span>
    流程操作设置：
      <Checkbox.Group
        options={options}
        value={checkboxDefault}
        onChange={onChange}
      />
    </>
  );
}
