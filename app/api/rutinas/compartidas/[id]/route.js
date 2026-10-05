import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/auth";
import { getSharedRoutine } from "@/lib/sharing/sharedRoutines";

/** Una rutina compartida, para la vista previa de la app. Es pública como el link. */
export async function GET(_request, { params }) {
  const { id } = await params;
  const shared = await getSharedRoutine(id);
  if (!shared) return apiError(404, "no-existe", "El link no existe o se borró.");
  const { ownerId: _owner, ...publico } = shared;
  return NextResponse.json(publico);
}
