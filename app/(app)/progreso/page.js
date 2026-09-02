import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listCoachStudents } from "@/lib/coach/students";
import { listUserSessions, weeklyVolumeKg } from "@/lib/sessions/sessions";
import { listExercises } from "@/lib/exercises/exercises";
import { bestSetByEstimatedOneRepMax } from "@/lib/epley";
import ProgresoContent from "@/components/progreso/ProgresoContent";

export const dynamic = "force-dynamic";

function buildExerciseSummaries(sessions, exerciseLookup) {
  const summaries = new Map();

  for (const session of sessions) {
    for (const exerciseInSession of session.exercises) {
      const exercise = exerciseLookup.get(exerciseInSession.exerciseId);
      if (!exercise) continue;

      const best = bestSetByEstimatedOneRepMax(exerciseInSession.sets);
      const existing = summaries.get(exercise.id);

      if (!existing) {
        summaries.set(exercise.id, {
          exerciseId: exercise.id,
          nameEs: exercise.nameEs,
          lastPerformedAt: session.finishedAt,
          bestEstimatedOneRepMax: best?.estimatedOneRepMax || 0,
          timesPerformed: 1,
        });
      } else {
        existing.timesPerformed += 1;
        if (best && best.estimatedOneRepMax > existing.bestEstimatedOneRepMax) {
          existing.bestEstimatedOneRepMax = best.estimatedOneRepMax;
        }
      }
    }
  }

  return [...summaries.values()].sort(
    (a, b) => new Date(b.lastPerformedAt) - new Date(a.lastPerformedAt),
  );
}

export default async function ProgresoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, sessions, catalogExercises, weekVolume] = await Promise.all([
    getUserProfile(user.uid),
    listUserSessions(user.uid, { limitCount: 200 }),
    listExercises(),
    weeklyVolumeKg(user.uid),
  ]);

  const isCoach = !!profile?.isCoach || !!profile?.isAdmin;
  const students = isCoach ? await listCoachStudents(user.uid) : [];

  const exerciseLookup = new Map(catalogExercises.map((e) => [e.id, e]));
  const exerciseSummaries = buildExerciseSummaries(sessions, exerciseLookup);
  const totalSessions = sessions.length;
  const lastSession = sessions[0] || null;

  return (
    <ProgresoContent
      isCoach={isCoach}
      students={students}
      userName={profile?.displayName || null}
      exerciseSummaries={exerciseSummaries}
      totalSessions={totalSessions}
      lastSession={lastSession}
      weekVolume={weekVolume}
    />
  );
}
