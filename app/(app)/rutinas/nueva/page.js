import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import RoutineComposer from "@/components/design2/RoutineComposer";

export const dynamic = "force-dynamic";

export default async function NuevaRutinaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [catalogExercises, customExercises] = await Promise.all([
    listExercises(),
    listCustomExercises(user.uid),
  ]);

  // Solo lo que la pantalla dibuja: el catalogo entero son 94 ejercicios con
  // descripciones largas que no hacen falta del lado del cliente.
  const exercises = [...catalogExercises, ...customExercises].map((exercise) => ({
    id: exercise.id,
    nameEs: exercise.nameEs,
    nameEn: exercise.nameEn,
    equipment: exercise.equipment || "peso_corporal",
    mediaUrl: exercise.mediaUrl || null,
    muscleWeights: exercise.muscleWeights || {},
    registrationType: exercise.registrationType,
    source: exercise.source,
  }));

  return (
    <ThemeRoot>
      <Backdrop />
      <div className="d2-page d2-page-full">
        <RoutineComposer exercises={exercises} />
      </div>
    </ThemeRoot>
  );
}
