import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({ pathname: "/", store: null, query: undefined }));

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return { default: ({ children, ...props }) => createElement("a", props, children) };
});
vi.mock("next/image", async () => {
  const { createElement } = await import("react");
  return { default: ({ fill: _fill, ...props }) => createElement("img", props) };
});
vi.mock("next/navigation", () => ({
  usePathname: () => runtime.pathname,
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
}));
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal();
  return {
    ...react,
    // Permite evaluar el HTML de un estado de búsqueda concreto. El evento
    // del navegador se verifica por separado en evals/home-reference.md.
    useState(initial) {
      return react.useState(typeof initial === "string" && runtime.query !== undefined ? runtime.query : initial);
    },
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
      runtime.store = { subscribe, getSnapshot, getServerSnapshot };
      return react.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    },
  };
});

import Header from "@/components/design2/Header";
import Headline from "@/components/design2/Headline";
import GoalRail from "@/components/design2/GoalRail";
import Ring from "@/components/design2/Ring";
import SearchAndActivity from "@/components/design2/SearchAndActivity";
import TabBar from "@/components/design2/TabBar";
import ThemeRoot from "@/components/design2/ThemeRoot";
import DesignPreview from "@/app/design-preview/page";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/components/design2/themes";
import { homeReferenceFixture } from "@/evals/fixtures/home-reference";

const render = (Component, props, children) => renderToStaticMarkup(createElement(Component, props, children));
const hrefs = (html) => [...html.matchAll(/\bhref="([^"]+)"/g)].map((match) => match[1]);

afterEach(() => {
  runtime.pathname = "/";
  runtime.store = null;
  runtime.query = undefined;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Home: HTML real de los componentes", () => {
  it("conserva el saludo, la meta y el acceso al perfil", () => {
    const html = render(Header, homeReferenceFixture().header);
    expect(html).toContain("Hola, Tobías");
    expect(html).toContain("Meta semanal: 46%");
    expect(hrefs(html)).toEqual(["/perfil"]);
  });

  it("no inventa progreso para una cuenta sin entrenamientos", () => {
    const html = render(Header, homeReferenceFixture("empty").header);
    expect(html).toContain("Sin entrenamientos esta semana");
    expect(html).not.toContain("Meta semanal:");
  });

  it("abre la rutina real desde el titular y permite crear la primera", () => {
    const fixture = homeReferenceFixture();
    const html = render(Headline, fixture.headline);
    expect(html).toContain("Hoy toca");
    expect(html).toContain("Fullbody A.");
    expect(hrefs(html)).toEqual([fixture.headline.href]);
    expect(hrefs(render(Headline, homeReferenceFixture("empty").headline))).toEqual(["/rutinas/nueva"]);
  });

  it("renderiza las cuatro métricas de gimnasio y su enlace a progreso", () => {
    const html = render(GoalRail, { cards: homeReferenceFixture().cards });
    expect(html.match(/<article\b/g)).toHaveLength(4);
    for (const value of ["Esta semana", "7.793", "kg", "Racha", "días", "Calorías", "Series completadas"]) {
      expect(html).toContain(value);
    }
    expect(hrefs(html)).toEqual(["/progreso"]);
  });

  it("muestra dos sesiones, preserva los destinos y ubica los objetivos entre buscador y lista", () => {
    const fixture = homeReferenceFixture();
    const html = render(SearchAndActivity, { activities: fixture.activities }, createElement(GoalRail, { cards: fixture.cards }));
    expect(html).toContain('type="search"');
    expect(html).toContain('aria-label="Buscar en tu actividad"');
    expect(html.indexOf('type="search"')).toBeLessThan(html.indexOf("Tus objetivos"));
    expect(html.indexOf("Tus objetivos")).toBeLessThan(html.indexOf("Actividad reciente"));
    expect(html.match(/<li\b/g)).toHaveLength(2);
    expect(hrefs(html)).toEqual(["/progreso", "/historial", "/historial/fixture-fullbody", "/historial/fixture-empuje"]);
    expect(html).toContain("Fullbody A");
    expect(html).toContain("4.165 kg");
    expect(html).not.toContain("Tracción y bíceps");
  });

  it("la cuenta vacía presenta el mensaje correcto y conserva el acceso al historial", () => {
    const html = render(SearchAndActivity, { activities: [] });
    expect(html).toContain("Todavía no registraste entrenamientos.");
    expect(html).not.toContain("Ninguna actividad coincide");
    expect(hrefs(html)).toEqual(["/historial"]);
  });

  it("renderiza una coincidencia posterior a las dos sesiones iniciales", () => {
    runtime.query = " TRACCION ";
    const html = render(SearchAndActivity, { activities: homeReferenceFixture().activities });
    expect(html.match(/<li\b/g)).toHaveLength(1);
    expect(html).toContain("Tracción y bíceps");
    expect(hrefs(html)).toEqual(["/historial", "/historial/fixture-traccion"]);
  });

  it("distingue la búsqueda sin resultados del historial vacío", () => {
    runtime.query = "  natación  ";
    const html = render(SearchAndActivity, { activities: homeReferenceFixture().activities });
    expect(html).toContain("Ninguna actividad coincide con “natación”.");
    expect(html).not.toContain("Todavía no registraste entrenamientos.");
    expect(html).not.toContain("<li");
    expect(hrefs(html)).toEqual(["/historial"]);
  });
});

describe("Barra flotante de cuatro destinos", () => {
  it("conserva el orden visual de la referencia y un único destino activo", () => {
    const html = render(TabBar);
    expect(hrefs(html)).toEqual(["/", "/progreso", "/rutinas", "/perfil"]);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    for (const label of ["Inicio", "Progreso", "Rutinas", "Perfil"]) expect(html).toContain(`aria-label="${label}"`);
    expect(html).not.toContain('href="/historial"');
  });

  it.each([
    ["/", "Inicio"], ["/progreso", "Progreso"], ["/rutinas/rutina-1", "Rutinas"], ["/perfil", "Perfil"],
  ])("marca %s sin activar otra sección", (pathname, label) => {
    runtime.pathname = pathname;
    const html = render(TabBar);
    const active = [...html.matchAll(/<a\b[^>]*aria-current="page"[^>]*>/g)];
    expect(active).toHaveLength(1);
    expect(active[0][0]).toContain(`aria-label="${label}"`);
  });
});

describe("Tema plata en primer render y migración del almacenamiento", () => {
  it("renderiza plata sin selector de temas en la vista normal", () => {
    const html = render(ThemeRoot, {}, "Contenido");
    expect(DEFAULT_THEME).toBe("plata");
    expect(html).toContain('data-d2-theme="plata"');
    expect(html).toContain("Contenido");
    expect(html).not.toContain("Cambiar tema");
  });

  it("ignora el antiguo d2-theme=noche y usa la clave versionada", () => {
    const saved = new Map([["d2-theme", "noche"]]);
    const getItem = vi.fn((key) => saved.get(key) ?? null);
    vi.stubGlobal("window", { localStorage: { getItem } });
    render(ThemeRoot);
    expect(THEME_STORAGE_KEY).toBe("d2-theme-v2");
    expect(runtime.store.getSnapshot()).toBe("plata");
    expect(getItem).toHaveBeenCalledWith("d2-theme-v2");
    expect(getItem).not.toHaveBeenCalledWith("d2-theme");
    expect(runtime.store.getServerSnapshot()).toBe("plata");
  });

  it.each([null, "un-tema-inventado"])("usa plata para almacenamiento inválido (%j)", (stored) => {
    vi.stubGlobal("window", { localStorage: { getItem: () => stored } });
    render(ThemeRoot);
    expect(runtime.store.getSnapshot()).toBe("plata");
  });

  it("no falla si el navegador bloquea localStorage", () => {
    vi.stubGlobal("window", { get localStorage() { throw new Error("Storage blocked"); } });
    expect(() => render(ThemeRoot)).not.toThrow();
    expect(runtime.store.getSnapshot()).toBe("plata");
  });

  it("limpia la suscripción entre pestañas al desmontarse", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal("window", { addEventListener, removeEventListener });
    render(ThemeRoot);
    const onChange = vi.fn();
    const unsubscribe = runtime.store.subscribe(onChange);
    expect(addEventListener).toHaveBeenCalledWith("storage", onChange);
    unsubscribe();
    expect(removeEventListener).toHaveBeenCalledWith("storage", onChange);
  });
});

describe("Anillos con datos fuera de rango", () => {
  it.each([-1, 0, NaN, "inválido"])("no dibuja avance con %j", (value) => {
    const html = render(Ring, { value });
    expect(html).not.toContain('stroke="var(--d2-ring-fill)"');
    expect(html).not.toMatch(/NaN|Infinity/);
  });

  it.each([1, 4, Infinity])("limita un avance completo (%j)", (value) => {
    const html = render(Ring, { value });
    expect(html).toContain('stroke-dashoffset="0"');
    expect(html).not.toMatch(/NaN|Infinity/);
  });

  it("traduce una fracción de progreso al arco proporcional", () => {
    const html = render(Ring, { value: 0.25 });
    const arc = html.match(/stroke-dasharray="([\d.]+)" stroke-dashoffset="([\d.]+)"/);
    expect(arc).not.toBeNull();
    expect(Number(arc[2]) / Number(arc[1])).toBeCloseTo(0.75);
  });
});

describe("Vista local de evaluación", () => {
  it.each([
    ["production", "true"], ["production", "false"], ["development", "false"], ["test", "true"],
  ])("responde 404 con NODE_ENV=%s y D2_PREVIEW=%s", async (nodeEnv, preview) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("D2_PREVIEW", preview);
    await expect(DesignPreview({ searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it.each(["default", "empty", "long"])("renderiza los componentes reales para el escenario %s", async (scenario) => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("D2_PREVIEW", "true");
    const element = await DesignPreview({ searchParams: Promise.resolve({ scenario }) });
    const html = renderToStaticMarkup(element);
    expect(html).toContain('class="d2-home"');
    expect(html).toContain('data-d2-theme="plata"');
    expect(html).toContain('aria-label="Navegación principal"');
    expect(html).toContain(scenario === "empty" ? "Todavía no registraste entrenamientos." : "4.165 kg");
  });

  it.each([["320", 694], ["390", 844], ["430", 932]])("encuadra la app en %s × %i sin alterar su contenido", async (viewport, height) => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("D2_PREVIEW", "true");
    const element = await DesignPreview({ searchParams: Promise.resolve({ viewport, scenario: "long" }) });
    const html = renderToStaticMarkup(element);
    expect(html).toContain("<iframe");
    expect(html).toContain(`width="${viewport}" height="${height}"`);
    expect(html).toContain('src="/design-preview?scenario=long&amp;embedded=1"');
    expect(html).toContain('aria-label="Controles de evaluación"');
  });

  it("no permite un tamaño arbitrario ni un escenario fuera de los fixtures", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("D2_PREVIEW", "true");
    const element = await DesignPreview({ searchParams: Promise.resolve({ viewport: "9999", scenario: "inventado" }) });
    const html = renderToStaticMarkup(element);
    expect(html).not.toContain("<iframe");
    expect(html).toContain("Fullbody A.");
  });

  it("la vista embebida no crea un iframe recursivo", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("D2_PREVIEW", "true");
    const element = await DesignPreview({ searchParams: Promise.resolve({ viewport: "390", scenario: "empty", embedded: "1" }) });
    const html = renderToStaticMarkup(element);
    expect(html).not.toContain("<iframe");
    expect(html).toContain("Todavía no registraste entrenamientos.");
  });
});
