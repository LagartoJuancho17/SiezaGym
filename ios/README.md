# SiezaGym iOS

App nativa de iPhone para el alumno, en SwiftUI. Habla con **el mismo Firestore
que la web**: lo que registrás en el gimnasio aparece en `sieza-gym.vercel.app` y
al revés. No hay una segunda base de datos ni sincronización que mantener.

- Xcode 26, iOS 18+, Swift 6 (concurrencia estricta, main actor por defecto)
- Firebase iOS SDK 12 (Auth + Firestore) + GoogleSignIn 9, por Swift Package Manager
- Bundle id `com.siezagym.app`

Login con email/contraseña o con Google. Entrar con Google cae en la **misma
cuenta de Firebase** que la web: mismo uid, mismas rutinas.

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

## Login con Google

El `CLIENT_ID` sale del `GoogleService-Info.plist`, así que no hay nada que
configurar a mano: Firebase creó el cliente OAuth de iOS solo al registrar la
app. Lo que sí está en `project.yml`, porque tiene que estar en el bundle:

- `CFBundleURLTypes` con el `REVERSED_CLIENT_ID`, para que iOS sepa a quién
  devolverle el callback. Ese valor **no** es secreto como la API key: un client
  id de OAuth para iOS viaja en el binario y no tiene client secret.
- `CFBundleDevelopmentRegion: es` y `CFBundleLocalizations: [es]`. Sin eso el
  botón del SDK sale en inglés, porque iOS resuelve los bundles embebidos contra
  el idioma de desarrollo de la app.

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

152 tests: la matemática de `Domain/`, lo que muestran los widgets, los links
de YouTube, el formato de las métricas de Salud y la traducción de errores de
login. Son funciones puras, no tocan Firestore ni la
red.

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
