import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { selectOption } from "./helpers/select-option";

test("numeric TextField hides browser spinners and keeps keyboard editing", async ({
  page,
}) => {
  await page.goto("/?component=text-field");
  const field = page.getByRole("spinbutton", { name: "숫자 입력" });
  await expect(field).toHaveCSS("appearance", "textfield");
  await field.fill("20");
  await field.press("ArrowUp");
  await expect(field).toHaveValue("21");
  await field.press("ArrowDown");
  await expect(field).toHaveValue("20");
});

test("Stepper buttons, direct edits, limits and keyboard commit controlled values", async ({
  page,
}) => {
  await page.goto("/?component=stepper");
  const input = page.getByRole("spinbutton", { name: "수량", exact: true });
  const increase = page.getByRole("button", {
    name: "수량 늘리기",
    exact: true,
  });
  const decrease = page.getByRole("button", {
    name: "수량 줄이기",
    exact: true,
  });
  await increase.click();
  await expect(input).toHaveValue("2");
  await decrease.click();
  await expect(input).toHaveValue("1");
  await input.fill("99");
  await input.press("Enter");
  await expect(input).toHaveValue("10");
  await expect(increase).toBeDisabled();
  await expect(
    page.getByText("선택한 수량 10개", { exact: false }),
  ).toBeVisible();
  await input.press("Home");
  await expect(input).toHaveValue("0");
  await expect(decrease).toBeDisabled();
  await input.press("ArrowUp");
  await expect(input).toHaveValue("1");
  await input.press("End");
  await expect(input).toHaveValue("10");
  await input.fill("-20");
  await input.press("Tab");
  await expect(input).toHaveValue("0");
});

test("Stepper decimal steps, empty edits and read-only/disabled states stay usable", async ({
  page,
}) => {
  await page.goto("/?component=stepper");
  const input = page.getByRole("spinbutton", {
    name: "소수 단위",
    exact: true,
  });
  const increase = page.getByRole("button", { name: "소수 단위 늘리기" });
  for (let index = 0; index < 5; index++) await increase.click();
  await expect(input).toHaveValue("1");
  await input.fill("");
  await input.press("Enter");
  await expect(input).toHaveValue("1");
  await input.fill("0.26");
  await input.press("Tab");
  await expect(input).toHaveValue("0.3");
  const readonly = page.getByRole("spinbutton", {
    name: "읽기 전용 수량",
    exact: true,
  });
  await expect(readonly).toHaveAttribute("readonly", "");
  await readonly.focus();
  await readonly.press("ArrowUp");
  await expect(readonly).toHaveValue("4");
  await expect(
    page.getByRole("button", { name: "읽기 전용 수량 늘리기" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("spinbutton", { name: "비활성 수량", exact: true }),
  ).toBeDisabled();
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const density of ["comfortable", "compact"]) {
      await selectOption(
        page.getByRole("combobox", { name: "밀도", exact: true }),
        density,
      );
      const geometry = await increase.evaluate((el) => {
        const icon = el.querySelector("svg")!.getBoundingClientRect();
        const box = el.getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          dx: Math.abs(icon.x + icon.width / 2 - box.x - box.width / 2),
          dy: Math.abs(icon.y + icon.height / 2 - box.y - box.height / 2),
        };
      });
      expect(geometry.width).toBe(geometry.height);
      expect(geometry.dx).toBeLessThan(1);
      expect(geometry.dy).toBeLessThan(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
    }
  }
});

test("Accordion animates opening and closing, with instant and reduced-motion modes", async ({
  page,
}) => {
  await page.goto("/?component=accordion");
  const trigger = page.getByRole("button", {
    name: "여러 항목을 동시에 열 수 있나요?",
  });
  await trigger.click();
  const content = page.locator(".gc-accordion [role=region]").first();
  const expanded = await content.evaluate((el) => {
    const animation = el.getAnimations()[0];
    if (!animation) throw new Error("No opening animation");
    animation.pause();
    const duration = Number(animation.effect!.getComputedTiming().duration);
    animation.currentTime = 0;
    const start = el.getBoundingClientRect().height;
    animation.currentTime = duration * 0.5;
    const middle = el.getBoundingClientRect().height;
    animation.finish();
    return { start, middle, end: el.getBoundingClientRect().height };
  });
  expect(expanded.middle).toBeGreaterThan(expanded.start);
  expect(expanded.end).toBeGreaterThan(expanded.middle);
  await trigger.click();
  await expect(content).toHaveAttribute("data-state", "closed");
  expect(
    await content.evaluate((el) => el.getAnimations().length),
  ).toBeGreaterThan(0);
  await expect(content).toBeHidden();
  await page.getByRole("switch", { name: "애니메이션 사용" }).uncheck();
  await trigger.click();
  await expect(content).toBeVisible();
  expect(await content.evaluate((el) => el.getAnimations().length)).toBe(0);
  await trigger.click();
  await expect(content).toBeHidden();
  await page.getByRole("switch", { name: "애니메이션 사용" }).check();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await trigger.click();
  await expect(content).toBeVisible();
  expect(await content.evaluate((el) => el.getAnimations().length)).toBe(0);
  await expect(
    page.getByRole("button", { name: "비활성 항목" }),
  ).toBeDisabled();
});

test("preview toolbar uses shared Select and preserves theme, cancellation and content", async ({
  page,
}) => {
  for (const file of ["src/App.tsx", "src/catalog/toast.tsx"]) {
    expect(await readFile(file, "utf8"), file).not.toMatch(/<select\b/);
  }
  await page.goto("/?component=text-field");
  const input = page.getByRole("textbox", { name: "프로젝트 이름" });
  await input.fill("선택을 바꿔도 유지");
  const theme = page.getByRole("combobox", { name: "테마", exact: true });
  await expect(theme).toHaveClass(/gc-select/);
  await theme.click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(theme).toBeFocused();
  await expect(theme).toHaveText("기본 · Blue");
  await selectOption(theme, "forest");
  await selectOption(
    page.getByRole("combobox", { name: "색상 모드", exact: true }),
    "dark",
  );
  await selectOption(
    page.getByRole("combobox", { name: "밀도", exact: true }),
    "compact",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "forest");
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
  await expect(input).toHaveValue("선택을 바꿔도 유지");
});
