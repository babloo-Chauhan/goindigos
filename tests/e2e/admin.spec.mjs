import { expect, test } from "@playwright/test";
import { MongoClient } from "mongodb";
import { ADMIN_E2E } from "./adminEnv.mjs";

/** Waits until React is attached to the form, the same check as gotoReady in helpers.js, which this module format cannot import. */
async function gotoReady(page, url) {
  await page.goto(url);
  await page.waitForFunction(() => {
    const controls = [...document.querySelectorAll("button, input")];
    return controls.length > 0 && controls.every((control) => Object.keys(control).some((key) => key.startsWith("__reactProps")));
  });
}

const BASE = `http://localhost:${ADMIN_E2E.port}`;
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function dropTestDatabase() {
  const client = await new MongoClient(ADMIN_E2E.uri).connect();
  await client.db(ADMIN_E2E.database).dropDatabase();
  await client.close();
}

async function signIn(page) {
  await page.goto(`${BASE}/admin/login`);
  await page.getByLabel("Username").fill(ADMIN_E2E.username);
  await page.getByLabel("Password").fill(ADMIN_E2E.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

async function fillJob(page, title) {
  await page.getByLabel("Job title (English)").fill(title);
  await page.getByLabel("Company (English)").fill("Test Airways");
  await page.getByLabel("Location (English)").fill("Jaipur");
  await page.getByLabel("Summary (English)").fill("Test the admin panel from end to end.");
  await page.getByLabel("Qualification (English)").fill("Graduate");
  await page.getByLabel("Eligibility (English)").fill("Fresher");
  await page.getByLabel("Closing date").fill("2099-12-31");
  await page.getByLabel("Graduate", { exact: true }).check();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(dropTestDatabase);
test.afterAll(dropTestDatabase);

test.describe("locked out", () => {
  test("the panel says it is not set up when the server has no login configured", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/admin/login`);
    await expect(page.locator(".admin-error")).toContainText("not set up");
    await expect(page.getByLabel("Password")).toHaveCount(0);
  });

  for (const path of ["/admin", "/admin/jobs", "/admin/jobs/new", "/admin/jobs/1", "/admin/leads", "/admin/settings"]) {
    test(`${path} sends a signed-out visitor to the login page and shows no data`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page).toHaveURL(`${BASE}/admin/login`);
      await expect(page.getByLabel("Password")).toBeVisible();
    });
  }

  test("a wrong password or username is refused", async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await page.getByLabel("Username").fill(ADMIN_E2E.username);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator(".admin-error")).toHaveText("Incorrect username or password.");
    await expect(page).toHaveURL(`${BASE}/admin/login`);
  });

  test("a save from a form left open after signing out is refused", async ({ page, context }) => {
    await signIn(page);
    await page.goto(`${BASE}/admin/settings`);
    await page.getByLabel("Public email").fill("attacker@example.com");
    await context.clearCookies();
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page).toHaveURL(`${BASE}/admin/login`);
    await page.goto(`${BASE}/contact`);
    await expect(page.getByText("attacker@example.com")).toHaveCount(0);
  });
});

test.describe("signed in", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("the session cookie cannot be read by page scripts", async ({ context }) => {
    const cookie = (await context.cookies()).find((item) => item.name === "admin_session");
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("Strict");
    expect(cookie.path).toBe("/admin");
  });

  test("the public header and footer stay off admin pages", async ({ page }) => {
    await expect(page.locator(".site-header")).toHaveCount(0);
    await expect(page.locator(".site-footer")).toHaveCount(0);
  });

  test("a crafted notice in the address cannot break the jobs page", async ({ page }) => {
    await page.goto(`${BASE}/admin/jobs?notice=__proto__`);
    await expect(page.locator(".admin-table")).toBeVisible();
    await expect(page.locator(".admin-notice")).toHaveCount(0);
  });

  test("signing out ends the session", async ({ page }) => {
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(`${BASE}/admin/login`);
    await page.goto(`${BASE}/admin/settings`);
    await expect(page).toHaveURL(`${BASE}/admin/login`);
  });

  test("contact details saved in settings appear on the public site at once, and can be hidden", async ({ page }) => {
    await page.goto(`${BASE}/admin/settings`);
    await page.getByLabel("Public email").fill("help@example.com");
    await page.getByLabel("Public phone").fill("+91 98765 43210");
    await page.getByLabel("Contact form link").fill("https://forms.example.com/contact");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.locator(".admin-notice")).toHaveText("Settings saved.");
    await expect(page.getByLabel("Public email")).toHaveValue("help@example.com");

    await page.goto(`${BASE}/contact`);
    const section = page.locator(".contact-section");
    await expect(section.getByRole("link", { name: "help@example.com" })).toHaveAttribute("href", "mailto:help@example.com");
    await expect(section.getByRole("link", { name: "+91 98765 43210" })).toHaveAttribute("href", "tel:+919876543210");
    await expect(section.getByRole("link", { name: "Open the contact form" })).toHaveAttribute("href", "https://forms.example.com/contact");
    await expect(page.locator(".site-footer").getByRole("link", { name: "help@example.com" })).toBeVisible();

    await page.goto(`${BASE}/admin/settings`);
    await page.getByLabel("Public email").fill("");
    await page.getByLabel("Public phone").fill("");
    await page.getByLabel("Contact form link").fill("");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.locator(".admin-notice")).toHaveText("Settings saved.");
    await page.goto(`${BASE}/contact`);
    await expect(page.locator(".contact-links")).toHaveCount(0);
  });

  test("a bad contact form link is rejected and what was typed stays in the form", async ({ page }) => {
    await page.goto(`${BASE}/admin/settings`);
    await page.getByLabel("Public phone").fill("+91 98765 43210");
    await page.getByLabel("Contact form link").fill("http://not-secure.example.com");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText("Enter a full link starting with https://")).toBeVisible();
    await expect(page.getByLabel("Public phone")).toHaveValue("+91 98765 43210");
  });

  test("a new logo replaces the old one on the public site, and removing it shows the site name", async ({ page, request }) => {
    await page.goto(`${BASE}/admin/settings`);
    await page.getByLabel("Upload a new logo").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG_1PX });
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.locator(".admin-notice")).toHaveText("Settings saved.");

    await page.goto(`${BASE}/`);
    const logo = page.locator(".site-header .brand-logo");
    await expect(logo).toHaveAttribute("src", /^\/uploads\/[a-f0-9]{32}\.png$/);
    const response = await request.get(`${BASE}${await logo.getAttribute("src")}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");

    await page.goto(`${BASE}/admin/settings`);
    await page.getByLabel("Remove the logo").check();
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.locator(".admin-notice")).toHaveText("Settings saved.");
    await page.goto(`${BASE}/`);
    await expect(page.locator(".site-header .brand-wordmark")).toHaveText("AeroCareer Hub");
    await expect(page.locator(".site-header .brand-logo")).toHaveCount(0);
  });

  test("a file that is not an image is rejected as a logo", async ({ page }) => {
    await page.goto(`${BASE}/admin/settings`);
    await page.getByLabel("Upload a new logo").setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    });
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText("The logo must be a PNG, JPG or WebP image.")).toBeVisible();
  });

  test("a job can be added, edited and deleted, and the public site follows each step", async ({ page }) => {
    await page.goto(`${BASE}/admin/jobs/new`);
    await fillJob(page, "E2E Flight Dispatcher");
    await page.getByRole("button", { name: "Add job" }).click();
    await expect(page.locator(".admin-notice")).toHaveText("Job added.");
    await expect(page.getByRole("rowheader", { name: /E2E Flight Dispatcher/ })).toBeVisible();

    await page.goto(`${BASE}/jobs`);
    await page.getByRole("link", { name: /E2E Flight Dispatcher/ }).first().click();
    await expect(page.getByRole("heading", { name: "E2E Flight Dispatcher", level: 1 })).toBeVisible();
    const publicUrl = page.url();

    await page.goto(`${BASE}/admin/jobs`);
    await page.getByRole("link", { name: "Edit E2E Flight Dispatcher" }).click();
    await expect(page.getByLabel("Job title (English)")).toHaveValue("E2E Flight Dispatcher");
    await expect(page.getByLabel("Graduate", { exact: true })).toBeChecked();
    await page.getByLabel("Job title (English)").fill("E2E Senior Dispatcher");
    await page.getByRole("button", { name: "Save job" }).click();
    await expect(page.locator(".admin-notice")).toHaveText("Job saved.");

    await page.goto(publicUrl);
    await expect(page.getByRole("heading", { name: "E2E Senior Dispatcher", level: 1 })).toBeVisible();

    await page.goto(`${BASE}/admin/jobs`);
    await page.getByRole("button", { name: "Delete E2E Senior Dispatcher" }).click();
    await page.getByRole("button", { name: "Confirm deleting E2E Senior Dispatcher" }).click();
    await expect(page.locator(".admin-notice")).toHaveText("Job deleted.");
    await expect(page.getByRole("rowheader", { name: /E2E Senior Dispatcher/ })).toHaveCount(0);

    await page.goto(publicUrl);
    await expect(page.getByRole("heading", { name: "E2E Senior Dispatcher", level: 1 })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Apply now" })).toHaveCount(0);
  });

  test("editing and deleting a sample job also reaches its built page", async ({ page }) => {
    await page.goto(`${BASE}/admin/jobs/3`);
    await page.getByLabel("Job title (English)").fill("E2E Edited Sample");
    await page.getByRole("button", { name: "Save job" }).click();
    await expect(page.locator(".admin-notice")).toHaveText("Job saved.");
    await page.goto(`${BASE}/jobs/3`);
    await expect(page.getByRole("heading", { name: "E2E Edited Sample", level: 1 })).toBeVisible();

    await page.goto(`${BASE}/admin/jobs`);
    await page.getByRole("button", { name: "Delete E2E Edited Sample" }).click();
    await page.getByRole("button", { name: "Confirm deleting E2E Edited Sample" }).click();
    await expect(page.locator(".admin-notice")).toHaveText("Job deleted.");
    await page.goto(`${BASE}/jobs/3`);
    await expect(page.getByRole("heading", { name: "E2E Edited Sample", level: 1 })).toHaveCount(0);
  });

  test("a contact form message becomes a lead that can be handled and deleted", async ({ page }) => {
    await page.goto(`${BASE}/admin/leads`);
    await expect(page.getByText("No contact leads yet.")).toBeVisible();

    await gotoReady(page, `${BASE}/contact`);
    await page.getByLabel("Your name").fill("E2E Visitor");
    await page.getByLabel("Email address").fill("visitor@example.com");
    await page.getByLabel("Message").fill("<b>Is this role open?</b>");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.locator(".contact-result")).toContainText("Your message has been sent");

    await page.goto(`${BASE}/admin`);
    await expect(page.locator(".admin-stats div").filter({ hasText: "New contact leads" }).locator("dd")).toHaveText("1");

    await page.goto(`${BASE}/admin/leads`);
    const lead = page.locator(".admin-lead");
    await expect(lead.getByRole("heading", { name: "E2E Visitor" })).toBeVisible();
    await expect(lead.getByRole("link", { name: "visitor@example.com" })).toHaveAttribute("href", "mailto:visitor@example.com");
    await expect(lead.locator(".admin-lead-message")).toHaveText("<b>Is this role open?</b>");
    await expect(lead.locator(".admin-pill")).toHaveText("New");

    await lead.getByRole("button", { name: "Mark as handled" }).click();
    await expect(page.locator(".admin-notice")).toHaveText("Lead updated.");
    await expect(lead.locator(".admin-pill")).toHaveText("Handled");

    await lead.getByRole("button", { name: "Delete the message from E2E Visitor" }).click();
    await lead.getByRole("button", { name: "Confirm deleting the message from E2E Visitor" }).click();
    await expect(page.locator(".admin-notice")).toHaveText("Lead deleted.");
    await expect(page.locator(".admin-lead")).toHaveCount(0);
  });

  test("a job form with a missing qualification is refused and keeps what was typed", async ({ page }) => {
    await page.goto(`${BASE}/admin/jobs/new`);
    await fillJob(page, "E2E Incomplete");
    await page.getByLabel("Graduate", { exact: true }).uncheck();
    await page.getByRole("button", { name: "Add job" }).click();
    await expect(page.getByText("Choose at least one accepted qualification.")).toBeVisible();
    await expect(page.getByLabel("Job title (English)")).toHaveValue("E2E Incomplete");
  });
});
