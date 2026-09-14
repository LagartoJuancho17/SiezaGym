import { describe, it, expect } from "vitest";
import {
  weekStartKey,
  volumeByWeek,
  bestWeekVolumeKg,
  weekVolumeShare,
  daysTrainedThisWeek,
} from "@/lib/home/weekly";

// Mediodia en Argentina, para que ningun corrimiento de zona cambie el dia.
const at = (day) => new Date(`${day}T12:00:00-03:00`);
const session = (day, kg) => ({ finishedAt: at(day).toISOString(), totalVolumeKg: kg });

describe("weekStartKey", () => {
  it("un miércoles cae en la semana que empieza el lunes anterior", () => {
    // 2026-09-09 es miércoles; el lunes es el 7.
    expect(weekStartKey(at("2026-09-09"))).toBe("2026-09-07");
  });

  it("el lunes es su propio inicio de semana", () => {
    expect(weekStartKey(at("2026-09-07"))).toBe("2026-09-07");
  });

  it("el domingo todavía pertenece a la semana que arrancó el lunes", () => {
    expect(weekStartKey(at("2026-09-13"))).toBe("2026-09-07");
  });

  it("cruzar de mes no rompe la cuenta", () => {
    // 2026-10-01 es jueves; el lunes es el 28 de septiembre.
    expect(weekStartKey(at("2026-10-01"))).toBe("2026-09-28");
  });
});

describe("volumeByWeek", () => {
  it("suma las sesiones de la misma semana", () => {
    const weeks = volumeByWeek([session("2026-09-07", 1000), session("2026-09-09", 500)]);
    expect(weeks).toEqual([{ weekKey: "2026-09-07", kg: 1500 }]);
  });

  it("separa semanas distintas y las ordena de la más nueva a la más vieja", () => {
    const weeks = volumeByWeek([session("2026-08-31", 300), session("2026-09-09", 900)]);
    expect(weeks.map((w) => w.weekKey)).toEqual(["2026-09-07", "2026-08-31"]);
  });

  it("una sesión sin fecha de fin no entra en ninguna semana", () => {
    expect(volumeByWeek([{ totalVolumeKg: 500 }])).toEqual([]);
  });

  it("sin sesiones no rompe", () => {
    expect(volumeByWeek([])).toEqual([]);
    expect(volumeByWeek(undefined)).toEqual([]);
  });
});

describe("bestWeekVolumeKg", () => {
  it("devuelve el mejor total semanal, no el de una sola sesión", () => {
    const sessions = [
      session("2026-09-07", 900),
      session("2026-09-08", 900),
      session("2026-08-31", 1500),
    ];
    expect(bestWeekVolumeKg(sessions)).toBe(1800);
  });

  it("sin datos es cero", () => {
    expect(bestWeekVolumeKg([])).toBe(0);
  });
});

describe("weekVolumeShare", () => {
  it("compara la semana en curso contra la mejor", () => {
    const sessions = [session("2026-09-09", 500), session("2026-08-31", 1000)];
    const result = weekVolumeShare(sessions, at("2026-09-09"));
    expect(result.kg).toBe(500);
    expect(result.bestKg).toBe(1000);
    expect(result.share).toBe(0.5);
    expect(result.isBest).toBe(false);
  });

  it("si la semana en curso es la mejor, el anillo se completa", () => {
    const sessions = [session("2026-09-09", 2000), session("2026-08-31", 1000)];
    const result = weekVolumeShare(sessions, at("2026-09-09"));
    expect(result.share).toBe(1);
    expect(result.isBest).toBe(true);
  });

  it("una semana sin entrenar da cero, no divide por cero", () => {
    const result = weekVolumeShare([session("2026-08-31", 1000)], at("2026-09-09"));
    expect(result.kg).toBe(0);
    expect(result.share).toBe(0);
    expect(result.isBest).toBe(false);
  });

  it("sin historial no inventa un porcentaje", () => {
    expect(weekVolumeShare([], at("2026-09-09"))).toMatchObject({ kg: 0, bestKg: 0, share: 0 });
  });
});

describe("daysTrainedThisWeek", () => {
  it("cuenta los días distintos de la semana en curso", () => {
    const keys = ["2026-09-07", "2026-09-09", "2026-09-13"];
    expect(daysTrainedThisWeek(keys, at("2026-09-09"))).toBe(3);
  });

  it("ignora los días de otras semanas", () => {
    const keys = ["2026-09-06", "2026-09-09"];
    expect(daysTrainedThisWeek(keys, at("2026-09-09"))).toBe(1);
  });

  it("sin días entrenados es cero", () => {
    expect(daysTrainedThisWeek([], at("2026-09-09"))).toBe(0);
  });
});
