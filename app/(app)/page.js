import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserRoutines } from "@/lib/routines/routines";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { weeklyVolumeKg, listTrainedDates, listUserSessions } from "@/lib/sessions/sessions";
import { computeStreak } from "@/lib/sessions/streak";
import { totalSets, estimatedDurationMinutes } from "@/lib/routines/summary";
import { listCoachStudents } from "@/lib/coach/students";
import { sessionsInLastDays } from "@/lib/home/metrics";
import HomeHero from "@/components/home/HomeHero";
import HomeStats from "@/components/home/HomeStats";
import RoutinesCarousel from "@/components/home/RoutinesCarousel";
import CoachHomeSection from "@/components/coach/CoachHomeSection";
import LinkCoachSection from "@/components/home/LinkCoachSection";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, routines, weekVolume, assignments, trainedDates, sessions] =
    await Promise.all([
      getUserProfile(user.uid),
      listUserRoutines(user.uid),
      weeklyVolumeKg(user.uid),
      listStudentAssignments(user.uid),
      listTrainedDates(user.uid),
      listUserSessions(user.uid, { limitCount: 50 }),
    ]);

  const isCoach = !!profile?.isCoach || !!profile?.isAdmin;
  const students = isCoach ? await listCoachStudents(user.uid) : [];

  const streak = computeStreak(trainedDates);
  const weekSessions = sessionsInLastDays(sessions, 7);

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
        volumeKg={weekVolume}
        setsLeft={9}
        primaryMuscle="Piernas"
        secondaryMuscle="Espalda"
        accountInitial={initial}
        accountPhotoURL={profile?.photoURL || null}
        accountEmail={user.email || null}
      />

      {/* 2. Fechas y resumen */}
      <HomeStats
        trainedDates={trainedDates}
        streak={streak}
        completedWorkouts={weekSessions.length}
        weeklyVolumeKg={weekVolume}
      />

      {/* 3. Rutinas */}
      <div className="mx-auto flex w-full max-w-[1360px] flex-col px-4 pb-4 sm:px-6 lg:px-7">
        <RoutinesCarousel routines={visibleRoutines} />
      </div>

      {/* 4. Panel del coach / vinculación con entrenador */}
      <div className="mx-auto flex w-full max-w-[1360px] flex-col px-4 pb-4 sm:px-6 lg:px-7">
        {isCoach ? (
          <CoachHomeSection students={students} isAdmin={!!profile?.isAdmin} />
        ) : (
          <LinkCoachSection />
        )}
      </div>
    </div>
  );
}
