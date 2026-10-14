import { test, expect } from "@playwright/test";

test("all tab variants preserve manual keyboard activation and disabled skipping", async ({
  page,
}) => {
  await page.goto("/?component=tabs");
  const cases = [
    { list: "기본 탭 예제", first: "개요", second: "활동 기록" },
    { list: "확장형 탭 예제", first: "홈", second: "활동 알림" },
    { list: "분할형 탭 예제", first: "내 프로필", second: "받은 알림" },
    { list: "하단형 탭 예제", first: "시작 화면", second: "소식 모음" },
  ];
  for (const entry of cases) {
    const list = page.getByRole("tablist", { name: entry.list });
    const first = list.getByRole("tab", { name: entry.first });
    const second = list.getByRole("tab", { name: entry.second });
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(second).toBeFocused();
    await expect(first).toHaveAttribute("aria-selected", "true");
    await expect(second).toHaveAttribute("aria-selected", "false");
    await page.keyboard.press("Enter");
    await expect(second).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    const last = list.locator('[role="tab"]:not(:disabled)').last();
    await expect(last).toBeFocused();
    await expect(list.getByRole("tab").last()).toBeDisabled();
    await page.keyboard.press("Space");
    await expect(last).toHaveAttribute("aria-selected", "true");
  }
});

test("adaptive actual text width expands, hidden labels remain named, controlled state updates", async ({
  page,
}) => {
  await page.goto("/?component=tabs");
  const list = page.getByRole("tablist", { name: "확장형 탭 예제" });
  const home = list.getByRole("tab", { name: "홈", exact: true });
  const long = list.getByRole("tab", {
    name: "한국어로 길게 작성한 읽기 목록",
    exact: true,
  });
  const inactiveWidth = await long.evaluate(
    (el) => el.getBoundingClientRect().width,
  );
  await expect(long.locator(".gc-tabs-label")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await long.click();
  await expect(long).toHaveAttribute("aria-selected", "true");
  await expect(home).toHaveAttribute("aria-selected", "false");
  await expect
    .poll(() => long.evaluate((el) => el.getBoundingClientRect().width))
    .toBeGreaterThan(inactiveWidth + 100);
  await expect
    .poll(() =>
      long.evaluate((el) =>
        Math.abs(
          el.getBoundingClientRect().width -
            (20 +
              32 +
              8 +
              Number.parseFloat(
                (el as HTMLElement).style.getPropertyValue(
                  "--gc-tab-label-width",
                ),
              )),
        ),
      ),
    )
    .toBeLessThan(2);
  await list.getByRole("tab", { name: "활동 알림" }).click();
  await expect(
    page.getByText("활동 알림 12개. 확정한 선택값: activity"),
  ).toBeVisible();
  await expect
    .poll(() => long.evaluate((el) => el.getBoundingClientRect().width))
    .toBeLessThan(inactiveWidth + 2);
  await expect(long).toHaveAccessibleName("한국어로 길게 작성한 읽기 목록");
});

test("320px long Korean variants scroll locally and retain focused tab clearance", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/?component=tabs");
  const list = page.getByRole("tablist", { name: "확장형 탭 예제" });
  await list
    .getByRole("tab", { name: "한국어로 길게 작성한 읽기 목록" })
    .click();
  await expect
    .poll(() =>
      list
        .getByRole("tab", { name: "한국어로 길게 작성한 읽기 목록" })
        .evaluate((el) => {
          const tab = el.getBoundingClientRect();
          const bounds = el.parentElement!.getBoundingClientRect();
          return tab.left >= bounds.left + 4 && tab.right <= bounds.right - 4;
        }),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    )
    .toBe(true);
  for (const label of [
    "기본 탭 예제",
    "확장형 탭 예제",
    "분할형 탭 예제",
    "하단형 탭 예제",
  ]) {
    const group = page.getByRole("tablist", { name: label });
    const target = group.locator('[role="tab"]:not(:disabled)').last();
    await target.focus();
    await expect(target).toBeFocused();
    const geometry = await target.evaluate((el) => {
      const list = el.parentElement!;
      const rect = el.getBoundingClientRect();
      const viewport = list.getBoundingClientRect();
      return {
        right: rect.right,
        viewportRight: viewport.right,
        padding: parseFloat(getComputedStyle(list).paddingRight),
        scrollWidth: document.documentElement.scrollWidth,
        width: window.innerWidth,
      };
    });
    expect(geometry.padding).toBeGreaterThanOrEqual(6);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewportRight - 4);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
  }
});

test("reduced motion removes adaptive width transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?component=tabs");
  const list = page.getByRole("tablist", { name: "확장형 탭 예제" });
  const long = list.getByRole("tab", {
    name: "한국어로 길게 작성한 읽기 목록",
  });
  await expect(long).toHaveCSS("transition-duration", "0s");
  await expect(long.locator(".gc-tabs-label")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await long.click();
  await expect(long).toHaveAttribute("aria-selected", "true");
});
