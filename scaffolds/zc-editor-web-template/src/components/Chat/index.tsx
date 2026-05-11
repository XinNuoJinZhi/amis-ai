import {service} from '@/utils/request';
import { history } from '@umijs/max';
import bus from '@/utils/bus';
import React from 'react';
import {AIHelper} from 'amis';
import {getParsedInfraConfigValueByKey, watchInfraConfigStore} from '@/store/infraConfig';
import {hasPermission, watchPermStore} from '@/store/permission';
import {isEditorialEnd} from '@/utils';
import {baseURL, AIDebug, testMode} from '@/utils/env'

const aiHelperDebug = AIDebug

export class Chat extends React.Component<any, any> {
  constructor(props: any) {
    super(props)

  }
  state = {
    sceneOptions: testMode ? [
      {
        label: '页面管理',
        value: '/app/design/pageManage/edit',
        type: 'page',
        useFetch: true,
        sseStreamingFill: false,
        api: {
          'url': `${baseURL}/dev-api/app/ai/page/generate_page/stream`
        }
      },
      {
        label: '实体管理',
        value: '/app/design/entityManage',
        type: 'entity',
        api: {
          'url': `${baseURL}/dev-api/app/ai/entity/generate_entity`
        }
      },
      {
        label: '智能问答',
        value: 'Q&A',
        type: 'Q&A',
        useFetch: true,
        api: {
          'url': `${baseURL}/dev-api/app/ai/chat/stream`
        }
      }
    ] : [
      {
        label: '智能问答',
        value: 'Q&A',
        type: 'Q&A',
        useFetch: true,
        api: {
          'url': `${baseURL}/dev-api/app/ai/chat/stream`
        }
      }
    ],
    initBallPosition: {
      x: 10,
      y: window.innerHeight * 0.8,
    },
    showStatus: false
  };

  unsubscribeStore: any = null;

  async componentDidMount() {
    window.addEventListener('resize', () => {
      this.setState({
        initBallPosition: {
          x: 10,
          y: window.innerHeight * 0.8,
        }
      });
    });

    this.setupInfraConfigListener();
    this.setupPermStoreListener();
    this.updateShowStatus();
  }

  setupInfraConfigListener() {
    this.unsubscribeStore = watchInfraConfigStore((newState: any) => {
      this.updateShowStatus();
    });
  }

  setupPermStoreListener() {
    this.unsubscribeStore = watchPermStore((newState: any) => {
      this.updateShowStatus();
    });
  }

  updateShowStatus() {
    const infraConfigValue = getParsedInfraConfigValueByKey('AIHelper');
    const params = new URLSearchParams(window.location.search);
    const noAIHelper = params.get('noAIHelper');

    if (infraConfigValue !== null) {
      const permissionEnable = isEditorialEnd()
          ? hasPermission('devApp:AIHelper:gen')
          : hasPermission('app:AIHelper:gen');

      this.setState({ showStatus: infraConfigValue?.enable && permissionEnable && !noAIHelper });
    }
  }

  componentWillUnmount() {
    // 清理订阅
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
  }

  componentDidUpdate(prevProps: any) {

  }

  render() {
    const { sceneOptions,initBallPosition , showStatus} = this.state;
    const excludeRouterPath = ['/app/design/pageManage/chart','/app/process/handleTask', '/app/process/submitData']
    const showAI = excludeRouterPath.includes(window.location.pathname)
    return (
        !showAI && showStatus && <AIHelper
            env={{
              fetcher: service,
              theme: 'antd'
            } as any}
            initBallPosition={initBallPosition}
            history={history as any}
            onChange={(value) => {
              bus.emit('chat-change', {value:value,onlineId:sessionStorage.getItem('onlineId')})
            }}
            onSubmit={(value) => {
              bus.emit('chat-submit', {value:value,onlineId:sessionStorage.getItem('onlineId')})
            }}
            onBeforeRequest={(value) => {
              bus.emit('chat-beforeRequest', {value:value,onlineId:sessionStorage.getItem('onlineId')})
            }}
            sceneOptions={sceneOptions}
            debug={aiHelperDebug as boolean}
        />
    )
  }
}
