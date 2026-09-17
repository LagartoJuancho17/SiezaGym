import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isRedesigned } from "@/lib/nav/redesigned";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const pageSource = read("app/(app)/progreso/page.js");
const volumeSource = read("components/design2/WeekVolume.js");
const gridSource = read("components/design2/TrainedGrid.js");
const cssSource = read("app/design2.css");

describe("Pantalla de progreso", () => {
  it("usa los componentes de design2 y no los viejos", () => {
    expect(pageSource).toContain("<ThemeRoot>");
    expect(pageSource).toContain("<WeekVolume");
    expect(pageSource).toContain("<TrainedGrid");
    expect(pageSource).not.toContain("ProgresoContent");
  });

  it("está declarada como rediseñada", () => {
    expect(isRedesigned("/progreso")).toBe(true);
  });

  it("lleva la barra de pestañas, porque es una sección", () => {
    expect(pageSource).toContain("<TabBar />");
  });

  it("no manda JavaScript al cliente para dibujar", () => {
    // La pantalla anterior traía recharts entero para un gráfico de doce
    // puntos. Acá son doce divs y la página entera se renderiza en el server.
    for (const source of [pageSource, volumeSource, gridSource]) {
      expect(source).not.toContain('"use client"');
      expect(source).not.toContain("recharts");
    }
  });

  it("no fija colores a mano: todo sale del tema", () => {
    for (const source of [pageSource, volumeSource, gridSource]) {
      expect(source).not.toMatch(/text-white\b|bg-white\b|#[0-9a-fA-F]{6}/);
    }
  });
});

describe("Los números", () => {
  it("salen de las sesiones guardadas y no de una estimación", () => {
    for (const fn of ["computeWeeklyVolume", "computeWeeklySessionCounts", "computeVolumeByWeek"]) {
      expect(pageSource).toContain(fn);
    }
  });

  it("dice que el 1RM es estimado", () => {
    // Es Epley sobre una serie real, no un peso que se haya levantado.
    expect(pageSource).toContain("1RM est.");
  });

  it("aclara contra qué compara la tendencia", () => {
    expect(pageSource).toContain("vs semana anterior");
  });

  it("pide justo los días que la grilla dibuja", () => {
    expect(pageSource).toContain("sinceDays: GRID_WEEKS * 7 + 7");
  });

  it("una cuenta sin entrenamientos no muestra gráficos vacíos", () => {
    expect(pageSource).toContain("Todavía no terminaste ningún entrenamiento");
  });
});

describe("Volumen por semana", () => {
  it("las alturas se comparan entre sí y no contra un objetivo inventado", () => {
    expect(volumeSource).toContain("weekBars(points)");
    expect(volumeSource).toContain("no contra un objetivo");
  });

  it("la semana sin volumen se ve como barra y no como hueco", () => {
    expect(cssSource).toMatch(/\.d2-bar-empty > span \{ background: var\(--d2-ring-track\)/);
  });
});

describe("Días entrenados", () => {
  it("el día entrenado usa el sólido del tema", () => {
    // El mismo que la semana de la portada y la serie confirmada.
    expect(cssSource).toMatch(/\.d2-cell-on \{ background: var\(--d2-ink\)/);
  });

  it("los días que no pasaron van aparte", () => {
    expect(cssSource).toMatch(/\.d2-cell-future \{ opacity/);
    expect(gridSource).toContain("day.isFuture");
  });

  it("la grilla tiene scroll propio para que la página no se desplace", () => {
    expect(cssSource).toMatch(/\.d2-gridwrap \{ overflow-x: auto/);
  });

  it("se anuncia como una sola imagen con su resumen", () => {
    // Leer ciento ochenta celdas una por una no le sirve a nadie.
    expect(gridSource).toContain('role="img"');
    expect(gridSource).toContain("días entrenados");
  });
});

describe("Por ejercicio", () => {
  it("hace alcanzable el detalle de cada ejercicio", () => {
    // La ruta existía y no la enlazaba ninguna pantalla.
    expect(pageSource).toContain("href={`/progreso/${exercise.exerciseId}`}");
  });

  it("reusa las filas de la lista de rutinas", () => {
    expect(pageSource).toContain('className="d2-routine"');
  });

  it("no muestra una marca donde no hay peso", () => {
    // En plancha o dominadas el 1RM estimado da cero.
    expect(pageSource).toContain("exercise.bestOneRepMax > 0 &&");
  });
});
