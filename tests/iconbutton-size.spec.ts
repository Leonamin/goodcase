import { selectOption } from "./helpers/select-option";
import { test, expect } from "@playwright/test";
test("compact icon buttons stay 24px, centered and keyboard actionable at narrow width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/?component=button");
  const compact = page.getByRole("button", {
    name: "작은 즐겨찾기",
    exact: true,
  });
  for (const density of ["comfortable", "compact"]) {
    await selectOption(page.getByLabel("밀도", { exact: true }), density);
    const sizes = await compact.evaluate((element) => {
      const b = element.getBoundingClientRect();
      const i = element.querySelector("svg")!.getBoundingClientRect();
      return {
        width: b.width,
        height: b.height,
        dx: i.x + i.width / 2 - b.x - b.width / 2,
        dy: i.y + i.height / 2 - b.y - b.height / 2,
      };
    });
    expect(sizes.width).toBe(24);
    expect(sizes.height).toBe(24);
    expect(Math.abs(sizes.dx)).toBeLessThan(1);
    expect(Math.abs(sizes.dy)).toBeLessThan(1);
    const normal = page.getByRole("button", { name: "즐겨찾기", exact: true });
    expect(await normal.evaluate((e) => e.getBoundingClientRect().width)).toBe(
      density === "compact" ? 34 : 40,
    );
  }
  await compact.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(compact).toBeFocused();
  expect(
    await compact.evaluate((e) => getComputedStyle(e).outlineStyle),
  ).not.toBe("none");
  await compact.press("Enter");
  await expect(page.getByText("로컬 저장 시뮬레이션 · 실행 1회")).toBeVisible();
});
