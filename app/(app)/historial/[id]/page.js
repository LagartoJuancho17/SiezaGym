import Link from "next/link";
import PageShell from "@/components/design2/PageShell";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import "@/components/progress/progress-design2.css";
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
  const [session, catalogExercises, customExercises] = await Promise.all([
    getUserSession(user.uid, id),
    listExercises(),
    listCustomExercises(user.uid),
  ]);

  if (!session) notFound();

  const exerciseLookup = new Map([...catalogExercises, ...customExercises].map((e) => [e.id, e]));

  return (
    <PageShell title={session.routineName || "Sesión libre"} eyebrow={formatDateTime(session.finishedAt)} backHref="/historial" backLabel="Historial">
      <div className="d2-glass d2-stats">
        <div className="d2-stat"><span className="d2-stat-value">{formatDuration(session.durationSeconds)}</span><span className="d2-stat-label">duración</span></div>
        <div className="d2-stat"><span className="d2-stat-value">{session.totalSetsCompleted}</span><span className="d2-stat-label">series</span></div>
        <div className="d2-stat"><span className="d2-stat-value">{session.totalVolumeKg} kg</span><span className="d2-stat-label">volumen</span></div>
      </div>
      <p className="d2-label">Ejercicios realizados</p>
      <section className="d2-session-exercises">
        {session.exercises.map((exercise, index) => {
          const catalogExercise = exerciseLookup.get(exercise.exerciseId);
          return (
            <div
              key={`${exercise.exerciseId}-${index}`}
              className="d2-glass d2-session-exercise"
            >
              <Link
                href={`/progreso/${exercise.exerciseId}`}
                className="d2-session-exercise-name"
              >
                {catalogExercise?.nameEs || "Ejercicio"}
              </Link>
              <div className="d2-session-sets">
                {(exercise.sets || []).map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className="d2-session-set"
                  >
                    <span>Serie {set.setNumber || setIndex + 1}</span>
                    <span className="d2-session-set-value">
                      {set.weight}kg × {set.reps}
                      {set.failed ? <span className="d2-session-failed">fallada</span> : null}
                    </span>
                    {/* Una serie fallada no da una marca: el resto de la app
                        la descarta para el 1RM, y mostrarla acá diría que
                        levantaste algo que no levantaste. */}
                    <span className="d2-session-estimate">
                      {set.failed
                        ? "sin marca"
                        : `${estimatedOneRepMax(set.weight, set.reps).toFixed(1)} kg · 1RM est.`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </PageShell>
  );
}
