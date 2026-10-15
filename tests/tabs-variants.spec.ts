import { selectOption } from "./helpers/select-option";
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

// Scope: the actual gallery route. User requirements: no phantom adaptive scroll,
// centered bottom labels independent of badges, and smooth motion with an opt-out.
test("adaptive measures stay outside scroll geometry and leave only focus padding", async ({
  page,
}) => {
  await page.goto("/?component=tabs");
  await page.evaluate(() => document.fonts.ready);
  const list = page.getByRole("tablist", { name: "확장형 탭 예제" });
  const overflow = () => list.evaluate((el) => el.scrollWidth - el.clientWidth);
  for (const name of ["홈", "활동 알림", "한국어로 길게 작성한 읽기 목록"]) {
    await list.getByRole("tab", { name }).click();
    await expect.poll(overflow).toBeLessThanOrEqual(1);
    await expect
      .poll(() =>
        list.evaluate((el) => {
          const styles = getComputedStyle(el);
          return Math.abs(
            el.getBoundingClientRect().right -
              el.lastElementChild!.getBoundingClientRect().right -
              parseFloat(styles.paddingRight) -
              parseFloat(styles.borderRightWidth),
          );
        }),
      )
      .toBeLessThan(1);
  }
  await expect(list).toHaveCSS("scrollbar-width", "none");
  // Negative control: reproduce the original overflowing measurement on the last tab.
  await list
    .locator(".gc-tabs-measure-clip")
    .last()
    .evaluate((el) => ((el as HTMLElement).style.overflow = "visible"));
  expect(await overflow()).toBeGreaterThan(1);
  await list
    .locator(".gc-tabs-measure-clip")
    .last()
    .evaluate((el) => (el as HTMLElement).style.removeProperty("overflow"));
  await expect.poll(overflow).toBeLessThanOrEqual(1);
});

test("bottom dot and count badges preserve label centers at both overflow limits", async ({
  page,
}) => {
  await page.goto("/?component=tabs");
  const list = page.getByRole("tablist", { name: "하단형 탭 예제" });
  const messages = list.getByRole("tab", { name: "소식 모음" });
  const badge = messages.locator(".gc-tabs-icon .gc-tabs-badge");
  const centerError = () =>
    messages.evaluate((el) => {
      const icon = el.querySelector(".gc-tabs-icon")!.getBoundingClientRect();
      const text = el
        .querySelector(".gc-tabs-label > span")!
        .getBoundingClientRect();
      return Math.abs(icon.x + icon.width / 2 - text.x - text.width / 2);
    });
  for (const [count, text] of [
    [1, "1"],
    [99, "99"],
    [100, "99+"],
    [999, "99+"],
    [1000, "99+"],
  ] as const) {
    await page.getByRole("spinbutton", { name: "알림 수" }).fill(String(count));
    await expect(badge).toHaveText(text);
    await expect(messages).toHaveAccessibleName(`소식 모음, ${count}개`);
    expect(await centerError()).toBeLessThan(1);
  }
  await page.getByRole("combobox", { name: "숫자 배지 상한" }).click();
  await page.getByRole("option", { name: "999+", exact: true }).click();
  await expect(badge).toHaveText("999+");
  await page.getByRole("spinbutton", { name: "알림 수" }).fill("999");
  await expect(badge).toHaveText("999");
  expect(await centerError()).toBeLessThan(1);
  // Negative control: putting the count beside the label recreates the off-center text.
  await messages.evaluate((el) =>
    el
      .querySelector(".gc-tabs-label")!
      .append(el.querySelector(".gc-tabs-badge")!),
  );
  expect(await centerError()).toBeGreaterThan(5);
  await messages.evaluate((el) =>
    el
      .querySelector(".gc-tabs-icon")!
      .append(el.querySelector(".gc-tabs-badge")!),
  );
  expect(await centerError()).toBeLessThan(1);
  await page.getByRole("spinbutton", { name: "알림 수" }).fill("0");
  await expect(badge).toHaveCount(0);
  await expect(messages).toHaveAccessibleName("소식 모음");
  const account = list.getByRole("tab", { name: "나의 계정, 새 알림 있음" });
  const dot = account.locator(".gc-tabs-icon .gc-tabs-badge-dot");
  await expect(dot).toBeVisible();
  await expect(dot).toHaveCSS("width", "6px");
  await expect(dot).toHaveCSS("height", "6px");
  const dotColor = await dot.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await account.click();
  await expect(dot).toHaveCSS("background-color", dotColor);
});

test("moving indicators decelerate, retarget continuously, and track resize", async ({
  page,
}) => {
  await page.goto("/?component=tabs");
  await page.evaluate(() => document.fonts.ready);
  for (const name of ["기본 탭 예제", "분할형 탭 예제", "하단형 탭 예제"]) {
    const list = page.getByRole("tablist", { name });
    const start = await list
      .locator(".gc-tabs-indicator")
      .evaluate((el) => el.getBoundingClientRect().left);
    await list.getByRole("tab").nth(1).click();
    const motion = await list.evaluate((el, start) => {
      const tabs = el.querySelectorAll<HTMLButtonElement>(".gc-tabs-trigger");
      const indicator = el.querySelector<HTMLElement>(".gc-tabs-indicator")!;
      const animation = indicator.getAnimations()[0];
      if (!animation) throw new Error("Missing selection animation");
      animation.pause();
      const duration = Number(animation.effect!.getComputedTiming().duration);
      animation.currentTime = duration * 0.65;
      const middle = indicator.getBoundingClientRect().left;
      const end = tabs[1].getBoundingClientRect().left;
      return {
        progress: (middle - start) / (end - start),
        middle,
      };
    }, start);
    expect(motion.progress).toBeGreaterThan(0.85);
    expect(motion.progress).toBeLessThan(1);
    await list.getByRole("tab").nth(0).click();
    const jump = await list
      .locator(".gc-tabs-indicator")
      .evaluate((el, middle) => {
        const reverse = el.getAnimations()[0];
        if (!reverse) throw new Error("Missing reverse animation");
        reverse.pause();
        reverse.currentTime = 0;
        const jump = Math.abs(el.getBoundingClientRect().left - middle);
        reverse.play();
        return jump;
      }, motion.middle);
    expect(jump).toBeLessThan(1);
    await expect
      .poll(() =>
        list.evaluate((el) => {
          const tab = el
            .querySelector<HTMLElement>(
              '.gc-tabs-trigger[data-state="active"]',
            )!
            .getBoundingClientRect();
          const indicator = el
            .querySelector<HTMLElement>(".gc-tabs-indicator")!
            .getBoundingClientRect();
          return Math.max(
            Math.abs(tab.left - indicator.left),
            Math.abs(tab.width - indicator.width),
          );
        }),
      )
      .toBeLessThan(1);
  }
  await selectOption(
    page.getByRole("combobox", { name: "밀도", exact: true }),
    "compact",
  );
  await page.setViewportSize({ width: 320, height: 900 });
  for (const name of ["기본 탭 예제", "분할형 탭 예제", "하단형 탭 예제"]) {
    const list = page.getByRole("tablist", { name });
    await list.getByRole("tab").nth(1).click();
    await expect
      .poll(() =>
        list.evaluate((el) => {
          const tab = el
            .querySelector<HTMLElement>(
              '.gc-tabs-trigger[data-state="active"]',
            )!
            .getBoundingClientRect();
          const indicator = el
            .querySelector<HTMLElement>(".gc-tabs-indicator")!
            .getBoundingClientRect();
          return Math.max(
            Math.abs(tab.left - indicator.left),
            Math.abs(tab.top - indicator.top),
            Math.abs(tab.width - indicator.width),
          );
        }),
      )
      .toBeLessThan(1);
  }
});

test("reduced motion skips selection and panel animations for every variant", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?component=tabs");
  for (const name of [
    "기본 탭 예제",
    "확장형 탭 예제",
    "분할형 탭 예제",
    "하단형 탭 예제",
  ]) {
    const list = page.getByRole("tablist", { name });
    await list.getByRole("tab").nth(1).click();
    expect(
      await list.evaluate(
        (el) => el.parentElement!.getAnimations({ subtree: true }).length,
      ),
    ).toBe(0);
  }
});
