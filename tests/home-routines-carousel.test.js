import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isOwnTransformTransition,
  nextRoutineIndex,
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

  it("solo completa el vuelo con el transitionend propio de transform", () => {
    const card = {};
    const child = {};

    expect(
      isOwnTransformTransition({ target: card, currentTarget: card, propertyName: "transform" }),
    ).toBe(true);
    expect(
      isOwnTransformTransition({ target: card, currentTarget: card, propertyName: "opacity" }),
    ).toBe(false);
    expect(
      isOwnTransformTransition({ target: child, currentTarget: card, propertyName: "transform" }),
    ).toBe(false);
  });

  it("muestra únicamente rutinas reales y no ofrece crear una desde la Home", () => {
    expect(carouselSource).toContain("const total = routines.length");
    expect(carouselSource).not.toContain("Nueva rutina");
    expect(carouselSource).not.toContain("Crear rutina");
    expect(carouselSource).not.toContain("/rutinas/nueva");
  });
});
