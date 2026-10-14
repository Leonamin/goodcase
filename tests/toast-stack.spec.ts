import { test, expect } from "@playwright/test";
const live = ".gc-toast-viewport .gc-toast";
test("stack queues without loss, expands on hover, and promotes FIFO after animated exit", async ({
  page,
}) => {
  await page.goto("/?component=toast");
  await page.getByLabel("알림 배치").selectOption("stack");
  await page.getByLabel("스택 표시 개수").selectOption("2");
  await page.getByLabel("자동 닫힘 시간").selectOption("10000");
  await page
    .getByRole("button", { name: "여러 알림 띄우기", exact: true })
    .click();
  await page.mouse.move(1, 1);
  const viewport = page.locator(".gc-toast-viewport");
  await expect(page.locator(live)).toHaveCount(2);
  await expect(page.locator(".gc-toast-queue")).toHaveCount(0);
  await expect(page.locator(".gc-toast-slot").nth(1)).toHaveAttribute(
    "inert",
    "",
  );
  await expect(page.locator(live).nth(1)).toHaveAttribute(
    "data-paused",
    "true",
  );
  await viewport.hover({ position: { x: 2, y: 2 } });
  await expect(viewport).toHaveAttribute("data-expanded", "true");
  await expect(page.locator(".gc-toast-slot").nth(1)).not.toHaveAttribute(
    "inert",
    "",
  );
  const first = page.locator(live).first();
  await first.getByRole("button", { name: /알림 닫기/ }).click();
  await expect(first).toHaveAttribute("data-phase", "closing");
  await expect(first).toHaveCSS("animation-name", "gc-toast-exit");
  await expect(page.locator(live).first()).toContainText("묶음 알림 2");
  await expect(page.locator(live).nth(1)).toContainText("묶음 알림 3");
  await expect(page.locator(".gc-toast-queue")).toHaveCount(0);
});
test("keyboard focus expands stack and reduced motion closes immediately", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?component=toast");
  await page.getByLabel("알림 배치").selectOption("stack");
  await page
    .getByRole("button", { name: "여러 알림 띄우기", exact: true })
    .click();
  await page.mouse.move(1, 1);
  const viewport = page.locator(".gc-toast-viewport");
  await page.keyboard.press("F8");
  await expect(viewport).toHaveAttribute("data-expanded", "true");
  await page
    .locator(live)
    .nth(1)
    .getByRole("button", { name: /알림 닫기/ })
    .focus();
  await expect(page.locator(live).nth(1)).toHaveAttribute(
    "data-paused",
    "true",
  );
  await page.keyboard.press("Enter");
  await expect(
    page.locator(live).filter({ hasText: "묶음 알림 2" }),
  ).toHaveCount(0);
  await expect(page.locator("[data-phase=closing]")).toHaveCount(0);
});
test("direction controls anchor and enter animation; animation clock does not rerender text", async ({
  page,
}) => {
  await page.goto("/?component=toast");
  await page.getByLabel("진입 방향").selectOption("down");
  await page.getByRole("button", { name: "정보 알림", exact: true }).click();
  await page.mouse.move(1, 1);
  const card = page.locator(live);
  await expect(card).toHaveCSS("animation-name", "gc-toast-enter-down");
  await expect(page.locator(".gc-toast-viewport")).toHaveAttribute(
    "data-direction",
    "down",
  );
  await card.evaluate((element) => {
    (window as any).__toastMutations = 0;
    new MutationObserver((mutations) => {
      (window as any).__toastMutations += mutations.filter(
        (m) => m.type === "childList" || m.type === "characterData",
      ).length;
    }).observe(element, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  });
  const bar = card.locator(".gc-toast-timer>span");
  const before = await bar.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.waitForTimeout(400);
  const after = await bar.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  expect(after).not.toBe(before);
  expect(await page.evaluate(() => (window as any).__toastMutations)).toBe(0);
});

test("timer clips through full card silhouette rather than a rounded thin strip", async ({
  page,
}) => {
  await page.goto("/?component=toast");
  await page.getByRole("button", { name: "정보 알림", exact: true }).click();
  const card = page.locator(live);
  await expect(card).toBeVisible();
  const geometry = await card.evaluate((element) => {
    const clip = element.querySelector(".gc-toast-timer-clip")!;
    const cardStyle = getComputedStyle(element);
    const clipStyle = getComputedStyle(clip);
    return {
      cardHeight: element.getBoundingClientRect().height,
      clipHeight: clip.getBoundingClientRect().height,
      borderHeight:
        parseFloat(cardStyle.borderTopWidth) +
        parseFloat(cardStyle.borderBottomWidth),
      cardRadius: cardStyle.borderBottomLeftRadius,
      clipRadius: clipStyle.borderBottomLeftRadius,
      timerHeight: element
        .querySelector(".gc-toast-timer")!
        .getBoundingClientRect().height,
    };
  });
  expect(geometry.clipHeight).toBeCloseTo(
    geometry.cardHeight - geometry.borderHeight,
    2,
  );
  expect(geometry.clipHeight).toBeGreaterThan(geometry.timerHeight);
  expect(geometry.clipRadius).toBe(geometry.cardRadius);
  expect(geometry.timerHeight).toBe(3);
});

for (const direction of ["up", "down"] as const) {
  test(`remaining cards animate into the removed slot ${direction}`, async ({
    page,
  }) => {
    await page.goto("/?component=toast");
    await page.getByLabel("진입 방향").selectOption(direction);
    await page.getByLabel("자동 닫힘 시간").selectOption("10000");
    await page
      .getByRole("button", { name: "여러 알림 띄우기", exact: true })
      .click();
    await expect(page.locator(live)).toHaveCount(5);
    await page.waitForTimeout(400);
    const survivor = page
      .locator(".gc-toast-slot")
      .filter({ hasText: "묶음 알림 3" });
    const oldTop = (await survivor.boundingBox())!.y;
    await page
      .locator(live)
      .filter({ hasText: "묶음 알림 2" })
      .getByRole("button", { name: /알림 닫기/ })
      .click();
    await expect(page.locator(live)).toHaveCount(4);
    await expect
      .poll(() =>
        survivor.evaluate((node) =>
          node
            .getAnimations()
            .some(
              (animation) =>
                animation.effect instanceof KeyframeEffect &&
                animation.effect
                  .getKeyframes()
                  .some((frame) => "translate" in frame),
            ),
        ),
      )
      .toBe(true);
    const movingTop = (await survivor.boundingBox())!.y;
    await page.waitForTimeout(260);
    const finalTop = (await survivor.boundingBox())!.y;
    expect(Math.abs(movingTop - finalTop)).toBeGreaterThan(1);
    expect(Math.abs(oldTop - finalTop)).toBeGreaterThan(20);
    expect(Math.abs(movingTop - oldTop)).toBeLessThan(
      Math.abs(finalTop - oldTop),
    );
  });
}
