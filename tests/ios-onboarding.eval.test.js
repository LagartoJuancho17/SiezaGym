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

  it("el arte lo dibuja p5 a la resolución real, sin red y sin grano de 1 punto", () => {
    const onboarding = read("../ios/SiezaGym/Features/Onboarding/OnboardingView.swift");
    const html = read("../ios/SiezaGym/Resources/ArteOnboarding/onboarding-arte.html");
    const boceto = read("../ios/SiezaGym/Resources/ArteOnboarding/onboarding-arte.js");

    expect(onboarding).toContain("ArteP5(pagina: flow.page.rawValue");
    // El grano viejo era un rectángulo de 1x1 punto (3x3 píxeles): pixelado.
    expect(onboarding).not.toMatch(/width: 1, height: 1/);
    // Densidad real del dispositivo y el grano calculado por píxel en el shader.
    expect(boceto).toMatch(/pixelDensity\(Math\.min\(raiz\.devicePixelRatio/);
    expect(boceto).toContain("gl_FragCoord");
    // Todo local: ningún script ni recurso de internet.
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).toContain('<script src="p5.min.js"></script>');
    expect(existsSync(new URL("../ios/SiezaGym/Resources/ArteOnboarding/p5-license.txt", import.meta.url))).toBe(true);
    // Con alpha 0 WebKit pausa requestAnimationFrame: p5 no dibuja y nunca
    // avisa "listo" (pasó: solo se veía el brillo nativo).
    const arteP5 = read("../ios/SiezaGym/Features/Onboarding/ArteP5.swift");
    expect(arteP5).not.toMatch(/vista\.alpha = 0\s*$/m);
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
