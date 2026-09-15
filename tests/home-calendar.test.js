import { describe, expect, it } from "vitest";
import {
  mondayKeyOf,
  shiftWeeks,
  weekCells,
  weekRangeLabel,
  trainedDaysInWeek,
  isCurrentWeek,
  WEEKDAY_INITIALS,
} from "@/lib/home/calendar";

describe("WEEKDAY_INITIALS", () => {
  it("arranca en lunes, como el resto de la app", () => {
    expect(WEEKDAY_INITIALS).toEqual(["L", "M", "M", "J", "V", "S", "D"]);
  });
});

describe("mondayKeyOf", () => {
  it("un miércoles cae en la semana que empieza el lunes anterior", () => {
    // 2026-09-16 es miércoles; el lunes es el 14.
    expect(mondayKeyOf("2026-09-16")).toBe("2026-09-14");
  });

  it("el lunes es su propio inicio de semana", () => {
    expect(mondayKeyOf("2026-09-14")).toBe("2026-09-14");
  });

  it("el domingo todavía pertenece a la semana que arrancó el lunes", () => {
    expect(mondayKeyOf("2026-09-20")).toBe("2026-09-14");
  });

  it("cruzar de mes y de año no rompe la cuenta", () => {
    expect(mondayKeyOf("2026-10-01")).toBe("2026-09-28");
    expect(mondayKeyOf("2027-01-01")).toBe("2026-12-28");
  });
});

describe("shiftWeeks", () => {
  it("va y vuelve una semana", () => {
    expect(shiftWeeks("2026-09-14", -1)).toBe("2026-09-07");
    expect(shiftWeeks("2026-09-14", 1)).toBe("2026-09-21");
  });

  it("cruza de mes hacia atrás", () => {
    expect(shiftWeeks("2026-10-05", -1)).toBe("2026-09-28");
  });

  it("moverse cero deja la misma semana", () => {
    expect(shiftWeeks("2026-09-14", 0)).toBe("2026-09-14");
  });
});

describe("weekCells", () => {
  const week = "2026-09-14";

  it("devuelve siete días, de lunes a domingo", () => {
    const cells = weekCells(week);
    expect(cells).toHaveLength(7);
    expect(cells.map((c) => c.day)).toEqual([14, 15, 16, 17, 18, 19, 20]);
    expect(cells.map((c) => c.initial)).toEqual(WEEKDAY_INITIALS);
  });

  it("marca los días entrenados", () => {
    const cells = weekCells(week, { trainedDayKeys: ["2026-09-14", "2026-09-17"] });
    expect(cells.filter((c) => c.trained).map((c) => c.day)).toEqual([14, 17]);
  });

  it("no marca un día entrenado de otra semana", () => {
    expect(weekCells(week, { trainedDayKeys: ["2026-09-07"] }).some((c) => c.trained)).toBe(false);
  });

  it("señala hoy", () => {
    const hoy = weekCells(week, { todayKey: "2026-09-16" }).filter((c) => c.isToday);
    expect(hoy).toHaveLength(1);
    expect(hoy[0].day).toBe(16);
  });

  it("distingue el futuro de un día sin entrenar", () => {
    // No se puede haber entrenado mañana: no es lo mismo que haberlo salteado.
    const cells = weekCells(week, { todayKey: "2026-09-16" });
    expect(cells.filter((c) => c.isFuture).map((c) => c.day)).toEqual([17, 18, 19, 20]);
    expect(cells.find((c) => c.day === 16).isFuture).toBe(false);
  });

  it("sin la fecha de hoy no inventa futuro", () => {
    expect(weekCells(week).some((c) => c.isFuture)).toBe(false);
  });

  it("acepta un Set además de una lista", () => {
    expect(weekCells(week, { trainedDayKeys: new Set(["2026-09-15"]) })[1].trained).toBe(true);
  });

  it("una semana que cruza de mes numera bien los días", () => {
    expect(weekCells("2026-09-28").map((c) => c.day)).toEqual([28, 29, 30, 1, 2, 3, 4]);
  });
});

describe("weekRangeLabel", () => {
  it("dentro del mismo mes nombra el mes una sola vez", () => {
    expect(weekRangeLabel("2026-09-14")).toBe("14 – 20 sep");
  });

  it("al cruzar de mes nombra los dos", () => {
    expect(weekRangeLabel("2026-09-28")).toBe("28 sep – 4 oct");
  });

  it("al cruzar de año también", () => {
    expect(weekRangeLabel("2026-12-28")).toBe("28 dic – 3 ene");
  });
});

describe("trainedDaysInWeek", () => {
  it("cuenta solo los de esa semana", () => {
    const keys = ["2026-09-14", "2026-09-17", "2026-09-07"];
    expect(trainedDaysInWeek("2026-09-14", keys)).toBe(2);
  });

  it("sin entrenamientos es cero", () => {
    expect(trainedDaysInWeek("2026-09-14", [])).toBe(0);
  });
});

describe("isCurrentWeek", () => {
  it("reconoce la semana en curso desde cualquier día de ella", () => {
    expect(isCurrentWeek("2026-09-14", "2026-09-16")).toBe(true);
    expect(isCurrentWeek("2026-09-14", "2026-09-20")).toBe(true);
  });

  it("una semana pasada no es la actual", () => {
    expect(isCurrentWeek("2026-09-07", "2026-09-16")).toBe(false);
  });
});
