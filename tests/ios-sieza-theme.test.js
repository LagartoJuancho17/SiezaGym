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
    expect(tokens).toContain("solido: Color(r: 255, g: 50, b: 1, a: 1)");
    expect(tokens).toContain("solido2: Color(r: 255, g: 118, b: 1, a: 1)");
  });

  it("los naranjas de la marca son #FF3201 y #FF7601, con el degradado entre los dos", () => {
    const block = themeBlock("sieza");
    expect(block).toContain("--d2-ink: #ff3201;");
    expect(block).toContain("--d2-ink-2: #ff7601;");
    expect(block).toContain("--d2-ink-grad: linear-gradient(135deg, #ff3201 0%, #ff7601 100%);");
    expect(block).toContain("--d2-ring-fill: #ff3201;");
  });

  it("los otros temas no se pintan con degradado: su segundo color es el sólido", () => {
    expect(css).toMatch(/--d2-ink-2: var\(--d2-ink\);/);
    expect(css).toMatch(/--d2-ink-grad: var\(--d2-ink\);/);
    for (const id of ["noche", "plata", "brasa", "pliegues", "electrico"]) {
      expect(themeBlock(id)).not.toContain("--d2-ink-grad:");
    }
    // En iOS, cada tema que no es SIEZA repite el sólido como segundo color.
    const pares = [
      ...tokens.matchAll(/solido: (Color\([^)]*\)),\n\s*sobreSolido: Color\([^)]*\),\n\s*solido2: (Color\([^)]*\))/g),
    ];
    expect(pares).toHaveLength(6);
    expect(pares.filter(([, a, b]) => a !== b)).toHaveLength(1);
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
