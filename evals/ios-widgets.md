# Eval: widgets y actividad en vivo

## Resultado medible

Se puede ver el estado del entrenamiento sin abrir la app: la racha y la rutina
del día en la pantalla de inicio, y el entrenamiento en curso en la pantalla
bloqueada y en la Dynamic Island. Los números tienen que ser los mismos que
muestra la portada de la app.

## Widgets de la pantalla de inicio

- Mantener presionada la pantalla de inicio → Editar → Agregar widget → buscar
  `SiezaGym`: aparecen **Racha** (chico), **Hoy** (mediano), **Calorías**,
  **Series** y **Músculos** (chicos).
- En la galería se ve el ejemplo (12 días, Empuje A, 92% de calorías, 94% de
  series, pecho/dorsal/cuádriceps), no ceros.
- Agregado, muestra los datos reales: la misma racha, la misma semana y el mismo
  volumen que la portada.
- **Calorías, Series y Músculos son las mismas cuentas que "Tus objetivos" en
  la Home y "Músculos que trabaja" en Progreso** (`HomeMetrics.weeklyCalories`,
  `setCompletionRate`, `volumeByMuscleGroup`), nunca una versión propia. Como
  `HomeMetrics` vive en el target de la app y no en `SiezaGymCompartido`, el
  snapshot no lo puede usar directo: lleva espejos livianos
  (`ResumenCalorias`/`ResumenSeries`/`ResumenMusculos`) que arma
  `WidgetSnapshotBuilder`.
- **El widget usa el tema elegido en la app.** Cambiar de tema en Perfil →
  Configuración lo repinta sin volver a cargar datos.
- Cerrar sesión deja el widget vacío: no puede seguir mostrando la racha del
  usuario anterior.
- **Borrar un entrenamiento del historial también actualiza el widget.**
  `deleteSession` mutaba `sessions` en memoria pero no llamaba a
  `publicarWidget()`: la racha y el volumen de la semana quedaban contando una
  sesión que ya no existía hasta la próxima carga completa (relanzar la app).
- Sin haber abierto nunca la app, muestra el estado vacío y no ceros inventados.
- En la pantalla bloqueada (`accessoryCircular` / `accessoryRectangular` /
  `accessoryInline`) se lee en monocromo: ahí el sistema pinta todo de un color
  y los colores del tema no se aplican.
- A medianoche la tira de la semana y la racha pasan de día aunque no se abra la
  app (la línea de tiempo se recarga al inicio del día siguiente).

## Actividad en vivo del entrenamiento

- Empezar un entrenamiento: aparece en la Dynamic Island (pesa + cronómetro) y
  en la pantalla bloqueada.
- **El cronómetro lo corre el sistema**, no la app: sigue contando con la app
  cerrada y no gasta batería actualizándose.
- Marcar una serie actualiza el contador (`2/9`), la barra y `Serie 3 de 3` sin
  tocar la actividad a mano.
- El ejercicio que muestra es el primero con series sin marcar, no el que está
  abierto en pantalla.
- Con todas las series marcadas dice `Terminaste`.
- Salir del entrenamiento (guardando o descartando) cierra la actividad.
- Si la app se cerró mal y quedó una actividad colgada, al empezar la siguiente
  se cierra la vieja: nunca hay dos.
- **La isla expandida se dibuja siempre sobre negro**, así que va en blanco y no
  con los colores del tema (el sólido de Plata es casi negro y desaparecía).
- Con las actividades apagadas en Ajustes, el entrenamiento funciona igual.

## Lo que no se puede probar en el simulador

El grupo de llavero compartido necesita el entitlement firmado, que el simulador
no tiene (firma ad-hoc). Ahí `SnapshotStore` cae en el llavero local, que en el
simulador comparten todas las apps. En un iPhone de verdad el grupo es
`RW8N3MB9WH.com.siezagym.compartido`.

**Bug real, solo en iPhone: la racha quedaba siempre en 0 en el widget aunque
la app mostrara la correcta.** `SnapshotStore.escribir` hacía `SecItemUpdate`
filtrado por grupo y, si no encontraba nada, `SecItemAdd`. En un teléfono con
un ítem viejo del mismo service+account pero sin el grupo (de antes de tener
el grupo compartido bien armado, o de una build anterior de esta misma app),
el update no lo encontraba (grupo distinto) y el add chocaba contra él con
`errSecDuplicateItem` — silencioso, sin ningún error visible para quien usa la
app. `leer()` nunca encontraba nada bajo el grupo y caía siempre en
`.vacio`. Se confirmó comparando las entitlements firmadas de los dos targets
(`codesign -d --entitlements :- <app o .appex>`): coincidían exactas
(`RW8N3MB9WH.com.siezagym.compartido` en ambas), así que no era un problema de
configuración — era el ítem fantasma. Ahora `escribir`/`borrar` borran primero
sin filtrar por grupo antes de crear.

## Gate

`xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym -destination 'platform=iOS Simulator,name=iPhone 17 Pro'`
