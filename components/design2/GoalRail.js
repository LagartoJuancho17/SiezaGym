import Link from "next/link";
import Ring from "./Ring";
import { WeightIcon, FlameIcon, CheckRingIcon, ClockIcon } from "./Icons";

const ICONS = { weight: WeightIcon, flame: FlameIcon, check: CheckRingIcon, clock: ClockIcon };

function GoalCard({ title, value, unit, badge, ring, icon }) {
  const Icon = ICONS[icon] || WeightIcon;

  return (
    <article className="d2-glass d2-goal-card">
      <div>
        <p className="d2-goal-title" title={title}>{title}</p>
        <p className="d2-goal-value">
          <span>{value}</span>
          {unit && <span>{unit}</span>}
        </p>
      </div>

      <div className="d2-goal-footer">
        {badge ? (
          <span className="d2-goal-badge" title={badge}>
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
    <section className="d2-goals" aria-labelledby="d2-goals">
      <div className="d2-section-heading">
        <h2 id="d2-goals">
          Tus objetivos
        </h2>
        <Link href="/progreso">
          Ver todo
        </Link>
      </div>

      <div className="d2-rail d2-goal-rail" tabIndex={0} role="region" aria-label="Objetivos semanales; deslizá para ver más">
        {cards.map((card) => (
          <GoalCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}
