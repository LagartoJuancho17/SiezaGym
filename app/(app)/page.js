import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserRoutines } from "@/lib/routines/routines";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { listTrainedDates, listUserSessions } from "@/lib/sessions/sessions";
import { computeStreak, toLocalDayKey } from "@/lib/sessions/streak";
import { setCompletionRate, sessionsInLastDays, sessionSeconds, weeklyCalories } from "@/lib/home/metrics";
import { weekVolumeShare } from "@/lib/home/weekly";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import Header from "@/components/design2/Header";
import Headline from "@/components/design2/Headline";
import GoalRail from "@/components/design2/GoalRail";
import TrainingWeek from "@/components/design2/TrainingWeek";
import RecentActivity from "@/components/design2/RecentActivity";
import TabBar from "@/components/design2/TabBar";

export const dynamic = "force-dynamic";

function formatDuration(totalSeconds) {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

// "Hoy" / "Ayer" / "9 sept". Se compara por clave de dia en hora Argentina para
// que el runtime del server, que corre en UTC, no adelante el dia.
function formatWhen(isoDate, todayKey, yesterdayKey) {
  if (!isoDate) return "Sin fecha";
  const key = toLocalDayKey(new Date(isoDate));
  if (key === todayKey) return "Hoy";
  if (key === yesterdayKey) return "Ayer";
  return new Date(`${key}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, routines, assignments, trainedDates, sessions] = await Promise.all([
    getUserProfile(user.uid),
    listUserRoutines(user.uid),
    listStudentAssignments(user.uid),
    listTrainedDates(user.uid),
    listUserSessions(user.uid, { limitCount: 50 }),
  ]);

  const now = new Date();
  const todayKey = toLocalDayKey(now);
  const yesterday = new Date(`${todayKey}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toLocalDayKey(yesterday);

  const weekSessions = sessionsInLastDays(sessions, 7);
  const calories = weeklyCalories(weekSessions, {
    bodyWeightKg: profile?.bodyWeightKg,
    goal: profile?.weeklyCalorieGoalKcal,
  });
  const week = weekVolumeShare(sessions, now);
  const completion = setCompletionRate(sessions);
  const streak = computeStreak(trainedDates);

  // La rutina del titular es la ultima usada que se muestre en la Home. Si no
  // hay ninguna no se inventa un nombre: el titular invita a crear la primera.
  const visibleRoutines = [
    ...routines.filter((routine) => routine.showOnHome !== false),
    ...assignments.map((assignment) => ({
      id: assignment.id,
      name: assignment.routineName,
      lastUsedAt: assignment.lastUsedAt || assignment.assignedAt,
      createdAt: assignment.assignedAt,
    })),
  ].sort(
    (a, b) =>
      new Date(b.lastUsedAt || b.createdAt || 0) - new Date(a.lastUsedAt || a.createdAt || 0),
  );
  const featured = visibleRoutines[0] || null;

  const activities = sessions.slice(0, 2).map((session) => ({
    id: session.id,
    name: session.routineName || "Entrenamiento libre",
    when: formatWhen(session.finishedAt, todayKey, yesterdayKey),
    volume: `${Math.round(session.totalVolumeKg || 0).toLocaleString("es-AR")} kg`,
    duration: formatDuration(sessionSeconds(session)),
  }));

  const cards = [
    {
      title: "Esta semana",
      value: week.kg.toLocaleString("es-AR"),
      unit: "kg",
      badge: week.bestKg > 0 ? (week.isBest ? "Tu mejor semana" : `Mejor ${week.bestKg.toLocaleString("es-AR")}`) : null,
      ring: week.share,
      icon: "weight",
    },
    {
      title: "Calorías",
      value: calories.kcal.toLocaleString("es-AR"),
      unit: "kcal",
      // Es una estimación por MET, no una medición: hay que decirlo.
      badge: calories.usesDefaultWeight ? "Estimado, 75 kg" : `Meta ${calories.goal.toLocaleString("es-AR")}`,
      ring: calories.pct / 100,
      icon: "clock",
    },
    {
      title: "Series completadas",
      value: completion.hasData ? completion.pct : 0,
      unit: "%",
      badge: completion.hasData ? `${completion.completed} de ${completion.total}` : "Sin datos",
      ring: completion.pct / 100,
      icon: "check",
    },
  ];

  return (
    <ThemeRoot>
      <Backdrop />

      <div className="d2-home">
        <Header
          name={(profile?.displayName || user.email || "").split(" ")[0] || "atleta"}
          photoURL={profile?.photoURL || null}
          initial={(profile?.displayName || user.email || "T").charAt(0).toUpperCase()}
          goalPct={calories.pct}
          hasGoalData={calories.hasData}
        />

        <Headline
          lead={featured ? "Hoy toca" : "Empezá por"}
          emphasis={featured ? `${featured.name}.` : "armar tu primera rutina."}
          href={featured ? `/rutinas/${featured.id}` : "/rutinas/nueva"}
          actionLabel={featured ? `Abrir rutina ${featured.name}` : "Nueva rutina"}
        />

        <TrainingWeek trainedDayKeys={trainedDates} todayKey={todayKey} streak={streak} />

        <GoalRail cards={cards} />

        <RecentActivity activities={activities} />

        <p className="d2-label">Tu espacio</p>
        <div className="d2-panel">
          <Link href="/dashboard" className="d2-setting">
            <span className="d2-setting-body"><span className="d2-setting-name">Dashboard</span><span className="d2-setting-hint">Resumen, métricas y accesos</span></span>
            <span aria-hidden="true">↗</span>
          </Link>
          <Link href={profile?.isCoach || profile?.isAdmin ? "/dashboard/coach" : "/perfil"} className="d2-setting">
            <span className="d2-setting-body"><span className="d2-setting-name">{profile?.isCoach || profile?.isAdmin ? "Mis alumnos" : "Tu profesor"}</span><span className="d2-setting-hint">{profile?.isCoach || profile?.isAdmin ? "Invitaciones y seguimiento" : "Vinculá tu cuenta desde Perfil"}</span></span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <TabBar />
    </ThemeRoot>
  );
}
