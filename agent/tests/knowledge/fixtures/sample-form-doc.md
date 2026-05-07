---
title: Form 表单
description: 表单容器，支持提交、校验、联动
type: form
---

## 基本用法

最简单的表单只需要 type 和 body。

```schema
{
  "type": "form",
  "body": [
    { "type": "input-text", "name": "username", "label": "用户名" }
  ]
}
```

## 远程提交

通过 api 字段提交到后端。

```json
{
  "type": "form",
  "api": "/api/save",
  "body": []
}
```
