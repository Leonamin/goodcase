import { test, expect } from "@playwright/test";

test("same-source consecutive viewer images remain loaded and reset zoom", async ({
  page,
}) => {
  await page.goto("/?component=image-viewer");
  await page.getByLabel("같은 원본의 연속 이미지").check();
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  await dialog.getByRole("button", { name: "확대", exact: true }).click();
  await expect(dialog.getByText("150%", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "다음 →" }).click();
  await expect(
    dialog.getByRole("img", { name: "같은 원본의 두 번째 이미지" }),
  ).toHaveAttribute("alt", "같은 원본의 두 번째 이미지");
  await expect(
    dialog.getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  await expect(dialog.getByText("100%", { exact: true })).toBeVisible();
  await expect(dialog.getByText("이미지를 불러오는 중…")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "다음 →" })).toBeDisabled();
});

test("empty viewer has explicit state and no permanent loading", async ({
  page,
}) => {
  await page.goto("/?component=image-viewer");
  await page.getByLabel("빈 이미지 목록").check();
  await page.getByRole("button", { name: "이미지 뷰어 열기" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("표시할 이미지가 없습니다.")).toBeVisible();
  await expect(dialog.getByText("이미지를 불러오는 중…")).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "확대", exact: true }),
  ).toBeDisabled();
});

test("failed thumbnail recovers when same stable ID receives corrected source", async ({
  page,
}) => {
  await page.goto("/?component=image-gallery");
  const toggle = page.getByLabel(
    "첫 썸네일 실패시키기 · 해제하면 같은 ID로 복구",
  );
  const thumbnail = page.locator(".gc-gallery-item").first();
  await expect(thumbnail.locator("img")).toBeVisible();
  await toggle.check();
  await expect(thumbnail.getByText("이미지 없음")).toBeVisible();
  await toggle.uncheck();
  await expect(thumbnail.locator("img")).toBeVisible();
  await expect(thumbnail.getByText("이미지 없음")).toHaveCount(0);
  await expect
    .poll(() =>
      thumbnail
        .locator("img")
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await thumbnail.click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "확대", exact: true }),
  ).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(thumbnail).toBeFocused();
});
