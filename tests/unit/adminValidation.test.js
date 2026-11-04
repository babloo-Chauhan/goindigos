import { describe, expect, test } from "vitest";
import { copy } from "../../app/data/copy";
import { categories } from "../../app/data/jobs";
import { MAX_LOGO_BYTES, parseJobForm, parseLogoFile, parseSettingsForm } from "../../app/lib/adminValidation";

const VALID_JOB = {
  audience: "airline",
  category: "pilots",
  employment: "contract",
  title_en: " First Officer ",
  title_hi: "फर्स्ट ऑफिसर",
  company_en: "Regional Airline",
  company_hi: "",
  location_en: "Pune",
  location_hi: "",
  qualification_en: "CPL",
  qualification_hi: "",
  eligibility_en: "Valid licence",
  eligibility_hi: "",
  summary_en: "Fly regional routes.",
  summary_hi: "",
  expiresAt: "2027-02-28",
  minYears: "2",
};

function jobForm(overrides = {}, accepts = ["cpl"]) {
  const form = new FormData();
  Object.entries({ ...VALID_JOB, ...overrides }).forEach(([name, value]) => form.set(name, value));
  accepts.forEach((value) => form.append("accepts", value));
  return form;
}

describe("parseJobForm", () => {
  test("builds a clean job from a valid form", () => {
    const { job } = parseJobForm(jobForm({ featured: "on" }));
    expect(job).toEqual({
      audience: "airline",
      category: "pilots",
      employment: "contract",
      featured: true,
      title: { en: "First Officer", hi: "फर्स्ट ऑफिसर" },
      company: { en: "Regional Airline", hi: "Regional Airline" },
      location: { en: "Pune", hi: "Pune" },
      qualification: { en: "CPL", hi: "CPL" },
      eligibility: { en: "Valid licence", hi: "Valid licence" },
      summary: { en: "Fly regional routes.", hi: "Fly regional routes." },
      expiresAt: "2027-02-28",
      requirements: { accepts: ["cpl"], minYears: 2 },
    });
  });

  test("leaves a job unfeatured unless the box is ticked", () => {
    expect(parseJobForm(jobForm()).job.featured).toBe(false);
  });

  test("ignores fields it does not know, so a form cannot choose its own id", () => {
    const { job } = parseJobForm(jobForm({ id: "1", extra: "x" }));
    expect(job).not.toHaveProperty("id");
    expect(job).not.toHaveProperty("extra");
  });

  test.each([
    ["audience", "other"],
    ["category", "astronauts"],
    ["employment", "volunteer"],
    ["title_en", "   "],
    ["title_en", "x".repeat(121)],
    ["title_hi", "x".repeat(121)],
    ["company_en", ""],
    ["location_en", ""],
    ["qualification_en", ""],
    ["eligibility_en", ""],
    ["summary_en", ""],
    ["summary_en", "x".repeat(1001)],
    ["expiresAt", ""],
    ["expiresAt", "28-02-2027"],
    ["expiresAt", "2027-02-30"],
    ["expiresAt", "2027-13-01"],
    ["minYears", "-1"],
    ["minYears", "1.5"],
    ["minYears", "41"],
    ["minYears", "abc"],
    ["minYears", ""],
  ])("reports an error on %s for %j", (field, value) => {
    const result = parseJobForm(jobForm({ [field]: value }));
    expect(result.job).toBeUndefined();
    expect(result.errors).toHaveProperty(field);
  });

  test("reports an error when a text field is a file", () => {
    const result = parseJobForm(jobForm({ title_en: new File(["x"], "x.txt") }));
    expect(result.errors).toHaveProperty("title_en");
  });

  test("requires at least one accepted qualification", () => {
    expect(parseJobForm(jobForm({}, [])).errors).toHaveProperty("accepts");
  });

  test("rejects an unknown accepted qualification", () => {
    expect(parseJobForm(jobForm({}, ["cpl", "wizard"])).errors).toHaveProperty("accepts");
  });

  test("accepts every category and qualification the public site knows", () => {
    categories.forEach(({ id }) => expect(parseJobForm(jobForm({ category: id })).job.category).toBe(id));
    const qualifications = copy.en.qualificationOptions.map((option) => option.value);
    expect(parseJobForm(jobForm({}, qualifications)).job.requirements.accepts).toEqual(qualifications);
  });

  test("every category has the guide its job page needs", () => {
    categories.forEach(({ id }) => {
      expect(copy.en.guides.some((guide) => guide.category === id)).toBe(true);
      expect(copy.hi.guides.some((guide) => guide.category === id)).toBe(true);
    });
  });
});

function settingsForm(fields) {
  const form = new FormData();
  Object.entries(fields).forEach(([name, value]) => form.set(name, value));
  return form;
}

describe("parseSettingsForm", () => {
  test("trims a valid email and phone", () => {
    expect(parseSettingsForm(settingsForm({ email: " help@example.com ", phone: " +91 98765 43210 " }))).toEqual({
      settings: { email: "help@example.com", phone: "+91 98765 43210", contactFormUrl: "" },
    });
  });

  test("allows both to be empty, which hides them on the site", () => {
    expect(parseSettingsForm(settingsForm({ email: "", phone: "" })).settings).toEqual({ email: "", phone: "", contactFormUrl: "" });
  });

  test.each(["no-at-sign", "a@b", "a b@example.com", "a@example.com?subject=x", "a&b@example.com", `${"x".repeat(250)}@example.com`])(
    "rejects the email %j",
    (email) => {
      expect(parseSettingsForm(settingsForm({ email, phone: "" })).errors).toHaveProperty("email");
    },
  );

  test.each(["12345", "call me", "+91 98765 43210;extension", "9".repeat(21), "<script>"])("rejects the phone %j", (phone) => {
    expect(parseSettingsForm(settingsForm({ email: "", phone })).errors).toHaveProperty("phone");
  });
});

describe("contact form link", () => {
  test("keeps a full https link", () => {
    const contactFormUrl = "https://forms.example.com/contact?id=1";
    expect(parseSettingsForm(settingsForm({ contactFormUrl })).settings.contactFormUrl).toBe(contactFormUrl);
  });

  test.each(["javascript:alert(1)", "http://example.com", "example.com", "/contact", "data:text/html,x", `https://example.com/${"x".repeat(500)}`])(
    "rejects %j",
    (contactFormUrl) => {
      expect(parseSettingsForm(settingsForm({ contactFormUrl })).errors).toHaveProperty("contactFormUrl");
    },
  );
});

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const WEBP = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");

describe("parseLogoFile", () => {
  test.each([
    ["png", PNG],
    ["jpg", JPEG],
    ["webp", WEBP],
  ])("recognises a %s from its contents", async (extension, bytes) => {
    const result = await parseLogoFile(new File([bytes], "logo.bin"));
    expect(result.extension).toBe(extension);
    expect(Buffer.compare(result.bytes, Buffer.from(bytes))).toBe(0);
  });

  test("rejects an SVG even when it claims to be an image, because SVG can carry scripts", async () => {
    const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], "logo.png", { type: "image/png" });
    expect((await parseLogoFile(svg)).error).toBeTruthy();
  });

  test("rejects a file over the size limit", async () => {
    const big = new Uint8Array(MAX_LOGO_BYTES + 1);
    big.set(PNG);
    expect((await parseLogoFile(new File([big], "logo.png"))).error).toBeTruthy();
  });

  test("rejects an empty file", async () => {
    expect((await parseLogoFile(new File([], "logo.png"))).error).toBeTruthy();
  });
});
