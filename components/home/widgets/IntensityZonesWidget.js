import WidgetCard, { WidgetValue, CHART_LIGHT, CHART_DARK, CHART_ACCENT } from "./WidgetCard";

// Grafico escalonado de la referencia: cuatro niveles con etiqueta a la
// izquierda, tramos horizontales por serie y conectores verticales punteados.
const LEVELS = ["Peak", "High", "Med", "Light"];
const ROW_Y = [10, 34, 58, 82];
// light, med, high, peak
const COLORS = [CHART_LIGHT, CHART_DARK, CHART_DARK, CHART_ACCENT];

export default function IntensityZonesWidget({ zones, sequence, durationText, className }) {
  const steps = sequence.length > 0 ? sequence : [];
  const slot = steps.length > 0 ? 150 / steps.length : 0;

  return (
    <WidgetCard label="Zonas de intensidad" href="/progreso" className={className}>
      <div>
        <WidgetValue
          value={zones.hasData ? zones.total : "—"}
          unit={zones.hasData ? "series" : null}
          status={durationText}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex flex-col justify-between py-[2px] text-[10px] text-[#8C827A]">
          {LEVELS.map((level) => (
            <span key={level}>{level}</span>
          ))}
        </div>

        <svg viewBox="0 0 150 92" className="h-24 flex-1" preserveAspectRatio="none" aria-hidden="true">
          {steps.map((zone, i) => {
            // zone 0..3 (light..peak) se dibuja de abajo hacia arriba.
            const y = ROW_Y[3 - zone];
            const x = i * slot;
            const prev = i > 0 ? ROW_Y[3 - steps[i - 1]] : null;
            return (
              <g key={i}>
                {prev !== null && prev !== y && (
                  <line
                    x1={x}
                    y1={prev}
                    x2={x}
                    y2={y}
                    stroke={CHART_LIGHT}
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                )}
                <line
                  x1={x}
                  y1={y}
                  x2={x + slot * 0.82}
                  y2={y}
                  stroke={COLORS[zone]}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </g>
            );
          })}
          {steps.length === 0 &&
            ROW_Y.map((y) => (
              <line key={y} x1="0" y1={y} x2="150" y2={y} stroke={CHART_LIGHT} strokeWidth="0.8" strokeDasharray="2,3" />
            ))}
        </svg>
      </div>
    </WidgetCard>
  );
}
