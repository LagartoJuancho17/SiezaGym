import Image from "next/image";
import Link from "next/link";

function Meta({ path, filled = false, children }) {
  return (
    <span className="flex items-center gap-1 whitespace-nowrap text-[11.5px] text-[#575049]">
      <svg
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-[#8C827A]"
        aria-hidden="true"
      >
        {path}
      </svg>
      {children}
    </span>
  );
}

// Card compacta de rutina, con la misma superficie y borde que los widgets de
// la Home: rounded-[10px], borde crimson, fondo surface.
export default function RoutineRow({ routine }) {
  const exerciseCount = routine.exercises?.length || 0;

  return (
    <article className="flex overflow-hidden rounded-[10px] border border-[#5A1215] bg-surface">
      <div className="relative w-[72px] shrink-0">
        <Image src="/hero-gym.jpg" alt="" fill sizes="72px" className="object-cover object-center" />
      </div>

      <div className="min-w-0 flex-1 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-sans text-[15px] font-bold tracking-tight text-[#141414]">
            {routine.name}
          </h3>
          {routine.isAssigned && (
            <span className="shrink-0 rounded-full bg-[#FF5733]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#FF5733]">
              Asignada
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <Meta
            filled
            path={
              <>
                <rect x="2" y="10.75" width="1.5" height="2.5" rx="0.75" />
                <rect x="4" y="7.5" width="2" height="9" rx="1" />
                <rect x="6.5" y="5.5" width="2.5" height="13" rx="1.2" />
                <rect x="8.5" y="10.75" width="7" height="2.5" rx="0.5" />
                <rect x="15" y="5.5" width="2.5" height="13" rx="1.2" />
                <rect x="18" y="7.5" width="2" height="9" rx="1" />
                <rect x="20.5" y="10.75" width="1.5" height="2.5" rx="0.75" />
              </>
            }
          >
            {exerciseCount} {exerciseCount === 1 ? "ejercicio" : "ejercicios"}
          </Meta>
          <Meta path={<><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 12l9 5 9-5" /></>}>
            {routine.totalSets || 0} series
          </Meta>
          <Meta path={<><circle cx="12" cy="12" r="8.4" /><path d="M12 7.4V12l3 1.9" /></>}>
            {routine.estimatedMinutes || 0} min
          </Meta>
        </div>

        <div className="mt-2 flex justify-end">
          <Link
            href={`/rutinas/${routine.id}`}
            className="group flex h-8 items-center gap-1.5 rounded-full border border-[#5A1215]/25 px-3 text-[11.5px] font-bold text-[#141414] transition hover:border-[#FF5733] hover:bg-[#FF5733] hover:text-white"
          >
            Ver rutina
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
