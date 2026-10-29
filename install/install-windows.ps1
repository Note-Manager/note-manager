[CmdletBinding()]
param(
    [string]$Dir = (Join-Path $HOME "note-manager"),
    [string]$Ref = "",
    [switch]$Help
)

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/Note-Manager/note-manager.git"
$PackageName = "note-manager"
$ProductName = "Note Manager"

function Show-Usage {
    Write-Host @"
Usage: install-windows.ps1 [-Dir <folder>] [-Ref <branch-or-tag>]

Builds $ProductName from source and installs it with its Squirrel installer.
Run from a $ProductName checkout, it builds that checkout.
Otherwise it clones $RepoUrl into -Dir (default: $Dir).
-Ref checks out a branch or tag before building (default for a clone: main).
"@
}

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Native([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "'$Command $($Arguments -join ' ')' failed with exit code $LASTEXITCODE."
    }
}

function Assert-Command([string]$Name, [string]$Hint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is required. $Hint"
    }
}

function Assert-Prerequisites {
    Assert-Command "git" "Install Git from https://git-scm.com/download/win"
    Assert-Command "node" "Install Node.js 22.17+ or 24+ from https://nodejs.org/"
    Assert-Command "npm" "npm is installed together with Node.js."
    $version = [version]((node -p "process.versions.node").Trim())
    if (-not ($version.Major -ge 24 -or ($version.Major -eq 22 -and $version.Minor -ge 17))) {
        throw "Node.js $version is not supported. Use Node.js 22.17+ or 24+."
    }
    if (Get-Process -Name $PackageName -ErrorAction SilentlyContinue) {
        throw "$ProductName is running. Close it and run the script again."
    }
}

function Test-NoteManager([string]$Folder) {
    $packageJson = Join-Path $Folder "package.json"
    (Test-Path $packageJson) -and ((Get-Content $packageJson -Raw | ConvertFrom-Json).name -eq $PackageName)
}

function Get-ScriptCheckout {
    if (-not $PSScriptRoot) {
        return $null
    }
    $root = Split-Path $PSScriptRoot -Parent
    if (Test-NoteManager $root) { $root } else { $null }
}

function Switch-Ref([string]$Folder, [string]$Name) {
    if (-not (Test-Path (Join-Path $Folder ".git"))) {
        throw "$Folder is not a Git clone, so -Ref cannot be used."
    }
    Write-Step "Checking out $Name"
    Invoke-Native "git" @("-C", $Folder, "fetch", "--tags", "origin")
    Invoke-Native "git" @("-C", $Folder, "checkout", $Name)
    & git -C $Folder show-ref --verify --quiet "refs/remotes/origin/$Name"
    if ($LASTEXITCODE -eq 0) {
        Invoke-Native "git" @("-C", $Folder, "merge", "--ff-only", "origin/$Name")
    }
}

function Get-Source {
    $checkout = Get-ScriptCheckout
    if ($checkout) {
        Write-Step "Using the checkout in $checkout"
        if ($Ref) { Switch-Ref $checkout $Ref }
        return $checkout
    }
    $branch = if ($Ref) { $Ref } else { "main" }
    if (-not (Test-Path $Dir)) {
        Write-Step "Cloning $RepoUrl into $Dir"
        Invoke-Native "git" @("clone", "--branch", $branch, $RepoUrl, $Dir)
        return $Dir
    }
    if (-not (Test-NoteManager $Dir)) {
        throw "$Dir exists and is not a $ProductName checkout. Choose another folder with -Dir."
    }
    Switch-Ref $Dir $branch
    return $Dir
}

function Invoke-Build([string]$Folder) {
    Set-Location $Folder
    Write-Step "Installing dependencies"
    Remove-Item -Recurse -Force "out" -ErrorAction SilentlyContinue
    Invoke-Native "npm.cmd" @("ci")
    Write-Step "Building (make)"
    Invoke-Native "npm.cmd" @("run", "make")
}

function Install-App([string]$Folder) {
    $setup = Get-ChildItem -Path (Join-Path $Folder "out\make\squirrel.windows") -Recurse -Filter "*Setup.exe" | Select-Object -First 1
    if (-not $setup) {
        throw "No Squirrel installer was built in out\make\squirrel.windows."
    }
    Write-Step "Installing with $($setup.Name)"
    $process = Start-Process -FilePath $setup.FullName -Wait -PassThru
    if ($process.ExitCode -ne 0) {
        throw "$($setup.Name) failed with exit code $($process.ExitCode)."
    }
}

if ($Help) {
    Show-Usage
    exit 0
}

try {
    Assert-Prerequisites
    $source = Get-Source
    Invoke-Build $source
    Install-App $source
    $version = (Get-Content (Join-Path $source "package.json") -Raw | ConvertFrom-Json).version
    Write-Step "$ProductName $version is installed and started"
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
