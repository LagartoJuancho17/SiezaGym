import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { isLinkedToCoach } from "@/lib/coach/students";
import { listUserSessions } from "@/lib/sessions/sessions";
import { listExercises } from "@/lib/exercises/exercises";
import StudentVolumeChart from "@/components/coach/StudentVolumeChart";

export const dynamic = "force-dynamic";

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

export default async function StudentDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.uid);
  if (!profile?.isCoach && !profile?.isAdmin) redirect("/");

  const { studentId } = await params;
  const linked = await isLinkedToCoach(studentId, user.uid);
  if (!linked) notFound();

  const [studentProfile, sessions, catalogExercises] = await Promise.all([
    getUserProfile(studentId),
    listUserSessions(studentId, { limitCount: 100 }),
    listExercises(),
  ]);

  if (!studentProfile) notFound();

  const exerciseLookup = new Map(catalogExercises.map((e) => [e.id, e]));
  const chartPoints = [...sessions].reverse();
  const initial = (studentProfile.displayName || "?").charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-[18px] pt-[52px] pb-[100px] lg:max-w-2xl lg:px-0">
        <header className="flex items-center gap-3">
          <Link
            href="/dashboard/coach"
            aria-label="Volver"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hair text-faint transition hover:border-teal2 hover:text-text"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hair bg-glass2 text-sm font-semibold text-muted">
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
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-text">
              {studentProfile.displayName || "Sin nombre"}
            </p>
            <p className="truncate text-xs text-faint">{studentProfile.email}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Sesiones</p>
            <p className="font-mono-digit mt-1 text-2xl text-white">{sessions.length}</p>
          </div>
          <div className="rounded-[18px] border border-hair bg-glass p-[15px]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Última sesión</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {sessions[0] ? formatShortDate(sessions[0].finishedAt) : "—"}
            </p>
          </div>
        </div>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
            Volumen por sesión
          </p>
          <StudentVolumeChart points={chartPoints} />
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
            Historial por fecha y rutina
          </p>
          {sessions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-hair bg-glass p-5 text-center text-sm text-faint">
              Todavía no entrenó.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-hair bg-glass p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">
                        {session.routineName || "Sesión libre"}
                      </p>
                      <p className="mt-0.5 text-xs text-faint">
                        {formatDateTime(session.finishedAt)} · {formatDuration(session.durationSeconds)}
                      </p>
                    </div>
                    <span className="font-mono-digit shrink-0 text-sm text-teal2">
                      {session.totalVolumeKg}kg
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5 border-t border-hair/50 pt-3">
                    {session.exercises.map((exerciseInSession, i) => {
                      const catalogExercise = exerciseLookup.get(exerciseInSession.exerciseId);
                      return (
                        <div key={i} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                          <span className="font-medium text-text">
                            {catalogExercise?.nameEs || "Ejercicio"}
                          </span>
                          <span className="font-mono-digit text-faint">
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
    </main>
  );
}
