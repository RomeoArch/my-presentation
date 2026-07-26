<#
  publish-deck.ps1  -  Codeforce website

  Copies an archived deck edition out of the Codeforce deck repo into
  public/decks/<YYYY-MM>/, where Vite serves it verbatim (no bundling) and
  index.html embeds it in an iframe.

  Run it after archive-session.ps1 has snapshotted a finished month:

      ./scripts/publish-deck.ps1 2026-06          # publish one edition
      ./scripts/publish-deck.ps1 -All             # publish every archived edition
      ./scripts/publish-deck.ps1 2026-06 -Force   # overwrite an already published one

  Then add a tab to the toolbar in index.html:

      <button type="button" class="deck-tab" aria-pressed="false"
          data-deck="2026-06" data-deck-label="June 2026">June 2026</button>
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [string]$Edition,                                                   # folder slug, e.g. 2026-06
  [string]$ArchiveRoot = '..\Codeforce\codeforce-deck\archive',       # deck repo, relative to the site root
  [switch]$All,                                                       # publish every edition found
  [switch]$Force                                                      # overwrite existing target folders
)

$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path $PSScriptRoot -Parent

$archive = if ([System.IO.Path]::IsPathRooted($ArchiveRoot)) { $ArchiveRoot } else { Join-Path $siteRoot $ArchiveRoot }
if (-not (Test-Path $archive)) { throw "Deck archive not found: $archive`nPass -ArchiveRoot with the path to codeforce-deck/archive." }

if (-not $Edition -and -not $All) { throw "Pass an edition slug (e.g. 2026-06) or -All." }

$editions = if ($All) {
  Get-ChildItem $archive -Directory | Select-Object -ExpandProperty Name
} else {
  @($Edition)
}

$decks = Join-Path $siteRoot 'public\decks'
New-Item -ItemType Directory -Force $decks | Out-Null

foreach ($slug in $editions) {
  $src = Join-Path $archive $slug
  if (-not (Test-Path (Join-Path $src 'index.html'))) {
    Write-Warning "Skipping '$slug' - no index.html in $src"
    continue
  }

  $target = Join-Path $decks $slug
  if ((Test-Path $target) -and -not $Force) {
    Write-Warning "Skipping '$slug' - already published. Re-run with -Force to overwrite."
    continue
  }
  if (Test-Path $target) { Remove-Item $target -Recurse -Force }

  Copy-Item $src -Destination $target -Recurse
  Write-Host "Published '$slug' -> public/decks/$slug/" -ForegroundColor Green
}
