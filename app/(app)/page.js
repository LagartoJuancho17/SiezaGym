import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserRoutines } from "@/lib/routines/routines";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { weeklyVolumeKg, listTrainedDates } from "@/lib/sessions/sessions";
import { computeStreak } from "@/lib/sessions/streak";
import { totalSets, estimatedDurationMinutes } from "@/lib/routines/summary";
import HomeHero from "@/components/home/HomeHero";
import HomeStats from "@/components/home/HomeStats";
import WeekStrip from "@/components/home/WeekStrip";
import RoutinesCarousel from "@/components/home/RoutinesCarousel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, routines, weekVolume, assignments, trainedDates] = await Promise.all([
    getUserProfile(user.uid),
    listUserRoutines(user.uid),
    weeklyVolumeKg(user.uid),
    listStudentAssignments(user.uid),
    listTrainedDates(user.uid),
  ]);

  const streak = computeStreak(trainedDates);

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
      {/* 1. TOP HALF: Panoramic Athletic Dumbbells Hero matching Image 1 & 2 */}
      <HomeHero
        routineId={activeRoutine.id}
        routineName={activeRoutine.name}
        volumeKg={weekVolume > 0 ? weekVolume : 2040}
        setsLeft={9}
        primaryMuscle="Piernas"
        secondaryMuscle="Espalda"
        accountInitial={initial}
        accountPhotoURL={profile?.photoURL || null}
        accountEmail={user.email || null}
      />

      {/* 2. Métricas */}
      <HomeStats volumeKg={weekVolume > 0 ? weekVolume : 2040} setsCount={17} targetSets={26} />

      {/* 3. Calendario semanal + rutinas */}
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5 px-4 pb-4 sm:px-6 lg:px-7">
        <WeekStrip trainedDates={trainedDates} streak={streak} />
        <RoutinesCarousel routines={visibleRoutines} />
      </div>
    </div>
  );
}
