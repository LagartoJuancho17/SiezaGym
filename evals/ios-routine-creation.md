# Eval: creación de rutinas desde iOS

## Resultado medible

Una persona autenticada puede crear una rutina desde la pestaña Rutinas y verla
en la lista después de guardar. El documento creado debe ser legible por la web
sin migración.

## Casos

- Abrir Rutinas y tocar `+`: aparece `Nueva rutina`.
- Guardar sin nombre: se mantiene la pantalla y muestra `Poné un nombre a la rutina.`.
- Guardar sin ejercicios: se mantiene la pantalla y muestra `Agregá al menos un ejercicio.`.
- Buscar un ejercicio, seleccionarlo y agregarlo: aparece una fila configurable.
- Cambiar series, reps/tiempo, RIR y nota técnica: los valores quedan visibles.
- Crear la rutina: el botón muestra `Guardando...`, vuelve a Rutinas y la nueva
  rutina aparece en la lista.
- Reabrirla desde la lista: conserva nombre, ejercicios y prescripción.
- Crear con un ejercicio propio: el documento guarda `exerciseSource: "custom"`.
- Verificar en la web: la rutina aparece con el mismo nombre y ejercicios.

## Gate

`xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym -destination 'platform=iOS Simulator,name=iPhone 17 Pro'`
