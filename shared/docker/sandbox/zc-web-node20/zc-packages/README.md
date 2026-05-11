# ZC Amis 私有 npm 离线包

本目录是 sandbox 镜像 `amis-ai-sandbox:zc-web-node20` 构建上下文里的 **离线 fallback**。

## 用法

**默认走 nexus 公网**：阶段 C.5 实测 `app.xinnuojinzhi.com:8081` 公网可达，scaffold 里 `package.json` 直接写 nexus URL，`pnpm install` 在线拉取。

**离线 fallback**：如果用户部署环境不通 ZC nexus（如纯内网集群），用 `fetch-zc-tgz.sh` 一次性下载所有 ZC 包到本目录，重新 `docker build` 镜像即可。运行时 scaffold 的 `package.json` 改写成 `file:/opt/zc-packages/<name>-<ver>.tgz`，避免网络依赖。

## 包清单（与 zc_editor package.json 对齐）

| 包名 | 版本 |
|---|---|
| amis | 6.8.0-my324v2 |
| amis-core | 6.8.0-my324v2 |
| amis-editor | 6.8.0-my324v2 |
| amis-editor-core | 6.8.0-my324v2 |
| amis-formula | 6.8.0-my324v2 |
| amis-theme-editor-helper | 2.0.26-my3v2 |
| amis-ui | 6.8.0-my324v2 |

## 一次性下载脚本

见同级 `fetch-zc-tgz.sh`（C.5 验证时落地）。

## .gitignore

`*.tgz` 不入 git（避免 git 仓库膨胀，目前 7 个 tgz 总计 ~10MB 也不算大，但保留口子让大文件后续走 git-lfs）。
