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
const themeStoreSource = readFileSync(
  new URL("../components/design2/themeStore.js", import.meta.url),
  "utf8",
);
const pickerSource = readFileSync(
  new URL("../components/design2/ThemePicker.js", import.meta.url),
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

  it("cada tema define su propio sólido para que el botón no desaparezca", () => {
    // Un FAB negro sobre fondo negro no se ve: cada tema tiene que redefinir
    // el par ink / on-ink contra su propio fondo.
    for (const theme of THEMES) {
      const block = css.slice(css.indexOf(`.d2[data-d2-theme="${theme.id}"]`));
      const body = block.slice(0, block.indexOf("}"));
      expect(body).toContain("--d2-ink:");
      expect(body).toContain("--d2-on-ink:");
    }
  });

  it("cada tema define su propio fondo", () => {
    for (const theme of THEMES) {
      const block = css.slice(css.indexOf(`.d2[data-d2-theme="${theme.id}"]`));
      const body = block.slice(0, block.indexOf("}"));
      for (const variable of ["--d2-bg-grad:", "--d2-bg-a:", "--d2-bg-b:", "--d2-bg-c:"]) {
        expect(body).toContain(variable);
      }
    }
  });

  it("cada tema se puede aplicar suelto, para la muestra del selector", () => {
    for (const theme of THEMES) {
      expect(css).toContain(`[data-d2-vars="${theme.id}"]`);
    }
  });
});

describe("Piso del tema", () => {
  it("el fondo y la muestra dibujan la misma composición", () => {
    // Si la muestra tuviera su propia copia, mentiría apenas se retoque el
    // tema.
    expect(cssCode).toMatch(/\.d2-backdrop \{\s*background: var\(--d2-ground\);\s*\}/);
    expect(cssCode).toMatch(/\.d2-theme-dot \{[^}]*background: var\(--d2-ground\)/);
  });

  it("se declara también sobre [data-d2-vars] y no solo sobre .d2", () => {
    // Un var() adentro de otra variable se resuelve en el elemento donde se
    // declara la variable, no donde se usa. Declarado solo en .d2, las cinco
    // muestras heredarían el piso ya resuelto del tema activo y se verían
    // iguales.
    expect(cssCode).toMatch(/\.d2,\s*\[data-d2-vars\]\s*\{\s*--d2-ground:/);
  });
});

describe("Estrías", () => {
  it("están apagadas salvo en los temas que las traen", () => {
    expect(cssCode).toMatch(/--d2-ribs: none;/);
    for (const id of ["electrico", "pliegues"]) {
      const block = css.slice(css.indexOf(`.d2[data-d2-theme="${id}"]`));
      expect(block.slice(0, block.indexOf("}"))).toContain("--d2-ribs:");
    }
  });

  it("van en su propia capa, arriba de las manchas", () => {
    // En la referencia el vidrio acanalado es la superficie de adelante: si
    // fueran el fondo del contenedor, las manchas desenfocadas las taparían.
    const backdrop = componentSources.find(([file]) => file === "Backdrop.js")[1];
    const ribs = backdrop.indexOf('className="d2-ribs"');
    const blob = backdrop.lastIndexOf('className="d2-blob"');
    expect(ribs).toBeGreaterThan(blob);
    expect(cssCode).toMatch(/\.d2-ribs \{[^}]*background: var\(--d2-ribs\)/);
  });
});

describe("Escala móvil contenida", () => {
  it("reduce un poco los elementos, pero conserva los márgenes laterales de 18 px", () => {
    expect(css).toContain("--d2-u: clamp(0.77px, 0.241025641vw, 1.253333px);");
    expect(css).toContain("padding-right: 18px;");
    expect(css).toContain("padding-left: 18px;");
    expect(css).toContain("margin: calc(16 * var(--d2-u)) -18px 0;");
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

describe("Estado del tema", () => {
  it("se sincroniza como estado externo, no con estado local en un efecto", () => {
    // El tema vive en localStorage, fuera del árbol de React. Leerlo con
    // useState + useEffect obliga a un setState dentro del efecto (React 19 lo
    // rechaza) y hace que el primer render del cliente no coincida con el del
    // servidor.
    expect(themeStoreSource).toContain("useSyncExternalStore");
    // Se miran los imports y no el texto: "useEffect" aparece en el comentario
    // que explica por qué no se usa.
    const imports = themeStoreSource.slice(0, themeStoreSource.lastIndexOf("import"));
    expect(imports).not.toContain("useEffect");
  });

  it("le da al servidor un tema fijo para que la hidratación coincida", () => {
    expect(themeStoreSource).toContain("getServerSnapshot");
    const snapshot = themeStoreSource.slice(themeStoreSource.indexOf("function getServerSnapshot"));
    expect(snapshot.slice(0, snapshot.indexOf("}"))).toContain("DEFAULT_THEME");
  });

  it("aguanta que localStorage no esté disponible", () => {
    // Ventana privada o cookies bloqueadas: acceder tira, no devuelve null.
    expect(themeStoreSource.match(/catch/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("se entera si cambian el tema desde otra pestaña", () => {
    expect(themeStoreSource).toContain('addEventListener("storage"');
    expect(themeStoreSource).toContain('removeEventListener("storage"');
  });

  it("no deja guardar un tema que no existe", () => {
    expect(themeStoreSource).toContain("if (!isValidTheme(id)) return;");
  });

  it("el contenedor y el selector leen el mismo estado", () => {
    // Si cada uno tuviera el suyo, elegir un tema no repintaría el fondo.
    expect(themeRootSource).toContain('from "./themeStore"');
    expect(pickerSource).toContain('from "./themeStore"');
  });
});

describe("Selector de temas", () => {
  it("cada muestra dibuja el fondo real de su tema", () => {
    // Copiar el degradado a mano hace que la muestra mienta apenas se retoca
    // el tema; data-d2-vars le presta las variables del bloque de CSS.
    expect(pickerSource).toContain("data-d2-vars={item.id}");
    expect(css).toMatch(/\.d2-theme-dot \{[^}]*background: var\(--d2-ground\)/);
    for (const theme of THEMES) {
      expect(css).toContain(`[data-d2-vars="${theme.id}"]`);
    }
  });

  it("se anuncia como un grupo de opciones excluyentes", () => {
    expect(pickerSource).toContain('role="radiogroup"');
    expect(pickerSource).toContain("aria-checked={active}");
  });

  it("ofrece todos los temas del registro y ninguno escrito a mano", () => {
    expect(pickerSource).toContain("THEMES.map");
  });
});
