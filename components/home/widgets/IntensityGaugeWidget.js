import WidgetCard, { WidgetValue, CHART_LIGHT, CHART_DARK, CHART_ACCENT } from "./WidgetCard";

// Arco de la referencia: el trazo se reparte en tres tonos a lo largo y un
// punto marca el valor. No es un relleno naranja.
const ARC = "M 8 48 A 42 42 0 0 1 92 48";
const ARC_LENGTH = 132;

function pointOnArc(pct) {
  const angle = Math.PI * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return { x: 50 + 42 * Math.cos(angle), y: 48 - 42 * Math.sin(angle) };
}

export default function IntensityGaugeWidget({ intensity, className }) {
  const marker = pointOnArc(intensity.pct);

  return (
    <WidgetCard label="Intensidad relativa" href="/progreso" className={className}>
      <div>
        <WidgetValue
          value={intensity.hasData ? intensity.pct : "—"}
          unit={intensity.hasData ? "%" : null}
          size="md"
        />
      </div>

      <div className="my-2 flex flex-col items-center">
        <svg viewBox="0 0 100 56" className="h-14 w-full" aria-hidden="true">
          <path d={ARC} fill="none" stroke={CHART_LIGHT} strokeWidth="2.4" strokeLinecap="round" />
          <path
            d={ARC}
            fill="none"
            stroke={CHART_DARK}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LENGTH * 0.28} ${ARC_LENGTH}`}
            strokeDashoffset={-ARC_LENGTH * 0.5}
          />
          <path
            d={ARC}
            fill="none"
            stroke={CHART_ACCENT}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LENGTH * 0.2} ${ARC_LENGTH}`}
            strokeDashoffset={-ARC_LENGTH * 0.8}
          />
          {intensity.hasData && (
            <circle cx={marker.x} cy={marker.y} r="2.6" fill={CHART_LIGHT} stroke="#9C948B" strokeWidth="0.8" />
          )}
        </svg>
        <span className="text-xs font-semibold text-[#756C65]">
          {intensity.hasData ? intensity.label : "Sin datos"}
        </span>
      </div>
    </WidgetCard>
  );
}
