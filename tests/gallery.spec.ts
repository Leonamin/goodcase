import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

const ids = [
  "design-tokens",
  "typography",
  "stack",
  "grid",
  "divider",
  "button",
  "link",
  "text-field",
  "text-area",
  "checkbox",
  "radio-group",
  "switch",
  "badge",
  "alert",
  "skeleton",
  "progress",
  "image",
  "avatar",
  "card",
  "table",
  "pagination",
  "select",
  "combobox",
  "menu",
  "popover",
  "tooltip",
  "dialog",
  "drawer",
  "tabs",
  "accordion",
  "toast",
  "form-field",
  "form-actions",
  "confirm-dialog",
  "search-filter-bar",
  "data-table",
  "file-uploader",
  "image-viewer",
  "image-gallery",
  "async-content",
  "copy-field",
];

test("all examples render without runtime errors on desktop and narrow mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of ids) {
      await page.goto(`/?component=${id}`);
      await expect(page.locator(".preview-canvas")).toBeVisible();
      await expect(page.locator(".preview-canvas")).not.toBeEmpty();
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(hasOverflow, `${id} at ${width}px overflows`).toBe(false);
    }
  }
  expect(errors).toEqual([]);
});

test("navigation, docs deep links, theme and review survive refresh", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("컴포넌트 검색").fill("ImageViewer");
  await page
    .locator(".gallery-sidebar")
    .getByRole("link", { name: "ImageViewer", exact: true })
    .click();
  await page.getByRole("link", { name: "동작 계약", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "기본 동작" })).toBeVisible();
  await page.getByRole("button", { name: "검토 표시" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "검토 완료" })).toBeVisible();
  await page.getByRole("link", { name: "미리보기", exact: true }).click();
  await page.getByLabel("테마", { exact: true }).selectOption("forest");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "forest");
});

test("invalid saved review JSON does not crash gallery", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("goodcase-reviewed", '{"unexpected":true}'),
  );
  await page.reload();
  await expect(page.locator(".preview-canvas")).toBeVisible();
});

test("mobile navigation hides closed links and manages focus and Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await expect(page.locator(".gallery-sidebar")).not.toBeVisible();
  const trigger = page.getByRole("button", { name: "목록 열기", exact: true });
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "컴포넌트 목록" }),
  ).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("inert", "");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.locator(".gallery-sidebar")).not.toBeVisible();
});

test("select cancellation and combobox Korean confirmation", async ({
  page,
}) => {
  await page.goto("/?component=select");
  const select = page.locator(".preview-canvas").getByRole("combobox").first();
  await select.click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(
    page.getByText("확정한 값: seoul", { exact: false }),
  ).toBeVisible();
  await expect(select).toBeFocused();
  await page.goto("/?component=combobox");
  const combo = page.getByRole("combobox", { name: "지역 검색" });
  await combo.fill("부산");
  await page.keyboard.press("Enter");
  await expect(combo).toHaveValue("부산");
  await combo.fill("없는 지역");
  await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(combo).toHaveValue("부산");
});

test("dialog traps focus and restores trigger; tabs require explicit activation", async ({
  page,
}) => {
  await page.goto("/?component=dialog");
  const trigger = page.getByRole("button", { name: "프로필 편집" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "프로필 편집" });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      dialog.evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(true);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        dialog.evaluate((element) => element.contains(document.activeElement)),
      )
      .toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.goto("/?component=tabs");
  await page.getByRole("tab", { name: "개요" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "활동 기록" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "개요" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Enter");
  await expect(page.getByRole("tab", { name: "활동 기록" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("form failure preserves input and allows retry", async ({ page }) => {
  await page.goto("/?component=form-actions");
  await page.getByLabel("요청 실패시키기").check();
  await page.getByLabel("프로젝트 이름").fill("입력을 유지하는 프로젝트");
  await page
    .locator(".preview-canvas")
    .getByRole("button", { name: "저장", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "저장 중…" })).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("저장하지 못했습니다");
  await expect(page.getByLabel("프로젝트 이름")).toHaveValue(
    "입력을 유지하는 프로젝트",
  );
  await page.getByLabel("요청 실패시키기").uncheck();
  await page
    .locator(".preview-canvas")
    .getByRole("button", { name: "저장", exact: true })
    .click();
  await expect(page.locator(".gc-demo-status")).toContainText("저장 완료");
});

test("confirmation starts at cancel, keeps failure open and closes after success", async ({
  page,
}) => {
  await page.goto("/?component=confirm-dialog");
  await page.getByLabel("요청 실패시키기").check();
  const trigger = page.getByRole("button", {
    name: "프로젝트 삭제",
    exact: true,
  });
  await trigger.click();
  await expect(
    page.getByRole("button", { name: "취소", exact: true }),
  ).toBeFocused();
  await page.locator(".gc-modal-overlay").click({ position: { x: 10, y: 10 } });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "삭제", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("실패");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.getByLabel("요청 실패시키기").uncheck();
  await trigger.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "삭제", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("filter drafts apply explicitly and clear", async ({ page }) => {
  await page.goto("/?component=search-filter-bar");
  await page.getByLabel("검색", { exact: true }).fill("서울");
  await expect(page.getByText("적용된 조건:", { exact: false })).toContainText(
    "검색어 없음",
  );
  await page.getByLabel("검색", { exact: true }).press("Enter");
  await expect(page.getByText("적용된 조건:", { exact: false })).toContainText(
    "서울",
  );
  await page
    .locator(".preview-canvas")
    .getByRole("button", { name: "초기화", exact: true })
    .click();
  await expect(page.getByLabel("검색", { exact: true })).toHaveValue("");
});

test("table selection clears across pagination and refresh failure keeps content", async ({
  page,
}) => {
  await page.goto("/?component=data-table");
  const canvas = page.locator(".preview-canvas");
  await page.getByLabel("현재 페이지 전체 선택").check();
  await expect(canvas.locator("caption")).toContainText("3개 선택");
  await canvas.getByRole("button", { name: "다음", exact: true }).click();
  await expect(canvas.locator("caption")).toContainText("0개 선택");
  await canvas.getByRole("button", { name: /이름/ }).click();
  await expect(canvas.locator(".gc-pagination")).toContainText("1 /");
  await page.getByLabel("요청 실패시키기").check();
  await canvas.getByRole("button", { name: "새로고침", exact: true }).click();
  await expect(canvas.getByRole("table")).toBeVisible();
  await expect(canvas.getByRole("alert")).toContainText("기존 내용을 유지");
  await page.getByLabel("요청 실패시키기").uncheck();
  await canvas.getByRole("button", { name: "다시 시도", exact: true }).click();
  await expect(canvas.getByRole("alert")).not.toBeVisible();
});

test("file selection is separate from upload, validates and retries", async ({
  page,
}) => {
  await page.goto("/?component=file-uploader");
  const file = page.locator("input[type=file]");
  await file.setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello"),
  });
  await expect(page.getByRole("alert")).toContainText("형식");
  await file.setInputFiles({
    name: "image.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
  });
  await expect(page.getByText("선택됨 · 아직 업로드하지 않음")).toBeVisible();
  await page.getByLabel("요청 실패시키기").check();
  await page.getByRole("button", { name: "선택한 파일 업로드" }).click();
  await expect(
    page.getByText("로컬 업로드 실패", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("요청 실패시키기").uncheck();
  await page.getByRole("button", { name: "재시도", exact: true }).click();
  await expect(page.getByText("업로드 완료")).toBeVisible();
  await page.getByRole("button", { name: "제거", exact: true }).click();
  await expect(page.getByText("image.svg", { exact: true })).not.toBeVisible();
});

test("viewer zoom, keyboard pan, image reset, boundaries and focus restore", async ({
  page,
}) => {
  await page.goto("/?component=image-viewer");
  const trigger = page.getByRole("button", { name: "이미지 뷰어 열기" });
  await trigger.click();
  await expect(
    page.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "확대", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("150%");
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog")).toContainText("2 / 3");
  await expect(page.getByRole("dialog")).toContainText("100%");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: /다음/ })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.getByLabel("이미지 로딩 실패 예제").check();
  await trigger.click();
  await expect(page.getByRole("alert")).toContainText(
    "이미지를 불러오지 못했습니다",
  );
});

test("gallery opens selected thumbnail and restores its focus", async ({
  page,
}) => {
  await page.goto("/?component=image-gallery");
  const thumbnail = page.locator(".gc-gallery-item").nth(1);
  await thumbnail.click();
  await expect(page.getByRole("dialog")).toContainText("2 / 3");
  await page.keyboard.press("Escape");
  await expect(thumbnail).toBeFocused();
});

test("clipboard succeeds only after real write and exposes failure", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/?component=copy-field");
  await page.getByRole("button", { name: "복사", exact: true }).click();
  await expect(page.getByText("복사했습니다.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "goodcase-project-2026-한국어-전체원본값",
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      value: async () => {
        throw new Error("denied");
      },
    });
  });
  await page.getByRole("button", { name: "복사", exact: true }).click();
  await expect(
    page.getByText("복사하지 못했습니다.", { exact: false }),
  ).toBeVisible();
});

test("source download includes transitive modules, styles and migration contract", async ({
  page,
}) => {
  await page.goto("/?component=image-viewer&tab=migration");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "소스 ZIP", exact: true }).click(),
  ]);
  const path = await download.path();
  expect(path).not.toBeNull();
  const archive = unzipSync(await readFile(path!));
  for (const file of [
    "src/components/composed/index.tsx",
    "src/components/overlays/index.tsx",
    "src/components/basic/index.tsx",
    "src/styles/tokens.css",
    "MIGRATION.md",
  ])
    expect(archive[file]).toBeDefined();
  expect(strFromU8(archive["MIGRATION.md"])).toContain("ImageViewer");
  await page.getByRole("link", { name: "코드", exact: true }).click();
  await expect(page.locator(".source-panel pre")).toContainText(
    "export function",
  );
});
