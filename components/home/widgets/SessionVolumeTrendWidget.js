import WidgetCard, { WidgetValue, CHART_LIGHT, CHART_DARK, CHART_ACCENT } from "./WidgetCard";

// Onda de la referencia: un solo trazo repartido en tres tonos, con el naranja
// sobre el pico y un punto al final.
function buildPath(points, max, width) {
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  return points.map((kg, i) => ({ x: i * step, y: 30 - (kg / max) * 22 }));
}

function toD(coords) {
  return coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

export default function SessionVolumeTrendWidget({ trend, className }) {
  const { points, averageKg, hasData } = trend;
  const max = Math.max(...points, 1);
  const coords = buildPath(points, max, 136);
  const peak = coords.reduce((best, p, i) => (p.y < coords[best].y ? i : best), 0);

  // Tres tramos: antes del pico oscuro, el pico naranja, despues claro.
  const from = Math.max(0, peak - 1);
  const to = Math.min(coords.length - 1, peak + 1);

  return (
    <WidgetCard label="Volumen por sesión" href="/historial" className={className}>
      <div>
        <WidgetValue
          value={hasData ? points[points.length - 1].toLocaleString("es-AR") : "—"}
          unit={hasData ? "kg" : null}
          size="md"
        />
      </div>

      <div className="my-1">
        <svg viewBox="0 0 140 36" className="h-11 w-full overflow-visible" aria-hidden="true">
          {hasData && coords.length > 1 && (
            <>
              <path d={toD(coords.slice(0, from + 1))} fill="none" stroke={CHART_DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={toD(coords.slice(from, to + 1))} fill="none" stroke={CHART_ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={toD(coords.slice(to))} fill="none" stroke={CHART_LIGHT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {hasData && (
            <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="2.2" fill={CHART_LIGHT} />
          )}
        </svg>
        <div className="text-center text-[10px] text-[#756C65]">
          {hasData ? `Promedio: ${averageKg.toLocaleString("es-AR")} kg` : "Sin sesiones"}
        </div>
      </div>
    </WidgetCard>
  );
}
