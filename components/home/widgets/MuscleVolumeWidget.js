import WidgetCard, { WidgetValue } from "./WidgetCard";

// Card grande de la referencia: numero, tabla de reparto y barras abajo.
export default function MuscleVolumeWidget({ rows, totalKg, sessionBars, className }) {
  return (
    <WidgetCard label="Volumen por músculo" href="/progreso" className={className}>
      <div>
        <WidgetValue value={totalKg.toLocaleString("es-AR")} unit="KG" />

        <div className="mt-4 space-y-2 text-xs">
          {rows.length === 0 ? (
            <p className="text-[#8C827A]">Todavía no hay series registradas.</p>
          ) : (
            rows.map((row, i) => (
              <div key={row.muscle} className="flex items-center justify-between gap-2 text-[#38332E]">
                <span className="flex min-w-0 items-center gap-1.5 font-medium">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: ["#FF5733", "#B8503A", "#8C827A"][i] || "#8C827A" }}
                  />
                  <span className="truncate">{row.label}</span>
                </span>
                <span className="shrink-0 font-mono text-[#575049]">{row.kg} KG</span>
                <span className="w-9 shrink-0 text-right font-bold text-[#141414]">
                  {Math.round(row.pct * 100)}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-[#D9D3CA] pt-3.5">
        <div className="text-[11px] font-medium text-[#756C65]">
          Volumen por sesión · últimas {sessionBars.length}
        </div>
        <div className="mt-2.5 flex h-14 items-end gap-[5px]">
          {sessionBars.length === 0 ? (
            <div className="h-px w-full self-end bg-[#D9D3CA]" />
          ) : (
            sessionBars.map((pct, i) => (
              // Varilla fina gris con la punta naranja, como la referencia.
              // Ancho fijo: con una sola sesion una barra al 100% tapaba la card.
              <div
                key={i}
                className="flex w-[3px] shrink-0 flex-col justify-start"
                style={{ height: `${Math.max(10, pct * 100)}%` }}
              >
                <span className="h-[6px] w-full rounded-full bg-[#FF5733]" />
                <span className="w-full flex-1 rounded-full bg-[#B9B2A8]" />
              </div>
            ))
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
