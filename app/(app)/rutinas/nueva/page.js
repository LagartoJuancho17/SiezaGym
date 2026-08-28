import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import RoutineBuilder from "@/components/routines/RoutineBuilder";

export const dynamic = "force-dynamic";

export default async function NuevaRutinaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [catalogExercises, customExercises] = await Promise.all([
    listExercises(),
    listCustomExercises(user.uid),
  ]);

  return (
    <div className="flex flex-col gap-5 px-[18px] pb-[100px]">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">Nueva</p>
          <h1 className="font-display mt-1 text-[26px] uppercase leading-none">Rutina</h1>
        </div>
        <Link href="/rutinas" className="text-sm font-medium text-faint transition hover:text-text">
          Cancelar
        </Link>
      </header>

      <RoutineBuilder
        mode="create"
        routine={null}
        catalogExercises={catalogExercises}
        customExercises={customExercises}
      />
    </div>
  );
}
