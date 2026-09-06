import WidgetCard, { WidgetValue, WidgetScale, WidgetMeter } from "./WidgetCard";

// Escala apretada 0/90/95/100, igual que la de saturacion de la referencia:
// la tasa de series completadas vive naturalmente en ese rango.
export default function CompletionWidget({ completion, className }) {
  return (
    <WidgetCard label="Series completadas" href="/historial" className={className}>
      <div>
        <WidgetValue
          value={completion.hasData ? completion.pct : "—"}
          unit={completion.hasData ? "%" : null}
          status={completion.hasData ? null : "Sin datos"}
          size="md"
        />
        {completion.hasData && (
          <p className="mt-0.5 text-[11px] text-[#8C827A]">
            {completion.completed} de {completion.total} series
          </p>
        )}
      </div>

      <div className="mt-3">
        <WidgetMeter pct={completion.pct} marker={completion.hasData ? completion.label : null} />
        <WidgetScale ticks={["0", "90", "95", "100"]} compact />
      </div>
    </WidgetCard>
  );
}
