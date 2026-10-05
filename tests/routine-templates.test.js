import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EXERCISES } from "../scripts/seed/exercises-data.mjs";
import { slugify } from "../lib/text/normalize.js";

// Las rutinas armadas que ofrece la app de iOS. Si un id no existe en el
// catálogo, la rutina se copia sin ese ejercicio y nadie se entera: lo frena
// esta prueba.
const data = JSON.parse(
  readFileSync(new URL("../contracts/rutinas-armadas.json", import.meta.url), "utf8"),
);
const catalog = new Map(EXERCISES.map((exercise) => [slugify(exercise.nameEs), exercise]));
// Los siete colores que iOS conoce por nombre (GroupColor); los demás caen en teal.
const IOS_COLORS = new Set(["teal", "amber", "blue", "purple", "rose", "emerald", "indigo"]);

describe("rutinas armadas", () => {
  it("son 10, con ids únicos y lo que pide la ficha", () => {
    expect(data.rutinas).toHaveLength(10);
    expect(new Set(data.rutinas.map((r) => r.id)).size).toBe(10);
    for (const r of data.rutinas) {
      expect(r.name, r.id).toBeTruthy();
      expect(r.descripcion, r.id).toBeTruthy();
      expect(r.exercises.length, r.id).toBeGreaterThanOrEqual(5);
    }
  });

  it("cubren upper, lower, full body, push, pull y piernas", () => {
    const ids = data.rutinas.map((r) => r.id);
    for (const id of ["upper-body", "lower-body", "full-body-a", "full-body-b", "push", "pull", "piernas"]) {
      expect(ids).toContain(id);
    }
  });

  it("cada ejercicio existe en el catálogo, sin repetirse en la misma rutina", () => {
    for (const r of data.rutinas) {
      const ids = r.exercises.map((e) => e.exerciseId);
      expect(new Set(ids).size, r.id).toBe(ids.length);
      for (const id of ids) expect(catalog.has(id), `${r.id}: ${id}`).toBe(true);
      // El nombre guardado es el del catálogo (se muestra si falta el ejercicio).
      for (const e of r.exercises) expect(e.nombre, `${r.id}: ${e.exerciseId}`).toBe(catalog.get(e.exerciseId).nameEs);
    }
  });

  it("series, reps y colores válidos; los de tiempo en segundos", () => {
    for (const r of data.rutinas) {
      for (const e of r.exercises) {
        const label = `${r.id}: ${e.exerciseId}`;
        expect(e.targetSets, label).toBeGreaterThanOrEqual(1);
        expect(e.targetSets, label).toBeLessThanOrEqual(6);
        expect(IOS_COLORS.has(e.groupColor), label).toBe(true);
        const timed = catalog.get(e.exerciseId).registrationType === "tiempo";
        if (timed) expect(e.targetReps, label).toBeGreaterThanOrEqual(15);
        else expect(e.targetReps, label).toBeLessThanOrEqual(25);
      }
    }
  });
});
