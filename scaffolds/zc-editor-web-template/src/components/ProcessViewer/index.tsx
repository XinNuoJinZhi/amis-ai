import { useEffect, useRef, useState, createRef } from 'react';
import { Button, Modal, Row, Table, Radio, Tooltip, message } from 'antd';
import { ZoomOutOutlined, ZoomInOutlined, CompressOutlined } from '@ant-design/icons';
// import '@/plugins/package/theme/index.scss';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import BpmnViewer from 'bpmn-js/lib/Viewer';
// import BpmnModeler from 'bpmn-js/lib/Modeler';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import { Svg, Defs, Marker, Path } from "react-svg";
import React from 'react';
import './index.css'
export default function ProcessViewer(props) {
  // console.log(props, '传参所得值props');
  // 全局提示
  const [messageApi, contextHolder] = message.useMessage();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dlgTitle, setDlgTitle] = useState(undefined);
  const [defaultZoom, setDefaultZoom] = useState(1);
  // 是否正在加载流程图
  const [isLoading, setIsLoading] = useState(false);
  // const [bpmnViewer, setBpmnViewer] = useState(undefined);
  // let bpmnViewer: any
  const bpmnViewer = useRef(undefined)
  // 已完成流程元素
  const [processNodeInfo, setProcessNodeInfo] = useState(undefined);
  // 当前任务id
  const [selectTaskId, setSelectTaskId] = useState(undefined);
  // 任务节点审批记录
  const [taskCommentList, setTaskCommentList] = useState([]);
  // 已完成任务悬浮延迟Timer
  const [hoverTimer, setHoverTimer] = useState(null);
  // 图dom
  const processCanvas = createRef();
  const customSuccessDefs = useRef();
  const customFailDefs = useRef();
  // 表格
  const columns = [
    // const columns: ColumnsType<DataType> = [
    {
      title: '序号',
      dataIndex: 'key',
      rowScope: 'row',
    },
    {
      title: '候选办理',
      dataIndex: 'candidate',
      key: 'candidate',
      render: (candidate) => <a>{candidate}</a>,
    },
    {
      title: '实际办理',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      render: (assigneeName) => <a>{assigneeName}</a>,
    },
    {
      title: '处理时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (createTime) => <a>{createTime}</a>,
    },
    {
      title: '办结时间',
      dataIndex: 'finishTime',
      key: 'finishTime',
      render: (finishTime) => <a>{finishTime}</a>,
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => <a>{duration}</a>,
    },
    {
      title: '审批意见',
      dataIndex: 'fullMessage',
      key: 'fullMessage',
      render: (fullMessage) => <a>{fullMessage}</a>,
    },
  ]
  useEffect(() => {
    // setTimeout(() => {
    importXML(props.xml);
    // }, 10000);
  }, [props.xml]);
  useEffect(() => {
    if (props.finishedInfo) {
      setProcessStatus(props.finishedInfo);
    }
  }, [props.finishedInfo]);
  const processReZoom = () => {
    // this.defaultZoom = 1;
    setDefaultZoom(1)
    bpmnViewer.current.get('canvas').zoom('fit-viewport', 'auto');
  }
  const processZoomIn = (zoomStep = 0.1) => {
    let newZoom = Math.round(defaultZoom * 100 + 10) / 100;
    // let newZoom = Math.floor(defaultZoom * 100 + 10) / 100;
    if (newZoom > 4) {
      // throw new Error('[Process Designer Warn ]: The zoom ratio cannot be greater than 4');
      return messageApi.open({
        type: 'error',
        content: '缩放比例已最大',
      });
    }
    console.log(newZoom, 'newZoomnewZoomnewZoomnewZoomnewZoom')
    // this.defaultZoom = newZoom;
    setDefaultZoom(newZoom)
    // bpmnViewer.get('canvas').zoom(defaultZoom);
    bpmnViewer.current.get('canvas').zoom(newZoom);
  }
  const processZoomOut = (zoomStep = 0.1) => {
    let newZoom = Math.round(defaultZoom * 100 - 10) / 100;
    // let newZoom = Math.floor(defaultZoom * 100 - zoomStep * 100) / 100;
    if (newZoom < 0.2) {
      // throw new Error('[Process Designer Warn ]: The zoom ratio cannot be less than 0.2');
      return messageApi.open({
        type: 'error',
        content: '缩放比例已最小',
      });
    }
    // console.log(newZoom,'newZoomnewZoomnewZoomnewZoom')
    // this.defaultZoom = newZoom;
    setDefaultZoom(newZoom)
    // bpmnViewer.get('canvas').zoom(defaultZoom);
    console.log(bpmnViewer, 'bpmnViewerbpmnViewerbpmnViewerbpmnViewerbpmnViewer')
    bpmnViewer.current.get('canvas').zoom(newZoom);
  }
  // 添加自定义箭头
  const addCustomDefs = () => {
    const canvas = bpmnViewer.current?.get('canvas');
    console.log(canvas, 'canvascanvascanvas')
    const svg = canvas._svg;
    const customSuccessDefs = customSuccessDefs.current;
    const customFailDefs = customFailDefs.current;
    svg.appendChild(customSuccessDefs);
    svg.appendChild(customFailDefs);
  }
  // 流程图预览清空
  const clearViewer = () => {
    console.log(processCanvas, 'processCanvasprocessCanvas')
    if (processCanvas.current) {
      processCanvas.current.innerHTML = '';
    }
    // if (this.$refs.processCanvas) {
    //   this.$refs.processCanvas.innerHTML = '';
    // }
    if (bpmnViewer.current) {
      bpmnViewer.current.destroy();
    }
    // bpmnViewer = null;
    // setBpmnViewer(null)
    bpmnViewer.current = null
  }
  // 任务悬浮弹窗
  const onSelectElement = (element: any) => {
    // this.selectTaskId = undefined;
    // this.dlgTitle = undefined;
    setSelectTaskId(undefined)
    setDlgTitle(undefined)

    if (processNodeInfo == null){
      return
    }
    if (element == null){
      return
    }
    if (processNodeInfo.finishedTaskSet == null || processNodeInfo.cancelTaskSet == null) {
      return
    };
    if (!(processNodeInfo.finishedTaskSet.indexOf(element.id) != -1 || processNodeInfo.cancelTaskSet.indexOf(element.id) != -1)) {
      return;
    }

    // this.selectTaskId = element.id;
    setSelectTaskId(element.id)
    // this.dlgTitle = element.businessObject ? element.businessObject.name : undefined;
    setDlgTitle(element.businessObject ? element.businessObject.name : undefined)
    // 计算当前悬浮任务审批记录，如果记录为空不显示弹窗
    // this.taskCommentList = (this.allCommentList || []).filter(item => {
    setTaskCommentList((props.allCommentList || []).filter(item => {
      return item.activityId === selectTaskId;
    }))
    // this.dialogVisible = true;
    setDialogVisible(true)
  }
  // 显示流程图
  const importXML = async (xml: any) => {
    clearViewer();
    // console.log(xml, 'xmlxmlxmlxmlxmlxml')
    if (xml !== null && xml !== '') {
      try {
        console.log(processCanvas.current, 'processCanvasprocessCanvas')
        console.log(document.getElementById('canvas'), "document.getElementById('canvas')")
        bpmnViewer.current =
          new BpmnViewer({
            // new BpmnModeler({
            additionalModules: [
              // 移动整个画布
              MoveCanvasModule,
            ],
            // container: processCanvas.current,
            // container: document.getElementById('canvas'),
            container: "#canvas",
            keyboard: { bindTo: document },
            // container: processCanvas,
            // container: this.$refs.processCanvas,
            // height: '50vh',
            height: '70vh',
            bpmnRenderer: {}
          })
        console.log(bpmnViewer, 'bpmnViewerbpmnViewerbpmnViewerbpmnViewer')
        setTimeout(() => {          
        setDefaultZoom(1)
        bpmnViewer.current.get('canvas').zoom('fit-viewport', 'auto');
        }, 10);
        // bpmnViewer = new BpmnViewer({
        //   additionalModules: [
        //     // 移动整个画布
        //     MoveCanvasModule
        //   ],
        //   container: this.$refs.processCanvas,
        // });
        // 任务节点悬浮事件
        bpmnViewer.current?.on('element.click', ({ element }) => {
          onSelectElement(element);
        });

        // isLoading = true;
        setIsLoading(true);
        bpmnViewer.current.importXML(xml);
        // await bpmnViewer?.importXML(xml);
        // addCustomDefs();
      } catch (e) {
        clearViewer();
      } finally {
        // isLoading = false;
        setIsLoading(false);
        if (processNodeInfo) {
          setProcessStatus(processNodeInfo);
        }
      }
    }
  };
  // 设置流程图元素状态
  const setProcessStatus = (processNodeInfo: any) => {
    console.log(processNodeInfo, 'processNodeInfoprocessNodeInfoprocessNodeInfoprocessNodeInfoprocessNodeInfo')
    // this.processNodeInfo = processNodeInfo;
    setProcessNodeInfo(processNodeInfo);
    if (isLoading || processNodeInfo === null || bpmnViewer.current === null) return;
    let { finishedTaskSet, rejectedTaskSet, unfinishedTaskSet, finishedSequenceFlowSet } =
      processNodeInfo;
    const canvas = bpmnViewer.current?.get('canvas');
    const elementRegistry = bpmnViewer.current?.get('elementRegistry');
    if (Array.isArray(finishedSequenceFlowSet)) {
      finishedSequenceFlowSet.forEach((item) => {
        if (item !== null) {
          canvas.addMarker(item, 'success');
          let element = elementRegistry.get(item);
          const conditionExpression = element.businessObject.conditionExpression;
          if (conditionExpression) {
            canvas.addMarker(item, 'condition-expression');
          }
        }
      });
    }
    if (Array.isArray(finishedTaskSet)) {
      finishedTaskSet.forEach((item) => canvas.addMarker(item, 'success'));
    }
    if (Array.isArray(unfinishedTaskSet)) {
      unfinishedTaskSet.forEach((item) => canvas.addMarker(item, 'primary'));
    }
    if (Array.isArray(rejectedTaskSet)) {
      rejectedTaskSet.forEach((item) => {
        if (item !== null) {
          let element = elementRegistry.get(item);
          if (element.type.includes('Task')) {
            canvas.addMarker(item, 'danger');
          } else {
            canvas.addMarker(item, 'warning');
          }
        }
      });
    }
  }

  return (
    <>
      {/* <div class="process-canvas" style="height: 100%;" ref="processCanvas" v-show="!isLoading" /> */}
      {/* <div className="process-canvas" ref={processCanvas.current} /> */}
      <div className="process-canvas" id='canvas'
        style={{
          background: "url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlMGUwZTAiIG9wYWNpdHk9Ii4yIi8+PHBhdGggZD0iTTQwIDBIMHY0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTBlMGUwIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+) repeat !important"
        }} />
      {/* 自定义箭头样式，用于成功状态下流程连线箭头 */}
      {/* <Defs ref={customSuccessDefs.current}>
        <Marker id="sequenceflow-end-white-success" viewBox="0 0 20 20" refX="11" refY="10" markerWidth="10" markerHeight="10" orient="auto">
          <Path className="success-arrow" d="M 1 5 L 11 10 L 1 15 Z" style={{strokeWidth: "1px", strokeLinecap: "round", strokeDasharray: "10000, 1"}}></Path>
        </Marker>
        <Marker id="conditional-flow-marker-white-success" viewBox="0 0 20 20" refX="-1" refY="10" markerWidth="10" markerHeight="10" orient="auto">
          <Path className="success-conditional" d="M 0 10 L 8 6 L 16 10 L 8 14 Z" style={{strokeWidth: "1px", strokeLinecap: "round", strokeDasharray: "10000, 1"}}></Path>
        </Marker>
      </Defs> */}
      {/* 自定义箭头样式，用于失败状态下流程连线箭头 */}
      {/* <defs ref={customFailDefs.current}>
        <marker id="sequenceflow-end-white-fail" viewBox="0 0 20 20" refX="11" refY="10" markerWidth="10" markerHeight="10" orient="auto">
          <Path className="fail-arrow" d="M 1 5 L 11 10 L 1 15 Z" style={{strokeWidth: "1px", strokeLinecap: "round", strokeDasharray: "10000, 1"}}></Path>
        </marker>
        <marker id="conditional-flow-marker-white-fail" viewBox="0 0 20 20" refX="-1" refY="10" markerWidth="10" markerHeight="10" orient="auto">
          <Path className="fail-conditional" d="M 0 10 L 8 6 L 16 10 L 8 14 Z" style={{strokeWidth: "1px", strokeLinecap: "round", strokeDasharray: "10000, 1"}}></Path>
        </marker>
      </defs> */}
      {contextHolder}
      <Modal title={dlgTitle || '审批记录'} open={dialogVisible}>
        {/* <Modal title={dlgTitle || '审批记录'} open={dialogVisible}  onOk={handleOk} onCancel={handleCancel}> */}
        <Row>
          <Table columns={columns} dataSource={taskCommentList} />
        </Row>
      </Modal>
      <div style={{ position: "absolute", top: "10%", left: "30px", width: "100%", zIndex: "9999" }}>
        <Radio.Group>
          <Radio.Group>
            <Tooltip title="缩小">
              <Radio.Button size='small' onClick={processZoomOut}>
                <ZoomOutOutlined />
              </Radio.Button>
            </Tooltip>
            <Radio.Button size='small'>{Math.floor(defaultZoom * 10 * 10) + "%"}</Radio.Button>
            <Tooltip title="放大">
              <Radio.Button size='small' onClick={processZoomIn}><ZoomInOutlined /></Radio.Button>
            </Tooltip>
            <Tooltip title="重置位置及居中">
              <Radio.Button size='small' onClick={processReZoom}><CompressOutlined /></Radio.Button>
            </Tooltip>
          </Radio.Group>
        </Radio.Group>
      </div>
      <div>
      </div>
    </>
  );
}
