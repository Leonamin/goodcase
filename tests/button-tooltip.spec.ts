import { test, expect } from "@playwright/test";

test("button and icon button press shrink around their center then restore without overwriting layout transforms", async ({ page }) => {
  await page.goto("/?component=button");
  for (const name of ["취소", "즐겨찾기"]) {
    const button = page.locator(".preview-canvas").getByRole("button", { name, exact: true });
    await button.evaluate(element => (element as HTMLElement).style.transform = "translateX(7px)");
    const style = await button.evaluate(element => ({ property:getComputedStyle(element).transitionProperty, duration:getComputedStyle(element).transitionDuration }));
    expect(style.property).toContain("scale");
    expect(style.duration).toContain("0.08s");
    const initial = (await button.boundingBox())!;
    await page.mouse.move(initial.x + initial.width / 2, initial.y + initial.height / 2);
    await page.mouse.down();
    await expect.poll(() => button.evaluate(element => Number(getComputedStyle(element).scale))).toBe(.96);
    const pressed = (await button.boundingBox())!;
    expect(Math.abs(pressed.x + pressed.width / 2 - initial.x - initial.width / 2)).toBeLessThan(.5);
    expect(Math.abs(pressed.y + pressed.height / 2 - initial.y - initial.height / 2)).toBeLessThan(.5);
    expect(Math.abs(pressed.width / initial.width - .96)).toBeLessThan(.005);
    expect(Math.abs(pressed.height / initial.height - .96)).toBeLessThan(.005);
    expect(await button.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41)).toBe(7);
    await page.mouse.up();
    await expect.poll(() => button.evaluate(element => Number(getComputedStyle(element).scale))).toBe(1);
    const released = (await button.boundingBox())!;
    expect(Math.abs(released.width - initial.width)).toBeLessThan(.5);
    await page.emulateMedia({ reducedMotion:"reduce" });
    await page.mouse.down();
    expect(await button.evaluate(element => Number(getComputedStyle(element).scale))).toBe(1);
    await page.mouse.up();
    await page.emulateMedia({ reducedMotion:"no-preference" });
  }
});

test("tooltip uses a ghost icon button with focus explanation and Escape dismissal", async ({
  page,
}) => {
  await page.goto("/?component=tooltip");
  const trigger = page.getByRole("button", {
    name: "활성 구성원 안내",
    exact: true,
  });
  expect(await trigger.evaluate((element) => element.tagName)).toBe("BUTTON");
  await expect(trigger).toHaveClass(/gc-icon-button-ghost/);
  await expect(trigger.locator("svg")).toHaveCount(1);
  expect(
    await trigger.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toBe("rgba(0, 0, 0, 0)");
  await trigger.focus();
  await expect(page.getByRole("tooltip")).toContainText("활동한 구성원만");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
