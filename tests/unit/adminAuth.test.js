import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  createLoginLimiter,
  createSessionToken,
  credentialsMatch,
  isAdminConfigured,
  passwordMatches,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "../../app/lib/adminAuth";

const NOW = 1_800_000_000_000;

beforeEach(() => {
  vi.stubEnv("ADMIN_USERNAME", "owner");
  vi.stubEnv("ADMIN_PASSWORD", "correct horse battery");
  vi.stubEnv("ADMIN_SESSION_SECRET", "s".repeat(32));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isAdminConfigured", () => {
  test("is true once a long password and secret are set", () => {
    expect(isAdminConfigured()).toBe(true);
  });

  test.each([
    ["ADMIN_USERNAME", ""],
    ["ADMIN_PASSWORD", ""],
    ["ADMIN_PASSWORD", "short"],
    ["ADMIN_SESSION_SECRET", ""],
    ["ADMIN_SESSION_SECRET", "too-short"],
  ])("is false when %s is %j", (name, value) => {
    vi.stubEnv(name, value);
    expect(isAdminConfigured()).toBe(false);
  });
});

describe("passwordMatches", () => {
  test("accepts the configured password", () => {
    expect(passwordMatches("correct horse battery")).toBe(true);
  });

  test.each(["", "wrong", "correct horse battery ", null, undefined, 42])("rejects %j", (candidate) => {
    expect(passwordMatches(candidate)).toBe(false);
  });

  test("rejects everything when no password is configured", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(passwordMatches("")).toBe(false);
  });
});

describe("credentialsMatch", () => {
  test("accepts the configured username and password", () => {
    expect(credentialsMatch("owner", "correct horse battery")).toBe(true);
  });

  test.each([
    ["owner", "wrong"],
    ["someone", "correct horse battery"],
    ["", ""],
    [null, "correct horse battery"],
    ["owner", null],
  ])("rejects %j with %j", (username, password) => {
    expect(credentialsMatch(username, password)).toBe(false);
  });

  test("rejects everything when no username is configured", () => {
    vi.stubEnv("ADMIN_USERNAME", "");
    expect(credentialsMatch("", "correct horse battery")).toBe(false);
  });
});

describe("session tokens", () => {
  test("accepts a fresh token", () => {
    expect(verifySessionToken(createSessionToken(NOW), NOW)).toBe(true);
  });

  test("rejects a token once it expires", () => {
    const token = createSessionToken(NOW);
    const expiry = NOW + SESSION_MAX_AGE_SECONDS * 1000;
    expect(verifySessionToken(token, expiry - 1)).toBe(true);
    expect(verifySessionToken(token, expiry)).toBe(false);
  });

  test("rejects a token whose expiry was extended", () => {
    const [, signature] = createSessionToken(NOW).split(".");
    expect(verifySessionToken(`${NOW * 2}.${signature}`, NOW)).toBe(false);
  });

  test.each(["", "garbage", "1.2.3", ".", "abc.def", null, undefined])("rejects the malformed token %j", (token) => {
    expect(verifySessionToken(token, NOW)).toBe(false);
  });

  test("signs out existing sessions when the password changes", () => {
    const token = createSessionToken(NOW);
    vi.stubEnv("ADMIN_PASSWORD", "a different long password");
    expect(verifySessionToken(token, NOW)).toBe(false);
  });

  test("signs out existing sessions when the secret changes", () => {
    const token = createSessionToken(NOW);
    vi.stubEnv("ADMIN_SESSION_SECRET", "t".repeat(32));
    expect(verifySessionToken(token, NOW)).toBe(false);
  });

  test("refuses to issue or accept tokens when admin is not configured", () => {
    const token = createSessionToken(NOW);
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    expect(verifySessionToken(token, NOW)).toBe(false);
    expect(() => createSessionToken(NOW)).toThrow();
  });
});

describe("createLoginLimiter", () => {
  const limiter = () => createLoginLimiter({ maxFailures: 2, windowMs: 1000 });

  test("blocks a key after too many failures and leaves other keys alone", () => {
    const attempts = limiter();
    attempts.recordFailure("a", NOW);
    expect(attempts.isBlocked("a", NOW)).toBe(false);
    attempts.recordFailure("a", NOW);
    expect(attempts.isBlocked("a", NOW)).toBe(true);
    expect(attempts.isBlocked("b", NOW)).toBe(false);
  });

  test("unblocks a key when the window ends", () => {
    const attempts = limiter();
    attempts.recordFailure("a", NOW);
    attempts.recordFailure("a", NOW);
    expect(attempts.isBlocked("a", NOW + 1000)).toBe(false);
  });

  test("starts counting again after a window ends", () => {
    const attempts = limiter();
    attempts.recordFailure("a", NOW);
    attempts.recordFailure("a", NOW + 1000);
    expect(attempts.isBlocked("a", NOW + 1000)).toBe(false);
  });

  test("reset clears the failures for a key", () => {
    const attempts = limiter();
    attempts.recordFailure("a", NOW);
    attempts.recordFailure("a", NOW);
    attempts.reset("a");
    expect(attempts.isBlocked("a", NOW)).toBe(false);
  });
});
