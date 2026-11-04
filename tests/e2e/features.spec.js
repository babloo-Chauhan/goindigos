import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { gotoReady } from "./helpers";

const ACCESSIBILITY_ROUTES = ["/", "/jobs", "/airlines-jobs", "/airport-jobs", "/careers", "/about", "/contact", "/compare", "/jobs/5"];

function jobTitles(page) {
  return page.locator(".job-pass h3:visible");
}

test.describe("shareable job searches", () => {
  test("filters are written to the address and survive a reload", async ({ page }) => {
    await gotoReady(page, "/jobs");
    await page.getByLabel("Location").fill("New Delhi");
    await page.getByLabel("Sort by").selectOption("title");
    await expect(page).toHaveURL(/location=New\+Delhi/);
    await expect(page).toHaveURL(/sort=title/);

    await page.reload();
    await expect(page.getByLabel("Location")).toHaveValue("New Delhi");
    await expect(page.getByLabel("Sort by")).toHaveValue("title");
  });

  test("clearing the filters cleans the address", async ({ page }) => {
    await gotoReady(page, "/jobs?category=pilots");
    await expect(jobTitles(page)).toHaveText(["First Officer"]);
    await page.getByRole("button", { name: /Remove filter/ }).click();
    await expect(page).toHaveURL(/\/jobs$/);
    await expect(jobTitles(page)).toHaveCount(9);
  });

  test("the saved link works again after the filter was turned off", async ({ page }) => {
    await gotoReady(page, "/jobs?saved=1");
    const savedToggle = page.locator(".saved-toggle");
    await expect(savedToggle).toHaveAttribute("aria-pressed", "true");
    await savedToggle.click();
    await expect(savedToggle).toHaveAttribute("aria-pressed", "false");
    await page.locator(".saved-link").click();
    await expect(savedToggle).toHaveAttribute("aria-pressed", "true");
  });

  test("a value typed into the address that the site does not know is ignored", async ({ page }) => {
    await gotoReady(page, "/jobs?category=nope&sort=nope");
    await expect(jobTitles(page)).toHaveCount(9);
    await expect(page.getByLabel("Sort by")).toHaveValue("closing");
  });
});

test("the job list switches between list and grid", async ({ page }) => {
  await gotoReady(page, "/jobs");
  await expect(page.locator(".job-list")).toHaveAttribute("data-layout", "list");
  await page.getByRole("button", { name: "Grid" }).click();
  await expect(page.locator(".job-list")).toHaveAttribute("data-layout", "grid");
});

test.describe("comparing jobs", () => {
  test("compares up to 3 jobs side by side and explains the limit", async ({ page }) => {
    await gotoReady(page, "/jobs");
    for (const title of ["First Officer", "Cabin Crew", "HR Executive"]) {
      await page.getByRole("button", { name: `Compare ${title}`, exact: true }).click();
    }
    await page.getByRole("button", { name: "Compare Customer Service Associate", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "up to 3 jobs" })).toBeVisible();

    await page.getByRole("complementary", { name: "Compare jobs" }).getByRole("link", { name: "Compare jobs" }).click();
    await page.waitForURL("**/compare");
    await expect(page.locator(".compare-table thead th")).toHaveCount(3);
    await expect(page.getByRole("complementary", { name: "Compare jobs" })).toHaveCount(0);

    await page.getByRole("button", { name: "Remove Cabin Crew from comparison" }).click();
    await expect(page.locator(".compare-table thead th")).toHaveCount(2);
    await page.reload();
    await expect(page.locator(".compare-table thead th")).toHaveCount(2);
  });

  test("an empty comparison points back to the jobs", async ({ page }) => {
    await gotoReady(page, "/compare");
    await expect(page.getByText("No jobs to compare yet.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse jobs" })).toHaveAttribute("href", "/jobs");
  });
});

test("recently viewed jobs appear on the job list", async ({ page }) => {
  await gotoReady(page, "/jobs");
  await expect(page.getByRole("heading", { name: "Recently viewed" })).toHaveCount(0);
  await gotoReady(page, "/jobs/5");
  await gotoReady(page, "/jobs");
  const recent = page.getByRole("region", { name: "Recently viewed" });
  await expect(recent.getByRole("link", { name: /First Officer/ })).toHaveAttribute("href", "/jobs/5");
});

test.describe("application drafts", () => {
  async function openForm(page) {
    await page.getByRole("button", { name: "Apply now for First Officer" }).click();
    return page.locator("dialog");
  }

  test("answers come back after a reload, but consent does not", async ({ page }) => {
    await gotoReady(page, "/jobs");
    let dialog = await openForm(page);
    await dialog.getByLabel("Full name").fill("Test Candidate");
    await page.reload();
    await gotoReady(page, "/jobs");
    dialog = await openForm(page);
    await expect(dialog.getByLabel("Full name")).toHaveValue("Test Candidate");
    await expect(dialog.getByRole("checkbox", { includeHidden: true })).not.toBeChecked();
  });

  test("a draft is not visible from a new tab session", async ({ browser }) => {
    const context = await browser.newContext();
    const firstTab = await context.newPage();
    await gotoReady(firstTab, "/jobs");
    const dialog = await openForm(firstTab);
    await dialog.getByLabel("Full name").fill("Test Candidate");

    const secondTab = await context.newPage();
    await gotoReady(secondTab, "/jobs");
    const otherDialog = await openForm(secondTab);
    await expect(otherDialog.getByLabel("Full name")).toHaveValue("");
    await context.close();
  });
});

test("a job page checks whether you meet its usual requirements", async ({ page }) => {
  await gotoReady(page, "/jobs/5");
  const check = page.locator(".role-check");
  await expect(check).toContainText("Choose your qualification");
  await check.getByLabel("Your qualification").selectOption("cpl");
  await expect(check).toContainText("You meet the usual requirements");
  await check.getByLabel("Your qualification").selectOption("12th");
  await expect(check).toContainText("You may not meet");
});

test.describe("role explorer", () => {
  test("shows one role at a time and links to its jobs", async ({ page }) => {
    await gotoReady(page, "/careers");
    const explorer = page.locator(".role-explorer");
    await explorer.getByRole("button", { name: "Pilots" }).click();
    await expect(explorer.getByRole("heading", { name: "Pilots" })).toBeVisible();
    await expect(explorer.getByRole("heading", { name: "Cabin crew" })).toBeHidden();
    await expect(explorer.getByRole("link", { name: "See Pilots jobs" })).toHaveAttribute("href", "/jobs?category=pilots");
  });

  test("every role is readable without JavaScript", async ({ request }) => {
    const html = await (await request.get("/careers")).text();
    expect(html).toContain("Commercial Pilot Licence and a DGCA Class 1 medical");
    expect(html).toContain("Passenger safety, emergency drills");
  });
});

test.describe("3D page headers", () => {
  test("show one aircraft on wide screens and none on phones", async ({ page }) => {
    await gotoReady(page, "/about");
    await expect(page.locator(".page-header canvas")).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, "/about");
    await expect(page.locator(".page-header canvas")).toHaveCount(0);
  });

  test("moving between pages does not pile up 3D scenes", async ({ page }) => {
    await gotoReady(page, "/about");
    const nav = page.getByRole("navigation", { name: "Main navigation" }).first();
    await nav.getByRole("link", { name: "Contact us" }).click();
    await page.waitForURL("**/contact");
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCSS("opacity", "1");
  });
});

test.describe("accessibility", () => {
  for (const route of ACCESSIBILITY_ROUTES) {
    test(`${route} has no automatically detectable WCAG A or AA problems`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await gotoReady(page, route);
      await page.evaluate(async () => {
        for (let top = 0; top < document.body.scrollHeight; top += 500) {
          window.scrollTo(0, top);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(800);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(violations.map((issue) => `${issue.id}: ${issue.nodes.map((node) => node.target.join(" ")).slice(0, 4).join(" | ")}`)).toEqual([]);
    });
  }
});
