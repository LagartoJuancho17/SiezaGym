import WidgetCard, { WidgetValue, WidgetScale, WidgetMeter } from "./WidgetCard";

// Barra 0/50/100: 50 es equilibrio perfecto entre empuje y traccion.
export default function PushPullWidget({ balance, className }) {
  return (
    <WidgetCard label="Empuje / Tracción" href="/progreso" className={className}>
      <div>
        <WidgetValue
          value={balance.hasData ? balance.pct : "—"}
          unit={balance.hasData ? "%" : null}
          status={balance.hasData ? null : "Sin datos"}
          size="md"
        />
      </div>

      <div className="mt-3">
        {/* Sin datos la barra queda en gris: no insinuar un 50% que no existe. */}
        <WidgetMeter pct={balance.hasData ? balance.pct : 0} marker={balance.hasData ? balance.label : null} />
        <WidgetScale ticks={["Tracción", "50", "Empuje"]} compact />
      </div>
    </WidgetCard>
  );
}
