import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listCoachStudents } from "@/lib/coach/students";
import { listUserSessions } from "@/lib/sessions/sessions";
import { listExercises } from "@/lib/exercises/exercises";
import { maxWeightFromSets } from "@/lib/epley";
import { KEY_LIFT_NAMES } from "@/lib/exercises/constants";
import ProgresoContent from "@/components/progreso/ProgresoContent";

export const dynamic = "force-dynamic";

function buildExerciseSummaries(sessions, exerciseLookup) {
  const summaries = new Map();

  for (const session of sessions) {
    for (const exerciseInSession of session.exercises) {
      const exercise = exerciseLookup.get(exerciseInSession.exerciseId);
      if (!exercise) continue;

      const maxWeightKg = maxWeightFromSets(exerciseInSession.sets);
      const existing = summaries.get(exercise.id);

      if (!existing) {
        summaries.set(exercise.id, {
          exerciseId: exercise.id,
          nameEs: exercise.nameEs,
          lastPerformedAt: session.finishedAt,
          maxWeightKg,
          timesPerformed: 1,
        });
      } else {
        existing.timesPerformed += 1;
        if (maxWeightKg > existing.maxWeightKg) {
          existing.maxWeightKg = maxWeightKg;
        }
        if (new Date(session.finishedAt) > new Date(existing.lastPerformedAt)) {
          existing.lastPerformedAt = session.finishedAt;
        }
      }
    }
  }

  return summaries;
}

export default async function ProgresoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, sessions, catalogExercises] = await Promise.all([
    getUserProfile(user.uid),
    listUserSessions(user.uid),
    listExercises(),
  ]);

  const isCoach = !!profile?.isCoach || !!profile?.isAdmin;
  const students = isCoach ? await listCoachStudents(user.uid) : [];
  const studentsWithStats = isCoach
    ? await Promise.all(
        students.map(async (student) => {
          const studentSessions = await listUserSessions(student.studentId);
          return {
            ...student,
            sessionsCount: studentSessions.length,
            lastSessionAt: studentSessions[0]?.finishedAt || null,
          };
        }),
      )
    : [];

  const exerciseLookup = new Map(catalogExercises.map((e) => [e.id, e]));
  const summariesById = buildExerciseSummaries(sessions, exerciseLookup);

  const keyLiftIds = new Set();
  const keyLifts = KEY_LIFT_NAMES.map((name) => {
    const catalogExercise = catalogExercises.find((e) => e.nameEs === name);
    if (!catalogExercise) return null;
    keyLiftIds.add(catalogExercise.id);
    const summary = summariesById.get(catalogExercise.id);
    return {
      exerciseId: catalogExercise.id,
      nameEs: name,
      maxWeightKg: summary?.maxWeightKg || 0,
      timesPerformed: summary?.timesPerformed || 0,
    };
  }).filter(Boolean);

  const exerciseSummaries = [...summariesById.values()]
    .filter((s) => !keyLiftIds.has(s.exerciseId))
    .sort((a, b) => new Date(b.lastPerformedAt) - new Date(a.lastPerformedAt));

  const totalSessions = sessions.length;
  const lastSession = sessions[0] || null;

  return (
    <ProgresoContent
      isCoach={isCoach}
      students={studentsWithStats}
      userName={profile?.displayName || null}
      keyLifts={keyLifts}
      exerciseSummaries={exerciseSummaries}
      totalSessions={totalSessions}
      lastSession={lastSession}
    />
  );
}
