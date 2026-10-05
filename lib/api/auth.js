import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getUserProfile } from "@/lib/users/users";

/**
 * Autenticación de la API que usa la app de iOS.
 *
 * La web usa la cookie de sesión; el teléfono manda el ID token de Firebase en
 * `Authorization: Bearer <token>`. El Admin SDK lo verifica (firma, emisor,
 * vencimiento) y de ahí sale el uid: el cliente nunca dice quién es, lo prueba.
 */
export function bearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function uidFromRequest(request) {
  const token = bearerToken(request);
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export function apiError(status, code, message) {
  return NextResponse.json({ error: code, mensaje: message }, { status });
}

/** Corre el handler con el uid verificado, o responde 401. */
export async function withUser(request, handler) {
  const uid = await uidFromRequest(request);
  if (!uid) return apiError(401, "sin-sesion", "Tu sesión venció. Volvé a entrar.");
  try {
    return await handler(uid);
  } catch (error) {
    console.error("[api]", error);
    return apiError(400, "error", error?.message || "No se pudo completar.");
  }
}

/** Igual que withUser, pero además exige ser entrenador (o admin). */
export async function withCoach(request, handler) {
  return withUser(request, async (uid) => {
    const profile = await getUserProfile(uid);
    if (!profile?.isCoach && !profile?.isAdmin) {
      return apiError(403, "no-es-coach", "Tu cuenta no tiene el panel de entrenador.");
    }
    return handler(uid, profile);
  });
}
