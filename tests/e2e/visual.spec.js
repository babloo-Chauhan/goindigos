import { expect, test } from "@playwright/test";
import { gotoReady } from "./helpers";

const PAGES = [
  ["about", "/about"],
  ["careers", "/careers"],
  ["compare-empty", "/compare"],
  ["jobs", "/jobs"],
];

test.describe("how pages look", () => {
  for (const [name, route] of PAGES) {
    test(`${name} matches its reference screenshot`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await gotoReady(page, route);
      // The mask below covers the header's 3D canvas, so the canvas has to exist before the screenshot.
      await expect(page.locator(".page-header canvas")).toHaveCount(1);
      await page.waitForFunction(async () => {
        await document.fonts.ready;
        return [...document.images].every((image) => image.loading === "lazy" || (image.complete && image.naturalWidth > 0));
      });
      await expect(page).toHaveScreenshot(`${name}.png`, {
        animations: "disabled",
        mask: [page.locator("canvas")],
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
