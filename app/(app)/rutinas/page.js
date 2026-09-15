import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserRoutines } from "@/lib/routines/routines";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { totalSets, estimatedDurationMinutes } from "@/lib/routines/summary";
import { groupByMonthAndWeek, itemsWithoutDate, weekOfMonth } from "@/lib/routines/schedule";
import { toLocalDayKey } from "@/lib/sessions/streak";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import PageHeader from "@/components/design2/PageHeader";
import Headline from "@/components/design2/Headline";
import RoutinesBrowser from "@/components/design2/RoutinesBrowser";
import TabBar from "@/components/design2/TabBar";

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

  const [todayYear, todayMonth, todayDay] = toLocalDayKey(new Date()).split("-").map(Number);
  const currentMonthKey = `${todayYear}-${String(todayMonth).padStart(2, "0")}`;
  const currentWeek = weekOfMonth(todayDay);

  const assigned = allItems.filter((item) => item.isAssigned).length;
  const subtitle = allItems.length === 0
    ? "Todavía no armaste ninguna"
    : `${allItems.length} en total${assigned > 0 ? ` · ${assigned} del coach` : ""}`;

  // El titular repite el patron de la portada: una linea liviana y otra en
  // bold italica. Dice la rutina que toca, que es la ultima usada.
  const featured = [...allItems].sort(
    (a, b) =>
      new Date(b.lastUsedAt || b.assignedAt || b.createdAt || 0) -
      new Date(a.lastUsedAt || a.assignedAt || a.createdAt || 0),
  )[0];

  return (
    <ThemeRoot>
      <Backdrop />

      <div className="d2-page">
        <PageHeader title="Rutinas" subtitle={subtitle} />

        <Headline
          lead={featured ? "Seguí con" : "Armá tu"}
          emphasis={featured ? `${featured.name}.` : "primera rutina."}
          href={featured ? `/rutinas/${featured.id}` : "/rutinas/nueva"}
          actionLabel={featured ? `Abrir rutina ${featured.name}` : "Nueva rutina"}
        />

        <RoutinesBrowser
          items={allItems}
          months={months}
          undated={undated}
          currentMonthKey={currentMonthKey}
          currentWeek={currentWeek}
        />
      </div>

      <TabBar />
    </ThemeRoot>
  );
}
