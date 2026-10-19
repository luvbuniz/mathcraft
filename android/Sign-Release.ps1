[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$KeystorePath,
    [Parameter(Mandatory)][string]$KeyAlias,
    [Parameter(Mandatory)][string]$ExpectedSha256,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$BundlePath = (Join-Path $PSScriptRoot 'app/build/outputs/bundle/release/app-release.aab')
)
$ErrorActionPreference = 'Stop'
$expected = ($ExpectedSha256 -replace '[:\s]', '').ToUpperInvariant()
if ($expected -notmatch '^[0-9A-F]{64}$') { throw 'ExpectedSha256 must be the upload certificate SHA-256 from Play Console.' }
if (-not $env:JAVA_HOME) { throw 'Set JAVA_HOME to Java 17 first.' }
$keytool = Join-Path $env:JAVA_HOME 'bin/keytool.exe'
$jarsigner = Join-Path $env:JAVA_HOME 'bin/jarsigner.exe'
$keystore = (Resolve-Path -LiteralPath $KeystorePath).Path
$bundle = (Resolve-Path -LiteralPath $BundlePath).Path
$output = [IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $output) { throw 'Output already exists; choose a new filename.' }
$storePassword = Read-Host 'Keystore password' -AsSecureString
$keyPassword = Read-Host 'Key password' -AsSecureString
$previousStore = $env:STACKADOO_STORE_PASSWORD
$previousKey = $env:STACKADOO_KEY_PASSWORD
try {
    $env:STACKADOO_STORE_PASSWORD = [Net.NetworkCredential]::new('', $storePassword).Password
    $env:STACKADOO_KEY_PASSWORD = [Net.NetworkCredential]::new('', $keyPassword).Password
    $certificate = & $keytool '-J-Duser.language=en' -list -v -keystore $keystore -alias $KeyAlias -storepass:env STACKADOO_STORE_PASSWORD 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) { throw 'Could not read the existing key; check its path, alias and password.' }
    if ($certificate -notmatch 'SHA256:\s*([A-Fa-f0-9:]+)') { throw 'Could not find the certificate SHA-256.' }
    if (($matches[1] -replace ':', '').ToUpperInvariant() -ne $expected) { throw 'Wrong upload key: certificate does not match Play Console. Nothing signed.' }
    New-Item -ItemType Directory -Force ([IO.Path]::GetDirectoryName($output)) | Out-Null
    $signResult = & $jarsigner -keystore $keystore -storepass:env STACKADOO_STORE_PASSWORD -keypass:env STACKADOO_KEY_PASSWORD -sigalg SHA256withRSA -digestalg SHA-256 -signedjar $output $bundle $KeyAlias 2>&1
    if ($LASTEXITCODE -ne 0) { throw 'Signing failed; do not upload the output.' }
    $verifyResult = & $jarsigner '-J-Duser.language=en' -verify $output 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0 -or $verifyResult -notmatch 'jar verified') { throw 'Signature verification failed; do not upload the output.' }
    $signedCertificate = & $keytool '-J-Duser.language=en' -printcert -jarfile $output 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0 -or $signedCertificate -notmatch 'SHA256:\s*([A-Fa-f0-9:]+)') { throw 'Cannot verify the signed bundle certificate.' }
    if (($matches[1] -replace ':', '').ToUpperInvariant() -ne $expected) { throw 'Signed bundle has an unexpected certificate; do not upload.' }
    Write-Output "Signed and verified: $output"
    Get-FileHash -LiteralPath $output -Algorithm SHA256
} finally {
    $env:STACKADOO_STORE_PASSWORD = $previousStore
    $env:STACKADOO_KEY_PASSWORD = $previousKey
    $storePassword.Dispose()
    $keyPassword.Dispose()
}
