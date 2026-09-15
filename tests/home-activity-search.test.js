import { describe, expect, it } from "vitest";
import { visibleActivities } from "@/lib/home/activity-search";

const activities = Object.freeze([
  Object.freeze({ id: "1", name: "Fullbody A" }),
  Object.freeze({ id: "2", name: "Empuje pesado" }),
  Object.freeze({ id: "3", name: "Tracción y bíceps" }),
  Object.freeze({ id: "4", name: "Fullbody B" }),
]);

describe("Actividad reciente y búsqueda", () => {
  it.each(["", " ", "\n\t"])("muestra solo las dos últimas con una búsqueda vacía (%j)", (query) => {
    expect(visibleActivities(activities, query)).toEqual(activities.slice(0, 2));
  });

  it("busca fuera de las dos primeras y mantiene el orden original", () => {
    expect(visibleActivities(activities, " fullbody ").map(({ id }) => id)).toEqual(["1", "4"]);
  });

  it.each(["TRACCION", "Tracción", "traccio\u0301n", " bíceps ", "BICEPS"])("normaliza mayúsculas y tildes (%j)", (query) => {
    expect(visibleActivities(activities, query).map(({ id }) => id)).toEqual(["3"]);
  });

  it("devuelve una lista vacía cuando no hay coincidencias", () => {
    expect(visibleActivities(activities, "natación")).toEqual([]);
  });

  it.each(["", "piernas"])("tolera una cuenta sin entrenamientos (%j)", (query) => {
    expect(visibleActivities([], query)).toEqual([]);
  });

  it("no limita los resultados de una búsqueda a dos filas ni modifica los datos", () => {
    const rows = Object.freeze(Array.from({ length: 12 }, (_, index) => Object.freeze({ id: String(index), name: "Piernas" })));
    expect(visibleActivities(rows, "piernas")).toEqual(rows);
    expect(visibleActivities(rows, "")).not.toBe(rows);
    expect(rows).toHaveLength(12);
  });
});
