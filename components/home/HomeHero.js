import Link from "next/link";

export default function HomeHero({ routineId, routineName, description }) {
  return (
    <Link
      href={`/rutinas/${routineId}`}
      className="group relative flex flex-col overflow-hidden rounded-[28px] px-6 py-7 shadow-[0_16px_40px_rgba(154,52,18,0.25)] transition hover:shadow-[0_20px_48px_rgba(154,52,18,0.35)] sm:px-8 sm:py-8"
      style={{
        background:
          "radial-gradient(120% 140% at 8% -20%, rgba(0,0,0,0.55) 0%, transparent 55%), linear-gradient(155deg, #7a1f16 0%, #c2410c 55%, #f97316 100%)",
      }}
    >
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
          Hoy toca
        </p>
        <h2 className="font-display mt-2 text-[32px] sm:text-[42px] lg:text-[46px] uppercase leading-[0.94] tracking-wide text-white">
          ¡A entrenar!
          <br />
          {routineName}
        </h2>
        <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/80">
          {description}
        </p>
        <span className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#18120f] shadow-md transition group-hover:opacity-90">
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
