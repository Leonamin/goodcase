import { zipSync, strToU8 } from "fflate";
import type { CatalogEntry } from "./types";

const rawFiles = import.meta.glob<string>(
  ["../components/**/*.{tsx,ts}", "../styles/*.css"],
  { query: "?raw", import: "default", eager: true },
);
export const sourceFiles: Record<string, string> = Object.fromEntries(
  Object.entries(rawFiles).map(([path, text]) => [
    path.replace("../", "src/"),
    text,
  ]),
);

function resolveFile(from: string, relative: string): string | undefined {
  const parts = from.split("/").slice(0, -1);
  for (const part of relative.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  const base = parts.join("/");
  return [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    `${base}/index.tsx`,
    `${base}/index.ts`,
  ].find((path) => path in sourceFiles);
}

export function filesFor(entry: CatalogEntry): string[] {
  const files = new Set<string>();
  const visit = (path: string) => {
    if (files.has(path) || !(path in sourceFiles)) return;
    files.add(path);
    for (const match of sourceFiles[path].matchAll(
      /(?:from\s*|import\s*)['"]([^'"]+)['"]/g,
    )) {
      if (match[1].startsWith(".")) {
        const dependency = resolveFile(path, match[1]);
        if (dependency) visit(dependency);
      }
    }
  };
  entry.files.forEach(visit);
  // Styles are shared by families; carry all reference styles to preserve imported primitives.
  Object.keys(sourceFiles)
    .filter(
      (path) =>
        path.startsWith("src/styles/") && !path.endsWith("/gallery.css"),
    )
    .forEach(visit);
  return [...files];
}

export function packagesFor(entry: CatalogEntry): string[] {
  const packages = new Set<string>();
  for (const file of filesFor(entry)) {
    if (!/\.tsx?$/.test(file)) continue;
    for (const match of sourceFiles[file].matchAll(
      /(?:from\s*|import\s*)['"]([^'"]+)['"]/g,
    )) {
      const name = match[1];
      if (!name.startsWith("."))
        packages.add(
          name.startsWith("@")
            ? name.split("/").slice(0, 2).join("/")
            : name.split("/")[0],
        );
    }
  }
  return [...packages].sort();
}

export function downloadSource(entry: CatalogEntry) {
  const files = filesFor(entry);
  const archive: Record<string, Uint8Array> = Object.fromEntries(
    files.map((path) => [path, strToU8(sourceFiles[path])]),
  );
  const packages = packagesFor(entry);
  archive["MIGRATION.md"] = strToU8(
    `# ${entry.name}\n\n이식용 참조 구현. 같은 파일 안의 다른 export도 함께 포함될 수 있습니다.\n\n## 의존성\n${packages.length ? `React 19+ / TypeScript 프로젝트 기준. 포함 코드의 외부 import: ${packages.join(", ")}. 기존 프로젝트의 설치 버전을 먼저 확인하세요.\n\n추가 설치 예시: pnpm add ${packages.filter((name) => name !== "react").join(" ")}` : "CSS custom properties. 별도 JavaScript 패키지 없음."}\n\n## 스타일\n토큰 → global → basic → overlays → tabs → toast → composed 순서로 CSS를 불러오세요. global.css의 문서 기본 스타일은 프로젝트 전역 스타일과 비교하여 필요한 부분만 병합하세요.\n\n## 동작 계약\n${entry.contracts.map((x) => `- ${x}`).join("\n")}\n\n## 이식 절차\n${entry.migration.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\n## 사용 예제\n\`\`\`tsx\n${entry.usage}\n\`\`\`\n예제의 데이터와 callback 변수는 호출 프로젝트에서 제공합니다. 컴포넌트 export는 포함된 src/components 모듈에서 import합니다.\n\n## 확인\n키보드, 포커스 복귀, 오류/빈 상태, 모바일, 긴 텍스트를 확인하세요. 갤러리의 비동기 데모는 로컬 시뮬레이션이며 실제 서비스는 callback/adapter로 연결해야 합니다.\n`,
  );
  const bytes = zipSync(archive);
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: "application/zip" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `goodcase-${entry.id}.zip`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
