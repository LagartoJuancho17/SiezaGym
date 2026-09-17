# Eval: creación de rutinas desde iOS

## Resultado medible

Una persona autenticada puede crear una rutina desde la pestaña Rutinas y verla
en la lista después de guardar. El documento creado debe ser legible por la web
sin migración, y la pantalla tiene que ser la misma que `/rutinas/nueva`:
`RoutineComposer` + `ExerciseItem` + `ExercisePicker`.

## Casos

- Abrir Rutinas y tocar `+`: aparece `Nueva rutina`.
- Guardar sin nombre: se mantiene la pantalla y muestra `Ponele un nombre a la rutina.`.
- Guardar sin ejercicios: se mantiene la pantalla y muestra `Agregá al menos un ejercicio.`.
- Buscar un ejercicio, seleccionarlo y agregarlo: aparece una fila con su gif,
  el músculo principal y el resumen `3 × 10`.
- Filtrar por región (Pecho, Espalda, Hombros, Brazos, Piernas, Core): quedan
  solo los ejercicios que trabajan esos músculos.
- **Marcar un ejercicio, cambiar la búsqueda y marcar otro: el contador del pie
  dice 2 y los dos entran.** La búsqueda cambia lo que se ve, nunca la selección
  (`chosenExercises` en la web).
- Cambiar series, reps/tiempo, peso, RIR y nota técnica: los valores quedan
  visibles y el resumen de la fila cerrada los refleja.
- **Escribir 43 en Series: la caja queda en 12 y la rutina tiene 12 series.** El
  tope es `MAX_SETS`; la caja no puede mostrar un número que el modelo no aceptó.
- Tildar `Prescribir cada serie por separado`: aparece una fila por serie con el
  encabezado `Reps · Peso · RIR`. Cambiar la primera a 12 deja el resumen en
  `12 · 10 · 10`.
- Destildarlo: vuelve a la forma pareja tomando la primera serie.
- Subir y bajar un ejercicio con las flechas: cambia el orden sin perder las
  series cargadas.
- `Músculos que trabaja`: los porcentajes salen de `muscleWeights` del catálogo
  (series × peso, normalizado) y coinciden con los de la web para la misma
  rutina.
- Crear la rutina: el botón muestra `Guardando…`, vuelve a Rutinas y la nueva
  rutina aparece en la lista.
- Reabrirla desde la lista: conserva nombre, nota, orden, ejercicios y
  prescripción (incluida la rampa serie por serie).
- Crear con un ejercicio propio (creado en la web): la fila dice `Tuyo` y el
  documento guarda `exerciseSource: "custom"`.
- Dejar las repeticiones vacías: se guarda `targetReps: 10`, no `0`, igual que
  `Number(...) || 10` en `sanitizeExercises`.
- Con el catálogo todavía cargando el selector dice `Cargando ejercicios…`, no
  `Ningún ejercicio coincide.`.
- La atribución `Animaciones de ejercicios © Gym visual` está visible en el
  selector: es condición de la licencia de los gifs.
- Verificar en la web: la rutina aparece con el mismo nombre, nota, orden y
  prescripción.

## Gate

`xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym -destination 'platform=iOS Simulator,name=iPhone 17 Pro'`
