import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { unzipSync } from "fflate";
import postcss from "postcss";
import { componentCss, createSkillFiles, writeSkill } from "./build-skill.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const run = promisify(execFile);

test("demo selectors are removed without dropping shared product rules or media queries", () => {
  const css = componentCss(
    ".gc-composed-demo > *, .gc-dropzone { min-width: 0; } @media (max-width: 600px) { .gc-tabs-demo { display: grid; } .gc-tabs { overflow: auto; } } .gc-toast-preview { animation: none; }",
  );
  const rules = [];
  postcss.parse(css).walkRules((rule) => rules.push(rule.selector));
  assert.deepEqual(rules, [".gc-dropzone", ".gc-tabs", ".gc-toast-preview"]);
  assert.match(css, /@media/);
});

test("generated skill is portable, complete, reproducible, and protects manual edits", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "goodcase-skill-"));
  try {
    const files = await createSkillFiles();
    const again = await createSkillFiles();
    assert.deepEqual([...files], [...again]);
    const manifest = JSON.parse(files.get("manifest.json"));
    const index = JSON.parse(files.get("references/components.json"));
    assert.equal(index.length, manifest.componentCount);
    assert.ok(index.some((entry) => entry.id === "tabs"));
    assert.ok(index.some((entry) => entry.id === "toast"));
    assert.ok(index.some((entry) => entry.id === "image-viewer"));
    assert.deepEqual(Object.keys(manifest.packageVersions), [
      "lucide-react",
      "radix-ui",
      "react",
      "react-dom",
    ]);
    for (const entry of index) {
      assert.ok(files.has(entry.reference), entry.reference);
      for (const file of entry.files) assert.ok(files.has(file), file);
    }
    for (const [file, content] of files) {
      assert.doesNotMatch(
        file,
        /(?:catalog|gallery\.css|App\.tsx|node_modules|\.storybook|test-results)/,
      );
      assert.ok(!content.includes(projectRoot), `원본 절대 경로: ${file}`);
      if (file.endsWith(".css"))
        postcss
          .parse(content)
          .walkRules((rule) =>
            assert.doesNotMatch(
              rule.selector,
              /\.gc-[\w-]*demo[\w-]*\b|\.gc-toast-specimens\b/,
            ),
          );
      if (file.startsWith("assets/src/components/"))
        assert.doesNotMatch(content, /from ["'][^"']*(?:catalog|App|Gallery)/);
    }
    assert.match(files.get("references/components/tabs.md"), /Enter.*Space/);
    assert.match(files.get("references/components/toast.md"), /FIFO/);
    const fieldReference = files.get("references/components/form-field.md");
    assert.match(
      fieldReference,
      /assets\/src\/components\/composed\/form-field\.tsx/,
    );
    assert.doesNotMatch(
      fieldReference,
      /radix-ui|lucide-react|overlays\/|basic\.css|toast\.css/,
    );
    const spinnerReference = files.get("references/components/spinner.md");
    assert.match(spinnerReference, /react, react-dom/);
    assert.doesNotMatch(
      spinnerReference,
      /lucide-react|radix-ui|composed\.css|toast\.css/,
    );

    const output = path.join(temporary, "generated");
    const archive = path.join(temporary, "skill.zip");
    await writeSkill(files, output, archive);
    const firstZip = await readFile(archive);
    await writeSkill(again, output, archive);
    assert.deepEqual(await readFile(archive), firstZip);
    const extracted = unzipSync(firstZip);
    assert.equal(Object.keys(extracted).length, files.size);
    for (const [file, content] of files)
      assert.equal(
        Buffer.from(extracted[`use-goodcase-ui/${file}`]).toString("utf8"),
        content,
      );

    // Build only relocated bundle assets with declared external dependencies.
    const consumer = path.join(temporary, "consumer");
    await cp(path.join(output, "assets/src"), path.join(consumer, "src"), {
      recursive: true,
    });
    await symlink(
      path.join(projectRoot, "node_modules"),
      path.join(consumer, "node_modules"),
      "dir",
    );
    await writeFile(
      path.join(consumer, "package.json"),
      JSON.stringify({ type: "module" }),
    );
    await writeFile(
      path.join(consumer, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: ["src"],
      }),
    );
    await run(
      process.execPath,
      [
        path.join(projectRoot, "node_modules/typescript/bin/tsc"),
        "-p",
        path.join(consumer, "tsconfig.json"),
      ],
      { cwd: consumer },
    );
    await run(
      process.execPath,
      [
        path.join(projectRoot, "node_modules/vite/bin/vite.js"),
        "build",
        "--ssr",
        "src/components/index.ts",
        "--outDir",
        "build",
      ],
      { cwd: consumer },
    );

    await writeFile(path.join(output, "SKILL.md"), "manual edit");
    await assert.rejects(
      writeSkill(files, output, archive),
      /생성 후 수정된 파일/,
    );
    assert.equal(
      await readFile(path.join(output, "SKILL.md"), "utf8"),
      "manual edit",
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
