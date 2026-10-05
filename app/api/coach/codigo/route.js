import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/auth";
import { generateCode, revokeCode } from "@/lib/coach/codes";

/**
 * Generar el código de invitación es lo que convierte una cuenta en
 * entrenador (generateCode marca isCoach), igual que en la web: por eso este
 * endpoint pide sesión y no rol de coach.
 */
export async function POST(request) {
  return withUser(request, async (uid) => NextResponse.json(await generateCode(uid)));
}

export async function DELETE(request) {
  return withUser(request, async (uid) => NextResponse.json({ revoked: await revokeCode(uid) }));
}
