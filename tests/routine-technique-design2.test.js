import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RoutineExercise from "@/components/design2/RoutineExercise";
import { sessionExercises, volumeKg } from "@/lib/routines/workout";

const exercise = { exerciseId: "press", name: "Press", sets: [{ reps: 10, weight: 40 }], showWeight: true, description: "Mantené los pies apoyados.", techniqueNote: "Bajada controlada" };
const render = (props = {}) => renderToStaticMarkup(createElement(RoutineExercise, { exercise, open: true, ...props }));
describe("Routine technique and failed sets parity", () => {
  it("offers native keyboard accessible technique during planning and training", () => {
    for (const running of [true, false]) {
      const html = render({ running });
      expect(html).toContain("<details");
      expect(html).toContain("<summary>Ver técnica</summary>");
      expect(html).toContain(exercise.description);
      expect(html).toContain(exercise.techniqueNote);
    }
  });
  it("shows explicit fallback when technique is unavailable", () => {
    expect(render({ exercise: { ...exercise, description: "" } })).toContain("Todavía no hay una descripción");
  });
  it("exposes failed state separately from completed state", () => {
    const html = render({ running: true, rows: [{ reps: 10, weight: 40, done: true, failed: true }] });
    expect(html).toContain('aria-label="Serie 1 fallada de Press"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Fallada");
  });
  it("does not offer unsupported failed flag in assigned routines", () => {
    expect(render({ running: true, allowFailed: false, rows: [{ reps: 10, weight: 40 }] })).not.toContain('class="d2-log-failed"');
  });
  it("persists failed sets but excludes their volume and unconfirmed attempts", () => {
    const sheet = { 0: [{ reps: 10, weight: 40, done: true, failed: true }, { reps: 5, weight: 30, done: true }, { reps: 8, weight: 50, done: false, failed: true }] };
    expect(volumeKg(sheet)).toBe(150);
    expect(sessionExercises([exercise], sheet)).toEqual([{ exerciseId: "press", sets: [{ setNumber: 1, weight: 40, reps: 10, failed: true }, { setNumber: 2, weight: 30, reps: 5, failed: false }] }]);
  });
});
