import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

// El boceto de p5 del onboarding de iOS. En Node no hay p5: el archivo solo
// expone su lógica pura en `SiezaArte` y no arranca el dibujo.
const carpeta = new URL("../ios/SiezaGym/Resources/ArteOnboarding/", import.meta.url);
const boceto = readFileSync(new URL("onboarding-arte.js", carpeta), "utf8");

function cargar() {
  const contexto = {};
  runInNewContext(boceto, { globalThis: contexto });
  return contexto.SiezaArte;
}

describe("Arte p5 del onboarding", () => {
  const arte = cargar();

  it("normaliza la mancha y cae al inicio con datos inválidos", () => {
    expect(arte.normalizarMancha({ x: 0.3, y: 0.4, ancho: 1, alto: 0.5 })).toEqual({ x: 0.3, y: 0.4, ancho: 1, alto: 0.5 });
    expect(arte.normalizarMancha({ x: 4, y: -1, ancho: 9, alto: 0 })).toEqual({ x: 1, y: 0, ancho: 2, alto: 0.1 });
    expect(arte.normalizarMancha(null)).toEqual(arte.MANCHA_INICIAL);
    expect(arte.normalizarMancha({ x: "nada" }).x).toBe(arte.MANCHA_INICIAL.x);
  });

  it("acerca la mancha igual sin importar los cuadros por segundo", () => {
    const desde = { x: 0, y: 0, ancho: 1, alto: 1 };
    const hasta = { x: 1, y: 1, ancho: 1, alto: 1 };
    let a60 = desde;
    for (let i = 0; i < 60; i++) a60 = arte.acercar(a60, hasta, 1 / 60, 0.32);
    let a30 = desde;
    for (let i = 0; i < 30; i++) a30 = arte.acercar(a30, hasta, 1 / 30, 0.32);
    expect(a60.x).toBeCloseTo(a30.x, 10);
    // Tras un segundo (~3 tau) recorrió más del 95%.
    expect(a60.x).toBeGreaterThan(0.95);
    expect(arte.acercar(desde, hasta, 0.016, 0)).toEqual(hasta);
  });

  it("sabe cuándo la mancha llegó, para bajar a 30 cuadros o detenerse", () => {
    const m = { x: 0.5, y: 0.5, ancho: 1, alto: 1 };
    expect(arte.quieta(m, { ...m, x: 0.5003 })).toBe(true);
    expect(arte.quieta(m, { ...m, x: 0.52 })).toBe(false);
  });

  it("arranca donde Swift pone la mancha de la primera pantalla", () => {
    const swift = readFileSync(new URL("../ios/SiezaGym/Features/Onboarding/OnboardingView.swift", import.meta.url), "utf8");
    const m = swift.match(/case 0: Mancha\(centro: UnitPoint\(x: ([\d.]+), y: ([\d.]+)\), ancho: ([\d.]+), alto: ([\d.]+)\)/);
    expect(m).not.toBeNull();
    const [, x, y, ancho, alto] = m.map(Number);
    expect(arte.MANCHA_INICIAL).toEqual({ x, y, ancho, alto });
  });
});
