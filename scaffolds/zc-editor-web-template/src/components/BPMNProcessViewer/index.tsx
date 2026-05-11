import { useEffect, useRef, useState, } from 'react';
import { Modal, Row, Table, Radio, Tooltip, message, } from 'antd';
import { ZoomOutOutlined, ZoomInOutlined, CompressOutlined, } from '@ant-design/icons';
import React from 'react';
import './theme/index.scss';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import BpmnViewer from 'bpmn-js/lib/Viewer';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
const BPMNProcessViewer: React.FC = (props) => {
  
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dlgTitle, setDlgTitle] = useState(undefined);
  const [defaultZoom, setDefaultZoom] = useState(1);
  // 是否正在加载流程图
  const [isLoading, setIsLoading] = useState(false);
  const bpmnViewer = useRef(null)
  // 已完成流程元素
  const [processNodeInfo, setProcessNodeInfo] = useState({});
  // 当前任务id
  const [selectTaskId, setSelectTaskId] = useState(undefined);
  // 任务节点审批记录
  const [taskCommentList, setTaskCommentList] = useState([]);
  const processCanvasEL = useRef(null);
  const customSuccessDefs = useRef(null);
  const customFailDefs = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();
  let heightVal= props.height;
  // 表格
  const columns = [
    {
      title: '序号',
      dataIndex: 'id',
      render: (text, record, index) => index+1,
    },
    {
      title: '候选办理',
      dataIndex: 'candidate',
      key: 'candidate',
      render: (candidate) => <span>{candidate}</span>,
    },
    {
      title: '实际办理',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      render: (assigneeName) => <span>{assigneeName}</span>,
    },
    {
      title: '处理时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (createTime) => <span>{createTime}</span>,
    },
    {
      title: '办结时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (endTime) => <span>{endTime}</span>,
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => <span>{duration}</span>,
    },
    {
      title: '审批意见',
      dataIndex: 'commentList',
      key: 'fullMessage',
      render: (commentList) => (
        <span>
          {commentList?.slice()?.reverse()?.map((item) => (
            <div key={item.mo}>{item.fullMessage}</div>
          ))}
        </span>
      )
    },
  ];
  useEffect(() => {
    importXML(props.xml);
    // setProcessStatus(props.finishedInfo)
  }, []);
  useEffect(() => {
    // importXML(props.xml);
  }, [props.xml]);
  useEffect(() => {
    setTimeout(()=>{
      setProcessStatus(props.finishedInfo);
    }, 300)
  }, [props.finishedInfo]);
  //适应屏幕
  const processReZoom = () => {
    setDefaultZoom(1)
    bpmnViewer.current.get('canvas').zoom('fit-viewport', 'auto');
  }
  //放大
  const processZoomIn = (zoomStep = 0.1) => {
    let newZoom = Math.round(defaultZoom * 100 + 10) / 100;
    if (newZoom > 4) {
      return messageApi.open({
        type: 'error',
        content: '缩放比例已最大',
        className: 'custom-class',
        style: {
          marginTop: '5vh',
        },
      });
    }
    setDefaultZoom(newZoom)
    bpmnViewer.current.get('canvas').zoom(newZoom);
  }
  //缩小
  const processZoomOut = () => {
    let newZoom = Math.round(defaultZoom * 100 - 10) / 100;
    if (newZoom < 0.2) {
      return messageApi.open({
        type: 'error',
        content: '缩放比例已最小',
        className: 'custom-class',
        style: {
          marginTop: '5vh',
        },
      });
    }
    setDefaultZoom(newZoom)
    bpmnViewer.current.get('canvas').zoom(newZoom);
  }
   // 流程图预览清空
  const clearViewer = () => {
    if (processCanvasEL.current) {
      processCanvasEL.current.innerHTML = '';
    }
    if (bpmnViewer.current) {
      bpmnViewer.current.destroy();
    }
    bpmnViewer.current = null
  }
  // 添加自定义箭头
  const addCustomDefs = () => {
    const canvas = bpmnViewer.current?.get('canvas');
    const svg = canvas._svg;
    const customSuccessDefs1 = customSuccessDefs.current;
    const customFailDefs1 = customFailDefs.current;
    svg.appendChild(customSuccessDefs1);
    svg.appendChild(customFailDefs1);
  }
  // 任务悬浮弹窗
  const onSelectElement = (element: any) => {
    setSelectTaskId(undefined)
    setDlgTitle(undefined)
    let processNodeInfo = props.finishedInfo;
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
    setSelectTaskId(element.id)
    setDlgTitle(element.businessObject ? element.businessObject.name : undefined)
    // 计算当前悬浮任务审批记录，如果记录为空不显示弹窗
    setTaskCommentList((props.allCommentList || []).filter(item => {
      return item.activityId === element.id;
    }))
    setDialogVisible(true)
  }
  // 显示流程图
  const importXML = async (xml: any) => {
    clearViewer();
    if (xml !== null && xml !== '') {
      try {
        bpmnViewer.current =
          new BpmnViewer({
            additionalModules: [
              // 移动整个画布
              MoveCanvasModule,
            ],
            container: processCanvasEL.current,
          })
        // 任务节点悬浮事件
        bpmnViewer.current?.on('element.click', ({ element }) => {
          onSelectElement(element);
        });
        setIsLoading(true);
        await bpmnViewer.current.importXML(xml);
        addCustomDefs();
      } catch (e) {
        clearViewer();
      } finally {
        setIsLoading(false);
        if (processNodeInfo) {
          setProcessStatus(processNodeInfo);
        }
        setTimeout(() => {
          processReZoom()
        }, 1000);
      }
    }
  };
  // 设置流程图元素状态
  const setProcessStatus = (processNodeInfo: any) => {
    if (isLoading || processNodeInfo === null || bpmnViewer.current === null) return;
    let { finishedTaskSet, rejectedTaskSet, unfinishedTaskSet, finishedSequenceFlowSet, cancelTaskSet } = processNodeInfo;
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
    if (Array.isArray(cancelTaskSet)) {
      cancelTaskSet.forEach(item => canvas.addMarker(item, 'cancel'));
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
  const handleCancel = () => {
    setDialogVisible(false);
  };
  return (
    <>
    <div className="process-viewer" style={{height:heightVal}}>
      <div className="process-canvas" style={{height: '80%'}}  ref={processCanvasEL}></div>
      {/* 自定义箭头样式，用于成功状态下流程连线箭头 */}
      <svg>
        <defs ref={customSuccessDefs}>
          <marker id="sequenceflow-end-white-success" viewBox="0 0 20 20" refX="11" refY="10" markerWidth="10" markerHeight="10" orient="auto">
            <path className="success-arrow" d="M 1 5 L 11 10 L 1 15 Z" style={{strokeWidth: '1px',strokeLinecap: 'round', strokeDasharray: '10000, 1'}} />
          </marker>
          <marker id="conditional-flow-marker-white-success" viewBox="0 0 20 20" refX="-1" refY="10" markerWidth="10" markerHeight="10" orient="auto">
            <path className="success-conditional" d="M 0 10 L 8 6 L 16 10 L 8 14 Z" style={{strokeWidth: '1px', strokeLinecap: 'round', strokeDasharray: '10000, 1'}} />
          </marker>
        </defs>
      </svg>
      {/* 自定义箭头样式，用于失败状态下流程连线箭头 */}
      <svg>
        <defs ref={customFailDefs}>
          <marker id="sequenceflow-end-white-fail" viewBox="0 0 20 20" refX="11" refY="10" markerWidth="10" markerHeight="10" orient="auto">
            <path className="fail-arrow" d="M 1 5 L 11 10 L 1 15 Z" style={{strokeWidth: '1px', strokeLinecap: 'round', strokeDasharray: '10000, 1'}} />
          </marker>
          <marker id="conditional-flow-marker-white-fail" viewBox="0 0 20 20" refX="-1" refY="10" markerWidth="10" markerHeight="10" orient="auto">
            <path className="fail-conditional" d="M 0 10 L 8 6 L 16 10 L 8 14 Z" style={{strokeWidth: '1px', strokeLinecap: 'round', strokeDasharray: '10000, 1'}} />
          </marker>
        </defs>
      </svg>
      {contextHolder}
      {/* 已完成节点悬浮弹窗 */}
      <Modal title={dlgTitle || '审批记录'} open={dialogVisible}  footer={null} onCancel={handleCancel} width='770px'>
        <Row>
          <Table columns={columns} dataSource={taskCommentList} pagination={false}/>
        </Row>
      </Modal>
      <div style={{ position: "absolute", top: "0", left: "0", width: "100%", zIndex: "2" }}>
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
            <Tooltip title="适应屏幕">
              <Radio.Button size='small' onClick={processReZoom}><CompressOutlined /></Radio.Button>
            </Tooltip>
          </Radio.Group>
        </Radio.Group>
      </div>
    </div>
    </>
  );
}
export default BPMNProcessViewer;
