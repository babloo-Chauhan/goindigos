import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { jobs as sampleJobs } from "../../app/data/jobs";
import {
  closeContentStore,
  createJob,
  DEFAULT_SETTINGS,
  deleteJob,
  deleteUpload,
  readJobs,
  readSettings,
  readUpload,
  saveLogo,
  updateJob,
  updateSettings,
} from "../../app/lib/contentStore";

// Needs a running MongoDB. Each test uses its own throwaway database, so real data is never touched.
const TEST_URI = process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017";
const JOB = { title: { en: "New role", hi: "New role" }, expiresAt: "2027-01-01" };
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

let adminClient;
let databaseName;

beforeAll(async () => {
  adminClient = await new MongoClient(TEST_URI).connect();
});

beforeEach(() => {
  databaseName = `aerocareer_test_${randomBytes(6).toString("hex")}`;
  vi.stubEnv("MONGODB_URI", TEST_URI);
  vi.stubEnv("MONGODB_DB", databaseName);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await adminClient.db(databaseName).dropDatabase();
});

afterAll(async () => {
  await closeContentStore();
  await adminClient.close();
});

describe("jobs", () => {
  test("starts from the sample jobs when nothing has been saved", async () => {
    expect(await readJobs()).toEqual(sampleJobs);
  });

  test("creates a job with its own id and keeps the samples after it", async () => {
    const created = await createJob(JOB);
    expect(created).toMatchObject(JOB);
    expect(created.id).toMatch(/^[a-f0-9]{8}$/);
    const stored = await readJobs();
    expect(stored).toHaveLength(sampleJobs.length + 1);
    expect(stored.at(-1)).toEqual(created);
    expect(stored.slice(0, -1)).toEqual(sampleJobs);
  });

  test("updates a sample job in place without changing its id or position", async () => {
    const updated = await updateJob("3", { ...JOB, id: "ignored" });
    expect(updated.id).toBe("3");
    const stored = await readJobs();
    expect(stored).toHaveLength(sampleJobs.length);
    expect(stored.map((job) => job.id)).toEqual(sampleJobs.map((job) => job.id));
    expect(stored.find((job) => job.id === "3")).toEqual({ ...JOB, id: "3" });
  });

  test("returns null when updating a job that does not exist", async () => {
    expect(await updateJob("nope", JOB)).toBeNull();
    expect(await readJobs()).toEqual(sampleJobs);
  });

  test("deletes a job, and reports whether it existed", async () => {
    expect(await deleteJob("3")).toBe(true);
    expect((await readJobs()).some((job) => job.id === "3")).toBe(false);
    expect(await deleteJob("3")).toBe(false);
  });

  test("stays empty after every job is deleted, rather than bringing the samples back", async () => {
    await Promise.all(sampleJobs.map((job) => deleteJob(job.id)));
    expect(await readJobs()).toEqual([]);
  });

  test("keeps every job when several saves arrive together", async () => {
    await Promise.all([1, 2, 3, 4, 5].map((number) => createJob({ ...JOB, number })));
    expect(await readJobs()).toHaveLength(sampleJobs.length + 5);
  });

  test.each([[{ $ne: null }], [{ $gt: "" }], [null], [1]])("treats the non-text id %j as no match, so it cannot act as a query", async (id) => {
    await readJobs();
    expect(await updateJob(id, JOB)).toBeNull();
    expect(await deleteJob(id)).toBe(false);
    expect(await readJobs()).toEqual(sampleJobs);
  });
});

describe("settings", () => {
  test("starts from the defaults", async () => {
    expect(await readSettings()).toEqual(DEFAULT_SETTINGS);
  });

  test("merges changes with what is already saved", async () => {
    await updateSettings({ email: "help@example.com" });
    const saved = await updateSettings({ phone: "+91 98765 43210" });
    const expected = { ...DEFAULT_SETTINGS, email: "help@example.com", phone: "+91 98765 43210" };
    expect(saved).toEqual(expected);
    expect(await readSettings()).toEqual(expected);
  });

  test("keeps an empty logo instead of bringing the default back", async () => {
    await updateSettings({ logo: "" });
    expect((await readSettings()).logo).toBe("");
  });
});

describe("uploads", () => {
  test("saves a logo under a name taken from its contents, and reads it back", async () => {
    const url = await saveLogo(PNG_BYTES, "png");
    expect(url).toMatch(/^\/uploads\/[a-f0-9]{32}\.png$/);
    expect(await saveLogo(PNG_BYTES, "png")).toBe(url);
    const upload = await readUpload(url.split("/").pop());
    expect(upload.contentType).toBe("image/png");
    expect(Buffer.compare(upload.bytes, PNG_BYTES)).toBe(0);
  });

  test("returns null for a missing upload", async () => {
    expect(await readUpload(`${"a".repeat(32)}.png`)).toBeNull();
  });

  test.each(["../jobs.json", "jobs.json", ".env", "a.svg", `${"a".repeat(32)}.svg`])("refuses to read %j", async (name) => {
    expect(await readUpload(name)).toBeNull();
  });

  test("deletes an upload it created, and is safe to call twice", async () => {
    const url = await saveLogo(PNG_BYTES, "png");
    await deleteUpload(url);
    await deleteUpload(url);
    expect(await readUpload(url.split("/").pop())).toBeNull();
  });

  test.each(["/images/indigo-logo.png", "", "/uploads/../other.png"])("leaves %j alone, because it is not an upload", async (url) => {
    const saved = await saveLogo(PNG_BYTES, "png");
    await deleteUpload(url);
    expect(await readUpload(saved.split("/").pop())).not.toBeNull();
  });
});

describe("without MONGODB_URI", () => {
  beforeEach(() => {
    vi.stubEnv("MONGODB_URI", "");
  });

  test("reads fall back to the samples and defaults, so the public site and builds still work", async () => {
    expect(await readJobs()).toEqual(sampleJobs);
    expect(await readSettings()).toEqual(DEFAULT_SETTINGS);
    expect(await readUpload(`${"a".repeat(32)}.png`)).toBeNull();
  });

  test("saves fail with a clear error instead of pretending to work", async () => {
    await expect(createJob(JOB)).rejects.toThrow("MONGODB_URI");
    await expect(updateSettings({ email: "a@example.com" })).rejects.toThrow("MONGODB_URI");
    await expect(saveLogo(PNG_BYTES, "png")).rejects.toThrow("MONGODB_URI");
  });
});
