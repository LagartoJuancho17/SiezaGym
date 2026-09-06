import { describe, it, expect } from "vitest";
import {
  startOfWeekLocal,
  computeWeeklyVolume,
  computeWeeklySessionCounts,
  computeEffectivenessPct,
  computeVolumeByWeek,
} from "./weeklyStats";
import { toLocalDayKey } from "./streak";

// Referencia: jueves 2026-09-03 15:00 UTC (mediodia Argentina). Su semana
// (lunes a domingo) arranca el lunes 2026-08-31.
const REF = new Date("2026-09-03T15:00:00Z");
const THIS_MONDAY = "2026-08-31";
const LAST_MONDAY = "2026-08-24";

function sessionOn(dayKey, totalVolumeKg = 100) {
  return { finishedAt: `${dayKey}T15:00:00-03:00`, totalVolumeKg };
}

describe("startOfWeekLocal", () => {
  it("cae en lunes para un jueves", () => {
    expect(toLocalDayKey(startOfWeekLocal(REF))).toBe(THIS_MONDAY);
  });

  it("el domingo pertenece a la semana que empieza el lunes anterior", () => {
    const sunday = new Date("2026-09-06T15:00:00-03:00"); // domingo
    expect(toLocalDayKey(startOfWeekLocal(sunday))).toBe(THIS_MONDAY);
  });

  it("el lunes arranca su propia semana", () => {
    const monday = new Date("2026-09-07T09:00:00-03:00");
    expect(toLocalDayKey(startOfWeekLocal(monday))).toBe("2026-09-07");
  });
});

describe("computeWeeklyVolume", () => {
  it("es 0 sin sesiones", () => {
    expect(computeWeeklyVolume([], REF)).toBe(0);
  });

  it("suma solo las sesiones de esta semana", () => {
    const sessions = [
      sessionOn(THIS_MONDAY, 1000),
      sessionOn("2026-09-02", 500.55),
      sessionOn(LAST_MONDAY, 9999), // semana anterior, no cuenta
      sessionOn("2026-08-23", 9999), // domingo de la semana anterior, no cuenta
    ];
    expect(computeWeeklyVolume(sessions, REF)).toBe(1500.55);
  });

  it("ignora sesiones sin finishedAt y tolera volumen faltante", () => {
    const sessions = [
      sessionOn(THIS_MONDAY, 100),
      { finishedAt: null },
      { finishedAt: "2026-09-01T15:00:00-03:00" }, // sin totalVolumeKg
    ];
    expect(computeWeeklyVolume(sessions, REF)).toBe(100);
  });

  it("una sesion del domingo cuenta para esta semana", () => {
    const sessions = [sessionOn("2026-09-06", 250)]; // domingo
    expect(computeWeeklyVolume(sessions, REF)).toBe(250);
  });
});

describe("computeWeeklySessionCounts", () => {
  it("cuenta esta semana y la anterior por separado", () => {
    const sessions = [
      sessionOn(THIS_MONDAY),
      sessionOn("2026-09-02"),
      sessionOn("2026-09-06"), // domingo, sigue siendo esta semana
      sessionOn(LAST_MONDAY),
      sessionOn("2026-08-30"), // domingo de la semana anterior
      sessionOn("2026-08-20"), // dos semanas atras, no cuenta
    ];
    expect(computeWeeklySessionCounts(sessions, REF)).toEqual({ thisWeek: 3, lastWeek: 2 });
  });

  it("es 0/0 sin sesiones", () => {
    expect(computeWeeklySessionCounts([], REF)).toEqual({ thisWeek: 0, lastWeek: 0 });
  });
});

describe("computeEffectivenessPct", () => {
  it("calcula la variacion porcentual redondeada", () => {
    expect(computeEffectivenessPct(5, 4)).toBe(25);
    expect(computeEffectivenessPct(2, 4)).toBe(-50);
    expect(computeEffectivenessPct(4, 4)).toBe(0);
  });

  it("devuelve null sin base de comparacion", () => {
    expect(computeEffectivenessPct(3, 0)).toBeNull();
    expect(computeEffectivenessPct(0, 0)).toBeNull();
  });
});

describe("computeVolumeByWeek", () => {
  it("devuelve 12 puntos en orden cronologico terminando en esta semana", () => {
    const points = computeVolumeByWeek([], 12, REF);
    expect(points).toHaveLength(12);
    expect(points[11].weekStartKey).toBe(THIS_MONDAY);
    expect(points[10].weekStartKey).toBe(LAST_MONDAY);
    expect(points.every((p) => p.totalVolumeKg === 0)).toBe(true);
  });

  it("bucketa el volumen en su semana y deja huecos en 0", () => {
    const sessions = [sessionOn(THIS_MONDAY, 800), sessionOn("2026-09-03", 200), sessionOn(LAST_MONDAY, 500)];
    const points = computeVolumeByWeek(sessions, 2, REF);
    expect(points).toEqual([
      { weekStartKey: LAST_MONDAY, totalVolumeKg: 500 },
      { weekStartKey: THIS_MONDAY, totalVolumeKg: 1000 },
    ]);
  });

  it("una sesion de domingo cae en la semana del lunes anterior", () => {
    const sessions = [sessionOn("2026-08-30", 300)]; // domingo -> semana del 24
    const points = computeVolumeByWeek(sessions, 2, REF);
    expect(points[0]).toEqual({ weekStartKey: LAST_MONDAY, totalVolumeKg: 300 });
    expect(points[1].totalVolumeKg).toBe(0);
  });
});
