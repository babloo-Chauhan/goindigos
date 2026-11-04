import { describe, expect, test } from "vitest";
import { copy } from "../../app/data/copy";
import { INDEXED_ROUTES, SITE_URL } from "../../app/lib/site";
import { breadcrumbSchema, faqSchema, organizationSchema, websiteSchema } from "../../app/lib/structuredData";

describe("structured data", () => {
  test("the organization says it is not an airline or recruiter", () => {
    expect(organizationSchema().description).toContain("not an airline");
    expect(websiteSchema().url).toBe(SITE_URL);
  });

  test("breadcrumbs lead from home to the page", () => {
    const { itemListElement } = breadcrumbSchema("About us", "/about");
    expect(itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect(itemListElement[1].item).toBe(`${SITE_URL}/about`);
  });

  test("the FAQ markup uses the same words visitors can read", () => {
    const { mainEntity } = faqSchema(copy.en.faqs);
    expect(mainEntity).toHaveLength(copy.en.faqs.length);
    expect(mainEntity[0].name).toBe(copy.en.faqs[0].question);
    expect(mainEntity[0].acceptedAnswer.text).toBe(copy.en.faqs[0].answer);
  });
});

describe("search engine pages", () => {
  test("sample job pages and the compare tool are never offered to search engines", () => {
    expect(INDEXED_ROUTES).not.toContain("/compare");
    expect(INDEXED_ROUTES.some((route) => route.startsWith("/jobs/"))).toBe(false);
  });
});
