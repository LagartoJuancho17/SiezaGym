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
    <main className="min-h-screen bg-[#35080A] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-[18px] pt-[52px] pb-[100px] lg:max-w-2xl lg:px-0">
        <header className="flex items-center gap-3">
          <Link
            href="/dashboard/coach"
            aria-label="Volver"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FF5733] text-sm font-bold text-white">
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
            <p className="truncate text-base font-bold text-white">
              {studentProfile.displayName || "Sin nombre"}
            </p>
            <p className="truncate text-xs text-white/50">{studentProfile.email}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#756C65]">Sesiones</p>
            <p className="font-sans mt-1 text-2xl font-extrabold text-[#141414]">{sessions.length}</p>
          </div>
          <div className="rounded-2xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#756C65]">Última sesión</p>
            <p className="mt-1 text-sm font-bold text-[#141414]">
              {sessions[0] ? formatShortDate(sessions[0].finishedAt) : "—"}
            </p>
          </div>
        </div>

        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#FF5733]">
            Volumen por sesión
          </p>
          <StudentVolumeChart points={chartPoints} />
        </section>

        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#FF5733]">
            Historial por fecha y rutina
          </p>
          {sessions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#6B1717] bg-[#EDE8E1]/60 p-5 text-center text-sm text-[#756C65]">
              Todavía no entrenó.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#141414]">
                        {session.routineName || "Sesión libre"}
                      </p>
                      <p className="mt-0.5 text-xs text-[#756C65]">
                        {formatDateTime(session.finishedAt)} · {formatDuration(session.durationSeconds)}
                      </p>
                    </div>
                    <span className="font-mono-digit shrink-0 text-sm font-bold text-[#FF5733]">
                      {session.totalVolumeKg}kg
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5 border-t border-[#D5CEC4] pt-3">
                    {session.exercises.map((exerciseInSession, i) => {
                      const catalogExercise = exerciseLookup.get(exerciseInSession.exerciseId);
                      return (
                        <div key={i} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                          <span className="font-semibold text-[#141414]">
                            {catalogExercise?.nameEs || "Ejercicio"}
                          </span>
                          <span className="font-mono-digit text-[#756C65]">
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
