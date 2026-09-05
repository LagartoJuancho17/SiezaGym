import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isOwnFlightTransition,
  nextRoutineIndex,
  routineCardVeilOpacity,
} from "../lib/routines/carousel";

const carouselSource = readFileSync(
  new URL("../components/home/RoutinesCarousel.js", import.meta.url),
  "utf8",
);

const ROUTINES = ["Rutina A", "Rutina B", "Rutina C"].map((name, index) => ({
  id: `routine-${index}`,
  name,
  exercises: [{ exerciseId: `exercise-${index}` }],
  totalSets: index + 1,
  estimatedMinutes: 30 + index * 5,
}));

describe("mazo de rutinas de la Home", () => {
  it("avanza exactamente una rutina y conserva el orden circular", () => {
    expect(nextRoutineIndex(0, ROUTINES.length)).toBe(1);
    expect(nextRoutineIndex(1, ROUTINES.length)).toBe(2);
    expect(nextRoutineIndex(2, ROUTINES.length)).toBe(0);
  });

  it("solo completa el vuelo con transiciones propias de movimiento o salida", () => {
    const card = {};
    const child = {};

    expect(
      isOwnFlightTransition({ target: card, currentTarget: card, propertyName: "transform" }),
    ).toBe(true);
    expect(
      isOwnFlightTransition({ target: card, currentTarget: card, propertyName: "opacity" }),
    ).toBe(true);
    expect(
      isOwnFlightTransition({ target: card, currentTarget: card, propertyName: "filter" }),
    ).toBe(false);
    expect(
      isOwnFlightTransition({ target: child, currentTarget: card, propertyName: "transform" }),
    ).toBe(false);
  });

  it("revela el color principal a medida que la tarjeta llega al frente", () => {
    expect(routineCardVeilOpacity(0)).toBe(0);
    expect(routineCardVeilOpacity(1)).toBeCloseTo(0.42);
    expect(routineCardVeilOpacity(2)).toBeCloseTo(0.58);
    expect(routineCardVeilOpacity(10)).toBe(0.68);
    expect(carouselSource).toContain("transition-[transform,opacity]");
    expect(carouselSource).toContain("transition-opacity duration-[260ms]");
    expect(carouselSource).toContain("motion-reduce:transition-opacity");
  });

  it("muestra únicamente rutinas reales y no ofrece crear una desde la Home", () => {
    expect(carouselSource).toContain("const total = routines.length");
    expect(carouselSource).not.toContain("Nueva rutina");
    expect(carouselSource).not.toContain("Crear rutina");
    expect(carouselSource).not.toContain("/rutinas/nueva");
  });
});
