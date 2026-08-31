import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import AccountMenu from "@/components/home/AccountMenu";
import OfflineBanner from "@/components/home/OfflineBanner";
import LinkCoachSection from "@/components/home/LinkCoachSection";
import WeekStrip from "@/components/home/WeekStrip";

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

  const profile = await getUserProfile(user.uid);
  const firstName = profile?.displayName?.trim().split(/\s+/)[0] || null;
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";

  const today = formatHeaderDate(new Date());
  const initial = (profile?.displayName || user.email || "?").charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex min-h-screen max-w-md flex-col pt-[52px]">
        <header className="flex items-center justify-between gap-3 px-[18px] pb-3.5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
              {today}
            </p>
            <h1 className="font-display mt-1.5 text-[23px] uppercase leading-none tracking-[0.005em]">
              {greeting}
            </h1>
          </div>
          <AccountMenu
            initial={initial}
            photoURL={profile?.photoURL || null}
            email={user.email || null}
          />
        </header>

        <OfflineBanner />

        <div className="flex flex-col px-[18px] pb-[100px]">
          <WeekStrip />

          <div className="mb-3 grid grid-cols-2 gap-2.5">
            <section
              aria-label="Volumen de la semana"
              className="flex min-h-[132px] flex-col justify-between rounded-[26px] border border-hair bg-glass p-[15px]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-semibold tracking-[-0.01em]">
                  Volumen
                </span>
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  className="shrink-0 text-teal2"
                >
                  <path d="M4 9v6" />
                  <path d="M20 9v6" />
                  <path d="M7 7v10" />
                  <path d="M17 7v10" />
                  <path d="M7 12h10" />
                </svg>
              </div>
              <div>
                <div className="font-mono-digit text-2xl tracking-wide">0</div>
                <p className="mt-2 text-[11px] text-faint">kg esta semana</p>
              </div>
            </section>

            <section
              aria-label="Tu objetivo semanal"
              className="relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-[26px] p-[15px] text-white"
              style={{
                background: "linear-gradient(150deg, var(--teal) 0%, #1C5F6C 100%)",
              }}
            >
              <div>
                <p className="text-[13px] font-semibold tracking-[-0.01em]">
                  Tu objetivo
                </p>
                <p className="mt-1 text-[11px] leading-tight text-white/82">
                  Se activa con tu primera sesión registrada.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span
                  className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full"
                  style={{
                    background:
                      "conic-gradient(#fff 0 0%, rgba(255,255,255,.26) 0)",
                  }}
                >
                  <span
                    className="font-mono-digit flex h-[34px] w-[34px] items-center justify-center rounded-full text-[10px]"
                    style={{ background: "#1C5F6C" }}
                  >
                    0%
                  </span>
                </span>
              </div>
            </section>
          </div>

          <section
            aria-label="Primer paso"
            className="relative mb-3 overflow-hidden rounded-[30px] bg-deep px-[18px] py-[22px]"
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
              <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/62">
                Primer paso
              </p>
              <h2 className="font-display mt-2.5 text-[40px] uppercase leading-[0.94] tracking-[0.005em] text-white">
                Armá tu
                <br />
                primera rutina
              </h2>
              <p className="mt-2.5 text-[12.5px] leading-[1.5] text-white/70">
                Elegí ejercicios y días. Si entrenás con alguien, cargá su
                código y te asigna el plan.
              </p>
              <button
                type="button"
                className="mt-[18px] flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-white text-[16px] font-semibold text-onlight transition hover:opacity-90"
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
              </button>
              <button
                type="button"
                className="mt-2 h-12 w-full rounded-full border border-white/30 text-[14.5px] font-semibold text-white transition hover:bg-white/10"
              >
                Tengo un código de entrenador
              </button>
            </div>
          </section>

          <LinkCoachSection />

          {profile?.isCoach && (
            <a
              href="/dashboard/coach"
              className="mb-3 flex items-center gap-3 rounded-[16px] border border-hair bg-glass p-[15px] transition hover:bg-glass2"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal2">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold tracking-[-0.01em]">
                  Mis alumnos
                </p>
                <p className="mt-0.5 text-[11px] text-faint">
                  Gestioná tus alumnos vinculados
                </p>
              </div>
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-faint"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>
          )}
        </div>

        <div className="min-h-[30px] flex-1" />

        <nav
          aria-label="Navegación principal"
          className="sticky bottom-0 flex items-center gap-2.5 px-[18px] pb-6"
          style={{ background: "linear-gradient(to top, var(--bg) 58%, transparent)" }}
        >
          <div className="grid flex-1 grid-cols-4 items-center justify-items-center rounded-full border border-hair bg-nav p-1.5 backdrop-blur-[20px]">
            <button
              type="button"
              aria-label="Inicio"
              className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-glass2 text-text"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Rutinas"
              className="flex h-[46px] w-[46px] items-center justify-center rounded-full text-faint transition hover:text-text"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h10" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Progreso"
              className="flex h-[46px] w-[46px] items-center justify-center rounded-full text-faint transition hover:text-text"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <path d="M5 20V11" />
                <path d="M12 20V4" />
                <path d="M19 20v-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Perfil"
              className="flex h-[46px] w-[46px] items-center justify-center rounded-full text-faint transition hover:text-text"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <circle cx="12" cy="8" r="3.6" />
                <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            aria-label="Empezar sesión vacía"
            className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full text-white shadow-[0_10px_24px_rgba(63,169,188,0.4)] transition hover:opacity-90 active:scale-95"
            style={{
              background:
                "linear-gradient(140deg, var(--teal2) 0%, var(--teal) 55%, #1C5F6C 100%)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        </nav>
      </div>
    </main>
  );
}
