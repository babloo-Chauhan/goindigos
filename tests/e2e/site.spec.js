import { expect, test } from "@playwright/test";
import { gotoReady } from "./helpers";

const ROUTES = ["/", "/jobs", "/airlines-jobs", "/airport-jobs", "/careers", "/about", "/contact", "/compare", "/jobs/5"];
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 820, height: 1100 },
  { width: 1440, height: 900 },
];

function trackProblems(page) {
  const problems = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`);
  });
  return problems;
}

function jobTitles(page) {
  return page.locator(".job-pass h3:visible");
}

test.describe("every page", () => {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    test(`loads without errors with motion set to ${reducedMotion}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      const problems = trackProblems(page);
      for (const route of ROUTES) {
        const response = await gotoReady(page, route);
        expect(response.status(), route).toBe(200);
        await expect(page.locator("h1:visible").first()).toBeVisible();
        await page.waitForTimeout(300);
      }
      expect(problems).toEqual([]);
    });
  }

  for (const viewport of VIEWPORTS) {
    test(`does not scroll sideways at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      for (const route of ROUTES) {
        await gotoReady(page, route);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, route).toBeLessThanOrEqual(0);
      }
    });
  }
});

test.describe("3D hero", () => {
  const sceneState = (page) => page.evaluate(() => ({
    canvases: document.querySelectorAll(".aviation-scene canvas").length,
    fallback: getComputedStyle(document.querySelector(".scene-fallback")).display,
  }));

  test("runs the live scene and shows no flat fallback", async ({ page }) => {
    await gotoReady(page, "/");
    await expect(page.locator(".aviation-scene canvas")).toHaveCount(1);
    expect(await sceneState(page)).toEqual({ canvases: 1, fallback: "none" });
  });

  test("keeps one canvas after moving between pages", async ({ page }) => {
    await gotoReady(page, "/");
    const nav = page.getByRole("navigation", { name: "Main navigation" }).first();
    for (let round = 0; round < 3; round += 1) {
      await nav.getByRole("link", { name: "About us" }).click();
      await page.waitForURL("**/about");
      await nav.getByRole("link", { name: "Home" }).click();
      await page.waitForURL(/:\d+\/$/);
    }
    await expect(page.locator(".aviation-scene canvas")).toHaveCount(1);
  });

  for (const reducedMotion of ["no-preference", "reduce"]) {
    test(`flies the aircraft with motion set to ${reducedMotion}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await gotoReady(page, "/");
      const scene = page.locator(".aviation-scene canvas");
      await expect(scene).toHaveCount(1);
      await expect(page.locator(".hero h1")).toHaveCSS("opacity", "1");

      const firstFrame = await scene.screenshot();
      await page.waitForTimeout(1500);
      expect((await scene.screenshot()).equals(firstFrame)).toBe(false);
    });
  }

  test("falls back to the static image without WebGL", async ({ page }) => {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(type, ...rest) {
        return String(type).includes("webgl") ? null : getContext.call(this, type, ...rest);
      };
    });
    await gotoReady(page, "/");
    await expect(page.locator(".scene-fallback")).toBeVisible();
    await expect(page.locator(".aviation-scene canvas")).toHaveCount(0);
    await expect(page.locator(".hero h1")).toHaveCSS("opacity", "1", { timeout: 5000 });
  });
});

test.describe("search and answer engines", () => {
  const schemaTypes = (page) => page.locator('script[type="application/ld+json"]').evaluateAll(
    (scripts) => scripts.map((script) => JSON.parse(script.textContent)["@type"]),
  );

  test("robots and sitemap list only the real pages", async ({ request }) => {
    expect(await (await request.get("/robots.txt")).text()).toContain("sitemap.xml");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/careers</loc>");
    expect(sitemap).not.toContain("/jobs/5");
  });

  test("llms.txt says the site is independent and the listings are samples", async ({ request }) => {
    const summary = await (await request.get("/llms.txt")).text();
    expect(summary).toContain("not an airline");
    expect(summary).toContain("not an open vacancy");
  });

  test("each page names its own canonical address", async ({ page }) => {
    await gotoReady(page, "/careers");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/careers$/);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  });

  test("structured data matches the page and never claims real vacancies", async ({ page }) => {
    await gotoReady(page, "/careers");
    expect(await schemaTypes(page)).toEqual(expect.arrayContaining(["WebSite", "Organization", "BreadcrumbList", "FAQPage"]));
    for (const route of ["/jobs", "/jobs/5"]) {
      await gotoReady(page, route);
      expect(await schemaTypes(page)).not.toContain("JobPosting");
    }
  });

  test("sample job pages stay out of search results", async ({ page }) => {
    await gotoReady(page, "/jobs/5");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("FAQ answers are readable without running JavaScript", async ({ request }) => {
    const html = await (await request.get("/careers")).text();
    expect(html).toContain("not affiliated with any airline or airport");
  });
});

test.describe("production basics", () => {
  test("responses carry security headers and hide the framework", async ({ request }) => {
    const headers = (await request.get("/")).headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("an unknown page shows a helpful 404", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We can't find that page" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});

test.describe("smooth scrolling", () => {
  test("eases the mouse wheel when motion is allowed", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await gotoReady(page, "/");
    await expect(page.locator("html")).toHaveClass(/lenis/);
    await page.mouse.move(700, 400);
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(80);
    const partWay = await page.evaluate(() => window.scrollY);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(950);
    expect(partWay).toBeLessThan(950);
  });

  test("the wheel does not move the page behind the application form", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await gotoReady(page, "/jobs");
    await page.getByRole("button", { name: "Apply now for First Officer" }).click();
    await expect(page.locator("dialog")).toBeVisible();
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(700, 400);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test("keeps gliding after the wheel stops, then comes to rest", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await gotoReady(page, "/");
    await page.mouse.move(700, 400);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(600);
    const stillMoving = await page.evaluate(() => window.scrollY);
    expect(stillMoving).toBeLessThan(590);
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 8000 }).toBeGreaterThan(595);
  });

  test("stays off for reduced-motion visitors, who still get fades", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoReady(page, "/");
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
    const faqHeading = page.getByRole("heading", { name: "Common questions" });
    await expect(faqHeading).toHaveCSS("opacity", "0");
    await faqHeading.evaluate((heading) => heading.scrollIntoView());
    await expect(faqHeading).toHaveCSS("opacity", "1");
  });

});

test.describe("career paths", () => {
  test("show their photos and open matching jobs", async ({ page }) => {
    await gotoReady(page, "/");
    const card = page.getByRole("link", { name: /On the flight deck/ });
    await card.scrollIntoViewIfNeeded();
    await expect.poll(() => card.locator("img").evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
    await card.click();
    await page.waitForURL("**/jobs?category=pilots");
    await expect(jobTitles(page).first()).toHaveText("First Officer");
  });
});

test.describe("departure board", () => {
  test("draws nothing across the job text", async ({ page }) => {
    await gotoReady(page, "/");
    const flap = page.locator(".board .flap").first();
    await expect(flap).toBeVisible();
    expect(await flap.evaluate((cell) => getComputedStyle(cell, "::after").content)).toBe("none");
  });
});

test.describe("finding jobs", () => {
  test("the home search opens matching results", async ({ page }) => {
    await gotoReady(page, "/");
    await page.getByLabel("Job title").fill("pilot");
    await page.getByRole("button", { name: "Search jobs" }).click();
    await page.waitForURL("**/jobs?q=pilot");
    await expect(jobTitles(page)).toHaveText(["First Officer"]);
  });

  test("category links and filters narrow the list", async ({ page }) => {
    await gotoReady(page, "/jobs?category=cargo");
    await expect(jobTitles(page)).toHaveText(["Cargo Operations Assistant"]);
    await page.getByRole("button", { name: /Remove filter/ }).click();
    await expect(jobTitles(page)).toHaveCount(9);
  });

  test("airline and airport pages show different jobs", async ({ page }) => {
    await gotoReady(page, "/airlines-jobs");
    await expect(jobTitles(page)).toHaveCount(4);
    await gotoReady(page, "/airport-jobs");
    await expect(jobTitles(page)).toHaveCount(5);
  });

  test("an empty search explains itself and can be cleared", async ({ page }) => {
    await gotoReady(page, "/jobs");
    await page.getByLabel("Location").fill("nowhere");
    await expect(page.getByText("No jobs match this search.")).toBeVisible();
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(jobTitles(page)).toHaveCount(9);
  });

  test("keeps the same job list while the page becomes interactive", async ({ page }) => {
    await page.goto("/jobs");
    const applyButton = await page.getByRole("button", { name: "Apply now for First Officer" }).elementHandle();
    await page.waitForTimeout(2500);
    expect(await applyButton.evaluate((button) => button.isConnected)).toBe(true);
  });

  test("employment type and sorting change the list", async ({ page }) => {
    await gotoReady(page, "/jobs");
    await page.getByRole("group", { name: "Employment" }).getByRole("button", { name: "Contract" }).click();
    await expect(jobTitles(page)).toHaveText(["Cargo Operations Assistant"]);
    await page.getByRole("group", { name: "Employment" }).getByRole("button", { name: "All types" }).click();
    await expect(jobTitles(page).first()).toHaveText("Customer Service Associate");
    await page.getByLabel("Sort by").selectOption("title");
    await expect(jobTitles(page).first()).toHaveText("Aircraft Maintenance Technician");
  });

  test("hides a job after its closing date", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-12-16T12:00:00+05:30"));
    await gotoReady(page, "/jobs");
    await expect(jobTitles(page)).toHaveCount(8);
    await expect(page.getByRole("heading", { name: "Customer Service Associate" })).toHaveCount(0);
  });

  test("keeps a job open until midnight in India on its closing date", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-12-15T23:30:00+05:30"));
    await gotoReady(page, "/jobs");
    await expect(page.getByRole("heading", { name: "Customer Service Associate" })).toBeVisible();
  });
});

test.describe("saved jobs", () => {
  test("saving a job survives a reload and filters the list", async ({ page }) => {
    await gotoReady(page, "/jobs");
    await page.getByRole("button", { name: "Save First Officer" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Job saved" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Remove First Officer from saved jobs" })).toBeVisible();
    await page.getByRole("link", { name: "Saved jobs: 1" }).click();
    await page.waitForURL("**/jobs?saved=1");
    await expect(jobTitles(page)).toHaveText(["First Officer"]);
  });

  test("two open tabs keep each other's saved jobs", async ({ context, page }) => {
    const otherTab = await context.newPage();
    await gotoReady(page, "/jobs");
    await gotoReady(otherTab, "/jobs");

    await page.getByRole("button", { name: "Save First Officer" }).click();
    await expect(otherTab.getByRole("button", { name: "Remove First Officer from saved jobs" })).toBeVisible();

    await otherTab.getByRole("button", { name: "Save Customer Service Associate" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "Remove First Officer from saved jobs" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove Customer Service Associate from saved jobs" })).toBeVisible();
  });

  test("shows a helpful message when nothing is saved", async ({ page }) => {
    await gotoReady(page, "/jobs?saved=1");
    await expect(page.getByText("You haven't saved any jobs yet.")).toBeVisible();
    await page.getByRole("button", { name: "Show all jobs" }).click();
    await expect(jobTitles(page)).toHaveCount(9);
  });
});

test.describe("eligibility checker", () => {
  test("lists matching jobs that link to their details", async ({ page }) => {
    await gotoReady(page, "/careers");
    await expect(page.getByText("Choose your qualification to see matching jobs.")).toBeVisible();
    await page.getByLabel("Your qualification").selectOption("cpl");
    await expect(page.getByText("1 job matches")).toBeVisible();
    await page.locator(".checker-results").getByRole("link", { name: /First Officer/ }).click();
    await page.waitForURL("**/jobs/5");
    await expect(page.locator("h1:visible")).toHaveText("First Officer");
  });

  test("experience changes the result", async ({ page }) => {
    await gotoReady(page, "/careers");
    await page.getByLabel("Your qualification").selectOption("postgraduate");
    await expect(page.locator(".checker-results")).not.toContainText("HR Executive");
    await page.getByLabel("Your experience").selectOption("1");
    await expect(page.locator(".checker-results")).toContainText("HR Executive");
  });
});

test.describe("language", () => {
  test("Hindi persists across pages and sets the page language", async ({ page }) => {
    await gotoReady(page, "/");
    await page.getByRole("button", { name: "हिंदी" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await gotoReady(page, "/about");
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.locator("h1:visible")).toHaveText("हमारे बारे में");
  });

  test("finds jobs with a Hindi search", async ({ page }) => {
    await gotoReady(page, `/jobs?q=${encodeURIComponent("पायलट")}`);
    await expect(jobTitles(page)).toHaveText(["First Officer"]);
  });
});

test.describe("page extras", () => {
  test("FAQ answers open and close, and warn about fake offers", async ({ page }) => {
    await gotoReady(page, "/contact");
    const question = page.getByRole("button", { name: "How can I spot a fake aviation job offer?" });
    const answer = page.locator(".faq-answer").filter({ hasText: "registration, training or uniform fee" });
    await expect(answer).toBeHidden();
    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(answer).toBeVisible();
    await question.click();
    await expect(answer).toBeHidden();
  });

  test("the stats show values counted from the jobs", async ({ page }) => {
    await gotoReady(page, "/");
    await expect(page.locator(".stats-grid dd").first()).toHaveText("9", { timeout: 5000 });
  });

  test("job details offer related jobs and a saved state", async ({ page }) => {
    await gotoReady(page, "/jobs/5");
    await expect(page.locator(".related-grid li")).toHaveCount(3);
    await page.getByRole("button", { name: "Save First Officer" }).click();
    await expect(page.getByRole("link", { name: "Saved jobs: 1" })).toBeVisible();
  });

  test("the contact form says the message was not sent", async ({ page }) => {
    await gotoReady(page, "/contact");
    await page.getByLabel("Your name").fill("Test");
    await page.getByLabel("Email address").fill("test@example.test");
    await page.getByLabel("Message").fill("Hello");
    await page.getByRole("button", { name: "Try the message form" }).click();
    await expect(page.locator(".contact-result")).toBeFocused();
    await expect(page.locator(".contact-result")).toContainText("Your message was not sent.");
  });

  test("the skip link is the first stop for keyboard users", async ({ page }) => {
    await gotoReady(page, "/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  });

  test("the mobile menu opens and closes on navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, "/");
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.locator("#mobile-navigation")).toBeVisible();
    await page.locator(".site-footer").getByRole("link", { name: "About us" }).click();
    await page.waitForURL("**/about");
    await expect(page.locator("#mobile-navigation")).toBeHidden();
  });

  test("the back to top button appears after scrolling", async ({ page }) => {
    await gotoReady(page, "/");
    await expect(page.getByRole("button", { name: "Back to top" })).toHaveCount(0);
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: "instant" }));
    await expect(page.getByRole("button", { name: "Back to top" })).toBeVisible();
  });

  test("all content is revealed after scrolling the whole page", async ({ page }) => {
    await gotoReady(page, "/");
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let position = 0; position < height; position += 600) {
      // Waiting for real frames gives the browser its chance to notice each section, however busy the machine is.
      await page.evaluate(async (top) => {
        window.scrollTo({ top, behavior: "instant" });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }, position);
    }
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll("[data-reveal]")].filter((element) => getComputedStyle(element).opacity !== "1").length)).toBe(0);
  });
});

test.describe("application form", () => {
  async function openForm(page) {
    await gotoReady(page, "/jobs");
    await page.getByRole("button", { name: "Apply now for First Officer" }).click();
    return page.locator("dialog");
  }

  test("checks each step and ends by saying nothing was submitted", async ({ page }) => {
    const dialog = await openForm(page);
    await expect(dialog.getByText("Demo only")).toBeVisible();
    await expect(dialog.getByText("Step 1 of 3")).toBeVisible();

    await dialog.getByRole("button", { name: "Continue" }).click();
    await expect(dialog.getByText("Step 1 of 3")).toBeVisible();
    expect(await dialog.getByLabel("Full name").evaluate((field) => field.validationMessage)).toBe("Fill in this field.");

    await dialog.getByLabel("Full name").fill("Test Candidate");
    await dialog.getByLabel("Mobile number").fill("--------");
    await dialog.getByLabel("Email address").fill("test@example.test");
    await dialog.getByLabel("Current city").fill("Delhi");
    await dialog.getByRole("button", { name: "Continue" }).click();
    await expect(dialog.getByText("Step 1 of 3")).toBeVisible();

    await dialog.getByLabel("Mobile number").fill("9876543210");
    await dialog.getByRole("button", { name: "Continue" }).click();
    await expect(dialog.getByText("Step 2 of 3")).toBeVisible();
    await expect(dialog.getByLabel("Position")).toHaveValue("First Officer");

    await dialog.getByLabel("Preferred location").fill("Mumbai");
    await dialog.getByLabel("Qualification").fill("CPL");
    await dialog.getByLabel("Experience").selectOption("fresher");
    await dialog.getByRole("button", { name: "Continue" }).click();
    await expect(dialog.getByText("Step 3 of 3")).toBeVisible();

    await dialog.getByRole("button", { name: "Back" }).click();
    await expect(dialog.getByLabel("Preferred location")).toHaveValue("Mumbai");
    await dialog.getByRole("button", { name: "Continue" }).click();

    await dialog.locator("input[type=file]").setInputFiles({ name: "resume.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
    await expect(dialog.getByText("Choose a PDF file.")).toBeVisible();
    await dialog.locator("input[type=file]").setInputFiles({ name: "resume.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(6 * 1024 * 1024) });
    await expect(dialog.getByText("Choose a PDF of 5 MB or less.")).toBeVisible();
    await dialog.locator("input[type=file]").setInputFiles({ name: "resume.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
    await expect(dialog.locator(".field-error")).toHaveCount(0);

    await dialog.getByRole("button", { name: "Preview application" }).click();
    await expect(dialog.getByText("Step 3 of 3")).toBeVisible();
    await dialog.getByRole("checkbox").check();

    const requests = [];
    page.on("request", (request) => {
      if (request.method() !== "GET") requests.push(request.url());
    });
    await dialog.getByRole("button", { name: "Preview application" }).click();
    await expect(dialog.getByRole("heading", { name: "Form completed: nothing was submitted" })).toBeFocused();
    expect(requests).toEqual([]);
  });

  test("Escape closes the form and returns focus to the button", async ({ page }) => {
    await openForm(page);
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Apply now for First Officer" })).toBeFocused();
  });

  test("shows validation messages in Hindi", async ({ page }) => {
    await gotoReady(page, "/jobs");
    await page.getByRole("button", { name: "हिंदी" }).click();
    await page.getByRole("button", { name: "फर्स्ट ऑफिसर के लिए अभी आवेदन करें" }).click();
    const dialog = page.locator("dialog");
    await dialog.getByRole("button", { name: "आगे बढ़ें" }).click();
    expect(await dialog.getByLabel("पूरा नाम").evaluate((field) => field.validationMessage)).toBe("यह जानकारी भरें।");
  });
});

test.describe("page polish", () => {
  test("the footer credits the website's maker", async ({ page }) => {
    await gotoReady(page, "/");
    const credit = page.locator(".footer-bottom").getByRole("link", { name: "itellic.com" });
    await expect(credit).toHaveAttribute("href", "https://itellic.com");
    await expect(page.locator(".footer-bottom")).toContainText("Website made by itellic.com");
  });

  test("the header shows the site's own name and no logo image", async ({ page }) => {
    await gotoReady(page, "/");
    const brand = page.locator(".site-header .brand");
    await expect(brand).toContainText("AeroCareer Hub");
    await expect(brand.locator("img")).toHaveCount(0);
  });

  test("the large photo section appears once on every page", async ({ page }) => {
    for (const route of ["/", "/jobs", "/jobs/5", "/airlines-jobs", "/airport-jobs", "/careers", "/about", "/contact", "/compare"]) {
      await gotoReady(page, route);
      const photo = page.locator(".team-photo img");
      await expect(photo).toHaveCount(1);
      await photo.scrollIntoViewIfNeeded();
      await expect(page.getByRole("heading", { name: "The team behind every flight" })).toBeVisible();
      await expect.poll(() => photo.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    }
  });

  test("the footer says the site is independent and the listings are examples", async ({ page }) => {
    await gotoReady(page, "/");
    await expect(page.locator(".site-footer")).toContainText("not affiliated with any airline");
    await expect(page.locator(".site-footer")).toContainText("illustrative examples");
  });

  test("the hero has a blue background with stars and no photo", async ({ page }) => {
    await gotoReady(page, "/");
    await expect(page.locator(".hero img")).toHaveCount(0);
    await expect(page.locator(".hero-stars")).toHaveCount(1);
  });

  test("each page gives social previews its own title and address", async ({ page }) => {
    await gotoReady(page, "/about");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /About us/);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /\/about$/);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  });
});
