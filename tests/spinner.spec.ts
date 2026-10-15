import { test, expect } from "@playwright/test";
import { selectOption } from "./helpers/select-option";

test("ring spins continuously and each orbiting dot has an independent speed", async ({
  page,
}) => {
  await page.goto("/?component=spinner");
  const ring = page.getByRole("status", { name: "원형 선 스피너" });
  const orbit = page.getByRole("status", { name: "다중 원 스피너" });
  await expect(ring).toBeVisible();
  await expect(orbit).toBeVisible();
  await expect(ring.locator(".gc-spinner-arc")).toHaveAttribute(
    "stroke-linecap",
    "round",
  );
  const rotation = await ring.locator("svg").evaluate((el) => {
    const animation = el.getAnimations()[0];
    animation.pause();
    animation.currentTime =
      Number(animation.effect!.getComputedTiming().duration) / 4;
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return {
      a: matrix.a,
      b: matrix.b,
      iterations: animation.effect!.getTiming().iterations,
    };
  });
  expect(Math.abs(rotation.a)).toBeLessThan(0.01);
  expect(rotation.b).toBeGreaterThan(0.99);
  expect(rotation.iterations).toBe(Infinity);
  const motion = await orbit
    .locator(".gc-spinner-orbiter")
    .evaluateAll((elements) =>
      elements.map((el) => {
        const animation = el.getAnimations()[0];
        animation.pause();
        animation.currentTime = 0;
        const initial = new DOMMatrix(getComputedStyle(el).transform);
        animation.currentTime = 300;
        const next = new DOMMatrix(getComputedStyle(el).transform);
        const angle =
          ((Math.atan2(next.b, next.a) - Math.atan2(initial.b, initial.a)) *
            180) /
          Math.PI;
        return {
          delta: (angle + 360) % 360,
          duration: Number(animation.effect!.getComputedTiming().duration),
        };
      }),
    );
  expect(motion).toHaveLength(4);
  expect(new Set(motion.map((item) => item.duration)).size).toBe(4);
  for (let index = 1; index < motion.length; index++)
    expect(motion[index - 1].delta).toBeGreaterThan(motion[index].delta);
});

test("sizes, decorative accessibility, inherited color and narrow layout follow shared tokens", async ({
  page,
}) => {
  await page.goto("/?component=spinner");
  await expect(page.getByRole("status")).toHaveCount(2);
  await expect(
    page.locator(".gc-spinner[aria-hidden=true]").first(),
  ).not.toHaveAttribute("role", /.+/);
  for (const [size, pixels] of [
    ["small", 16],
    ["medium", 32],
    ["large", 48],
  ] as const) {
    const spinner = page.locator(`.gc-spinner-${size}`).first();
    const box = await spinner.boundingBox();
    expect(box?.width).toBe(pixels);
    expect(box?.height).toBe(pixels);
  }
  const nested = page.locator(".gc-button .gc-spinner").first();
  expect(await nested.evaluate((el) => getComputedStyle(el).color)).toBe(
    await nested.evaluate(
      (el) => getComputedStyle(el.closest("button")!).color,
    ),
  );
  const original = await page
    .getByRole("status", { name: "원형 선 스피너" })
    .evaluate((el) => getComputedStyle(el).color);
  await selectOption(
    page.getByRole("combobox", { name: "테마", exact: true }),
    "forest",
  );
  await expect
    .poll(() =>
      page
        .getByRole("status", { name: "원형 선 스피너" })
        .evaluate((el) => getComputedStyle(el).color),
    )
    .not.toBe(original);
  await selectOption(
    page.getByRole("combobox", { name: "색상 모드", exact: true }),
    "dark",
  );
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
  }
});

test("reduced motion stops both variants and leaves the loading announcement available", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?component=spinner");
  for (const name of ["원형 선 스피너", "다중 원 스피너"]) {
    const spinner = page.getByRole("status", { name });
    await expect(spinner).toBeVisible();
    expect(
      await spinner.evaluate(
        (el) => el.getAnimations({ subtree: true }).length,
      ),
    ).toBe(0);
    await expect(spinner.locator(".gc-sr-only")).toHaveText(name);
  }
  const transforms = await page
    .locator('.gc-spinner-orbit[role="status"] .gc-spinner-orbiter')
    .evaluateAll((elements) =>
      elements.map((el) => getComputedStyle(el).transform),
    );
  expect(new Set(transforms).size).toBe(4);
});
