/**
 * Acciones de una rutina, para el menú que se abre al mantenerla presionada.
 *
 * Es una función y no una lista fija porque dos de las acciones dependen de la
 * rutina: la de portada cambia de texto según cómo esté, y una rutina asignada
 * por el entrenador no ofrece ninguna.
 */

/**
 * Una rutina asignada es la copia que el entrenador le dejó al alumno: no se
 * edita, no se duplica y no se borra desde acá. Devolver la lista vacía es lo
 * que hace que ni se abra el menú, en vez de abrir uno con todo apagado.
 */
export function routineMenuActions(routine) {
  if (!routine || routine.isAssigned) return [];

  return [
    { id: "editar", label: "Editar" },
    {
      id: "portada",
      label: routine.showOnHome ? "Quitar de la portada" : "Mostrar en la portada",
    },
    { id: "duplicar", label: "Duplicar" },
    // Última y aparte: es la única que no se puede deshacer.
    { id: "eliminar", label: "Eliminar", danger: true },
  ];
}

export function hasMenu(routine) {
  return routineMenuActions(routine).length > 0;
}
