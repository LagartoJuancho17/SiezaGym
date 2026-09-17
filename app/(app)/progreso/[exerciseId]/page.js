import Link from "next/link";
import Image from "next/image";
import PageShell from "@/components/design2/PageShell";
import { getCustomExercise } from "@/lib/customExercises/customExercises";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getExerciseById } from "@/lib/exercises/exercises";
import { listSessionsForExercise } from "@/lib/sessions/sessions";
import { bestSetByEstimatedOneRepMax, maxWeightFromSets } from "@/lib/epley";
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
    getExerciseById(exerciseId).then((exercise) => exercise || getCustomExercise(user.uid, exerciseId)),
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
  const maxWeightKg = sessions.reduce((max, session) => {
    const exerciseInSession = session.exercises.find((e) => e.exerciseId === exerciseId);
    return Math.max(max, maxWeightFromSets(exerciseInSession?.sets));
  }, 0);

  return (
    <PageShell title={exercise.nameEs} eyebrow="Progreso por ejercicio" backHref="/progreso" backLabel="Progreso">
      {exercise.mediaUrl && (
        <div className="d2-glass d2-exhero">
          <span className="d2-ex-thumb d2-exhero-media">
            <Image src={exercise.mediaUrl} alt="" width={120} height={120} unoptimized priority />
          </span>
          <span className="d2-exhero-body">
            <span className="d2-exhero-name">{exercise.nameEs}</span>
            {exercise.descriptionEs && (
              <span className="d2-exhero-note">{exercise.descriptionEs}</span>
            )}
          </span>
        </div>
      )}

      <div className="d2-glass d2-stats">
        <div className="d2-stat"><span className="d2-stat-value">{maxWeightKg > 0 ? `${maxWeightKg} kg` : "—"}</span><span className="d2-stat-label">peso máximo</span></div>
        <div className="d2-stat"><span className="d2-stat-value">{currentBest > 0 ? `${currentBest.toFixed(1)} kg` : "—"}</span><span className="d2-stat-label">1RM estimado</span></div>
        <div className="d2-stat"><span className="d2-stat-value">{rows.length}</span><span className="d2-stat-label">sesiones</span></div>
      </div>
      <p className="d2-label">Evolución del 1RM estimado</p>
      <ExerciseProgressChart points={chartPoints} />

      {rowsWithPR.length > 0 && (
        <section>
          <p className="d2-label">
            Historial en este ejercicio
          </p>
          <div className="d2-routine-list">
            {rowsWithPR.map((row) => (
              <Link
                key={row.sessionId}
                href={`/historial/${row.sessionId}`}
                className="d2-routine"
              >
                <div className="d2-routine-body">
                  <p className="d2-routine-name">{formatDate(row.finishedAt)}</p>
                  <p className="d2-routine-meta">
                    Mejor serie: {row.weight}kg × {row.reps}
                  </p>
                </div>
                <div className="d2-routine-value">
                  {row.isPR && (
                    <span className="d2-progress-record">
                      PR
                    </span>
                  )}
                  <span className="d2-session-set-value">
                    {row.estimatedOneRepMax.toFixed(1)} kg
                    <span className="d2-routine-unit">1RM est.</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {exercise.mediaUrl && (
        <p className="d2-credit">
          Animaciones de ejercicios ©{" "}
          <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer">
            Gym visual
          </a>
        </p>
      )}
    </PageShell>
  );
}
