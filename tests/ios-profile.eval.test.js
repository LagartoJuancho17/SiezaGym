import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const profile = (file) => new URL(`../ios/SiezaGym/Features/Profile/${file}`, import.meta.url);
const read = (file) => readFileSync(profile(file), "utf8");

describe("Evaluación del Perfil en iOS", () => {
  it("los días entrenados y los músculos se ven directo, sin otro botón", () => {
    const screen = read("ProfileScreen.swift");
    expect(screen).toContain("GrillaDiasEntrenados(store: store)");
    expect(screen).toContain("RepartoMusculos(store: store");
    expect(screen).not.toMatch(/NavigationLink \{ (TrainedDaysScreen|MuscleVolumeScreen)/);
    // Las pantallas viejas ya no existen: nada queda detrás de un acceso.
    expect(existsSync(profile("TrainedDaysScreen.swift"))).toBe(false);
    expect(existsSync(profile("MuscleVolumeScreen.swift"))).toBe(false);
  });

  it("Tus datos y Tema son botones a pantallas propias", () => {
    const screen = read("ProfileScreen.swift");
    expect(screen).toContain("NavigationLink { DatosScreen(store: store) }");
    expect(screen).toContain("NavigationLink { TemasScreen() }");
    // El formulario y la grilla de temas ya no están en el Perfil.
    expect(screen).not.toContain("TextField(");
    expect(screen).not.toContain("ForEach(Theme.todos)");

    const datos = read("DatosScreen.swift");
    for (const parte of ['SectionLabel("Cuerpo")', 'SectionLabel("Entrenamiento")', "BodyMetrics.imc(", "store.updateProfile("]) {
      expect(datos).toContain(parte);
    }
    expect(read("TemasScreen.swift")).toContain("ForEach(Theme.todos)");
  });
});
