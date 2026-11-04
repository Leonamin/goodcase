import { expect, test } from "@playwright/test";

test("thick Slider with marks steps by 25 and highlights the hovered step dot", async ({
  page,
}) => {
  await page.goto("/?component=slider");
  const slider = page.getByRole("slider", { name: "두꺼운 트랙 · 단계 표시" });
  await expect(slider).toHaveAttribute("data-marks", "true");
  await expect(slider).toHaveCSS("--gc-slider-mark-count", "4");

  await slider.focus();
  await slider.press("Home");
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("25");

  // Thick track and thumb come from tokens, not the regular 6px/20px values.
  await expect(slider).toHaveCSS("--gc-slider-thumb-size", "28px");

  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(slider).toHaveCSS("--gc-slider-hover-ratio", "0.5");
  await page.mouse.move(box.x + box.width + 40, box.y + box.height / 2);
  await expect(slider).toHaveCSS("--gc-slider-hover-ratio", "-1");
});
