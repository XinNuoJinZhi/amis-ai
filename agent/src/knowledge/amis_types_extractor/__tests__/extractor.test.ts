import { describe, it, expect } from "vitest";
import { extractInterfaces, runCli } from "../extractor.js";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, "fixtures/sample-form-schema.ts");

describe("extractInterfaces", () => {
  it("从 fixture 抽出 form 组件并保留 props 和 jsdoc", () => {
    const result = extractInterfaces([FIXTURE]);
    expect(result.components.form).toBeDefined();
    const form = result.components.form;
    const props = Object.fromEntries(form.props.map((p) => [p.name, p]));
    expect(props.type.required).toBe(true);
    expect(props.title.required).toBe(false);
    expect(props.title.description).toContain("表单标题");
    expect(props.submitText.description).toContain("提交");
  });

  it("union 类型保留 raw text 不丢", () => {
    const result = extractInterfaces([FIXTURE]);
    const sel = result.components.select;
    const options = sel.props.find((p) => p.name === "options")!;
    expect(options.type.length).toBeGreaterThan(0);
    expect(options.required).toBe(false);
  });
});

describe("runCli", () => {
  it("把 fixture 解析结果写到指定 JSON 路径", () => {
    const out = path.join(__dirname, "tmp-amis-schema.json");
    runCli({ inputs: [FIXTURE], output: out, version: "v6.0.0" });
    const dump = JSON.parse(fs.readFileSync(out, "utf-8"));
    expect(dump.amis_version).toBe("v6.0.0");
    expect(Object.keys(dump.components).length).toBeGreaterThanOrEqual(2);
    fs.unlinkSync(out);
  });
});
