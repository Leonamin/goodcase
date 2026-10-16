import { test, expect } from "@playwright/test";

for (const width of [1440, 375]) {
  test(`drawer slides on its responsive axis and retains the modal through exit at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/tests/fixtures/drawer-motion.html");
    const trigger = page.getByRole("button", {
      name: "Drawer 열기",
      exact: true,
    });
    await trigger.click();
    const drawer = page.getByRole("dialog", { name: "애니메이션 검증" });
    // Pause real browser transitions to inspect an intermediate frame deterministically.
    const entering = await drawer.evaluate((element) => {
      const transition = element
        .getAnimations()
        .find((item) => item instanceof CSSTransition)!;
      transition.pause();
      transition.currentTime = 100;
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return {
        x: matrix.m41,
        y: matrix.m42,
        duration: transition.effect!.getTiming().duration,
      };
    });
    expect(entering.duration).toBe(250);
    expect(width > 600 ? entering.x : entering.y).toBeGreaterThan(0);
    expect(width > 600 ? entering.y : entering.x).toBe(0);
    await drawer.evaluate((element) =>
      element.getAnimations().forEach((item) => item.finish()),
    );
    await expect(
      drawer.getByRole("button", { name: "닫기", exact: true }),
    ).toBeFocused();
    const layout = await drawer.evaluate((element) => {
      const body = element.querySelector(".gc-modal-body")!;
      body.scrollTop = body.scrollHeight;
      const footer = element.querySelector("footer")!.getBoundingClientRect();
      return {
        hasOverflow: body.scrollHeight > body.clientHeight,
        footerBottom: footer.bottom,
        isScrollLocked: getComputedStyle(document.body).overflow === "hidden",
      };
    });
    expect(layout.hasOverflow).toBe(true);
    expect(layout.footerBottom).toBeLessThanOrEqual(900);
    expect(layout.isScrollLocked).toBe(true);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveAttribute("data-state", "closed");
    const exiting = await drawer.evaluate((element) => {
      const transition = element
        .getAnimations()
        .find((item) => item instanceof CSSTransition)!;
      const presence = element
        .getAnimations()
        .find((item) => item instanceof CSSAnimation)!;
      presence.pause();
      transition.pause();
      transition.currentTime = 100;
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return {
        x: matrix.m41,
        y: matrix.m42,
        duration: transition.effect!.getTiming().duration,
        hasOverlay: !!document.querySelector(
          '.gc-drawer-overlay[data-state="closed"]',
        ),
      };
    });
    expect(exiting.duration).toBe(200);
    expect(width > 600 ? exiting.x : exiting.y).toBeGreaterThan(0);
    expect(exiting.hasOverlay).toBe(true);
    // An external controlled-state change reverses the in-flight transition.
    await page
      .getByRole("button", { name: "외부 열기", includeHidden: true })
      .evaluate((element: HTMLButtonElement) => element.click());
    await expect(drawer).toHaveAttribute("data-state", "open");
    const reversed = await drawer.evaluate((element) => {
      const transition = element
        .getAnimations()
        .find((item) => item instanceof CSSTransition)!;
      transition.pause();
      transition.currentTime = 0;
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return { x: matrix.m41, y: matrix.m42 };
    });
    expect(reversed.x).toBeCloseTo(exiting.x, 0);
    expect(reversed.y).toBeCloseTo(exiting.y, 0);
    await drawer.evaluate((element) =>
      element.getAnimations().forEach((item) => item.finish()),
    );
    await expect(drawer).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await drawer.getByRole("button", { name: "닫기", exact: true }).click();
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator(".gc-drawer-overlay")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });
}

test("reduced motion opens and closes immediately; backdrop dismisses the drawer", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tests/fixtures/drawer-motion.html");
  const trigger = page.getByRole("button", {
    name: "Drawer 열기",
    exact: true,
  });
  await trigger.click();
  const drawer = page.getByRole("dialog");
  expect(
    await drawer.evaluate((element) => element.getAnimations().length),
  ).toBe(0);
  await expect(drawer).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await page
    .locator(".gc-drawer-overlay")
    .click({ position: { x: 10, y: 10 } });
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
