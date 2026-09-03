import Link from "next/link";

export default function HomeHero({ routineId, routineName, description }) {
  return (
    <Link
      href={`/rutinas/${routineId}`}
      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-teal/25 bg-deep px-6 py-7 transition hover:border-teal/50 sm:px-8 sm:py-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
        style={{
          background:
            "radial-gradient(120% 90% at 12% -10%, rgba(63,169,188,0.4) 0%, transparent 65%)",
        }}
      />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal2">
          Hoy toca
        </p>
        <h2 className="font-display mt-2 text-[32px] sm:text-[42px] lg:text-[46px] uppercase leading-[0.94] tracking-wide text-white">
          ¡A entrenar!
          <br />
          {routineName}
        </h2>
        <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/70">
          {description}
        </p>
        <span className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-onlight shadow-md transition group-hover:opacity-90">
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
        </span>
      </div>
    </Link>
  );
}
