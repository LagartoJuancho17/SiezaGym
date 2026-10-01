# SiezaGym iOS

App nativa de iPhone para el alumno, en SwiftUI. Habla con **el mismo Firestore
que la web**: lo que registrás en el gimnasio aparece en `sieza-gym.vercel.app` y
al revés. No hay una segunda base de datos ni sincronización que mantener.

- Xcode 26, iOS 18+, Swift 6 (concurrencia estricta, main actor por defecto)
- Firebase iOS SDK 12 (Auth + Firestore) + GoogleSignIn 9, por Swift Package Manager
- Bundle id `com.siezagym.app`

Login con email/contraseña **con segundo factor por mail**, o con Google. Entrar
con Google cae en la **misma cuenta de Firebase** que la web: mismo uid, mismas
rutinas.

## Bienvenida de tres pantallas

En el primer arranque, antes del login, se muestran tres pantallas con una
foto de entrenamiento a pantalla completa, un rótulo, el titular y los
controles (volver, Continuar/Empezar en Brasa y «Omitir»). Las fotos están en
el repo en blanco y negro (`Onboarding*.imageset`, en Git LFS) y se muestran
teñidas con los colores de la marca por `tonoMarca()`
(`DesignSystem/TonoMarca.swift` + `TonoMarca.metal`): un shader de Metal que
cambia la luz de cada píxel por un mapa negro → Brasa `#FF3201` → naranja
`#FF7601` → durazno. Para ajustar el tono se tocan las paradas de
`TonoMarca.paradas`, no las fotos. Explican tres pasos reales de la app: armar
rutinas, registrar series y consultar progreso; la tercera menciona Apple
Salud solo como conexión opcional. Se puede avanzar, volver u omitir. El último
botón y «Omitir» abren el login si no hay sesión, o la app directamente si ya
la hay. No se crea ninguna cuenta ni se piden permisos de Salud desde estas
pantallas.

La elección se guarda **una vez por instalación** en
`sieza.onboarding.completed.v1` (UserDefaults). Cerrar la app a mitad del
recorrido vuelve a mostrarlo desde el principio; al completarlo no reaparece
en cada apertura. Para revisar el primer arranque, desinstalá la app del
simulador y volvé a instalarla, o lanzala con
`xcrun simctl launch booted com.siezagym.app -sieza.onboarding.completed.v1 NO`.

Pruebas: `ios/SiezaGymTests/OnboardingFlowTests.swift` verifica orden, límites,
navegación y el mapa de color (negro en la sombra, Brasa exacto en el medio
tono, nunca más oscuro con más luz). `tests/ios-onboarding.eval.test.js`
comprueba que las fotos sean locales, verticales y livianas, que estén en LFS,
que se muestren teñidas y que el recorrido siga conectado al inicio de sesión.
Para revisión visual en iPhone chico/grande, comprobar que los títulos y
botones no se corten y que VoiceOver lea «Omitir», «Volver» y
«Continuar/Empezar» en ese orden.

## Conocerte (después del primer login)

Es el paso 02 del user flow: tres pantallas para armar el perfil de
entrenamiento (`Features/Onboarding/ConocerteView.swift`, lógica en
`ConocerteFlow.swift`). 1/3 objetivo (hipertrofia, fuerza, las dos, perder
grasa, salud), 2/3 días por semana (2 a 6) y experiencia, 3/3 peso con un
resumen (objetivo principal, frecuencia, peso) y la **meta estimada**.

La meta usa la misma cuenta que Inicio para las calorías (MET × peso × horas),
con una sesión típica por objetivo (`Conocerte.sesionTipica`), por los días
elegidos, redondeada a 50: 78,5 kg, hipertrofia, 4 días = 1.550 kcal por
semana. Guarda en `users/{uid}` (merge) `trainingGoal`, `trainingDaysPerWeek`,
`experienceLevel`, `bodyWeightKg` y `weeklyCalorieGoalKcal`; lo que no se
eligió no se pisa. La web ignora los dos campos nuevos sin romperse.

Se muestra **una vez por cuenta y por teléfono** (`sieza.conocerte.v1.<uid>`),
solo si al perfil le falta objetivo y peso: quien ya los cargó en la web no lo
ve. «Omitir» cierra sin guardar. Objetivo y días se cambian después en Tus
datos, que además ofrece "Usar la meta sugerida". Para revisarlo sin crear
una cuenta: `xcrun simctl launch booted com.siezagym.app -sieza-preview -sieza-conocerte`.

Pruebas: `ios/SiezaGymTests/ConocerteTests.swift` (meta, cuándo se muestra,
pasos, campos que guarda) y `tests/ios-conocerte.eval.test.js`.

## Tema SIEZA

En instalaciones nuevas, la app abre con **SIEZA**: una interfaz oscura y
plana, sin Liquid Glass, desenfoque, manchas, grano ni sombras. Las tarjetas,
el login, la barra inferior y los widgets usan superficies opacas. Brasa se
reserva para la acción principal y el estado activo; el texto del botón es
Negro para mantener contraste. La tipografía de interfaz es la del sistema,
con títulos en negrita y números tabulares donde los datos lo requieren.

| Uso | Color |
| --- | --- |
| Fondo / Negro | `#0B0C0E` |
| Tarjetas / Grafito | `#1A1D22` |
| Texto principal / Blanco | `#F4F5F7` |
| Texto secundario / Plata | `#858A91` |
| Bordes y estado inactivo / Plata oscura | `#63666E` |
| Acción / Brasa | `#FF3201` |

Las elecciones previas de tema se conservan. El usuario puede cambiarlo en
Perfil → Configuración → Tema. Los tokens se generan desde el bloque SIEZA de
`app/design2.css` con `node ios/scripts/sync-theme.mjs --css app/design2.css`;
`--check` verifica que `ThemeTokens.swift` esté actualizado sin modificarlo.
Las pruebas de contraste y sincronización están en
`tests/ios-sieza-theme*.test.js`, y las del tema nativo en
`ios/SiezaGymTests/WidgetTests.swift`.

## Editar el diseño en vivo (previews de Xcode)

Cada pantalla trae su `#Preview` con datos de ejemplo: abrí el archivo
(`HomeScreen.swift`, `ProfileScreen.swift`, `WorkoutView.swift`...) y prendé el
canvas con ⌥⌘↩. Cambiar un tamaño de letra, un radio o un color se ve al
instante, sin compilar ni instalar. `RootView.swift` tiene "App completa", con
la barra de abajo: en modo interactivo (▶︎) se recorren todas las pestañas.

Los datos salen de `SiezaGym/Preview/PreviewData.swift` (rutinas, sesiones con
una racha de 3 días, perfil) y nunca tocan Firestore: `GymStore(preview:...)`
arranca cargado y `load()` no hace nada. Para otro tema:
`.previewSieza(tema: "plata")`. Todo esto es `#if DEBUG`: no llega a la app que
se instala en Release.

Lo mismo en el simulador, navegable entero y sin login:

    xcrun simctl launch booted com.siezagym.app -sieza-preview

## Poner a andar el proyecto

```bash
# 1. Bajar la config de cliente de Firebase (no está en el repo, ver abajo)
cd ..
node --env-file=.env --env-file=.env.local ios/scripts/fetch-google-service-info.mjs

# 2. Abrir
open ios/SiezaGym.xcodeproj
```

Xcode resuelve las dependencias de SPM solo la primera vez (tarda unos minutos:
Firebase arrastra gRPC, abseil y leveldb).

### Por qué falta `GoogleService-Info.plist`

Este repositorio es público. Google no considera secreto ese archivo — la
seguridad real está en `firestore.rules` — pero la clave quedaría indexada, así
que está en `.gitignore` y se regenera con el script de arriba, que usa las
mismas credenciales de service account que ya usa la web.

Si el archivo falta, la app no crashea: muestra una pantalla con el comando.

## Estructura

```
SiezaGym/
  Models/          Exercise, Routine, WorkoutSession, UserProfile
  Domain/          Matemática pura y testeable (sin Firestore, sin SwiftUI)
  Services/        Firebase, repositorio de Firestore, estado compartido
  DesignSystem/    Paleta y componentes, espejo de app/globals.css
  Features/        Una carpeta por pantalla
SiezaGymCompartido/  Lo que compilan los dos targets (tema, snapshot, calendario)
SiezaGymWidgets/     Widgets de la pantalla de inicio y actividad en vivo
SiezaGymTests/       Swift Testing
```

`Domain/` es el port de la lógica de la web, función por función:

| iOS                        | Web                        |
| -------------------------- | -------------------------- |
| `HomeMetrics`              | `lib/home/metrics.js`      |
| `Epley`                    | `lib/epley.js`             |
| `TrainingCalendar`         | `lib/sessions/streak.js` + `lib/routines/schedule.js` |
| `RoutineSummary`           | `lib/routines/summary.js`  |
| `DraftExercise`            | `lib/routines/prescription.js` |
| `RoutineCompose`           | `lib/routines/compose.js` + `muscleDistribution` de `lib/routines/summary.js` |
| `WidgetSnapshotBuilder`    | no tiene equivalente: la web no tiene widgets |
| `CustomExerciseDraft`      | `lib/customExercises/customExercises.js` |
| `AuthForm`                 | `components/LoginForm.js` (las mismas reglas del formulario) |
| `CodigoMFA`                | `limpiarCodigo` de `lib/mfa/challenge.js` |

`RoutineDraftExercise` guarda las dos formas de prescribir que acepta el modelo,
igual que la web: pareja (todas las series iguales) y detallada (una fila por
serie, para rampas del tipo 10, 12, 14, 16).

Si cambia una fórmula en la web, cambia acá también: son la misma app.

## Decisiones que no son obvias

**Un solo `GymStore` para las cinco pantallas.** Cada tab podría cargar lo suyo,
pero serían cinco veces las mismas lecturas de Firestore y las pantallas podrían
mostrar números distintos entre sí. Lo crea `RootView` y lo reciben todas.

**Los modelos son `nonisolated`.** El target usa main actor por defecto
(`SWIFT_DEFAULT_ACTOR_ISOLATION`), pero los modelos son datos puros que viajan
entre el repositorio (que corre fuera del main actor) y las vistas.

**Todo lo numérico pasa por `FirestoreValue`.** Firestore devuelve `NSNumber` y
`Timestamp`; `as? Int` sobre un `3.0` falla en silencio y deja ceros en la UI.

**Las calorías son una estimación, no una medición.** MET 5.0 × peso × horas. La
app lo dice en pantalla, y avisa cuando usó los 75 kg por defecto porque falta el
peso del perfil. Igual el 1RM: es Epley, no una marca real.

**`durationSeconds` viene mal en sesiones viejas** (hay sesiones de 6 series con
25 segundos). `HomeMetrics.sessionSeconds` descarta lo físicamente imposible y
estima a partir de las series.

**Los gifs del catálogo se decodifican a mano.** `AsyncImage` no anima GIFs
remotos: `Miniatura` los pasa por ImageIO y los entrega a `UIImageView`, que sí
los anima, con caché por URL para no bajar el mismo ejercicio en cada fila.

**El catálogo del selector son los 94 públicos más los propios.**
`GymRepository.exercises(uid:)` los junta, y si la subcolección propia falla
(regla o índice) igual devuelve el catálogo global: sin él no se puede armar
nada.

**La hora es la de Argentina, no la del teléfono.** Un entrenamiento a las 22:00
en Buenos Aires es de ese día aunque el dispositivo esté en otra zona.

## Widgets y actividad en vivo

Dos cosas distintas, con dos problemas distintos.

**La actividad del entrenamiento** (pantalla bloqueada y Dynamic Island) no
necesita compartir nada: ActivityKit lleva el estado de la app a la extensión
por su cuenta. Las actualizaciones son locales (`Activity.update`), no por push,
así que no hace falta cuenta paga ni APNs. El cronómetro es
`Text(timerInterval:)`: lo corre el sistema, la app solo dice cuándo arrancó.

**Los widgets de la pantalla de inicio** sí necesitan datos, y ahí está la
trampa: el widget corre en otro proceso, sin la sesión de Firebase y sin
presupuesto de memoria para el SDK de Firestore. Lo normal sería un App Group,
pero **Apple no habilita App Groups en una cuenta de desarrollador gratuita** —
el provisioning rechaza `com.apple.security.application-groups` con
"doesn't include the App Groups capability". Lo que sí habilita, y está en el
perfil, es un **grupo de llavero compartido**. Así que la app deja el resumen ya
calculado en un item del llavero (`SnapshotStore`) y el widget lo lee.

El item usa `kSecAttrAccessibleAfterFirstUnlock` porque el widget de la pantalla
bloqueada tiene que poder leerlo con el teléfono trabado. Con una cuenta paga,
esto se reemplaza por `UserDefaults(suiteName:)` y el resto no cambia.

El snapshot lleva también el id del tema: el widget no puede leer el
`@AppStorage` de la app (son dos contenedores distintos).

**Cinco widgets: Racha, Hoy, Calorías, Series y Músculos** — las mismas cuentas
que las tarjetas de "Tus objetivos" en la Home y "Músculos que trabaja" en
Progreso. `WidgetSnapshot` vive en `SiezaGymCompartido`, que se compila **tanto
en la app como en la extensión de widgets**; `HomeMetrics` vive solo en el
target de la app. Por eso el snapshot no lleva `HomeMetrics.CalorieGoal` ni los
demás tipos directamente — la extensión no los vería y no compila. Lleva
espejos livianos (`ResumenCalorias`, `ResumenSeries`, `ResumenMusculos`) con los
mismos campos ya resueltos a texto/número; `WidgetSnapshotBuilder` (que sí ve
`HomeMetrics`, porque vive en el target de la app) hace la traducción.

**Un ítem viejo del llavero puede bloquear todas las escrituras nuevas.**
`SnapshotStore.escribir` hacía `SecItemUpdate` filtrado por grupo y, si no
encontraba nada, `SecItemAdd`. Si en el teléfono ya había un ítem con el mismo
service+account pero sin el grupo (de antes de tener el grupo compartido bien
armado, o de una build anterior), el update no lo encontraba y el add chocaba
contra él con `errSecDuplicateItem`: el widget quedaba leyendo vacío para
siempre y no había ningún error visible para el usuario. Ahora `escribir` borra
primero sin filtrar por grupo (alcanza cualquier ítem viejo) y siempre crea de
cero.

**La isla expandida se dibuja siempre sobre negro**, así que va en blanco y no
con los colores del tema: el sólido del tema Plata es casi negro y desaparecía.
La pantalla bloqueada sí usa el tema, porque ahí el fondo lo pone
`activityBackgroundTint`.

## El entrenamiento en curso

El descanso entre series vive en `Domain/RestTimer.swift` y no dentro de la
vista: son reglas (cuánto arranca, cómo baja, dónde corta), y metidas en
`WorkoutView` no había forma de probarlas sin abrir la app y esperar minuto y
medio.

**El descanso arranca en 90s y la estimación de duración usa 75s.** No es un
descuido: los 75 son los de `lib/routines/summary.js` y existen para que los dos
clientes digan el mismo "17 min estimados"; los 90 son el descanso real que
propone la app. Un test fija los dos valores para que nadie empareje uno con el
otro pensando que es un bug.

**Los ejercicios van plegados y se abre solo el que estás haciendo**
(`WorkoutDraft.ejercicioEnCurso`). Al terminar uno se pliega y se abre el
siguiente. Con ocho ejercicios abiertos la pantalla es un scroll infinito.

**El verde de terminado (`Theme.hecho`) es el único color fijo del diseño**: no
sale del tema. El sólido de cada tema ya significa "lo importante de esta
pantalla", y en Plata es casi negro, así que un terminado pintado con el sólido
no se distinguiría de lo pendiente. Va en el borde, la barra y el contador —
**no en el nombre**, porque el verde sobre el vidrio claro de Plata no se lee.

La actividad en vivo trae un botón "Terminar serie" (`TerminarSerieIntent`) que
marca **la primera serie sin marcar** recorriendo los ejercicios en orden —
`WorkoutDraft.proximaSerieSinMarcar()`. Es la misma regla que usa
`WorkoutActivityState` para decidir qué ejercicio mostrar: si estuvieran escritas
dos veces, el botón y el texto de la isla podrían apuntar a series distintas.

## Editar una rutina

El lápiz del detalle abre el mismo armador que el alta, con la rutina cargada:
editar es agregar, sacar y volver a prescribir, exactamente lo mismo que crear.
Igual que `RoutineComposer` con la prop `routine` en la web.

Dos cosas que no son obvias:

**Abrir el editor no puede perder nada.** `RoutineDraftExercise.init(_:)` copia
la prescripción tal cual, incluida la rampa serie por serie. Si la aplastara a
"4 × 10", guardar sin tocar nada rompería la rutina del coach. Hay un test que
guarda sin cambios y compara.

**La edición escribe solo `name`, `note`, `exercises` y `updatedAt`.**
`lastUsedAt` y `createdAt` no se tocan: /rutinas y la portada ordenan por uso, y
pisarlos mandaría la rutina recién editada al fondo de la lista o diría que se
creó hoy.

El detalle lee la rutina del store por id y no la que recibió al navegar: esa es
una copia del momento en que se tocó la fila y queda vieja apenas se guarda.

## Menú de mantener presionado

Mantener presionada una fila en Rutinas abre las mismas cuatro acciones que
`RoutineHoldSheet` en la web (Editar, portada, Duplicar, Eliminar), pero con
`.contextMenu(menuItems:)` nativo en vez de una hoja custom: en iOS ya resuelve
el problema que la hoja de la web existe para resolver — que el pulgar no tape
la fila al mantenerla presionada — sin reinventar nada.

`RoutinesScreen.fila(_:)` replica el gate de `routineMenuActions` de
`lib/routines/menu.js`: una rutina del coach (`isAssigned`) no ofrece ningún
menú, porque esas viven en `assignments` y se editan desde su panel. Las
acciones en sí ya existían en `GymRepository`/`GymStore` (edición, semana
asignada) salvo tres nuevas, escritas puerto a puerto desde
`lib/routines/routines.js`:

- `setShowOnHome` — mismo campo `showOnHome` que usa la Home para elegir
  `featuredRoutine`.
- `duplicateRoutine` — reusa `RoutineDraftExercise.init(_:)` (el mismo
  conversor que ya evita aplastar rampas al editar) para armar el draft y
  llamar a `createRoutine` con el nombre más "(copia)".
- `deleteRoutine` — borra en Firestore y saca la rutina del array en memoria
  sin recargar todo; como el borrado puede afectar qué rutina se muestra en
  la portada, también republica el widget.

Eliminar pide confirmación con el mismo texto que `RoutineHoldSheet`
("No se puede deshacer. Los entrenamientos que ya hiciste con ella quedan en
el historial.") antes de tocar Firestore.

## Bloques de ejercicios

Ejercicios consecutivos se agrupan en bloques con nombre y color ("Entrada en
calor", "Fuerza", "Potencia"): puerto exacto de `RoutineComposer.js` y
`RoutineScreen.js`. `Domain/RoutineGroups.swift` tiene el algoritmo —
`RoutineGrouping.seccionar` junta ejercicios consecutivos con el mismo par
(nombre, color) en una `RoutineSection` — y `GroupColor`/`GroupPreset` los
siete colores y seis atajos de la web.

Se ve en tres lugares:

- **Armador** (`RoutineComposerScreen`): un botón de etiqueta por ejercicio
  abre `GroupAssignmentSheet` (presets, nombre libre, color, "aplicar a los
  siguientes N sin grupo"); tocar el encabezado de un bloque ya armado lo
  edita entero.
- **Detalle** (`RoutineDetailScreen`): de sólo lectura.
- **Entrenamiento** (`WorkoutView`): igual, envolviendo las `ExerciseCard`.

`group`/`groupColor` se guardan siempre como string (vacío sin grupo, nunca
ausentes): mismas claves y default que `sanitizeExercises` en
`lib/routines/routines.js`.

## Semana asignada

Una rutina propia se puede marcar "de esta semana", y la Home la muestra bajo
un rótulo como "Septiembre · Semana 4". **No existe en la web** — es sólo del
teléfono.

`TrainingCalendar.semana(de:)` (en `SiezaGymCompartido`, reutiliza
`weekOfMonth`/la zona horaria de Argentina que ya existían para la racha)
arma la clave `"2026-09-4"` — año y mes incluidos, para que la semana 4 de
septiembre no se confunda con la de octubre ni con la del año que viene.
`weekKey` vive en el documento de la rutina; `GymRepository.setWeekAssignment`
lo escribe o lo borra con `FieldValue.delete()`. Sólo para rutinas propias: las
del coach se organizan solas por cuándo te las asignaron.

## Rutinas agrupadas por mes y semana

La lista de Rutinas no es plana: cada rutina cae sola en "Septiembre · Semana 4"
según su propia fecha, sin que nadie la asigne a mano. Es el mismo dato que
`weekKey` de arriba pero al revés — acá no hay campo que guardar, es puro
cálculo sobre `createdAt`/`assignedAt`. Puerto directo de `groupByMonthAndWeek`
+ `weekSections` de `lib/routines/schedule.js` y `lib/routines/filter.js` en la
web.

`TrainingCalendar.seccionesPorSemana(_:fechaDe:)` arma una `SeccionSemana` por
cada combinación mes+semana que tenga al menos una rutina — nunca semanas
vacías. Los meses van del más nuevo al más viejo; adentro de un mes, semana 1
antes que semana 2. Las rutinas sin fecha (no debería pasar, pero por las
dudas) quedan en una tanda "Sin fecha" al final en vez de desaparecer.

Con una búsqueda en curso (`RoutinesScreen.agrupar == false`) se desarma todo y
se muestra la lista plana: cortar tres resultados de búsqueda en secciones por
semana los desordena en vez de ayudar a encontrar algo.

## Perfil con el progreso adentro

Distinto de la web: acá Perfil y Progreso son la misma pestaña. La barra de
abajo tiene cuatro pestañas (`Inicio`/`Rutinas`/`Historial`/`Perfil`).

En el Perfil, **los días entrenados y los músculos se ven directo**, sin
entrar a otra pantalla (`GrillaDiasEntrenados` y `RepartoMusculos`, en
`Features/Profile/ProgresoEnPerfil.swift`; antes eran `TrainedDaysScreen` y
`MuscleVolumeScreen`). Volumen, Empuje y tracción y Por ejercicio tienen más
detalle y siguen como accesos a `VolumeScreen`, `PushPullScreen` y
`ExerciseHistoryScreen`.

**"Tus datos" y el tema son botones a pantallas propias.** La fila de Tus
datos muestra un resumen (`BodyMetrics.resumen`: "78,5 kg · 180 cm ·
Intermedio") y abre `DatosScreen`, con dos grupos: Cuerpo (sexo, peso, altura
y el IMC calculado en vivo con las categorías de la OMS) y Entrenamiento
(experiencia, meta semanal y cuánto llevás esta semana). Vacío, cero o texto se
guardan como null, no como cero (`BodyMetrics.decimal`). "Guardar" muestra
"Guardando…" y se deshabilita mientras escribe. La fila de Tema muestra el
puesto y abre `TemasScreen`, con una vista previa grande de cada tema armada
con sus propios colores; la obra de fondo (Pliegues, Eléctrico) va detrás de
la tarjeta para que no la estire.

`VolumeScreen` muestra dos cuentas que `HomeMetrics` ya tenía calculadas:
`volumeByWeekday` (por día de la semana) y `volumePerSession` (últimas
sesiones).

Pruebas: `ios/SiezaGymTests/BodyMetricsTests.swift` (lectura de números, IMC,
resumen) y `tests/ios-profile.eval.test.js` (gráficos a la vista, Tus datos y
Tema como pantallas propias).

## Ejercicios propios

Lo que no está en el catálogo de 94 se carga desde el `+` del selector y vive en
`users/{uid}/customExercises`, igual que en la web. Las reglas de Firestore
exigen `ownerId`, `nameEs`, `equipment`, `pattern`, `registrationType` y un
`muscleWeights` no vacío: sin alguno de esos el write vuelve como
"Missing or insufficient permissions" y no se entiende por qué. Por eso el
formulario pide músculos sí o sí, y equipamiento y patrón tienen valor por
defecto.

**El reparto muscular se carga por partes, no por porcentajes.** Tocar un
músculo lo suma (×1, ×2, ×3) y al guardar se normaliza a 1.0, absorbiendo el
resto del redondeo en el músculo que más participa. La web pide los porcentajes
a mano con sliders y valida que sumen 1.0; en el teléfono eso es pelearse con
tres campos, y el documento que sale es el mismo.

**El video de YouTube es un agregado de la app.** Se guarda en `videoUrl`, un
campo que la web todavía no lee (su serializador fija `mediaUrl: null` para los
propios). La miniatura no se guarda: sale del id del video
(`img.youtube.com/vi/<id>/mqdefault.jpg`), así que no hay dos verdades. Del link
pegado se guarda solo el id en una URL limpia, porque los links de compartir
vienen con seguimiento.

## Segundo factor por mail

Entrar con email y contraseña pide además un código de seis números que llega al
mail. El orden de las llamadas es lo que lo hace un segundo factor de verdad y no
un cartel que se saltea tocando el cliente:

1. `POST /api/mfa/start` con email y contraseña. El servidor las comprueba y
   manda el código. **No devuelve ningún token.**
2. `POST /api/mfa/verify` con el código. Recién ahí emite un custom token, y la
   app lo cambia por una sesión con `signIn(withCustomToken:)`.

La app **nunca llama a `signIn(withEmail:password:)`**. Con la contraseña sola no
tiene con qué entrar, así que no hay pantalla que saltear: el permiso lo emite el
servidor y sólo con el código en la mano.

Los dos endpoints viven en la web (`app/api/mfa/`), porque el Admin SDK necesita
la clave privada del proyecto y eso no puede vivir en un binario que se
distribuye. El hash del código y el contador de intentos están en
`mfaChallenges`, cerrada a `read, write: if false` en `firestore.rules`.

| | |
|---|---|
| largo del código | 6 dígitos |
| vence | 10 minutos |
| intentos | 5, después hay que pedir otro |
| pedidos por email | 8 cada 15 minutos |

**Google no pide código**, a propósito: la cuenta de Google ya tiene su propio
segundo factor, y es la puerta que sigue funcionando si el mail se cae.

### Lo que hay que configurar

`RESEND_API_KEY` en las variables de entorno del deploy. Sin eso, en producción
`/api/mfa/start` devuelve 503 y manda a entrar con Google, en vez de fingir que
el código salió. Para ver si un deploy está listo:

```bash
curl https://sieza-gym.vercel.app/api/mfa/start   # {"correo":"resend","listo":true}
```

En desarrollo sin clave, el código sale por el log del servidor y la pantalla lo
avisa. Para apuntar el simulador a `npm run dev` en vez de a producción:

```bash
xcrun simctl spawn booted defaults write com.siezagym.app mfa-base -string http://localhost:3000
```

## Login con Google

El `CLIENT_ID` sale del `GoogleService-Info.plist`, así que no hay nada que
configurar a mano: Firebase creó el cliente OAuth de iOS solo al registrar la
app. Lo que sí está en `project.yml`, porque tiene que estar en el bundle:

- `CFBundleURLTypes` con el `REVERSED_CLIENT_ID`, para que iOS sepa a quién
  devolverle el callback. Ese valor **no** es secreto como la API key: un client
  id de OAuth para iOS viaja en el binario y no tiene client secret.
- `CFBundleDevelopmentRegion: es` y `CFBundleLocalizations: [es]`, para que los
  bundles embebidos del SDK resuelvan al castellano.

El botón de Google lo dibuja la app y no el SDK: `GoogleSignInButton` se planta
en su ancho y trae su propio fondo blanco, que sobre los temas oscuros parece
pegoteado de otra app. La G es el logo oficial sin recolorear
(`Assets.xcassets/GoogleG.imageset`, un SVG), que es lo que piden las guías de
marca; lo que no exigen es usar su botón.

La app crea el perfil en `users/` con los mismos campos que hace el servidor de
la web en `app/api/session/login/route.js`: `createdAt` y `provider` solo se
escriben la primera vez, después únicamente se refrescan `photoURL`,
`displayName`, `updatedAt` y `lastLoginAt`.

Cerrar sesión también cierra la de Google. Si no, el siguiente login entra solo
con la misma cuenta y no deja elegir otra.

## Instalar en un iPhone de verdad

```bash
cp Local.example.xcconfig Local.xcconfig   # una sola vez: poné tu Team ID
./scripts/run-on-device.sh
```

Compila, instala y abre la app en el primer iPhone conectado por cable. La
primera vez el teléfono se niega a abrirla hasta que confíes en el perfil:

> Ajustes › General › VPN y gestión de dispositivos › Apps de desarrollador
> › Apple Development: *tu email* › Confiar

**Con una cuenta de desarrollador gratuita el perfil dura 7 días.** Cuando la
app deje de abrir, volvé a correr el script. Con una cuenta paga (99 USD al año)
el perfil dura un año y esto deja de pasar.

El `Local.xcconfig` no va al repo: el Team ID es de la cuenta de cada uno.
`Signing.xcconfig` lo incluye con `#include?`, que es opcional, así que quien
clone sin ese archivo compila igual para el simulador.

## Tests

```bash
xcodebuild test -project SiezaGym.xcodeproj -scheme SiezaGym \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
```

252 tests: la matemática de `Domain/`, lo que muestran los widgets, los links de
YouTube, el formato de las métricas de Salud, las reglas del formulario de login,
el código del segundo factor, la bienvenida de tres pantallas, los bloques de
ejercicios, la semana asignada, el agrupamiento de Rutinas por mes y semana y
las cuentas de `ProgressMetrics` que arma el Perfil. Son funciones puras, no
tocan Firestore ni la red.

Lo que corre del lado del servidor (generar el código, hashearlo, vencimiento,
intentos, límite de pedidos, las rutas y la comprobación de contraseña) se
prueba en el repo de la web:

```bash
npm test -- tests/mfa-*.test.js   # 61 tests
```

## El proyecto de Xcode

`SiezaGym.xcodeproj` está commiteado para que abra sin instalar nada, pero la
fuente de verdad es `project.yml`. Si agregás un target o cambiás build settings,
editá el YAML y regenerá:

```bash
brew install xcodegen && xcodegen generate
```

**Agregar un archivo .swift también necesita regenerar.** El YAML toma la
carpeta entera, pero la resuelve al generar: el `.pbxproj` lista los archivos uno
por uno. Un archivo nuevo que no esté ahí no se compila, y lo peor es cómo
falla: `xcodebuild test` pasa igual **sin correr los tests nuevos**, y recién
revienta al compilar para el dispositivo con un "cannot find X in scope" que no
menciona el proyecto.

Hay un guard para eso, porque pasó de verdad (un `git checkout` del `.pbxproj`
para limpiar los UUIDs aleatorios que XcodeGen regenera se llevó puesta el alta
de dos archivos):

```bash
node ios/scripts/check-project-sync.mjs
```

Falla listando los `.swift` que el proyecto no compila. Correlo antes de
commitear cuando agregaste archivos.

## Apple Salud y Fitness

Inicio puede leer del día actual las calorías activas, los pasos y la distancia
caminando/corriendo desde HealthKit. La app solo solicita permisos de lectura y
no escribe datos en Apple Salud.

En el iPhone, tocá `Conectar` en la tarjeta `Actividad de hoy` y aceptá el
permiso de Salud. Si no aparecen datos, revisá `Ajustes > Salud > Apps >
SiezaGym`. La información se vuelve a consultar al abrir la app y al volver a
primer plano.

## Qué no está

El **panel de coach** (alumnos, códigos de invitación, asignar rutinas) sigue
siendo solo web: es una superficie de escritorio. La app muestra las rutinas
asignadas por el coach, pero no permite administrarlas.

- **Borrar o editar un ejercicio propio.** Se pueden crear, pero no sacar:
  `deleteCustomExercise` existe en la web y no está conectada a ninguna
  pantalla, ni ahí ni acá.
- **El segundo factor, en la web.** El login del navegador sigue entrando con la
  contraseña sola. Los endpoints están del lado de la web, así que agregarlo es
  cambiar `components/LoginForm.js` para que use el mismo circuito de dos pasos,
  pero hoy no lo hace: el segundo factor protege el celular, no el navegador.
