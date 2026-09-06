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

  # Archived decks are copied verbatim out of the deck repo, so a deck authored
  # for the room won't carry the noindex tag the published archive needs. Inject
  # it here rather than relying on every future edition remembering: publishing
  # a deck to a public URL is what creates copyright exposure, and keeping the
  # archive out of reverse-image crawlers removes the discovery path.
  # (robots.txt can't do this job - it's only read from the domain root, and the
  # site is served from the /my-presentation/ subpath.)
  $indexPath = Join-Path $target 'index.html'
  $html = Get-Content $indexPath -Raw
  if ($html -notmatch '(?i)name\s*=\s*"robots"') {
    $tag = '  <meta name="robots" content="noindex, nofollow, noimageindex, noarchive">'
    $html = [regex]::Replace(
      $html,
      '(?i)(<meta\s+name\s*=\s*"viewport"[^>]*>)',
      "`$1`r`n$tag",
      [System.Text.RegularExpressions.RegexOptions]::None,
      [timespan]::FromSeconds(5))
    Set-Content $indexPath $html -NoNewline -Encoding utf8
    Write-Host "  + injected noindex meta tag" -ForegroundColor DarkGray
  }

  if (-not (Test-Path (Join-Path $target 'CREDITS.md'))) {
    Write-Warning "  '$slug' has no CREDITS.md - check what's in assets/ before this goes public."
  }

  Write-Host "Published '$slug' -> public/decks/$slug/" -ForegroundColor Green
}
