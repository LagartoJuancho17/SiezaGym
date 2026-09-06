// Metricas de la Home. Todo funcion pura: entra sesiones + catalogo, sale el
// numero. Sin Firestore, sin React, para poder testearlo.
import { MUSCLE_GROUP_LABELS } from "@/lib/exercises/constants";
import { estimatedOneRepMax } from "@/lib/epley";

// Misma asuncion que estimatedDurationMinutes en lib/routines/summary.js, para
// que la app no tenga dos ideas distintas de cuanto dura una serie.
export const SECONDS_PER_SET = 115;

// Compendium of Physical Activities, codigo 02050: entrenamiento de fuerza con
// esfuerzo vigoroso. Es un MET promedio, por eso las calorias son estimadas.
export const RESISTANCE_MET = 5.0;

// Cuando el usuario no cargo su peso en el perfil. Se marca como estimado.
export const DEFAULT_BODY_WEIGHT_KG = 75;

export const DEFAULT_WEEKLY_CALORIE_GOAL = 2000;

const DAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

const PUSH_PATTERNS = new Set(["empuje_horizontal", "empuje_vertical"]);
const PULL_PATTERNS = new Set(["traccion_horizontal", "traccion_vertical"]);

function setVolume(set) {
  if (set?.failed) return 0;
  return (Number(set.weight) || 0) * (Number(set.reps) || 0);
}

function exerciseVolume(exercise) {
  return (exercise.sets || []).reduce((total, set) => total + setVolume(set), 0);
}

function eachSet(sessions, callback) {
  for (const session of sessions || []) {
    for (const exercise of session.exercises || []) {
      for (const set of exercise.sets || []) {
        callback(set, exercise, session);
      }
    }
  }
}

/**
 * Volumen repartido por grupo muscular usando muscleWeights del catalogo.
 * Un press de banca con {pecho: 0.6, triceps: 0.4} suma 60% de su volumen a
 * pecho y 40% a triceps.
 */
export function volumeByMuscleGroup(sessions, exerciseById, { limit = 3 } = {}) {
  const raw = {};
  let total = 0;

  for (const session of sessions || []) {
    for (const exercise of session.exercises || []) {
      const weights = exerciseById?.get?.(exercise.exerciseId)?.muscleWeights || {};
      const volume = exerciseVolume(exercise);
      if (volume <= 0) continue;
      for (const [muscle, share] of Object.entries(weights)) {
        const part = volume * share;
        raw[muscle] = (raw[muscle] || 0) + part;
        total += part;
      }
    }
  }

  const rows = Object.entries(raw)
    .map(([muscle, kg]) => ({
      muscle,
      label: MUSCLE_GROUP_LABELS[muscle] || muscle,
      kg: Math.round(kg),
      pct: total > 0 ? kg / total : 0,
    }))
    .sort((a, b) => b.kg - a.kg);

  return { rows: rows.slice(0, limit), totalKg: Math.round(total) };
}

/**
 * Empuje contra traccion, usando el campo pattern del catalogo.
 * pct 50 = equilibrado, 100 = todo empuje, 0 = todo traccion.
 * Los patrones que no son ni empuje ni traccion (core, aislamiento) no entran.
 */
export function pushPullBalance(sessions, exerciseById) {
  let push = 0;
  let pull = 0;

  for (const session of sessions || []) {
    for (const exercise of session.exercises || []) {
      const pattern = exerciseById?.get?.(exercise.exerciseId)?.pattern;
      const volume = exerciseVolume(exercise);
      if (volume <= 0) continue;
      if (PUSH_PATTERNS.has(pattern)) push += volume;
      else if (PULL_PATTERNS.has(pattern)) pull += volume;
    }
  }

  const total = push + pull;
  if (total === 0) {
    return { pushKg: 0, pullKg: 0, pct: 50, label: "Sin datos", hasData: false };
  }

  const pct = (push / total) * 100;
  let label = "Equilibrado";
  if (pct >= 65) label = "Falta espalda";
  else if (pct <= 35) label = "Falta pecho";

  return {
    pushKg: Math.round(push),
    pullKg: Math.round(pull),
    pct: Math.round(pct),
    label,
    hasData: true,
  };
}

/** Porcentaje de series completadas sin fallar. */
export function setCompletionRate(sessions) {
  let done = 0;
  let total = 0;
  eachSet(sessions, (set) => {
    total += 1;
    if (!set.failed) done += 1;
  });

  if (total === 0) {
    return { pct: 0, completed: 0, total: 0, label: "Sin datos", hasData: false };
  }

  const pct = Math.round((done / total) * 100);
  let label = "Excelente";
  if (pct < 90) label = "Regular";
  else if (pct < 97) label = "Bien";

  return { pct, completed: done, total, label, hasData: true };
}

/** Volumen acumulado por dia de la semana, de lunes a domingo. */
export function volumeByWeekday(sessions, toDayIndex) {
  const totals = new Array(7).fill(0);

  for (const session of sessions || []) {
    if (!session.finishedAt) continue;
    const index = toDayIndex(session.finishedAt);
    if (index == null || index < 0 || index > 6) continue;
    totals[index] += Number(session.totalVolumeKg) || 0;
  }

  const max = Math.max(...totals);
  return totals.map((kg, i) => ({
    label: DAY_LABELS[i],
    kg: Math.round(kg),
    pct: max > 0 ? kg / max : 0,
  }));
}

/**
 * Sesiones de los ultimos N dias. Vive aca y no en el componente porque leer el
 * reloj durante el render es impuro (React 19 lo rechaza) y ademas asi se testea.
 */
export function sessionsInLastDays(sessions, days = 7, now = new Date()) {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return (sessions || []).filter((session) => {
    if (!session.finishedAt) return false;
    return new Date(session.finishedAt).getTime() >= cutoff;
  });
}

/** Mejor 1RM estimado historico por ejercicio. Es la referencia de intensidad. */
export function bestOneRepMaxByExercise(sessions) {
  const best = new Map();
  eachSet(sessions, (set, exercise) => {
    if (set.failed) return;
    const value = estimatedOneRepMax(set.weight, set.reps);
    if (value <= 0) return;
    const current = best.get(exercise.exerciseId) || 0;
    if (value > current) best.set(exercise.exerciseId, value);
  });
  return best;
}

/**
 * Que tan fuerte le pegaste en la ultima sesion: peso promedio de las series
 * contra tu mejor marca historica en esos mismos ejercicios.
 */
export function relativeIntensity(sessions) {
  const all = sessions || [];
  if (all.length === 0) {
    return { pct: 0, label: "Sin datos", hasData: false };
  }

  const reference = bestOneRepMaxByExercise(all);
  const [last] = all;
  let sum = 0;
  let count = 0;

  for (const exercise of last.exercises || []) {
    const max = reference.get(exercise.exerciseId);
    if (!max) continue;
    for (const set of exercise.sets || []) {
      if (set.failed) continue;
      const weight = Number(set.weight) || 0;
      if (weight <= 0) continue;
      sum += (weight / max) * 100;
      count += 1;
    }
  }

  if (count === 0) {
    return { pct: 0, label: "Sin datos", hasData: false };
  }

  const pct = Math.round(sum / count);
  let label = "Suave";
  if (pct >= 85) label = "Muy alta";
  else if (pct >= 70) label = "Alta";
  else if (pct >= 55) label = "Moderada";

  return { pct, label, hasData: true };
}

/** Volumen de cada sesion, de la mas vieja a la mas nueva, con su promedio. */
export function volumePerSession(sessions, { limit = 8 } = {}) {
  const points = (sessions || [])
    .slice(0, limit)
    .map((session) => Math.round(Number(session.totalVolumeKg) || 0))
    .reverse();

  if (points.length === 0) {
    return { points: [], averageKg: 0, hasData: false };
  }

  const average = points.reduce((a, b) => a + b, 0) / points.length;
  return { points, averageKg: Math.round(average), hasData: true };
}

/**
 * Series repartidas por zona de intensidad, como porcentaje del mejor 1RM
 * estimado de ese mismo ejercicio.
 */
export function intensityZones(sessions) {
  const reference = bestOneRepMaxByExercise(sessions);
  const zones = { peak: 0, high: 0, med: 0, light: 0 };
  let total = 0;

  eachSet(sessions, (set, exercise) => {
    if (set.failed) return;
    const max = reference.get(exercise.exerciseId);
    const weight = Number(set.weight) || 0;
    if (!max || weight <= 0) return;
    const pct = (weight / max) * 100;
    total += 1;
    if (pct >= 90) zones.peak += 1;
    else if (pct >= 80) zones.high += 1;
    else if (pct >= 65) zones.med += 1;
    else zones.light += 1;
  });

  return {
    ...zones,
    total,
    hasData: total > 0,
    shares: {
      peak: total ? zones.peak / total : 0,
      high: total ? zones.high / total : 0,
      med: total ? zones.med / total : 0,
      light: total ? zones.light / total : 0,
    },
  };
}

export const ZONE_LEVELS = ["light", "med", "high", "peak"];

/**
 * Secuencia de zonas serie por serie de la ultima sesion, para dibujar el
 * grafico escalonado. Devuelve indices 0..3 (light, med, high, peak).
 */
export function intensitySequence(sessions, { limit = 14 } = {}) {
  const all = sessions || [];
  if (all.length === 0) return [];

  const reference = bestOneRepMaxByExercise(all);
  const steps = [];

  for (const exercise of all[0].exercises || []) {
    const max = reference.get(exercise.exerciseId);
    for (const set of exercise.sets || []) {
      if (set.failed) continue;
      const weight = Number(set.weight) || 0;
      if (!max || weight <= 0) continue;
      const pct = (weight / max) * 100;
      if (pct >= 90) steps.push(3);
      else if (pct >= 80) steps.push(2);
      else if (pct >= 65) steps.push(1);
      else steps.push(0);
    }
  }

  return steps.slice(0, limit);
}

/**
 * Duracion util de una sesion en segundos.
 * durationSeconds se guarda mal en muchas sesiones (hay sesiones de 6 series
 * con 25 segundos), asi que si el valor es fisicamente imposible se estima a
 * partir de las series con la misma asuncion que usa el resto de la app.
 */
export function sessionSeconds(session) {
  const sets = Number(session?.totalSetsCompleted) || 0;
  const stored = Number(session?.durationSeconds) || 0;
  const floor = sets * 30;
  if (stored >= floor && stored > 0) return stored;
  return sets * SECONDS_PER_SET;
}

/**
 * Calorias estimadas: MET x peso corporal x horas.
 * Es una estimacion, no una medicion: no hay sensor. Se marca como tal cuando
 * falta el peso del perfil o cuando la duracion tuvo que estimarse.
 */
export function caloriesForSession(session, { bodyWeightKg } = {}) {
  const weight = Number(bodyWeightKg) > 0 ? Number(bodyWeightKg) : DEFAULT_BODY_WEIGHT_KG;
  const hours = sessionSeconds(session) / 3600;
  return Math.round(RESISTANCE_MET * weight * hours);
}

export function weeklyCalories(sessions, { bodyWeightKg, goal } = {}) {
  const target = Number(goal) > 0 ? Number(goal) : DEFAULT_WEEKLY_CALORIE_GOAL;
  const kcal = (sessions || []).reduce(
    (total, session) => total + caloriesForSession(session, { bodyWeightKg }),
    0,
  );

  const pct = target > 0 ? Math.min(100, Math.round((kcal / target) * 100)) : 0;
  let label = "Vas lento";
  if (pct >= 100) label = "Objetivo cumplido";
  else if (pct >= 70) label = "Casi";
  else if (pct >= 35) label = "En camino";

  return {
    kcal,
    goal: target,
    pct,
    label,
    usesDefaultWeight: !(Number(bodyWeightKg) > 0),
    hasData: kcal > 0,
  };
}
