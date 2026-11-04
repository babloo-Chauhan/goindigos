import { describe, expect, test } from "vitest";
import { copy } from "../../app/data/copy";
import {
  categories,
  EMPTY_FILTERS,
  formatClosingDate,
  getJob,
  getJobRequirements,
  getJobStats,
  getOpenJobs,
  getRelatedJobs,
  isEligible,
  jobs,
  matchesFilters,
  sortJobs,
} from "../../app/data/jobs";

const titles = (list) => list.map((job) => job.title.en);

describe("getOpenJobs", () => {
  test("keeps a job through its closing date and removes it the day after", () => {
    const job = getJob("3");
    expect(getOpenJobs(job.expiresAt)).toContain(job);
    expect(getOpenJobs("2026-12-16")).not.toContain(job);
  });

  test("returns every job before the date is known during prerender", () => {
    expect(getOpenJobs("")).toHaveLength(jobs.length);
  });

  test("returns nothing once every sample job has closed", () => {
    expect(getOpenJobs("2027-01-01")).toEqual([]);
  });
});

describe("saved job lists", () => {
  const custom = { ...jobs[0], id: "abc12345", requirements: { accepts: ["cpl"], minYears: 2 } };

  test("getJob and getOpenJobs read the list they are given", () => {
    expect(getJob("abc12345", [custom])).toBe(custom);
    expect(getJob("1", [custom])).toBeUndefined();
    expect(getOpenJobs("", [custom])).toEqual([custom]);
  });

  test("isEligible reads requirements saved on the job", () => {
    expect(isEligible(custom, { qualification: "cpl", years: 3 })).toBe(true);
    expect(isEligible(custom, { qualification: "cpl", years: 1 })).toBe(false);
    expect(isEligible(custom, { qualification: "graduate", years: 3 })).toBe(false);
  });

  test("getJobRequirements gives every sample job requirements to edit", () => {
    jobs.forEach((job) => expect(getJobRequirements(job).accepts.length).toBeGreaterThan(0));
    expect(getJobRequirements(custom)).toBe(custom.requirements);
  });
});

describe("matchesFilters", () => {
  const search = (filters) => jobs.filter((job) => matchesFilters(job, { ...EMPTY_FILTERS, ...filters }));

  test("matches every job with empty filters", () => {
    expect(search({})).toHaveLength(jobs.length);
  });

  test("finds a job by department name in either language", () => {
    expect(titles(search({ query: "pilots" }))).toEqual(["First Officer"]);
    expect(titles(search({ query: "पायलट" }))).toEqual(["First Officer"]);
  });

  test("ignores case and surrounding spaces", () => {
    expect(titles(search({ query: "  CABIN crew " }))).toEqual(["Cabin Crew"]);
  });

  test("finds a city in either language", () => {
    expect(titles(search({ location: "pune" }))).toEqual(["First Officer"]);
    expect(titles(search({ location: "पुणे" }))).toEqual(["First Officer"]);
  });

  test("requires all filters to match", () => {
    expect(search({ category: "cargo", location: "Pune" })).toEqual([]);
  });
});

describe("isEligible", () => {
  const eligible = (qualification, years) => titles(jobs.filter((job) => isEligible(job, { qualification, years })));

  test("only offers the pilot job to licence holders", () => {
    expect(eligible("cpl", 0)).toEqual(["First Officer"]);
    expect(eligible("postgraduate", 3)).not.toContain("First Officer");
  });

  test("applies the minimum experience", () => {
    expect(eligible("graduate", 0)).not.toContain("IT Support Engineer");
    expect(eligible("graduate", 1)).toContain("IT Support Engineer");
  });

  test("gives every job at least one qualification that can match it", () => {
    const options = copy.en.qualificationOptions.map((option) => option.value);
    jobs.forEach((job) => {
      expect(options.some((qualification) => isEligible(job, { qualification, years: 3 }))).toBe(true);
    });
  });
});

describe("sortJobs", () => {
  test("puts the soonest closing date first without changing the input", () => {
    const original = [...jobs];
    const sorted = sortJobs(jobs, "closing");
    expect(sorted[0].expiresAt).toBe("2026-12-15");
    expect(jobs).toEqual(original);
  });

  test("sorts by title in the chosen language", () => {
    expect(sortJobs(jobs, "title", "en")[0].title.en).toBe("Aircraft Maintenance Technician");
    expect(sortJobs(jobs, "title", "hi")).toHaveLength(jobs.length);
  });
});

describe("getRelatedJobs", () => {
  test("never returns the job itself and honours the limit", () => {
    const job = getJob("1");
    const related = getRelatedJobs(job, jobs);
    expect(related).toHaveLength(3);
    expect(related).not.toContain(job);
  });

  test("prefers jobs for the same type of employer", () => {
    const job = getJob("1");
    getRelatedJobs(job, jobs).forEach((item) => expect(item.audience).toBe(job.audience));
  });
});

describe("getJobStats", () => {
  test("counts only what is in the list", () => {
    expect(getJobStats(jobs)).toEqual({ roles: 9, departments: 9, cities: 9 });
    expect(getJobStats([])).toEqual({ roles: 0, departments: 0, cities: 0 });
  });
});

describe("formatClosingDate", () => {
  test("formats the date in the chosen language", () => {
    expect(formatClosingDate("2026-12-31", "en")).toBe("31 Dec");
    expect(formatClosingDate("2026-12-31", "hi")).toMatch(/31/);
  });
});

describe("content", () => {
  test("every job has English and Hindi text and a known category", () => {
    const ids = categories.map((category) => category.id);
    jobs.forEach((job) => {
      expect(ids).toContain(job.category);
      ["title", "company", "location", "qualification", "eligibility", "summary"].forEach((field) => {
        expect(job[field].en, `${job.id} ${field}`).toBeTruthy();
        expect(job[field].hi, `${job.id} ${field}`).toBeTruthy();
      });
    });
  });

  test("every category has a job and a career guide", () => {
    categories.forEach((category) => {
      expect(jobs.some((job) => job.category === category.id)).toBe(true);
      expect(copy.en.guides.some((guide) => guide.category === category.id)).toBe(true);
      expect(copy.hi.guides.some((guide) => guide.category === category.id)).toBe(true);
    });
  });

  test("Hindi copy has every English key, with the same shape", () => {
    expect(Object.keys(copy.hi).sort()).toEqual(Object.keys(copy.en).sort());
    Object.keys(copy.en).forEach((key) => {
      expect(typeof copy.hi[key], key).toBe(typeof copy.en[key]);
      if (Array.isArray(copy.en[key])) expect(copy.hi[key], key).toHaveLength(copy.en[key].length);
    });
  });

  test("the site never names a real airline as a listing company", () => {
    const companies = jobs.map((job) => job.company.en.toLowerCase()).join(" ");
    expect(companies).not.toMatch(/indigo|interglobe|air india|spicejet|akasa|vistara/);
  });
});
