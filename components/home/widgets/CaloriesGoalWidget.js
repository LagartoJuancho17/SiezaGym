import WidgetCard, { WidgetValue, WidgetMeter, WidgetScale } from "./WidgetCard";

// Objetivo de calorias de la semana. Es una ESTIMACION: no hay sensor, se
// calcula con MET x peso corporal x duracion.
export default function CaloriesGoalWidget({ calories, className }) {
  return (
    <WidgetCard label="Calorías · objetivo semanal" href="/perfil" className={className}>
      <div>
        <WidgetValue
          value={calories.kcal.toLocaleString("es-AR")}
          unit="kcal"
        />
        <p className="mt-0.5 text-[11px] text-[#8C827A]">
          Meta {calories.goal.toLocaleString("es-AR")} kcal
          {calories.usesDefaultWeight ? " · estimado sin tu peso" : " · estimado"}
        </p>
      </div>

      <div className="mt-3">
        <WidgetMeter pct={calories.pct} marker={calories.label} />
        <WidgetScale ticks={["0", `${Math.round(calories.goal / 2).toLocaleString("es-AR")}`, calories.goal.toLocaleString("es-AR")]} />
      </div>
    </WidgetCard>
  );
}
