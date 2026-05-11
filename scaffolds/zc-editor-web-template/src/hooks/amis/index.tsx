import {render as renderAmis, toast, ToastComponent, AlertComponent} from 'amis';
import React, { useState, useEffect, Suspense, lazy, useCallback, useMemo  } from 'react';
import { Button, Result, Spin } from 'antd';
import axios from 'axios';
import {service} from "@/utils/request";
import {store} from '@/store/editor';
import copy from 'copy-to-clipboard';
import qs from 'qs';
import {match} from 'path-to-regexp'
import {isEditorialEnd} from "@/utils";
import {appId, envId, portalKey} from '@/utils/env'
import {history} from '@umijs/max';
// Font Awesome CSS 已在 app.tsx 中全局导入，此处无需重复
// import 'amis/lib/themes/cxd.css';
import 'amis/lib/themes/antd.css';
import 'amis/lib/helper.css';
import 'amis/sdk/iconfont.css';
import './index.css'
import {setAMISGlobalData, getAMISGlobalData} from "@/store/AmisGlobalData";
import {useRootContext} from '@/hooks/rootContext'

const theme = 'antd';

function normalizeLink(to: string, location: any = history.location) {
  to = to || '';

  if (to && to[0] === '#') {
    to = location.pathname + location.search + to;
  } else if (to && to[0] === '?') {
    to = location.pathname + to;
  }

  const idx = to.indexOf('?');
  const idx2 = to.indexOf('#');
  let pathname = ~idx
    ? to.substring(0, idx)
    : ~idx2
      ? to.substring(0, idx2)
      : to;
  let search = ~idx ? to.substring(idx, ~idx2 ? idx2 : undefined) : '';
  let hash = ~idx2 ? to.substring(idx2) : location.hash;

  if (!pathname) {
    pathname = location.pathname;
  } else if (pathname[0] != '/' && !/^https?\:\/\//.test(pathname)) {
    let relativeBase = location.pathname;
    const paths = relativeBase.split('/');
    paths.pop();
    let m;
    while ((m = /^\.\.?\//.exec(pathname))) {
      if (m[0] === '../') {
        paths.pop();
      }
      pathname = pathname.substring(m[0].length);
    }
    pathname = paths.concat(pathname).join('/');
  }

  return pathname + search + hash;
}

function isCurrentUrl(to: any, ctx?: any) {
  const link = normalizeLink(to);
  const location = history.location;
  let pathname = link;
  let search = '';
  const idx = link.indexOf('?');
  if (~idx) {
    pathname = link.substring(0, idx);
    search = link.substring(idx);
  }

  if (search) {
    if (pathname !== location.pathname || !location.search) {
      return false;
    }

    const query = qs.parse(search.substring(1));
    const currentQuery = qs.parse(location.search.substring(1));

    return Object.keys(query).every(
      key => query[key] === currentQuery[key]
    );
  } else if (pathname === location.pathname) {
    return true;
  } else if (!~pathname.indexOf('http') && ~pathname.indexOf(':')) {
    return match(link, {
      decode: decodeURIComponent,
      strict: ctx?.strict ?? true
    })(location.pathname);
  }

  return false;
}

// amis 环境配置
export const env: any = {
  // 下面三个接口必须实现
  fetcher: service,
  isCancel: (value: any) => (axios as any).isCancel(value),
  beforeSetData: (obj: object) => {
    store.EditorStore.setAppVariables({
      ...store.EditorStore.appVariables,
      ...obj
    })
  },
  copy: (content: string) => {
    copy(content);
    toast.success('内容已复制到粘贴板');
  },
  updateLocation: (location: any, replace: any) => {
    location = normalizeLink(location);

    if (location === 'goBack') {
      return history.back();
    } else if (
      (!/^https?\:\/\//.test(location) &&
        location ===
        history.location.pathname + history.location.search) ||
      location === window.location.href
    ) {
      // 目标地址和当前地址一样，不处理，免得重复刷新
      return;
    } else if (/^https?\:\/\//.test(location) || !history) {
      return (window.location.href = location);
    }
    history[replace ? 'replace' : 'push'](location);
  },
  jumpTo: (to: any, action: any) => {
    console.log(to,'to')
    console.log(action,'action')

    if (action && (action.actionType === 'url' || action.actionType === 'link') && window.location.pathname == '/app/design/pageManage' && !action.whiteJump) {
      return toast.info('温馨提示：页面管理模式下禁止跳转');
    }

    //当前是数据管理，to的是实体管理，将数据管理的url 参数存起来，传到to 的实体管理中
    if (window.location.pathname == '/app/design/dataManage') {
      let search = window.location.search
      if (to == '/app/design/entityManage') {
        history.push(to + search)
      }
    }
    if (to === 'goBack') {
      return history.back();
    }

    if (to == '/') {
      to = isEditorialEnd() ? '/app/design' : '/app/'
    }

    to = normalizeLink(to);

    if (isCurrentUrl(to)) {
      return;
    }

    if (action && action.actionType === 'url') {
      action.blank === false
        ? (window.location.href = to)
        : window.open(to, '_blank');
      return;
    } else if (action && action.blank) {
      window.open(to, '_blank');
      return;
    }

    if (/^https?:\/\//.test(to)) {
      if (action && action.target) {
        window.open(to, action.target);
      } else {
        window.location.href = to;
      }
    } else if (
      (!/^https?\:\/\//.test(to) &&
        to === history.location.pathname + history.location.search) ||
      to === window.location?.href
    ) {
      // do nothing
    } else {
      let toSearch = to.split('?')[1] ? to.split('?')[1] + '?' : ''
      const toParams = new URLSearchParams(toSearch);
      console.log(toParams,'toParams')
      if (toParams.has('appid') && toParams.has('env')) {
        history.push(to)
      } else {
        if (to.indexOf('?') > -1) {
          history.push(to + '&appid=' + appId + '&env=' + envId + (portalKey ? `&portalKey=${portalKey}` : ''))
        } else {
          history.push(to + '?appid=' + appId + '&env=' + envId + (portalKey ? `&portalKey=${portalKey}` : ''))
        }

      }
    }
  },
  notify(type: string, msg: string, conf: any) {
    if (msg == "Cannot read properties of undefined (reading 'data')") return
    if (msg == "您暂无权限进行此操作") return
    if (msg.includes('没有查询表单分组列表权限')) return
    (toast as any)[type](msg, conf)
  },
  isCurrentUrl: (to: string, ctx?: any) => {
    if (!to) {
      return false;
    }
    const link = normalizeLink(to);
    const location = window.location;
    let pathname = link;
    let search = '';
    const idx = link.indexOf('?');
    if (~idx) {
      pathname = link.substring(0, idx);
      search = link.substring(idx);
    }

    if (search) {
      if (pathname !== location.pathname || !location.search) {
        return false;
      }

      const query = qs.parse(search.substring(1));
      const currentQuery = qs.parse(location.search.substring(1));

      return Object.keys(query).every(
        key => query[key] === currentQuery[key]
      );
    } else if (pathname === location.pathname) {
      return true;
    } else if (!~pathname.indexOf('http') && ~pathname.indexOf(':')) {
      return match(link, {
        decode: decodeURIComponent,
        strict: ctx?.strict ?? true
      })(location.pathname);
    }

    return false;
  },
  theme: theme,
  toastPosition: 'top-right'
};

export const AMISComponent: React.FC<{
  schema: any;
}> = (props) => {
  const [location, setLocation] = useState(history.location)
  const AMISGlobalData = getAMISGlobalData()
  const {systemContext, customizeAcl} = useRootContext();


  useEffect(() => {
    console.log(systemContext,'systemContext')
    console.log(AMISGlobalData,'AMISGlobalData')

    const unlisten = history.listen((state: { location: any; action: any }) => {
      setLocation(state.location)
      setAMISGlobalData({
        ...AMISGlobalData,
        search: state.location.search
      })
    })
    return () => {
      unlisten()
    }
  }, [])

  const AMISRender = renderAmis(
    // 这里是 amis 的 Json 配置。
    props.schema,
    {
      location: location as any,
      // 全局数据，是受控的数据
      data: {
        ...AMISGlobalData
      },
      // 全局上下文数据, 非受控的数据，无论哪一层都能获取到，包括弹窗自定义数据映射后都能获取到。
      // 可以用来放一下全局配置等。比如 API_HOST, 这样页面配置里面可以通过 ${API_HOST} 来获取到。
      context: {
        ...systemContext
      }
    },
    {
      ...env,
      permData: customizeAcl
    } as any)

  return (
    <>
      <ToastComponent key="toast" theme={theme} position={'top-right'}/>
      <AlertComponent key="alert" theme={theme} />
      {AMISRender}
    </>
  );
}


export const DynamicComponent = ({ componentPath }: any) => {
  // 添加错误边界和缓存机制
  const [error, setError] = useState(null);

  // 使用useCallback缓存导入函数
  const loadComponent = useCallback(() => {
    if (!componentPath) {
      return Promise.reject(new Error('组件路径为空'));
    }
    try {
      return import(`@/pages/${componentPath}`);
    } catch (err: any) {
      setError(err);
      return Promise.reject(err);
    }
  }, [componentPath]);

  const LazyComponent = useMemo(() => lazy(() => loadComponent()), [loadComponent]);

  if (error) {
    return <ErrorResult title={"组件加载错误"} subTitle={`请检查组件路径是否正确，路径：@/pages/${componentPath}`} />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<Spin />}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
};

export class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }

  render() {
    return this.state.hasError ? <ErrorResult title={"组件加载错误"} subTitle={`请检查组件路径是否正确`} /> : this.props.children;
  }
}

const ErrorResult = ({title, subTitle}: any) => {
  return (
    <Result
      status="error"
      title={title}
      subTitle={subTitle}
    >
    </Result>
  )
}

