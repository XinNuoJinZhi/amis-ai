// 定义环境变量类型
interface EnvType {
  REACT_APP_ENV: string;
  REACT_APP_BASE_URL: string;
  REACT_APP_ADMIN_URL: string;
  REACT_APP_ADMIN_API_URL: string;
  REACT_APP_DEV_API_URL: string;
  REACT_APP_APP_MOCK_DATA: string;
  REACT_APP_SOCKET_URL: string;
  [key: string]: string | boolean | undefined;
}

export const appTitle = process.env.REACT_APP_TITLE;

// 基础 URL
export const baseURL = process.env.REACT_APP_BASE_URL || '';

// 管理端地址
export const adminUrl = process.env.REACT_APP_ADMIN_URL;

export const adminApiUrl = process.env.REACT_APP_ADMIN_API_URL || '';

export const devApiUrl = process.env.REACT_APP_DEV_API_URL;

export const appApiUrl = process.env.REACT_APP_APP_API_URL;

// @ts-ignore
export const mockData  = JSON.parse(JSON.parse(process.env.REACT_APP_APP_MOCK_DATA));

export const socketUrl = process.env.REACT_APP_SOCKET_URL;

export const uploadUrl = process.env.REACT_APP_UPLOAD_URL;

// @ts-ignore
export const advancedFeature = JSON.parse(JSON.parse(process.env.REACT_APP_APP_ADVANCE_FEATURE));

// @ts-ignore
export const AIDebug = JSON.parse(JSON.parse(process.env.REACT_APP_AI_HELPER_DEBUG));

// @ts-ignore
export const captchaEnable = JSON.parse(JSON.parse(process.env.REACT_APP_APP_CAPTCHA_ENABLE));

export const sheetEditorPath = process.env.REACT_APP_SHEET_EDITOR_PATH;

export const goviewUrl = process.env.REACT_APP_GOVIEW_URL;

// @ts-ignore
export const testMode = JSON.parse(JSON.parse(process.env.REACT_APP_TEST_MODE));

export const basePath = process.env.REACT_APP_BASE_PATH;

export const getAdminBaseURL = (url: string) => {
  return baseURL + adminApiUrl + url;
};

export const getDevBaseURL = (url: string) => {
  return baseURL + devApiUrl + url;
};

const adminParams = new URLSearchParams(window.location.search);
export const appId = adminParams.get('appid')
export const envId = adminParams.get('env')
export const portalKey = adminParams.get('portalKey')
