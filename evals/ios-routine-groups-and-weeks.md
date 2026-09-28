# Eval: bloques de ejercicios, semana asignada y agrupamiento de Rutinas (iOS)

## Resultado medible

Dentro de una rutina se pueden agrupar ejercicios consecutivos en bloques con
nombre y color ("Entrada en calor", "Fuerza", "Potencia"), una rutina propia
se puede marcar como asignada a la semana calendario en curso mostrándose en
la Home bajo un rótulo como "Septiembre · Semana 4", y la lista de Rutinas
agrupa **todas** las rutinas por mes y semana del mes automáticamente, según
su propia fecha — sin que el usuario asigne nada a mano.

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

## Rutinas agrupadas por mes y semana (puerto exacto de `groupByMonthAndWeek` + `weekSections`)

- No es lo mismo que "semana asignada": ese campo (`weekKey`) es manual y sólo
  para rutinas propias que el usuario decide anclar a la semana actual. Esto
  es automático, corre sobre **todas** las rutinas (propias y del coach) y no
  escribe nada en Firestore — es puro cálculo sobre `referenceDate`
  (`assignedAt` si existe, si no `createdAt`).
- Una sección por cada combinación mes+semana con al menos una rutina, nunca
  semanas vacías. Verificado en el simulador con dos rutinas reales: una del
  28/9/2026 (semana 4) y otra parcheada a mano al 3/9/2026 (semana 1) — la
  lista mostró "Septiembre · Semana 1" y "Septiembre · Semana 4" como
  secciones separadas, en ese orden.
- Los meses van del más nuevo al más viejo; dentro de un mes, semana 1 antes
  que semana 2 — mismo orden que `groups[0].weeks.map(w => w.label)` en
  `tests/routines-schedule.test.js` de la web.
- Con una búsqueda en curso se desarma: pasa a lista plana sin secciones
  (`RoutinesScreen.agrupar`), igual que `shouldGroupByMonth` en
  `lib/routines/filter.js`.
- `TrainingCalendar.seccionesPorSemana(_:fechaDe:)`, cubierto por
  `SeccionesPorSemanaTests` en `TrainingCalendarTests.swift` (6 casos: rótulo
  correcto, orden de meses, orden de semanas, mismo-semana agrupa, sin fecha
  al final, lista vacía).

## Lo que falta (con qué se pactó explícitamente no hacer ahora)

- **La semana asignada no existe en la web.** Es sólo del teléfono; si se
  quiere igual en el navegador, es trabajo nuevo del lado de Next.js/Firestore,
  no un puerto. El agrupamiento automático de Rutinas sí existe en la web
  (`RoutineList.js`) — ahí es puerto real, no pendiente.
- Sólo la semana **actual** para la asignación manual: no hay calendario para
  asignar a una semana pasada o futura, ni navegación entre semanas. Si
  hiciera falta, es una ampliación sobre el mismo campo `weekKey`, no un
  cambio de modelo.