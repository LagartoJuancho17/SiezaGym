import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const css = read("app/design2.css");

/** Las clases que usa un componente tienen que tener estilos: sin eso se ve roto. */
function missingClasses(source, prefixes) {
  // Solo nombres de clase: los ids (aria-labelledby) no llevan estilos.
  const classes = (source.match(/className=\{?[`"][^`"]*[`"]/g) || []).join(" ");
  const used = new Set(classes.match(/d2-[a-z0-9-]+/g) || []);
  return [...used].filter((name) => prefixes.some((prefix) => name.startsWith(prefix)) && !css.includes(`.${name}`));
}

describe("Evaluación de las mejoras de entrenamiento (Trello)", () => {
  it("cronómetro estilo iPhone al tocar el tiempo, con estilos completos", () => {
    const exercise = read("components/design2/RoutineExercise.js");
    const sheet = read("components/design2/StopwatchSheet.js");
    expect(exercise).toContain('className="d2-log-time"');
    expect(exercise).toContain("StopwatchSheet");
    expect(missingClasses(sheet, ["d2-sw"])).toEqual([]);
  });

  it("video de YouTube dentro de la app, sin salir", () => {
    const embed = read("components/design2/VideoEmbed.js");
    expect(embed).toContain("<iframe");
    expect(embed).toContain('referrerPolicy="strict-origin-when-cross-origin"');
    expect(css).toContain(".d2-video iframe");
  });

  it("notas: de la rutina, la última anotada y la de hoy, guardadas en la sesión", () => {
    const exercise = read("components/design2/RoutineExercise.js");
    expect(exercise).toContain("Nota de la rutina");
    expect(exercise).toContain("La última vez anotaste");
    expect(exercise).toContain("Nota de hoy");
    expect(missingClasses(exercise, ["d2-ex-note", "d2-note-"])).toEqual([]);
    expect(read("app/(app)/historial/[id]/page.js")).toContain("exercise.note");
  });

  it("botones de la planilla de al menos 48 px", () => {
    for (const rule of [".d2-stepper-btn {", ".d2-log-check {"]) {
      const last = css.lastIndexOf(rule);
      expect(last, rule).toBeGreaterThan(-1);
    }
    expect(css).toMatch(/\.d2-log-check \{ width: calc\(50 \* var\(--d2-u\)\)/);
    expect(css).toMatch(/\.d2-stepper-btn \{ width: calc\(40 \* var\(--d2-u\)\); height: calc\(50/);
  });

  it("sonido distinto al terminar el ejercicio completo", () => {
    const exercise = read("components/design2/RoutineExercise.js");
    expect(exercise).toContain("playSetFeedback({ completesExercise: completesExercise(rows, index) })");
  });

  it("más colores y color propio para los bloques", () => {
    const composer = read("components/design2/RoutineComposer.js");
    expect(composer).toContain('type="color"');
    expect(missingClasses(composer, ["d2-group-"])).toEqual([]);
  });

  it("los modales se dibujan fuera de la tarjeta de vidrio (backdrop-filter rompe position: fixed)", () => {
    expect(read("components/design2/StopwatchSheet.js")).toContain("<ModalPortal>");
    expect(read("components/design2/RoutineExercise.js")).toMatch(/showMediaModal && hasMedia && \(\s*<ModalPortal>/);
    expect(read("components/design2/ModalPortal.js")).toContain('document.querySelector(".d2")');
  });
});
