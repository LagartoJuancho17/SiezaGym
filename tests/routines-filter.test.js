import { describe, expect, it } from "vitest";
import {
  visibleRoutines,
  countByKind,
  shouldGroupByMonth,
  ROUTINE_KINDS,
} from "@/lib/routines/filter";

const items = [
  { id: "a", name: "Fullbody A", isAssigned: false },
  { id: "b", name: "Empuje pesado", isAssigned: true },
  { id: "c", name: "Espalda y bíceps", isAssigned: false },
];

describe("visibleRoutines", () => {
  it("sin filtros devuelve todo, en el orden recibido", () => {
    expect(visibleRoutines(items).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("filtra por nombre", () => {
    expect(visibleRoutines(items, { query: "empuje" }).map((i) => i.id)).toEqual(["b"]);
  });

  it("la búsqueda ignora tildes y mayúsculas", () => {
    expect(visibleRoutines(items, { query: "BICEPS" }).map((i) => i.id)).toEqual(["c"]);
    expect(visibleRoutines(items, { query: "bíceps" }).map((i) => i.id)).toEqual(["c"]);
  });

  it("separa las propias de las que asignó el coach", () => {
    expect(visibleRoutines(items, { kind: "propias" }).map((i) => i.id)).toEqual(["a", "c"]);
    expect(visibleRoutines(items, { kind: "asignadas" }).map((i) => i.id)).toEqual(["b"]);
  });

  it("combina solapa y búsqueda", () => {
    expect(visibleRoutines(items, { kind: "propias", query: "full" }).map((i) => i.id)).toEqual(["a"]);
    expect(visibleRoutines(items, { kind: "asignadas", query: "full" })).toEqual([]);
  });

  it("una solapa inventada no esconde nada", () => {
    expect(visibleRoutines(items, { kind: "noexiste" })).toHaveLength(3);
  });

  it("sin items no rompe", () => {
    expect(visibleRoutines(undefined)).toEqual([]);
    expect(visibleRoutines([], { query: "algo" })).toEqual([]);
  });

  it("espacios en blanco no cuentan como búsqueda", () => {
    expect(visibleRoutines(items, { query: "   " })).toHaveLength(3);
  });
});

describe("countByKind", () => {
  it("cuenta cada tipo", () => {
    expect(countByKind(items)).toEqual({ todas: 3, propias: 2, asignadas: 1 });
  });

  it("sin items da cero en todo", () => {
    expect(countByKind([])).toEqual({ todas: 0, propias: 0, asignadas: 0 });
  });
});

describe("shouldGroupByMonth", () => {
  it("agrupa por mes solo cuando no hay filtro", () => {
    expect(shouldGroupByMonth({})).toBe(true);
    expect(shouldGroupByMonth({ query: "", kind: "todas" })).toBe(true);
  });

  it("con búsqueda o solapa activa muestra lista plana", () => {
    // Repartir tres resultados entre acordeones de mes y semana los esconde.
    expect(shouldGroupByMonth({ query: "press" })).toBe(false);
    expect(shouldGroupByMonth({ kind: "asignadas" })).toBe(false);
  });
});

describe("ROUTINE_KINDS", () => {
  it("son las tres solapas de la pantalla", () => {
    expect(ROUTINE_KINDS).toEqual(["todas", "propias", "asignadas"]);
  });
});
