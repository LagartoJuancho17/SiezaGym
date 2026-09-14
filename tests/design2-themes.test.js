import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEMES, DEFAULT_THEME, isValidTheme } from "@/components/design2/themes";

const css = readFileSync(new URL("../app/design2.css", import.meta.url), "utf8");
// Sin comentarios: varios explican justamente los patrones que se prohíben más
// abajo, y si no se sacan el propio comentario hace fallar la comprobación.
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, "");
const themeRootSource = readFileSync(
  new URL("../components/design2/ThemeRoot.js", import.meta.url),
  "utf8",
);

const componentDir = new URL("../components/design2/", import.meta.url);
const componentSources = readdirSync(componentDir)
  .filter((file) => file.endsWith(".js"))
  .map((file) => [file, readFileSync(new URL(file, componentDir), "utf8")]);

describe("Registro de temas", () => {
  it("cada tema del registro tiene su bloque de variables en el CSS", () => {
    for (const theme of THEMES) {
      expect(css).toContain(`.d2[data-d2-theme="${theme.id}"]`);
    }
  });

  it("el tema por defecto existe", () => {
    expect(isValidTheme(DEFAULT_THEME)).toBe(true);
  });

  it("un tema inventado no pasa la validación", () => {
    expect(isValidTheme("noexiste")).toBe(false);
    expect(isValidTheme(null)).toBe(false);
  });

  it("los temas oscuros invierten el sólido para que el botón no desaparezca", () => {
    // Un FAB negro sobre fondo negro no se ve: noche y brasa tienen que
    // redefinir el par ink / on-ink.
    for (const id of ["noche", "brasa"]) {
      const block = css.slice(css.indexOf(`.d2[data-d2-theme="${id}"]`));
      const body = block.slice(0, block.indexOf("}"));
      expect(body).toContain("--d2-ink:");
      expect(body).toContain("--d2-on-ink:");
    }
  });
});

describe("El vidrio llega al navegador", () => {
  it("no mete var() adentro de blur(): Lightning CSS descarta la regla entera", () => {
    // Tailwind v4 compila con Lightning CSS, que no sabe parsear
    // `blur(var(--x))` y borra la declaración sin avisar. El resultado es que
    // el backdrop-filter no existe y el vidrio deja de esmerilar, sin ningún
    // error visible. El filtro va entero en una variable.
    expect(cssCode).not.toMatch(/blur\(\s*(var|calc)\(/);
    expect(css).toContain("backdrop-filter: var(--d2-glass-filter)");
  });

  it("cada tema define su propio filtro", () => {
    for (const theme of THEMES) {
      const block = css.slice(css.indexOf(`.d2[data-d2-theme="${theme.id}"]`));
      expect(block.slice(0, block.indexOf("}"))).toContain("--d2-glass-filter:");
    }
  });
});

describe("Los componentes no escapan al tema", () => {
  it("ninguno fija un color a mano en vez de usar una variable", () => {
    // Si un componente vuelve a poner text-white o un rgba suelto, deja de
    // responder al tema y se rompe al cambiar de fondo claro a oscuro.
    const offenders = componentSources
      .filter(([file]) => file !== "Icons.js")
      .filter(([, source]) => /text-white\b|bg-white\b|rgba\(\s*255\s*,\s*255\s*,\s*255/.test(source))
      .map(([file]) => file);

    expect(offenders).toEqual([]);
  });

  it("el grano y el fondo salen de variables, no de valores escritos", () => {
    const backdrop = componentSources.find(([file]) => file === "Backdrop.js")[1];
    expect(backdrop).toContain("var(--d2-blob-1)");
    expect(backdrop).toContain("d2-noise");
  });
});

describe("ThemeRoot", () => {
  it("sincroniza el tema como estado externo, no con estado local en un efecto", () => {
    // El tema vive en localStorage, fuera del árbol de React. Leerlo con
    // useState + useEffect obliga a un setState dentro del efecto (React 19 lo
    // rechaza) y hace que el primer render del cliente no coincida con el del
    // servidor.
    expect(themeRootSource).toContain("useSyncExternalStore");
    // Se mira el import y no el texto: "useEffect" aparece en el comentario
    // que explica por qué no se usa.
    const imports = themeRootSource.slice(0, themeRootSource.indexOf(";"));
    expect(imports).not.toContain("useEffect");
  });

  it("le da al servidor un tema fijo para que la hidratación coincida", () => {
    expect(themeRootSource).toContain("getServerSnapshot");
    const snapshot = themeRootSource.slice(themeRootSource.indexOf("getServerSnapshot"));
    expect(snapshot.slice(0, snapshot.indexOf("}"))).toContain("DEFAULT_THEME");
  });

  it("aguanta que localStorage no esté disponible", () => {
    // Ventana privada o cookies bloqueadas: acceder tira, no devuelve null.
    expect(themeRootSource.match(/catch/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("se entera si cambian el tema desde otra pestaña", () => {
    expect(themeRootSource).toContain('addEventListener("storage"');
    expect(themeRootSource).toContain('removeEventListener("storage"');
  });
});
