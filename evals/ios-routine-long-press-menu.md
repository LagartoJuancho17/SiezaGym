# Eval: menú de mantener presionado en Rutinas

## Resultado medible

Mantener presionada una rutina propia en la lista abre un menú con las cuatro
acciones que ya existían en la web (`routineMenuActions`): Editar, mostrar/quitar
de la portada, Duplicar y Eliminar. Una rutina del coach no ofrece nada.

## Casos

- Mantener presionada una rutina propia: aparece `.contextMenu` con 4 acciones,
  en este orden: Editar, portada, Duplicar, Eliminar.
- Mantener presionada una rutina **del coach** (`isAssigned == true`): no pasa
  nada, sin menú. Esas se editan desde su panel, igual que en la web
  (`routineMenuActions` devuelve `[]`).
- **Editar** abre `RoutineComposerScreen` precargado, igual que el lápiz del
  detalle — mismo flujo que [ios-routine-edit.md](ios-routine-edit.md).
- **Portada**: el texto y el ícono reflejan `rutina.showOnHome` en cada
  apertura del menú — "Quitar de la portada" (casa tachada) cuando ya está, o
  "Mostrar en la portada" (casa) cuando no. Tocar cambia `showOnHome` en
  Firestore y el menú refleja el nuevo estado la próxima vez que se abre.
- **Duplicar**: crea una rutina nueva con "(copia)" al final del nombre,
  mismos ejercicios y prescripciones, sin arrastrar `lastUsedAt`. Aparece en
  la lista de inmediato.
- **Eliminar**: pide confirmación primero (`¿Eliminar <nombre>?`, con el texto
  "No se puede deshacer. Los entrenamientos que ya hiciste con ella quedan en
  el historial.", igual que `RoutineHoldSheet` en la web) y solo borra al
  confirmar. Un error de red no rompe la lista: aparece la alerta "No se pudo
  hacer" con el mensaje de error.
- Ninguna acción requiere salir de Rutinas y volver a entrar para verse
  reflejada.

## Gate

`xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym -destination 'platform=iOS Simulator,name=iPhone 17'`

## Verificación manual (2026-09-30)

Corrida en simulador con una rutina propia de prueba (3 ejercicios):
menú con las 4 acciones confirmado, Duplicar generó "(copia)", el toggle de
portada cambió de ícono/texto entre aperturas, Eliminar mostró el diálogo
exacto y borró al confirmar, y Editar abrió el composer con todo precargado.
