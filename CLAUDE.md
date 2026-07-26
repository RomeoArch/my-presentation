# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm start        # vite --host — dev server, also exposed on the LAN (for phone testing)
npm run build    # vite build → dist/
npm run preview  # serve the production build

# Copy an archived deck edition out of the Codeforce deck repo into public/decks/
npm run publish-deck -- 2026-06
npm run publish-deck -- -All
```

There are no tests and no linter. `vite.config.js` sets exactly one thing — `base: "/my-presentation/"`, the GitHub Pages subpath — so the dev server and the preview server both serve the site at `/my-presentation/`, not `/`. `index.html` is the entry point.

## Deployment

The site is published to GitHub Pages at `https://romeoarch.github.io/my-presentation/` by `.github/workflows/deploy.yml`, which builds on every push to `master` and uploads `dist/`. The repo's Pages source must stay on **GitHub Actions** — pointing Pages at the branch root instead serves the unbuilt `index.html`, where the stylesheets resolve to `src/styles/*` and the decks sit under `public/decks/`, so the deck iframe 404s.

Because the site lives on a subpath, **no URL in the source may start with `/`**. Asset references in `index.html` are relative; `main.js` builds the deck URLs from `import.meta.env.BASE_URL` (which Vite replaces with the `base` value and which always ends in a slash).

## Architecture

A single-page marketing site for the "Codeforce / AI Austria" GenAI meetup. Vanilla HTML + CSS + one JS file; Vite is only a dev server/bundler, there is no framework, no components, and no data layer.

- **`index.html`** — the entire site. All content (nav items, speaker LinkedIn URLs, meetup links, cards, contact links) is hardcoded here. Adding a meetup means adding a `.dropdown__item` to the Meetups dropdown and, if it's an on-page section, a section with an `id` plus a `scroll-margin-top` entry in `base.css`.
- **`src/styles/*.css`** — six stylesheets loaded as separate `<link>` tags. **Order matters**: `base.css` first (it defines the `:root` design tokens every other file consumes), then `background.css`, `navigation-hero.css`, `sections.css`, `cards.css`, `contact.css`.
- **`src/scripts/main.js`** — one IIFE, loaded with `<script type="module">` so Vite bundles it (a classic script is dropped by the build and 404s in `dist/`). Handles the mobile burger, the nav dropdowns, and the deck embed by toggling an `is-open` class on `.navbar` / `[data-dropdown]` and keeping `aria-expanded` in sync. Elements are found via data attributes (`data-nav-toggle`, `data-dropdown`, `data-deck*`), so keep those when restructuring the markup.
- **`public/decks/<YYYY-MM>/`** — one self-contained archived deck per month, copied verbatim out of `../Codeforce/codeforce-deck/archive/` by `scripts/publish-deck.ps1`. They must live under `public/` so Vite serves them untouched: `content.js` / `engine.js` / `fx/*.js` are classic scripts on globals and bundling would break them.

Visual behavior lives entirely in CSS: the animated background (`.bg` layers: gradient, three blurred blobs, grain) and the four card animations (`.anim--calendar`, `--stage`, `--network`, `--graph`; the last two are inline SVG) are pure keyframe animations. Each card sets its own `--accent` / `--accent-rgb` pair via a `.card--*` modifier, and every card animation reads those instead of hardcoding a colour. Two conventions keep them composable: the idle drift uses the individual `translate` property so the `:hover` `transform: scale()` can stack on top of it, and any animation with a positive `animation-delay` must be `backwards`-filled — otherwise the element sits in its resting state until the delay elapses and then snaps to the 0% keyframe. Resting state is always the fully-visible one, which is what the `prefers-reduced-motion` block at the bottom of `cards.css` falls back to.

## Conventions and gotchas

- CSS uses BEM-ish naming (`block__element--modifier`), tab indentation, and `/* ===== SECTION ===== */` banner comments. Match that style.
- **Responsive rules are not co-located with their components.** The main `@media (max-width: 900px)` block — covering the navbar, mobile dropdown panel, hero, and card grid — lives at the bottom of `cards.css`. `contact.css` has its own 900px block; `background.css` uses 768px plus a `prefers-reduced-motion: reduce` block. Check `cards.css` first when a mobile layout bug involves the nav or hero.
- `background.css` contains deliberate mobile workarounds (`100dvh`, `transform: translateZ(0)`, `backface-visibility`) so the mobile address bar showing/hiding doesn't expose a black strip. The inline comments explain why — don't strip them out while refactoring.
- The "Last Meetup" `.editor-preview` block embeds a deck in an iframe. Adding a month = `npm run publish-deck -- <YYYY-MM>` plus one `.deck-tab` button in the toolbar (`data-deck` = folder name, `data-deck-label` = display name); `main.js` wires the rest.
- The `.deck-nav` overlay arrows step the slides by clicking the deck's own `#nav-prev` / `#nav-next` inside the iframe (`engine.js` wires those to `prev()`/`next()`). That only works same-origin — decks served from another host lose the arrows, and the code fails silently by design.
- The deck is rendered in a **fixed 1600×900 iframe scaled by `--deck-scale`**, not a fluid one — the decks size themselves in `vh`/`vw` and have their own breakpoints, so a narrow iframe would trigger the deck's mobile layout. `main.js` keeps the scale in sync via `ResizeObserver`, mounts the iframe only once it scrolls into view (the decks run canvas/rAF effects non-stop), and injects a scrollbar-hiding stylesheet into the frame — same-origin, and the decks' `.slide { overflow: auto }` otherwise shows scrollbars the fullscreen deck never has.
- Top-level `styles/` and `dist/` are leftovers (empty / build output). `.gitignore` still lists reveal.js paths from an earlier version of this project; the site no longer uses reveal.js.
