"use server";

import { updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clientKeyFrom,
  createLoginLimiter,
  createSessionToken,
  credentialsMatch,
  isAdminConfigured,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "../lib/adminAuth";
import { requireAdmin } from "../lib/adminSession";
import { parseJobForm, parseLogoFile, parseSettingsForm } from "../lib/adminValidation";
import {
  createJob,
  deleteJob,
  deleteLead,
  deleteUpload,
  readSettings,
  saveLogo,
  setLeadHandled,
  updateJob,
  updateSettings,
} from "../lib/contentStore";
import { SITE_CONTENT_TAG } from "../lib/siteContent";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const COOKIE_OPTIONS = { httpOnly: true, path: "/admin", sameSite: "strict", secure: process.env.NODE_ENV === "production" };
const SAVE_FAILED = "Could not save. Check that the server can reach MongoDB, then try again.";

const clientLogins = createLoginLimiter({ maxFailures: 5, windowMs: LOGIN_WINDOW_MS });
// A forwarded address can be faked, so this limit holds across all clients. It is set high because anyone can use it up, which also blocks the real admin.
const allLogins = createLoginLimiter({ maxFailures: 100, windowMs: LOGIN_WINDOW_MS });
const ALL_CLIENTS = "all";

export async function loginAction(_previous, formData) {
  if (!isAdminConfigured()) return { error: "Admin login is not set up on this server." };
  const client = clientKeyFrom(await headers());
  if (clientLogins.isBlocked(client) || allLogins.isBlocked(ALL_CLIENTS)) {
    return { error: "Too many failed attempts. Try again in 15 minutes." };
  }
  if (!credentialsMatch(formData.get("username"), formData.get("password"))) {
    clientLogins.recordFailure(client);
    allLogins.recordFailure(ALL_CLIENTS);
    return { error: "Incorrect username or password." };
  }
  clientLogins.reset(client);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(), { ...COOKIE_OPTIONS, maxAge: SESSION_MAX_AGE_SECONDS });
  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: SESSION_COOKIE, ...COOKIE_OPTIONS });
  redirect("/admin/login");
}

/** Works out the logo address the form asks for: the same one, a new upload, or none. */
async function resolveLogo(formData, currentLogo) {
  if (formData.get("removeLogo") === "on") return { logo: "" };
  const file = formData.get("logo");
  if (!file || typeof file === "string" || file.size === 0) return { logo: currentLogo };
  const parsed = await parseLogoFile(file);
  if (parsed.error) return { error: parsed.error };
  return { logo: await saveLogo(parsed.bytes, parsed.extension) };
}

export async function saveSettingsAction(_previous, formData) {
  await requireAdmin();
  const parsed = parseSettingsForm(formData);
  if (parsed.errors) return { errors: parsed.errors };

  let saved;
  try {
    const { logo: currentLogo } = await readSettings();
    const { error, logo } = await resolveLogo(formData, currentLogo);
    if (error) return { errors: { logo: error } };
    saved = await updateSettings({ ...parsed.settings, logo });
    if (currentLogo !== logo) await deleteUpload(currentLogo);
  } catch (error) {
    console.error("[admin] Saving settings failed:", error);
    return { error: SAVE_FAILED };
  }
  updateTag(SITE_CONTENT_TAG);
  return { savedAt: Date.now(), settings: saved };
}

export async function createJobAction(_previous, formData) {
  await requireAdmin();
  const parsed = parseJobForm(formData);
  if (parsed.errors) return { errors: parsed.errors };
  try {
    await createJob(parsed.job);
  } catch (error) {
    console.error("[admin] Creating a job failed:", error);
    return { error: SAVE_FAILED };
  }
  updateTag(SITE_CONTENT_TAG);
  redirect("/admin/jobs?notice=created");
}

export async function updateJobAction(id, _previous, formData) {
  await requireAdmin();
  const parsed = parseJobForm(formData);
  if (parsed.errors) return { errors: parsed.errors };
  let updated;
  try {
    updated = await updateJob(id, parsed.job);
  } catch (error) {
    console.error("[admin] Updating a job failed:", error);
    return { error: SAVE_FAILED };
  }
  if (!updated) return { error: "This job no longer exists." };
  updateTag(SITE_CONTENT_TAG);
  redirect("/admin/jobs?notice=updated");
}

export async function deleteJobAction(id) {
  await requireAdmin();
  let existed;
  try {
    existed = await deleteJob(id);
  } catch (error) {
    console.error("[admin] Deleting a job failed:", error);
    redirect("/admin/jobs?notice=delete-failed");
  }
  updateTag(SITE_CONTENT_TAG);
  redirect(`/admin/jobs?notice=${existed ? "deleted" : "already-deleted"}`);
}

export async function setLeadHandledAction(id, handled) {
  await requireAdmin();
  try {
    await setLeadHandled(id, handled);
  } catch (error) {
    console.error("[admin] Updating a lead failed:", error);
    redirect("/admin/leads?notice=failed");
  }
  redirect("/admin/leads?notice=updated");
}

export async function deleteLeadAction(id) {
  await requireAdmin();
  try {
    await deleteLead(id);
  } catch (error) {
    console.error("[admin] Deleting a lead failed:", error);
    redirect("/admin/leads?notice=failed");
  }
  redirect("/admin/leads?notice=deleted");
}
