import { expect, test } from "@playwright/test";

test("desktop navigation releases mobile modal effects after crossing the breakpoint", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/?component=button");
  await page.getByRole("button", { name: "목록 열기", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "컴포넌트 목록" }),
  ).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("inert");

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("main")).not.toHaveAttribute("inert");
  await expect(page.locator("aside")).not.toHaveAttribute("role", "dialog");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  const reviewButton = page.locator(".review-button");
  const isReviewedInitially =
    (await reviewButton.getAttribute("aria-pressed")) === "true";
  await reviewButton.click();
  await expect(reviewButton).toHaveAttribute(
    "aria-pressed",
    String(!isReviewedInitially),
  );

  // Returning to mobile starts closed rather than restoring a stale modal request.
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole("dialog", { name: "컴포넌트 목록" })).toHaveCount(
    0,
  );
  await expect(page.locator("main")).not.toHaveAttribute("inert");
  await page.getByRole("button", { name: "목록 열기", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "목록 열기", exact: true }),
  ).toBeFocused();
});

test("a completed save preserves clicks made while its simulation was pending", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/?component=button");
  await page.getByRole("button", { name: "저장하기", exact: true }).click();
  await page.getByRole("button", { name: "즐겨찾기", exact: true }).click();
  await page.getByRole("button", { name: "메뉴 열기", exact: true }).click();
  await expect(page.getByText("로컬 저장 시뮬레이션 · 실행 2회")).toBeVisible();
  await page.clock.runFor(1000);
  await expect(page.getByText("로컬 저장 시뮬레이션 · 실행 3회")).toBeVisible();
});
