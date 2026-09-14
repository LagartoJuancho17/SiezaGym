import Link from "next/link";
import Ring from "./Ring";
import { WeightIcon, FlameIcon, CheckRingIcon, ClockIcon } from "./Icons";

const ICONS = { weight: WeightIcon, flame: FlameIcon, check: CheckRingIcon, clock: ClockIcon };

function GoalCard({ title, value, unit, badge, ring, icon }) {
  const Icon = ICONS[icon] || WeightIcon;

  return (
    <article className="d2-glass flex h-[184px] w-[202px] shrink-0 flex-col justify-between rounded-[26px] p-4">
      <div>
        <p className="text-[13px] text-[var(--d2-text-2)]">{title}</p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="text-[27px] font-bold leading-none tracking-[-0.02em]">{value}</span>
          {unit && <span className="text-[14px] text-[var(--d2-text-2)]">{unit}</span>}
        </p>
      </div>

      <div className="flex items-end justify-between gap-2">
        {badge ? (
          <span className="d2-glass min-w-0 truncate rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-[var(--d2-text-2)]">
            {badge}
          </span>
        ) : (
          <span />
        )}
        <Ring value={ring}>
          <Icon size={19} />
        </Ring>
      </div>
    </article>
  );
}

/**
 * Carrusel horizontal de objetivos. Va con scroll y no en grilla porque es lo
 * que deja ver el borde de la tarjeta siguiente, que es lo que invita a
 * deslizar.
 */
export default function GoalRail({ cards }) {
  return (
    <section className="mt-7" aria-labelledby="d2-goals">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="d2-goals" className="text-[17px] font-semibold tracking-[-0.01em]">
          Tus objetivos
        </h2>
        <Link href="/progreso" className="text-[13px] text-[var(--d2-text-2)] underline-offset-4 hover:underline">
          Ver todo
        </Link>
      </div>

      <div className="d2-rail -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
        {cards.map((card) => (
          <GoalCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}
