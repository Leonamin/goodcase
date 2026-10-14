import { test, expect } from "@playwright/test";

// User-approved relationships (2026-10-14): square centred icon controls,
// soft square checkbox + stronger choice borders, ghost close, borderless progress sizes.
async function iconGeometry(button: import("@playwright/test").Locator) {
  return button.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const icon = element.querySelector("svg")!.getBoundingClientRect();
    return {
      width: box.width,
      height: box.height,
      dx: icon.x + icon.width / 2 - box.x - box.width / 2,
      dy: icon.y + icon.height / 2 - box.y - box.height / 2,
    };
  });
}
function isCentered(geometry: Awaited<ReturnType<typeof iconGeometry>>) {
  return Math.abs(geometry.dx) < 1 && Math.abs(geometry.dy) < 1;
}

test("Lucide icon buttons are square and geometrically centred at both densities", async ({
  page,
}) => {
  await page.goto("/?component=button");
  const button = page.getByRole("button", { name: "즐겨찾기", exact: true });
  for (const density of ["comfortable", "compact"]) {
    await page.getByLabel("밀도", { exact: true }).selectOption(density);
    const actual = await iconGeometry(button);
    expect(actual.width).toBe(actual.height);
    expect(isCentered(actual), JSON.stringify(actual)).toBe(true);
  }
  // Prove that the measurement catches the reported class of defect.
  await button
    .locator("svg")
    .evaluate((icon) => (icon.style.transform = "translateY(4px)"));
  expect(isCentered(await iconGeometry(button))).toBe(false);
  await button.locator("svg").evaluate((icon) => (icon.style.transform = ""));
  expect(isCentered(await iconGeometry(button))).toBe(true);
});

test("custom choice styling preserves mixed selection and native radio keyboard behaviour", async ({
  page,
}) => {
  await page.goto("/?component=checkbox");
  const all = page.getByRole("checkbox", { name: "전체 알림 선택" });
  expect(
    await all.evaluate(
      (element) => (element as HTMLInputElement).indeterminate,
    ),
  ).toBe(true);
  const styles = await all.evaluate((element) => ({
    radius: parseFloat(getComputedStyle(element).borderRadius),
    border: parseFloat(getComputedStyle(element).borderTopWidth),
  }));
  expect(styles.radius).toBeGreaterThan(0);
  expect(styles.border).toBeGreaterThan(1);
  await all.press("Space");
  await expect(
    page.getByRole("checkbox", { name: "새 댓글 알림" }),
  ).toBeChecked();
  await page.goto("/?component=radio-group");
  const weekly = page.getByRole("radio", { name: "일주일에 한 번 받기" });
  expect(
    await weekly.evaluate((element) =>
      parseFloat(getComputedStyle(element).borderTopWidth),
    ),
  ).toBeGreaterThan(1);
  await weekly.focus();
  await weekly.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "받지 않기" })).toBeChecked();
  await page.goto("/?component=switch");
  expect(
    await page
      .getByRole("switch", { name: "이메일 알림" })
      .evaluate((element) => getComputedStyle(element).cursor),
  ).toBe("pointer");
});

test("alert close is muted ghost at rest and remains actionable", async ({
  page,
}) => {
  await page.goto("/?component=alert");
  const close = page.getByRole("button", { name: "알림 닫기" });
  const rest = await close.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      border: style.borderTopColor,
      color: style.color,
      muted: getComputedStyle(document.documentElement)
        .getPropertyValue("--gc-text-muted")
        .trim(),
    };
  });
  expect(rest.background).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  const geometry = await iconGeometry(close);
  expect(isCentered(geometry), JSON.stringify(geometry)).toBe(true);
  await close.hover();
  await expect
    .poll(() =>
      close.evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .not.toBe(rest.background);
  await close.click();
  await expect(
    page.getByRole("button", { name: "알림 다시 표시" }),
  ).toBeVisible();
});

test("progress has borderless thin, regular, thick variants and correct range semantics", async ({
  page,
}) => {
  await page.goto("/?component=progress");
  const bars = page.locator(".preview-canvas").getByRole("progressbar");
  const sizes = await bars.evaluateAll((elements) =>
    elements.map((element) => ({
      height: element.getBoundingClientRect().height,
      border: getComputedStyle(element).borderTopWidth,
      value: element.getAttribute("aria-valuenow"),
    })),
  );
  expect(sizes.length).toBeGreaterThanOrEqual(4);
  expect(sizes.every((size) => size.border === "0px")).toBe(true);
  const distinctHeights = [...new Set(sizes.map((size) => size.height))].sort(
    (a, b) => a - b,
  );
  expect(distinctHeights.length).toBeGreaterThanOrEqual(3);
  expect(sizes.some((size) => size.value === null)).toBe(true);
  const range = page.locator('.preview-canvas input[type="range"]');
  await range.fill("0");
  await expect(page.locator(".gc-progress-thick").first()).toContainText("0%");
  await range.fill("100");
  await expect(page.locator(".gc-progress-thick").first()).toContainText(
    "100%",
  );
});
