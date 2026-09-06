import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserRoutines } from "@/lib/routines/routines";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { listExercises } from "@/lib/exercises/exercises";
import { weeklyVolumeKg, listTrainedDates, listUserSessions } from "@/lib/sessions/sessions";
import { computeStreak, toLocalDayKey } from "@/lib/sessions/streak";
import { totalSets, estimatedDurationMinutes } from "@/lib/routines/summary";
import {
  volumeByMuscleGroup,
  pushPullBalance,
  setCompletionRate,
  volumeByWeekday,
  relativeIntensity,
  volumePerSession,
  intensityZones,
  intensitySequence,
  sessionSeconds,
  sessionsInLastDays,
  weeklyCalories,
} from "@/lib/home/metrics";
import HomeHero from "@/components/home/HomeHero";
import HomeStats from "@/components/home/HomeStats";
import RoutinesCarousel from "@/components/home/RoutinesCarousel";
import WeekStrip from "@/components/home/WeekStrip";

export const dynamic = "force-dynamic";

// Indice de dia 0..6 (lunes a domingo) en hora Argentina. Se ancla al mediodia
// para que el runtime del server no corra el dia, igual que hace computeStreak.
function toWeekdayIndex(isoDate) {
  if (!isoDate) return null;
  const key = toLocalDayKey(new Date(isoDate));
  const day = new Date(`${key}T12:00:00`).getDay();
  return (day + 6) % 7;
}

function formatDuration(totalSeconds) {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, routines, weekVolume, assignments, trainedDates, sessions, exercises] =
    await Promise.all([
      getUserProfile(user.uid),
      listUserRoutines(user.uid),
      weeklyVolumeKg(user.uid),
      listStudentAssignments(user.uid),
      listTrainedDates(user.uid),
      listUserSessions(user.uid, { limitCount: 50 }),
      listExercises(),
    ]);

  const streak = computeStreak(trainedDates);
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  const weekSessions = sessionsInLastDays(sessions, 7);

  const muscleVolume = volumeByMuscleGroup(sessions, exerciseById);
  const trend = volumePerSession(sessions);
  const maxTrend = Math.max(...trend.points, 1);

  const metrics = {
    muscleVolume,
    sessionBars: trend.points.map((kg) => kg / maxTrend),
    balance: pushPullBalance(sessions, exerciseById),
    completion: setCompletionRate(sessions),
    weekdays: volumeByWeekday(sessions, toWeekdayIndex),
    intensity: relativeIntensity(sessions),
    trend,
    zones: intensityZones(sessions),
    sequence: intensitySequence(sessions),
    calories: weeklyCalories(weekSessions, {
      bodyWeightKg: profile?.bodyWeightKg,
      goal: profile?.weeklyCalorieGoalKcal,
    }),
    durationText: formatDuration(
      weekSessions.reduce((total, session) => total + sessionSeconds(session), 0),
    ),
  };

  const enrichedRoutines = routines.map((routine) => ({
    ...routine,
    totalSets: totalSets(routine),
    estimatedMinutes: estimatedDurationMinutes(routine),
    isAssigned: false,
    sortKey: routine.lastUsedAt || routine.createdAt,
  }));
  const enrichedAssignments = assignments.map((assignment) => ({
    id: assignment.id,
    name: assignment.routineName,
    exercises: assignment.exercises,
    showOnHome: true,
    isAssigned: true,
    totalSets: totalSets({ exercises: assignment.exercises }),
    estimatedMinutes: estimatedDurationMinutes({ exercises: assignment.exercises }),
    sortKey: assignment.lastUsedAt || assignment.assignedAt,
  }));

  const visibleRoutines = [...enrichedRoutines, ...enrichedAssignments]
    .filter((routine) => routine.showOnHome !== false)
    .sort((a, b) => new Date(b.sortKey || 0) - new Date(a.sortKey || 0));

  // Sin rutinas no inventamos una: routineId null hace que el hero linkee a
  // /rutinas en vez de a un id que devuelve 404.
  const activeRoutine = visibleRoutines[0]
    ? { id: visibleRoutines[0].id, name: visibleRoutines[0].name }
    : { id: null, name: "Armá tu primera rutina" };

  const initial = (profile?.displayName || user.email || "T").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col w-full bg-[#35080A] pb-28 md:pb-12">
      {/* En mobile el calendario va arriba de todo. En escritorio vive dentro
          de la grilla de metricas, asi que hay una instancia por breakpoint:
          mismo patron que usa el resto de la Home para variantes mobile. */}
      <div className="px-4 pb-4 pt-4 sm:px-6 lg:hidden">
        <WeekStrip trainedDates={trainedDates} streak={streak} />
      </div>

      {/* 1. TOP HALF: Panoramic Athletic Dumbbells Hero matching Image 1 & 2 */}
      <HomeHero
        routineId={activeRoutine.id}
        routineName={activeRoutine.name}
        volumeKg={weekVolume}
        setsLeft={9}
        primaryMuscle="Piernas"
        secondaryMuscle="Espalda"
        accountInitial={initial}
        accountPhotoURL={profile?.photoURL || null}
        accountEmail={user.email || null}
      />

      {/* 2. Métricas y calendario */}
      <HomeStats {...metrics} trainedDates={trainedDates} streak={streak} />

      {/* 3. Rutinas */}
      <div className="mx-auto flex w-full max-w-[1360px] flex-col px-4 pb-4 sm:px-6 lg:px-7">
        <RoutinesCarousel routines={visibleRoutines} />
      </div>
    </div>
  );
}
