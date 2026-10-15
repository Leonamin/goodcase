import { test, expect } from "@playwright/test";

test("dialog loops both ways while nested combobox focus cleanup is pending", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/?component=dialog");
  const trigger = page.getByRole("button", { name: "프로필 편집" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "프로필 편집" });
  const combo = dialog.getByRole("combobox", { name: "방문 지역 검색" });
  const close = dialog.getByRole("button", { name: "닫기", exact: true });
  const done = dialog.getByRole("button", { name: "완료", exact: true });
  await dialog.evaluate((element) => {
    const hidden = document.createElement("button");
    hidden.hidden = true;
    hidden.textContent = "숨긴 액션";
    const inert = document.createElement("div");
    inert.inert = true;
    const inertAction = document.createElement("button");
    inertAction.textContent = "비활성 영역 액션";
    inert.append(inertAction);
    element.prepend(hidden);
    element.append(inert);
  });
  await combo.focus();
  await expect(
    page.getByRole("listbox", { name: "방문 지역 검색" }),
  ).toBeVisible();
  // Keep Radix's deferred scope cleanup pending to reproduce rapid key presses reliably.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "이름 초기화" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(done).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(done).toBeFocused();
  await page.clock.resume();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

for (const width of [1440, 375]) {
  test(`modal boundary loops preserve nested Select and Popover keyboard behavior at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/tests/fixtures/dialog-focus.html");
    for (const name of ["Dialog", "Drawer"]) {
      const trigger = page.getByRole("button", { name: `${name} 열기` });
      await trigger.click();
      const modal = page.getByRole("dialog", {
        name: `중첩 ${name}`,
        exact: true,
      });
      const select = modal.getByRole("combobox", { name: "항목 선택" });
      await select.click();
      await expect(page.getByRole("listbox")).toBeVisible();
      await page.keyboard.press("Home");
      await expect(page.getByRole("option", { name: "첫 항목" })).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(
        page.getByRole("option", { name: "다음 항목" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(select).toHaveText("다음 항목");
      await expect(select).toBeFocused();
      await modal
        .getByRole("button", { name: "추가 설정", exact: true })
        .click();
      const popover = page.getByRole("dialog", {
        name: "추가 설정",
        exact: true,
      });
      const popoverClose = popover.getByRole("button", { name: "닫기" });
      await expect(popoverClose).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(
        popover.getByRole("button", { name: "설정 액션" }),
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(popoverClose).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(popover).not.toBeVisible();
      await expect(modal).toBeVisible();
      await expect(
        modal.getByRole("button", { name: "추가 설정", exact: true }),
      ).toBeFocused();
      const done = modal.getByRole("button", { name: "완료" });
      await done.focus();
      await page.keyboard.press("Tab");
      await expect(modal.getByRole("button", { name: "닫기" })).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(done).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
  });

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
