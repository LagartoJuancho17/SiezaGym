import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const homeSource = read("app/(app)/page.js");
const navSource = read("lib/nav/redesigned.js");
const homeRoutinesSource = read("components/design2/HomeRoutines.js");
const activitySource = read("components/design2/RecentActivity.js");
const ringSource = read("components/design2/Ring.js");
const calendarSource = read("components/design2/TrainingWeek.js");
const cssSource = read("app/design2.css");

describe("Home del rediseño", () => {
  it("usa los componentes de design2 y ninguno de la Home vieja", () => {
    for (const component of ["<Backdrop", "<Header", "<Headline", "<TrainingWeek", "<GoalRail", "<HomeRoutines", "<TabBar"]) {
      expect(homeSource).toContain(component);
    }
    // WeekStrip es el componente de la Home anterior; el del rediseño se llama
    // TrainingWeek justamente para no confundirlos.
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
    expect(navSource).toMatch(/const EXACT = \[[^\]]*"\/"/);
  });
});

describe("Las rutinas en la portada", () => {
  it("es de servidor: sin buscador esa sección no manda JavaScript al cliente", () => {
    expect(homeRoutinesSource).not.toContain('"use client"');
    expect(homeRoutinesSource).not.toContain("useState");
    expect(homeRoutinesSource).not.toContain('type="search"');
  });

  it("enlaza a la lista completa de rutinas y al detalle", () => {
    expect(homeRoutinesSource).toContain('href="/rutinas"');
    expect(homeRoutinesSource).toContain('href={`/rutinas/${routine.id}`}');
  });

  it("avisa cuando no hay rutinas y ofrece crear la primera", () => {
    expect(homeRoutinesSource).toContain("Todavía no tenés rutinas.");
    expect(homeRoutinesSource).toContain('href="/rutinas/nueva"');
  });
});

describe("Actividad reciente", () => {
  it("es de servidor: sin buscador esa sección no manda JavaScript al cliente", () => {
    expect(activitySource).not.toContain('"use client"');
    expect(activitySource).not.toContain("useState");
    expect(activitySource).not.toContain('type="search"');
  });

  it("muestra las últimas dos y manda el resto al historial", () => {
    expect(activitySource).toContain("activities.slice(0, limit)");
    expect(activitySource).toContain('href="/historial"');
  });

  it("avisa cuando no hay entrenamientos registrados", () => {
    expect(activitySource).toContain("Todavía no registraste entrenamientos.");
  });
});

describe("Semana de la portada", () => {
  it("marca los días entrenados con el sólido del tema", () => {
    // El mismo que el FAB y la pestaña activa: "esto está hecho" se lee igual
    // en toda la app.
    expect(cssSource).toMatch(/\.d2-week-num-on \{ background: var\(--d2-ink\)/);
  });

  it("hoy y entrenado a la vez conserva el color del relleno", () => {
    // Si ganara el color de "hoy" quedaría blanco sobre blanco.
    expect(cssSource).toMatch(/\.d2-week-num-on\.d2-week-num-today \{ color: var\(--d2-on-ink\)/);
  });

  it("solo se navega hacia atrás", () => {
    // No se puede haber entrenado en una semana que todavía no pasó.
    expect(calendarSource).toContain("disabled={atCurrent}");
    expect(calendarSource).toContain('aria-label="Semana anterior"');
  });

  it("no inventa racha cuando la cuenta está vacía", () => {
    expect(calendarSource).toContain("Sin entrenamientos esta semana.");
    expect(calendarSource).toContain("streak > 0 &&");
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
