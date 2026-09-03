import { describe, it, expect } from "vitest";
import { computeStreak, toLocalDayKey } from "./streak";

const REF = new Date("2026-09-05T15:00:00Z"); // viernes, mediodia Argentina
const TODAY = toLocalDayKey(REF);

function daysBefore(n) {
  const d = new Date(REF);
  d.setDate(d.getDate() - n);
  return toLocalDayKey(d);
}

describe("computeStreak", () => {
  it("es 0 sin sesiones", () => {
    expect(computeStreak([], REF)).toBe(0);
  });

  it("cuenta hoy si entrenaste hoy", () => {
    expect(computeStreak([TODAY], REF)).toBe(1);
  });

  it("sigue viva si entrenaste ayer pero no hoy todavia", () => {
    expect(computeStreak([daysBefore(1)], REF)).toBe(1);
  });

  it("se corta si el ultimo entreno fue anteayer y no ayer", () => {
    expect(computeStreak([daysBefore(2)], REF)).toBe(0);
  });

  it("cuenta dias consecutivos terminando hoy", () => {
    const dates = [TODAY, daysBefore(1), daysBefore(2), daysBefore(3)];
    expect(computeStreak(dates, REF)).toBe(4);
  });

  it("se corta en el primer hueco, ignora dias sueltos mas viejos", () => {
    const dates = [TODAY, daysBefore(1), daysBefore(3), daysBefore(4)];
    expect(computeStreak(dates, REF)).toBe(2);
  });

  it("varias sesiones el mismo dia cuentan como un solo dia", () => {
    expect(computeStreak([TODAY, TODAY, daysBefore(1)], REF)).toBe(2);
  });
});
