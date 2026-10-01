import { describe, expect, it } from "vitest";
import {
  STOPWATCH_IDLE,
  countdownRemainingMs,
  crossedTarget,
  formatStopwatch,
  lapRows,
  loggedSeconds,
  progressToward,
  stopwatchElapsedMs,
  stopwatchReducer,
} from "@/lib/workout/stopwatch";
import { EXERCISE_NOTE_MAX, cleanExerciseNote, lastNotesByExercise, withCleanNotes } from "@/lib/sessions/notes";
import {
  GROUP_COLORS,
  PRESET_GROUPS,
  groupColorHex,
  groupTone,
  normalizeGroupColor,
  savedGroupPresets,
} from "@/lib/routines/groupColors";
import { completesExercise, sessionExercises } from "@/lib/routines/workout";

describe("cronómetro estilo iPhone", () => {
  const run = (actions) => actions.reduce((state, action) => stopwatchReducer(state, action), STOPWATCH_IDLE);

  it("cuenta con el reloj de pared y congela al detener", () => {
    const state = run([{ type: "start", now: 1000 }, { type: "stop", now: 4500 }]);
    expect(stopwatchElapsedMs(state, 99_999)).toBe(3500);
    const resumed = stopwatchReducer(state, { type: "start", now: 10_000 });
    expect(stopwatchElapsedMs(resumed, 10_500)).toBe(4000);
  });

  it("ignora acciones que no aplican (doble toque no rompe nada)", () => {
    const running = run([{ type: "start", now: 0 }]);
    expect(stopwatchReducer(running, { type: "start", now: 50 })).toBe(running);
    expect(stopwatchReducer(running, { type: "reset", now: 50 })).toBe(running);
    expect(stopwatchReducer(STOPWATCH_IDLE, { type: "lap", now: 50 })).toBe(STOPWATCH_IDLE);
  });

  it("muestra las vueltas como el iPhone: la nueva arriba, rápida y lenta marcadas", () => {
    const rows = lapRows([10_000, 25_000, 33_000]);
    expect(rows.map((row) => row.number)).toEqual([3, 2, 1]);
    expect(rows.find((row) => row.fastest).splitMs).toBe(8000);
    expect(rows.find((row) => row.slowest).splitMs).toBe(15_000);
    expect(lapRows([5000]).some((row) => row.fastest || row.slowest)).toBe(false);
  });

  it("formatea mm:ss,cc y suma horas pasada la hora", () => {
    expect(formatStopwatch(45_270)).toBe("00:45,27");
    expect(formatStopwatch(3_725_000)).toBe("1:02:05,00");
    expect(formatStopwatch(-5)).toBe("00:00,00");
  });

  it("temporizador, anillo y aviso de llegada", () => {
    expect(countdownRemainingMs(45, 50_000)).toBe(0);
    expect(countdownRemainingMs(45, 15_000)).toBe(30_000);
    expect(progressToward(60, 30_000)).toBe(0.5);
    expect(progressToward(0, 30_000)).toBe(0);
    expect(crossedTarget(45, 44_900, 45_010)).toBe(true);
    expect(crossedTarget(45, 45_010, 46_000)).toBe(false);
  });

  it("carga segundos enteros: el temporizador cumplido guarda lo prescrito", () => {
    expect(loggedSeconds("stopwatch", 45, 44_600)).toBe(45);
    expect(loggedSeconds("timer", 45, 46_200)).toBe(45);
    expect(loggedSeconds("timer", 45, 30_400)).toBe(30);
    expect(loggedSeconds("stopwatch", 0, 200)).toBe(1);
  });
});

describe("notas por ejercicio", () => {
  it("limpia y acota la nota", () => {
    expect(cleanExerciseNote("  subir 2,5 kg  ")).toBe("subir 2,5 kg");
    expect(cleanExerciseNote(42)).toBe("");
    expect(cleanExerciseNote("x".repeat(EXERCISE_NOTE_MAX + 50))).toHaveLength(EXERCISE_NOTE_MAX);
  });

  it("solo guarda la nota si tiene texto", () => {
    expect(withCleanNotes([{ exerciseId: "a", note: "   " }, { exerciseId: "b", note: " ok " }])).toEqual([
      { exerciseId: "a" },
      { exerciseId: "b", note: "ok" },
    ]);
  });

  it("muestra la última nota de cada ejercicio aunque las sesiones vengan desordenadas", () => {
    const sessions = [
      { finishedAt: "2026-09-20T10:00:00Z", exercises: [{ exerciseId: "sentadilla", note: "vieja" }] },
      { finishedAt: "2026-09-28T10:00:00Z", exercises: [{ exerciseId: "sentadilla", note: "nueva" }] },
      { finishedAt: "2026-09-30T10:00:00Z", exercises: [{ exerciseId: "sentadilla" }] },
    ];
    expect(lastNotesByExercise(sessions).sentadilla.note).toBe("nueva");
  });

  it("la sesión guarda la nota de hoy por posición, sin guardar ejercicios sin series", () => {
    const exercises = [{ exerciseId: "a" }, { exerciseId: "b" }];
    const sheet = { 0: [{ done: true, reps: 10, weight: 50 }], 1: [{ done: false, reps: 8 }] };
    const out = sessionExercises(exercises, sheet, { 0: " bajar en 3 s ", 1: "no la hice" });
    expect(out).toEqual([{ exerciseId: "a", sets: [{ setNumber: 1, weight: 50, reps: 10, failed: false }], note: "bajar en 3 s" }]);
  });
});

describe("sonido al terminar el ejercicio completo", () => {
  it("solo la última serie pendiente completa el ejercicio", () => {
    const rows = [{ done: true }, { done: true }, { done: false }];
    expect(completesExercise(rows, 2)).toBe(true);
    expect(completesExercise([{ done: false }, { done: false }], 0)).toBe(false);
    expect(completesExercise(rows, 0)).toBe(false); // ya estaba hecha
    expect(completesExercise([], 0)).toBe(false);
  });
});

describe("colores y categorías de bloques", () => {
  it("acepta ids de la paleta y #rrggbb, descarta lo demás", () => {
    expect(normalizeGroupColor("amber")).toBe("amber");
    expect(normalizeGroupColor(" #FF3201 ")).toBe("#ff3201");
    expect(normalizeGroupColor("url(javascript:alert(1))")).toBe("");
    expect(groupColorHex("nada")).toBe(GROUP_COLORS[0].hex);
  });

  it("pinta cualquier color con variables CSS", () => {
    const tone = groupTone("#ff3201");
    expect(tone.className).toBe("d2-grp-custom");
    expect(tone.style["--d2-grp-c"]).toBe("#ff3201");
    expect(tone.style["--d2-grp-bg"]).toBe("rgba(255, 50, 1, 0.12)");
    expect(groupTone("teal").className).toBe("d2-grp-teal");
  });

  it("todas las categorías usan un color de la paleta", () => {
    const ids = new Set(GROUP_COLORS.map((color) => color.id));
    for (const preset of PRESET_GROUPS) expect(ids.has(preset.color), preset.name).toBe(true);
  });

  it("ofrece los grupos ya usados, sin repetir ni duplicar las categorías fijas", () => {
    const routines = [
      { exercises: [{ group: "Pierna pesada", groupColor: "purple" }, { group: "Fuerza", groupColor: "amber" }] },
      { exercises: [{ group: "Pierna pesada", groupColor: "purple" }, { group: "Brazos", groupColor: "#123456" }] },
    ];
    expect(savedGroupPresets(routines)).toEqual([
      { name: "Pierna pesada", color: "purple" },
      { name: "Brazos", color: "#123456" },
    ]);
  });
});
