import { describe, expect, it } from "vitest";
import { visibleRoutines, monthSections, shouldGroupByMonth } from "@/lib/routines/filter";

const items = [
  { id: "a", name: "Fullbody A" },
  { id: "b", name: "Empuje pesado" },
  { id: "c", name: "Espalda y bíceps" },
];

describe("visibleRoutines", () => {
  it("sin búsqueda devuelve todo, en el orden recibido", () => {
    expect(visibleRoutines(items).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("filtra por nombre", () => {
    expect(visibleRoutines(items, "empuje").map((i) => i.id)).toEqual(["b"]);
  });

  it("ignora tildes y mayúsculas", () => {
    expect(visibleRoutines(items, "BICEPS").map((i) => i.id)).toEqual(["c"]);
    expect(visibleRoutines(items, "bíceps").map((i) => i.id)).toEqual(["c"]);
  });

  it("espacios en blanco no cuentan como búsqueda", () => {
    expect(visibleRoutines(items, "   ")).toHaveLength(3);
  });

  it("sin coincidencias devuelve vacío", () => {
    expect(visibleRoutines(items, "zzz")).toEqual([]);
  });

  it("sin items no rompe", () => {
    expect(visibleRoutines(undefined)).toEqual([]);
    expect(visibleRoutines(null, "algo")).toEqual([]);
  });
});

describe("monthSections", () => {
  const months = [
    {
      monthKey: "2026-09",
      label: "Septiembre 2026",
      weeks: [
        { week: 1, items: [items[1]] },
        { week: 2, items: [items[0], items[2]] },
      ],
    },
    { monthKey: "2026-08", label: "Agosto 2026", weeks: [{ week: 3, items: [] }] },
  ];

  it("junta las semanas de cada mes en una sola lista", () => {
    const sections = monthSections(months);
    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBe("Septiembre 2026");
    expect(sections[0].items.map((i) => i.id)).toEqual(["b", "a", "c"]);
  });

  it("descarta los meses que quedan vacíos", () => {
    expect(monthSections(months).map((s) => s.monthKey)).not.toContain("2026-08");
  });

  it("sin meses no rompe", () => {
    expect(monthSections(undefined)).toEqual([]);
    expect(monthSections([])).toEqual([]);
  });

  it("las rutinas sin fecha van al final y no se pierden", () => {
    // groupByMonthAndWeek las descarta; si no se agregan acá desaparecen de la
    // pantalla sin ningún aviso.
    const sections = monthSections(months, [{ id: "z", name: "Sin fecha" }]);
    expect(sections.at(-1).label).toBe("Sin fecha");
    expect(sections.at(-1).items.map((i) => i.id)).toEqual(["z"]);
  });
});

describe("shouldGroupByMonth", () => {
  it("agrupa solo cuando no hay búsqueda", () => {
    expect(shouldGroupByMonth("")).toBe(true);
    expect(shouldGroupByMonth("   ")).toBe(true);
    expect(shouldGroupByMonth("press")).toBe(false);
  });
});
