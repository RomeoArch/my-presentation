/* =============================================================================
   GenAI-Codeforce — cover FX (hud.js)
   Self-contained, offline, vanilla JS. No deps, no network, no build step.

   One cover-scoped effect:
     (A) "Breaking news" ticker — a slim marquee pinned near the bottom of the
         cover slide, scrolling real June-2026 AI headlines. Pauses when the
         cover is not the active slide.

   Everything is injected by this IIFE: its own <style>, its own DOM. The cover
   elements are only visible while .slide[data-id="cover"] is .active. All of it
   is non-interactive (pointer-events:none) so it never steals deck clicks/keys.
   ============================================================================= */
(function () {
  "use strict";

  // Guard: run once only.
  if (window.__cfHudFx) return;
  window.__cfHudFx = true;

  var doc = document;

  /* ---- Headlines (real, <3 weeks old — refreshed 2026-06-15) ------------
     Keep these fresh each month: every line should be a story from the last
     ~3 weeks. The first two are the cover's signature gag. */
  var HEADLINES = [
    "Anthropic launches Claude Fable 5 — its most powerful model",
    "…then pulls it 72 hours later under a US export-control directive",
    "Anthropic files confidentially for IPO at a $965B valuation",
    "OpenAI follows 8 days later — also files for IPO, last valued ~$852B",
    "Anthropic's \"When AI builds itself\" urges a global pause on frontier AI",
    "Project Glasswing: Anthropic's agent flags 10,000+ critical software bugs in a month",
    "Mistral acquires Austria's Emmi AI (JKU Linz spin-off)",
    "Meta earmarks $115–135B for AI in 2026; Microsoft nears $190B capex"
  ];
  var DIVIDER = "◆";

  /* ---- Styles (scoped under .cf-fx-* to avoid clobbering deck CSS) ------- */
  function injectStyles() {
    if (doc.getElementById("cf-hud-css")) return;
    var css = [
      /* shared: hidden until the cover is active; never intercept input */
      ".cf-fx{pointer-events:none}",
      ".cf-fx{opacity:0;transition:opacity .45s var(--ease,ease)}",
      ".cf-fx.cf-fx--on{opacity:1}",

      /* ---------- (A) Breaking news ticker -------------------------------- */
      /* Pinned inside the cover slide, full width, slim, low but above .hint
         and the chapter rail. The cover slide is position:absolute inset:0. */
      ".cf-ticker{position:absolute;left:0;right:0;bottom:0;z-index:5;",
      "  display:flex;align-items:stretch;height:2.5rem;overflow:hidden;",
      "  font-family:var(--font-mono,monospace);",
      "  background:color-mix(in srgb, var(--bg-2,#111) 78%, transparent);",
      "  border-top:1px solid var(--border,rgba(255,255,255,.1));",
      "  border-bottom:1px solid var(--border,rgba(255,255,255,.1));",
      "  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}",

      /* fallback for engines without color-mix */
      "@supports not (background:color-mix(in srgb,#000 50%,#fff)){",
      "  .cf-ticker{background:var(--bg-2,#111)}}",

      /* the red/accent "BREAKING" label pinned at the left */
      ".cf-ticker__label{position:relative;z-index:2;flex:0 0 auto;",
      "  display:flex;align-items:center;gap:.5rem;padding:0 1rem;",
      "  font-size:.72rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;",
      "  color:#fff;background:var(--grad,var(--accent,#bd2026));",
      "  box-shadow:0 0 22px var(--ring,rgba(189,32,38,.42))}",
      ".cf-ticker__label::after{content:'';position:absolute;top:0;bottom:0;right:-10px;",
      "  width:0;height:0;border-left:10px solid var(--accent,#bd2026);",
      "  border-top:1.25rem solid transparent;border-bottom:1.25rem solid transparent}",
      ".cf-ticker__dot{width:8px;height:8px;border-radius:50%;background:#fff;",
      "  box-shadow:0 0 0 0 rgba(255,255,255,.8);animation:cfBlink 1.4s var(--ease,ease) infinite}",
      "@keyframes cfBlink{0%,100%{opacity:1}50%{opacity:.25}}",

      /* the scrolling viewport + track (two copies → seamless loop) */
      ".cf-ticker__view{position:relative;flex:1 1 auto;overflow:hidden;",
      "  -webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);",
      "          mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}",
      ".cf-ticker__track{position:absolute;top:0;left:0;height:100%;display:flex;align-items:center;",
      "  white-space:nowrap;will-change:transform;",
      "  animation:cfMarquee var(--cf-dur,40s) linear infinite}",
      "@keyframes cfMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}",
      /* pause the scroll when the cover is not active */
      ".cf-fx:not(.cf-fx--on) .cf-ticker__track{animation-play-state:paused}",

      ".cf-ticker__item{display:inline-flex;align-items:center;font-size:.82rem;",
      "  color:var(--text,#eee);padding:0 .15rem}",
      ".cf-ticker__sep{color:var(--accent,#bd2026);font-size:.78rem;padding:0 1.05rem;opacity:.9}",

      /* tuck the ticker out of the way on small screens / narrow covers */
      "@media (max-width:980px){",
      "  .cf-ticker{bottom:0;height:2.2rem}}",

      "@media (prefers-reduced-motion:reduce){",
      "  .cf-ticker__track{animation-duration:160s}",
      "  .cf-ticker__dot{animation:none}}"
    ].join("\n");

    var style = doc.createElement("style");
    style.id = "cf-hud-css";
    style.textContent = css;
    (doc.head || doc.documentElement).appendChild(style);
  }

  /* ---- Build the ticker DOM --------------------------------------------- */
  function buildTicker() {
    var wrap = doc.createElement("div");
    wrap.className = "cf-fx cf-ticker";
    wrap.setAttribute("aria-hidden", "true");

    var label = doc.createElement("div");
    label.className = "cf-ticker__label";
    var dot = doc.createElement("span");
    dot.className = "cf-ticker__dot";
    label.appendChild(dot);
    label.appendChild(doc.createTextNode("Breaking"));

    var view = doc.createElement("div");
    view.className = "cf-ticker__view";
    var track = doc.createElement("div");
    track.className = "cf-ticker__track";

    // One "copy" = all headlines, each followed by a divider. Duplicate the
    // copy so a -50% translate lands exactly on a seam → seamless loop.
    function buildCopy() {
      var frag = doc.createDocumentFragment();
      for (var i = 0; i < HEADLINES.length; i++) {
        var item = doc.createElement("span");
        item.className = "cf-ticker__item";
        item.textContent = HEADLINES[i];
        frag.appendChild(item);
        var sep = doc.createElement("span");
        sep.className = "cf-ticker__sep";
        sep.textContent = DIVIDER;
        frag.appendChild(sep);
      }
      return frag;
    }
    track.appendChild(buildCopy());
    track.appendChild(buildCopy());

    view.appendChild(track);
    wrap.appendChild(label);
    wrap.appendChild(view);

    // Scale the scroll duration to content length so speed stays comfortable
    // regardless of headline count (≈ 9s per headline). Measured after insert.
    wrap.__sizeTicker = function () {
      // half the track width = one copy; ~140px/sec target reading speed.
      var copyW = track.scrollWidth / 2;
      if (copyW > 0) {
        var dur = Math.max(20, Math.round(copyW / 70));
        track.style.setProperty("--cf-dur", dur + "s");
      }
    };

    return wrap;
  }

  /* ---- Wire everything in once the cover exists ------------------------- */
  function hook(cover) {
    injectStyles();

    var ticker = buildTicker();
    // Append into the cover slide itself (absolutely positioned within it).
    cover.appendChild(ticker);

    // Size the marquee once layout has settled.
    requestAnimationFrame(function () {
      if (ticker.__sizeTicker) ticker.__sizeTicker();
    });

    /* --- visibility: show only while the cover is .active --- */
    function syncActive() {
      var on = cover.classList.contains("active");
      ticker.classList.toggle("cf-fx--on", on);
      return on;
    }
    syncActive();

    // Observe class changes on the cover (cheap, fires only on attr change).
    var mo = null;
    try {
      mo = new MutationObserver(syncActive);
      mo.observe(cover, { attributes: true, attributeFilter: ["class"] });
    } catch (e) { /* observer unavailable — interval below is the safety net */ }

    // Light safety-net interval: re-sync visibility in case the MutationObserver
    // is unavailable. Cheap and idempotent.
    var syncTimer = mo ? null : setInterval(syncActive, 400);

    // Re-size the ticker on resize (font/layout reflow changes track width).
    var rzT;
    window.addEventListener("resize", function () {
      clearTimeout(rzT);
      rzT = setTimeout(function () {
        if (ticker.__sizeTicker) ticker.__sizeTicker();
      }, 200);
    });

    // Expose a tiny handle for debugging / teardown.
    window.__cfHudFxHandle = {
      ticker: ticker,
      destroy: function () {
        if (mo) mo.disconnect();
        if (syncTimer) clearInterval(syncTimer);
        ticker.remove();
        window.__cfHudFx = false;
      }
    };
  }

  /* ---- rAF-poll until the cover slide exists ---------------------------- */
  function waitForCover() {
    var tries = 0;
    var MAX = 1200; // ~20s at 60fps — generous, then give up quietly.
    (function poll() {
      var cover = doc.querySelector('.slide[data-id="cover"]');
      if (cover) { hook(cover); return; }
      if (++tries > MAX) return;
      requestAnimationFrame(poll);
    })();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", waitForCover);
  } else {
    waitForCover();
  }
})();
