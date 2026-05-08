# Amis 知识双轨补全 实施计划（1.1.0）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 baidu/amis 6.x 全套组件知识补齐到 amis-ai 的 Skills/RAG 知识库，根治 Agent 生成 amis JSON 时漏组件 / 写错属性 / 瞎编字段的问题。

**Architecture:** 双轨结合：文档轨（amis 官方 .md 切片 → RAG `code_samples` 表）+ 类型轨（amis 源码 .ts 接口 → 新建 `skills/amis-core-schema/` 桶）；分层兜底：高频 18 组件人审精修 + 冷门 30+ 脚本自动批量。

**Tech Stack:** Python 3.11（asyncpg + tomli）/ Node 20 + ts-morph / TypeScript / pgvector / SkillAuthoringWizard 复用 / Markdown + YAML frontmatter

**配套 spec:** [2026-05-07-amis-knowledge-completion-design.md](2026-05-07-amis-knowledge-completion-design.md)

---

## 文件结构（locked-in）

```
agent/src/knowledge/
├── amis_importer/                 # 新增 Python 包
│   ├── __init__.py
│   ├── __main__.py                # CLI 入口：python -m agent.src.knowledge.amis_importer ...
│   ├── config.py                  # 路径常量 + ImporterConfig dataclass
│   ├── clone.py                   # git clone baidu/amis（unset 代理）
│   ├── parse_docs.py              # 切 markdown → docs.json
│   ├── ingest_rag.py              # 直连 DB 写 code_samples（tags 幂等）
│   └── ingest_skills.py           # 写 amis-core-schema/references/<comp>.md
├── amis_types_extractor/          # 新增 Node 子项目
│   ├── package.json
│   ├── tsconfig.json
│   ├── extractor.ts               # ts-morph 解析 .ts 接口
│   ├── vitest.config.ts
│   └── __tests__/
│       ├── extractor.test.ts
│       └── fixtures/
│           └── sample-form-schema.ts
└── amis_dump/                     # 中间产物（提交到仓库）
    ├── .gitkeep
    ├── amis-schema.json           # 类型轨 dump（提交后续）
    └── docs.json                  # 文档轨 dump（提交后续）

agent/tests/knowledge/             # 新增测试包
├── __init__.py
├── conftest.py                    # 共享 fixture（tmp Skills 目录、mock asyncpg）
├── test_clone.py
├── test_parse_docs.py
├── test_ingest_rag.py
├── test_ingest_skills.py
└── fixtures/
    ├── sample-form-doc.md
    └── sample-amis-schema.json

skills/amis-core-schema/           # 新 Skills 桶
├── SKILL.md                       # 顶层概述
└── references/                    # 50+ 组件属性 schema（自动生成）
    ├── form.md
    ├── crud.md
    └── ...

eval/amis-1.1/                     # 新增评测目录
├── prompts.json                   # 20 条固定 prompt
├── runner.py                      # A/B 跑分脚本
├── README.md
├── baseline-1.0.jsonl             # 1.0 基线结果（生成后提交）
└── 1.1.jsonl                      # 1.1 结果（生成后提交）
```

**不修改：** `backend/src/handlers/code_samples.rs`（schema 不变，复用 tags 列做幂等）、`agent/src/services/rag.py`（仅作消费方调用 `index_code_sample`）。

---

## Phase 0：准备（W0，半天）

### Task 0.1：分支检查 + 目录骨架

**Files:**
- Create: `agent/src/knowledge/amis_importer/__init__.py`（空）
- Create: `agent/src/knowledge/amis_types_extractor/.gitkeep`
- Create: `agent/src/knowledge/amis_dump/.gitkeep`
- Create: `agent/tests/knowledge/__init__.py`（空）
- Create: `eval/amis-1.1/.gitkeep`

- [ ] **Step 1: 确认在 dev/1.1.0 分支且工作树干净**

Run: `git status`
Expected:
```
On branch dev/1.1.0
nothing to commit, working tree clean
```

- [ ] **Step 2: 创建目录骨架**

```bash
mkdir -p agent/src/knowledge/amis_importer \
         agent/src/knowledge/amis_types_extractor \
         agent/src/knowledge/amis_dump \
         agent/tests/knowledge/fixtures \
         eval/amis-1.1
touch agent/src/knowledge/amis_importer/__init__.py \
      agent/tests/knowledge/__init__.py \
      agent/src/knowledge/amis_types_extractor/.gitkeep \
      agent/src/knowledge/amis_dump/.gitkeep \
      eval/amis-1.1/.gitkeep
```

- [ ] **Step 3: 提交骨架**

```bash
git add agent/src/knowledge/amis_importer agent/src/knowledge/amis_types_extractor agent/src/knowledge/amis_dump agent/tests/knowledge eval/amis-1.1
git commit -m "chore(1.1): amis 知识补全工具链目录骨架"
```

### Task 0.2：确认 Python 依赖（asyncpg / pytest-asyncio / httpx）

**Files:**
- Modify: `agent/pyproject.toml`（按需加 `pytest-asyncio` 到 dev 依赖）

- [ ] **Step 1: 检查 pyproject.toml**

```bash
grep -E "asyncpg|pytest-asyncio|httpx" agent/pyproject.toml
```
Expected: `asyncpg` 与 `httpx` 已在；`pytest-asyncio` 若缺则下一步加。

- [ ] **Step 2: 如缺 pytest-asyncio 则加到 dev 依赖**

Edit `agent/pyproject.toml`：在 `[dependency-groups]` 的 `dev` 数组追加 `"pytest-asyncio>=0.23"`。同时确认有 `[tool.pytest.ini_options]` 段含 `asyncio_mode = "auto"`，没有的话补一段。

- [ ] **Step 3: 安装并验证**

```bash
cd agent && uv sync --all-extras
```
Expected: 输出 `Resolved <N> packages` 不报错。

- [ ] **Step 4: 提交（如果有改动）**

```bash
git add agent/pyproject.toml agent/uv.lock
git commit -m "chore(1.1): amis_importer 测试依赖声明（pytest-asyncio）"
```

---

## Phase 1：工具链开发（W1-W2）

### Task 1.1：写 ImporterConfig（含路径常量 + 版本 pin）

**Files:**
- Create: `agent/src/knowledge/amis_importer/config.py`
- Create: `agent/tests/knowledge/conftest.py`
- Test: `agent/tests/knowledge/test_config.py`

- [ ] **Step 1: 写测试**

Create `agent/tests/knowledge/test_config.py`:
```python
from agent.src.knowledge.amis_importer.config import ImporterConfig, REPO_ROOT, KNOWLEDGE_ROOT

def test_repo_root_points_to_amis_ai():
    assert (REPO_ROOT / "frontend").is_dir()
    assert (REPO_ROOT / "agent").is_dir()

def test_knowledge_root_under_repo():
    assert KNOWLEDGE_ROOT == REPO_ROOT / "agent" / "src" / "knowledge"

def test_importer_config_defaults():
    cfg = ImporterConfig()
    assert cfg.amis_version.startswith("6.")
    assert cfg.tmp_clone_dir.name == "amis-clone"
    assert cfg.db_url.startswith("postgresql://")
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd agent && uv run pytest tests/knowledge/test_config.py -v`
Expected: `FAILED` with `ModuleNotFoundError: No module named 'agent.src.knowledge.amis_importer.config'`

- [ ] **Step 3: 写实现**

Create `agent/src/knowledge/amis_importer/config.py`:
```python
"""ImporterConfig：路径常量 + 1.1.0 版本 pin。"""
from __future__ import annotations
import os
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
KNOWLEDGE_ROOT = REPO_ROOT / "agent" / "src" / "knowledge"
DUMP_DIR = KNOWLEDGE_ROOT / "amis_dump"
SKILLS_BUCKET = REPO_ROOT / "skills" / "amis-core-schema"
SKILLS_REFS = SKILLS_BUCKET / "references"
TYPES_EXTRACTOR_DIR = KNOWLEDGE_ROOT / "amis_types_extractor"

# 1.1.0 基线：baidu/amis 6.x 最新稳定 release
DEFAULT_AMIS_VERSION = "6.10.0"


@dataclass
class ImporterConfig:
    amis_version: str = DEFAULT_AMIS_VERSION
    amis_repo_url: str = "https://github.com/baidu/amis.git"
    tmp_clone_dir: Path = field(default_factory=lambda: Path("/tmp/amis-clone"))
    db_url: str = field(
        default_factory=lambda: os.environ.get(
            "DATABASE_URL",
            "postgresql://amis_ai:amis_ai@localhost:5432/amis_ai",
        )
    )
    dry_run: bool = False
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd agent && uv run pytest tests/knowledge/test_config.py -v`
Expected: `3 passed`

- [ ] **Step 5: 提交**

```bash
git add agent/src/knowledge/amis_importer/config.py agent/tests/knowledge/test_config.py
git commit -m "feat(1.1): ImporterConfig 路径常量与版本 pin"
```

### Task 1.2：clone.py 拉 baidu/amis（unset 代理）

**Files:**
- Create: `agent/src/knowledge/amis_importer/clone.py`
- Test: `agent/tests/knowledge/test_clone.py`

- [ ] **Step 1: 写测试（mock subprocess）**

Create `agent/tests/knowledge/test_clone.py`:
```python
from unittest.mock import patch, MagicMock
from pathlib import Path
import pytest
from agent.src.knowledge.amis_importer.clone import clone_amis, _strip_proxy_env
from agent.src.knowledge.amis_importer.config import ImporterConfig


def test_strip_proxy_env_removes_http_keys():
    src = {"PATH": "/usr/bin", "http_proxy": "x", "HTTPS_PROXY": "y", "FOO": "bar"}
    out = _strip_proxy_env(src)
    assert "http_proxy" not in out
    assert "HTTPS_PROXY" not in out
    assert out["PATH"] == "/usr/bin"
    assert out["FOO"] == "bar"


@patch("subprocess.run")
def test_clone_amis_skips_when_dir_exists(mock_run, tmp_path):
    cfg = ImporterConfig(tmp_clone_dir=tmp_path)
    (tmp_path / ".git").mkdir(parents=True)
    result = clone_amis(cfg)
    assert result == tmp_path
    mock_run.assert_not_called()


@patch("subprocess.run")
def test_clone_amis_invokes_git_clone_when_missing(mock_run, tmp_path):
    target = tmp_path / "amis"
    cfg = ImporterConfig(tmp_clone_dir=target, amis_version="v6.10.0")
    mock_run.return_value = MagicMock(returncode=0)
    clone_amis(cfg)
    args = mock_run.call_args
    assert args.args[0][0] == "git"
    assert args.args[0][1] == "clone"
    assert "v6.10.0" in args.args[0]
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd agent && uv run pytest tests/knowledge/test_clone.py -v`
Expected: `FAILED` with `ImportError: cannot import name 'clone_amis'`

- [ ] **Step 3: 写实现**

Create `agent/src/knowledge/amis_importer/clone.py`:
```python
"""baidu/amis 仓库 clone：unset WSL 代理 + 版本 pin。"""
from __future__ import annotations
import os
import subprocess
from pathlib import Path
from typing import Mapping

from .config import ImporterConfig


_PROXY_KEYS = {"http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "all_proxy", "ALL_PROXY"}


def _strip_proxy_env(env: Mapping[str, str]) -> dict[str, str]:
    return {k: v for k, v in env.items() if k not in _PROXY_KEYS}


def clone_amis(cfg: ImporterConfig) -> Path:
    """克隆 baidu/amis 到 cfg.tmp_clone_dir，已存在则跳过。

    重试 3 次；最终失败抛异常。
    """
    if (cfg.tmp_clone_dir / ".git").exists():
        return cfg.tmp_clone_dir
    cfg.tmp_clone_dir.parent.mkdir(parents=True, exist_ok=True)
    env = _strip_proxy_env(os.environ)
    last_err: Exception | None = None
    for attempt in range(3):
        try:
            subprocess.run(
                [
                    "git", "clone", "--depth=1",
                    "--branch", cfg.amis_version,
                    cfg.amis_repo_url, str(cfg.tmp_clone_dir),
                ],
                check=True, env=env,
            )
            return cfg.tmp_clone_dir
        except subprocess.CalledProcessError as e:
            last_err = e
            print(f"[clone] 第 {attempt + 1} 次失败：{e}")
    raise RuntimeError(f"clone baidu/amis 重试 3 次仍失败：{last_err}")
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd agent && uv run pytest tests/knowledge/test_clone.py -v`
Expected: `3 passed`

- [ ] **Step 5: 提交**

```bash
git add agent/src/knowledge/amis_importer/clone.py agent/tests/knowledge/test_clone.py
git commit -m "feat(1.1): amis 仓库 clone（unset WSL 代理 + 重试 3 次）"
```

### Task 2.1：amis_types_extractor Node 项目骨架

**Files:**
- Create: `agent/src/knowledge/amis_types_extractor/package.json`
- Create: `agent/src/knowledge/amis_types_extractor/tsconfig.json`
- Create: `agent/src/knowledge/amis_types_extractor/vitest.config.ts`
- Create: `agent/src/knowledge/amis_types_extractor/.gitignore`

- [ ] **Step 1: 写 package.json**

```json
{
  "name": "amis-types-extractor",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "extract": "tsx extractor.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "ts-morph": "^21.0.1"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0",
    "@types/node": "^20.11.0"
  }
}
```

- [ ] **Step 2: 写 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["*.ts", "__tests__/**/*.ts"]
}
```

- [ ] **Step 3: 写 vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["__tests__/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: 写 .gitignore**

```
node_modules/
dist/
*.log
```

- [ ] **Step 5: 安装依赖**

```bash
cd agent/src/knowledge/amis_types_extractor && pnpm install
```
Expected: `Done in <Ns>`

- [ ] **Step 6: 提交（不提交 node_modules）**

```bash
git add agent/src/knowledge/amis_types_extractor/package.json \
        agent/src/knowledge/amis_types_extractor/tsconfig.json \
        agent/src/knowledge/amis_types_extractor/vitest.config.ts \
        agent/src/knowledge/amis_types_extractor/.gitignore \
        agent/src/knowledge/amis_types_extractor/pnpm-lock.yaml
git commit -m "chore(1.1): amis_types_extractor Node 子项目骨架"
```

### Task 2.2：extractor.ts 解析单个 interface（form schema fixture）

**Files:**
- Create: `agent/src/knowledge/amis_types_extractor/__tests__/fixtures/sample-form-schema.ts`
- Create: `agent/src/knowledge/amis_types_extractor/__tests__/extractor.test.ts`
- Create: `agent/src/knowledge/amis_types_extractor/extractor.ts`

- [ ] **Step 1: 写 fixture（一份精简的 form schema 接口）**

Create `agent/src/knowledge/amis_types_extractor/__tests__/fixtures/sample-form-schema.ts`:
```typescript
/** 表单容器 */
export interface FormSchema {
  /** 控件类型固定为 form */
  type: "form";
  /** 表单标题 */
  title?: string;
  /** 提交时调用的 API */
  api?: string;
  /** 表单项 */
  body?: any[];
  /** 提交按钮文案，默认 "提交" */
  submitText?: string;
}
```

- [ ] **Step 2: 写测试**

Create `agent/src/knowledge/amis_types_extractor/__tests__/extractor.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { extractInterfaces } from "../extractor.js";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, "fixtures/sample-form-schema.ts");

describe("extractInterfaces", () => {
  it("从 fixture 抽出 form 组件并保留 props 和 jsdoc", () => {
    const result = extractInterfaces([FIXTURE]);
    expect(result.components.form).toBeDefined();
    const form = result.components.form;
    const props = Object.fromEntries(form.props.map(p => [p.name, p]));
    expect(props.type.required).toBe(true);
    expect(props.title.required).toBe(false);
    expect(props.title.description).toContain("表单标题");
    expect(props.submitText.description).toContain("提交");
  });
});
```

- [ ] **Step 3: 运行测试验证失败**

Run: `cd agent/src/knowledge/amis_types_extractor && pnpm test`
Expected: `FAIL` with `Cannot find module '../extractor.js'`

- [ ] **Step 4: 写最小实现**

Create `agent/src/knowledge/amis_types_extractor/extractor.ts`:
```typescript
import { Project } from "ts-morph";

export interface PropSchema {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface ComponentSchema {
  props: PropSchema[];
}

export interface AmisSchemaDump {
  amis_version: string;
  components: Record<string, ComponentSchema>;
}

export function extractInterfaces(filePaths: string[]): AmisSchemaDump {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  for (const fp of filePaths) project.addSourceFileAtPath(fp);

  const components: Record<string, ComponentSchema> = {};
  for (const sf of project.getSourceFiles()) {
    for (const iface of sf.getInterfaces()) {
      const ifaceName = iface.getName();
      if (!ifaceName.endsWith("Schema")) continue;
      const compName = ifaceName.replace(/Schema$/, "").toLowerCase();
      components[compName] = {
        props: iface.getProperties().map(p => ({
          name: p.getName(),
          type: p.getType().getText(p),
          description: p.getJsDocs().map(d => d.getDescription().trim()).join("\n").trim(),
          required: !p.hasQuestionToken(),
        })),
      };
    }
  }
  return { amis_version: "", components };
}
```

- [ ] **Step 5: 运行测试验证通过**

Run: `cd agent/src/knowledge/amis_types_extractor && pnpm test`
Expected: `1 passed`

- [ ] **Step 6: 提交**

```bash
git add agent/src/knowledge/amis_types_extractor/extractor.ts \
        agent/src/knowledge/amis_types_extractor/__tests__/
git commit -m "feat(1.1): amis_types_extractor 单 interface 解析（form schema 通过）"
```

### Task 2.3：extractor.ts 处理 union / 泛型噪声 + raw fallback

**Files:**
- Modify: `agent/src/knowledge/amis_types_extractor/__tests__/extractor.test.ts`
- Modify: `agent/src/knowledge/amis_types_extractor/extractor.ts`

- [ ] **Step 1: 在 fixture 加复杂类型**

Append to `__tests__/fixtures/sample-form-schema.ts`:
```typescript
export interface SelectSchema {
  type: "select";
  /** 选项可以是字符串数组、对象数组、或带分组结构 */
  options?: string[] | { label: string; value: any }[] | { label: string; children: any[] }[];
  /** 远程拉取选项的 API */
  source?: string | { url: string; method?: "get" | "post" };
}
```

- [ ] **Step 2: 加测试**

Append to `__tests__/extractor.test.ts`:
```typescript
describe("extractInterfaces complex types", () => {
  it("union 类型保留 raw text 不丢", () => {
    const result = extractInterfaces([FIXTURE]);
    const sel = result.components.select;
    const options = sel.props.find(p => p.name === "options")!;
    expect(options.type).toContain("[]");  // 至少识别到数组
    expect(options.required).toBe(false);
  });
});
```

- [ ] **Step 3: 运行测试验证通过（应直接过，因为 getText 已经返回 union 原文）**

Run: `cd agent/src/knowledge/amis_types_extractor && pnpm test`
Expected: `2 passed`

- [ ] **Step 4: 提交**

```bash
git add agent/src/knowledge/amis_types_extractor/
git commit -m "test(1.1): extractor.ts 覆盖 union 类型保 raw"
```

### Task 2.4：extractor.ts CLI 入口（扫多文件 + 写 amis-schema.json）

**Files:**
- Modify: `agent/src/knowledge/amis_types_extractor/extractor.ts`

- [ ] **Step 1: 加 CLI 测试（本地脚本调用）**

Append to `__tests__/extractor.test.ts`:
```typescript
import { runCli } from "../extractor.js";
import * as fs from "fs";

describe("runCli", () => {
  it("把 fixture 解析结果写到指定 JSON 路径", () => {
    const out = path.join(__dirname, "tmp-amis-schema.json");
    runCli({ inputs: [FIXTURE], output: out, version: "v6.10.0" });
    const dump = JSON.parse(fs.readFileSync(out, "utf-8"));
    expect(dump.amis_version).toBe("v6.10.0");
    expect(Object.keys(dump.components).length).toBeGreaterThanOrEqual(2);
    fs.unlinkSync(out);
  });
});
```

- [ ] **Step 2: 实现 runCli + main**

Append to `extractor.ts`:
```typescript
import * as fs from "fs";
import * as path from "path";

export interface CliArgs {
  inputs: string[];
  output: string;
  version: string;
}

export function runCli(args: CliArgs): AmisSchemaDump {
  const dump = extractInterfaces(args.inputs);
  dump.amis_version = args.version;
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, JSON.stringify(dump, null, 2));
  return dump;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // CLI: tsx extractor.ts <amis_repo_dir> <output_json> <version>
  const [repoDir, outputJson, version] = process.argv.slice(2);
  if (!repoDir || !outputJson || !version) {
    console.error("Usage: tsx extractor.ts <amis_repo_dir> <output_json> <version>");
    process.exit(1);
  }
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  project.addSourceFilesAtPaths([
    `${repoDir}/packages/amis-core/src/**/*.ts`,
    `${repoDir}/packages/amis/src/renderers/**/*.tsx`,
  ]);
  const inputs = project.getSourceFiles().map(sf => sf.getFilePath());
  console.log(`[extractor] 扫描 ${inputs.length} 个文件...`);
  const dump = runCli({ inputs, output: outputJson, version });
  console.log(`[extractor] 抽出 ${Object.keys(dump.components).length} 个组件 → ${outputJson}`);
}
```

- [ ] **Step 3: 运行测试验证通过**

Run: `cd agent/src/knowledge/amis_types_extractor && pnpm test`
Expected: `3 passed`

- [ ] **Step 4: 提交**

```bash
git add agent/src/knowledge/amis_types_extractor/extractor.ts agent/src/knowledge/amis_types_extractor/__tests__/
git commit -m "feat(1.1): extractor.ts CLI 入口写 amis-schema.json"
```

### Task 3.1：parse_docs.py 切 markdown（fixture 测试）

**Files:**
- Create: `agent/tests/knowledge/fixtures/sample-form-doc.md`
- Create: `agent/tests/knowledge/test_parse_docs.py`
- Create: `agent/src/knowledge/amis_importer/parse_docs.py`

- [ ] **Step 1: 准备 fixture**

Create `agent/tests/knowledge/fixtures/sample-form-doc.md`:
```markdown
---
title: Form 表单
description: 表单容器，支持提交、校验、联动
type: form
---

## 基本用法

最简单的表单只需要 type 和 body。

\`\`\`schema
{
  "type": "form",
  "body": [
    { "type": "input-text", "name": "username", "label": "用户名" }
  ]
}
\`\`\`

## 远程提交

通过 api 字段提交到后端。

\`\`\`json
{
  "type": "form",
  "api": "/api/save",
  "body": []
}
\`\`\`
```
（注意将转义反引号还原为真实的三反引号）

- [ ] **Step 2: 写测试**

Create `agent/tests/knowledge/test_parse_docs.py`:
```python
from pathlib import Path
from agent.src.knowledge.amis_importer.parse_docs import parse_component_doc

FIXTURE = Path(__file__).parent / "fixtures" / "sample-form-doc.md"


def test_parse_component_doc_extracts_title_and_examples():
    result = parse_component_doc(FIXTURE)
    assert result.component == "sample-form-doc"  # 文件 stem
    assert result.title == "Form 表单"
    assert len(result.examples) == 2
    assert "input-text" in result.examples[0]
    assert "/api/save" in result.examples[1]


def test_parse_component_doc_prose_strips_frontmatter_and_codeblocks():
    result = parse_component_doc(FIXTURE)
    assert "type: form" not in result.prose  # frontmatter stripped
    assert "input-text" not in result.prose  # codeblocks stripped
    assert "最简单的表单" in result.prose
```

- [ ] **Step 3: 运行测试验证失败**

Run: `cd agent && uv run pytest tests/knowledge/test_parse_docs.py -v`
Expected: `FAILED` with `ImportError`

- [ ] **Step 4: 写实现**

Create `agent/src/knowledge/amis_importer/parse_docs.py`:
```python
"""文档轨：切 baidu/amis docs/zh-CN/components/*.md → 组件 + 示例 JSON + prose。"""
from __future__ import annotations
import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

from .config import ImporterConfig

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
_CODE_BLOCK_RE = re.compile(r"```(?:json|schema)\s*\n(.*?)```", re.DOTALL)


@dataclass
class ComponentDoc:
    component: str       # 文件 stem，如 "form" / "select"
    title: str           # frontmatter 的 title，缺省回退到 component
    description: str     # frontmatter 的 description
    examples: list[str]  # 所有 ```schema/json 代码块原文
    prose: str           # 去掉 frontmatter 和代码块后的说明文字（裁到 5000 字）


def parse_component_doc(md_path: Path) -> ComponentDoc:
    raw = md_path.read_text(encoding="utf-8")
    fm_match = _FRONTMATTER_RE.match(raw)
    if fm_match:
        fm = fm_match.group(1)
        body = raw[fm_match.end():]
    else:
        fm, body = "", raw

    title = _grep_fm(fm, "title") or md_path.stem
    description = _grep_fm(fm, "description") or ""
    examples = [m.group(1).strip() for m in _CODE_BLOCK_RE.finditer(body)]
    prose = _CODE_BLOCK_RE.sub("", body).strip()
    if len(prose) > 5000:
        prose = prose[:5000] + "\n\n…（已截断）"

    return ComponentDoc(
        component=md_path.stem,
        title=title,
        description=description,
        examples=examples,
        prose=prose,
    )


def _grep_fm(fm: str, key: str) -> str | None:
    for line in fm.splitlines():
        if line.lstrip().startswith(f"{key}:"):
            return line.split(":", 1)[1].strip()
    return None


def iter_amis_component_docs(amis_repo: Path) -> Iterable[ComponentDoc]:
    docs_dir = amis_repo / "docs" / "zh-CN" / "components"
    for md in sorted(docs_dir.rglob("*.md")):
        try:
            yield parse_component_doc(md)
        except Exception as e:
            print(f"[parse_docs] 跳过 {md}: {e}")


def dump_docs_json(cfg: ImporterConfig, amis_repo: Path, output: Path) -> int:
    docs = list(iter_amis_component_docs(amis_repo))
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps([asdict(d) for d in docs], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return len(docs)
```

- [ ] **Step 5: 运行测试验证通过**

Run: `cd agent && uv run pytest tests/knowledge/test_parse_docs.py -v`
Expected: `2 passed`

- [ ] **Step 6: 提交**

```bash
git add agent/src/knowledge/amis_importer/parse_docs.py \
        agent/tests/knowledge/test_parse_docs.py \
        agent/tests/knowledge/fixtures/sample-form-doc.md
git commit -m "feat(1.1): parse_docs.py 切 amis 组件 markdown"
```

### Task 4.1：amis-core-schema/SKILL.md 顶层概述

**Files:**
- Create: `skills/amis-core-schema/SKILL.md`

- [ ] **Step 1: 写 SKILL.md**

Create `skills/amis-core-schema/SKILL.md`:
```markdown
---
name: amis-core-schema
description: baidu/amis 6.x 全组件属性 schema 速查（自动生成自源码 .ts 接口）
type: knowledge
---

# Amis 核心组件 Schema 速查

本桶为 baidu/amis 6.x 各组件属性的结构化速查表，由 `amis_types_extractor` 自动从 amis 源码 .ts 接口抽出，**勿手工编辑** `references/*.md`（会被下次 importer 跑覆盖）。

## 用途

- 给 Agent 生成 amis JSON 时校验属性名、类型、必选标记
- 防止瞎编不存在的字段（类型轨硬约束）

## 何时被检索

system_prompt 不直接注入本桶（避免预算爆），由 `Skill` 工具按需检索 `references/<component>.md`：

- 用户提到具体组件名（form / crud / select / ...）→ 检索对应 references
- 用户描述高频场景（"建一个登录表单"）→ 由 amis-core 桶里 RAG 召回示例 + 本桶 schema 双查

## 数据来源

- 源码：[baidu/amis](https://github.com/baidu/amis) 6.10.0（commit pin 见 `agent/src/knowledge/amis_dump/amis-schema.json` 顶层 `amis_version` 字段）
- 解析器：`agent/src/knowledge/amis_types_extractor/extractor.ts`

## 协议

每份 `references/<component>.md` 格式：

\`\`\`markdown
---
component: form
amis_version: 6.10.0
---

# Form 表单

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| type | "form" | 是 | 控件类型固定为 form |
| ... | ... | ... | ... |
\`\`\`
```
（实际写入时把转义反引号还原）

- [ ] **Step 2: 提交**

```bash
git add skills/amis-core-schema/SKILL.md
git commit -m "feat(1.1): 新增 skills/amis-core-schema/ 桶顶层 SKILL.md"
```

### Task 4.2：ingest_skills.py 写 references/<comp>.md

**Files:**
- Create: `agent/src/knowledge/amis_importer/ingest_skills.py`
- Test: `agent/tests/knowledge/test_ingest_skills.py`
- Create: `agent/tests/knowledge/fixtures/sample-amis-schema.json`

- [ ] **Step 1: 准备 schema fixture**

Create `agent/tests/knowledge/fixtures/sample-amis-schema.json`:
```json
{
  "amis_version": "6.10.0",
  "components": {
    "form": {
      "props": [
        {"name": "type", "type": "\"form\"", "description": "控件类型固定为 form", "required": true},
        {"name": "title", "type": "string", "description": "表单标题", "required": false},
        {"name": "api", "type": "string", "description": "提交时调用的 API", "required": false}
      ]
    }
  }
}
```

- [ ] **Step 2: 写测试**

Create `agent/tests/knowledge/test_ingest_skills.py`:
```python
import json
from pathlib import Path
from agent.src.knowledge.amis_importer.ingest_skills import ingest_schema_to_skills

FIXTURE = Path(__file__).parent / "fixtures" / "sample-amis-schema.json"


def test_ingest_schema_writes_one_md_per_component(tmp_path):
    refs_dir = tmp_path / "references"
    n = ingest_schema_to_skills(FIXTURE, refs_dir)
    assert n == 1
    form_md = refs_dir / "form.md"
    assert form_md.exists()
    content = form_md.read_text(encoding="utf-8")
    assert "component: form" in content
    assert "amis_version: 6.10.0" in content
    assert "| type |" in content
    assert "| title |" in content
    assert "控件类型固定为 form" in content


def test_ingest_schema_idempotent_overwrite(tmp_path):
    refs_dir = tmp_path / "references"
    ingest_schema_to_skills(FIXTURE, refs_dir)
    first = (refs_dir / "form.md").read_text()
    ingest_schema_to_skills(FIXTURE, refs_dir)
    second = (refs_dir / "form.md").read_text()
    assert first == second
```

- [ ] **Step 3: 运行测试验证失败**

Run: `cd agent && uv run pytest tests/knowledge/test_ingest_skills.py -v`
Expected: `FAILED` with `ImportError`

- [ ] **Step 4: 写实现**

Create `agent/src/knowledge/amis_importer/ingest_skills.py`:
```python
"""类型轨入库：amis-schema.json → skills/amis-core-schema/references/<comp>.md"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any


def _row(name: str, type_: str, required: bool, description: str) -> str:
    desc = (description or "").replace("|", "\\|").replace("\n", "<br>")
    type_safe = type_.replace("|", "\\|")
    return f"| `{name}` | `{type_safe}` | {'是' if required else '否'} | {desc} |"


def render_component_md(component: str, schema: dict[str, Any], amis_version: str) -> str:
    props = schema.get("props", [])
    rows = "\n".join(
        _row(p["name"], p["type"], p["required"], p["description"]) for p in props
    )
    return f"""---
component: {component}
amis_version: {amis_version}
---

# {component}

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
{rows}
"""


def ingest_schema_to_skills(schema_json: Path, output_refs_dir: Path) -> int:
    dump = json.loads(schema_json.read_text(encoding="utf-8"))
    amis_version = dump.get("amis_version", "")
    components = dump.get("components", {})
    output_refs_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for comp_name, comp_schema in components.items():
        md = render_component_md(comp_name, comp_schema, amis_version)
        (output_refs_dir / f"{comp_name}.md").write_text(md, encoding="utf-8")
        n += 1
    return n
```

- [ ] **Step 5: 运行测试验证通过**

Run: `cd agent && uv run pytest tests/knowledge/test_ingest_skills.py -v`
Expected: `2 passed`

- [ ] **Step 6: 提交**

```bash
git add agent/src/knowledge/amis_importer/ingest_skills.py \
        agent/tests/knowledge/test_ingest_skills.py \
        agent/tests/knowledge/fixtures/sample-amis-schema.json
git commit -m "feat(1.1): ingest_skills.py 写 references/<comp>.md"
```

### Task 5.1：ingest_rag.py 测试骨架（pytest-asyncio + asyncpg fixtures）

**Files:**
- Modify: `agent/tests/knowledge/conftest.py`
- Create: `agent/tests/knowledge/test_ingest_rag.py`

> 说明：本任务用真实 Postgres（CI 起 docker-compose 的 postgres），不 mock。CI 执行前 `docker-compose up -d postgres`。

- [ ] **Step 1: 写 conftest 提供 db_pool fixture**

Create `agent/tests/knowledge/conftest.py`:
```python
import os
import pytest_asyncio
import asyncpg


@pytest_asyncio.fixture
async def db_pool():
    """连接到本地 amis_ai 数据库，每个测试结束清理临时数据。"""
    url = os.environ.get(
        "DATABASE_URL",
        "postgresql://amis_ai:amis_ai@localhost:5432/amis_ai",
    )
    pool = await asyncpg.create_pool(url, min_size=1, max_size=2)
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM code_samples WHERE 'amis-knowledge-test' = ANY(tags)"
        )
    yield pool
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM code_samples WHERE 'amis-knowledge-test' = ANY(tags)"
        )
    await pool.close()
```

- [ ] **Step 2: 写测试**

Create `agent/tests/knowledge/test_ingest_rag.py`:
```python
import pytest
from agent.src.knowledge.amis_importer.ingest_rag import ingest_rag_records, RagRecord


@pytest.mark.asyncio
async def test_ingest_rag_inserts_new_record(db_pool):
    records = [RagRecord(
        component="form",
        amis_version="6.10.0",
        title="Form 表单 示例 #1",
        prose="测试 prose",
        amis_json='{"type":"form"}',
        status="auto_imported",
        extra_tags=["amis-knowledge-test"],
    )]
    n = await ingest_rag_records(db_pool, records)
    assert n == 1
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT tech_stack, source_team, status, tags FROM code_samples "
            "WHERE 'amis-component:form' = ANY(tags) AND 'amis-knowledge-test' = ANY(tags)"
        )
        assert row["tech_stack"] == "amis-core"
        assert row["source_team"] == "baidu-amis"
        assert row["status"] == "auto_imported"


@pytest.mark.asyncio
async def test_ingest_rag_idempotent_by_tags(db_pool):
    records = [RagRecord(
        component="select",
        amis_version="6.10.0",
        title="Select 选择",
        prose="x",
        amis_json='{"type":"select"}',
        status="auto_imported",
        extra_tags=["amis-knowledge-test"],
    )]
    n1 = await ingest_rag_records(db_pool, records)
    n2 = await ingest_rag_records(db_pool, records)
    assert n1 == 1
    assert n2 == 0  # 第二次跑应该 UPDATE 不 INSERT
    async with db_pool.acquire() as conn:
        cnt = await conn.fetchval(
            "SELECT count(*) FROM code_samples "
            "WHERE 'amis-component:select' = ANY(tags) AND 'amis-knowledge-test' = ANY(tags)"
        )
        assert cnt == 1
```

- [ ] **Step 3: 运行测试验证失败**

Run: `cd agent && uv run pytest tests/knowledge/test_ingest_rag.py -v`
Expected: `FAILED` with `ImportError`

- [ ] **Step 4: 提交**（先提测试，下个 Task 实现）

```bash
git add agent/tests/knowledge/conftest.py agent/tests/knowledge/test_ingest_rag.py
git commit -m "test(1.1): ingest_rag.py 集成测试（asyncpg + tags 幂等）"
```

### Task 5.2：ingest_rag.py 实现（直连 DB INSERT + tags 幂等）

**Files:**
- Create: `agent/src/knowledge/amis_importer/ingest_rag.py`

- [ ] **Step 1: 写实现**

Create `agent/src/knowledge/amis_importer/ingest_rag.py`:
```python
"""文档轨入库：parse_docs.ComponentDoc → code_samples 行（asyncpg 直连）。

幂等约束：tags 中同时含 amis-component:<name> 和 amis-version:<x> 的行视为同一条。
"""
from __future__ import annotations
import json
from dataclasses import dataclass, field
from typing import Iterable

import asyncpg


@dataclass
class RagRecord:
    component: str
    amis_version: str
    title: str
    prose: str
    amis_json: str           # 完整 amis JSON 示例（full_amis_json 列）
    status: str = "auto_imported"  # auto_imported / approved / pending
    extra_tags: list[str] = field(default_factory=list)

    @property
    def tags(self) -> list[str]:
        return [
            f"amis-component:{self.component}",
            f"amis-version:{self.amis_version}",
            "amis-knowledge-1.1",
            *self.extra_tags,
        ]


_INSERT_SQL = """
INSERT INTO code_samples (
    tech_stack, tech_stacks, platforms, ui_libs,
    source_team, amis_json_summary, code_summary,
    full_amis_json, full_code, status, tags,
    hit_count, created_at, updated_at
) VALUES (
    'amis-core', ARRAY['amis-core'], ARRAY['web'], ARRAY[]::text[],
    'baidu-amis', $1, $2, $3, $4, $5, $6, 0, NOW(), NOW()
)
RETURNING id
"""

_UPDATE_SQL = """
UPDATE code_samples
SET amis_json_summary = $2,
    code_summary = $3,
    full_amis_json = $4,
    full_code = $5,
    status = $6,
    tags = $7,
    updated_at = NOW()
WHERE id = $1
"""

_LOOKUP_SQL = """
SELECT id FROM code_samples
WHERE $1 = ANY(tags) AND $2 = ANY(tags)
LIMIT 1
"""


async def ingest_rag_records(
    pool: asyncpg.Pool,
    records: Iterable[RagRecord],
) -> int:
    """灌入 records；返回新插入行数（已存在的走 UPDATE 不计数）。"""
    inserted = 0
    async with pool.acquire() as conn:
        async with conn.transaction():
            for rec in records:
                tag_comp = f"amis-component:{rec.component}"
                tag_ver = f"amis-version:{rec.amis_version}"
                code_summary_text = (
                    f"baidu/amis {rec.component} {rec.amis_version} 自动导入；"
                    f"prose 长度 {len(rec.prose)}"
                )
                # full_code 这里没有真实代码（不像反向飞轮），填一段标识
                full_code = (
                    f"// auto-imported from baidu/amis docs\n"
                    f"// component: {rec.component}\n"
                    f"// amis_version: {rec.amis_version}\n"
                )
                existing = await conn.fetchval(_LOOKUP_SQL, tag_comp, tag_ver)
                if existing is not None:
                    await conn.execute(
                        _UPDATE_SQL,
                        existing, rec.title, code_summary_text,
                        rec.amis_json, full_code, rec.status, rec.tags,
                    )
                else:
                    await conn.fetchval(
                        _INSERT_SQL,
                        rec.title, code_summary_text,
                        rec.amis_json, full_code, rec.status, rec.tags,
                    )
                    inserted += 1
    return inserted


def docs_json_to_records(
    docs_json_path,
    amis_version: str,
    status: str = "auto_imported",
) -> list[RagRecord]:
    """parse_docs 输出的 docs.json → RagRecord 列表（每个示例 JSON 一条）。"""
    raw = json.loads(open(docs_json_path, encoding="utf-8").read())
    out: list[RagRecord] = []
    for doc in raw:
        for idx, example in enumerate(doc["examples"]):
            out.append(RagRecord(
                component=doc["component"],
                amis_version=amis_version,
                title=f"{doc['title']} 示例 #{idx + 1}",
                prose=doc["prose"],
                amis_json=example,
                status=status,
            ))
    return out
```

- [ ] **Step 2: 跑测试验证通过**

Run: `cd agent && uv run pytest tests/knowledge/test_ingest_rag.py -v`
Expected: `2 passed`（前提：docker-compose 的 postgres 在线 + 表已建）

- [ ] **Step 3: 提交**

```bash
git add agent/src/knowledge/amis_importer/ingest_rag.py
git commit -m "feat(1.1): ingest_rag.py 直连 DB INSERT + tags 幂等"
```

### Task 5.3：触发 agent 向量化（调 index_code_sample）

**Files:**
- Modify: `agent/src/knowledge/amis_importer/ingest_rag.py`

> 现状：[index_code_sample(sample_id, summary_text)](agent/src/services/rag.py#L171) 已存在。importer 在 INSERT 后顺手调一次。

- [ ] **Step 1: 加测试**

Append to `agent/tests/knowledge/test_ingest_rag.py`:
```python
@pytest.mark.asyncio
async def test_ingest_rag_triggers_vectorization(db_pool):
    records = [RagRecord(
        component="dialog",
        amis_version="6.10.0",
        title="Dialog 弹窗",
        prose="弹窗",
        amis_json='{"type":"dialog"}',
        status="auto_imported",
        extra_tags=["amis-knowledge-test"],
    )]
    await ingest_rag_records(db_pool, records, vectorize=True)
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT embedding FROM code_samples "
            "WHERE 'amis-component:dialog' = ANY(tags) AND 'amis-knowledge-test' = ANY(tags)"
        )
        assert row["embedding"] is not None
```

- [ ] **Step 2: 改实现加 vectorize 参数**

Edit `agent/src/knowledge/amis_importer/ingest_rag.py` 在 `ingest_rag_records` 签名加 `vectorize: bool = False` 参数；INSERT/UPDATE 后调用：

```python
if vectorize:
    from agent.src.services.rag import index_code_sample
    summary = f"{rec.title}\n{rec.prose}"
    await index_code_sample(existing or new_id, summary)
```

> 注意需先把 `inserted_id` 从 `INSERT … RETURNING id` 接住（已有 fetchval）。

- [ ] **Step 3: 跑测试**

Run: `cd agent && uv run pytest tests/knowledge/test_ingest_rag.py::test_ingest_rag_triggers_vectorization -v`
Expected: `1 passed`（前提：embedding 端点配置正确，否则跳过）

- [ ] **Step 4: 提交**

```bash
git add agent/src/knowledge/amis_importer/ingest_rag.py agent/tests/knowledge/test_ingest_rag.py
git commit -m "feat(1.1): ingest_rag 触发 agent 向量化（vectorize=True）"
```

### Task 6.1：__main__.py CLI 入口

**Files:**
- Create: `agent/src/knowledge/amis_importer/__main__.py`
- Test: `agent/tests/knowledge/test_cli.py`

- [ ] **Step 1: 写测试**

Create `agent/tests/knowledge/test_cli.py`:
```python
import subprocess
import sys


def test_cli_help_shows_subcommands():
    out = subprocess.run(
        [sys.executable, "-m", "agent.src.knowledge.amis_importer", "--help"],
        capture_output=True, text=True, check=True,
    )
    text = out.stdout + out.stderr
    assert "types" in text
    assert "docs" in text
    assert "all" in text
    assert "dry-run" in text
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd agent && uv run pytest tests/knowledge/test_cli.py -v`
Expected: `FAILED`

- [ ] **Step 3: 写实现**

Create `agent/src/knowledge/amis_importer/__main__.py`:
```python
"""CLI: python -m agent.src.knowledge.amis_importer [types|docs|all] [--dry-run] [--component <name>]"""
from __future__ import annotations
import argparse
import asyncio
import json
import subprocess
import sys
from pathlib import Path

from .config import (
    ImporterConfig, DUMP_DIR, SKILLS_REFS, TYPES_EXTRACTOR_DIR,
)
from .clone import clone_amis
from .parse_docs import dump_docs_json
from .ingest_skills import ingest_schema_to_skills
from .ingest_rag import docs_json_to_records, ingest_rag_records


def cmd_types(cfg: ImporterConfig) -> int:
    repo = clone_amis(cfg)
    schema_json = DUMP_DIR / "amis-schema.json"
    DUMP_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[types] 调 Node extractor 解析 {repo}")
    subprocess.run(
        ["pnpm", "tsx", "extractor.ts", str(repo), str(schema_json), cfg.amis_version],
        cwd=TYPES_EXTRACTOR_DIR, check=True,
    )
    print(f"[types] 写 references → {SKILLS_REFS}")
    if cfg.dry_run:
        print("[types] dry-run，跳过写文件")
        return 0
    n = ingest_schema_to_skills(schema_json, SKILLS_REFS)
    print(f"[types] 完成 ✓ 共 {n} 个组件 references")
    return 0


def cmd_docs(cfg: ImporterConfig, status: str) -> int:
    import asyncpg
    repo = clone_amis(cfg)
    docs_json = DUMP_DIR / "docs.json"
    n_docs = dump_docs_json(cfg, repo, docs_json)
    print(f"[docs] 切出 {n_docs} 个组件文档 → {docs_json}")
    if cfg.dry_run:
        print("[docs] dry-run，跳过 DB 写")
        return 0
    records = docs_json_to_records(docs_json, cfg.amis_version, status=status)
    pool = asyncio.run(asyncpg.create_pool(cfg.db_url, min_size=1, max_size=4))
    n = asyncio.run(ingest_rag_records(pool, records, vectorize=True))
    asyncio.run(pool.close())
    print(f"[docs] 完成 ✓ 新增 {n} 条 code_samples")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(prog="amis_importer", description="amis 知识双轨补全 CLI")
    p.add_argument("phase", choices=["types", "docs", "all"], help="跑哪一轨：types / docs / all（两个都跑）")
    p.add_argument("--dry-run", action="store_true", help="只跑解析不写文件/不写 DB")
    p.add_argument("--component", help="只处理指定组件（默认全量）")
    p.add_argument("--status", default="auto_imported", choices=["auto_imported", "approved", "pending"], help="docs 轨入库时的 status（默认 auto_imported）")
    p.add_argument("--amis-version", default=None, help="覆盖默认 amis 版本")
    args = p.parse_args()

    cfg = ImporterConfig(dry_run=args.dry_run)
    if args.amis_version:
        cfg.amis_version = args.amis_version

    if args.phase in ("types", "all"):
        rc = cmd_types(cfg)
        if rc != 0:
            return rc
    if args.phase in ("docs", "all"):
        rc = cmd_docs(cfg, status=args.status)
        if rc != 0:
            return rc
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: 跑测试验证通过**

Run: `cd agent && uv run pytest tests/knowledge/test_cli.py -v`
Expected: `1 passed`

- [ ] **Step 5: 提交**

```bash
git add agent/src/knowledge/amis_importer/__main__.py agent/tests/knowledge/test_cli.py
git commit -m "feat(1.1): amis_importer CLI 入口（phase: types/docs/all）"
```

---

## Phase 2：数据生产

### Task 7.1：跑全量类型轨

**Files:**
- 自动生成：`agent/src/knowledge/amis_dump/amis-schema.json`
- 自动生成：`skills/amis-core-schema/references/*.md`（≥ 50 个）

- [ ] **Step 1: 跑 importer types**

```bash
cd /home/karl/Working/TianXing/amis-ai
uv run --project agent python -m agent.src.knowledge.amis_importer types
```
Expected: 输出 `[types] 完成 ✓ 共 <N> 个组件 references`，N ≥ 50

- [ ] **Step 2: 校验 references 数量**

```bash
ls skills/amis-core-schema/references/*.md | wc -l
```
Expected: ≥ 50

- [ ] **Step 3: 抽查 form.md 内容**

Run: `head -25 skills/amis-core-schema/references/form.md`
Expected: 含 frontmatter + 属性表，type / title / api / body 都在。

- [ ] **Step 4: 提交全部生成产物**

```bash
git add agent/src/knowledge/amis_dump/amis-schema.json skills/amis-core-schema/references/
git commit -m "data(1.1): 类型轨全量导入 — amis-core-schema/references/ N=<N>"
```

### Task 7.2：跑全量文档轨（冷门 30+ 自动批量）

- [ ] **Step 1: 起 docker-compose postgres + 4 服务**

```bash
docker-compose up -d
./shared/scripts/start-services.sh start
```
Expected: `start-services.sh status` 显示 4 服务全绿。

- [ ] **Step 2: 跑 importer docs（status=auto_imported）**

```bash
uv run --project agent python -m agent.src.knowledge.amis_importer docs --status auto_imported
```
Expected: `[docs] 完成 ✓ 新增 <N> 条 code_samples`，N ≥ 60（冷门 + 高频示例都算）

- [ ] **Step 3: 校验 DB 行数**

```bash
psql "$DATABASE_URL" -c "SELECT count(*) FROM code_samples WHERE 'amis-knowledge-1.1' = ANY(tags)"
```
Expected: count ≥ 60

- [ ] **Step 4: 提交 docs.json 中间产物**

```bash
git add agent/src/knowledge/amis_dump/docs.json
git commit -m "data(1.1): 文档轨自动批量导入完成（auto_imported 状态）"
```

### Task 8.1：高频 18 组件 AI 起草精修（W3）

> 这部分大量是手工 review 工作，不严格走 TDD。每个组件复用 [SkillAuthoringWizard.tsx](frontend/src/views/KnowledgeBase/SkillAuthoringWizard.tsx) `mode=clone_bucket`。每完成一个就 commit 一次。

**高频清单（18 个）**：
- 表单类（8）：`form` / `input-text` / `input-number` / `select` / `picker` / `checkboxes` / `radios` / `switch`
- CRUD 列表（4）：`crud` / `table` / `cards` / `list`
- 容器（4）：`page` / `dialog` / `wizard` / `tabs`
- 行动（2）：`button` / `action`

**单组件流程（用 `form` 为例，重复 18 次）：**

- [ ] **Step 1: 在 KnowledgeBase 找 auto_imported 的 form 样例**

打开浏览器 → http://localhost:5173/knowledge-base/skills → 切 code_samples 列表，按 `tag = amis-component:form` 过滤。

- [ ] **Step 2: 选一条质量最好的 auto_imported 样例「升级到 approved」**

点详情 → 编辑 → 改 status 为 `approved` → 保存 → 触发审计。

- [ ] **Step 3: 用 SkillAuthoringWizard 仿写出 2-3 条新示例**

进入 KnowledgeBase 顶部「AI 起草新桶」按钮 → 选 mode=clone_bucket → 源桶选 `amis-core-schema/references/form.md` → 目标领域填「不同业务场景的 form 示例（登录/搜索/新增订单）」 → 流式生成 → 逐文件 review → 入库。

- [ ] **Step 4: 提交**

```bash
git add -A  # 高频组件 review 通常涉及前端审核，可能不改源码
git commit --allow-empty -m "data(1.1): 高频组件 form 升级到 approved + 3 条仿写示例入库"
```

**重复 Step 1-4 共 18 次（form / input-text / ... / action）。**

> Tip：每天搞 4-5 个组件，4 天搞完 18 个；遇到组件文档过于残缺的就跳过留 issue，进 Q&A backlog。

### Task 8.2：高频 18 组件验收

- [ ] **Step 1: 校验高频组件 approved 数量**

```bash
psql "$DATABASE_URL" -c "
SELECT count(*) FROM code_samples
WHERE 'amis-knowledge-1.1' = ANY(tags) AND status = 'approved'
  AND tags && ARRAY[
    'amis-component:form','amis-component:input-text','amis-component:input-number',
    'amis-component:select','amis-component:picker','amis-component:checkboxes',
    'amis-component:radios','amis-component:switch','amis-component:crud',
    'amis-component:table','amis-component:cards','amis-component:list',
    'amis-component:page','amis-component:dialog','amis-component:wizard',
    'amis-component:tabs','amis-component:button','amis-component:action'
  ]"
```
Expected: 至少 18（每组件至少 1 条 approved）。

- [ ] **Step 2: 总数验收（覆盖度第 2 门槛）**

```bash
psql "$DATABASE_URL" -c "SELECT count(*) FROM code_samples WHERE 'amis-knowledge-1.1' = ANY(tags)"
```
Expected: ≥ 80

---

## Phase 3：评测与验收

### Task 10.1：写 eval set（20 条 prompt）

**Files:**
- Create: `eval/amis-1.1/prompts.json`
- Create: `eval/amis-1.1/README.md`

- [ ] **Step 1: 写 prompts.json**

Create `eval/amis-1.1/prompts.json`（20 条覆盖高频场景）：
```json
[
  {"id": "p01", "prompt": "做一个用户登录表单，包含用户名、密码、记住我复选框", "expected_components": ["form","input-text","switch","button"]},
  {"id": "p02", "prompt": "新建订单的表单，字段：订单号、客户名（远程搜索）、金额、备注", "expected_components": ["form","input-text","select","input-number","textarea"]},
  {"id": "p03", "prompt": "用户列表页，要求：分页、搜索、新增、编辑、删除", "expected_components": ["page","crud","table","button","dialog"]},
  {"id": "p04", "prompt": "三步注册向导：1. 手机号验证 2. 设置密码 3. 完善信息", "expected_components": ["wizard","form","input-text"]},
  {"id": "p05", "prompt": "卡片布局展示商品列表，每张卡片含图片、标题、价格、加入购物车按钮", "expected_components": ["cards","button"]},
  {"id": "p06", "prompt": "管理后台首页：左侧菜单 + 顶部 Tab 切换数据看板", "expected_components": ["page","tabs"]},
  {"id": "p07", "prompt": "选择部门的级联下拉，三级树形结构", "expected_components": ["select"]},
  {"id": "p08", "prompt": "上传头像的表单字段，支持裁剪", "expected_components": ["form","input-image"]},
  {"id": "p09", "prompt": "查询条件区：日期范围、状态多选、关键字搜索", "expected_components": ["form","input-date-range","checkboxes","input-text"]},
  {"id": "p10", "prompt": "弹窗里编辑单条记录，关闭弹窗后刷新表格", "expected_components": ["dialog","form","crud"]},
  {"id": "p11", "prompt": "时间轴展示订单状态变更", "expected_components": ["timeline"]},
  {"id": "p12", "prompt": "二维码生成：输入文本，生成二维码并支持下载", "expected_components": ["form","input-text","qr-code","button"]},
  {"id": "p13", "prompt": "价格输入框带货币符号前缀和单位后缀", "expected_components": ["input-number"]},
  {"id": "p14", "prompt": "树形选择控件：选择菜单权限，支持全选/反选/搜索", "expected_components": ["tree-select"]},
  {"id": "p15", "prompt": "动态表单：根据上一题答案显示不同的下一题", "expected_components": ["form","input-text","select","switch"]},
  {"id": "p16", "prompt": "多 Tab 表单，每个 Tab 一组字段，提交时合并", "expected_components": ["form","tabs","input-text"]},
  {"id": "p17", "prompt": "对话框确认：删除前提示「确定吗？」", "expected_components": ["dialog","button"]},
  {"id": "p18", "prompt": "下拉按钮：导出（PDF/Excel/CSV 三选一）", "expected_components": ["dropdown-button","action"]},
  {"id": "p19", "prompt": "表格行操作列：编辑、删除、查看详情", "expected_components": ["table","action","button"]},
  {"id": "p20", "prompt": "嵌入富文本编辑器，支持 Markdown 切换", "expected_components": ["form","input-rich-text"]}
]
```

- [ ] **Step 2: 写 README**

Create `eval/amis-1.1/README.md`:
```markdown
# Amis 1.1 评测集

20 条固定 prompt，覆盖高频场景，用于 1.1 vs 1.0 的 A/B 跑分。

## 跑法

```bash
# 1. 在 1.0 baseline 跑（切到 main 分支或 release/v1.0.0）
git checkout release/v1.0.0
uv run --project eval/amis-1.1 python runner.py --output baseline-1.0.jsonl

# 2. 切回 1.1
git checkout dev/1.1.0
uv run --project eval/amis-1.1 python runner.py --output 1.1.jsonl

# 3. 对比报告
uv run --project eval/amis-1.1 python runner.py --compare baseline-1.0.jsonl 1.1.jsonl
```

## 验收门槛

- adopt_rate（用户采纳率，模拟由 LLM 评委判定）相比 1.0 提升 ≥ +10pp
- fail_rate（生成无效 JSON 或缺核心组件）不上升
```

- [ ] **Step 3: 提交**

```bash
git add eval/amis-1.1/prompts.json eval/amis-1.1/README.md
git commit -m "eval(1.1): 20 条固定 amis 生成评测 prompt"
```

### Task 10.2：写 eval runner.py

**Files:**
- Create: `eval/amis-1.1/runner.py`
- Create: `eval/amis-1.1/test_runner.py`

- [ ] **Step 1: 写测试**

Create `eval/amis-1.1/test_runner.py`:
```python
import json
from runner import score_result, compare_results


def test_score_result_pass_when_components_match():
    case = {"id": "p01", "expected_components": ["form","button"]}
    output = '{"type":"page","body":[{"type":"form","body":[{"type":"button"}]}]}'
    assert score_result(case, output)["pass"] is True


def test_score_result_fail_when_invalid_json():
    case = {"id": "p01", "expected_components": ["form"]}
    output = "not a json"
    s = score_result(case, output)
    assert s["pass"] is False
    assert s["reason"] == "invalid_json"


def test_compare_reports_adopt_rate_diff():
    a = [{"id": "p01", "pass": True}, {"id": "p02", "pass": False}]
    b = [{"id": "p01", "pass": True}, {"id": "p02", "pass": True}]
    diff = compare_results(a, b)
    assert diff["a_adopt_rate"] == 0.5
    assert diff["b_adopt_rate"] == 1.0
    assert diff["delta_pp"] == 50.0
```

- [ ] **Step 2: 写实现**

Create `eval/amis-1.1/runner.py`:
```python
"""Amis 1.1 评测 runner：按 prompts.json 跑 chat 接口，按 expected_components 评分。"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path
from typing import Any

import httpx

CHAT_ENDPOINT = "http://localhost:8080/api/chat/translate"  # 调正向飞轮


def score_result(case: dict[str, Any], amis_json_text: str) -> dict[str, Any]:
    try:
        obj = json.loads(amis_json_text)
    except json.JSONDecodeError:
        return {"id": case["id"], "pass": False, "reason": "invalid_json"}
    found = _collect_types(obj)
    expected = set(case["expected_components"])
    missing = expected - found
    if missing:
        return {"id": case["id"], "pass": False, "reason": "missing_components", "missing": list(missing)}
    return {"id": case["id"], "pass": True}


def _collect_types(node: Any) -> set[str]:
    out: set[str] = set()
    if isinstance(node, dict):
        if "type" in node and isinstance(node["type"], str):
            out.add(node["type"])
        for v in node.values():
            out |= _collect_types(v)
    elif isinstance(node, list):
        for v in node:
            out |= _collect_types(v)
    return out


def run_eval(prompts_path: Path, output_path: Path, endpoint: str = CHAT_ENDPOINT) -> None:
    prompts = json.loads(prompts_path.read_text(encoding="utf-8"))
    results = []
    with httpx.Client(timeout=120.0) as client:
        for case in prompts:
            print(f"[eval] {case['id']}: {case['prompt'][:40]}...")
            resp = client.post(endpoint, json={"prompt": case["prompt"]})
            resp.raise_for_status()
            amis_json_text = resp.json().get("amis_json", "")
            results.append({**score_result(case, amis_json_text), "amis_json": amis_json_text})
    output_path.write_text(
        "\n".join(json.dumps(r, ensure_ascii=False) for r in results),
        encoding="utf-8",
    )
    n_pass = sum(1 for r in results if r["pass"])
    print(f"[eval] 完成：{n_pass}/{len(results)} pass，写入 {output_path}")


def compare_results(a: list[dict], b: list[dict]) -> dict:
    a_pass = sum(1 for r in a if r["pass"])
    b_pass = sum(1 for r in b if r["pass"])
    a_rate = a_pass / len(a) if a else 0.0
    b_rate = b_pass / len(b) if b else 0.0
    return {
        "a_adopt_rate": round(a_rate, 4),
        "b_adopt_rate": round(b_rate, 4),
        "delta_pp": round((b_rate - a_rate) * 100, 2),
        "a_pass": a_pass,
        "b_pass": b_pass,
        "n": len(a),
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--prompts", default=str(Path(__file__).parent / "prompts.json"))
    p.add_argument("--output", help="跑分模式：写入此 jsonl 文件")
    p.add_argument("--compare", nargs=2, metavar=("A", "B"), help="对比两个 jsonl")
    p.add_argument("--endpoint", default=CHAT_ENDPOINT)
    args = p.parse_args()

    if args.compare:
        a = [json.loads(l) for l in Path(args.compare[0]).read_text().splitlines() if l]
        b = [json.loads(l) for l in Path(args.compare[1]).read_text().splitlines() if l]
        report = compare_results(a, b)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0
    if args.output:
        run_eval(Path(args.prompts), Path(args.output), endpoint=args.endpoint)
        return 0
    p.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 3: 运行测试**

Run: `cd eval/amis-1.1 && uv run pytest test_runner.py -v`
Expected: `3 passed`

- [ ] **Step 4: 提交**

```bash
git add eval/amis-1.1/runner.py eval/amis-1.1/test_runner.py
git commit -m "eval(1.1): runner.py 跑分 + 对比 adopt_rate"
```

### Task 11.1：跑 1.0 baseline + 1.1 对比

- [ ] **Step 1: 跑 1.0 baseline**

```bash
git stash
git checkout release/v1.0.0
./shared/scripts/start-services.sh restart
sleep 30  # 等服务起
uv run --project eval/amis-1.1 python runner.py --output /tmp/baseline-1.0.jsonl
```
Expected: 输出 `[eval] 完成：<N>/<20> pass`

- [ ] **Step 2: 切回 dev/1.1.0**

```bash
git checkout dev/1.1.0
git stash pop
./shared/scripts/start-services.sh restart
sleep 30
```

- [ ] **Step 3: 跑 1.1**

```bash
uv run --project eval/amis-1.1 python runner.py --output eval/amis-1.1/1.1.jsonl
mv /tmp/baseline-1.0.jsonl eval/amis-1.1/baseline-1.0.jsonl
```

- [ ] **Step 4: 出对比报告**

```bash
uv run --project eval/amis-1.1 python runner.py --compare eval/amis-1.1/baseline-1.0.jsonl eval/amis-1.1/1.1.jsonl > eval/amis-1.1/ab-report.json
cat eval/amis-1.1/ab-report.json
```
Expected: `delta_pp >= 10`，否则触发延期。

- [ ] **Step 5: 提交评测产物**

```bash
git add eval/amis-1.1/baseline-1.0.jsonl eval/amis-1.1/1.1.jsonl eval/amis-1.1/ab-report.json
git commit -m "eval(1.1): A/B 跑分结果 — adopt_rate +<delta>pp"
```

### Task 12.1：上线灰度 + 2 周观察

- [ ] **Step 1: PR 合并 dev/1.1.0 → main**

```bash
git push origin dev/1.1.0
gh pr create --base main --head dev/1.1.0 --title "1.1.0：Amis 知识双轨补全" --body "$(cat <<'EOF'
## Summary
- 双轨：amis 文档 → RAG code_samples；TS 类型 → skills/amis-core-schema/ 桶
- 工具链：amis_importer (Python) + amis_types_extractor (Node + ts-morph)
- 高频 18 组件人审 approved + 冷门 30+ 自动批量 auto_imported
- eval/amis-1.1 A/B 报告：adopt_rate 提升 +<delta>pp

## Test plan
- [x] 单元测试：parse_docs / ingest_skills / ingest_rag / extractor.test.ts 全通过
- [x] 集成测试：importer dry-run 跑通
- [x] 数据验收：references ≥ 50；code_samples ≥ 80
- [x] eval：A/B delta_pp ≥ 10
- [ ] 上线 2 周观察 thumbs_up_ratio ≥ 75%
EOF
)"
```

- [ ] **Step 2: 合并后部署 + 启 thumbs/rating**

按 [shared/scripts/start-services.sh](shared/scripts/start-services.sh) 部署到生产；在 [SystemSettings.tsx](frontend/src/views/Settings/SystemSettings.tsx) 「RAG 飞轮」面板里确认 Phase 1 信号埋点为 ON。

- [ ] **Step 3: 2 周后查 thumbs_up_ratio**

```bash
psql "$DATABASE_URL" -c "
SELECT
  count(*) FILTER (WHERE thumbs > 0) AS up,
  count(*) FILTER (WHERE thumbs < 0) AS down,
  ROUND(100.0 * count(*) FILTER (WHERE thumbs > 0) / NULLIF(count(*) FILTER (WHERE thumbs <> 0), 0), 2) AS up_ratio
FROM code_samples
WHERE 'amis-knowledge-1.1' = ANY(tags)"
```
Expected: `up_ratio >= 75`

- [ ] **Step 4: 三门槛达标 → 打 tag**

```bash
git checkout main && git pull
git tag -a v1.1.0 -m "v1.1.0：Amis 知识双轨补全"
git push origin v1.1.0
```

- [ ] **Step 5: 不达标 → 延期 1 周补样例**

回到 [Task 8.1](#task-81高频-18-组件-ai-起草精修w3) 给 thumbs_down 多的组件补 2-3 条更优示例，跑评测重测。

---

## Self-review

- **Spec coverage 检查**：
  - § 1 目标 4 条 → Task 7.1（覆盖度门槛 1）/ Task 7.2（覆盖度门槛 2）/ Task 11.1（adopt_rate）/ Task 12.1 Step 3（thumbs_up）✓
  - § 4 组件分解 → Task 1.1 / 1.2 / 2.1-2.4 / 3.1 / 4.1-4.2 / 5.1-5.3 / 6.1 ✓
  - § 5 数据流 → Task 8.1（高频精修流）+ Task 7.2（冷门批量流）✓
  - § 6 错误处理 → Task 1.2 Step 3（clone retry 3）/ extractor union 容忍 / parse_docs try-except ✓
  - § 7 测试策略 → Task 1.1 / 1.2 / 2.2 / 3.1 / 4.2 / 5.1-5.3 / 10.2 ✓
  - § 9 风险备选 → 文档结构非标准 try-except / extractor union raw / 高频 18→12 砍量 / 不达标延期 ✓
- **Placeholder 扫描**：通读全文，无 TBD / TODO / "fill in details"
- **类型一致性**：`ImporterConfig` 字段、`RagRecord` 字段、`ComponentDoc` 字段在所有 Task 中保持一致；`extractInterfaces` / `runCli` 签名一致

---

## 引用

- 配套 spec: [2026-05-07-amis-knowledge-completion-design.md](2026-05-07-amis-knowledge-completion-design.md)
- 1.x 路线图（项目记忆）：1.1 知识补全 → 1.2 多页面 → 1.3 ZC 主仓融合
- baidu/amis: https://github.com/baidu/amis
