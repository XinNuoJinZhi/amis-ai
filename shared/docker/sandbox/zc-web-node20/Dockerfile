FROM node:20-alpine

# 与 uniapp-node20 一致的基础包
RUN apk add --no-cache git bash curl ca-certificates tini

# pnpm 9.15.0：Node 20 兼容、跟 zc_editor 的 packageManager 字段对齐
# 不走 corepack（corepack 0.34+ 默认 pnpm 11 要求 Node 22+）
RUN npm install -g pnpm@9.15.0

# ZC fork amis-6.8.0-my324v2 的 deep dep 含一个 git+ssh://github.com/xqq/webworkify-webpack —
# Alpine 默认无 ssh client 且容器内拿不到 GitHub SSH key。
# 用系统级 git url.insteadOf 把所有 git+ssh / ssh 形式透明改写成 https，让 pnpm 走匿名 https 拉。
# 写 /etc/gitconfig 系统级，避免容器 UID=1000 时读不到 root 的 ~/.gitconfig。
RUN git config --system --add url."https://github.com/".insteadOf "git+ssh://git@github.com/" && \
    git config --system --add url."https://github.com/".insteadOf "ssh://git@github.com/" && \
    git config --system --add url."https://github.com/".insteadOf "git@github.com:"

# 默认工作目录
WORKDIR /workspace

# pnpm store 指向挂载点（与 uniapp-node20 保持一致，便于宿主 volume 复用）
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN mkdir -p $PNPM_HOME && \
    pnpm config set store-dir /root/.local/share/pnpm/store

# ZC Amis 私有 nexus 包源（公网可达，scaffold 里直接用 URL 装）
# 镜像里同时塞一份 .tgz 备份（zc-packages/*.tgz）作为离线 fallback：
# 当 scaffold 检测不到 nexus 网络时，会把 package.json 的 URL 改成 file://
COPY zc-packages/ /opt/zc-packages/

# 预置 npm registry 镜像，加速公网公共依赖（antd / umijs 等）
RUN npm config set registry https://registry.npmmirror.com/ && \
    pnpm config set registry https://registry.npmmirror.com/

# Vite dev server 默认端口（zc_editor vite:dev 用 5000，预留覆盖空间）
ENV VITE_PORT=5173

# tini 作为 PID 1，避免僵尸进程
ENTRYPOINT ["/sbin/tini", "--"]

# 默认命令：保持容器运行，等待 docker exec
CMD ["sh", "-c", "while true; do sleep 3600; done"]
