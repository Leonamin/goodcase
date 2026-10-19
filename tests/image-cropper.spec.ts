import { test, expect, type Page } from "@playwright/test";

const sample = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="red"/><rect x="200" width="200" height="200" fill="blue"/></svg>',
);
async function load(page: Page) {
  await page.goto("/?component=image-cropper");
  await page.getByLabel("사진 선택", { exact: true }).setInputFiles({
    name: "sample.svg",
    mimeType: "image/svg+xml",
    buffer: sample,
  });
  await expect(
    page.getByRole("button", { name: "PNG로 크롭", exact: true }),
  ).toBeEnabled();
}
async function exportPixels(page: Page) {
  const priorImage = page.getByAltText("크롭 결과", { exact: true });
  const previous = (await priorImage.count())
    ? await priorImage.getAttribute("src")
    : null;
  await page.getByRole("button", { name: "PNG로 크롭", exact: true }).click();
  const result = page.getByAltText("크롭 결과", { exact: true });
  await expect(result).toBeVisible();
  await expect.poll(() => result.getAttribute("src")).not.toBe(previous);
  await expect
    .poll(() => result.evaluate((node) => (node as HTMLImageElement).complete))
    .toBe(true);
  return result.evaluate((node) => {
    const image = node as HTMLImageElement,
      canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const pixel = (x: number, y: number) =>
      Array.from(ctx.getImageData(x, y, 1, 1).data);
    return {
      width: canvas.width,
      height: canvas.height,
      corner: pixel(0, 0),
      center: pixel(canvas.width / 2, canvas.height / 2),
      topRight: pixel(canvas.width * 0.75, canvas.height * 0.25),
      bottomLeft: pixel(canvas.width * 0.25, canvas.height * 0.75),
    };
  });
}
test("exports actual PNG with circle and rounded alpha masks", async ({
  page,
}) => {
  await load(page);
  const rectangle = await exportPixels(page);
  expect(rectangle.width).toBe(1024);
  expect(rectangle.height).toBe(1024);
  expect(rectangle.corner[3]).toBe(255);
  expect(rectangle.topRight.slice(0, 3)).toEqual([0, 0, 255]);
  for (const name of ["원형", "라운드"]) {
    await page.getByRole("button", { name, exact: true }).click();
    const result = await exportPixels(page);
    expect(result.corner[3]).toBe(0);
    expect(result.center[3]).toBe(255);
  }
});
test("outside-image area and original transparency survive export", async ({
  page,
}) => {
  await load(page);
  const stage = page.getByRole("group", {
    name: "크롭 편집 영역",
    exact: true,
  });
  await stage.focus();
  await page.keyboard.down("Shift");
  for (let i = 0; i < 24; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.up("Shift");
  const moved = await exportPixels(page);
  expect(moved.corner[3]).toBe(0);
  expect(moved.center[3]).toBe(0);
  expect(moved.topRight[3]).toBe(255);
  const transparent = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect x="100" y="100" width="200" height="200" fill="red" fill-opacity="0.5"/></svg>',
  );
  await page.getByLabel("사진 선택", { exact: true }).setInputFiles({
    name: "alpha.svg",
    mimeType: "image/svg+xml",
    buffer: transparent,
  });
  const result = await exportPixels(page);
  expect(result.corner[3]).toBe(0);
  expect(result.center[3]).toBe(128);
});
test("rotation changes pixels, zoom changes coverage, failure retains controls for retry", async ({
  page,
}) => {
  await load(page);
  const rotation = page.getByRole("slider", { name: "회전", exact: true });
  await rotation.fill("180");
  const rotated = await exportPixels(page);
  expect(rotated.bottomLeft.slice(0, 3)).toEqual([0, 0, 255]);
  await page
    .getByRole("slider", { name: "확대·축소", exact: true })
    .fill("0.1");
  const zoomed = await exportPixels(page);
  expect(zoomed.corner[3]).toBe(0);
  expect(zoomed.topRight[3]).toBe(0);
  await page.getByRole("button", { name: /저장 실패 테스트/ }).click();
  await page.getByRole("button", { name: "PNG로 크롭", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("저장하지 못했습니다");
  await expect(rotation).toHaveValue("180");
  await page.getByRole("button", { name: /저장 실패 테스트/ }).click();
  await exportPixels(page);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
test("mask drag and handle resize update crop size; circle stays square", async ({
  page,
}) => {
  await load(page);
  await page.getByRole("button", { name: "마스크 조절", exact: true }).click();
  const stage = page.getByRole("group", {
      name: "크롭 편집 영역",
      exact: true,
    }),
    rect = (await stage.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    rect.x + rect.width / 2 + 20,
    rect.y + rect.height / 2 + 10,
  );
  await page.mouse.up();
  const handle = page.getByRole("button", {
      name: "마스크 크기 조절",
      exact: true,
    }),
    box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + 22, box.y + 22);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y + 22);
  await page.mouse.up();
  const result = await exportPixels(page);
  expect(result.height).toBeLessThan(result.width);
  await page.getByRole("button", { name: "원형", exact: true }).click();
  await handle.focus();
  await page.keyboard.press("ArrowUp");
  const circle = await exportPixels(page);
  expect(circle.height).toBe(circle.width);
});
test("mobile actual touch pinch and rotate without page overflow", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page);
  const stage = page.getByRole("group", {
    name: "크롭 편집 영역",
    exact: true,
  });
  await stage.scrollIntoViewIfNeeded();
  const box = (await stage.boundingBox())!,
    cx = box.x + box.width / 2,
    cy = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: cx - 30, y: cy, id: 1 },
      { x: cx + 30, y: cy, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: cx - 40, y: cy - 25, id: 1 },
      { x: cx + 40, y: cy + 25, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() =>
      page.getByRole("slider", { name: "확대·축소", exact: true }).inputValue(),
    )
    .not.toBe("1");
  expect(
    Math.abs(
      Number(
        await page
          .getByRole("slider", { name: "회전", exact: true })
          .inputValue(),
      ),
    ),
  ).toBeGreaterThan(20);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/image-cropper-mobile.png",
    fullPage: true,
  });
});
test("image load failure is visible and disables export", async ({ page }) => {
  await load(page);
  await page.getByLabel("사진 선택", { exact: true }).setInputFiles({
    name: "bad.png",
    mimeType: "image/png",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.getByRole("alert")).toContainText("불러오지 못했습니다");
  await expect(
    page.getByRole("button", { name: "PNG로 크롭", exact: true }),
  ).toBeDisabled();
});

test("mouse wheel zoom stays anchored at cursor and does not scroll the page", async ({
  page,
}) => {
  await load(page);
  await page.getByLabel("사진 선택", { exact: true }).setInputFiles({
    name: "gradient.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g"><stop stop-color="black"/><stop offset="1" stop-color="white"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/></svg>',
    ),
  });
  const stage = page.getByRole("group", {
    name: "크롭 편집 영역",
    exact: true,
  });
  await stage.scrollIntoViewIfNeeded();
  const box = (await stage.boundingBox())!;
  const readPixel = () =>
    stage
      .locator("canvas")
      .evaluate((node) =>
        Array.from(
          (node as HTMLCanvasElement)
            .getContext("2d")!
            .getImageData(420, 130, 1, 1).data,
        ),
      );
  await expect.poll(async () => (await readPixel())[3]).toBe(255);
  const before = await readPixel();
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.mouse.move(
    box.x + (box.width * 420) / 640,
    box.y + (box.height * 130) / 420,
  );
  await page.mouse.wheel(0, -240);
  const zoom = page.getByRole("slider", { name: "확대·축소", exact: true });
  await expect
    .poll(async () => Number(await zoom.inputValue()))
    .toBeGreaterThan(1.5);
  const after = await readPixel();
  expect(Math.abs(after[0] - before[0])).toBeLessThanOrEqual(2);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  await page.mouse.wheel(0, 240);
  await expect
    .poll(async () => Number(await zoom.inputValue()))
    .toBeCloseTo(1, 2);
  await page.getByRole("button", { name: "마스크 조절", exact: true }).click();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -500);
  await expect(zoom).toHaveValue("8");
  for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 500);
  await expect(zoom).toHaveValue("0.1");
});

test("circle handle shrinks with vertical-only dragging", async ({ page }) => {
  await load(page);
  await page.getByRole("button", { name: "원형", exact: true }).click();
  await page.getByRole("button", { name: "마스크 조절", exact: true }).click();
  const handle = page.getByRole("button", {
    name: "마스크 크기 조절",
    exact: true,
  });
  const before = (await handle.boundingBox())!;
  await page.mouse.move(before.x + 22, before.y + 22);
  await page.mouse.down();
  await page.mouse.move(before.x + 22, before.y - 18);
  await page.mouse.up();
  const after = (await handle.boundingBox())!;
  expect(after.y).toBeLessThan(before.y - 30);
  expect(after.x).toBeLessThan(before.x - 30);
  const result = await exportPixels(page);
  expect(result.width).toBe(result.height);
});

test("saving ends an active drag and blocks pointer movement until a new gesture", async ({
  page,
}) => {
  await load(page);
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      original.call(
        this,
        (blob) => {
          (window as unknown as { finishCrop: () => void }).finishCrop = () =>
            callback(blob);
        },
        type,
        quality,
      );
    };
  });
  const stage = page.getByRole("group", {
    name: "크롭 편집 영역",
    exact: true,
  });
  await stage.scrollIntoViewIfNeeded();
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const pixels = () =>
    stage
      .locator("canvas")
      .evaluate((node) => (node as HTMLCanvasElement).toDataURL());
  const before = await pixels();
  await page.getByRole("button", { name: "PNG로 크롭", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".gc-cropper-footer button").last()).toBeDisabled();
  await page.mouse.move(
    box.x + box.width / 2 + 60,
    box.y + box.height / 2 + 50,
  );
  expect(await pixels()).toBe(before);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          typeof (window as unknown as { finishCrop?: () => void }).finishCrop,
      ),
    )
    .toBe("function");
  await page.evaluate(() =>
    (window as unknown as { finishCrop: () => void }).finishCrop(),
  );
  await expect(
    page.getByRole("button", { name: "PNG로 크롭", exact: true }),
  ).toBeEnabled();
  await page.mouse.move(
    box.x + box.width / 2 + 90,
    box.y + box.height / 2 + 80,
  );
  expect(await pixels()).toBe(before);
  await page.mouse.up();
});
