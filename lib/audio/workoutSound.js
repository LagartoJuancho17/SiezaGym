/**
 * Utilidades de feedback sonoro y háptico para el modo entrenamiento.
 *
 * Utiliza Web Audio API nativo:
 * - Cero assets pesados que descargar.
 * - Latencia cero.
 * - Funciona 100% offline.
 * - Respeta el modo silencioso del dispositivo cuando corresponde.
 */

let audioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContextClass();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch {
    return null;
  }
}

/** Sonido agradable y suave de campana ascendente al terminar una serie (D5 -> A5) */
export function playSetCompleteSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    // D5 (587.33 Hz) a A5 (880 Hz)
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch {
    // Silencioso en caso de error de permisos de audio
  }
}

/** Sonido de fin de descanso (doble chime suave) */
export function playRestCompleteSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Primer chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.start(now);
    osc1.stop(now + 0.26);

    // Segundo chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.frequency.setValueAtTime(783.99, now + 0.16); // G5
    gain2.gain.setValueAtTime(0.001, now + 0.16);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc2.start(now + 0.16);
    osc2.stop(now + 0.56);
  } catch {
    // Silencioso en caso de error
  }
}

/**
 * Ejercicio completo: arpegio mayor ascendente (C5 → E5 → G5 → C6).
 *
 * Tiene que sonar distinto al de cada serie, que es un solo glissando: el que
 * entrena lo oye sin mirar el teléfono y sabe que ya pasa al siguiente
 * ejercicio. Cuatro notas cortas y un poco más fuertes que las de serie.
 */
export const EXERCISE_COMPLETE_NOTES = [523.25, 659.25, 783.99, 1046.5];

export function playExerciseCompleteSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    EXERCISE_COMPLETE_NOTES.forEach((frequency, index) => {
      const start = now + index * 0.11;
      const last = index === EXERCISE_COMPLETE_NOTES.length - 1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(last ? 0.26 : 0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + (last ? 0.7 : 0.22));
      osc.start(start);
      osc.stop(start + (last ? 0.72 : 0.24));
    });
  } catch {
    // Silencioso en caso de error
  }
}

/** Patrón de vibración del ejercicio completo: más largo que el de una serie. */
export const EXERCISE_COMPLETE_HAPTIC = [60, 40, 60, 40, 140];

/**
 * El feedback de marcar una serie: si con ella se termina el ejercicio suena
 * el arpegio, si no, el de serie. Un solo lugar decide, así el botón de la
 * planilla y el de la pantalla bloqueada suenan igual.
 */
export function playSetFeedback({ completesExercise = false } = {}) {
  if (completesExercise) {
    playExerciseCompleteSound();
    triggerHaptic(EXERCISE_COMPLETE_HAPTIC);
  } else {
    playSetCompleteSound();
    triggerHaptic();
  }
}

/** Vibración háptica en dispositivos móviles compatibles */
export function triggerHaptic(pattern = [40, 50, 40]) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Sin soporte o permiso bloqueado
    }
  }
}
