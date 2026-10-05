import { NextResponse } from "next/server";
import { apiError, withUser } from "@/lib/api/auth";
import { redeemCode } from "@/lib/coach/codes";
import { getLinkedCoach, unlinkCoachFromStudent } from "@/lib/coach/students";

/** Del lado del alumno: con qué entrenador está vinculado. */
export async function GET(request) {
  return withUser(request, async (uid) => NextResponse.json({ coach: await getLinkedCoach(uid) }));
}

/** Vincularse con el código del entrenador. Cuerpo: { code } */
export async function POST(request) {
  return withUser(request, async (uid) => {
    const { code } = await request.json().catch(() => ({}));
    const result = await redeemCode(code, uid);
    if (!result.success) return apiError(400, "codigo", result.error);
    return NextResponse.json({ coach: await getLinkedCoach(uid) });
  });
}

/** Desvincularse del entrenador actual. */
export async function DELETE(request) {
  return withUser(request, async (uid) => {
    await unlinkCoachFromStudent(uid);
    return NextResponse.json({ ok: true });
  });
}
