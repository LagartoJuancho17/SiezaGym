import PageShell from "@/components/design2/PageShell";
import Image from "next/image";
import StudentVolumeChart from "@/components/coach/StudentVolumeChart";
import "./coach-design2.css";

function formatDateTime(iso) {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatShortDate(iso) {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

function formatDuration(totalSec) {
  const mins = Math.round((totalSec || 0) / 60);
  return mins < 1 ? "<1 min" : `${mins} min`;
}

export default function StudentDetailView({ studentProfile, sessions, catalogExercises }) {
  const exerciseLookup = new Map(catalogExercises.map((e) => [e.id, e]));
  const chartPoints = [...sessions].reverse();
  const initial = (studentProfile.displayName || "?").charAt(0).toUpperCase();

  return (
    <PageShell title={studentProfile.displayName || "Sin nombre"} eyebrow="Seguimiento del alumno" backHref="/dashboard/coach" backLabel="Volver a alumnos">
      <div className="d2-coach-stack">
        <header className="d2-glass d2-coach-row">
          <div className="d2-student-initial overflow-hidden">
            {studentProfile.photoURL ? (
              <Image
                src={studentProfile.photoURL}
                alt=""
                width={44}
                height={44}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              initial
            )}
          </div>
          <div className="d2-student-body">
            <p className="d2-student-name">
              {studentProfile.displayName || "Sin nombre"}
            </p>
            <p className="d2-student-mail">{studentProfile.email}</p>
          </div>
        </header>

        <div className="d2-coach-summary">
          <div className="d2-glass d2-coach-card">
            <p className="d2-coach-muted">Sesiones recientes</p>
            <p className="d2-coach-number">{sessions.length}</p>
          </div>
          <div className="d2-glass d2-coach-card">
            <p className="d2-coach-muted">Última sesión</p>
            <p className="d2-student-name mt-2">
              {sessions[0] ? formatShortDate(sessions[0].finishedAt) : "—"}
            </p>
          </div>
        </div>

        <section>
          <p className="d2-coach-section-title">
            Volumen por sesión
          </p>
          <StudentVolumeChart points={chartPoints} />
        </section>

        <section>
          <p className="d2-coach-section-title">
            Historial por fecha y rutina
          </p>
          {sessions.length === 0 ? (
            <p className="d2-glass d2-empty">
              Todavía no entrenó.
            </p>
          ) : (
            <div className="d2-coach-stack">
              {sessions.map((session) => (
                <div key={session.id} className="d2-glass d2-coach-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="d2-student-name">
                        {session.routineName || "Sesión libre"}
                      </p>
                      <p className="d2-coach-muted mt-1">
                        {formatDateTime(session.finishedAt)} · {formatDuration(session.durationSeconds)}
                      </p>
                    </div>
                    <span className="d2-coach-value">
                      {session.totalVolumeKg}kg
                    </span>
                  </div>
                  <div className="d2-coach-sets">
                    {session.exercises.map((exerciseInSession, i) => {
                      const catalogExercise = exerciseLookup.get(exerciseInSession.exerciseId);
                      return (
                        <div key={i} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                          <span className="font-medium">
                            {catalogExercise?.nameEs || "Ejercicio"}
                          </span>
                          <span className="d2-coach-muted">
                            {(exerciseInSession.sets || [])
                              .map((s) => `${s.weight}kg×${s.reps}`)
                              .join(", ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
