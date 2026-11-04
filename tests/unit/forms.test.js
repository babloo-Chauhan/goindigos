import { afterEach, describe, expect, it } from "vitest";
import { POST } from "../../app/api/forms/route.js";

const mailEnvironment = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "MAIL_TO"];
const savedEnvironment = Object.fromEntries(mailEnvironment.map((name) => [name, process.env[name]]));

afterEach(() => {
  mailEnvironment.forEach((name) => {
    if (savedEnvironment[name] === undefined) delete process.env[name];
    else process.env[name] = savedEnvironment[name];
  });
});

function createRequest(fields, headers = {}) {
  const body = new FormData();
  Object.entries(fields).forEach(([name, value]) => body.set(name, value));
  return new Request("http://localhost/api/forms", { method: "POST", body, headers });
}

describe("form email endpoint", () => {
  it("rejects malformed submissions", async () => {
    const response = await POST(createRequest({ type: "contact", name: "A", email: "not-an-email", message: "Hello" }));

    expect(response.status).toBe(400);
  });

  it("rejects requests that exceed the upload limit", async () => {
    const response = await POST(createRequest(
      { type: "contact", name: "A", email: "a@example.com", message: "Hello" },
      { "content-length": String(6 * 1024 * 1024 + 1) },
    ));

    expect(response.status).toBe(413);
  });

  it("reports missing SMTP configuration instead of claiming delivery", async () => {
    mailEnvironment.forEach((name) => { delete process.env[name]; });
    const response = await POST(createRequest({ type: "contact", name: "A", email: "a@example.com", message: "Hello" }));

    expect(response.status).toBe(503);
  });
});
