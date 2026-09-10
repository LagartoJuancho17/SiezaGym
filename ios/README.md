# SiezaGym iOS

App nativa de iPhone para el alumno, en SwiftUI. Habla con **el mismo Firestore
que la web**: lo que registrás en el gimnasio aparece en `sieza-gym.vercel.app` y
al revés. No hay una segunda base de datos ni sincronización que mantener.

- Xcode 26, iOS 18+, Swift 6 (concurrencia estricta, main actor por defecto)
- Firebase iOS SDK 12 (Auth + Firestore) por Swift Package Manager
- Bundle id `com.siezagym.app`

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
SiezaGymTests/     Swift Testing
```

`Domain/` es el port de la lógica de la web, función por función:

| iOS                        | Web                        |
| -------------------------- | -------------------------- |
| `HomeMetrics`              | `lib/home/metrics.js`      |
| `Epley`                    | `lib/epley.js`             |
| `TrainingCalendar`         | `lib/sessions/streak.js` + `lib/routines/schedule.js` |
| `RoutineSummary`           | `lib/routines/summary.js`  |

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

**La hora es la de Argentina, no la del teléfono.** Un entrenamiento a las 22:00
en Buenos Aires es de ese día aunque el dispositivo esté en otra zona.

## Tests

```bash
xcodebuild test -project SiezaGym.xcodeproj -scheme SiezaGym \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
```

43 tests sobre `Domain/`: son funciones puras, no tocan Firestore ni la red.

## El proyecto de Xcode

`SiezaGym.xcodeproj` está commiteado para que abra sin instalar nada, pero la
fuente de verdad es `project.yml`. Si agregás un target o cambiás build settings,
editá el YAML y regenerá:

```bash
brew install xcodegen && xcodegen generate
```

Agregar archivos .swift no necesita regenerar nada: el target toma la carpeta
entera.

## Qué no está

El **panel de coach** (alumnos, códigos de invitación, asignar rutinas) sigue
siendo solo web: es una superficie de escritorio. La app muestra las rutinas
asignadas por el coach, pero no permite administrarlas.
