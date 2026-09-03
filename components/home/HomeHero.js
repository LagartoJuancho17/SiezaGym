import Link from "next/link";
import AccountMenu from "@/components/home/AccountMenu";

export default function HomeHero({
  routineId,
  routineName,
  description,
  accountInitial,
  accountPhotoURL,
  accountEmail,
}) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[28px] px-6 py-7 shadow-[0_16px_40px_rgba(154,52,18,0.25)] sm:px-8 sm:py-8"
      style={{
        background:
          "radial-gradient(120% 140% at 8% -20%, rgba(0,0,0,0.55) 0%, transparent 55%), linear-gradient(155deg, #7a1f16 0%, #c2410c 55%, #f97316 100%)",
      }}
    >
      {/* Icon pills, top-right, over the photo */}
      <div className="absolute right-6 top-6 z-10 flex items-center gap-2 sm:right-8 sm:top-8">
        <Link
          href="/perfil"
          aria-label="Configuración"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/30"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
        <div className="[&_button]:bg-white/20 [&_button]:border-transparent [&_button]:text-white [&_button:hover]:bg-white/30 [&_button:hover]:text-white">
          <AccountMenu initial={accountInitial} photoURL={accountPhotoURL} email={accountEmail} size="sm" />
        </div>
      </div>

      <div className="relative max-w-[85%] sm:max-w-[75%]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
          Hoy toca
        </p>
        <h2 className="font-sans mt-2 text-[30px] sm:text-[40px] lg:text-[44px] font-extrabold leading-[1.02] tracking-tight text-white">
          ¡Vamos!
          <br />
          {routineName}
        </h2>
        <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/80">
          {description}
        </p>
        <Link
          href={`/rutinas/${routineId}`}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#18120f] shadow-md transition hover:opacity-90 active:scale-[0.98]"
        >
          Ver rutina
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
