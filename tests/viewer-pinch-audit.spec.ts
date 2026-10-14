import { test, expect, type Page, type CDPSession } from "@playwright/test";
type TouchPoint = { x: number; y: number; id: number };
async function send(
  client: CDPSession,
  type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel",
  touchPoints: TouchPoint[],
) {
  await client.send("Input.dispatchTouchEvent", { type, touchPoints });
}
async function view(page: Page) {
  return page.locator(".gc-viewer-image-current img").evaluate((el) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return { scale: matrix.a, x: matrix.e, y: matrix.f };
  });
}
async function track(page: Page) {
  return page
    .locator(".gc-viewer-swipe-track")
    .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).e);
}

// These tests dispatch actual Chromium touch events; they do not call component handlers.
test("pinch bounds 100–400% and preserves an off-center content focal point", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 850 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5179/?component=image-viewer");
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).tap();
  const dialog = page.getByRole("dialog", { name: "이미지 보기" });
  await expect(
    dialog.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  const client = await context.newCDPSession(page);
  const image = page.locator(".gc-viewer-image-current img");
  const original = await image.boundingBox();
  if (!original) throw new Error("Image geometry missing");
  const y = original.y + original.height / 2;
  await send(client, "touchStart", [
    { x: 165, y, id: 1 },
    { x: 205, y, id: 2 },
  ]);
  await send(client, "touchMove", [
    { x: 45, y, id: 1 },
    { x: 335, y, id: 2 },
  ]);
  await expect.poll(() => view(page)).toMatchObject({ scale: 4 });
  await send(client, "touchEnd", []);
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  await send(client, "touchStart", [
    { x: 90, y, id: 1 },
    { x: 290, y, id: 2 },
  ]);
  await send(client, "touchMove", [
    { x: 180, y, id: 1 },
    { x: 200, y, id: 2 },
  ]);
  await expect.poll(() => view(page)).toMatchObject({ scale: 1 });
  await send(client, "touchEnd", []);
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("100%");
  await dialog.getByRole("button", { name: "확대", exact: true }).tap();
  await dialog.getByRole("button", { name: "확대", exact: true }).tap();
  const before = await image.boundingBox();
  if (!before) throw new Error("Image missing");
  const centroid = 208;
  const normalized = (centroid - before.x) / before.width;
  await send(client, "touchStart", [
    { x: 158, y, id: 1 },
    { x: 258, y, id: 2 },
  ]);
  await send(client, "touchMove", [
    { x: 123, y, id: 1 },
    { x: 323, y, id: 2 },
  ]);
  await expect.poll(() => view(page)).toMatchObject({ scale: 4 });
  const after = await image.boundingBox();
  if (!after) throw new Error("Image missing");
  expect(Math.abs(after.x + normalized * after.width - 223)).toBeLessThan(3);
  await send(client, "touchEnd", []);
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  await context.close();
});

test("second finger cancels in-progress page swipe and handoff to one finger rebases pan without a jump", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 850 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5179/?component=image-viewer");
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).tap();
  const dialog = page.getByRole("dialog", { name: "이미지 보기" });
  await expect(
    dialog.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  const client = await context.newCDPSession(page);
  const rect = await page.locator(".gc-viewer-image-current img").boundingBox();
  if (!rect) throw new Error("Image missing");
  const y = rect.y + rect.height / 2;
  await send(client, "touchStart", [{ x: 250, y, id: 1 }]);
  await send(client, "touchMove", [{ x: 200, y, id: 1 }]);
  await expect.poll(() => track(page)).toBeLessThan(-40);
  await send(client, "touchStart", [
    { x: 200, y, id: 1 },
    { x: 100, y, id: 2 },
  ]);
  await expect.poll(() => track(page)).toBe(0);
  await send(client, "touchMove", [
    { x: 250, y, id: 1 },
    { x: 50, y, id: 2 },
  ]);
  await expect.poll(() => view(page)).toMatchObject({ scale: 2 });
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  const before = await view(page);
  await send(client, "touchEnd", [{ x: 50, y, id: 2 }]);
  const handoff = await view(page);
  expect(Math.abs(handoff.x - before.x)).toBeLessThan(2);
  expect(handoff.scale).toBe(before.scale);
  await send(client, "touchMove", [{ x: 220, y, id: 1 }]);
  await expect
    .poll(() => view(page).then((value) => value.x))
    .toBeLessThan(before.x - 20);
  await send(client, "touchEnd", []);
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "초기화", exact: true }).tap();
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("100%");
  await send(client, "touchStart", [{ x: 250, y, id: 1 }]);
  await send(client, "touchMove", [{ x: 80, y, id: 1 }]);
  await send(client, "touchEnd", []);
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect(dialog).toBeVisible();
  await context.close();
});

test("pinching back to 100% stays pan-only until all fingers end, then a fresh swipe works", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 850 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5179/?component=image-viewer");
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).tap();
  const dialog = page.getByRole("dialog", { name: "이미지 보기" });
  await expect(
    dialog.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  await dialog.getByRole("button", { name: "확대", exact: true }).tap();
  await dialog.getByRole("button", { name: "확대", exact: true }).tap();
  const client = await context.newCDPSession(page);
  const rect = await page.locator(".gc-viewer-image-current img").boundingBox();
  if (!rect) throw new Error("Image missing");
  const y = rect.y + rect.height / 2;
  await send(client, "touchStart", [
    { x: 90, y, id: 1 },
    { x: 290, y, id: 2 },
  ]);
  await send(client, "touchMove", [
    { x: 170, y, id: 1 },
    { x: 210, y, id: 2 },
  ]);
  await expect.poll(() => view(page)).toMatchObject({ scale: 1 });
  await send(client, "touchEnd", [{ x: 170, y, id: 1 }]);
  await send(client, "touchMove", [{ x: 45, y, id: 2 }]);
  await send(client, "touchEnd", []);
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  await expect(dialog).toBeVisible();
  await send(client, "touchStart", [{ x: 260, y, id: 1 }]);
  await send(client, "touchMove", [{ x: 75, y, id: 1 }]);
  await send(client, "touchEnd", []);
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  const layer = await page.locator(".gc-viewer-image-current").boundingBox();
  if (!layer) throw new Error("Frame missing");
  await page.touchscreen.tap(layer.x + 8, layer.y + 8);
  await expect(dialog).toHaveCount(0);
  await context.close();
});
