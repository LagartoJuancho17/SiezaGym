import { describe, expect, it } from "vitest";
import {
  appendSet,
  doneCount,
  dropSet,
  elapsedSeconds,
  formatClock,
  isExerciseDone,
  plannedCount,
  plannedSets,
  pluralExercises,
  pluralSets,
  sessionExercises,
  startSheet,
  volumeKg,
} from "@/lib/routines/workout";

const uniform = { exerciseId: "press", targetSets: 3, targetReps: 10, targetWeight: 40, targetRIR: 2, sets: null };
const ramp = {
  exerciseId: "remo",
  targetSets: 4,
  targetReps: 10,
  targetWeight: 30,
  targetRIR: null,
  sets: [
    { setNumber: 1, reps: 10, weight: 30, rir: 3 },
    { setNumber: 2, reps: 12, weight: 30, rir: 2 },
    { setNumber: 3, reps: 14, weight: 25, rir: 1 },
    { setNumber: 4, reps: 16, weight: 20, rir: 0 },
  ],
};

describe("plannedSets", () => {
  it("abre la forma pareja en una fila por serie", () => {
    expect(plannedSets(uniform)).toEqual([
      { setNumber: 1, reps: 10, weight: 40, rir: 2 },
      { setNumber: 2, reps: 10, weight: 40, rir: 2 },
      { setNumber: 3, reps: 10, weight: 40, rir: 2 },
    ]);
  });

  it("respeta la rampa cuando está prescrita serie por serie", () => {
    expect(plannedSets(ramp).map((set) => set.reps)).toEqual([10, 12, 14, 16]);
    expect(plannedSets(ramp).map((set) => set.rir)).toEqual([3, 2, 1, 0]);
  });

  it("renumera las series por si vinieran desordenadas de Firestore", () => {
    const desordenado = { sets: [{ setNumber: 7, reps: 8 }, { setNumber: 3, reps: 9 }] };
    expect(plannedSets(desordenado).map((set) => set.setNumber)).toEqual([1, 2]);
  });

  it("deja el peso en null cuando no se prescribió, sin convertirlo en cero", () => {
    // null es "no se prescribió"; 0 kg sería una prescripción de peso corporal.
    expect(plannedSets({ targetSets: 1, targetReps: 12 })[0].weight).toBeNull();
  });
});

describe("startSheet", () => {
  it("arranca con lo prescrito y nada marcado", () => {
    const sheet = startSheet([uniform, ramp]);
    expect(sheet[0]).toHaveLength(3);
    expect(sheet[1].map((row) => row.reps)).toEqual([10, 12, 14, 16]);
    expect(Object.values(sheet).flat().every((row) => row.done === false)).toBe(true);
  });

  it("no arrastra el RIR a la planilla", () => {
    // El RIR es prescripción, no registro: se cargan kilos y repeticiones.
    expect(startSheet([uniform])[0][0]).not.toHaveProperty("rir");
  });

  it("no mezcla dos apariciones del mismo ejercicio", () => {
    // Una rutina puede tener press al principio y al final: son dos entradas
    // distintas, cada una con su planilla.
    const sheet = startSheet([uniform, { ...uniform, targetSets: 1 }]);
    expect(sheet[0]).toHaveLength(3);
    expect(sheet[1]).toHaveLength(1);
  });
});

describe("agregar y sacar series en el momento", () => {
  it("la serie nueva copia la última cargada", () => {
    const rows = appendSet([{ setNumber: 1, reps: 12, weight: 50, done: true }]);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual({ setNumber: 2, reps: 12, weight: 50, done: false });
  });

  it("nunca deja un ejercicio sin ninguna serie", () => {
    const one = [{ setNumber: 1, reps: 10, weight: null, done: false }];
    expect(dropSet(one)).toEqual(one);
    expect(dropSet(appendSet(one))).toHaveLength(1);
  });
});

describe("progreso y volumen", () => {
  const sheet = {
    0: [
      { setNumber: 1, reps: 10, weight: 40, done: true },
      { setNumber: 2, reps: 8, weight: 40, done: true },
      { setNumber: 3, reps: 10, weight: 40, done: false },
    ],
    1: [{ setNumber: 1, reps: 45, weight: null, done: true }],
  };

  it("cuenta las series hechas y las planificadas", () => {
    expect(doneCount(sheet)).toBe(3);
    expect(plannedCount(sheet)).toBe(4);
  });

  it("suma volumen solo de lo que ya se hizo", () => {
    // 10×40 + 8×40 = 720. La tercera serie está prescrita, no hecha.
    expect(volumeKg(sheet)).toBe(720);
  });

  it("el peso corporal no aporta volumen pero sí cuenta como serie", () => {
    expect(volumeKg({ 0: sheet[1] })).toBe(0);
    expect(doneCount({ 0: sheet[1] })).toBe(1);
  });

  it("una planilla en blanco no inventa volumen", () => {
    expect(volumeKg(startSheet([uniform]))).toBe(0);
    expect(doneCount(startSheet([uniform]))).toBe(0);
  });

  it("marca el ejercicio terminado solo con todas las series hechas", () => {
    expect(isExerciseDone(sheet, 0)).toBe(false);
    expect(isExerciseDone(sheet, 1)).toBe(true);
    expect(isExerciseDone(sheet, 9)).toBe(false);
  });
});

describe("sessionExercises", () => {
  it("manda solo las series marcadas", () => {
    const sheet = {
      0: [
        { setNumber: 1, reps: 10, weight: 40, done: true },
        { setNumber: 2, reps: 10, weight: 40, done: false },
      ],
    };
    expect(sessionExercises([uniform], sheet)).toEqual([
      { exerciseId: "press", sets: [{ setNumber: 1, weight: 40, reps: 10, failed: false }] },
    ]);
  });

  it("renumera para que no queden huecos si se saltea una serie", () => {
    const sheet = {
      0: [
        { setNumber: 1, reps: 10, weight: 40, done: false },
        { setNumber: 2, reps: 9, weight: 45, done: true },
        { setNumber: 3, reps: 8, weight: 45, done: true },
      ],
    };
    expect(sessionExercises([uniform], sheet)[0].sets.map((set) => set.setNumber)).toEqual([1, 2]);
  });

  it("guarda el peso corporal como 0 y no lo descarta", () => {
    // Un ejercicio sin kilos igual es una serie hecha: plancha, dominadas.
    const sheet = { 0: [{ setNumber: 1, reps: 45, weight: null, done: true }] };
    const payload = sessionExercises([{ exerciseId: "plancha" }], sheet);
    expect(payload).toEqual([
      { exerciseId: "plancha", sets: [{ setNumber: 1, weight: 0, reps: 45, failed: false }] },
    ]);
  });

  it("descarta la serie sin repeticiones", () => {
    const sheet = { 0: [{ setNumber: 1, reps: null, weight: 40, done: true }] };
    expect(sessionExercises([uniform], sheet)).toEqual([]);
  });

  it("saca del payload los ejercicios que no se tocaron", () => {
    const sheet = { 0: [{ setNumber: 1, reps: 10, weight: 40, done: true }], 1: [] };
    expect(sessionExercises([uniform, ramp], sheet).map((item) => item.exerciseId)).toEqual(["press"]);
  });

  it("no pisa una aparición del mismo ejercicio con la otra", () => {
    const exercises = [uniform, { ...uniform, targetSets: 1 }];
    const sheet = {
      0: [{ setNumber: 1, reps: 10, weight: 40, done: true }],
      1: [{ setNumber: 1, reps: 6, weight: 60, done: true }],
    };
    const payload = sessionExercises(exercises, sheet);
    expect(payload).toHaveLength(2);
    expect(payload.map((item) => item.sets[0].reps)).toEqual([10, 6]);
  });
});

describe("cronómetro", () => {
  const startedAt = 1_000_000;

  it("cuenta con reloj de pared", () => {
    expect(elapsedSeconds({ startedAt, now: startedAt + 65_400 })).toBe(65);
  });

  it("descuenta las pausas cerradas", () => {
    expect(elapsedSeconds({ startedAt, now: startedAt + 60_000, pausedMs: 20_000 })).toBe(40);
  });

  it("se congela mientras está en pausa", () => {
    const frozen = { startedAt, pausedAt: startedAt + 30_000 };
    expect(elapsedSeconds({ ...frozen, now: startedAt + 30_000 })).toBe(30);
    expect(elapsedSeconds({ ...frozen, now: startedAt + 90_000 })).toBe(30);
  });

  it("no cuenta nada antes de arrancar", () => {
    expect(elapsedSeconds({ startedAt: null, now: startedAt })).toBe(0);
  });

  it("nunca devuelve negativo si el reloj del sistema se corre para atrás", () => {
    expect(elapsedSeconds({ startedAt, now: startedAt - 5_000 })).toBe(0);
  });
});

describe("formatClock", () => {
  it("muestra mm:ss hasta la hora", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(9)).toBe("00:09");
    expect(formatClock(605)).toBe("10:05");
    expect(formatClock(3599)).toBe("59:59");
  });

  it("agrega la hora recién cuando hace falta", () => {
    expect(formatClock(3600)).toBe("1:00:00");
    expect(formatClock(3725)).toBe("1:02:05");
  });

  it("aguanta basura sin romper el encabezado", () => {
    expect(formatClock(null)).toBe("00:00");
    expect(formatClock(-30)).toBe("00:00");
  });
});

describe("plurales", () => {
  it("no escribe «1 series» ni «1 ejercicios»", () => {
    expect(pluralSets(1)).toBe("1 serie");
    expect(pluralSets(4)).toBe("4 series");
    expect(pluralExercises(1)).toBe("1 ejercicio");
    expect(pluralExercises(0)).toBe("0 ejercicios");
  });
});
