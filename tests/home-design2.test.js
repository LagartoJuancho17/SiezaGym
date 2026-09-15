import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const homeSource = read("app/(app)/page.js");
const chromeSource = read("components/nav/LegacyChrome.js");
const activitySource = read("components/design2/SearchAndActivity.js");
const ringSource = read("components/design2/Ring.js");

describe("Home del rediseño", () => {
  it("usa los componentes de design2 y ninguno de la Home vieja", () => {
    for (const component of ["<Backdrop", "<Header", "<Headline", "<GoalRail", "<SearchAndActivity", "<TabBar"]) {
      expect(homeSource).toContain(component);
    }
    for (const legacy of ["<HomeHero", "<HomeStats", "<RoutinesCarousel", "<WeekStrip"]) {
      expect(homeSource).not.toContain(legacy);
    }
  });

  it("no deja números escritos a mano en las tarjetas", () => {
    // El diseño anterior llegó a tener un 2040 y un "9 series" hardcodeados.
    // Todo valor de la Home tiene que venir de Firestore.
    const cardsBlock = homeSource.slice(homeSource.indexOf("const cards = ["), homeSource.indexOf("];", homeSource.indexOf("const cards = [")));
    expect(cardsBlock).not.toMatch(/value:\s*["'`]?\d/);
  });

  it("declara la Home como rediseñada para que no le entre el chrome viejo", () => {
    // Si "/" sale de esta lista vuelven el TopNavbar y la BottomNav bordo
    // encima del rediseño.
    // Se comprueba que "/" esté en la lista y no la lista entera: el rediseño
    // va sumando rutas y el test no tiene que romperse en cada una.
    expect(chromeSource).toMatch(/const REDESIGNED = \[[^\]]*"\/"/);
  });
});

describe("Buscador de actividad", () => {
  it("filtra sobre lo que ya está en la página, sin volver al servidor", () => {
    expect(activitySource).toContain("useMemo");
    expect(activitySource).not.toContain("fetch(");
  });

  it("distingue no tener actividad de que la búsqueda no encuentre nada", () => {
    expect(activitySource).toContain("Todavía no registraste entrenamientos.");
    expect(activitySource).toContain("Ninguna actividad coincide");
  });
});

describe("Anillo de progreso", () => {
  it("recorta el valor a 0..1 para que nunca se dibuje de más", () => {
    expect(ringSource).toContain("Math.min(1, Math.max(0, Number(value) || 0))");
  });

  it("arranca arriba y no a la derecha", () => {
    expect(ringSource).toContain("-rotate-90");
  });
});
