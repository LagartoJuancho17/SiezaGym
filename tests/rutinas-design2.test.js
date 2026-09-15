import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const pageSource = read("app/(app)/rutinas/page.js");
const listSource = read("components/design2/RoutineList.js");
const chromeSource = read("components/nav/LegacyChrome.js");

describe("Pantalla de Rutinas", () => {
  it("usa los componentes de design2 y ninguno de la pantalla vieja", () => {
    for (const component of ["<ThemeRoot", "<Backdrop", "<RoutineList", "<TabBar"]) {
      expect(pageSource).toContain(component);
    }
    for (const legacy of ["RoutinesHero", "RoutineSchedule", "RoutineRow"]) {
      expect(pageSource).not.toContain(legacy);
    }
  });

  it("está declarada como rediseñada para que no le entre el chrome viejo", () => {
    expect(chromeSource).toContain('"/rutinas"');
  });

  it("solo la lista está rediseñada, no el detalle ni el alta", () => {
    // La coincidencia es exacta: /rutinas/algo sigue con el diseño anterior.
    expect(chromeSource).toContain("REDESIGNED.includes(pathname)");
  });

  it("no cuenta los ejercicios a ojo: sale del largo real de la rutina", () => {
    expect(pageSource).toContain("exerciseCount: item.exercises?.length || 0");
  });

  it("distingue propias de asignadas por origen, no por nombre", () => {
    expect(pageSource).toContain('`${isAssigned ? "asg" : "own"}-${item.id}`');
  });

  it("pasa las rutinas sin fecha para que no desaparezcan", () => {
    // groupByMonthAndWeek descarta lo que no tiene fecha.
    expect(pageSource).toContain("itemsWithoutDate");
    expect(pageSource).toContain("undated={undated}");
  });
});

describe("Lista de rutinas", () => {
  it("se mantiene simple: sin solapas ni acordeones anidados", () => {
    // La versión anterior apilaba título, subtítulo, titular, buscador, chips y
    // dos niveles desplegables antes de mostrar una rutina.
    for (const descartado of ["aria-expanded", "d2-chip", "Propias", "Asignadas"]) {
      expect(listSource).not.toContain(descartado);
    }
  });

  it("filtra en el cliente, sin volver al servidor", () => {
    expect(listSource).toContain("useMemo");
    expect(listSource).not.toContain("fetch(");
  });

  it("distingue no tener rutinas de que la búsqueda no encuentre nada", () => {
    expect(listSource).toContain("Todavía no tenés rutinas.");
    expect(listSource).toContain("Ninguna rutina coincide.");
  });

  it("esconde los meses cuando hay una búsqueda en curso", () => {
    expect(listSource).toContain("shouldGroupByMonth");
  });

  it("lleva al detalle de cada rutina", () => {
    expect(listSource).toContain("href={`/rutinas/${routine.id}`}");
  });

  it("concuerda singular y plural", () => {
    expect(listSource).toContain('exercises === 1 ? "ejercicio" : "ejercicios"');
    expect(listSource).toContain('routine.totalSets === 1 ? "serie" : "series"');
  });

  it("no fija colores a mano: todo sale del tema", () => {
    expect(listSource).not.toMatch(/text-white\b|bg-white\b|#[0-9a-fA-F]{6}/);
  });
});
