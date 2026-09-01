import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserSession } from "@/lib/sessions/sessions";
import { listExercises } from "@/lib/exercises/exercises";
import { estimatedOneRepMax } from "@/lib/epley";

export const dynamic = "force-dynamic";

function formatDateTime(iso) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDuration(totalSec) {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default async function SesionDetallePage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [session, catalogExercises] = await Promise.all([
    getUserSession(user.uid, id),
    listExercises(),
  ]);

  if (!session) notFound();

  const exerciseLookup = new Map(catalogExercises.map((e) => [e.id, e]));

  return (
    <div className="flex flex-col gap-5 px-[18px] pb-[100px] lg:px-0">
      <header className="flex items-center gap-3">
        <Link
          href="/historial"
          aria-label="Volver"
          className="flex h-8 w-8 items-center justify-center rounded-full text-faint transition hover:bg-glass hover:text-text"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
            {formatDateTime(session.finishedAt)}
          </p>
          <h1 className="font-display truncate text-[26px] uppercase leading-none text-white">
            {session.routineName || "Sesión libre"}
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Duración</p>
          <p className="font-mono-digit mt-1 text-xl text-white">
            {formatDuration(session.durationSeconds)}
          </p>
        </div>
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Series</p>
          <p className="font-mono-digit mt-1 text-xl text-white">{session.totalSetsCompleted}</p>
        </div>
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Volumen</p>
          <p className="font-mono-digit mt-1 text-xl text-teal2">{session.totalVolumeKg}kg</p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        {session.exercises.map((exercise, index) => {
          const catalogExercise = exerciseLookup.get(exercise.exerciseId);
          return (
            <div
              key={`${exercise.exerciseId}-${index}`}
              className="rounded-2xl border border-hair bg-glass p-4"
            >
              <Link
                href={`/progreso/${exercise.exerciseId}`}
                className="text-sm font-semibold text-text hover:text-teal2"
              >
                {catalogExercise?.nameEs || "Ejercicio"}
              </Link>
              <div className="mt-2.5 flex flex-col gap-1.5">
                {(exercise.sets || []).map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className="flex items-center justify-between text-xs text-faint"
                  >
                    <span>Serie {set.setNumber || setIndex + 1}</span>
                    <span className="font-mono-digit text-white">
                      {set.weight}kg × {set.reps}
                      {set.failed ? <span className="ml-1.5 text-destructive">fallada</span> : null}
                    </span>
                    <span className="font-mono-digit text-faint">
                      {estimatedOneRepMax(set.weight, set.reps).toFixed(1)}kg 1RM
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
