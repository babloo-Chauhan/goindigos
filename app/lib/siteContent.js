import { cacheLife, cacheTag } from "next/cache";
import { readJobs, readSettings } from "./contentStore";

export const SITE_CONTENT_TAG = "site-content";

/**
 * The saved jobs and settings for the public pages. Admin saves expire the tag straight away.
 * The short cache life covers a restart, which forgets that tag and would otherwise keep serving the pages made at build time.
 */
export async function getSiteContent() {
  "use cache";
  cacheTag(SITE_CONTENT_TAG);
  cacheLife("minutes");
  const [jobs, settings] = await Promise.all([readJobs(), readSettings()]);
  return { jobs, settings };
}
