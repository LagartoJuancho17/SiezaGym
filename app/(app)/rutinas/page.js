import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserRoutines } from "@/lib/routines/routines";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { totalSets, estimatedDurationMinutes } from "@/lib/routines/summary";
import { groupByMonthAndWeek, itemsWithoutDate, weekOfMonth } from "@/lib/routines/schedule";
import { toLocalDayKey } from "@/lib/sessions/streak";
import RoutinesHero from "@/components/routines/RoutinesHero";
import RoutineSchedule from "@/components/routines/RoutineSchedule";
import RoutineRow from "@/components/routines/RoutineRow";

export const dynamic = "force-dynamic";

// Partes de la fecha en hora Argentina. Se usa la clave "YYYY-MM-DD" para que
// el runtime del server, que corre en UTC, no corra el dia.
function toParts(isoDate) {
  const key = toLocalDayKey(new Date(isoDate));
  const [year, month, day] = key.split("-").map(Number);
  return { year, month: month - 1, day };
}

export default async function RutinasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, routines, assignments, catalogExercises, customExercises] = await Promise.all([
    getUserProfile(user.uid),
    listUserRoutines(user.uid),
    listStudentAssignments(user.uid),
    listExercises(),
    listCustomExercises(user.uid),
  ]);

  const exerciseLookup = new Map(
    [...catalogExercises, ...customExercises].map((e) => [e.id, e]),
  );

  const allItems = [
    ...routines.map((routine) => ({
      ...routine,
      isAssigned: false,
      totalSets: totalSets(routine),
      estimatedMinutes: estimatedDurationMinutes(routine, exerciseLookup),
    })),
    ...assignments.map((assignment) => {
      const withExercises = { ...assignment, exercises: assignment.exercises };
      return {
        id: assignment.id,
        name: assignment.routineName,
        exercises: assignment.exercises,
        assignedAt: assignment.assignedAt,
        lastUsedAt: assignment.lastUsedAt,
        isAssigned: true,
        totalSets: totalSets(withExercises),
        estimatedMinutes: estimatedDurationMinutes(withExercises, exerciseLookup),
      };
    }),
  ];

  const months = groupByMonthAndWeek(allItems, toParts);
  const undated = itemsWithoutDate(allItems);

  const [todayYear, todayMonth, todayDay] = toLocalDayKey(new Date()).split("-").map(Number);
  const currentMonthKey = `${todayYear}-${String(todayMonth).padStart(2, "0")}`;
  const currentWeek = weekOfMonth(todayDay);

  const hero = {
    title: "Rutinas",
    accountInitial: (profile?.displayName || user.email || "T").charAt(0).toUpperCase(),
    accountPhotoURL: profile?.photoURL || null,
    accountEmail: user.email || null,
  };

  if (allItems.length === 0) {
    return (
      <div className="flex w-full flex-col bg-[#35080A] pb-28 md:pb-12">
        <RoutinesHero {...hero} />
        <div className="mx-auto w-full max-w-[1360px] px-3 pt-3 sm:px-5">
          <div className="rounded-[10px] border border-[#5A1215] bg-surface p-8 text-center">
            <p className="text-sm font-medium text-[#6E665E]">
              Todavía no armaste ninguna rutina.
            </p>
            <Link
              href="/rutinas/nueva"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-[10px] bg-[#FF5733] px-5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(255,87,51,0.3)] transition hover:bg-[#E84D29]"
            >
              Crear la primera
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col bg-[#35080A] pb-28 md:pb-12">
      <RoutineSchedule
        hero={hero}
        months={months}
        currentMonthKey={currentMonthKey}
        currentWeek={currentWeek}
      >
        {undated.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            <p className="px-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/60">
              Sin fecha
            </p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {undated.map((item) => (
                <RoutineRow key={`${item.isAssigned ? "asg" : "own"}-${item.id}`} routine={item} />
              ))}
            </div>
          </div>
        )}

        <Link
          href="/rutinas/nueva"
          className="mt-2 flex h-11 items-center justify-center gap-2 self-start rounded-[10px] bg-[#FF5733] px-5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(255,87,51,0.3)] transition hover:bg-[#E84D29] active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva rutina
        </Link>
      </RoutineSchedule>
    </div>
  );
}
