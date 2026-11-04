import nodemailer from "nodemailer";
import { clientKeyFrom, createLoginLimiter } from "../../lib/adminAuth";
import { createLead } from "../../lib/contentStore";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = 6 * 1024 * 1024;
// Commas and semicolons are refused because mail software reads them as a second recipient.
const EMAIL_PATTERN = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;
const MOBILE_PATTERN = /^(\+91[ -]?)?[6-9][0-9]{9}$/;

const FORM_WINDOW_MS = 10 * 60 * 1000;
const ALL_SENDERS = "all";

// Anyone can send these forms, and each one writes to the database or sends email, so both limits keep them from being flooded.
const formsPerSender = createLoginLimiter({ maxFailures: 5, windowMs: FORM_WINDOW_MS });
const formsOverall = createLoginLimiter({ maxFailures: 100, windowMs: FORM_WINDOW_MS });

/** Counts this submission, and returns the reply to send when the sender is over a limit. */
function rejectIfOverLimit(request) {
  const sender = clientKeyFrom(request.headers);
  if (formsPerSender.isBlocked(sender) || formsOverall.isBlocked(ALL_SENDERS)) {
    return Response.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }
  formsPerSender.recordFailure(sender);
  formsOverall.recordFailure(ALL_SENDERS);
  return null;
}

/** @returns {Promise<boolean>} Whether the lead is safely stored. A failure is logged, and the email can still deliver it. */
async function saveLead(lead) {
  if (!process.env.MONGODB_URI) return false;
  try {
    await createLead(lead);
    return true;
  } catch (error) {
    // Only the message, because the full error can include what the visitor typed.
    console.error("[forms] Saving a contact lead failed:", error.message);
    return false;
  }
}

function getText(formData, name, maxLength = 200) {
  const value = formData.get(name);
  if (value === null) return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : null;
}

function headerText(value) {
  return value.replace(/[\r\n]+/g, " ").replace(/[\u0000-\u001f\u007f]/g, "");
}

function getMailConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO } = process.env;
  const port = Number(SMTP_PORT);
  if (!SMTP_HOST || !Number.isInteger(port) || port < 1 || port > 65535 || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !MAIL_TO) {
    return null;
  }

  return {
    from: MAIL_FROM,
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    to: MAIL_TO,
  };
}

function badRequest() {
  return Response.json({ error: "Invalid form submission." }, { status: 400 });
}

export async function POST(request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: "Form submission is too large." }, { status: 413 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest();
  }

  const type = getText(formData, "type", 20);
  const name = getText(formData, "name", 120);
  const email = getText(formData, "email", 254);
  if (!name || name === null || typeof email !== "string" || !EMAIL_PATTERN.test(email)) return badRequest();

  let subject;
  let text;
  let attachments = [];
  let leadSaved = false;

  if (type === "contact") {
    const message = getText(formData, "message", 5000);
    if (!message || message === null) return badRequest();
    // People never see this field, so a filled one means a bot. It gets the normal reply, so it does not learn to adapt.
    if (formData.get("contact_url_2")) return Response.json({ ok: true });
    const rejection = rejectIfOverLimit(request);
    if (rejection) return rejection;
    leadSaved = await saveLead({ name, email, message });
    subject = `Website contact message from ${headerText(name)}`;
    text = `Contact message\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
  } else if (type === "application") {
    const mobile = getText(formData, "mobile", 24);
    const currentCity = getText(formData, "currentCity", 120);
    const preferredLocation = getText(formData, "preferredLocation", 120);
    const position = getText(formData, "position", 120);
    const qualification = getText(formData, "qualification", 160);
    const experience = getText(formData, "experience", 20);
    const skills = getText(formData, "skills", 1000);
    const jobTitle = getText(formData, "jobTitle", 120);
    const resume = formData.get("resume");

    if (
      !MOBILE_PATTERN.test(mobile)
      || !currentCity || currentCity === null
      || !preferredLocation || preferredLocation === null
      || !position || position === null
      || !qualification || qualification === null
      || !["fresher", "1-2", "3-5", "5+"].includes(experience)
      || skills === null
      || !jobTitle || jobTitle === null
      || formData.get("consent") !== "on"
    ) {
      return badRequest();
    }
    const rejection = rejectIfOverLimit(request);
    if (rejection) return rejection;

    text = [
      "Application form submission",
      "",
      `Job: ${jobTitle}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Mobile: ${mobile}`,
      `Current city: ${currentCity}`,
      `Preferred location: ${preferredLocation}`,
      `Position: ${position}`,
      `Qualification: ${qualification}`,
      `Experience: ${experience}`,
      `Skills: ${skills || "Not provided"}`,
    ].join("\n");
    subject = `Application enquiry: ${headerText(jobTitle)} - ${headerText(name)}`;

    if (resume && typeof resume !== "string" && resume.size > 0) {
      if (resume.size > MAX_RESUME_BYTES || resume.type !== "application/pdf") return badRequest();
      const content = Buffer.from(await resume.arrayBuffer());
      if (content.subarray(0, 5).toString("ascii") !== "%PDF-") return badRequest();
      const filename = resume.name.replace(/[^\w.-]/g, "_").slice(0, 100) || "resume.pdf";
      attachments = [{ filename, content, contentType: "application/pdf" }];
    }
  } else {
    return badRequest();
  }

  const config = getMailConfig();
  if (!config) {
    return leadSaved ? Response.json({ ok: true }) : Response.json({ error: "Email service is not configured." }, { status: 503 });
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  try {
    await transporter.sendMail({
      from: config.from,
      to: config.to,
      replyTo: email,
      subject,
      text,
      attachments,
    });
  } catch (error) {
    console.error("[forms] Email delivery failed:", error);
    if (!leadSaved) return Response.json({ error: "Could not deliver the form submission." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
