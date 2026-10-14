import { test, expect } from "@playwright/test";
test.use({ hasTouch: true });
test("fullscreen dark viewer preserves image/control actions, pan, background close and focus", async ({
  page,
}) => {
  await page.goto("/?component=image-viewer");
  const trigger = page.getByRole("button", { name: "이미지 뷰어 열기" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "닫기", exact: true }),
  ).toBeFocused();
  const geometry = await dialog.evaluate((element) => ({
    rect: element.getBoundingClientRect().toJSON(),
    background: getComputedStyle(element).backgroundColor,
  }));
  expect(geometry.rect.x).toBe(0);
  expect(geometry.rect.y).toBe(0);
  expect(geometry.rect.width).toBe(1440);
  expect(geometry.rect.height).toBe(1000);
  expect(geometry.background).toBe("rgb(16, 17, 21)");
  const image = dialog.locator(".gc-viewer-image-current img");
  await expect(
    dialog.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  await image.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "확대", exact: true }).click();
  await image.click();
  await expect(dialog).toBeVisible();
  const bounds = await image.boundingBox();
  if (!bounds) throw new Error("image missing");
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 100,
    bounds.y + bounds.height / 2 + 50,
    { steps: 4 },
  );
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "초기화", exact: true }).click();
  await dialog.locator(".gc-viewer-thumbnail").nth(1).click();
  await expect(dialog.locator(".gc-viewer-caption")).toContainText("모래색");
  await expect(dialog.locator(".gc-viewer-thumbnail").nth(1)).toHaveAttribute(
    "aria-current",
    "true",
  );
  await dialog
    .locator(".gc-viewer-image-current")
    .click({ position: { x: 10, y: 10 } });
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test("button changes are immediate without timed slides and swipe smoothing respects reduced motion", async ({
  page,
}) => {
  await page.goto("/?component=image-viewer");
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "다음 →" }).click();
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect(dialog.locator(".gc-viewer-image-current")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(dialog.locator(".gc-viewer-image-outgoing")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByLabel("스와이프 놓기 보정").uncheck();
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
  await expect(dialog.locator(".gc-viewer")).toHaveAttribute(
    "data-animated",
    "false",
  );
  await page.keyboard.press("Escape");
  await page.getByLabel("스와이프 놓기 보정").check();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
  await expect(dialog.locator(".gc-viewer")).toHaveAttribute(
    "data-animated",
    "false",
  );
});
test("touch narrow viewer fills viewport, thumbnails stay usable and blank touch closes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/?component=image-viewer");
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".gc-viewer-image-current img")).toBeVisible();
  const rect = await dialog.boundingBox();
  expect(rect?.width).toBe(375);
  expect(rect?.height).toBe(812);
  await dialog.locator(".gc-viewer-thumbnail").nth(2).tap();
  await expect(dialog.locator(".gc-viewer-caption")).toContainText("파란색");
  await expect(dialog.getByRole("button", { name: "다음 →" })).toBeDisabled();
  await expect(dialog.locator(".gc-viewer-filmstrip")).toBeVisible();
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await dialog
    .locator(".gc-viewer-image-current")
    .tap({ position: { x: 3, y: 3 } });
  await expect(dialog).toHaveCount(0);
});
