# Eval: GIFs del catálogo en iOS

## Resultado medible

Las miniaturas de ejercicios con `mediaUrl` terminada en `.gif` muestran la
animación en el selector de ejercicios y en las pantallas que usan `Miniatura`.
Los formatos no GIF siguen usando `AsyncImage`.

## Casos

- Abrir Rutinas, tocar `+` y abrir el selector.
- Buscar `Press de banca con barra`: aparece su miniatura animada, no el ícono de mancuerna.
- Desplazar la lista y volver al ejercicio: la miniatura se mantiene y no vuelve a descargarla.
- Abrir una rutina existente con ejercicios con GIF: las miniaturas siguen visibles.
- Ver un ejercicio sin `mediaUrl`: aparece el placeholder de mancuerna.

## Gate

`xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym -destination 'platform=iOS Simulator,name=iPhone 17 Pro'`
