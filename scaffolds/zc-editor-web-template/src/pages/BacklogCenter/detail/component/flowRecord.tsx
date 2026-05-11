import React  from 'react';
import { Timeline, Divider, Tag,  } from 'antd';
import {formatDate} from '@/utils/util'
import axios from 'axios';
const FlowRecord: React.FC = (props) => {
  let listData = props.historyProcNodeList;
  const approveTypeTag = (val:any) => {
    switch (val) {
      case '1': return 'success'
      case '2': return 'warning'
      case '3': return 'error'
      case '4': return 'processing'
      case '5': return 'success'
      case '6': return 'error'
      case '7': return 'default' 
      case '8': return 'processing'
      case '9': return 'default'
      case '10': return 'success'
      case '11': return 'error'
      case '12': return 'success'
      case '13': return 'default'
      case '14': return 'default'
      case '15': return 'success'
      case '16': return 'default'
      case '17': return 'default'
    }
  };
  const commentType = (val:any) => {
    switch (val) {
      case '1': return '通过'
      case '2': return '退回'
      case '3': return '驳回'
      case '4': return '委派'
      case '5': return '转办'
      case '6': return '终止'
      case '7': return '撤回'
      case '8': return '委派通过'
      case '9': return '指定下一节点操作人'
      case '10': return '跳过'
      case '11': return '挂起'
      case '12': return '激活'
      case '13': return '添加办理人'
      case '14': return '删除办理人'
      case '15': return '提交'
      case '16': return '暂存'
      case '17': return '抄送'
    }
  };
  //下载附件
  const downloadFile = (file: {
    fileName: string,
    file: string
  }) =>{
    const filename = file.fileName
    const interceptService = axios.create();
    interceptService.get(file.file, {
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
      },
      'responseType': 'blob'
    }).then(function (response) {
        const blob = new Blob([response.data]);
        const fileName = filename;
        const linkNode = document.createElement('a');
        linkNode.download = fileName;
        linkNode.style.display = 'none';
        linkNode.href = URL.createObjectURL(blob);
        document.body.appendChild(linkNode);
        linkNode.click();
        URL.revokeObjectURL(linkNode.href);
        document.body.removeChild(linkNode);
    }).catch(function (error) {
        console.log(error);
    });
  }
  return (
    <div style={{ border: '1px solid white'}}>
      <div style={{width: '100%',marginBottom: '20px'}}>
        <div>
          <Timeline
            items={listData && listData.map((item:any) => {
              let color1 = item.endTime ? '#2bc418' : '#b3bdbb';
              return(
              {
                color: color1,
                children: (
                  <>
                    <p className='flowRecord'>{item.activityName}</p>
                    {item.activityType === 'startEvent' && <div style={{border:'1px solid #e5e7eb',padding:'20px'}}  className='flowRecord'> { item.assigneeName } 在 { item.createTime } 发起流程</div>}
                    {item.activityType === 'serviceTask' && (<div style={{border:'1px solid #e5e7eb',padding:'20px'}}  className='flowRecord'> 
                    <span style={{marginRight: '16px'}}>任务创建时间</span><span style={{paddingRight: '50px'}}> { item.createTime || '-' }</span>
                    <span style={{marginRight: '16px'}}>任务结束时间 </span> <span style={{paddingRight: '50px'}}>{ item.endTime || '-' } </span>
                    <span style={{marginRight: '16px'}}>耗时</span> { item.duration || '-' }
                    </div>)}
                    {item.activityType === 'userTask' && (<div style={{border:'1px solid #e5e7eb',padding:'20px'}}  className='flowRecord'> 
                    <span style={{marginRight: '16px'}}>实际办理 </span><span style={{paddingRight: '50px'}}> { item.assigneeName || '-' }</span>
                    <span style={{marginRight: '16px'}}>候选办理 </span> <span style={{paddingRight: '50px'}}> { item.candidate || '-' }</span> 
                    <span style={{marginRight: '16px'}}>接收时间</span><span style={{paddingRight: '50px'}}> { item.createTime || '-' }</span>
                    <span style={{marginRight: '16px'}}>办结时间 </span> <span style={{paddingRight: '50px'}}>{ item.endTime || '-' } </span>
                    <span style={{marginRight: '16px'}}  className='flowRecord'>耗时</span> { item.duration || '-' }
                    {item.approvalFile && item.approvalFile.length > 0 && <div style={{marginTop: '12px',}}  className='flowRecord'>
                      {item.approvalFile.map((i:any) => {
                        return(
                          <a  className='flowRecord' onClick={()=>downloadFile(i)}>{i.fileName}</a>
                        )
                      })}
                    </div>}
                    {item.commentList && item.commentList.length > 0 && <div>
                      {item.commentList.map((comment:any) => {
                        return(
                          <div className='flowRecord'>
                            <Divider orientation="left"><Tag color={approveTypeTag(comment.type)}>{commentType(comment.type)}</Tag><Tag color="default"  className='flowRecord'>{formatDate(comment.time)}</Tag></Divider>
                            <span >{ comment.fullMessage }</span>
                          </div>
                        )
                      })}
                    </div>}
                    </div>)}
                    {item.activityType === 'endEvent' && <div style={{border:'1px solid #e5e7eb',padding:'20px'}}  className='flowRecord'> { item.createTime } 结束流程</div>}
                  </>
                ),
              })
            })
          }
          />
        </div>
      </div>
    </div>
  )
}
export default FlowRecord;
