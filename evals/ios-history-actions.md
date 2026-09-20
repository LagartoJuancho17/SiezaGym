# Eval: borrar sesiones y cerrar el teclado en iOS

## Resultado observable

En Historial, mantener apretada una sesión abre una acción `Eliminar sesión`,
pide confirmación y la quita de la lista después de borrarla en Firestore.
Solo el dueño de la sesión puede eliminarla.

## Casos

- Un toque normal sigue abriendo el detalle de la sesión.
- Mantener apretada una sesión muestra el menú contextual.
- Cancelar la confirmación conserva la sesión.
- Confirmar la eliminación la quita del historial sin recargar la app.
- Un error de red mantiene el historial y muestra un mensaje.
- Al editar nombre, notas, pesos, reps o buscar ejercicios aparece `Listo` en
  la barra del teclado.
- Deslizar el contenido hacia abajo también cierra el teclado.

## Gate

`xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym -destination 'platform=iOS Simulator,name=iPhone 17 Pro'`
