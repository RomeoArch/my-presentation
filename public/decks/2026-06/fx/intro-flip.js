/* =============================================================================
   GenAI-Codeforce — intro-flip.js  (optional FX layer, vanilla JS, no build)

   Self-contained add-on. Injects its own CSS, waits for the intro slide and
   its first panel's fact list to exist, then turns each fact <li> into a
   click-to-flip 3D card. FRONT = the original fact; BACK = a witty, on-brand
   one-liner that riffs on that fact.

   Click a card to spin it 180° on rotateY; click again to spin back. Faces are
   the same size so layout never jumps. Reduced motion gets an instant
   crossfade instead of a spin.

   Touches nothing the engine owns: never preventDefault()s, no nav-key
   handlers. Cards take pointer events (they must, to flip) but never block
   deck navigation. Idempotent: an already-wrapped <li> is skipped.
   ============================================================================= */
(function () {
  "use strict";

  // Don't double-install (e.g. if the script is included twice).
  if (window.__cfIntroFlip) return;
  window.__cfIntroFlip = true;

  var prefersReduced = false;
  try {
    prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  // Witty backs keyed by the real fact text. Adapted to whatever the DOM says
  // via a normalized lookup; unmatched facts fall back to a generic quip.
  var BACKS = {
    "virtual event — every single month":
      "Pajamas: encouraged. Webcam: optional. FOMO: cured.",
    "latest genai news & technological exchange":
      "We read the hype so you can skip the threadboys.",
    "active participation, tool presentations & live demos":
      "Bring a demo. Bugs are content.",
    "everyone welcome — from curious user to hardcore dev":
      "No gatekeeping. Just vibes and version control."
  };

  // Per-fact emoji marker (replaces the deck's square bullet dot). Text-keyed
  // first, then a positional fallback, then a generic spark.
  var EMOJI = {
    "virtual event — every single month": "🗓️",
    "latest genai news & technological exchange": "📰",
    "active participation, tool presentations & live demos": "🎤",
    "everyone welcome — from curious user to hardcore dev": "🤝"
  };
  var EMOJI_SEQ = ["🗓️", "📰", "🎤", "🤝", "✨", "🚀", "🔥", "💡"];
  function emojiFor(front, idx) {
    return EMOJI[norm(front)] || EMOJI_SEQ[idx] || "✨";
  }

  function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function backFor(front) {
    var hit = BACKS[norm(front)];
    if (hit) return hit;
    // Generic punchy fallback derived from the fact's own words.
    var f = (front || "").replace(/\s+/g, " ").trim();
    if (!f) return "Plot twist: it's better in person. Sort of.";
    return "“" + f + "” — but make it a vibe. See you there.";
  }

  /* ---- CSS (own <style>, scoped to .cffl-* classes) -------------------- */
  function injectCSS() {
    if (document.getElementById("cf-intro-flip-css")) return;
    var css =
      // The <li> becomes the 3D stage. Replace the deck's square bullet dot
      // (.list li::before in styles.css) with a per-fact emoji marker — the
      // higher-specificity selector below kills the dot without editing CSS.
      ".cffl-li{perspective:900px;cursor:pointer;outline:none}" +
      ".list li.cffl-li::before{content:none;display:none}" +
      ".cffl-emoji{flex:0 0 auto;font-size:1.2em;line-height:1.25;margin-top:.02em;" +
        "filter:drop-shadow(0 0 8px var(--ring));user-select:none;" +
        "transition:transform .3s var(--ease,ease)}" +
      ".cffl-li:hover .cffl-emoji{transform:scale(1.25) rotate(-6deg)}" +
      // Card: a fixed-height stage so flipping never reflows the list.
      ".cffl-card{position:relative;flex:1 1 auto;transform-style:preserve-3d;" +
        "transition:transform .55s var(--ease,ease);min-height:1.4em}" +
      ".cffl-li.cffl-flipped .cffl-card{transform:rotateY(180deg)}" +
      // Faces share the grid cell so both occupy identical space.
      ".cffl-face{display:block;grid-area:1/1;backface-visibility:hidden;" +
        "-webkit-backface-visibility:hidden;border-radius:10px;" +
        "transition:opacity .25s var(--ease,ease)}" +
      ".cffl-faces{display:grid}" +
      ".cffl-back{transform:rotateY(180deg);color:var(--text);" +
        "font-style:italic;background:var(--chip-bg);" +
        "border:1px solid var(--ring);padding:.35em .6em;margin:-.05em -.1em;" +
        "box-shadow:0 6px 22px rgba(0,0,0,.28)}" +
      // Hover cue on the front face: a faint accent underline glow.
      ".cffl-li:hover .cffl-front{color:var(--text)}" +
      ".cffl-li:hover .cffl-card{filter:drop-shadow(0 0 10px var(--ring))}" +
      // "tap to flip ⤿" affordance — appears on hover/focus, fades on flip.
      ".cffl-hint{display:inline-block;margin-left:.5em;" +
        "font:600 .62rem/1 var(--font-mono,monospace);letter-spacing:.16em;" +
        "text-transform:uppercase;color:var(--muted);opacity:0;vertical-align:.1em;" +
        "transition:opacity .25s var(--ease,ease);pointer-events:none}" +
      ".cffl-li:hover .cffl-hint,.cffl-li:focus-visible .cffl-hint{opacity:.6}" +
      ".cffl-li.cffl-flipped .cffl-hint{opacity:0}" +
      ".cffl-li:focus-visible{box-shadow:0 0 0 2px var(--accent);border-radius:8px}" +
      // Reduced motion: no spin — instant crossfade between the two faces.
      "@media (prefers-reduced-motion: reduce){" +
        ".cffl-card{transition:none}.cffl-li::before{transition:none}" +
        ".cffl-face{transition:opacity .18s linear;backface-visibility:visible;" +
          "-webkit-backface-visibility:visible}" +
        ".cffl-li.cffl-flipped .cffl-card{transform:none}" +
        ".cffl-back{transform:none}" +
        ".cffl-front{opacity:1}.cffl-back{opacity:0}" +
        ".cffl-li.cffl-flipped .cffl-front{opacity:0}" +
        ".cffl-li.cffl-flipped .cffl-back{opacity:1}}";
    var style = document.createElement("style");
    style.id = "cf-intro-flip-css";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---- Wrap one <li> into a flip card --------------------------------- */
  function wrapItem(li, idx) {
    if (!li || li.getAttribute("data-cffl") === "1") return; // idempotent
    var front = li.textContent || "";

    li.setAttribute("data-cffl", "1");
    li.classList.add("cffl-li");

    var faces = document.createElement("span");
    faces.className = "cffl-faces cffl-card";

    var frontEl = document.createElement("span");
    frontEl.className = "cffl-face cffl-front";
    frontEl.textContent = front.replace(/\s+/g, " ").trim();

    var hint = document.createElement("span");
    hint.className = "cffl-hint";
    hint.textContent = "tap to flip ⤿";
    frontEl.appendChild(hint);

    var backEl = document.createElement("span");
    backEl.className = "cffl-face cffl-back";
    backEl.textContent = backFor(front);

    faces.appendChild(frontEl);
    faces.appendChild(backEl);

    // Replace the li's text with: an emoji marker + the two-face card.
    while (li.firstChild) li.removeChild(li.firstChild);
    var emoji = document.createElement("span");
    emoji.className = "cffl-emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = emojiFor(front, idx);
    li.appendChild(emoji);
    li.appendChild(faces);

    // Make it keyboard-reachable without grabbing nav keys.
    li.setAttribute("tabindex", "0");
    li.setAttribute("role", "button");
    li.setAttribute("aria-pressed", "false");

    function toggle() {
      var on = li.classList.toggle("cffl-flipped");
      li.setAttribute("aria-pressed", on ? "true" : "false");
    }

    li.addEventListener("click", function () { toggle(); });
    // Enter/Space flip; never preventDefault on nav keys (arrows/PgUp/etc).
    li.addEventListener("keydown", function (e) {
      var k = e.key;
      if (k === "Enter" || k === " " || k === "Spacebar") {
        e.preventDefault(); // only swallow activation keys, never nav keys
        toggle();
      }
    });
  }

  function init(slide) {
    var panel = slide.querySelector(".panel");
    if (!panel) return;
    var items = panel.querySelectorAll("ul.list li");
    if (!items || !items.length) return;
    for (var i = 0; i < items.length; i++) {
      try { wrapItem(items[i], i); } catch (e) {}
    }
  }

  /* =====================================================================
     BOOT — rAF-poll until the intro slide AND its fact list items exist.
     ===================================================================== */
  function boot() {
    injectCSS();
    var tries = 0;
    (function wait() {
      var slide = document.querySelector('.slide[data-id="intro"]');
      if (slide) {
        var panel = slide.querySelector(".panel");
        var items = panel ? panel.querySelectorAll("ul.list li") : null;
        if (items && items.length) {
          try { init(slide); } catch (e) {}
          return;
        }
      }
      if (tries++ > 600) return;        // ~10s @ 60fps then give up quietly
      requestAnimationFrame(wait);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
