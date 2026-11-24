#Requires -Version 7.3
<#
.SYNOPSIS
    Sends n8n one signed exception-occurred event whose text is full of Telegram markup characters. Prints no secret.

.DESCRIPTION
    Run from the repo root, with n8n running:  pwsh -File n8n/send-test-exception.ps1

    The backend's throwing route has a fixed message, so it cannot show that _, *, <, > and & arrive intact. This
    script signs the event the way EventPublisher does (HMAC-SHA256 over the exact bytes, keyed with
    AutomationEvents:SigningSecret from the backend's development settings) and posts it to n8n's webhook.
    -Signature Wrong sends a wrong signature, and -Signature None sends no signature header; n8n must answer 401
    to both and send nothing.
#>
param(
    [ValidateSet('Right', 'Wrong', 'None')] [string] $Signature = 'Right'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendSettingsPath = Join-Path $repoRoot 'backend/aspnetproject/appsettings.Development.json'
$eventName = 'exception-occurred'
$signatureHeader = 'X-WebCity-Signature'
$wrongSignatureValue = '0' * 64
$utf8 = [System.Text.UTF8Encoding]::new($false)

$events = (Get-Content -Raw -Path $backendSettingsPath | ConvertFrom-Json).AutomationEvents
$hasSettings = ($null -ne $events) -and $events.BaseUrl -and $events.SigningSecret
if (-not $hasSettings) {
    throw 'AutomationEvents:BaseUrl or SigningSecret is missing. Run pwsh -File n8n/setup.ps1 first.'
}

$envelope = [ordered]@{
    id         = [guid]::NewGuid().ToString()
    event      = $eventName
    occurredAt = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    data       = [ordered]@{
        exceptionType = 'Ezzo.Test_Markup.<Odd>*Exception*'
        message       = 'snake_case *bold* _italic_ <b>not a tag</b> & [a link](https://example.com) `code`'
        stackTrace    = "   at Ezzo.Test<T>.Run_Once() in C:\test_folder\file.cs:line 1`n   at *Star*.Main()"
        placeKind     = 'Request'
        place         = 'GET /api/test_markup/<id>'
        fingerprint   = 'Ezzo.Test_Markup.<Odd>*Exception*|GET /api/test_markup/<id>'
    }
}
$body = $utf8.GetBytes((ConvertTo-Json -InputObject $envelope -Compress))

$headers = @{}
if ($Signature -eq 'Right') {
    $hmac = [System.Security.Cryptography.HMACSHA256]::new($utf8.GetBytes($events.SigningSecret))
    try {
        $headers[$signatureHeader] = [Convert]::ToHexString($hmac.ComputeHash($body)).ToLowerInvariant()
    }
    finally {
        $hmac.Dispose()
    }
}
elseif ($Signature -eq 'Wrong') {
    $headers[$signatureHeader] = $wrongSignatureValue
}

$response = Invoke-WebRequest -Method Post -Uri "$($events.BaseUrl.TrimEnd('/'))/webhook/$eventName" `
    -ContentType 'application/json; charset=utf-8' -Headers $headers -Body $body -SkipHttpErrorCheck
Write-Host "n8n answered $($response.StatusCode)."
