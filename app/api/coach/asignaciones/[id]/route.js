import { NextResponse } from "next/server";
import { withCoach } from "@/lib/api/auth";
import { unassignRoutine } from "@/lib/assignments/assignments";

/** Sacar una asignación. unassignRoutine comprueba que sea de este coach. */
export async function DELETE(request, { params }) {
  const { id } = await params;
  return withCoach(request, async (uid) => {
    await unassignRoutine(uid, id);
    return NextResponse.json({ ok: true });
  });
}
