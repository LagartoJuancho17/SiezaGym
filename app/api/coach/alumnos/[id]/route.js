import { NextResponse } from "next/server";
import { apiError, withCoach } from "@/lib/api/auth";
import { getUserProfile } from "@/lib/users/users";
import { isLinkedToCoach, removeStudent } from "@/lib/coach/students";
import { listUserSessions } from "@/lib/sessions/sessions";
import { listStudentAssignments } from "@/lib/assignments/assignments";

/** El detalle de un alumno: datos, últimos entrenamientos y lo que le asignaste. */
export async function GET(request, { params }) {
  const { id } = await params;
  return withCoach(request, async (uid) => {
    if (!(await isLinkedToCoach(id, uid))) return apiError(404, "no-vinculado", "Ese alumno no está vinculado a tu cuenta.");
    const [profile, sessions, assignments] = await Promise.all([
      getUserProfile(id),
      listUserSessions(id, { limitCount: 30 }),
      listStudentAssignments(id),
    ]);
    if (!profile) return apiError(404, "no-existe", "No se encontró el alumno.");
    return NextResponse.json({
      student: {
        studentId: id,
        displayName: profile.displayName || "Sin nombre",
        email: profile.email,
        photoURL: profile.photoURL,
        experienceLevel: profile.experienceLevel,
        bodyWeightKg: profile.bodyWeightKg,
        trainingGoal: profile.trainingGoal ?? null,
        trainingDaysPerWeek: profile.trainingDaysPerWeek ?? null,
      },
      sessions: sessions.map((s) => ({
        id: s.id,
        routineName: s.routineName,
        finishedAt: s.finishedAt,
        durationSeconds: s.durationSeconds,
        totalVolumeKg: s.totalVolumeKg,
        totalSetsCompleted: s.totalSetsCompleted,
        exercises: (s.exercises || []).map((e) => ({ exerciseId: e.exerciseId, sets: e.sets || [], note: e.note || null })),
      })),
      assignments: assignments
        .filter((a) => a.coachId === uid)
        .map((a) => ({
          id: a.id,
          routineId: a.routineId,
          routineName: a.routineName,
          weekLabel: a.weekLabel,
          note: a.note,
          assignedAt: a.assignedAt,
          lastCompletedAt: a.lastCompletedAt,
          exercises: a.exercises.length,
        })),
    });
  });
}

/** Desvincular al alumno. Sus datos y entrenamientos quedan; el vínculo no. */
export async function DELETE(request, { params }) {
  const { id } = await params;
  return withCoach(request, async (uid) => {
    await removeStudent(uid, id);
    return NextResponse.json({ ok: true });
  });
}
