import { describe, it, expect } from "vitest";
import {
  referenceDateOf,
  weekOfMonth,
  monthLabel,
  groupByMonthAndWeek,
  itemsWithoutDate,
} from "@/lib/routines/schedule";

// Parser de prueba: toma el ISO tal cual, sin zona horaria de por medio.
function toParts(iso) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

describe("referenceDateOf", () => {
  it("una asignación se ubica por cuándo la asignaron", () => {
    expect(referenceDateOf({ assignedAt: "2026-09-10", createdAt: "2026-01-01" })).toBe("2026-09-10");
  });

  it("una rutina propia, por cuándo se creó", () => {
    expect(referenceDateOf({ createdAt: "2026-09-03" })).toBe("2026-09-03");
  });

  it("sin ninguna fecha devuelve null", () => {
    expect(referenceDateOf({ name: "Empuje" })).toBe(null);
  });
});

describe("weekOfMonth", () => {
  it("corta de a 7 días", () => {
    expect(weekOfMonth(1)).toBe(1);
    expect(weekOfMonth(7)).toBe(1);
    expect(weekOfMonth(8)).toBe(2);
    expect(weekOfMonth(28)).toBe(4);
    expect(weekOfMonth(31)).toBe(5);
  });
});

describe("monthLabel", () => {
  it("arma el título en español", () => {
    expect(monthLabel(2026, 8)).toBe("Septiembre 2026");
  });
});

describe("groupByMonthAndWeek", () => {
  const items = [
    { id: "a", createdAt: "2026-09-02" },
    { id: "b", createdAt: "2026-09-06" },
    { id: "c", assignedAt: "2026-09-09" },
    { id: "d", createdAt: "2026-08-20" },
  ];

  it("agrupa por mes y por semana del mes", () => {
    const groups = groupByMonthAndWeek(items, toParts);

    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe("Septiembre 2026");
    expect(groups[0].total).toBe(3);
    expect(groups[0].weeks.map((w) => w.label)).toEqual(["Semana 1", "Semana 2"]);
    expect(groups[0].weeks[0].items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(groups[0].weeks[1].items.map((i) => i.id)).toEqual(["c"]);
  });

  it("los meses van del más nuevo al más viejo", () => {
    const groups = groupByMonthAndWeek(items, toParts);
    expect(groups.map((g) => g.monthKey)).toEqual(["2026-09", "2026-08"]);
  });

  it("no inventa semanas vacías", () => {
    const groups = groupByMonthAndWeek([{ id: "x", createdAt: "2026-09-25" }], toParts);
    expect(groups[0].weeks).toHaveLength(1);
    expect(groups[0].weeks[0].label).toBe("Semana 4");
  });

  it("ignora los que no tienen fecha", () => {
    const groups = groupByMonthAndWeek([{ id: "sinfecha" }], toParts);
    expect(groups).toEqual([]);
  });

  it("sin items no rompe", () => {
    expect(groupByMonthAndWeek([], toParts)).toEqual([]);
    expect(groupByMonthAndWeek(undefined, toParts)).toEqual([]);
  });
});

describe("itemsWithoutDate", () => {
  it("los rescata para no perderlos de la pantalla", () => {
    const items = [{ id: "a", createdAt: "2026-09-02" }, { id: "b" }];
    expect(itemsWithoutDate(items).map((i) => i.id)).toEqual(["b"]);
  });
});
