import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserRoutines } from "@/lib/routines/routines";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { MUSCLE_GROUP_LABELS } from "@/lib/exercises/constants";
import { totalSets, estimatedDurationMinutes, muscleDistribution } from "@/lib/routines/summary";
import RoutineListItem from "@/components/routines/RoutineListItem";

export const dynamic = "force-dynamic";

export default async function RutinasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [routines, catalogExercises, customExercises] = await Promise.all([
    listUserRoutines(user.uid),
    listExercises(),
    listCustomExercises(user.uid),
  ]);

  const exerciseLookup = new Map(
    [...catalogExercises, ...customExercises].map((e) => [e.id, e]),
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

      {routines.length === 0 ? (
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
          {routines.map((routine) => {
            const muscles = muscleDistribution(routine, exerciseLookup)
              .slice(0, 3)
              .map((m) => MUSCLE_GROUP_LABELS[m.muscle]);
            return (
              <RoutineListItem
                key={routine.id}
                routine={routine}
                sets={totalSets(routine)}
                minutes={estimatedDurationMinutes(routine, exerciseLookup)}
                muscleLabels={muscles}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
