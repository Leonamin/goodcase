import { test, expect, type Page, type CDPSession } from "@playwright/test";
test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });
async function touch(
  session: CDPSession,
  type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel",
  x = 0,
  y = 0,
) {
  await session.send("Input.dispatchTouchEvent", {
    type,
    touchPoints:
      type === "touchEnd" || type === "touchCancel"
        ? []
        : [{ x, y, id: 1, radiusX: 2, radiusY: 2, force: 1 }],
  });
}
async function setup(page: Page) {
  await page.goto("/?component=image-viewer");
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  const image = page.locator(".gc-viewer-image-current img");
  const bounds = await image.boundingBox();
  if (!bounds) throw new Error("missingimage");
  return {
    x: bounds.x + bounds.width * 0.65,
    y: bounds.y + bounds.height * 0.5,
    session: await page.context().newCDPSession(page),
  };
}
test("real touch follows finger with adjacent page and commits left/right without closing", async ({
  page,
}) => {
  const { x, y, session } = await setup(page);
  await touch(session, "touchStart", x, y);
  await touch(session, "touchMove", x - 60, y);
  await touch(session, "touchMove", x - 145, y);
  const offset = await page
    .locator(".gc-viewer-swipe-track")
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  expect(offset).toBeCloseTo(-145, 0);
  const adjacent = await page.locator(".gc-viewer-page-next").boundingBox();
  expect(adjacent!.x).toBeLessThan(375);
  expect(adjacent!.x).toBeGreaterThan(0);
  await touch(session, "touchEnd");
  await expect(page.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".gc-viewer-caption")).toContainText("모래색");
  await touch(session, "touchStart", 150, y);
  await touch(session, "touchMove", 215, y);
  await touch(session, "touchMove", 300, y);
  await touch(session, "touchEnd");
  await expect(page.locator(".gc-viewer-counter")).toHaveText("1 / 3");
});
test("short vertical and canceled touch gestures snap back without close or index changes", async ({
  page,
}) => {
  const { x, y, session } = await setup(page);
  for (const gesture of [
    { dx: -18, dy: 0, isCanceled: false },
    { dx: 3, dy: 110, isCanceled: false },
    { dx: -150, dy: 0, isCanceled: true },
  ]) {
    await touch(session, "touchStart", x, y);
    await touch(session, "touchMove", x + gesture.dx, y + gesture.dy);
    await touch(session, gesture.isCanceled ? "touchCancel" : "touchEnd");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(".gc-viewer-counter")).toHaveText("1 / 3");
    await expect
      .poll(() =>
        page
          .locator(".gc-viewer-swipe-track")
          .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41),
      )
      .toBeCloseTo(0, 0);
  }
});
test("zoomed touch pans exclusively and release smoothing can be disabled", async ({
  page,
}) => {
  const { x, y, session } = await setup(page);
  await page.getByRole("button", { name: "확대", exact: true }).click();
  await page.getByRole("button", { name: "확대", exact: true }).click();
  await touch(session, "touchStart", x, y);
  await touch(session, "touchMove", x - 140, y);
  await touch(session, "touchEnd");
  await expect(page.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  await expect(page.getByRole("dialog")).toBeVisible();
  const pan = await page
    .locator(".gc-viewer-image-current img")
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  expect(pan).toBeLessThan(0);
  await page.keyboard.press("Escape");
  await page.getByLabel("스와이프 놓기 보정").uncheck();
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("100%");
  await touch(session, "touchStart", x, y);
  await touch(session, "touchMove", x - 150, y);
  await touch(session, "touchEnd");
  await expect(page.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect(page.locator(".gc-viewer")).toHaveAttribute(
    "data-animated",
    "false",
  );
});
test("held navigation edge presses stay in place and control-origin release cannot close", async ({
  page,
}) => {
  await setup(page);
  for (let attempt = 0; attempt < 4; attempt++) {
    const nav = page.getByRole("button", {
      name: attempt % 2 ? "← 이전" : "다음 →",
    });
    const bounds = await nav.boundingBox();
    if (!bounds) throw new Error("missingnav");
    const x = bounds.x + 2,
      y = bounds.y + 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(180);
    const held = await nav.boundingBox();
    expect(held!.y).toBeCloseTo(bounds.y, 2);
    await page.mouse.up();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(".gc-viewer-counter")).toHaveText(
      attempt % 2 ? "1 / 3" : "2 / 3",
    );
  }
  const nav = page.getByRole("button", { name: "다음 →" });
  const bounds = await nav.boundingBox();
  await page.mouse.move(bounds!.x + 10, bounds!.y + 10);
  await page.mouse.down();
  await page.mouse.move(170, 100);
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .locator(".gc-viewer-image-current")
    .click({ position: { x: 2, y: 2 } });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("central blank space also swipes while stationary blank tap still closes", async ({
  page,
}) => {
  const { session } = await setup(page);
  await touch(session, "touchStart", 250, 120);
  await touch(session, "touchMove", 90, 120);
  expect(
    await page
      .locator(".gc-viewer-swipe-track")
      .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41),
  ).toBeCloseTo(-160, 0);
  await touch(session, "touchEnd");
  await expect(page.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .locator(".gc-viewer-image-current")
    .tap({ position: { x: 3, y: 3 } });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
