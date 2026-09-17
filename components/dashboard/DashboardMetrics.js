import {
  volumeByMuscleGroup, pushPullBalance, setCompletionRate, volumeByWeekday,
  relativeIntensity, volumePerSession, intensityZones, intensitySequence,
  sessionsInLastDays, sessionSeconds, weeklyCalories,
} from "@/lib/home/metrics";
import { weekVolumeShare } from "@/lib/home/weekly";
import { toLocalDayKey, computeStreak } from "@/lib/sessions/streak";

const number = (value) => value.toLocaleString("es-AR");
const zoneNames = ["Suave", "Moderada", "Alta", "Pico"];

export default function DashboardMetrics({ sessions, exercises, profile, trainedDates, now }) {
  if (!sessions.length) return (
    <section className="d2-glass d2-empty" aria-label="Resumen de entrenamiento">
      <h2>Tu progreso empieza con una sesión</h2>
      <p>Cuando guardes tu primer entrenamiento, vas a ver acá tus métricas.</p>
    </section>
  );
  const recent = sessionsInLastDays(sessions, 7, now);
  const catalog = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const muscles = volumeByMuscleGroup(recent, catalog, { limit: 20 });
  const balance = pushPullBalance(recent, catalog);
  const completion = setCompletionRate(sessions);
  const intensity = relativeIntensity(sessions);
  const trend = volumePerSession(sessions);
  const zones = intensityZones(sessions);
  const sequence = intensitySequence(sessions);
  const weekdays = volumeByWeekday(recent, (date) => (new Date(`${toLocalDayKey(new Date(date))}T12:00:00`).getDay() + 6) % 7);
  const calories = weeklyCalories(recent, { bodyWeightKg: profile?.bodyWeightKg, goal: profile?.weeklyCalorieGoalKcal });
  const streak = computeStreak(trainedDates, now);
  const summary = [
    ["Volumen · esta semana", `${number(weekVolumeShare(sessions, now).kg)} kg`],
    ["Sesiones · últimos 7 días", recent.length],
    ["Racha actual", `${streak} ${streak === 1 ? "día" : "días"}`],
    ["Series completadas", completion.hasData ? `${completion.completed} de ${completion.total} · ${completion.pct}%` : "Sin datos"],
    ["Intensidad · última sesión", intensity.hasData ? `${intensity.pct}% · ${intensity.label}` : "Sin datos"],
    ["Duración · última sesión", `${Math.round(sessionSeconds(sessions[0]) / 60)} min`],
    ["Volumen medio · últimas 8 sesiones", `${number(trend.averageKg)} kg`],
    ["Calorías estimadas · últimos 7 días", `${number(calories.kcal)} / ${number(calories.goal)} kcal`],
  ];
  return (
    <section className="d2-routine-section" aria-label="Resumen de entrenamiento">
      <h2 className="d2-items-heading">Tu entrenamiento en números</h2>
      <p className="d2-items-metric-note">Basado en tus últimas 50 sesiones guardadas. Intensidad relativa a tu mejor 1RM estimado en este período.</p>
      <dl className="d2-routine-list">
        {summary.map(([label, value]) => <div className="d2-items-metric" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      {calories.usesDefaultWeight && <p className="d2-items-metric-note">Calorías estimadas usando 75 kg. Completá tu peso en Perfil para personalizarlas.</p>}
      <details className="d2-routine-list d2-items-details">
        <summary>Distribución y evolución</summary>
        <div className="d2-items-row">
          <h3>Volumen muscular · últimos 7 días</h3>
          {muscles.rows.length ? <dl>{muscles.rows.map((row) => <div className="d2-items-metric" key={row.muscle}><dt>{row.label}</dt><dd>{number(row.kg)} kg</dd></div>)}</dl> : <p className="d2-items-metric-note">Sin volumen muscular registrado en este período.</p>}
          <h3>Balance de empuje y tracción</h3>
          <p className="d2-items-metric-note">{balance.hasData ? `Empuje ${number(balance.pushKg)} kg · Tracción ${number(balance.pullKg)} kg · ${balance.label}` : "Sin datos de empuje o tracción."}</p>
          <h3>Volumen por día · últimos 7 días</h3>
          <dl>{weekdays.map((day) => <div className="d2-items-metric" key={day.label}><dt>{day.label}</dt><dd>{number(day.kg)} kg</dd></div>)}</dl>
          <h3>Volumen por sesión · de anterior a reciente</h3>
          <ol className="d2-items-metric-sequence">{trend.points.map((kg, index) => <li key={index}>{number(kg)} kg</li>)}</ol>
          <h3>Zonas de intensidad</h3>
          {zones.hasData ? <dl>{["light", "med", "high", "peak"].map((zone, index) => <div className="d2-items-metric" key={zone}><dt>{zoneNames[index]}</dt><dd>{zones[zone]} series</dd></div>)}</dl> : <p className="d2-items-metric-note">Sin series con peso para calcular intensidad.</p>}
          <h3>Intensidad por serie · última sesión</h3>
          {sequence.length ? <ol className="d2-items-metric-sequence">{sequence.map((zone, index) => <li key={index}>{zoneNames[zone]}</li>)}</ol> : <p className="d2-items-metric-note">Sin datos.</p>}
        </div>
      </details>
    </section>
  );
}
