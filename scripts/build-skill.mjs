import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import postcss from "postcss";
import ts from "typescript";
import { createServer } from "vite";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const skillName = "use-goodcase-ui";
const generatorId = "goodcase/build-skill/v1";
const styleNames = [
  "tokens",
  "global",
  "basic",
  "overlays",
  "tabs",
  "toast",
  "composed",
];
const hash = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

async function listFiles(directory, prefix = "") {
  const files = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory())
      files.push(
        ...(await listFiles(path.join(directory, entry.name), relative)),
      );
    else if (entry.isFile()) files.push(relative);
    else
      throw new Error(`배포본에는 일반 파일만 포함할 수 있습니다: ${relative}`);
  }
  return files;
}

// Remove only gallery/demo selectors; preserve shared selectors in the same rule.
export function componentCss(text) {
  const root = postcss.parse(text);
  root.walkRules((rule) => {
    const selectors = rule.selectors.filter(
      (selector) =>
        !/\.gc-[\w-]*demo[\w-]*\b|\.gc-toast-specimens\b/.test(selector),
    );
    if (selectors.length) rule.selectors = selectors;
    else rule.remove();
  });
  root.walkAtRules((rule) => {
    if (rule.nodes?.length === 0) rule.remove();
  });
  return root.toString();
}

function sourceDetails(file, text) {
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const imports = ts
    .preProcessFile(text, true, true)
    .importedFiles.map((item) => item.fileName);
  const symbols = [];
  for (const statement of ast.statements) {
    if (
      !statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    )
      continue;
    const names = statement.name
      ? [statement.name.text]
      : ts.isVariableStatement(statement)
        ? statement.declarationList.declarations.flatMap((declaration) =>
            ts.isIdentifier(declaration.name) ? [declaration.name.text] : [],
          )
        : [];
    for (const name of names)
      symbols.push({
        name,
        file: `assets/${file}`,
        startLine:
          ast.getLineAndCharacterOfPosition(statement.getStart(ast)).line + 1,
        endLine: ast.getLineAndCharacterOfPosition(statement.end).line + 1,
      });
  }
  return { imports, symbols };
}

function dependenciesFor(files, sources, details) {
  const requiredFiles = new Set();
  const packages = new Set();
  const visit = (file) => {
    if (requiredFiles.has(file)) return;
    if (!sources.has(file))
      throw new Error(`배포 가능한 파일을 찾을 수 없습니다: ${file}`);
    requiredFiles.add(file);
    for (const specifier of details.get(file)?.imports ?? []) {
      if (!specifier.startsWith(".")) {
        if (specifier.startsWith("/") || specifier.startsWith("node:"))
          throw new Error(`이식할 수 없는 import: ${specifier}`);
        packages.add(
          specifier.startsWith("@")
            ? specifier.split("/").slice(0, 2).join("/")
            : specifier.split("/")[0],
        );
        continue;
      }
      const base = path.posix.normalize(
        path.posix.join(path.posix.dirname(file), specifier),
      );
      const resolved = [
        base,
        `${base}.tsx`,
        `${base}.ts`,
        `${base}/index.tsx`,
        `${base}/index.ts`,
      ].find((candidate) => sources.has(candidate));
      if (!resolved)
        throw new Error(
          `${file}의 상대 import를 배포본에서 찾을 수 없습니다: ${specifier}`,
        );
      visit(resolved);
    }
  };
  files.forEach(visit);
  if (files.some((file) => file.startsWith("src/components/")))
    styleNames.forEach((name) => visit(`src/styles/${name}.css`));
  // React's DOM renderer is also required by the host app and Radix peers.
  if (packages.has("react")) packages.add("react-dom");
  return {
    requiredFiles: [...requiredFiles].sort().map((file) => `assets/${file}`),
    packages: [...packages].sort(),
  };
}

function componentReference(entry, dependencies, symbols) {
  const bullets = (values) => values.map((value) => `- ${value}`).join("\n");
  const text = `# ${entry.name}\n\n${entry.summary}\n\n## 동작 계약\n\n${bullets(entry.contracts)}\n\n## 상태\n\n${bullets(entry.states)}\n\n## 키보드\n\n${bullets(entry.keyboard)}\n\n## 직접 관련 파일\n\n${bullets(entry.files.map((file) => `assets/${file}`))}\n\n## 포함 코드와 공유 스타일\n\n${bullets(dependencies.requiredFiles)}\n\n상대 import와 공유 모듈의 다른 export 때문에 직접 사용하는 컴포넌트보다 범위가 넓을 수 있습니다.\n\n## 외부 패키지\n\n${dependencies.packages.length ? dependencies.packages.join(", ") : "없음 (CSS custom properties)"}\n\n참조 버전은 배포본 루트 manifest.json의 packageVersions를 확인합니다.\n\n## 카탈로그 의존성 설명\n\n${bullets(entry.dependencies)}\n\n## 코드 위치\n\n${bullets(symbols.map((symbol) => `${symbol.name}: ${symbol.file}:${symbol.startLine}-${symbol.endLine}`))}\n\n## 이식\n\n${entry.migration.map((value, index) => `${index + 1}. ${value}`).join("\n")}\n\n## 사용 예제\n\n\`\`\`${entry.id === "design-tokens" ? "css" : "tsx"}\n${entry.usage}\n\`\`\`\n\n예제의 import, 데이터, 상태, callback은 대상 프로젝트에서 제공합니다. 갤러리 데모는 배포본에 포함되지 않습니다.\n`;
  // Catalog text refers to original paths; route those to bundled assets.
  return text.replace(
    /(?<!assets\/)src\/(components|styles)\//g,
    "assets/src/$1/",
  );
}

export async function createSkillFiles() {
  const files = new Map();
  const sources = new Map();
  const details = new Map();
  const templates = path.join(projectRoot, "skill-source", skillName);
  for (const file of await listFiles(templates))
    files.set(
      file === "SKILL.template.md" ? "SKILL.md" : file,
      await readFile(path.join(templates, file), "utf8"),
    );
  for (const file of await listFiles(
    path.join(projectRoot, "src/components"),
  )) {
    if (!/\.(ts|tsx)$/.test(file))
      throw new Error(`예상하지 못한 컴포넌트 파일: ${file}`);
    const sourcePath = `src/components/${file}`;
    const text = await readFile(path.join(projectRoot, sourcePath), "utf8");
    sources.set(sourcePath, text);
    details.set(sourcePath, sourceDetails(sourcePath, text));
  }
  for (const name of styleNames) {
    const file = `src/styles/${name}.css`;
    sources.set(
      file,
      componentCss(await readFile(path.join(projectRoot, file), "utf8")),
    );
  }
  for (const [file, text] of sources) files.set(`assets/${file}`, text);
  files.set(
    "references/design.md",
    (await readFile(path.join(projectRoot, "DESIGN.md"), "utf8")).replace(
      /src\//g,
      "assets/src/",
    ),
  );

  // Evaluate the existing catalog at build time; only serialize its plain metadata.
  const server = await createServer({
    root: projectRoot,
    configFile: false,
    appType: "custom",
    server: { middlewareMode: true, watch: null, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  let entries;
  try {
    ({ entries } = await server.ssrLoadModule("/src/catalog/index.ts"));
  } finally {
    await server.close();
  }
  const ids = new Set();
  const index = [];
  for (const entry of entries) {
    if (!/^[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id))
      throw new Error(`잘못되거나 중복된 컴포넌트 id: ${entry.id}`);
    ids.add(entry.id);
    const dependencies = dependenciesFor(entry.files, sources, details);
    const symbols = entry.files.flatMap(
      (file) => details.get(file)?.symbols ?? [],
    );
    const reference = `references/components/${entry.id}.md`;
    files.set(reference, componentReference(entry, dependencies, symbols));
    index.push({
      id: entry.id,
      name: entry.name,
      category: entry.category,
      summary: entry.summary,
      reference,
      files: entry.files.map((file) => `assets/${file}`),
    });
  }
  // Check the root barrel too, even when it isn't directly listed by an entry.
  const allDependencies = dependenciesFor(
    [...sources.keys()],
    sources,
    details,
  );
  files.set("references/components.json", json(index));
  const pkg = JSON.parse(
    await readFile(path.join(projectRoot, "package.json"), "utf8"),
  );
  const packageVersions = Object.fromEntries(
    allDependencies.packages.map((name) => {
      if (!pkg.dependencies[name])
        throw new Error(`원본 package.json에 없는 의존성: ${name}`);
      return [name, pkg.dependencies[name]];
    }),
  );
  const fileHashes = Object.fromEntries(
    [...files]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, text]) => [file, hash(text)]),
  );
  files.set(
    "manifest.json",
    json({
      generator: generatorId,
      name: skillName,
      version: pkg.version,
      contentHash: hash(
        json({ version: pkg.version, packageVersions, files: fileHashes }),
      ),
      componentCount: entries.length,
      packageVersions,
      files: fileHashes,
    }),
  );
  return files;
}

export async function writeSkill(files, outputDirectory, archivePath) {
  const previousFiles = await listFiles(outputDirectory).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  if (previousFiles.length) {
    const manifest = JSON.parse(
      await readFile(path.join(outputDirectory, "manifest.json"), "utf8"),
    );
    if (manifest.generator !== generatorId)
      throw new Error("다른 생성 도구의 스킬은 덮어쓸 수 없습니다.");
    for (const file of previousFiles) {
      if (file === "manifest.json") continue;
      if (
        !manifest.files[file] ||
        hash(await readFile(path.join(outputDirectory, file))) !==
          manifest.files[file]
      )
        throw new Error(
          `생성 후 수정된 파일을 보호했습니다: ${file}. skill-source 또는 원본을 수정하세요.`,
        );
    }
  }
  await mkdir(outputDirectory, { recursive: true });
  for (const file of previousFiles)
    if (!files.has(file)) await rm(path.join(outputDirectory, file));
  for (const [file, text] of files) {
    await mkdir(path.dirname(path.join(outputDirectory, file)), {
      recursive: true,
    });
    await writeFile(path.join(outputDirectory, file), text);
  }
  const archive = Object.fromEntries(
    [...files]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, text]) => [
        `${skillName}/${file}`,
        [Buffer.from(text), { mtime: new Date("2020-01-01T00:00:00Z") }],
      ]),
  );
  await mkdir(path.dirname(archivePath), { recursive: true });
  const bytes = zipSync(archive);
  await writeFile(archivePath, bytes);
  return {
    sizeBytes: [...files.values()].reduce(
      (sum, text) => sum + Buffer.byteLength(text),
      0,
    ),
    zipBytes: bytes.length,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const files = await createSkillFiles();
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--output")) {
    throw new Error("사용법: pnpm build:skill [--output <스킬 폴더>]");
  }
  const outputDirectory = args.length
    ? path.resolve(args[1])
    : path.join(projectRoot, "skills", skillName);
  const archivePath = path.join(projectRoot, "artifacts", `${skillName}.zip`);
  const sizes = await writeSkill(files, outputDirectory, archivePath);
  const manifest = JSON.parse(files.get("manifest.json"));
  console.log(
    `${manifest.componentCount}개 항목 · ${files.size}개 파일 · ${sizes.sizeBytes.toLocaleString()} bytes · ZIP ${sizes.zipBytes.toLocaleString()} bytes`,
  );
  console.log(path.relative(projectRoot, outputDirectory));
  console.log(path.relative(projectRoot, archivePath));
  console.log(`v${manifest.version} / ${manifest.contentHash}`);
}
