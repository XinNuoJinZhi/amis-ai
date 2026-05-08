import { Project } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

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
      if (!compName) continue; // 跳过裸 "Schema" interface（空 component 名）
      components[compName] = {
        props: iface.getProperties().map((p) => ({
          name: p.getName(),
          type: p.getType().getText(p),
          description: p
            .getJsDocs()
            .map((d) => d.getDescription().trim())
            .join("\n")
            .trim(),
          required: !p.hasQuestionToken(),
        })),
      };
    }
  }
  return { amis_version: "", components };
}

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
    `${repoDir}/packages/amis/src/Schema.ts`,
  ]);
  const inputs = project.getSourceFiles().map((sf) => sf.getFilePath());
  console.log(`[extractor] 扫描 ${inputs.length} 个文件...`);
  const dump = runCli({ inputs, output: outputJson, version });
  console.log(
    `[extractor] 抽出 ${Object.keys(dump.components).length} 个组件 → ${outputJson}`,
  );
}
