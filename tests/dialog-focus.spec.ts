import { test, expect } from "@playwright/test";

for (const width of [1440, 375]) {
  test(`dialog focus rings have safe space and nested combobox preserves dialog at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?component=dialog");
    await page.getByRole("button", { name: "프로필 편집" }).click();
    const dialog = page.getByRole("dialog", { name: "프로필 편집" });
    const field = dialog.getByLabel("표시 이름");
    await field.focus();
    await expect(field).toBeFocused();
    const actual = await field.evaluate((element) => {
      const control = element.getBoundingClientRect();
      const body = element.closest(".gc-modal-body")!.getBoundingClientRect();
      const style = getComputedStyle(element);
      const ring =
        parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
      const next = element
        .closest(".gc-field")!
        .nextElementSibling!.getBoundingClientRect();
      return {
        ring,
        left: control.left - body.left,
        right: body.right - control.right,
        top: control.top - body.top,
        bottomGap: next.top - control.bottom,
      };
    });
    for (const gap of [actual.left, actual.right, actual.top, actual.bottomGap])
      expect(gap).toBeGreaterThanOrEqual(actual.ring);
    const combo = dialog.getByRole("combobox", { name: "방문 지역 검색" });
    await combo.focus();
    await expect(
      page.getByRole("listbox", { name: "방문 지역 검색" }),
    ).toBeVisible();
    await combo.fill("부산");
    await combo.press("Enter");
    await expect(combo).toHaveValue("부산");
    await combo.click();
    await combo.press("Escape");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "이름 초기화" }).focus();
    const buttonGap = await dialog
      .getByRole("button", { name: "이름 초기화" })
      .evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const next = element.nextElementSibling!.getBoundingClientRect();
        const css = getComputedStyle(element);
        return {
          gap: next.left - rect.right,
          ring: parseFloat(css.outlineWidth) + parseFloat(css.outlineOffset),
        };
      });
    expect(buttonGap.gap).toBeGreaterThanOrEqual(buttonGap.ring);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "프로필 편집" }),
    ).toBeFocused();
  });
}
