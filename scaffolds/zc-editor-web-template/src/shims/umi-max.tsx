/**
 * @umijs/max 兼容 shim
 *
 * 本文件通过 vite.config.ts 的 alias 机制接管 `@umijs/max` 的所有 import，
 * 让现有 48 个使用 @umijs/max 的文件无需修改即可在 Vite 环境运行。
 *
 * 提供以下兼容 API：
 * - history（路由跳转单例，类似 UMI 的全局 history）
 * - Link、useLocation、useNavigate（来自 react-router-dom）
 * - useIntl、FormattedMessage（来自 react-intl）
 * - request（包装 axios 模拟 UMI request 行为）
 * - useRequest（基于 ahooks）
 * - useModel（占位实现，配合后续 Zustand 接入）
 * - SelectLang（占位组件）
 * - 类型：RequestConfig、RunTimeLayoutConfig
 */
import type { NavigateFunction, NavigateOptions } from 'react-router-dom';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useIntl, FormattedMessage, IntlProvider } from 'react-intl';
import { useRequest } from 'ahooks';
import React from 'react';

// ============== history 单例 ==============
// UMI 的 history 是一个可在组件外调用的全局对象。我们用桥接模式实现：
// main.tsx 中通过 NavigatorBridge 把 react-router 的 navigate 注入进来。

let _navigator: NavigateFunction | null = null;

export const setNavigator = (nav: NavigateFunction) => {
  _navigator = nav;
};

type LocationLike = string | { pathname: string; search?: string; hash?: string; state?: any };

const normalizeTo = (to: LocationLike): string => {
  if (typeof to === 'string') return to;
  return `${to.pathname || ''}${to.search || ''}${to.hash || ''}`;
};

export const history = {
  push(to: LocationLike, state?: any) {
    if (!_navigator) {
      // navigator 还未注入时，降级到 window.location
      window.location.assign(normalizeTo(to));
      return;
    }
    const opts: NavigateOptions = state !== undefined ? { state } : {};
    _navigator(normalizeTo(to), opts);
  },
  replace(to: LocationLike, state?: any) {
    if (!_navigator) {
      window.location.replace(normalizeTo(to));
      return;
    }
    const opts: NavigateOptions = { replace: true, ...(state !== undefined ? { state } : {}) };
    _navigator(normalizeTo(to), opts);
  },
  go(delta: number) {
    window.history.go(delta);
  },
  back() {
    window.history.back();
  },
  forward() {
    window.history.forward();
  },
  get location() {
    return window.location;
  },
};

// ============== react-router-dom 重导出 ==============
export { Link, useLocation, useNavigate, useParams, useSearchParams };

// ============== react-intl 重导出 ==============
export { useIntl, FormattedMessage, IntlProvider };

// ============== request（基于 axios 的 UMI request 兼容包装）==============
import axios, { type AxiosRequestConfig } from 'axios';

export interface RequestOptions<T = any> extends AxiosRequestConfig<T> {
  /** UMI 兼容字段：跳过统一错误处理 */
  skipErrorHandler?: boolean;
  /** UMI 兼容字段：是否使用缓存 */
  useCache?: boolean;
  /** UMI 兼容字段：URL 参数（与 params 等价） */
  params?: any;
}

const requestInstance = axios.create({
  baseURL: '',
  timeout: 60000,
});

export async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, params, ...rest } = options;
  const response = await requestInstance.request<T>({
    url,
    method,
    data,
    params,
    ...rest,
  });
  // UMI 的 request 默认返回 response.data
  return response.data as T;
}

// ============== useRequest（直接用 ahooks 的实现）==============
export { useRequest };

// ============== useModel ==============
// UMI 的 useModel 是一个通用命名空间机制。本项目实际只用到 '@@initialState'，
// 所以我们把该命名空间桥接到 InitialStateContext，其他命名空间返回空对象。
import { InitialStateContext } from '@/initialState';

export function useModel<T = any>(namespace: string, selector?: (model: any) => T): T {
  const initialStateCtx = React.useContext(InitialStateContext);

  if (namespace === '@@initialState') {
    const model = {
      initialState: initialStateCtx.initialState,
      setInitialState: initialStateCtx.setInitialState,
      loading: initialStateCtx.loading,
      refresh: initialStateCtx.refresh,
    };
    return (selector ? selector(model) : model) as T;
  }

  // 其他 namespace 暂未实现，返回空对象占位（避免调用处崩溃）
  const empty = {} as any;
  return (selector ? selector(empty) : empty) as T;
}

// ============== SelectLang（占位）==============
export const SelectLang: React.FC<any> = () => null;

// ============== Helmet（简易实现）==============
// UMI 的 Helmet 来自 react-helmet-async；本项目仅 login 页面用到，
// 主要是设置 <title>。用简单 DOM 操作替代避免引入新依赖。
export const Helmet: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    const titleEl = React.Children.toArray(children).find(
      (c): c is React.ReactElement => React.isValidElement(c) && c.type === 'title',
    );
    if (titleEl) {
      const titleText = React.Children.toArray((titleEl as any).props.children).join('');
      const prev = document.title;
      document.title = titleText;
      return () => {
        document.title = prev;
      };
    }
  }, [children]);
  return null;
};

// ============== IRoute 类型占位 ==============
export type IRoute = any;

// ============== 类型导出（兼容已有 import type）==============
export type RequestConfig = any;
export type RunTimeLayoutConfig = any;
