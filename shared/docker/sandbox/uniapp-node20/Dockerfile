FROM node:20-alpine

RUN apk add --no-cache git bash curl ca-certificates tini

# 用 npm 直接装 pnpm 9.15.0 为真正的全局 binary，
# 不走 corepack —— corepack 0.34+ 的 default pnpm 是 11.x，要求 Node 22+，
# 在 Node 20 镜像上跑会触发 `node:sqlite ERR_UNKNOWN_BUILTIN_MODULE`。
# pnpm 9.15.0 是 Node 20 兼容的最后一个 pnpm v9 稳定版，跟脚手架 packageManager 字段对齐。
RUN npm install -g pnpm@9.15.0

# 默认工作目录
WORKDIR /workspace

# pnpm store 指向挂载点
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN mkdir -p $PNPM_HOME

# 预装 UniApp CLI
RUN pnpm config set store-dir /root/.local/share/pnpm/store && \
    pnpm add -g @dcloudio/uvm

# Vite dev server 默认端口
ENV VITE_PORT=5173

# tini 作为 PID 1，避免僵尸进程
ENTRYPOINT ["/sbin/tini", "--"]

# 默认命令：保持容器运行，等待 docker exec
CMD ["sh", "-c", "while true; do sleep 3600; done"]
