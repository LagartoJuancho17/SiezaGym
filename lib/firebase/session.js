import { cookies } from "next/headers";
import { getAdminAuth } from "./admin";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "./constants";

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE };

export async function createSessionCookie(idToken) {
  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE * 1000,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    return await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
