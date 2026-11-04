import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "../../app/api/forms/route.js";
import { closeContentStore, createLead, deleteLead, MAX_LEADS_STORED, readLeads, setLeadHandled } from "../../app/lib/contentStore";

// Needs a running MongoDB. Each test uses its own throwaway database, so real data is never touched.
const TEST_URI = process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017";
const MAIL_VARIABLES = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "MAIL_TO"];
const CONTACT = { type: "contact", name: "Asha", email: "asha@example.com", message: "Is this role open?" };
const APPLICATION = {
  ...CONTACT,
  type: "application",
  mobile: "9876543210",
  currentCity: "Delhi",
  preferredLocation: "Pune",
  position: "Cabin crew",
  qualification: "Graduate",
  experience: "fresher",
  jobTitle: "Cabin Crew",
  consent: "on",
};
const LEAD = { name: "Asha", email: "asha@example.com", message: "Hello" };

let adminClient;
let databaseName;

function send(fields, client = randomBytes(6).toString("hex")) {
  const body = new FormData();
  Object.entries(fields).forEach(([name, value]) => body.set(name, value));
  return POST(new Request("http://localhost/api/forms", { method: "POST", body, headers: { "x-forwarded-for": client } }));
}

function stubUnreachableMail() {
  vi.stubEnv("SMTP_HOST", "127.0.0.1");
  vi.stubEnv("SMTP_PORT", "1");
  vi.stubEnv("SMTP_USER", "user");
  vi.stubEnv("SMTP_PASS", "pass");
  vi.stubEnv("MAIL_FROM", "from@example.com");
  vi.stubEnv("MAIL_TO", "to@example.com");
}

beforeAll(async () => {
  adminClient = await new MongoClient(TEST_URI).connect();
});

beforeEach(() => {
  databaseName = `aerocareer_test_${randomBytes(6).toString("hex")}`;
  vi.stubEnv("MONGODB_URI", TEST_URI);
  vi.stubEnv("MONGODB_DB", databaseName);
  MAIL_VARIABLES.forEach((name) => vi.stubEnv(name, ""));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await adminClient.db(databaseName).dropDatabase();
});

afterAll(async () => {
  await closeContentStore();
  await adminClient.close();
});

describe("lead storage", () => {
  test("starts empty", async () => {
    expect(await readLeads()).toEqual({ leads: [], total: 0, newCount: 0 });
  });

  test("saves a lead as new, with its time, and only the known fields", async () => {
    const created = await createLead({ ...LEAD, extra: "x" });
    expect(created).toMatchObject({ ...LEAD, handled: false });
    expect(created).not.toHaveProperty("extra");
    expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt);
    expect((await readLeads()).leads).toEqual([created]);
  });

  test("lists the newest first and counts the new ones", async () => {
    const first = await createLead(LEAD);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await createLead({ ...LEAD, name: "Ravi" });
    await setLeadHandled(first.id, true);
    const { leads, newCount, total } = await readLeads();
    expect(leads.map((lead) => lead.id)).toEqual([second.id, first.id]);
    expect({ newCount, total }).toEqual({ newCount: 1, total: 2 });
  });

  test("shows only as many as asked for, and still counts them all", async () => {
    await Promise.all([1, 2, 3].map(() => createLead(LEAD)));
    const { leads, total } = await readLeads(2);
    expect(leads).toHaveLength(2);
    expect(total).toBe(3);
  });

  test("marks a lead handled and back, and reports a missing one", async () => {
    const { id } = await createLead(LEAD);
    expect(await setLeadHandled(id, true)).toBe(true);
    expect((await readLeads()).leads[0].handled).toBe(true);
    expect(await setLeadHandled(id, false)).toBe(true);
    expect((await readLeads()).leads[0].handled).toBe(false);
    expect(await setLeadHandled("nope", true)).toBe(false);
  });

  test("deletes a lead, and reports whether it existed", async () => {
    const { id } = await createLead(LEAD);
    expect(await deleteLead(id)).toBe(true);
    expect(await deleteLead(id)).toBe(false);
    expect((await readLeads()).total).toBe(0);
  });

  test.each([[{ $ne: null }], [null], [1]])("treats the non-text id %j as no match, so it cannot act as a query", async (id) => {
    await createLead(LEAD);
    expect(await setLeadHandled(id, true)).toBe(false);
    expect(await deleteLead(id)).toBe(false);
    expect((await readLeads()).newCount).toBe(1);
  });

  test("reads as empty and refuses to save without MONGODB_URI", async () => {
    vi.stubEnv("MONGODB_URI", "");
    expect((await readLeads()).total).toBe(0);
    await expect(createLead(LEAD)).rejects.toThrow("MONGODB_URI");
  });
});

describe("contact form endpoint", () => {
  test("saves the lead and succeeds even when email is not set up", async () => {
    const response = await send(CONTACT);
    expect(response.status).toBe(200);
    expect((await readLeads()).leads[0]).toMatchObject({ name: "Asha", email: "asha@example.com", message: "Is this role open?", handled: false });
  });

  test("still succeeds when the email fails, because the lead is safe", async () => {
    stubUnreachableMail();
    expect((await send(CONTACT)).status).toBe(200);
    expect((await readLeads()).total).toBe(1);
  });

  test("reports a failure when there is no database and no email, so nothing is lost silently", async () => {
    vi.stubEnv("MONGODB_URI", "");
    expect((await send(CONTACT)).status).toBe(503);
  });

  test("reports a failure when there is no database and the email fails", async () => {
    vi.stubEnv("MONGODB_URI", "");
    stubUnreachableMail();
    expect((await send(CONTACT)).status).toBe(502);
  });

  test("does not save an invalid form", async () => {
    expect((await send({ ...CONTACT, email: "nope" })).status).toBe(400);
    expect((await readLeads()).total).toBe(0);
  });

  test("quietly drops a form that filled the hidden trap field, which only bots see", async () => {
    expect((await send({ ...CONTACT, contact_url_2: "https://spam.example.com" })).status).toBe(200);
    expect((await readLeads()).total).toBe(0);
  });

  test("slows down one sender and leaves others alone", async () => {
    const sender = randomBytes(6).toString("hex");
    const statuses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) statuses.push((await send(CONTACT, sender)).status);
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    expect((await readLeads()).total).toBe(5);
    expect((await send(CONTACT)).status).toBe(200);
  });

  test("does not save application forms as contact leads", async () => {
    expect((await send(APPLICATION)).status).toBe(503);
    expect((await readLeads()).total).toBe(0);
  });

  test("slows down one sender of application forms too", async () => {
    const sender = randomBytes(6).toString("hex");
    const statuses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) statuses.push((await send(APPLICATION, sender)).status);
    expect(statuses).toEqual([503, 503, 503, 503, 503, 429]);
  });

  test.each(["a@example.com,victim@example.com", "a@example.com;victim@example.com", "<a@example.com>"])("refuses the email %j, which could add a recipient", async (email) => {
    expect((await send({ ...CONTACT, email })).status).toBe(400);
    expect((await readLeads()).total).toBe(0);
  });

  test("stops saving at the cap, reports failure with no email, and keeps what is there", async () => {
    await adminClient.db(databaseName).collection("leads").insertMany(
      Array.from({ length: MAX_LEADS_STORED }, (_, index) => ({ _id: String(index), handled: false, createdAt: "2026-01-01T00:00:00.000Z" })),
    );
    expect((await send(CONTACT)).status).toBe(503);
    expect((await readLeads(1)).total).toBe(MAX_LEADS_STORED);
  });
});
