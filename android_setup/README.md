# Android APK Build Guide (Capacitor)

This app ships as a Progressive Web App and can also be packaged as a native
Android app using [Capacitor](https://capacitorjs.com/). Follow these steps
**after** your first successful `npm run build`.

## Prerequisites

- Node.js 20+
- [Android Studio](https://developer.android.com/studio) (includes the Android SDK)
- A Java Development Kit (JDK 17), usually bundled with Android Studio
- This repo's dependencies installed: `npm install`

## 1. Build the web app

```bash
npm run build
```

This produces the `dist/` folder that Capacitor will wrap in a native shell.

## 2. Add the Android platform (first time only)

```bash
npx cap add android
```

This generates an `android/` directory containing a full Android Studio
project. It reads `capacitor.config.ts` at the repo root for app id, name,
and plugin configuration.

## 3. Sync web assets into the native project

Run this every time you rebuild the web app (`npm run build`) or change
Capacitor config/plugins:

```bash
npx cap sync android
```

## 4. Open in Android Studio

```bash
npx cap open android
```

From Android Studio you can:
- Run the app on an emulator or physical device (Run ▶).
- Build a **debug APK**: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
  The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.
- Build a **signed release APK/AAB** for the Play Store (see step 5).

### CLI alternative (no Android Studio UI)

```bash
cd android
./gradlew assembleDebug     # debug APK
./gradlew assembleRelease   # release APK (needs signing config, see below)
```

## 5. Signing a release build

1. Generate a keystore (once):
   ```bash
   keytool -genkey -v -keystore fittrack-release.keystore -alias fittrack -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Create `android/key.properties` (do **not** commit this file):
   ```properties
   storePassword=YOUR_STORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=fittrack
   storeFile=../fittrack-release.keystore
   ```
3. Edit `android/app/build.gradle` to reference `key.properties` in the
   `signingConfigs` and `buildTypes.release` blocks (Android Studio's
   "Generate Signed Bundle / APK" wizard can do this for you automatically —
   recommended for first-time setup).
4. Build the signed release:
   ```bash
   cd android && ./gradlew assembleRelease
   ```
   Output: `android/app/build/outputs/apk/release/app-release.apk`

## 6. App icons & splash screen

Capacitor's asset generator can produce all required Android icon/splash
densities from a single source image:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
```

Place your source icon at `assets/icon.png` (1024×1024) and splash at
`assets/splash.png` (2732×2732) before running the command above. The repo's
`public/icons/icon.svg` can be exported to PNG as a starting point.

## 7. Environment variables in the native build

Capacitor bundles the static `dist/` output, so `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` must be set at **build time** (`npm run build`),
not at runtime. Make sure your `.env.local` (or CI secrets) are in place
before running `npm run build && npx cap sync android`.

## 8. Updating the app after code changes

Whenever you change frontend code:

```bash
npm run build
npx cap sync android
npx cap open android   # or run gradlew assembleDebug/Release directly
```

## Notes

- `capacitor.config.ts` sets `androidScheme: 'https'` so Supabase auth
  redirects and cookies behave correctly inside the WebView.
- The web app detects `window.Capacitor` to skip registering the browser
  service worker (not needed in the native shell — see `src/main.tsx`).
- Deep links / password reset links should point to your deployed web app
  URL (Vercel) rather than a custom scheme, since Supabase auth redirects
  work over HTTPS. Universal Links/App Links can be added later via
  `@capacitor/app` if deeper native integration is required.
