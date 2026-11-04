import { copy } from "../data/copy";
import { AUDIENCES, categories, EMPLOYMENT_TYPES } from "../data/jobs";

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_MIN_YEARS = 40;
const MAX_EMAIL_LENGTH = 254;
const MAX_URL_LENGTH = 500;

/** Stricter than the contact form's check, because this address goes into a public mailto link. */
const EMAIL_PATTERN = /^[^\s@?&#%<>"'=]+@[^\s@?&#%<>"'=]+\.[^\s@?&#%<>"'=]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{6,19}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const JOB_TEXT_FIELDS = [
  ["title", 120, "Job title"],
  ["company", 120, "Company"],
  ["location", 120, "Location"],
  ["qualification", 160, "Qualification"],
  ["eligibility", 160, "Eligibility"],
  ["summary", 1000, "Summary"],
];

/** @returns {string | null} The trimmed value, or null when the field holds a file instead of text. */
function readText(formData, name) {
  const value = formData.get(name);
  if (value === null) return "";
  return typeof value === "string" ? value.trim() : null;
}

/** Only https links, because this address becomes a public link and other schemes such as javascript: can run code. */
function isHttpsUrl(value) {
  if (value.length > MAX_URL_LENGTH) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isRealDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function parseChoice(formData, name, allowed, label, errors) {
  const value = readText(formData, name);
  if (allowed.includes(value)) return value;
  errors[name] = `Choose a ${label}.`;
  return "";
}

/** Reads one English and Hindi field pair. Hindi is optional, and the public site needs both, so it falls back to English. */
function parseBilingual(formData, [name, maxLength, label], errors) {
  const en = readText(formData, `${name}_en`);
  const hi = readText(formData, `${name}_hi`);
  if (!en) errors[`${name}_en`] = `${label} is required.`;
  else if (en.length > maxLength) errors[`${name}_en`] = `${label} must be ${maxLength} characters or fewer.`;
  if (hi === null) errors[`${name}_hi`] = `${label} must be text.`;
  else if (hi.length > maxLength) errors[`${name}_hi`] = `${label} must be ${maxLength} characters or fewer.`;
  return { en, hi: hi || en };
}

function parseRequirements(formData, errors) {
  const qualifications = copy.en.qualificationOptions.map((option) => option.value);
  const accepts = formData.getAll("accepts");
  if (accepts.length === 0 || !accepts.every((value) => qualifications.includes(value))) {
    errors.accepts = "Choose at least one accepted qualification.";
  }
  const minYears = readText(formData, "minYears");
  const years = Number(minYears);
  if (!minYears || !Number.isInteger(years) || years < 0 || years > MAX_MIN_YEARS) {
    errors.minYears = `Enter whole years from 0 to ${MAX_MIN_YEARS}.`;
  }
  return { accepts, minYears: years };
}

/**
 * Builds a job from the admin form, keeping only known fields.
 * @param {FormData} formData
 * @returns {{ job: object } | { errors: Record<string, string> }}
 */
export function parseJobForm(formData) {
  const errors = {};
  const text = Object.fromEntries(JOB_TEXT_FIELDS.map((field) => [field[0], parseBilingual(formData, field, errors)]));
  const job = {
    audience: parseChoice(formData, "audience", AUDIENCES, "job type", errors),
    category: parseChoice(formData, "category", categories.map((item) => item.id), "category", errors),
    employment: parseChoice(formData, "employment", EMPLOYMENT_TYPES, "employment type", errors),
    featured: formData.get("featured") === "on",
    ...text,
    expiresAt: readText(formData, "expiresAt"),
    requirements: parseRequirements(formData, errors),
  };
  if (!isRealDate(job.expiresAt)) errors.expiresAt = "Enter a valid closing date.";
  return Object.keys(errors).length > 0 ? { errors } : { job };
}

/**
 * @param {FormData} formData
 * @returns {{ settings: { email: string, phone: string, contactFormUrl: string } } | { errors: Record<string, string> }}
 */
export function parseSettingsForm(formData) {
  const errors = {};
  const email = readText(formData, "email");
  const phone = readText(formData, "phone");
  const contactFormUrl = readText(formData, "contactFormUrl");
  if (email === null || (email && (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)))) {
    errors.email = "Enter a valid email address, or leave it empty.";
  }
  if (phone === null || (phone && !PHONE_PATTERN.test(phone))) {
    errors.phone = "Enter a valid phone number, or leave it empty.";
  }
  if (contactFormUrl === null || (contactFormUrl && !isHttpsUrl(contactFormUrl))) {
    errors.contactFormUrl = "Enter a full link starting with https://, or leave it empty.";
  }
  return Object.keys(errors).length > 0 ? { errors } : { settings: { email, phone, contactFormUrl } };
}

/** Trusts the file's first bytes, not its name or claimed type. SVG is left out on purpose, because it can carry scripts. */
function detectImageExtension(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpg";
  if (bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  return null;
}

/**
 * @param {File} file
 * @returns {Promise<{ bytes: Buffer, extension: string } | { error: string }>}
 */
export async function parseLogoFile(file) {
  if (file.size === 0) return { error: "Choose an image file." };
  if (file.size > MAX_LOGO_BYTES) return { error: "The logo must be 2 MB or smaller." };
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = detectImageExtension(bytes);
  return extension ? { bytes, extension } : { error: "The logo must be a PNG, JPG or WebP image." };
}
