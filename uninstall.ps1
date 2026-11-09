# dsh-balance-monitor uninstaller
#
# Removes the bundle layer from a DeepSeek Harness profile, then uninstalls the
# package. DSH installation, home and profile are auto-detected.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File uninstall.ps1
#   powershell -ExecutionPolicy Bypass -File uninstall.ps1 -Profile desktop -Restart
#
# Tip: a running DSH agent can remove it live:
#   plugin_manager remove_bundle  target = dsh-balance-monitor

param(
    [string]$Profile = "desktop",
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
$profileDir = Join-Path $DshHome "profiles\$Profile"
if (-not (Test-Path -LiteralPath $profileDir)) { throw "DSH profile not found: $profileDir" }

Write-Host "Profile: $profileDir"

# --- 1) remove the bundle layer --------------------------------------------

Write-Host "`n[1/3] removing bundle layer from package.json"
$profilePackagePath = Join-Path $profileDir "package.json"
$profilePackage = Get-Content -LiteralPath $profilePackagePath -Raw | ConvertFrom-Json
$bundles = New-Object System.Collections.ArrayList
if ($profilePackage.dsh.profile.bundles) {
    foreach ($b in $profilePackage.dsh.profile.bundles) {
        if ([string]$b -ne $PackageName) { [void]$bundles.Add([string]$b) }
    }
}
$profilePackage.dsh.profile.bundles = @($bundles)
$profilePackage | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $profilePackagePath -Encoding utf8
Write-Host "  removed $PackageName (if present)"

# --- 2) uninstall the dependency -------------------------------------------

Write-Host "`n[2/3] pnpm remove $PackageName"
& $cli plugin --profile $Profile remove $PackageName
if ($LASTEXITCODE -ne 0) {
    Write-Host "  pnpm remove returned $LASTEXITCODE (it may already be absent)" -ForegroundColor Yellow
}

# --- 3) clean a leftover link ----------------------------------------------

$leftover = Join-Path $profileDir "node_modules\$PackageName"
if (Test-Path -LiteralPath $leftover) {
    $item = Get-Item -LiteralPath $leftover -Force
    if ($item.LinkType -eq "Junction" -or $item.LinkType -eq "SymbolicLink") {
        $item.Delete()
        Write-Host "  removed leftover link $leftover"
    } else {
        Write-Host "  leaving non-link directory untouched: $leftover" -ForegroundColor Yellow
    }
}

Write-Host "`n[3/3] done."
$app = Get-Process -Name "DeepSeek Harness" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($app) {
    if ($Restart) {
        Write-Host "Restarting DeepSeek Harness..."
        Stop-Process -Id $app.Id
        Start-Sleep -Seconds 2
        Start-Process -FilePath $exe
    } else {
        Write-Host "Restart DeepSeek Harness to unload the plugin." -ForegroundColor Yellow
        Write-Host "Tip: a DSH agent can remove it live: plugin_manager remove_bundle target=$PackageName" -ForegroundColor Yellow
    }
} else {
    Write-Host "DeepSeek Harness is not running; the plugin is gone on next start."
}
