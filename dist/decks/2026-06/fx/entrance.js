/* =============================================================================
   GenAI-Codeforce — fx/entrance.js   (vanilla JS, no build, fully offline)

   Two self-contained entrance effects, theme-aware via CSS custom props only:

   (A) "Boot-up takeover" — on first load, a full-screen monospace boot overlay
       ("INITIALIZING GENAI CODEFORCE…") with a scanline + progress bar + flicker,
       ~1.25s total, then wipes away and REMOVES itself, restoring pointer-events.

   (B) "The Fable vanish" — finds the .hot word "fable-less" on the cover and,
       every ~6–9s while the cover is active, plays a quick (~700ms) chromatic
       glitch: RGB split (::before/::after via data-text), flicker, fades the word
       to near-zero ("vanishes"), then snaps back ("reforms"). Never alters text.

   Guards everything; never throws; non-interactive overlays are pointer-events:none
   and release on idle so navigation / clicks / keyboard are never blocked.
   ============================================================================= */
(function () {
  "use strict";

  /* ---- tiny guards ------------------------------------------------------- */
  if (typeof document === "undefined") return;
  if (window.__cfEntranceFx) return;        // never double-install
  window.__cfEntranceFx = true;

  var reduce = false;
  try {
    reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  /* ---- inject our own scoped stylesheet (uses theme CSS vars) ------------ */
  function injectCSS() {
    if (document.getElementById("cf-entrance-fx-css")) return;
    var css = [
      /* ===== (A) Boot-up takeover ===== */
      "#cf-boot{position:fixed;inset:0;z-index:60;display:grid;place-items:center;",
      "  background:var(--bg,#0b0b0b);color:var(--text,#eee);",
      "  font-family:var(--font-mono,monospace);",
      "  opacity:1;transition:opacity .42s var(--ease,ease);will-change:opacity}",
      "#cf-boot.cf-boot--out{opacity:0}",
      /* clip wipe applied on exit */
      "#cf-boot.cf-boot--wipe{clip-path:inset(0 0 100% 0);",
      "  transition:opacity .42s var(--ease,ease),clip-path .5s var(--ease,ease)}",
      "#cf-boot .cf-boot__inner{width:min(560px,82vw);text-align:left;",
      "  padding:1.2rem 1.4rem}",
      "#cf-boot .cf-boot__line{font-size:clamp(.85rem,2.1vw,1.15rem);",
      "  letter-spacing:.06em;color:var(--text,#eee);",
      "  text-shadow:0 0 14px var(--ring,rgba(255,255,255,.25));",
      "  white-space:nowrap;overflow:hidden}",
      "#cf-boot .cf-boot__cur{display:inline-block;width:.62ch;",
      "  background:var(--accent,#888);color:transparent;",
      "  animation:cfBootBlink 1s steps(1) infinite}",
      "@keyframes cfBootBlink{50%{opacity:0}}",
      "#cf-boot .cf-boot__sub{margin-top:.5rem;font-size:.72rem;letter-spacing:.18em;",
      "  text-transform:uppercase;color:var(--muted,#999);opacity:.85}",
      /* progress track + fill */
      "#cf-boot .cf-boot__bar{margin-top:1rem;height:3px;border-radius:99px;",
      "  background:var(--border,rgba(255,255,255,.12));overflow:hidden;position:relative}",
      "#cf-boot .cf-boot__fill{position:absolute;inset:0;width:0;border-radius:99px;",
      "  background:var(--grad,linear-gradient(90deg,var(--primary,#888),var(--accent,#555)));",
      "  box-shadow:0 0 14px var(--ring,rgba(255,255,255,.3))}",
      /* moving scanline across the whole overlay */
      "#cf-boot .cf-boot__scan{position:absolute;left:0;right:0;height:2px;top:0;",
      "  pointer-events:none;opacity:.9;",
      "  background:linear-gradient(90deg,transparent,var(--accent,#888),transparent);",
      "  box-shadow:0 0 18px var(--ring,rgba(255,255,255,.35));",
      "  animation:cfBootScan 1.2s var(--ease,linear) infinite}",
      "@keyframes cfBootScan{0%{top:0}100%{top:100%}}",
      /* subtle flicker of the whole panel */
      "#cf-boot.cf-boot--flick .cf-boot__inner{animation:cfBootFlick .18s steps(2) 2}",
      "@keyframes cfBootFlick{0%,100%{opacity:1}50%{opacity:.45}}",

      /* ===== (B) Fable vanish ===== */
      /* applied transiently to the target .hot span during a glitch burst */
      ".cf-fable{position:relative}",
      ".cf-fable.cf-fable--go::before,.cf-fable.cf-fable--go::after{",
      "  content:attr(data-text);position:absolute;left:0;top:0;",
      "  width:100%;pointer-events:none;",
      /* match the host gradient text so copies read as the same word */
      "  background:var(--grad,linear-gradient(100deg,var(--primary,#888),var(--accent,#555)));",
      "  background-size:220% 100%;-webkit-background-clip:text;background-clip:text;",
      "  color:transparent;-webkit-text-fill-color:transparent;",
      "  mix-blend-mode:screen;opacity:.85}",
      ".cf-fable.cf-fable--go::before{transform:translate(-2px,0);",
      "  filter:drop-shadow(2px 0 0 rgba(255,0,60,.55));",
      "  animation:cfFableSplitA .7s steps(2,end) both}",
      ".cf-fable.cf-fable--go::after{transform:translate(2px,0);",
      "  filter:drop-shadow(-2px 0 0 rgba(0,200,255,.55));",
      "  animation:cfFableSplitB .7s steps(2,end) both}",
      "@keyframes cfFableSplitA{",
      "  0%{transform:translate(0,0)}15%{transform:translate(-3px,1px)}",
      "  30%{transform:translate(2px,-1px)}45%{transform:translate(-4px,0)}",
      "  60%{transform:translate(1px,1px)}100%{transform:translate(0,0)}}",
      "@keyframes cfFableSplitB{",
      "  0%{transform:translate(0,0)}15%{transform:translate(3px,-1px)}",
      "  30%{transform:translate(-2px,1px)}45%{transform:translate(4px,0)}",
      "  60%{transform:translate(-1px,-1px)}100%{transform:translate(0,0)}}",
      /* the word itself: flicker then vanish then reform */
      ".cf-fable.cf-fable--go{animation:cfFableVanish .7s var(--ease,ease) both}",
      "@keyframes cfFableVanish{",
      "  0%{opacity:1}",
      "  10%{opacity:.35}18%{opacity:1}26%{opacity:.2}",      /* flicker */
      "  40%{opacity:1}",
      "  62%{opacity:.04;filter:blur(2px)}",                  /* vanish */
      "  70%{opacity:.04;filter:blur(3px)}",
      "  82%{opacity:.4;filter:blur(.5px)}",
      "  100%{opacity:1;filter:none}}",                       /* reform */

      "@media (prefers-reduced-motion:reduce){",
      "  #cf-boot .cf-boot__scan,#cf-boot .cf-boot__fill{animation-duration:.001s}",
      "  .cf-fable.cf-fable--go,.cf-fable.cf-fable--go::before,.cf-fable.cf-fable--go::after{animation:none}}"
    ].join("\n");

    var style = document.createElement("style");
    style.id = "cf-entrance-fx-css";
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);
  }

  /* =======================================================================
     (A) BOOT-UP TAKEOVER
     ======================================================================= */
  function runBoot() {
    if (document.getElementById("cf-boot")) return;     // guard re-entry

    var overlay = document.createElement("div");
    overlay.id = "cf-boot";
    overlay.setAttribute("aria-hidden", "true");        // never trap focus
    overlay.style.pointerEvents = "none";               // never block clicks

    var FULL = "INITIALIZING GENAI CODEFORCE";
    overlay.innerHTML =
      '<div class="cf-boot__inner">' +
      '  <div class="cf-boot__line">' +
      '<span class="cf-boot__txt"></span><span class="cf-boot__cur">_</span>' +
      '  </div>' +
      '  <div class="cf-boot__sub">offline deck · booting runtime</div>' +
      '  <div class="cf-boot__bar"><span class="cf-boot__fill"></span></div>' +
      '  <div class="cf-boot__scan"></div>' +
      '</div>';

    var parent = document.body || document.documentElement;
    if (!parent) return;
    parent.appendChild(overlay);

    var txt = overlay.querySelector(".cf-boot__txt");
    var fill = overlay.querySelector(".cf-boot__fill");
    var inner = overlay.querySelector(".cf-boot__inner");

    var DURATION = reduce ? 350 : 1250;     // total visible time
    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    var rafId = 0;
    var flickedAt = {};                     // one-shot flicker markers
    var done = false;

    function now() {
      return (window.performance && performance.now) ? performance.now() : Date.now();
    }

    function frame() {
      var k = Math.min(1, (now() - t0) / DURATION);

      // type the headline out across the first ~62% of the run
      if (txt) {
        var typedK = Math.min(1, k / 0.62);
        var n = Math.round(typedK * FULL.length);
        var s = FULL.slice(0, n);
        if (typedK >= 1) s += "…";     // ellipsis once fully typed
        if (txt.textContent !== s) txt.textContent = s;
      }

      // progress fill (ease-out)
      if (fill) fill.style.width = (100 * (k * (2 - k))).toFixed(1) + "%";

      // brief flickers at a couple of points
      if (!reduce && inner) {
        if (k > 0.30 && !flickedAt.a) { flickedAt.a = 1; pulseFlick(); }
        if (k > 0.74 && !flickedAt.b) { flickedAt.b = 1; pulseFlick(); }
      }

      if (k < 1) { rafId = requestAnimationFrame(frame); }
      else { finish(); }
    }

    function pulseFlick() {
      overlay.classList.add("cf-boot--flick");
      setTimeout(function () {
        if (overlay) overlay.classList.remove("cf-boot--flick");
      }, 380);
    }

    function finish() {
      if (done) return;
      done = true;
      // wipe + fade, then remove from the DOM entirely
      overlay.classList.add("cf-boot--wipe", "cf-boot--out");
      var killed = false;
      function kill() {
        if (killed) return;
        killed = true;
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }
      overlay.addEventListener("transitionend", kill, { once: true });
      // safety net in case transitionend never fires
      setTimeout(kill, 800);
    }

    rafId = requestAnimationFrame(frame);

    // absolute hard stop: never let the overlay outlive a reasonable window
    setTimeout(function () {
      if (!done) { try { cancelAnimationFrame(rafId); } catch (e) {} finish(); }
    }, DURATION + 1200);
  }

  /* =======================================================================
     (B) THE FABLE VANISH
     ======================================================================= */
  function normalize(s) {
    // lowercase, strip surrounding punctuation/whitespace for matching
    return String(s == null ? "" : s)
      .toLowerCase()
      .replace(/^[\s\W_]+|[\s\W_]+$/g, "");
  }

  function findFableSpan(cover) {
    if (!cover) return null;
    var hots = cover.querySelectorAll(".hot");
    for (var i = 0; i < hots.length; i++) {
      if (normalize(hots[i].textContent) === "fable-less") return hots[i];
    }
    return null;
  }

  function initFable(cover) {
    var span = findFableSpan(cover);
    if (!span) return;                       // word not present → no-op

    // remember the exact text for the chromatic copies; do NOT alter content
    span.setAttribute("data-text", span.textContent);
    span.classList.add("cf-fable");

    var timer = 0;
    var busy = false;

    function coverActive() {
      return !!(cover && cover.classList.contains("active"));
    }

    function schedule() {
      clearTimeout(timer);
      var delay = 6000 + Math.random() * 3000;   // ~6–9s
      timer = setTimeout(tick, delay);
    }

    function tick() {
      // only glitch when the cover is the active slide and tab is visible
      if (reduce || !coverActive() || document.hidden || busy) { schedule(); return; }
      glitch();
      schedule();
    }

    function glitch() {
      busy = true;
      // keep data-text in sync in case the count-up/theme changed nothing here,
      // but the word could in theory be re-rendered; stay defensive.
      var cur = span.textContent;
      if (cur && span.getAttribute("data-text") !== cur) {
        span.setAttribute("data-text", cur);
      }
      span.classList.remove("cf-fable--go");
      // force reflow so re-adding restarts the animation
      void span.offsetWidth;
      span.classList.add("cf-fable--go");

      var cleared = false;
      function clear() {
        if (cleared) return;
        cleared = true;
        span.classList.remove("cf-fable--go");
        busy = false;
      }
      span.addEventListener("animationend", clear, { once: true });
      setTimeout(clear, 900);                // safety net (~700ms anim + slack)
    }

    // pause/resume cleanly on visibility changes
    function onVis() {
      if (document.hidden) { clearTimeout(timer); }
      else { schedule(); }
    }
    document.addEventListener("visibilitychange", onVis);

    schedule();
  }

  /* =======================================================================
     BOOTSTRAP — wait for the engine-built cover before hooking
     ======================================================================= */
  function start() {
    injectCSS();
    runBoot();                               // boot overlay is independent of the deck

    var tries = 0;
    var MAX_TRIES = 1200;                     // ~20s of frames, then give up quietly
    (function waitForCover() {
      var cover = document.querySelector('.slide[data-id="cover"]');
      if (cover) { try { initFable(cover); } catch (e) {} return; }
      if (++tries > MAX_TRIES) return;        // never spin forever
      requestAnimationFrame(waitForCover);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
