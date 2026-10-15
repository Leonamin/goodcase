import { test, expect } from "@playwright/test";
import { selectOption } from "./helpers/select-option";

test("theme changes preserve rounded controls and popup geometry at desktop and mobile", async ({
  page,
}) => {
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?component=stepper");
    const controls = page.locator(".preview-toolbar .gc-select");
    const original = await controls.evaluateAll((elements) =>
      elements.map((el) => getComputedStyle(el).borderRadius),
    );
    expect(original.every((radius) => parseFloat(radius) > 0)).toBe(true);
    for (const theme of ["forest", "reference"]) {
      await selectOption(
        page.getByRole("combobox", { name: "테마", exact: true }),
        theme,
      );
      expect(
        await controls.evaluateAll((elements) =>
          elements.map((el) => getComputedStyle(el).borderRadius),
        ),
      ).toEqual(original);
      const color = page.getByRole("combobox", {
        name: "색상 모드",
        exact: true,
      });
      await color.click();
      await expect(page.getByRole("listbox")).toHaveCSS(
        "border-radius",
        original[0],
      );
      await page.keyboard.press("Escape");
      await expect(color).toBeFocused();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
    }
  }
});

test("Slider keeps native range keyboard behavior through theme and density changes", async ({
  page,
}) => {
  await page.goto("/?component=slider");
  const slider = page.getByRole("slider", { name: "볼륨" });
  await slider.focus();
  await slider.press("Home");
  await expect(slider).toHaveValue("0");
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("1");
  await slider.press("End");
  await expect(slider).toHaveValue("100");
  await expect(slider).toHaveAttribute("aria-valuetext", "100%");
  await expect(
    page.getByRole("slider", { name: "비활성 범위" }),
  ).toBeDisabled();
  await selectOption(
    page.getByRole("combobox", { name: "테마", exact: true }),
    "forest",
  );
  await selectOption(
    page.getByRole("combobox", { name: "색상 모드", exact: true }),
    "dark",
  );
  await selectOption(
    page.getByRole("combobox", { name: "밀도", exact: true }),
    "compact",
  );
  await expect(slider).toHaveValue("100");
  await slider.press("ArrowLeft");
  await expect(slider).toHaveValue("99");
});

test("shared Checkbox preserves table mixed selection and labelled demo controls", async ({
  page,
}) => {
  await page.goto("/?component=data-table");
  const all = page.getByRole("checkbox", { name: "현재 페이지 전체 선택" });
  const row = page.getByRole("checkbox", { name: /행 선택/ }).first();
  await row.check();
  await expect(all).toHaveJSProperty("indeterminate", true);
  await all.check();
  await expect(all).toBeChecked();
  await expect(all).toHaveJSProperty("indeterminate", false);
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(all).not.toBeChecked();
  await expect(all).toHaveJSProperty("indeterminate", false);
  await page.goto("/?component=combobox");
  const loading = page.getByRole("checkbox", {
    name: "로딩 상태 보기 (로컬 예제)",
  });
  await expect(loading).toHaveClass("gc-checkbox-input");
  await loading.check();
  await page.getByRole("combobox", { name: "지역 검색" }).focus();
  await expect(page.getByRole("status")).toHaveText("목록을 불러오는 중…");
});

test("file chooser is opened by shared Button and selection remains separate from upload", async ({
  page,
}) => {
  await page.goto("/?component=file-uploader");
  const button = page.getByRole("button", { name: "파일 선택", exact: true });
  await expect(button).toHaveClass(/gc-button/);
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    button.click(),
  ]);
  await chooser.setFiles({
    name: "shared-picker.png",
    mimeType: "image/png",
    buffer: Buffer.from([1, 2, 3]),
  });
  await expect(
    page.getByText("shared-picker.png", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "선택됨 · 아직 업로드하지 않음",
  );
  await expect(
    page.getByRole("button", { name: "선택한 파일 업로드", exact: true }),
  ).toBeEnabled();
});

test("FormField uses the same Input shape and keeps required/error association", async ({
  page,
}) => {
  await page.goto("/?component=form-field");
  const field = page.getByRole("textbox", { name: "프로젝트 이름" });
  await expect(field).toHaveClass(/gc-input/);
  await expect(field).toHaveAttribute("required", "");
  await field.fill("아".repeat(31));
  await expect(field).toHaveAttribute("aria-invalid", "true");
  const helpId = await field.getAttribute("aria-describedby");
  await expect(page.locator(`[id=${JSON.stringify(helpId)}]`)).toHaveText(
    "30자 이하로 입력해주세요.",
  );
});
