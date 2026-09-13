# Mobile slide images

Keep `.nojekyll` in the repository root and `public/`. Without it, GitHub
Pages' branch publisher excludes the underscore-prefixed `_mobile/` and
`_lite/` folders, causing mobile-only 404s even though desktop decks load.
The intended deployment remains the GitHub Actions Vite build.

Mobile devices display the archived deck as 1600 × 900 JPEGs with percentage-based
link overlays. Only the current image is mounted. The desktop viewer is unchanged.
Images preserve the presentation design, but freeze animations and interactive
slide widgets. External website embeds become styled links during capture.

Run `npm run capture-decks` after changing a deck's content, styles, assets, or
engine. It uses Playwright with installed Edge on Windows; on Linux install its
browser first with `npx playwright install --with-deps chromium`.

Commit `public/decks/_mobile/<edition>/` alongside the archive. `npm run build`
validates that image files exist and the content hash matches, without needing a
browser in GitHub Actions. Publishing a new deck also runs the capture command.

The capture tool uses the actual desktop page, waits for entrances, records
visible link and QR/copy-URL regions, then captures each slide. Inspect generated
images when a deck adds custom interactions: only the captured state is shown.
If styles/assets change without a content change, recapture explicitly; the
content hash does not detect those changes.
