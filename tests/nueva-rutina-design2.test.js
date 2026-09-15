import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const pageSource = read("app/(app)/rutinas/nueva/page.js");
const composerSource = read("components/design2/RoutineComposer.js");
const itemSource = read("components/design2/ExerciseItem.js");
const pickerSource = read("components/design2/ExercisePicker.js");
const navSource = read("lib/nav/redesigned.js");
const cssSource = read("app/design2.css");

describe("Pantalla de nueva rutina", () => {
  it("usa los componentes de design2 y no el armador viejo", () => {
    expect(pageSource).toContain("<RoutineComposer");
    expect(pageSource).not.toContain("RoutineBuilder");
  });

  it("está declarada como rediseñada", () => {
    expect(navSource).toContain('"/rutinas/nueva"');
  });

  it("manda al cliente solo lo que la pantalla dibuja", () => {
    // El catálogo son 94 ejercicios con descripciones largas en dos idiomas.
    expect(pageSource).toContain("mediaUrl: exercise.mediaUrl || null");
    expect(pageSource).not.toContain("descriptionEs");
  });

  it("guarda con la acción de servidor que ya existía", () => {
    expect(composerSource).toContain('from "@/app/(app)/rutinas/actions"');
    expect(composerSource).toContain("createRoutine(");
  });
});

describe("Armador", () => {
  it("prescribe segundos y no repeticiones en los ejercicios de tiempo", () => {
    expect(composerSource).toContain("isTimeBasedRegistration(exercise.registrationType) ? 30 : 10");
  });

  it("arma el item con la forma que espera la acción de guardado", () => {
    for (const field of ["exerciseId", "exerciseSource", "targetSets", "targetReps", "targetRIR"]) {
      expect(composerSource).toContain(field);
    }
  });

  it("el reparto muscular sale del catálogo y no de una estimación", () => {
    expect(composerSource).toContain("muscleDistribution");
  });

  it("no deja guardar una rutina sin nombre ni sin ejercicios", () => {
    expect(composerSource).toContain("Ponele un nombre a la rutina.");
    expect(composerSource).toContain("Agregá al menos un ejercicio.");
  });

  it("no fija colores a mano: todo sale del tema", () => {
    expect(composerSource).not.toMatch(/text-white\b|bg-white\b|#[0-9a-fA-F]{6}/);
  });
});

describe("Selector de ejercicios", () => {
  it("permite elegir varios y confirmarlos de una", () => {
    // Volver al armador por cada ejercicio obliga a repetir búsqueda y filtro.
    expect(pickerSource).toContain("onConfirm(results.filter");
    expect(pickerSource).toContain("chosen.size === 1 ? \"ejercicio\" : \"ejercicios\"");
  });

  it("no deja agregar dos veces el mismo ejercicio", () => {
    expect(pickerSource).toContain("alreadyAdded.has(exercise.id)");
    expect(pickerSource).toContain("disabled={added}");
  });

  it("filtra por región muscular y por texto", () => {
    expect(pickerSource).toContain("MUSCLE_REGIONS");
    expect(pickerSource).toContain("filterExercises(exercises, { query, region })");
  });

  it("acredita las animaciones donde se ven", () => {
    // Los gifs son © Gym visual, no son de dominio público.
    expect(pickerSource).toContain("Gym visual");
    expect(pickerSource).toContain("https://gymvisual.com/");
  });

  it("deja animar los gifs en vez de optimizarlos", () => {
    // next/image sin unoptimized congela el gif en el primer cuadro.
    expect(pickerSource).toContain("unoptimized");
    expect(itemSource).toContain("unoptimized");
  });

  it("muestra un icono cuando el ejercicio no tiene animación", () => {
    expect(pickerSource).toContain("<WeightIcon");
    expect(itemSource).toContain("<WeightIcon");
  });
});

describe("Estilo de las miniaturas", () => {
  it("el recuadro va claro en todos los temas", () => {
    // Las animaciones son trazo negro sobre blanco: sobre el vidrio de un tema
    // oscuro no se ven.
    expect(cssSource).toMatch(/\.d2-ex-thumb \{[^}]*background: #f2f3f4/);
  });

  it("el nombre y el músculo se apilan en vez de pegarse", () => {
    // Son span, que por defecto son inline.
    expect(cssSource).toMatch(/\.d2-ex-name \{ display: block/);
    expect(cssSource).toMatch(/\.d2-ex-muscle \{ display: block/);
  });

  it("la barra de músculo tiene alto propio", () => {
    // Un span inline ignora height y la barra no se dibuja.
    expect(cssSource).toMatch(/\.d2-muscle-bar \{ display: block/);
  });
});

describe("Prescripción por ejercicio", () => {
  it("el ejercicio nuevo arranca con todas las series iguales", () => {
    // sets en null es la forma "pareja"; se llena recién al detallar.
    expect(composerSource).toContain("sets: null");
    expect(composerSource).toContain("targetWeight: null");
    expect(composerSource).toContain("targetRIR: null");
  });

  it("deja prescribir series, reps, peso y RIR", () => {
    for (const label of ['label="Series"', "label={repsLabel}", 'label="Peso (kg)"', 'label="RIR"']) {
      expect(itemSource).toContain(label);
    }
  });

  it("pide tiempo y no repeticiones en los ejercicios de tiempo", () => {
    expect(itemSource).toContain('timeBased ? "Tiempo (s)" : "Reps"');
  });

  it("pide peso solo donde tiene sentido", () => {
    // En peso corporal o en plancha, un campo de kilos sobra.
    expect(itemSource).toContain('exercise?.registrationType === "peso_reps"');
    expect(itemSource).toContain("showWeight &&");
  });

  it("permite prescribir cada serie por separado", () => {
    // El caso: 4 series de press con 10, 12, 14 y 16 repeticiones.
    expect(itemSource).toContain("Prescribir cada serie por separado");
    expect(itemSource).toContain("buildSets(item)");
    expect(itemSource).toContain("toUniform(item)");
  });

  it("al cambiar la cantidad de series ajusta las filas detalladas", () => {
    expect(itemSource).toContain("resizeSets(item.sets, total)");
  });

  it("se abre de a un ejercicio", () => {
    // Una rutina de diez ejercicios con todos los campos abiertos no se lee.
    expect(itemSource).toContain("aria-expanded={open}");
    expect(itemSource).toContain("aria-controls={detailId}");
  });

  it("un campo vacío se guarda como null y no como cero", () => {
    // Un RIR de 0 significa al fallo; vacío significa que no se prescribió.
    expect(itemSource).toContain('onChange(raw === "" ? null : Number(raw))');
  });
});
