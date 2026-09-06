import WidgetCard, { WidgetValue, CHART_LIGHT, CHART_DARK, CHART_ACCENT } from "./WidgetCard";

// Nube de puntos de la referencia: por cada dia una columna de puntitos, en
// tres tonos segun la altura. No es una linea conectada.
const DOTS_PER_DAY = 5;

export default function WeekdayVolumeWidget({ days, className }) {
  const max = Math.max(...days.map((d) => d.kg), 1);
  const best = days.reduce((a, b) => (b.kg > a.kg ? b : a), days[0]);

  return (
    <WidgetCard label="Volumen por día" href="/historial" className={className}>
      <div>
        <WidgetValue
          value={best.kg > 0 ? best.label : "—"}
          status={best.kg > 0 ? `${best.kg.toLocaleString("es-AR")} kg` : "Sin datos"}
          size="md"
        />
      </div>

      <div className="mt-2 w-full">
        <svg viewBox="0 0 150 40" className="h-12 w-full" aria-hidden="true">
          {days.map((day, i) => {
            const filled = Math.round((day.kg / max) * DOTS_PER_DAY);
            const x = 8 + i * 22.5;
            return Array.from({ length: DOTS_PER_DAY }, (_, level) => {
              const y = 34 - level * 6.5;
              const on = level < filled;
              const top = on && level === filled - 1;
              return (
                <circle
                  key={`${i}-${level}`}
                  cx={x}
                  cy={y}
                  r={on ? 1.9 : 1.4}
                  fill={top ? CHART_ACCENT : on ? CHART_DARK : CHART_LIGHT}
                />
              );
            });
          })}
        </svg>
        <div className="flex justify-between px-1 text-[10px] text-[#8C827A]">
          {days.map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
