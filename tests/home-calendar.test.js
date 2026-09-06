import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homePageSource = readFileSync(
  new URL("../app/(app)/page.js", import.meta.url),
  "utf8",
);
const weekStripSource = readFileSync(
  new URL("../components/home/WeekStrip.js", import.meta.url),
  "utf8",
);
const metricsSource = readFileSync(
  new URL("../components/home/HomeStats.js", import.meta.url),
  "utf8",
);

describe("calendario de la pantalla principal", () => {
  it("va debajo del hero y primero de las métricas, con una sola instancia", () => {
    expect(homePageSource).not.toContain("<WeekStrip");
    expect(metricsSource).toContain("<WeekStrip");
    // order-first lo pone antes de "Volumen por músculo" en mobile; en lg
    // vuelve al orden del código, abajo a la derecha.
    expect(metricsSource).toContain("order-first col-span-6 lg:order-none lg:col-span-7");
  });

  it("el hero va antes que las métricas y las rutinas", () => {
    const heroPosition = homePageSource.indexOf("<HomeHero");
    const metricsPosition = homePageSource.indexOf("<HomeStats");
    const routinesPosition = homePageSource.indexOf("<RoutinesCarousel");

    expect(heroPosition).toBeGreaterThan(-1);
    expect(heroPosition).toBeLessThan(metricsPosition);
    expect(metricsPosition).toBeLessThan(routinesPosition);
  });

  it("comparte superficie, borde y radio con los widgets de métricas", () => {
    expect(weekStripSource).toContain("rounded-[10px] border border-[#5A1215] bg-surface");
  });

  it("mantiene siete días responsivos y controles táctiles de 40 px", () => {
    expect(weekStripSource).toContain('className="grid grid-cols-7 gap-1"');
    expect(weekStripSource.match(/h-10 w-10/g)).toHaveLength(2);
  });
});
