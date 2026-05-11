import React, { useState, useEffect, useRef } from 'react';
import imgSrc from '@/assets/imgs/avatar.gif'
import { history } from '@umijs/max';
import { formatDate } from "@/utils/util"
const MessageInfo: React.FC = (props: any) => {
  const goMessageRoute = (item:any)=>{
    const param = new URLSearchParams(window.location.search);
    const appid = param.get('appid');
    const env = param.get('env');
    const portalKey = param.get('portalKey');
    if(window.location.pathname.indexOf("/app/design") > -1){
      //编辑端
    } else {
      //应用端
      let params = item.routeParams;
      let url = '';
      if(params){
          params.ccIdentification = params.ccIdentification ? params.ccIdentification : false
          if(params.taskId){
            url = '/app/processDetail'+'?appid='+appid+'&env='+env+'&procInsId='+params.procInsId+'&processed='+params.processed+'&taskId='+params.taskId+'&ccIdentification='+params.ccIdentification + (portalKey ? '&portalKey=' + portalKey : '');
          } else {
            url = '/app/processDetail'+'?appid='+appid+'&env='+env+'&procInsId='+params.procInsId+'&processed='+params.processed+'&taskId='+'&ccIdentification='+params.ccIdentification + (portalKey ? '&portalKey=' + portalKey : '');
          }
      } else {
        url = '/app/processDetail'+'?appid='+appid+'&env='+env + (portalKey ? '&portalKey=' + portalKey : '');
      }
      history.push(url)
      document.getElementsByClassName('myMessage')[0].style.display = 'none';
    }
  }
  let data = props.data;
  return (
      <>
      <div>
      {
        data.items.map((item,i) =><div className="message-list" key={i}>
          <div className={(i === data.items.length - 1) ? 'message-item-noBorder' : 'message-item'}>
            {
              item.appIcon != null && item.appIcon !== '' ?
              <img alt="" className="message-icon" src={item.appIcon} />
              :
              <img alt="" className="message-icon" src={imgSrc} />
            }
            <div className="message-content">
              {
                item.routePath != null && item.routePath !== '' ?
                <a className="message-title"  onClick={()=>goMessageRoute(item)}>
                    { item.templateNickname }：{item.templateContent }
                </a>
                :
                <div className="message-title">
                    { item.templateNickname }：{item.templateContent }
                </div>
              }
              <span className="message-date">
                  { formatDate(item.createTime) }
              </span>
            </div>
          </div>
        </div>
      )
      }
      </div>
      </>
  )
}

export default MessageInfo;

