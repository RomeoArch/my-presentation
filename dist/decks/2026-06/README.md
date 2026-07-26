# GenAI-Codeforce — web deck

A self-contained, offline HTML presentation that replaces the monthly PowerPoint.
No build step, no internet needed at the venue. **Double-click `index.html`** and present.

---

## Present it

1. Open `index.html` in Chrome or Edge.
2. Press **`F`** for fullscreen.
3. Drive it with the arrow keys or your presentation clicker.

### Controls

| Key | Action |
|-----|--------|
| `→` / `Space` / clicker fwd | Next (steps through reveals on a slide first, then advances) |
| `←` / clicker back | Back |
| `Home` / `End` | First / last slide |
| **`T`** | Cycle theme: AI Austria → AI Austria Light → Neon Forge → Synthwave Grid → Plasma Sunset → Voltline |
| **`F`** | Fullscreen |
| **`K`** or `/` | Command palette — jump to any slide by name |
| `Esc` | Close palette / close meme lightbox |
| Click a meme | Enlarge it |

The deck is styled to match **AI Austria** (brand red `#BD2026`); the default theme is the
dark "AI Austria" palette, with a clean light variant (`aialight`) that mirrors aiaustria.com.
The chosen theme is remembered between sessions. You can also force one with a URL,
e.g. `index.html?theme=aialight`. A slide number in the URL (`index.html#9`) deep-links
to that slide, so a refresh keeps your place.

---

## Archive last month first — `archive-session.ps1`

Before you start editing for a new month, snapshot the current edition so you can
always refer back to it (the memes reuse filenames like `meme1.png`, so editing
would otherwise overwrite them). From this folder:

```powershell
./archive-session.ps1            # archive the current edition (reads meta.edition)
./archive-session.ps1 -Force     # overwrite an existing archive
```

This copies the whole deck into `archive/<YYYY-MM>/` (e.g. `archive/2026-06/`).
Each archive is **self-contained** — double-click `archive/2026-06/index.html` and it
presents exactly as it was. An `ARCHIVED.txt` records the edition, date and motto.

---

## Update it each month — only touch `content.js`

Open **`content.js`**, edit the values, save, refresh the browser. Everything is in there:

- **`meta`** — edition label + the big cover motto + which theme loads first.
- **`next`** — date/time of the next GenAI-Codeforce. Drives the live **countdown** on the closing slide. Set `dateISO` precisely (it controls the timer).
- **`presenters`** — names + **LinkedIn URLs**. QR codes are generated automatically — just paste real profile URLs (replace the `REPLACE-...` placeholders).
- **`coverMeme`** — the meme on the cover. Set `image` to a file in `assets/memes/` to use a real picture; remove `image` to fall back to the theme-matched code-recreated version (`rows` / `skull` / `footer`).
- **`memes`** — drop images into `assets/memes/` and list them. Use `{ type:"link", url, label }` for a meme-site shoutout (renders a QR).
- **`events`**, **`discordChannels`**, **`agenda`** — community intro, Discord channel list, running order.
- **`slido`** — see below.
- **`news.lastTime`** — the retrospective slide: last time's news as the numbered 01/02/03 cards (`title`, `tag`, `blurb`, optional `url` → QR).
- **`tool`** — Tool of the Month.
- **`demo`** — the live-demo slot (someone else usually drives this).

### Slido

You keep running Slido live. The deck shows it **two ways at once**:

- A live **embed** (iframe) of the results, and
- A **QR + join code** fallback that always works even if the venue wifi dies.

There's just **one** live Slido slide. The embed uses `wall.sli.do`, which always
shows whichever poll is currently **active** in Slido — so you don't need a slide per
question. To move to the next question, activate the next poll from your Slido controls
(phone / **Present mode** with ←/→ keys); the embedded wall switches automatically.

To enable the live embed: in Slido go to **Present / Share → Embed**, copy the `src`
URL, and paste it into `content.js`:

- `slido.embedBase` — the event wall embed shown on the live slide.
- `slido.joinUrl` (what the QR encodes) and `slido.joinCode` (the big code shown).
- `slido.questions[]` is now just a **prep checklist** of the polls to set up in Slido —
  it's no longer rendered as slides.

Leave `embedBase` as `""` to show the QR-only layout (the live slide then displays a
placeholder where the embed would go).

---

## Files

```
codeforce-deck/
├─ index.html      ← open this to present
├─ content.js      ← EDIT THIS each month
├─ styles.css      ← visuals + the 6 themes (rarely needs changing)
├─ engine.js       ← navigation / QR / countdown / Slido logic
├─ vendor/
│  └─ qrcode.js    ← offline QR generator (MIT, Kazuhiko Arase)
└─ assets/
   ├─ brand/logo.png
   ├─ fonts/       ← self-hosted Space Grotesk / Inter / JetBrains Mono
   ├─ memes/       ← drop this month's memes here
   └─ presenters/  ← (optional) presenter photos
```

## Notes

- Works fully offline. The only thing that needs internet *while presenting* is the
  optional Slido live embed — and that's exactly why the QR fallback is always shown.
- Slide order is defined in `engine.js` (`render()`), if you ever want to add/remove a section.
- Best viewed in a Chromium browser (Chrome/Edge) for `backdrop-filter` glass effects.
