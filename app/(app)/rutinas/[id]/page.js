import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserRoutine } from "@/lib/routines/routines";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import RoutineDetail from "@/components/routines/RoutineDetail";

export const dynamic = "force-dynamic";

export default async function RutinaDetallePage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [routine, catalogExercises, customExercises] = await Promise.all([
    getUserRoutine(user.uid, id),
    listExercises(),
    listCustomExercises(user.uid),
  ]);

  if (!routine) notFound();

  return (
    <RoutineDetail
      routine={routine}
      catalogExercises={catalogExercises}
      customExercises={customExercises}
    />
  );
}
