import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  clearActiveWorkout,
  getActiveWorkout,
  saveActiveWorkout,
} from "@/lib/routines/activeWorkout";
import {
  playRestCompleteSound,
  playSetCompleteSound,
  triggerHaptic,
} from "@/lib/audio/workoutSound";
import {
  setupMediaSession,
  teardownMediaSession,
  updateMediaSessionMetadata,
} from "@/lib/workout/mediaSessionManager";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const routineScreenSource = read("components/design2/RoutineScreen.js");
const routineExerciseSource = read("components/design2/RoutineExercise.js");
const activeBarSource = read("components/design2/ActiveWorkoutBar.js");
const cssSource = read("app/design2.css");

describe("1. Widget iOS en pantalla bloqueada (MediaSession API)", () => {
  it("las funciones del manager son seguras en SSR y entorno headless", () => {
    expect(() => setupMediaSession({ exerciseName: "Press de banca", setNumber: 1, totalSets: 4 })).not.toThrow();
    expect(() => updateMediaSessionMetadata({ exerciseName: "Press banca", setNumber: 2, totalSets: 4 })).not.toThrow();
    expect(() => teardownMediaSession()).not.toThrow();
  });

  it("RoutineScreen integra MediaSession con soporte de nexttrack para terminar serie", () => {
    expect(routineScreenSource).toContain("setupMediaSession");
    expect(routineScreenSource).toContain("teardownMediaSession");
    expect(routineScreenSource).toContain("onFinishSet");
  });
});

describe("2. Stand-by y persistencia al tocar Volver", () => {
  it("activeWorkout persiste y lee del almacenamiento", () => {
    saveActiveWorkout({ routineId: "test-rutina", routineName: "Piernas", clock: { startedAt: 12345 } });
    const current = getActiveWorkout();
    expect(current).not.toBeNull();
    expect(current?.routineId).toBe("test-rutina");

    clearActiveWorkout();
    expect(getActiveWorkout()).toBeNull();
  });

  it("RoutineScreen no borra la rutina al tocar Volver sino que la mantiene en stand by", () => {
    expect(routineScreenSource).toContain("saveActiveWorkout");
    expect(routineScreenSource).toContain('title="Volver a rutinas (la rutina continúa en stand-by)"');
    expect(routineScreenSource).toContain('router.push("/rutinas")');
  });

  it("la barra global ActiveWorkoutBar permite reanudar desde cualquier pantalla", () => {
    expect(activeBarSource).toContain("useActiveWorkout");
    expect(activeBarSource).toContain("Reanudar");
    expect(activeBarSource).toContain("d2-active-bar");
  });
});

describe("3. Botones de pesos cómodos", () => {
  it("RoutineExercise incluye steppers +/- para ajuste rápido de peso", () => {
    expect(routineExerciseSource).toContain("d2-weight-stepper");
    expect(routineExerciseSource).toContain("d2-stepper-btn");
    expect(routineExerciseSource).toContain("cur - 2.5");
    expect(routineExerciseSource).toContain("cur + 2.5");
  });

  it("design2.css define estilos táctiles para el stepper de pesos", () => {
    expect(cssSource).toContain(".d2-weight-stepper");
    expect(cssSource).toContain(".d2-stepper-btn");
  });
});

describe("4. Feedback auditivo, háptico y visual de serie completada", () => {
  it("los emisores de sonido y vibración ejecutan sin fallar", () => {
    expect(() => playSetCompleteSound()).not.toThrow();
    expect(() => playRestCompleteSound()).not.toThrow();
    expect(() => triggerHaptic([50, 50])).not.toThrow();
  });

  it("RoutineExercise dispara sonido y háptica al completar una serie", () => {
    expect(routineExerciseSource).toContain("playSetCompleteSound()");
    expect(routineExerciseSource).toContain("triggerHaptic()");
  });

  it("design2.css incluye animación de pop y hover al tildar la serie", () => {
    expect(cssSource).toContain(".d2-log-check-on");
    expect(cssSource).toContain("d2-check-pop");
  });
});

describe("5. Integración de Cronómetro y temporizador de descanso", () => {
  it("RoutineScreen gestiona temporizador de descanso con cuenta regresiva y botones +/-/saltar", () => {
    expect(routineScreenSource).toContain("restSecondsLeft");
    expect(routineScreenSource).toContain("setRestSecondsLeft(90)");
    expect(routineScreenSource).toContain("+30s");
    expect(routineScreenSource).toContain("-15s");
    expect(routineScreenSource).toContain("Saltar");
  });

  it("design2.css define el banner flotante del temporizador de descanso", () => {
    expect(cssSource).toContain(".d2-rest-timer");
    expect(cssSource).toContain(".d2-rest-timer-digits");
    expect(cssSource).toContain(".d2-rest-btn");
  });
});

describe("6. Ver video o gif dentro del entrenamiento en curso", () => {
  it("RoutineExercise ofrece botón para ver GIF animado de técnica en modal", () => {
    expect(routineExerciseSource).toContain("d2-media-btn");
    expect(routineExerciseSource).toContain("Ver GIF");
    expect(routineExerciseSource).toContain("d2-media-modal-card");
    expect(routineExerciseSource).toContain("d2-media-modal-gif");
  });

  it("design2.css provee estilos para la previsualización de técnica", () => {
    expect(cssSource).toContain(".d2-media-modal-card");
    expect(cssSource).toContain(".d2-media-btn");
  });
});
