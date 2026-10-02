import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../ios/SiezaGym/Resources/Assets.xcassets/", import.meta.url);
const names = ["OnboardingRoutines", "OnboardingWorkout", "OnboardingProgress"];

describe("Evaluación de recursos y recorrido del onboarding", () => {
  it("tiene tres fotos locales, verticales, distintas y livianas", () => {
    const hashes = names.map((name) => {
      const folder = new URL(`${name}.imageset/`, root);
      const catalog = JSON.parse(readFileSync(new URL("Contents.json", folder), "utf8"));
      const file = new URL(catalog.images[0].filename, folder);
      const data = readFileSync(file);
      const metadata = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", file.pathname], { encoding: "utf8" });
      const width = Number(metadata.match(/pixelWidth: (\d+)/)?.[1]);
      const height = Number(metadata.match(/pixelHeight: (\d+)/)?.[1]);

      expect(catalog.images).toHaveLength(1);
      expect(width).toBeGreaterThanOrEqual(900);
      expect(height / width).toBeGreaterThan(1.4);
      expect(statSync(file).size).toBeLessThan(600_000);
      return createHash("sha256").update(data).digest("hex");
    });
    expect(new Set(hashes).size).toBe(3);
  });

  it("reserva las fotos en LFS y conecta el recorrido antes del login", () => {
    const attrs = readFileSync(new URL("../.gitattributes", import.meta.url), "utf8");
    const rootView = readFileSync(new URL("../ios/SiezaGym/Features/Shared/RootView.swift", import.meta.url), "utf8");
    const onboarding = readFileSync(new URL("../ios/SiezaGym/Features/Onboarding/OnboardingView.swift", import.meta.url), "utf8");

    expect(attrs).toContain("Onboarding*.imageset/*.jpg filter=lfs");
    expect(rootView.indexOf("if !onboardingCompleted")).toBeLessThan(rootView.indexOf("switch auth.state"));
    expect(rootView).toContain("OnboardingView { onboardingCompleted = true }");
    expect(onboarding).toContain('Button("Omitir", action: onComplete)');
    expect(onboarding).toContain('flow.isLastPage ? "Empezar" : "Continuar"');
  });

  it("muestra las fotos teñidas con los naranjas de la marca, no en gris", () => {
    const onboarding = readFileSync(new URL("../ios/SiezaGym/Features/Onboarding/OnboardingView.swift", import.meta.url), "utf8");
    const tono = readFileSync(new URL("../ios/SiezaGym/DesignSystem/TonoMarca.swift", import.meta.url), "utf8");
    const shader = readFileSync(new URL("../ios/SiezaGym/DesignSystem/TonoMarca.metal", import.meta.url), "utf8");

    expect(onboarding).toMatch(/Image\(flow\.page\.imageName\)[\s\S]*?\.tonoMarca\(\)/);
    // Brasa #FF3201 y naranja #FF7601 son paradas del mapa.
    expect(tono).toContain("(1.000, 50.0 / 255, 1.0 / 255)");
    expect(tono).toContain("(1.000, 118.0 / 255, 1.0 / 255)");
    expect(shader).toContain("[[ stitchable ]] half4 tonoMarca");
    // El botón principal es Brasa en todas las pantallas, no gris.
    expect(onboarding).not.toContain("brand.bordeFuerte, in: .capsule");
  });
});
