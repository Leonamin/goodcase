import { test, expect, type Page, type CDPSession } from "@playwright/test";
test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });
async function touch(
  session: CDPSession,
  type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel",
  points: { x: number; y: number; id: number }[],
) {
  await session.send("Input.dispatchTouchEvent", { type, touchPoints: points });
}
async function tap(session: CDPSession, x: number, y: number) {
  await touch(session, "touchStart", [{ x, y, id: 1 }]);
  await touch(session, "touchEnd", []);
}
async function setup(page: Page) {
  await page.goto("/?component=image-viewer");
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
  await expect(
    page.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  const rect = await page.locator(".gc-viewer-image-current img").boundingBox();
  if (!rect) throw new Error("image missing");
  return {
    session: await page.context().newCDPSession(page),
    rect,
    x: 245,
    y: rect.y + rect.height / 2,
  };
}
test("real image doubletap anchors200% then zoomed doubletap returns100% centered", async ({
  page,
}) => {
  const { session, rect, x, y } = await setup(page);
  const normalized = (x - rect.x) / rect.width;
  await tap(session, x, y);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("100%");
  await tap(session, x, y);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("200%");
  const expanded = await page
    .locator(".gc-viewer-image-current img")
    .boundingBox();
  expect(expanded!.x + normalized * expanded!.width).toBeCloseTo(x, 1);
  await expect(page.getByRole("dialog")).toBeVisible();
  await tap(session, x, y);
  await tap(session, x, y);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("100%");
  const matrix = await page
    .locator(".gc-viewer-image-current img")
    .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform));
  expect(matrix.m41).toBe(0);
  expect(matrix.m42).toBe(0);
  await expect(page.locator(".gc-viewer-counter")).toHaveText("1 / 3");
});
test("single or distant image taps do not zoom and control input clears tap history", async ({
  page,
}) => {
  const { session, x, y } = await setup(page);
  await tap(session, x, y);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("100%");
  await tap(session, x - 100, y);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("100%");
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await tap(session, x - 100, y);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("100%");
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("swipe drag pinch and canceled touch cannot be counted as taps", async ({
  page,
}) => {
  const { session, x, y } = await setup(page);
  await tap(session, x, y);
  await touch(session, "touchStart", [{ x, y, id: 1 }]);
  await touch(session, "touchMove", [{ x: x - 18, y, id: 1 }]);
  await touch(session, "touchEnd", []);
  await expect
    .poll(() =>
      page
        .locator(".gc-viewer-swipe-track")
        .evaluate(
          (element) => new DOMMatrix(getComputedStyle(element).transform).m41,
        ),
    )
    .toBeCloseTo(0, 1);
  await tap(session, x, y);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("100%");
  await touch(session, "touchStart", [
    { x: 140, y, id: 1 },
    { x: 240, y, id: 2 },
  ]);
  await touch(session, "touchEnd", []);
  await tap(session, x, y);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("100%");
  await touch(session, "touchStart", [{ x, y, id: 1 }]);
  await touch(session, "touchCancel", []);
  await tap(session, x, y);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("100%");
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("image change clears tap history and stationary blank tap still closes", async ({
  page,
}) => {
  const { session, x, y } = await setup(page);
  await tap(session, x, y);
  await page.getByRole("button", { name: "다음 →" }).click();
  await expect(
    page.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  await tap(session, x, y);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("100%");
  await page
    .locator(".gc-viewer-image-current")
    .tap({ position: { x: 3, y: 3 } });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
