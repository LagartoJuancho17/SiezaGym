import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserRoutines } from "@/lib/routines/routines";
import { weeklyVolumeKg } from "@/lib/sessions/sessions";
import { totalSets, estimatedDurationMinutes } from "@/lib/routines/summary";
import AccountMenu from "@/components/home/AccountMenu";
import OfflineBanner from "@/components/home/OfflineBanner";
import LinkCoachSection from "@/components/home/LinkCoachSection";
import WeekStrip from "@/components/home/WeekStrip";
import RoutinesCarousel from "@/components/home/RoutinesCarousel";
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

  const [profile, routines, weekVolume] = await Promise.all([
    getUserProfile(user.uid),
    listUserRoutines(user.uid),
    weeklyVolumeKg(user.uid),
  ]);

  const isCoach = !!profile?.isCoach || !!profile?.isAdmin;
  const students = isCoach ? await listCoachStudents(user.uid) : [];

  const enrichedRoutines = routines.map((routine) => ({
    ...routine,
    totalSets: totalSets(routine),
    estimatedMinutes: estimatedDurationMinutes(routine),
  }));
  const firstName = profile?.displayName?.trim().split(/\s+/)[0] || null;
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";

  const today = formatHeaderDate(new Date());
  const initial = (profile?.displayName || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6 px-[18px] pb-[100px] md:pb-12 lg:px-0">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal2">
            {today}
          </p>
          <h1 className="font-display mt-1 text-[28px] sm:text-[34px] lg:text-[38px] uppercase leading-none tracking-wide text-white">
            {greeting}
          </h1>
        </div>
        <div className="flex items-center gap-3 md:hidden">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-white truncate max-w-[200px]">
              {profile?.displayName || user.email}
            </p>
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-teal2">
              {isCoach ? (profile?.isAdmin ? "Admin & Coach" : "Entrenador") : "Atleta"}
            </p>
          </div>
          <AccountMenu
            initial={initial}
            photoURL={profile?.photoURL || null}
            email={user.email || null}
          />
        </div>
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

          <WeekStrip />

          {/* Volume & Goal Stat Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <section
              aria-label="Volumen de la semana"
              className="flex min-h-[136px] flex-col justify-between rounded-3xl border border-hair/80 bg-glass/60 p-4 sm:p-5 backdrop-blur-md transition hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs sm:text-[13px] font-semibold tracking-wide text-text">
                  Volumen
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal/15 text-teal2">
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 9v6" />
                    <path d="M20 9v6" />
                    <path d="M7 7v10" />
                    <path d="M17 7v10" />
                    <path d="M7 12h10" />
                  </svg>
                </span>
              </div>
              <div>
                <div className="font-mono-digit text-2xl sm:text-3xl font-bold tracking-wide text-white">
                  {weekVolume}
                </div>
                <p className="mt-1 text-[11px] text-faint">kg esta semana</p>
              </div>
            </section>

            <section
              aria-label="Tu objetivo semanal"
              className="relative flex min-h-[136px] flex-col justify-between overflow-hidden rounded-3xl p-4 sm:p-5 text-white border border-teal/40 shadow-[0_8px_24px_rgba(63,169,188,0.15)]"
              style={{
                background:
                  "linear-gradient(150deg, rgba(63,169,188,0.25) 0%, rgba(8,23,26,0.9) 100%)",
              }}
            >
              <div>
                <p className="text-xs sm:text-[13px] font-semibold tracking-wide text-teal2">
                  Tu objetivo
                </p>
                <p className="mt-1 text-[11px] leading-snug text-white/80">
                  Se activa con tu primera sesión registrada.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background:
                      "conic-gradient(var(--teal2) 0 0%, rgba(255,255,255,.15) 0)",
                  }}
                >
                  <span className="font-mono-digit flex h-8 w-8 items-center justify-center rounded-full bg-deep text-[10px] font-bold text-white">
                    0%
                  </span>
                </span>
              </div>
            </section>
          </div>

          {/* Routines Section */}
          {routines.length === 0 ? (
            <section
              aria-label="Primer paso"
              className="relative overflow-hidden rounded-3xl bg-deep px-6 py-7 border border-white/10"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(90% 70% at 20% 0%, rgba(63,169,188,.32) 0%, transparent 70%)",
                }}
              />
              <div className="relative">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal2">
                  Primer paso
                </p>
                <h2 className="font-display mt-2 text-[30px] sm:text-[36px] uppercase leading-[0.96] tracking-wide text-white">
                  Armá tu primera rutina
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/70 max-w-md">
                  Elegí ejercicios y días. Si entrenás con alguien, cargá su código y te asigna el
                  plan.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="/rutinas/nueva"
                    className="flex h-12 w-full sm:w-auto px-6 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-onlight shadow-md transition hover:opacity-90 active:scale-95"
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
                    className="h-12 w-full sm:w-auto px-5 rounded-full border border-white/25 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
                  >
                    Tengo un código de entrenador
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <RoutinesCarousel routines={enrichedRoutines} />
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
