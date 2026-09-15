import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const pageSource = read("app/(app)/rutinas/page.js");
const browserSource = read("components/design2/RoutinesBrowser.js");
const cardSource = read("components/design2/RoutineCard.js");
const chromeSource = read("components/nav/LegacyChrome.js");
const cssSource = read("app/design2.css");

describe("Pantalla de Rutinas", () => {
  it("usa los componentes de design2 y ninguno de la pantalla vieja", () => {
    for (const component of ["<ThemeRoot", "<Backdrop", "<PageHeader", "<Headline", "<RoutinesBrowser", "<TabBar"]) {
      expect(pageSource).toContain(component);
    }
    for (const legacy of ["RoutinesHero", "RoutineSchedule", "RoutineRow"]) {
      expect(pageSource).not.toContain(legacy);
    }
  });

  it("está declarada como rediseñada para que no le entre el chrome viejo", () => {
    // Si "/rutinas" sale de la lista, vuelven el TopNavbar y la BottomNav bordo
    // encima del rediseño.
    expect(chromeSource).toContain('"/rutinas"');
  });

  it("solo la lista está rediseñada, no el detalle ni el alta", () => {
    // La coincidencia es exacta: /rutinas/algo sigue con el diseño anterior
    // hasta que se rediseñe.
    expect(chromeSource).toContain("REDESIGNED.includes(pathname)");
  });

  it("no cuenta los ejercicios a ojo: sale del largo real de la rutina", () => {
    expect(pageSource).toContain("exerciseCount: item.exercises?.length || 0");
  });

  it("distingue rutinas propias de asignadas por origen, no por nombre", () => {
    expect(pageSource).toContain('`${isAssigned ? "asg" : "own"}-${item.id}`');
  });
});

describe("Buscador y solapas", () => {
  it("filtra en el cliente, sin volver al servidor", () => {
    expect(browserSource).toContain("useMemo");
    expect(browserSource).not.toContain("fetch(");
  });

  it("distingue no tener rutinas de que el filtro no encuentre nada", () => {
    expect(browserSource).toContain("Todavía no tenés rutinas.");
    expect(browserSource).toContain("Ninguna rutina coincide");
  });

  it("deja de agrupar por mes cuando hay un filtro activo", () => {
    expect(browserSource).toContain("shouldGroupByMonth");
  });

  it("los acordeones dicen si están abiertos", () => {
    // aria-expanded es lo que hace girar el chevron y lo que leen los lectores
    // de pantalla.
    expect(browserSource).toContain("aria-expanded={monthOpen}");
    expect(browserSource).toContain("aria-expanded={weekOpen}");
    expect(cssSource).toContain('.d2-disclosure[aria-expanded="true"] .d2-disclosure-chevron');
  });
});

describe("Ficha de rutina", () => {
  it("lleva al detalle de esa rutina", () => {
    expect(cardSource).toContain("href={`/rutinas/${routine.id}`}");
  });

  it("concuerda singular y plural", () => {
    expect(cardSource).toContain('exercises === 1 ? "ejercicio" : "ejercicios"');
    expect(cardSource).toContain('routine.totalSets === 1 ? "serie" : "series"');
  });

  it("no fija colores a mano: todo sale del tema", () => {
    expect(cardSource).not.toMatch(/text-white\b|bg-white\b|#[0-9a-fA-F]{6}/);
  });
});
