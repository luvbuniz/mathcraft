# Stackadoo Android wrapper

This Trusted Web Activity opens `https://stackadoo.com/play.html` under the existing
package `com.stackadoo.twa`. It does not bundle or modify game code or saved worlds.

## Release 37 (1.0.37)

- Compile and target SDK: 36 (Android 16).
- Minimum SDK: 23 (Android 6), preserved from the original PWABuilder package.
- Android Gradle Plugin 8.10.1, Gradle 8.11.1, Java 17.
- Android Browser Helper 2.7.2 includes edge-to-edge splash-screen support.
  Version 2.7.3 raises its minimum SDK to 24, so this project deliberately pins 2.7.2.
- Existing origin, launch URL, orientation, notification delegation, site-settings
  shortcut, colors, and launcher/splash images are preserved.

The repository previously contained only the website. This source was reconstructed
with Bubblewrap core 1.25.0 and checked against the saved PWABuilder bundle's manifest
and resources. Maintain the checked-in Gradle project directly; running Bubblewrap
update can overwrite the dependency, repository, lint and toolchain adjustments.
`twa-manifest.json` records the original generator settings, with release version 37.
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
  -OutputPath 'C:\releases\Stackadoo-1.0.37-api36.aab'
```

Never commit signing keys, passwords, `signing.properties`, APKs or bundles. The
Android folder is excluded from Cloudflare's public static assets.

## Release checks

Validate the final bundle with Google's bundletool; inspect package, target SDK,
minimum SDK, version code/name, and signing fingerprint. Confirm that Play Console
has not already used version code 37 before upload (36 was the reported maximum).

Test an update over the existing Play-installed app using an internal testing track:
launch, existing saved worlds, back navigation, rotation, Google sign-in, and display
insets on Android 15/16, including a tablet and both navigation modes. A successful
compile and lint do not prove physical-device behavior or clear Play Console warnings.
Upload and Send for review remain separate release steps.
