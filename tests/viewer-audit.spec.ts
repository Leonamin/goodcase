import { test, expect } from "@playwright/test";

for (const width of [1440, 375]) {
  test(`fullscreen ${width}px preserves controls/image clicks, traps focus and closes only blank`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?component=image-viewer");
    const trigger = page.getByRole("button", { name: "이미지 뷰어 열기" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "이미지 보기" });
    await expect(
      dialog.getByRole("button", { name: "닫기", exact: true }),
    ).toBeFocused();
    const bounds = await dialog.boundingBox();
    expect(bounds).toEqual({ x: 0, y: 0, width, height: 900 });
    await expect(
      dialog.getByRole("button", { name: "확대", exact: true }),
    ).toBeEnabled();
    await dialog.locator(".gc-viewer-image-current img").click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "확대", exact: true }).click();
    await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("150%");
    await expect(dialog).toBeVisible();
    const image = await dialog
      .locator(".gc-viewer-image-current img")
      .boundingBox();
    if (!image) throw new Error("Image bounds missing");
    await page.mouse.move(
      image.x + image.width / 2,
      image.y + image.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      image.x + image.width / 2 + 50,
      image.y + image.height / 2 + 30,
      { steps: 8 },
    );
    await page.mouse.up();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "초기화", exact: true }).click();
    for (let count = 0; count < 15; count++) {
      await page.keyboard.press("Tab");
      await expect
        .poll(() =>
          dialog.evaluate((el) => el.contains(document.activeElement)),
        )
        .toBe(true);
    }
    await dialog
      .locator(".gc-viewer-image-current")
      .click({ position: { x: 8, y: 8 } });
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test("thumbnail and keyboard navigation reset view without time-driven transitions", async ({
  page,
}) => {
  await page.goto("/?component=image-viewer");
  const trigger = page.getByRole("button", { name: "이미지 뷰어 열기" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "이미지 보기" });
  await expect(
    dialog.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  await dialog.getByRole("button", { name: "확대", exact: true }).click();
  await dialog.locator(".gc-viewer-thumbnail").nth(2).click();
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("3 / 3");
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("100%");
  await expect(dialog.locator(".gc-viewer-thumbnail").nth(2)).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(dialog.locator(".gc-viewer-image-current")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(dialog.locator(".gc-viewer-image-current")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect(dialog.locator(".gc-viewer-image-outgoing")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("touch taps distinguish image from blank and reduced motion keeps immediate navigation", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 850 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5179/?component=image-viewer");
  const trigger = page.getByRole("button", { name: "이미지 뷰어 열기" });
  await trigger.tap();
  const dialog = page.getByRole("dialog", { name: "이미지 보기" });
  await expect(
    dialog.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  await dialog.locator(".gc-viewer-image-current img").tap();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "다음 →" }).tap();
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect(dialog.locator(".gc-viewer-image-current")).toHaveCSS(
    "animation-name",
    "none",
  );
  const rect = await dialog.locator(".gc-viewer-image-current").boundingBox();
  if (!rect) throw new Error("Layer missing");
  await page.touchscreen.tap(rect.x + 8, rect.y + 8);
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await context.close();
});

for (const width of [1440, 375]) {
  test(`navigation controls retain pressed geometry and preserve interactive click origin at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?component=image-viewer");
    await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
    const dialog = page.getByRole("dialog", { name: "이미지 보기" });
    for (const name of ["다음 →", "← 이전"]) {
      const button = dialog.getByRole("button", { name });
      const before = await button.boundingBox();
      if (!before) throw new Error("Nav button missing");
      await page.mouse.move(
        name === "다음 →" ? before.x + before.width / 2 : before.x + 1,
        name === "다음 →" ? before.y + 1 : before.y + before.height / 2,
      );
      await page.mouse.down();
      await page.waitForTimeout(180);
      const pressed = await button.boundingBox();
      if (!pressed) throw new Error("Pressed button disappeared");
      expect(
        Math.abs(
          pressed.y + pressed.height / 2 - (before.y + before.height / 2),
        ),
      ).toBeLessThan(1);
      await page.mouse.up();
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(".gc-viewer-counter")).toHaveText(
        name === "다음 →" ? "2 / 3" : "1 / 3",
      );
    }
    const button = dialog.getByRole("button", { name: "다음 →" });
    const rect = await button.boundingBox();
    const blank = await dialog
      .locator(".gc-viewer-image-current")
      .boundingBox();
    if (!rect || !blank) throw new Error("Viewer geometry missing");
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(blank.x + 8, blank.y + 8);
    await page.mouse.up();
    await expect(dialog).toBeVisible();
    await dialog
      .locator(".gc-viewer-image-current")
      .click({ position: { x: 8, y: 8 } });
    await expect(dialog).toHaveCount(0);
  });
}

test("regression calibration detects the original active-transform jump in injected CSS", async ({
  page,
}) => {
  await page.goto("/?component=image-viewer");
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
  await page.addStyleTag({
    content:
      ".gc-viewer-nav.gc-button { transform: translateY(-50%) !important; } .gc-viewer-nav.gc-button:active:not(:disabled) { transform: translateY(3px) !important; }",
  });
  const button = page.getByRole("button", { name: "다음 →" });
  const before = await button.boundingBox();
  if (!before) throw new Error("Nav missing");
  await page.mouse.move(before.x + before.width / 2, before.y + 2);
  await page.mouse.down();
  await page.waitForTimeout(180);
  const pressed = await button.boundingBox();
  if (!pressed) throw new Error("Nav missing");
  expect(Math.abs(pressed.y - before.y)).toBeGreaterThan(20);
  await page.mouse.up();
});

test("real mobile touch follows the finger, commits/cancels page gestures and reserves zoomed swipes for pan", async ({
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
  const send = async (
    type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel",
    x?: number,
    y?: number,
  ) => {
    await client.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: x === undefined ? [] : [{ x, y, id: 1 }],
    });
  };
  const center = async () => {
    const rect = await dialog
      .locator(".gc-viewer-image-current img")
      .boundingBox();
    if (!rect) throw new Error("Image missing");
    return { x: rect.x + rect.width * 0.8, y: rect.y + rect.height / 2 };
  };
  let point = await center();
  await send("touchStart", point.x, point.y);
  await send("touchMove", point.x - 50, point.y);
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("1 / 3");
  await expect
    .poll(() =>
      dialog
        .locator(".gc-viewer-swipe-track")
        .evaluate(
          (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).e,
        ),
    )
    .toBeLessThan(-40);
  await send("touchMove", point.x - 150, point.y);
  await send("touchEnd");
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect
    .poll(() =>
      dialog
        .locator(".gc-viewer-swipe-track")
        .evaluate((el) =>
          Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).e),
        ),
    )
    .toBeLessThan(1);
  point = await center();
  await send("touchStart", point.x, point.y);
  await send("touchMove", point.x - 20, point.y);
  await send("touchEnd");
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect
    .poll(() =>
      dialog
        .locator(".gc-viewer-swipe-track")
        .evaluate((el) =>
          Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).e),
        ),
    )
    .toBeLessThan(1);
  point = await center();
  await send("touchStart", point.x, point.y);
  await send("touchMove", point.x - 120, point.y);
  await send("touchCancel");
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect
    .poll(() =>
      dialog
        .locator(".gc-viewer-swipe-track")
        .evaluate((el) =>
          Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).e),
        ),
    )
    .toBeLessThan(1);
  await dialog.getByRole("button", { name: "확대", exact: true }).tap();
  await dialog.getByRole("button", { name: "확대", exact: true }).tap();
  await expect(dialog.locator(".gc-viewer-zoom")).toHaveText("200%");
  point = await center();
  await send("touchStart", Math.min(300, point.x), point.y);
  await send("touchMove", Math.min(300, point.x) - 100, point.y);
  await send("touchEnd");
  await expect(dialog.locator(".gc-viewer-counter")).toHaveText("2 / 3");
  await expect
    .poll(() =>
      dialog
        .locator(".gc-viewer-image-current img")
        .evaluate(
          (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).e,
        ),
    )
    .toBeLessThan(-1);
  await expect(dialog).toBeVisible();
  await context.close();
});
