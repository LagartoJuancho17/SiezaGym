import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserRoutines } from "@/lib/routines/routines";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { totalSets, estimatedDurationMinutes } from "@/lib/routines/summary";
import { groupByMonthAndWeek, itemsWithoutDate } from "@/lib/routines/schedule";
import { toLocalDayKey } from "@/lib/sessions/streak";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import RoutineList from "@/components/design2/RoutineList";
import TabBar from "@/components/design2/TabBar";
import { PlusIcon } from "@/components/design2/Icons";

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

  const [routines, assignments, catalogExercises, customExercises] = await Promise.all([
    listUserRoutines(user.uid),
    listStudentAssignments(user.uid),
    listExercises(),
    listCustomExercises(user.uid),
  ]);

  const exerciseLookup = new Map([...catalogExercises, ...customExercises].map((e) => [e.id, e]));

  // Las rutinas propias y las asignadas pueden compartir id, asi que la clave
  // de React lleva el origen adelante.
  const shape = (item, isAssigned) => ({
    key: `${isAssigned ? "asg" : "own"}-${item.id}`,
    id: item.id,
    name: item.name,
    isAssigned,
    // Lo necesita el menú de mantener presionado, para decir si la acción
    // pone o saca de la portada.
    showOnHome: item.showOnHome !== false,
    exerciseCount: item.exercises?.length || 0,
    totalSets: totalSets(item),
    estimatedMinutes: estimatedDurationMinutes(item, exerciseLookup),
    assignedAt: item.assignedAt,
    createdAt: item.createdAt,
    lastUsedAt: item.lastUsedAt,
  });

  const allItems = [
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

  const months = groupByMonthAndWeek(allItems, toParts);
  const undated = itemsWithoutDate(allItems);

  return (
    <ThemeRoot>
      <Backdrop />

      <div className="d2-page">
        <header className="d2-page-head">
          <h1 className="d2-page-title">Rutinas</h1>
          <Link href="/rutinas/nueva" aria-label="Nueva rutina" className="d2-fab">
            <PlusIcon size={24} width={1.8} />
          </Link>
        </header>

        <RoutineList items={allItems} months={months} undated={undated} />
      </div>

      <TabBar />
    </ThemeRoot>
  );
}
