import { NextResponse } from "next/server";
import { apiError, withCoach } from "@/lib/api/auth";
import { getUserProfile } from "@/lib/users/users";
import { isLinkedToCoach, removeStudent } from "@/lib/coach/students";
import { listUserSessions } from "@/lib/sessions/sessions";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { markRecordSets, personalRecords } from "@/lib/progress/records";

/** Entrenamientos que se muestran; los récords miran más atrás. */
const SHOWN_SESSIONS = 30;
const HISTORY_SESSIONS = 150;

/**
 * El detalle de un alumno: datos, récords por ejercicio, últimos
 * entrenamientos serie por serie (peso, reps y si fue PR) y lo que le
 * asignaste.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  return withCoach(request, async (uid) => {
    if (!(await isLinkedToCoach(id, uid))) return apiError(404, "no-vinculado", "Ese alumno no está vinculado a tu cuenta.");
    const [profile, history, assignments, catalog, custom] = await Promise.all([
      getUserProfile(id),
      listUserSessions(id, { limitCount: HISTORY_SESSIONS }),
      listStudentAssignments(id),
      listExercises(),
      listCustomExercises(id),
    ]);
    if (!profile) return apiError(404, "no-existe", "No se encontró el alumno.");

    // Los PR se marcan sobre toda la historia, no solo sobre lo que se muestra:
    // si no, el primer entrenamiento visible parecería el punto de partida.
    const sessions = markRecordSets(history).slice(0, SHOWN_SESSIONS);
    const names = new Map([...catalog, ...custom].map((exercise) => [exercise.id, exercise.nameEs]));
    const usedIds = new Set(history.flatMap((s) => (s.exercises || []).map((e) => e.exerciseId)));
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
        exercises: (s.exercises || []).map((e) => ({
          exerciseId: e.exerciseId,
          note: e.note || null,
          sets: (e.sets || []).map((set) => ({
            weight: Number(set.weight) || 0,
            reps: Number(set.reps) || 0,
            failed: !!set.failed,
            pr: !!set.pr,
          })),
        })),
      })),
      records: personalRecords(history),
      exerciseNames: Object.fromEntries([...usedIds].map((exerciseId) => [exerciseId, names.get(exerciseId) || exerciseId])),
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
