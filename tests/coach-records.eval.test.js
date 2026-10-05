import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("Evaluación: el coach ve pesos y PR del alumno", () => {
  it("la app: récords en la ficha y cada entrenamiento serie por serie con PR", () => {
    const alumno = read("ios/SiezaGym/Features/Coach/CoachAlumnoScreen.swift");
    expect(alumno).toContain('SectionLabel("Récords")');
    expect(alumno).toContain("CoachSesionScreen(sesion: sesion, nombres: detalle.exerciseNames)");
    const sesion = read("ios/SiezaGym/Features/Coach/CoachSesionScreen.swift");
    expect(sesion).toContain("serie.texto");
    expect(sesion).toContain("serie.pr");
    expect(sesion).toContain("serie.failed");
  });

  it("la API y la web usan el mismo cálculo de récords sobre toda la historia", () => {
    for (const path of ["app/api/coach/alumnos/[id]/route.js", "app/dashboard/coach/alumnos/[studentId]/page.js"]) {
      const source = read(path);
      expect(source, path).toContain("markRecordSets(history)");
      expect(source, path).toContain("personalRecords(history)");
    }
    expect(read("components/coach/StudentDetailView.js")).toContain("🏆 PR");
  });
});
