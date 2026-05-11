import React,{useEffect,useState} from 'react';
import { Provider } from 'react-redux';
import { Collapse, Space, Typography } from 'antd';
import { store } from '@/redux/store/store';
import ElementBaseInfo from '@/bpmn/panel/ElementBaseInfo/ElementBaseInfo';

import ElementDocument from '@/bpmn/panel/ElementDocument/ElementDocument';
import ExtensionProperties from '@/bpmn/panel/ExtensionProperties/ExtensionProperties';
import SignalMessage from '@/bpmn/panel/SignalMessage/SignalMessage';
import ElementListener from '@/bpmn/panel/ElementListener/ElementListener';
import ElementTask from '@/bpmn/panel/ElementTask/ElementTask';
import MultiInstance from '@/bpmn/panel/MultiInstance/MultiInstance';
import ElementForm from '@/bpmn/panel/ElementForm/ElementForm';
import ElementTime from '@/bpmn/panel/ElementTime/ElementTime';
import {
  BellOutlined,
  DeploymentUnitOutlined,
  FileOutlined,
  FileTextOutlined,
  FireOutlined,
  InfoCircleOutlined,
  NodeIndexOutlined,
  RetweetOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import FlowCondition from '@/bpmn/panel/FlowCondition/FlowCondition';
import { useAppSelector } from '@/redux/hook/hooks';

interface IProps {
  businessObject: any;
}
export default function ProcessModels(props: IProps) {
  console.log(props,'判断右侧显示隐藏')
  console.log(window,'windowwindowwindowwindow')

const colorPrimary = useAppSelector((state) => state.theme.colorPrimary);

/**
   * 渲染 常规信息 组件
   * 1、所有节点都有
   */
function renderElementBaseInfo() {
  return (
    <Collapse.Panel
      header={
        <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
          <InfoCircleOutlined twoToneColor={colorPrimary} />
          &nbsp;常规信息
        </Typography>
      }
      key={1}
      // // style={{ backgroundColor: '#FFF' }}
      showArrow={true}
      forceRender={false}
    >
      <ElementBaseInfo businessObject={props?.businessObject?.businessObjects} />
    </Collapse.Panel>
  );
}

/**
 * 渲染 流转条件 组件
 */
function renderFlowCondition() {
  let conditionFormVisible: boolean = !!(
    (props?.businessObject?.element?.type.split(":")[1] || "") === 'bpmn:SequenceFlow' &&
    // props?.businessObject?.element?.type === 'bpmn:SequenceFlow' &&
    props?.businessObject?.element.source &&
    props?.businessObject?.element.source?.type?.indexOf('StartEvent') === -1
  );
  if (conditionFormVisible) {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
            <RetweetOutlined twoToneColor={colorPrimary} />
            &nbsp;流转条件
          </Typography>
        }
        key={12}
        // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <FlowCondition businessObject={props?.businessObject?.businessObjects} />
      </Collapse.Panel>
    );
  }
}

/**
 * 渲染 消息与信号 组件
 * 1、只有 Process 有
 */
function renderSignalMessage() {
  if (props?.businessObject?.element?.type === 'bpmn:Process') {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
            <SoundOutlined twoToneColor={colorPrimary} />
            &nbsp;消息与信号
          </Typography>
        }
        key={3}
        // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <SignalMessage businessObject={props?.businessObject?.businessObjects} />
      </Collapse.Panel>
    );
  }
}

/**
 * 渲染 开始事件 组件
 * 1、只有 UserTask 或 StartEvent 有
 */
function renderElementTime() {
  if (
    (props?.businessObject?.element?.type.split(":")[1] || "") === "StartEvent"
  ) {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
            <FileTextOutlined twoToneColor={colorPrimary} />
            &nbsp;开始事件
          </Typography>
        }
        key={4}
        // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <ElementTime businessObject={props?.businessObject?.businessObjects} />
      </Collapse.Panel>
    );
  }
}

/**
 * 渲染 表单 组件
 * 1、只有 UserTask 或 StartEvent 有
 */
function renderElementForm() {
  if (
    // props?.businessObject?.element?.type === 'bpmn:Task' ||
    // props?.businessObject?.element?.type === 'bpmn:UserTask' ||
    // props?.businessObject?.element?.type === 'bpmn:StartEvent'
    (props?.businessObject?.element?.type.split(":")[1] || "") === "UserTask"||
    (props?.businessObject?.element?.type.split(":")[1] || "") === "StartEvent"
  ) {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
            <FileTextOutlined twoToneColor={colorPrimary} />
            &nbsp;表单
          </Typography>
        }
        key={4}
        // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <ElementForm businessObject={props?.businessObject?.businessObjects} />
      </Collapse.Panel>
    );
  }
}

/**
 * 渲染 任务 组件
 * 1、所有 Task 类节点都有
 */
function renderElementTask() {
  if ((props?.businessObject?.element?.type.split(":")[1] || "").indexOf('Task') !== -1) {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
            <FireOutlined twoToneColor={colorPrimary} />
            &nbsp;{'任务'}
          </Typography>
        }
        key={5}
        // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <ElementTask businessObject={props?.businessObject?.businessObjects} />
      </Collapse.Panel>
    );
  }
}

/**
 * 渲染 多实例 组件
 * 1、所有 Task 类节点都有
 */
function renderMultiInstance() {
  if ((props?.businessObject?.element?.type.split(":")[1] || "").indexOf('Task') !== -1
  &&
  // ||
  //  (props?.businessObject?.element?.type.split(":")[1] || "").indexOf('UserTask')!== -1) {
    props?.businessObject?.element?.type !== 'bpmn:UserTask') {
  // if (props?.businessObject?.element?.type.indexOf('bpmn:Task') !== -1 && props?.businessObject?.element?.type.indexOf('bpmn:UserTask')!== -1) {
  // if ((props?.businessObject?.element?.type.split(":")[1] || "").indexOf('Task') !== -1) {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
            <DeploymentUnitOutlined twoToneColor={colorPrimary} />
            &nbsp;多实例
          </Typography>
        }
        key={6}
        // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <MultiInstance businessObject={props?.businessObject?.businessObjects} />
      </Collapse.Panel>
    );
  }
}

/**
 * 渲染 执行监听器 组件
 * 1、所有节点都有
 */
function renderExecutionListener() {
  return (
    <Collapse.Panel
      header={
        <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
          <BellOutlined twoToneColor={colorPrimary} />
          &nbsp;执行监听器
        </Typography>
      }
      key={7}
      // style={{ backgroundColor: '#FFF' }}
      showArrow={true}
      forceRender={false}
    >
      <ElementListener businessObject={props?.businessObject?.businessObjects} isTask={false} />
    </Collapse.Panel>
  );
}

/**
 * 渲染 任务监听器 组件
 * 1、只有 UserTask 才有
 */
function renderTaskListener() {
  // if (props?.businessObject?.element?.type === 'bpmn:Task') {
  if ((props?.businessObject?.element?.type.split(":")[1] || "").indexOf('UserTask') !== -1) {
  // if (props?.businessObject?.element?.type === 'bpmn:UserTask') {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
            <BellOutlined twoToneColor={colorPrimary} />
            &nbsp;任务监听器
          </Typography>
        }
        key={8}
        // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <ElementListener businessObject={props?.businessObject?.businessObjects} isTask={true} />
      </Collapse.Panel>
    );
  }
}

/**
 * 渲染 扩展属性 组件
 * 1、所有节点都有
 */
function renderExtensionProperties() {
  return (
    <Collapse.Panel
      header={
        <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
          <NodeIndexOutlined twoToneColor={colorPrimary} />
          &nbsp;扩展属性
        </Typography>
      }
      key={10}
      // style={{ backgroundColor: '#FFF' }}
      showArrow={true}
      forceRender={false}
    >
      <ExtensionProperties businessObject={props?.businessObject?.businessObjects} />
    </Collapse.Panel>
  );
}

/**
 * 渲染 其它属性(元素文档) 组件
 * 1、所有节点都有
 */
function renderElementOtherInfo() {
  return (
    <Collapse.Panel
      header={
        <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
          <FileOutlined twoToneColor={colorPrimary} />
          &nbsp;其他
          {/* &nbsp;元素文档 */}
        </Typography>
      }
      key={11}
      // style={{ backgroundColor: '#FFF' }}
      showArrow={true}
      forceRender={false}
    >
      <ElementDocument businessObject={props?.businessObject?.businessObjects} />
    </Collapse.Panel>
  );
}
  console.log(props,'propspropspropspropsprops1111111')
  return (
    <Provider  store={store}>
   {/* <ElementBaseInfo businessObject={props?.businessObject}/>
    */}
    <>
      <Space direction="vertical" size={0} style={{ display: 'flex' }}>
        <Collapse
          bordered={false}
          expandIconPosition={'end'}
          /* accordion为true时只展示一个面板 */
          accordion={false}
          defaultActiveKey={['1']}
          destroyInactivePanel={true}
        >
          {renderElementBaseInfo()}
          {renderFlowCondition()}
          {renderSignalMessage()}
          {renderElementForm()}
          {renderElementTime()}
          {renderElementTask()}
          {renderMultiInstance()}
          {renderExecutionListener()}
          {renderTaskListener()}
          {renderExtensionProperties()}
          {renderElementOtherInfo()}
        </Collapse>
      </Space>
    </>
    </Provider>
  )
}
