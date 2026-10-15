import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import ts from "typescript";

test("DataTable requires complete adapters for a custom data model at compile time", () => {
  const configPath = resolve("tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    resolve("."),
  );
  const program = ts.createProgram(
    [resolve("tests/fixtures/data-table-contract.types.tsx")],
    { ...parsed.options, noEmit: true },
  );
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    );
  expect(diagnostics).toEqual([]);
});

test("page size changes reset the current page and its selection", async ({
  page,
}) => {
  await page.goto("/tests/fixtures/data-table-contract.html");
  const tableSection = page.getByRole("region", {
    name: "기본 모델",
    exact: true,
  });
  await tableSection.getByRole("button", { name: "다음", exact: true }).click();
  await tableSection
    .getByRole("checkbox", { name: "3 행 선택", exact: true })
    .check();
  await expect(tableSection.locator("caption")).toHaveText(
    "기본 표 · 현재 페이지에서 1개 선택",
  );
  await expect(tableSection.getByRole("navigation")).toContainText("2 / 3");
  await tableSection.getByRole("button", { name: "4개씩 보기" }).click();
  await expect(tableSection.getByRole("navigation")).toContainText("1 / 2");
  await expect(tableSection.locator("caption")).toHaveText(
    "기본 표 · 현재 페이지에서 0개 선택",
  );
  await expect(
    tableSection.getByRole("checkbox", { checked: true }),
  ).toHaveCount(0);
  await expect(tableSection.locator("tbody tr")).toHaveCount(4);
});

test("custom data models render and select rows by their adapter identifiers", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/data-table-contract.html");
  const tableSection = page.getByRole("region", {
    name: "사용자 모델",
    exact: true,
  });
  await expect(
    tableSection.getByRole("cell", { name: "A", exact: true }),
  ).toBeVisible();
  await tableSection
    .getByRole("checkbox", { name: "a 행 선택", exact: true })
    .check();
  await expect(
    tableSection.getByRole("checkbox", { name: "b 행 선택", exact: true }),
  ).not.toBeChecked();
  await expect(
    tableSection.getByRole("checkbox", { name: "현재 페이지 전체 선택" }),
  ).toHaveJSProperty("indeterminate", true);
  await tableSection
    .getByRole("checkbox", { name: "현재 페이지 전체 선택" })
    .check();
  await expect(
    tableSection.getByRole("checkbox", { checked: true }),
  ).toHaveCount(3);
  expect(errors).toEqual([]);
});
