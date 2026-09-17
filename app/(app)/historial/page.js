import Link from "next/link";
import PageShell from "@/components/design2/PageShell";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserSessions } from "@/lib/sessions/sessions";

export const dynamic = "force-dynamic";

function formatDate(iso) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function formatDuration(totalSec) {
  const mins = Math.round(totalSec / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}min`;
}

export default async function HistorialPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sessions = await listUserSessions(user.uid);

  return (
    <PageShell title="Historial" eyebrow="Tu actividad">
      {sessions.length === 0 ? (
        <p className="d2-glass d2-empty">
          Todavía no terminaste ningún entrenamiento.
          <Link href="/rutinas" className="d2-empty-action">Ir a mis rutinas</Link>
        </p>
      ) : (
        <div className="d2-routine-list">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/historial/${session.id}`}
              className="d2-routine"
            >
              <div className="d2-routine-body">
                <p className="d2-routine-name">
                  {session.routineName || "Sesión libre"}
                </p>
                <p className="d2-routine-meta">
                  {formatDate(session.finishedAt)} · {formatDuration(session.durationSeconds)} ·{" "}
                  {session.totalSetsCompleted} series
                </p>
              </div>
              <span className="d2-routine-value">
                {session.totalVolumeKg} kg
                <span className="d2-routine-unit">volumen</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
