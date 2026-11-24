# Stackadoo Android wrapper

This Trusted Web Activity opens `https://stackadoo.com/app/?source=twa` (the new game) under the existing
package `com.stackadoo.twa`. Up to 1.0.41 it opened `https://stackadoo.com/play.html` (the classic game). It does not bundle or modify game code or saved worlds.

## Release 42 (1.0.42)

- Version code 42. Start URL `https://stackadoo.com/app/?source=twa` (was `/play.html`). `/app/` is a small
  web page that opens the new game at `/beta/play.html?source=twa`; what the app opens can be changed on the
  website without a new release (rollback: make `/app/` forward to `/play.html`).
- The web page `/app/` must be live before this version is released (it is on branch `cobble/twa-newgame`).
- New app shortcut (long-press the icon): "Classic game" opens `https://stackadoo.com/old/` (forwards to `/play.html`,
  the classic game with the kids' classic saves).
- Same package, same upload key, same Digital Asset Links (`/.well-known/assetlinks.json` unchanged). Target/compile 36, min 24.

## Release 41 (1.0.41)

- Version code 41, target/compile SDK 36, min SDK 24.
- Fixes the missing branded splash on Chrome 152+ (log: `Failed to transfer splash image`).
  LauncherActivity now self-grants a persistable read URI permission on the splash FileProvider
  file before the library transfers it. Workaround for android-browser-helper#623; remove once
  the library ships that grant. No other app or start-URL changes (`https://stackadoo.com/play.html`).

## Release 40 (1.0.40)

- Version code 40, rebuilt on current main (Nov 20, 2026). Version code 39 was built and signed on Oct 24
  and handed off for upload, so it may already be registered in Play Console; 40 guarantees no collision.
  Still compile/target SDK 36, min SDK 24. No other app changes.

## Release 39 (1.0.39)

- Version code 39 (bumped from 38 so it cannot collide with any 1.0.38 upload attempt). No other app changes.

## Release 38 (1.0.38)

- Compile and target SDK: 36 (Android 16).
- Minimum SDK: 24 (Android 7.0). Raised from 23 in 1.0.38 because Play automatic protection
  requires minSdk 24 or higher.
- Android Gradle Plugin 8.10.1, Gradle 8.11.1, Java 17.
- Android Browser Helper 2.7.2 includes edge-to-edge splash-screen support.
  Version 2.7.3 raises its minimum SDK to 24, so this project deliberately pins 2.7.2.
- Existing origin, launch URL, orientation, notification delegation, site-settings
  shortcut, colors, and launcher/splash images are preserved.

The repository previously contained only the website. This source was reconstructed
with Bubblewrap core 1.25.0 and checked against the saved PWABuilder bundle's manifest
and resources. Maintain the checked-in Gradle project directly; running Bubblewrap
update can overwrite the dependency, repository, lint and toolchain adjustments.
`twa-manifest.json` records the original generator settings, with release version 41 (version code 41).
Its signing path and alias are placeholders, not actual upload credentials.

## Build

Install Java 17, Android SDK Platform 36 and Build Tools 36.0.0. Set `JAVA_HOME` and
`ANDROID_HOME`, then run from this directory:

```powershell
.\gradlew.bat --no-daemon --max-workers=2 bundleRelease lintRelease
```

On macOS/Linux use `./gradlew` instead. The unsigned bundle is
`app/build/outputs/bundle/release/app-release.aab`; lint writes its report under
`app/build/reports/`.

## Sign with the existing upload key

First compare the key certificate's SHA-256 fingerprint with Play Console's
**App integrity → Upload key certificate**. This is different from the app signing
certificate managed by Google Play. Two historical local Stackadoo packages used
different keys, so never choose by filename or generate a replacement key.

`Sign-Release.ps1` requires the expected upload-certificate fingerprint and reads
passwords with hidden prompts. It checks the certificate before signing and verifies
the result afterward. Keep the original keystore outside the repository.

```powershell
.\Sign-Release.ps1 -KeystorePath 'C:\private\existing-upload.keystore' `
  -KeyAlias 'existing-alias' -ExpectedSha256 'SHA-256-FROM-PLAY-CONSOLE' `
  -OutputPath 'C:\releases\Stackadoo-1.0.38-api36.aab'
```

Never commit signing keys, passwords, `signing.properties`, APKs or bundles. The
Android folder is excluded from Cloudflare's public static assets.

## Release checks

Validate the final bundle with Google's bundletool; inspect package, target SDK,
minimum SDK, version code/name, and signing fingerprint. Confirm that Play Console
has not already used version code 38 before upload. Version code 37 (1.0.37, target API 35)
is already live in Production, so 37 can never be reused.

Test an update over the existing Play-installed app using an internal testing track:
launch, existing saved worlds, back navigation, rotation, Google sign-in, and display
insets on Android 15/16, including a tablet and both navigation modes. A successful
compile and lint do not prove physical-device behavior or clear Play Console warnings.
Upload and Send for review remain separate release steps.
