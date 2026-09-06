import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listCoachStudents } from "@/lib/coach/students";
import { listUserSessions, listTrainedDates } from "@/lib/sessions/sessions";
import {
  computeWeeklyVolume,
  computeWeeklySessionCounts,
  computeEffectivenessPct,
  computeVolumeByWeek,
} from "@/lib/sessions/weeklyStats";
import ProgresoContent from "@/components/progreso/ProgresoContent";

export const dynamic = "force-dynamic";

export default async function ProgresoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 200 sesiones cubre holgado las 12 semanas del grafico de volumen; el
  // heatmap pide un año de dias entrenados.
  const [profile, sessions, trainedDates] = await Promise.all([
    getUserProfile(user.uid),
    listUserSessions(user.uid, { limitCount: 200 }),
    listTrainedDates(user.uid, { sinceDays: 370 }),
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

  const weeklyVolumeKg = computeWeeklyVolume(sessions);
  const weeklyCounts = computeWeeklySessionCounts(sessions);
  const weeklyStats = {
    volumeKg: weeklyVolumeKg,
    sessionsThisWeek: weeklyCounts.thisWeek,
    effectivenessPct: computeEffectivenessPct(weeklyCounts.thisWeek, weeklyCounts.lastWeek),
  };
  const volumeByWeek = computeVolumeByWeek(sessions, 12);

  return (
    <ProgresoContent
      isCoach={isCoach}
      students={studentsWithStats}
      userName={profile?.displayName || null}
      weeklyStats={weeklyStats}
      trainedDates={trainedDates}
      volumeByWeek={volumeByWeek}
    />
  );
}
