import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isRedesigned } from "@/lib/nav/redesigned";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("Rutas rediseñadas", () => {
  it("reconoce las pantallas ya rediseñadas", () => {
    for (const path of ["/", "/rutinas", "/rutinas/nueva", "/perfil", "/progreso"]) {
      expect(isRedesigned(path)).toBe(true);
    }
  });

  it("reconoce el detalle de una rutina, con cualquier id", () => {
    expect(isRedesigned("/rutinas/ibOocKMG3dz2Qqpj1dkO")).toBe(true);
    expect(isRedesigned("/rutinas/asg-123")).toBe(true);
  });

  it("reconoce la edición de una rutina", () => {
    expect(isRedesigned("/rutinas/ibOocKMG3dz2Qqpj1dkO/editar")).toBe(true);
  });

  it("no aplica el chrome privado a autenticación", () => {
    for (const path of ["/login", "/register"]) {
      expect(isRedesigned(path)).toBe(false);
    }
  });

  it("cubre historial, progreso y todo el dashboard sin barras duplicadas", () => {
    for (const path of ["/historial", "/historial/sesion-1", "/progreso/press-banca", "/dashboard", "/dashboard/items", "/dashboard/items/item-1/edit", "/dashboard/coach", "/dashboard/coach/alumnos/student-1"]) {
      expect(isRedesigned(path)).toBe(true);
    }
  });

  it("no se come una ruta más profunda que no existe todavía", () => {
    // /rutinas/<id>/<algo> distinto de editar tiene que seguir con chrome viejo
    // hasta que se rediseñe, en vez de quedar sin ninguna navegación.
    expect(isRedesigned("/rutinas/abc/historial")).toBe(false);
  });

  it("aguanta un pathname vacío", () => {
    expect(isRedesigned(null)).toBe(true);
    expect(isRedesigned("")).toBe(true);
  });
});

describe("LegacyChrome", () => {
  it("decide con el módulo probado y no con una lista propia", () => {
    const source = read("components/nav/LegacyChrome.js");
    expect(source).toContain('from "@/lib/nav/redesigned"');
    expect(source).toContain("isRedesigned(pathname)");
  });
});
