import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const source = (path) => readFileSync(new URL(path, root), "utf8");

describe("coach dashboard UX acceptance", () => {
  it("keeps actionable routes, real-data labels and the invitation flow", () => {
    const dashboard = source("components/coach/CoachDashboardClient.js");
    const nav = source("components/coach/CoachPageShell.js");
    for (const text of ["Alumnos vinculados", "Planes asignados", "Con actividad registrada", "Buscar por nombre o correo", "Agregar alumno", "Última sesión registrada por cada plan."]) {
      expect(dashboard).toContain(text);
    }
    expect(dashboard).toContain("/dashboard/coach/alumnos/");
    expect(nav).toContain('href: "/dashboard/coach#alumnos"');
    expect(nav).toContain('href: "/rutinas"');
  });

  it("provides loading, error recovery, keyboard focus and reduced-motion states", () => {
    expect(source("app/dashboard/coach/loading.js")).toContain('role="status"');
    expect(source("app/dashboard/coach/error.js")).toContain("onClick={reset}");
    const css = source("components/coach/coach-workspace.css");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("coach-coverage-reveal");
  });
});
