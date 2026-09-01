import Link from "next/link";
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
    <div className="flex flex-col gap-5 px-[18px] pb-[100px] lg:px-0">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">Historial</p>
        <h1 className="font-display mt-1 text-[26px] uppercase leading-none text-white">
          Sesiones entrenadas
        </h1>
      </header>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-hair bg-glass p-5 text-center text-sm text-faint">
          Todavía no terminaste ningún entrenamiento.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/historial/${session.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-hair bg-glass px-4 py-3.5 transition hover:border-white/20"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">
                  {session.routineName || "Sesión libre"}
                </p>
                <p className="mt-0.5 text-xs text-faint">
                  {formatDate(session.finishedAt)} · {formatDuration(session.durationSeconds)} ·{" "}
                  {session.totalSetsCompleted} series
                </p>
              </div>
              <span className="font-mono-digit shrink-0 text-sm text-teal2">
                {session.totalVolumeKg}kg
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
