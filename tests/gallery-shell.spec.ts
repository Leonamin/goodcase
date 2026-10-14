import { test, expect } from "@playwright/test";

test("empty search can recover without losing the current component", async ({
  page,
}) => {
  await page.goto("/?component=text-field");
  const search = page.getByLabel("컴포넌트 검색");
  await search.fill("존재하지 않는 컴포넌트 123456789");
  await expect(page.getByText("검색 결과가 없어요.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "TextField", exact: true }),
  ).toBeVisible();
  await search.fill("Button");
  const button = page.locator(".gallery-sidebar").getByRole("link", {
    name: "Button / IconButton",
    exact: true,
  });
  await expect(button).toBeVisible();
  await button.click();
  await expect(
    page.getByRole("heading", { name: "Button / IconButton", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/component=button/);
});

test("browser history restores the component and document together", async ({
  page,
}) => {
  await page.goto("/?component=button&tab=preview");
  await page.getByRole("link", { name: "동작 계약", exact: true }).click();
  await page
    .locator(".gallery-sidebar")
    .getByRole("link", {
      name: "TextField",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("프로젝트 이름")).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Button / IconButton", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "기본 동작", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "동작 계약", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.goBack();
  await expect(page.locator(".preview-canvas")).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "기본 동작", exact: true }),
  ).toBeVisible();
});

test("appearance changes preserve input while reset clears only the demo", async ({
  page,
}) => {
  await page.goto("/?component=text-field");
  const field = page.getByLabel("프로젝트 이름");
  await field.fill("조작 중인 프로젝트 이름");
  await page.getByLabel("테마", { exact: true }).selectOption("forest");
  await page.getByLabel("색상 모드", { exact: true }).selectOption("dark");
  await page.getByLabel("밀도", { exact: true }).selectOption("compact");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "forest");
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
  await expect(field).toHaveValue("조작 중인 프로젝트 이름");
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await expect(field).toHaveValue("");
  await expect(page.getByLabel("테마", { exact: true })).toHaveValue("forest");
  await expect(page.getByLabel("색상 모드", { exact: true })).toHaveValue(
    "dark",
  );
  await expect(page.getByLabel("밀도", { exact: true })).toHaveValue("compact");
});

test("source copy writes the selected file and failed copy is recoverable", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/?component=image-viewer&tab=source");
  const file = page.getByLabel("소스 파일");
  await file.selectOption("src/styles/tokens.css");
  const source = await page.locator(".source-panel pre code").textContent();
  expect(source).toContain("--gc-");
  await page.getByRole("button", { name: "코드 복사", exact: true }).click();
  await expect(page.locator(".copy-status")).toContainText("복사했어요");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    source,
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: async () => {
        throw new Error("denied");
      },
    });
  });
  await page.getByRole("button", { name: "코드 복사", exact: true }).click();
  await expect(page.locator(".copy-status")).toContainText("복사 실패");
  await expect(page.locator(".source-panel pre code")).toHaveText(source!);
  await file.selectOption("src/components/basic/index.tsx");
  await expect(page.locator(".copy-status")).toBeEmpty();
});

test("mobile component list contains keyboard focus and selection closes it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/?component=button");
  await page.getByRole("button", { name: "목록 열기", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "컴포넌트 목록" });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      dialog.evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(true);
  const first = dialog
    .locator("a[href], button:not(:disabled), input:not(:disabled)")
    .first();
  const last = dialog
    .locator("a[href], button:not(:disabled), input:not(:disabled)")
    .last();
  await first.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await dialog.getByLabel("컴포넌트 검색").fill("TextField");
  await dialog.getByRole("link", { name: "TextField", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel("프로젝트 이름")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "목록 열기", exact: true }),
  ).toBeFocused();
});

test("320px document and source views keep horizontal scroll inside content", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  for (const tab of ["preview", "contract", "source", "migration"]) {
    await page.goto(`/?component=image-viewer&tab=${tab}`);
    await expect(
      page.getByRole("heading", { name: "ImageViewer", exact: true }),
    ).toBeVisible();
    const hasPageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(
      hasPageOverflow,
      `${tab} should not force horizontal page scrolling`,
    ).toBe(false);
  }
});
