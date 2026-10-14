import { test, expect, type Locator } from "@playwright/test";
async function geometry(progress: Locator) {
  return progress.evaluate((element) => {
    const track = element
      .querySelector(".gc-progress-track")!
      .getBoundingClientRect();
    const fill = element
      .querySelector(".gc-progress-fill")!
      .getBoundingClientRect();
    const number = element
      .querySelector(".gc-progress-number")!
      .getBoundingClientRect();
    const meter = element.querySelector(".gc-progress-meter")!;
    const mode = ["inside", "outside", "below"].find((value) =>
      meter.classList.contains(`gc-progress-number-${value}`),
    );
    return {
      mode,
      track: {
        left: track.left,
        right: track.right,
        top: track.top,
        bottom: track.bottom,
        width: track.width,
      },
      fill: { left: fill.left, right: fill.right, width: fill.width },
      number: {
        left: number.left,
        right: number.right,
        top: number.top,
        width: number.width,
      },
      dx: number.left + number.width / 2 - fill.left - fill.width / 2,
      count: element.querySelectorAll(".gc-progress-number").length,
    };
  });
}
test("thick percentage follows the filled area and remains readable at range edges", async ({
  page,
}) => {
  await page.goto("/?component=progress");
  const progress = page.locator(".gc-progress-thick").first();
  const range = page.locator(".preview-canvas input[type=range]");
  for (const value of [35, 0, 5, 100]) {
    await range.fill(String(value));
    const expectedMode = value === 0 || value === 5 ? "outside" : "inside";
    await expect
      .poll(async () => (await geometry(progress)).mode)
      .toBe(expectedMode);
    const actual = await geometry(progress);
    expect(actual.count).toBe(1);
    expect(actual.number.left).toBeGreaterThanOrEqual(actual.track.left - 0.5);
    expect(actual.number.right).toBeLessThanOrEqual(actual.track.right + 0.5);
    if (expectedMode === "inside") expect(Math.abs(actual.dx)).toBeLessThan(1);
    else expect(actual.number.left).toBeGreaterThanOrEqual(actual.fill.right);
    await expect(progress.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      String(value),
    );
  }
});
test("responsive measurement changes placement without a percentage cutoff and tiny tracks fall back below", async ({
  page,
}) => {
  await page.goto("/?component=progress");
  const progress = page.locator(".gc-progress-thick").first();
  await page.locator(".preview-canvas input[type=range]").fill("35");
  await progress.evaluate(
    (element) => ((element as HTMLElement).style.width = "500px"),
  );
  await expect.poll(async () => (await geometry(progress)).mode).toBe("inside");
  await progress.evaluate(
    (element) => ((element as HTMLElement).style.width = "100px"),
  );
  await expect
    .poll(async () => (await geometry(progress)).mode)
    .toBe("outside");
  let actual = await geometry(progress);
  expect(actual.number.left).toBeGreaterThanOrEqual(actual.fill.right);
  expect(actual.number.right).toBeLessThanOrEqual(actual.track.right + 0.5);
  await progress.evaluate(
    (element) => ((element as HTMLElement).style.width = "10px"),
  );
  await expect.poll(async () => (await geometry(progress)).mode).toBe("below");
  actual = await geometry(progress);
  expect(actual.number.top).toBeGreaterThan(actual.track.bottom);
  expect(actual.number.right).toBeLessThanOrEqual(actual.track.right + 0.5);
  await progress.evaluate(
    (element) => ((element as HTMLElement).style.width = "500px"),
  );
  await expect.poll(async () => (await geometry(progress)).mode).toBe("inside");
  expect(Math.abs((await geometry(progress)).dx)).toBeLessThan(1);
  const unknown = page.getByRole("progressbar", {
    name: "완료 시간을 계산하는 중",
  });
  await expect(unknown).not.toHaveAttribute("aria-valuenow");
});
