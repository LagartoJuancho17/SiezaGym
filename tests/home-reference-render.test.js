import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({ pathname: "/", store: null }));

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
import TrainingWeek from "@/components/design2/TrainingWeek";
import RecentActivity from "@/components/design2/RecentActivity";
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

  it("renderiza las métricas de gimnasio y su enlace a progreso", () => {
    const html = render(GoalRail, { cards: homeReferenceFixture().cards });
    expect(html.match(/<article\b/g)).toHaveLength(3);
    for (const value of ["Esta semana", "7.793", "kg", "Calorías", "Series completadas"]) {
      expect(html).toContain(value);
    }
    // La racha ya no es una tarjeta: vive en el encabezado del calendario.
    expect(html).not.toContain("Racha");
    expect(hrefs(html)).toEqual(["/progreso"]);
  });

  it("muestra las dos últimas sesiones y preserva los destinos", () => {
    const html = render(RecentActivity, { activities: homeReferenceFixture().activities });
    expect(html.match(/<li\b/g)).toHaveLength(2);
    expect(hrefs(html)).toEqual(["/historial", "/historial/fixture-fullbody", "/historial/fixture-empuje"]);
    expect(html).toContain("Fullbody A");
    expect(html).toContain("4.165 kg");
    expect(html).not.toContain("Tracción y bíceps");
  });

  it("ya no trae buscador: esa sección no manda JavaScript al cliente", () => {
    const html = render(RecentActivity, { activities: homeReferenceFixture().activities });
    expect(html).not.toContain('type="search"');
    expect(html).not.toContain("Buscar");
  });

  it("la cuenta vacía presenta el mensaje correcto y conserva el acceso al historial", () => {
    const html = render(RecentActivity, { activities: [] });
    expect(html).toContain("Todavía no registraste entrenamientos.");
    expect(hrefs(html)).toEqual(["/historial"]);
  });
});

describe("Semana de la portada", () => {
  it("muestra los siete días de la semana en curso", () => {
    const html = render(TrainingWeek, homeReferenceFixture().calendar);
    expect(html).toContain("Esta semana");
    expect(html.match(/d2-week-num/g)).not.toBeNull();
    for (const day of [14, 15, 16, 17, 18, 19, 20]) {
      expect(html).toContain(`>${day}</span>`);
    }
  });

  it("marca los días entrenados de esa semana y no los de otra", () => {
    const html = render(TrainingWeek, homeReferenceFixture().calendar);
    // El 7 está entrenado pero es de la semana anterior.
    expect(html.match(/d2-week-num-on/g)).toHaveLength(2);
    expect(html).toContain("14, entrenaste");
    expect(html).not.toContain(">7</span>");
  });

  it("un día que es hoy y además entrenado lleva las dos marcas", () => {
    // Si solo quedara la de "hoy", el número se pintaría del color del texto
    // sobre el relleno y desaparecería.
    const html = render(TrainingWeek, homeReferenceFixture().calendar);
    expect(html).toContain("d2-week-num d2-week-num-on d2-week-num-today");
    expect(html).toContain("16, entrenaste, hoy");
  });

  it("apaga los días que todavía no pasaron", () => {
    // No se puede haber entrenado mañana: no es lo mismo que haberlo salteado.
    const html = render(TrainingWeek, homeReferenceFixture().calendar);
    expect(html.match(/d2-week-day-future/g)).toHaveLength(4);
  });

  it("no deja avanzar más allá de la semana en curso", () => {
    const html = render(TrainingWeek, homeReferenceFixture().calendar);
    const siguiente = html.match(/<button[^>]*aria-label="Semana siguiente"[^>]*>/)[0];
    expect(siguiente).toContain("disabled");
    const anterior = html.match(/<button[^>]*aria-label="Semana anterior"[^>]*>/)[0];
    expect(anterior).not.toContain("disabled");
  });

  it("resume los días entrenados y la racha, separados", () => {
    // Sin separador un lector de pantalla lee "entrenados1 día seguido".
    const html = render(TrainingWeek, homeReferenceFixture().calendar);
    expect(html).toContain("2 días entrenados");
    expect(html).toContain("1 día seguido");
    expect(html).toContain("·");
  });

  it("una cuenta sin entrenamientos no inventa racha ni marcas", () => {
    const html = render(TrainingWeek, homeReferenceFixture("empty").calendar);
    expect(html).toContain("Sin entrenamientos esta semana.");
    expect(html).not.toContain("d2-week-num-on");
    expect(html).not.toContain("seguido");
  });
});

describe("Barra flotante de cinco destinos", () => {
  it("lleva los mismos destinos y en el mismo orden que la barra anterior", () => {
    // Mientras el rediseño no cubra toda la app conviven las dos barras: si no
    // coinciden, tocar el mismo lugar lleva a pantallas distintas según dónde
    // estés parado.
    const html = render(TabBar);
    expect(hrefs(html)).toEqual(["/", "/rutinas", "/historial", "/progreso", "/perfil"]);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    for (const label of ["Inicio", "Rutinas", "Historial", "Progreso", "Perfil"]) {
      expect(html).toContain(`aria-label="${label}"`);
    }
  });

  it("no se queda atrás de la barra vieja", () => {
    // El rediseño arrancó con cuatro destinos y la barra vieja tiene cinco, así
    // que faltaba Historial. Esta comprobación es para que no vuelva a pasar
    // al revés: agregar un destino en una y olvidarlo en la otra.
    const legacy = readFileSync(
      new URL("../components/nav/BottomNav.js", import.meta.url),
      "utf8",
    );
    const destinosViejos = [...legacy.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs(render(TabBar))).toEqual(destinosViejos);
  });

  it.each([
    ["/", "Inicio"],
    ["/progreso", "Progreso"],
    ["/rutinas/rutina-1", "Rutinas"],
    ["/historial/sesion-1", "Historial"],
    ["/perfil", "Perfil"],
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
