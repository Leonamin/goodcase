import { selectOption } from "./helpers/select-option";
import { test, expect } from "@playwright/test";
const live = ".gc-toast-viewport .gc-toast";
test("circle countdown pauses on hover and focus, shows close icon, then resumes expiry", async ({
  page,
}) => {
  await page.goto("/?component=toast");
  await selectOption(page.getByLabel("타이머 표현"), "circle");
  await selectOption(page.getByLabel("자동 닫힘 시간"), "1500");
  await page.getByRole("button", { name: "정보 알림", exact: true }).click();
  await page.mouse.move(1, 1);
  const toast = page.locator(live).first();
  const close = toast.getByRole("button", { name: /알림 닫기/ });
  const ring = toast.locator(".gc-toast-ring circle").last();
  await expect(toast).toBeVisible();
  await close.hover();
  await expect(toast).toHaveAttribute("data-paused", "true");
  await expect(toast.locator(".gc-toast-close-x")).toHaveCSS("opacity", "1");
  await expect(toast.locator(".gc-toast-ring")).toHaveCSS("opacity", "0");
  const frozen = await ring.evaluate(
    (element) => getComputedStyle(element).strokeDashoffset,
  );
  await page.waitForTimeout(1700);
  await expect(toast).toBeVisible();
  expect(
    parseFloat(
      await ring.evaluate(
        (element) => getComputedStyle(element).strokeDashoffset,
      ),
    ),
  ).toBeCloseTo(parseFloat(frozen), 2);
  await close.focus();
  await page.mouse.move(1, 1);
  await expect(toast).toHaveAttribute("data-paused", "true");
  await page.waitForTimeout(400);
  await expect(toast).toBeVisible();
  await page.getByRole("button", { name: "정보 알림", exact: true }).focus();
  await expect(toast).toHaveAttribute("data-paused", "false");
  await expect(toast).toHaveCount(0, { timeout: 2500 });
});
test("persistent errors have no fake timer and F8 keyboard close stays usable", async ({
  page,
}) => {
  await page.goto("/?component=toast");
  await selectOption(page.getByLabel("타이머 표현"), "circle");
  await selectOption(page.getByLabel("자동 닫힘 시간"), "1500");
  await page.getByRole("button", { name: "오류 알림", exact: true }).click();
  await page.mouse.move(1, 1);
  const toast = page.locator(live);
  await expect(toast).toHaveAttribute("data-persistent", "true");
  await expect(toast.locator(".gc-toast-ring")).toHaveCount(0);
  await expect(toast.getByRole("progressbar")).toHaveCount(0);
  await page.waitForTimeout(1700);
  await expect(toast).toBeVisible();
  await page.keyboard.press("F8");
  await expect
    .poll(() =>
      page
        .locator(".gc-toast-viewport")
        .evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(true);
  await toast.getByRole("button", { name: /알림 닫기/ }).focus();
  await page.keyboard.press("Escape");
  await expect(toast).toHaveCount(0);
});
test("surface follows theme, backgrounds vary, title icon close align at 24px, mobile stays within viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/?component=toast");
  await page.getByRole("button", { name: "오류 알림", exact: true }).click();
  const toast = page.locator(live).first();
  const alignment = await toast.evaluate((element) => {
    const icon = element
      .querySelector(".gc-toast-icon")!
      .getBoundingClientRect();
    const title = element
      .querySelector(".gc-toast-title")!
      .getBoundingClientRect();
    const close = element
      .querySelector(".gc-toast-close")!
      .getBoundingClientRect();
    return {
      iconHeight: icon.height,
      closeHeight: close.height,
      titleHeight: title.height,
      iconTop: icon.top,
      closeTop: close.top,
      titleTop: title.top,
      right: element.getBoundingClientRect().right,
    };
  });
  expect(alignment.iconHeight).toBe(24);
  expect(alignment.closeHeight).toBe(24);
  expect(alignment.titleHeight).toBe(24);
  expect(alignment.iconTop).toBe(alignment.titleTop);
  expect(alignment.closeTop).toBe(alignment.titleTop);
  expect(alignment.right).toBeLessThanOrEqual(375);
  const light = await toast.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await selectOption(page.getByLabel("색상 모드", { exact: true }), "dark");
  await expect(toast).toHaveCSS("background-color", "rgb(32, 37, 46)");
  expect(light).not.toBe("rgb(32, 37, 46)");
  await toast.getByRole("button", { name: /알림 닫기/ }).click();
  await expect(page.locator(live)).toHaveCount(0);
  await selectOption(page.getByLabel("알림 배경"), "tinted");
  await page.getByRole("button", { name: "오류 알림", exact: true }).click();
  await expect(page.locator(live)).toHaveClass(/gc-toast-tinted/);
  const tinted = await page
    .locator(live)
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  await page
    .locator(live)
    .getByRole("button", { name: /알림 닫기/ })
    .click();
  await expect(page.locator(live)).toHaveCount(0);
  await selectOption(page.getByLabel("알림 배경"), "solid");
  await page.getByRole("button", { name: "오류 알림", exact: true }).click();
  await expect(page.locator(live)).toHaveClass(/gc-toast-solid/);
  expect(
    await page
      .locator(live)
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe(tinted);
});
test("individual hover pauses only that card while sibling timer expires", async ({
  page,
}) => {
  await page.goto("/?component=toast");
  await selectOption(page.getByLabel("자동 닫힘 시간"), "1500");
  await page.getByRole("button", { name: "정보 알림", exact: true }).click();
  await page.getByRole("button", { name: "경고 알림", exact: true }).click();
  const first = page
    .locator(live)
    .filter({ hasText: "저장 공간을 확인해주세요" });
  await first.hover();
  await expect(first).toHaveAttribute("data-paused", "true");
  const progress = first.locator(".gc-toast-timer>span");
  const transform = await progress.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.waitForTimeout(1800);
  await expect(page.locator(live)).toHaveCount(1);
  await expect(first).toHaveAttribute("data-paused", "true");
  expect(
    await progress.evaluate((element) => getComputedStyle(element).transform),
  ).toBe(transform);
  await page.mouse.move(1, 1);
  await expect(page.locator(live)).toHaveCount(0, { timeout: 2500 });
});

test("viewport empty padding does not pause siblings and no visual timer still expires", async ({
  page,
}) => {
  await page.goto("/?component=toast");
  await selectOption(page.getByLabel("자동 닫힘 시간"), "1500");
  await page.getByRole("button", { name: "정보 알림", exact: true }).click();
  await page.locator(".gc-toast-viewport").hover({ position: { x: 2, y: 2 } });
  await page
    .getByRole("button", { name: "정보 알림", exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click());
  await expect(page.locator(live)).toHaveCount(2);
  await expect(page.locator(live).last()).toHaveAttribute(
    "data-paused",
    "false",
  );
  await expect(page.locator(live)).toHaveCount(0, { timeout: 2500 });
  await selectOption(page.getByLabel("타이머 표현"), "none");
  await page.getByRole("button", { name: "정보 알림", exact: true }).click();
  await page.mouse.move(1, 1);
  await expect(page.locator(live)).toHaveCount(1);
  await expect(page.locator(live).getByRole("progressbar")).toHaveCount(0);
  await expect(page.locator(live).locator(".gc-toast-ring")).toHaveCount(0);
  await expect(page.locator(live)).toHaveCount(0, { timeout: 2500 });
});
