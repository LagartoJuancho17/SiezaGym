import { describe, expect, it } from "vitest";
import { hasMenu, routineMenuActions } from "@/lib/routines/menu";

const propia = { id: "a", name: "Empuje", isAssigned: false, showOnHome: true };
const asignada = { id: "b", name: "Del coach", isAssigned: true };

describe("routineMenuActions", () => {
  it("ofrece editar, portada, duplicar y eliminar", () => {
    expect(routineMenuActions(propia).map((a) => a.id)).toEqual([
      "editar",
      "portada",
      "duplicar",
      "eliminar",
    ]);
  });

  it("eliminar va última y marcada, porque es la que no se deshace", () => {
    const acciones = routineMenuActions(propia);
    const ultima = acciones[acciones.length - 1];
    expect(ultima.id).toBe("eliminar");
    expect(ultima.danger).toBe(true);
    expect(acciones.filter((a) => a.danger)).toHaveLength(1);
  });

  it("el texto de portada dice lo que va a pasar, no cómo está", () => {
    expect(routineMenuActions(propia).find((a) => a.id === "portada").label).toBe(
      "Quitar de la portada",
    );
    expect(
      routineMenuActions({ ...propia, showOnHome: false }).find((a) => a.id === "portada").label,
    ).toBe("Mostrar en la portada");
  });

  it("una rutina asignada no ofrece ninguna", () => {
    // Es la copia del entrenador: editarla o borrarla no es del alumno.
    expect(routineMenuActions(asignada)).toEqual([]);
    expect(hasMenu(asignada)).toBe(false);
    expect(hasMenu(propia)).toBe(true);
  });

  it("aguanta que no haya rutina", () => {
    expect(routineMenuActions(null)).toEqual([]);
    expect(hasMenu(undefined)).toBe(false);
  });
});
