import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/fixtures/stepper-contract.html");
});

test("rejected changes never replace the parent's committed value", async ({
  page,
}) => {
  const input = page.getByRole("spinbutton", {
    name: "변경 거절",
    exact: true,
  });
  const increase = page.getByRole("button", { name: "변경 거절 늘리기" });
  await increase.click();
  await expect(input).toHaveValue("1");
  await increase.click();
  await expect(page.getByTestId("requests")).toHaveText("[2,2]");
  await input.fill("7");
  await expect(input).toHaveValue("7");
  await input.press("Enter");
  await expect(input).toHaveValue("1");
  await input.fill("8");
  await page.getByRole("button", { name: "입력 종료", exact: true }).click();
  await expect(input).toHaveValue("1");
  await expect(page.getByTestId("requests")).toHaveText("[2,2,7,8]");
});

test("delayed approval displays the accepted value until the parent updates", async ({
  page,
}) => {
  const input = page.getByRole("spinbutton", {
    name: "승인 대기",
    exact: true,
  });
  await page.getByRole("button", { name: "승인 대기 늘리기" }).click();
  await expect(page.getByTestId("pending")).toHaveText("2");
  await expect(input).toHaveValue("1");
  await page.getByRole("button", { name: "요청 승인", exact: true }).click();
  await expect(input).toHaveValue("2");
  await input.fill("5");
  await input.press("Enter");
  await expect(page.getByTestId("pending")).toHaveText("5");
  await expect(input).toHaveValue("2");
  await page.getByRole("button", { name: "요청 승인", exact: true }).click();
  await expect(input).toHaveValue("5");
});

test("buttons, End and direct edits share the last valid step below max", async ({
  page,
}) => {
  const input = page.getByRole("spinbutton", {
    name: "유효 상한",
    exact: true,
  });
  const increase = page.getByRole("button", { name: "유효 상한 늘리기" });
  await expect(input).toHaveValue("9");
  await expect(increase).toBeDisabled();
  await page.getByRole("button", { name: "유효 상한 줄이기" }).click();
  await expect(input).toHaveValue("6");
  await increase.click();
  await expect(input).toHaveValue("9");
  await input.press("Home");
  await expect(input).toHaveValue("0");
  await input.press("End");
  await expect(input).toHaveValue("9");
  await input.fill("10");
  await input.press("Enter");
  await expect(input).toHaveValue("9");
  expect(
    await input.evaluate((element: HTMLInputElement) => ({
      isValid: element.checkValidity(),
      hasStepMismatch: element.validity.stepMismatch,
    })),
  ).toEqual({ isValid: true, hasStepMismatch: false });
});

test("decimal and scientific notation steps preserve their exact grid", async ({
  page,
}) => {
  const tiny = page.getByRole("spinbutton", { name: "작은 간격", exact: true });
  for (const expected of [1e-13, 2e-13, 3e-13]) {
    await page.getByRole("button", { name: "작은 간격 늘리기" }).click();
    expect(Number(await tiny.inputValue())).toBe(expected);
  }
  await expect(
    page.getByRole("button", { name: "작은 간격 늘리기" }),
  ).toBeDisabled();
  await tiny.fill("0.00000000000014");
  await tiny.press("Enter");
  expect(Number(await tiny.inputValue())).toBe(1e-13);
  const decimal = page.getByRole("spinbutton", {
    name: "음수 시작 소수",
    exact: true,
  });
  await decimal.press("End");
  await expect(decimal).toHaveValue("0.15");
  await decimal.press("ArrowDown");
  await expect(decimal).toHaveValue("0.05");
  await decimal.fill("-0.2");
  await decimal.press("Enter");
  await expect(decimal).toHaveValue("-0.15");
  const tenth = page.getByRole("spinbutton", {
    name: "십진수 간격",
    exact: true,
  });
  for (let index = 0; index < 3; index++)
    await page.getByRole("button", { name: "십진수 간격 늘리기" }).click();
  await expect(tenth).toHaveValue("0.3");
  for (const input of [tiny, decimal, tenth])
    expect(
      await input.evaluate(
        (element: HTMLInputElement) => element.validity.stepMismatch,
      ),
    ).toBe(false);
});
