import data from "@/contracts/rutinas-armadas.json";

/**
 * Las rutinas armadas (upper, lower, full body...). Es la misma lista que usa
 * la app de iOS: vive en contracts/ y tests/routine-templates.test.js la valida
 * contra el catálogo.
 */
export function listTemplates() {
  return data.rutinas;
}

export function getTemplate(id) {
  return data.rutinas.find((template) => template.id === id) || null;
}

/** "Intermedio · 2 a 4 por semana" */
export function templateDetail(template) {
  const level = template.nivel ? template.nivel[0].toUpperCase() + template.nivel.slice(1) : null;
  return [level, template.dias].filter(Boolean).join(" · ");
}

/**
 * Lo que se guarda al copiarla: nombre, nota y los ejercicios que existen en
 * el catálogo (un id que falte dejaría una fila que nadie puede mostrar).
 */
export function templateRoutineInput(template, catalogIds) {
  return {
    name: template.name,
    note: template.descripcion || "",
    exercises: template.exercises
      .filter((exercise) => catalogIds.has(exercise.exerciseId))
      .map(({ nombre: _nombre, ...exercise }) => ({ ...exercise, exerciseSource: "catalog" })),
  };
}
