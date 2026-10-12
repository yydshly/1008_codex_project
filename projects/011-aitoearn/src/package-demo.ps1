$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $PSScriptRoot
$stageDir = Join-Path $projectDir 'upstream/demo-bundle'
$outputDir = Join-Path $projectDir 'experiments/research-to-post'
$mediaStage = Join-Path $stageDir 'assets/research-to-post'
$recordStage = Join-Path $stageDir 'experiments/research-to-post'
New-Item -ItemType Directory -Path $mediaStage, $recordStage -Force | Out-Null
foreach ($fileName in 'card-01.png', 'card-02.png', 'card-03.png') {
  Copy-Item -LiteralPath (Join-Path $projectDir "assets/research-to-post/$fileName") -Destination $mediaStage -Force
}
foreach ($fileName in 'README.md', 'brief.json', 'plan.json', 'prompts.json', 'generation-calls.json', 'draft.json', 'draft.md', 'run.json', 'adapter-SKILL.md') {
  Copy-Item -LiteralPath (Join-Path $outputDir $fileName) -Destination $recordStage -Force
}
Copy-Item -LiteralPath (Join-Path $projectDir 'src/skill-installation.json') -Destination $stageDir -Force
Copy-Item -LiteralPath (Join-Path $projectDir 'src/LICENSE.upstream.txt') -Destination $stageDir -Force
Copy-Item -LiteralPath (Join-Path $outputDir 'inputs') -Destination $recordStage -Recurse -Force
Add-Type -AssemblyName System.IO.Compression
$zipStream = [System.IO.File]::Open((Join-Path $outputDir 'output-bundle.zip'), [System.IO.FileMode]::Create)
$demoZip = [System.IO.Compression.ZipArchive]::new($zipStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
try {
  foreach ($stageFile in Get-ChildItem -LiteralPath $stageDir -File -Recurse) {
    $entryName = $stageFile.FullName.Substring($stageDir.Length + 1).Replace('\', '/')
    $entry = $demoZip.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
    $inputStream = [System.IO.File]::OpenRead($stageFile.FullName)
    $entryStream = $entry.Open()
    try { $inputStream.CopyTo($entryStream) } finally { $entryStream.Dispose(); $inputStream.Dispose() }
  }
} finally { $demoZip.Dispose(); $zipStream.Dispose() }
Write-Output 'Output bundle created; relative media paths preserved.'
