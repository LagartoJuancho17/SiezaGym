import Image from "next/image";
import Link from "next/link";

const META_ICONS = {
  exercises: (
    <>
      <rect x="2" y="10.75" width="1.5" height="2.5" rx="0.75" />
      <rect x="4" y="7.5" width="2" height="9" rx="1" />
      <rect x="6.5" y="5.5" width="2.5" height="13" rx="1.2" />
      <rect x="8.5" y="10.75" width="7" height="2.5" rx="0.5" />
      <rect x="15" y="5.5" width="2.5" height="13" rx="1.2" />
      <rect x="18" y="7.5" width="2" height="9" rx="1" />
      <rect x="20.5" y="10.75" width="1.5" height="2.5" rx="0.75" />
    </>
  ),
};

function Meta({ children, filled = false, path }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap text-[12px] text-[#3A3531]">
      <svg
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-[#3A3531]"
        aria-hidden="true"
      >
        {path}
      </svg>
      {children}
    </span>
  );
}

// Fila de rutina: foto pegada al borde izquierdo, nombre, metadatos y CTA.
export default function RoutineRow({ routine }) {
  const exerciseCount = routine.exercises?.length || 0;

  return (
    <article className="flex overflow-hidden rounded-[14px] border border-black/[0.06] bg-white">
      <div className="relative w-[92px] shrink-0 sm:w-[110px]">
        <Image src="/hero-gym.jpg" alt="" fill sizes="110px" className="object-cover object-center" />
      </div>

      <div className="min-w-0 flex-1 px-3.5 py-3">
        <h3 className="truncate font-sans text-[17px] font-bold tracking-tight text-[#141414]">
          {routine.name}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1">
          <Meta filled path={META_ICONS.exercises}>
            {exerciseCount} {exerciseCount === 1 ? "ejercicio" : "ejercicios"}
          </Meta>
          <Meta
            path={
              <>
                <path d="M21 8l-9-5-9 5 9 5 9-5z" />
                <path d="M3 12l9 5 9-5" />
              </>
            }
          >
            {routine.totalSets || 0} series
          </Meta>
          <Meta
            path={
              <>
                <circle cx="12" cy="12" r="8.4" />
                <path d="M12 7.4V12l3 1.9" />
              </>
            }
          >
            {routine.estimatedMinutes || 0} min
          </Meta>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          {routine.isAssigned ? (
            <span className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold text-[#FF5733]">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
                <path d="M8 3v4M16 3v4M3.5 10h17M9.5 15.5l2 2 3.5-3.5" />
              </svg>
              Asignada
            </span>
          ) : (
            <span />
          )}

          <Link
            href={`/rutinas/${routine.id}`}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#FF5733]/40 px-3.5 text-[12px] font-semibold text-[#141414] transition hover:bg-[#FF5733]/10"
          >
            Ver rutina
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
