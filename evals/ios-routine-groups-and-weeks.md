# Eval: bloques de ejercicios y semana asignada (iOS)

## Resultado medible

Dentro de una rutina se pueden agrupar ejercicios consecutivos en bloques con
nombre y color ("Entrada en calor", "Fuerza", "Potencia"), y una rutina propia
se puede marcar como asignada a la semana calendario en curso, mostrándose en
la Home bajo un rótulo como "Septiembre · Semana 4".

## Bloques de ejercicios (puerto exacto de `RoutineComposer.js` / `RoutineScreen.js`)

- Ejercicios consecutivos con el mismo nombre **y** color de grupo se funden
  en una sola tanda. Dos bloques "Fuerza" separados por otro bloque en el
  medio son dos tandas distintas: agrupar no reordena, sólo junta lo que ya
  está consecutivo.
- Con nombre pero sin color explícito, cae en `teal` — mismo criterio que
  `item.groupColor || (groupName ? "teal" : "")` en la web.
- Seis presets rápidos (Movilidad/teal, Fuerza/amber, Descanso/blue,
  Calentamiento/emerald, Core/purple, Cardio/rose) más nombre libre.
- Se puede aplicar el grupo también a los siguientes N ejercicios sin grupo
  ("aplicar en lote"), y sacar el grupo de toda una tanda tocando su
  encabezado.
- Persistencia: `group` y `groupColor`, siempre presentes en el documento
  (string vacío sin grupo, nunca ausentes) — mismas claves que
  `sanitizeExercises` en `lib/routines/routines.js`.
- Se ve en las tres pantallas que tocan una rutina: armador (con el modal de
  edición), detalle (de sólo lectura) y entrenamiento en curso.

## Semana asignada (nuevo, sólo iOS)

- El número de semana es por bloques de 7 días del mes (día 1-7 → semana 1,
  8-14 → semana 2, ...), reutilizando `TrainingCalendar.weekOfMonth` que ya
  existía para la racha. El 24 de septiembre es semana 4.
- La clave de guardado (`weekKey`, ej. `"2026-09-4"`) incluye año y mes: la
  semana 4 de septiembre de 2026 nunca se confunde con la semana 4 de
  septiembre de 2025 ni con la de octubre.
- Sólo rutinas propias: las asignadas por un coach se organizan solas por
  cuándo se las asignaron, no se pueden meter a mano en una semana.
- La Home muestra una sección con el rótulo de la semana actual
  ("Septiembre · Semana 4") y las rutinas que le asignaste; vacía, invita a
  abrir una rutina y agregarla desde ahí.
- Desde el detalle de una rutina propia, un botón alterna "Agregar a esta
  semana" / "En Septiembre · Semana 4" (ya asignada, con tilde).

## Lo que falta (con qué se pactó explícitamente no hacer ahora)

- **No existe en la web.** Es sólo del teléfono; si se quiere igual en el
  navegador, es trabajo nuevo del lado de Next.js/Firestore, no un puerto.
- Sólo la semana **actual**: no hay calendario para asignar a una semana
  pasada o futura, ni navegación entre semanas. Si hiciera falta, es una
  ampliación sobre el mismo campo `weekKey`, no un cambio de modelo.
ARCHIVO
echo "eval escrito"