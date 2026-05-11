// https://umijs.org/config/

import { join } from 'node:path';
import { defineConfig } from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import dotenv from 'dotenv';
import path from 'path';
import CompressionPlugin from 'compression-webpack-plugin'; // 引入插件
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'; // 引入官方插件

const root = process.cwd();
function pathResolve(dir: string) {
  return path.resolve(root, '.', dir);
}

import routes from './routes';

const { REACT_APP_ENV = 'dev' } = process.env;

// 加载 .env 文件
const loadEnvFiles = () => {
  // 优先加载对应环境的 .env 文件，例如 .env.development
  console.log('当前环境:', process.env.REACT_APP_ENV)
  const env = process.env.REACT_APP_ENV || 'development';
  const envFiles = [
    `.env.${env}`, // 环境特定配置
    '.env',       // 通用配置
  ];

  envFiles.forEach(file => {
    const filePath = path.resolve(__dirname, '..', file);
    const result = dotenv.config({ path: filePath });
    if (result.error) {
      console.warn(`⚠️ 没有找到 ${file} 文件，跳过加载`);
    } else {
      console.log(`✅ 成功加载 ${file}`);
    }
  });
};

// 执行加载
if (!process.env.ENV_LOADED) {
  loadEnvFiles();
  process.env.ENV_LOADED = 'true'; // 标记为已加载
}

/**
 * @name 使用公共路径
 * @description 部署时的路径，如果部署在非根目录下，需要配置这个变量
 * @doc https://umijs.org/docs/api/config#publicpath
 */
const PUBLIC_PATH: string = process.env.REACT_APP_BASE_PATH as string;

// 自动注入所有 REACT_APP_* 变量到浏览器端
const reactAppEnvs = Object.keys(process.env)
  .filter(key => key.startsWith('REACT_APP_'))
  .reduce((obj, key) => {
    obj[`process.env.${key}`] = process.env[key] || '';
    return obj;
  }, {} as Record<string, string>);

export default defineConfig({
  /**
   * @name 开启 hash 模式
   * @description 让 build 之后的产物包含 hash 后缀。通常用于增量发布和避免浏览器加载缓存。
   * @doc https://umijs.org/docs/api/config#hash
   */
  hash: true,

  publicPath: PUBLIC_PATH,

  outputPath: process.env.REACT_APP_OUT_DIR,

  /**
   * @name 兼容性设置
   * @description 设置 ie11 不一定完美兼容，需要检查自己使用的所有依赖
   * @doc https://umijs.org/docs/api/config#targets
   */
  // targets: {
  //   ie: 11,
  // },
  /**
   * @name 路由的配置，不在路由中引入的文件不会编译
   * @description 只支持 path，component，routes，redirect，wrappers，title 的配置
   * @doc https://umijs.org/docs/guides/routes
   */
  // umi routes: https://umijs.org/docs/routing
  routes,
  /**
   * @name 主题的配置
   * @description 虽然叫主题，但是其实只是 less 的变量设置
   * @doc antd的主题设置 https://ant.design/docs/react/customize-theme-cn
   * @doc umi 的 theme 配置 https://umijs.org/docs/api/config#theme
   */
  // theme: { '@primary-color': '#1DA57A' }
  /**
   * @name moment 的国际化配置
   * @description 如果对国际化没有要求，打开之后能减少js的包大小
   * @doc https://umijs.org/docs/api/config#ignoremomentlocale
   */
  ignoreMomentLocale: true,
  /**
   * @name 代理配置
   * @description 可以让你的本地服务器代理到你的服务器上，这样你就可以访问服务器的数据了
   * @see 要注意以下 代理只能在本地开发时使用，build 之后就无法使用了。
   * @doc 代理介绍 https://umijs.org/docs/guides/proxy
   * @doc 代理配置 https://umijs.org/docs/api/config#proxy
   */
  proxy: proxy[REACT_APP_ENV as keyof typeof proxy],
  /**
   * @name 快速热更新配置
   * @description 一个不错的热更新组件，更新时可以保留 state
   */
  fastRefresh: true,

  /**
   * @name MFSU 配置
   * @description 禁用 MFSU - amis 通过 Module Federation 会加载独立的 React 副本，
   * 导致 "Invalid hook call" 错误。alias 无法跨 MF 边界生效。
   * 未来可考虑升级 amis 或使用 shared 配置来解决。
   */
  mfsu: false,
  //============== 以下都是max的插件配置 ===============
  /**
   * @name 数据流插件
   * @@doc https://umijs.org/docs/max/data-flow
   */
  model: {},
  /**
   * 一个全局的初始数据流，可以用它在插件之间共享数据
   * @description 可以用来存放一些全局的数据，比如用户信息，或者一些全局的状态，全局初始状态在整个 Umi 项目的最开始创建。
   * @doc https://umijs.org/docs/max/data-flow#%E5%85%A8%E5%B1%80%E5%88%9D%E5%A7%8B%E7%8A%B6%E6%80%81
   */
  initialState: {},
  /**
   * @name layout 插件
   * @doc https://umijs.org/docs/max/layout-menu
   */
  title: defaultSettings.title,
  layout: {
    locale: true,
    ...defaultSettings,
  },
  /**
   * @name 国际化插件
   * @doc https://umijs.org/docs/max/i18n
   */
  locale: {
    // default zh-CN
    default: 'zh-CN',
    antd: true,
    // default true, when it is true, will use `navigator.language` overwrite default
    baseNavigator: true,
  },
  /**
   * @name antd 插件
   * @description 内置了 babel import 插件
   * @doc https://umijs.org/docs/max/antd#antd
   */
  antd: {
    appConfig: {},
    configProvider: {
      theme: {
        cssVar: true,
        token: {
          fontFamily: 'AlibabaSans, sans-serif',
        },
      },
    },
  },
  /**
   * @name 网络请求配置
   * @description 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
   * @doc https://umijs.org/docs/max/request
   */
  request: {},
  /**
   * @name 权限插件
   * @description 基于 initialState 的权限插件，必须先打开 initialState
   * @doc https://umijs.org/docs/max/access
   */
  access: {},
  /**
   * @name <head> 中额外的 script
   * @description 配置 <head> 中额外的 script
   */
  headScripts: [
    // 解决首次加载时白屏的问题
    { src: join(PUBLIC_PATH, 'scripts/loading.js'), async: true },
    { src: join(PUBLIC_PATH, 'scripts/socket.io.js'), async: true },
    { src: join(PUBLIC_PATH, 'scripts/uni.webview.1.5.6.js'), async: true },
  ],
  //================ pro 插件配置 =================
  presets: ['umi-presets-pro'],
  /**
   * @name openAPI 插件的配置
   * @description 基于 openapi 的规范生成serve 和mock，能减少很多样板代码
   * @doc https://pro.ant.design/zh-cn/docs/openapi/
   */
  openAPI: [
    // {
    //   requestLibPath: "import { request } from '@umijs/max'",
    //   // 或者使用在线的版本
    //   // schemaPath: "https://gw.alipayobjects.com/os/antfincdn/M%24jrzTTYJN/oneapi.json"
    //   schemaPath: join(__dirname, 'oneapi.json'),
    //   mock: false,
    // },
    // {
    //   requestLibPath: "import { request } from '@umijs/max'",
    //   schemaPath:
    //     'https://gw.alipayobjects.com/os/antfincdn/CA1dOm%2631B/openapi.json',
    //   projectName: 'swagger',
    // },
  ],
  mock: {
    include: ['mock/**/*', 'src/pages/**/_mock.ts'],
  },
  /**
   * @name 是否开启 mako
   * @description 使用 mako 极速研发
   * @doc https://umijs.org/docs/api/config#mako
   */
  // mako: {},
  esbuildMinifyIIFE: true,
  requestRecord: {},
  exportStatic: {},
  define: reactAppEnvs,
  postcssLoader: {
    options: {
      postcssOptions: {
        plugins: [
          // 关键修正：使用 @tailwindcss/postcss 替代 tailwindcss
          require('tailwindcss')(),
          require('autoprefixer')(),
        ],
      },
    },
  },
  // 修复：移除 esmodules，仅保留有效目标环境（支持 BigInt 的 Chrome 版本）
  targets: {
    chrome: 88, // Chrome88+ 原生支持 BigInt
    node: '16', // 匹配项目使用的 Node 版本（可选，按实际调整）
  },

  // ESBuild 压缩（比 Terser 快 10-100 倍，targets chrome 88+ 已原生支持 BigInt）
  jsMinifierOptions: {
    target: 'es2020',
    drop: [
      ...(process.env.REACT_APP_DROP_CONSOLE ? ['console' as const] : []),
      ...(process.env.REACT_APP_DROP_DEBUGGER ? ['debugger' as const] : []),
    ],
  },
  jsMinifier: 'esbuild',
  alias: {
    // 同步 Vite 中的别名配置
    'moment/locale': 'moment/dist/locale',
    'react-dom/client': pathResolve('src/client.ts'),
    // 确保整个应用使用同一个 React 实例，避免多实例冲突
    'react': pathResolve('node_modules/react'),
    'react-dom': pathResolve('node_modules/react-dom'),
  },
  chainWebpack(memo, { env }) {
    // 0. 强制 React 单例，解决多实例问题
    memo.resolve.alias
      .set('react', pathResolve('node_modules/react'))
      .set('react-dom', pathResolve('node_modules/react-dom'));

    // 1. 压缩配置（保留）
    if (env === 'production') {
      memo.plugin('compression').use(CompressionPlugin, [
        {
          threshold: 10240,
          algorithm: 'gzip',
          filename: '[path][base].gz',
          test: /\.(js|css|html|svg)$/,
          minRatio: 0.8,
        },
      ]);
    }

    // 2. 简化 Monaco 配置
    memo.plugin('monaco-editor').use(MonacoWebpackPlugin, [
      {
        // 只保留语言和主题配置（减少打包体积）
        languages: ['javascript', 'json'], // 按项目需求调整
        // @ts-ignore
        themes: ['vs-dark', 'light'],
      },
    ]);
  },
});
