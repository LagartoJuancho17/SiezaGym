import { formatKg, weekBars } from "@/lib/progress/summary";

/**
 * Volumen de las últimas semanas, una barra por semana.
 *
 * Las alturas se comparan entre sí y no contra un objetivo: nadie fijó uno, y
 * dibujar una meta inventada haría que una buena semana parezca poca.
 *
 * Sin librería de gráficos: son doce divs. La que usaba la pantalla anterior
 * pesa más que toda esta pantalla junta y no responde a los temas.
 */
export default function WeekVolume({ points }) {
  const bars = weekBars(points);
  if (bars.length === 0) return null;

  const total = bars.reduce((sum, bar) => sum + bar.kg, 0);
  const best = bars.reduce((top, bar) => Math.max(top, bar.kg), 0);

  return (
    <div className="d2-panel d2-chart">
      <div className="d2-bars" role="img" aria-label={`Volumen de las últimas ${bars.length} semanas`}>
        {bars.map((bar) => (
          <span
            key={bar.key}
            className={bar.empty ? "d2-bar d2-bar-empty" : "d2-bar"}
            title={`Semana del ${bar.key}: ${formatKg(bar.kg)}`}
          >
            <span style={{ height: `${bar.heightPct}%` }} />
          </span>
        ))}
      </div>

      <p className="d2-chart-foot">
        <span>hace {bars.length} semanas</span>
        <span>{total > 0 ? `mejor semana ${formatKg(best)}` : "sin volumen todavía"}</span>
        <span>esta semana</span>
      </p>
    </div>
  );
}
