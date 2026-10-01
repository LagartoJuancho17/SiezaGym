import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const assets = new URL("../ios/SiezaGym/Resources/Assets.xcassets/", import.meta.url);
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("Evaluación del onboarding", () => {
  it("es solo color: no usa fotos ni quedan fotos sin usar en el proyecto", () => {
    const onboarding = read("../ios/SiezaGym/Features/Onboarding/OnboardingView.swift");
    const flow = read("../ios/SiezaGym/Features/Onboarding/OnboardingFlow.swift");
    expect(onboarding).not.toMatch(/Image\((flow\.page\.)?imageName\)/);
    expect(flow).not.toContain("imageName");
    for (const name of ["OnboardingRoutines", "OnboardingWorkout", "OnboardingProgress"]) {
      expect(existsSync(new URL(`${name}.imageset/`, assets)), name).toBe(false);
    }
    // El arte: degradado de los dos naranjas de la marca.
    expect(onboarding).toContain("OnboardingColor.brasa, OnboardingColor.naranja");
  });

  it("conecta el recorrido antes del login", () => {
    const rootView = read("../ios/SiezaGym/Features/Shared/RootView.swift");
    const onboarding = read("../ios/SiezaGym/Features/Onboarding/OnboardingView.swift");

    expect(rootView.indexOf("if !onboardingCompleted")).toBeLessThan(rootView.indexOf("switch auth.state"));
    expect(rootView).toContain("OnboardingView { onboardingCompleted = true }");
    expect(onboarding).toContain('Button("Omitir", action: onComplete)');
    expect(onboarding).toContain('flow.isLastPage ? "Empezar" : "Continuar"');
  });
});
