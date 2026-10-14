import { test, expect, type CDPSession, type Page } from "@playwright/test";
test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });
type Point = { x: number; y: number; id: number };
async function touch(
  session: CDPSession,
  type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel",
  points: Point[],
) {
  await session.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: points.map((point) => ({
      ...point,
      radiusX: 2,
      radiusY: 2,
      force: 1,
    })),
  });
}
async function setup(page: Page) {
  await page.goto("/?component=image-viewer");
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
  await expect(
    page.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  const rect = await page.locator(".gc-viewer-image-current img").boundingBox();
  if (!rect) throw new Error("missingimage");
  return {
    session: await page.context().newCDPSession(page),
    y: rect.y + rect.height / 2,
  };
}
async function view(page: Page) {
  return page.locator(".gc-viewer-image-current img").evaluate((image) => {
    const matrix = new DOMMatrix(getComputedStyle(image).transform);
    return { zoom: matrix.a, x: matrix.m41, y: matrix.m42 };
  });
}
test("two fingers zoom around focal point, clamp100~400%, and preserve modal/page", async ({
  page,
}) => {
  const { session, y } = await setup(page);
  await touch(session, "touchStart", [
    { x: 140, y, id: 1 },
    { x: 200, y, id: 2 },
  ]);
  await touch(session, "touchMove", [
    { x: 110, y, id: 1 },
    { x: 230, y, id: 2 },
  ]);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("200%");
  let actual = await view(page);
  expect(actual.zoom).toBeCloseTo(2, 2);
  expect(actual.x).toBeCloseTo(17.5, 1); // Focal point17.5px left of viewport center stays anchored.
  await touch(session, "touchMove", [
    { x: 30, y, id: 1 },
    { x: 340, y, id: 2 },
  ]);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("400%");
  await touch(session, "touchMove", [
    { x: 160, y, id: 1 },
    { x: 180, y, id: 2 },
  ]);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("100%");
  actual = await view(page);
  expect(actual.x).toBeCloseTo(0, 1);
  await touch(session, "touchEnd", []);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".gc-viewer-counter")).toHaveText("1 / 3");
});
test("pinch supersedes swipe, one-finger handoff is continuous and pan-only until all fingers lift", async ({
  page,
}) => {
  const { session, y } = await setup(page);
  await touch(session, "touchStart", [{ x: 250, y, id: 1 }]);
  await touch(session, "touchMove", [{ x: 190, y, id: 1 }]);
  expect(
    await page
      .locator(".gc-viewer-swipe-track")
      .evaluate(
        (element) => new DOMMatrix(getComputedStyle(element).transform).m41,
      ),
  ).toBeLessThan(0);
  await touch(session, "touchStart", [
    { x: 190, y, id: 1 },
    { x: 290, y, id: 2 },
  ]);
  expect(
    await page
      .locator(".gc-viewer-swipe-track")
      .evaluate(
        (element) => new DOMMatrix(getComputedStyle(element).transform).m41,
      ),
  ).toBe(0);
  await touch(session, "touchMove", [
    { x: 100, y, id: 1 },
    { x: 300, y, id: 2 },
  ]);
  await expect(page.locator(".gc-viewer-zoom")).toHaveText("200%");
  const before = await view(page);
  // CDP touchEnd lists lifted fingers; finger1 remains active.
  await touch(session, "touchEnd", [{ x: 300, y, id: 2 }]);
  const handoff = await view(page);
  expect(handoff.x).toBeCloseTo(before.x, 1);
  await touch(session, "touchMove", [{ x: 120, y, id: 1 }]);
  await expect
    .poll(() => view(page).then((actual) => actual.x))
    .toBeCloseTo(before.x + 20, 1);
  await touch(session, "touchEnd", []);
  await expect(page.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await touch(session, "touchStart", [
    { x: 140, y, id: 1 },
    { x: 240, y, id: 2 },
  ]);
  await touch(session, "touchMove", [
    { x: 180, y, id: 1 },
    { x: 200, y, id: 2 },
  ]);
  await touch(session, "touchEnd", [{ x: 200, y, id: 2 }]);
  await touch(session, "touchMove", [{ x: 20, y, id: 1 }]);
  await touch(session, "touchEnd", []);
  await expect(page.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  await touch(session, "touchStart", [{ x: 250, y, id: 1 }]);
  await touch(session, "touchMove", [{ x: 70, y, id: 1 }]);
  await touch(session, "touchEnd", []);
  await expect(page.locator(".gc-viewer-counter")).toHaveText("2 / 3");
});
test("stationary two-finger blank touch and canceled pinch never dismiss or commit page", async ({
  page,
}) => {
  const { session, y } = await setup(page);
  await touch(session, "touchStart", [
    { x: 120, y: 100, id: 1 },
    { x: 240, y: 100, id: 2 },
  ]);
  await touch(session, "touchEnd", [{ x: 120, y: 100, id: 1 }]);
  await touch(session, "touchEnd", []);
  await expect(page.getByRole("dialog")).toBeVisible();
  await touch(session, "touchStart", [
    { x: 140, y, id: 1 },
    { x: 220, y, id: 2 },
  ]);
  await touch(session, "touchMove", [
    { x: 100, y, id: 1 },
    { x: 260, y, id: 2 },
  ]);
  await touch(session, "touchCancel", []);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await page
    .locator(".gc-viewer-image-current")
    .tap({ position: { x: 3, y: 3 } });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
