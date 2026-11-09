# dsh-balance-monitor installer
#
# Installs the plugin bundle into a DeepSeek Harness profile and enables its
# bundle layer. The DSH installation, its home directory and the profile are
# auto-detected; override any of them with the parameters below.
#
# Usage (from a cloned repo directory):
#   powershell -ExecutionPolicy Bypass -File install.ps1
#   powershell -ExecutionPolicy Bypass -File install.ps1 -Profile desktop -Restart
#   powershell -ExecutionPolicy Bypass -File install.ps1 -Spec github:kousenlee/dsh-balance-monitor
#
# Tip: a running DSH agent can install this even without a restart:
#   plugin_manager install_bundle  target = github:kousenlee/dsh-balance-monitor

param(
    [string]$Profile = "desktop",
    [string]$Spec = "",
    [string]$PluginDir = "",
    [string]$PackageName = "dsh-balance-monitor",
    [string]$DshExe = "",
    [string]$DshHome = "",
    [switch]$Restart
)

$ErrorActionPreference = "Stop"

function Resolve-DshExe {
    param([string]$Explicit)
    if (-not [string]::IsNullOrWhiteSpace($Explicit)) {
        if (-not (Test-Path -LiteralPath $Explicit)) { throw "DeepSeek Harness executable not found: $Explicit" }
        return (Resolve-Path -LiteralPath $Explicit).Path
    }
    if (-not [string]::IsNullOrWhiteSpace($env:DSH_DESKTOP_EXE) -and (Test-Path -LiteralPath $env:DSH_DESKTOP_EXE)) {
        return (Resolve-Path -LiteralPath $env:DSH_DESKTOP_EXE).Path
    }
    $running = Get-Process -Name "DeepSeek Harness" -ErrorAction SilentlyContinue |
        Where-Object { $_.Path } | Select-Object -First 1
    if ($running) { return $running.Path }
    $candidates = New-Object System.Collections.ArrayList
    if ($env:LOCALAPPDATA) { [void]$candidates.Add((Join-Path $env:LOCALAPPDATA "Programs\DeepSeek Harness\DeepSeek Harness.exe")) }
    if ($env:ProgramFiles) { [void]$candidates.Add((Join-Path $env:ProgramFiles "DeepSeek Harness\DeepSeek Harness.exe")) }
    if (${env:ProgramFiles(x86)}) { [void]$candidates.Add((Join-Path ${env:ProgramFiles(x86)} "DeepSeek Harness\DeepSeek Harness.exe")) }
    if ($env:LOCALAPPDATA) { [void]$candidates.Add((Join-Path $env:LOCALAPPDATA "DeepSeek Harness\DeepSeek Harness.exe")) }
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) { return (Resolve-Path -LiteralPath $candidate).Path }
    }
    throw "DeepSeek Harness executable not found. Pass -DshExe '<path to DeepSeek Harness.exe>'."
}

# --- resolve installation, home, profile and CLI -----------------------------

$exe = Resolve-DshExe -Explicit $DshExe
$installRoot = Split-Path -Parent $exe
$cli = Join-Path $installRoot "resources\runtime\cli\bin\dsh.cmd"
if (-not (Test-Path -LiteralPath $cli)) {
    $onPath = Get-Command dsh -ErrorAction SilentlyContinue
    if (-not $onPath) { throw "dsh CLI not found next to the app ($cli) and not on PATH." }
    $cli = $onPath.Source
}

if ([string]::IsNullOrWhiteSpace($DshHome)) {
    if (-not [string]::IsNullOrWhiteSpace($env:DSH_HOME)) { $DshHome = $env:DSH_HOME }
    else { $DshHome = Join-Path $env:USERPROFILE ".dsh" }
}
$profilesRoot = Join-Path $DshHome "profiles"
if (-not (Test-Path -LiteralPath $profilesRoot)) {
    throw "DSH profiles directory not found: $profilesRoot (pass -DshHome)"
}
$profileDir = Join-Path $profilesRoot $Profile
if (-not (Test-Path -LiteralPath $profileDir)) {
    $available = (Get-ChildItem -LiteralPath $profilesRoot -Directory | Select-Object -ExpandProperty Name) -join ", "
    throw "Profile '$Profile' not found in $profilesRoot. Available profiles: $available"
}

# --- choose the package spec -------------------------------------------------

$installFromLocal = $false
if ([string]::IsNullOrWhiteSpace($PluginDir)) {
    $PluginDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$localManifest = Join-Path $PluginDir "package.json"
if (-not (Test-Path -LiteralPath $localManifest)) {
    if ([string]::IsNullOrWhiteSpace($Spec)) {
        throw "No package.json in $PluginDir. Run this script from the repo root or pass -Spec."
    }
} else {
    $manifest = Get-Content -LiteralPath $localManifest -Raw | ConvertFrom-Json
    if ($manifest.dsh.bundle.patch -and $manifest.name) {
        $PackageName = [string]$manifest.name
        $installFromLocal = $true
    }
}

if ([string]::IsNullOrWhiteSpace($Spec)) {
    $Spec = "link:$((Resolve-Path -LiteralPath $PluginDir).Path)"
}
Write-Host "Package: $PackageName"
Write-Host "Spec:    $Spec"
Write-Host "Profile: $profileDir"

# --- 1) install the package dependency --------------------------------------

Write-Host "`n[1/3] dsh plugin --profile $Profile add $Spec"
& $cli plugin --profile $Profile add $Spec
if ($LASTEXITCODE -ne 0) { throw "pnpm add failed with exit code $LASTEXITCODE" }

# --- 2) enable the bundle layer ---------------------------------------------

Write-Host "`n[2/3] enabling bundle in package.json dsh.profile.bundles"
$profilePackagePath = Join-Path $profileDir "package.json"
$profilePackage = Get-Content -LiteralPath $profilePackagePath -Raw | ConvertFrom-Json
$bundles = New-Object System.Collections.ArrayList
if ($profilePackage.dsh.profile.bundles) {
    foreach ($b in $profilePackage.dsh.profile.bundles) { [void]$bundles.Add([string]$b) }
}
if ($bundles.Contains($PackageName)) {
    Write-Host "  already listed"
} else {
    [void]$bundles.Add($PackageName)
    $profilePackage.dsh.profile.bundles = @($bundles)
    $profilePackage | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $profilePackagePath -Encoding utf8
    Write-Host "  added $PackageName"
}

# --- 3) what is left -------------------------------------------------------

Write-Host "`n[3/3] done."
$app = Get-Process -Name "DeepSeek Harness" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($app) {
    if ($Restart) {
        Write-Host "Restarting DeepSeek Harness..."
        Stop-Process -Id $app.Id
        Start-Sleep -Seconds 2
        Start-Process -FilePath $exe
    } else {
        Write-Host ""
        Write-Host "DeepSeek Harness is running. Its profile composition is applied at" -ForegroundColor Yellow
        Write-Host "startup, so restart the app to load this plugin. Sessions are kept." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Avoid the restart: a DSH agent can hot-install the bundle instead:" -ForegroundColor Yellow
        Write-Host "  plugin_manager install_bundle  target = $Spec" -ForegroundColor Yellow
    }
} else {
    Write-Host "Start DeepSeek Harness; the plugin loads at startup."
}
