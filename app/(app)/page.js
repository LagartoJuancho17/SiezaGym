import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserRoutines } from "@/lib/routines/routines";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { listTrainedDates, listUserSessions } from "@/lib/sessions/sessions";
import { computeStreak } from "@/lib/sessions/streak";
import { totalSets, estimatedDurationMinutes } from "@/lib/routines/summary";
import AccountMenu from "@/components/home/AccountMenu";
import OfflineBanner from "@/components/home/OfflineBanner";
import LinkCoachSection from "@/components/home/LinkCoachSection";
import WeekStrip from "@/components/home/WeekStrip";
import RoutinesCarousel from "@/components/home/RoutinesCarousel";
import HomeHero from "@/components/home/HomeHero";
import HomeStats from "@/components/home/HomeStats";
import CoachHomeSection from "@/components/coach/CoachHomeSection";
import { listCoachStudents } from "@/lib/coach/students";

export const dynamic = "force-dynamic";

function formatHeaderDate(date) {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, routines, trainedDates, assignments, lastSessions] = await Promise.all([
    getUserProfile(user.uid),
    listUserRoutines(user.uid),
    listTrainedDates(user.uid),
    listStudentAssignments(user.uid),
    listUserSessions(user.uid, { limitCount: 1 }),
  ]);

  const streak = computeStreak(trainedDates);
  const lastSession = lastSessions[0] || null;
  const isCoach = !!profile?.isCoach || !!profile?.isAdmin;
  const students = isCoach ? await listCoachStudents(user.uid) : [];

  const enrichedRoutines = routines.map((routine) => ({
    ...routine,
    totalSets: totalSets(routine),
    estimatedMinutes: estimatedDurationMinutes(routine),
    isAssigned: false,
    sortKey: routine.lastUsedAt || routine.createdAt,
  }));
  const enrichedAssignments = assignments.map((assignment) => ({
    id: assignment.id,
    name: assignment.routineName,
    exercises: assignment.exercises,
    showOnHome: true,
    isAssigned: true,
    totalSets: totalSets({ exercises: assignment.exercises }),
    estimatedMinutes: estimatedDurationMinutes({ exercises: assignment.exercises }),
    sortKey: assignment.lastUsedAt || assignment.assignedAt,
  }));
  const hasAnyRoutine = routines.length > 0 || assignments.length > 0;
  const visibleRoutines = [...enrichedRoutines, ...enrichedAssignments]
    .filter((routine) => routine.showOnHome !== false)
    .sort((a, b) => new Date(b.sortKey || 0) - new Date(a.sortKey || 0));
  const firstName = profile?.displayName?.trim().split(/\s+/)[0] || null;
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";

  const today = formatHeaderDate(new Date());
  const initial = (profile?.displayName || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6 px-[18px] pb-[100px] md:pb-12 lg:px-0">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-600">
            {today}
          </p>
          <h1 className="font-sans mt-1 text-[26px] sm:text-[32px] lg:text-[36px] font-extrabold leading-none tracking-tight text-[#18120f]">
            {greeting}
          </h1>
        </div>
        {visibleRoutines.length === 0 && (
          <div className="md:hidden">
            <AccountMenu
              initial={initial}
              photoURL={profile?.photoURL || null}
              email={user.email || null}
              variant="light"
            />
          </div>
        )}
      </header>

      <OfflineBanner />

      {/* Main Responsive Grid: 2-Column on Desktop (8/4 split), 1-Column on Mobile */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Left / Main Column (8 cols on desktop) */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Mobile-only Coach Section */}
          {isCoach && (
            <div className="lg:hidden">
              <CoachHomeSection students={students} isAdmin={!!profile?.isAdmin} />
            </div>
          )}

          {visibleRoutines.length > 0 && (
            <HomeHero
              routineId={visibleRoutines[0].id}
              routineName={visibleRoutines[0].name}
              description={
                lastSession
                  ? `La última vez moviste ${lastSession.totalVolumeKg}kg en ${lastSession.totalSetsCompleted} series.${
                      streak > 1 ? ` Llevás ${streak} días seguidos, no cortes la racha.` : ""
                    }`
                  : "Todavía no registraste ningún entrenamiento. Arrancá esta rutina y empezá a sumar progreso."
              }
              accountInitial={initial}
              accountPhotoURL={profile?.photoURL || null}
              accountEmail={user.email || null}
            />
          )}

          {hasAnyRoutine && (
            <HomeStats
              streak={streak}
              routinesCount={visibleRoutines.length}
              lastSession={lastSession}
            />
          )}

          <WeekStrip trainedDates={trainedDates} streak={streak} />

          {/* Routines Section */}
          {!hasAnyRoutine ? (
            <section
              aria-label="Primer paso"
              className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white px-6 py-7 shadow-[0_2px_10px_rgba(24,18,15,0.04)]"
            >
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-orange-600">
                Primer paso
              </p>
              <h2 className="font-sans mt-2 text-[28px] sm:text-[34px] font-extrabold leading-[1.02] tracking-tight text-[#18120f]">
                Armá tu primera rutina
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#7a716a] max-w-md">
                Elegí ejercicios y días. Si entrenás con alguien, cargá su código y te asigna el
                plan.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/rutinas/nueva"
                  className="flex h-12 w-full sm:w-auto px-6 items-center justify-center gap-2 rounded-full bg-[#18120f] text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-95"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Crear rutina
                </Link>
                <button
                  type="button"
                  className="h-12 w-full sm:w-auto px-5 rounded-full border border-black/15 text-sm font-semibold text-[#18120f] transition hover:bg-black/[0.04] active:scale-95"
                >
                  Tengo un código de entrenador
                </button>
              </div>
            </section>
          ) : visibleRoutines.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-black/15 bg-white/60 px-6 py-7 text-center">
              <p className="text-sm text-[#7a716a]">
                Tenés {routines.length} {routines.length === 1 ? "rutina oculta" : "rutinas ocultas"} del
                inicio.
              </p>
              <Link
                href="/rutinas"
                className="mt-3 inline-flex h-10 items-center rounded-full border border-black/15 px-5 text-xs font-semibold text-[#18120f] transition hover:border-orange-400"
              >
                Ver en Rutinas
              </Link>
            </section>
          ) : (
            <RoutinesCarousel routines={visibleRoutines} />
          )}

          {!isCoach && (
            <div className="lg:hidden">
              <LinkCoachSection />
            </div>
          )}
        </div>

        {/* Right / Sidebar Column (4 cols on desktop): Coach or Link Coach Sidebar */}
        <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-6">
          {isCoach ? (
            <div className="hidden lg:block">
              <CoachHomeSection students={students} isAdmin={!!profile?.isAdmin} />
            </div>
          ) : (
            <div className="hidden lg:block">
              <LinkCoachSection />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
