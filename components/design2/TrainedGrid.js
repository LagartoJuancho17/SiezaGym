import { heatmapWeeks } from "@/lib/progress/heatmap";

/**
 * Días entrenados de los últimos meses: una columna por semana.
 *
 * Los días que todavía no pasaron van apagados y no como días sin entrenar,
 * igual que en la semana de la portada.
 */
export default function TrainedGrid({ trainedDates, weeks = 26, todayKey }) {
  const { columns, monthTicks, total } = heatmapWeeks(trainedDates, { weeks, todayKey });

  return (
    <div className="d2-panel d2-chart">
      <div className="d2-gridwrap">
        <p className="d2-grid-months" style={{ "--d2-weeks": columns.length }} aria-hidden>
          {monthTicks.map((tick) => (
            <span key={tick.label} style={{ gridColumn: tick.week + 1 }}>
              {tick.label}
            </span>
          ))}
        </p>

        <div
          className="d2-grid"
          style={{ "--d2-weeks": columns.length }}
          role="img"
          aria-label={`${total} ${total === 1 ? "día entrenado" : "días entrenados"} en las últimas ${columns.length} semanas`}
        >
          {columns.map((column) =>
            column.days.map((day) => (
              <span
                key={day.key}
                className={[
                  "d2-cell",
                  day.trained ? "d2-cell-on" : "",
                  day.isFuture ? "d2-cell-future" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            )),
          )}
        </div>
      </div>

      <p className="d2-chart-foot">
        <span>
          {total} {total === 1 ? "día entrenado" : "días entrenados"}
        </span>
        <span>últimas {columns.length} semanas</span>
      </p>
    </div>
  );
}
