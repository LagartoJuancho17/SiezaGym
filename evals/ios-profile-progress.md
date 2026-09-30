# Eval: Perfil con el progreso adentro (iOS)

## Resultado medible

Progreso deja de ser su propia pestaña. La barra de abajo baja de cinco
destinos a cuatro (`Inicio`/`Rutinas`/`Historial`/`Perfil`), y las cinco
secciones que tenía `/progreso` (volumen por semana, días entrenados,
músculos, empuje y tracción, por ejercicio) viven ahora como una grilla de
accesos ("Tu progreso") dentro de Perfil, cada una con su propia pantalla.
Investigado contra apps de referencia (Hevy, Strong): se eligió el patrón de
panel-con-accesos de Hevy sobre el scroll único de Strong, para que cada
sección respire en su propia pantalla en vez de amontonarse.

## Investigación (apps de referencia)

- **Hevy**: el tab de perfil es encabezado + contador + una grilla 2×2 de
  tarjetas (Estadísticas, Ejercicios, Medidas, Calendario) que abren pantallas
  propias. Patrón elegido acá.
- **Strong**: el tab de perfil es un dashboard de widgets agregables/
  reordenables, todo en una sola pantalla larga. Patrón considerado y
  descartado por ahora (más trabajo, sin pedido explícito de reordenar).
- Consenso de las dos: el progreso vive junto al perfil, no en una pestaña
  aparte — coincide con lo pedido.

## Casos

- La barra de abajo tiene cuatro destinos, no cinco: no hay ícono de
  calendario (el de Progreso) en ningún lado.
- Perfil muestra, en orden: identidad, los tres números de siempre
  (entrenamientos/series/racha), la sección "Tu progreso", "Tus datos",
  "Configuración", "Cerrar sesión".
- **Sin haber terminado ningún entrenamiento, "Tu progreso" muestra un solo
  mensaje vacío** ("Todavía no terminaste ningún entrenamiento...") en vez de
  una grilla de tarjetas en cero.
- Con al menos un entrenamiento, la grilla tiene cinco tarjetas (Volumen, Días
  entrenados, Músculos, Empuje y tracción, Por ejercicio), cada una con el
  dato más importante de esa vista, no solo un ícono y un título.
- **Músculos y Empuje y tracción dicen "Sin datos todavía"/"Sin datos" si las
  series se cargaron sin peso** (volumen en 0): la cuenta exige
  `volumen > 0`, es el comportamiento correcto y no un bug, verificado en vivo
  con una rutina de prueba a 0 kg.
- Cada tarjeta abre su propia pantalla con flecha para volver, empujada sobre
  la pila de navegación de Perfil (no una pestaña ni un modal propio).
- **Músculos muestra hasta 8 filas**, no las 3 que usa el resumen de Inicio
  (`store.muscleVolume` tiene `limit: 3` por defecto; esta pantalla llama a
  `HomeMetrics.volumeByMuscleGroup` directo con `limit: 8`).
- **Por ejercicio muestra hasta 30 filas**, no las 12 del resumen viejo.
- Home ("Tu espacio") ya no tiene la fila "Progreso": solo queda "Historial".
- Verificado en el simulador con una rutina y un entrenamiento reales: Volumen
  mostró "0 esta semana" (series a 0 kg), Días entrenados mostró "1 en total"
  y la grilla de contribución con el día de hoy marcado, Por ejercicio mostró
  los dos ejercicios entrenados con "1 entrenamiento" cada uno.

## Decisión de arquitectura: por qué el snapshot del widget no pudo hacer lo mismo

`WidgetSnapshot` (para los widgets de home, no esta pantalla) no puede
importar `HomeMetrics` directo aunque viva en el mismo repo: `HomeMetrics`
está en el target de la app y `WidgetSnapshot.swift` se compila también en la
extensión de widgets, que no ve ese target. Las cinco pantallas de esta
pantalla sí pueden, porque viven en `SiezaGym/Features/Profile/` (target de la
app) igual que `ProgressMetrics`, que siempre vivió ahí. Dos problemas
parecidos, cada uno con su propia solución según qué target los toca.

## Gate

`xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym -destination 'platform=iOS Simulator,name=iPhone 17 Pro'`
