/**
 * 预设 Amis JSON 模板 — 用于快速测试反向飞轮。
 *
 * 设计原则（Section 12）：
 * - 除 `login` 外全部使用**静态内联数据**（`data: {...}` + `source: "${...}"`），不挂 API
 *   避免 Agent 生成一大段假的 axios 调用，真跑起来一点击就 404
 * - 每个模板覆盖多种不同的 Wot UI 组件，方便测试反向飞轮对各类 UI 表现能力的支持
 * - 动作反馈用 Amis 的 `actionType: toast/confirm/dialog/drawer` 代替 API
 * - 不使用 Wot UI 1.6.0 里不存在的组件（参考 skills/uniapp-wot-h5/component-mapping.md）
 */

export interface PresetTemplate {
  key: string;
  label: string;
  description: string;
  amis_json: string;
}

// ============ 1. 登录页（保留 api 占位，演示提交流程）============
const LOGIN_JSON = {
  type: 'page',
  title: '用户登录',
  body: {
    type: 'form',
    title: '登录',
    api: 'post:/api/login',
    submitText: '登录',
    body: [
      {
        type: 'input-text',
        name: 'username',
        label: '用户名',
        required: true,
        placeholder: '请输入用户名',
      },
      {
        type: 'input-password',
        name: 'password',
        label: '密码',
        required: true,
        placeholder: '请输入密码',
      },
      {
        type: 'checkbox',
        name: 'remember',
        option: '记住我',
      },
    ],
  },
};

// ============ 2. 用户信息卡片列表（wd-card + wd-avatar + wd-tag）============
const USER_PROFILE_LIST_JSON = {
  type: 'page',
  title: '用户信息',
  data: {
    users: [
      {
        id: 1,
        name: '张三',
        email: 'zhangsan@example.com',
        avatar: 'https://i.pravatar.cc/80?img=1',
        role: '管理员',
        status: 'active',
      },
      {
        id: 2,
        name: '李四',
        email: 'lisi@example.com',
        avatar: 'https://i.pravatar.cc/80?img=2',
        role: '开发者',
        status: 'inactive',
      },
      {
        id: 3,
        name: '王五',
        email: 'wangwu@example.com',
        avatar: 'https://i.pravatar.cc/80?img=3',
        role: '测试员',
        status: 'active',
      },
      {
        id: 4,
        name: '赵六',
        email: 'zhaoliu@example.com',
        avatar: 'https://i.pravatar.cc/80?img=4',
        role: '设计师',
        status: 'active',
      },
    ],
  },
  body: {
    type: 'cards',
    source: '${users}',
    card: {
      header: {
        avatar: '${avatar}',
        title: '${name}',
        subTitle: '${email}',
      },
      body: [
        { type: 'tag', label: '${role}' },
        { type: 'tag', label: "${status == 'active' ? '在线' : '离线'}" },
      ],
      actions: [
        {
          type: 'button',
          label: '查看',
          level: 'link',
          actionType: 'toast',
          args: { msgType: 'info', msg: '查看 ${name} 的详情' },
        },
      ],
    },
  },
};

// ============ 3. 表单组件大全（wd-input/number/textarea/switch/radio/checkbox/picker...）============
const FORM_SHOWCASE_JSON = {
  type: 'page',
  title: '表单组件展示',
  body: {
    type: 'form',
    title: '综合信息登记',
    submitText: '提交（本地反馈）',
    body: [
      { type: 'input-text', name: 'name', label: '姓名', required: true, placeholder: '请输入姓名' },
      { type: 'input-number', name: 'age', label: '年龄', min: 0, max: 120, value: 25 },
      { type: 'textarea', name: 'bio', label: '个人简介', maxRows: 4, placeholder: '介绍一下你自己...' },
      { type: 'switch', name: 'vip', label: '开通 VIP', value: false },
      {
        type: 'radios',
        name: 'gender',
        label: '性别',
        value: 'M',
        options: [
          { label: '男', value: 'M' },
          { label: '女', value: 'F' },
          { label: '其他', value: 'O' },
        ],
      },
      {
        type: 'checkboxes',
        name: 'hobbies',
        label: '兴趣爱好',
        options: [
          { label: '阅读', value: 'reading' },
          { label: '运动', value: 'sports' },
          { label: '音乐', value: 'music' },
          { label: '旅行', value: 'travel' },
        ],
      },
      {
        type: 'select',
        name: 'city',
        label: '所在城市',
        options: [
          { label: '北京', value: 'BJ' },
          { label: '上海', value: 'SH' },
          { label: '广州', value: 'GZ' },
          { label: '深圳', value: 'SZ' },
          { label: '杭州', value: 'HZ' },
        ],
      },
      { type: 'date', name: 'birthday', label: '生日' },
      { type: 'datetime', name: 'meetingTime', label: '会议时间' },
      { type: 'rating', name: 'score', label: '满意度', count: 5, value: 4 },
      { type: 'input-range', name: 'volume', label: '音量', min: 0, max: 100, value: 60 },
    ],
    actions: [
      {
        type: 'submit',
        label: '提交',
        level: 'primary',
        actionType: 'toast',
        args: { msgType: 'success', msg: '提交成功（仅本地反馈，无后端）' },
      },
      { type: 'reset', label: '重置' },
    ],
  },
};

// ============ 4. 个人中心（wd-avatar + wd-grid + wd-cell-group + wd-icon + wd-badge）============
const PROFILE_CENTER_JSON = {
  type: 'page',
  title: '个人中心',
  data: {
    user: {
      avatar: 'https://i.pravatar.cc/120?img=12',
      name: '小明同学',
      level: 'Lv.5 黄金会员',
    },
    stats: [
      { label: '余额', value: '¥1,280' },
      { label: '积分', value: '3,600' },
      { label: '优惠券', value: '12' },
    ],
    menu: [
      { label: '我的订单', icon: 'list', desc: '查看全部订单' },
      { label: '收货地址', icon: 'location', desc: '管理收货地址' },
      { label: '消息通知', icon: 'bell', desc: '未读消息', badge: '3' },
      { label: '会员权益', icon: 'star', desc: '专属特权' },
      { label: '帮助中心', icon: 'question', desc: '常见问题' },
      { label: '设置', icon: 'setting', desc: '账户与偏好' },
    ],
  },
  body: [
    {
      type: 'panel',
      className: 'user-header',
      body: [
        { type: 'image', src: '${user.avatar}', className: 'avatar-xl' },
        { type: 'tpl', tpl: '<h3>${user.name}</h3>' },
        { type: 'tag', label: '${user.level}' },
      ],
    },
    {
      type: 'grid',
      columns: [
        { body: { type: 'tpl', tpl: '<b>${stats[0].value}</b><br/>${stats[0].label}' } },
        { body: { type: 'tpl', tpl: '<b>${stats[1].value}</b><br/>${stats[1].label}' } },
        { body: { type: 'tpl', tpl: '<b>${stats[2].value}</b><br/>${stats[2].label}' } },
      ],
    },
    {
      type: 'list',
      source: '${menu}',
      listItem: {
        body: { type: 'tpl', tpl: '<b>${label}</b> <small>${desc}</small>' },
      },
    },
  ],
};

// ============ 5. 商品卡片网格（wd-grid + wd-img + wd-tag + wd-badge + wd-button）============
const PRODUCT_GRID_JSON = {
  type: 'page',
  title: '精选商品',
  data: {
    products: [
      {
        id: 1,
        name: '无线蓝牙耳机',
        price: 299,
        originalPrice: 399,
        sold: 1280,
        image: 'https://picsum.photos/seed/hp1/200',
        tag: '新品',
      },
      {
        id: 2,
        name: '智能运动手表',
        price: 1299,
        originalPrice: 1599,
        sold: 520,
        image: 'https://picsum.photos/seed/hp2/200',
        tag: '热销',
      },
      {
        id: 3,
        name: '限量款运动鞋',
        price: 499,
        originalPrice: 699,
        sold: 3400,
        image: 'https://picsum.photos/seed/hp3/200',
        tag: '限时',
      },
      {
        id: 4,
        name: '多功能双肩背包',
        price: 199,
        originalPrice: 299,
        sold: 850,
        image: 'https://picsum.photos/seed/hp4/200',
        tag: '好评',
      },
    ],
  },
  body: {
    type: 'cards',
    source: '${products}',
    card: {
      header: { title: '${name}' },
      body: [
        { type: 'image', src: '${image}' },
        { type: 'tag', label: '${tag}' },
        { type: 'tpl', tpl: '<b>¥${price}</b> <s>¥${originalPrice}</s>' },
        { type: 'tpl', tpl: '已售 ${sold} 件' },
      ],
      actions: [
        {
          type: 'button',
          label: '加入购物车',
          level: 'primary',
          actionType: 'toast',
          args: { msgType: 'success', msg: '${name} 已加入购物车' },
        },
      ],
    },
  },
};

// ============ 6. Tab 切换导航（wd-tabs + wd-tab）============
const TABS_NAV_JSON = {
  type: 'page',
  title: '内容浏览',
  data: {
    recommends: [
      { title: '推荐文章 A：Vue 3 组合式 API 实战' },
      { title: '推荐文章 B：设计模式入门' },
      { title: '推荐文章 C：前端性能优化' },
    ],
    hot: [
      { title: '热门话题：AI 编码助手的兴起' },
      { title: '热门话题：小程序开发 2026 新趋势' },
      { title: '热门话题：低代码是未来吗' },
    ],
    latest: [
      { title: '最新发布：Wot UI v1.6.0 发布' },
      { title: '最新发布：UniApp x3 alpha' },
    ],
  },
  body: {
    type: 'tabs',
    tabs: [
      {
        title: '📌 推荐',
        body: {
          type: 'list',
          source: '${recommends}',
          listItem: { body: { type: 'tpl', tpl: '${title}' } },
        },
      },
      {
        title: '🔥 热门',
        body: {
          type: 'list',
          source: '${hot}',
          listItem: { body: { type: 'tpl', tpl: '${title}' } },
        },
      },
      {
        title: '🆕 最新',
        body: {
          type: 'list',
          source: '${latest}',
          listItem: { body: { type: 'tpl', tpl: '${title}' } },
        },
      },
    ],
  },
};

// ============ 7. 反馈动作演示（wd-button + wd-popup + wd-message-box + wd-toast + wd-action-sheet）============
const FEEDBACK_DEMO_JSON = {
  type: 'page',
  title: '反馈交互演示',
  body: [
    { type: 'tpl', tpl: '<h3>Toast 提示</h3>' },
    {
      type: 'button',
      label: '✅ 成功提示',
      level: 'primary',
      actionType: 'toast',
      args: { msgType: 'success', msg: '操作成功！' },
    },
    {
      type: 'button',
      label: '❌ 错误提示',
      level: 'danger',
      actionType: 'toast',
      args: { msgType: 'error', msg: '出错啦，请重试' },
    },
    {
      type: 'button',
      label: 'ℹ️ 信息提示',
      level: 'info',
      actionType: 'toast',
      args: { msgType: 'info', msg: '这是一条信息' },
    },
    { type: 'tpl', tpl: '<h3>对话框</h3>' },
    {
      type: 'button',
      label: '确认对话框',
      level: 'default',
      actionType: 'confirm',
      confirmText: '确认要继续吗？',
      confirmTitle: '请确认',
    },
    {
      type: 'button',
      label: '自定义弹窗',
      level: 'primary',
      actionType: 'dialog',
      dialog: {
        title: '自定义弹窗',
        body: [
          { type: 'tpl', tpl: '<p>这是弹窗正文。可放任意内容。</p>' },
          { type: 'tpl', tpl: '<p>你可以在这里放表单、图片或按钮。</p>' },
        ],
      },
    },
    { type: 'tpl', tpl: '<h3>底部抽屉（ActionSheet）</h3>' },
    {
      type: 'button',
      label: '📷 选择来源',
      actionType: 'drawer',
      drawer: {
        position: 'bottom',
        title: '请选择来源',
        body: {
          type: 'list',
          items: [
            { title: '📷 相机拍照' },
            { title: '🖼️ 从相册选择' },
            { title: '📁 从文件导入' },
            { title: '❌ 取消' },
          ],
        },
      },
    },
  ],
};

// ============ 8. 数据仪表盘（wd-card + wd-progress + wd-count-to + wd-grid）============
const DASHBOARD_STATIC_JSON = {
  type: 'page',
  title: '数据仪表盘',
  data: {
    stats: [
      { label: '今日访问', value: 1280, trend: '+12%' },
      { label: '订单数', value: 356, trend: '+5%' },
      { label: '销售额', value: 89600, trend: '-3%' },
    ],
    progress: [
      { label: 'CPU 使用率', value: 68 },
      { label: '内存占用', value: 45 },
      { label: '磁盘空间', value: 82 },
    ],
    recent: [
      { time: '09:12', event: '用户 A 完成下单', status: 'success' },
      { time: '08:55', event: '订单 #1024 已发货', status: 'success' },
      { time: '08:30', event: '订单 #1023 支付失败', status: 'error' },
      { time: '08:10', event: '新用户 B 注册', status: 'success' },
    ],
  },
  body: [
    {
      type: 'grid',
      columns: [
        {
          body: {
            type: 'tpl',
            tpl: '<small>${stats[0].label}</small><h2>${stats[0].value}</h2><small>${stats[0].trend}</small>',
          },
        },
        {
          body: {
            type: 'tpl',
            tpl: '<small>${stats[1].label}</small><h2>${stats[1].value}</h2><small>${stats[1].trend}</small>',
          },
        },
        {
          body: {
            type: 'tpl',
            tpl: '<small>${stats[2].label}</small><h2>¥${stats[2].value}</h2><small>${stats[2].trend}</small>',
          },
        },
      ],
    },
    {
      type: 'panel',
      title: '资源使用',
      body: {
        type: 'list',
        source: '${progress}',
        listItem: {
          body: [
            { type: 'tpl', tpl: '${label}' },
            { type: 'progress', value: '${value}', showLabel: true },
          ],
        },
      },
    },
    {
      type: 'panel',
      title: '最近活动',
      body: {
        type: 'list',
        source: '${recent}',
        listItem: {
          body: [
            { type: 'tpl', tpl: '<b>${time}</b> · ${event}' },
            { type: 'tag', label: "${status == 'success' ? '成功' : '失败'}" },
          ],
        },
      },
    },
  ],
};

// ============ 9. 设置页（wd-cell-group + wd-switch + wd-radio-group + wd-picker）============
const SETTINGS_PAGE_JSON = {
  type: 'page',
  title: '设置',
  body: {
    type: 'form',
    wrapWithPanel: false,
    submitText: '保存设置',
    body: [
      {
        type: 'panel',
        title: '通用',
        body: [
          { type: 'switch', name: 'notify', label: '消息通知', value: true },
          { type: 'switch', name: 'darkMode', label: '深色模式', value: false },
          { type: 'switch', name: 'autoUpdate', label: '自动更新', value: true },
          { type: 'switch', name: 'sound', label: '声音效果', value: true },
        ],
      },
      {
        type: 'panel',
        title: '偏好',
        body: [
          {
            type: 'radios',
            name: 'language',
            label: '语言',
            value: 'zh',
            options: [
              { label: '简体中文', value: 'zh' },
              { label: 'English', value: 'en' },
              { label: '日本語', value: 'ja' },
            ],
          },
          {
            type: 'select',
            name: 'fontSize',
            label: '字体大小',
            value: 'medium',
            options: [
              { label: '小', value: 'small' },
              { label: '中', value: 'medium' },
              { label: '大', value: 'large' },
              { label: '特大', value: 'xlarge' },
            ],
          },
          {
            type: 'select',
            name: 'theme',
            label: '主题色',
            value: 'blue',
            options: [
              { label: '经典蓝', value: 'blue' },
              { label: '青春绿', value: 'green' },
              { label: '活力橙', value: 'orange' },
              { label: '科技紫', value: 'purple' },
            ],
          },
        ],
      },
      {
        type: 'panel',
        title: '账户',
        body: [
          {
            type: 'button',
            label: '修改密码',
            level: 'link',
            actionType: 'toast',
            args: { msgType: 'info', msg: '跳转到修改密码页' },
          },
          {
            type: 'button',
            label: '退出登录',
            level: 'danger',
            actionType: 'confirm',
            confirmText: '确定要退出登录吗？',
          },
        ],
      },
    ],
    actions: [
      {
        type: 'submit',
        label: '保存设置',
        level: 'primary',
        actionType: 'toast',
        args: { msgType: 'success', msg: '设置已保存' },
      },
    ],
  },
};

export const PRESETS: PresetTemplate[] = [
  {
    key: 'blank',
    label: '空白（自己粘贴）',
    description: '清空编辑区，自己粘贴 Amis JSON',
    amis_json: '',
  },
  {
    key: 'login',
    label: '登录页',
    description: '用户名 + 密码 + 记住我，最简单的表单页（保留 api 占位演示提交）',
    amis_json: JSON.stringify(LOGIN_JSON, null, 2),
  },
  {
    key: 'user_profile_list',
    label: '用户信息卡片列表',
    description: 'wd-card + wd-avatar + wd-tag：卡片列表展示用户信息（纯前端数据）',
    amis_json: JSON.stringify(USER_PROFILE_LIST_JSON, null, 2),
  },
  {
    key: 'form_showcase',
    label: '表单组件大全',
    description: '密集覆盖 input/number/textarea/switch/radio/checkbox/picker/date/rate/slider 等 10+ 组件',
    amis_json: JSON.stringify(FORM_SHOWCASE_JSON, null, 2),
  },
  {
    key: 'profile_center',
    label: '个人中心（移动端典型）',
    description: 'wd-avatar + wd-grid + wd-cell-group：头像 + 统计卡片 + 功能菜单，典型小程序首页',
    amis_json: JSON.stringify(PROFILE_CENTER_JSON, null, 2),
  },
  {
    key: 'product_grid',
    label: '商品卡片网格',
    description: 'wd-grid + wd-img + wd-tag + wd-badge：电商类商品展示，含价格/销量/折扣',
    amis_json: JSON.stringify(PRODUCT_GRID_JSON, null, 2),
  },
  {
    key: 'tabs_nav',
    label: 'Tab 切换导航',
    description: 'wd-tabs + wd-tab：三标签页切换不同内容区，典型信息流页面',
    amis_json: JSON.stringify(TABS_NAV_JSON, null, 2),
  },
  {
    key: 'feedback_demo',
    label: '反馈交互演示',
    description: 'Toast / Confirm / Popup / ActionSheet：全部弹层与反馈动作展示',
    amis_json: JSON.stringify(FEEDBACK_DEMO_JSON, null, 2),
  },
  {
    key: 'dashboard_static',
    label: '数据仪表盘',
    description: 'wd-card + wd-progress + wd-grid：指标卡片 + 进度条 + 活动日志（纯前端数据）',
    amis_json: JSON.stringify(DASHBOARD_STATIC_JSON, null, 2),
  },
  {
    key: 'settings_page',
    label: '设置页',
    description: 'wd-cell-group + wd-switch + wd-radio-group + wd-picker：开关组 + 偏好选项 + 账户动作',
    amis_json: JSON.stringify(SETTINGS_PAGE_JSON, null, 2),
  },
];
