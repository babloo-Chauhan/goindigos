import { createHash, randomBytes } from "node:crypto";
import { Binary, MongoClient } from "mongodb";
import { jobs as sampleJobs } from "../data/jobs";

/** What the site shows until the admin panel saves something else. */
export const DEFAULT_SETTINGS = { logo: "/images/indigo-logo.png", email: "", phone: "", contactFormUrl: "" };

export const MAX_LEADS_SHOWN = 200;
export const MAX_LEADS_STORED = 5000;

const DEFAULT_DATABASE = "aerocareer";
const CONNECT_TIMEOUT_MS = 5000;
const SETTINGS_ID = "site";
const JOBS_SEEDED_ID = "jobsSeeded";
const UPLOADS_URL = "/uploads/";
const UPLOAD_NAME = /^[a-f0-9]{32}\.(png|jpg|webp)$/;
const CONTENT_TYPES = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

/** Kept on globalThis so that dev reloads reuse one connection pool instead of opening a new one each time. */
const connection = (globalThis.__contentStoreConnection ??= { uri: null, client: null, seeding: new Map() });

function getClient(uri) {
  if (connection.uri !== uri) {
    connection.client?.close().catch((error) => console.error("[store] Closing the old connection failed:", error));
    connection.uri = uri;
    connection.client = new MongoClient(uri, { serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS });
  }
  return connection.client;
}

/** @returns The database, or null when MONGODB_URI is not set. */
function findDatabase() {
  const uri = process.env.MONGODB_URI;
  return uri ? getClient(uri).db(process.env.MONGODB_DB || DEFAULT_DATABASE) : null;
}

function requireDatabase() {
  const database = findDatabase();
  if (!database) throw new Error("MONGODB_URI is not set, so nothing can be saved.");
  return database;
}

export async function closeContentStore() {
  await connection.client?.close();
  connection.uri = null;
  connection.client = null;
}

function jobFromDocument({ _id, order, ...job }) {
  return { ...job, id: _id };
}

function jobToDocument({ id, ...job }, order) {
  return { ...job, _id: id, order };
}

/** Copies the samples into the database before the first change. Safe to repeat, so a crash midway cannot lose jobs. */
async function seedJobs(database) {
  const meta = database.collection("meta");
  if (await meta.findOne({ _id: JOBS_SEEDED_ID })) return;
  await database.collection("jobs").bulkWrite(sampleJobs.map((job, index) => {
    const { _id, ...fields } = jobToDocument(job, index);
    return { updateOne: { filter: { _id }, update: { $setOnInsert: fields }, upsert: true } };
  }));
  await meta.updateOne({ _id: JOBS_SEEDED_ID }, { $set: { at: new Date() } }, { upsert: true });
}

/** Saves that arrive together share one run, or a slower run could put back a job that a faster save just deleted. */
function ensureJobsSeeded(database) {
  const { seeding } = connection;
  const key = database.databaseName;
  if (!seeding.has(key)) {
    seeding.set(key, seedJobs(database).finally(() => seeding.delete(key)));
  }
  return seeding.get(key);
}

export async function readJobs() {
  const database = findDatabase();
  if (!database || !(await database.collection("meta").findOne({ _id: JOBS_SEEDED_ID }))) return sampleJobs;
  const documents = await database.collection("jobs").find().sort({ order: 1 }).toArray();
  return documents.map(jobFromDocument);
}

export async function createJob(data) {
  const database = requireDatabase();
  await ensureJobsSeeded(database);
  const job = { ...data, id: randomBytes(4).toString("hex") };
  await database.collection("jobs").insertOne(jobToDocument(job, Date.now()));
  return job;
}

/** @returns {Promise<object | null>} The saved job, or null when no job has this id. */
export async function updateJob(id, data) {
  if (typeof id !== "string") return null;
  const database = requireDatabase();
  await ensureJobsSeeded(database);
  const jobs = database.collection("jobs");
  const existing = await jobs.findOne({ _id: id });
  if (!existing) return null;
  const updated = { ...data, id };
  await jobs.replaceOne({ _id: id }, jobToDocument(updated, existing.order));
  return updated;
}

/** @returns {Promise<boolean>} Whether a job with this id existed. */
export async function deleteJob(id) {
  if (typeof id !== "string") return false;
  const database = requireDatabase();
  await ensureJobsSeeded(database);
  const { deletedCount } = await database.collection("jobs").deleteOne({ _id: id });
  return deletedCount === 1;
}

function settingsFromDocument(document) {
  const { _id, ...settings } = document ?? {};
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function readSettings() {
  const database = findDatabase();
  if (!database) return DEFAULT_SETTINGS;
  return settingsFromDocument(await database.collection("settings").findOne({ _id: SETTINGS_ID }));
}

export async function updateSettings(changes) {
  const saved = await requireDatabase().collection("settings").findOneAndUpdate(
    { _id: SETTINGS_ID },
    { $set: changes },
    { returnDocument: "after", upsert: true },
  );
  return settingsFromDocument(saved);
}

function leadFromDocument({ _id, ...lead }) {
  return { ...lead, id: _id };
}

/** Saves a message from the public contact form. The cap stops a flood from filling the database. */
export async function createLead({ name, email, message }) {
  const leads = requireDatabase().collection("leads");
  if (await leads.countDocuments() >= MAX_LEADS_STORED) throw new Error("The contact lead limit is reached.");
  const lead = { name, email, message, handled: false, createdAt: new Date().toISOString(), id: randomBytes(8).toString("hex") };
  await leads.insertOne({ _id: lead.id, name, email, message, handled: lead.handled, createdAt: lead.createdAt });
  return lead;
}

/** @returns {Promise<{ leads: object[], total: number, newCount: number }>} The newest leads, with counts across all of them. */
export async function readLeads(limit = MAX_LEADS_SHOWN) {
  const database = findDatabase();
  if (!database) return { leads: [], total: 0, newCount: 0 };
  const collection = database.collection("leads");
  const [documents, total, newCount] = await Promise.all([
    collection.find().sort({ createdAt: -1 }).limit(limit).toArray(),
    collection.countDocuments(),
    collection.countDocuments({ handled: false }),
  ]);
  return { leads: documents.map(leadFromDocument), total, newCount };
}

/** @returns {Promise<boolean>} Whether a lead with this id exists. */
export async function setLeadHandled(id, handled) {
  if (typeof id !== "string") return false;
  const { matchedCount } = await requireDatabase().collection("leads").updateOne({ _id: id }, { $set: { handled: handled === true } });
  return matchedCount === 1;
}

/** @returns {Promise<boolean>} Whether a lead with this id existed. */
export async function deleteLead(id) {
  if (typeof id !== "string") return false;
  const { deletedCount } = await requireDatabase().collection("leads").deleteOne({ _id: id });
  return deletedCount === 1;
}

/** Names the file after its contents, so a new logo always gets a new address and browsers can cache it for good. */
export async function saveLogo(bytes, extension) {
  const name = `${createHash("sha256").update(bytes).digest("hex").slice(0, 32)}.${extension}`;
  await requireDatabase().collection("uploads").updateOne(
    { _id: name },
    { $set: { bytes: new Binary(bytes), contentType: CONTENT_TYPES[extension] } },
    { upsert: true },
  );
  return `${UPLOADS_URL}${name}`;
}

/** @returns {Promise<{ bytes: Buffer, contentType: string } | null>} */
export async function readUpload(name) {
  const database = findDatabase();
  if (!database || !UPLOAD_NAME.test(name)) return null;
  const upload = await database.collection("uploads").findOne({ _id: name });
  return upload && { bytes: Buffer.from(upload.bytes.buffer), contentType: upload.contentType };
}

/** Deletes a logo saved by saveLogo. Any other address, such as a built-in image, is left alone. */
export async function deleteUpload(url) {
  const name = url.startsWith(UPLOADS_URL) ? url.slice(UPLOADS_URL.length) : "";
  if (UPLOAD_NAME.test(name)) await requireDatabase().collection("uploads").deleteOne({ _id: name });
}
