import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sessionExercisesFromLogs } from "@/lib/assignments/assignments";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const pageSource = read("app/(app)/rutinas/[id]/page.js");
const editPageSource = read("app/(app)/rutinas/[id]/editar/page.js");
const screenSource = read("components/design2/RoutineScreen.js");
const exerciseSource = read("components/design2/RoutineExercise.js");
const composerSource = read("components/design2/RoutineComposer.js");
const actionsSource = read("app/(app)/rutinas/[id]/actions.js");
const assignmentsSource = read("lib/assignments/assignments.js");
const navSource = read("lib/nav/redesigned.js");
const cssSource = read("app/design2.css");

describe("Pantalla del detalle de una rutina", () => {
  it("usa los componentes de design2 y no el detalle viejo", () => {
    expect(pageSource).toContain("<RoutineScreen");
    expect(pageSource).not.toContain("components/routines/RoutineDetail");
  });

  it("está declarada como rediseñada para que no le entre el chrome viejo", () => {
    expect(navSource).toContain("/^\\/rutinas\\/[^/]+$/");
  });

  it("manda al cliente solo lo que la pantalla dibuja", () => {
    // El catálogo son 94 ejercicios con descripciones largas en dos idiomas.
    expect(pageSource).toContain("mediaUrl: exercise?.mediaUrl || null");
    expect(pageSource).toContain('description: exercise?.descriptionEs || ""');
    expect(pageSource).not.toContain("descriptionEn");
  });

  it("no fija colores a mano: todo sale del tema", () => {
    expect(screenSource).not.toMatch(/text-white\b|bg-white\b|#[0-9a-fA-F]{6}/);
    expect(exerciseSource).not.toMatch(/text-white\b|bg-white\b|#[0-9a-fA-F]{6}/);
  });
});

describe("Números del encabezado", () => {
  it("cuenta ejercicios, series y minutos de la rutina y no a ojo", () => {
    expect(pageSource).toContain("totalSets: totalSets(source)");
    expect(pageSource).toContain("estimatedMinutes: estimatedDurationMinutes(source, lookup)");
  });

  it("dice que el tiempo es estimado", () => {
    // Es una cuenta sobre las series prescritas, no un tiempo medido.
    expect(screenSource).toContain("min estimados");
  });

  it("el reparto muscular sale del catálogo y no de una estimación", () => {
    expect(pageSource).toContain("muscleDistribution(source, lookup)");
  });

  it("no inventa nada cuando la rutina está vacía", () => {
    // El detalle viejo mostraba 55 min, 18 series y un reparto fijo de
    // pecho/hombros/tríceps cuando no había datos.
    expect(screenSource).not.toMatch(/\|\|\s*55|\|\|\s*18/);
    expect(screenSource).toContain("Esta rutina no tiene ejercicios.");
  });
});

describe("Despliegue de los ejercicios", () => {
  it("se abre de a un ejercicio", () => {
    expect(exerciseSource).toContain("aria-expanded={open}");
    expect(exerciseSource).toContain("aria-controls={detailId}");
  });

  it("muestra una fila por serie, también con una rampa", () => {
    // El caso: press con 10, 12, 14 y 16 repeticiones.
    expect(pageSource).toContain("sets: plannedSets(item)");
    expect(exerciseSource).toContain("exercise.sets.map((set)");
  });

  it("pide tiempo y no repeticiones en los ejercicios de tiempo", () => {
    expect(exerciseSource).toContain('exercise.timeBased ? "Tiempo" : "Reps"');
    expect(pageSource).toContain("isTimeBasedRegistration(exercise?.registrationType)");
  });

  it("muestra peso solo donde tiene sentido", () => {
    // En peso corporal o en plancha, una columna de kilos sobra.
    expect(pageSource).toContain('exercise?.registrationType === "peso_reps"');
    expect(exerciseSource).toContain("exercise.showWeight &&");
  });

  it("esconde la columna de RIR si la rutina no lo prescribió", () => {
    expect(exerciseSource).toContain("exercise.sets.some((set) => set.rir != null)");
  });

  it("un valor que no se prescribió se muestra como raya y no como cero", () => {
    expect(exerciseSource).toContain('return <span className="d2-plan-cell d2-plan-cell-empty">—</span>');
  });

  it("acredita las animaciones donde se ven", () => {
    // Los gifs son © Gym visual, no son de dominio público.
    expect(screenSource).toContain("Gym visual");
    expect(screenSource).toContain("https://gymvisual.com/");
    expect(pageSource).toContain("hasMedia");
  });

  it("deja animar los gifs en vez de optimizarlos", () => {
    // next/image sin unoptimized congela el gif en el primer cuadro.
    expect(exerciseSource).toContain("unoptimized");
  });
});

describe("Entrenamiento", () => {
  it("tiene el botón de comenzar", () => {
    expect(screenSource).toContain("Comenzar entrenamiento");
    expect(screenSource).toContain("disabled={routine.exercises.length === 0}");
  });

  it("la planilla arranca con lo prescrito", () => {
    expect(screenSource).toContain("startSheet(routine.exercises)");
  });

  it("indexa la planilla por posición y no por id de ejercicio", () => {
    // Una rutina puede repetir el mismo ejercicio; con el id como clave las dos
    // apariciones compartirían la misma planilla.
    expect(screenSource).toContain("rows={sheet[exercise.position] || []}");
    expect(screenSource).toContain("key={exercise.position}");
    expect(screenSource).not.toContain("sheet[exercise.exerciseId]");
  });

  it("una serie cuenta recién cuando se la marca", () => {
    // Guardar el plan sin confirmarlo sería inventar un entrenamiento.
    expect(screenSource).toContain("sessionExercises(routine.exercises, sheet)");
    expect(screenSource).toContain("Marcá al menos una serie");
  });

  it("el cronómetro se lee del reloj del sistema", () => {
    // Un contador que se incrementa se atrasa y se frena en segundo plano.
    expect(screenSource).toContain("elapsedSeconds({ ...clock, now })");
    expect(screenSource).toContain("setNow(Date.now())");
  });

  it("deja pausar sin perder el tiempo ya contado", () => {
    expect(screenSource).toContain("pausedMs: current.pausedMs + (Date.now() - current.pausedAt)");
  });

  it("avisa antes de perder un entrenamiento abierto", () => {
    expect(screenSource).toContain('window.addEventListener("beforeunload", warn)');
    expect(screenSource).toContain("¿Salir del entrenamiento?");
  });

  it("esconde la barra de pestañas mientras se entrena", () => {
    // Un toque al azar no puede hacer perder lo cargado.
    expect(screenSource).toContain("{!running && <TabBar />}");
  });

  it("si falla el guardado no se pierde lo cargado", () => {
    expect(screenSource).toContain("No se pudo guardar el entrenamiento.");
    expect(screenSource).toContain("setClock((current) => ({ ...current, pausedAt: null }))");
  });

  it("muestra los totales que devolvió el servidor y no una cuenta propia", () => {
    expect(screenSource).toContain("sets: result.totalSetsCompleted");
    expect(screenSource).toContain("volumeKg: result.totalVolumeKg");
  });

  it("deja agregar y sacar series en el momento", () => {
    expect(screenSource).toContain("appendSet(current[exercise.position])");
    expect(screenSource).toContain("dropSet(current[exercise.position])");
  });
});

describe("Guardado del entrenamiento", () => {
  it("la rutina propia guarda una sesión y queda marcada como usada", () => {
    expect(actionsSource).toContain("createSession(user.uid, {");
    expect(actionsSource).toContain("markRoutineUsed(user.uid, routineId)");
  });

  it("refresca las pantallas que leen de sesiones", () => {
    for (const path of ['revalidatePath("/")', 'revalidatePath("/historial")', 'revalidatePath("/progreso")']) {
      expect(actionsSource).toContain(path);
    }
  });

  it("la rutina asignada arma la sesión con lo que quedó registrado", () => {
    // Las series ya se guardaron de a una para que el coach las vea en vivo.
    expect(screenSource).toContain("logExerciseSet(routine.assignmentId, exercise.position, index");
    expect(actionsSource).toContain("completeAssignmentSessionDb(user.uid, assignmentId, durationSeconds)");
  });

  it("no crea dos sesiones por un mismo entrenamiento asignado", () => {
    // completeAssignmentSession ya crea la sesión adentro.
    expect(actionsSource).not.toMatch(/finishAssignmentWorkout[\s\S]*createSession/);
  });

  it("vacía los logs de la asignación al cerrarla", () => {
    // Si quedan, el próximo entrenamiento los vuelve a contar como propios.
    expect(assignmentsSource).toMatch(/exerciseLogs: \{\},[\s\S]{0,40}\}\);\n\n  return summary;/);
  });
});

describe("sessionExercisesFromLogs", () => {
  const exercises = [
    { exerciseId: "press", exerciseSource: "catalog" },
    { exerciseId: "remo", exerciseSource: "catalog" },
  ];

  it("cruza los logs contra la posición del ejercicio", () => {
    const logs = { 1: { sets: [{ reps: 10, weight: 30 }] } };
    expect(sessionExercisesFromLogs(exercises, logs)).toEqual([
      {
        exerciseId: "remo",
        exerciseSource: "catalog",
        order: 1,
        sets: [{ setNumber: 1, weight: 30, reps: 10, failed: false }],
      },
    ]);
  });

  it("descarta los ejercicios sin series cargadas", () => {
    expect(sessionExercisesFromLogs(exercises, { 0: { sets: [] } })).toEqual([]);
    expect(sessionExercisesFromLogs(exercises, {})).toEqual([]);
    expect(sessionExercisesFromLogs(exercises, null)).toEqual([]);
  });

  it("el peso corporal queda en 0 y la serie se guarda igual", () => {
    const logs = { 0: { sets: [{ reps: 45, weight: null }] } };
    expect(sessionExercisesFromLogs(exercises, logs)[0].sets[0]).toEqual({
      setNumber: 1,
      weight: 0,
      reps: 45,
      failed: false,
    });
  });
});

describe("Rutina asignada", () => {
  it("se entrena pero no se edita", () => {
    expect(pageSource).toContain("readOnly: true, students: []");
    expect(screenSource).toContain("const canEdit = !routine.readOnly;");
  });

  it("se nota de dónde viene", () => {
    expect(screenSource).toContain("Rutina del coach");
  });
});

describe("Editar una rutina", () => {
  it("reusa el armador en vez de duplicar la pantalla", () => {
    expect(editPageSource).toContain("<RoutineComposer");
    expect(editPageSource).not.toContain("RoutineBuilder");
    expect(composerSource).toContain("const editing = !!routine;");
    expect(composerSource).toContain("updateRoutine(routine.id, payload)");
  });

  it("solo el dueño llega", () => {
    expect(editPageSource).toContain("getUserRoutine(user.uid, id)");
    expect(editPageSource).toContain("if (!routine) notFound();");
  });

  it("está declarada como rediseñada", () => {
    expect(navSource).toContain("editar");
  });
});

describe("Estilo del detalle", () => {
  it("las filas de series van en flex y no en una plantilla de grid", () => {
    // La cantidad de columnas cambia según el ejercicio: sin peso, sin RIR.
    expect(cssSource).toMatch(/\.d2-plan-row \{ display: flex/);
    expect(cssSource).toMatch(/\.d2-log-row \{ display: flex/);
  });

  it("la serie confirmada usa el sólido del tema", () => {
    // El mismo que el día entrenado del calendario y la pestaña activa.
    expect(cssSource).toMatch(/\.d2-log-check-on \{ background: var\(--d2-ink\); color: var\(--d2-on-ink\)/);
  });

  it("la página reserva el alto de la barra de acción", () => {
    // Sin esto el último ejercicio queda abajo del botón.
    expect(cssSource).toContain(".d2-page-dock {");
  });

  it("entrenando la barra baja al borde, sin pestañas debajo", () => {
    expect(cssSource).toContain(".d2-dock-low {");
  });
});
