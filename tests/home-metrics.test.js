import { describe, it, expect } from "vitest";
import {
  volumeByMuscleGroup,
  pushPullBalance,
  setCompletionRate,
  volumeByWeekday,
  relativeIntensity,
  volumePerSession,
  intensityZones,
  intensitySequence,
  sessionSeconds,
  sessionsInLastDays,
  caloriesForSession,
  weeklyCalories,
  SECONDS_PER_SET,
  RESISTANCE_MET,
  DEFAULT_BODY_WEIGHT_KG,
} from "@/lib/home/metrics";

const catalogo = new Map([
  ["press-banca", { muscleWeights: { pecho: 0.6, triceps: 0.4 }, pattern: "empuje_horizontal" }],
  ["remo", { muscleWeights: { dorsal: 1 }, pattern: "traccion_horizontal" }],
  ["plancha", { muscleWeights: { abdomen: 1 }, pattern: "core" }],
]);

function serie(weight, reps, failed = false) {
  return { weight, reps, failed };
}

describe("volumeByMuscleGroup", () => {
  it("reparte el volumen segun muscleWeights", () => {
    const sessions = [
      { exercises: [{ exerciseId: "press-banca", sets: [serie(100, 10)] }] },
    ];
    const { rows, totalKg } = volumeByMuscleGroup(sessions, catalogo);
    expect(totalKg).toBe(1000);
    expect(rows[0]).toMatchObject({ muscle: "pecho", kg: 600 });
    expect(rows[1]).toMatchObject({ muscle: "triceps", kg: 400 });
  });

  it("ignora las series falladas", () => {
    const sessions = [
      { exercises: [{ exerciseId: "remo", sets: [serie(50, 10), serie(50, 10, true)] }] },
    ];
    expect(volumeByMuscleGroup(sessions, catalogo).totalKg).toBe(500);
  });

  it("no rompe con un ejercicio que no esta en el catalogo", () => {
    const sessions = [{ exercises: [{ exerciseId: "fantasma", sets: [serie(80, 5)] }] }];
    expect(volumeByMuscleGroup(sessions, catalogo)).toEqual({ rows: [], totalKg: 0 });
  });
});

describe("pushPullBalance", () => {
  it("50% cuando empuje y traccion empatan", () => {
    const sessions = [
      {
        exercises: [
          { exerciseId: "press-banca", sets: [serie(100, 10)] },
          { exerciseId: "remo", sets: [serie(100, 10)] },
        ],
      },
    ];
    expect(pushPullBalance(sessions, catalogo)).toMatchObject({ pct: 50, label: "Equilibrado" });
  });

  it("avisa cuando falta espalda", () => {
    const sessions = [{ exercises: [{ exerciseId: "press-banca", sets: [serie(100, 10)] }] }];
    expect(pushPullBalance(sessions, catalogo)).toMatchObject({ pct: 100, label: "Falta espalda" });
  });

  it("deja afuera los patrones que no son empuje ni traccion", () => {
    const sessions = [{ exercises: [{ exerciseId: "plancha", sets: [serie(0, 60)] }] }];
    expect(pushPullBalance(sessions, catalogo).hasData).toBe(false);
  });
});

describe("setCompletionRate", () => {
  it("cuenta las falladas", () => {
    const sessions = [
      { exercises: [{ exerciseId: "remo", sets: [serie(50, 10), serie(50, 10), serie(50, 2, true)] }] },
    ];
    expect(setCompletionRate(sessions)).toMatchObject({ pct: 67, completed: 2, total: 3 });
  });

  it("sin series no inventa un 100%", () => {
    expect(setCompletionRate([])).toMatchObject({ pct: 0, hasData: false });
  });
});

describe("volumeByWeekday", () => {
  it("acumula por dia y normaliza contra el maximo", () => {
    const sessions = [
      { finishedAt: "lunes", totalVolumeKg: 1000 },
      { finishedAt: "lunes", totalVolumeKg: 500 },
      { finishedAt: "viernes", totalVolumeKg: 750 },
    ];
    const index = (d) => (d === "lunes" ? 0 : 4);
    const dias = volumeByWeekday(sessions, index);
    expect(dias[0]).toMatchObject({ label: "LUN", kg: 1500, pct: 1 });
    expect(dias[4]).toMatchObject({ label: "VIE", kg: 750, pct: 0.5 });
    expect(dias[2].kg).toBe(0);
  });
});

describe("relativeIntensity", () => {
  it("compara la ultima sesion contra el mejor 1RM historico", () => {
    // Historico: 100kg x 1 => 1RM 100. Ultima: 80kg => 80%.
    const sessions = [
      { exercises: [{ exerciseId: "press-banca", sets: [serie(80, 1)] }] },
      { exercises: [{ exerciseId: "press-banca", sets: [serie(100, 1)] }] },
    ];
    expect(relativeIntensity(sessions)).toMatchObject({ pct: 80, label: "Alta" });
  });

  it("sin sesiones no devuelve un porcentaje inventado", () => {
    expect(relativeIntensity([])).toMatchObject({ pct: 0, hasData: false });
  });
});

describe("volumePerSession", () => {
  it("devuelve los puntos de vieja a nueva con su promedio", () => {
    const sessions = [{ totalVolumeKg: 300 }, { totalVolumeKg: 100 }];
    expect(volumePerSession(sessions)).toMatchObject({ points: [100, 300], averageKg: 200 });
  });
});

describe("intensityZones", () => {
  it("clasifica cada serie por porcentaje del 1RM", () => {
    const sessions = [
      {
        exercises: [
          {
            exerciseId: "press-banca",
            // 1RM de referencia = 100 (100x1). 95 => peak, 85 => high, 70 => med, 50 => light.
            sets: [serie(100, 1), serie(95, 1), serie(85, 1), serie(70, 1), serie(50, 1)],
          },
        ],
      },
    ];
    const zonas = intensityZones(sessions);
    expect(zonas).toMatchObject({ peak: 2, high: 1, med: 1, light: 1, total: 5 });
  });
});

describe("sessionSeconds", () => {
  it("usa la duracion guardada cuando es plausible", () => {
    expect(sessionSeconds({ totalSetsCompleted: 6, durationSeconds: 1800 })).toBe(1800);
  });

  it("estima cuando la duracion guardada es imposible", () => {
    // Caso real en la base: 6 series en 25 segundos.
    expect(sessionSeconds({ totalSetsCompleted: 6, durationSeconds: 25 })).toBe(6 * SECONDS_PER_SET);
  });

  it("estima cuando no hay duracion", () => {
    expect(sessionSeconds({ totalSetsCompleted: 4 })).toBe(4 * SECONDS_PER_SET);
  });
});

describe("calorias", () => {
  it("aplica MET x peso x horas", () => {
    const session = { totalSetsCompleted: 0, durationSeconds: 3600 };
    // 3600s guardados con 0 series: el piso es 0, asi que vale la duracion real.
    expect(caloriesForSession(session, { bodyWeightKg: 80 })).toBe(RESISTANCE_MET * 80);
  });

  it("cae al peso por defecto si el perfil no lo tiene", () => {
    const session = { totalSetsCompleted: 0, durationSeconds: 3600 };
    expect(caloriesForSession(session, {})).toBe(RESISTANCE_MET * DEFAULT_BODY_WEIGHT_KG);
  });

  it("marca cuando el peso es el por defecto", () => {
    expect(weeklyCalories([], {}).usesDefaultWeight).toBe(true);
    expect(weeklyCalories([], { bodyWeightKg: 70 }).usesDefaultWeight).toBe(false);
  });

  it("no pasa del 100% del objetivo", () => {
    const sessions = [{ totalSetsCompleted: 200 }];
    expect(weeklyCalories(sessions, { goal: 100 }).pct).toBe(100);
  });

  it("sin sesiones da cero, no el objetivo", () => {
    expect(weeklyCalories([], { goal: 2000 })).toMatchObject({ kcal: 0, pct: 0, hasData: false });
  });
});

describe("sessionsInLastDays", () => {
  const ahora = new Date("2026-09-10T12:00:00Z");

  it("deja afuera lo mas viejo que la ventana", () => {
    const sessions = [
      { finishedAt: "2026-09-09T10:00:00Z" },
      { finishedAt: "2026-09-01T10:00:00Z" },
    ];
    expect(sessionsInLastDays(sessions, 7, ahora)).toHaveLength(1);
  });

  it("ignora sesiones sin fecha", () => {
    expect(sessionsInLastDays([{ totalVolumeKg: 100 }], 7, ahora)).toHaveLength(0);
  });
});

describe("intensitySequence", () => {
  it("devuelve una zona por serie de la ultima sesion", () => {
    const sessions = [
      {
        exercises: [
          { exerciseId: "press-banca", sets: [serie(100, 1), serie(70, 1), serie(50, 1)] },
        ],
      },
    ];
    // 1RM de referencia = 100 => 100%, 70%, 50% => peak, med, light.
    expect(intensitySequence(sessions)).toEqual([3, 1, 0]);
  });

  it("saltea las series falladas y sin sesiones devuelve vacio", () => {
    const sessions = [
      { exercises: [{ exerciseId: "press-banca", sets: [serie(100, 1), serie(90, 1, true)] }] },
    ];
    expect(intensitySequence(sessions)).toEqual([3]);
    expect(intensitySequence([])).toEqual([]);
  });
});
