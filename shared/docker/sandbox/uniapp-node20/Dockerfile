FROM node:20-alpine

RUN apk add --no-cache git bash curl ca-certificates tini

# 启用 corepack 以便使用 pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

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
