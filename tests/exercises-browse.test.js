import { describe, expect, it } from "vitest";
import {
  MUSCLE_REGIONS,
  primaryMuscleOf,
  primaryMuscleLabel,
  filterExercises,
  countByRegion,
} from "@/lib/exercises/browse";
import { MUSCLE_GROUPS } from "@/lib/exercises/constants";

const press = {
  id: "press-banca",
  nameEs: "Press de banca con barra",
  nameEn: "Barbell bench press",
  muscleWeights: { pecho: 0.6, triceps: 0.25, deltoideAnterior: 0.15 },
};
const dominadas = {
  id: "dominadas",
  nameEs: "Dominadas",
  nameEn: "Pull-ups",
  muscleWeights: { dorsal: 0.7, biceps: 0.3 },
};
const sentadilla = {
  id: "sentadilla",
  nameEs: "Sentadilla con barra",
  nameEn: "Barbell squat",
  muscleWeights: { cuadriceps: 0.6, gluteo: 0.3, lumbar: 0.1 },
};
const catalog = [press, dominadas, sentadilla];

describe("MUSCLE_REGIONS", () => {
  it("cubre los dieciséis grupos musculares sin repetir ninguno", () => {
    // Si un grupo queda afuera, ningún filtro encuentra sus ejercicios.
    const cubiertos = MUSCLE_REGIONS.flatMap((region) => region.muscles);
    expect([...cubiertos].sort()).toEqual([...MUSCLE_GROUPS].sort());
  });

  it("son seis, para que entren en una fila de teléfono", () => {
    expect(MUSCLE_REGIONS).toHaveLength(6);
  });
});

describe("primaryMuscleOf", () => {
  it("devuelve el músculo de mayor peso", () => {
    expect(primaryMuscleOf(press)).toBe("pecho");
    expect(primaryMuscleOf(dominadas)).toBe("dorsal");
  });

  it("lo etiqueta en castellano", () => {
    expect(primaryMuscleLabel(sentadilla)).toBe("Cuádriceps");
  });

  it("un ejercicio sin pesos no rompe", () => {
    expect(primaryMuscleOf({})).toBe(null);
    expect(primaryMuscleLabel({ muscleWeights: {} })).toBe(null);
  });
});

describe("filterExercises", () => {
  it("sin filtros devuelve todo", () => {
    expect(filterExercises(catalog)).toHaveLength(3);
  });

  it("busca por nombre en castellano", () => {
    expect(filterExercises(catalog, { query: "sentadilla" }).map((e) => e.id)).toEqual(["sentadilla"]);
  });

  it("también encuentra por el nombre en inglés", () => {
    expect(filterExercises(catalog, { query: "pull-ups" }).map((e) => e.id)).toEqual(["dominadas"]);
  });

  it("ignora tildes y mayúsculas", () => {
    expect(filterExercises(catalog, { query: "CUADRICEPS" })).toEqual([]);
    expect(filterExercises(catalog, { query: "Press" }).map((e) => e.id)).toEqual(["press-banca"]);
  });

  it("filtra por región muscular", () => {
    expect(filterExercises(catalog, { region: "pecho" }).map((e) => e.id)).toEqual(["press-banca"]);
    expect(filterExercises(catalog, { region: "piernas" }).map((e) => e.id)).toEqual(["sentadilla"]);
  });

  it("una región incluye a todos sus músculos, no solo al principal", () => {
    // Las dominadas trabajan bíceps de forma secundaria y tienen que aparecer
    // al filtrar por brazos.
    expect(filterExercises(catalog, { region: "brazos" }).map((e) => e.id)).toEqual([
      "press-banca",
      "dominadas",
    ]);
  });

  it("combina región y búsqueda", () => {
    expect(filterExercises(catalog, { region: "brazos", query: "domin" }).map((e) => e.id)).toEqual(["dominadas"]);
    expect(filterExercises(catalog, { region: "core", query: "domin" })).toEqual([]);
  });

  it("una región inventada no esconde nada", () => {
    expect(filterExercises(catalog, { region: "noexiste" })).toHaveLength(3);
  });

  it("sin catálogo no rompe", () => {
    expect(filterExercises(undefined)).toEqual([]);
    expect(filterExercises([], { query: "algo" })).toEqual([]);
  });
});

describe("countByRegion", () => {
  it("cuenta por región, contando los músculos secundarios", () => {
    const counts = countByRegion(catalog);
    expect(counts.pecho).toBe(1);
    expect(counts.brazos).toBe(2);
    expect(counts.core).toBe(1);
    expect(counts.hombros).toBe(1);
  });
});
