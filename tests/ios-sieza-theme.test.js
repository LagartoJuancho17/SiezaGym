import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const css = read("app/design2.css");
const tokens = read("ios/SiezaGymCompartido/ThemeTokens.swift");

function themeBlock(id) {
  const start = css.indexOf(`.d2[data-d2-theme="${id}"]`);
  expect(start).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("\n}", start));
}

describe("SIEZA en iOS", () => {
  it("genera los tokens nativos desde la paleta de marca", () => {
    execFileSync("node", ["ios/scripts/sync-theme.mjs", "--css", "app/design2.css", "--check"], {
      cwd: new URL(".", root),
    });
    expect(tokens).toContain('id: "sieza"');
    expect(tokens).toContain("plano: true");
    expect(tokens).toContain("solido: Color(r: 255, g: 87, b: 51, a: 1)");
  });

  it("el tema no usa blur, grano, manchas ni superficies translúcidas", () => {
    const block = themeBlock("sieza");
    expect(block).toContain("--d2-glass-filter: none;");
    expect(block).toContain("--d2-glass-filter-strong: none;");
    expect(block).toContain("--d2-glass-1: 1;");
    expect(block).toContain("--d2-noise-opacity: 0;");
    expect(block).toContain("--d2-ground: #0b0c0e;");
    expect(css).toContain('.d2[data-d2-theme="sieza"] .d2-blob { display: none; }');
    expect(read("ios/SiezaGym/DesignSystem/DesignSystem.swift")).toContain("if tema.plano {");
    expect(read("ios/SiezaGym/Features/Shared/BottomNav.swift")).toContain("if tema.plano {");
  });

  it("es el inicio nuevo sin borrar la preferencia guardada", () => {
    expect(read("ios/SiezaGymCompartido/Theme.swift")).toContain('$0.id == "sieza"');
    const store = read("ios/SiezaGym/DesignSystem/DesignSystem.swift");
    expect(store).toContain("UserDefaults.standard.string(forKey: Self.clave)");
    for (const previous of ["noche", "plata", "brasa", "pliegues", "electrico"]) {
      expect(tokens).toContain(`id: "${previous}"`);
    }
  });
});
