import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../ios/SiezaGym/${path}`, import.meta.url), "utf8");

describe("Evaluación de Conocerte (iOS)", () => {
  it("se abre después del login, una vez por cuenta, y se puede omitir", () => {
    const root = read("Features/Shared/RootView.swift");
    const view = read("Features/Onboarding/ConocerteView.swift");
    expect(root).toContain("Conocerte.debeMostrar(perfil: store.profile, yaVisto: visto)");
    expect(root).toContain("forKey: Conocerte.claveVisto(uid: store.uid)");
    expect(root).toMatch(/fullScreenCover\(isPresented: \$conocerte\)[\s\S]*ConocerteView\(store: store\)/);
    expect(view).toContain('Button("Omitir", action: onTerminar)');
  });

  it("pide objetivo, frecuencia y peso, muestra la meta y la guarda en el perfil", () => {
    const view = read("Features/Onboarding/ConocerteView.swift");
    const flow = read("Features/Onboarding/ConocerteFlow.swift");
    for (const texto of ["¿Qué buscás?", "¿Cuánto entrenás?", "Tu peso actual", "Objetivo principal", "Frecuencia", "Peso actual", "Meta estimada:"]) {
      expect(view).toContain(texto);
    }
    expect(view).toContain('Text("Paso \\(recorrido.paso)/\\(Conocerte.pasos)")');
    expect(view).toContain("await store.updateProfile(campos)");
    // La meta usa la misma cuenta de calorías que Inicio.
    expect(flow).toContain("HomeMetrics.resistanceMET");
    for (const campo of ["trainingGoal", "trainingDaysPerWeek", "weeklyCalorieGoalKcal"]) {
      expect(flow).toContain(`campos["${campo}"]`);
    }
  });

  it("objetivo y días se pueden cambiar después en Tus datos", () => {
    const datos = read("Features/Profile/DatosScreen.swift");
    expect(datos).toContain('opciones("Objetivo", TrainingGoal.allCases');
    expect(datos).toContain('campos["trainingGoal"]');
    expect(datos).toContain('campos["trainingDaysPerWeek"]');
  });
});
