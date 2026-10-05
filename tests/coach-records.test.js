import { describe, expect, it } from "vitest";
import { markRecordSets, personalRecords } from "@/lib/progress/records";

// Llegan como de listUserSessions: la más nueva primero.
const sessions = [
  {
    id: "s3",
    finishedAt: "2026-10-03T10:00:00.000Z",
    exercises: [
      { exerciseId: "banca", sets: [{ weight: 80, reps: 8 }, { weight: 90, reps: 3, failed: true }] },
    ],
  },
  {
    id: "s2",
    finishedAt: "2026-09-28T10:00:00.000Z",
    exercises: [
      { exerciseId: "banca", sets: [{ weight: 75, reps: 8 }, { weight: 70, reps: 8 }] },
      { exerciseId: "dominadas", sets: [{ weight: 0, reps: 10 }] },
    ],
  },
  {
    id: "s1",
    finishedAt: "2026-09-20T10:00:00.000Z",
    exercises: [{ exerciseId: "banca", sets: [{ weight: 70, reps: 8 }] }],
  },
];

describe("récords del alumno", () => {
  it("la primera vez que hace un ejercicio no es PR; superarlo después sí", () => {
    const [s3, s2, s1] = markRecordSets(sessions);
    expect(s1.exercises[0].sets[0].pr).toBe(false);
    expect(s2.exercises[0].sets.map((set) => set.pr)).toEqual([true, false]); // 75×8 > 70×8
    expect(s3.exercises[0].sets.map((set) => set.pr)).toEqual([true, false]); // 80×8; la fallada no cuenta
  });

  it("dos series que suben en la misma sesión: las dos son PR", () => {
    const [later] = markRecordSets([
      { finishedAt: "2026-10-02", exercises: [{ exerciseId: "x", sets: [{ weight: 60, reps: 5 }, { weight: 65, reps: 5 }] }] },
      { finishedAt: "2026-10-01", exercises: [{ exerciseId: "x", sets: [{ weight: 55, reps: 5 }] }] },
    ]);
    expect(later.exercises[0].sets.map((set) => set.pr)).toEqual([true, true]);
  });

  it("no cambia el orden ni la sesión original", () => {
    const marked = markRecordSets(sessions);
    expect(marked.map((s) => s.id)).toEqual(["s3", "s2", "s1"]);
    expect(sessions[0].exercises[0].sets[0].pr).toBeUndefined();
  });

  it("mejor serie por 1RM estimado, peso máximo y cantidad de entrenamientos", () => {
    const [banca] = personalRecords(sessions);
    expect(banca).toMatchObject({
      exerciseId: "banca",
      bestSet: { weight: 80, reps: 8 },
      bestAt: "2026-10-03T10:00:00.000Z",
      maxWeightKg: 80, // los 90 fallados no cuentan
      sessions: 3,
    });
    expect(banca.bestOneRepMax).toBe(101.3); // 80 × (1 + 8/30)
  });

  it("sin peso, el récord es el máximo de repeticiones (no un 1RM inventado)", () => {
    const dominadas = personalRecords(sessions).find((r) => r.exerciseId === "dominadas");
    expect(dominadas).toMatchObject({ bestOneRepMax: 0, maxWeightKg: 0, maxReps: 10 });
    // Los de peso van primero.
    expect(personalRecords(sessions).map((r) => r.exerciseId)).toEqual(["banca", "dominadas"]);
    expect(personalRecords([])).toEqual([]);
  });
});
