#Requires -Version 7.3
<#
.SYNOPSIS
    Exports a workflow from the running n8n into n8n/workflows/, without pinned test data.

.DESCRIPTION
    Run from the repo root, with n8n running, after you saved the workflow in the editor:
        pwsh -File n8n/export-workflow.ps1 -Id wcExceptionAlert

    Overwrites the committed file that has the same id (or -File, for a new workflow). The file keeps the id,
    the name, the nodes, the connections and the settings; tools/clean-workflow.js drops pinned data and what
    n8n stamps per instance. Review the diff before you commit it.

.EXAMPLE
    pwsh -File n8n/export-workflow.ps1 -Id wcWelcomeEmail01 -File welcome-email.json
#>
param(
    [Parameter(Mandatory)] [string] $Id,
    [string] $File
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$composeFile = Join-Path $PSScriptRoot 'compose.yaml'
$workflowsFolder = Join-Path $PSScriptRoot 'workflows'
$exportedPath = '/tmp/webcity-export.json'
$cleanPath = '/tmp/webcity-clean.json'
$toolsFolder = '/opt/webcity-tools' # where compose.yaml mounts n8n/tools

$fileGiven = [bool] $File
if (-not $fileGiven) {
    $workflowFile = Get-ChildItem -Path $workflowsFolder -Filter '*.json' |
        Where-Object { (Get-Content -Raw -Path $_.FullName | ConvertFrom-Json).id -eq $Id } |
        Select-Object -First 1
    $workflowFileFound = $null -ne $workflowFile
    if (-not $workflowFileFound) {
        throw "No file in n8n/workflows has the id $Id. Name the new file with -File."
    }
    $File = $workflowFile.Name
}
$target = Join-Path $workflowsFolder $File

docker compose -f $composeFile exec -T n8n n8n export:workflow --id=$Id --output=$exportedPath
docker compose -f $composeFile exec -T n8n node "$toolsFolder/clean-workflow.js" $exportedPath $cleanPath
docker compose -f $composeFile cp "n8n:$cleanPath" $target

Write-Host "Exported $Id to n8n/workflows/$File. Review the diff before you commit it."
