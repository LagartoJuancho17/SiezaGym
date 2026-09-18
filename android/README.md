# App Android SiezaGym

Aplicación nativa Android (Kotlin + Jetpack Compose) de Sieza, espejo de la app iOS. Mismo Firestore y mismo Auth (email + Google).

## Abrir el proyecto

- [Android Studio](https://developer.android.com/studio) → *Open* → carpeta `android/`.
- Android Gradle Plugin 9.1.0 requiere Gradle 9.2 (viene en el wrapper) y JDK 17+.
- `compileSdk 37`, `minSdk 26`, `targetSdk 36`.

## Configuración de Firebase

`google-services.json` **no está** en el repo. Sin ese archivo la app compila igual; al abrirse muestra una pantalla con el comando para generarlo:

```bash
node --env-file=.env --env-file=.env.local android/scripts/fetch-google-services-json.mjs
```

Con el archivo presente, el plugin `google-services` se aplica automáticamente (ver `app/build.gradle.kts`).

Para Google Sign-In hay que poner el web client id de Firebase en
`app/src/main/res/values/strings.xml` como `default_web_client_id`.

## Tests

Unit tests del dominio y de la lógica de Auth (puros, sin Firebase ni Compose), espejo de `ios/SiezaGymTests`:

```bash
./gradlew testDebugUnitTest
```

## Estructura

```
app/src/main/kotlin/com/siezagym/app/
  Models/          Exercise, Routine, WorkoutSession, UserProfile (+ parsing Firestore)
  Services/        GymStore, GymRepository, AuthService, FirestoreValue
  Domain/          TrainingCalendar, Epley, RoutineSummary, RoutineDraft,
                   HomeMetrics, ProgressMetrics (funciones puras, testeables)
  DesignSystem/    ThemeTokens (generado), Theme, Pantallas
  Features/        RootView + BottomNav + NavRoutes, Login, Home, Routines,
                   Workout, History, Progress, Profile
  SiezaGymApplication.kt, MainActivity.kt
scripts/           sync-theme.mjs (genera ThemeTokens.kt desde app/design2.css),
                   fetch-google-services-json.mjs
```