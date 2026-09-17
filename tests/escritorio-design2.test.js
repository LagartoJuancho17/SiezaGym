import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const css = read("app/design2.css");
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, "");
const tabbar = read("components/design2/TabBar.js");
const progreso = read("app/(app)/progreso/page.js");
const home = read("app/(app)/page.js");
const perfil = read("app/(app)/perfil/page.js");
const rutina = read("components/design2/RoutineScreen.js");
const sesion = read("app/(app)/historial/[id]/page.js");
const ejercicio = read("app/(app)/progreso/[exerciseId]/page.js");

// El bloque de escritorio entero, para no confundirlo con las reglas de móvil.
const escritorio = css.slice(css.indexOf("@media (min-width: 1024px)"));

describe("Escritorio", () => {
  it("la navegación pasa a un panel vertical a la izquierda", () => {
    // Una barra flotante abajo del todo queda lejísimos del cursor.
    expect(escritorio).toMatch(/\.d2-tabbar \{[^}]*left: 0/);
    expect(escritorio).toMatch(/\.d2-tabbar-shell \{[^}]*flex-direction: column/);
  });

  it("con lugar de sobra escribe los cinco nombres", () => {
    // Obligar a adivinar por el icono es una limitación del teléfono.
    expect(escritorio).toContain(".d2-tab:not(.d2-tab-active) .d2-tab-label { display: block; }");
    expect(cssCode).toContain(".d2-tab:not(.d2-tab-active) .d2-tab-label { display: none; }");
  });

  it("el marcado de la barra es el mismo en los dos tamaños", () => {
    // Dos marcados distintos para lo mismo se desincronizan.
    expect(tabbar).toContain('<span className="d2-tab-label">{label}</span>');
    expect(tabbar).not.toContain("isActive ? (");
  });

  it("la unidad deja de crecer con el ancho", () => {
    // Atada al viewport, en un monitor grande la tipografía se va de escala.
    expect(escritorio).toMatch(/\.d2 \{ --d2-u: [\d.]+px; \}/);
  });

  it("el contenido se ensancha y se corre al costado del panel", () => {
    expect(escritorio).toMatch(/max-width: 1060px/);
    expect(escritorio).toMatch(/margin-left: max\(248px/);
  });

  it("en pantallas muy anchas el contenido se centra", () => {
    expect(css).toContain("@media (min-width: 1600px)");
  });

  it("las pantallas de una sola columna no estiran sus filas", () => {
    expect(escritorio).toMatch(/\.d2-routine-section,[\s\S]{0,220}max-width: 760px/);
  });

  it("entrar y crear cuenta siguen centradas y angostas", () => {
    // Un formulario de cinco campos a mil pixeles de ancho no se lee.
    expect(escritorio).toMatch(/\.d2-authpage \{[^}]*max-width: 520px/);
  });
});

describe("Dos columnas", () => {
  it("solo existen desde 1024 px", () => {
    // En teléfono la clase no tiene que hacer nada.
    const antes = css.slice(0, css.indexOf("@media (min-width: 1024px)"));
    expect(antes).not.toContain(".d2-split {");
    expect(escritorio).toMatch(/\.d2-split \{ display: grid/);
  });

  it("las pantallas que lo aprovechan están marcadas", () => {
    for (const source of [progreso, home, perfil, rutina]) {
      expect(source).toContain('className="d2-split"');
    }
  });
});

describe("Gifs de ejercicios", () => {
  it("aparecen en la lista por ejercicio, en la sesión y en el detalle", () => {
    for (const source of [progreso, sesion, ejercicio]) {
      expect(source).toContain("unoptimized");
      expect(source).toContain("mediaUrl");
    }
  });

  it("muestran un icono cuando el ejercicio no tiene animación", () => {
    for (const source of [progreso, sesion]) {
      expect(source).toContain("<WeightIcon");
    }
  });

  it("acreditan la licencia en cada pantalla donde se ven", () => {
    // Los gifs son © Gym visual y la atribución es condición de uso.
    for (const source of [progreso, sesion, ejercicio]) {
      expect(source).toContain("Gym visual");
      expect(source).toContain("https://gymvisual.com/");
    }
  });

  it("la atribución no aparece si no hay ninguna animación en pantalla", () => {
    expect(progreso).toContain("hasMedia &&");
    expect(ejercicio).toContain("exercise.mediaUrl && (");
  });
});

describe("Gráficos nuevos", () => {
  it("el reparto muscular sale del catálogo cruzado con el volumen real", () => {
    expect(progreso).toContain("volumeByMuscleGroup(sessions, byId");
    expect(progreso).toContain("Dónde fue el volumen");
  });

  it("el balance empuje/tracción usa el patrón de cada ejercicio", () => {
    expect(progreso).toContain("pushPullBalance(sessions, byId)");
    expect(progreso).toContain("Empuje y tracción");
  });

  it("ninguno se dibuja sin datos", () => {
    // Una barra en cero se lee como "estás desbalanceado", no como "no hay
    // nada medido".
    expect(progreso).toContain("muscles.rows.length > 0 &&");
    expect(progreso).toContain("balance.hasData &&");
  });

  it("el balance se anuncia con sus dos valores", () => {
    expect(progreso).toContain('role="img"');
    expect(progreso).toContain("balance.pushKg} kilos, tracción ${balance.pullKg}");
  });

  it("declaran sobre cuántos entrenamientos están calculados", () => {
    expect(progreso).toContain("últimos {sessions.length} entrenamientos");
  });
});
