import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserRoutines } from "@/lib/routines/routines";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { listTrainedDates, listUserSessions } from "@/lib/sessions/sessions";
import { computeStreak, toLocalDayKey } from "@/lib/sessions/streak";
import { setCompletionRate, sessionsInLastDays, weeklyCalories } from "@/lib/home/metrics";
import { weekVolumeShare } from "@/lib/home/weekly";
import { totalSets, estimatedDurationMinutes } from "@/lib/routines/summary";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import Header from "@/components/design2/Header";
import Headline from "@/components/design2/Headline";
import GoalRail from "@/components/design2/GoalRail";
import TrainingWeek from "@/components/design2/TrainingWeek";
import HomeRoutines from "@/components/design2/HomeRoutines";
import TabBar from "@/components/design2/TabBar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, routines, assignments, trainedDates, sessions, catalogExercises, customExercises] =
    await Promise.all([
      getUserProfile(user.uid),
      listUserRoutines(user.uid),
      listStudentAssignments(user.uid),
      listTrainedDates(user.uid),
      listUserSessions(user.uid, { limitCount: 50 }),
      listExercises(),
      listCustomExercises(user.uid),
    ]);

  const exerciseLookup = new Map([...catalogExercises, ...customExercises].map((e) => [e.id, e]));

  const shape = (item, isAssigned) => ({
    key: `${isAssigned ? "asg" : "own"}-${item.id}`,
    id: item.id,
    name: item.name,
    isAssigned,
    showOnHome: item.showOnHome !== false,
    exerciseCount: item.exercises?.length || 0,
    totalSets: totalSets(item),
    estimatedMinutes: estimatedDurationMinutes(item, exerciseLookup),
    assignedAt: item.assignedAt,
    createdAt: item.createdAt,
    lastUsedAt: item.lastUsedAt,
  });

  const allRoutines = [
    ...routines.map((routine) => shape(routine, false)),
    ...assignments.map((assignment) =>
      shape(
        {
          id: assignment.id,
          name: assignment.routineName,
          exercises: assignment.exercises,
          assignedAt: assignment.assignedAt,
          lastUsedAt: assignment.lastUsedAt,
        },
        true,
      ),
    ),
  ];

  const now = new Date();
  const todayKey = toLocalDayKey(now);

  const weekSessions = sessionsInLastDays(sessions, 7);
  const calories = weeklyCalories(weekSessions, {
    bodyWeightKg: profile?.bodyWeightKg,
    goal: profile?.weeklyCalorieGoalKcal,
  });
  const week = weekVolumeShare(sessions, now);
  const completion = setCompletionRate(sessions);
  const streak = computeStreak(trainedDates);

  // La rutina del titular es la última usada que se muestre en la Home. Si no
  // hay ninguna no se inventa un nombre: el titular invita a crear la primera.
  const visibleRoutines = allRoutines
    .filter((routine) => routine.showOnHome !== false)
    .sort(
      (a, b) =>
        new Date(b.lastUsedAt || b.createdAt || b.assignedAt || 0) -
        new Date(a.lastUsedAt || a.createdAt || a.assignedAt || 0),
    );
  const featured = visibleRoutines[0] || allRoutines[0] || null;
  const homeRoutines = visibleRoutines.length > 0 ? visibleRoutines : allRoutines;

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

        {/* En escritorio la semana y los objetivos van a la izquierda, y lo
            que se consulta —rutinas y accesos— a la derecha. En teléfono la
            clase no hace nada y se apilan igual que antes. */}
        <div className="d2-split">
          <div>
            <TrainingWeek trainedDayKeys={trainedDates} todayKey={todayKey} streak={streak} />
            <GoalRail cards={cards} />
          </div>

          <div>
            <HomeRoutines routines={homeRoutines} />

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
        </div>
      </div>

      <TabBar />
    </ThemeRoot>
  );
}
