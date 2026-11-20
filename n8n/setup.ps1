#Requires -Version 7.3
<#
.SYNOPSIS
    Generates the secrets the backend and n8n share and writes them to both sides. Prints no secret.

.DESCRIPTION
    Run from the repo root:  pwsh -File n8n/setup.ps1

    - n8n/.env and n8n/credentials.json are copied from their examples when they do not exist yet.
    - n8n's encryption key in n8n/.env is generated once, while it is still the placeholder.
    - The signing secret (n8n's Crypto credential, the backend's AutomationEvents:SigningSecret) and the
      automation's API key (n8n's header credential, the backend's AutomationApi:Key) are generated when
      neither side has one, and copied to the side that lacks one otherwise. The backend's value wins when
      the two sides disagree.
    - Events are turned on in backend/aspnetproject/appsettings.Development.json, with n8n's address.

    Running it again keeps every existing value and writes no file whose content would not change.
#>

$ErrorActionPreference = 'Stop'

$n8nFolder = $PSScriptRoot
$repoRoot = Split-Path -Parent $n8nFolder
$envPath = Join-Path $n8nFolder '.env'
$envExamplePath = Join-Path $n8nFolder '.env.example'
$credentialsPath = Join-Path $n8nFolder 'credentials.json'
$credentialsExamplePath = Join-Path $n8nFolder 'credentials.example.json'
$backendSettingsPath = Join-Path $repoRoot 'backend/aspnetproject/appsettings.Development.json'

$placeholder = 'change-me'
# Not localhost: .NET tries localhost's IPv6 address first, where Docker publishes nothing, and the attempt hangs
# until the publisher's timeout (ticket 02, Comments).
$n8nAddress = 'http://127.0.0.1:5678'
$encryptionKeyName = 'N8N_ENCRYPTION_KEY'
$signingCredentialId = 'wcSigningSecret1'
$signingCredentialField = 'hmacSecret'
$apiKeyCredentialId = 'wcAutomationKey1'
$apiKeyCredentialField = 'value'
$secretByteCount = 32
$jsonDepth = 64
$utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)

function New-Secret {
    $bytes = [byte[]]::new($secretByteCount)
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    [Convert]::ToHexString($bytes).ToLowerInvariant()
}

function Test-HasValue([object] $value) {
    ($value -is [string]) -and -not [string]::IsNullOrWhiteSpace($value) -and ($value -ne $placeholder)
}

# Writes the file only when its content changes, so a second run touches nothing. Returns whether it wrote.
function Write-IfChanged([string] $path, [string] $content) {
    $current = if (Test-Path $path) { [System.IO.File]::ReadAllText($path) } else { $null }
    $changed = $current -ne $content
    if ($changed) {
        [System.IO.File]::WriteAllText($path, $content, $utf8WithoutBom)
    }
    $changed
}

function Read-Json([string] $path) {
    Get-Content -Raw -Path $path | ConvertFrom-Json -AsHashtable -NoEnumerate
}

function ConvertTo-JsonText([object] $value) {
    (ConvertTo-Json -InputObject $value -Depth $jsonDepth) + [Environment]::NewLine
}

function Get-Section([System.Collections.IDictionary] $parent, [string] $name) {
    if (-not ($parent[$name] -is [System.Collections.IDictionary])) {
        $parent[$name] = [ordered]@{}
    }
    $parent[$name]
}

function Get-Credential([object[]] $credentials, [string] $id) {
    $credential = $credentials | Where-Object { $_['id'] -eq $id } | Select-Object -First 1
    if ($null -eq $credential) {
        throw "n8n/credentials.json has no credential with the id $id. Compare it with n8n/credentials.example.json."
    }
    $credential
}

# Picks the value both sides should hold and says where it came from. Never returns the value in a message.
function Resolve-SharedSecret([object] $backendValue, [object] $n8nValue, [string] $label) {
    $backendHasValue = Test-HasValue $backendValue
    $n8nHasValue = Test-HasValue $n8nValue
    if ($backendHasValue) {
        $value = $backendValue
        $origin = if (-not $n8nHasValue) { 'kept from the backend, copied to n8n' }
                  elseif ($n8nValue -ne $backendValue) { 'kept from the backend, n8n''s differed and is replaced' }
                  else { 'kept' }
    }
    elseif ($n8nHasValue) {
        $value = $n8nValue
        $origin = 'kept from n8n, copied to the backend'
    }
    else {
        $value = New-Secret
        $origin = 'generated'
    }
    Write-Host "  ${label}: $origin"
    $value
}

if (-not (Test-Path $backendSettingsPath)) {
    throw "backend/aspnetproject/appsettings.Development.json does not exist. Create it first (CLAUDE.md, Config prerequisites)."
}

foreach ($pair in @(@($envPath, $envExamplePath), @($credentialsPath, $credentialsExamplePath))) {
    if (-not (Test-Path $pair[0])) {
        Copy-Item -Path $pair[1] -Destination $pair[0]
        Write-Host "Created $([System.IO.Path]::GetRelativePath($repoRoot, $pair[0])) from its example."
    }
}

Write-Host 'Secrets:'

# n8n's encryption key: generated once. Changing it later locks n8n out of a kept volume, so an existing key stays.
$envText = [System.IO.File]::ReadAllText($envPath)
$placeholderLine = "(?m)^$encryptionKeyName=$([regex]::Escape($placeholder))\r?$"
$keyIsPlaceholder = $envText -match $placeholderLine
if ($keyIsPlaceholder) {
    $envText = $envText -replace "(?m)^$encryptionKeyName=$([regex]::Escape($placeholder))(?=\r?$)", "$encryptionKeyName=$(New-Secret)"
    Write-Host '  n8n encryption key: generated'
}
else {
    Write-Host '  n8n encryption key: kept'
}

$settings = Read-Json $backendSettingsPath
$events = Get-Section $settings 'AutomationEvents'
$automationApi = Get-Section $settings 'AutomationApi'

$credentials = Read-Json $credentialsPath # -NoEnumerate keeps it an array
$signingData = Get-Section (Get-Credential $credentials $signingCredentialId) 'data'
$apiKeyData = Get-Section (Get-Credential $credentials $apiKeyCredentialId) 'data'

$signingSecret = Resolve-SharedSecret $events['SigningSecret'] $signingData[$signingCredentialField] 'Signing secret'
$apiKey = Resolve-SharedSecret $automationApi['Key'] $apiKeyData[$apiKeyCredentialField] 'Automation API key'

$events['Enabled'] = $true
$events['BaseUrl'] = $n8nAddress
$events['SigningSecret'] = $signingSecret
$automationApi['Key'] = $apiKey
$signingData[$signingCredentialField] = $signingSecret
$apiKeyData[$apiKeyCredentialField] = $apiKey

Write-Host 'Files:'
$files = @(
    @('n8n/.env', $envPath, $envText),
    @('n8n/credentials.json', $credentialsPath, (ConvertTo-JsonText $credentials)),
    @('backend/aspnetproject/appsettings.Development.json', $backendSettingsPath, (ConvertTo-JsonText $settings))
)
foreach ($file in $files) {
    $state = if (Write-IfChanged $file[1] $file[2]) { 'written' } else { 'unchanged' }
    Write-Host "  $($file[0]): $state"
}

Write-Host "Events are on in the backend's development settings, sent to $n8nAddress."
Write-Host 'Fill in the remaining change-me values in n8n/.env and n8n/credentials.json, then start n8n (n8n/README.md).'
