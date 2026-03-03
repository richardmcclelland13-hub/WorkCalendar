Android APK (Direct Install)

This folder is a hardened Android wrapper for the shift calendar web app.
It bundles local files from `app/src/main/assets/www` and loads them with `WebViewAssetLoader`.

## Security posture

- No `INTERNET` permission requested.
- `usesCleartextTraffic=false`.
- External links are blocked in `MainActivity`.
- WebView file/content access is disabled.
- Mixed content is blocked.
- Cookies (first/third party) are disabled.
- WebView debugging is enabled only in debug builds.
- App data backup is disabled (`allowBackup=false`).

## Build APK (Android Studio)

1. Open Android Studio.
2. Open this folder: `android-apk`.
3. Let Gradle sync.
4. Build debug APK:
   - `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`.
5. APK output path:
   - `android-apk/app/build/outputs/apk/debug/app-debug.apk`

## Install on phone

1. Transfer `app-debug.apk` to your Android phone.
2. Open the file on your phone.
3. Allow install from this source if prompted.
4. Install and open.

## Home screen widget

After installing:

1. Long-press your Android home screen.
2. Tap `Widgets`.
3. Find `Suncor Shift Calendar`.
4. Drag `Suncor Shift Widget` onto the home screen.

Widget behavior:

- Shows today's date and shift status (Day/Night/Off).
- Tap the widget to open the app.
- Tap the shift badge to cycle `I2 -> J2 -> K2 -> L2`.

## Keep app assets updated

When you update root web files, run:

```powershell
.\sync-assets.ps1
```

Then rebuild the APK.
