# SiezaGym Android

Native Kotlin + Jetpack Compose app, originally ported from `feat/ios-app`.
The current visual reference is **`feat/ios-design2` at `02acd87`**; Android lives in `android/`.

## Open and run

1. Open **this `android/` directory** in Android Studio (not the Next.js repository root).
2. Select the bundled JDK 17 or 21 as the Gradle JDK. Let Gradle sync finish.
3. Install Android SDK Platform 36 and Build Tools 35.0.0 when prompted.
4. Select the `app` run configuration and an API 26+ emulator or device, then Run.

Pinned toolchain: AGP 8.13.2, Gradle 8.14.4, Kotlin 2.2.21, Compose BOM 2025.12.00.
`compileSdk` / `targetSdk` are 36; `minSdk` is 26. No Windows SDK path or downloaded JDK is committed. Android Studio generates `local.properties` for your machine.

[AGP compatibility requirements](https://developer.android.com/build/releases/agp-8-13-0-release-notes).

## Firebase

The app uses the **same Firebase project, accounts, and Firestore collections as iOS and web**.
Place the Firebase Android client config at `app/google-services.json` for package `com.siezagym.app`.
The existing local config is preserved during this rebuild, but remains ignored by Git.

To retrieve the config using the project's existing service-account environment, run from the repository root:

```sh
node --env-file=.env --env-file=.env.local android/scripts/fetch-google-services-json.mjs
```

This script registers the Android client if it does not already exist. Service-account credentials are used only by the Node script, never packaged in the app.

For Google login, enable the Google provider in Firebase Authentication and register the signing certificate's SHA-1 and SHA-256 in the Android Firebase app. Obtain them with:

```sh
./gradlew signingReport
```

Download the config again after registering the fingerprints. The Google Services plugin generates `default_web_client_id`; do not hard-code or override it in `strings.xml`.
The local debug signing certificate differs across machines. An APK compiled elsewhere may need that machine's fingerprint registered too.

Without a Firebase config the project still builds and displays a configuration screen. It does not pretend to log in or show fixture data.

## Design2 and account navigation

- Six shared themes, with SIEZA as the default. Profile theme changes apply immediately across the app.
- Four-tab, 300 × 52 dp floating bar: Inicio, Rutinas, Historial, Perfil. The selected tab expands; inactive icons stay 44 × 44 dp.
- Profile contains all five progress destinations, personal data, theme selection, and sign-out.
- History and session detail use the design2 list, statistics, exercise thumbnails, and failed-set marks.
- Each account screen has one scrolling container. Do not nest a vertically scrolling list inside `Pantalla`, which already owns the scroll.
- `RootView` gates private screens on Firebase authentication. Firebase restores an existing session; a returning signed-in user does not see login again. Signing out removes account ViewModels.
- Coil needs **both** `coil-gif` (animation decoding) and `coil-network-okhttp` (HTTP downloads). URLs come from the exercise catalogue in Firestore. Exercises without media retain a placeholder; custom exercises can use a YouTube thumbnail.

Read-only verification on 2026-10-01: the local Android config matches the web Firebase project and package; the catalogue contains 94 exercises, 80 with media URLs. Three sampled public URLs returned valid GIFs. No Firestore data was changed.

## Validation

From `android/`:

```sh
./gradlew assembleDebug testDebugUnitTest lintDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`.
Unit/UI report: `app/build/reports/tests/testDebugUnitTest/index.html`.
Rendered UI screenshots: `app/build/reports/screenshots/`.

Domain tests cover iOS metrics, Argentina calendar boundaries, routine grouping, individual prescriptions, failed sets, and saved volume. Robolectric Compose tests exercise workout entry, routine details, and bottom-tab selection without accessing production Firebase. UI rendering uses [Robolectric native graphics](https://robolectric.org/simulator/); on-device checks are still needed for Google account selection, keyboard behavior, and live Firestore access.

Validated on 2026-10-01: `assembleDebug`, all **234 unit/UI tests**, and `lintDebug` passed (0 lint errors; warnings remain). Profile, History, and session-detail renderings were inspected.

Regression coverage includes opening Profile/History from the lower bar with populated and empty accounts, all five progress destinations and back navigation, theme propagation, authentication gating, and downloading/decoding a two-frame GIF through the production Coil components. UI tests save renderings in `app/build/reports/screenshots/`. Live sign-in/writes and physical-device rendering still require device validation.

This validation used a temporary JDK/SDK and Gradle cache because the local Linux `/home` partition is full. If building on this same machine, free space or choose a Gradle cache location with available space. No temporary SDK path is left in the project.

In Android Studio, `DesignSystem/Previews.kt` also provides offline Compose previews.

Before shipping, run on your target device: email/Google sign-in, pull to refresh, open an assigned routine, complete and fail sets, rotate/background/resume, save, verify History and web show the same session, clear/save profile fields, then sign out and switch accounts.
