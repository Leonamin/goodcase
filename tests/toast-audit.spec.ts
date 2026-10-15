import { selectOption } from "./helpers/select-option";
import { test, expect } from "@playwright/test";
const cards = ".gc-toast-viewport .gc-toast";

test("hover pauses only the target while sibling expires; WAAPI keeps smooth independent clock", async ({
  page,
}) => {
  await page.goto("/?component=toast");
  await selectOption(page.getByLabel("자동 닫힘 시간"), "1500");
  await page.getByRole("button", { name: "성공 알림", exact: true }).click();
  await page.getByRole("button", { name: "정보 알림", exact: true }).click();
  await page.mouse.move(1, 1);
  const target = page
    .locator(cards)
    .filter({ has: page.getByText("새 업데이트가 있습니다", { exact: true }) });
  const sibling = page
    .locator(cards)
    .filter({ has: page.getByText("저장했습니다", { exact: true }) });
  await target.hover();
  await expect(target).toHaveAttribute("data-paused", "true");
  await expect(sibling).toHaveAttribute("data-paused", "false");
  const animation = await target
    .locator(".gc-toast-timer span")
    .evaluate((el) => ({
      time: el.getAnimations()[0]?.currentTime,
      state: el.getAnimations()[0]?.playState,
    }));
  expect(animation.state).toBe("paused");
  await page.waitForTimeout(1700);
  await expect(target).toBeVisible();
  await expect(sibling).toHaveCount(0);
  const current = await target
    .locator(".gc-toast-timer span")
    .evaluate((el) => el.getAnimations()[0]?.currentTime);
  expect(current).toBe(animation.time);
  await page.mouse.move(1, 1);
  await expect(target).toHaveAttribute("data-paused", "false");
  await expect(target).toHaveCount(0, { timeout: 2500 });
});

test("collapsed stack excludes back cards from interaction, F8 expands, FIFO queue retains every message", async ({
  page,
}) => {
  await page.goto("/?component=toast");
  await selectOption(page.getByLabel("알림 배치"), "stack");
  await selectOption(page.getByLabel("스택 표시 개수"), "2");
  await page.getByRole("button", { name: "여러 알림 띄우기" }).click();
  await page.mouse.move(1, 1);
  const slots = page.locator(".gc-toast-slot");
  await expect(slots).toHaveCount(2);
  await expect(page.locator(".gc-toast-queue")).toHaveCount(0);
  await expect(slots.nth(1)).toHaveAttribute("inert", "");
  await expect(slots.nth(1)).toHaveAttribute("aria-hidden", "true");
  await expect(slots.nth(1).locator(".gc-toast-content")).toHaveCSS(
    "visibility",
    "hidden",
  );
  expect(
    await slots.nth(1).evaluate((el) => {
      const button = el.querySelector<HTMLButtonElement>("button")!;
      button.focus();
      return el.contains(document.activeElement);
    }),
  ).toBe(false);
  await page.keyboard.press("F8");
  await expect(page.locator(".gc-toast-viewport")).toHaveAttribute(
    "data-expanded",
    "true",
  );
  await expect(slots.nth(1)).not.toHaveAttribute("inert", "");
  await expect(slots.nth(1).locator(".gc-toast-content")).toHaveCSS(
    "visibility",
    "visible",
  );
  for (let index = 1; index <= 4; index++) {
    const card = page
      .locator(cards)
      .filter({ has: page.getByText(`묶음 알림 ${index}`, { exact: true }) });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /알림 닫기/ }).click();
    await expect(card).toHaveCount(0);
  }
  await expect(page.locator(cards)).toHaveCount(0);
  await expect(page.locator(".gc-toast-queue")).toHaveCount(0);
});

test("expanded variable heights scroll within viewport and retain readable focus at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 400 });
  await page.goto("/?component=toast");
  await selectOption(page.getByLabel("알림 배치"), "stack");
  await selectOption(page.getByLabel("스택 표시 개수"), "5");
  await selectOption(page.getByLabel("진입 방향"), "down");
  await page.getByRole("button", { name: "여러 알림 띄우기" }).click();
  await page.mouse.move(1, 1);
  await page.keyboard.press("F8");
  const viewport = page.locator(".gc-toast-viewport");
  await expect(viewport).toBeFocused();
  // F8 navigation finishes after the notification commit and focus guards.
  // Confirm stable viewport focus before issuing a different focus request.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(viewport).toBeFocused();
  await expect(viewport).toHaveAttribute("data-can-scroll", "true");
  await expect(viewport).toHaveCSS("overflow-y", "auto");
  await expect(page.locator(cards)).toHaveCount(5);
  const heights = await page
    .locator(cards)
    .evaluateAll((elements) =>
      elements.map((el) => el.getBoundingClientRect().height),
    );
  expect(new Set(heights).size).toBeGreaterThan(1);
  const last = page
    .locator(cards)
    .last()
    .getByRole("button", { name: /알림 닫기/ });
  await last.focus();
  await expect(last).toBeFocused();
  await expect
    .poll(() =>
      last.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const viewport = el
          .closest(".gc-toast-viewport")!
          .getBoundingClientRect();
        return rect.top >= viewport.top && rect.bottom <= viewport.bottom;
      }),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});

test("reduced motion eliminates entry/layout/exit effects and dismissal remains live", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?component=toast");
  await selectOption(page.getByLabel("진입 방향"), "down");
  await page.getByRole("button", { name: "오류 알림", exact: true }).click();
  await page.mouse.move(1, 1);
  const card = page.locator(cards);
  await expect(card).toHaveCSS("animation-name", "none");
  await expect(page.locator(".gc-toast-slot")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await card.getByRole("button", { name: /알림 닫기/ }).click();
  await expect(card).toHaveCount(0);
  await expect(page.locator(".gc-toast-viewport")).toHaveCSS(
    "pointer-events",
    "none",
  );
  await selectOption(page.getByLabel("자동 닫힘 시간"), "1500");
  await page.getByRole("button", { name: "정보 알림", exact: true }).click();
  await page.mouse.move(1, 1);
  await expect
    .poll(
      () =>
        card
          .locator(".gc-toast-timer span")
          .evaluate(
            (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a,
          ),
      { timeout: 1400, intervals: [100] },
    )
    .toBeLessThan(0.9);
  await expect(card).toHaveCount(0, { timeout: 2000 });
});
