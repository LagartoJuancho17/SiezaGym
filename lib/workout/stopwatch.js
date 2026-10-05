/**
 * Cronómetro y temporizador de los ejercicios de tiempo (plancha, isométricos).
 *
 * Mismo criterio que el reloj del entrenamiento: el tiempo se calcula con el
 * reloj de pared y no con un contador que suma de a un tick, porque un
 * setInterval se atrasa y se frena con la pestaña en segundo plano. El estado
 * guarda cuándo arrancó la vuelta en curso y lo acumulado en las anteriores;
 * todo lo demás se deriva.
 *
 * Sin React a propósito: misma entrada, misma salida, se prueba solo.
 */

export const STOPWATCH_IDLE = Object.freeze({
  startedAt: null,
  accumulatedMs: 0,
  laps: [],
});

/** Milisegundos corridos hasta `now`, contando las pausas como tiempo quieto. */
export function stopwatchElapsedMs(state, now) {
  const base = Math.max(0, Number(state?.accumulatedMs) || 0);
  if (state?.startedAt == null) return base;
  return base + Math.max(0, now - state.startedAt);
}

export function isRunning(state) {
  return state?.startedAt != null;
}

/**
 * Las cuatro acciones de la pantalla del reloj del iPhone.
 *
 * - start: arranca o reanuda.
 * - stop: congela lo corrido.
 * - lap: con el reloj andando, anota el total de ese momento.
 * - reset: con el reloj quieto, vuelve a cero y borra las vueltas.
 *
 * Las acciones que no aplican al estado actual devuelven el mismo estado, así
 * un doble toque no rompe nada.
 */
export function stopwatchReducer(state, action) {
  const current = state || STOPWATCH_IDLE;
  const now = action?.now;

  switch (action?.type) {
    case "start":
      if (isRunning(current)) return current;
      return { ...current, startedAt: now };
    case "stop":
      if (!isRunning(current)) return current;
      return { ...current, startedAt: null, accumulatedMs: stopwatchElapsedMs(current, now) };
    case "lap":
      if (!isRunning(current)) return current;
      return { ...current, laps: [...current.laps, stopwatchElapsedMs(current, now)] };
    case "reset":
      if (isRunning(current)) return current;
      return STOPWATCH_IDLE;
    default:
      return current;
  }
}

/**
 * Las vueltas como las muestra el iPhone: la más nueva arriba, con la
 * duración de esa vuelta (no el total), y marcadas la más rápida y la más
 * lenta cuando hay al menos dos.
 */
export function lapRows(laps) {
  const totals = Array.isArray(laps) ? laps : [];
  const rows = totals.map((total, index) => ({
    number: index + 1,
    splitMs: total - (index > 0 ? totals[index - 1] : 0),
    totalMs: total,
    fastest: false,
    slowest: false,
  }));

  if (rows.length >= 2) {
    const splits = rows.map((row) => row.splitMs);
    const min = Math.min(...splits);
    const max = Math.max(...splits);
    if (min !== max) {
      rows[splits.indexOf(min)].fastest = true;
      rows[splits.indexOf(max)].slowest = true;
    }
  }

  return rows.reverse();
}

/**
 * "00:45,27": minutos, segundos y centésimas, con coma decimal como el reloj
 * del iPhone en español. Pasada la hora suma las horas adelante.
 */
export function formatStopwatch(ms) {
  const safe = Math.max(0, Math.floor(Number(ms) || 0));
  const centis = Math.floor((safe % 1000) / 10);
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  const clock = `${pad(minutes)}:${pad(seconds)},${pad(centis)}`;
  return hours > 0 ? `${hours}:${clock}` : clock;
}

/**
 * Lo que queda del temporizador, sin bajar de cero.
 *
 * La cuenta regresiva usa el mismo estado que el cronómetro: lo que cambia es
 * cómo se lee, así pasar de un modo al otro no pierde lo corrido.
 */
export function countdownRemainingMs(targetSeconds, elapsedMs) {
  const target = Math.max(0, Number(targetSeconds) || 0) * 1000;
  return Math.max(0, target - Math.max(0, Number(elapsedMs) || 0));
}

/** 0 a 1, para el anillo de progreso contra lo prescrito. */
export function progressToward(targetSeconds, elapsedMs) {
  const target = Math.max(0, Number(targetSeconds) || 0) * 1000;
  if (target === 0) return 0;
  return Math.min(1, Math.max(0, Number(elapsedMs) || 0) / target);
}

/**
 * Los segundos que se cargan en la planilla.
 *
 * Se redondea al segundo más cercano: la planilla guarda segundos enteros y
 * 44,6 s de plancha son 45, no 44. Nunca menos de 1, porque una serie de cero
 * segundos no se guarda (sessionExercises descarta las reps en cero).
 */
export function secondsForLog(ms) {
  return Math.max(1, Math.round(Math.max(0, Number(ms) || 0) / 1000));
}

/**
 * Si entre dos lecturas se cruzó el objetivo: es el momento de sonar.
 *
 * Se compara el antes con el después y no "¿ya pasó?", para que suene una
 * sola vez aunque el reloj siga andando y la pantalla se redibuje.
 */
export function crossedTarget(targetSeconds, previousMs, currentMs) {
  const target = Math.max(0, Number(targetSeconds) || 0) * 1000;
  if (target === 0) return false;
  return previousMs < target && currentMs >= target;
}

/**
 * Qué se carga en la planilla según el modo.
 *
 * - Cronómetro: lo que corrió, redondeado al segundo.
 * - Temporizador: lo prescrito si se llegó a cero (sostener 45 s y parar un
 *   segundo tarde es "45 s", no "46 s"); si se paró antes, lo que se aguantó.
 */
export function loggedSeconds(mode, targetSeconds, elapsedMs) {
  const target = Math.max(0, Math.floor(Number(targetSeconds) || 0));
  if (mode === "timer" && target > 0 && elapsedMs >= target * 1000) return target;
  return secondsForLog(elapsedMs);
}
