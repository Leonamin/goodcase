import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

function violations(file, source) {
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const findings = [];
  const isGallery =
    file === "src/App.tsx" ||
    file.startsWith("src/catalog/") ||
    file.startsWith("src/gallery/");
  const isComposed = file.startsWith("src/components/composed/");
  if (!isGallery && !isComposed) return findings;
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      const attrs = node.attributes.properties.filter(ts.isJsxAttribute);
      const literal = (name) =>
        attrs
          .find((attr) => attr.name.getText(ast) === name)
          ?.initializer?.getText(ast);
      const isSidebarBackdrop =
        file === "src/App.tsx" &&
        tag === "button" &&
        literal("data-interaction-exception") === '"sidebar-backdrop"';
      const isHiddenFileInput =
        file === "src/components/composed/file-uploader.tsx" &&
        tag === "input" &&
        literal("type") === '"file"' &&
        attrs.some(
          (attr) => attr.name.getText(ast) === "hidden" && !attr.initializer,
        );
      const hasRawControl =
        ["button", "a", "input", "textarea", "select"].includes(tag) &&
        !isSidebarBackdrop &&
        !isHiddenFileInput;
      const hasNonSemanticAction =
        isGallery &&
        /^[a-z]/.test(tag) &&
        !["button", "a", "input", "select", "textarea"].includes(tag) &&
        attrs.some((attr) =>
          ["onClick", "onPointerDown", "onMouseDown"].includes(
            attr.name.getText(ast),
          ),
        );
      if (hasRawControl || hasNonSemanticAction)
        findings.push(
          `${file}:${ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1} <${tag}>`,
        );
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return findings;
}

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (/\.tsx?$/.test(path)) files.push(path);
  }
  return files;
}

test("gallery and composed controls use shared primitives with two explicit implementation exceptions", async () => {
  const findings = [];
  for (const file of await sourceFiles("src"))
    findings.push(...violations(file, await readFile(file, "utf8")));
  assert.deepEqual(findings, []);
});

test("policy rejects native controls and clickable containers, and keeps exceptions narrow", () => {
  assert.equal(
    violations(
      "src/catalog/example.tsx",
      "<><select/><input/><button/><textarea/><a/><div onClick={run}/></>",
    ).length,
    6,
  );
  assert.equal(
    violations(
      "src/App.tsx",
      '<button data-interaction-exception="sidebar-backdrop"/>',
    ).length,
    0,
  );
  assert.equal(
    violations(
      "src/catalog/example.tsx",
      '<button data-interaction-exception="sidebar-backdrop"/>',
    ).length,
    1,
  );
  assert.equal(
    violations(
      "src/components/composed/file-uploader.tsx",
      '<input type="file" hidden/>',
    ).length,
    0,
  );
  assert.equal(
    violations(
      "src/components/composed/file-uploader.tsx",
      '<input type="file"/>',
    ).length,
    1,
  );
  assert.equal(
    violations(
      "src/components/composed/form-field.tsx",
      '<input type="file" hidden/>',
    ).length,
    1,
  );
});

test("component implementations import direct modules rather than family barrels", async () => {
  const files = await sourceFiles("src/components");
  const findings = [];
  for (const file of files) {
    if (/\/index\.tsx?$/.test(file)) continue;
    const source = await readFile(file, "utf8");
    for (const { fileName } of ts.preProcessFile(source, true, true)
      .importedFiles) {
      if (/^(?:\.\.\/)+(?:basic|overlays|composed)(?:\/index)?$/.test(fileName))
        findings.push(`${file}: ${fileName}`);
    }
  }
  assert.deepEqual(findings, []);
});
