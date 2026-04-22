#!/usr/bin/env bash
# B.6 冷启动种子样例：批量入库 7 条典型场景
#
# 用法：
#   ./shared/scripts/seed-rag-samples.sh                  # 入库为 status=approved（推荐，立即进飞轮）
#   ./shared/scripts/seed-rag-samples.sh pending           # 入库为 status=pending（等审核）
#
# 默认 tech_stack=uniapp-wot-h5、source_team=amis-ai。
# 如需多技术栈，复制本脚本改 TECH_STACK 即可。

set -uo pipefail

BASE="${BASE:-http://localhost:8080}"
USERNAME="${USERNAME:-admin}"
PASSWORD="${PASSWORD:-admin123}"
TECH_STACK="${TECH_STACK:-uniapp-wot-h5}"
SOURCE_TEAM="${SOURCE_TEAM:-amis-ai}"
STATUS="${1:-approved}"

echo "=== B.6 RAG 种子样例批量入库 ==="
echo "base=$BASE  tech_stack=$TECH_STACK  status=$STATUS"
echo ""

# 1. 登录
TOKEN=$(curl -fs -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin).get("token",""))')
if [[ -z "$TOKEN" ]]; then
  echo "❌ 登录失败"
  exit 1
fi
echo "✅ admin 登录"

# 提交一条样例的辅助函数
post_sample() {
  local label="$1" amis_summary="$2" code_summary="$3" amis_json="$4" code="$5"
  local body
  body=$(python3 -c "
import json
print(json.dumps({
  'tech_stack': '$TECH_STACK',
  'source_team': '$SOURCE_TEAM',
  'amis_json_summary': '''$amis_summary''',
  'code_summary': '''$code_summary''',
  'full_amis_json': '''$amis_json''',
  'full_code': '''$code''',
  'status': '$STATUS',
}, ensure_ascii=False))
")
  local resp
  resp=$(curl -fs -X POST "$BASE/api/code-samples" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "$body" 2>&1)
  local sid
  sid=$(echo "$resp" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("id","-"))' 2>/dev/null || echo "-")
  echo "  ✅ [$sid] $label"
}

# ========== 7 条种子（uniapp-wot-h5 典型场景） ==========

post_sample "登录页（手机号+密码）" \
"用户登录页：输入手机号和密码，点击登录调用 /auth/login，成功后跳转首页。含'记住密码'勾选与'第三方登录'入口。" \
"使用 wd-input + wd-button + wd-checkbox 组合，axios POST /auth/login。失败 toast 错误信息，成功 uni.setStorageSync('token') + uni.switchTab('/pages/index/index')。" \
'{
  \"type\": \"page\",
  \"title\": \"登录\",
  \"body\": {
    \"type\": \"form\",
    \"api\": \"post:/auth/login\",
    \"body\": [
      {\"type\": \"input-text\", \"name\": \"phone\", \"label\": \"手机号\", \"required\": true, \"validations\": {\"isPhoneNumber\": true}},
      {\"type\": \"input-password\", \"name\": \"password\", \"label\": \"密码\", \"required\": true},
      {\"type\": \"checkbox\", \"name\": \"remember\", \"option\": \"记住密码\"}
    ],
    \"submitText\": \"登录\"
  }
}' \
'```vue
<template>
  <view class=\"login-page\">
    <wd-input v-model=\"form.phone\" label=\"手机号\" placeholder=\"请输入手机号\" />
    <wd-input v-model=\"form.password\" type=\"password\" label=\"密码\" placeholder=\"请输入密码\" />
    <wd-checkbox v-model=\"form.remember\">记住密码</wd-checkbox>
    <wd-button type=\"primary\" block @click=\"handleLogin\">登录</wd-button>
  </view>
</template>

<script setup lang=\"ts\">
import { reactive } from \"vue\";
import { login } from \"@/api/auth\";

const form = reactive({ phone: \"\", password: \"\", remember: false });

async function handleLogin() {
  if (!/^1\\d{10}$/.test(form.phone)) return uni.showToast({ title: \"手机号格式错误\", icon: \"error\" });
  try {
    const { token } = await login(form);
    uni.setStorageSync(\"token\", token);
    uni.switchTab({ url: \"/pages/index/index\" });
  } catch (e: any) {
    uni.showToast({ title: e.message || \"登录失败\", icon: \"error\" });
  }
}
</script>
```'

post_sample "商品列表（搜索+分页）" \
"商品列表页：顶部搜索框 + 商品卡片网格 + 下拉刷新 + 上拉加载更多。每个卡片显示图片、名称、价格、销量。点击进入详情。" \
"使用 wd-search + wd-row/wd-col 网格 + wd-img + onPullDownRefresh + onReachBottom。axios GET /products?page=N&keyword=X。" \
'{
  \"type\": \"page\",
  \"body\": {
    \"type\": \"crud\",
    \"api\": \"/products\",
    \"perPage\": 20,
    \"filter\": {\"body\": [{\"type\": \"input-text\", \"name\": \"keyword\", \"label\": \"搜索\"}]},
    \"columns\": [
      {\"name\": \"image\", \"label\": \"图片\", \"type\": \"image\"},
      {\"name\": \"name\", \"label\": \"商品名\"},
      {\"name\": \"price\", \"label\": \"价格\", \"type\": \"tpl\", \"tpl\": \"¥${price}\"},
      {\"name\": \"sales\", \"label\": \"销量\"}
    ]
  }
}' \
'```vue
<template>
  <wd-search v-model=\"keyword\" @search=\"refresh\" placeholder=\"搜索商品\" />
  <view class=\"grid\">
    <view v-for=\"item in list\" :key=\"item.id\" class=\"card\" @click=\"goDetail(item.id)\">
      <wd-img :src=\"item.image\" mode=\"aspectFill\" />
      <view class=\"name\">{{ item.name }}</view>
      <view class=\"price\">¥{{ item.price }} <text class=\"sales\">已售 {{ item.sales }}</text></view>
    </view>
  </view>
</template>

<script setup lang=\"ts\">
import { ref, onMounted } from \"vue\";
import { onPullDownRefresh, onReachBottom } from \"@dcloudio/uni-app\";
import { fetchProducts } from \"@/api/product\";

const list = ref<any[]>([]);
const keyword = ref(\"\");
const page = ref(1);
const noMore = ref(false);

async function load(reset = false) {
  if (reset) { page.value = 1; noMore.value = false; }
  if (noMore.value) return;
  const data = await fetchProducts({ page: page.value, keyword: keyword.value });
  if (reset) list.value = data.items; else list.value.push(...data.items);
  if (data.items.length < 20) noMore.value = true;
  page.value += 1;
}
function refresh() { load(true); }
function goDetail(id: number) { uni.navigateTo({ url: `/pages/product/detail?id=${id}` }); }

onMounted(() => load(true));
onPullDownRefresh(() => { refresh(); uni.stopPullDownRefresh(); });
onReachBottom(() => load());
</script>
```'

post_sample "数据看板（统计卡片+图表）" \
"运营数据看板：顶部 4 个数字统计卡片（今日订单、销售额、新增用户、活跃用户）+ 中部线状图（近 7 天销售趋势）+ 下部最新订单列表（5 条）。" \
"使用 wd-card 展示统计 + ucharts 画线图 + wd-cell-group 列表。轮询 /dashboard/stats 每 30s 刷新。" \
'{
  \"type\": \"page\",
  \"body\": [
    {\"type\": \"service\", \"api\": \"/dashboard/stats\", \"body\": [
      {\"type\": \"grid\", \"columns\": [
        {\"body\": {\"type\": \"tpl\", \"tpl\": \"今日订单 ${today_orders}\"}},
        {\"body\": {\"type\": \"tpl\", \"tpl\": \"销售额 ¥${today_amount}\"}}
      ]},
      {\"type\": \"chart\", \"api\": \"/dashboard/sales-trend\", \"chartTheme\": \"line\"}
    ]}
  ]
}' \
'```vue
<template>
  <view class=\"dashboard\">
    <view class=\"stats-grid\">
      <wd-card v-for=\"s in stats\" :key=\"s.key\" :title=\"s.label\">
        <view class=\"big-num\">{{ s.value }}</view>
      </wd-card>
    </view>
    <view class=\"chart-section\">
      <qiun-data-charts type=\"line\" :chart-data=\"chartData\" :opts=\"{ legend: { show: true } }\" />
    </view>
  </view>
</template>

<script setup lang=\"ts\">
import { ref, onMounted, onUnmounted } from \"vue\";
import { fetchDashboard } from \"@/api/dashboard\";

const stats = ref<any[]>([]);
const chartData = ref({});
let timer: any;

async function refresh() {
  const data = await fetchDashboard();
  stats.value = [
    { key: \"orders\", label: \"今日订单\", value: data.today_orders },
    { key: \"amount\", label: \"销售额 ¥\", value: data.today_amount },
    { key: \"users\", label: \"新增用户\", value: data.new_users },
    { key: \"active\", label: \"活跃用户\", value: data.active_users },
  ];
  chartData.value = data.sales_trend;
}
onMounted(() => { refresh(); timer = setInterval(refresh, 30000); });
onUnmounted(() => clearInterval(timer));
</script>
```'

post_sample "表单提交（多字段+文件上传）" \
"创建订单表单：客户选择（下拉）+ 商品选择（多选）+ 数量输入 + 备注（多行）+ 附件上传（最多 3 张）。提交调 /orders POST。" \
"使用 wd-picker（客户）+ wd-checkbox-group（商品）+ wd-input-number（数量）+ wd-textarea（备注）+ wd-upload。表单验证用 wd-form。" \
'{
  \"type\": \"page\",
  \"body\": {
    \"type\": \"form\",
    \"api\": \"post:/orders\",
    \"body\": [
      {\"type\": \"select\", \"name\": \"customer_id\", \"label\": \"客户\", \"source\": \"/customers\", \"required\": true},
      {\"type\": \"checkboxes\", \"name\": \"product_ids\", \"label\": \"商品\", \"source\": \"/products\", \"required\": true},
      {\"type\": \"input-number\", \"name\": \"quantity\", \"label\": \"数量\", \"min\": 1, \"required\": true},
      {\"type\": \"textarea\", \"name\": \"remark\", \"label\": \"备注\"},
      {\"type\": \"input-image\", \"name\": \"attachments\", \"label\": \"附件\", \"multiple\": true, \"maxLength\": 3}
    ]
  }
}' \
'```vue
<template>
  <wd-form ref=\"formRef\" :model=\"form\" :rules=\"rules\">
    <wd-picker v-model=\"form.customer_id\" :columns=\"customers\" label=\"客户\" />
    <wd-checkbox-group v-model=\"form.product_ids\">
      <wd-checkbox v-for=\"p in products\" :key=\"p.id\" :modelValue=\"p.id\">{{ p.name }}</wd-checkbox>
    </wd-checkbox-group>
    <wd-input-number v-model=\"form.quantity\" :min=\"1\" label=\"数量\" />
    <wd-textarea v-model=\"form.remark\" label=\"备注\" />
    <wd-upload v-model=\"form.attachments\" :max-count=\"3\" action=\"/upload\" />
    <wd-button type=\"primary\" block @click=\"submit\">提交</wd-button>
  </wd-form>
</template>

<script setup lang=\"ts\">
import { reactive, ref, onMounted } from \"vue\";
import { listCustomers, listProducts, createOrder } from \"@/api/order\";

const form = reactive({ customer_id: null, product_ids: [], quantity: 1, remark: \"\", attachments: [] });
const customers = ref<any[]>([]);
const products = ref<any[]>([]);
const formRef = ref();
const rules = { customer_id: [{ required: true }], quantity: [{ required: true, min: 1 }] };

async function submit() {
  await formRef.value.validate();
  await createOrder(form);
  uni.showToast({ title: \"已提交\", icon: \"success\" });
  setTimeout(() => uni.navigateBack(), 800);
}
onMounted(async () => {
  customers.value = await listCustomers();
  products.value = await listProducts();
});
</script>
```'

post_sample "详情页（卡片布局+操作按钮）" \
"用户详情页：顶部头像+昵称+电话 + 卡片区（基本信息表格） + 卡片区（订单历史，最近 5 条） + 底部操作栏（编辑、停用、删除）。" \
"使用 wd-card + wd-cell-group + 按钮 wd-button + 删除前 wd-message-box.confirm 二次确认。" \
'{
  \"type\": \"page\",
  \"body\": {
    \"type\": \"service\",
    \"api\": \"/users/${id}\",
    \"body\": [
      {\"type\": \"panel\", \"title\": \"基本信息\", \"body\": [
        {\"type\": \"static\", \"name\": \"name\", \"label\": \"姓名\"},
        {\"type\": \"static\", \"name\": \"phone\", \"label\": \"手机\"}
      ]},
      {\"type\": \"crud\", \"api\": \"/users/${id}/orders\", \"columns\": [
        {\"name\": \"order_no\", \"label\": \"单号\"},
        {\"name\": \"amount\", \"label\": \"金额\"},
        {\"name\": \"status\", \"label\": \"状态\"}
      ]},
      {\"type\": \"action\", \"label\": \"删除\", \"actionType\": \"ajax\", \"confirmText\": \"确认删除？\", \"api\": \"delete:/users/${id}\"}
    ]
  }
}' \
'```vue
<template>
  <view v-if=\"user\" class=\"detail\">
    <wd-card>
      <view class=\"header\">
        <wd-img :src=\"user.avatar\" round />
        <view>
          <view class=\"name\">{{ user.name }}</view>
          <view class=\"phone\">{{ user.phone }}</view>
        </view>
      </view>
    </wd-card>
    <wd-card title=\"基本信息\">
      <wd-cell title=\"邮箱\" :value=\"user.email\" />
      <wd-cell title=\"创建时间\" :value=\"user.created_at\" />
    </wd-card>
    <wd-card title=\"订单历史\">
      <wd-cell v-for=\"o in orders\" :key=\"o.id\" :title=\"o.order_no\" :value=\"`¥${o.amount}`\" />
    </wd-card>
    <view class=\"actions\">
      <wd-button @click=\"goEdit\">编辑</wd-button>
      <wd-button type=\"warning\" @click=\"toggleActive\">停用</wd-button>
      <wd-button type=\"error\" @click=\"handleDelete\">删除</wd-button>
    </view>
  </view>
</template>

<script setup lang=\"ts\">
import { ref, onMounted } from \"vue\";
import { onLoad } from \"@dcloudio/uni-app\";
import { fetchUser, fetchUserOrders, deleteUser } from \"@/api/user\";

const id = ref<string>(\"\");
const user = ref<any>(null);
const orders = ref<any[]>([]);

onLoad((opt: any) => { id.value = opt.id; });
onMounted(async () => {
  user.value = await fetchUser(id.value);
  orders.value = await fetchUserOrders(id.value);
});

function goEdit() { uni.navigateTo({ url: `/pages/user/edit?id=${id.value}` }); }
async function toggleActive() { /* ... */ }
async function handleDelete() {
  const res = await uni.showModal({ title: \"确认\", content: \"确定删除？\" });
  if (!res.confirm) return;
  await deleteUser(id.value);
  uni.navigateBack();
}
</script>
```'

post_sample "多步骤向导（4 步注册流程）" \
"4 步注册向导：1. 手机号验证码 → 2. 设置密码 → 3. 完善资料 → 4. 选择偏好。每步可上一步、下一步；最后一步提交全部数据。" \
"使用 wd-steps 顶部进度 + 每步独立 wd-form + ref 保留各步数据 + 最后 axios POST /register。" \
'{
  \"type\": \"page\",
  \"body\": {
    \"type\": \"wizard\",
    \"steps\": [
      {\"title\": \"手机验证\", \"body\": [{\"type\": \"input-text\", \"name\": \"phone\"}, {\"type\": \"input-text\", \"name\": \"sms_code\"}]},
      {\"title\": \"设置密码\", \"body\": [{\"type\": \"input-password\", \"name\": \"password\"}]},
      {\"title\": \"个人资料\", \"body\": [{\"type\": \"input-text\", \"name\": \"name\"}]},
      {\"title\": \"偏好设置\", \"body\": [{\"type\": \"checkboxes\", \"name\": \"interests\"}], \"api\": \"post:/register\"}
    ]
  }
}' \
'```vue
<template>
  <wd-steps :active=\"step\" :options=\"steps\" />
  <view v-if=\"step === 0\">
    <wd-input v-model=\"form.phone\" label=\"手机号\" />
    <wd-input v-model=\"form.sms_code\" label=\"验证码\" />
    <wd-button @click=\"sendSms\">发送验证码</wd-button>
  </view>
  <view v-else-if=\"step === 1\">
    <wd-input v-model=\"form.password\" type=\"password\" label=\"密码\" />
  </view>
  <view v-else-if=\"step === 2\">
    <wd-input v-model=\"form.name\" label=\"姓名\" />
  </view>
  <view v-else-if=\"step === 3\">
    <wd-checkbox-group v-model=\"form.interests\">
      <wd-checkbox modelValue=\"tech\">科技</wd-checkbox>
      <wd-checkbox modelValue=\"sports\">体育</wd-checkbox>
    </wd-checkbox-group>
  </view>
  <view class=\"actions\">
    <wd-button v-if=\"step > 0\" @click=\"prev\">上一步</wd-button>
    <wd-button v-if=\"step < 3\" type=\"primary\" @click=\"next\">下一步</wd-button>
    <wd-button v-else type=\"primary\" @click=\"submit\">完成注册</wd-button>
  </view>
</template>

<script setup lang=\"ts\">
import { ref, reactive } from \"vue\";
import { register, sendSmsCode } from \"@/api/auth\";

const step = ref(0);
const steps = [{ text: \"手机验证\" }, { text: \"密码\" }, { text: \"资料\" }, { text: \"偏好\" }];
const form = reactive({ phone: \"\", sms_code: \"\", password: \"\", name: \"\", interests: [] });

function prev() { if (step.value > 0) step.value -= 1; }
function next() { if (step.value < 3) step.value += 1; }
async function sendSms() { await sendSmsCode(form.phone); uni.showToast({ title: \"已发送\" }); }
async function submit() {
  await register(form);
  uni.showToast({ title: \"注册成功\", icon: \"success\" });
  uni.reLaunch({ url: \"/pages/login/index\" });
}
</script>
```'

post_sample "权限管理（树形+开关）" \
"角色权限编辑页：左侧树形菜单展示所有功能模块（带开关）+ 右侧已选权限预览。点保存调 /roles/:id/permissions。" \
"使用 wd-tree（树形展示）+ wd-switch 控制每个节点 + 全选/反选按钮。提交时收集所有 checked id 列表。" \
'{
  \"type\": \"page\",
  \"body\": {
    \"type\": \"form\",
    \"api\": \"put:/roles/${id}/permissions\",
    \"initApi\": \"/roles/${id}\",
    \"body\": [
      {\"type\": \"tree-select\", \"name\": \"permission_ids\", \"label\": \"权限\", \"multiple\": true, \"source\": \"/permissions/tree\"}
    ]
  }
}' \
'```vue
<template>
  <view class=\"role-perms\">
    <wd-tree :tree=\"perms\" v-model:checked-keys=\"checked\" show-checkbox node-key=\"id\" />
    <view class=\"summary\">已选 {{ checked.length }} 项</view>
    <view class=\"actions\">
      <wd-button @click=\"checkAll\">全选</wd-button>
      <wd-button @click=\"clearAll\">清空</wd-button>
      <wd-button type=\"primary\" @click=\"save\">保存</wd-button>
    </view>
  </view>
</template>

<script setup lang=\"ts\">
import { ref, onMounted } from \"vue\";
import { onLoad } from \"@dcloudio/uni-app\";
import { fetchPermTree, fetchRolePerms, saveRolePerms } from \"@/api/role\";

const id = ref(\"\");
const perms = ref<any[]>([]);
const checked = ref<number[]>([]);

onLoad((opt: any) => { id.value = opt.id; });
onMounted(async () => {
  perms.value = await fetchPermTree();
  checked.value = (await fetchRolePerms(id.value)).map((p: any) => p.id);
});

function flat(nodes: any[], out: number[] = []) {
  for (const n of nodes) { out.push(n.id); if (n.children) flat(n.children, out); }
  return out;
}
function checkAll() { checked.value = flat(perms.value); }
function clearAll() { checked.value = []; }
async function save() {
  await saveRolePerms(id.value, checked.value);
  uni.showToast({ title: \"已保存\" });
}
</script>
```'

echo ""
echo "=== 完成。现在 DB 状态 ==="
PGPASSWORD=amis_ai_dev psql -h localhost -U amis_ai -d amis_ai -tAc "SELECT status || ': ' || count(*) FROM code_samples GROUP BY status ORDER BY status"
echo ""
echo "去 /knowledge-base/code-samples 看（按状态过滤切到 approved 看到 7 条种子）"
echo "或者跑 /shared/scripts/smoke-test.sh 验证 RAG 链路"
