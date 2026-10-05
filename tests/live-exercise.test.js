import { describe, expect, it } from "vitest";
import {
  appendLive,
  cleanLiveExercises,
  liveExercise,
  liveRows,
  liveSessionExercises,
} from "@/lib/routines/liveExercise";
import { sessionExercisesFromLogs } from "@/lib/assignments/assignments";

const prensa = { id: "prensa-de-piernas", nameEs: "Prensa de piernas", registrationType: "peso_reps", equipment: "maquina", muscleWeights: { cuadriceps: 0.7, gluteo: 0.3 } };
const plancha = { id: "plancha-abdominal", nameEs: "Plancha abdominal", registrationType: "tiempo", muscleWeights: { abdomen: 1 } };

describe("agregar ejercicio entrenando (web)", () => {
  it("arma el ejercicio como la planilla, con 3 series y 30 s si es de tiempo", () => {
    const ex = liveExercise(prensa, 5);
    expect(ex).toMatchObject({ position: 5, live: true, exerciseId: "prensa-de-piernas", showWeight: true, timeBased: false, group: "" });
    expect(ex.sets).toHaveLength(3);
    expect(ex.sets[0].reps).toBe(10);
    expect(liveExercise(plancha, 6).sets[0].reps).toBe(30);
  });

  it("numera los nuevos después de la rutina y de los ya agregados", () => {
    const first = appendLive([], [prensa], 4);
    const both = appendLive(first, [plancha], 4);
    expect(both.map((e) => e.position)).toEqual([4, 5]);
    expect(Object.keys(liveRows(both.slice(1)))).toEqual(["5"]);
    expect(liveRows(both)[4].every((row) => row.done === false)).toBe(true);
  });

  it("solo lo marcado de lo agregado llega a la sesión", () => {
    const extra = appendLive([], [prensa, plancha], 3);
    const sheet = {
      3: [{ reps: 12, weight: 100, done: true }, { reps: 12, weight: 100, done: false }],
      4: [{ reps: 30, weight: null, done: false }],
    };
    const out = liveSessionExercises(extra, sheet, { 3: " pesada " });
    expect(out).toEqual([
      { exerciseId: "prensa-de-piernas", exerciseSource: "catalog", order: 0, note: "pesada", sets: [{ setNumber: 1, weight: 100, reps: 12, failed: false }] },
    ]);
  });

  it("el servidor limpia lo que manda el navegador y lo numera después de lo asignado", () => {
    const clean = cleanLiveExercises(
      [
        { exerciseId: "prensa-de-piernas", sets: [{ reps: 10, weight: -5 }, { reps: 0 }], note: "ok" },
        { exerciseId: 42, sets: [{ reps: 10 }] },
        { exerciseId: "sin-series", sets: [] },
      ],
      3,
    );
    expect(clean).toEqual([
      { exerciseId: "prensa-de-piernas", exerciseSource: "catalog", order: 3, note: "ok", sets: [{ setNumber: 1, weight: 0, reps: 10, failed: false }] },
    ]);
    expect(cleanLiveExercises("nada")).toEqual([]);
    expect(cleanLiveExercises(Array.from({ length: 30 }, () => ({ exerciseId: "x", sets: [{ reps: 1 }] })))).toHaveLength(20);
  });

  it("lo asignado sigue saliendo de lo registrado, sin mezclar lo agregado", () => {
    const fromLogs = sessionExercisesFromLogs([{ exerciseId: "a" }], { 0: { sets: [{ reps: 8, weight: 50 }] } });
    expect(fromLogs.map((e) => e.exerciseId)).toEqual(["a"]);
  });
});
