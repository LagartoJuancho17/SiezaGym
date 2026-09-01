import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserSessions, weeklyVolumeKg } from "@/lib/sessions/sessions";
import { listExercises } from "@/lib/exercises/exercises";
import { bestSetByEstimatedOneRepMax } from "@/lib/epley";

export const dynamic = "force-dynamic";

function buildExerciseSummaries(sessions, exerciseLookup) {
  const summaries = new Map();

  for (const session of sessions) {
    for (const exerciseInSession of session.exercises) {
      const exercise = exerciseLookup.get(exerciseInSession.exerciseId);
      if (!exercise) continue;

      const best = bestSetByEstimatedOneRepMax(exerciseInSession.sets);
      const existing = summaries.get(exercise.id);

      if (!existing) {
        summaries.set(exercise.id, {
          exerciseId: exercise.id,
          nameEs: exercise.nameEs,
          lastPerformedAt: session.finishedAt,
          bestEstimatedOneRepMax: best?.estimatedOneRepMax || 0,
          timesPerformed: 1,
        });
      } else {
        existing.timesPerformed += 1;
        if (best && best.estimatedOneRepMax > existing.bestEstimatedOneRepMax) {
          existing.bestEstimatedOneRepMax = best.estimatedOneRepMax;
        }
      }
    }
  }

  return [...summaries.values()].sort(
    (a, b) => new Date(b.lastPerformedAt) - new Date(a.lastPerformedAt),
  );
}

export default async function ProgresoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [sessions, catalogExercises, weekVolume] = await Promise.all([
    listUserSessions(user.uid, { limitCount: 200 }),
    listExercises(),
    weeklyVolumeKg(user.uid),
  ]);

  const exerciseLookup = new Map(catalogExercises.map((e) => [e.id, e]));
  const exerciseSummaries = buildExerciseSummaries(sessions, exerciseLookup);
  const totalSessions = sessions.length;
  const lastSession = sessions[0] || null;

  return (
    <div className="flex flex-col gap-5 px-[18px] pb-[100px] lg:px-0">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">Progreso</p>
        <h1 className="font-display mt-1 text-[26px] uppercase leading-none text-white">
          Tu fuerza en el tiempo
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Volumen semanal</p>
          <p className="font-mono-digit mt-1 text-2xl text-teal2">{weekVolume}kg</p>
        </div>
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Sesiones totales</p>
          <p className="font-mono-digit mt-1 text-2xl text-white">{totalSessions}</p>
        </div>
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Ejercicios trackeados</p>
          <p className="font-mono-digit mt-1 text-2xl text-white">{exerciseSummaries.length}</p>
        </div>
        <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Última sesión</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {lastSession
              ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(
                  new Date(lastSession.finishedAt),
                )
              : "—"}
          </p>
        </div>
      </div>

      {exerciseSummaries.length === 0 ? (
        <section className="relative overflow-hidden rounded-[30px] bg-deep px-[18px] py-[22px]">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/62">
            Todavía no hay datos
          </p>
          <h2 className="font-display mt-2.5 text-[28px] uppercase leading-[0.96] tracking-[0.005em] text-white">
            Entrená para ver
            <br />
            tu progreso acá
          </h2>
          <p className="mt-2.5 text-[12.5px] leading-[1.5] text-white/70">
            Terminá un entrenamiento desde una rutina y el 1RM estimado de cada
            ejercicio empieza a graficarse solo.
          </p>
          <Link
            href="/rutinas"
            className="mt-[18px] flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-white text-[16px] font-semibold text-onlight transition hover:opacity-90 lg:w-auto lg:px-8"
          >
            Ir a mis rutinas
          </Link>
        </section>
      ) : (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
            Por ejercicio
          </p>
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
            {exerciseSummaries.map((summary) => (
              <Link
                key={summary.exerciseId}
                href={`/progreso/${summary.exerciseId}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-hair bg-glass px-4 py-3.5 transition hover:border-white/20"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{summary.nameEs}</p>
                  <p className="mt-0.5 text-xs text-faint">
                    {summary.timesPerformed} {summary.timesPerformed === 1 ? "sesión" : "sesiones"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono-digit text-base text-teal2">
                    {summary.bestEstimatedOneRepMax > 0
                      ? `${summary.bestEstimatedOneRepMax.toFixed(1)}kg`
                      : "—"}
                  </span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-faint">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
