import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const MIN_PASSWORD_LENGTH = 12;
const MIN_SECRET_LENGTH = 32;
const MAX_TRACKED_LOGIN_KEYS = 10_000;

/** Admin stays locked until all three values are set, so a missing variable can never open the panel. */
export function isAdminConfigured() {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = process.env;
  return Boolean(ADMIN_USERNAME) && (ADMIN_PASSWORD?.length ?? 0) >= MIN_PASSWORD_LENGTH && (ADMIN_SESSION_SECRET?.length ?? 0) >= MIN_SECRET_LENGTH;
}

function digest(value) {
  return createHash("sha256").update(value).digest();
}

/** Hashes both sides first, so the comparison takes the same time whatever the length of the guess. */
export function passwordMatches(candidate) {
  if (!isAdminConfigured() || typeof candidate !== "string") return false;
  return timingSafeEqual(digest(candidate), digest(process.env.ADMIN_PASSWORD));
}

/** Checks both values every time, so the response time does not reveal whether the username was right. */
export function credentialsMatch(username, password) {
  if (!isAdminConfigured() || typeof username !== "string") return false;
  const usernameIsRight = timingSafeEqual(digest(username), digest(process.env.ADMIN_USERNAME));
  const passwordIsRight = passwordMatches(password);
  return usernameIsRight && passwordIsRight;
}

/** The key includes the password, so changing the password signs out every existing session. */
function sign(expiry) {
  return createHmac("sha256", `${process.env.ADMIN_SESSION_SECRET}:${process.env.ADMIN_PASSWORD}`).update(expiry).digest("hex");
}

export function createSessionToken(now = Date.now()) {
  if (!isAdminConfigured()) throw new Error("Admin login is not configured.");
  const expiry = String(now + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expiry}.${sign(expiry)}`;
}

export function verifySessionToken(token, now = Date.now()) {
  if (!isAdminConfigured() || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !/^\d+$/.test(parts[0])) return false;
  const [expiry, signature] = parts;
  const signatureMatches = timingSafeEqual(digest(signature), digest(sign(expiry)));
  return signatureMatches && now < Number(expiry);
}

/** The key rate limits use for one visitor. A forwarded address can be faked, so each limit also needs a cap across all visitors. */
export function clientKeyFrom(headers) {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}

/** Counts failed logins per key in this server's memory, so a restart clears the counts. */
export function createLoginLimiter({ maxFailures, windowMs }) {
  const failures = new Map();

  function prune(now) {
    if (failures.size < MAX_TRACKED_LOGIN_KEYS) return;
    failures.forEach((entry, key) => {
      if (now >= entry.windowEnd) failures.delete(key);
    });
  }

  return {
    isBlocked(key, now = Date.now()) {
      const entry = failures.get(key);
      return Boolean(entry) && now < entry.windowEnd && entry.count >= maxFailures;
    },
    recordFailure(key, now = Date.now()) {
      prune(now);
      const entry = failures.get(key);
      const isCurrent = entry && now < entry.windowEnd;
      failures.set(key, isCurrent ? { ...entry, count: entry.count + 1 } : { count: 1, windowEnd: now + windowMs });
    },
    reset(key) {
      failures.delete(key);
    },
  };
}
