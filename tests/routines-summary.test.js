import { describe, expect, it } from "vitest";
import { estimatedDurationMinutes, muscleDistribution, totalSets } from "@/lib/routines/summary";

const press = {
  id: "press",
  registrationType: "peso_reps",
  muscleWeights: { pecho: 0.7, triceps: 0.3 },
};
const plancha = {
  id: "plancha",
  registrationType: "tiempo",
  muscleWeights: { abdomen: 1 },
};
const lookup = new Map([
  ["press", press],
  ["plancha", plancha],
]);

describe("totalSets", () => {
  it("cuenta las series de una prescripción pareja", () => {
    expect(totalSets({ exercises: [{ exerciseId: "press", targetSets: 4, targetReps: 10 }] })).toBe(4);
  });

  it("cuenta las filas reales cuando la prescripción es serie por serie", () => {
    // targetSets puede quedar desactualizado; sets[] es la verdad.
    const routine = {
      exercises: [
        {
          exerciseId: "press",
          targetSets: 3,
          targetReps: 10,
          sets: [
            { setNumber: 1, reps: 10 },
            { setNumber: 2, reps: 12 },
            { setNumber: 3, reps: 14 },
            { setNumber: 4, reps: 16 },
          ],
        },
      ],
    };
    expect(totalSets(routine)).toBe(4);
  });

  it("una rutina vacía da cero y no rompe", () => {
    expect(totalSets({ exercises: [] })).toBe(0);
    expect(totalSets({})).toBe(0);
  });
});

describe("estimatedDurationMinutes", () => {
  it("cuenta trabajo más descanso por serie", () => {
    // 3 series × (40 s de trabajo + 75 s de descanso) = 345 s = 6 min.
    const routine = { exercises: [{ exerciseId: "press", targetSets: 3, targetReps: 10 }] };
    expect(estimatedDurationMinutes(routine, lookup)).toBe(6);
  });

  it("en los ejercicios de tiempo usa los segundos prescritos", () => {
    // 2 × (60 + 75) = 270 s = 5 min (redondeado desde 4,5).
    const routine = { exercises: [{ exerciseId: "plancha", targetSets: 2, targetReps: 60 }] };
    expect(estimatedDurationMinutes(routine, lookup)).toBe(5);
  });

  it("con una rampa de tiempo suma cada serie por su duración", () => {
    // 30 + 45 + 60 de trabajo, más 3 × 75 de descanso = 360 s = 6 min.
    const routine = {
      exercises: [
        {
          exerciseId: "plancha",
          targetSets: 3,
          targetReps: 30,
          sets: [
            { setNumber: 1, reps: 30 },
            { setNumber: 2, reps: 45 },
            { setNumber: 3, reps: 60 },
          ],
        },
      ],
    };
    expect(estimatedDurationMinutes(routine, lookup)).toBe(6);
  });

  it("un ejercicio que no está en el catálogo se cuenta como de repeticiones", () => {
    const routine = { exercises: [{ exerciseId: "fantasma", targetSets: 1, targetReps: 10 }] };
    expect(estimatedDurationMinutes(routine, lookup)).toBe(2);
  });
});

describe("muscleDistribution", () => {
  it("reparte las series según los pesos del catálogo", () => {
    const routine = { exercises: [{ exerciseId: "press", targetSets: 4, targetReps: 10 }] };
    const reparto = muscleDistribution(routine, lookup);
    expect(reparto.map((row) => row.muscle)).toEqual(["pecho", "triceps"]);
    expect(reparto[0].pct).toBeCloseTo(0.7, 10);
    expect(reparto[1].pct).toBeCloseTo(0.3, 10);
  });

  it("pesa más el ejercicio con más series", () => {
    const routine = {
      exercises: [
        { exerciseId: "press", targetSets: 1, targetReps: 10 },
        { exerciseId: "plancha", targetSets: 9, targetReps: 30 },
      ],
    };
    const [first] = muscleDistribution(routine, lookup);
    expect(first.muscle).toBe("abdomen");
    expect(Math.round(first.pct * 100)).toBe(90);
  });

  it("no inventa un reparto cuando no hay nada que repartir", () => {
    expect(muscleDistribution({ exercises: [] }, lookup)).toEqual([]);
    expect(muscleDistribution({ exercises: [{ exerciseId: "fantasma", targetSets: 3 }] }, lookup)).toEqual([]);
  });
});
