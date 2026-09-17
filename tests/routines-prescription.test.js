import { describe, expect, it } from "vitest";
import {
  isDetailed,
  buildSets,
  resizeSets,
  toUniform,
  setCount,
  prescriptionSummary,
  MAX_SETS,
} from "@/lib/routines/prescription";

const uniform = { targetSets: 4, targetReps: 10, targetWeight: 60, targetRIR: 2, sets: null };

describe("isDetailed", () => {
  it("distingue la prescripción pareja de la detallada", () => {
    expect(isDetailed(uniform)).toBe(false);
    expect(isDetailed({ sets: [] })).toBe(false);
    expect(isDetailed({ sets: [{ setNumber: 1, reps: 10 }] })).toBe(true);
  });
});

describe("buildSets", () => {
  it("arranca con todas las series en el mismo valor", () => {
    const sets = buildSets(uniform);
    expect(sets).toHaveLength(4);
    expect(sets.map((s) => s.reps)).toEqual([10, 10, 10, 10]);
    expect(sets[0]).toEqual({ setNumber: 1, reps: 10, weight: 60, rir: 2 });
  });

  it("numera las series desde 1", () => {
    expect(buildSets(uniform).map((s) => s.setNumber)).toEqual([1, 2, 3, 4]);
  });

  it("sin datos usa valores razonables en vez de romper", () => {
    const sets = buildSets({});
    expect(sets).toHaveLength(1);
    expect(sets[0].reps).toBe(10);
    expect(sets[0].weight).toBe(null);
  });
});

describe("resizeSets", () => {
  const ramp = [
    { setNumber: 1, reps: 10, weight: 60, rir: 3 },
    { setNumber: 2, reps: 12, weight: 65, rir: 2 },
  ];

  it("al agregar, la serie nueva copia a la última", () => {
    // En el gimnasio una serie nueva repite o sube desde la anterior.
    const next = resizeSets(ramp, 3);
    expect(next).toHaveLength(3);
    expect(next[2]).toEqual({ setNumber: 3, reps: 12, weight: 65, rir: 2 });
  });

  it("al sacar, conserva las primeras", () => {
    expect(resizeSets(ramp, 1).map((s) => s.reps)).toEqual([10]);
  });

  it("renumera después de cambiar la cantidad", () => {
    expect(resizeSets(ramp, 4).map((s) => s.setNumber)).toEqual([1, 2, 3, 4]);
  });

  it("nunca baja de una serie ni pasa del máximo", () => {
    expect(resizeSets(ramp, 0)).toHaveLength(1);
    expect(resizeSets(ramp, 999)).toHaveLength(MAX_SETS);
  });

  it("sin series previas arma desde cero", () => {
    expect(resizeSets(null, 2)).toHaveLength(2);
    expect(resizeSets(undefined, 2)[0].reps).toBe(10);
  });
});

describe("toUniform", () => {
  it("vuelve a pareja tomando la primera serie de referencia", () => {
    const detailed = {
      targetSets: 4,
      sets: [
        { setNumber: 1, reps: 10, weight: 60, rir: 3 },
        { setNumber: 2, reps: 12, weight: 65, rir: 2 },
      ],
    };
    expect(toUniform(detailed)).toMatchObject({
      targetSets: 2,
      targetReps: 10,
      targetWeight: 60,
      targetRIR: 3,
      sets: null,
    });
  });

  it("si ya era pareja no cambia nada", () => {
    expect(toUniform(uniform)).toMatchObject({ targetSets: 4, targetReps: 10, sets: null });
  });
});

describe("setCount", () => {
  it("cuenta las series en las dos formas", () => {
    expect(setCount(uniform)).toBe(4);
    expect(setCount({ sets: [{ reps: 10 }, { reps: 12 }, { reps: 14 }] })).toBe(3);
  });
});

describe("prescriptionSummary", () => {
  it("resume la prescripción pareja", () => {
    expect(prescriptionSummary(uniform)).toBe("4 × 10");
  });

  it("una rampa se muestra serie por serie", () => {
    // Resumirla como "4 × 10" borraría justo lo que la hace una rampa.
    const ramp = {
      sets: [
        { setNumber: 1, reps: 10 },
        { setNumber: 2, reps: 12 },
        { setNumber: 3, reps: 14 },
        { setNumber: 4, reps: 16 },
      ],
    };
    expect(prescriptionSummary(ramp)).toBe("10 · 12 · 14 · 16");
  });

  it("si las series detalladas son todas iguales vuelve al resumen corto", () => {
    const flat = { sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }] };
    expect(prescriptionSummary(flat)).toBe("3 × 10");
  });

  it("en los ejercicios de tiempo la unidad son segundos", () => {
    expect(prescriptionSummary({ targetSets: 3, targetReps: 30 }, { timeBased: true })).toBe("3 × 30s");
    expect(prescriptionSummary({ sets: [{ reps: 20 }, { reps: 30 }] }, { timeBased: true })).toBe("20 · 30s");
  });
});
