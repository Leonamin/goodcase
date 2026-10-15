import { test, expect } from "@playwright/test";

test("Combobox follows stable option values and chooses a valid fallback after result changes", async ({
  page,
}) => {
  // Change parent props without a pointer event dismissing the open popover.
  await page.goto("/tests/fixtures/combobox-contract.html");
  const input = page.getByRole("combobox", { name: "동적 항목" });
  await input.focus();
  await input.press("ArrowDown");
  await input.press("ArrowDown");
  await page
    .getByRole("button", { name: "결과 재정렬" })
    .dispatchEvent("click");
  await expect(input).toBeFocused();
  await expect(page.locator(".is-highlighted")).toHaveText("셋째 항목");
  await input.press("Enter");
  await expect(page.getByRole("status")).toHaveText("선택값: three");
  await input.click();
  await input.press("ArrowDown");
  await input.press("ArrowDown");
  await page.getByRole("button", { name: "결과 축소" }).dispatchEvent("click");
  await expect(input).toHaveAttribute("aria-activedescendant", /option-0$/);
  await input.press("Enter");
  await expect(page.getByRole("status")).toHaveText("선택값: one");
  await input.click();
  await page
    .getByRole("button", { name: "결과 비활성" })
    .dispatchEvent("click");
  await expect(page.getByRole("option")).toHaveCount(3);
  await expect(page.locator(".is-highlighted")).toHaveCount(0);
  await expect(input).not.toHaveAttribute("aria-activedescendant", /.+/);
  await input.press("Enter");
  await expect(input).toHaveAttribute("aria-expanded", "true");
});

test("Combobox recovers from equal-length replacement and empty results without an extra arrow key", async ({
  page,
}) => {
  // Change parent props without a pointer event dismissing the open popover.
  await page.goto("/tests/fixtures/combobox-contract.html");
  const input = page.getByRole("combobox", { name: "동적 항목" });
  await input.focus();
  await input.press("ArrowDown");
  await page.getByRole("button", { name: "결과 교체" }).dispatchEvent("click");
  await expect(page.locator(".is-highlighted")).toHaveText("첫 항목");
  await input.press("Enter");
  await expect(page.getByRole("status")).toHaveText("선택값: new-one");
  await input.click();
  await page
    .getByRole("button", { name: "결과 비우기" })
    .dispatchEvent("click");
  await expect(input).not.toHaveAttribute("aria-activedescendant", /.+/);
  await input.press("Enter");
  await expect(input).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "결과 복원" }).dispatchEvent("click");
  await input.press("Enter");
  await expect(page.getByRole("status")).toHaveText("선택값: one");
});

test("Toast removal follows the CSS exit animation instead of a fixed timeout", async ({
  page,
}) => {
  await page.goto("/?component=toast");
  await page.addStyleTag({
    content: ":root { --gc-toast-exit-duration: 900ms; }",
  });
  await page.getByRole("button", { name: "오류 알림", exact: true }).click();
  const toast = page.locator(".gc-toast-viewport .gc-toast");
  await toast.getByRole("button", { name: /알림 닫기/ }).click();
  await expect(toast).toHaveAttribute("data-phase", "closing");
  await toast.evaluate((element) => {
    const animation = element.getAnimations()[0];
    if (Number(animation.effect!.getComputedTiming().duration) !== 900)
      throw new Error("Exit token not applied");
    animation.pause();
  });
  await page.waitForTimeout(250);
  await expect(toast).toHaveCount(1);
  await toast.evaluate((element) => element.getAnimations()[0].finish());
  await expect(toast).toHaveCount(0);
});

test("Toast dismissal also completes when exit animations are disabled", async ({
  page,
}) => {
  await page.goto("/?component=toast");
  await page.addStyleTag({
    content: ".gc-toast[data-phase=closing] { animation: none; }",
  });
  await page.getByRole("button", { name: "오류 알림", exact: true }).click();
  const toast = page.locator(".gc-toast-viewport .gc-toast");
  await toast.getByRole("button", { name: /알림 닫기/ }).click();
  await expect(toast).toHaveCount(0);
});
