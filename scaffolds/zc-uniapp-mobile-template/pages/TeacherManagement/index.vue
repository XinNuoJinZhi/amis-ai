<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, h, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import sheep from '@/sheep';

const m19e12e10_loading = ref(false);
const rcde29cd_crudData = ref([]);
const r7c41e70b_pager = reactive({ page: 1, perPage: 10, total: 0 });
const c14bb6270_selectedRowKeys = ref([]);
const o192c6014_searchKeywords = ref('');
const c5c69692 = ref({});
const v37730c3b_formData = reactive({});
const c5c69692_currentValues = reactive({});
const c5c69692_prevValues = reactive({});
const x3abbbe7d_open = ref(false);
const g797752a8 = ref({});
const v60525477_formData = reactive({});
const g797752a8_currentValues = reactive({});
const g797752a8_prevValues = reactive({});
const p2706e70b_options = ref([]);
const t3a18a80f_pickerOptions = ref([]);
const r38718969_loading = ref(false);
const l3601cf0f_crudData = ref([]);
const o483da7ce_pager = reactive({ page: 1, perPage: 10, total: 0 });
const n3d3f5e23_selectedRowKeys = ref([]);
const k27fc2d20_searchKeywords = ref('');
const h12817df5 = reactive({});
const t3f146c85_formData = reactive({});
const g5f687b1a_currentValues = reactive({});
const m3f5a34a0_prevValues = reactive({});
const e61dc2a82_options = ref([]);
const m32bf6bdc_options = ref([]);
const h3c2b8415_open = ref(false);
const g1ddcd464 = ref({});
const m27ea6568_formData = reactive({});
const g1ddcd464_currentValues = reactive({});
const g1ddcd464_prevValues = reactive({});
const e67abb896_options = ref([]);
const o12c78d84_options = ref([]);
const v426f5dd7_id = ref(undefined);
const v114c5b65_open = ref(false);
const c4a5fe3fc = ref({});
const p7951c927_formData = reactive({});
const c4a5fe3fc_currentValues = reactive({});
const c4a5fe3fc_prevValues = reactive({});
const q5368f4c2_loading = ref(false);
const l591bcbed_options = ref([]);
const h23b07585_id = ref(undefined);
const c5678a31a_open = ref(false);
const l425b641 = ref({});
const y375957ce_formData = reactive({});
const l425b641_currentValues = reactive({});
const l425b641_prevValues = reactive({});
const i75ec1e2c_options = ref([]);
const a7ad86c9c_loading = ref(false);
const l71d2e1b5_id = ref(undefined);
const m47eeb52a_open = ref(false);
const h5ef9b729 = ref({});
const r2e9bb745_formData = reactive({});
const h5ef9b729_currentValues = reactive({});
const h5ef9b729_prevValues = reactive({});
const s6359ca12_options = ref([]);
const e21aceb0_pickerOptions = ref([]);
const d4fccc17b_loading = ref(false);
const x2ac2cd3f_crudData = ref([]);
const q31c5f254_pager = reactive({ page: 1, perPage: 10, total: 0 });
const p17e291c1_selectedRowKeys = ref([]);
const o62162706_searchKeywords = ref('');
const j6a38f3bb = reactive({ id: '${l71d2e1b5_id}' });
const d78d1ef45_formData = reactive({ id: '${l71d2e1b5_id}' });
const e5348eaba_currentValues = reactive({ id: '${l71d2e1b5_id}' });
const l6d5d0a1b_prevValues = reactive({ id: '${l71d2e1b5_id}' });
const o797c7fac_options = ref([]);
const k79a91692_options = ref([]);
const u5fdd8f5e_open = ref(false);
const a43696e20 = ref({});
const r152f8447_formData = reactive({});
const a43696e20_currentValues = reactive({});
const a43696e20_prevValues = reactive({});
const n4ca13907_options = ref([]);
const n16a0e899_options = ref([]);
const d15d0a553_id = ref(undefined);
const r4e605c95_open = ref(false);
const q3142cd6c = ref({});
const y3d9bac86_formData = reactive({});
const q3142cd6c_currentValues = reactive({});
const q3142cd6c_prevValues = reactive({});
const q77b9b306_loading = ref(false);
const o41cb0bd8_loading = ref(false);
const __formSubmitHandler_o61500752 = ref('handleSubmit_o61500752');
const __formSubmitHandler_p14f97af3 = ref('handleSubmit_p14f97af3');
const __formSubmitHandler_c40dd1154 = ref('handleSubmit_c40dd1154');
const __formSubmitHandler_k5166a0c6 = ref('handleSubmit_k5166a0c6');
const __formSubmitHandler_t4ca689fd = ref('handleSubmit_t4ca689fd');
const __formSubmitHandler_o7764b3dc = ref('handleSubmit_o7764b3dc');
const __formSubmitHandler_i3cac2084 = ref('handleSubmit_i3cac2084');
const crudColumns = ref([
  { key: 'name', title: '姓名', dataIndex: ['name'], render: 'render_name_at54ag' },
  { key: 'no', title: '工号', dataIndex: ['no'], render: 'render_no_dk2eqo' },
  { key: 'cardId', title: '身份证号', dataIndex: ['cardId'], render: 'render_cardId_u1r00p' },
  { key: 'user', title: '关联用户', dataIndex: ['user'], render: 'render_user_jducax' },
  {
    key: 'courses',
    title: '课程',
    dataIndex: ['courses'],
    width: 700,
    render: 'render_courses_silf4c',
  },
  { key: 'j5cb4369', title: '操作', width: 150, align: 'center', render: 'render_j5cb4369_q1zih6' },
]);
const __formSubmitHandler_e2e24b4e8 = ref('handleSubmit_e2e24b4e8');

const handleSubmit_o61500752 = async () => {
  if (!g1ddcd464.value) return;

  try {
    const { valid, errors } = await g1ddcd464.value.validate();
    if (valid) {
      const values = m27ea6568_formData;
      // 调用提交回调
      v1c28a679_onFinish(values);
    } else {
      console.error('表单验证失败:', errors);
    }
  } catch (error) {
    console.error('表单验证异常:', error);
  }
};

const i46fb93c_onCancel = () => {
  // 关闭弹窗
  console.log('Popup closed');
};

const p1ccf6885_onOk = async () => {
  // 提交表单
  // TODO: 实现 onOk 逻辑
};

const handleSubmit_p14f97af3 = async () => {
  if (!c4a5fe3fc.value) return;

  try {
    const { valid, errors } = await c4a5fe3fc.value.validate();
    if (valid) {
      const values = p7951c927_formData;
      // 调用提交回调
      w245295b4_onFinish(values);
    } else {
      console.error('表单验证失败:', errors);
    }
  } catch (error) {
    console.error('表单验证异常:', error);
  }
};

const u5bb2c986_onCancel = () => {
  // 关闭弹窗
  console.log('Popup closed');
};

const v27fe278f_onOk = async () => {
  // 提交表单
  // TODO: 实现 onOk 逻辑
};

const handlePrevPage = () => {
  if (o483da7ce_pager.page.value > 1) {
    o483da7ce_pager.page.value--;
    w27652cdc_onPageChange(o483da7ce_pager.page.value, o483da7ce_pager.perPage.value);
  }
};

const handleNextPage = () => {
  const totalPages = Math.ceil(o483da7ce_pager.total.value / o483da7ce_pager.perPage.value);
  if (o483da7ce_pager.page.value < totalPages) {
    o483da7ce_pager.page.value++;
    w27652cdc_onPageChange(o483da7ce_pager.page.value, o483da7ce_pager.perPage.value);
  }
};

const handleSubmit_c40dd1154 = async () => {
  if (!g797752a8.value) return;

  try {
    const { valid, errors } = await g797752a8.value.validate();
    if (valid) {
      const values = v60525477_formData;
      // 调用提交回调
      j2126f4fd_onFinish(values);
    } else {
      console.error('表单验证失败:', errors);
    }
  } catch (error) {
    console.error('表单验证异常:', error);
  }
};

const d296b02f_onCancel = () => {
  // 关闭弹窗
  console.log('Popup closed');
};

const s2734f078_onOk = async () => {
  // 提交表单
  // TODO: 实现 onOk 逻辑
};

const handleSubmit_k5166a0c6 = async () => {
  if (!l425b641.value) return;

  try {
    const { valid, errors } = await l425b641.value.validate();
    if (valid) {
      const values = y375957ce_formData;
      // 调用提交回调
      a15d27e64_onFinish(values);
    } else {
      console.error('表单验证失败:', errors);
    }
  } catch (error) {
    console.error('表单验证异常:', error);
  }
};

const y4c63fce6_onCancel = () => {
  // 关闭弹窗
  console.log('Popup closed');
};

const y163b9630_onOk = async () => {
  // 提交表单
  // TODO: 实现 onOk 逻辑
};

const handleSubmit_t4ca689fd = async () => {
  if (!a43696e20.value) return;

  try {
    const { valid, errors } = await a43696e20.value.validate();
    if (valid) {
      const values = r152f8447_formData;
      // 调用提交回调
      w30ebf550_onFinish(values);
    } else {
      console.error('表单验证失败:', errors);
    }
  } catch (error) {
    console.error('表单验证异常:', error);
  }
};

const k7afcd8cc_onCancel = () => {
  // 关闭弹窗
  console.log('Popup closed');
};

const l19ca86bd_onOk = async () => {
  // 提交表单
  // TODO: 实现 onOk 逻辑
};

const handleSubmit_o7764b3dc = async () => {
  if (!q3142cd6c.value) return;

  try {
    const { valid, errors } = await q3142cd6c.value.validate();
    if (valid) {
      const values = y3d9bac86_formData;
      // 调用提交回调
      z6032a225_onFinish(values);
    } else {
      console.error('表单验证失败:', errors);
    }
  } catch (error) {
    console.error('表单验证异常:', error);
  }
};

const i2a73b478_onCancel = () => {
  // 关闭弹窗
  console.log('Popup closed');
};

const t59d2b31d_onOk = async () => {
  // 提交表单
  // TODO: 实现 onOk 逻辑
};

const handleSubmit_i3cac2084 = async () => {
  if (!h5ef9b729.value) return;

  try {
    const { valid, errors } = await h5ef9b729.value.validate();
    if (valid) {
      const values = r2e9bb745_formData;
      // 调用提交回调
      j4d9faf67_onFinish(values);
    } else {
      console.error('表单验证失败:', errors);
    }
  } catch (error) {
    console.error('表单验证异常:', error);
  }
};

const t7fd40309_onCancel = () => {
  // 关闭弹窗
  console.log('Popup closed');
};

const c7f38683a_onOk = async () => {
  // 提交表单
  // TODO: 实现 onOk 逻辑
};

const render_name_at54ag = (value, record, index) => {
  return `${record.name}`;
};

const render_no_dk2eqo = (value, record, index) => {
  return `${record.no}`;
};

const render_cardId_u1r00p = (value, record, index) => {
  return `${record.cardId}`;
};

const render_user_jducax = (value, record, index) => {
  return h(WdTag, {}, () => '{{ z51428d73_getValue(record.user) }}');
};

const render_courses_silf4c = (value, record, index) => {
  // TODO: 实现复杂组件渲染（包含 Table/Space/Button）
  return '[复杂组件]';
};

const render_j5cb4369_q1zih6 = (value, record, index) => {
  // TODO: 实现复杂组件渲染（包含 Table/Space/Button）
  return '[复杂组件]';
};

const handleSubmit_e2e24b4e8 = async () => {
  if (!c5c69692.value) return;

  try {
    const { valid, errors } = await c5c69692.value.validate();
    if (valid) {
      const values = v37730c3b_formData;
      // 调用提交回调
      r85192cf_fetchData(values);
    } else {
      console.error('表单验证失败:', errors);
    }
  } catch (error) {
    console.error('表单验证异常:', error);
  }
};

const t343deba5_onFinish = async () => {
  r85192cf_fetchData();
};

const n111bedbb_onValuesChange = (_: any, allValues: Record<string, any>) => {
  c5c69692_prevValues.value = c5c69692_currentValues;
  c5c69692_currentValues.value = allValues;
};

const b66b04e2f = async () => {
  if (c5c69692.value) {
    try {
      await c5c69692.value.validate();
      t343deba5_onFinish();
    } catch (error) {
      // 表单验证失败
    }
  }
};

/*查询CRUD数据*/
const r85192cf_fetchData = async () => {
  m19e12e10_loading.value = true;
  const params = {
    'name[like]': v37730c3b_formData.name,
    'no[eq]': v37730c3b_formData.no,
    'cardId[eq]': v37730c3b_formData.cardId,
    __keywords: o192c6014_searchKeywords.value,
    page: r7c41e70b_pager.page,
    perPage: r7c41e70b_pager.perPage,
  };
  let resData: any = {};
  resData = await sheep.$api({
    url: `model://master.teacher-u%3Ad9f299249c43?__fields[0]=name&__fields[1]=no&__fields[2]=cardId&__fields[3]=user&__fields[4]=courses&__fields[5]=teacherId`,
    method: 'get',
    data: params,
  });
  m19e12e10_loading.value = false;
  rcde29cd_crudData.value = Array.isArray(resData?.data) ? resData.data : resData?.data?.items;
  r7c41e70b_pager.total = Array.isArray(resData?.data)
    ? resData.data.length
    : resData?.data?.count || 0;
};

/*搜索框回调*/
const z30b45197_onSearch = (value: string) => {
  r7c41e70b_pager.page = 1;
  o192c6014_searchKeywords.value = value;
};

/*获取UserSelect选项*/
const g18753268_getOptions = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/source`,
    method: 'get',
  });
  p2706e70b_options.value = resData.data.options;
};

/*获取Picker选项数据*/
const h61a758e5_getPickerOptions = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `model://master.course-u%3A0db92262e73d?__fields[0]=id&__fields[1]=code&__fields[2]=name&__fields[3]=remark&__fields[4]=createdBy&__fields[5]=updatedBy&__fields[6]=createdAt&__fields[7]=updatedAt`,
    method: 'get',
  });
  t3a18a80f_pickerOptions.value = resData.data.items;
};

/*获取Select选项*/
const e4f16b9de_fetchData = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/source`,
    method: 'get',
  });
  e61dc2a82_options.value = resData.data.options;
};

/*获取Select选项*/
const k4cb77704_fetchData = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/source`,
    method: 'get',
  });
  m32bf6bdc_options.value = resData.data.options;
};

const g2ac55762_onFinish = async () => {
  b2a490c3d_fetchData();
};

const s144f95e_onValuesChange = (_: any, allValues: Record<string, any>) => {
  m3f5a34a0_prevValues.value = g5f687b1a_currentValues;
  g5f687b1a_currentValues.value = allValues;
};

const d364e2839 = async () => {
  if (h12817df5) {
    try {
      await h12817df5.validate();
      t343deba5_onFinish();
    } catch (error) {
      // 表单验证失败
    }
  }
};

/*查询CRUD数据*/
const b2a490c3d_fetchData = async () => {
  r38718969_loading.value = true;
  const params = {
    'id[eq]': t3f146c85_formData.id,
    'code[like]': t3f146c85_formData.code,
    'name[like]': t3f146c85_formData.name,
    'remark[like]': t3f146c85_formData.remark,
    'createdBy[eq]': t3f146c85_formData.createdBy,
    'updatedBy[eq]': t3f146c85_formData.updatedBy,
    'createdAt[eq]': t3f146c85_formData.createdAt,
    'updatedAt[eq]': t3f146c85_formData.updatedAt,
    __keywords: k27fc2d20_searchKeywords.value,
    page: o483da7ce_pager.page,
    perPage: o483da7ce_pager.perPage,
  };
  let resData: any = {};
  resData = await sheep.$api({
    url: `model://master.course-u%3A0db92262e73d?__fields[0]=id&__fields[1]=code&__fields[2]=name&__fields[3]=remark&__fields[4]=createdBy&__fields[5]=updatedBy&__fields[6]=createdAt&__fields[7]=updatedAt`,
    method: 'get',
    data: params,
  });
  r38718969_loading.value = false;
  l3601cf0f_crudData.value = Array.isArray(resData?.data) ? resData.data : resData?.data?.items;
  o483da7ce_pager.total = Array.isArray(resData?.data)
    ? resData.data.length
    : resData?.data?.count || 0;
};

/*搜索框回调*/
const se9fb18_onSearch = (value: string) => {
  o483da7ce_pager.page = 1;
  k27fc2d20_searchKeywords.value = value;
};

const v1c28a679_onFinish = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `post:model://master.course-u%3A0db92262e73d`,
    method: 'get',
    data: (() => {
      const removeEmptyFields = (obj) => {
        if (obj === null || obj === undefined) return undefined;
        if (Array.isArray(obj)) {
          return obj.length === 0
            ? undefined
            : obj.map((item) => removeEmptyFields(item)).filter((item) => item !== undefined);
        }
        if (typeof obj === 'object') {
          const cleaned = {};
          for (const key in obj) {
            const value = obj[key];
            if (value === '' || value === null || value === undefined) continue;
            if (Array.isArray(value) && value.length === 0) continue;
            if (typeof value === 'object' && !Array.isArray(value)) {
              const cleanedNested = removeEmptyFields(value);
              if (cleanedNested !== undefined && Object.keys(cleanedNested).length > 0) {
                cleaned[key] = cleanedNested;
              }
            } else {
              cleaned[key] = value;
            }
          }
          return Object.keys(cleaned).length === 0 ? {} : cleaned;
        }
        return obj;
      };
      return removeEmptyFields(g1ddcd464.getFieldsValue());
    })(),
  });
  g1ddcd464.value.resetFields();
  b2a490c3d_fetchData();
  h3c2b8415_open.value = false;
};

const m5b67d28c_onValuesChange = (_: any, allValues: Record<string, any>) => {
  g1ddcd464_prevValues.value = g1ddcd464_currentValues;
  g1ddcd464_currentValues.value = allValues;
};

const g6659c4c8_afterOpenChange = async (open: boolean) => {
  if (open) {
    g1ddcd464.value = {};
    m27ea6568_formData.value = {};
  }
};

const z4338f08b = async () => {
  h3c2b8415_open.value = false;
  g1ddcd464.value = { ...g1ddcd464, value: {} };
  // TODO: 实现 action: reset
  m27ea6568_formData.value = {
    ...m27ea6568_formData,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  g1ddcd464_currentValues.value = {
    ...g1ddcd464_currentValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  g1ddcd464_prevValues.value = {
    ...g1ddcd464_prevValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  h3c2b8415_open.value = true;
};

/*分页改变回调*/
const w27652cdc_onPageChange = (page: number, pageSize: number) => {
  o483da7ce_pager.value = {
    ...o483da7ce_pager,
    page: page,
    perPage: pageSize,
    total: o483da7ce_pager.total,
  };
};

/*重置分页到第一页*/
const b7b73e7df_resetPager = () => {
  o483da7ce_pager.value = {
    ...o483da7ce_pager,
    page: 1,
    perPage: o483da7ce_pager.perPage,
    total: o483da7ce_pager.total,
  };
};

/*行选择改变回调*/
const h3299b243_onSelectionChange = (selectedKeys: any[], selectedRows: any[]) => {
  n3d3f5e23_selectedRowKeys.value = selectedKeys;
};

/*查询创建人字典*/
const d7fd69873_getOptions = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/options`,
    method: 'get',
  });
  e67abb896_options.value = resData.data.options;
};

const p4ffc41b5_getValue = (value: string) => {
  const finded = e67abb896_options.value.find((item: any) => item.value === value);
  return finded?.label || '';
};

/*查询更新人字典*/
const a12051b3e_getOptions = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/options`,
    method: 'get',
  });
  o12c78d84_options.value = resData.data.options;
};

const y760e61fc_getValue = (value: string) => {
  const finded = o12c78d84_options.value.find((item: any) => item.value === value);
  return finded?.label || '';
};

const w245295b4_onFinish = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `model://master.course-u%3A0db92262e73d/${v426f5dd7_id}`,
    method: 'get',
    data: (() => {
      const removeEmptyFields = (obj) => {
        if (obj === null || obj === undefined) return undefined;
        if (Array.isArray(obj)) {
          return obj.length === 0
            ? undefined
            : obj.map((item) => removeEmptyFields(item)).filter((item) => item !== undefined);
        }
        if (typeof obj === 'object') {
          const cleaned = {};
          for (const key in obj) {
            const value = obj[key];
            if (value === '' || value === null || value === undefined) continue;
            if (Array.isArray(value) && value.length === 0) continue;
            if (typeof value === 'object' && !Array.isArray(value)) {
              const cleanedNested = removeEmptyFields(value);
              if (cleanedNested !== undefined && Object.keys(cleanedNested).length > 0) {
                cleaned[key] = cleanedNested;
              }
            } else {
              cleaned[key] = value;
            }
          }
          return Object.keys(cleaned).length === 0 ? {} : cleaned;
        }
        return obj;
      };
      return removeEmptyFields(c4a5fe3fc.getFieldsValue());
    })(),
  });
  c4a5fe3fc.value.resetFields();
  r85192cf_fetchData();
  v114c5b65_open.value = false;
};

const lc5dc2df_onValuesChange = (_: any, allValues: Record<string, any>) => {
  c4a5fe3fc_prevValues.value = c4a5fe3fc_currentValues;
  c4a5fe3fc_currentValues.value = allValues;
};

const i28308d80_afterOpenChange = async (open: boolean) => {
  if (open) {
    try {
      q5368f4c2_loading.value = true;
      let resData: any = {};
      resData = await sheep.$api({
        url: `model://master.course-u%3A0db92262e73d/${v426f5dd7_id}?__fields[0]=code&__fields[1]=name&__fields[2]=remark`,
        method: 'get',
      });
      c4a5fe3fc.value = resData.data;
      p7951c927_formData.value = resData.data;
    } finally {
      q5368f4c2_loading.value = false;
    }
  }
};

const w1ab6b52c = async () => {
  v114c5b65_open.value = false;
  c4a5fe3fc.value = { ...c4a5fe3fc, value: {} };
  // TODO: 实现 action: reset
  p7951c927_formData.value = {
    ...p7951c927_formData,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  c4a5fe3fc_currentValues.value = {
    ...c4a5fe3fc_currentValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  c4a5fe3fc_prevValues.value = {
    ...c4a5fe3fc_prevValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  q5368f4c2_loading.value = false;
  v426f5dd7_id.value = record.id;
  v114c5b65_open.value = true;
};

const m3c264fe8 = async (record: any) => {
  // TODO: 实现 action: confirm
};

const j2126f4fd_onFinish = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `post:model://master.teacher-u%3Ad9f299249c43`,
    method: 'get',
    data: (() => {
      const removeEmptyFields = (obj) => {
        if (obj === null || obj === undefined) return undefined;
        if (Array.isArray(obj)) {
          return obj.length === 0
            ? undefined
            : obj.map((item) => removeEmptyFields(item)).filter((item) => item !== undefined);
        }
        if (typeof obj === 'object') {
          const cleaned = {};
          for (const key in obj) {
            const value = obj[key];
            if (value === '' || value === null || value === undefined) continue;
            if (Array.isArray(value) && value.length === 0) continue;
            if (typeof value === 'object' && !Array.isArray(value)) {
              const cleanedNested = removeEmptyFields(value);
              if (cleanedNested !== undefined && Object.keys(cleanedNested).length > 0) {
                cleaned[key] = cleanedNested;
              }
            } else {
              cleaned[key] = value;
            }
          }
          return Object.keys(cleaned).length === 0 ? {} : cleaned;
        }
        return obj;
      };
      return removeEmptyFields(g797752a8.getFieldsValue());
    })(),
  });
  g797752a8.value.resetFields();
  r85192cf_fetchData();
  r85192cf_fetchData();
  x3abbbe7d_open.value = false;
};

const i101c012a_onValuesChange = (_: any, allValues: Record<string, any>) => {
  g797752a8_prevValues.value = g797752a8_currentValues;
  g797752a8_currentValues.value = allValues;
};

const i75e0d8e2_afterOpenChange = async (open: boolean) => {
  if (open) {
    g797752a8.value = {
      ...g797752a8,
      value: { 'g797752a8.o3c75c84e.b2a490c3d.b2a490c3d.v2d58bda9.id': '${v426f5dd7_id}' },
    };
    v60525477_formData.value = {
      ...v60525477_formData,
      'g797752a8.o3c75c84e.b2a490c3d.b2a490c3d.v2d58bda9.id': v426f5dd7_id.value,
    };
  }
};

const r1afe3d13 = async () => {
  x3abbbe7d_open.value = false;
  g797752a8.value = { ...g797752a8, value: {} };
  // TODO: 实现 action: reset
  v60525477_formData.value = {
    ...v60525477_formData,
    name: undefined,
    no: undefined,
    cardId: undefined,
    user: undefined,
    courses: undefined,
  };
  g797752a8_currentValues.value = {
    ...g797752a8_currentValues,
    name: undefined,
    no: undefined,
    cardId: undefined,
    user: undefined,
    courses: undefined,
  };
  g797752a8_prevValues.value = {
    ...g797752a8_prevValues,
    name: undefined,
    no: undefined,
    cardId: undefined,
    user: undefined,
    courses: undefined,
  };
  p2706e70b_options.value = {};
  t3a18a80f_pickerOptions.value = {};
  r38718969_loading.value = false;
  l3601cf0f_crudData.value = {};
  o483da7ce_pager.value = { ...o483da7ce_pager, page: 1, perPage: 10, total: 0 };
  n3d3f5e23_selectedRowKeys.value = {};
  k27fc2d20_searchKeywords.value = h12817df5.value = {
    ...h12817df5,
    id: undefined,
    code: undefined,
    name: undefined,
    remark: undefined,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
  // TODO: 实现 action: reset
  t3f146c85_formData.value = {
    ...t3f146c85_formData,
    id: undefined,
    code: undefined,
    name: undefined,
    remark: undefined,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
  g5f687b1a_currentValues.value = {
    ...g5f687b1a_currentValues,
    id: undefined,
    code: undefined,
    name: undefined,
    remark: undefined,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
  m3f5a34a0_prevValues.value = {
    ...m3f5a34a0_prevValues,
    id: undefined,
    code: undefined,
    name: undefined,
    remark: undefined,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
  e61dc2a82_options.value = {};
  m32bf6bdc_options.value = {};
  h3c2b8415_open.value = false;
  g1ddcd464.value = { ...g1ddcd464, value: {} };
  // TODO: 实现 action: reset
  m27ea6568_formData.value = {
    ...m27ea6568_formData,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  g1ddcd464_currentValues.value = {
    ...g1ddcd464_currentValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  g1ddcd464_prevValues.value = {
    ...g1ddcd464_prevValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  e67abb896_options.value = {};
  o12c78d84_options.value = {};
  v114c5b65_open.value = false;
  c4a5fe3fc.value = { ...c4a5fe3fc, value: {} };
  // TODO: 实现 action: reset
  p7951c927_formData.value = {
    ...p7951c927_formData,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  c4a5fe3fc_currentValues.value = {
    ...c4a5fe3fc_currentValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  c4a5fe3fc_prevValues.value = {
    ...c4a5fe3fc_prevValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  q5368f4c2_loading.value = false;
  x3abbbe7d_open.value = true;
};

/*分页改变回调*/
const f4368a645_onPageChange = (page: number, pageSize: number) => {
  r7c41e70b_pager.value = {
    ...r7c41e70b_pager,
    page: page,
    perPage: pageSize,
    total: r7c41e70b_pager.total,
  };
};

/*重置分页到第一页*/
const z432318b7_resetPager = () => {
  r7c41e70b_pager.value = {
    ...r7c41e70b_pager,
    page: 1,
    perPage: r7c41e70b_pager.perPage,
    total: r7c41e70b_pager.total,
  };
};

/*行选择改变回调*/
const x19c80ab3_onSelectionChange = (selectedKeys: any[], selectedRows: any[]) => {
  c14bb6270_selectedRowKeys.value = selectedKeys;
};

/*查询关联用户字典*/
const w2109fc56_getOptions = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/options`,
    method: 'get',
  });
  l591bcbed_options.value = resData.data.options;
};

const z51428d73_getValue = (value: string) => {
  const finded = l591bcbed_options.value.find((item: any) => item.value === value);
  return finded?.label || '';
};

/*查询关联用户字典*/
const o52360c1a_getOptions = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/options`,
    method: 'get',
  });
  i75ec1e2c_options.value = resData.data.options;
};

const n45ffa7ed_getValue = (value: string) => {
  const finded = i75ec1e2c_options.value.find((item: any) => item.value === value);
  return finded?.label || '';
};

const a15d27e64_onFinish = async () => {
  l425b641.value.resetFields();
  r85192cf_fetchData();
  c5678a31a_open.value = false;
};

const z34231f39_onValuesChange = (_: any, allValues: Record<string, any>) => {
  l425b641_prevValues.value = l425b641_currentValues;
  l425b641_currentValues.value = allValues;
};

const d51f25f1f_afterOpenChange = async (open: boolean) => {
  if (open) {
    try {
      a7ad86c9c_loading.value = true;
      let resData: any = {};
      resData = await sheep.$api({
        url: `model://master.teacher-u%3Ad9f299249c43/${h23b07585_id}?__fields[0]=name&__fields[1]=no&__fields[2]=cardId&__fields[3]=user&__fields[4]=courses&__fields[5]=teacherId`,
        method: 'get',
      });
      l425b641.value = resData.data;
      y375957ce_formData.value = resData.data;
    } finally {
      a7ad86c9c_loading.value = false;
    }
  }
};

const w57547194 = async () => {
  c5678a31a_open.value = false;
  l425b641.value = { ...l425b641, value: {} };
  // TODO: 实现 action: reset
  y375957ce_formData.value = { ...y375957ce_formData, courses: undefined };
  l425b641_currentValues.value = { ...l425b641_currentValues, courses: undefined };
  l425b641_prevValues.value = { ...l425b641_prevValues, courses: undefined };
  i75ec1e2c_options.value = {};
  a7ad86c9c_loading.value = false;
  h23b07585_id.value = record.id;
  c5678a31a_open.value = true;
};

/*获取UserSelect选项*/
const w62b59696_getOptions = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/source`,
    method: 'get',
  });
  s6359ca12_options.value = resData.data.options;
};

/*获取Picker选项数据*/
const x106f5723_getPickerOptions = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `model://master.course-u%3A8d48ec039587?__fields[0]=id&__fields[1]=code&__fields[2]=name&__fields[3]=remark&__fields[4]=createdBy&__fields[5]=updatedBy&__fields[6]=createdAt&__fields[7]=updatedAt`,
    method: 'get',
  });
  e21aceb0_pickerOptions.value = resData.data.items;
};

/*获取Select选项*/
const n2fdec121_fetchData = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/source`,
    method: 'get',
  });
  o797c7fac_options.value = resData.data.options;
};

/*获取Select选项*/
const fb49454d_fetchData = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/source`,
    method: 'get',
  });
  k79a91692_options.value = resData.data.options;
};

const h4ca2a979_onFinish = async () => {
  x508855ef_fetchData();
};

const z3b282aeb_onValuesChange = (_: any, allValues: Record<string, any>) => {
  l6d5d0a1b_prevValues.value = e5348eaba_currentValues;
  e5348eaba_currentValues.value = allValues;
};

const d59fc397f = async () => {
  if (j6a38f3bb) {
    try {
      await j6a38f3bb.validate();
      t343deba5_onFinish();
    } catch (error) {
      // 表单验证失败
    }
  }
};

/*查询CRUD数据*/
const x508855ef_fetchData = async () => {
  d4fccc17b_loading.value = true;
  const params = {
    'id[eq]': d78d1ef45_formData.id,
    'code[like]': d78d1ef45_formData.code,
    'name[like]': d78d1ef45_formData.name,
    'remark[like]': d78d1ef45_formData.remark,
    'createdBy[eq]': d78d1ef45_formData.createdBy,
    'updatedBy[eq]': d78d1ef45_formData.updatedBy,
    'createdAt[eq]': d78d1ef45_formData.createdAt,
    'updatedAt[eq]': d78d1ef45_formData.updatedAt,
    __keywords: o62162706_searchKeywords.value,
    page: q31c5f254_pager.page,
    perPage: q31c5f254_pager.perPage,
  };
  let resData: any = {};
  resData = await sheep.$api({
    url: `model://master.course-u%3A8d48ec039587?__fields[0]=id&__fields[1]=code&__fields[2]=name&__fields[3]=remark&__fields[4]=createdBy&__fields[5]=updatedBy&__fields[6]=createdAt&__fields[7]=updatedAt`,
    method: 'get',
    data: params,
  });
  d4fccc17b_loading.value = false;
  x2ac2cd3f_crudData.value = Array.isArray(resData?.data) ? resData.data : resData?.data?.items;
  q31c5f254_pager.total = Array.isArray(resData?.data)
    ? resData.data.length
    : resData?.data?.count || 0;
};

/*搜索框回调*/
const a7fda96de_onSearch = (value: string) => {
  q31c5f254_pager.page = 1;
  o62162706_searchKeywords.value = value;
};

const w30ebf550_onFinish = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `post:model://master.course-u%3A8d48ec039587`,
    method: 'get',
    data: (() => {
      const removeEmptyFields = (obj) => {
        if (obj === null || obj === undefined) return undefined;
        if (Array.isArray(obj)) {
          return obj.length === 0
            ? undefined
            : obj.map((item) => removeEmptyFields(item)).filter((item) => item !== undefined);
        }
        if (typeof obj === 'object') {
          const cleaned = {};
          for (const key in obj) {
            const value = obj[key];
            if (value === '' || value === null || value === undefined) continue;
            if (Array.isArray(value) && value.length === 0) continue;
            if (typeof value === 'object' && !Array.isArray(value)) {
              const cleanedNested = removeEmptyFields(value);
              if (cleanedNested !== undefined && Object.keys(cleanedNested).length > 0) {
                cleaned[key] = cleanedNested;
              }
            } else {
              cleaned[key] = value;
            }
          }
          return Object.keys(cleaned).length === 0 ? {} : cleaned;
        }
        return obj;
      };
      return removeEmptyFields(a43696e20.getFieldsValue());
    })(),
  });
  a43696e20.value.resetFields();
  x508855ef_fetchData();
  u5fdd8f5e_open.value = false;
};

const d17df9935_onValuesChange = (_: any, allValues: Record<string, any>) => {
  a43696e20_prevValues.value = a43696e20_currentValues;
  a43696e20_currentValues.value = allValues;
};

const h601a5b43_afterOpenChange = async (open: boolean) => {
  if (open) {
    a43696e20.value = {};
    r152f8447_formData.value = {};
  }
};

const t438fb4a5 = async () => {
  u5fdd8f5e_open.value = false;
  a43696e20.value = { ...a43696e20, value: {} };
  // TODO: 实现 action: reset
  r152f8447_formData.value = {
    ...r152f8447_formData,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  a43696e20_currentValues.value = {
    ...a43696e20_currentValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  a43696e20_prevValues.value = {
    ...a43696e20_prevValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  u5fdd8f5e_open.value = true;
};

/*分页改变回调*/
const u3f678b16_onPageChange = (page: number, pageSize: number) => {
  q31c5f254_pager.value = {
    ...q31c5f254_pager,
    page: page,
    perPage: pageSize,
    total: q31c5f254_pager.total,
  };
};

/*重置分页到第一页*/
const h2fd744ed_resetPager = () => {
  q31c5f254_pager.value = {
    ...q31c5f254_pager,
    page: 1,
    perPage: q31c5f254_pager.perPage,
    total: q31c5f254_pager.total,
  };
};

/*行选择改变回调*/
const q6cf4f3c8_onSelectionChange = (selectedKeys: any[], selectedRows: any[]) => {
  p17e291c1_selectedRowKeys.value = selectedKeys;
};

/*查询创建人字典*/
const g676dbee8_getOptions = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/options`,
    method: 'get',
  });
  n4ca13907_options.value = resData.data.options;
};

const e47438a2_getValue = (value: string) => {
  const finded = n4ca13907_options.value.find((item: any) => item.value === value);
  return finded?.label || '';
};

/*查询更新人字典*/
const u5d53a276_getOptions = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `app://user/options`,
    method: 'get',
  });
  n16a0e899_options.value = resData.data.options;
};

const q46ebb6d8_getValue = (value: string) => {
  const finded = n16a0e899_options.value.find((item: any) => item.value === value);
  return finded?.label || '';
};

const z6032a225_onFinish = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `model://master.course-u%3A8d48ec039587/${d15d0a553_id}`,
    method: 'get',
    data: (() => {
      const removeEmptyFields = (obj) => {
        if (obj === null || obj === undefined) return undefined;
        if (Array.isArray(obj)) {
          return obj.length === 0
            ? undefined
            : obj.map((item) => removeEmptyFields(item)).filter((item) => item !== undefined);
        }
        if (typeof obj === 'object') {
          const cleaned = {};
          for (const key in obj) {
            const value = obj[key];
            if (value === '' || value === null || value === undefined) continue;
            if (Array.isArray(value) && value.length === 0) continue;
            if (typeof value === 'object' && !Array.isArray(value)) {
              const cleanedNested = removeEmptyFields(value);
              if (cleanedNested !== undefined && Object.keys(cleanedNested).length > 0) {
                cleaned[key] = cleanedNested;
              }
            } else {
              cleaned[key] = value;
            }
          }
          return Object.keys(cleaned).length === 0 ? {} : cleaned;
        }
        return obj;
      };
      return removeEmptyFields(q3142cd6c.getFieldsValue());
    })(),
  });
  q3142cd6c.value.resetFields();
  r4e605c95_open.value = false;
};

const c20651122_onValuesChange = (_: any, allValues: Record<string, any>) => {
  q3142cd6c_prevValues.value = q3142cd6c_currentValues;
  q3142cd6c_currentValues.value = allValues;
};

const s64f844ae_afterOpenChange = async (open: boolean) => {
  if (open) {
    try {
      q77b9b306_loading.value = true;
      let resData: any = {};
      resData = await sheep.$api({
        url: `model://master.course-u%3A8d48ec039587/${d15d0a553_id}?__fields[0]=code&__fields[1]=name&__fields[2]=remark`,
        method: 'get',
      });
      q3142cd6c.value = resData.data;
      y3d9bac86_formData.value = resData.data;
    } finally {
      q77b9b306_loading.value = false;
    }
  }
};

const v785c7abf = async () => {
  r4e605c95_open.value = false;
  q3142cd6c.value = { ...q3142cd6c, value: {} };
  // TODO: 实现 action: reset
  y3d9bac86_formData.value = {
    ...y3d9bac86_formData,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  q3142cd6c_currentValues.value = {
    ...q3142cd6c_currentValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  q3142cd6c_prevValues.value = {
    ...q3142cd6c_prevValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  q77b9b306_loading.value = false;
  d15d0a553_id.value = l71d2e1b5_id.value;
  r4e605c95_open.value = true;
};

const g4f338152 = async (record: any) => {
  // TODO: 实现 action: confirm
};

const j4d9faf67_onFinish = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `model://master.teacher-u%3Ad9f299249c43/${l71d2e1b5_id}`,
    method: 'get',
    data: (() => {
      const removeEmptyFields = (obj) => {
        if (obj === null || obj === undefined) return undefined;
        if (Array.isArray(obj)) {
          return obj.length === 0
            ? undefined
            : obj.map((item) => removeEmptyFields(item)).filter((item) => item !== undefined);
        }
        if (typeof obj === 'object') {
          const cleaned = {};
          for (const key in obj) {
            const value = obj[key];
            if (value === '' || value === null || value === undefined) continue;
            if (Array.isArray(value) && value.length === 0) continue;
            if (typeof value === 'object' && !Array.isArray(value)) {
              const cleanedNested = removeEmptyFields(value);
              if (cleanedNested !== undefined && Object.keys(cleanedNested).length > 0) {
                cleaned[key] = cleanedNested;
              }
            } else {
              cleaned[key] = value;
            }
          }
          return Object.keys(cleaned).length === 0 ? {} : cleaned;
        }
        return obj;
      };
      return removeEmptyFields(h5ef9b729.getFieldsValue());
    })(),
  });
  h5ef9b729.value.resetFields();
  r85192cf_fetchData();
  m47eeb52a_open.value = false;
};

const o59200dce_onValuesChange = (_: any, allValues: Record<string, any>) => {
  h5ef9b729_prevValues.value = h5ef9b729_currentValues;
  h5ef9b729_currentValues.value = allValues;
};

const h3f962a8f_afterOpenChange = async (open: boolean) => {
  if (open) {
    try {
      o41cb0bd8_loading.value = true;
      let resData: any = {};
      resData = await sheep.$api({
        url: `model://master.teacher-u%3Ad9f299249c43/${l71d2e1b5_id}?__fields[0]=name&__fields[1]=no&__fields[2]=cardId&__fields[3]=user&__fields[4]=courses&__fields[5]=teacherId`,
        method: 'get',
      });
      h5ef9b729.value = resData.data;
      r2e9bb745_formData.value = resData.data;
    } finally {
      o41cb0bd8_loading.value = false;
    }
  }
};

const z566c9829 = async () => {
  m47eeb52a_open.value = false;
  h5ef9b729.value = { ...h5ef9b729, value: {} };
  // TODO: 实现 action: reset
  r2e9bb745_formData.value = {
    ...r2e9bb745_formData,
    name: undefined,
    no: undefined,
    cardId: undefined,
    user: undefined,
    courses: undefined,
  };
  h5ef9b729_currentValues.value = {
    ...h5ef9b729_currentValues,
    name: undefined,
    no: undefined,
    cardId: undefined,
    user: undefined,
    courses: undefined,
  };
  h5ef9b729_prevValues.value = {
    ...h5ef9b729_prevValues,
    name: undefined,
    no: undefined,
    cardId: undefined,
    user: undefined,
    courses: undefined,
  };
  s6359ca12_options.value = {};
  e21aceb0_pickerOptions.value = {};
  d4fccc17b_loading.value = false;
  x2ac2cd3f_crudData.value = {};
  q31c5f254_pager.value = { ...q31c5f254_pager, page: 1, perPage: 10, total: 0 };
  p17e291c1_selectedRowKeys.value = {};
  o62162706_searchKeywords.value = j6a38f3bb.value = {
    ...j6a38f3bb,
    id: l71d2e1b5_id.value,
    code: undefined,
    name: undefined,
    remark: undefined,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
  // TODO: 实现 action: reset
  d78d1ef45_formData.value = {
    ...d78d1ef45_formData,
    id: l71d2e1b5_id.value,
    code: undefined,
    name: undefined,
    remark: undefined,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
  e5348eaba_currentValues.value = {
    ...e5348eaba_currentValues,
    id: l71d2e1b5_id.value,
    code: undefined,
    name: undefined,
    remark: undefined,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
  l6d5d0a1b_prevValues.value = {
    ...l6d5d0a1b_prevValues,
    id: l71d2e1b5_id.value,
    code: undefined,
    name: undefined,
    remark: undefined,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
  o797c7fac_options.value = {};
  k79a91692_options.value = {};
  u5fdd8f5e_open.value = false;
  a43696e20.value = { ...a43696e20, value: {} };
  // TODO: 实现 action: reset
  r152f8447_formData.value = {
    ...r152f8447_formData,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  a43696e20_currentValues.value = {
    ...a43696e20_currentValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  a43696e20_prevValues.value = {
    ...a43696e20_prevValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  n4ca13907_options.value = {};
  n16a0e899_options.value = {};
  r4e605c95_open.value = false;
  q3142cd6c.value = { ...q3142cd6c, value: {} };
  // TODO: 实现 action: reset
  y3d9bac86_formData.value = {
    ...y3d9bac86_formData,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  q3142cd6c_currentValues.value = {
    ...q3142cd6c_currentValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  q3142cd6c_prevValues.value = {
    ...q3142cd6c_prevValues,
    code: undefined,
    name: undefined,
    remark: undefined,
  };
  q77b9b306_loading.value = false;
  o41cb0bd8_loading.value = false;
  l71d2e1b5_id.value = record.id;
  m47eeb52a_open.value = true;
};

const f566ad455 = async () => {
  let resData: any = {};
  resData = await sheep.$api({
    url: `delete:model://master.teacher-u%3Ad9f299249c43/${record.id}`,
    method: 'get',
  });
  r85192cf_fetchData();
};

/*r85192cf_fetchData:watch监听*/
watch(
  () => [r7c41e70b_pager.page, r7c41e70b_pager.perPage, o192c6014_searchKeywords.value],
  () => {
    r85192cf_fetchData();
  }
);

/*b2a490c3d_fetchData:watch监听*/
watch(
  () => [o483da7ce_pager.page, o483da7ce_pager.perPage, k27fc2d20_searchKeywords.value],
  () => {
    b2a490c3d_fetchData();
  }
);

/*x508855ef_fetchData:watch监听*/
watch(
  () => [q31c5f254_pager.page, q31c5f254_pager.perPage, o62162706_searchKeywords.value],
  () => {
    x508855ef_fetchData();
  }
);

/*页面初始化*/
onLoad(() => {
  r85192cf_fetchData();
  g18753268_getOptions();
  h61a758e5_getPickerOptions();
  e4f16b9de_fetchData();
  k4cb77704_fetchData();
  b2a490c3d_fetchData();
  d7fd69873_getOptions();
  a12051b3e_getOptions();
  w2109fc56_getOptions();
  o52360c1a_getOptions();
  w62b59696_getOptions();
  x106f5723_getPickerOptions();
  n2fdec121_fetchData();
  fb49454d_fetchData();
  x508855ef_fetchData();
  g676dbee8_getOptions();
  u5d53a276_getOptions();
});
</script>

<template>
  <view
    class="layout-container page"
    style="display: flex; flex-direction: column; min-height: 100vh"
  >
    <wd-popup v-model="h3c2b8415_open" position="center" closable @close="i46fb93c_onCancel">
      <view class="popup-container">
        <view class="popup-header">
          <text class="popup-title">新增「课程」列表</text>
        </view>
        <view class="popup-body">
          <wd-form ref="g1ddcd464" :model="m27ea6568_formData">
            <wd-cell-group border>
              <wd-cell
                prop="code"
                title="编码"
                :rules="[{ required: true, message: '这是必填项' }]"
              >
                <wd-input v-model="m27ea6568_formData.code" placeholder="请输入" />
              </wd-cell>
              <wd-cell
                prop="name"
                title="名称"
                :rules="[{ required: true, message: '这是必填项' }]"
              >
                <wd-input v-model="m27ea6568_formData.name" placeholder="请输入" />
              </wd-cell>
              <wd-cell prop="remark" title="备注">
                <wd-textarea v-model="m27ea6568_formData.remark" placeholder="请输入" auto-height />
              </wd-cell>
            </wd-cell-group>
          </wd-form>
        </view>
        <view class="popup-footer">
          <wd-button
            block
            custom-style="margin-bottom: 16rpx;"
            type="primary"
            @click="p1ccf6885_onOk"
            >确定</wd-button
          >
          <wd-button block @click="i46fb93c_onCancel">取消</wd-button>
        </view>
      </view>
    </wd-popup>
    <wd-popup v-model="v114c5b65_open" position="center" closable @close="u5bb2c986_onCancel">
      <view class="popup-container">
        <view class="popup-header">
          <text class="popup-title">编辑课程数据「${v426f5dd7_id}」</text>
        </view>
        <view class="popup-body">
          <view class="spin-container">
            <wd-loading v-if="q5368f4c2_loading" />
            <view v-show="!q5368f4c2_loading">
              <wd-form ref="c4a5fe3fc" :model="p7951c927_formData">
                <wd-cell-group border>
                  <wd-cell
                    prop="code"
                    title="编码"
                    :rules="[{ required: true, message: '这是必填项' }]"
                  >
                    <wd-input v-model="p7951c927_formData.code" placeholder="请输入" />
                  </wd-cell>
                  <wd-cell
                    prop="name"
                    title="名称"
                    :rules="[{ required: true, message: '这是必填项' }]"
                  >
                    <wd-input v-model="p7951c927_formData.name" placeholder="请输入" />
                  </wd-cell>
                  <wd-cell prop="remark" title="备注">
                    <wd-textarea
                      v-model="p7951c927_formData.remark"
                      placeholder="请输入"
                      auto-height
                    />
                  </wd-cell>
                </wd-cell-group>
              </wd-form>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <wd-button
            block
            custom-style="margin-bottom: 16rpx;"
            type="primary"
            @click="v27fe278f_onOk"
            >确定</wd-button
          >
          <wd-button block @click="u5bb2c986_onCancel">取消</wd-button>
        </view>
      </view>
    </wd-popup>
    <wd-popup v-model="x3abbbe7d_open" position="center" closable @close="d296b02f_onCancel">
      <view class="popup-container">
        <view class="popup-header">
          <text class="popup-title">新增</text>
        </view>
        <view class="popup-body">
          <wd-form ref="g797752a8" :model="v60525477_formData">
            <wd-cell-group border>
              <wd-cell
                prop="name"
                title="姓名"
                :rules="[{ required: true, message: '这是必填项' }]"
              >
                <wd-input v-model="v60525477_formData.name" placeholder="请输入" />
              </wd-cell>
              <wd-cell prop="no" title="工号" :rules="[{ required: true, message: '这是必填项' }]">
                <wd-input v-model="v60525477_formData.no" placeholder="请输入" />
              </wd-cell>
              <wd-cell
                prop="cardId"
                title="身份证号"
                :rules="[{ required: true, message: '这是必填项' }]"
              >
                <wd-input v-model="v60525477_formData.cardId" placeholder="请输入身份证号" />
              </wd-cell>
              <wd-cell
                prop="user"
                title="关联用户"
                :rules="[{ required: true, message: '这是必填项' }]"
              >
                <UserSelect
                  v-model="v60525477_formData.user"
                  :options="p2706e70b_options"
                  :clearable="true"
                />
              </wd-cell>
              <wd-cell prop="courses" title="课程">
                <Picker
                  v-model="v60525477_formData.courses"
                  :source="t3a18a80f_pickerOptions"
                  valueField="id"
                  labelField="name"
                  :multiple="true"
                  :joinValues="false"
                  :embed="true"
                  modalTitle="请选择"
                >
                  <template #pickerSchema="{ rowSelection }">
                    <view class="table-wrapper">
                      <view class="table-card-list" v-loading="r38718969_loading">
                        <view
                          v-for="(record, index) in l3601cf0f_crudData"
                          :key="record.id || index"
                          class="table-card-item"
                        >
                          <wd-checkbox
                            :model-value="rowSelection.selectedRowKeys.includes(record.id)"
                            @change="
                              () =>
                                rowSelection.onChange(
                                  rowSelection.selectedRowKeys.includes(record.id)
                                    ? rowSelection.selectedRowKeys.filter((k) => k !== record.id)
                                    : [...rowSelection.selectedRowKeys, record.id]
                                )
                            "
                          />
                          <view class="table-card-row">
                            <text class="table-card-label">ID</text>
                            <view class="table-card-value">{{ record.id }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">编码</text>
                            <view class="table-card-value">{{ record.code }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">名称</text>
                            <view class="table-card-value">{{ record.name }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">备注</text>
                            <view class="table-card-value">{{ record.remark }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">创建人</text>
                            <view class="table-card-value"
                              ><wd-tag>{{ p4ffc41b5_getValue(record.createdBy) }}</wd-tag></view
                            >
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">更新人</text>
                            <view class="table-card-value"
                              ><wd-tag>{{ y760e61fc_getValue(record.updatedBy) }}</wd-tag></view
                            >
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">创建时间</text>
                            <view class="table-card-value">{{ record.createdAt }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">更新时间</text>
                            <view class="table-card-value">{{ record.updatedAt }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">操作</text>
                            <view class="table-card-value">
                              <view
                                class="uni-space"
                                style="
                                  display: flex;
                                  flex-direction: row;
                                  align-items: center;
                                  gap: 16rpx;
                                "
                              >
                                <wd-button type="text" size="default" @click="w1ab6b52c"
                                  >编辑</wd-button
                                >
                                <wd-button type="text" size="default" @click="m3c264fe8"
                                  >删除</wd-button
                                >
                              </view></view
                            >
                          </view>
                        </view>
                        <view
                          v-if="!l3601cf0f_crudData || l3601cf0f_crudData.length === 0"
                          class="table-card-empty"
                        >
                          <text>暂无数据</text>
                        </view>
                      </view>
                      <view class="table-pagination">
                        <view class="pagination-info">
                          <text>共 {{ o483da7ce_pager.total }} 条</text>
                        </view>
                        <view class="pagination-actions">
                          <wd-button
                            size="small"
                            :disabled="o483da7ce_pager.page <= 1"
                            @click="handlePrevPage"
                            >上一页</wd-button
                          >
                          <text class="pagination-current"
                            >{{ o483da7ce_pager.page }} /
                            {{ Math.ceil(o483da7ce_pager.total / o483da7ce_pager.perPage) }}</text
                          >
                          <wd-button
                            size="small"
                            :disabled="
                              o483da7ce_pager.page >=
                              Math.ceil(o483da7ce_pager.total / o483da7ce_pager.perPage)
                            "
                            @click="handleNextPage"
                            >下一页</wd-button
                          >
                        </view>
                      </view>
                    </view>
                  </template>
                </Picker>
              </wd-cell>
            </wd-cell-group>
          </wd-form>
        </view>
        <view class="popup-footer">
          <wd-button
            block
            custom-style="margin-bottom: 16rpx;"
            type="primary"
            @click="s2734f078_onOk"
            >确定</wd-button
          >
          <wd-button block @click="d296b02f_onCancel">取消</wd-button>
        </view>
      </view>
    </wd-popup>
    <wd-popup v-model="c5678a31a_open" position="center" closable @close="y4c63fce6_onCancel">
      <view class="popup-container">
        <view class="popup-header">
          <text class="popup-title">详情</text>
        </view>
        <view class="popup-body">
          <view class="spin-container">
            <wd-loading v-if="a7ad86c9c_loading" />
            <view v-show="!a7ad86c9c_loading">
              <wd-form ref="l425b641" :model="y375957ce_formData">
                <wd-cell-group border>
                  <wd-cell prop="name" title="姓名">
                    {{ y375957ce_formData.name }}
                  </wd-cell>
                  <wd-cell prop="no" title="工号">
                    {{ y375957ce_formData.no }}
                  </wd-cell>
                  <wd-cell prop="cardId" title="身份证号">
                    {{ y375957ce_formData.cardId }}
                  </wd-cell>
                  <wd-cell prop="user" title="关联用户">
                    <wd-tag>{{ n45ffa7ed_getValue(y375957ce_formData.user) }}</wd-tag>
                  </wd-cell>
                  <wd-cell prop="courses" title="课程">
                    <div>
                      <view class="table-card-list">
                        <view
                          v-for="(record, index) in y375957ce_formData.courses"
                          :key="record.id || index"
                          class="table-card-item"
                        >
                          <view class="table-card-row">
                            <text class="table-card-label">ID</text>
                            <view class="table-card-value">{{ record.id }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">编码</text>
                            <view class="table-card-value">{{ record.code }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">名称</text>
                            <view class="table-card-value">{{ record.name }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">备注</text>
                            <view class="table-card-value">{{ record.remark }}</view>
                          </view>
                        </view>
                        <view
                          v-if="
                            !y375957ce_formData.courses || y375957ce_formData.courses.length === 0
                          "
                          class="table-card-empty"
                        >
                          <text>暂无数据</text>
                        </view>
                      </view>
                    </div>
                  </wd-cell>
                </wd-cell-group>
              </wd-form>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <wd-button
            block
            custom-style="margin-bottom: 16rpx;"
            type="primary"
            @click="y163b9630_onOk"
            >确定</wd-button
          >
          <wd-button block @click="y4c63fce6_onCancel">取消</wd-button>
        </view>
      </view>
    </wd-popup>
    <wd-popup v-model="u5fdd8f5e_open" position="center" closable @close="k7afcd8cc_onCancel">
      <view class="popup-container">
        <view class="popup-header">
          <text class="popup-title">新增「课程」列表</text>
        </view>
        <view class="popup-body">
          <wd-form ref="a43696e20" :model="r152f8447_formData">
            <wd-cell-group border>
              <wd-cell
                prop="code"
                title="编码"
                :rules="[{ required: true, message: '这是必填项' }]"
              >
                <wd-input v-model="r152f8447_formData.code" placeholder="请输入" />
              </wd-cell>
              <wd-cell
                prop="name"
                title="名称"
                :rules="[{ required: true, message: '这是必填项' }]"
              >
                <wd-input v-model="r152f8447_formData.name" placeholder="请输入" />
              </wd-cell>
              <wd-cell prop="remark" title="备注">
                <wd-textarea v-model="r152f8447_formData.remark" placeholder="请输入" auto-height />
              </wd-cell>
            </wd-cell-group>
          </wd-form>
        </view>
        <view class="popup-footer">
          <wd-button
            block
            custom-style="margin-bottom: 16rpx;"
            type="primary"
            @click="l19ca86bd_onOk"
            >确定</wd-button
          >
          <wd-button block @click="k7afcd8cc_onCancel">取消</wd-button>
        </view>
      </view>
    </wd-popup>
    <wd-popup v-model="r4e605c95_open" position="center" closable @close="i2a73b478_onCancel">
      <view class="popup-container">
        <view class="popup-header">
          <text class="popup-title">编辑课程数据「${d15d0a553_id}」</text>
        </view>
        <view class="popup-body">
          <view class="spin-container">
            <wd-loading v-if="q77b9b306_loading" />
            <view v-show="!q77b9b306_loading">
              <wd-form ref="q3142cd6c" :model="y3d9bac86_formData">
                <wd-cell-group border>
                  <wd-cell
                    prop="code"
                    title="编码"
                    :rules="[{ required: true, message: '这是必填项' }]"
                  >
                    <wd-input v-model="y3d9bac86_formData.code" placeholder="请输入" />
                  </wd-cell>
                  <wd-cell
                    prop="name"
                    title="名称"
                    :rules="[{ required: true, message: '这是必填项' }]"
                  >
                    <wd-input v-model="y3d9bac86_formData.name" placeholder="请输入" />
                  </wd-cell>
                  <wd-cell prop="remark" title="备注">
                    <wd-textarea
                      v-model="y3d9bac86_formData.remark"
                      placeholder="请输入"
                      auto-height
                    />
                  </wd-cell>
                </wd-cell-group>
              </wd-form>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <wd-button
            block
            custom-style="margin-bottom: 16rpx;"
            type="primary"
            @click="t59d2b31d_onOk"
            >确定</wd-button
          >
          <wd-button block @click="i2a73b478_onCancel">取消</wd-button>
        </view>
      </view>
    </wd-popup>
    <wd-popup v-model="m47eeb52a_open" position="center" closable @close="t7fd40309_onCancel">
      <view class="popup-container">
        <view class="popup-header">
          <text class="popup-title">编辑</text>
        </view>
        <view class="popup-body">
          <view class="spin-container">
            <wd-loading v-if="o41cb0bd8_loading" />
            <view v-show="!o41cb0bd8_loading">
              <wd-form ref="h5ef9b729" :model="r2e9bb745_formData">
                <wd-cell-group border>
                  <wd-cell
                    prop="name"
                    title="姓名"
                    :rules="[{ required: true, message: '这是必填项' }]"
                  >
                    <wd-input v-model="r2e9bb745_formData.name" placeholder="请输入" />
                  </wd-cell>
                  <wd-cell
                    prop="no"
                    title="工号"
                    :rules="[{ required: true, message: '这是必填项' }]"
                  >
                    <wd-input v-model="r2e9bb745_formData.no" placeholder="请输入" />
                  </wd-cell>
                  <wd-cell
                    prop="cardId"
                    title="身份证号"
                    :rules="[{ required: true, message: '这是必填项' }]"
                  >
                    <wd-input v-model="r2e9bb745_formData.cardId" placeholder="请输入身份证号" />
                  </wd-cell>
                  <wd-cell
                    prop="user"
                    title="关联用户"
                    :rules="[{ required: true, message: '这是必填项' }]"
                  >
                    <UserSelect
                      v-model="r2e9bb745_formData.user"
                      :options="s6359ca12_options"
                      :clearable="true"
                    />
                  </wd-cell>
                  <wd-cell prop="courses" title="课程">
                    <Picker
                      v-model="r2e9bb745_formData.courses"
                      :source="e21aceb0_pickerOptions"
                      valueField="id"
                      labelField="name"
                      :multiple="true"
                      :joinValues="false"
                      :embed="true"
                      modalTitle="请选择"
                    >
                      <template #pickerSchema="{ rowSelection }">
                        <view class="table-wrapper">
                          <view class="table-card-list" v-loading="d4fccc17b_loading">
                            <view
                              v-for="(record, index) in x2ac2cd3f_crudData"
                              :key="record.id || index"
                              class="table-card-item"
                            >
                              <wd-checkbox
                                :model-value="rowSelection.selectedRowKeys.includes(record.id)"
                                @change="
                                  () =>
                                    rowSelection.onChange(
                                      rowSelection.selectedRowKeys.includes(record.id)
                                        ? rowSelection.selectedRowKeys.filter(
                                            (k) => k !== record.id
                                          )
                                        : [...rowSelection.selectedRowKeys, record.id]
                                    )
                                "
                              />
                              <view class="table-card-row">
                                <text class="table-card-label">ID</text>
                                <view class="table-card-value">{{ record.id }}</view>
                              </view>
                              <view class="table-card-row">
                                <text class="table-card-label">编码</text>
                                <view class="table-card-value">{{ record.code }}</view>
                              </view>
                              <view class="table-card-row">
                                <text class="table-card-label">名称</text>
                                <view class="table-card-value">{{ record.name }}</view>
                              </view>
                              <view class="table-card-row">
                                <text class="table-card-label">备注</text>
                                <view class="table-card-value">{{ record.remark }}</view>
                              </view>
                              <view class="table-card-row">
                                <text class="table-card-label">创建人</text>
                                <view class="table-card-value"
                                  ><wd-tag>{{ e47438a2_getValue(record.createdBy) }}</wd-tag></view
                                >
                              </view>
                              <view class="table-card-row">
                                <text class="table-card-label">更新人</text>
                                <view class="table-card-value"
                                  ><wd-tag>{{ q46ebb6d8_getValue(record.updatedBy) }}</wd-tag></view
                                >
                              </view>
                              <view class="table-card-row">
                                <text class="table-card-label">创建时间</text>
                                <view class="table-card-value">{{ record.createdAt }}</view>
                              </view>
                              <view class="table-card-row">
                                <text class="table-card-label">更新时间</text>
                                <view class="table-card-value">{{ record.updatedAt }}</view>
                              </view>
                              <view class="table-card-row">
                                <text class="table-card-label">操作</text>
                                <view class="table-card-value">
                                  <view
                                    class="uni-space"
                                    style="
                                      display: flex;
                                      flex-direction: row;
                                      align-items: center;
                                      gap: 16rpx;
                                    "
                                  >
                                    <wd-button type="text" size="default" @click="v785c7abf"
                                      >编辑</wd-button
                                    >
                                    <wd-button type="text" size="default" @click="g4f338152"
                                      >删除</wd-button
                                    >
                                  </view></view
                                >
                              </view>
                            </view>
                            <view
                              v-if="!x2ac2cd3f_crudData || x2ac2cd3f_crudData.length === 0"
                              class="table-card-empty"
                            >
                              <text>暂无数据</text>
                            </view>
                          </view>
                          <view class="table-pagination">
                            <view class="pagination-info">
                              <text>共 {{ q31c5f254_pager.total }} 条</text>
                            </view>
                            <view class="pagination-actions">
                              <wd-button
                                size="small"
                                :disabled="q31c5f254_pager.page <= 1"
                                @click="handlePrevPage"
                                >上一页</wd-button
                              >
                              <text class="pagination-current"
                                >{{ q31c5f254_pager.page }} /
                                {{
                                  Math.ceil(q31c5f254_pager.total / q31c5f254_pager.perPage)
                                }}</text
                              >
                              <wd-button
                                size="small"
                                :disabled="
                                  q31c5f254_pager.page >=
                                  Math.ceil(q31c5f254_pager.total / q31c5f254_pager.perPage)
                                "
                                @click="handleNextPage"
                                >下一页</wd-button
                              >
                            </view>
                          </view>
                        </view>
                      </template>
                    </Picker>
                  </wd-cell>
                </wd-cell-group>
              </wd-form>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <wd-button
            block
            custom-style="margin-bottom: 16rpx;"
            type="primary"
            @click="c7f38683a_onOk"
            >确定</wd-button
          >
          <wd-button block @click="t7fd40309_onCancel">取消</wd-button>
        </view>
      </view>
    </wd-popup>
    <view
      class="layout-container page-container"
      style="display: flex; flex-direction: column; min-height: 100vh"
    >
      <view
        class="layout-header page-header"
        style="padding: 0 32rpx; background-color: #fff; border-bottom: 1rpx solid #eee"
      >
        <div class="page-title">教师管理</div></view
      >
      <view class="layout-content page-content" style="flex: 1; padding: 24rpx">
        <Crud
          :show-columns-toggler="true"
          :show-reload="true"
          :columns="crudColumns"
          @reload="r85192cf_fetchData"
        >
          <template #filter>
            <wd-card title="条件查询">
              <wd-form ref="c5c69692" :model="v37730c3b_formData">
                <wd-cell-group border>
                  <wd-cell prop="name" title="姓名">
                    <wd-input v-model="v37730c3b_formData.name" placeholder="请输入" />
                  </wd-cell>
                  <wd-cell prop="no" title="工号">
                    <wd-input v-model="v37730c3b_formData.no" placeholder="请输入" />
                  </wd-cell>
                  <wd-cell prop="cardId" title="身份证号">
                    <wd-input v-model="v37730c3b_formData.cardId" placeholder="请输入身份证号" />
                  </wd-cell>
                </wd-cell-group>
              </wd-form>
              <div class="dsl-card-footer">
                <view
                  class="uni-space"
                  style="display: flex; flex-direction: row; align-items: center; gap: 16rpx"
                >
                  <wd-button type="primary" size="default" @click="b66b04e2f">搜索</wd-button>
                </view>
              </div>
            </wd-card>
          </template>
          <template #headerToolbar>
            <wd-button type="primary" size="default" @click="r1afe3d13">新增</wd-button>
          </template>
          <view class="table-wrapper">
            <view class="table-card-list" v-loading="m19e12e10_loading">
              <view
                v-for="(record, index) in rcde29cd_crudData"
                :key="record.id || index"
                class="table-card-item"
              >
                <view class="table-card-row">
                  <text class="table-card-label">姓名</text>
                  <view class="table-card-value">{{ record.name }}</view>
                </view>
                <view class="table-card-row">
                  <text class="table-card-label">工号</text>
                  <view class="table-card-value">{{ record.no }}</view>
                </view>
                <view class="table-card-row">
                  <text class="table-card-label">身份证号</text>
                  <view class="table-card-value">{{ record.cardId }}</view>
                </view>
                <view class="table-card-row">
                  <text class="table-card-label">关联用户</text>
                  <view class="table-card-value"
                    ><wd-tag>{{ z51428d73_getValue(record.user) }}</wd-tag></view
                  >
                </view>
                <view class="table-card-row">
                  <text class="table-card-label">课程</text>
                  <view class="table-card-value">
                    <div
                      :style="{ width: '100%', overflowX: 'auto', margin: 0, padding: 0 }"
                      class="nested-table-container"
                    >
                      <view class="table-card-list">
                        <view
                          v-for="(record, index) in record.courses"
                          :key="record.id || index"
                          class="table-card-item"
                        >
                          <view class="table-card-row">
                            <text class="table-card-label">ID</text>
                            <view class="table-card-value">{{ record.id }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">编码</text>
                            <view class="table-card-value">{{ record.code }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">名称</text>
                            <view class="table-card-value">{{ record.name }}</view>
                          </view>
                          <view class="table-card-row">
                            <text class="table-card-label">备注</text>
                            <view class="table-card-value">{{ record.remark }}</view>
                          </view>
                        </view>
                        <view
                          v-if="!record.courses || record.courses.length === 0"
                          class="table-card-empty"
                        >
                          <text>暂无数据</text>
                        </view>
                      </view>
                    </div></view
                  >
                </view>
                <view class="table-card-row">
                  <text class="table-card-label">操作</text>
                  <view class="table-card-value">
                    <view
                      class="uni-space"
                      style="display: flex; flex-direction: row; align-items: center; gap: 16rpx"
                    >
                      <wd-button type="text" size="default" @click="w57547194">详情</wd-button>
                      <wd-button type="text" size="default" @click="z566c9829">编辑</wd-button>
                      <wd-button type="text" size="default" @click="f566ad455">删除</wd-button>
                    </view></view
                  >
                </view>
              </view>
              <view
                v-if="!rcde29cd_crudData || rcde29cd_crudData.length === 0"
                class="table-card-empty"
              >
                <text>暂无数据</text>
              </view>
            </view>
            <view class="table-pagination">
              <view class="pagination-info">
                <text>共 {{ r7c41e70b_pager.total }} 条</text>
              </view>
              <view class="pagination-actions">
                <wd-button
                  size="small"
                  :disabled="r7c41e70b_pager.page <= 1"
                  @click="handlePrevPage"
                  >上一页</wd-button
                >
                <text class="pagination-current"
                  >{{ r7c41e70b_pager.page }} /
                  {{ Math.ceil(r7c41e70b_pager.total / r7c41e70b_pager.perPage) }}</text
                >
                <wd-button
                  size="small"
                  :disabled="
                    r7c41e70b_pager.page >=
                    Math.ceil(r7c41e70b_pager.total / r7c41e70b_pager.perPage)
                  "
                  @click="handleNextPage"
                  >下一页</wd-button
                >
              </view>
            </view>
          </view>
        </Crud></view
      ></view
    ></view
  >
</template>

<style scoped lang="scss">
/* 页面样式 */
</style>
