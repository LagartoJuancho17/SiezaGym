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
    <div className="flex flex-col gap-5 px-[18px] pb-[100px]">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
            Tus rutinas
          </p>
          <h1 className="font-display mt-1 text-[26px] uppercase leading-none">Rutinas</h1>
        </div>
        <Link
          href="/rutinas/nueva"
          className="flex h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-onlight transition hover:opacity-90"
        >
          + Nueva
        </Link>
      </header>

      {allItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hair p-8 text-center">
          <p className="text-sm text-faint">Todavía no armaste ninguna rutina.</p>
          <Link
            href="/rutinas/nueva"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-onlight transition hover:opacity-90"
          >
            Crear la primera
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
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