const styleOrder = [
  "tokens",
  "global",
  "basic",
  "overlays",
  "tabs",
  "toast",
  "composed",
];

/** Include the styles of the actual implementation graph, in cascade order. */
export function styleFilesFor(files: Iterable<string>): string[] {
  const names = new Set<string>();
  for (const file of files) {
    if (!file.startsWith("src/components/")) continue;
    names.add("tokens");
    names.add("global");
    const family = file.split("/")[2];
    if (family === "overlays" && /\/(tabs|toast)\.tsx$/.test(file)) {
      names.add(file.endsWith("/tabs.tsx") ? "tabs" : "toast");
    } else if (["basic", "overlays", "composed"].includes(family)) {
      names.add(family);
    }
  }
  return styleOrder
    .filter((name) => names.has(name))
    .map((name) => `src/styles/${name}.css`);
}
