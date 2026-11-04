import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./adminAuth";

export async function isAdminSignedIn() {
  // Checking a session compares its expiry with the current time, so it can only run at request time.
  await connection();
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/** Every admin page and action calls this itself, because a layout check does not run on each navigation or action. */
export async function requireAdmin() {
  if (!(await isAdminSignedIn())) redirect("/admin/login");
}
