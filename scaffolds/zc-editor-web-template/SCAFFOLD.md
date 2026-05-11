# zc-editor-web-template 底座说明（amis-ai 1.3.0）

> 本目录是 amis-ai 反向飞轮的「ZC Web 模板」种子项目。源自 `~/Working/TianXing/amis-codegen/apps/zc_editor`，精简了 business demo 与冗余多语言文件后入库。

## 与原 zc_editor 的差异

| 调整 | 原因 |
|---|---|
| 剥 `src/pages/Business/`（284MB） | 业务 demo，不属于骨架 |
| 多语言保留 zh-CN/en-US，剥 bn-BD/fa-IR/id-ID/ja-JP/pt-BR/zh-TW | 减包 |
| `package.json` name 改成 `zc-editor-web-template` + 加 `packageManager: pnpm@9.15.0` | scaffold 标识 + sandbox 镜像 pnpm 对齐 |
| `vite.config.ts` server.port 改成 `Number(VITE_PORT) || 5173`，host `0.0.0.0` | 适配 amis-ai sandbox 默认 5173 端口转发 |
| `node_modules/` / `dist/` / `.git/` 不入库 | scaffold 复制后由 sandbox 内 pnpm install |

## 启动方式（sandbox 内）

```bash
# sandbox 创建时自动执行：
pnpm install           # 在线走 nexus 公网 / 离线 fallback 到 /opt/zc-packages/*.tgz
pnpm run vite:dev      # vite7 + @umijs/max alias shim 启动，监听 0.0.0.0:5173
```

## ZC 私有 npm 包源

`package.json` 里 `amis*` 系列直接写 nexus URL：

```
"amis": "http://app.xinnuojinzhi.com:8081/repository/amis/amis/-/amis-6.8.0-my324v2.tgz"
```

实测公网可达。若用户部署环境内网封闭，参考 `shared/docker/sandbox/zc-web-node20/zc-packages/fetch-zc-tgz.sh` 离线下载 + scaffold copier 改写 URL 为 `file:/opt/zc-packages/<name>.tgz`。

## 不依赖真实 ZC 后端

`.env.development` 里 `REACT_APP_BASE_URL=http://192.168.50.218:38080` 是 ZC 内网。sandbox 跑时该地址不可达，但 vite dev server 仍能启动，仅业务接口请求 502。LLM 生成业务代码时应优先用 `mock/` 数据或 `mockjs` 自造接口。
