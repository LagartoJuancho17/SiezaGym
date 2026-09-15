import Link from "next/link";
import WeekStrip from "./WeekStrip";

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22c4.1 0 7-2.8 7-6.6 0-3.3-2-5.5-4.4-8.1.1 2.5-1.1 4.1-2.6 5.1.1-3.3-1.7-6-4.2-8.4.2 3.9-3.8 6.3-3.8 11.2C4 19.1 7.2 22 12 22Z" />
      <path d="M9.5 19.1c0-1.8 1.2-2.9 2.5-4.4 1.3 1.3 2.1 2.5 2.1 4.1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4.2 4.2L19 6.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export default function HomeStats({
  trainedDates,
  streak,
  completedWorkouts,
  weeklyVolumeKg,
}) {
  const formattedVolume = weeklyVolumeKg.toLocaleString("es-AR");

  return (
    <section aria-label="Resumen de entrenamiento" className="w-full px-4 pb-4 sm:px-6 lg:px-7">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-3">
        <WeekStrip trainedDates={trainedDates} streak={streak} />

        <div className="grid grid-cols-2 gap-3">
          <article className="rounded-3xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm sm:p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5733]/15 text-[#FF5733]">
              <FlameIcon />
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#756C65]">Tu racha</p>
            <p className="font-sans mt-1 text-3xl font-extrabold tracking-tight text-[#141414] sm:text-4xl">{streak}</p>
            <p className="mt-0.5 text-xs text-[#756C65]">{streak === 1 ? "día seguido" : "días seguidos"}</p>
          </article>

          <article className="rounded-3xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm sm:p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5733]/15 text-[#FF5733]">
              <CheckIcon />
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#756C65]">Entrenamientos</p>
            <p className="font-sans mt-1 text-3xl font-extrabold tracking-tight text-[#141414] sm:text-4xl">{completedWorkouts}</p>
            <p className="mt-0.5 text-xs text-[#756C65]">completados en los últimos 7 días</p>
          </article>
        </div>

        <Link
          href="/progreso"
          className="group relative overflow-hidden rounded-3xl border border-[#FF7352]/50 bg-gradient-to-br from-[#C4402F] via-[#9D2B25] to-[#661713] p-5 shadow-[0_14px_30px_rgba(24,6,6,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(24,6,6,0.42)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF7352] sm:p-6"
        >
          <span aria-hidden="true" className="absolute -right-10 -top-14 h-40 w-40 rounded-full border border-white/15" />
          <span aria-hidden="true" className="absolute -bottom-16 right-16 h-28 w-28 rounded-full border border-white/10" />
          <div className="relative flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/65">Tu progreso</p>
              <p className="font-sans mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {formattedVolume} <span className="text-lg font-bold text-white/75">kg</span>
              </p>
              <p className="mt-1 text-[13px] text-white/75">volumen acumulado en los últimos 7 días</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white transition group-hover:bg-white group-hover:text-[#9D2B25]">
              <ArrowIcon />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
