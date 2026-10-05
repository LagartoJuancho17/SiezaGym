import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { getUserRoutine, listUserRoutines } from "@/lib/routines/routines";
import { savedGroupPresets } from "@/lib/routines/groupColors";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import RoutineComposer from "@/components/design2/RoutineComposer";

export const dynamic = "force-dynamic";

/**
 * Editar una rutina propia.
 *
 * Misma pantalla que el alta: se reusa RoutineComposer con la rutina cargada.
 * Solo el dueño llega acá; getUserRoutine ya devuelve null para cualquier otro,
 * y una rutina asignada no se edita desde el lado del alumno.
 */
export default async function EditarRutinaPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [routine, catalogExercises, customExercises, routines] = await Promise.all([
    getUserRoutine(user.uid, id),
    listExercises(),
    listCustomExercises(user.uid),
    listUserRoutines(user.uid),
  ]);

  if (!routine) notFound();

  // Solo lo que la pantalla dibuja: el catálogo entero son 94 ejercicios con
  // descripciones largas que no hacen falta del lado del cliente.
  const exercises = [...catalogExercises, ...customExercises].map((exercise) => ({
    id: exercise.id,
    nameEs: exercise.nameEs,
    nameEn: exercise.nameEn,
    equipment: exercise.equipment || "peso_corporal",
    mediaUrl: exercise.mediaUrl || null,
    videoUrl: exercise.videoUrl || null,
    muscleWeights: exercise.muscleWeights || {},
    registrationType: exercise.registrationType,
    source: exercise.source,
  }));

  return (
    <ThemeRoot>
      <Backdrop />
      <div className="d2-page d2-page-full">
        <RoutineComposer
          exercises={exercises}
          savedGroups={savedGroupPresets(routines.filter((other) => other.id !== routine.id))}
          routine={{
            id: routine.id,
            name: routine.name,
            note: routine.note,
            exercises: routine.exercises,
          }}
        />
      </div>
    </ThemeRoot>
  );
}
