import { describe, expect, it } from "vitest";
import { getTemplate, listTemplates, templateDetail, templateRoutineInput } from "@/lib/routines/templates";
import { sanitizeExercises } from "@/lib/routines/routines";

describe("rutinas armadas en la web", () => {
  it("lee la misma lista que la app", () => {
    expect(listTemplates()).toHaveLength(10);
    expect(getTemplate("push").name).toBe("Push (empuje)");
    expect(getTemplate("no-existe")).toBeNull();
    expect(templateDetail(getTemplate("upper-body"))).toBe("Intermedio · 2 a 4 por semana");
  });

  it("al copiar deja afuera lo que no está en el catálogo y no arrastra el nombre", () => {
    const upper = getTemplate("upper-body");
    const ids = new Set(upper.exercises.map((e) => e.exerciseId).filter((id) => id !== "curl-con-barra"));
    const input = templateRoutineInput(upper, ids);
    expect(input.name).toBe("Upper body");
    expect(input.exercises.map((e) => e.exerciseId)).not.toContain("curl-con-barra");
    expect(input.exercises[0].nombre).toBeUndefined();
    // Pasa por la misma limpieza que cualquier rutina y conserva series, reps y bloques.
    const clean = sanitizeExercises(input.exercises);
    expect(clean[1]).toMatchObject({ exerciseId: "press-de-banca-con-barra", targetSets: 4, targetReps: 6, group: "Fuerza", groupColor: "amber", exerciseSource: "catalog" });
  });
});
