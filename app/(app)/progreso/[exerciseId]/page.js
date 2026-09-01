import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getExerciseById } from "@/lib/exercises/exercises";
import { listSessionsForExercise } from "@/lib/sessions/sessions";
import { bestSetByEstimatedOneRepMax } from "@/lib/epley";
import ExerciseProgressChart from "@/components/progress/ExerciseProgressChart";

export const dynamic = "force-dynamic";

function formatDate(iso) {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
  return formatted;
}

export default async function ExerciseProgressPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { exerciseId } = await params;
  const [exercise, sessions] = await Promise.all([
    getExerciseById(exerciseId),
    listSessionsForExercise(user.uid, exerciseId),
  ]);

  if (!exercise) notFound();

  // sessions viene mas reciente primero (para la tabla); el grafico necesita orden cronologico.
  const rows = sessions
    .map((session) => {
      const exerciseInSession = session.exercises.find((e) => e.exerciseId === exerciseId);
      const best = bestSetByEstimatedOneRepMax(exerciseInSession?.sets);
      if (!best) return null;
      return {
        sessionId: session.id,
        finishedAt: session.finishedAt,
        weight: best.weight,
        reps: best.reps,
        estimatedOneRepMax: Math.round(best.estimatedOneRepMax * 10) / 10,
      };
    })
    .filter(Boolean);

  const chartPoints = [...rows].reverse();

  const rowsWithPR = rows
    .slice()
    .reverse()
    .reduce((acc, row) => {
      const prevBest = acc.length ? acc[acc.length - 1].runningBest : 0;
      const isPR = row.estimatedOneRepMax > prevBest;
      acc.push({ ...row, isPR, runningBest: isPR ? row.estimatedOneRepMax : prevBest });
      return acc;
    }, [])
    .reverse();

  const currentBest = rows.reduce((max, r) => Math.max(max, r.estimatedOneRepMax), 0);

  return (
    <div className="flex flex-col gap-5 px-[18px] pb-[100px] lg:px-0">
      <header className="flex items-center gap-3">
        <Link
          href="/progreso"
          aria-label="Volver"
          className="flex h-8 w-8 items-center justify-center rounded-full text-faint transition hover:bg-glass hover:text-text"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">Progreso</p>
          <h1 className="font-display truncate text-[26px] uppercase leading-none text-white">
            {exercise.nameEs}
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">1RM estimado</p>
          <p className="font-mono-digit mt-1 text-2xl text-teal2">
            {currentBest > 0 ? `${currentBest.toFixed(1)}kg` : "—"}
          </p>
        </div>
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Sesiones registradas</p>
          <p className="font-mono-digit mt-1 text-2xl text-white">{rows.length}</p>
        </div>
      </div>

      <ExerciseProgressChart points={chartPoints} />

      {rowsWithPR.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
            Historial en este ejercicio
          </p>
          <div className="flex flex-col gap-2">
            {rowsWithPR.map((row) => (
              <Link
                key={row.sessionId}
                href={`/historial/${row.sessionId}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-hair bg-glass px-4 py-3 transition hover:border-white/20"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">{formatDate(row.finishedAt)}</p>
                  <p className="text-xs text-faint">
                    Mejor serie: {row.weight}kg × {row.reps}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {row.isPR && (
                    <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal2">
                      PR
                    </span>
                  )}
                  <span className="font-mono-digit text-sm text-white">
                    {row.estimatedOneRepMax.toFixed(1)}kg
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
