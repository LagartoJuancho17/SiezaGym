import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/auth";
import { getUserProfile } from "@/lib/users/users";
import { shareRoutine, shareUrl } from "@/lib/sharing/sharedRoutines";

/**
 * Crea (o actualiza) el link de una rutina. La app manda la rutina como la
 * tiene en pantalla: puede ser propia o asignada por el coach, y las dos se
 * comparten igual.
 *
 * Cuerpo: { sourceId, name, note, exercises, exerciseNames }
 * Respuesta: { id, url }
 */
export async function POST(request) {
  return withUser(request, async (uid) => {
    const body = await request.json().catch(() => ({}));
    const profile = await getUserProfile(uid);
    const id = await shareRoutine({ uid, displayName: profile?.displayName }, body);
    return NextResponse.json({ id, url: shareUrl(id) });
  });
}
