import {
  AlipayCircleOutlined,
  LockOutlined,
  MobileOutlined,
  TaobaoCircleOutlined,
  UserOutlined,
  WeiboCircleOutlined,
  UsergroupDeleteOutlined,
  MailOutlined,
  TeamOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import {
  LoginForm,
  ProForm,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
  ProFormSelect,
  ProFormTreeSelect,
  ProFormGroup
} from '@ant-design/pro-components';
import type { CaptFieldRef, ProFormInstance } from '@ant-design/pro-components';
import { useRef } from 'react';
import {
  FormattedMessage,
  Helmet,
  SelectLang,
  useIntl,
  useModel,
} from '@umijs/max';
import { Alert, App, Tabs, Modal, Button, message as antdMessage } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Footer } from '@/components';
import {getAppInfo, getAppTenantName, getTenantName, login, getAllTenantByAppId, queryDeptByAppTenantCode, sendSmsMobileCode, sendSmsEmailCode} from '@/services/ant-design-pro/api';
// 导入注册相关API
import { getMobileRegister, getEmailRegister } from "@/api/login"
import Settings from '../../../../../config/defaultSettings';
import {setAppTenantCode, setTenantId, setToken, getTenantId} from "@/utils/auth";
import {appId, envId, portalKey, appTitle, captchaEnable} from "@/utils/env";
import appDefaultImg from '@/assets/imgs/app-default.png';
import VerificationCode from '../VerifySlide';
import { handleTree } from '@/utils/tree';
import appTenantCodeStore from "@/store/appTenantCode"

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
    registerActions: {
      marginTop: 16,
      textAlign: 'center',
    },
    registerTab: {
      marginBottom: 16,
    }
  };
});

const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type, setType] = useState<string>('account');
  const [appInfo, setAppInfo] = useState<API.AppInfo>({});
  const [submitData, setSubmitData] = useState<any>({})
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  // 验证码弹窗显隐
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 注册相关状态
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerType, setRegisterType] = useState<'mobile' | 'email'>('mobile');
  const [tenantOptions, setTenantOptions] = useState<any[]>([]);
  const [deptOptions, setDeptOptions] = useState<any[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [smsLoading, setSmsLoading] = useState(false);
  const registrationEnabled = !!initialState?.appInfo?.registrationEnabled;

  // 获取租户列表
  const fetchTenantList = useCallback(async () => {
    try {
      const response = await getAllTenantByAppId();
      if (response.data.code === 0) {
        setTenantOptions(response.data.data || []);
      }
    } catch (error) {
      console.error('获取租户列表失败:', error);
      message.error('获取租户列表失败，请重试');
    }
  }, []);

  // 获取部门列表
  const fetchDeptList = useCallback(async (appTenantCode: string) => {
    if (!appTenantCode) {
      setDeptOptions([]);
      return;
    }

    try {
      const response = await queryDeptByAppTenantCode(appTenantCode);
      if (response.data.code === 0) {
        const deptTree: any[] = handleTree(response.data.data);
        setDeptOptions(deptTree || []);
      }
    } catch (error) {
      console.error('获取部门列表失败:', error);
      message.error('获取部门列表失败，请重试');
    }
  }, []);

  // 初始化获取租户列表
  useEffect(() => {
    fetchTenantList();
  }, [fetchTenantList]);

  // 发送手机验证码
  const handleSendMobileCode = async (mobile: string) => {
    captchaRef.current?.startTiming();
    try {
      const tenantId = getTenantId();
      const response = await sendSmsMobileCode({
        mobile,
        tenantId
      });
      if (response.data.code === 0) {
        message.success('验证码发送成功');
        return true;
      } else {
        message.error(response.data.msg || '验证码发送失败');
        return false;
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      message.error('验证码发送失败，请重试');
      captchaRef.current?.endTiming();
      return false;
    } finally {
    }
  };

  // 发送邮箱验证码
  const handleSendEmailCode = async (email: string) => {
    if (!email) {
      message.error('请输入邮箱地址');
      return false;
    }

    // 简单邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      message.error('请输入正确的邮箱地址');
      return false;
    }

    captchaRef.current?.startTiming();
    try {
      const tenantId = getTenantId();
      const response = await sendSmsEmailCode({
        email,
        tenantId
      });

      if (response.data.code === 0) {
        message.success('验证码发送成功');
        return true;
      } else {
        message.error(response.data.msg || '验证码发送失败');
        return false;
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      message.error('验证码发送失败，请重试');
      captchaRef.current?.endTiming();
      return false;
    } finally {
    }
  };

  // 处理手机注册
  const handleMobileRegister = async (values: any) => {
    try {
      if (values.password !== values.confirmPassword) {
        message.error('密码与确认密码不一致');
        return;
      }

      const params = {
        username: values.mobile,
        nickname: values.nickname,
        mobile: values.mobile,
        captcha: values.captcha,
        password: values.password,
        deptId: values.deptId,
        tenantId: getTenantId(),
        appTenantCode: values.appTenantCode
      };

      const response = await getMobileRegister(params);
      if (response.data.code === 0) {
        message.success(response.data.msg || '注册成功');
        formRegisterRef.current?.resetFields(); // 注册成功后才重置表单
        setRegisterModalOpen(false);
        return true;
      } else {
        message.error(response.data.msg || '注册失败');
        return false;
      }
    } catch (error) {
      console.error('注册失败:', error);
      message.error('注册失败，请重试');
      return false;
    }
  };

  // 处理邮箱注册
  const handleEmailRegister = async (values: any) => {
    try {
      if (values.password !== values.confirmPassword) {
        message.error('密码与确认密码不一致');
        return;
      }

      const params = {
        username: values.username,
        nickname: values.nickname,
        email: values.email,
        captcha: values.captcha,
        password: values.password,
        deptId: values.deptId,
        tenantId: getTenantId(),
        appTenantCode: values.appTenantCode,
        remark: values.remark
      };

      const response = await getEmailRegister(params);
      if (response.data.code === 0) {
        message.success(response.data.msg || '注册成功');
        formRegisterRef.current?.resetFields(); // 注册成功后才重置表单
        setRegisterModalOpen(false);
        return true;
      } else {
        message.error(response.data.msg || '注册失败');
        return false;
      }
    } catch (error) {
      console.error('注册失败:', error);
      message.error('注册失败，请重试');
      return false;
    }
  };

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      const tenantName = 'system'
      const tenantResponse = await getTenantName(tenantName);
      if (tenantResponse.data.code === 0) {
        setTenantId(tenantResponse.data.data)
      }
      const appTenantResponse = await getAppTenantName(values.appTenantName);
      if(appTenantResponse.data.code === 0) {
        setAppTenantCode(appTenantResponse.data.data.code);
        appTenantCodeStore.dispatch({type: "set", payload: appTenantResponse.data.data.code});
      }
      // 登录
      const response = await login({ ...values, rememberMe: false, tenantName}, {
        headers: {
          'tenant-id': tenantResponse.data.data,
          'Content-Type': 'application/x-www-form-urlencoded',
          'App-Tenant-Code': appTenantResponse.code,
        },
      });
      if (response.data.code === 0) {
        setToken(response.data?.data)
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功！',
        });
        message.success(defaultLoginSuccessMessage);
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        // 构建应用参数信息
        const appParams = new URLSearchParams();
        appId && appParams.set('appid', appId);
        envId && appParams.set('env', envId);
        portalKey && appParams.set('portalKey', portalKey);
        window.location.href = urlParams.get('redirect') || `/app/design/?${appParams.toString()}`;
        return
      }
      message.error(`登录失败 ${response.data.msg}`);
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: '登录失败，请重试！',
      });
      console.log(error);
      message.error(defaultLoginFailureMessage);
    }
  };

  const { status, type: loginType } = userLoginState;

  // @ts-ignore
  const captchaRef = useRef<CaptFieldRef | null | undefined>();

  // @ts-ignore
  const formRegisterRef = useRef<ProFormInstance>();

  // 注册表单组件
  const RegisterForm = () => (
    <div>
      <Tabs
        activeKey={registerType}
        onChange={(key) => setRegisterType(key as 'mobile' | 'email')}
        className={styles.registerTab}
      >
        <Tabs.TabPane key="mobile" tab="手机注册">
          <ProFormSelect
            name="appTenantCode"
            label="应用租户"
            fieldProps={{
              size: 'large',
              prefix: <UsergroupDeleteOutlined />,
            }}
            placeholder="请选择应用租户"
            rules={[
              {
                required: true,
                message: '请选择应用租户',
              },
            ]}
            options={tenantOptions.map(item => ({
              label: item.label,
              value: item.value,
            }))}
            onChange={(value: any) => fetchDeptList(value)}
          />

          <ProFormTreeSelect
            name="deptId"
            label="部门"
            fieldProps={{
              size: 'large',
              prefix: <TeamOutlined />,
              treeData: deptOptions,
              fieldNames: {
                label: 'name',
                value: 'id',
                children: 'children',
              }
            }}
            placeholder="请选择部门"
            rules={[
              {
                required: true,
                message: '请选择部门',
              },
            ]}

          />

          <ProFormText
            name="nickname"
            label="昵称"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            placeholder="请输入昵称"
            rules={[
              {
                required: true,
                message: '请输入昵称',
              },
              {
                max: 15,
                message: '昵称长度不能超过15个字符',
              },
              {
                pattern: /^[A-Za-z0-9_\u4e00-\u9fa5]+$/,
                message: '昵称只能包含字母、数字、下划线和中文',
              },
            ]}
          />

          <ProFormText
            name="mobile"
            label="手机号"
            fieldProps={{
              size: 'large',
              prefix: <MobileOutlined />,
              maxLength: 11,
            }}
            placeholder="请输入手机号"
            rules={[
              {
                required: true,
                message: '请输入手机号',
              },
              {
                pattern: /^\d{11}$/,
                message: '请输入正确的手机号码',
              },
            ]}
          />

          <ProFormText.Password
            name="password"
            label="密码"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder="请输入密码"
            rules={[
              {
                required: true,
                message: '请输入密码',
              },
              {
                min: 4,
                message: '密码长度不能少于4个字符',
              },
              {
                max: 16,
                message: '密码长度不能超过16个字符',
              },
            ]}
          />

          <ProFormText.Password
            name="confirmPassword"
            label="确认密码"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder="请输入确认密码"
            rules={[
              {
                required: true,
                message: '请输入确认密码',
              },
              {
                min: 4,
                message: '密码长度不能少于4个字符',
              },
              {
                max: 16,
                message: '密码长度不能超过16个字符',
              },
            ]}
          />

          <ProFormCaptcha
            name="captcha"
            label="验证码"
            fieldProps={{
              size: 'large',
              prefix: <IdcardOutlined />,
            }}
            placeholder="请输入验证码"
            fieldRef={captchaRef}
            rules={[
              {
                required: true,
                message: '请输入验证码',
              },
            ]}
            phoneName="mobile"
            onGetCaptcha={async (phone) => {
              await handleSendMobileCode(phone);
            }}
            countDown={countdown}
          />
        </Tabs.TabPane>

        <Tabs.TabPane key="email" tab="邮箱注册">
          <ProFormSelect
            name="appTenantCode"
            label="应用租户"
            fieldProps={{
              size: 'large',
              prefix: <UsergroupDeleteOutlined />,
            }}
            placeholder="请选择应用租户"
            rules={[
              {
                required: true,
                message: '请选择应用租户',
              },
            ]}
            options={tenantOptions.map(item => ({
              label: item.label,
              value: item.value,
            }))}
            onChange={(value: any) => fetchDeptList(value)}
          />

          <ProFormTreeSelect
            name="deptId"
            label="部门"
            fieldProps={{
              size: 'large',
              prefix: <TeamOutlined />,
              treeData: deptOptions,
              fieldNames: {
                label: 'name',
                value: 'id',
                children: 'children',
              }
            }}
            placeholder="请选择部门"
            rules={[
              {
                required: true,
                message: '请选择部门',
              },
            ]}

          />

          <ProFormText
            name="username"
            label="用户名称"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            placeholder="请输入用户名称"
            rules={[
              {
                required: true,
                message: '请输入用户名称',
              },
              {
                min: 4,
                message: '用户名称长度不能少于4个字符',
              },
              {
                max: 16,
                message: '用户名称长度不能超过16个字符',
              },
              {
                pattern: /^[a-zA-Z0-9]+$/,
                message: '用户名称由字母、数字组成',
              },
            ]}
          />

          <ProFormText
            name="nickname"
            label="昵称"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            placeholder="请输入昵称"
            rules={[
              {
                required: true,
                message: '请输入昵称',
              },
            ]}
          />

          <ProFormText
            name="email"
            label="邮箱"
            fieldProps={{
              size: 'large',
              prefix: <MailOutlined />,
            }}
            placeholder="请输入邮箱"
            rules={[
              {
                required: true,
                message: '请输入邮箱',
              },
              {
                type: 'email',
                message: '请输入正确的邮箱地址',
              },
            ]}
          />

          <ProFormCaptcha
            name="captcha"
            label="验证码"
            fieldProps={{
              size: 'large',
              prefix: <IdcardOutlined />,
            }}
            placeholder="请输入验证码"
            fieldRef={captchaRef}
            rules={[
              {
                required: true,
                message: '请输入验证码',
              },
            ]}
            phoneName="email"
            onGetCaptcha={async (email) => {
              await handleSendEmailCode(email);
            }}
            countDown={countdown}
          />

          <ProFormText.Password
            name="password"
            label="密码"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder="请输入密码"
            rules={[
              {
                required: true,
                message: '请输入密码',
              },
              {
                min: 4,
                message: '密码长度不能少于4个字符',
              },
              {
                max: 16,
                message: '密码长度不能超过16个字符',
              },
            ]}
          />

          <ProFormText.Password
            name="confirmPassword"
            label="确认密码"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder="请输入确认密码"
            rules={[
              {
                required: true,
                message: '请输入确认密码',
              },
              {
                min: 4,
                message: '密码长度不能少于4个字符',
              },
              {
                max: 16,
                message: '密码长度不能超过16个字符',
              },
            ]}
          />

          <ProFormText
            name="remark"
            label="备注"
            fieldProps={{
              size: 'large',
            }}
            placeholder="请输入备注"
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );

  return (
    <div className={styles.container} style={initialState?.appInfo?.background ? {
      backgroundImage:
        `url('${initialState?.appInfo?.background}')`,
    } : {}}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: '登录页',
          })}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <Lang />
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src={
            (initialState && initialState?.appInfo) ? initialState?.appInfo.icon : appDefaultImg
          } />}
          title={(initialState && initialState?.appInfo) ? initialState?.appInfo.name : appTitle}
          subTitle={
            (initialState && initialState?.appInfo?.portalName) ? <div>{initialState?.appInfo.portalName}</div> : ""
          }
          initialValues={{
            autoLogin: true,
          }}
          onFinish={async (values) => {
            if (captchaEnable === 'true') {
              setSubmitData(values)
              setIsModalOpen(true)
            } else {
              await handleSubmit(values as API.LoginParams);
            }
          }}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[
              {
                key: 'account',
                label: intl.formatMessage({
                  id: 'pages.login.accountLogin.tab',
                  defaultMessage: '账户密码登录',
                }),
              }
            ]}
          />

          {status === 'error' && loginType === 'account' && (
            <LoginMessage
              content={intl.formatMessage({
                id: 'pages.login.accountLogin.errorMessage',
                defaultMessage: '账户或密码错误(admin/ant.design)',
              })}
            />
          )}
          {type === 'account' && (
            <>
              <ProFormText
                name="appTenantName"
                fieldProps={{
                  size: 'large',
                  prefix: <UsergroupDeleteOutlined />,
                }}
                placeholder={"请输入租户名称"}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.tenantName.required"
                        defaultMessage="请输入租户名称!"
                      />
                    ),
                  },
                ]}
              />
              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.username.placeholder',
                  defaultMessage: '请输入用户名',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.username.required"
                        defaultMessage="请输入用户名!"
                      />
                    ),
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.password.placeholder',
                  defaultMessage: '请输入密码',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.password.required"
                        defaultMessage="请输入密码！"
                      />
                    ),
                  },
                ]}
              />
            </>
          )}

          {/* 注册按钮 */}
          {registrationEnabled && (
            <div className={styles.registerActions}>
              <Button
                type="link"
                onClick={() => setRegisterModalOpen(true)}
              >
                还没有账号？立即注册
              </Button>
            </div>
          )}
        </LoginForm>

        {/* 验证码弹窗 */}
        <Modal
          title="验证码确认"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
        >
          <VerificationCode
            barSize={{height: '30px', width: '350px'}}
            captchaType="blockPuzzle"
            imgSize={{width: '440px', height: '200px'}}
            mode="pop"
            className="loginImage"
            onSuccess={async ({captchaVerification} : any) => {
              await handleSubmit({
                ...submitData,
                captchaVerification
              })
              setIsModalOpen(false);
            }}
          />
        </Modal>

        {/* 注册弹窗 */}
        <Modal
          title="用户注册"
          open={registerModalOpen}
          onCancel={() => setRegisterModalOpen(false)}
          footer={null}
          width={600}
        >
          <ProForm
            layout="vertical"
            initialValues={{}}
            preserve={true}
            formRef={formRegisterRef}
            submitter={{
              // 完全自定义整个区域
              render: (props, doms) => {
                return [
                  <div style={{textAlign: 'right', marginTop: 16}}>
                    <Button
                      type="primary"
                      onClick={async () => {
                        const form = formRegisterRef.current;
                        if (!form) return;
                        await form.validateFields().then((values: any) => {
                          if (registerType === 'mobile') {
                            handleMobileRegister(values);
                          } else {
                            handleEmailRegister(values);
                          }
                        });
                      }}
                    >
                      注册
                    </Button>
                    <Button
                      style={{marginLeft: 8}}
                      onClick={() => setRegisterModalOpen(false)}
                    >
                      已有账号？去登录
                    </Button>
                  </div>
                ];
              },
            }}
          >
            <RegisterForm />
          </ProForm>
        </Modal>
      </div>
    </div>
  );
};

export default Login;
