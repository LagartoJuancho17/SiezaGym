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

describe("calendario de la pantalla principal", () => {
  it("aparece antes que el hero, las métricas y las rutinas", () => {
    const calendarPosition = homePageSource.indexOf("<WeekStrip");
    const heroPosition = homePageSource.indexOf("<HomeHero");
    const metricsPosition = homePageSource.indexOf("<HomeStats");
    const routinesPosition = homePageSource.indexOf("<RoutinesCarousel");

    expect(calendarPosition).toBeGreaterThan(-1);
    expect(calendarPosition).toBeLessThan(heroPosition);
    expect(heroPosition).toBeLessThan(metricsPosition);
    expect(metricsPosition).toBeLessThan(routinesPosition);
  });

  it("comparte superficie, borde y radio con los widgets de métricas", () => {
    expect(weekStripSource).toContain(
      'className="rounded-[10px] border border-[#5A1215] bg-surface p-4 shadow-sm sm:p-5"',
    );
  });

  it("mantiene siete días responsivos y controles táctiles de 40 px", () => {
    expect(weekStripSource).toContain('className="grid grid-cols-7 gap-1.5 sm:gap-2"');
    expect(weekStripSource.match(/h-10 w-10/g)).toHaveLength(2);
  });
});
