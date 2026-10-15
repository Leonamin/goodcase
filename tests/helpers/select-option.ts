import { type Locator } from "@playwright/test";

export async function selectOption(control: Locator, value: string) {
  await control.click();
  await control
    .page()
    .getByRole("option")
    .and(control.page().locator(`[data-value=${JSON.stringify(value)}]`))
    .click();
}
