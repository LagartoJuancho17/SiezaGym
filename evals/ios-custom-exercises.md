# Eval: ejercicios propios desde la app

## Resultado medible

Si el ejercicio no está en el catálogo de 94, se puede cargar sin salir del
armador de rutinas, con un video de YouTube de referencia, y usarlo en la rutina
en el mismo momento. Queda guardado en `users/{uid}/customExercises`, que es
privado: solo lo ven su dueño y su entrenador.

## Casos

- En el selector de ejercicios hay un `+` a la derecha del buscador.
- Buscar algo que no existe: el estado vacío ofrece **Crearlo yo**, y el
  formulario abre con ese texto ya puesto como nombre.
- Pegar un link de YouTube en cualquiera de sus formas (`youtu.be/…`,
  `watch?v=…`, `shorts/…`, con `?si=` o `&t=`): aparece la portada del video al
  lado del campo.
- Pegar algo que no es de YouTube: el borde se marca, dice "Ese link no es de
  YouTube" y no deja guardar.
- El video es opcional: sin link se guarda igual y la miniatura queda como la
  pesa gris.
- Tocar un músculo lo suma al reparto; tocarlo de nuevo sube su participación
  (×2, ×3) y a la cuarta lo saca. Con dos o más aparece el reparto en
  porcentajes.
- **Los porcentajes siempre suman 100.** Tres músculos iguales dan 34/33/33, no
  33/33/33: la web rechaza el documento si no suma 1.0.
- Sin nombre o sin músculos no deja guardar, y dice cuál falta.
- Guardado, el ejercicio queda **marcado** y el selector pasa al filtro
  **Tus ejercicios**: se creó para usarlo ahora.
- El chip **Tus ejercicios** solo aparece si tenés alguno.
- La fila dice `Tuyo · <músculo principal>`.
- El ejercicio propio se puede agregar a la rutina como cualquier otro, y al
  guardarla el documento lleva `exerciseSource: "custom"`.
- Cerrar y volver a abrir la app: el ejercicio sigue ahí (viene de Firestore
  junto con el catálogo).
- **En la web**: aparece en su selector de ejercicios y el buscador lo encuentra
  (por `searchTextEs`). El video no se ve todavía: `videoUrl` es un campo que
  por ahora solo usa la app.

## Lo que todavía no está

No se puede **borrar ni editar** un ejercicio propio desde la app. La función
existe en la web (`deleteCustomExercise`) pero no está conectada a ninguna
pantalla, ni ahí ni acá. Un ejercicio mal cargado se queda.

## Gate

`xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym -destination 'platform=iOS Simulator,name=iPhone 17 Pro'`
