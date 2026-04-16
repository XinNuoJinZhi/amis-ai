# sandbox-service

沙箱执行服务。负责：
- Docker 容器生命周期（基于镜像 `amis-ai-sandbox:uniapp-node20`）
- 命令执行与日志流
- Vite dev server 启动 / ready 判定
- 预览端口池（20000-21000）管理

## 启动

```bash
cd sandbox
cargo run --bin sandbox-service
```

端口：`8091`
