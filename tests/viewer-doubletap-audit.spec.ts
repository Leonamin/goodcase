import { test, expect, type CDPSession } from "@playwright/test";
async function touch(
  client: CDPSession,
  type: "touchStart" | "touchMove" | "touchEnd",
  points: { x: number; y: number; id: number }[],
) {
  await client.send("Input.dispatchTouchEvent", { type, touchPoints: points });
}
async function tap(client: CDPSession, x: number, y: number) {
  await touch(client, "touchStart", [{ x, y, id: 1 }]);
  await touch(client, "touchEnd", []);
}

test("two stationary image taps anchor 200%, a later single stays zoomed, paired second resets100%, blank single closes", async ({
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
  const image = dialog.locator(".gc-viewer-image-current img");
  const before = await image.boundingBox();
  if (!before) throw new Error("Image missing");
  const x = before.x + before.width / 2 + 25;
  const y = before.y + before.height / 2;
  const normalized = (x - before.x) / before.width;
  await tap(client, x, y);
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("100%");
  await tap(client, x, y);
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("200%");
  const after = await image.boundingBox();
  if (!after) throw new Error("Image missing");
  expect(Math.abs(after.x + normalized * after.width - x)).toBeLessThan(3);
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  await tap(client, x, y);
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("200%");
  await tap(client, x, y);
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("100%");
  await expect(dialog).toBeVisible();
  const blank = await dialog.locator(".gc-viewer-image-current").boundingBox();
  if (!blank) throw new Error("Frame missing");
  await page.touchscreen.tap(blank.x + 8, blank.y + 8);
  await expect(dialog).toHaveCount(0);
  await context.close();
});

test("drag and two-finger interaction clear pending tap history and do not double-tap zoom", async ({
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
  const rect = await dialog
    .locator(".gc-viewer-image-current img")
    .boundingBox();
  if (!rect) throw new Error("Image missing");
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  await tap(client, x, y);
  await touch(client, "touchStart", [{ x, y, id: 1 }]);
  await touch(client, "touchMove", [{ x: x - 20, y, id: 1 }]);
  await touch(client, "touchEnd", []);
  await expect
    .poll(() =>
      dialog
        .locator(".gc-viewer-swipe-track")
        .evaluate((el) =>
          Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).e),
        ),
    )
    .toBeLessThan(1);
  await tap(client, x, y);
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("100%");
  await touch(client, "touchStart", [
    { x, y, id: 1 },
    { x: x + 30, y, id: 2 },
  ]);
  await touch(client, "touchEnd", []);
  await tap(client, x, y);
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("100%");
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  await expect(dialog).toBeVisible();
  await context.close();
});

test("image change clears the prior tap while the new image still accepts its own tap pair", async ({
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
  const rect = await dialog
    .locator(".gc-viewer-image-current img")
    .boundingBox();
  if (!rect) throw new Error("Image missing");
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  await tap(client, x, y);
  await page.keyboard.press("ArrowRight");
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect(
    dialog.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  await tap(client, x, y);
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("100%");
  await tap(client, x, y);
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("200%");
  await context.close();
});
