# Eval: editar una rutina desde la app

## Resultado medible

Una rutina propia se puede cambiar entera sin salir de la app —nombre, nota,
ejercicios, prescripción y orden— y el documento que queda es el mismo que
escribiría la web.

## Casos

- Entrar a una rutina propia: hay un lápiz arriba a la derecha.
- En una rutina **del coach** no aparece: esas se editan desde su panel, y
  viven en otra colección (`assignments`).
- El editor abre con todo cargado: nombre, nota, ejercicios en su orden, y cada
  prescripción como estaba.
- **Guardar sin tocar nada deja la rutina igual.** Es la prueba de que abrir el
  editor no pierde nada: mismos ejercicios, mismas series, mismo reparto.
- Una rampa (10, 12, 14, 16) sigue siendo una rampa después de editar; no se
  aplasta a "4 × 10".
- Un ejercicio propio sigue guardándose con `exerciseSource: "custom"`.
- Agregar ejercicios, sacarlos, reordenarlos y cambiar series/reps/peso/RIR
  funciona igual que al crear: es la misma pantalla.
- Al volver, el detalle muestra lo editado sin salir y entrar de nuevo.
- Sin nombre o sin ejercicios no deja guardar.
- **La rutina no se va al fondo de la lista después de editarla**: `lastUsedAt`
  y `createdAt` no se tocan, solo `updatedAt`.
- En la web, la rutina editada se abre igual.

## Gate

`xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym -destination 'platform=iOS Simulator,name=iPhone 17 Pro'`
