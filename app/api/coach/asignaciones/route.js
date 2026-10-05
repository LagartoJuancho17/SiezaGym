import { NextResponse } from "next/server";
import { apiError, withCoach } from "@/lib/api/auth";
import { isLinkedToCoach } from "@/lib/coach/students";
import { getUserRoutine } from "@/lib/routines/routines";
import { assignRoutineToStudent } from "@/lib/assignments/assignments";

/** Asignar una rutina propia a un alumno vinculado. Cuerpo: { studentId, routineId, weekNumber?, note? } */
export async function POST(request) {
  return withCoach(request, async (uid) => {
    const { studentId, routineId, weekNumber, note } = await request.json().catch(() => ({}));
    if (!studentId || !routineId) return apiError(400, "datos", "Falta el alumno o la rutina.");
    const routine = await getUserRoutine(uid, routineId);
    if (!routine) return apiError(404, "sin-rutina", "Rutina no encontrada.");
    if (!(await isLinkedToCoach(studentId, uid))) return apiError(403, "no-vinculado", "El alumno no está vinculado a tu cuenta.");
    const id = await assignRoutineToStudent(uid, studentId, routine, {
      weekNumber: weekNumber != null && weekNumber !== "" ? Number(weekNumber) : null,
      note: typeof note === "string" ? note.slice(0, 300) : "",
    });
    return NextResponse.json({ id });
  });
}
