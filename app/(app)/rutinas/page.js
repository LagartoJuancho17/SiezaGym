import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserRoutines } from "@/lib/routines/routines";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { MUSCLE_GROUP_LABELS } from "@/lib/exercises/constants";
import { totalSets, estimatedDurationMinutes, muscleDistribution } from "@/lib/routines/summary";
import RoutineListItem from "@/components/routines/RoutineListItem";

export const dynamic = "force-dynamic";

export default async function RutinasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [routines, assignments, catalogExercises, customExercises] = await Promise.all([
    listUserRoutines(user.uid),
    listStudentAssignments(user.uid),
    listExercises(),
    listCustomExercises(user.uid),
  ]);

  const exerciseLookup = new Map(
    [...catalogExercises, ...customExercises].map((e) => [e.id, e]),
  );

  const assignedItems = assignments.map((assignment) => {
    const withExercises = { ...assignment, exercises: assignment.exercises };
    return {
      id: assignment.id,
      name: assignment.routineName,
      note: assignment.note,
      exercises: assignment.exercises,
      isAssigned: true,
      totalSets: totalSets(withExercises),
      estimatedMinutes: estimatedDurationMinutes(withExercises, exerciseLookup),
      muscleDistribution: muscleDistribution(withExercises, exerciseLookup),
    };
  });

  const allItems = [
    ...routines.map((routine) => ({
      ...routine,
      isAssigned: false,
      totalSets: totalSets(routine),
      estimatedMinutes: estimatedDurationMinutes(routine, exerciseLookup),
      muscleDistribution: muscleDistribution(routine, exerciseLookup),
    })),
    ...assignedItems,
  ].sort(
    (a, b) =>
      new Date(b.lastUsedAt || b.assignedAt || b.createdAt || 0) -
      new Date(a.lastUsedAt || a.assignedAt || a.createdAt || 0),
  );

  return (
    <div className="mx-auto flex max-w-[1360px] flex-col gap-6 px-4 pt-20 pb-28 sm:px-8 sm:pt-24 md:pb-16">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF5733]">
            Tus rutinas
          </p>
          <h1 className="font-sans mt-0.5 text-3xl font-extrabold tracking-tight text-white">
            Rutinas
          </h1>
        </div>
        <Link
          href="/rutinas/nueva"
          className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#FF5733] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#E84D29] active:scale-95"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <span>Nueva rutina</span>
        </Link>
      </header>

      {allItems.length === 0 ? (
        <div className="rounded-2xl border border-[#6B1717] bg-[#EDE8E1] p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-[#756C65]">Todavía no armaste ninguna rutina.</p>
          <Link
            href="/rutinas/nueva"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#FF5733] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#E84D29]"
          >
            Crear la primera
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2 sm:gap-3">
          {allItems.map((item) => {
            const muscles = item.muscleDistribution
              .slice(0, 3)
              .map((m) => MUSCLE_GROUP_LABELS[m.muscle]);
            return (
              <RoutineListItem
                key={`${item.isAssigned ? "asg" : "own"}-${item.id}`}
                routine={item}
                sets={item.totalSets}
                minutes={item.estimatedMinutes}
                muscleLabels={muscles}
                isAssigned={item.isAssigned}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}