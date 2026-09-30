# SiezaGym Android

Native Kotlin + Jetpack Compose port of **`feat/ios-app` at `4b9256f`**.
The rest of this branch is that iOS branch's source tree. `android/` is the Android adaptation.

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

## iOS parity

- Burgundy `#3B0A0C` background, cream cards, orange buttons, 10 dp card corners, the original gym photograph.
- The custom 292 × 60 bottom bar uses the same icon paths, colors, dividers, selection state, and five tabs.
- Home: 300 dp photo hero, weekly training strip, muscle volume, calories, intensity, push/pull, set completion, weekday volume, session trend, and intensity zones.
- Routines: 190 dp hero, expandable months and seven-day week groups, assigned badges, prescriptions, muscle distribution, and workout launch. Like this iOS branch, routine creation happens on the web.
- History: sessions, dates, duration, volume, calories, logged sets, and failed-set styling.
- Progress: Epley estimates, maximum actual weights, session counts, and sparklines.
- Profile: identity, body weight, height, weekly calorie goal, sex, level, saving, and sign-out.
- Authentication: email login/registration and Google login with Spanish errors.
- Workout: prescribed individual sets, weight/reps/time fields, failed/completed toggles, add-set, elapsed timer, totals, save confirmation, and Firestore persistence.

Android adaptations: system insets and keyboard handling, independent saved tab navigation, Back confirmation for unfinished workouts, saved workout state, and an exercise picker for the free-workout entry. The bottom bar is hidden during a workout. Android uses its system font and platform dialogs; these are not the iOS font or native iOS controls.

Session totals exclude failed-set volume and round once. A stable per-workout document ID avoids duplicate sessions on a save retry. Optional profile values can be cleared, and the save indicator appears only after success. Calendar dates always use Buenos Aires time.

## Validation

From `android/`:

```sh
./gradlew assembleDebug testDebugUnitTest lintDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`.
Unit/UI report: `app/build/reports/tests/testDebugUnitTest/index.html`.
Rendered UI screenshots: `app/build/reports/screenshots/`.

Domain tests cover iOS metrics, Argentina calendar boundaries, routine grouping, individual prescriptions, failed sets, and saved volume. Robolectric Compose tests exercise workout entry, routine details, and bottom-tab selection without accessing production Firebase. UI rendering uses [Robolectric native graphics](https://robolectric.org/simulator/); on-device checks are still needed for Google account selection, keyboard behavior, and live Firestore access.

Validated on 2026-09-30: `assembleDebug`, all 62 unit/UI tests, and `lintDebug` passed (no lint errors; dependency/API warnings remain). Home and routine-detail renderings were inspected. Live Firebase sign-in/writes and physical-device rendering have not been verified.

This validation used a temporary JDK/SDK and Gradle cache because the local Linux `/home` partition is full. If building on this same machine, free space or choose a Gradle cache location with available space. No temporary SDK path is left in the project.

In Android Studio, `DesignSystem/Previews.kt` also provides offline Compose previews.

Before shipping, run on your target device: email/Google sign-in, pull to refresh, open an assigned routine, complete and fail sets, rotate/background/resume, save, verify History and web show the same session, clear/save profile fields, then sign out and switch accounts.
